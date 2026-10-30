import { applyStep } from './interpreter';
import { advance, createSimulation } from './simulation';
import type { CompositionStep, SceneDefinition, SimulationState, StepRefusal } from './types';

/** A run in progress: the scene, the steps still to come, and the latest refusal if any. */
export interface SceneRun {
  readonly simulation: SimulationState;
  readonly scheduled: readonly CompositionStep[];
  readonly refusal: StepRefusal | null;
}

export const startRun = (
  definition: SceneDefinition,
  scheduled: readonly CompositionStep[] = [],
): SceneRun => ({ simulation: createSimulation(definition), scheduled, refusal: null });

// A refused step never hides an earlier refusal: in a replay, the next good step would otherwise
// wipe it before anyone could read it.
function applyOne(run: SceneRun, step: CompositionStep): SceneRun {
  const { state, refusal } = applyStep(run.simulation, step);
  return { ...run, simulation: state, refusal: refusal ?? run.refusal };
}

function applyDue(run: SceneRun): SceneRun {
  const { tick } = run.simulation;
  const due = run.scheduled.filter((step) => step.at === tick);
  if (due.length === 0) return run;
  return {
    ...due.reduce(applyOne, run),
    scheduled: run.scheduled.filter((step) => step.at > tick),
  };
}

/**
 * The operator's own step, which answers for itself alone. What falls due on this frame goes
 * first, in the order a replay would apply them, so the live run and its replay stay the same.
 */
export const applyToRun = (run: SceneRun, step: CompositionStep): SceneRun =>
  applyOne(applyDue({ ...run, refusal: null }), step);

/** Applies what falls due at each frame, then steps the scene, `ticks` times over. */
export function advanceRun(run: SceneRun, ticks: number): SceneRun {
  let current = run;
  for (let tick = 0; tick < ticks; tick += 1) {
    const applied = applyDue(current);
    current = { ...applied, simulation: advance(applied.simulation) };
  }
  return current;
}
