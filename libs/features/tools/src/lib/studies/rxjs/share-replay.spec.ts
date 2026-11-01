import { defer, ReplaySubject, retry, share, shareReplay, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './share-replay';

const quote = example.inputs['quote$'];

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the quote page against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the shareReplay row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:216');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/share-replay.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'quote$',
    'tile$',
    'chart$',
  ]);
});

it('hands the chart the stored quote the moment it opens, and only that one', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe('chart$ subscribes; chart$ emits b (104)');
  const chart = run.marbles.lines.find(({ label }) => label === 'chart$');
  expect(chart).toMatchObject({ subscribedAt: 7, unsubscribedAt: 15 });
  expect(
    chart?.events
      .filter(({ kind }) => kind === 'next')
      .map(({ key, frame }) => `${key} at ${frame}`),
  ).toEqual(['b at 7', 'c at 9', 'd at 13']);
});

it('keeps the poll running for no one after both readers have left', () => {
  const run = marbleModel(example);
  const poll = run.marbles.lines.find(({ label }) => label === 'quote$');
  expect(poll).toMatchObject({ subscribedAt: 0, unsubscribedAt: undefined, cancelled: false });
  expect(poll?.events.every(({ delivered }) => delivered)).toBe(true);
  const afterLeaving = run.marbles.frames.find(({ frame }) => frame === 17);
  expect(afterLeaving?.values['now']).toBe('quote$ emits e (105)');
});

it('stops the poll and drops the memory with the last reader when refCount is true', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const quote$ = cold(quote.marbles, quote.values);
    const shared$ = quote$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    expectObservable(shared$, '^-----!').toBe('-a---b', quote.values);
    // A reader who returns starts a new poll and is replayed nothing.
    expectObservable(shared$, '---------^-------!').toBe('----------a---b', quote.values);
    expectSubscriptions(quote$.subscriptions).toBe(['^-----!', '---------^-------!']);
  });
});

it('keeps the latest quote through a short absence with share, a ReplaySubject and a delayed reset', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const quote$ = cold(quote.marbles, quote.values);
    const shared$ = quote$.pipe(
      share({ connector: () => new ReplaySubject(1), resetOnRefCountZero: () => timer(3) }),
    );
    expectObservable(shared$, '^-----!').toBe('-a---b', quote.values);
    // Back inside the three-frame grace: the stored quote at once, then the running poll.
    expectObservable(shared$, '--------^---!').toBe('--------bc', quote.values);
    // Back after the grace ran out: a new poll, with nothing to replay.
    expectObservable(shared$, '------------------^-------!').toBe(
      '-------------------a---b',
      quote.values,
    );
    // The last reader's departure starts the grace again, so the poll stops three frames later.
    expectSubscriptions(quote$.subscriptions).toBe([
      '^--------------!',
      '------------------^----------!',
    ]);
  });
});

it('replays a completed result with its completion and never requests it again', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const request$ = cold('-q|', { q: 101 });
    const shared$ = request$.pipe(shareReplay(1));
    expectObservable(shared$).toBe('-q|', { q: 101 });
    expectObservable(shared$, '-----^').toBe('-----(q|)', { q: 101 });
    expectSubscriptions(request$.subscriptions).toBe('^-!');
  });
});

it('drops the memory on an error, so the next reader starts a new poll with nothing replayed', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const failing$ = cold('-a--#', { a: 101 });
    const shared$ = failing$.pipe(shareReplay(1));
    expectObservable(shared$).toBe('-a--#', { a: 101 });
    expectObservable(shared$, '--^').toBe('--a-#', { a: 101 });
    expectObservable(shared$, '------^').toBe('-------a--#', { a: 101 });
    expectSubscriptions(failing$.subscriptions).toBe(['^---!', '------^---!']);
  });
});

it('keeps the readers through a failed request when the retry comes before shareReplay', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const failed$ = cold('-#');
    const answered$ = cold('-a', { a: 101 });
    let attempts = 0;
    const request$ = defer(() => (attempts++ === 0 ? failed$ : answered$));
    const shared$ = request$.pipe(retry(1), shareReplay(1));
    expectObservable(shared$).toBe('--a', { a: 101 });
    expectObservable(shared$, '---^').toBe('---a', { a: 101 });
  });
});

it('replays every value without a buffer size, and none older than the window', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const everything$ = cold(quote.marbles, quote.values).pipe(shareReplay());
    expectObservable(everything$, '^-------!').toBe('-a---b', quote.values);
    expectObservable(everything$, '-------^!').toBe('-------(ab)', quote.values);
  });
  scheduler().run(({ cold, expectObservable }) => {
    // b was fetched two frames before the chart opens, so a one-frame window replays nothing.
    const fresh$ = cold(quote.marbles, quote.values).pipe(
      shareReplay({ bufferSize: 1, windowTime: 1, refCount: true }),
    );
    expectObservable(fresh$, '^---------!').toBe('-a---b---c', quote.values);
    expectObservable(fresh$, '-------^--!').toBe('---------c', quote.values);
  });
});
