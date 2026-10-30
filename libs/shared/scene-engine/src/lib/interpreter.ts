import {
  formationPatterns,
  patternSlotRoles,
  patternSlots,
  recentred,
  slotRoles,
} from './formation';
import { accelerationsOf, objectiveDrivers } from './simulation';
import { assignSlots, slotCostKey, type SlotCosts } from './slot-assignment';
import type {
  CompositionStep,
  PriorityGroup,
  SimulationState,
  SlotAssignment,
  SteeringTerm,
  SteeringTuning,
  StepPreview,
  StepRefusal,
  StepResult,
  UnitBehaviour,
  UnitId,
  UnitState,
  Vec2,
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
] as const;

export type InterpretedKind = (typeof interpretedKinds)[number];

export const isInterpretedKind = (kind: string): kind is InterpretedKind =>
  interpretedKinds.some((interpreted) => interpreted === kind);

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
};

const priorityParams: Readonly<Record<string, PriorityGroup>> = {
  'avoidance-priority': 'avoidance',
  'separation-priority': 'separation',
  'seek-priority': 'seek',
  'wander-priority': 'wander',
};

const formationParams = ['pattern', 'slot-spacing', 'anchor-speed', 'anchor-lag-limit'];

const isCostParam = (name: string) => /^cost\.[a-z-]+\.[a-z-]+$/.test(name);

/** Whether the interpreter reads a catalog parameter, so none is silently ignored. */
export const readsParam = (name: string) =>
  name in weightParams ||
  name in tuningParams ||
  name in priorityParams ||
  name === 'epsilon' ||
  formationParams.includes(name) ||
  isCostParam(name);

// Eight hours of play: a replay or a comparison has to run every frame up to the last step.
const lastFrame = 1_728_000;
// A number the engine can square and multiply without leaving the finite range.
const largestNumber = 1e6;
// The least of what the engine divides by, or divides by a distance beyond.
const leastValues: Readonly<Record<string, number>> = {
  'time-to-target': 0.01,
  'anchor-lag-limit': 0,
};

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
  return state.units.filter((unit) => selected.has(unit.id));
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
  const count = members.length;
  const pattern = formationPatterns[Math.round(params['pattern'] ?? 0)] ?? 'wedge';
  const costs = Object.fromEntries(Object.entries(params).filter(([name]) => isCostParam(name)));
  const released = leaveFormations(
    state,
    members.map((unit) => unit.id),
  );
  const centre = centroid(members.map((unit) => unit.position));
  return {
    ...released,
    formations: [
      ...released.formations,
      {
        kind: 'two-level',
        slots: patternSlots(pattern, count, params['slot-spacing'] ?? defaultSpacing),
        assignment: assignSlots(members, patternSlotRoles(count), {
          ...defaultSlotCosts,
          ...costs,
        }),
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
  const centred = patternSlots(
    'wedge',
    members.length,
    step.params['slot-spacing'] ?? defaultSpacing,
  );
  // A fixed formation is measured from its leader, who stands at the tip.
  const slots = centred.map((slot) => subtract(slot, centred[0]));
  const roles = patternSlotRoles(members.length);
  const assignment: readonly SlotAssignment[] = members.map((unit, slot) => ({
    unitId: unit.id,
    slot,
    slotRole: roles[slot],
    cost: 0,
  }));
  const released = leaveFormations(
    state,
    members.map((unit) => unit.id),
  );
  return {
    ...released,
    formations: [
      ...released.formations,
      {
        kind: 'fixed',
        slots,
        assignment,
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

function applyObjective(state: SimulationState, step: CompositionStep): SimulationState {
  const { width, height } = state.definition.field;
  const position = {
    x: Math.min(width, Math.max(0, step.params['x'] ?? 0)),
    y: Math.min(height, Math.max(0, step.params['y'] ?? 0)),
  };
  return {
    ...state,
    objective: { position, startedAt: state.tick, arrivedAt: null, slowSince: null },
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
};

/** Why a step cannot run on this scene, or null when it can. */
export function refusalOf(state: SimulationState, step: CompositionStep): StepRefusal | null {
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
 */
export function applyStep(state: SimulationState, step: CompositionStep): StepResult {
  const refusal = refusalOf(state, step);
  if (refusal !== null) return { state, refusal };
  const applied = interpreters[step.kind as InterpretedKind](state, step);
  return { state: restartForNewDrivers(state, applied), refusal: null };
}

/** The first frame's accelerations and slot table a step would produce, without applying it. */
export function previewStep(state: SimulationState, step: CompositionStep): StepPreview {
  const result = applyStep(state, step);
  if (result.refusal !== null) return { arrows: [], assignment: [], refusal: result.refusal };
  const accelerations = accelerationsOf(result.state);
  const selected = new Set(step.selection);
  const arrows = result.state.units.flatMap((unit, index) =>
    selected.has(unit.id)
      ? [{ id: unit.id, position: unit.position, acceleration: accelerations[index] }]
      : [],
  );
  const forms = step.kind === 'formation.twoLevel' || step.kind === 'formation.fixed';
  const assignment = forms ? (result.state.formations.at(-1)?.assignment ?? []) : [];
  return { arrows, assignment, refusal: null };
}
