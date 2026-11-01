import {
  animationFrameScheduler,
  asapScheduler,
  asyncScheduler,
  auditTime,
  from,
  observeOn,
  of,
  scheduled,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { loadStudy } from '../../../../testing/src';
import { marblesDrawing } from '../../composites/study-visuals/marbles/marbles-drawing';
import { expectMarbleExample } from './marble-testing';
import { marbleModel } from './marbles';
import { example, model } from './observe-on';

const { progress$: progress, repaint } = example.inputs;
const paints = example.animate ?? '';

const testScheduler = () =>
  new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

it('runs the upload example against the marbles the drawing shows', () => {
  expectMarbleExample(example);
});

it('attaches the record to the observeOn row and reads its code from this module', async () => {
  const record = await loadStudy('rxc:230');
  expect(record.pseudocode.executable.module).toBe(
    'libs/features/tools/src/lib/studies/rxjs/observe-on.ts',
  );
  expect(record.visual.family).toBe('marbles');
  const run = model(record.example.parameters);
  expect(run.family).toBe('marbles');
  expect(marbleModel(example).marbles.lines.map(({ label }) => label)).toEqual([
    'progress$',
    'repaint',
    'bar$',
  ]);
  // The lane a reader sees is the string the animation frames run on.
  expect(example.animate).toBe(repaint.marbles);
});

it('names in its parameters the reports, the failure and the paint interval the marbles declare', async () => {
  const { parameters } = (await loadStudy('rxc:230')).example;
  const { marbles } = marbleModel(example);
  const line = (label: string) => marbles.lines.find((candidate) => candidate.label === label);
  const reports = line('progress$')?.events.filter(({ kind }) => kind === 'next') ?? [];
  expect(parameters['reports']).toBe(
    `${reports
      .slice(0, -1)
      .map(({ value }) => value)
      .join(', ')} and ${reports[reports.length - 1]?.value}`,
  );
  expect(parameters['failure']).toBe(progress.error);
  const frames = line('repaint')?.events.map(({ frame }) => frame) ?? [];
  expect(frames.slice(1).map((frame, index) => frame - frames[index])).toEqual([
    parameters['paintEvery'],
  ]);
});

it('holds every report and the error until a paint, and delivers them in order', () => {
  const { marbles } = marbleModel(example);
  const heard = marbles.lines
    .find(({ label }) => label === 'bar$')
    ?.events.map(({ frame, kind, value }) => `${frame} ${kind} ${value}`);
  expect(heard).toEqual(['3 next 10%', '3 next 30%', '7 next 60%', '7 error connection lost']);
  // The upload's own subscription ends when it fails, a frame before the bar hears the failure.
  const source = marbles.lines.find(({ label }) => label === 'progress$');
  expect(source).toMatchObject({ subscribedAt: 0, unsubscribedAt: 6, cancelled: false });
  // Every event of the diagram is received, and every frame is a step.
  expect(marbles.lines.flatMap(({ events }) => events).every(({ delivered }) => delivered)).toBe(
    true,
  );
  expect(marbles.frames.map(({ frame }) => frame)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});

it('tells of the first paint and names each delivery in the frame’s sentence', () => {
  const run = marbleModel(example);
  const telling = run.marbles.frames[3];
  expect(telling.frame).toBe(3);
  expect(telling.values['now']).toBe(
    'repaint emits p (the browser paints); bar$ emits a (10%); bar$ emits b (30%)',
  );
  expect(run.moments.map(({ label, step }) => [label, run.marbles.frames[step].frame])).toEqual([
    ['Reports queue', 2],
    ['First paint', 3],
    ['Upload fails', 6],
    ['Second paint', 7],
  ]);
  expect(run.marbles.frames[run.marbles.frames.length - 1].values['delivered']).toBe(
    'a (10%), b (30%), c (60%)',
  );
});

// The limits the record states, each run on the same reports and paints.

it('auditTime keeps only the newest report per paint, but lets the error through at once', () => {
  testScheduler().run(({ animate, cold, expectObservable }) => {
    animate(paints);
    const progress$ = cold(progress.marbles, progress.values, progress.error);
    expectObservable(progress$.pipe(auditTime(0, animationFrameScheduler))).toBe(
      '---b--#',
      progress.values,
      progress.error,
    );
  });
});

it('delivers a synchronous burst in one paint; only a scheduled source spreads it over paints', () => {
  const reports = ['10%', '30%', '60%'];
  const values = { a: '10%', b: '30%', c: '60%' };
  const morePaints = '---p---p---p---p';
  testScheduler().run(({ animate, expectObservable }) => {
    animate(morePaints);
    expectObservable(from(reports).pipe(observeOn(animationFrameScheduler))).toBe(
      '---(abc|)',
      values,
    );
  });
  testScheduler().run(({ animate, expectObservable }) => {
    animate(morePaints);
    expectObservable(scheduled(reports, animationFrameScheduler)).toBe('---a---b---c---|', values);
  });
});

it('with a delay, animationFrameScheduler waits on a timer and no paint is needed', () => {
  testScheduler().run(({ cold, expectObservable }) => {
    // No animate call: a delivery that asked for an animation frame would fail this run.
    const progress$ = cold(progress.marbles, progress.values, progress.error);
    expectObservable(progress$.pipe(observeOn(animationFrameScheduler, 2))).toBe(
      '---ab--c#',
      progress.values,
      progress.error,
    );
  });
});

it('with asapScheduler or asyncScheduler, the marbles cannot show the move: it stays in the frame', () => {
  for (const scheduler of [asapScheduler, asyncScheduler])
    testScheduler().run(({ cold, expectObservable }) => {
      const progress$ = cold(progress.marbles, progress.values, progress.error);
      expectObservable(progress$.pipe(observeOn(scheduler))).toBe(
        progress.marbles,
        progress.values,
        progress.error,
      );
    });
});

it('with asapScheduler, delivers only after the synchronous code that subscribed', async () => {
  const log: string[] = [];
  of('10%')
    .pipe(observeOn(asapScheduler))
    .subscribe((report) => log.push(`bar hears ${report}`));
  log.push('subscribe has returned');
  expect(log).toEqual(['subscribe has returned']);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(log).toEqual(['subscribe has returned', 'bar hears 10%']);
});

it('cancels what is still queued when the bar unsubscribes before the paint', () => {
  testScheduler().run(({ animate, cold, expectObservable }) => {
    animate(paints);
    const progress$ = cold(progress.marbles, progress.values, progress.error);
    expectObservable(progress$.pipe(observeOn(animationFrameScheduler)), '^-!').toBe('');
  });
});

it('rides no value down at a paint: the reports left progress$ frames earlier and waited', () => {
  const { marbles } = marbleModel(example);
  const bar = marbles.lines.find(({ id }) => id === 'bar$');
  expect(bar?.events.filter(({ kind }) => kind === 'next').map(({ from }) => from)).toEqual([
    undefined,
    undefined,
    undefined,
  ]);
  expect(marblesDrawing(marbles, 3).couriers).toEqual([]);
  expect(marblesDrawing(marbles, 7).couriers).toEqual([]);
});
