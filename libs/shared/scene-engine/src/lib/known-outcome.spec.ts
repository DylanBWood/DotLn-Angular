import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { hashFrame } from './hash';
import { metricNames } from './metrics';
import { startRun } from './run';
import { frameOf } from './simulation';
import { assignSlots, type SlotCandidate, type SlotCosts } from './slot-assignment';
import { runBranch, runTrial } from './trial';
import type { CompositionStep, MetricName, SceneDefinition, SlotAssignment } from './types';

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

function computeOutcome(): KnownOutcome {
  const frames = 600;
  const sampleEvery = 60;
  const { trial } = runTrial({
    id: 'known-outcome',
    start: startRun(definition, [equip]),
    branchA: { label: 'before', steps: [] },
    branchB: { label: 'after', steps: [equip] },
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
    branchA: [],
    branchB: [equip],
    hashes: { a: hashes([]), b: hashes([equip]) },
    metrics: Object.fromEntries(
      metricNames.map((name) => [
        name,
        { a: trial.metrics[name].a.map(rounded), b: trial.metrics[name].b.map(rounded) },
      ]),
    ) as unknown as KnownOutcome['metrics'],
    firstDivergenceFrame: trial.firstDivergenceFrame,
  };
}

// Run once with WRITE_SCENE_FIXTURES=1 to regenerate; the gate only ever reads the bytes.
if (process.env['WRITE_SCENE_FIXTURES'] === '1') {
  writeFileSync(
    resolve(fixtures, 'trial-known-outcome.json'),
    `${JSON.stringify(computeOutcome(), null, 2)}\n`,
  );
}

describe('the known outcome over the twenty', () => {
  const known: KnownOutcome = readFixture('trial-known-outcome.json');

  it('reproduces the committed frame hashes and metric series', () => {
    expect(computeOutcome()).toEqual(known);
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
