import { blend, type WeightedSteering } from './blending';
import { advanceFormation, type FormationPlace, placeOf, slotPosition } from './formation';
import { emptyGeometry, hasShapes, stopAtGeometry } from './geometry';
import {
  followTarget,
  lostWay,
  passWaypoints,
  planUnit,
  routeAhead,
  towardAim,
} from './path-following';
import { advanceProjectiles, inReach, launcherDefaults } from './projectiles';
import { touchingPairs } from './queries';
import { nextBinomial } from './random';
import {
  type ArrivalTuning,
  arrive,
  avoidCollisions,
  avoidWalls,
  castAvoidanceRays,
  flee,
  keepOnField,
  matchVelocity,
  neighbourForces,
  seek,
  separate,
  wander,
} from './steering';
import type {
  ObjectiveState,
  PriorityGroup,
  RayFrame,
  RouteFrame,
  SceneDefinition,
  SceneFrame,
  SimulationState,
  SteeringTerm,
  SteeringTuning,
  UnitActivity,
  UnitBehaviour,
  UnitId,
  UnitState,
  Vec2,
} from './types';
import {
  add,
  centroid,
  clipLength,
  distance,
  dot,
  length,
  midpoint,
  normalize,
  scale,
  subtract,
  wrapAngle,
  zero,
} from './vectors';

/** Seconds of simulated time one tick advances. */
export const frameSeconds = 1 / 60;

/** Below this speed a unit reads as standing still. */
export const stillSpeed = 0.05;
// Below this speed a unit is snapped to exact rest, so a settled scene stops changing.
const restSpeed = 0.01;
/** Frames a unit must stand still short of its goal before it counts as stalled. */
export const stallThreshold = 30;
// How far inside the field's edge a free-moving unit starts to turn back.
const fieldMargin = 8;
// Velocity matching needs motion to match, so a unit given it marches at this share of its
// top speed along its heading until an objective drives it instead.
const cruiseShare = 0.4;
const cruiseTime = 0.5;
const cohesionArrival: ArrivalTuning = { slowRadius: 8, targetRadius: 1, timeToTarget: 0.5 };
const slotArrival: ArrivalTuning = { slowRadius: 6, targetRadius: 0.15, timeToTarget: 0.25 };
const formationSeparation = { separationThreshold: 1.5, separationFalloff: 2 };
const slotReachedRadius = 1;
const formationTargetRadius = 1;
// The group has arrived once its centre is in the radius and nobody moves faster than this.
const arrivalSpeed = 0.5;
// A unit coasting to a stop comes to rest a hair short of an exact radius, even one of nothing.
const reachedSlack = 0.05;
// A crowd of units this share of a spacing apart, times the root of their number, is about as far
// as one spreads round a point: packed tight they fill 0.53 of that, and a crowd is looser.
const crowdShare = 0.8;
// How long a unit that has planned again reads as replanning, so the text layer can say so.
const replanningFrames = 30;
// A push of this share of a unit's maximum acceleration is taken to carry the unit wholly. Measured
// over 144 crowd tunings: at a half every crowd comes to rest, and at a quarter one does not.
const carryingPush = 0.5;

export const defaultTuning: SteeringTuning = {
  slowRadius: 10,
  targetRadius: 1,
  timeToTarget: 0.25,
  separationThreshold: 3,
  separationFalloff: 2,
  wanderRadius: 4,
  wanderOffset: 6,
  wanderScale: 0.3,
  lookAhead: 6,
  whiskerAngle: 30,
  avoidDistance: 2,
};

const idleBehaviour: UnitBehaviour = {
  weights: {},
  tuning: defaultTuning,
  group: [],
  priority: null,
  path: null,
};

export function createSimulation(definition: SceneDefinition): SimulationState {
  return {
    definition,
    tick: 0,
    objective: null,
    formations: [],
    geometry: emptyGeometry,
    bullets: [],
    impacts: [],
    units: definition.units.map((unit, index) => ({
      id: unit.id,
      unitClass: unit.unitClass,
      position: unit.position,
      velocity: unit.velocity,
      heading: normalize(unit.heading),
      maxSpeed: unit.maxSpeed,
      maxAcceleration: unit.maxAcceleration,
      radius: unit.radius,
      behaviour: idleBehaviour,
      wanderAngle: 0,
      wanderSeed: (definition.seed + Math.imul(index + 1, 0x9e3779b1)) | 0,
      stallFrames: 0,
      route: null,
      launcher: launcherDefaults,
      nextShot: 0,
      shots: 0,
      scored: 0,
      hits: 0,
      down: false,
    })),
  };
}

