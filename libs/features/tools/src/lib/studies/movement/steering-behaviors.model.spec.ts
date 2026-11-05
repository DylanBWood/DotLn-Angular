import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { length } from '@dotln-angular/scene-engine';
import { loadStudy } from '@dotln-angular/tools/testing';

import { studyTranslate } from '../../../../testing/src';
import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import { timelineDrawing } from '../../composites/study-visuals/timeline/timeline-drawing';
import {
  type BehaviourParameters,
  behaviourSteps,
  calculateBehaviourStep,
  model,
} from './steering-behaviors.model';

const record = await loadStudy('aifg-a:105');
const example: BehaviourParameters = {
  initialPosition: 0,
  initialVelocity: 0,
  target: 24,
  maxSpeed: 6,
  maxAcceleration: 4,
  radius: 0.5,
  slowRadius: 10,
  targetRadius: 1,
  responseTime: 0.25,
  arrivalEnabled: 1,
  timeStep: 0.25,
  steps: 80,
};
const parameters: StudyParameters = { ...example };
const state = (position: number, velocity: number) => ({
  position: { x: position, y: 0 },
  velocity: { x: velocity, y: 0 },
});
const runModel = (inputs: StudyParameters = parameters) => {
  return model(inputs, studyTranslate);
};

it('binds its record, mechanism blocks and nearby ids to the catalog', async () => {
  expect(record.slug).toBe('steering-behaviors');
  expect(record.example.parameters).toEqual(example);
  expect(record.pseudocode.executable.module).toBe(record.visual.model);
  expect(record.pseudocode.ordinary.split(/\n\s*\n/)).toHaveLength(record.mechanism.steps.length);
  const ids = new Set((await createCatalogLoader().load('aifg')).map(({ id }) => id));
  expect(record.nearby.every(({ id }) => ids.has(id))).toBe(true);
});

it('starts with the same acceleration contract and works the first update by hand', () => {
  const first = calculateBehaviourStep(state(0, 0), example);
  expect(first.seekRequest).toEqual({ x: 4, y: 0 });
  expect(first.arriveRequest).toEqual({ x: 4, y: 0 });
  expect(first.desiredVelocity).toBe(6);
  expect(first.next).toEqual(state(0.25, 1));
  expect(calculateBehaviourStep(state(0, 0), example, 0).next).toEqual(first.next);
});

it('gives opposite requests at the same braking state without adding them', () => {
  const braking = calculateBehaviourStep(state(14.25, 6), example);
  expect(braking.seekRequest.x).toBe(4);
  expect(braking.desiredVelocity).toBeCloseTo(111 / 19, 12);
  expect(braking.arriveRequest.x).toBeCloseTo(-12 / 19, 12);
  expect(braking.acceleration).toEqual(braking.arriveRequest);
  expect(braking.next.velocity.x).toBeCloseTo(111 / 19, 12);
  expect(braking.next.position.x).toBeCloseTo(597 / 38, 12);
  const seek = calculateBehaviourStep(braking.state, example, 0);
  expect(seek.acceleration).toEqual(braking.seekRequest);
  expect(seek.next).toEqual(state(15.75, 6));
});

it('preserves momentum at zero output and brakes a moving courier near the depot', () => {
  const seekAtTarget = calculateBehaviourStep(state(24, 2), example, 0);
  expect(seekAtTarget.acceleration).toEqual({ x: 0, y: 0 });
  expect(seekAtTarget.next).toEqual(state(24.5, 2));
  const arriveAtTarget = calculateBehaviourStep(state(24, 2), example);
  expect(arriveAtTarget.arriveRequest.x).toBe(-4);
  expect(arriveAtTarget.next).toEqual(state(24.25, 1));
});

