import { combineLatest, map, of, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import type { ConceptStudy } from '@dotln-angular/models';

import { loadStudy } from '../../../../testing/src';
import { placeholdersIn } from '../study-text';
import { example, model } from './combine-latest';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

const { worker$: worker, budget$: budget } = example.inputs;

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

/** A stream's values as the record's parameters list them: "a, b and c". */
const listed = (values: Readonly<Record<string, unknown>> = {}) => {
  const all = Object.values(values).map(String);
  return `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
};

it('runs the dashboard example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the combineLatest row and reads its inputs from this module', async () => {
  const record = await loadStudy('rxc:134');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/combine-latest.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.example.parameters['workerStates']).toBe(listed(worker.values));
  expect(record.example.parameters['budgets']).toBe(listed(budget.values));
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(example.operator.length).toBeLessThanOrEqual(40);
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'worker$',
    'budget$',
    'row$',
  ]);
});

it('fills every placeholder the record’s prose writes at every moment', async () => {
  const record = await loadStudy('rxc:134');
  const names = [...new Set(proseOf(record).flatMap(placeholdersIn))].sort();
  expect(names).toEqual(['budgets', 'delivered', 'frame', 'now', 'workerStates']);
  for (const { values: shown } of marbleModel(example, record.example.parameters).marbles.frames)
    for (const name of names) expect(shown[name], name).toBeDefined();
});

it('sends nothing while the budget is silent and overwrites queued before any row is built', () => {
  const run = marbleModel(example);
  const waiting = run.marbles.frames.find(({ frame }) => frame === 2);
  expect(waiting?.values['now']).toBe('worker$ emits r (reading)');
  expect(waiting?.values['delivered']).toBe('nothing');
  // Every frame is a step, and a frame where nothing arrives says so.
  expect(run.marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 16 }, (_, frame) => frame),
  );
  expect(run.marbles.frames[3].values['now']).toBe('nothing new happens');
  // queued reached combineLatest, but a later report replaced it before the budget spoke.
  const rows = Object.values(example.outputs['row$'].values ?? {}).map(String);
  expect(rows.some((row) => row.includes('queued'))).toBe(false);
  expect(rows[0]).toBe('reading, 90% left');
});

it('tells of the first row and names each moment', () => {
  const run = marbleModel(example);
  const first = run.marbles.frames[4];
  expect(first.frame).toBe(4);
  expect(first.values['now']).toBe('budget$ emits a (90% left); row$ emits 1 (reading, 90% left)');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Still waiting', 2],
    ['First row', 4],
    ['Budget falls', 8],
    ['Budget completes', 10],
    ['Done', 15],
  ]);
});

it('keeps the completed budget’s last value and completes only with the last input', () => {
  const { marbles } = marbleModel(example);
  const events = (label: string) =>
    marbles.lines
      .find((line) => line.label === label)
      ?.events.map(
        ({ kind, frame, value }) => `${kind} ${frame}${kind === 'next' ? ` ${value}` : ''}`,
      );
  expect(events('budget$')?.at(-1)).toBe('complete 10');
  expect(events('row$')).toEqual([
    'next 4 reading, 90% left',
    'next 6 writing, 90% left',
    'next 8 writing, 40% left',
    'next 12 done, 40% left',
    'complete 15',
  ]);
  expect(marbles.frames[marbles.frames.length - 1].values['delivered']).toBe(
    '1 (reading, 90% left), 2 (writing, 90% left), 3 (writing, 40% left), 4 (done, 40% left)',
  );
});

it('completes empty when an input never sends a value, but only once the other inputs have completed', () => {
  const testScheduler = scheduler();
  testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const worker$ = cold(worker.marbles, worker.values);
    const silent$ = cold('--|');
    const { row$ } = example.run({
      inputs: { worker$, budget$: silent$ },
      inner: {},
      scheduler: testScheduler,
    });
    // The empty budget completes at frame 2; the row waits for the worker, at frame 15.
    expectObservable(row$).toBe('---------------|');
    expectSubscriptions(worker$.subscriptions).toBe('^--------------!');
  });
});

it('errors with the first error from any input and unsubscribes the others', () => {
  const testScheduler = scheduler();
  const unavailable = new Error('budget unavailable');
  testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
    const worker$ = cold(worker.marbles, worker.values);
    const failing$ = cold('----a---#', budget.values, unavailable);
    const { row$ } = example.run({
      inputs: { worker$, budget$: failing$ },
      inner: {},
      scheduler: testScheduler,
    });
    expectObservable(row$).toBe(
      '----1-2-#',
      { 1: 'reading, 90% left', 2: 'writing, 90% left' },
      unavailable,
    );
    expectSubscriptions(worker$.subscriptions).toBe('^-------!');
  });
});

it('sends a glitch when two inputs derive from one source', () => {
  const state = new Subject<string>();
  const seen: string[] = [];
  combineLatest([state, state.pipe(map((now) => now.toUpperCase()))]).subscribe(([a, b]) =>
    seen.push(`${a}/${b}`),
  );
  state.next('reading');
  state.next('writing');
  // The middle pair never held at once: a new state beside the stale form of the old one.
  expect(seen).toEqual(['reading/READING', 'writing/READING', 'writing/WRITING']);
});

it('combines only the last value of an input that sends everything while being subscribed', () => {
  const seen: string[] = [];
  combineLatest([
    of(...Object.values(worker.values ?? {})),
    of(...Object.values(budget.values ?? {})),
  ]).subscribe(([a, b]) => seen.push(`${String(a)}, ${String(b)}`));
  expect(seen).toEqual(['done, 90% left', 'done, 40% left']);
});