interface GroupReading {
  readonly centre: Vec2;
  readonly velocity: Vec2;
}

/** What one frame's steering reads, with each group measured once. */
interface FrameContext {
  readonly state: SimulationState;
  readonly groups: Map<readonly UnitId[], GroupReading>;
}

function readGroup(context: FrameContext, group: readonly UnitId[]): GroupReading {
  const known = context.groups.get(group);
  if (known) return known;
  const members = new Set(group);
  const units = context.state.units.filter((unit) => members.has(unit.id));
  const reading = {
    centre: centroid(units.map((unit) => unit.position)),
    velocity: centroid(units.map((unit) => unit.velocity)),
  };
  context.groups.set(group, reading);
  return reading;
}

const steersForObjective = ({ seek = 0, arrive = 0 }: UnitBehaviour['weights']) =>
  seek > 0 || arrive > 0;

const leads = (unit: UnitState, state: SimulationState) =>
  state.formations.some(({ leader }) => leader === unit.id);

// A formation's leader that nothing is steering for the objective heads there, whenever one is
// set, so the formation has a lead. It lasts only as long as the unit leads, so nothing is left
// behind, and a weight set to nothing is an order to stay. A unit given a path tool heads there
// too, along its route.
function weightsOf(unit: UnitState, state: SimulationState) {
  const { weights, path } = unit.behaviour;
  const unordered = weights.seek === undefined && weights.arrive === undefined;
  return unordered && (path !== null || leads(unit, state)) ? { ...weights, arrive: 1 } : weights;
}

const isBlocked = (unit: UnitState) => unit.route?.status === 'blocked';

// Priority steering's seek group falls back on the objective when the unit has no steering of
// its own, so such a unit is heading for the objective too.
function isDriven(unit: UnitState, state: SimulationState) {
  const weights = weightsOf(unit, state);
  const fallsBack =
    Object.keys(weights).length === 0 && unit.behaviour.priority?.order.includes('seek') === true;
  return steersForObjective(weights) || fallsBack;
}

const wandering = (unit: UnitState) =>
  (unit.behaviour.weights.wander ?? 0) > 0 ||
  (unit.behaviour.priority?.order.includes('wander') ?? false);

// A formation stands closer than a crowd does, so its leader and members keep its spacing.
const separationOf = (unit: UnitState, state: SimulationState) =>
  placeOf(state.formations, unit.id) !== null || leads(unit, state)
    ? formationSeparation
    : unit.behaviour.tuning;

// Seek and arrive head for the objective, or, for a unit following a route, for its aim along
// the route: on the way they come at it as fast as the next turn allows, and at the route's end
// each does what it does.
function towardObjective(term: 'seek' | 'arrive', unit: UnitState, objective: Vec2 | null) {
  if (objective === null) return zero;
  const { path, tuning } = unit.behaviour;
  const target = path === null || unit.route === null ? null : followTarget(unit, unit.route, path);
  if (target !== null && !target.last) return towardAim(unit, target, tuning.timeToTarget);
  const point = target?.point ?? objective;
  return term === 'seek' ? seek(unit, point) : arrive(unit, point, tuning);
}

function termOutput(
  term: SteeringTerm,
  unit: UnitState,
  index: number,
  context: FrameContext,
): Vec2 {
  const { state } = context;
  const { tuning, group } = unit.behaviour;
  const objective = state.objective?.position ?? null;
  switch (term) {
    case 'seek':
    case 'arrive':
      return towardObjective(term, unit, objective);
    case 'flee':
      return objective === null ? zero : flee(unit, objective);
    case 'separation':
      return separate(unit, index, state.units, separationOf(unit, state));
    case 'cohesion':
      return group.length === 0
        ? zero
        : arrive(unit, readGroup(context, group).centre, cohesionArrival);
    case 'velocityMatch':
      return group.length === 0
        ? zero
        : matchVelocity(unit, readGroup(context, group).velocity, tuning.timeToTarget);
    case 'wander':
      return wander(unit, tuning);
    case 'avoidance':
      return avoidCollisions(unit, index, state.units);
    case 'obstacleAvoidance':
      return avoidWalls(unit, state.geometry, tuning);
  }
}

