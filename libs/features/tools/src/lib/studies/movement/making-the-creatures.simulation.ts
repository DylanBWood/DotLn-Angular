import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  blend,
  centroid,
  clipLength,
  distance,
  flee,
  length,
  matchVelocity,
  normalize,
  scale,
  separate,
  sine,
  type SteeringBody,
  type Vec2,
  wander,
  zero,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface CreatureParameters {
  readonly startX: number;
  readonly sheepOffset: number;
  readonly goatOffset: number;
  readonly playerStartX: number;
  readonly playerY: number;
  readonly playerSpeed: number;
  readonly neighbourRadius: number;
  readonly separationThreshold: number;
  readonly separationWeight: number;
  readonly cohesionWeight: number;
  readonly alignmentWeight: number;
  readonly sheepWanderWeight: number;
  readonly goatWanderWeight: number;
  readonly sheepFleeWeight: number;
  readonly goatFleeWeight: number;
  readonly fleeScale: number;
  readonly unresponsiveFleeScale: number;
  readonly fleeRadius: number;
  readonly wanderRadius: number;
  readonly wanderOffset: number;
  readonly wanderAmplitude: number;
  readonly wanderRate: number;
  readonly slowRadius: number;
  readonly responseTime: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly timeStep: number;
  readonly steps: number;
}

export type Species = 'sheep' | 'goat';

export interface Creature extends SteeringBody {
  readonly id: string;
  readonly species: Species;
  readonly wanderSign: number;
}

export interface CreatureReading {
  readonly neighbours: readonly Creature[];
  readonly centre: Vec2;
  readonly meanVelocity: Vec2;
  readonly angle: number;
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly wandering: Vec2;
  readonly fleeing: Vec2;
  readonly wanderWeight: number;
  readonly fleeWeight: number;
  readonly acceleration: Vec2;
}

