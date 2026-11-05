import { createCatalogLoader } from '@dotln-angular/catalog';
import type { StudyParameters } from '@dotln-angular/models';

import type { FiringParameters } from './the-firing-solution.model';
import {
  firingPositionAt,
  firingTimes,
  model,
  solveFiringSolution,
} from './the-firing-solution.model';

const example: FiringParameters = {
  startX: 0,
  launchHeight: 0,
  targetX: 32,
  targetHeight: 0,
  launchSpeed: 20,
  gravity: 10,
  unreachableTargetX: 48,
  timeStep: 0.05,
  steps: 80,
};
const parameters: StudyParameters = { ...example };

it('uses the harbour-launcher record parameters and links back to forward prediction', async () => {
  const record = await createCatalogLoader().study('aifg-a:163');
  expect(record?.slug).toBe('the-firing-solution');
  expect(record?.example.parameters).toEqual(parameters);
  expect(record?.nearby.map(({ id }) => id)).toContain('aifg-a:162');
});

it('finds two fixed-speed launches from hand-checkable slopes', () => {
  const solution = solveFiringSolution(example);
  expect(solution).toMatchObject({ distance: 32, heightOffset: 0, discriminant: 57600 });
  expect(solution.arcs).toHaveLength(2);
  const [low, high] = solution.arcs;
  expect(low.slope).toBe(0.5);
  expect(high.slope).toBe(2);
  expect(low.horizontalVelocity).toBeCloseTo(8 * Math.sqrt(5), 12);
  expect(low.verticalVelocity).toBeCloseTo(4 * Math.sqrt(5), 12);
  expect(high.horizontalVelocity).toBeCloseTo(4 * Math.sqrt(5), 12);
  expect(high.verticalVelocity).toBeCloseTo(8 * Math.sqrt(5), 12);
  expect(low.targetTime).toBeCloseTo((4 * Math.sqrt(5)) / 5, 12);
  expect(high.targetTime).toBeCloseTo((8 * Math.sqrt(5)) / 5, 12);
  expect(low.targetTime).toBeLessThan(high.targetTime);
  for (const arc of solution.arcs) {
    expect(arc.horizontalVelocity ** 2 + arc.verticalVelocity ** 2).toBeCloseTo(400, 12);
    expect(firingPositionAt(example, arc, arc.targetTime).x).toBeCloseTo(32, 12);
    expect(firingPositionAt(example, arc, arc.targetTime).height).toBeCloseTo(0, 12);
  }
});

it('shows the high candidate still aloft when the selected shot lands', () => {
  const [low, high] = solveFiringSolution(example).arcs;
  expect(firingPositionAt(example, low, low.verticalVelocity / example.gravity).height).toBeCloseTo(
    4,
    12,
  );
  expect(firingPositionAt(example, high, low.targetTime).x).toBeCloseTo(16, 12);
  expect(firingPositionAt(example, high, low.targetTime).height).toBeCloseTo(16, 12);
  expect(firingPositionAt(example, low, low.targetTime).landed).toBe(true);
  expect(firingPositionAt(example, high, low.targetTime).landed).toBe(false);
  expect(firingPositionAt(example, high, 100)).toMatchObject({
    height: 0,
    verticalVelocity: 0,
    landed: true,
  });
  expect(firingPositionAt(example, high, 100).x).toBeCloseTo(32, 12);
});

it('returns no shot beyond range and one shot where the two roots meet', () => {
  expect(solveFiringSolution(example, 48)).toEqual({
    distance: 48,
    heightOffset: 0,
    discriminant: -70400,
    arcs: [],
  });
  const boundary = solveFiringSolution(example, 40);
  expect(boundary.discriminant).toBe(0);
  expect(boundary.arcs).toHaveLength(1);
  expect(boundary.arcs[0].slope).toBe(1);
  const boundaryRun = model({ ...parameters, targetX: 40 });
  expect(boundaryRun.motion.frames.at(-1)?.note).toContain('single admitted candidate');
  expect(boundaryRun.legend.some(({ tone }) => tone === 'desired')).toBe(false);
  expect(solveFiringSolution(example, 40 + 1e-8).arcs).toEqual([]);
  expect(solveFiringSolution(example, 0).arcs).toEqual([]);
  expect(solveFiringSolution({ ...example, targetHeight: -1 }).arcs).toEqual([]);
});