function memberSteering(
  unit: UnitState,
  index: number,
  place: FormationPlace,
  units: readonly UnitState[],
): Vec2 {
  const slot = slotPosition(place.formation, place.slot);
  return blend(
    [
      { weight: 1, acceleration: arrive(unit, slot, slotArrival) },
      { weight: 1, acceleration: separate(unit, index, units, formationSeparation) },
    ],
    unit.maxAcceleration,
  );
}

const edgeTerm = (unit: UnitState, state: SimulationState): WeightedSteering => ({
  weight: 1,
  acceleration: keepOnField(unit, state.definition.field, fieldMargin),
});

function ownSteering(unit: UnitState, index: number, context: FrameContext): Vec2 {
  const { state } = context;
  const place = placeOf(state.formations, unit.id);
  if (place) return memberSteering(unit, index, place, state.units);

  const weights = weightsOf(unit, state);
  const terms: WeightedSteering[] = (Object.keys(weights) as SteeringTerm[]).map((term) => ({
    weight: weights[term] ?? 0,
    acceleration: termOutput(term, unit, index, context),
  }));
  const cruising =
    (weights.velocityMatch ?? 0) > 0 && !(isDriven(unit, state) && state.objective !== null);
  if (cruising) {
    const cruise = scale(unit.heading, unit.maxSpeed * cruiseShare);
    terms.push({ weight: 1, acceleration: matchVelocity(unit, cruise, cruiseTime) });
  }
  if (cruising || (weights.wander ?? 0) > 0) terms.push(edgeTerm(unit, state));
  return blend(terms, unit.maxAcceleration);
}

/** What one priority group asks of a unit, and whether it claims the unit. */
interface GroupOutput {
  readonly acceleration: Vec2;
  readonly active: boolean;
}

function seekGroupOutput(unit: UnitState, index: number, context: FrameContext): Vec2 {
  const { state } = context;
  const own = ownSteering(unit, index, context);
  if (length(own) > 0 || state.objective === null) return own;
  return arrive(unit, state.objective.position, unit.behaviour.tuning);
}

/**
 * The unit as its own steering is asked about it under separation's claim. The speed a push
 * gives a unit along itself is its neighbours' doing, so the unit's own steering is asked what it
 * would do without that speed, as far as the push presses: a unit a crowd carries past its own
 * pace does not brake against the crowd, while its pull toward where it is going stays whole. A
 * unit standing still, or moving against the push, is asked as it is.
 */
function withoutCarriedSpeed(unit: UnitState, push: Vec2): UnitState {
  const way = normalize(push);
  const pressed = Math.min(1, length(push) / (carryingPush * unit.maxAcceleration));
  const carried = Math.max(0, dot(unit.velocity, way)) * pressed;
  return carried === 0 ? unit : { ...unit, velocity: subtract(unit.velocity, scale(way, carried)) };
}

/**
 * Priority's separation group, which claims a unit on its push alone. Under the claim the unit's
 * own steering keeps its whole pull, and each neighbour in range adds a stiffened push and
 * friction, equal and opposite between the two of a pair. What a crowd adds to its units
 * therefore cancels across it, and its centre goes where their own steering takes it: sent
 * somewhere new, a settled crowd starts as the same units would with no neighbours, however near
 * the new place is. One thing is taken from the unit's own steering, the speed the push gives it,
 * so the units a crowd carries along do not brake against it, and the crowd keeps ahead of units
 * that close on the objective one by one. The stiffened push keeps a crowd packed round its
 * objective apart and the friction stops it churning, so it comes to rest. What the neighbours
 * add fades in over the first epsilon past the claim, so the unit's steering does not jump as
 * separation takes it.
 */
function underSeparation(
  unit: UnitState,
  index: number,
  push: Vec2,
  context: FrameContext,
  epsilon: number,
) {
  const { state } = context;
  const own = unit.behaviour.priority?.order.includes('seek')
    ? seekGroupOutput(withoutCarriedSpeed(unit, push), index, context)
    : zero;
  const crowd = neighbourForces(unit, index, state.units, separationOf(unit, state));
  const claimed = epsilon > 0 ? Math.min(1, length(push) / epsilon - 1) : 1;
  return add(own, scale(crowd, claimed));
}

