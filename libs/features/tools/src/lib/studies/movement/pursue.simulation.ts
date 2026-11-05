import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  length,
  scale,
  seek,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface PursueParameters {
  readonly startX: number;
  readonly startY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly targetVelocityX: number;
  readonly targetVelocityY: number;
  readonly turnedVelocityX: number;
  readonly turnedVelocityY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly maxPrediction: number;
  readonly turnAt: number;
  readonly comparisonTurnAt: number;
  readonly tagRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface RunnerState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface PursueStep {
  readonly distance: number;
  readonly speed: number;
  readonly prediction: number;
  readonly predicted: Vec2;
  readonly acceleration: Vec2;
  readonly trialVelocity: Vec2;
  readonly next: RunnerState;
}

export interface PursueFrame {
  readonly seconds: number;
  readonly ash: RunnerState;
  readonly reed: RunnerState;
  readonly calculation: PursueStep;
  readonly forecastError: number;
}

export const readParameters = (parameters: StudyParameters): PursueParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  targetVelocityX: numberParameter(parameters, 'targetVelocityX'),
  targetVelocityY: numberParameter(parameters, 'targetVelocityY'),
  turnedVelocityX: numberParameter(parameters, 'turnedVelocityX'),
  turnedVelocityY: numberParameter(parameters, 'turnedVelocityY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxPrediction: numberParameter(parameters, 'maxPrediction'),
  turnAt: numberParameter(parameters, 'turnAt'),
  comparisonTurnAt: numberParameter(parameters, 'comparisonTurnAt'),
  tagRadius: numberParameter(parameters, 'tagRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const predictionTime = (gap: number, speed: number, maximum: number): number =>
  speed === 0 ? maximum : Math.min(maximum, gap / speed);

/** Only current runner data enters the local predictor; the acceleration is engine seek. */
export function calculatePursueStep(
  ash: RunnerState,
  reed: RunnerState,
  example: PursueParameters,
): PursueStep {
  const gap = distance(ash.position, reed.position);
  const speed = length(ash.velocity);
  const prediction = predictionTime(gap, speed, example.maxPrediction);
  const predicted = add(reed.position, scale(reed.velocity, prediction));
  const acceleration = seek(
    {
      ...ash,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      // Seek reads neither facing nor the other behaviour-specific fields.
      heading: zero,
      radius: 0,
      wanderAngle: 0,
    },
    predicted,
  );
  const trialVelocity = add(ash.velocity, scale(acceleration, example.timeStep));
  const velocity = clipLength(trialVelocity, example.maxSpeed);
  return {
    distance: gap,
    speed,
    prediction,
    predicted,
    acceleration,
    trialVelocity,
    next: { position: add(ash.position, scale(velocity, example.timeStep)), velocity },
  };
}

/** The example's runner script, including exact positions between simulation samples. */
export function runnerAt(seconds: number, example: PursueParameters): RunnerState {
  const before = Math.min(seconds, example.turnAt);
  const after = Math.max(0, seconds - example.turnAt);
  const initialVelocity = { x: example.targetVelocityX, y: example.targetVelocityY };
  const turnedVelocity = { x: example.turnedVelocityX, y: example.turnedVelocityY };
  return {
    position: add(
      { x: example.targetX, y: example.targetY },
      add(scale(initialVelocity, before), scale(turnedVelocity, after)),
    ),
    velocity: seconds < example.turnAt ? initialVelocity : turnedVelocity,
  };
}

export function pursueFrames(example: PursueParameters): readonly PursueFrame[] {
  let ash: RunnerState = {
    position: { x: example.startX, y: example.startY },
    velocity: { x: example.velocityX, y: example.velocityY },
  };
  const frames: PursueFrame[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const seconds = step * example.timeStep;
    const reed = runnerAt(seconds, example);
    const calculation = calculatePursueStep(ash, reed, example);
    // Future script data is a diagnostic only; it never feeds the predictor or motion.
    const actualFuture = runnerAt(seconds + calculation.prediction, example).position;
    frames.push({
      seconds,
      ash,
      reed,
      calculation,
      forecastError: distance(calculation.predicted, actualFuture),
    });
    ash = calculation.next;
  }
  return frames;
}
