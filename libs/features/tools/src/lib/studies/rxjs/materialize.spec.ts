import { catchError, dematerialize, materialize, of, throwError, toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './materialize';

const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

/** The records RxJS 7 emits, as plain objects with the hasValue flag it still sets. */
const next = (value: string) => ({ kind: 'N', value, hasValue: true });
const failure = (error: unknown) => ({ kind: 'E', error, hasValue: false });
const completion = { kind: 'C', hasValue: false };

it('runs the failing import example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the materialize row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:229');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/materialize.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual(['import$', 'log$']);
});

it('says in its parameters what the drawing shows', async () => {
  const { parameters } = (await loadStudy('rxc:229')).example;
  const { values, error } = example.inputs['import$'];
  expect(Object.values(values ?? {}).join(' and ')).toBe(parameters['rows']);
  expect(error).toBe(parameters['reason']);
  expect(example.outputs['log$'].values?.['e']).toEqual(failure(parameters['reason']));
});

it('turns the failure into a record and completes, and opens there', () => {
  const run = marbleModel(example);
  const { lines, frames } = run.marbles;
  const log = lines.find(({ label }) => label === 'log$');
  expect(log?.events.map(({ kind, frame }) => `${kind} ${frame}`)).toEqual([
    'next 1',
    'next 4',
    'next 7',
    'complete 7',
  ]);
  const telling = frames[7];
  expect(telling.frame).toBe(7);
  expect(telling.values['now']).toBe(
    'import$ errors with row 3 is unreadable; ' +
      'log$ emits e (kind E, error row 3 is unreadable, hasValue false); log$ completes',
  );
  expect(run.caption).toContain('The cross on import$ is its error');
  expect(run.moments.map(({ label, step }) => [label, frames[step].frame])).toEqual([
    ['First row', 1],
    ['Second row', 4],
    ['The failure, as a record', 7],
  ]);
});

it('emits Notification instances that carry hasValue beside kind and value', () => {
  const records: object[] = [];
  of('row 1')
    .pipe(materialize())
    .subscribe((record) => records.push(record));
  expect(records[0]).toMatchObject({ kind: 'N', value: 'row 1' });
  expect(records[0]).not.toEqual({ kind: 'N', value: 'row 1' });
  expect(records[0]).toEqual(next('row 1'));
  expect(records[0]?.constructor.name).toBe('Notification');
});

it('records a completion as a record of kind C before completing', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const import$ = cold('-a|', { a: 'row 1' });
    expectObservable(import$.pipe(materialize())).toBe('-a(c|)', {
      a: next('row 1'),
      c: completion,
    });
  });
});

it('leaves nothing for a later catchError to catch', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const import$ = cold('-a#', { a: 'row 1' }, 'broken');
    const caught$ = import$.pipe(
      materialize(),
      catchError(() => of('fallback')),
    );
    expectObservable(caught$).toBe('-a(e|)', { a: next('row 1'), e: failure('broken') });
  });
});

it('lets toArray keep the whole run, failure included, where toArray alone keeps nothing', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const import$ = cold('-a--b--#', { a: 'row 1', b: 'row 2' }, 'broken');
    expectObservable(import$.pipe(toArray())).toBe('-------#', undefined, 'broken');
    expectObservable(import$.pipe(materialize(), toArray())).toBe('-------(t|)', {
      t: [next('row 1'), next('row 2'), failure('broken')],
    });
  });
});

it('is undone by dematerialize', () => {
  scheduler().run(({ cold, expectObservable }) => {
    const { marbles, values, error } = example.inputs['import$'];
    const import$ = cold(marbles, values, error);
    expectObservable(import$.pipe(materialize(), dematerialize())).toBe(marbles, values, error);
  });
});

it('keeps an Error object as it was thrown, which JSON then writes as an empty object', () => {
  const records: unknown[] = [];
  throwError(() => new Error('row 3 is unreadable'))
    .pipe(materialize())
    .subscribe((record) => records.push(record));
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ kind: 'E', error: new Error('row 3 is unreadable') });
  expect(JSON.parse(JSON.stringify(records[0]))).toEqual({
    kind: 'E',
    error: {},
    hasValue: false,
  });
});
