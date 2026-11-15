import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { nearestOnSegment } from './geometry';
import { hashFrame } from './hash';
import { metricNames } from './metrics';
import { startRun } from './run';
import { frameOf } from './simulation';
import { assignSlots, type SlotCandidate, type SlotCosts } from './slot-assignment';
import { runBranch, runTrial } from './trial';
import type {
  CompositionStep,
  MetricName,
  SceneDefinition,
  SimulationState,
  SlotAssignment,
} from './types';
import { distance } from './vectors';

// The fixtures belong to the scene feature, which ships them; the engine's spec only reads
// them, and writes the known outcome when asked to regenerate it.
const fixtures = resolve(import.meta.dirname, '../../../../features/scene/src/testing/fixtures');
const readFixture = (name: string) => JSON.parse(readFileSync(resolve(fixtures, name), 'utf8'));

interface KnownOutcome {
  readonly schema: 'scene-known-outcome-v0';
  readonly sceneId: string;
  readonly seed: number;
  readonly frames: number;
  readonly sampleEvery: number;
  readonly focus: readonly string[];
  readonly branchA: readonly CompositionStep[];
  readonly branchB: readonly CompositionStep[];
  readonly hashes: { readonly a: readonly string[]; readonly b: readonly string[] };
  readonly metrics: Readonly<
    Record<
      MetricName,
      { readonly a: readonly (number | null)[]; readonly b: readonly (number | null)[] }
    >
  >;
  readonly firstDivergenceFrame: number | null;
}

const definition: SceneDefinition = readFixture('scene-twenty.json');

const equipFrame = 60;
const focus = definition.units.slice(0, 12).map((unit) => unit.id);
const equip: CompositionStep = {
  at: equipFrame,
  toolId: 'aifg-a:145',
  kind: 'steer.blend',
  selection: focus,
  params: { 'separation-weight': 2, 'cohesion-weight': 1, 'velocity-match-weight': 1 },
};

const rounded = (value: number | null) => (value === null ? null : Math.round(value * 1e6) / 1e6);

interface OutcomeRun {
  readonly frames: number;
  readonly sampleEvery: number;
  readonly focus: readonly string[];
  readonly branchA: readonly CompositionStep[];
  readonly branchB: readonly CompositionStep[];
}

function computeOutcome({
  frames,
  sampleEvery,
  focus,
  branchA,
  branchB,
}: OutcomeRun): KnownOutcome {
  const { trial } = runTrial({
    id: 'known-outcome',
    start: startRun(definition, branchB),
    branchA: { label: 'before', steps: branchA },
    branchB: { label: 'after', steps: branchB },
    frames,
    sampleEvery,
    focus,
  });
  const hashes = (steps: readonly CompositionStep[]) =>
    runBranch(definition, steps, frames)
      .filter((_, frame) => frame % sampleEvery === 0)
      .map((state) => hashFrame(frameOf(state)));
  return {
    schema: 'scene-known-outcome-v0',
    sceneId: definition.id,
    seed: definition.seed,
    frames,
    sampleEvery,
    focus,
    branchA,
    branchB,
    hashes: { a: hashes(branchA), b: hashes(branchB) },
    metrics: Object.fromEntries(
      metricNames.map((name) => [
        name,
        { a: trial.metrics[name].a.map(rounded), b: trial.metrics[name].b.map(rounded) },
      ]),
    ) as unknown as KnownOutcome['metrics'],
    firstDivergenceFrame: trial.firstDivergenceFrame,
  };
}

const flockRun: OutcomeRun = { frames: 600, sampleEvery: 60, focus, branchA: [], branchB: [equip] };

// The walls known outcome: the twelve units west of x = 70 given A* and an objective beyond a
// wall standing down from the top edge, with two obstacles near its foot, all drawn at frame 0;
// branch B seals the gap under the wall at frame 30.
const squad = definition.units.filter((unit) => unit.position.x < 70).map((unit) => unit.id);
const fieldStep = (at: number, kind: string, params: CompositionStep['params']) => ({
  at,
  toolId: kind,
  kind,
  selection: [],
  params,
});
const walledIn: readonly CompositionStep[] = [
  fieldStep(0, 'field.wall', { x1: 70, y1: 0, x2: 70, y2: 64, thickness: 1, shape: 1 }),
  fieldStep(0, 'field.obstacle', { x: 62, y: 74, radius: 2.5, shape: 2 }),
  fieldStep(0, 'field.obstacle', { x: 82, y: 72, radius: 3, shape: 3 }),
  fieldStep(0, 'objective.set', { x: 100, y: 40 }),
  { at: 0, toolId: 'aifg-a:222', kind: 'path.find', selection: squad, params: { heuristic: 3 } },
];
const sealing = fieldStep(30, 'field.wall', {
  x1: 70,
  y1: 60,
  x2: 70,
  y2: 80,
  thickness: 1,
  shape: 4,
});
const wallsRun: OutcomeRun = {
  frames: 900,
  sampleEvery: 60,
  focus: squad,
  branchA: walledIn,
  branchB: [...walledIn, sealing],
};

