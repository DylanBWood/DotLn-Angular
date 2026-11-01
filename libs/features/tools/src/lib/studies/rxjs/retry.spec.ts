import { defer, EMPTY, from, retry, throwError, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { count, delay, example, model } from './retry';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the departures board example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the retry row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:221');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/retry.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.example.parameters['count']).toBe(count);
  expect(record.example.parameters['delay']).toBe(delay);
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'attempt 1',
    'attempt 2',
    'attempt 3',
    'board$',
  ]);
});

it('starts each attempt the delay after the last one failed, and lets no error through', () => {
  const { marbles } = marbleModel(example);
  const attempts = marbles.lines.filter(({ role }) => role === 'inner');
  expect(
    attempts.map(({ subscribedAt, unsubscribedAt }) => [subscribedAt, unsubscribedAt]),
  ).toEqual([
    [0, 2],
    [2 + delay, 7],
    [7 + delay, 13],
  ]);
  expect(attempts.length).toBe(count + 1);
  const board = marbles.lines.find(({ label }) => label === 'board$');
  expect(board?.events.some(({ kind }) => kind === 'error')).toBe(false);
});

it('keeps the value of a failed attempt, so the board shows the 10:02 twice', () => {
  const run = marbleModel(example);
  expect(run.marbles.frames[run.marbles.frames.length - 1].values['delivered']).toBe(
    'a (10:02), a (10:02), b (10:15)',
  );
  expect(run.caption).toContain(`a new attempt, on the next lane, ${delay} frames later`);
  const telling = run.marbles.frames[4];
  expect(telling.frame).toBe(4);
  expect(telling.values['now']).toBe('attempt 2 is opened');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['First attempt fails', 2],
    ['Ask again', 4],
    ['Second attempt fails', 7],
    ['Repeated value', 10],
    ['Done', 13],
  ]);
});

// The limits name these cases; each runs here so the prose states what the operator does.

it('passes on the last error once the retries run out, and only that one', () => {
  const last = new Error('reset');
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const request$ = cold('--#', undefined, last);
    expectObservable(request$.pipe(retry({ count, delay }))).toBe('----------#', undefined, last);
    expectSubscriptions(request$.subscriptions).toBe(['^-!', '----^-!', '--------^-!']);
  });
});

it('repeats the call only when subscribing makes it: defer does, a promise made once does not', async () => {
  let deferredCalls = 0;
  const deferred$ = defer(() => {
    deferredCalls += 1;
    return throwError(() => new Error('timed out'));
  });
  await expect(
    new Promise((resolve, reject) =>
      deferred$.pipe(retry(count)).subscribe({ next: resolve, error: reject }),
    ),
  ).rejects.toThrow('timed out');
  expect(deferredCalls).toBe(count + 1);

  let promisedCalls = 0;
  const promised = (() => {
    promisedCalls += 1;
    return Promise.reject(new Error('timed out'));
  })();
  const once$ = from(promised);
  await expect(
    new Promise((resolve, reject) =>
      once$.pipe(retry(count)).subscribe({ next: resolve, error: reject }),
    ),
  ).rejects.toThrow('timed out');
  expect(promisedCalls).toBe(1);
});

it('restores the count after a value only when resetOnSuccess is set', () => {
  scheduler().run(({ cold, expectObservable }) => {
    // Every attempt delivers one value and then fails.
    const flaky$ = cold('-a#', { a: 'update' }, new Error('reset'));
    expectObservable(flaky$.pipe(retry({ count: 1 }))).toBe(
      '-a-a#',
      { a: 'update' },
      new Error('reset'),
    );
    expectObservable(flaky$.pipe(retry({ count: 1, resetOnSuccess: true })), '^-------!').toBe(
      '-a-a-a-a',
      { a: 'update' },
    );
  });
});

it('fails at once when the delay function rethrows, and stops quietly when it returns EMPTY', () => {
  const notFound = new Error('not found');
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const request$ = cold('-a#', { a: '10:02' }, notFound);
    const classified$ = request$.pipe(
      retry({
        count,
        delay: (error: Error) => (error === notFound ? throwError(() => error) : timer(delay)),
      }),
    );
    expectObservable(classified$).toBe('-a#', { a: '10:02' }, notFound);
    const stopped$ = request$.pipe(retry({ count, delay: () => EMPTY }));
    expectObservable(stopped$).toBe('-a|', { a: '10:02' });
    expectSubscriptions(request$.subscriptions).toBe(['^-!', '^-!']);
  });
});
