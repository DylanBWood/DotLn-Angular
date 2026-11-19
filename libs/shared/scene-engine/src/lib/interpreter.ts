import { formationPatterns, recentred, rosterSlots, slotRoles } from './formation';
import { defaultPathSettings, planUnit, replanAll, routesOf } from './path-following';
import { heuristics, layerWeightParams, travelWeightParams } from './pathfinding';
import { previewShot } from './projectiles';
import { accelerationsOf, advanceMovement, frameSeconds, objectiveDrivers } from './simulation';
import { slotCostKey, type SlotCosts } from './slot-assignment';
import type {
  CompositionStep,
  Obstacle,
  PathSettings,
  PriorityGroup,
  SceneGeometry,
  SimulationState,
  SteeringTerm,
  SteeringTuning,
  StepPreview,
  StepRefusal,
  StepResult,
  UnitBehaviour,
  UnitId,
  UnitState,
  Vec2,
  Wall,
} from './types';
import { centroid, length, normalize, subtract } from './vectors';

/** The kind of the step a click on the field makes. */
export const objectiveKind = 'objective.set';

/** The transform kinds this engine runs; anything else is refused with its name. */
export const interpretedKinds = [
  'steer.blend',
  'steer.priority',
  'formation.twoLevel',
  'formation.fixed',
  objectiveKind,
  'path.find',
  'path.smooth',
  'path.follow',
  'path.cost',
  'combat.fire',
  'combat.aim',
  'combat.projectile',
] as const;

export type InterpretedKind = (typeof interpretedKinds)[number];

export const isInterpretedKind = (kind: string): kind is InterpretedKind =>
  interpretedKinds.some((interpreted) => interpreted === kind);

/**
 * The steps that change the field rather than units: a wall, an obstacle, clearing shapes and the
 * tile graph's cell size. They are not catalog transforms, since geometry is the field's and not a
 * concept's, so no tool on the rail carries them; the field tools make them.
 */
export const fieldKinds = ['field.wall', 'field.obstacle', 'field.clear', 'field.grid'] as const;

export type FieldKind = (typeof fieldKinds)[number];

export const isFieldKind = (kind: string): kind is FieldKind =>
  fieldKinds.some((field) => field === kind);

const weightParams: Readonly<Record<string, SteeringTerm>> = {
  'seek-weight': 'seek',
  'arrive-weight': 'arrive',
  'flee-player-weight': 'flee',
  'separation-weight': 'separation',
  'cohesion-weight': 'cohesion',
  'velocity-match-weight': 'velocityMatch',
  'alignment-weight': 'velocityMatch',
  'wander-weight': 'wander',
  'avoidance-weight': 'avoidance',
  'obstacle-avoidance-weight': 'obstacleAvoidance',
};

const tuningParams: Readonly<Record<string, keyof SteeringTuning>> = {
  'slow-radius': 'slowRadius',
  'target-radius': 'targetRadius',
  'time-to-target': 'timeToTarget',
  threshold: 'separationThreshold',
  falloff: 'separationFalloff',
  'wander-radius': 'wanderRadius',
  'wander-offset': 'wanderOffset',
  'random-binomial-scale': 'wanderScale',
  'look-ahead': 'lookAhead',
  'whisker-angle': 'whiskerAngle',
  'avoid-distance': 'avoidDistance',
};

const priorityParams: Readonly<Record<string, PriorityGroup>> = {
  'avoidance-priority': 'avoidance',
  'separation-priority': 'separation',
  'seek-priority': 'seek',
  'wander-priority': 'wander',
};

const formationParams = ['pattern', 'slot-spacing', 'anchor-speed', 'anchor-lag-limit'];

const pathParams = ['heuristic', 'max-skip', 'waypoint-radius', 'path-offset', 'predict-time'];
const fireParams = [
  'target',
  'bullet-speed',
  'range',
  'rate',
  'hit-radius',
  'knockout-hits',
  'drag',
  'iterations',
];

// The cost functions' weights, read from the one list the search weighs them by.
const pathCostParams = [...travelWeightParams, ...layerWeightParams];

const isCostParam = (name: string) => /^cost\.[a-z-]+\.[a-z-]+$/.test(name);

/** Whether the interpreter reads a catalog parameter, so none is silently ignored. */
export const readsParam = (name: string) =>
  name in weightParams ||
  name in tuningParams ||
  name in priorityParams ||
  name === 'epsilon' ||
  formationParams.includes(name) ||
  pathParams.includes(name) ||
  pathCostParams.includes(name) ||
  fireParams.includes(name) ||
  isCostParam(name);