export function readCreatureParameters(parameters: StudyParameters): CreatureParameters {
  const p = {
    startX: numberParameter(parameters, 'startX'),
    sheepOffset: numberParameter(parameters, 'sheepOffset'),
    goatOffset: numberParameter(parameters, 'goatOffset'),
    playerStartX: numberParameter(parameters, 'playerStartX'),
    playerY: numberParameter(parameters, 'playerY'),
    playerSpeed: numberParameter(parameters, 'playerSpeed'),
    neighbourRadius: numberParameter(parameters, 'neighbourRadius'),
    separationThreshold: numberParameter(parameters, 'separationThreshold'),
    separationWeight: numberParameter(parameters, 'separationWeight'),
    cohesionWeight: numberParameter(parameters, 'cohesionWeight'),
    alignmentWeight: numberParameter(parameters, 'alignmentWeight'),
    sheepWanderWeight: numberParameter(parameters, 'sheepWanderWeight'),
    goatWanderWeight: numberParameter(parameters, 'goatWanderWeight'),
    sheepFleeWeight: numberParameter(parameters, 'sheepFleeWeight'),
    goatFleeWeight: numberParameter(parameters, 'goatFleeWeight'),
    fleeScale: numberParameter(parameters, 'fleeScale'),
    unresponsiveFleeScale: numberParameter(parameters, 'unresponsiveFleeScale'),
    fleeRadius: numberParameter(parameters, 'fleeRadius'),
    wanderRadius: numberParameter(parameters, 'wanderRadius'),
    wanderOffset: numberParameter(parameters, 'wanderOffset'),
    wanderAmplitude: numberParameter(parameters, 'wanderAmplitude'),
    wanderRate: numberParameter(parameters, 'wanderRate'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    radius: numberParameter(parameters, 'radius'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
  };
  // The engine owns this radius; refusing a mismatch keeps the drawn circle truthful.
  if (p.fleeRadius !== 20) throw new Error('The scene engine fixes fleeRadius at 20 units.');
  return p;
}

export const initialCreatures = (p: CreatureParameters): readonly Creature[] =>
  [
    { id: 'Fern', species: 'sheep', y: -p.sheepOffset },
    { id: 'Moss', species: 'sheep', y: p.sheepOffset },
    { id: 'Flint', species: 'goat', y: -p.goatOffset },
    { id: 'Pebble', species: 'goat', y: p.goatOffset },
  ].map(({ id, species, y }, index) => ({
    id,
    species: species === 'sheep' ? 'sheep' : 'goat',
    wanderSign: index % 2 === 0 ? 1 : -1,
    position: { x: p.startX, y },
    velocity: zero,
    heading: { x: 1, y: 0 },
    wanderAngle: 0,
    maxSpeed: p.maxSpeed,
    maxAcceleration: p.maxAcceleration,
    radius: p.radius,
  }));

export const playerAt = (seconds: number, p: CreatureParameters): Vec2 => ({
  x: p.playerStartX + p.playerSpeed * seconds,
  y: p.playerY,
});

/** Profiles change strengths; both species run the same steering functions. */
export function readCreature(
  creatures: readonly Creature[],
  index: number,
  seconds: number,
  p: CreatureParameters,
): CreatureReading {
  const original = creatures[index];
  // A prescribed wobble makes the example repeatable without a random generator or a clock.
  const angle = p.wanderAmplitude * sine(p.wanderRate * seconds) * original.wanderSign;
  const body = { ...original, wanderAngle: angle };
  const neighbours = creatures.filter(
    (other, otherIndex) =>
      otherIndex !== index &&
      other.species === body.species &&
      distance(body.position, other.position) < p.neighbourRadius,
  );
  const centre = neighbours.length
    ? centroid(neighbours.map(({ position }) => position))
    : body.position;
  const meanVelocity = neighbours.length
    ? centroid(neighbours.map(({ velocity }) => velocity))
    : body.velocity;
  const separation = separate(body, index, creatures, {
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
  const wandering = wander(body, {
    wanderOffset: p.wanderOffset,
    wanderRadius: p.wanderRadius,
    timeToTarget: p.responseTime,
  });
  const fleeing = flee(body, playerAt(seconds, p));
  const wanderWeight = body.species === 'sheep' ? p.sheepWanderWeight : p.goatWanderWeight;
  const fleeWeight =
    p.fleeScale * (body.species === 'sheep' ? p.sheepFleeWeight : p.goatFleeWeight);
  const acceleration = blend(
    [
      { weight: p.separationWeight, acceleration: separation },
      { weight: p.cohesionWeight, acceleration: cohesion },
      { weight: p.alignmentWeight, acceleration: alignment },
      { weight: wanderWeight, acceleration: wandering },
      { weight: fleeWeight, acceleration: fleeing },
    ],
    p.maxAcceleration,
  );
  return {
    neighbours,
    centre,
    meanVelocity,
    angle,
    separation,
    cohesion,
    alignment,
    wandering,
    fleeing,
    wanderWeight,
    fleeWeight,
    acceleration,
  };
}

export interface CreatureSample {
  readonly state: readonly Creature[];
  readonly readings: readonly CreatureReading[];
  readonly next: readonly Creature[];
}

function advanceCreatures(
  creatures: readonly Creature[],
  readings: readonly CreatureReading[],
  p: CreatureParameters,
): readonly Creature[] {
  return creatures.map((body, index) => {
    const velocity = clipLength(
      add(body.velocity, scale(readings[index].acceleration, p.timeStep)),
      p.maxSpeed,
    );
    return {
      ...body,
      velocity,
      wanderAngle: readings[index].angle,
      position: add(body.position, scale(velocity, p.timeStep)),
      heading: length(velocity) > 0 ? normalize(velocity) : body.heading,
    };
  });
}

/** All creatures read the old positions and player at the start of the interval. */
export function stepCreatures(
  creatures: readonly Creature[],
  seconds: number,
  p: CreatureParameters,
): readonly Creature[] {
  return advanceCreatures(
    creatures,
    creatures.map((_body, index) => readCreature(creatures, index, seconds, p)),
    p,
  );
}

export function creatureSamples(p: CreatureParameters): readonly CreatureSample[] {
  const samples: CreatureSample[] = [];
  let state = initialCreatures(p);
  for (let step = 0; step <= p.steps; step++) {
    const readings = state.map((_body, index) => readCreature(state, index, step * p.timeStep, p));
    const next = advanceCreatures(state, readings, p);
    samples.push({ state, readings, next });
    state = next;
  }
  return samples;
}

export function creatureFrames(p: CreatureParameters): readonly (readonly Creature[])[] {
  return creatureSamples(p).map(({ state }) => state);
}

export const speciesTravel = (
  creatures: readonly Creature[],
  species: Species,
  p: CreatureParameters,
): number =>
  centroid(creatures.filter((body) => body.species === species).map(({ position }) => position)).x -
  p.startX;
