import { of, scan, shareReplay, startWith } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import type { ConceptStudy } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { placeholdersIn } from '../study-text';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model, opening } from './scan';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

const add = (balance: number, amount: number) => balance + amount;

// The feed's amounts, which the cases below fold in other ways.
const { marbles: feedMarbles, values } = example.inputs['amount$'];
const amountValues = values as Readonly<Record<string, number>>;
const amounts = Object.values(amountValues);

/** Every piece of the record a page fills with a moment's values; the code is shown as written. */
const proseOf = (record: ConceptStudy) => [
  record.intuition.text,
  record.intuition.situation,
  record.example.description,
  ...record.mechanism.steps.flatMap(({ title, text }) => [title, text]),
  record.visual?.textEquivalent ?? '',
  ...record.implementations.flatMap(({ relevance, explanation }) => [relevance, explanation]),
  ...record.references.map(({ supports }) => supports),
  ...record.limits,
  ...record.nearby.map(({ why }) => why),
];

it('runs the statement and the phone against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the scan row and reads its seed and amounts from this module', async () => {
  const record = await loadStudy('rxc:161');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/scan.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.example.parameters['opening']).toBe(opening);
  expect(record.example.parameters['amounts']).toBe(
    `${amounts.slice(0, -1).join(', ')} and ${amounts[amounts.length - 1]}`,
  );
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(example.operator.length).toBeLessThanOrEqual(40);
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'amount$',
    'statement$',
    'phone$',
  ]);
});

it('fills every placeholder the record’s prose writes at every moment', async () => {
  const record = await loadStudy('rxc:161');
  const names = [...new Set(proseOf(record).flatMap(placeholdersIn))].sort();
  expect(names).toEqual(['amounts', 'delivered', 'frame', 'now', 'opening']);
  for (const { values: shown } of marbleModel(example, record.example.parameters).marbles.frames)
    for (const name of names) expect(shown[name], name).toBeDefined();
});

it('carries the statement’s balance from each amount into the next', () => {
  const statement = Object.values(example.outputs['statement$'].values ?? {});
  // Each balance is the opening plus every amount so far, worked out here without scan.
  expect(statement).toEqual(
    amounts.map((_, index) => amounts.slice(0, index + 1).reduce(add, opening)),
  );
  const { marbles } = marbleModel(example);
  const line = marbles.lines.find(({ label }) => label === 'statement$');
  expect(line?.events.map(({ kind, frame }) => `${kind} ${frame}`)).toEqual([
    'next 1',
    'next 4',
    'next 8',
    'complete 11',
  ]);
});

it('starts the late phone from the opening, so it folds only the amount it hears', () => {
  const { marbles } = marbleModel(example);
  const phone = marbles.lines.find(({ label }) => label === 'phone$');
  expect(phone).toMatchObject({ subscribedAt: 5, cancelled: false });
  // The phone hears only the last amount, folded into the opening rather than the balance.
  expect(Object.values(example.outputs['phone$'].values ?? {})).toEqual([
    opening + amounts[amounts.length - 1],
  ]);
  // Every frame is a step; the phone's frame names its subscription, a quiet frame says so.
  expect(marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 12 }, (_, frame) => frame),
  );
  expect(marbles.frames[5].values['now']).toBe('phone$ subscribes');
  expect(marbles.frames[2].values['now']).toBe('nothing new happens');
  expect(marbles.frames[marbles.frames.length - 1].values['delivered']).toBe(
    'statement$: x (15), y (12), z (16); phone$: q (14)',
  );
});

it('tells the frame where the two balances differ and names each moment', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[8];
  expect(telling.frame).toBe(8);
  expect(telling.values['now']).toBe(
    'amount$ emits c (4); statement$ emits z (16); phone$ emits q (14)',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['First deposit', 1],
    ['Withdrawal', 4],
    ['Phone subscribes', 5],
    ['Balances differ', 8],
    ['Done', 11],
  ]);
});

it('gives a late subscriber the current balance when the fold is shared with shareReplay', () => {
  scheduler().run(({ hot, expectObservable }) => {
    const shared$ = hot(feedMarbles, amountValues).pipe(scan(add, opening), shareReplay(1));
    expectObservable(shared$).toBe('-x--y---z--|', { x: 15, y: 12, z: 16 });
    expectObservable(shared$, '-----^').toBe('-----y--z--|', { y: 12, z: 16 });
  });
});

it('takes the first amount for the balance without a seed and first calls the reducer with index 1', () => {
  scheduler().run(({ hot, expectObservable }) => {
    expectObservable(hot(feedMarbles, amountValues).pipe(scan(add))).toBe('-x--y---z--|', {
      x: 5,
      y: 2,
      z: 6,
    });
  });
  const indices: number[] = [];
  of(...amounts)
    .pipe(
      scan((balance: number, amount: number, index) => {
        indices.push(index);
        return balance + amount;
      }),
    )
    .subscribe();
  expect(indices).toEqual([1, 2]);
});

it('counts a seed of undefined passed explicitly as a seed', () => {
  const seen: (number | undefined)[] = [];
  of(...amounts)
    .pipe(
      scan((balance: number | undefined, amount: number) => {
        seen.push(balance);
        return (balance ?? 0) + amount;
      }, undefined),
    )
    .subscribe();
  // The reducer ran for the first amount, which it does only when there is a seed.
  expect(seen).toEqual([undefined, 5, 2]);
});

it('never sends the seed on its own, unless startWith adds it', () => {
  scheduler().run(({ cold, hot, expectObservable }) => {
    expectObservable(cold<number>('---|').pipe(scan(add, opening))).toBe('---|');
    expectObservable(
      hot(feedMarbles, amountValues).pipe(scan(add, opening), startWith(opening)),
    ).toBe('ox--y---z--|', { o: 10, x: 15, y: 12, z: 16 });
  });
});

it('shares one seed between subscriptions, so a reducer that mutates it leaks into the next', () => {
  const logOf = (reducer: (log: number[], amount: number) => number[]) =>
    of(...amounts).pipe(scan(reducer, [] as number[]));
  // The log a fresh subscription ends with.
  const lastOf = (log$: ReturnType<typeof logOf>) => {
    let seen: readonly number[] = [];
    log$.subscribe((log) => (seen = [...log]));
    return seen;
  };
  const mutating = logOf((log, amount) => {
    log.push(amount);
    return log;
  });
  expect(lastOf(mutating)).toEqual([5, -3, 4]);
  expect(lastOf(mutating)).toEqual([5, -3, 4, 5, -3, 4]);
  const pure = logOf((log, amount) => [...log, amount]);
  expect(lastOf(pure)).toEqual([5, -3, 4]);
  expect(lastOf(pure)).toEqual([5, -3, 4]);
});
