import { connect, defer, map, merge, of, ReplaySubject, retry, share, timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './share';

const quote = example.inputs['quote$'];

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the quote page against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the share row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:215');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/share.ts',
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

it('gives the chart nothing when it opens and only the quotes fetched after that', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe('chart$ subscribes');
  const chart = run.marbles.lines.find(({ label }) => label === 'chart$');
  expect(chart).toMatchObject({ subscribedAt: 7, unsubscribedAt: 15 });
  expect(chart?.events.some(({ frame }) => frame === 7)).toBe(false);
  const received = (label: string) =>
    run.marbles.lines
      .find((line) => line.label === label)
      ?.events.filter(({ kind }) => kind === 'next')
      .map(({ key, frame }) => `${key} at ${frame}`);
  expect(received('tile$')).toEqual(['a at 1', 'b at 5', 'c at 9', 'd at 13']);
  expect(received('chart$')).toEqual(['c at 9', 'd at 13']);
});

it('runs one poll for both readers and stops it when the last one leaves', () => {
  const { marbles } = marbleModel(example);
  const poll = marbles.lines.find(({ label }) => label === 'quote$');
  expect(poll).toMatchObject({ subscribedAt: 0, unsubscribedAt: 15, cancelled: true });
  const neverFetched = poll?.events
    .filter(({ kind, delivered }) => kind === 'next' && !delivered)
    .map(({ key }) => key);
  expect(neverFetched).toEqual(['e', 'f']);
});

it('starts a new poll for a reader who arrives after the last one left', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const quote$ = cold(quote.marbles, quote.values);
    const shared$ = quote$.pipe(share());
    expectObservable(shared$, '^-----!').toBe('-a---b', quote.values);
    // The poll starts over: its first quote comes one frame after the reader arrives.
    expectObservable(shared$, '---------^-------!').toBe('----------a---b', quote.values);
    expectSubscriptions(quote$.subscriptions).toBe(['^-----!', '---------^-------!']);
  });
});

it('sends a second request for a reader who arrives after the first one completed', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const request$ = cold('-q|', { q: 101 });
    const shared$ = request$.pipe(share());
    expectObservable(shared$).toBe('-q|', { q: 101 });
    expectObservable(shared$, '-----^').toBe('------q|', { q: 101 });
    expectSubscriptions(request$.subscriptions).toBe(['^-!', '-----^-!']);
  });
});

it('ends every reader present on an error and only starts again for a later one', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const failing$ = cold('-a--#', { a: 101 });
    const shared$ = failing$.pipe(share());
    expectObservable(shared$).toBe('-a--#', { a: 101 });
    expectObservable(shared$, '--^').toBe('----#');
    expectObservable(shared$, '------^').toBe('-------a--#', { a: 101 });
    expectSubscriptions(failing$.subscriptions).toBe(['^---!', '------^---!']);
  });
});

it('keeps one poll through a short gap between readers with a delayed reset', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const quote$ = cold(quote.marbles, quote.values);
    const shared$ = quote$.pipe(share({ resetOnRefCountZero: () => timer(3) }));
    expectObservable(shared$, '^-----!').toBe('-a---b', quote.values);
    // The second reader arrives two frames after the first left, inside the three-frame grace.
    expectObservable(shared$, '--------^---!').toBe('---------c', quote.values);
    expectSubscriptions(quote$.subscriptions).toBe('^--------------!');
  });
});

it('hands a late reader the latest value with a ReplaySubject connector, resets kept', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const quote$ = cold(quote.marbles, quote.values);
    const shared$ = quote$.pipe(share({ connector: () => new ReplaySubject(1) }));
    expectObservable(shared$, '^--------------!').toBe('-a---b---c---d', quote.values);
    expectObservable(shared$, '-------^-------!').toBe('-------b-c---d', quote.values);
    // The poll still stops with the last reader.
    expectSubscriptions(quote$.subscriptions).toBe('^--------------!');
  });
});

it('keeps the readers through a failed request when the retry is inside the shared part', () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const failed$ = cold('-#');
    const answered$ = cold('-a', { a: 101 });
    let attempts = 0;
    const request$ = defer(() => (attempts++ === 0 ? failed$ : answered$));
    const shared$ = request$.pipe(retry(1), share());
    expectObservable(shared$).toBe('--a', { a: 101 });
    expectObservable(shared$).toBe('--a', { a: 101 });
    expectSubscriptions(failed$.subscriptions).toBe('^!');
    expectSubscriptions(answered$.subscriptions).toBe('-^');
  });
});

it('runs a synchronous source in full for each reader, where connect runs it once', () => {
  let starts = 0;
  const source$ = defer(() => {
    starts += 1;
    return of(101, 104);
  });
  const shared$ = source$.pipe(share());
  const seen: string[] = [];
  shared$.subscribe((value) => seen.push(`tile ${value}`));
  shared$.subscribe((value) => seen.push(`chart ${value}`));
  expect(starts).toBe(2);
  expect(seen).toEqual(['tile 101', 'tile 104', 'chart 101', 'chart 104']);

  starts = 0;
  const both: string[] = [];
  source$
    .pipe(
      connect((one$) =>
        merge(
          one$.pipe(map((value) => `tile ${value}`)),
          one$.pipe(map((value) => `chart ${value}`)),
        ),
      ),
    )
    .subscribe((value) => both.push(value));
  expect(starts).toBe(1);
  expect(both).toEqual(['tile 101', 'chart 101', 'tile 104', 'chart 104']);
});
