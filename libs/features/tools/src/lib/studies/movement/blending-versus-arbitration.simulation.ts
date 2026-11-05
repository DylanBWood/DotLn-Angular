import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  firstActive,
  length,
  scale,
  seek,
  type SteeringBody,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface CombinationParameters {
  readonly startX: number;
  readonly marshalX: number;
  readonly targetX: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly marshalWeight: number;
  readonly goalWeight: number;
  readonly holdSeconds: number;
  readonly fadeSeconds: number;
  readonly epsilon: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly heavierWeight: number;
}

export interface CombinationState {
  readonly position: number;
  readonly velocity: number;
}

export interface CombinedRequests {
  readonly blended: Vec2;
  readonly arbitrated: Vec2;
  readonly marshalGroup: Vec2;
  readonly goalGroup: Vec2;
  readonly winner: 'marshal' | 'destination' | 'none';
}

export interface CombinationStep extends CombinedRequests {
  readonly signal: number;
  readonly marshal: Vec2;
  readonly goal: Vec2;
  readonly acceleration: number;
  readonly next: CombinationState;
}

export const readParameters = (parameters: StudyParameters): CombinationParameters => ({
  startX: numberParameter(parameters, 'startX'),
  marshalX: numberParameter(parameters, 'marshalX'),
  targetX: numberParameter(parameters, 'targetX'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  marshalWeight: numberParameter(parameters, 'marshalWeight'),
  goalWeight: numberParameter(parameters, 'goalWeight'),
  holdSeconds: numberParameter(parameters, 'holdSeconds'),
  fadeSeconds: numberParameter(parameters, 'fadeSeconds'),
  epsilon: numberParameter(parameters, 'epsilon'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  heavierWeight: numberParameter(parameters, 'heavierWeight'),
});

/** A scripted hand signal holds, then fades; it is an example input, not a sensor model. */
export const marshalSignal = (seconds: number, example: CombinationParameters) =>
  Math.max(0, Math.min(1, 1 - (seconds - example.holdSeconds) / example.fadeSeconds));

/** Both policies use the public engine. Priority groups are capped before firstActive selects. */
export function combineRequests(
  marshal: Vec2,
  goal: Vec2,
  example: CombinationParameters,
  marshalWeight = example.marshalWeight,
): CombinedRequests {
  const marshalTerm = { acceleration: marshal, weight: marshalWeight };
  const goalTerm = { acceleration: goal, weight: example.goalWeight };
  const marshalGroup = blend([marshalTerm], example.maxAcceleration);
  const goalGroup = blend([goalTerm], example.maxAcceleration);
  return {
    blended: blend([marshalTerm, goalTerm], example.maxAcceleration),
    arbitrated: firstActive([marshalGroup, goalGroup], example.epsilon),
    marshalGroup,
    goalGroup,
    winner:
      length(marshalGroup) > example.epsilon
        ? 'marshal'
        : length(goalGroup) > example.epsilon
          ? 'destination'
          : 'none',
  };
}

export function calculateCombinationStep(
  state: CombinationState,
  seconds: number,
  example: CombinationParameters,
  policy: 'blend' | 'priority',
  marshalWeight = example.marshalWeight,
): CombinationStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const signal = marshalSignal(seconds, example);
  const marshal = scale(seek(body, { x: example.marshalX, y: 0 }), signal);
  const goal = seek(body, { x: example.targetX, y: 0 });
  const combined = combineRequests(marshal, goal, example, marshalWeight);
  const acceleration = (policy === 'blend' ? combined.blended : combined.arbitrated).x;
  const velocity = clipLength(
    add(body.velocity, { x: acceleration * example.timeStep, y: 0 }),
    example.maxSpeed,
  ).x;
  return {
    ...combined,
    signal,
    marshal,
    goal,
    acceleration,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface CombinationSample {
  readonly state: CombinationState;
  readonly calculation: ReturnType<typeof calculateCombinationStep>;
  readonly next: CombinationState;
}

export function combinationSamples(
  example: CombinationParameters,
  policy: 'blend' | 'priority',
  marshalWeight = example.marshalWeight,
): readonly CombinationSample[] {
  const samples: CombinationSample[] = [];
  let state: CombinationState = { position: example.startX, velocity: 0 };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateCombinationStep(
      state,
      step * example.timeStep,
      example,
      policy,
      marshalWeight,
    );
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function combinationStates(
  example: CombinationParameters,
  policy: 'blend' | 'priority',
  marshalWeight = example.marshalWeight,
): readonly CombinationState[] {
  return combinationSamples(example, policy, marshalWeight).map(({ state }) => state);
}

/** Compare another weight at the same state using its already evaluated steering requests. */
export const heavierPriority = (
  calculation: CombinationStep,
  example: CombinationParameters,
): number =>
  combineRequests(calculation.marshal, calculation.goal, example, example.heavierWeight).arbitrated
    .x;
