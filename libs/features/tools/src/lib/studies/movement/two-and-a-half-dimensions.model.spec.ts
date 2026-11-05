import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { length } from '@dotln-angular/scene-engine';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import {
  calculateCourierStep,
  concourseHeight,
  courierStates,
  type HalfDimensionsParameters,
  initialCourierState,
  model,
} from './two-and-a-half-dimensions.model';

const example: HalfDimensionsParameters = {
  startX: 0,
  startZ: 0,
  targetX: 12,
  targetZ: 9,
  maxSpeed: 4,
  maxAcceleration: 4,
  rampStart: 4,
  rampRun: 4,
  ledgeRun: 0,
  rise: 3,
  timeStep: 0.25,
  steps: 24,
  bodyHeight: 1,
};
const parameters: StudyParameters = { ...example };
const runOf = (changed: StudyParameters = parameters): MotionStudyModel => {
  return model(changed, studyTranslate);
};

it('uses the assigned catalog row and the exact parameters worked here', async () => {
  const record = await createCatalogLoader().study('aifg-a:90');
  expect(record?.slug).toBe('two-and-a-half-dimensions');
  expect(record?.example.parameters).toEqual(example);
  expect(record?.pseudocode.executable?.module).toContain('two-and-a-half-dimensions.model.ts');
});

it('calls planar Seek on a 12/9/15 triangle and integrates the first quarter-second', () => {
  const first = calculateCourierStep(initialCourierState(example), example);
  expect(first.acceleration.x).toBeCloseTo(3.2, 12);
  expect(first.acceleration.y).toBeCloseTo(2.4, 12);
  expect(length(first.acceleration)).toBeCloseTo(4, 12);
  expect(first.next.velocity.x).toBeCloseTo(0.8, 12);
  expect(first.next.velocity.y).toBeCloseTo(0.6, 12);
  expect(first.next.x).toBeCloseTo(0.2, 12);
  expect(first.next.z).toBeCloseTo(0.15, 12);
  expect(first.next.height).toBe(0);
  expect(first.next.yaw).toBeCloseTo(Math.atan2(3, 4), 12);
});

it('stores changing height while every moving frame has the same yaw and an upright pose', () => {
  const states = courierStates(example);
  expect(states).toHaveLength(25);
  expect(concourseHeight(4, example)).toBe(0);
  expect(concourseHeight(6, example)).toBe(1.5);
  expect(concourseHeight(8, example)).toBe(3);
  expect(states[6].x).toBeCloseTo(3.6, 12);
  expect(states[6].height).toBe(0);
  expect(states[7].x).toBeCloseTo(4.4, 12);
  expect(states[7].height).toBeCloseTo(0.3, 12);
  expect(states[9].x).toBeCloseTo(6, 12);
  expect(states[9].height).toBeCloseTo(1.5, 12);
  for (const state of states) {
    expect(length(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
    expect(state.height).toBeGreaterThanOrEqual(0);
    expect(state.height).toBeLessThanOrEqual(example.rise);
    expect(state.pitch).toBe(0);
    expect(state.roll).toBe(0);
    if (length(state.velocity) > 0) expect(state.yaw).toBeCloseTo(Math.atan2(3, 4), 12);
  }
  const final = states[states.length - 1];
  expect(final).toMatchObject({
    x: 12,
    height: 3,
    z: 9,
    velocity: { x: 0, y: 0 },
  });
  expect(final.yaw).toBeCloseTo(Math.atan2(3, 4), 12);
  expect(courierStates(example)).toEqual(states);
});

it('exposes the ledge snap without changing any plan motion or yaw', () => {
  const ramp = courierStates(example);
  const ledge = courierStates(example, example.ledgeRun);
  expect(ledge.map(({ x, z, yaw, velocity }) => ({ x, z, yaw, velocity }))).toEqual(
    ramp.map(({ x, z, yaw, velocity }) => ({ x, z, yaw, velocity })),
  );
  expect(ledge[6].height).toBe(0);
  expect(ledge[7].height).toBe(3);
  expect(ledge[7].verticalSpeed).toBe(12);
  expect(Math.max(...ramp.map(({ verticalSpeed }) => verticalSpeed))).toBeCloseTo(2.4, 12);
  expect(Math.max(...ledge.map(({ verticalSpeed }) => verticalSpeed))).toBe(12);
  expect(runOf().comparison?.timeline.series[1].values[7]).toBe(12);
  expect(runOf().comparison?.findings.join(' ')).toContain('no contact test or jump');
});

it('connects plan, profile, chart and worked surface calculation at the same selected moment', () => {
  const run = runOf();
  expect(run.initialStep).toBe(7);
  const frame = run.motion.frames[run.initialStep];
  expect(frame.seconds).toBe(1.75);
  expect(frame.values).toMatchObject({
    x: '4.40',
    height: '0.30',
    z: '3.30',
    yaw: '36.87',
    pitch: '0.00',
    roll: '0.00',
  });
  expect(frame.note).toContain('without pitching');
  expect(frame.worked?.lines.join(' ')).toContain('(5.20 − 4.00) / 4.00');
  expect(run.motion.frames[0].worked?.lines[0]).toContain('(3.20, 2.40)');
  expect(run.timeline?.series[0].values).toEqual(
    courierStates(example).map(({ height }) => height),
  );
  for (const tick of run.motion.frames) {
    const upright = tick.links?.at(-1);
    expect(upright?.from.x).toBe(upright?.to.x);
    expect((upright?.from.y ?? 0) - (upright?.to.y ?? 0)).toBeCloseTo(example.bodyHeight, 12);
  }
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
});

it('draws a vertical ledge and keeps both views, arrows and surface links in bounds', () => {
  for (const rampRun of [0, 8]) {
    const run = runOf({ ...parameters, rampRun, rise: 6 });
    const bounds = run.motion.bounds;
    for (const frame of run.motion.frames) {
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
        ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({
          x: x + dx,
          y: y + dy,
        })),
      ];
      for (const point of points) {
        expect(point.x).toBeGreaterThanOrEqual(bounds.minX);
        expect(point.x).toBeLessThanOrEqual(bounds.maxX);
        expect(point.y).toBeGreaterThanOrEqual(bounds.minY);
        expect(point.y).toBeLessThanOrEqual(bounds.maxY);
      }
    }
    if (rampRun === 0) {
      const ledge = run.motion.frames[0].links?.[2];
      expect(ledge?.from.x).toBe(ledge?.to.x);
      expect(Math.abs((ledge?.from.y ?? 0) - (ledge?.to.y ?? 0))).toBe(6);
    }
  }
  expect(runOf({ ...parameters, rise: 0 }).comparison?.findings[1]).toContain('no height jump');
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