it('keeps the straight approach bounded and shows why Seek is the wrong delivery goal', () => {
  const arriving = behaviourSteps(example);
  const seeking = behaviourSteps(example, 0);
  expect(arriving).toHaveLength(81);
  expect(arriving.slice(0, 13).map(({ state }) => state)).toEqual(
    seeking.slice(0, 13).map(({ state }) => state),
  );
  expect(arriving[12].state).toEqual(state(14.25, 6));
  expect(arriving.every(({ state }) => state.position.x < example.target)).toBe(true);
  const last = arriving.at(-1);
  expect(Math.abs(example.target - (last?.state.position.x ?? 0))).toBeLessThan(
    example.targetRadius,
  );
  expect(Math.abs(last?.state.velocity.x ?? Infinity)).toBeLessThan(0.001);
  expect(Math.max(...seeking.map(({ state }) => state.position.x))).toBe(28.5);
  expect(seeking.some(({ state }) => state.velocity.x < 0)).toBe(true);
  expect(seeking[19].state).toEqual(state(24.75, 6));
  expect(seeking[19].acceleration.x).toBe(-4);
  expect(seeking[19].next.position.x).toBeGreaterThan(seeking[19].state.position.x);
  for (const step of [...arriving, ...seeking]) {
    expect(length(step.acceleration)).toBeLessThanOrEqual(example.maxAcceleration);
    expect(length(step.next.velocity)).toBeLessThanOrEqual(example.maxSpeed);
    expect(Math.abs(step.next.velocity.x - step.state.velocity.x)).toBeLessThanOrEqual(
      example.maxAcceleration * example.timeStep + 1e-12,
    );
    expect(step.state.position.y).toBe(0);
  }
});

it('opens on the verified disagreement and carries every prose placeholder on every frame', () => {
  const run = runModel();
  expect(run.initialStep).toBe(12);
  expect(run.motion.frames[12].values).toMatchObject({
    position: '14.25',
    velocity: '6.00',
    seekAcceleration: '4.00',
    arriveAcceleration: '-0.63',
    member: 'Arrive',
    comparisonMember: 'Seek',
    overshoot: '0.00',
    comparisonOvershoot: '4.50',
  });
  expect(run.motion.frames[12].note).toContain('braking');
  expect(run.motion.frames[12].worked?.lines.join(' ')).toContain('≈ 15.71 units');
  const prose = JSON.stringify(record);
  const placeholders = [...prose.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]);
  for (const frame of run.motion.frames) {
    for (const name of placeholders) expect(frame.values[name]).toBeDefined();
  }
  expect(run.timeline?.series.every(({ values }) => values.length === 81)).toBe(true);
  expect(run.comparison?.timeline.series[1].values).toEqual(
    behaviourSteps(example, 0).map(({ state }) => state.position.x),
  );
  expect(run.comparison?.findings[0]).toContain('4.50');
  expect(runModel({ ...parameters, arrivalEnabled: 0 }).motion.frames[12].values['member']).toBe(
    'Seek',
  );
  expect(model(parameters, studyTranslate)).toEqual(model(parameters, studyTranslate));
});

it('keeps bodies, requests and slowing zones in view for either selectable member', () => {
  for (const arrivalEnabled of [0, 1]) {
    const run = runModel({ ...parameters, arrivalEnabled });
    const { minX, maxX, minY, maxY } = run.motion.bounds;
    for (const [index, frame] of run.motion.frames.entries()) {
      const points = [
        ...frame.bodies,
        ...(frame.marks ?? []),
        ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
          { x, y },
          { x: x + dx, y: y + dy },
        ]),
        ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
          { x: x - radius, y: y - radius },
          { x: x + radius, y: y + radius },
        ]),
      ];
      for (const { x, y } of points) {
        expect(x).toBeGreaterThan(minX);
        expect(x).toBeLessThan(maxX);
        expect(y).toBeGreaterThan(minY);
        expect(y).toBeLessThan(maxY);
      }
      expect(motionDrawing(run.motion, index).viewBox).not.toContain('NaN');
    }
    const comparison = run.comparison;
    if (!comparison) throw new Error('Steering behaviours compares the other family member.');
    expect(timelineDrawing(comparison.timeline, null).series).toHaveLength(2);
  }
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