// Eight hours of play: a replay or a comparison has to run every frame up to the last step.
const lastFrame = 1_728_000;
// A number the engine can square and multiply without leaving the finite range.
const largestNumber = 1e6;
// The least of what the engine divides by, or divides by a distance beyond. A shape's size is
// never below zero, the look-ahead a ray reaches is above it, and a cell is at least one field
// unit across, so a tile graph of the field has at most 9,600 cells.
const leastValues: Readonly<Record<string, number>> = {
  'time-to-target': 0.01,
  'anchor-lag-limit': 0,
  'look-ahead': 0.01,
  thickness: 0,
  radius: 0,
  'cell-size': 1,
  'bullet-speed': 0.01,
  rate: 0.01,
  range: 0,
  drag: 0,
  'hit-radius': 0,
  'knockout-hits': 0,
  target: 0,
  iterations: 0,
};

/** The least value a step may give a parameter, or null when only the finite range bounds it. */
export const leastValueOf = (name: string): number | null => leastValues[name] ?? null;

/** Whether a step from outside keeps a run finite and inside what a comparison can reach. */
export const isSafeStep = ({ at, params }: Pick<CompositionStep, 'at' | 'params'>) =>
  at <= lastFrame &&
  Object.entries(params).every(
    ([name, value]) =>
      Math.abs(value) <= largestNumber && value >= (leastValues[name] ?? -largestNumber),
  );

const defaultSlotCosts: SlotCosts = Object.fromEntries(
  slotRoles.flatMap((unitClass) =>
    slotRoles.map((slotRole) => [slotCostKey(unitClass, slotRole), unitClass === slotRole ? 0 : 1]),
  ),
);

const defaultEpsilon = 0.1;
const defaultSpacing = 2;
const defaultAnchorSpeed = 2;
const defaultLagLimit = 5;

function entriesFor<Target>(
  params: CompositionStep['params'],
  names: Readonly<Record<string, Target>>,
) {
  return Object.entries(params).flatMap(([name, value]) =>
    name in names ? [{ name, target: names[name], value }] : [],
  );
}

function withBehaviour(
  state: SimulationState,
  selection: readonly UnitId[],
  change: (behaviour: UnitBehaviour) => UnitBehaviour,
): SimulationState {
  const selected = new Set(selection);
  return {
    ...state,
    units: state.units.map((unit) =>
      selected.has(unit.id) ? { ...unit, behaviour: change(unit.behaviour) } : unit,
    ),
  };
}

function leaveFormations(state: SimulationState, selection: readonly UnitId[]): SimulationState {
  const leaving = new Set(selection);
  return {
    ...state,
    formations: state.formations.flatMap((formation) => {
      const assignment = formation.assignment.filter(({ unitId }) => !leaving.has(unitId));
      if (assignment.length === 0) return [];
      return assignment.length === formation.assignment.length
        ? [formation]
        : [recentred({ ...formation, assignment })];
    }),
  };
}

// A unit that takes a place in a formation steers for its slot and nothing else, so it leaves
// its route, as a path tool takes a unit out of its formation.
function offRoutes(state: SimulationState, placed: readonly UnitId[]): SimulationState {
  const leaving = new Set(placed);
  return {
    ...state,
    units: state.units.map((unit) =>
      leaving.has(unit.id) && (unit.route !== null || unit.behaviour.path !== null)
        ? { ...unit, route: null, behaviour: { ...unit.behaviour, path: null } }
        : unit,
    ),
  };
}

// A unit newly heading for the objective starts a fresh run, so the stopwatch times it and not
// the group before it. Retuning units already on their way leaves the time alone.
function restartForNewDrivers(before: SimulationState, after: SimulationState) {
  const known = new Set(objectiveDrivers(before).map(({ id }) => id));
  const joined = objectiveDrivers(after).some(({ id }) => !known.has(id));
  return joined && after.objective !== null
    ? {
        ...after,
        objective: { ...after.objective, startedAt: after.tick, arrivedAt: null, slowSince: null },
      }
    : after;
}

const selectedUnits = (state: SimulationState, selection: readonly UnitId[]) => {
  const selected = new Set(selection);
  return state.units.filter((unit) => !unit.down && selected.has(unit.id));
};

