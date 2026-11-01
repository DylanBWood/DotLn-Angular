import { type Observable, timeout, TimeoutError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model, waits } from './timeout';

const report = example.inputs['report$'];

// Two TimeoutErrors are the same failure when their message and info agree. RxJS records each
// one's stack as an own property, which differs by where it was made, so the comparison leaves it
// out; any other value is compared as usual.
expect.addEqualityTesters([
  function sameTimeout(a, b, testers) {
    if (!(a instanceof TimeoutError) || !(b instanceof TimeoutError)) return undefined;
    return a.message === b.message && this.equals(a.info, b.info, testers);
  },
]);

/** Runs another pipeline over the example's report and asserts what it emits. */
function expectOverReport(
  pipeline: (report$: Observable<unknown>) => Observable<unknown>,
  marbles: string,
  values: Readonly<Record<string, unknown>>,
  error?: unknown,
) {
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(
    ({ cold, expectObservable }) => {
      const report$ = cold(report.marbles, report.values);
      expectObservable(pipeline(report$)).toBe(marbles, values, error);
    },
  );
}

it('runs the stalled report against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the timeout row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:234');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/timeout.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'report$',
    'pages$',
  ]);
});

it('names in the record the same waits and page count the run uses', async () => {
  const { parameters } = (await loadStudy('rxc:234')).example;
  expect(parameters['startup']).toBe(waits.startup);
  expect(parameters['gap']).toBe(waits.gap);
  // The band between the lanes names the waits by value, as the record's prose does.
  expect(example.operator).toBe('timeout({ first: 6, each: 4 })');
  expect(example.operator.length).toBeLessThanOrEqual(40);
  const pages = marbleModel(example).marbles.lines.find(({ label }) => label === 'pages$');
  const shown = pages?.events.filter(({ kind }) => kind === 'next') ?? [];
  expect(shown).toHaveLength(Number(parameters['pagesShown']));
  // A wait is measured from the last page: the stall is timed from the third page's frame.
  const error = pages?.events.find(({ kind }) => kind === 'error');
  expect(error?.frame).toBe(shown[shown.length - 1].frame + waits.gap);
  expect(shown[0].frame).toBeLessThanOrEqual(waits.startup);
  expect(shown[0].frame).toBeGreaterThan(waits.gap);
});

it('fails with a TimeoutError that counts the pages seen but has already lost the last one', () => {
  let failure: unknown;
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  scheduler.run(({ cold }) => {
    const report$ = cold(report.marbles, report.values);
    const { pages$ } = example.run({ inputs: { report$ }, inner: {}, scheduler });
    pages$.subscribe({ error: (error: unknown) => (failure = error) });
  });
  expect(failure).toBeInstanceOf(TimeoutError);
  // RxJS 7.8.2 clears lastValue as it unsubscribes from the source, before it builds the info
  // (ReactiveX/rxjs#7324). An upgrade that keeps the last page fails here, and the record's limit
  // that says so must change with it.
  expect((failure as TimeoutError).info).toEqual({ meta: null, seen: 3, lastValue: null });
});

it('stops listening to the report, so the late page and its completion reach nothing', () => {
  const { marbles } = marbleModel(example);
  const source = marbles.lines.find(({ label }) => label === 'report$');
  expect(source).toMatchObject({ subscribedAt: 0, unsubscribedAt: 14, cancelled: true });
  expect(
    source?.events.filter(({ delivered }) => !delivered).map(({ kind, key }) => `${kind} ${key}`),
  ).toEqual(['next d', 'complete |']);
});

it('with each alone, holds the first page to the gap wait and fails before it arrives', () => {
  expectOverReport(
    (report$) => report$.pipe(timeout({ each: waits.gap })),
    '----#',
    {},
    new TimeoutError({ meta: null, seen: 0, lastValue: null }),
  );
});

it('with first alone, times nothing after the first page, so the stall is never reported', () => {
  expectOverReport(
    (report$) => report$.pipe(timeout({ first: waits.startup })),
    report.marbles,
    report.values ?? {},
  );
});

it('tells of the timeout and names it in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[14];
  expect(telling.frame).toBe(14);
  expect(telling.values['now']).toBe(
    'report$ is cut off; pages$ errors with Error: Timeout has occurred',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Without first', 4],
    ['First page', 5],
    ['Wait restarts', 8],
    ['Timeout', 14],
  ]);
});
