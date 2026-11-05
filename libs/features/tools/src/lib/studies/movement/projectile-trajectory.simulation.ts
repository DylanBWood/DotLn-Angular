import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';

export interface ProjectileParameters {
  readonly startX: number;
  readonly launchHeight: number;
  readonly horizontalSpeed: number;
  readonly verticalSpeed: number;
  readonly gravity: number;
  readonly landingHeight: number;
  readonly unreachableHeight: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ProjectileLanding {
  readonly discriminant: number;
  readonly time: number | null;
  readonly x: number | null;
  readonly impactVerticalVelocity: number | null;
  readonly apexHeight: number;
}

export interface ProjectileState {
  readonly seconds: number;
  readonly x: number;
  readonly height: number;
  readonly verticalVelocity: number;
  readonly landed: boolean;
}

export const readParameters = (parameters: StudyParameters): ProjectileParameters => ({
  startX: numberParameter(parameters, 'startX'),
  launchHeight: numberParameter(parameters, 'launchHeight'),
  horizontalSpeed: numberParameter(parameters, 'horizontalSpeed'),
  verticalSpeed: numberParameter(parameters, 'verticalSpeed'),
  gravity: numberParameter(parameters, 'gravity'),
  landingHeight: numberParameter(parameters, 'landingHeight'),
  unreachableHeight: numberParameter(parameters, 'unreachableHeight'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

/** The later root reaches the selected height on descent, rather than on the way up. */
export function predictProjectileLanding(
  example: ProjectileParameters,
  landingHeight = example.landingHeight,
): ProjectileLanding {
  const discriminant =
    example.verticalSpeed ** 2 + 2 * example.gravity * (example.launchHeight - landingHeight);
  const apexHeight =
    example.launchHeight + Math.max(0, example.verticalSpeed) ** 2 / (2 * example.gravity);
  const time =
    discriminant < 0 ? null : (example.verticalSpeed + Math.sqrt(discriminant)) / example.gravity;
  const futureTime = time !== null && time >= 0 ? time : null;

  return {
    discriminant,
    time: futureTime,
    x: futureTime === null ? null : example.startX + example.horizontalSpeed * futureTime,
    impactVerticalVelocity:
      futureTime === null ? null : example.verticalSpeed - example.gravity * futureTime,
    apexHeight,
  };
}

/** The engine has no ballistic update; this local calculation evaluates constant gravity exactly. */
export function projectileAt(
  example: ProjectileParameters,
  seconds: number,
  landingHeight = example.landingHeight,
  landing = predictProjectileLanding(example, landingHeight),
): ProjectileState {
  const landed = landing.time !== null && seconds >= landing.time;
  const time = landed && landing.time !== null ? landing.time : seconds;

  return {
    seconds: time,
    x: example.startX + example.horizontalSpeed * time,
    height: landed
      ? landingHeight
      : example.launchHeight + example.verticalSpeed * time - (example.gravity * time ** 2) / 2,
    verticalVelocity: landed ? 0 : example.verticalSpeed - example.gravity * time,
    landed,
  };
}

/** Fixed preview samples end with the actual landing event, even when it falls between them. */
export function projectileFrames(
  example: ProjectileParameters,
  landing = predictProjectileLanding(example),
): readonly ProjectileState[] {
  const frames: ProjectileState[] = [];

  for (let step = 0; step <= example.steps; step++) {
    const seconds = step * example.timeStep;
    if (landing.time !== null && seconds >= landing.time) {
      frames.push(projectileAt(example, landing.time, example.landingHeight, landing));
      break;
    }
    frames.push(projectileAt(example, seconds, example.landingHeight, landing));
  }

  return frames;
}