function applyBlend(state: SimulationState, step: CompositionStep): SimulationState {
  const terms = entriesFor(step.params, weightParams);
  const weights = Object.fromEntries(terms.map(({ target, value }) => [target, value]));
  const tuning = Object.fromEntries(
    entriesFor(step.params, tuningParams).map(({ target, value }) => [target, value]),
  );
  const grouped = terms.some(({ target }) => target === 'cohesion' || target === 'velocityMatch');
  const members = selectedUnits(state, step.selection).map((unit) => unit.id);
  return withBehaviour(leaveFormations(state, members), members, (behaviour) => ({
    ...behaviour,
    weights: { ...behaviour.weights, ...weights },
    tuning: { ...behaviour.tuning, ...tuning },
    group: grouped ? members : behaviour.group,
  }));
}

function applyPriority(state: SimulationState, step: CompositionStep): SimulationState {
  const order = entriesFor(step.params, priorityParams)
    .sort((a, b) => a.value - b.value)
    .map(({ target }) => target);
  const priority = { order, epsilon: step.params['epsilon'] ?? defaultEpsilon };
  return withBehaviour(state, step.selection, (behaviour) => ({ ...behaviour, priority }));
}

function startingHeading(state: SimulationState, members: readonly UnitState[], centre: Vec2) {
  const toObjective = state.objective === null ? null : subtract(state.objective.position, centre);
  if (toObjective !== null && length(toObjective) > 0) return normalize(toObjective);
  const facing = centroid(members.map((unit) => unit.heading));
  return length(facing) > 0 ? normalize(facing) : { x: 1, y: 0 };
}

function applyTwoLevel(state: SimulationState, step: CompositionStep): SimulationState {
  const { params } = step;
  const members = selectedUnits(state, step.selection);
  const pattern = formationPatterns[Math.round(params['pattern'] ?? 0)] ?? 'wedge';
  const costs = Object.fromEntries(Object.entries(params).filter(([name]) => isCostParam(name)));
  const layout = {
    kind: 'two-level' as const,
    pattern,
    spacing: params['slot-spacing'] ?? defaultSpacing,
    slotCosts: { ...defaultSlotCosts, ...costs },
  };
  const ids = members.map((unit) => unit.id);
  const released = offRoutes(leaveFormations(state, ids), ids);
  const centre = centroid(members.map((unit) => unit.position));
  return {
    ...released,
    formations: [
      ...released.formations,
      {
        ...layout,
        ...rosterSlots(layout, members),
        anchor: centre,
        anchorVelocity: { x: 0, y: 0 },
        heading: startingHeading(state, members, centre),
        anchorSpeed: params['anchor-speed'] ?? defaultAnchorSpeed,
        lagLimit: params['anchor-lag-limit'] ?? defaultLagLimit,
        leader: null,
      },
    ],
  };
}

function applyFixed(state: SimulationState, step: CompositionStep): SimulationState {
  const members = selectedUnits(state, step.selection);
  const [leader] = members;
  const layout = {
    kind: 'fixed' as const,
    pattern: 'wedge' as const,
    spacing: step.params['slot-spacing'] ?? defaultSpacing,
    slotCosts: {},
  };
  // The leader steers for itself, so it keeps a route it has; its followers leave theirs.
  const ids = members.map((unit) => unit.id);
  const released = offRoutes(leaveFormations(state, ids), ids.slice(1));
  return {
    ...released,
    formations: [
      ...released.formations,
      {
        ...layout,
        ...rosterSlots(layout, members),
        anchor: leader.position,
        anchorVelocity: { x: 0, y: 0 },
        heading: leader.heading,
        anchorSpeed: 0,
        lagLimit: Infinity,
        leader: leader.id,
      },
    ],
  };
}

const onField = (state: SimulationState, x: number, y: number): Vec2 => {
  const { width, height } = state.definition.field;
  return { x: Math.min(width, Math.max(0, x)), y: Math.min(height, Math.max(0, y)) };
};

// Every unit following a route plans again when the objective moves.
function applyObjective(state: SimulationState, step: CompositionStep): SimulationState {
  const position = onField(state, step.params['x'] ?? 0, step.params['y'] ?? 0);
  return replanAll({
    ...state,
    objective: { position, startedAt: state.tick, arrivedAt: null, slowSince: null },
  });
}

/**
 * A path step sets the part of a unit's route it is about, whole: a parameter the step does not
 * carry reads as its default, so Dijkstra is A* with no heuristic and Path following is
 * Predictive path following looking no time ahead. The cost functions keep the weights the step
 * does not name, so cost tools add up. Like a blending tool, a path tool takes a unit out of its
 * formation, and the unit plans its route at once.
 */
