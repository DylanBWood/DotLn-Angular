import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import {
  calculateKinematicArriveStep,
  type KinematicArriveParameters,
  kinematicArriveSamples,
  model,
} from './kinematic-arrive.model';

const example: KinematicArriveParameters = {
  start: 0,
  target: 11,
  maxSpeed: 4,
  timeToTarget: 1,
  satisfactionRadius: 0.2,
  timeStep: 0.5,
  steps: 32,
  shortTimeToTarget: 0.2,
};
const parameters: StudyParameters = { ...example };

function motionOf(input: StudyParameters = parameters): MotionStudyModel {
  return model(input, studyTranslate);
}

it('uses the catalogue example parameters', async () => {
  const record = await createCatalogLoader().study('aifg-a:101');
  expect(record?.example.parameters).toEqual(parameters);
  expect(record?.pseudocode.executable?.module).toContain('kinematic-arrive.model.ts');
});

it('caps the far request and assigns a smaller velocity directly near the marker', () => {
  expect(calculateKinematicArriveStep(0, example)).toEqual({
    offset: 11,
    distance: 11,
    requestedVelocity: 11,
    velocity: 4,
    accepted: false,
    nextPosition: 2,
  });
  expect(calculateKinematicArriveStep(8, example)).toMatchObject({
    requestedVelocity: 3,
    velocity: 3,
    nextPosition: 9.5,
  });
  expect(calculateKinematicArriveStep(9.5, example)).toMatchObject({
    velocity: 1.5,
    nextPosition: 10.25,
  });
});

it('accepts a residual error without snapping and handles the target and its far side', () => {
  expect(calculateKinematicArriveStep(10.8125, example)).toMatchObject({
    distance: 0.1875,
    accepted: true,
    velocity: 0,
    nextPosition: 10.8125,
  });
  expect(calculateKinematicArriveStep(11, example)).toMatchObject({
    distance: 0,
    velocity: 0,
    nextPosition: 11,
  });
  expect(
    calculateKinematicArriveStep(10.75, {
      ...example,
      satisfactionRadius: 0.25,
    }),
  ).toMatchObject({ accepted: true, velocity: 0, nextPosition: 10.75 });
  expect(calculateKinematicArriveStep(12, example)).toMatchObject({
    offset: -1,
    velocity: -1,
    nextPosition: 11.5,
  });
});

it('approaches monotonically, tapers velocity, then stays inside the accepted region', () => {
  const samples = kinematicArriveSamples(example);
  expect(samples).toHaveLength(example.steps + 1);
  expect(samples.slice(0, 9).map((sample) => sample.position)).toEqual([
    0, 2, 4, 6, 8, 9.5, 10.25, 10.625, 10.8125,
  ]);
  expect(samples.slice(8).every((sample) => sample.accepted && sample.velocity === 0)).toBe(true);
  expect(samples.at(-1)?.distance).toBe(0.1875);
  for (const [index, sample] of samples.entries()) {
    expect(Math.abs(sample.velocity)).toBeLessThanOrEqual(example.maxSpeed);
    expect(sample.position).toBeLessThanOrEqual(example.target);
    if (index > 0) expect(sample.distance).toBeLessThanOrEqual(samples[index - 1].distance);
  }
});

it('exposes the oscillation caused by changing only time to target', () => {
  const normal = kinematicArriveSamples(example);
  const short = kinematicArriveSamples(example, example.shortTimeToTarget);
  expect(short.slice(0, 5).map((sample) => sample.position)).toEqual(
    normal.slice(0, 5).map((sample) => sample.position),
  );
  expect(short.slice(5, 10).map((sample) => sample.position)).toEqual([10, 12, 10, 12, 10]);
  expect(short.every((sample) => !sample.accepted)).toBe(true);
  expect(short.slice(5).every((sample) => sample.distance === 1)).toBe(true);
  expect(short.some((sample) => sample.velocity < 0)).toBe(true);
  expect(1 - example.timeStep / example.shortTimeToTarget).toBe(-1.5);
  const uncapped = calculateKinematicArriveStep(10.5, example, example.shortTimeToTarget);
  expect(example.target - uncapped.nextPosition).toBe(
    uncapped.offset * (1 - example.timeStep / example.shortTimeToTarget),
  );
});

it('keeps the selected drawing, text, arithmetic and chart on the same update', () => {
  const run = motionOf();
  expect(run.initialStep).toBe(4);
  const frame = run.motion.frames[run.initialStep];
  expect(frame.seconds).toBe(2);
  expect(frame.bodies[0].x).toBe(8);
  expect(frame.vectors?.[0].dx).toBe(1.5);
  expect(frame.values).toMatchObject({
    position: '8.000',
    distance: '3.000',
    velocity: '3.000',
    nextPosition: '9.500',
    taperDistance: '4.000',
  });
  expect(frame.worked?.lines.join(' ')).toContain('3.000 / 1.000 = 3.000');
  expect(frame.worked?.lines.join(' ')).toContain('8.000 + 3.000 × 0.500 = 9.500');
  expect(run.timeline?.series[0].values[run.initialStep]).toBe(3);
  expect(run.comparison?.timeline.series[1].values[6]).toBe(12);
  expect(run.comparison?.findings.join(' ')).toContain('has not reached the accepted region');
  expect(run.moments).toContainEqual({ label: 'Place accepted', step: 8 });
});

it('recomputes changed inputs and keeps every drawing element in bounds', () => {
  const run = motionOf({
    ...parameters,
    timeToTarget: 2,
    satisfactionRadius: 1,
  });
  expect(run.motion.frames[0].values).toMatchObject({
    timeToTarget: '2.000',
    satisfactionRadius: '1.000',
    taperDistance: '8.000',
  });
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    for (const body of frame.bodies) {
      expect(body.x).toBeGreaterThanOrEqual(minX);
      expect(body.x).toBeLessThanOrEqual(maxX);
    }
    for (const zone of frame.zones ?? []) {
      expect(zone.x - zone.radius).toBeGreaterThanOrEqual(minX);
      expect(zone.x + zone.radius).toBeLessThanOrEqual(maxX);
      expect(zone.y - zone.radius).toBeGreaterThanOrEqual(minY);
      expect(zone.y + zone.radius).toBeLessThanOrEqual(maxY);
    }
  }
  expect(motionOf({ ...parameters, timeToTarget: 0.2 }).comparison?.findings).toEqual([
    'Both response times are equal, so the comparison runs coincide.',
  ]);
  expect(model(parameters, studyTranslate)).toEqual(model(parameters, studyTranslate));
});

it('translates presentation at the boundary while preserving computed motion', () => {
  const english = model(parameters, studyTranslate);
  const translated = model(
    parameters,
    (key, values) => `translated: ${studyTranslate(key, values)}`,
  );

  expect(translated.caption).toBe(`translated: ${english.caption}`);
  expect(translated.motion.frames[0].note).toMatch(/^translated: /);
  expect(translated.motion.frames[0].worked?.title).toMatch(/^translated: /);
  expect(translated.timeline?.title).toMatch(/^translated: /);
  expect(translated.comparison?.title).toMatch(/^translated: /);
  expect(translated.motion.bounds).toEqual(english.motion.bounds);
  expect(
    translated.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  ).toEqual(
    english.motion.frames.map(({ seconds, bodies }) => ({
      seconds,
      points: bodies.map(({ x, y }) => ({ x, y })),
    })),
  );
});
