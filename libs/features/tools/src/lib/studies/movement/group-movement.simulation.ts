import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  advanceFormation,
  arrive,
  centroid,
  clipLength,
  createSimulation,
  distance,
  type FormationState,
  length,
  patternSlots,
  scale,
  slotPosition,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export const memberIds = ['north', 'medic', 'south'] as const;

export const memberNames = ['North escort', 'Medic', 'South escort'] as const;

export interface GroupExample {
  readonly startX: number;
  readonly goalX: number;
  readonly spacing: number;
  readonly anchorSpeed: number;
  readonly fastAnchorSpeed: number;
  readonly escortSpeed: number;
  readonly medicSpeed: number;
  readonly maxAcceleration: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly lagLimit: number;
  readonly slotErrorBudget: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly arrivalDistance: number;
  readonly arrivalSpeed: number;
  readonly radius: number;
  readonly velocityArrowSeconds: number;
  readonly enginePlanningSeconds: number;
  readonly engineAnchorPull: number;
}

export function readGroupExample(parameters: StudyParameters): GroupExample {
  const example: GroupExample = {
    startX: numberParameter(parameters, 'startX'),
    goalX: numberParameter(parameters, 'goalX'),
    spacing: numberParameter(parameters, 'spacing'),
    anchorSpeed: numberParameter(parameters, 'anchorSpeed'),
    fastAnchorSpeed: numberParameter(parameters, 'fastAnchorSpeed'),
    escortSpeed: numberParameter(parameters, 'escortSpeed'),
    medicSpeed: numberParameter(parameters, 'medicSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    lagLimit: numberParameter(parameters, 'lagLimit'),
    slotErrorBudget: numberParameter(parameters, 'slotErrorBudget'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    arrivalDistance: numberParameter(parameters, 'arrivalDistance'),
    arrivalSpeed: numberParameter(parameters, 'arrivalSpeed'),
    radius: numberParameter(parameters, 'radius'),
    velocityArrowSeconds: numberParameter(parameters, 'velocityArrowSeconds'),
    enginePlanningSeconds: numberParameter(parameters, 'enginePlanningSeconds'),
    engineAnchorPull: numberParameter(parameters, 'engineAnchorPull'),
  };
  if (!Object.values(example).every(Number.isFinite))
    throw new Error('Group parameters must be finite.');
  if (
    example.goalX <= example.startX ||
    example.spacing <= 0 ||
    example.timeStep <= 0 ||
    example.responseTime < example.timeStep ||
    example.targetRadius <= 0 ||
    example.slowRadius <= example.targetRadius / 2 ||
    example.maxAcceleration <= 0 ||
    example.escortSpeed < 0 ||
    example.medicSpeed < 0 ||
    example.anchorSpeed < 0 ||
    example.fastAnchorSpeed < 0 ||
    example.lagLimit <= 0 ||
    example.radius <= 0 ||
    example.slotErrorBudget <= 0 ||
    example.arrivalDistance <= 0 ||
    example.arrivalSpeed <= 0 ||
    example.velocityArrowSeconds <= 0 ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error(
      'The journey needs positive distances and times, non-negative speeds and at most 239 steps.',
    );
  // These parameters document fixed engine rules; accepting another value would mislabel the calculation.
  if (example.enginePlanningSeconds !== 0.25 || example.engineAnchorPull !== 0.02)
    throw new Error('The engine planning interval and anchor pull are fixed.');
  return example;
}

export interface GroupState {
  readonly members: ReturnType<typeof createSimulation>['units'];
  readonly formation: FormationState;
}

export function initialGroup(example: GroupExample): GroupState {
  const anchor = { x: example.startX, y: 0 };
  const slots = patternSlots('line', memberIds.length, example.spacing);
  const members = createSimulation({
    id: 'lantern-squad',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: { width: example.goalX - example.startX, height: example.spacing * memberIds.length },
    units: memberIds.map((id, slot) => ({
      id,
      labels: { name: memberNames[slot] },
      unitClass: id === 'medic' ? 'medic' : 'escort',
      position: add(anchor, slots[slot]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: id === 'medic' ? example.medicSpeed : example.escortSpeed,
      maxAcceleration: example.maxAcceleration,
      radius: example.radius,
    })),
  }).units;
  return {
    members,
    formation: {
      kind: 'two-level',
      slots,
      anchor,
      anchorVelocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      anchorSpeed: example.anchorSpeed,
      lagLimit: example.lagLimit,
      leader: null,
      assignment: memberIds.map((unitId, slot) => ({
        unitId,
        slot,
        slotRole: unitId === 'medic' ? 'medic' : 'escort',
        cost: 0,
      })),
    },
  };
}

/** Followers read the old slots together; the engine then advances the anchor using their new positions. */
export function calculateGroupStep(state: GroupState, example: GroupExample) {
  const targets = state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot));
  const accelerations = state.members.map((member, index) =>
    arrive(member, targets[index], {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    }),
  );
  const members = state.members.map((member, index) => {
    const velocity = clipLength(
      add(member.velocity, scale(accelerations[index], example.timeStep)),
      member.maxSpeed,
    );
    return {
      ...member,
      velocity,
      position: add(member.position, scale(velocity, example.timeStep)),
    };
  });
  const formation = advanceFormation(
    state.formation,
    members,
    { x: example.goalX, y: 0 },
    example.timeStep,
  );
  return { targets, accelerations, next: { members, formation } satisfies GroupState };
}

/** Retain the controller result used to advance each displayed state. */
export interface GroupSample {
  readonly state: GroupState;
  readonly calculation: ReturnType<typeof calculateGroupStep>;
  readonly next: GroupState;
}

export function groupSamples(example: GroupExample): readonly GroupSample[] {
  const samples: GroupSample[] = [];
  let state: GroupState = initialGroup(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateGroupStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function groupStates(example: GroupExample): readonly GroupState[] {
  return groupSamples(example).map(({ state }) => state);
}

export const slotErrors = (state: GroupState) =>
  state.members.map((member, index) =>
    distance(
      member.position,
      slotPosition(state.formation, state.formation.assignment[index].slot),
    ),
  );

export const maxSlotError = (state: GroupState) => Math.max(...slotErrors(state));

export const anchorLag = (state: GroupState) =>
  distance(state.formation.anchor, centroid(state.members.map(({ position }) => position)));

/** Arrival means being near the final slot and slow; proximity to a moving slot is not arrival. */
export const arrivalSteps = (
  states: readonly GroupState[],
  example: GroupExample,
): readonly (number | null)[] =>
  memberIds.map((_id, index) => {
    const found = states.findIndex(
      ({ members, formation }) =>
        distance(
          members[index].position,
          add({ x: example.goalX, y: 0 }, formation.slots[index]),
        ) <= example.arrivalDistance && length(members[index].velocity) <= example.arrivalSpeed,
    );
    return found === -1 ? null : found;
  });