function priorityOutput(
  group: PriorityGroup,
  unit: UnitState,
  index: number,
  context: FrameContext,
  epsilon: number,
): GroupOutput {
  const { state } = context;
  const claims = (acceleration: Vec2): GroupOutput => ({
    acceleration,
    active: length(acceleration) > epsilon,
  });
  switch (group) {
    case 'avoidance':
      return claims(termOutput(group, unit, index, context));
    case 'separation': {
      // Only a push that claims the unit needs the steering it eases.
      const push = termOutput(group, unit, index, context);
      return length(push) > epsilon
        ? { acceleration: underSeparation(unit, index, push, context, epsilon), active: true }
        : { acceleration: push, active: false };
    }
    case 'wander':
      return claims(
        blend(
          [
            { weight: 1, acceleration: termOutput('wander', unit, index, context) },
            edgeTerm(unit, state),
          ],
          unit.maxAcceleration,
        ),
      );
    case 'seek':
      return claims(seekGroupOutput(unit, index, context));
  }
}

// A unit with no route has nowhere to go, so nothing steers it and it brakes where it stands,
// whatever it carries: a blend, wandering included, or a priority order. It keeps all of that,
// so it goes on as it was composed once the field gives it a way. For any other unit, the first
// group in the order that claims it steers it; the groups after are not asked.
function steeringOf(unit: UnitState, index: number, context: FrameContext): Vec2 {
  if (unit.down || isBlocked(unit)) return zero;
  const { priority } = unit.behaviour;
  if (priority === null) return ownSteering(unit, index, context);
  for (const group of priority.order) {
    const output = priorityOutput(group, unit, index, context, priority.epsilon);
    if (output.active) return clipLength(output.acceleration, unit.maxAcceleration);
  }
  return zero;
}

// A unit nothing is steering brakes to a stop: left alone it would coast into the field's edge.
function accelerationOf(unit: UnitState, index: number, context: FrameContext): Vec2 {
  const steering = steeringOf(unit, index, context);
  return length(steering) > 0
    ? steering
    : matchVelocity(unit, zero, unit.behaviour.tuning.timeToTarget);
}

/** The acceleration each unit would apply in this state, in unit order. */
export function accelerationsOf(state: SimulationState): readonly Vec2[] {
  // A retired glyph still occupies a roster number for replay, but its neighbours have left it behind.
  const standing = state.units.some((unit) => unit.down)
    ? state.units.filter((unit) => !unit.down)
    : state.units;
  const context: FrameContext = {
    state: standing === state.units ? state : { ...state, units: standing },
    groups: new Map(),
  };
  let index = 0;
  return state.units.map((unit) => (unit.down ? zero : accelerationOf(unit, index++, context)));
}

interface Goal {
  readonly position: Vec2;
  readonly radius: number;
}

function goalOf(unit: UnitState, state: SimulationState): Goal | null {
  if (unit.down || isBlocked(unit)) return null;
  const place = placeOf(state.formations, unit.id);
  if (place)
    return { position: slotPosition(place.formation, place.slot), radius: slotReachedRadius };
  if (isDriven(unit, state) && state.objective !== null)
    return { position: state.objective.position, radius: unit.behaviour.tuning.targetRadius };
  return null;
}

function goalReached(unit: UnitState, state: SimulationState) {
  const goal = goalOf(unit, state);
  if (goal === null) return false;
  if (state.objective?.arrivedAt != null && placeOf(state.formations, unit.id) === null)
    return true;
  return distance(unit.position, goal.position) <= goal.radius + reachedSlack;
}

/** Whether a unit counts as standing still short of a goal it still has. */
function isHeldUp(unit: UnitState, state: SimulationState) {
  return (
    goalOf(unit, state) !== null && !goalReached(unit, state) && length(unit.velocity) < stillSpeed
  );
}

/** The nearest point at least `margin` inside the field. */
function insideField(position: Vec2, margin: number, field: SceneDefinition['field']): Vec2 {
  return {
    x: Math.min(field.width - margin, Math.max(margin, position.x)),
    y: Math.min(field.height - margin, Math.max(margin, position.y)),
  };
}

interface Moved {
  readonly unit: UnitState;
  /** A wall or an obstacle took some of the unit's step. */
  readonly stopped: boolean;
}

