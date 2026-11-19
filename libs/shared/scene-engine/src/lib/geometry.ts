import type { SceneGeometry, Vec2 } from './types';
import { add, distance, dot, length, normalize, scale, subtract, zero } from './vectors';

/** The field before anything is drawn on it: no shapes, and cells of 2.5. */
export const emptyGeometry: SceneGeometry = { walls: [], obstacles: [], cellSize: 2.5 };

/**
 * Every shape as a segment and how far its body reaches from it: a wall is its own segment with
 * half its thickness, an obstacle a segment of no length at its centre with its radius. One kind
 * of shape keeps every test below to one piece of arithmetic.
 */
interface Core {
  readonly from: Vec2;
  readonly to: Vec2;
  readonly reach: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const cores = new WeakMap<SceneGeometry, readonly Core[]>();

function core(from: Vec2, to: Vec2, reach: number): Core {
  return {
    from,
    to,
    reach,
    left: Math.min(from.x, to.x) - reach,
    right: Math.max(from.x, to.x) + reach,
    top: Math.min(from.y, to.y) - reach,
    bottom: Math.max(from.y, to.y) + reach,
  };
}

function coresOf(geometry: SceneGeometry): readonly Core[] {
  const known = cores.get(geometry);
  if (known) return known;
  const made = [
    ...geometry.walls.map((wall) => core(wall.from, wall.to, wall.thickness / 2)),
    ...geometry.obstacles.map((obstacle) =>
      core(obstacle.centre, obstacle.centre, obstacle.radius),
    ),
  ];
  cores.set(geometry, made);
  return made;
}

export const hasShapes = (geometry: SceneGeometry) =>
  geometry.walls.length > 0 || geometry.obstacles.length > 0;

/** The point of a segment nearest a point. */
export function nearestOnSegment(point: Vec2, from: Vec2, to: Vec2): Vec2 {
  const along = subtract(to, from);
  const squared = dot(along, along);
  if (squared === 0) return from;
  const fraction = Math.min(1, Math.max(0, dot(subtract(point, from), along) / squared));
  return add(from, scale(along, fraction));
}

const pointToSegment = (point: Vec2, from: Vec2, to: Vec2) =>
  distance(point, nearestOnSegment(point, from, to));

const turn = (origin: Vec2, a: Vec2, b: Vec2) =>
  (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);

// Two segments cross when each one's ends lie strictly on either side of the other. Touching ends
// and overlaps along one line are left to the distances, which find them at a distance of zero.
function cross(a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2) {
  const first = turn(b0, b1, a0);
  const second = turn(b0, b1, a1);
  const third = turn(a0, a1, b0);
  const fourth = turn(a0, a1, b1);
  return first * second < 0 && third * fourth < 0;
}

/** The least distance between two segments. */
export function segmentToSegment(a0: Vec2, a1: Vec2, b0: Vec2, b1: Vec2): number {
  if (cross(a0, a1, b0, b1)) return 0;
  return Math.min(
    pointToSegment(a0, b0, b1),
    pointToSegment(a1, b0, b1),
    pointToSegment(b0, a0, a1),
    pointToSegment(b1, a0, a1),
  );
}

// A shape whose box, widened by the body, does not reach the move's box cannot touch the move.
const apart = (shape: Core, from: Vec2, to: Vec2, radius: number) =>
  Math.max(from.x, to.x) + radius < shape.left ||
  Math.min(from.x, to.x) - radius > shape.right ||
  Math.max(from.y, to.y) + radius < shape.top ||
  Math.min(from.y, to.y) - radius > shape.bottom;

/** Whether a body of this radius standing here meets any wall or obstacle. */
export function touches(geometry: SceneGeometry, point: Vec2, radius: number): boolean {
  return coresOf(geometry).some(
    (shape) =>
      !apart(shape, point, point, radius) &&
      pointToSegment(point, shape.from, shape.to) < shape.reach + radius,
  );
}

/**
 * Whether a body of this radius, moved straight from one point to another, keeps clear of every
 * shape: the test the tile graph's edges, a search's two ends, smoothing, a follower's sight of
 * its next waypoint and the stop at geometry all ask. A body a shape was drawn over may move only
 * in a direction that does not deepen the contact; the distance to a shape changes convexly along
 * a straight move, so a move that starts out not deepening never deepens. Beside it, `touches`
 * asks about a body standing still and `castRay` about a ray, all three measuring clearance alike:
 * a shape's reach plus the body's radius, from the shape's segment.
 */
export const clearMove = (geometry: SceneGeometry, from: Vec2, to: Vec2, radius: number) =>
  !coresOf(geometry).some((shape) => blocks(shape, from, to, radius));

function blocks(shape: Core, from: Vec2, to: Vec2, radius: number) {
  if (apart(shape, from, to, radius)) return false;
  const clearance = shape.reach + radius;
  const nearest = nearestOnSegment(from, shape.from, shape.to);
  if (distance(from, nearest) < clearance)
    return dot(subtract(to, from), subtract(from, nearest)) < 0;
  return segmentToSegment(from, to, shape.from, shape.to) < clearance;
}

/** Where a ray first meets a shape, the surface's outward normal there, and how far along it was. */
export interface RayHit {
  readonly distance: number;
  /** Where the body's centre would stand when it first touches the shape. */
  readonly point: Vec2;
  readonly normal: Vec2;
}

const perpendicular = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });
const wedge = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;

