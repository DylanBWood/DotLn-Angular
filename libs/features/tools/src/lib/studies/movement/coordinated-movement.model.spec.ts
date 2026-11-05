import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { centroid, distance, length, slotPosition, subtract } from '@dotln-angular/scene-engine';

import { studyTranslate } from '../../../../testing/src';
import {
  coordinatedMovementFrames,
  type CoordinatedMovementParameters,
  type CoordinatedMovementState,
  coordinatedMovementStep,
  coordinationErrors,
  initialCoordinatedMovement,
  model,
} from './coordinated-movement.model';

const example: CoordinatedMovementParameters = {
  startX: 0,
  startY: 0,
  targetX: 48,
  targetY: 0,
  spacing: 4,
  memberSpeed: 6,
  cameraSpeed: 6,
  failureCameraSpeed: 1,
  maxAcceleration: 8,
  slowRadius: 4,
  targetRadius: 0,
  responseTime: 0.5,
  anchorSpeed: 1,
  lagLimit: 6,
  timeStep: 0.1,
  steps: 160,
  radius: 0.4,
  preferredCost: 0,
  otherCost: 2,
  seed: 1,
};
const parameters: StudyParameters = { ...example };

function memberOf(state: CoordinatedMovementState, id: string) {
  const member = state.members.find((candidate) => candidate.id === id);
  if (!member) throw new Error(`Missing survey robot ${id}.`);
  return member;
}

it('uses the catalog example parameters for coordinated movement', async () => {
  const record = await createCatalogLoader().study('aifg-a:173');
  expect(record?.slug).toBe('coordinated-movement');
  expect(record?.example.parameters).toEqual(parameters);
});

it('centres the line and assigns Scanner, Camera and Radio distinct role-compatible places', () => {
  const state = initialCoordinatedMovement(example);
  expect(state.formation.slots).toEqual([
    { x: 0, y: -4 },
    { x: 0, y: 0 },
    { x: 0, y: 4 },
  ]);
  expect(centroid(state.formation.slots)).toEqual({ x: 0, y: 0 });
  expect(state.formation.assignment).toEqual([
    { unitId: 'scanner', slot: 0, slotRole: 'left', cost: 0 },
    { unitId: 'camera', slot: 1, slotRole: 'centre', cost: 0 },
    { unitId: 'radio', slot: 2, slotRole: 'right', cost: 0 },
  ]);
  expect(coordinationErrors(state)).toEqual({
    camera: 0,
    mean: 0,
    anchorLag: 0,
  });
});

it('moves the reference first and works Camera through the first bounded acceleration', () => {
  const first = coordinatedMovementStep(initialCoordinatedMovement(example), example);
  // The engine accelerates its anchor to 2.4, moves to 0.24 and moderates towards zero.
  expect(first.formation.anchor.x).toBeCloseTo(0.2352, 10);
  expect(first.formation.anchor.y).toBe(0);
  expect(slotPosition(first.formation, 1)).toEqual(first.formation.anchor);
  // Camera's desired speed is 6 × 0.2352 / 4 = 0.3528; acceleration is 0.3528 / 0.5.
  const camera = memberOf(first, 'camera');
  expect(camera.velocity.x).toBeCloseTo(0.07056, 10);
  expect(camera.position.x).toBeCloseTo(0.007056, 10);
  expect(camera.position.y).toBe(0);
  expect(coordinationErrors(first).camera).toBeCloseTo(0.228144, 10);
});

