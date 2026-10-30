import type { SteeringTuning, UnitState, Vec2 } from './types';
import {
  add,
  alongHeading,
  clipLength,
  cosine,
  distance,
  dot,
  length,
  normalize,
  scale,
  sine,
  subtract,
  zero,
} from './vectors';

/** The kinematics a steering behaviour reads. */
export type SteeringBody = Pick<
  UnitState,
  'position' | 'velocity' | 'heading' | 'maxSpeed' | 'maxAcceleration' | 'radius' | 'wanderAngle'
>;

export interface ArrivalTuning {
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly timeToTarget: number;
}

export type SeparationTuning = Pick<SteeringTuning, 'separationThreshold' | 'separationFalloff'>;
export type WanderTuning = Pick<SteeringTuning, 'wanderRadius' | 'wanderOffset' | 'timeToTarget'>;

const collisionHorizon = 1.5;
const wanderSpeedFraction = 0.4;
const fleeRadius = 20;

export function seek(body: SteeringBody, target: Vec2): Vec2 {
  return scale(normalize(subtract(target, body.position)), body.maxAcceleration);
}

/** Acceleration that brings the body to a velocity within the time to target. */
export function matchVelocity(body: SteeringBody, velocity: Vec2, timeToTarget: number): Vec2 {
  return clipLength(
    scale(subtract(velocity, body.velocity), 1 / timeToTarget),
    body.maxAcceleration,
  );
}

/**
 * Seek with a desired speed falling linearly inside the slow radius. The speed reaches nothing
 * halfway inside the target radius, so a body settles within the radius rather than on its edge,
 * and with no sudden step in the speed nothing sets it chattering there.
 */
export function arrive(body: SteeringBody, target: Vec2, tuning: ArrivalTuning): Vec2 {
  const offset = subtract(target, body.position);
  const gap = length(offset);
  const stop = tuning.targetRadius / 2;
  if (gap <= stop) return matchVelocity(body, zero, tuning.timeToTarget);
  const speed =
    gap >= tuning.slowRadius
      ? body.maxSpeed
      : (body.maxSpeed * (gap - stop)) / (tuning.slowRadius - stop);
  return matchVelocity(body, scale(normalize(offset), speed), tuning.timeToTarget);
}

/** Accelerates away from a point, fading to nothing at the flee radius. */
export function flee(body: SteeringBody, threat: Vec2): Vec2 {
  const offset = subtract(body.position, threat);
  const gap = length(offset);
  if (gap >= fleeRadius) return zero;
  return scale(normalize(offset), body.maxAcceleration * (1 - gap / fleeRadius));
}

// Two units exactly on top of each other have no direction apart, so derive one from their
// positions in the list; each sees the opposite of the other's.
function apart(index: number, otherIndex: number): Vec2 {
  const direction = index < otherIndex ? 1 : -1;
  return { x: direction * 0.6, y: direction * 0.8 };
}

/**
 * Pushes away from every neighbour inside the threshold. The push fades to nothing at the
 * threshold in both falloffs: a push that began at full strength would throw a unit back across
 * the line its neighbours keep it on, and a settled group would shiver for ever.
 */
export function separate(
  body: SteeringBody,
  index: number,
  others: readonly SteeringBody[],
  tuning: SeparationTuning,
): Vec2 {
  const contact = 2 * body.radius;
  const decay = body.maxAcceleration * contact * contact;
  const atThreshold = decay / (tuning.separationThreshold * tuning.separationThreshold);
  let sum = zero;
  others.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    const gap = distance(body.position, other.position);
    if (gap >= tuning.separationThreshold) return;
    const away =
      gap === 0 ? apart(index, otherIndex) : normalize(subtract(body.position, other.position));
    const strength =
      tuning.separationFalloff < 1.5
        ? (body.maxAcceleration * (tuning.separationThreshold - gap)) / tuning.separationThreshold
        : Math.min(decay / (gap * gap) - atThreshold, body.maxAcceleration);
    sum = add(sum, scale(away, strength));
  });
  return clipLength(sum, body.maxAcceleration);
}

/** Steers from the soonest predicted collision; silent when none is coming. */
export function avoid(body: SteeringBody, index: number, others: readonly SteeringBody[]): Vec2 {
  let soonest = collisionHorizon;
  let away: Vec2 | null = null;
  others.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    const offset = subtract(other.position, body.position);
    const closing = subtract(other.velocity, body.velocity);
    const clearance = body.radius + other.radius;
    if (length(offset) < clearance) {
      soonest = 0;
      away = scale(offset, -1);
      return;
    }
    const closingSquared = dot(closing, closing);
    if (closingSquared === 0) return;
    const time = -dot(offset, closing) / closingSquared;
    if (time <= 0 || time >= soonest) return;
    const predicted = add(offset, scale(closing, time));
    if (length(predicted) >= clearance) return;
    soonest = time;
    away = scale(predicted, -1);
  });
  return away === null ? zero : scale(normalize(away), body.maxAcceleration);
}

/** Heads for a point on a circle ahead of the body, at a walking pace. */
export function wander(body: SteeringBody, tuning: WanderTuning): Vec2 {
  const onCircle = alongHeading(
    { x: cosine(body.wanderAngle), y: sine(body.wanderAngle) },
    body.heading,
  );
  const ahead = scale(body.heading, tuning.wanderOffset);
  const direction = normalize(add(ahead, scale(onCircle, tuning.wanderRadius)));
  return matchVelocity(
    body,
    scale(direction, body.maxSpeed * wanderSpeedFraction),
    tuning.timeToTarget,
  );
}

/** Keeps a free-moving body on the field by turning it back near an edge. */
export function keepOnField(
  body: SteeringBody,
  field: { readonly width: number; readonly height: number },
  margin: number,
): Vec2 {
  const push = (position: number, extent: number) => {
    if (position < margin) return (margin - position) / margin;
    if (position > extent - margin) return (extent - margin - position) / margin;
    return 0;
  };
  return scale(
    { x: push(body.position.x, field.width), y: push(body.position.y, field.height) },
    body.maxAcceleration,
  );
}