/** Distance to the first contact with a disc along a unit direction. */
export function rayToCircle(origin: Vec2, direction: Vec2, centre: Vec2, size: number) {
  const offset = subtract(origin, centre);
  const along = dot(offset, direction);
  const outside = dot(offset, offset) - size * size;
  const discriminant = along * along - outside;
  if (discriminant < 0) return null;
  const at = -along - Math.sqrt(discriminant);
  return at < 0 ? null : at;
}

// The two straight sides of a wall's body, each its segment moved out by the body's reach.
function rayToSide(origin: Vec2, direction: Vec2, from: Vec2, to: Vec2, side: Vec2) {
  const start = add(from, side);
  const span = subtract(to, from);
  const across = wedge(direction, span);
  if (across === 0) return null;
  const toStart = subtract(start, origin);
  const at = wedge(toStart, span) / across;
  const fraction = wedge(toStart, direction) / across;
  return at < 0 || fraction < 0 || fraction > 1 ? null : at;
}

function rayToShape(origin: Vec2, direction: Vec2, shape: Core, size: number): RayHit | null {
  const nearest = nearestOnSegment(origin, shape.from, shape.to);
  if (distance(origin, nearest) < size) {
    const outward = normalize(subtract(origin, nearest));
    return {
      distance: 0,
      point: origin,
      normal: length(outward) > 0 ? outward : scale(direction, -1),
    };
  }
  const hits: { readonly at: number; readonly normal: (point: Vec2) => Vec2 }[] = [];
  for (const end of [shape.from, shape.to]) {
    const at = rayToCircle(origin, direction, end, size);
    if (at !== null) hits.push({ at, normal: (point) => normalize(subtract(point, end)) });
  }
  const span = subtract(shape.to, shape.from);
  if (length(span) > 0) {
    const out = scale(normalize(perpendicular(span)), size);
    for (const side of [out, scale(out, -1)]) {
      const at = rayToSide(origin, direction, shape.from, shape.to, side);
      if (at !== null) hits.push({ at, normal: () => normalize(side) });
    }
  }
  const first = hits.reduce<(typeof hits)[number] | null>(
    (best, hit) => (best === null || hit.at < best.at ? hit : best),
    null,
  );
  if (first === null) return null;
  const point = add(origin, scale(direction, first.at));
  return { distance: first.at, point, normal: first.normal(point) };
}

/**
 * The nearest place along a ray where a body of this radius would first touch a wall or an
 * obstacle, within the ray's length, or null when it touches none.
 */
export function castRay(
  geometry: SceneGeometry,
  origin: Vec2,
  direction: Vec2,
  reach: number,
  radius: number,
): RayHit | null {
  const heading = normalize(direction);
  if (length(heading) === 0) return null;
  const end = add(origin, scale(heading, reach));
  let nearest: RayHit | null = null;
  for (const shape of coresOf(geometry)) {
    if (apart(shape, origin, end, radius)) continue;
    const hit = rayToShape(origin, heading, shape, shape.reach + radius);
    if (
      hit !== null &&
      hit.distance <= reach &&
      (nearest === null || hit.distance < nearest.distance)
    )
      nearest = hit;
  }
  return nearest;
}

/**
 * The velocity a body keeps when the geometry is in its way: all of it when its next step is
 * clear; otherwise, as the field's edge does, no part of it into the shapes it would meet, keeping
 * only what slides along them; and no step at all when even that is blocked.
 */
export function stopAtGeometry(
  geometry: SceneGeometry,
  position: Vec2,
  velocity: Vec2,
  radius: number,
  seconds: number,
): { readonly velocity: Vec2; readonly stopped: boolean } {
  const wanted = add(position, scale(velocity, seconds));
  const met = coresOf(geometry).filter((shape) => blocks(shape, position, wanted, radius));
  if (met.length === 0) return { velocity, stopped: false };
  const sliding = met.reduce((kept, shape) => {
    const outward = normalize(subtract(position, nearestOnSegment(position, shape.from, shape.to)));
    const into = dot(kept, outward);
    return into < 0 ? subtract(kept, scale(outward, into)) : kept;
  }, velocity);
  const slides = clearMove(geometry, position, add(position, scale(sliding, seconds)), radius);
  return { velocity: slides ? sliding : zero, stopped: true };
}