function settingsAfter(settings: PathSettings, step: CompositionStep): PathSettings {
  const { params } = step;
  const read = (name: string, fallback: number) => params[name] ?? fallback;
  switch (step.kind) {
    case 'path.find':
      return {
        ...settings,
        heuristic: heuristics[Math.round(read('heuristic', 0))] ?? 'zero',
      };
    case 'path.smooth':
      return { ...settings, maxSkip: Math.max(1, Math.round(read('max-skip', 8))) };
    case 'path.follow':
      return {
        ...settings,
        waypointRadius: read('waypoint-radius', defaultPathSettings.waypointRadius),
        pathOffset: read('path-offset', defaultPathSettings.pathOffset),
        predictTime: read('predict-time', 0),
      };
    case 'path.cost':
      return {
        ...settings,
        costs: {
          ...settings.costs,
          ...Object.fromEntries(
            pathCostParams.flatMap((name) => (name in params ? [[name, params[name]]] : [])),
          ),
        },
      };
    default:
      return settings;
  }
}

function applyPath(state: SimulationState, step: CompositionStep): SimulationState {
  const members = selectedUnits(state, step.selection).map((unit) => unit.id);
  const released = withBehaviour(leaveFormations(state, members), members, (behaviour) => ({
    ...behaviour,
    path: settingsAfter(behaviour.path ?? defaultPathSettings, step),
  }));
  const chosen = new Set(members);
  return {
    ...released,
    units: released.units.map((unit) =>
      chosen.has(unit.id) ? planUnit(unit, released, false) : unit,
    ),
  };
}

function applyLauncher(state: SimulationState, step: CompositionStep): SimulationState {
  const chosen = new Set(step.selection);
  return {
    ...state,
    units: state.units.map((unit) => {
      if (unit.down || !chosen.has(unit.id)) return unit;
      const previous = unit.launcher;
      const params = step.params;
      if (step.kind === 'combat.aim') {
        const iterations = params['iterations'];
        const aim = iterations === undefined ? ('cue' as const) : ('repeat' as const);
        return { ...unit, launcher: { ...previous, aim, iterations: Math.round(iterations ?? 0) } };
      }
      const speed = params['bullet-speed'] ?? previous.speed;
      const launcher =
        step.kind === 'combat.projectile'
          ? { ...previous, speed, drag: params['drag'] ?? previous.drag }
          : {
              ...previous,
              speed,
              target: Math.round(params['target'] ?? 0),
              rate: params['rate'] ?? previous.rate,
              range: params['range'] ?? previous.range,
              radius: params['hit-radius'] ?? previous.radius,
              knockoutHits: Math.round(params['knockout-hits'] ?? previous.knockoutHits),
            };
      return { ...unit, launcher };
    }),
  };
}

const interpreters: Readonly<
  Record<InterpretedKind, (state: SimulationState, step: CompositionStep) => SimulationState>
> = {
  'steer.blend': applyBlend,
  'steer.priority': applyPriority,
  'formation.twoLevel': applyTwoLevel,
  'formation.fixed': applyFixed,
  [objectiveKind]: applyObjective,
  'path.find': applyPath,
  'path.smooth': applyPath,
  'path.follow': applyPath,
  'path.cost': applyPath,
  'combat.fire': applyLauncher,
  'combat.aim': applyLauncher,
  'combat.projectile': applyLauncher,
};

/** What a field step gives a shape it names no size for: a wall one unit thick, an obstacle of three. */
export const fieldDefaults = { thickness: 1, radius: 3 } as const;

type Numbered = Pick<Wall | Obstacle, 'shape'>;

const without = <Shape extends Numbered>(list: readonly Shape[], shape: number) =>
  list.filter((kept) => kept.shape !== shape);

// A step that names a shape replaces it where it stands; one that names none adds a shape.
const replacing = <Shape extends Numbered>(list: readonly Shape[], next: Shape) =>
  list.some((kept) => kept.shape === next.shape)
    ? list.map((kept) => (kept.shape === next.shape ? next : kept))
    : [...list, next];

/**
 * The number a new shape takes: one past the highest on the field or named by any of these field
 * steps, so a shape drawn before a composition's later field steps land is never replaced or
 * cleared by one of them.
 */
export function nextShapeNumber(
  geometry: SceneGeometry,
  steps: readonly Pick<CompositionStep, 'kind' | 'params'>[] = [],
): number {
  const onField = [...geometry.walls, ...geometry.obstacles].map(({ shape }) => shape);
  const named = steps.flatMap(({ kind, params }) =>
    isFieldKind(kind) && params['shape'] !== undefined ? [Math.round(params['shape'])] : [],
  );
  return Math.max(0, ...onField, ...named) + 1;
}

