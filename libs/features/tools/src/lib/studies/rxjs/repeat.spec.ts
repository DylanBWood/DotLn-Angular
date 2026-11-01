import {
  concat,
  config,
  defer,
  EMPTY,
  from,
  lastValueFrom,
  of,
  repeat,
  take,
  takeWhile,
  timer,
  toArray,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './repeat';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the status check example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the repeat row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:238');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/repeat.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'check$',
    'check$, run 2',
    'check$, run 3',
    'status$',
  ]);
  expect(example.operator.length).toBeLessThanOrEqual(40);
});

it('says in its parameters what the drawing shows', async () => {
  const { parameters } = (await loadStudy('rxc:238')).example;
  const { lines, lastFrame } = marbleModel(example).marbles;
  expect(lastFrame).toBeLessThanOrEqual(24);
  const runs = lines.filter(({ role }) => role !== 'output');
  expect(runs).toHaveLength(Number(parameters['checks']));
  for (const run of runs) {
    const answer = run.events.find(({ kind }) => kind === 'next');
    expect((answer?.frame ?? NaN) - (run.subscribedAt ?? 0)).toBe(parameters['answerAfter']);
  }
  const waits = runs
    .slice(1)
    .map((run, index) => (run.subscribedAt ?? NaN) - (runs[index].unsubscribedAt ?? NaN));
  expect(waits).toEqual([parameters['wait'], parameters['wait']]);
  const status = lines.find(({ role }) => role === 'output');
  const answers = status?.events.filter(({ kind }) => kind === 'next').map(({ value }) => value);
  expect(`${answers?.slice(0, -1).join(', ')} and ${answers?.at(-1)}`).toBe(parameters['answers']);
});

it('holds back each completion but the last, and tells of the first', () => {
  const run = marbleModel(example);
  const { lines, frames } = run.marbles;
  const status = lines.find(({ label }) => label === 'status$');
  const ends = lines
    .filter(({ role }) => role !== 'output')
    .map(({ events }) => events.find(({ kind }) => kind === 'complete')?.frame);
  expect(ends).toEqual([3, 8, 13]);
  expect(
    status?.events.filter(({ kind }) => kind === 'complete').map(({ frame }) => frame),
  ).toEqual([13]);
  expect(frames[3].frame).toBe(3);
  expect(frames[3].values['now']).toBe('check$ completes');
  expect(run.moments.map(({ label, step }) => [label, frames[step].frame])).toEqual([
    ['First answer', 2],
    ['Run 1 completes', 3],
    ['Run 2 starts', 5],
    ['Run 3 starts', 10],
    ['Done', 13],
  ]);
  expect(frames[frames.length - 1].values['delivered']).toBe('q (queued), r (running), p (passed)');
  // Every frame is a step, waits included, and each has a sentence of its own.
  expect(frames.map(({ frame }) => frame)).toEqual([...Array(14).keys()]);
  expect(frames.every(({ frame }) => example.notes?.[frame] !== undefined)).toBe(true);
  expect(run.caption).toContain('status$ has a single bar, at the end');
});

it('lets an error through without starting over', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const check$ = cold('--q#', { q: 'queued' }, 'unreachable');
    expectObservable(check$.pipe(repeat(3))).toBe('--q#', { q: 'queued' }, 'unreachable');
    expectSubscriptions(check$.subscriptions).toBe('^--!');
  });
});

it('is empty for a count of zero and never subscribes', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const check$ = cold('--q|');
    expectObservable(check$.pipe(repeat(0))).toBe('|');
    expectSubscriptions(check$.subscriptions).toBe([]);
  });
});

it('stops a poll on an answer when takeWhile follows it, with no count', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const runs = [cold('--q|'), cold('--r|'), cold('--p|'), cold('--x|')];
    let sent = 0;
    const status$ = defer(() => runs[sent++]).pipe(
      repeat({ delay: 2 }),
      takeWhile((status) => status !== 'p', true),
    );
    expectObservable(status$).toBe('--q----r----(p|)');
    expectSubscriptions(runs[2].subscriptions).toBe('----------^-!');
    expectSubscriptions(runs[3].subscriptions).toBe([]);
  });
});

