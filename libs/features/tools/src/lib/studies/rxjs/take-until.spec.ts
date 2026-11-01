import { Observable, of, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './take-until';

/** A scheduler whose assertions fail the spec, as the marble helper's does. */
const testScheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

/** The example's own pipeline over streams the test supplies. */
const shownFrom = (
  scheduler: TestScheduler,
  tick$: Observable<unknown>,
  closed$: Observable<unknown>,
) => example.run({ inputs: { tick$, closed$ }, inner: {}, scheduler })['shown$'];

it('runs the closing page example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the takeUntil row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:192');
  expect(record.slug).toBe('take-until');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/take-until.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'closed$',
    'tick$',
    'shown$',
  ]);
});

it('states the timing the marbles run: how often the clock ticks and when the page closes', async () => {
  const { parameters } = (await loadStudy('rxc:192')).example;
  const { marbles } = marbleModel(example);
  const nexts = (label: string) =>
    marbles.lines
      .find((line) => line.label === label)
      ?.events.filter(({ kind }) => kind === 'next')
      .map(({ frame }) => frame) ?? [];
  const ticks = nexts('tick$');
  expect(ticks.slice(1).map((frame, index) => frame - ticks[index])).toEqual(
    ticks.slice(1).map(() => parameters['tickEvery']),
  );
  expect(ticks[0]).toBe(parameters['tickEvery']);
  expect(nexts('closed$')).toEqual([parameters['closesAt']]);
});

it('lets go of the clock while the clock runs on for its other listeners', () => {
  const scheduler = testScheduler();
  scheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
    const closed$ = hot(example.inputs['closed$'].marbles);
    const tick$ = hot(example.inputs['tick$'].marbles);
    expectObservable(shownFrom(scheduler, tick$, closed$)).toBe(example.outputs['shown$'].marbles);
    // Another page that never closes goes on hearing every tick.
    expectObservable(tick$).toBe('--1-2-3-4-5-6');
    expectSubscriptions(closed$.subscriptions).toBe('^------!');
    expectSubscriptions(tick$.subscriptions).toBe(['^------!', '^']);
  });
});

it('listens to closed$ before the clock, and never to a clock once the page has closed', () => {
  const order: string[] = [];
  const logged = (name: string, source: Observable<unknown>) =>
    new Observable<unknown>((subscriber) => {
      order.push(name);
      return source.subscribe(subscriber);
    });
  const scheduler = testScheduler();
  const open = shownFrom(scheduler, logged('tick$', of(1)), logged('closed$', new Observable()));
  open.subscribe().unsubscribe();
  expect(order).toEqual(['closed$', 'tick$']);

  order.length = 0;
  const seen: string[] = [];
  shownFrom(scheduler, logged('tick$', of(1)), logged('closed$', of(undefined))).subscribe({
    next: (value) => seen.push(`next ${String(value)}`),
    complete: () => seen.push('complete'),
  });
  expect(order).toEqual(['closed$']);
  expect(seen).toEqual(['complete']);
});

it('stops nothing when a plain Subject fired before the page started listening', () => {
  const closed$ = new Subject<void>();
  closed$.next();
  const seen: string[] = [];
  shownFrom(testScheduler(), of('1', '2', '3'), closed$).subscribe({
    next: (tick) => seen.push(String(tick)),
    complete: () => seen.push('complete'),
  });
  expect(seen).toEqual(['1', '2', '3', 'complete']);
});

it('changes nothing when closed$ completes without emitting, as the mechanism says', () => {
  const scheduler = testScheduler();
  scheduler.run(({ hot, cold, expectObservable }) => {
    const tick$ = hot('^-1-2-3|');
    expectObservable(shownFrom(scheduler, tick$, cold('--|'))).toBe('--1-2-3|');
  });
});

it('fails the output when closed$ fails, as the limits say', () => {
  const scheduler = testScheduler();
  scheduler.run(({ hot, cold, expectObservable }) => {
    const tick$ = hot('^-1-2-3|');
    expectObservable(shownFrom(scheduler, tick$, cold('---#', undefined, 'lost'))).toBe(
      '--1#',
      undefined,
      'lost',
    );
  });
});

it('ends both lanes at the close and steps every frame up to it', () => {
  const { marbles } = marbleModel(example);
  // Every frame up to the close is a step, and the quiet ones say so.
  expect(marbles.frames.map(({ frame }) => frame)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(marbles.lastFrame).toBe(7);
  expect(marbles.frames[1].values['now']).toBe('nothing new happens');
  const line = (label: string) => marbles.lines.find((candidate) => candidate.label === label);
  expect(line('tick$')).toMatchObject({ subscribedAt: 0, unsubscribedAt: 7, cancelled: true });
  expect(line('closed$')).toMatchObject({ subscribedAt: 0, unsubscribedAt: 7, cancelled: true });
  expect(line('closed$')?.events).toMatchObject([{ frame: 7, key: 'x', delivered: true }]);
  // The clock is hot and its marbles run past the close; this page receives only the ticks before it.
  const received = line('tick$')
    ?.events.filter(({ delivered }) => delivered)
    .map(({ key }) => key);
  expect(received).toEqual(['1', '2', '3']);
});

it('tells of the close and names each moment in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe(
    'closed$ emits x; closed$ is cut off; tick$ is cut off; shown$ completes',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Page opens', 0],
    ['First tick', 2],
    ['Page closes', 7],
  ]);
  expect(run.marbles.frames.at(-1)?.values['delivered']).toBe('1, 2, 3');
  expect(run.caption).toContain('not where the clock stopped');
});
