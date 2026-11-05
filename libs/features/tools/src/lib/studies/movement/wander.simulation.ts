import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  alongHeading,
  clipLength,
  cosine,
  length,
  normalize,
  scale,
  sine,
  type SteeringBody,
  subtract,
  type Vec2,
  wander,
} from '@dotln-angular/scene-engine';

import { numberParameter, textParameter } from '../parameters';

export interface WanderParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startHeading: number;
  readonly startSpeed: number;
  readonly initialAngle: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly wanderRadius: number;
  readonly narrowRadius: number;
  readonly wanderOffset: number;
  readonly turnScale: number;
  readonly walkingFraction: number;
  readonly drawPairs: string;
  readonly timeStep: number;
  readonly steps: number;
  readonly radius: number;
  readonly arrowSeconds: number;
}

export interface WanderState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
  readonly wanderAngle: number;
}

export interface DrawPair {
  readonly first: number;
  readonly second: number;
}

export interface WanderStep {
  readonly draw: DrawPair;
  readonly binomial: number;
  readonly angle: number;
  readonly centre: Vec2;
  readonly target: Vec2;
  readonly desired: Vec2;
  readonly requestedAcceleration: Vec2;
  readonly acceleration: Vec2;
  readonly desiredTurn: number;
  readonly actualTurn: number;
  readonly next: WanderState;
}

export function drawTape(written: string): readonly DrawPair[] {
  return written.split(',').map((pair) => {
    const parts = pair.split(':');
    const values = parts.map(Number);
    if (
      parts.length !== 2 ||
      parts.some((part) => !part.trim()) ||
      values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
    )
      throw new Error('The wander tape needs pairs of uniform inputs between zero and one.');
    return { first: values[0], second: values[1] };
  });
}

export const readParameters = (parameters: StudyParameters): WanderParameters => {
  const example: WanderParameters = {
    startX: numberParameter(parameters, 'startX'),
    startY: numberParameter(parameters, 'startY'),
    startHeading: numberParameter(parameters, 'startHeading'),
    startSpeed: numberParameter(parameters, 'startSpeed'),
    initialAngle: numberParameter(parameters, 'initialAngle'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    wanderRadius: numberParameter(parameters, 'wanderRadius'),
    narrowRadius: numberParameter(parameters, 'narrowRadius'),
    wanderOffset: numberParameter(parameters, 'wanderOffset'),
    turnScale: numberParameter(parameters, 'turnScale'),
    walkingFraction: numberParameter(parameters, 'walkingFraction'),
    drawPairs: textParameter(parameters, 'drawPairs'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    radius: numberParameter(parameters, 'radius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
  };
  const numbers = Object.values(example).filter(
    (value): value is number => typeof value === 'number',
  );
  if (
    !numbers.every(Number.isFinite) ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.responseTime <= 0 ||
    example.timeStep <= 0 ||
    example.wanderRadius < 0 ||
    example.narrowRadius < 0 ||
    example.wanderOffset <= 0 ||
    example.radius <= 0 ||
    example.arrowSeconds <= 0 ||
    example.turnScale < 0 ||
    example.startSpeed < 0 ||
    example.startSpeed > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error('Wander needs finite values, positive motion limits and 2–239 steps.');
  // This parameter records an engine constant, rather than introducing a second speed rule.
  if (example.walkingFraction !== 0.4)
    throw new Error('The scene engine fixes wander walkingFraction at 0.4.');
  drawTape(example.drawPairs);
  return example;
};

// The engine's angle update is internal to its full simulation; the study uses the same range.
const wrapAngle = (angle: number) =>
  angle - Math.floor((angle + Math.PI) / (2 * Math.PI)) * (2 * Math.PI);

export const turnBetween = (before: Vec2, after: Vec2) =>
  Math.atan2(before.x * after.y - before.y * after.x, before.x * after.x + before.y * after.y);

export function initialWanderState(example: WanderParameters): WanderState {
  const heading = normalize({ x: cosine(example.startHeading), y: sine(example.startHeading) });
  return {
    position: { x: example.startX, y: example.startY },
    velocity: scale(heading, example.startSpeed),
    heading,
    wanderAngle: example.initialAngle,
  };
}

/** A fixed tape supplies the draws; the engine supplies the actual wander acceleration. */
export function calculateWanderStep(
  state: WanderState,
  step: number,
  example: WanderParameters,
  wanderRadius = example.wanderRadius,
): WanderStep {
  const tape = drawTape(example.drawPairs);
  const draw = tape[step % tape.length];
  const binomial = draw.first - draw.second;
  const angle = wrapAngle(state.wanderAngle + binomial * example.turnScale);
  const centre = add(state.position, scale(state.heading, example.wanderOffset));
  const onCircle = alongHeading({ x: cosine(angle), y: sine(angle) }, state.heading);
  const target = add(centre, scale(onCircle, wanderRadius));
  // Match the engine's relative-vector arithmetic, avoiding subtraction of large positions.
  const direction = normalize(
    add(scale(state.heading, example.wanderOffset), scale(onCircle, wanderRadius)),
  );
  const desired = scale(direction, example.maxSpeed * example.walkingFraction);
  const requestedAcceleration = scale(subtract(desired, state.velocity), 1 / example.responseTime);
  const body: SteeringBody = {
    ...state,
    wanderAngle: angle,
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
  };
  const acceleration = wander(body, {
    wanderRadius,
    wanderOffset: example.wanderOffset,
    timeToTarget: example.responseTime,
  });
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const heading = length(velocity) === 0 ? state.heading : normalize(velocity);
  return {
    draw,
    binomial,
    angle,
    centre,
    target,
    desired,
    requestedAcceleration,
    acceleration,
    desiredTurn: turnBetween(state.heading, direction),
    actualTurn: turnBetween(state.heading, heading),
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
      heading,
      wanderAngle: angle,
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface WanderSample {
  readonly state: WanderState;
  readonly calculation: ReturnType<typeof calculateWanderStep>;
  readonly next: WanderState;
}

export function wanderSamples(
  example: WanderParameters,
  wanderRadius = example.wanderRadius,
): readonly WanderSample[] {
  const samples: WanderSample[] = [];
  let state: WanderState = initialWanderState(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateWanderStep(state, step, example, wanderRadius);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function wanderFrames(
  example: WanderParameters,
  wanderRadius = example.wanderRadius,
): readonly WanderState[] {
  return wanderSamples(example, wanderRadius).map(({ state }) => state);
}
