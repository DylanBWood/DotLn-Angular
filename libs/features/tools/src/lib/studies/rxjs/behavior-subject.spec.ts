import {
  BehaviorSubject,
  distinctUntilChanged,
  ObjectUnsubscribedError,
  type Observable,
  ReplaySubject,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { example, model } from './behavior-subject';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';

/** One line of the drawing, by its label. */
const lineOf = (label: string) => {
  const line = marbleModel(example).marbles.lines.find((candidate) => candidate.label === label);
  if (line === undefined) throw new Error(`The drawing has no line labelled ${label}.`);
  return line;
};

/** What one line of the drawing hears, as frame and value. */
const heardOn = (label: string) =>
  lineOf(label)
    .events.filter(({ delivered }) => delivered)
    .map(({ frame, kind, value }) => `${frame} ${kind === 'next' ? value : kind}`);

/** Everything a listener is told, in order, by a stream it subscribes to now. */
const toldBy = (stream$: Observable<string>) => {
  const told: unknown[] = [];
  stream$.subscribe({
    next: (value) => told.push(value),
    error: (error: unknown) => told.push(error),
    complete: () => told.push('complete'),
  });
  return told;
};

it('runs the Play and Pause example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the BehaviorSubject row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:62');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/behavior-subject.ts',
  );
  expect(record.visual.family).toBe('marbles');
  // The prose's initial status is the button's first value, and its frame the panel's.
  expect(record.example.parameters).toEqual({
    initial: 'paused',
    panelOpensAt: lineOf('panel$').subscribedAt,
  });
  expect(heardOn('button$')[0]).toBe(`0 ${record.example.parameters['initial']}`);
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  if (run.family !== 'marbles') throw new Error('The model is not a marble diagram.');
  expect(run.marbles.lines.map(({ label }) => label)).toEqual(['presses$', 'button$', 'panel$']);
});

it('hands each new subscriber the held status at once and passes on a repeat', () => {
  expect(heardOn('button$')).toEqual(['0 paused', '3 running', '7 running', '10 paused']);
  // The panel learns how things stand at frame 5, and nothing about the paused before it.
  expect(heardOn('panel$')).toEqual(['5 running', '7 running', '10 paused']);
  expect(lineOf('panel$').subscribedAt).toBe(5);
});

it('tells of the panel being handed the held status and names each moment', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[5];
  expect(telling.frame).toBe(5);
  // Subscribing and being handed the held value happen in the same frame.
  expect(telling.values['now']).toBe('panel$ subscribes; panel$ emits r (running)');
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Starts paused', 0],
    ['Play', 3],
    ['Panel subscribes', 5],
    ['Play again', 7],
    ['Pause', 10],
  ]);
  // Every frame is a step; every frame where something happens has a sentence of its own.
  expect(run.marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 11 }, (_, frame) => frame),
  );
  for (const frame of run.marbles.frames)
    if (frame.values['now'] === 'nothing new happens') expect(frame.note).toMatch(/^At frame/);
    else expect(frame.note).not.toMatch(/^At frame/);
});

it('drops the second Play when distinctUntilChanged follows it, as the scene clock does', () => {
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  scheduler.run(({ cold, expectObservable }) => {
    const { marbles, values } = example.inputs['presses$'];
    const status = new BehaviorSubject('paused');
    // The presses are strings, as the module casts them.
    (cold(marbles, values) as Observable<string>).subscribe(status);
    expectObservable(status.pipe(distinctUntilChanged())).toBe('p--r------p', {
      p: 'paused',
      r: 'running',
    });
  });
});

it('still answers value after completion but hands a later subscriber only the completion', () => {
  const status = new BehaviorSubject('paused');
  status.next('running');
  expect(status.value).toBe('running');
  status.complete();
  expect(status.value).toBe('running');
  expect(toldBy(status)).toEqual(['complete']);
  // A ReplaySubject of one replays its last value before the completion.
  const replayed = new ReplaySubject<string>(1);
  replayed.next('paused');
  replayed.next('running');
  replayed.complete();
  expect(toldBy(replayed)).toEqual(['running', 'complete']);
  // And it tells a subscriber nothing until a real value arrives.
  expect(toldBy(new ReplaySubject<string>(1))).toEqual([]);
});

it('hands a subscriber after an error only the error, and fails a read once errored or unsubscribed', () => {
  const failed = new BehaviorSubject('paused');
  const failure = new Error('the clock failed');
  failed.error(failure);
  expect(toldBy(failed)).toEqual([failure]);
  expect(() => failed.value).toThrow(failure);
  const torn = new BehaviorSubject('paused');
  torn.unsubscribe();
  expect(() => torn.value).toThrow(ObjectUnsubscribedError);
});
