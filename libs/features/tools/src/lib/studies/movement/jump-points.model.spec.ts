import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { loadStudy } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import {
  canTakeOff,
  jumpFlightDuration,
  jumpFlightPoint,
  jumpPadCentre,
  jumpPointFrames,
  type JumpPointsParameters,
  jumpRunUpStep,
  model,
} from './jump-points.model';

const record = await loadStudy('aifg-a:169');
const example: JumpPointsParameters = {
  startX: 0,
  lateStartX: 6,
  markerX: 7.5,
  initialVelocity: 0,
  requiredVelocity: 4,
  maxSpeed: 6,
  maxAcceleration: 4,
  responseTime: 0.25,
  positionTolerance: 0.1,
  velocityTolerance: 0.1,
  verticalVelocity: 5,
  gravity: 5,
  timeStep: 0.25,
  steps: 20,
  padHalfWidth: 0.5,
  arrowSeconds: 0.5,
  radius: 0.25,
};
const parameters: StudyParameters = { ...example };

it('uses the assigned record, exact example parameters and matching mechanism blocks', () => {
  expect(record.id).toBe('aifg-a:169');
  expect(record.slug).toBe('jump-points');
  expect(record.example.parameters).toEqual(example);
  expect(record.visual.model).toBe(record.pseudocode.executable.module);
  expect(record.pseudocode.rxjs).toBeNull();
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
});

it('uses the engine’s acceleration and works through the initial run-up by hand', () => {
  const first = jumpRunUpStep({ x: 0, velocity: 0 }, example);
  expect(first).toEqual({ requestedAcceleration: 16, acceleration: 4, velocity: 1, x: 0.25 });
  const body: SteeringBody = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: 6,
    maxAcceleration: 4,
    radius: 0.25,
    wanderAngle: 0,
  };
  expect(first.acceleration).toBe(matchVelocity(body, { x: 4, y: 0 }, 0.25).x);
  const states = jumpPointFrames(example);
  expect(states.slice(0, 5).map(({ x, velocity }) => ({ x, velocity }))).toEqual([
    { x: 0, velocity: 0 },
    { x: 0.25, velocity: 1 },
    { x: 0.75, velocity: 2 },
    { x: 1.5, velocity: 3 },
    { x: 2.5, velocity: 4 },
  ]);
  expect(states[9]).toMatchObject({
    seconds: 2.25,
    x: 7.5,
    velocity: 4,
    verticalVelocity: 5,
    phase: 'airborne',
    airTime: 0,
  });
  for (let index = 1; index <= 9; index++) {
    expect(states[index].velocity).toBeLessThanOrEqual(example.maxSpeed);
    expect(Math.abs(states[index].velocity - states[index - 1].velocity)).toBeLessThanOrEqual(
      example.maxAcceleration * example.timeStep,
    );
  }
});

it('requires both marker position and velocity, preserving the actual accepted horizontal speed', () => {
  expect(canTakeOff(7.5, 4, example)).toBe(true);
  expect(canTakeOff(7.5, 0, example)).toBe(false);
  expect(canTakeOff(6, 4, example)).toBe(false);
  expect(canTakeOff(7.55, 3.95, example)).toBe(true);
  const accepted = jumpPointFrames({ ...example, startX: 7.55, initialVelocity: 3.95 });
  expect(accepted[0]).toMatchObject({
    phase: 'airborne',
    x: 7.55,
    velocity: 3.95,
    verticalVelocity: 5,
  });
  expect(accepted[1].x).toBeCloseTo(7.55 + 3.95 * 0.25, 10);
  expect(accepted[1].velocity).toBe(3.95);
});

it('follows the exact equal-height trajectory and reaches the receiving pad', () => {
  expect(jumpFlightDuration(example)).toBe(2);
  expect(jumpPadCentre(example)).toBe(15.5);
  expect(jumpFlightPoint(7.5, 4, 0.25, example)).toEqual({
    x: 8.5,
    height: 1.09375,
    verticalVelocity: 3.75,
  });
  expect(jumpFlightPoint(7.5, 4, 1, example)).toEqual({
    x: 11.5,
    height: 2.5,
    verticalVelocity: 0,
  });
  const states = jumpPointFrames(example);
  expect(states).toHaveLength(18);
  expect(states[13]).toMatchObject({
    seconds: 3.25,
    x: 11.5,
    height: 2.5,
    verticalVelocity: 0,
    phase: 'airborne',
  });
  expect(states[17]).toMatchObject({
    seconds: 4.25,
    x: 15.5,
    height: 0,
    velocity: 4,
    verticalVelocity: -5,
    phase: 'landed',
  });
  expect(Math.abs(states[17].x - jumpPadCentre(example))).toBeLessThanOrEqual(example.padHalfWidth);
  expect(states.slice(9).every(({ velocity }) => velocity === 4)).toBe(true);
  expect(jumpPointFrames(example)).toEqual(states);
});