// Run once with WRITE_SCENE_FIXTURES=1 to regenerate; the gate only ever reads the bytes.
if (process.env['WRITE_SCENE_FIXTURES'] === '1') {
  for (const [name, run] of [
    ['trial-known-outcome.json', flockRun],
    ['walls-known-outcome.json', wallsRun],
  ] as const)
    writeFileSync(resolve(fixtures, name), `${JSON.stringify(computeOutcome(run), null, 2)}\n`);
}

describe('the known outcome over the twenty', () => {
  const known: KnownOutcome = readFixture('trial-known-outcome.json');

  it('reproduces the committed frame hashes and metric series', () => {
    expect(computeOutcome(flockRun)).toEqual(known);
  });

  it('first diverges on the frame after the equip', () => {
    expect(known.firstDivergenceFrame).toBe(equipFrame + 1);
  });

  it('shows the group pulling together in the branch after the equip', () => {
    const radius = known.metrics.cohesionRadius;
    expect(radius.b.at(-1)).toBeLessThan((radius.a.at(-1) ?? 0) / 2);
    expect(known.metrics.collisions.b.at(-1)).toBe(0);
  });

  it('leaves the branch before the equip exactly where it started', () => {
    expect(new Set(known.hashes.a).size).toBe(1);
  });
});

// How far inside a wall or an obstacle the deepest unit stands; zero or less means none is.
function deepestContact(state: SimulationState) {
  let deepest = -Infinity;
  for (const unit of state.units) {
    for (const { from, to, thickness } of state.geometry.walls) {
      const gap = distance(unit.position, nearestOnSegment(unit.position, from, to));
      deepest = Math.max(deepest, thickness / 2 + unit.radius - gap);
    }
    for (const { centre, radius } of state.geometry.obstacles)
      deepest = Math.max(deepest, radius + unit.radius - distance(unit.position, centre));
  }
  return deepest;
}

describe('the walls known outcome', () => {
  const known: KnownOutcome = readFixture('walls-known-outcome.json');
  const branchA = runBranch(definition, wallsRun.branchA, wallsRun.frames);
  const branchB = runBranch(definition, wallsRun.branchB, wallsRun.frames);
  const lastActivities = (states: readonly SimulationState[]) => {
    const last = frameOf(states[states.length - 1]);
    return last.units.filter(({ id }) => squad.includes(id)).map(({ activity }) => activity);
  };

  it('reproduces the committed hashes and series, the same on a second run', () => {
    expect(computeOutcome(wallsRun)).toEqual(known);
    expect(computeOutcome(wallsRun).hashes).toEqual(known.hashes);
  });

  it('brings every unit of the squad round the wall to arrive, none ever inside a shape', () => {
    expect(squad).toHaveLength(12);
    expect(lastActivities(branchA)).toEqual(squad.map(() => 'arrived'));
    expect(Math.max(...branchA.map(deepestContact))).toBeLessThanOrEqual(0);
    // Steps take effect on the transition to frame 1, so the first sample has no route yet.
    const walked = known.metrics.pathLength.a.slice(1, 6);
    expect(walked.every((length) => length !== null)).toBe(true);
    expect(walked).toEqual([...walked].sort((a, b) => (b ?? 0) - (a ?? 0)));
    expect(known.metrics.replans.a.every((count) => count === 0)).toBe(true);
  });

  it('leaves every unit of the squad blocked once the gap is sealed, and counts them', () => {
    expect(lastActivities(branchB)).toEqual(squad.map(() => 'blocked'));
    expect(known.metrics.blockedUnits.b.at(-1)).toBe(squad.length);
    expect(known.metrics.replans.b.at(-1)).toBe(squad.length);
    expect(Math.max(...branchB.map(deepestContact))).toBeLessThanOrEqual(0);
  });

  it('first diverges on the frame after the seal', () => {
    expect(known.firstDivergenceFrame).toBe(31);
  });
});

describe('the committed cost table', () => {
  const table: {
    readonly costs: SlotCosts;
    readonly members: readonly SlotCandidate[];
    readonly slotRoles: readonly string[];
    readonly handComputed: { readonly assignment: readonly SlotAssignment[] };
  } = readFixture('cost-table.json');

  it('greedy assignment equals the hand-computed table', () => {
    expect(assignSlots(table.members, table.slotRoles, table.costs)).toEqual(
      table.handComputed.assignment,
    );
  });
});
