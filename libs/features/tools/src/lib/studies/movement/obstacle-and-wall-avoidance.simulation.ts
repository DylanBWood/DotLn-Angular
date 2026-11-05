import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  dot,
  length,
  normalize,
  scale,
  seek,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface WallAvoidanceParameters {
  readonly startX: number;
  readonly startY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly goalX: number;
  readonly goalY: number;
  readonly wallX: number;
  readonly wallBottom: number;
  readonly wallTop: number;
  readonly radius: number;
  readonly rayLength: number;
  readonly avoidDistance: number;
  readonly comparisonRayLength: number;
  readonly comparisonGoalY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface WallAvoidanceState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
}

export interface WallRayHit {
  readonly point: Vec2;
  readonly normal: Vec2;
  readonly rayFraction: number;
  readonly wallFraction: number;
}

export interface WallAvoidanceStep {
  readonly rayEnd: Vec2;
  readonly hit: WallRayHit | null;
  readonly avoidanceTarget: Vec2 | null;
  readonly selectedTarget: Vec2;
  readonly acceleration: Vec2;
  readonly clearance: number;
  readonly next: WallAvoidanceState;
}

export const readParameters = (parameters: StudyParameters): WallAvoidanceParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  goalX: numberParameter(parameters, 'goalX'),
  goalY: numberParameter(parameters, 'goalY'),
  wallX: numberParameter(parameters, 'wallX'),
  wallBottom: numberParameter(parameters, 'wallBottom'),
  wallTop: numberParameter(parameters, 'wallTop'),
  radius: numberParameter(parameters, 'radius'),
  rayLength: numberParameter(parameters, 'rayLength'),
  avoidDistance: numberParameter(parameters, 'avoidDistance'),
  comparisonRayLength: numberParameter(parameters, 'comparisonRayLength'),
  comparisonGoalY: numberParameter(parameters, 'comparisonGoalY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const cross = (left: Vec2, right: Vec2) => left.x * right.y - left.y * right.x;

export const wallStart = (example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: example.wallBottom,
});

export const wallEnd = (example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: example.wallTop,
});

export const goal = (example: WallAvoidanceParameters): Vec2 => ({
  x: example.goalX,
  y: example.goalY,
});

export const nearestWallPoint = (position: Vec2, example: WallAvoidanceParameters): Vec2 => ({
  x: example.wallX,
  y: Math.max(example.wallBottom, Math.min(example.wallTop, position.y)),
});

/** Distance from the disc to the finite wall, including its ends; negative means overlap. */
export const wallClearance = (position: Vec2, example: WallAvoidanceParameters) =>
  distance(position, nearestWallPoint(position, example)) - example.radius;

/** Intersect two finite segments, returning a surface normal opposed to the incoming ray. */
export function castWallRay(from: Vec2, to: Vec2, wallFrom: Vec2, wallTo: Vec2): WallRayHit | null {
  const ray = subtract(to, from);
  const wall = subtract(wallTo, wallFrom);
  const denominator = cross(ray, wall);
  if (denominator === 0) return null;
  const offset = subtract(wallFrom, from);
  const rayFraction = cross(offset, wall) / denominator;
  const wallFraction = cross(offset, ray) / denominator;
  if (rayFraction < 0 || rayFraction > 1 || wallFraction < 0 || wallFraction > 1) return null;
  const outward = normalize({ x: -wall.y, y: wall.x });
  return {
    point: add(from, scale(ray, rayFraction)),
    normal: dot(outward, ray) > 0 ? scale(outward, -1) : outward,
    rayFraction,
    wallFraction,
  };
}

export const initialWallAvoidanceState = (example: WallAvoidanceParameters): WallAvoidanceState => {
  const velocity = { x: example.velocityX, y: example.velocityY };
  return {
    position: { x: example.startX, y: example.startY },
    velocity,
    heading: length(velocity) === 0 ? { x: 1, y: 0 } : normalize(velocity),
  };
};

/** The detector and target construction are local; both target pulls use engine seek. */
export function calculateWallAvoidanceStep(
  state: WallAvoidanceState,
  example: WallAvoidanceParameters,
  rayLength = example.rayLength,
): WallAvoidanceStep {
  const direction = length(state.velocity) === 0 ? state.heading : normalize(state.velocity);
  const rayEnd = add(state.position, scale(direction, rayLength));
  const hit = castWallRay(state.position, rayEnd, wallStart(example), wallEnd(example));
  const avoidanceTarget =
    hit === null ? null : add(hit.point, scale(hit.normal, example.avoidDistance));
  const selectedTarget = avoidanceTarget ?? goal(example);
  const acceleration = seek(
    {
      ...state,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      radius: example.radius,
      wanderAngle: 0,
    },
    selectedTarget,
  );
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    rayEnd,
    hit,
    avoidanceTarget,
    selectedTarget,
    acceleration,
    clearance: wallClearance(state.position, example),
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
      heading: length(velocity) === 0 ? state.heading : normalize(velocity),
    },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface WallAvoidanceSample {
  readonly state: WallAvoidanceState;
  readonly calculation: ReturnType<typeof calculateWallAvoidanceStep>;
  readonly next: WallAvoidanceState;
}

export function wallAvoidanceSamples(
  example: WallAvoidanceParameters,
  rayLength = example.rayLength,
): readonly WallAvoidanceSample[] {
  const samples: WallAvoidanceSample[] = [];
  let state: WallAvoidanceState = initialWallAvoidanceState(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateWallAvoidanceStep(state, example, rayLength);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function wallAvoidanceFrames(
  example: WallAvoidanceParameters,
  rayLength = example.rayLength,
): readonly WallAvoidanceState[] {
  return wallAvoidanceSamples(example, rayLength).map(({ state }) => state);
}
