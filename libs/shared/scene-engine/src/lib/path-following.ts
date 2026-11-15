import { clearMove, nearestOnSegment } from './geometry';
import { planRoute } from './pathfinding';
import { matchVelocity, type SteeringBody } from './steering';
import type {
  PathSettings,
  RouteReading,
  SimulationState,
  UnitId,
  UnitRoute,
  UnitState,
  Vec2,
} from './types';
import { add, distance, dot, length, normalize, scale, subtract } from './vectors';

/** A unit given a path tool and no settings of its own: A* by the octile distance, unsmoothed. */
export const defaultPathSettings: PathSettings = {
  heuristic: 'octile',
  maxSkip: null,
  waypointRadius: 1.5,
  pathOffset: 1,
  predictTime: 0,
  costs: {},
};

/**
 * Plans a route for a unit given a path tool, from where it stands to the objective. A plan made
 * while the unit already had one, after a field or objective step or when the geometry stopped
 * it, counts as planning again; a unit with nothing to head for keeps no route.
 */
export function planUnit(unit: UnitState, state: SimulationState, again: boolean): UnitState {
  const settings = unit.behaviour.path;
  const objective = state.objective?.position ?? null;
  if (settings === null || objective === null)
    return unit.route === null ? unit : { ...unit, route: null };
  const planned = planRoute(
    state.geometry,
    state.definition.field,
    unit.position,
    objective,
    unit.radius,
    settings,
  );
  const replans = (unit.route?.replans ?? 0) + (again && unit.route !== null ? 1 : 0);
  const route: UnitRoute = {
    status: planned.reason === null ? 'following' : 'blocked',
    reason: planned.reason,
    waypoints: planned.waypoints,
    next: Math.min(1, planned.waypoints.length - 1),
    search: planned.search,
    replans,
    plannedAt: state.tick,
  };
  return { ...unit, route };
}

/** Plans again for every unit following a route, as a field or objective step demands. */
export const replanAll = (state: SimulationState): SimulationState => ({
  ...state,
  units: state.units.map((unit) =>
    unit.behaviour.path === null ? unit : planUnit(unit, state, true),
  ),
});

/** Where a following unit judges itself to be: ahead along its velocity by the look-ahead time. */
const probeOf = (unit: Pick<UnitState, 'position' | 'velocity'>, settings: PathSettings) =>
  add(unit.position, scale(unit.velocity, settings.predictTime));

/** How far along a segment, from its start, the point of it nearest a point lies. */
function alongSegment(point: Vec2, from: Vec2, to: Vec2) {
  return distance(from, nearestOnSegment(point, from, to));
}

export interface FollowTarget {
  /** The point the unit aims at. */
  readonly point: Vec2;
  /** Whether that is the route's end, where the unit arrives rather than passes. */
  readonly last: boolean;
  /** The waypoint ahead and how sharply the route turns there: one straight on, minus one back. */
  readonly corner: { readonly at: Vec2; readonly straightness: number } | null;
}

/**
 * The point a following unit aims at: `path-offset` further along its current leg than the point
 * of the leg nearest where it judges itself to be, never past the waypoint the leg ends at, so
 * the aim stays on ground the route has cleared. An aim that falls under the unit's own body, as
 * a path offset of zero gives a unit standing on its route, leaves it nowhere to go, so it makes
 * for that waypoint instead.
 */
export function followTarget(
  unit: Pick<UnitState, 'position' | 'velocity' | 'radius'>,
  route: UnitRoute,
  settings: PathSettings,
): FollowTarget {
  const { waypoints, next } = route;
  const end = waypoints[next];
  const last = next === waypoints.length - 1;
  const start = waypoints[next - 1] ?? unit.position;
  const leg = subtract(end, start);
  const legLength = length(leg);
  const along = Math.min(
    legLength,
    alongSegment(probeOf(unit, settings), start, end) + settings.pathOffset,
  );
  const aim = legLength === 0 ? end : add(start, scale(normalize(leg), along));
  const point = distance(aim, unit.position) <= unit.radius ? end : aim;
  if (last) return { point: end, last, corner: null };
  const onward = normalize(subtract(waypoints[next + 1], end));
  return { point, last, corner: { at: end, straightness: dot(normalize(leg), onward) } };
}

/**
 * The acceleration toward an aim on the way: full speed on a straight, slowing for the turn at
 * the waypoint ahead to what it can carry round it, at half its braking strength so it never has
 * to brake hard. An aim at the route's end is the steering's own business, arrive or seek.
 */
export function towardAim(body: SteeringBody, target: FollowTarget, timeToTarget: number): Vec2 {
  const { corner } = target;
  const carried = corner === null ? body.maxSpeed : (body.maxSpeed * (1 + corner.straightness)) / 2;
  const gap = corner === null ? 0 : distance(body.position, corner.at);
  const speed = Math.min(body.maxSpeed, Math.sqrt(carried * carried + body.maxAcceleration * gap));
  const wanted = scale(normalize(subtract(target.point, body.position)), speed);
  return matchVelocity(body, wanted, timeToTarget);
}

/**
 * Moves a following unit's aim on: past each waypoint it has come within the waypoint radius of,
 * or gone beyond, as soon as it can see the next one from where it stands, so it never cuts a
 * corner the route went round.
 */
export function passWaypoints(unit: UnitState, state: SimulationState): UnitState {
  const { route } = unit;
  const settings = unit.behaviour.path;
  if (route === null || route.status !== 'following' || settings === null) return unit;
  const { waypoints } = route;
  const probe = probeOf(unit, settings);
  let { next } = route;
  while (next < waypoints.length - 1) {
    const end = waypoints[next];
    const start = waypoints[next - 1] ?? unit.position;
    const leg = subtract(end, start);
    const beyond = dot(subtract(probe, end), leg) > 0;
    const near = distance(probe, end) <= settings.waypointRadius;
    const inSight = clearMove(state.geometry, unit.position, waypoints[next + 1], unit.radius);
    if (!(near || beyond) || !inSight) break;
    next += 1;
  }
  return next === route.next ? unit : { ...unit, route: { ...route, next } };
}

/** Whether the geometry has stopped a unit off its way: it cannot see the waypoint it makes for. */
export const lostWay = (unit: UnitState, state: SimulationState) =>
  unit.route?.status === 'following' &&
  !clearMove(state.geometry, unit.position, unit.route.waypoints[unit.route.next], unit.radius);

/** How much route a following unit still has to walk. */
export function remainingLength(unit: UnitState): number | null {
  const { route } = unit;
  if (route === null || route.status !== 'following') return null;
  let total = distance(unit.position, route.waypoints[route.next]);
  for (let index = route.next; index < route.waypoints.length - 1; index += 1)
    total += distance(route.waypoints[index], route.waypoints[index + 1]);
  return total;
}

/** The route still ahead of a unit, from where it stands. */
export const routeAhead = (unit: UnitState): readonly Vec2[] =>
  unit.route === null || unit.route.status !== 'following'
    ? []
    : [unit.position, ...unit.route.waypoints.slice(unit.route.next)];

/** The routes of these units, in the scene's order, for the ones that have one. */
export function routesOf(state: SimulationState, ids: readonly UnitId[]): readonly RouteReading[] {
  const wanted = new Set(ids);
  return state.units.flatMap((unit) =>
    wanted.has(unit.id) && unit.route !== null
      ? [{ id: unit.id, route: unit.route, length: remainingLength(unit) }]
      : [],
  );
}
