import { castRay, type RayHit } from './geometry';
import type { SceneGeometry, SteeringTuning, UnitState, Vec2 } from './types';
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
export type WallAvoidanceTuning = Pick<
  SteeringTuning,
  'lookAhead' | 'whiskerAngle' | 'avoidDistance'
>;

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

/** One neighbour inside the separation threshold: the way from it, and how hard it pushes that way. */
interface Press {
  readonly other: SteeringBody;
  readonly away: Vec2;
  readonly strength: number;
}

/**
 * Every neighbour inside the threshold, in the list's order. The push fades to nothing at the
 * threshold in both falloffs: a push that began at full strength would throw a unit back across
 * the line its neighbours keep it on, and a settled group would shiver for ever.
 */
function pressing(
  body: SteeringBody,
  index: number,
  others: readonly SteeringBody[],
  tuning: SeparationTuning,
): readonly Press[] {
  const contact = 2 * body.radius;
  const decay = body.maxAcceleration * contact * contact;
  const atThreshold = decay / (tuning.separationThreshold * tuning.separationThreshold);
  return others.flatMap((other, otherIndex) => {
    if (otherIndex === index) return [];
    const gap = distance(body.position, other.position);
    if (gap >= tuning.separationThreshold) return [];
    const away =
      gap === 0 ? apart(index, otherIndex) : normalize(subtract(body.position, other.position));
    const strength =
      tuning.separationFalloff < 1.5
        ? (body.maxAcceleration * (tuning.separationThreshold - gap)) / tuning.separationThreshold
        : Math.min(decay / (gap * gap) - atThreshold, body.maxAcceleration);
    return [{ other, away, strength }];
  });
}

/** Pushes away from every neighbour inside the threshold, fading to nothing at it. */
export function separate(
  body: SteeringBody,
  index: number,
  others: readonly SteeringBody[],
  tuning: SeparationTuning,
): Vec2 {
  const sum = pressing(body, index, others, tuning).reduce(
    (total, { away, strength }) => add(total, scale(away, strength)),
    zero,
  );
  return clipLength(sum, body.maxAcceleration);
}

// How fast a pair pressed at full strength matches velocities, per second. Measured over 144
// crowd tunings: at 6 and below some steep crowds of twenty never arrive, and from 7 to 10 every
// crowd arrives.
const crowdFriction = 8;
// The least a pair's push is divided by, so two bodies on one spot push at fifty times the push
// between them and not without limit.
const leastGive = 0.02;

/**
 * What the neighbours inside the separation threshold add to a body standing in a crowd. Each
 * pushes it away as separate does, divided by the share of the maximum acceleration the push
 * leaves free, so the push between two bodies outgrows whatever pulls them together before they
 * touch. Each also drags the body's velocity toward its own, faster the harder the two press, so
 * a packed crowd stops churning. Between two bodies of one size, strength and tuning both act
 * equally and oppositely, so across a crowd they cancel: they space the crowd and settle it, and
 * leave where its centre goes to its units' own steering.
 */
