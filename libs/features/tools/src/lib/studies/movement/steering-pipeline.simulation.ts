import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  clipLength,
  distance,
  dot,
  length,
  matchVelocity,
  normalize,
  scale,
  type SteeringBody,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface PipelineParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startVelocityX: number;
  readonly startVelocityY: number;
  readonly goalX: number;
  readonly goalY: number;
  readonly palletX: number;
  readonly palletY: number;
  readonly palletRadius: number;
  readonly courierRadius: number;
  readonly safetyMargin: number;
  readonly detourPadding: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly cornerSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly maxChecks: number;
  readonly failureChecks: number;
}

export interface PipelineState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  /** Only a route that passed the constraint may survive into the next update. */
  readonly route: readonly Vec2[];
}

export interface PipelineAttempt {
  readonly route: readonly Vec2[];
  readonly waypoint: Vec2;
  readonly routeClearance: number;
  readonly sweptClearance: number;
  readonly acceleration: Vec2;
  readonly accepted: boolean;
}

export interface PipelineStep {
  readonly goal: Vec2;
  readonly attempts: readonly PipelineAttempt[];
  readonly accepted: boolean;
  readonly acceleration: Vec2;
  readonly next: PipelineState;
}

export const readParameters = (parameters: StudyParameters): PipelineParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startVelocityX: numberParameter(parameters, 'startVelocityX'),
  startVelocityY: numberParameter(parameters, 'startVelocityY'),
  goalX: numberParameter(parameters, 'goalX'),
  goalY: numberParameter(parameters, 'goalY'),
  palletX: numberParameter(parameters, 'palletX'),
  palletY: numberParameter(parameters, 'palletY'),
  palletRadius: numberParameter(parameters, 'palletRadius'),
  courierRadius: numberParameter(parameters, 'courierRadius'),
  safetyMargin: numberParameter(parameters, 'safetyMargin'),
  detourPadding: numberParameter(parameters, 'detourPadding'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  targetRadius: numberParameter(parameters, 'targetRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  cornerSpeed: numberParameter(parameters, 'cornerSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  maxChecks: numberParameter(parameters, 'maxChecks'),
  failureChecks: numberParameter(parameters, 'failureChecks'),
});

export const goalOf = (example: PipelineParameters): Vec2 => ({
  x: example.goalX,
  y: example.goalY,
});

export const palletOf = (example: PipelineParameters): Vec2 => ({
  x: example.palletX,
  y: example.palletY,
});

export const exclusionRadius = (example: PipelineParameters) =>
  example.palletRadius + example.courierRadius + example.safetyMargin;

export function segmentDetails(from: Vec2, to: Vec2, example: PipelineParameters) {
  const segment = subtract(to, from);
  const squaredLength = dot(segment, segment);
  const projection = dot(subtract(palletOf(example), from), segment);
  const fraction = squaredLength === 0 ? 0 : Math.max(0, Math.min(1, projection / squaredLength));
  const closest = add(from, scale(segment, fraction));
  const clearance = distance(closest, palletOf(example)) - exclusionRadius(example);
  return { from, to, squaredLength, projection, fraction, closest, clearance };
}

/** Signed gap from a closed movement segment to the region forbidden to the courier's centre. */
export function segmentClearance(from: Vec2, to: Vec2, example: PipelineParameters): number {
  return segmentDetails(from, to, example).clearance;
}

export function routeClearance(
  position: Vec2,
  route: readonly Vec2[],
  example: PipelineParameters,
) {
  const points = [position, ...route];
  return Math.min(...route.map((to, index) => segmentClearance(points[index], to, example)));
}

/** This warehouse has a known bypass above its single circular pallet footprint. */
export function repairRoute(goal: Vec2, example: PipelineParameters): readonly Vec2[] {
  const offset = exclusionRadius(example) + example.detourPadding;
  return [
    { x: example.palletX - offset, y: example.palletY - offset },
    { x: example.palletX + offset, y: example.palletY - offset },
    goal,
  ];
}

/** Corners remain active until the courier is both close and slow enough to turn. */
export function decompose(
  state: PipelineState,
  route: readonly Vec2[],
  example: PipelineParameters,
) {
  let index = 0;
  while (
    index < route.length - 1 &&
    distance(state.position, route[index]) <= example.targetRadius &&
    length(state.velocity) <= example.cornerSpeed
  )
    index++;
  return route.slice(index);
}

export const bodyOf = (state: PipelineState, example: PipelineParameters): SteeringBody => ({
  position: state.position,
  velocity: state.velocity,
  heading: normalize(subtract(state.route[0], state.position)),
  maxSpeed: example.maxSpeed,
  maxAcceleration: example.maxAcceleration,
  radius: example.courierRadius,
  wanderAngle: 0,
});

export function integrate(
  state: PipelineState,
  acceleration: Vec2,
  route: readonly Vec2[],
  example: PipelineParameters,
): PipelineState {
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return { position: add(state.position, scale(velocity, example.timeStep)), velocity, route };
}

/** Local goal negotiation; the actuator preview and committed movement share one engine call. */
export function calculatePipelineStep(
  state: PipelineState,
  example: PipelineParameters,
): PipelineStep {
  const goal = goalOf(example);
  const body = bodyOf(state, example);
  let route = decompose(state, state.route, example);
  const attempts: PipelineAttempt[] = [];
  for (let check = 0; check < example.maxChecks; check++) {
    const waypoint = route[0];
    const acceleration = arrive(body, waypoint, {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    });
    const next = integrate(state, acceleration, route, example);
    const routeGap = routeClearance(state.position, route, example);
    const sweptGap = segmentClearance(state.position, next.position, example);
    const accepted = routeGap >= 0 && sweptGap >= 0;
    attempts.push({
      route,
      waypoint,
      routeClearance: routeGap,
      sweptClearance: sweptGap,
      acceleration,
      accepted,
    });
    if (accepted) return { goal, attempts, accepted, acceleration, next };
    route = decompose(state, repairRoute(goal, example), example);
  }
  // An unverified suggestion is discarded; braking is not a proof of collision freedom.
  const acceleration = matchVelocity(body, zero, example.responseTime);
  return {
    goal,
    attempts,
    accepted: false,
    acceleration,
    next: integrate(state, acceleration, state.route, example),
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface PipelineSample {
  readonly state: PipelineState;
  readonly calculation: ReturnType<typeof calculatePipelineStep>;
  readonly next: PipelineState;
}

export function pipelineSamples(example: PipelineParameters): readonly PipelineSample[] {
  const samples: PipelineSample[] = [];
  let state: PipelineState = {
    position: { x: example.startX, y: example.startY },
    velocity: { x: example.startVelocityX, y: example.startVelocityY },
    route: [goalOf(example)],
  };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculatePipelineStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function pipelineFrames(example: PipelineParameters): readonly PipelineState[] {
  return pipelineSamples(example).map(({ state }) => state);
}
