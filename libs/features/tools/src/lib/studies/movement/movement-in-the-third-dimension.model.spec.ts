import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import {
  calculateThirdDimensionStep,
  droneAxes,
  initialDroneState,
  model,
  type ThirdDimensionParameters,
  thirdDimensionStates,
  volumeLength,
} from './movement-in-the-third-dimension.model';

const example: ThirdDimensionParameters = {
  startX: 0,
  startY: 0,
  startZ: 0,
  targetX: 9,
  targetY: 8,
  targetZ: 12,
  maxSpeed: 4,
  maxAcceleration: 4,
  timeStep: 0.25,
  steps: 24,
  rollDegrees: 30,
  verticalWeight: 1,
  flatVerticalWeight: 0,
  wingSpan: 2,
};
const parameters: StudyParameters = { ...example };
const runOf = (changed: StudyParameters = parameters): MotionStudyModel => {
  return model(changed, studyTranslate);
};

it('uses the assigned catalog record and the exact parameters worked here', async () => {
  const record = await createCatalogLoader().study('aifg-a:196');
  expect(record?.slug).toBe('movement-in-the-third-dimension');
  expect(record?.example.parameters).toEqual(example);
  expect(record?.pseudocode.executable?.module).toContain(
    'movement-in-the-third-dimension.model.ts',
  );
});

it('normalises all three offset components and integrates one hand-checkable step', () => {
  const first = calculateThirdDimensionStep(initialDroneState(example), example);
  // sqrt(9² + 8² + 12²) = 17; acceleration has length 4, not 4 on each axis.
  expect(first.distance).toBe(17);
  expect(first.offset).toEqual({ x: 9, y: 8, z: 12 });
  expect(first.acceleration.x).toBeCloseTo(36 / 17, 12);
  expect(first.acceleration.y).toBeCloseTo(32 / 17, 12);
  expect(first.acceleration.z).toBeCloseTo(48 / 17, 12);
  expect(volumeLength(first.acceleration)).toBeCloseTo(4, 12);
  expect(first.next.velocity.x).toBeCloseTo(9 / 17, 12);
  expect(first.next.velocity.y).toBeCloseTo(8 / 17, 12);
  expect(first.next.velocity.z).toBeCloseTo(12 / 17, 12);
  expect(first.next.position.x).toBeCloseTo(9 / 68, 12);
  expect(first.next.position.y).toBeCloseTo(2 / 17, 12);
  expect(first.next.position.z).toBeCloseTo(3 / 17, 12);
  expect(first.next.yaw).toBeCloseTo(Math.atan2(12, 9), 12);
  expect(first.next.pitch).toBeCloseTo(Math.atan2(8, 15), 12);
  expect(first.next.roll).toBeCloseTo(Math.PI / 6, 12);
});

