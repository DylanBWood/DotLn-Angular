import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  blend,
  centroid,
  clipLength,
  distance,
  length,
  matchVelocity,
  normalize,
  scale,
  separate,
  type SteeringBody,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface FlockingParameters {
  readonly startX: number;
  readonly spacing: number;
  readonly middleSpeed: number;
  readonly cruiseSpeed: number;
  readonly cruiseWeight: number;
  readonly neighbourRadius: number;
  readonly separationThreshold: number;
  readonly separationWeight: number;
  readonly cohesionWeight: number;
  readonly alignmentWeight: number;
  readonly slowRadius: number;
  readonly responseTime: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly crossingX: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly crowdedSeparationWeight: number;
}

export interface Walker extends SteeringBody {
  readonly id: string;
}

export interface FlockingReading {
  readonly neighbours: readonly Walker[];
  readonly centre: Vec2;
  readonly meanVelocity: Vec2;
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly cruise: Vec2;
  readonly acceleration: Vec2;
}

export const readFlockingParameters = (parameters: StudyParameters): FlockingParameters => ({
  startX: numberParameter(parameters, 'startX'),
  spacing: numberParameter(parameters, 'spacing'),
  middleSpeed: numberParameter(parameters, 'middleSpeed'),
  cruiseSpeed: numberParameter(parameters, 'cruiseSpeed'),
  cruiseWeight: numberParameter(parameters, 'cruiseWeight'),
  neighbourRadius: numberParameter(parameters, 'neighbourRadius'),
  separationThreshold: numberParameter(parameters, 'separationThreshold'),
  separationWeight: numberParameter(parameters, 'separationWeight'),
  cohesionWeight: numberParameter(parameters, 'cohesionWeight'),
  alignmentWeight: numberParameter(parameters, 'alignmentWeight'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  radius: numberParameter(parameters, 'radius'),
  crossingX: numberParameter(parameters, 'crossingX'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  crowdedSeparationWeight: numberParameter(parameters, 'crowdedSeparationWeight'),
});

export const initialWalkers = (p: FlockingParameters): readonly Walker[] =>
  ['Mara', 'Ivo', 'Noor'].map((id, index) => ({
    id,
    position: { x: p.startX, y: (index - 1) * p.spacing },
    velocity: { x: index === 1 ? p.middleSpeed : 0, y: 0 },
    heading: { x: 1, y: 0 },
    wanderAngle: 0,
    maxSpeed: p.maxSpeed,
    maxAcceleration: p.maxAcceleration,
    radius: p.radius,
  }));

/** Each walker reads a circular neighbourhood from the unchanged frame. */
export function readFlock(
  walkers: readonly Walker[],
  index: number,
  p: FlockingParameters,
): FlockingReading {
  const body = walkers[index];
  const local = walkers.filter(
    (other) => other === body || distance(body.position, other.position) < p.neighbourRadius,
  );
  const neighbours = local.filter((other) => other !== body);
  const centre = neighbours.length
    ? centroid(neighbours.map(({ position }) => position))
    : body.position;
  const meanVelocity = neighbours.length
    ? centroid(neighbours.map(({ velocity }) => velocity))
    : body.velocity;
  const separation = separate(body, local.indexOf(body), local, {
    separationThreshold: p.separationThreshold,
    separationFalloff: 1,
  });
  const cohesion = neighbours.length
    ? arrive(body, centre, {
        slowRadius: p.slowRadius,
        targetRadius: 0,
        timeToTarget: p.responseTime,
      })
    : zero;
  const alignment = neighbours.length ? matchVelocity(body, meanVelocity, p.responseTime) : zero;
  // A shared eastward velocity gives this crossing a purpose; it is separate from flocking.
  const cruise = matchVelocity(body, { x: p.cruiseSpeed, y: 0 }, p.responseTime);
  const acceleration = blend(
    [
      { weight: p.separationWeight, acceleration: separation },
      { weight: p.cohesionWeight, acceleration: cohesion },
      { weight: p.alignmentWeight, acceleration: alignment },
      { weight: p.cruiseWeight, acceleration: cruise },
    ],
    p.maxAcceleration,
  );
  return {
    neighbours,
    centre,
    meanVelocity,
    separation,
    cohesion,
    alignment,
    cruise,
    acceleration,
  };
}

export interface FlockingSample {
  readonly state: readonly Walker[];
  readonly readings: readonly FlockingReading[];
  readonly next: readonly Walker[];
}

/** Every walker reads the unchanged flock, then advances using that retained reading. */
function advanceFlock(
  walkers: readonly Walker[],
  readings: readonly FlockingReading[],
  p: FlockingParameters,
): readonly Walker[] {
  return walkers.map((body, index) => {
    const velocity = clipLength(
      add(body.velocity, scale(readings[index].acceleration, p.timeStep)),
      p.maxSpeed,
    );
    return {
      ...body,
      velocity,
      position: add(body.position, scale(velocity, p.timeStep)),
      heading: length(velocity) > 0 ? normalize(velocity) : body.heading,
    };
  });
}

export function stepFlock(walkers: readonly Walker[], p: FlockingParameters): readonly Walker[] {
  return advanceFlock(
    walkers,
    walkers.map((_walker, index) => readFlock(walkers, index, p)),
    p,
  );
}

export function flockingSamples(p: FlockingParameters): readonly FlockingSample[] {
  const samples: FlockingSample[] = [];
  let state = initialWalkers(p);
  for (let step = 0; step <= p.steps; step++) {
    const readings = state.map((_walker, index) => readFlock(state, index, p));
    const next = advanceFlock(state, readings, p);
    samples.push({ state, readings, next });
    state = next;
  }
  return samples;
}

export function flockingFrames(p: FlockingParameters): readonly (readonly Walker[])[] {
  return flockingSamples(p).map(({ state }) => state);
}

export const nearestPair = (walkers: readonly Walker[]): number =>
  Math.min(
    ...walkers.flatMap((body, index) =>
      walkers.slice(index + 1).map((other) => distance(body.position, other.position)),
    ),
  );

/** Root mean square distance from the group's mean velocity, in units per second. */
export const velocitySpread = (walkers: readonly Walker[]): number => {
  const mean = centroid(walkers.map(({ velocity }) => velocity));
  return Math.sqrt(
    walkers.reduce((sum, { velocity }) => sum + length(subtract(velocity, mean)) ** 2, 0) /
      walkers.length,
  );
};