it('completes when the delay function returns an empty notifier', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const check$ = cold('--q|');
    expectObservable(check$.pipe(repeat({ delay: () => EMPTY }))).toBe('--q|');
    expectSubscriptions(check$.subscriptions).toBe('^--!');
  });
});

it('backs off when the delay is a function of the finished runs', () => {
  const finishedRuns: number[] = [];
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const check$ = cold('--q|');
    const backingOff$ = check$.pipe(
      repeat({
        count: 3,
        delay: (finished) => {
          finishedRuns.push(finished);
          return timer(finished * 2);
        },
      }),
    );
    expectObservable(backingOff$).toBe('--q----q------q|');
    expectSubscriptions(check$.subscriptions).toBe(['^--!', '-----^--!', '------------^--!']);
  });
  // The function is called after each finished run but the last, with how many have finished.
  expect(finishedRuns).toEqual([1, 2]);
});

it('waits only once a run completes, so a slow answer slows the poll', () => {
  scheduler().run(({ cold, expectSubscriptions, expectObservable }) => {
    const slow$ = cold('-----q|');
    expectObservable(slow$.pipe(repeat({ count: 2, delay: 2 }))).toBe('-----q-------q|');
    expectSubscriptions(slow$.subscriptions).toBe(['^-----!', '--------^-----!']);
  });
});

it('repeats a promise made before the pipe without making it again, unlike defer', async () => {
  let calls = 0;
  const request = () => Promise.resolve(`answer ${++calls}`);
  const once = await lastValueFrom(from(request()).pipe(repeat(3), toArray()));
  expect(once).toEqual(['answer 1', 'answer 1', 'answer 1']);
  expect(calls).toBe(1);
  calls = 0;
  const fresh = await lastValueFrom(defer(() => request()).pipe(repeat(3), toArray()));
  expect(fresh).toEqual(['answer 1', 'answer 2', 'answer 3']);
  expect(calls).toBe(3);
});

it('asks a completed hot source for nothing new', () => {
  scheduler().run(({ hot, expectObservable }) => {
    const shared$ = hot('-a-|');
    expectObservable(shared$.pipe(repeat(3))).toBe('-a-|');
  });
});

it('loops at once over a source that completes on subscription until something stops it', () => {
  const seen: string[] = [];
  of('tick')
    .pipe(repeat(), take(3))
    .subscribe((value) => seen.push(value));
  // Every repetition ran inside the subscribe call above; only take ended the loop.
  expect(seen).toEqual(['tick', 'tick', 'tick']);
});

it('runs out of stack over a source that completes on subscription, unless a timer spaces the runs', async () => {
  const runs = 100_000;
  const unhandled: unknown[] = [];
  const previous = config.onUnhandledError;
  config.onUnhandledError = (error) => unhandled.push(error);
  let seen = 0;
  let completed = false;
  try {
    of('tick')
      .pipe(repeat(runs))
      .subscribe({
        next: () => (seen += 1),
        error: () => undefined,
        complete: () => (completed = true),
      });
    // A report of an unhandled error would arrive on a later task.
    await new Promise((resolve) => setTimeout(resolve, 0));
  } finally {
    config.onUnhandledError = previous;
  }
  // Each run started inside the one before it, so the stack ran out long before the count.
  expect(completed).toBe(false);
  expect(seen).toBeLessThan(runs);

  // A timer, here in virtual time, starts each run from the scheduler's loop instead.
  let spaced = 0;
  scheduler().run(() => {
    of('tick')
      .pipe(repeat({ count: runs, delay: 1 }))
      .subscribe(() => (spaced += 1));
  });
  expect(spaced).toBe(runs);
});

it('over a cold source does what the source concatenated with itself does', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const check$ = cold('--q|');
    expectObservable(check$.pipe(repeat(3))).toBe('--q--q--q|');
    expectObservable(concat(check$, check$, check$)).toBe('--q--q--q|');
  });
});
