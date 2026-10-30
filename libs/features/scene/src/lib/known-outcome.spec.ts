import type { CompositionStep, MetricName, SlotCosts } from '@dotln-angular/scene-engine';
import {
  assignSlots,
  firstDivergence,
  frameOf,
  hashFrame,
  metricNames,
  runBranch,
  runTrial,
  startRun,
} from '@dotln-angular/scene-engine';

import costTable from '../testing/fixtures/cost-table.json';
import knownOutcome from '../testing/fixtures/trial-known-outcome.json';
import { sceneTwenty } from './providers/provide-scene-feature';

const branch = (steps: readonly unknown[]) => steps as readonly CompositionStep[];
const rounded = (value: number | null) => (value === null ? null : Math.round(value * 1e6) / 1e6);

// The engine's own spec reads these fixtures too, but they live in this feature, so `nx affected`
// reaches only this project when one of them changes. This is what holds them to the engine then.
describe('the committed fixtures against the engine', () => {
  const { frames, sampleEvery, focus, branchA, branchB, hashes, metrics, firstDivergenceFrame } =
    knownOutcome;
  const framesOf = (steps: readonly CompositionStep[]) =>
    runBranch(sceneTwenty, steps, frames).map(frameOf);

  it('reproduces the committed frame hashes', () => {
    const sampled = (steps: readonly CompositionStep[]) =>
      framesOf(steps)
        .filter((_, frame) => frame % sampleEvery === 0)
        .map(hashFrame);
    expect(sampled(branch(branchA))).toEqual(hashes.a);
    expect(sampled(branch(branchB))).toEqual(hashes.b);
  });

  it('parts on the committed frame', () => {
    expect(firstDivergence(framesOf(branch(branchA)), framesOf(branch(branchB)))).toBe(
      firstDivergenceFrame,
    );
  });

  it('reproduces the committed metric series', () => {
    const { trial } = runTrial({
      id: 'known-outcome',
      start: startRun(sceneTwenty, branch(branchB)),
      branchA: { label: 'before', steps: branch(branchA) },
      branchB: { label: 'after', steps: branch(branchB) },
      frames,
      sampleEvery,
      focus,
    });
    const committed: Readonly<Record<MetricName, unknown>> = metrics;
    for (const name of metricNames) {
      const { a, b } = trial.metrics[name];
      expect({ a: a.map(rounded), b: b.map(rounded) }).toEqual(committed[name]);
    }
  });

  it('assigns slots as the hand-computed table does', () => {
    const { members, slotRoles, costs, handComputed } = costTable;
    expect(assignSlots(members, slotRoles, costs as SlotCosts)).toEqual(handComputed.assignment);
  });
});