function integrate(unit: UnitState, acceleration: Vec2, state: SimulationState): Moved {
  const { field } = state.definition;
  const moved = clipLength(add(unit.velocity, scale(acceleration, frameSeconds)), unit.maxSpeed);
  const wanted = add(unit.position, scale(moved, frameSeconds));
  const allowed = insideField(wanted, unit.radius, field);
  // The field's edge stops a unit dead in that direction, so a pinned unit reads as stopped, not
  // running; walls and obstacles do the same in the direction that would meet them.
  const clear = {
    x: allowed.x === wanted.x ? moved.x : 0,
    y: allowed.y === wanted.y ? moved.y : 0,
  };
  const met = hasShapes(state.geometry)
    ? stopAtGeometry(state.geometry, unit.position, clear, unit.radius, frameSeconds)
    : { velocity: clear, stopped: false };
  const velocity = length(met.velocity) < restSpeed ? zero : met.velocity;
  const position = add(unit.position, scale(velocity, frameSeconds));
  const heading = length(velocity) > stillSpeed ? normalize(velocity) : unit.heading;
  return { unit: { ...unit, position, velocity, heading }, stopped: met.stopped };
}

// A following unit moves its aim on along its route, and one the geometry has stopped off its way
// plans again from where it stands.
function followOn(moved: Moved, state: SimulationState): UnitState {
  const unit = passWaypoints(moved.unit, state);
  return moved.stopped && lostWay(unit, state) ? planUnit(unit, state, true) : unit;
}

function turnWander(unit: UnitState): UnitState {
  if (unit.down || !wandering(unit)) return unit;
  const draw = nextBinomial(unit.wanderSeed);
  return {
    ...unit,
    wanderSeed: draw.seed,
    wanderAngle: wrapAngle(unit.wanderAngle + draw.value * unit.behaviour.tuning.wanderScale),
  };
}

/**
 * The units whose run the stopwatch times: those steering for the objective themselves, and the
 * members of a two-level formation, whose anchor goes there. A fixed formation's followers only
 * copy their leader, whatever steering they carried in.
 */
export function objectiveDrivers(state: SimulationState): readonly UnitState[] {
  return state.units.filter((unit) => {
    if (unit.down || isBlocked(unit)) return false;
    const place = placeOf(state.formations, unit.id);
    return place === null ? isDriven(unit, state) : place.formation.kind === 'two-level';
  });
}

// Seek has no brake and a wanderer never settles, so neither has to slow to have arrived. A
// formation's members brake at their slots, whatever steering they carried in.
function brakes(unit: UnitState, state: SimulationState) {
  const { seek = 0, wander = 0 } = unit.behaviour.weights;
  return placeOf(state.formations, unit.id) !== null || (seek === 0 && wander === 0);
}

const crowdReach = ({ behaviour: { tuning } }: UnitState, crowd: number) =>
  tuning.targetRadius + crowdShare * tuning.separationThreshold * Math.sqrt(crowd);

const slowed = (units: readonly UnitState[]) =>
  units.every((unit) => length(unit.velocity) < arrivalSpeed);

// However a group's centre lies, each part of it has to be there too: it may have started scattered
// round the objective. A free unit stands in the crowd, and a formation goes where its anchor goes.
function isThere(
  unit: UnitState,
  target: Vec2,
  reach: number,
  crowd: number,
  state: SimulationState,
) {
  const place = placeOf(state.formations, unit.id);
  return place
    ? distance(place.formation.anchor, target) <= reach
    : distance(unit.position, target) <= crowdReach(unit, crowd);
}

/**
 * A group has arrived with its centre on the objective, every part of it there and nobody that can
 * brake still moving. Or it has stopped round the objective, slow for half a second, which is as
 * close as a wall or its own crowding will let it come.
 */
function settleObjective(state: SimulationState): ObjectiveState | null {
  const { objective } = state;
  if (objective === null || objective.arrivedAt !== null) return objective;
  const drivers = objectiveDrivers(state);
  if (drivers.length === 0) return objective;
  const target = objective.position;
  const crowd = drivers.length;
  const reach =
    reachedSlack +
    Math.max(
      ...drivers.map((unit) =>
        placeOf(state.formations, unit.id) === null
          ? unit.behaviour.tuning.targetRadius
          : formationTargetRadius,
      ),
    );
  const centre = centroid(drivers.map((unit) => unit.position));
  const crossed =
    distance(centre, target) <= reach &&
    slowed(drivers.filter((unit) => brakes(unit, state))) &&
    drivers.every((unit) => isThere(unit, target, reach, crowd, state));
  const slowSince = slowed(drivers) ? (objective.slowSince ?? state.tick) : null;
  const stopped =
    slowSince !== null &&
    state.tick - slowSince >= stallThreshold &&
    drivers.every((unit) => {
      const spread = crowdReach(unit, crowd);
      return distance(centre, target) <= spread && distance(unit.position, target) <= 2 * spread;
    });
  return { ...objective, slowSince, arrivedAt: crossed || stopped ? state.tick : null };
}