it('preserves the abreast relationship at equal capability and respects each movement limit', () => {
  const states = coordinatedMovementFrames(example);
  expect(states).toHaveLength(161);
  expect(coordinatedMovementFrames(example)).toEqual(states);
  for (const [step, state] of states.entries()) {
    const [scanner, camera, radio] = state.members;
    expect(scanner.position.x).toBeCloseTo(camera.position.x, 10);
    expect(radio.position.x).toBeCloseTo(camera.position.x, 10);
    expect(camera.position.y - scanner.position.y).toBeCloseTo(example.spacing, 10);
    expect(radio.position.y - camera.position.y).toBeCloseTo(example.spacing, 10);
    expect(state.formation.assignment).toEqual(states[0].formation.assignment);
    for (const member of state.members) {
      expect(length(member.velocity)).toBeLessThanOrEqual(member.maxSpeed + 1e-10);
      if (step > 0) {
        const previous = memberOf(states[step - 1], member.id);
        expect(
          length(subtract(member.velocity, previous.velocity)) / example.timeStep,
        ).toBeLessThanOrEqual(example.maxAcceleration + 1e-9);
      }
    }
    if (step > 0) {
      const previousMean = centroid(states[step - 1].members.map(({ position }) => position));
      expect(distance(state.formation.anchor, previousMean)).toBeLessThanOrEqual(
        example.lagLimit + 1e-9,
      );
    }
  }
  expect(memberOf(states[states.length - 1], 'camera').position.x).toBeGreaterThan(
    example.targetX / 2,
  );
});

it('exposes an individual falling behind although every assignment remains valid', () => {
  const normal = coordinatedMovementFrames(example);
  const slow = coordinatedMovementFrames({
    ...example,
    cameraSpeed: example.failureCameraSpeed,
  });
  const normalPeak = Math.max(...normal.map((state) => coordinationErrors(state).camera));
  const slowPeak = Math.max(...slow.map((state) => coordinationErrors(state).camera));
  expect(slow[0].members.map(({ position }) => position)).toEqual(
    normal[0].members.map(({ position }) => position),
  );
  expect(slowPeak).toBeGreaterThan(normalPeak * 2);
  expect(slowPeak).toBeGreaterThan(example.lagLimit);
  for (const state of slow) {
    expect(state.formation.assignment).toEqual(normal[0].formation.assignment);
    expect(length(memberOf(state, 'camera').velocity)).toBeLessThanOrEqual(
      example.failureCameraSpeed + 1e-10,
    );
  }
  const last = slow[slow.length - 1];
  const camera = memberOf(last, 'camera');
  expect(camera.position.x).toBeLessThanOrEqual(
    example.steps * example.timeStep * example.failureCameraSpeed + 1e-9,
  );
  expect(memberOf(last, 'scanner').position.x - camera.position.x).toBeGreaterThan(5);
});

it('ties the slot drawing, numerical readout and comparison to the same frames', () => {
  const run = model(parameters, studyTranslate);
  const first = run.motion.frames[0];
  expect(first.bodies).toHaveLength(3);
  expect(first.marks?.filter(({ shape }) => shape === 'ring')).toHaveLength(3);
  expect(first.links).toHaveLength(3);
  expect(first.values).toMatchObject({
    scannerY: '-4.0000',
    cameraY: '0.0000',
    radioY: '4.0000',
  });
  expect(first.worked?.lines.join(' ')).toContain('0.2352, 0.0000');
  expect(first.worked?.lines.join(' ')).toContain('0.7056, 0.0000');
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([161, 161]);
  expect(run.comparison?.timeline.series.map(({ values }) => values.length)).toEqual([161, 161]);
  expect(run.motion.frames[run.initialStep].values['cameraError']).toBeDefined();
  expect(run.motion.frames.at(-1)?.worked?.note).toContain('does not assert');
  const same = model({ ...parameters, cameraSpeed: example.failureCameraSpeed }, studyTranslate);
  expect(same.comparison?.findings[1]).toContain('same run');
});

it('keeps every visible position inside the drawing when following ability changes', () => {
  const run = model({ ...parameters, cameraSpeed: 0.5, anchorSpeed: 2 }, studyTranslate);
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const frame of run.motion.frames) {
    expect(frame.bodies).toHaveLength(3);
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
      expect(point.y).toBeGreaterThanOrEqual(minY);
      expect(point.y).toBeLessThanOrEqual(maxY);
    }
  }
  expect(run.motion.frames[0].values).toMatchObject({
    cameraSpeed: '0.5',
    anchorSpeed: '2',
  });
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