const shapeNumber = (geometry: SceneGeometry, named: number | undefined) =>
  named === undefined ? nextShapeNumber(geometry) : Math.round(named);

function fieldAfter(state: SimulationState, step: CompositionStep): SceneGeometry {
  const { geometry } = state;
  const { params } = step;
  switch (step.kind as FieldKind) {
    case 'field.wall': {
      const wall: Wall = {
        shape: shapeNumber(geometry, params['shape']),
        from: onField(state, params['x1'] ?? 0, params['y1'] ?? 0),
        to: onField(state, params['x2'] ?? 0, params['y2'] ?? 0),
        thickness: params['thickness'] ?? fieldDefaults.thickness,
      };
      return {
        ...geometry,
        walls: replacing(geometry.walls, wall),
        obstacles: without(geometry.obstacles, wall.shape),
      };
    }
    case 'field.obstacle': {
      const obstacle: Obstacle = {
        shape: shapeNumber(geometry, params['shape']),
        centre: onField(state, params['x'] ?? 0, params['y'] ?? 0),
        radius: params['radius'] ?? fieldDefaults.radius,
      };
      return {
        ...geometry,
        obstacles: replacing(geometry.obstacles, obstacle),
        walls: without(geometry.walls, obstacle.shape),
      };
    }
    case 'field.clear': {
      const named = params['shape'];
      if (named === undefined) return { ...geometry, walls: [], obstacles: [] };
      const shape = Math.round(named);
      return {
        ...geometry,
        walls: without(geometry.walls, shape),
        obstacles: without(geometry.obstacles, shape),
      };
    }
    case 'field.grid':
      return { ...geometry, cellSize: params['cell-size'] ?? geometry.cellSize };
  }
}

// A field step changes the ground every route was planned on, so every route is planned again.
const applyField = (state: SimulationState, step: CompositionStep) =>
  replanAll({ ...state, geometry: fieldAfter(state, step) });

/** Why a step cannot run on this scene, or null when it can. */
export function refusalOf(state: SimulationState, step: CompositionStep): StepRefusal | null {
  if (isFieldKind(step.kind)) return null;
  if (!isInterpretedKind(step.kind))
    return {
      code: 'uninterpreted',
      kind: step.kind,
      reason: `The scene engine does not interpret the transform kind ${step.kind}.`,
    };
  if (step.kind !== objectiveKind && selectedUnits(state, step.selection).length === 0)
    return {
      code: 'no-units',
      kind: step.kind,
      reason: `The transform ${step.kind} needs at least one unit.`,
    };
  return null;
}

/**
 * Folds a step into the scene. A step this engine cannot run is refused with a reason naming
 * its kind and leaves the state untouched, so the run is exactly as if it had never been made.
 * The objective and the field steps change the scene rather than units, so they need none.
 */
export function applyStep(state: SimulationState, step: CompositionStep): StepResult {
  const refusal = refusalOf(state, step);
  if (refusal !== null) return { state, refusal };
  const applied = isFieldKind(step.kind)
    ? applyField(state, step)
    : interpreters[step.kind as InterpretedKind](state, step);
  return { state: restartForNewDrivers(state, applied), refusal: null };
}

/** The first frame's accelerations and slot table a step would produce, without applying it. */
export function previewStep(state: SimulationState, step: CompositionStep): StepPreview {
  const result = applyStep(state, step);
  if (result.refusal !== null)
    return { arrows: [], assignment: [], routes: [], refusal: result.refusal };
  const accelerations = accelerationsOf(result.state);
  const selected = new Set(step.selection);
  const arrows = result.state.units.flatMap((unit, index) =>
    selected.has(unit.id)
      ? [{ id: unit.id, position: unit.position, acceleration: accelerations[index] }]
      : [],
  );
  const forms = step.kind === 'formation.twoLevel' || step.kind === 'formation.fixed';
  const assignment = forms ? (result.state.formations.at(-1)?.assignment ?? []) : [];
  const shooter = step.kind.startsWith('combat.')
    ? selectedUnits(result.state, step.selection)[0]
    : undefined;
  return {
    arrows,
    assignment,
    routes: routesOf(result.state, step.selection),
    refusal: null,
    ...(shooter ? { shot: previewShot(result.state, shooter, frameSeconds, advanceMovement) } : {}),
  };
}