/** Moves the scene one fixed step. A unit reads the frame before, so unit order cannot matter. */
export function advance(previous: SimulationState): SimulationState {
  return advanceMovement(advanceProjectiles(previous, frameSeconds, advanceMovement));
}

/** One frame of board choreography, also used to record the poses for a shot animation. */
export function advanceMovement(state: SimulationState): SimulationState {
  const turned = state.units.map(turnWander);
  const steering = { ...state, units: turned };
  const accelerations = accelerationsOf(steering);
  const moved = turned.map((unit, index) => integrate(unit, accelerations[index], state));
  const placed = { ...state, tick: state.tick + 1, units: moved.map((step) => step.unit) };
  const units = moved.map((step) => followOn(step, placed));
  const formations = state.formations.map((formation) =>
    advanceFormation(formation, units, state.objective?.position ?? null, frameSeconds),
  );
  const next: SimulationState = { ...placed, units, formations };
  const objective = settleObjective(next);
  const settled = { ...next, objective };
  return {
    ...settled,
    units: units.map((unit) => ({
      ...unit,
      stallFrames: isHeldUp(unit, settled) ? unit.stallFrames + 1 : 0,
    })),
  };
}

/** True when no unit is moving and nothing would start one moving, a marching anchor included. */
export function isAtRest(state: SimulationState) {
  if (
    state.bullets.length ||
    state.impacts.length ||
    state.units.some((unit) => inReach(unit, state))
  )
    return false;
  if (state.units.some((unit) => length(unit.velocity) > 0)) return false;
  const next = advance(state);
  return (
    next.units.every((unit) => length(unit.velocity) === 0) &&
    next.formations.every(
      ({ anchor }, index) =>
        distance(anchor, state.formations[index].anchor) < restSpeed * frameSeconds,
    )
  );
}

function activityOf(unit: UnitState, state: SimulationState): UnitActivity {
  if (unit.down) return 'down';
  if (isBlocked(unit)) return 'blocked';
  if (unit.stallFrames >= stallThreshold) return 'stalled';
  const moving = length(unit.velocity) > stillSpeed;
  if (goalOf(unit, state) === null) return moving ? 'moving' : 'idle';
  if (!goalReached(unit, state)) return 'moving';
  return placeOf(state.formations, unit.id) === null ? 'arrived' : 'formed';
}

function routeFrame(unit: UnitState, state: SimulationState): RouteFrame[] {
  const { route } = unit;
  if (route === null) return [];
  return [
    {
      id: unit.id,
      ahead: routeAhead(unit),
      reason: route.reason,
      search: route.search,
      replanning: route.replans > 0 && state.tick - route.plannedAt < replanningFrames,
    },
  ];
}

function rayFrames(unit: UnitState, state: SimulationState): RayFrame[] {
  if (unit.down || (unit.behaviour.weights.obstacleAvoidance ?? 0) <= 0) return [];
  return castAvoidanceRays(unit, state.geometry, unit.behaviour.tuning).map(
    ({ direction, reach, hit }) => ({
      id: unit.id,
      from: unit.position,
      to: hit?.point ?? add(unit.position, scale(direction, reach)),
      hit: hit !== null,
    }),
  );
}

export function frameOf(state: SimulationState): SceneFrame {
  const { formations } = state;
  return {
    frameNo: state.tick,
    field: state.definition.field,
    units: state.units.map((unit) => ({
      id: unit.id,
      position: unit.position,
      velocity: unit.velocity,
      heading: unit.heading,
      radius: unit.radius,
      activity: activityOf(unit, state),
      hits: unit.hits,
    })),
    anchors: formations
      .filter((formation) => formation.kind === 'two-level')
      .map((formation) => formation.anchor),
    slots: formations.flatMap((formation) =>
      formation.assignment.map(({ slot }) => slotPosition(formation, slot)),
    ),
    collisions: touchingPairs(state.units).map(([a, b]) => midpoint(a.position, b.position)),
    objective: state.objective?.position ?? null,
    geometry: state.geometry,
    routes: state.units.flatMap((unit) => routeFrame(unit, state)),
    rays: state.units.flatMap((unit) => rayFrames(unit, state)),
    bullets: state.bullets,
    impacts: state.impacts,
  };
}
