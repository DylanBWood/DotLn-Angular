import { catchError, of, switchMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example, failure, model } from './catch-error';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the departures board example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the catchError row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:220');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/catch-error.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.example.parameters['failure']).toBe(failure.message);
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'departures$',
    'timetable$',
    'board$',
  ]);
});

it('ends the feed at its error and opens the timetable at that same frame', () => {
  const { marbles } = marbleModel(example);
  const feed = marbles.lines.find(({ label }) => label === 'departures$');
  expect(feed).toMatchObject({ subscribedAt: 0, unsubscribedAt: 7, cancelled: false });
  expect(feed?.events.at(-1)).toMatchObject({
    frame: 7,
    kind: 'error',
    value: 'Error: feed lost',
  });
  const timetable = marbles.lines.find(({ label }) => label === 'timetable$');
  expect(timetable).toMatchObject({ subscribedAt: 7, unsubscribedAt: 10, cancelled: false });
  const board = marbles.lines.find(({ label }) => label === 'board$');
  expect(board?.events.some(({ kind }) => kind === 'error')).toBe(false);
  expect(marbles.frames[marbles.frames.length - 1].values['delivered']).toBe(
    'a (10:02), b (10:15), t (timetable: feed lost)',
  );
});

it('tells of the failure and names the error and the replacement in the frame’s sentence', () => {
  const run = marbleModel(example);
  expect(run.caption).toContain(`its error, ${failure.message}`);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe(
    'departures$ errors with Error: feed lost; timetable$ is opened',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Live update', 1],
    ['Feed fails', 7],
    ['Timetable shown', 9],
    ['Done', 10],
  ]);
});

// The limits name these cases; each runs here so the prose states what the operator does.

it('passes on an error from the replacement or the selector: neither is caught again', () => {
  const unreadable = new Error('timetable unreadable');
  scheduler().run(({ cold, expectObservable }) => {
    const feed$ = cold('-a--#', { a: '10:02' }, failure);
    const fallback$ = cold('--#', undefined, unreadable);
    expectObservable(feed$.pipe(catchError(() => fallback$))).toBe(
      '-a----#',
      { a: '10:02' },
      unreadable,
    );
    const throwing$ = feed$.pipe(
      catchError(() => {
        throw unreadable;
      }),
    );
    expectObservable(throwing$).toBe('-a--#', { a: '10:02' }, unreadable);
  });
});

it('ends a long-lived stream when placed outside the flattening, and keeps it alive inside', () => {
  scheduler().run(({ cold, expectObservable }) => {
    // Two presses of Refresh, each opening a new feed; the first feed is lost, the second delivers.
    const presses = '-p------q---|';
    const feeds = { p: cold('--#', undefined, failure), q: cold('--a|', { a: '10:02' }) };
    const feed = (press: unknown) => feeds[press as 'p' | 'q'];
    const outside$ = cold(presses).pipe(
      switchMap(feed),
      catchError((error: Error) => of(`timetable: ${error.message}`)),
    );
    const inside$ = cold(presses).pipe(
      switchMap((press) =>
        feed(press).pipe(catchError((error: Error) => of(`timetable: ${error.message}`))),
      ),
    );
    const values = { t: `timetable: ${failure.message}`, a: '10:02' };
    // Outside: the first lost feed completes everything, and the second press is never heard.
    expectObservable(outside$).toBe('---(t|)', values);
    // Inside: the lost feed is replaced, and the second press opens a feed that delivers.
    expectObservable(inside$).toBe('---t------a-|', values);
  });
});

it('starts the source over when the selector returns caught, with no count and no wait', () => {
  let caught = 0;
  scheduler().run(({ cold, expectObservable }) => {
    const feed$ = cold('-a-#', { a: 'update' }, failure);
    const again$ = feed$.pipe(
      catchError((_error, source$) => {
        caught += 1;
        return source$;
      }),
    );
    // Each error restarts the feed at once; only the unsubscription at frame 9 stops it.
    expectObservable(again$, '^--------!').toBe('-a--a--a-', { a: 'update' });
  });
  expect(caught).toBe(2);
});