it('caps total speed and reaches the elevated beacon with a retained pose at rest', () => {
  const states = thirdDimensionStates(example);
  expect(states).toHaveLength(example.steps + 1);
  for (const state of states) {
    expect(volumeLength(state.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-12);
    expect(state.position.y).toBeGreaterThanOrEqual(0);
    expect(state.position.y).toBeLessThanOrEqual(example.targetY);
  }
  expect(volumeLength(states[4].velocity)).toBeCloseTo(4, 12);
  expect(volumeLength(states[4].position)).toBeCloseTo(2.5, 12);
  const final = states[states.length - 1];
  expect(final.position).toEqual({ x: 9, y: 8, z: 12 });
  expect(final.velocity).toEqual({ x: 0, y: 0, z: 0 });
  expect(final.yaw).toBeCloseTo(Math.atan2(12, 9), 12);
  expect(final.pitch).toBeCloseTo(Math.atan2(8, 15), 12);
  expect(calculateThirdDimensionStep(final, example).next).toEqual(final);
  expect(thirdDimensionStates(example)).toEqual(states);
});

it('leaves the height gap when a planar steering adapter discards the vertical component', () => {
  const states = thirdDimensionStates(example, example.flatVerticalWeight);
  const first = calculateThirdDimensionStep(initialDroneState(example), example, 0);
  expect(first.distance).toBe(15);
  expect(first.acceleration).toEqual({ x: 2.4, y: 0, z: 3.2 });
  expect(states.every((state) => state.position.y === 0 && state.velocity.y === 0)).toBe(true);
  expect(states[states.length - 1].position).toEqual({ x: 9, y: 0, z: 12 });
  expect(states[states.length - 1].pitch).toBe(0);
  const chart = runOf().comparison?.timeline;
  expect(chart?.series[0].values.at(-1)).toBe(0);
  expect(chart?.series[1].values.at(-1)).toBe(8);
  expect(runOf().comparison?.findings.join(' ')).toContain('leaves 8.00 units');
});

it('keeps roll independent from the nose and from translational motion', () => {
  const rolled = thirdDimensionStates(example);
  const level = thirdDimensionStates({ ...example, rollDegrees: 0 });
  expect(rolled.map(({ position, velocity }) => ({ position, velocity }))).toEqual(
    level.map(({ position, velocity }) => ({ position, velocity })),
  );
  const rolledAxes = droneAxes(rolled[8]);
  const levelAxes = droneAxes(level[8]);
  expect(rolledAxes.forward).toEqual(levelAxes.forward);
  expect(rolledAxes.right).not.toEqual(levelAxes.right);
  expect(volumeLength(rolledAxes.forward)).toBeCloseTo(1, 7);
  expect(volumeLength(rolledAxes.right)).toBeCloseTo(1, 7);
  const dot =
    rolledAxes.forward.x * rolledAxes.right.x +
    rolledAxes.forward.y * rolledAxes.right.y +
    rolledAxes.forward.z * rolledAxes.right.z;
  expect(dot).toBeCloseTo(0, 7);
});

it('provides the coordinates, pose, worked arithmetic and aligned chart at every frame', () => {
  const run = runOf();
  expect(run.motion.frames).toHaveLength(25);
  expect(run.initialStep).toBe(8);
  const first = run.motion.frames[1];
  expect(first.values).toMatchObject({
    x: '0.13',
    y: '0.12',
    z: '0.18',
    speed: '1.00',
    roll: '30.00',
  });
  expect(run.motion.frames[0].worked?.lines[0]).toContain('length 17.00');
  expect(run.motion.frames[run.initialStep].note).toContain('independently');
  expect(run.motion.frames.at(-1)?.values).toMatchObject({
    distance: '0.00',
    speed: '0.00',
  });
  expect(run.timeline?.seconds).toEqual(run.motion.frames.map(({ seconds }) => seconds));
  expect(run.timeline?.series[0].values.at(-1)).toBe(8);
  for (const moment of run.moments) expect(run.motion.frames[moment.step]).toBeDefined();
});

it('holds all visible positions and wing endpoints within the drawing after input changes', () => {
  for (const targetY of [0, 12]) {
    const run = runOf({ ...parameters, targetY, rollDegrees: -60 });
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
  }
  expect(runOf({ ...parameters, targetY: 0 }).comparison?.timeline.series[0].values).toEqual(
    runOf({ ...parameters, targetY: 0 }).comparison?.timeline.series[1].values,
  );
});

it('retains the previous yaw for a purely vertical direction', () => {
  const vertical = { ...example, targetX: 0, targetZ: 0 };
  const state = { ...initialDroneState(vertical), yaw: 0.7 };
  const next = calculateThirdDimensionStep(state, vertical).next;
  expect(next.yaw).toBe(0.7);
  expect(next.pitch).toBeCloseTo(Math.PI / 2, 12);
  expect(next.position.x).toBe(0);
  expect(next.position.z).toBe(0);
  expect(next.position.y).toBe(0.25);
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
