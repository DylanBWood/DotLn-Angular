import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  length,
  normalize,
  scale,
  seek,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface CornerParameters {
  readonly startX: number;
  readonly targetX: number;
  readonly cornerX: number;
  readonly wallDepth: number;
  readonly wallRise: number;
  readonly rayForward: number;
  readonly raySide: number;
  readonly rayLength: number;
  readonly wallAcceleration: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly stallEpsilon: number;
  readonly winnerRay: number;
}

export interface CornerState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

interface Wall {
  readonly start: Vec2;
  readonly end: Vec2;
  readonly normal: Vec2;
}

export interface CornerRay {
  readonly end: Vec2;
  readonly hit: Vec2 | null;
  readonly correction: Vec2;
}

export interface CornerStep {
  readonly rays: readonly CornerRay[];
  readonly goal: Vec2;
  readonly acceleration: Vec2;
  readonly stalled: boolean;
  readonly next: CornerState;
}

export const readParameters = (parameters: StudyParameters): CornerParameters => ({
  startX: numberParameter(parameters, 'startX'),
  targetX: numberParameter(parameters, 'targetX'),
  cornerX: numberParameter(parameters, 'cornerX'),
  wallDepth: numberParameter(parameters, 'wallDepth'),
  wallRise: numberParameter(parameters, 'wallRise'),
  rayForward: numberParameter(parameters, 'rayForward'),
  raySide: numberParameter(parameters, 'raySide'),
  rayLength: numberParameter(parameters, 'rayLength'),
  wallAcceleration: numberParameter(parameters, 'wallAcceleration'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  stallEpsilon: numberParameter(parameters, 'stallEpsilon'),
  winnerRay: numberParameter(parameters, 'winnerRay'),
});

export const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;

export const wallsOf = (example: CornerParameters): readonly Wall[] => {
  const wallLength = length({ x: example.wallDepth, y: example.wallRise });
  return [1, -1].map((side) => ({
    start: { x: example.cornerX, y: 0 },
    end: { x: example.cornerX + example.wallDepth, y: side * example.wallRise },
    normal: {
      x: -example.wallRise / wallLength,
      y: (side * example.wallDepth) / wallLength,
    },
  }));
};

/** Intersects two finite segments; a miss is not a collision on an extended wall. */
export function rayWallHit(origin: Vec2, end: Vec2, wallStart: Vec2, wallEnd: Vec2): Vec2 | null {
  const ray = subtract(end, origin);
  const wall = subtract(wallEnd, wallStart);
  const denominator = cross(ray, wall);
  if (denominator === 0) return null;
  const offset = subtract(wallStart, origin);
  const alongRay = cross(offset, wall) / denominator;
  const alongWall = cross(offset, ray) / denominator;
  return alongRay >= 0 && alongRay <= 1 && alongWall >= 0 && alongWall <= 1
    ? add(origin, scale(ray, alongRay))
    : null;
}

export function castRay(state: CornerState, side: number, example: CornerParameters): CornerRay {
  const end = add(
    state.position,
    scale(normalize({ x: example.rayForward, y: side * example.raySide }), example.rayLength),
  );
  let nearest: { readonly hit: Vec2; readonly normal: Vec2 } | null = null;
  for (const wall of wallsOf(example)) {
    const hit = rayWallHit(state.position, end, wall.start, wall.end);
    if (
      hit &&
      (!nearest ||
        length(subtract(hit, state.position)) < length(subtract(nearest.hit, state.position)))
    )
      nearest = { hit, normal: wall.normal };
  }
  return {
    end,
    hit: nearest?.hit ?? null,
    correction: nearest ? scale(nearest.normal, example.wallAcceleration) : { x: 0, y: 0 },
  };
}

/** Ray sensing and wall-normal requests are local; seek, blending and clipping use the engine. */
export function calculateCornerStep(
  state: CornerState,
  example: CornerParameters,
  winnerRay = example.winnerRay > 0,
): CornerStep {
  const body: SteeringBody = {
    position: state.position,
    velocity: state.velocity,
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const rays = [castRay(state, 1, example), castRay(state, -1, example)];
  const hits = rays.filter((ray) => ray.hit !== null);
  // A fixed upper-first choice is enough to break this particular symmetric equilibrium.
  const selected = winnerRay && hits.length > 1 ? hits.slice(0, 1) : hits;
  const goal = seek(body, { x: example.targetX, y: 0 });
  const acceleration = blend(
    [
      { acceleration: goal, weight: 1 },
      ...selected.map(({ correction }) => ({ acceleration: correction, weight: 1 })),
    ],
    example.maxAcceleration,
  );
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    rays,
    goal,
    acceleration,
    stalled:
      hits.length === 2 &&
      length(acceleration) <= example.stallEpsilon &&
      length(state.velocity) <= example.stallEpsilon,
    next: { position: add(state.position, scale(velocity, example.timeStep)), velocity },
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface CornerSample {
  readonly state: CornerState;
  readonly calculation: ReturnType<typeof calculateCornerStep>;
  readonly next: CornerState;
}

export function cornerSamples(
  example: CornerParameters,
  winnerRay = example.winnerRay > 0,
): readonly CornerSample[] {
  const samples: CornerSample[] = [];
  let state: CornerState = { position: { x: example.startX, y: 0 }, velocity: { x: 0, y: 0 } };
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateCornerStep(state, example, winnerRay);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function cornerStates(
  example: CornerParameters,
  winnerRay = example.winnerRay > 0,
): readonly CornerState[] {
  return cornerSamples(example, winnerRay).map(({ state }) => state);
}
