import {
  defer,
  finalize,
  of,
  retry,
  Subject,
  takeUntil,
  tap,
  throwError,
  UnsubscriptionError,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example, model } from './finalize';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';

/** The example's own pipeline over a download the test drives by hand, with all it does logged. */
function driven() {
  const download = new Subject<string>();
  const log: string[] = [];
  // The pipeline schedules nothing, so the scheduler it is handed stays idle.
  const { shown$, cleanup$ } = example.run({
    inputs: { download$: download },
    inner: {},
    scheduler: new TestScheduler(() => undefined),
  });
  cleanup$.subscribe((step) => log.push(String(step)));
  const view = shown$.subscribe({
    next: (part) => log.push(String(part)),
    error: () => log.push('error'),
    complete: () => log.push('complete'),
  });
  return { download, view, log };
}

it('runs the abandoned download against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the finalize row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:237');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/finalize.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'download$',
    'shown$',
    'cleanup$',
  ]);
});

it('names in the record the number of parts the view is shown', async () => {
  const { parameters } = (await loadStudy('rxc:237')).example;
  const shown = marbleModel(example).marbles.lines.find(({ label }) => label === 'shown$');
  const parts = shown?.events.filter(({ kind, delivered }) => kind === 'next' && delivered) ?? [];
  expect(parts).toHaveLength(Number(parameters['partsShown']));
});

it('cuts the download off when the view leaves, dropping the parts still to come', () => {
  const { lines } = marbleModel(example).marbles;
  const download = lines.find(({ label }) => label === 'download$');
  expect(download).toMatchObject({ subscribedAt: 0, unsubscribedAt: 7, cancelled: true });
  expect(
    download?.events.filter(({ delivered }) => !delivered).map(({ kind, key }) => `${kind} ${key}`),
  ).toEqual(['next c', 'next d', 'complete |']);
  // The view is not told anything: no completion or failure ever reaches shown$.
  const shown = lines.find(({ label }) => label === 'shown$');
  expect(shown).toMatchObject({ unsubscribedAt: 7, cancelled: true });
  expect(shown?.events.some(({ kind }) => kind !== 'next')).toBe(false);
});

it('tells the leaving view nothing and runs the clean-ups from the source outward, once', () => {
  const { download, view, log } = driven();
  download.next('part 1');
  view.unsubscribe();
  expect(log).toEqual(['part 1', 'released', 'hidden']);
  expect(download.observed).toBe(false);
  download.next('part 2');
  download.complete();
  expect(log).toHaveLength(3);
});

it('runs the same clean-ups after telling the view of a completion or a failure', () => {
  const ended = (end: (download: Subject<string>) => void) => {
    const { download, log } = driven();
    download.next('part 1');
    end(download);
    return log;
  };
  const cleanups = ['released', 'hidden'];
  expect(ended((download) => download.complete())).toEqual(['part 1', 'complete', ...cleanups]);
  expect(ended((download) => download.error(new Error('lost')))).toEqual([
    'part 1',
    'error',
    ...cleanups,
  ]);
});

it('runs on an unsubscription that a tap complete handler never hears', () => {
  const download = new Subject<string>();
  const log: string[] = [];
  const view = download
    .pipe(
      tap({ complete: () => log.push('tap complete') }),
      finalize(() => log.push('finalize')),
    )
    .subscribe();
  view.unsubscribe();
  expect(log).toEqual(['finalize']);
});

it('ends through takeUntil by completing the view first, then cleaning up above it', () => {
  const download = new Subject<string>();
  const cancel = new Subject<string>();
  const log: string[] = [];
  download
    .pipe(
      finalize(() => log.push('released')),
      takeUntil(cancel),
    )
    .subscribe({ complete: () => log.push('complete') });
  cancel.next('Cancel');
  expect(log).toEqual(['complete', 'released']);
});

it('throws a failing clean-up at the code that ended the subscription, never at the view', () => {
  const failures: unknown[] = [];
  const broken = () => {
    throw new Error('clean-up failed');
  };
  const watch = { error: (error: unknown) => failures.push(error) };
  // The download completes: the error is thrown at the code that completed it.
  const finished = new Subject<string>();
  finished.pipe(finalize(broken)).subscribe(watch);
  expect(() => finished.complete()).toThrow(UnsubscriptionError);
  // The view leaves: the error is thrown at the code that unsubscribed.
  const left = new Subject<string>();
  const view = left.pipe(finalize(broken)).subscribe(watch);
  expect(() => view.unsubscribe()).toThrow(UnsubscriptionError);
  expect(failures).toEqual([]);
});

it('cleans up after every attempt above a retry, and once below it', () => {
  let attempts = 0;
  const log: string[] = [];
  defer(() => (++attempts < 3 ? throwError(() => new Error('dropped')) : of('part 1')))
    .pipe(
      finalize(() => log.push('attempt over')),
      retry(2),
      finalize(() => log.push('all over')),
    )
    .subscribe((part) => log.push(part));
  expect(log).toEqual(['attempt over', 'attempt over', 'part 1', 'attempt over', 'all over']);
});

it('opens as the reader leaves and names both clean-ups, in order, in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe(
    'download$ is cut off; shown$ is cut off; cleanup$ emits r (released); cleanup$ emits h (hidden)',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Started', 0],
    ['First part', 2],
    ['Second part', 5],
    ['Reader leaves', 7],
  ]);
});
