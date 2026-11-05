import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { StudyPoint } from '../study-model';
import {
  type AlignStep,
  type AngularState,
  type AngularTuning,
  calculateAlignStep,
} from './align.simulation';

export interface FaceParameters extends AngularTuning {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly initialHeading: number;
  readonly initialAngularSpeed: number;
  readonly targetStartX: number;
  readonly targetStartY: number;
  readonly targetVelocityX: number;
  readonly targetVelocityY: number;
  readonly travelDuration: number;
  readonly directionLength: number;
  readonly steps: number;
  readonly slowMotorSpeed: number;
}

export interface FaceStep {
  readonly offset: StudyPoint;
  /** There is no bearing when the beacon and camera coincide. */
  readonly bearing: number | null;
  readonly alignment: AlignStep;
}

export const readParameters = (parameters: StudyParameters): FaceParameters => ({
  cameraX: numberParameter(parameters, 'cameraX'),
  cameraY: numberParameter(parameters, 'cameraY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialAngularSpeed: numberParameter(parameters, 'initialAngularSpeed'),
  targetStartX: numberParameter(parameters, 'targetStartX'),
  targetStartY: numberParameter(parameters, 'targetStartY'),
  targetVelocityX: numberParameter(parameters, 'targetVelocityX'),
  targetVelocityY: numberParameter(parameters, 'targetVelocityY'),
  travelDuration: numberParameter(parameters, 'travelDuration'),
  directionLength: numberParameter(parameters, 'directionLength'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxAngularSpeed: numberParameter(parameters, 'maxAngularSpeed'),
  maxAngularAcceleration: numberParameter(parameters, 'maxAngularAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  angleTolerance: numberParameter(parameters, 'angleTolerance'),
  speedTolerance: numberParameter(parameters, 'speedTolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  slowMotorSpeed: numberParameter(parameters, 'slowMotorSpeed'),
});

/** The ferry beacon follows its given path, then waits at the end of the crossing. */
export const beaconAt = (seconds: number, example: FaceParameters): StudyPoint => ({
  x: example.targetStartX + example.targetVelocityX * Math.min(seconds, example.travelDuration),
  y: example.targetStartY + example.targetVelocityY * Math.min(seconds, example.travelDuration),
});

/** Face derives an angular target and delegates to the same local Align step. */
export function calculateFaceStep(
  state: AngularState,
  target: StudyPoint,
  example: FaceParameters,
): FaceStep {
  const offset = { x: target.x - example.cameraX, y: target.y - example.cameraY };
  const bearing =
    offset.x === 0 && offset.y === 0 ? null : (Math.atan2(offset.y, offset.x) * 180) / Math.PI;
  return {
    offset,
    bearing,
    // Without a direction, ask Align to brake at the current heading rather than inventing one.
    alignment: calculateAlignStep(state, bearing ?? state.heading, example),
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface FaceSample {
  readonly state: AngularState;
  readonly calculation: ReturnType<typeof calculateFaceStep>;
  readonly next: AngularState;
}

export function faceSamples(
  example: FaceParameters,
  maxAngularSpeed = example.maxAngularSpeed,
): readonly FaceSample[] {
  const tuning = { ...example, maxAngularSpeed };
  const samples: FaceSample[] = [];
  let state: AngularState = {
    heading: example.initialHeading,
    angularVelocity: example.initialAngularSpeed,
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateFaceStep(
      state,
      beaconAt(step * example.timeStep, example),
      tuning,
    );
    const next = calculation.alignment.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function faceFrames(
  example: FaceParameters,
  maxAngularSpeed = example.maxAngularSpeed,
): readonly AngularState[] {
  return faceSamples(example, maxAngularSpeed).map(({ state }) => state);
}
