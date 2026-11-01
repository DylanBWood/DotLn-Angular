import type { Observable } from 'rxjs';
import { type RunHelpers, TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example, model } from './exhaust-map';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';

/** A scheduler whose assertions fail the spec, as the marble helper's does. */
const testScheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

/** The example's presses, through the example's own pipeline, against saves the test supplies. */
function runWithSaves(
  scheduler: TestScheduler,
  { cold }: RunHelpers,
  saves: Readonly<Record<string, Observable<unknown>>>,
) {
  const press = example.inputs['press$'];
  const press$ = cold(press.marbles, press.values);
  return example.run({ inputs: { press$ }, inner: saves, scheduler })['saved$'];
}

it('runs the Save button example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the exhaustMap row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:149');
  expect(record.slug).toBe('exhaust-map');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/exhaust-map.ts',
  );
  expect(record.visual.family).toBe('marbles');
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'press$',
    'save(draft 1)',
    'save(draft 3)',
    'saved$',
  ]);
});

it('states the timing the marbles run: the drafts pressed and when a save answers and ends', async () => {
  const { parameters } = (await loadStudy('rxc:149')).example;
  const drafts = Object.values(example.inputs['press$'].values ?? {}).map(String);
  expect(parameters['drafts']).toBe(`${drafts.slice(0, -1).join(', ')} and ${drafts.at(-1)}`);
  const { marbles } = marbleModel(example);
  for (const save of marbles.lines.filter(({ role }) => role === 'inner')) {
    const started = save.subscribedAt ?? 0;
    const answer = save.events.find(({ kind }) => kind === 'next');
    const end = save.events.find(({ kind }) => kind === 'complete');
    expect(answer && answer.frame - started).toBe(parameters['answersAfter']);
    expect(end && end.frame - started).toBe(parameters['completesAfter']);
  }
});

it('calls save only for the drafts it takes, and opens nothing for a press it turns away', () => {
  const asked: string[] = [];
  const scheduler = testScheduler();
  scheduler.run((helpers) => {
    const saves: Readonly<Record<string, Observable<unknown>>> = {
      'draft 1': helpers.cold('----1|', { 1: 'draft 1 saved' }),
      'draft 3': helpers.cold('----3|', { 3: 'draft 3 saved' }),
    };
    const logged = new Proxy(saves, {
      get: (target, draft) => {
        asked.push(String(draft));
        return target[String(draft)];
      },
    });
    const saved$ = runWithSaves(scheduler, helpers, logged);
    helpers.expectObservable(saved$).toBe('-----1------3|', example.outputs['saved$'].values);
  });
  expect(asked).toEqual(['draft 1', 'draft 3']);
  const { marbles } = marbleModel(example);
  const opened = marbles.lines
    .filter(({ role }) => role === 'inner')
    .map(({ subscribedAt }) => subscribedAt);
  expect(opened).toEqual([1, 8]);
  const presses = marbles.lines.find(({ label }) => label === 'press$');
  const pressedAt = presses?.events.filter(({ kind }) => kind === 'next').map(({ frame }) => frame);
  expect(pressedAt).toEqual([1, 3, 8, 10]);
});

it('stays busy after a save answers until that save completes', () => {
  const asked: string[] = [];
  const scheduler = testScheduler();
  scheduler.run((helpers) => {
    // This save answers at once but completes later, so the second press still finds it running.
    const saves: Readonly<Record<string, Observable<unknown>>> = {
      'draft 1': helpers.cold('-1---|'),
      'draft 3': helpers.cold('----3|'),
    };
    const logged = new Proxy(saves, {
      get: (target, draft) => {
        asked.push(String(draft));
        return target[String(draft)];
      },
    });
    helpers.expectObservable(runWithSaves(scheduler, helpers, logged)).toBe('--1---------3|');
  });
  expect(asked).toEqual(['draft 1', 'draft 3']);
});

it('keeps the output open after the presses complete until the running save completes', () => {
  const { marbles } = marbleModel(example);
  const end = (label: string) =>
    marbles.lines
      .find((line) => line.label === label)
      ?.events.find(({ kind }) => kind === 'complete')?.frame;
  expect(end('press$')).toBe(11);
  expect(end('save(draft 3)')).toBe(13);
  expect(end('saved$')).toBe(13);
  expect(marbles.lines.every(({ cancelled }) => !cancelled)).toBe(true);
});

it('tells of the press that arrives while a save runs and names each moment', () => {
  const run = marbleModel(example);
  expect(run.marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 14 }, (_, frame) => frame),
  );
  expect(run.caption).toContain('save was never called for b or d');
  const telling = run.marbles.frames[3];
  expect(telling.frame).toBe(3);
  expect(telling.values['now']).toBe('press$ emits b (draft 2)');
  expect(telling.note).toContain('opens nothing');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['draft 1 opens a save', 1],
    ['draft 2 while busy', 3],
    ['draft 3 opens a save', 8],
    ['draft 4 while busy', 10],
    ['Done', 13],
  ]);
  expect(run.marbles.frames.at(-1)?.values['delivered']).toBe(
    '1 (draft 1 saved), 3 (draft 3 saved)',
  );
});

it('turns away every later press when a save never completes, as the limits say', () => {
  const scheduler = testScheduler();
  scheduler.run((helpers) => {
    const saves = { 'draft 1': helpers.cold('----1-'), 'draft 3': helpers.cold('----3|') };
    const saved$ = runWithSaves(scheduler, helpers, saves);
    helpers.expectObservable(saved$).toBe('-----1');
    helpers.expectSubscriptions(saves['draft 3'].subscriptions).toBe([]);
  });
});

it('ends the output for every later press when a save fails, as the limits say', () => {
  const scheduler = testScheduler();
  scheduler.run((helpers) => {
    const saves = {
      'draft 1': helpers.cold('---#', undefined, 'refused'),
      'draft 3': helpers.cold('----3|'),
    };
    const saved$ = runWithSaves(scheduler, helpers, saves);
    helpers.expectObservable(saved$).toBe('----#', undefined, 'refused');
    helpers.expectSubscriptions(saves['draft 3'].subscriptions).toBe([]);
  });
});
