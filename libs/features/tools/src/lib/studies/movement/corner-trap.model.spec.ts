import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import {
  calculateCornerStep,
  type CornerParameters,
  cornerStates,
  model,
  rayWallHit,
} from './corner-trap.model';

const example: CornerParameters = {
  startX: 8,
  targetX: 32,
  cornerX: 12,
  wallDepth: 16,
  wallRise: 12,
  rayForward: 4,
  raySide: 1,
  rayLength: 12,
  wallAcceleration: 5,
  maxAcceleration: 6,
  maxSpeed: 4,
  timeStep: 0.25,
  steps: 8,
  stallEpsilon: 0.001,
  winnerRay: 0,
};
const parameters: StudyParameters = { ...example };
const initial = { position: { x: 8, y: 0 }, velocity: { x: 0, y: 0 } };

it('attaches these parameters to the Corner trap catalog row', async () => {
  const record = await createCatalogLoader().study('aifg-a:139');
  expect(record?.slug).toBe('corner-trap');
  expect(record?.example.parameters).toEqual(example);
});

it('calculates two real ray hits and the hand-checkable cancelling requests', () => {
  const step = calculateCornerStep(initial, example);
  // y = (x - 8) / 4 and y = 3(x - 12) / 4 meet at (14, 1.5).
  expect(step.rays[0].hit?.x).toBeCloseTo(14);
  expect(step.rays[0].hit?.y).toBeCloseTo(1.5);
  expect(step.rays[1].hit?.x).toBeCloseTo(14);
  expect(step.rays[1].hit?.y).toBeCloseTo(-1.5);
  expect(step.rays[0].correction.x).toBeCloseTo(-3);
  expect(step.rays[0].correction.y).toBeCloseTo(4);
  expect(step.rays[1].correction.x).toBeCloseTo(-3);
  expect(step.rays[1].correction.y).toBeCloseTo(-4);
  expect(step.goal).toEqual({ x: 6, y: 0 });
  expect(step.acceleration.x).toBeCloseTo(0);
  expect(step.acceleration.y).toBeCloseTo(0);
  expect(step.next.position.x).toBeCloseTo(8);
  expect(step.next.position.y).toBeCloseTo(0);
  expect(step.next.velocity.x).toBeCloseTo(0);
  expect(step.next.velocity.y).toBeCloseTo(0);
  expect(step.stalled).toBe(true);
});

it('uses finite rays and finite walls rather than hits on their infinite extensions', () => {
  const start = { x: 12, y: 0 };
  const end = { x: 28, y: 12 };
  expect(rayWallHit({ x: 8, y: 0 }, { x: 10, y: 0.5 }, start, end)).toBeNull();
  expect(rayWallHit({ x: 8, y: 20 }, { x: 40, y: 20 }, start, end)).toBeNull();
  expect(rayWallHit({ x: 8, y: 1 }, { x: 20, y: 10 }, start, end)).toBeNull();
  const short = calculateCornerStep(initial, { ...example, rayLength: 2 });
  expect(short.rays.every(({ hit }) => hit === null)).toBe(true);
  expect(short.acceleration).toEqual({ x: 6, y: 0 });
  expect(short.stalled).toBe(false);
});

it('repeats the sensed conflict without progress and distinguishes it from coasting', () => {
  const states = cornerStates(example);
  expect(states).toHaveLength(9);
  for (const state of states) {
    expect(state.position.x).toBeCloseTo(8);
    expect(state.position.y).toBeCloseTo(0);
  }
  expect(states.every((state) => calculateCornerStep(state, example).stalled)).toBe(true);
  const coasting = calculateCornerStep({ ...initial, velocity: { x: 0.1, y: 0 } }, example);
  expect(coasting.acceleration).toEqual({ x: 0, y: 0 });
  expect(coasting.stalled).toBe(false);
  expect(coasting.next.position.x).toBeCloseTo(8.025);
});

it('breaks the cancellation by keeping the upper ray without inventing a recovery force', () => {
  const winner = calculateCornerStep(initial, example, true);
  expect(winner.rays).toEqual(calculateCornerStep(initial, example).rays);
  expect(winner.goal).toEqual({ x: 6, y: 0 });
  expect(winner.acceleration.x).toBeCloseTo(3);
  expect(winner.acceleration.y).toBeCloseTo(4);
  expect(winner.next.velocity.x).toBeCloseTo(0.75);
  expect(winner.next.velocity.y).toBeCloseTo(1);
  expect(winner.next.position.x).toBeCloseTo(8.1875);
  expect(winner.next.position.y).toBeCloseTo(0.25);
  expect(winner.stalled).toBe(false);
  const recovery = cornerStates(example, true);
  expect(recovery.at(-1)?.position.y).toBeGreaterThan(0);
  expect(recovery.at(-1)?.position.x).toBeGreaterThan(example.startX);
  for (const state of recovery) {
    expect(Math.hypot(state.velocity.x, state.velocity.y)).toBeLessThanOrEqual(4 + 1e-10);
    if (
      state.position.x >= example.cornerX &&
      state.position.x <= example.cornerX + example.wallDepth
    )
      expect(Math.abs(state.position.y)).toBeGreaterThanOrEqual(
        ((state.position.x - example.cornerX) * example.wallRise) / example.wallDepth,
      );
  }
});

it('draws the positive-y upper hit and recovery above the lower hit', () => {
  const frame = model(parameters).motion.frames[0];
  const upper = frame.marks?.find(({ label }) => label === 'upper hit');
  const lower = frame.marks?.find(({ label }) => label === 'lower hit');
  expect(upper?.y).toBeCloseTo(-1.5);
  expect(lower?.y).toBeCloseTo(1.5);
  const recovery = model({ ...parameters, winnerRay: 1 }).motion.frames[1];
  expect(recovery.bodies[0].y).toBe(-0.25);
  expect(recovery.values['y']).toBe('0.25');
});

it('keeps the drawing, worked arithmetic and failure comparison on the same run', () => {
  const run = model(parameters);
  expect(run).toEqual(model(parameters));
  expect(run.motion.frames).toHaveLength(9);
  expect(run.initialStep).toBe(0);
  const frame = run.motion.frames[0];
  expect(frame.links).toHaveLength(4);
  expect(frame.marks).toHaveLength(3);
  expect(frame.values).toMatchObject({
    upperHit: '(14.00, 1.50)',
    lowerHit: '(14.00, -1.50)',
    upperCorrection: '(-3.00, 4.00)',
    lowerCorrection: '(-3.00, -4.00)',
    net: '(0.00, 0.00)',
    stalled: 'stalled',
  });
  expect(frame.worked?.lines.join(' ')).toContain('Engine seek requests (6.00, 0.00)');
  expect(run.timeline?.series.map(({ values }) => values[0])).toEqual([4, -4, 0]);
  expect(run.comparison?.timeline.series[0].values.every((value) => value === 0)).toBe(true);
  expect(run.comparison?.timeline.series[1].values[1]).toBeCloseTo(0.25);
  expect(run.comparison?.findings.join(' ')).toContain('does not claim to complete a route');
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  for (const moment of run.motion.frames) {
    const points = [
      ...moment.bodies,
      ...(moment.marks ?? []),
      ...(moment.links ?? []).flatMap(({ from, to }) => [from, to]),
      ...(moment.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
    ];
    for (const { x, y } of points) {
      expect(x).toBeGreaterThan(minX);
      expect(x).toBeLessThan(maxX);
      expect(y).toBeGreaterThan(minY);
      expect(y).toBeLessThan(maxY);
    }
    expect(Object.values(moment.values).every((value) => !value.includes('NaN'))).toBe(true);
  }
});