it('includes a height offset without stopping a projectile at a raised target', () => {
  const raised = { ...example, targetHeight: 5 };
  const solution = solveFiringSolution(raised);
  expect(solution.discriminant).toBe(17600);
  for (const arc of solution.arcs) {
    const atTarget = firingPositionAt(raised, arc, arc.targetTime);
    expect(atTarget.x).toBeCloseTo(32, 12);
    expect(atTarget.height).toBeCloseTo(5, 12);
    expect(atTarget.landed).toBe(false);
    expect(arc.landingTime).toBeGreaterThan(arc.targetTime);
    expect(arc.landingX).toBeGreaterThan(32);
  }
});

it('inserts exact events into the preview without nearly duplicate playback moments', () => {
  const solution = solveFiringSolution(example);
  const times = firingTimes(example, solution);
  expect(times[0]).toBe(0);
  expect(times.at(-1)).toBeCloseTo(solution.arcs[1].landingTime, 12);
  for (const arc of solution.arcs) {
    expect(times.some((time) => Math.abs(time - arc.targetTime) < 1e-9)).toBe(true);
    expect(times.some((time) => Math.abs(time - arc.landingTime) < 1e-9)).toBe(true);
  }
  for (let index = 1; index < times.length; index++)
    expect(times[index] - times[index - 1]).toBeGreaterThan(1e-9);
});

it('makes the selected moment, height chart and no-shot comparison agree', () => {
  const run = model(parameters);
  expect(run).toEqual(model(parameters));
  const selected = run.motion.frames[run.initialStep];
  expect(selected.seconds).toBeCloseTo(1.788854381999832, 12);
  expect(selected.bodies).toHaveLength(1);
  expect(selected.bodies[0].id).toBe('high');
  expect(selected.bodies[0].x).toBeCloseTo(16, 12);
  expect(selected.bodies[0].y).toBeCloseTo(-16, 12);
  const contact = selected.marks?.find(({ shape, tone }) => shape === 'dot' && tone === 'actual');
  expect(contact?.x).toBeCloseTo(32, 12);
  expect(contact?.y).toBeCloseTo(0, 12);
  expect(selected.marks?.some(({ shape, label }) => shape === 'cross' && label === 'Beacon')).toBe(
    true,
  );
  expect(selected.note).toContain('chosen low shot has landed');
  expect(selected.values).toMatchObject({
    solutionCount: '2',
    discriminant: '57600.00',
    lowVelocity: '(17.89, 8.94)',
  });
  expect(selected.worked?.lines.join(' ')).toContain('Low slope');
  expect(run.timeline?.series.map(({ values }) => values.length)).toEqual([
    run.motion.frames.length,
    run.motion.frames.length,
  ]);
  const comparison = run.comparison;
  expect(comparison?.timeline.series[0].values[0]).toBe(32);
  expect(comparison?.timeline.series[0].values.at(-1)).toBeCloseTo(0);
  expect(comparison?.timeline.series[1].values.every((value) => value === 48)).toBe(true);
  expect(comparison?.findings.join(' ')).toContain('No projectile is launched');
  expect(comparison?.findings.join(' ')).toContain('D = -70400.00');
});

it('draws no fictitious flight when the main request itself is unreachable', () => {
  const run = model({ ...parameters, targetX: 48 });
  expect(run.timeline).toBeNull();
  expect(
    run.motion.frames.every(
      ({ bodies, vectors, links }) =>
        bodies.length === 0 && vectors?.length === 0 && links?.length === 0,
    ),
  ).toBe(true);
  expect(run.motion.frames[0].values).toMatchObject({
    solutionCount: '0',
    lowPosition: 'not launched',
    highPosition: 'no second arc',
  });
  expect(run.motion.frames[0].worked?.lines.join(' ')).toContain('D < 0');
});

it('keeps candidate positions, velocity arrows and predicted paths inside the view', () => {
  const run = model(parameters);
  const { minX, maxX, minY, maxY } = run.motion.bounds;
  expect(run.motion.frames.length).toBeLessThanOrEqual(240);
  for (const frame of run.motion.frames) {
    const points = [
      ...frame.bodies,
      ...(frame.marks ?? []),
      ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
      ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
    ];
    for (const point of points) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
      expect(point.y).toBeGreaterThanOrEqual(minY);
      expect(point.y).toBeLessThanOrEqual(maxY);
    }
  }
});

it('supplies every prose placeholder at every selectable frame', async () => {
  const record = await createCatalogLoader().study('aifg-a:163');
  if (!record) throw new Error('The firing solution study must be registered.');
  const prose = JSON.stringify([
    record.intuition,
    record.example.description,
    record.mechanism,
    record.visual,
  ]);
  const names = [...prose.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]);
  for (const frame of model(parameters).motion.frames)
    for (const name of names) expect(frame.values[name]).toBeDefined();
});
