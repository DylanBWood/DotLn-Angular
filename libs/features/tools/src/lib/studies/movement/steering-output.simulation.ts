import type { StudyParameters } from '@dotln-angular/models';
import { add, scale, type Vec2, zero } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface OutputParameters {
  readonly initialX: number;
  readonly initialY: number;
  readonly initialVelocityX: number;
  readonly initialVelocityY: number;
  readonly initialHeading: number;
  readonly initialRotation: number;
  readonly linearAccelerationX: number;
  readonly linearAccelerationY: number;
  readonly angularAcceleration: number;
  readonly pulseSeconds: number;
  readonly comparisonLinearAccelerationY: number;
  readonly timeStep: number;
  readonly steps: number;
}

/** This study's output record; the scene engine exposes linear requests, not an angular one. */
export interface SteeringOutput {
  readonly linear: Vec2;
  readonly angular: number;
}

export interface OutputState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: number;
  readonly rotation: number;
}

export interface OutputStep {
  readonly seconds: number;
  readonly state: OutputState;
  readonly output: SteeringOutput;
  readonly next: OutputState;
}

export const readParameters = (parameters: StudyParameters): OutputParameters => ({
  initialX: numberParameter(parameters, 'initialX'),
  initialY: numberParameter(parameters, 'initialY'),
  initialVelocityX: numberParameter(parameters, 'initialVelocityX'),
  initialVelocityY: numberParameter(parameters, 'initialVelocityY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialRotation: numberParameter(parameters, 'initialRotation'),
  linearAccelerationX: numberParameter(parameters, 'linearAccelerationX'),
  linearAccelerationY: numberParameter(parameters, 'linearAccelerationY'),
  angularAcceleration: numberParameter(parameters, 'angularAcceleration'),
  pulseSeconds: numberParameter(parameters, 'pulseSeconds'),
  comparisonLinearAccelerationY: numberParameter(parameters, 'comparisonLinearAccelerationY'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

export function outputAt(
  seconds: number,
  example: OutputParameters,
  linearAccelerationY = example.linearAccelerationY,
): SteeringOutput {
  return seconds < example.pulseSeconds
    ? {
        linear: { x: example.linearAccelerationX, y: linearAccelerationY },
        angular: example.angularAcceleration,
      }
    : { linear: zero, angular: 0 };
}

/** A local consumer keeps acceleration, velocity and position as distinct quantities. */
export function applySteeringOutput(
  state: OutputState,
  output: SteeringOutput,
  timeStep: number,
): OutputState {
  const velocity = add(state.velocity, scale(output.linear, timeStep));
  const rotation = state.rotation + output.angular * timeStep;

  return {
    velocity,
    rotation,
    position: add(state.position, scale(velocity, timeStep)),
    heading: state.heading + rotation * timeStep,
  };
}

export function outputSteps(
  example: OutputParameters,
  linearAccelerationY = example.linearAccelerationY,
): readonly OutputStep[] {
  let state: OutputState = {
    position: { x: example.initialX, y: example.initialY },
    velocity: { x: example.initialVelocityX, y: example.initialVelocityY },
    heading: example.initialHeading,
    rotation: example.initialRotation,
  };
  const run: OutputStep[] = [];

  for (let index = 0; index <= example.steps; index++) {
    const seconds = index * example.timeStep;
    const output = outputAt(seconds, example, linearAccelerationY);
    const next = applySteeringOutput(state, output, example.timeStep);
    run.push({ seconds, state, output, next });
    state = next;
  }

  return run;
}

export function outputExperiment(example: OutputParameters) {
  const run = outputSteps(example);
  const comparison = outputSteps(example, example.comparisonLinearAccelerationY);
  const seconds = run.map(({ seconds }) => seconds);
  const firstCoast = run.findIndex(({ seconds }) => seconds >= example.pulseSeconds);
  const cutoff = firstCoast < 0 ? example.steps : firstCoast;
  const final = run[example.steps].state;
  const comparisonFinal = comparison[example.steps].state;
  const coast = run[cutoff].state;
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  const same = example.linearAccelerationY === example.comparisonLinearAccelerationY;
  return { run, comparison, seconds, cutoff, final, comparisonFinal, coast, inputValues, same };
}
