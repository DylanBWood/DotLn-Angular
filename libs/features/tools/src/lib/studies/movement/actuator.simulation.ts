import type { StudyParameters } from '@dotln-angular/models';
import { clipLength, matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface ActuatorParameters {
  readonly beltSpeed: number;
  readonly impossibleSpeed: number;
  readonly initialSpeed: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ActuatorState {
  readonly position: number;
  readonly velocity: number;
}

export interface ActuatorStep {
  readonly agreed: number;
  readonly feasible: number;
  readonly rawAcceleration: number;
  readonly acceleration: number;
  readonly next: ActuatorState;
}

export const readParameters = (parameters: StudyParameters): ActuatorParameters => ({
  beltSpeed: numberParameter(parameters, 'beltSpeed'),
  impossibleSpeed: numberParameter(parameters, 'impossibleSpeed'),
  initialSpeed: numberParameter(parameters, 'initialSpeed'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** One velocity-channel actuator, followed by the study's fixed-step motion harness. */
export function actuatorStep(
  state: ActuatorState,
  example: ActuatorParameters,
  agreed = example.beltSpeed,
): ActuatorStep {
  const feasible = clipLength({ x: agreed, y: 0 }, example.maxSpeed);
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const acceleration = matchVelocity(body, feasible, example.responseTime);
  const velocity = clipLength(
    { x: state.velocity + acceleration.x * example.timeStep, y: 0 },
    example.maxSpeed,
  ).x;
  return {
    agreed,
    feasible: feasible.x,
    rawAcceleration: (feasible.x - state.velocity) / example.responseTime,
    acceleration: acceleration.x,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export interface ActuatorSample {
  readonly state: ActuatorState;
  readonly calculation: ReturnType<typeof actuatorStep>;
  readonly next: ActuatorState;
}

export function actuatorSamples(
  example: ActuatorParameters,
  agreed = example.beltSpeed,
): readonly ActuatorSample[] {
  const samples: ActuatorSample[] = [];
  let state: ActuatorState = { position: 0, velocity: example.initialSpeed };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = actuatorStep(state, example, agreed);
    samples.push({ state, calculation, next: calculation.next });
    state = calculation.next;
  }
  return samples;
}

export function actuatorFrames(
  example: ActuatorParameters,
  agreed = example.beltSpeed,
): readonly ActuatorState[] {
  return actuatorSamples(example, agreed).map(({ state }) => state);
}