it('rejects the late start at the correct position because its velocity is still wrong', () => {
  const late = jumpPointFrames(example, example.lateStartX);
  expect(late).toHaveLength(4);
  expect(late[3]).toMatchObject({
    seconds: 0.75,
    x: 7.5,
    velocity: 3,
    verticalVelocity: 0,
    phase: 'rejected',
  });
  expect(Math.abs(late[3].x - example.markerX)).toBe(0);
  expect(Math.abs(late[3].velocity - example.requiredVelocity)).toBe(1);
  expect(late.every(({ height, takeoffX }) => height === 0 && takeoffX === null)).toBe(true);
  expect(model(parameters).comparison?.findings[0]).toContain(
    'rejects launch at 7.50 m with velocity error 1.00 m/s',
  );
  const series = model(parameters).comparison?.timeline.series[1].values ?? [];
  expect(series.slice(3).every((value) => value === 1)).toBe(true);
});

it('exposes sampled marker skips, unreachable speed and a tolerance-accepted pad miss', () => {
  const skipped = jumpPointFrames({ ...example, markerX: 8 });
  expect(skipped[skipped.length - 1]).toMatchObject({ x: 8.5, velocity: 4, phase: 'rejected' });
  expect(skipped.some(({ phase }) => phase === 'airborne')).toBe(false);
  const capped = jumpPointFrames({ ...example, maxSpeed: 2 });
  expect(capped.every(({ velocity }) => velocity <= 2)).toBe(true);
  expect(capped[capped.length - 1].phase).toBe('rejected');
  const narrow = { ...example, startX: 7.55, initialVelocity: 3.95, padHalfWidth: 0.01 };
  const accepted = jumpPointFrames(narrow);
  const end = accepted[accepted.length - 1];
  expect(accepted[0].phase).toBe('airborne');
  expect(end.phase).toBe('landed');
  expect(end.x).toBeCloseTo(15.45, 10);
  expect(Math.abs(end.x - jumpPadCentre(narrow))).toBeGreaterThan(narrow.padHalfWidth);
  expect(
    model({
      ...parameters,
      startX: 7.55,
      initialVelocity: 3.95,
      padHalfWidth: 0.01,
    }).motion.frames.at(-1)?.note,
  ).toContain('outside the receiving pad');
});

it('keeps a bounded unfinished run honest instead of inventing a take-off or landing', () => {
  const short = jumpPointFrames({ ...example, steps: 2 });
  expect(short).toHaveLength(3);
  expect(short[2].phase).toBe('run-up');
  expect(model({ ...parameters, steps: 2 }).comparison?.findings[0]).toContain(
    'bounded horizon in the run-up phase',
  );
});

it('keeps arithmetic, charts, labels, moments and accessible prose consistent across live inputs', () => {
  const run = model(parameters);
  expect(run.initialStep).toBe(9);
  expect(run.motion.frames[9].values).toMatchObject({
    phase: 'airborne',
    x: '7.50',
    vx: '4.00',
    positionError: '0.00',
    velocityError: '0.00',
    flightDuration: '2.00',
    padCentre: '15.50',
  });
  expect(run.motion.frames[0].worked?.lines[0]).toContain('(4.00 − 0.00) / 0.25 = 16.00');
  expect(run.motion.frames[13].worked?.lines.join(' ')).toContain(
    '5.00 × 1.00 − 5.00 × 1.00² / 2 = 2.50',
  );
  expect(motionDrawing(run.motion, run.initialStep).bodies[0].label).toBe('Finch');
  const texts = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.limits,
    ...record.mechanism.steps.map(({ text }) => text),
  ];
  const offered = run.inputs ?? [];
  const cases = [
    parameters,
    ...offered.flatMap(({ name, min, max }) =>
      [min, max].map((value) => ({ ...parameters, [name]: value })),
    ),
  ];
  for (const changed of cases) {
    const view = model(changed);
    expect(view.motion.frames.length).toBeGreaterThan(1);
    expect(view.motion.frames.length).toBeLessThanOrEqual(240);
    expect(model(changed)).toEqual(view);
    for (const moment of view.moments) expect(view.motion.frames[moment.step]).toBeDefined();
    for (const frame of view.motion.frames) {
      for (const text of texts) expect(placeholdersIn(fillValues(text, frame.values))).toEqual([]);
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
      ];
      for (const { x, y } of points) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(view.motion.bounds.minX);
        expect(x).toBeLessThanOrEqual(view.motion.bounds.maxX);
        expect(y).toBeGreaterThanOrEqual(view.motion.bounds.minY);
        expect(y).toBeLessThanOrEqual(view.motion.bounds.maxY);
      }
    }
    for (const chart of [view.timeline, view.comparison?.timeline]) {
      if (!chart) throw new Error('Run-up and comparison charts are required.');
      for (const series of chart.series) {
        expect(series.values).toHaveLength(chart.seconds.length);
        expect(series.values.every(Number.isFinite)).toBe(true);
      }
      expect(
        timelineDrawing(chart, view.initialStep).series.every(
          ({ points }) => !/NaN|Infinity/.test(points),
        ),
      ).toBe(true);
    }
  }
});
