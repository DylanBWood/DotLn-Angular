import { firstDivergence } from './hash';
import { measure, metricNames } from './metrics';
import { advanceRun, type SceneRun, startRun } from './run';
import { frameOf } from './simulation';
import type {
  CompositionStep,
  MetricName,
  SceneDefinition,
  SceneFrame,
  SceneMetrics,
  SimulationState,
  Trial,
  TrialBranch,
  TrialSeries,
  UnitId,
} from './types';

/** Runs a step list from the start, returning the state of every frame from 0 to `frames`. */
export function runBranch(
  definition: SceneDefinition,
  steps: readonly CompositionStep[],
  frames: number,
): readonly SimulationState[] {
  const states: SimulationState[] = [];
  let run = startRun(definition, steps);
  for (let frame = 0; frame <= frames; frame += 1) {
    states.push(run.simulation);
    if (frame < frames) run = advanceRun(run, 1);
  }
  return states;
}

export interface TrialRequest {
  readonly id: string;
  /**
   * Branch B as the window opens, nothing applied yet on its frame. The branches share what came
   * before it, so it runs once, and it is left to the caller to run on from.
   */
  readonly start: SceneRun;
  readonly branchA: TrialBranch;
  readonly branchB: TrialBranch;
  readonly frames: number;
  readonly sampleEvery: number;
  readonly focus: readonly UnitId[];
}

/** A trial, with the working it took that is too big to keep on the trial itself. */
export interface TrialOutcome {
  readonly trial: Trial;
  /** Branch A through the window, a frame for each frame from the start on. */
  readonly framesA: readonly SceneFrame[];
}

function runWindow(
  start: SceneRun,
  frames: number,
  sampleEvery: number,
  focus: readonly UnitId[],
): { readonly frames: readonly SceneFrame[]; readonly readings: readonly SceneMetrics[] } {
  const seen: SceneFrame[] = [];
  const readings: SceneMetrics[] = [];
  let run = start;
  for (let frame = 0; frame <= frames; frame += 1) {
    seen.push(frameOf(run.simulation));
    if (frame % sampleEvery === 0) readings.push(measure(run.simulation, focus));
    if (frame < frames) run = advanceRun(run, 1);
  }
  return { frames: seen, readings };
}

/**
 * Runs both branches over the same window from one state and marks where they part. Only the
 * window is kept: a comparison after an hour's play costs what the hour's steps cost to reach it,
 * and no more memory than one made in the first minute.
 */
export function runTrial(request: TrialRequest): TrialOutcome {
  const { start, branchA, branchB, frames, sampleEvery, focus } = request;
  const { definition, tick: from } = start.simulation;
  const startA: SceneRun = {
    ...start,
    scheduled: branchA.steps.filter((step) => step.at >= from),
  };
  const a = runWindow(startA, frames, sampleEvery, focus);
  const b = runWindow(start, frames, sampleEvery, focus);
  const metrics = Object.fromEntries(
    metricNames.map((name): [MetricName, TrialSeries] => [
      name,
      {
        a: a.readings.map((reading) => reading[name]),
        b: b.readings.map((reading) => reading[name]),
      },
    ]),
  ) as Record<MetricName, TrialSeries>;
  return {
    trial: {
      id: request.id,
      sceneId: definition.id,
      seed: definition.seed,
      from,
      frames,
      sampleEvery,
      focus,
      branchA,
      branchB,
      metrics,
      firstDivergenceFrame: firstDivergence(a.frames, b.frames),
    },
    framesA: a.frames,
  };
}
