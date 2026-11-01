import { defer, ObjectUnsubscribedError, of, share, Subject } from 'rxjs';

import { loadStudy } from '../../../../testing/src';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './subject';

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
const toldBy = (stream$: Subject<string>) => {
  const told: unknown[] = [];
  stream$.subscribe({
    next: (value) => told.push(value),
    error: (error: unknown) => told.push(error),
    complete: () => told.push('complete'),
  });
  return told;
};

it('runs the Step button example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Subject row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:5');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/subject.ts',
  );
  expect(record.visual.family).toBe('marbles');
  // The frames the prose names are the frames the listeners subscribe at.
  expect(record.example.parameters).toEqual({
    presses: 'press 1, press 2 and press 3',
    logOpensAt: lineOf('log$').subscribedAt,
    latecomerArrivesAt: lineOf('latecomer$').subscribedAt,
  });
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  if (run.family !== 'marbles') throw new Error('The model is not a marble diagram.');
  expect(run.marbles.lines.map(({ label }) => label)).toEqual([
    'presses$',
    'painter$',
    'log$',
    'latecomer$',
  ]);
});

it('hands each press to everyone listening at that frame and nothing from before they listened', () => {
  expect(heardOn('painter$')).toEqual(['2 press 1', '6 press 2', '10 press 3', '14 complete']);
  expect(heardOn('log$')).toEqual(['6 press 2', '10 press 3', '14 complete']);
  // After the end, a newcomer is told of the end at once and hears no press.
  expect(heardOn('latecomer$')).toEqual(['16 complete']);
  expect(lineOf('painter$').subscribedAt).toBeUndefined();
  expect(lineOf('log$').subscribedAt).toBe(4);
  expect(lineOf('latecomer$').subscribedAt).toBe(16);
  // The presses are subscribed to once, however many listen.
  expect(lineOf('presses$')).toMatchObject({
    subscribedAt: 0,
    unsubscribedAt: 14,
    cancelled: false,
  });
});

it('tells of press 2 reaching both listeners and names each moment', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[6];
  expect(telling.frame).toBe(6);
  expect(telling.values['now']).toBe(
    'presses$ emits b (press 2); painter$ emits b (press 2); log$ emits b (press 2)',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Press 1', 2],
    ['Log subscribes', 4],
    ['Press 2 to both', 6],
    ['Presses end', 14],
    ['Latecomer', 16],
  ]);
  // Every frame is a step; the frame's sentence names each listener as it subscribes.
  expect(run.marbles.frames.map(({ frame }) => frame)).toEqual(
    Array.from({ length: 17 }, (_, frame) => frame),
  );
  expect(run.marbles.frames[4].values['now']).toBe('log$ subscribes');
  expect(run.marbles.frames[16].values['now']).toBe('latecomer$ subscribes; latecomer$ completes');
  // Every frame where something happens has a sentence of its own; the others are quiet.
  for (const frame of run.marbles.frames)
    if (frame.values['now'] === 'nothing new happens') expect(frame.note).toMatch(/^At frame/);
    else expect(frame.note).not.toMatch(/^At frame/);
});

it('runs a cold source once for each subscriber, and once in all when they share a subject', () => {
  let runs = 0;
  const presses$ = defer(() => {
    runs += 1;
    return of('press 1');
  });
  presses$.subscribe();
  presses$.subscribe();
  expect(runs).toBe(2);
  const steps = new Subject<string>();
  const heard: string[] = [];
  steps.subscribe((press) => heard.push(`painter hears ${press}`));
  steps.subscribe((press) => heard.push(`log hears ${press}`));
  presses$.subscribe(steps);
  expect(runs).toBe(3);
  expect(heard).toEqual(['painter hears press 1', 'log hears press 1']);
});

it('lets share make the subject that shares one execution', () => {
  let runs = 0;
  const button = new Subject<string>();
  const presses$ = defer(() => {
    runs += 1;
    return button;
  }).pipe(share());
  const heard: string[] = [];
  presses$.subscribe((press) => heard.push(`painter hears ${press}`));
  presses$.subscribe((press) => heard.push(`log hears ${press}`));
  button.next('press 1');
  expect(runs).toBe(1);
  expect(heard).toEqual(['painter hears press 1', 'log hears press 1']);
});

it('stays closed once completed, ignoring later presses and telling newcomers at once', () => {
  const steps = new Subject<string>();
  steps.complete();
  steps.next('press 4');
  expect(toldBy(steps)).toEqual(['complete']);
});

it('passes an error to every listener and to anyone who subscribes afterwards', () => {
  const steps = new Subject<string>();
  const failure = new Error('the button failed');
  const painter = toldBy(steps);
  const log = toldBy(steps);
  steps.error(failure);
  steps.next('press 1');
  expect(painter).toEqual([failure]);
  expect(log).toEqual([failure]);
  expect(toldBy(steps)).toEqual([failure]);
});

it('drops its listeners without a word, and then throws, once the subject itself is unsubscribed', () => {
  const steps = new Subject<string>();
  const painter = toldBy(steps);
  steps.unsubscribe();
  expect(painter).toEqual([]);
  expect(() => steps.next('press 1')).toThrow(ObjectUnsubscribedError);
});

it('hides next, error and complete behind asObservable', () => {
  const shown = new Subject<string>().asObservable();
  expect('next' in shown || 'error' in shown || 'complete' in shown).toBe(false);
});

it('delivers a value pushed from inside a handler before the later listeners hear the first', () => {
  const steps = new Subject<string>();
  const heard: string[] = [];
  steps.subscribe((press) => {
    heard.push(`first hears ${press}`);
    if (press === 'press 1') steps.next('press 2');
  });
  steps.subscribe((press) => heard.push(`second hears ${press}`));
  steps.next('press 1');
  expect(heard).toEqual([
    'first hears press 1',
    'first hears press 2',
    'second hears press 2',
    'second hears press 1',
  ]);
});
