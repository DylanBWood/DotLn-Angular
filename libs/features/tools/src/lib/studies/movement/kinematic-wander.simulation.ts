import type { StudyParameters } from '@dotln-angular/models';
import { add, cosine, dot, normalize, scale, sine, type Vec2 } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface KinematicWanderParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startHeading: number;
  readonly speed: number;
  readonly maxRotation: number;
  readonly seed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly failureRotation: number;
}

export interface KinematicWanderState {
  readonly position: Vec2;
  readonly heading: number;
  readonly seed: number;
}

interface WanderUpdate {
  readonly velocity: Vec2;
  readonly turnRate: number;
  readonly headingChange: number;
  readonly next: KinematicWanderState;
}

export const readParameters = (parameters: StudyParameters): KinematicWanderParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startHeading: numberParameter(parameters, 'startHeading'),
  speed: numberParameter(parameters, 'speed'),
  maxRotation: numberParameter(parameters, 'maxRotation'),
  seed: numberParameter(parameters, 'seed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  failureRotation: numberParameter(parameters, 'failureRotation'),
});

/** Study-local mulberry32; the engine's seeded random helpers are not public exports. */
function uniformDraw(seed: number) {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let mixed = Math.imul(nextSeed ^ (nextSeed >>> 15), 1 | nextSeed);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, seed: nextSeed };
}

export const facing = (heading: number) => normalize({ x: cosine(heading), y: sine(heading) });

/** Direct velocity and angle integration, rather than the engine's acceleration-based wander. */
export function applyKinematicWander(
  state: KinematicWanderState,
  sample: number,
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
): WanderUpdate {
  const velocity = scale(facing(state.heading), example.speed);
  const turnRate = sample * maxRotation;
  const headingChange = turnRate * example.timeStep;
  return {
    velocity,
    turnRate,
    headingChange,
    next: {
      ...state,
      position: add(state.position, scale(velocity, example.timeStep)),
      heading: state.heading + headingChange,
    },
  };
}

export function kinematicWanderStep(
  state: KinematicWanderState,
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
) {
  const first = uniformDraw(state.seed);
  const second = uniformDraw(first.seed);
  const sample = first.value - second.value;
  const update = applyKinematicWander(state, sample, example, maxRotation);
  return {
    ...update,
    first: first.value,
    second: second.value,
    sample,
    next: { ...update.next, seed: second.seed },
  };
}

export interface KinematicWanderSample {
  readonly state: KinematicWanderState;
  readonly calculation: ReturnType<typeof kinematicWanderStep>;
  readonly next: KinematicWanderState;
}

export function kinematicWanderSamples(
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
): readonly KinematicWanderSample[] {
  const samples: KinematicWanderSample[] = [];
  let state: KinematicWanderState = {
    position: { x: example.startX, y: example.startY },
    heading: example.startHeading,
    seed: example.seed,
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = kinematicWanderStep(state, example, maxRotation);
    samples.push({ state, calculation, next: calculation.next });
    state = calculation.next;
  }
  return samples;
}

export function kinematicWanderFrames(
  example: KinematicWanderParameters,
  maxRotation = example.maxRotation,
): readonly KinematicWanderState[] {
  return kinematicWanderSamples(example, maxRotation).map(({ state }) => state);
}

export const changesOf = (states: readonly KinematicWanderState[]) =>
  states.map((state, step) =>
    step + 1 < states.length ? Math.abs(states[step + 1].heading - state.heading) : 0,
  );

export const kinematicReversals = (states: readonly KinematicWanderState[]) =>
  states
    .slice(1)
    .filter((state, step) => dot(facing(states[step].heading), facing(state.heading)) < 0).length;
