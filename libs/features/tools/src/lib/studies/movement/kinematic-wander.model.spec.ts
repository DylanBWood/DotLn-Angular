import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { distance, length } from '@dotln-angular/scene-engine';

import {
  applyKinematicWander,
  kinematicReversals,
  kinematicWanderFrames,
  type KinematicWanderParameters,
  kinematicWanderStep,
  model,
} from './kinematic-wander.model';

const example: KinematicWanderParameters = {
  startX: 0,
  startY: 0,
  startHeading: 0,
  speed: 6,
  maxRotation: 1,
  seed: 1,
  timeStep: 0.1,
  steps: 120,
  failureRotation: 40,
};
const parameters: StudyParameters = { ...example };

it('uses the catalog example parameters for kinematic wander', async () => {
  const record = await createCatalogLoader().study('aifg-a:103');
  expect(record?.slug).toBe('kinematic-wander');
  expect(record?.example.parameters).toEqual(parameters);
});

it('moves with the old facing before adding a hand-worked signed turn', () => {
  const state = { position: { x: 0, y: 0 }, heading: 0, seed: 1 };
  // Uniform samples 0.75 and 0.25 give 0.5; the seeded runner supplies the same kind of input.
  const update = applyKinematicWander(state, 0.75 - 0.25, example);
  expect(update.velocity.x).toBeCloseTo(6, 10);
  expect(update.velocity.y).toBe(0);
  expect(update.turnRate).toBe(0.5);
  expect(update.headingChange).toBeCloseTo(0.05, 10);
  expect(update.next.position.x).toBeCloseTo(0.6, 10);
  expect(update.next.position.y).toBe(0);
  expect(update.next.heading).toBeCloseTo(0.05, 10);
  const clockwise = applyKinematicWander(state, -0.5, example);
  expect(clockwise.next.position).toEqual(update.next.position);
  expect(clockwise.next.heading).toBeCloseTo(-0.05, 10);
  expect(applyKinematicWander(state, 0, example).next.heading).toBe(0);
});

it('replays the seeded draws, keeps full speed and bounds every sampled turn', () => {
  const states = kinematicWanderFrames(example);
  expect(states).toHaveLength(example.steps + 1);
  expect(kinematicWanderFrames(example)).toEqual(states);
  expect(kinematicWanderFrames({ ...example, seed: 2 })).not.toEqual(states);
  for (const [step, state] of states.slice(0, -1).entries()) {
    const update = kinematicWanderStep(state, example);
    expect(update.first).toBeGreaterThanOrEqual(0);
    expect(update.first).toBeLessThan(1);
    expect(update.second).toBeGreaterThanOrEqual(0);
    expect(update.second).toBeLessThan(1);
    expect(update.sample).toBe(update.first - update.second);
    expect(Math.abs(update.turnRate)).toBeLessThanOrEqual(example.maxRotation);
    expect(length(update.velocity)).toBeCloseTo(example.speed, 10);
    expect(distance(state.position, states[step + 1].position)).toBeCloseTo(0.6, 10);
    expect(states[step + 1]).toEqual(update.next);
  }
  expect(kinematicReversals(states)).toBe(0);
  expect(states.at(-1)?.position).not.toEqual(states[0].position);
});

it('shows abrupt direction changes from the larger bound without changing samples or speed', () => {
  const normal = kinematicWanderFrames(example);
  const abrupt = kinematicWanderFrames(example, example.failureRotation);
  expect(abrupt[1].position).toEqual(normal[1].position);
  expect(abrupt[2].position).not.toEqual(normal[2].position);
  expect(kinematicReversals(abrupt)).toBeGreaterThan(0);
  for (const [step, state] of abrupt.slice(0, -1).entries()) {
    const sharp = kinematicWanderStep(state, example, example.failureRotation);
    const gentle = kinematicWanderStep(normal[step], example);
    expect(sharp.first).toBe(gentle.first);
    expect(sharp.second).toBe(gentle.second);
    expect(Math.abs(sharp.headingChange)).toBeCloseTo(Math.abs(gentle.headingChange) * 40, 10);
    expect(distance(state.position, abrupt[step + 1].position)).toBeCloseTo(0.6, 10);
  }
  const manual = applyKinematicWander(normal[0], 0.5, example, example.failureRotation);
  expect(manual.headingChange).toBe(2);
});

it('makes the sampling interval part of the walk rather than claiming frame-rate invariance', () => {
  const fine = kinematicWanderFrames(example);
  const coarseExample = { ...example, timeStep: 0.2, steps: 60 };
  const coarse = kinematicWanderFrames(coarseExample);
  expect(coarseExample.timeStep * coarseExample.steps).toBe(example.timeStep * example.steps);
  expect(coarse[1].heading - coarse[0].heading).toBeCloseTo(
    (fine[1].heading - fine[0].heading) * 2,
    10,
  );
  expect(coarse.at(-1)?.position).not.toEqual(fine.at(-1)?.position);
});

it('keeps both velocity arrows in the drawing and supplies the selected-frame explanation', () => {
  const run = model(parameters);
  expect(run.motion.frames).toHaveLength(121);
  expect(run.timeline?.series[0].values).toHaveLength(121);
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('0.6000, 0.0000');
  expect(run.motion.frames[run.initialStep].values).toMatchObject({ currentSpeed: '6.0000' });
  expect(run.motion.frames.at(-1)?.note).toContain('not a stopping decision');
  expect(run.comparison?.findings[0]).toContain('changes beyond a right angle');
  for (const speed of [2, 10]) {
    const changed = model({ ...parameters, speed, maxRotation: 4 });
    const bounds = changed.motion.bounds;
    for (const frame of changed.motion.frames) {
      expect(frame.values['currentSpeed']).toBe(speed.toFixed(4));
      for (const vector of frame.vectors ?? []) {
        expect(vector.x + vector.dx).toBeGreaterThanOrEqual(bounds.minX);
        expect(vector.x + vector.dx).toBeLessThanOrEqual(bounds.maxX);
        expect(vector.y + vector.dy).toBeGreaterThanOrEqual(bounds.minY);
        expect(vector.y + vector.dy).toBeLessThanOrEqual(bounds.maxY);
      }
    }
  }
  const same = model({ ...parameters, maxRotation: example.failureRotation });
  expect(same.comparison?.findings[1]).toContain('same patrol');
});
