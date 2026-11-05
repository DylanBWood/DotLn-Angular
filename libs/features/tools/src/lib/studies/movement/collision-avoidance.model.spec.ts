import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';
import { distance, length } from '@dotln-angular/scene-engine';

import { motionDrawing } from '../../composites/study-visuals/motion/motion-drawing';
import {
  calculateCollisionAvoidanceStep,
  closestApproach,
  collisionAvoidanceFrames,
  type CollisionAvoidanceParameters,
  initialCollisionState,
  minimumCollisionSeparation,
  model,
} from './collision-avoidance.model';

const example: CollisionAvoidanceParameters = {
  courierStartX: 0,
  courierStartY: 0,
  courierVelocityX: 4,
  courierVelocityY: 0,
  porterStartX: 10,
  porterStartY: 1,
  porterVelocityX: -4,
  porterVelocityY: 0,
  courierRadius: 1,
  porterRadius: 1,
  maxSpeed: 5,
  maxAcceleration: 6,
  predictionHorizon: 1.5,
  comparisonPorterY: 0,
  timeStep: 0.1,
  steps: 40,
  velocitySeconds: 1,
  accelerationSecondsSquared: 0.5,
};
const parameters: StudyParameters = { ...example };

it('attaches the study to Collision avoidance with these exact teaching parameters', async () => {
  const record = await createCatalogLoader().study('aifg-a:134');
  expect(record?.slug).toBe('collision-avoidance');
  expect(record?.example.parameters).toEqual(example);
  expect(record?.nearby.map((nearby) => nearby.id)).toEqual(
    expect.arrayContaining(['aifg-a:131', 'aifg-a:137', 'aifg-a:111']),
  );
  expect(record?.implementations).toHaveLength(2);
});

it('works the initial relative-motion prediction and actual engine acceleration by hand', () => {
  const first = calculateCollisionAvoidanceStep(initialCollisionState(example), example);
  expect(first.prediction).toMatchObject({
    relativePosition: { x: 10, y: 1 },
    relativeVelocity: { x: -8, y: 0 },
    relativeSpeedSquared: 64,
    time: 1.25,
    courierProjection: { x: 5, y: 0 },
    porterProjection: { x: 5, y: 1 },
    separation: 1,
  });
  expect(first.acceleration.x).toBeCloseTo(0);
  expect(first.acceleration.y).toBe(-6);
  expect(first.next.courier.velocity.x).toBe(4);
  expect(first.next.courier.velocity.y).toBeCloseTo(-0.6);
  expect(first.next.courier.position.x).toBeCloseTo(0.4);
  expect(first.next.courier.position.y).toBeCloseTo(-0.06);
  expect(first.next.porter.position.x).toBeCloseTo(9.6);
  expect(first.next.porter.position.y).toBe(1);
});

it('rejects past approaches, equal velocities, safe gaps and the exact engine horizon', () => {
  const start = initialCollisionState(example);
  const past = {
    ...start,
    courier: { ...start.courier, position: { x: 6, y: 0 } },
    porter: { ...start.porter, position: { x: 4, y: 1 } },
  };
  expect(closestApproach(past).time).toBe(-0.25);
  expect(length(calculateCollisionAvoidanceStep(past, example).acceleration)).toBe(0);
  const equal = { ...start, porter: { ...start.porter, velocity: start.courier.velocity } };
  expect(closestApproach(equal).time).toBeNull();
  expect(length(calculateCollisionAvoidanceStep(equal, example).acceleration)).toBe(0);
  const safe = initialCollisionState(example, example.courierRadius + example.porterRadius);
  expect(closestApproach(safe).separation).toBe(2);
  expect(length(calculateCollisionAvoidanceStep(safe, example).acceleration)).toBe(0);
  const horizon = { ...start, porter: { ...start.porter, position: { x: 12, y: 1 } } };
  expect(closestApproach(horizon).time).toBe(1.5);
  expect(length(calculateCollisionAvoidanceStep(horizon, example).acceleration)).toBe(0);
  const sooner = { ...start, porter: { ...start.porter, position: { x: 11.2, y: 1 } } };
  expect(length(calculateCollisionAvoidanceStep(sooner, example).acceleration)).toBeCloseTo(6);
  expect(() => model({ ...parameters, predictionHorizon: 2 })).toThrow('fixed prediction horizon');
});

it('uses the current offset for existing overlap even when the velocities match', () => {
  const start = initialCollisionState(example);
  const overlap = {
    ...start,
    porter: { position: { x: 0.5, y: 1 }, velocity: start.courier.velocity },
  };
  const acceleration = calculateCollisionAvoidanceStep(overlap, example).acceleration;
  expect(acceleration.x).toBeCloseTo((-6 * 0.5) / Math.sqrt(1.25));
  expect(acceleration.y).toBeCloseTo(-6 / Math.sqrt(1.25));
});

