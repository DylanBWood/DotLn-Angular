import { blend, firstActive, type WeightedSteering } from './blending';
import { advanceFormation, type FormationPlace, placeOf, slotPosition } from './formation';
import { touchingPairs } from './queries';
import { nextBinomial } from './random';
import {
  type ArrivalTuning,
  arrive,
  avoid,
  flee,
  keepOnField,
  matchVelocity,
  seek,
  separate,
  wander,
} from './steering';
import type {
  ObjectiveState,
  PriorityGroup,
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
  length,
  midpoint,
  normalize,
  scale,
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
// How near the objective priority's separation group sheds speed: as far as a crowd spreads.
const settlingRadius = 10;

export const defaultTuning: SteeringTuning = {
  slowRadius: 10,
  targetRadius: 1,
  timeToTarget: 0.25,
  separationThreshold: 3,
  separationFalloff: 2,
  wanderRadius: 4,
  wanderOffset: 6,
  wanderScale: 0.3,
};

const idleBehaviour: UnitBehaviour = {
  weights: {},
  tuning: defaultTuning,
  group: [],
  priority: null,
};

export function createSimulation(definition: SceneDefinition): SimulationState {
  return {
    definition,
    tick: 0,
    objective: null,
    formations: [],
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
// behind, and a weight set to nothing is an order to stay.
function weightsOf(unit: UnitState, state: SimulationState) {
  const { weights } = unit.behaviour;
  return leads(unit, state) && weights.seek === undefined && weights.arrive === undefined
    ? { ...weights, arrive: 1 }
    : weights;
}

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
      return objective === null ? zero : seek(unit, objective);
    case 'arrive':
      return objective === null ? zero : arrive(unit, objective, tuning);
    case 'flee':
      return objective === null ? zero : flee(unit, objective);
    case 'separation':
      // A formation stands closer than a crowd does, so its leader and members keep its spacing.
      return separate(
        unit,
        index,
        state.units,
        placeOf(state.formations, unit.id) !== null || leads(unit, state)
          ? formationSeparation
          : tuning,
      );
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
      return avoid(unit, index, state.units);
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

function priorityOutput(
  group: PriorityGroup,
  unit: UnitState,
  index: number,
  context: FrameContext,
): Vec2 {
  const { state } = context;
  switch (group) {
    case 'avoidance':
      return termOutput(group, unit, index, context);
    case 'separation': {
      const push = termOutput(group, unit, index, context);
      if (length(push) === 0) return zero;
      // Round the objective it is heading for, this group has the unit to itself, so it must shed
      // the unit's speed as well as part it: nothing else will, and the crowd would boil there for
      // ever. Anywhere else it keeps its speed, so a group under priority steering still travels.
      const { objective } = state;
      return objective !== null &&
        isDriven(unit, state) &&
        distance(unit.position, objective.position) <= settlingRadius
        ? add(push, matchVelocity(unit, zero, unit.behaviour.tuning.timeToTarget))
        : push;
    }
    case 'wander':
      return blend(
        [
          { weight: 1, acceleration: termOutput('wander', unit, index, context) },
          edgeTerm(unit, state),
        ],
        unit.maxAcceleration,
      );
    case 'seek': {
      const own = ownSteering(unit, index, context);
      if (length(own) > 0 || state.objective === null) return own;
      return arrive(unit, state.objective.position, unit.behaviour.tuning);
    }
  }
}

function steeringOf(unit: UnitState, index: number, context: FrameContext): Vec2 {
  const { priority } = unit.behaviour;
  if (priority === null) return ownSteering(unit, index, context);
  return clipLength(
    firstActive(
      priority.order.map((group) => priorityOutput(group, unit, index, context)),
      priority.epsilon,
    ),
    unit.maxAcceleration,
  );
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
  const context: FrameContext = { state, groups: new Map() };
  return state.units.map((unit, index) => accelerationOf(unit, index, context));
}

interface Goal {
  readonly position: Vec2;
  readonly radius: number;
}

function goalOf(unit: UnitState, state: SimulationState): Goal | null {
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

function integrate(
  unit: UnitState,
  acceleration: Vec2,
  field: SceneDefinition['field'],
): UnitState {
  const moved = clipLength(add(unit.velocity, scale(acceleration, frameSeconds)), unit.maxSpeed);
  const wanted = add(unit.position, scale(moved, frameSeconds));
  const allowed = insideField(wanted, unit.radius, field);
  // A wall stops a unit dead in that direction, so a pinned unit reads as stopped, not running.
  const clear = {
    x: allowed.x === wanted.x ? moved.x : 0,
    y: allowed.y === wanted.y ? moved.y : 0,
  };
  const velocity = length(clear) < restSpeed ? zero : clear;
  const position = add(unit.position, scale(velocity, frameSeconds));
  const heading = length(velocity) > stillSpeed ? normalize(velocity) : unit.heading;
  return { ...unit, position, velocity, heading };
}

function turnWander(unit: UnitState): UnitState {
  if (!wandering(unit)) return unit;
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
export function advance(state: SimulationState): SimulationState {
  const turned = state.units.map(turnWander);
  const steering = { ...state, units: turned };
  const accelerations = accelerationsOf(steering);
  const { field } = state.definition;
  const units = turned.map((unit, index) => integrate(unit, accelerations[index], field));
  const formations = state.formations.map((formation) =>
    advanceFormation(formation, units, state.objective?.position ?? null, frameSeconds),
  );
  const next: SimulationState = { ...state, tick: state.tick + 1, units, formations };
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
  if (unit.stallFrames >= stallThreshold) return 'stalled';
  const moving = length(unit.velocity) > stillSpeed;
  if (goalOf(unit, state) === null) return moving ? 'moving' : 'idle';
  if (!goalReached(unit, state)) return 'moving';
  return placeOf(state.formations, unit.id) === null ? 'arrived' : 'formed';
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
    })),
    anchors: formations
      .filter((formation) => formation.kind === 'two-level')
      .map((formation) => formation.anchor),
    slots: formations.flatMap((formation) =>
      formation.assignment.map(({ slot }) => slotPosition(formation, slot)),
    ),
    collisions: touchingPairs(state.units).map(([a, b]) => midpoint(a.position, b.position)),
    objective: state.objective?.position ?? null,
  };
}