export function neighbourForces(
  body: SteeringBody,
  index: number,
  others: readonly SteeringBody[],
  tuning: SeparationTuning,
): Vec2 {
  return pressing(body, index, others, tuning).reduce((total, { other, away, strength }) => {
    const share = strength / body.maxAcceleration;
    const push = scale(away, strength / Math.max(1 - share, leastGive));
    const drag = scale(subtract(other.velocity, body.velocity), crowdFriction * share);
    return add(total, add(push, drag));
  }, zero);
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

/** The neighbour a body steers from and the way away from it. */
export interface Threat {
  readonly index: number;
  readonly away: Vec2;
}

/**
 * The neighbour avoid steers from, chosen exactly as avoid chooses it: the last one overlapping
 * the body, otherwise the one predicted to collide soonest inside the horizon. Avoid keeps its own
 * copy of the choice so its output stays as it was; a spec holds the two to the same answer.
 */
export function threatOf(body: SteeringBody, index: number, others: readonly SteeringBody[]) {
  let soonest = collisionHorizon;
  let threat: Threat | null = null;
  others.forEach((other, otherIndex) => {
    if (otherIndex === index) return;
    const offset = subtract(other.position, body.position);
    const closing = subtract(other.velocity, body.velocity);
    const clearance = body.radius + other.radius;
    if (length(offset) < clearance) {
      soonest = 0;
      threat = { index: otherIndex, away: scale(offset, -1) };
      return;
    }
    const closingSquared = dot(closing, closing);
    if (closingSquared === 0) return;
    const time = -dot(offset, closing) / closingSquared;
    if (time <= 0 || time >= soonest) return;
    const predicted = add(offset, scale(closing, time));
    if (length(predicted) >= clearance) return;
    soonest = time;
    threat = { index: otherIndex, away: scale(predicted, -1) };
  });
  return threat as Threat | null;
}

/**
 * Collision avoidance with a head-on policy beside it. Wherever avoid has a direction it is used
 * as it is. Where the neighbour it steers from stands on the body's centre, or will at their
 * closest approach, avoid has no direction to give and is silent; the pair then takes one normal
 * in world coordinates, the perpendicular of the offset from the earlier unit in the scene's list
 * to the later, or the world's x-axis when they stand on one spot. The earlier steers along it and
 * the later against it, so the two part whatever their headings, and part the same way every run.
 */
export function avoidCollisions(
  body: SteeringBody,
  index: number,
  others: readonly SteeringBody[],
): Vec2 {
  const steering = avoid(body, index, others);
  if (length(steering) > 0) return steering;
  const threat = threatOf(body, index, others);
  if (threat === null || length(threat.away) > 0) return zero;
  const earlierIsBody = index < threat.index;
  const other = others[threat.index];
  const offset = earlierIsBody
    ? subtract(other.position, body.position)
    : subtract(body.position, other.position);
  const normal = length(offset) > 0 ? normalize({ x: -offset.y, y: offset.x }) : { x: 1, y: 0 };
  return scale(normal, earlierIsBody ? body.maxAcceleration : -body.maxAcceleration);
}

/** One ray obstacle and wall avoidance casts, and how far it reaches. */
export interface AvoidanceRay {
  readonly direction: Vec2;
  readonly reach: number;
}

/**
 * The rays obstacle and wall avoidance casts: one ahead along the velocity, or the heading when
 * the body is still, and, when the whisker angle is above zero, a whisker half as long at that
 * angle either side of it.
 */
export function avoidanceRays(body: SteeringBody, tuning: WallAvoidanceTuning): AvoidanceRay[] {
  const ahead = length(body.velocity) > 0 ? normalize(body.velocity) : body.heading;
  const rays = [{ direction: ahead, reach: tuning.lookAhead }];
  if (tuning.whiskerAngle <= 0) return rays;
  const angle = (tuning.whiskerAngle * Math.PI) / 180;
  for (const side of [1, -1])
    rays.push({
      direction: alongHeading({ x: cosine(angle), y: side * sine(angle) }, ahead),
      reach: tuning.lookAhead / 2,
    });
  return rays;
}

/** What each of a body's avoidance rays met, if anything. */
export const castAvoidanceRays = (
  body: SteeringBody,
  geometry: SceneGeometry,
  tuning: WallAvoidanceTuning,
) =>
  avoidanceRays(body, tuning).map((ray) => ({
    ...ray,
    hit: castRay(geometry, body.position, ray.direction, ray.reach, body.radius),
  }));

/**
 * Obstacle and wall avoidance: casts its rays against the walls and obstacles and steers for a
 * point the avoid distance out from the nearest hit along the surface's normal. It never steers
 * along a ray toward its hit, so a wall dead ahead and further off than the avoid distance, whose
 * point still lies ahead, is braked for rather than run at, and one met at a slant is turned from.
 * It fades to nothing as the hit nears the end of its ray, so it never switches on at a line.
 */
export function avoidWalls(
  body: SteeringBody,
  geometry: SceneGeometry,
  tuning: WallAvoidanceTuning,
): Vec2 {
  let nearest: { readonly hit: RayHit; readonly ray: AvoidanceRay } | null = null;
  for (const { hit, ...ray } of castAvoidanceRays(body, geometry, tuning))
    if (hit !== null && (nearest === null || hit.distance < nearest.hit.distance))
      nearest = { hit, ray };
  if (nearest === null) return zero;
  const { hit, ray } = nearest;
  const target = add(hit.point, scale(hit.normal, tuning.avoidDistance));
  const toward = normalize(subtract(target, body.position));
  const atHit = dot(toward, ray.direction);
  const steer = atHit > 0 ? subtract(toward, scale(ray.direction, atHit)) : toward;
  return scale(normalize(steer), body.maxAcceleration * (1 - hit.distance / ray.reach));
}