it('passes clear of the porter, including travel between samples, then coasts', () => {
  const states = collisionAvoidanceFrames(example);
  expect(states).toHaveLength(example.steps + 1);
  expect(minimumCollisionSeparation(states)).toBeGreaterThan(2);
  expect(states.at(-1)?.courier.position.y).toBeLessThan(0);
  for (const [index, state] of states.entries()) {
    expect(length(state.courier.velocity)).toBeLessThanOrEqual(example.maxSpeed + 1e-10);
    expect(
      length(calculateCollisionAvoidanceStep(state, example).acceleration),
    ).toBeLessThanOrEqual(example.maxAcceleration + 1e-10);
    expect(state.porter.velocity).toEqual({ x: -4, y: 0 });
    expect(state.porter.position.x).toBeCloseTo(
      example.porterStartX - 4 * index * example.timeStep,
    );
  }
  const last = states[states.length - 1];
  expect(closestApproach(last).time).toBeLessThan(0);
  const next = calculateCollisionAvoidanceStep(last, example);
  expect(length(next.acceleration)).toBe(0);
  expect(next.next.courier.velocity).toEqual(last.courier.velocity);
});

it('exposes the zero-direction head-on failure by changing only the porter offset', () => {
  const headOn = initialCollisionState(example, example.comparisonPorterY);
  const first = calculateCollisionAvoidanceStep(headOn, example);
  expect(first.prediction.time).toBe(1.25);
  expect(first.prediction.separation).toBe(0);
  expect(length(first.acceleration)).toBe(0);
  expect(first.next.courier.position).toEqual({ x: 0.4, y: 0 });
  const states = collisionAvoidanceFrames(example, example.comparisonPorterY);
  expect(states).toEqual(
    collisionAvoidanceFrames({ ...example, porterStartY: example.comparisonPorterY }),
  );
  expect(minimumCollisionSeparation(states)).toBeCloseTo(0, 8);
  expect(states.some((state) => distance(state.courier.position, state.porter.position) < 2)).toBe(
    true,
  );
  expect(
    states.some((state) => calculateCollisionAvoidanceStep(state, example).acceleration.x < 0),
  ).toBe(true);
});

it('supplies every text-equivalent value and keeps its projections inside the drawing', async () => {
  const run = model(parameters);
  const record = await createCatalogLoader().study('aifg-a:134');
  const names = [...(record?.visual?.textEquivalent.matchAll(/\{([^}]+)\}/g) ?? [])].map(
    (match) => match[1],
  );
  expect(names).toContain('closestTime');
  for (const [index, frame] of run.motion.frames.entries()) {
    for (const name of names) expect(frame.values[name]).toBeDefined();
    expect(frame.values['closestTime']).toBeTruthy();
    expect(frame.worked?.lines.join(' ')).toContain('t = −(r · v)');
    const drawing = motionDrawing(run.motion, index);
    expect(drawing.links).toHaveLength(3);
    for (const point of [...frame.bodies, ...(frame.marks ?? [])]) {
      expect(point.x).toBeGreaterThan(run.motion.bounds.minX);
      expect(point.x).toBeLessThan(run.motion.bounds.maxX);
      expect(point.y).toBeGreaterThan(run.motion.bounds.minY);
      expect(point.y).toBeLessThan(run.motion.bounds.maxY);
    }
  }
  expect(run.motion.frames[0].values).toMatchObject({
    closestTime: '1.25 s (ahead)',
    predictedSeparation: '1.00',
    contactDistance: '2.00',
  });
  expect(run.motion.frames.at(-1)?.values['closestTime']).toContain('in the past');
  expect(run.timeline?.reference).toBe(2);
  expect(run.timeline?.series.map((series) => series.values.length)).toEqual([41, 41]);
  expect(run.comparison?.timeline.series.map((series) => series.values.length)).toEqual([41, 41]);
  expect(run.comparison?.findings.join(' ')).toContain('the bodies overlap');
  expect(run.moments).toHaveLength(4);
});

it('is deterministic and describes the equal-offset comparison honestly', () => {
  expect(model(parameters)).toEqual(model(parameters));
  const changed = model({ ...parameters, porterStartY: 0 });
  expect(changed.motion.frames[0].note).toContain('no away direction');
  expect(changed.comparison?.findings).toContain(
    'Both offsets are equal, so these are the same run.',
  );
});
