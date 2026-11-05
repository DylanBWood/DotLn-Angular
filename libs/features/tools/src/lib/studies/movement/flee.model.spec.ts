import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import { studyTranslate } from '../../../../testing/src';
import type { MotionStudyModel } from '../study-model';
import { calculateFleeStep, fleeFrames, type FleeParameters, model } from './flee.model';

const example: FleeParameters = {
  start: 5,
  threat: 0,
  initialVelocity: 0,
  maxSpeed: 6,
  maxAcceleration: 8,
  engineRadius: 20,
  timeStep: 0.25,
  steps: 40,
  bodyRadius: 0.5,
  velocitySeconds: 1,
  accelerationSecondsSquared: 1,
  arrowLane: 3,
  padding: 3,
};
const parameters: StudyParameters = { ...example };

const viewOf = (input: StudyParameters = parameters): MotionStudyModel => {
  return model(input, studyTranslate);
};

it('uses the Flee row and exactly the parameters used by the worked example', async () => {
  const loader = createCatalogLoader();
  const record = await loader.study('aifg-a:111');
  const tools = await loader.load('aifg');
  expect(tools.find(({ id }) => id === record?.id)?.title).toBe('Flee');
  expect(record?.example.parameters).toEqual(parameters);
});

it('works the first outward push and motor update by hand', () => {
  const first = calculateFleeStep({ position: 5, velocity: 0 }, example);
  expect(first).toEqual({
    offset: 5,
    distance: 5,
    direction: 1,
    fade: 0.75,
    acceleration: 6,
    trialVelocity: 1.5,
    next: { position: 5.375, velocity: 1.5 },
  });
  expect(calculateFleeStep({ position: -5, velocity: 0 }, example)).toMatchObject({
    offset: -5,
    direction: -1,
    acceleration: -6,
    next: { position: -5.375, velocity: -1.5 },
  });
});

it('uses the engine fade rather than requesting maximum acceleration at every distance', () => {
  expect(calculateFleeStep({ position: 10, velocity: 0 }, example).acceleration).toBe(4);
  expect(calculateFleeStep({ position: 15, velocity: 0 }, example).acceleration).toBe(2);
  expect(calculateFleeStep({ position: 20, velocity: 0 }, example).acceleration).toBe(0);
  expect(calculateFleeStep({ position: 25, velocity: 0 }, example).acceleration).toBe(0);
});

it('can still move inward while an outward acceleration brakes an existing approach', () => {
  const approaching = calculateFleeStep({ position: 5, velocity: -4 }, example);
  expect(approaching.acceleration).toBe(6);
  expect(approaching.next).toEqual({ position: 4.375, velocity: -2.5 });
  expect(approaching.next.position).toBeLessThan(5);
});

it('increases separation from a resting start and coasts after the push fades out', () => {
  const states = fleeFrames(example);
  expect(states).toHaveLength(41);
  for (const [step, state] of states.entries()) {
    expect(Number.isFinite(state.position)).toBe(true);
    expect(state.velocity).toBeGreaterThanOrEqual(0);
    expect(state.velocity).toBeLessThanOrEqual(example.maxSpeed);
    if (step === 0) continue;
    const before = states[step - 1];
    expect(state.position).toBeGreaterThan(before.position);
    expect(Math.abs(state.velocity - before.velocity) / example.timeStep).toBeLessThanOrEqual(
      example.maxAcceleration,
    );
    expect(calculateFleeStep(state, example).acceleration).toBeLessThanOrEqual(
      calculateFleeStep(before, example).acceleration,
    );
  }
  const boundary = states.findIndex(({ position }) => position >= example.engineRadius);
  expect(boundary).toBe(12);
  expect(states[boundary].velocity).toBe(6);
  for (const state of states.slice(boundary)) {
    const update = calculateFleeStep(state, example);
    expect(update.acceleration).toBe(0);
    expect(update.next.velocity).toBe(state.velocity);
    expect(update.next.position - state.position).toBeCloseTo(1.5);
  }
});

it('shows the exact-coincidence failure without inventing an escape direction', () => {
  const coincident = fleeFrames({ ...example, start: example.threat });
  expect(coincident.every((state) => state.position === 0 && state.velocity === 0)).toBe(true);
  const still = calculateFleeStep({ position: 0, velocity: 0 }, example);
  expect(still.direction).toBe(0);
  expect(still.acceleration).toBe(0);
  expect(still.next).toEqual({ position: 0, velocity: 0 });
  const moving = calculateFleeStep({ position: 0, velocity: 2 }, example);
  expect(moving.acceleration).toBe(0);
  expect(moving.next).toEqual({ position: 0.5, velocity: 2 });
  const comparison = viewOf().comparison;
  expect(comparison?.timeline.series[1].values).toEqual(Array(41).fill(0));
  expect(comparison?.findings[0]).toContain('separation stays 0.00 units');
});

it('opens where zero push and continued motion can be inspected together', () => {
  const view = viewOf();
  expect(view.initialStep).toBe(12);
  expect(view.moments).toHaveLength(4);
  const frame = view.motion.frames[view.initialStep];
  expect(frame.values).toMatchObject({
    acceleration: '0.00',
    velocity: '6.00',
    engineRadius: '20.00',
    timeStep: '0.25',
  });
  expect(frame.note).toContain('keeps its existing velocity');
  expect(frame.worked?.note).toContain('Zero acceleration is not a stop instruction');
  const first = view.motion.frames[0];
  expect(first.worked?.lines.join(' ')).toContain('1.00 × 8.00 × 0.75 = 6.00');
  expect(first.worked?.lines.join(' ')).toContain('5.00 + 1.50 × 0.25 = 5.38');
  expect(view.timeline?.series[0].values).toHaveLength(view.motion.frames.length);
});

it('contains the radius, all positions and both vector endpoints when the inputs change', () => {
  for (const start of [0, 12]) {
    for (const maxAcceleration of [2, 12]) {
      const { motion } = viewOf({ ...parameters, start, maxAcceleration });
      const { minX, maxX, minY, maxY } = motion.bounds;
      for (const frame of motion.frames) {
        const xs = [
          ...frame.bodies.map(({ x }) => x),
          ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
        ];
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(minX);
        expect(Math.max(...xs)).toBeLessThanOrEqual(maxX);
        expect(minY).toBeLessThanOrEqual(-example.engineRadius);
        expect(maxY).toBeGreaterThanOrEqual(example.engineRadius);
        expect(minX).toBeLessThanOrEqual(example.threat - example.engineRadius);
        expect(maxX).toBeGreaterThanOrEqual(example.threat + example.engineRadius);
      }
    }
  }
});

it('keeps changed values in the prose and identifies coincident comparison runs', () => {
  const changed = viewOf({ ...parameters, start: 0, maxAcceleration: 4 });
  expect(changed.motion.frames[0].values).toMatchObject({
    start: '0.00',
    maxAcceleration: '4.00',
  });
  expect(changed.comparison?.intro).toContain('Both runs now start');
  expect(changed.comparison?.timeline.series[0].values).toEqual(
    changed.comparison?.timeline.series[1].values,
  );
  expect(() => model({ ...parameters, engineRadius: 12 }, studyTranslate)).toThrow(
    'engine radius of 20',
  );
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
