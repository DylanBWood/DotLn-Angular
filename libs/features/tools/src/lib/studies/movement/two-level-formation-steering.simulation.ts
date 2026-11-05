import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  advanceFormation,
  arrive,
  assignSlots,
  centroid,
  clipLength,
  createSimulation,
  distance,
  type FormationPattern,
  type FormationState,
  patternSlots,
  scale,
  type SimulationState,
  slotPosition,
  subtract,
} from '@dotln-angular/scene-engine';

import { numberParameter, textParameter } from '../parameters';

export interface EscortParameters {
  readonly pattern: FormationPattern;
  readonly memberCount: number;
  readonly spacing: number;
  readonly originX: number;
  readonly originY: number;
  readonly objectiveX: number;
  readonly objectiveY: number;
  readonly anchorSpeed: number;
  readonly lagLimit: number;
  readonly comparisonLagLimit: number;
  readonly memberSpeed: number;
  readonly memberAcceleration: number;
  readonly memberRadius: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly planningStepSeconds: number;
  readonly anchorAcceleration: number;
  readonly anchorSlowRadius: number;
  readonly anchorStopRadius: number;
  readonly anchorPull: number;
}

export interface EscortState {
  readonly formation: FormationState;
  readonly members: SimulationState['units'];
}

export const names = ['lantern', 'port', 'starboard'] as const;

export const meanOf = (state: EscortState) =>
  centroid(state.members.map((member) => member.position));

export function readEscortParameters(parameters: StudyParameters): EscortParameters {
  const pattern = textParameter(parameters, 'pattern');
  if (pattern !== 'wedge' && pattern !== 'line' && pattern !== 'column')
    throw new RangeError('The escort needs an engine formation pattern.');
  // Refuse stale teaching values instead of displaying arithmetic the engine did not run.
  const engineConstants = {
    planningStepSeconds: 0.25,
    anchorAcceleration: 24,
    anchorSlowRadius: 6,
    anchorStopRadius: 0.5,
    anchorPull: 0.02,
  } as const;
  for (const [name, expected] of Object.entries(engineConstants))
    if (numberParameter(parameters, name) !== expected)
      throw new RangeError(`${name} must describe the scene engine's fixed anchor rule.`);
  const example: EscortParameters = {
    pattern,
    memberCount: numberParameter(parameters, 'memberCount'),
    spacing: numberParameter(parameters, 'spacing'),
    originX: numberParameter(parameters, 'originX'),
    originY: numberParameter(parameters, 'originY'),
    objectiveX: numberParameter(parameters, 'objectiveX'),
    objectiveY: numberParameter(parameters, 'objectiveY'),
    anchorSpeed: numberParameter(parameters, 'anchorSpeed'),
    lagLimit: numberParameter(parameters, 'lagLimit'),
    comparisonLagLimit: numberParameter(parameters, 'comparisonLagLimit'),
    memberSpeed: numberParameter(parameters, 'memberSpeed'),
    memberAcceleration: numberParameter(parameters, 'memberAcceleration'),
    memberRadius: numberParameter(parameters, 'memberRadius'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    planningStepSeconds: numberParameter(parameters, 'planningStepSeconds'),
    anchorAcceleration: numberParameter(parameters, 'anchorAcceleration'),
    anchorSlowRadius: numberParameter(parameters, 'anchorSlowRadius'),
    anchorStopRadius: numberParameter(parameters, 'anchorStopRadius'),
    anchorPull: numberParameter(parameters, 'anchorPull'),
  };
  if (
    example.memberCount !== names.length ||
    !Number.isInteger(example.steps) ||
    example.steps < 1 ||
    example.steps > 239
  )
    throw new RangeError('This escort has three named members and at most 240 frames.');
  return example;
}

export function initialEscort(example: EscortParameters): EscortState {
  const slots = patternSlots(example.pattern, example.memberCount, example.spacing);
  const anchor = { x: example.originX, y: example.originY };
  const members = createSimulation({
    id: 'harbour-beacon-escort',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: {
      width: Math.abs(example.objectiveX - example.originX) + example.spacing * 2,
      height: example.spacing * 4,
    },
    units: names.map((id, index) => ({
      id,
      labels: {},
      unitClass: 'escort',
      position: add(anchor, slots[index]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: example.memberSpeed,
      maxAcceleration: example.memberAcceleration,
      radius: example.memberRadius,
    })),
  }).units;
  return {
    members,
    formation: {
      kind: 'two-level',
      slots,
      assignment: assignSlots(
        members,
        names.map(() => 'escort'),
        { 'cost.escort.escort': 0 },
      ),
      anchor,
      anchorVelocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      anchorSpeed: example.anchorSpeed,
      lagLimit: example.lagLimit,
      leader: null,
    },
  };
}

/** Members read the old slots; the anchor then reads their updated positions, as in the scene. */
export function calculateEscortStep(state: EscortState, example: EscortParameters) {
  const members = state.members.map((member) => {
    const assignment = state.formation.assignment.find(({ unitId }) => unitId === member.id);
    if (!assignment) throw new Error('Each escort needs an assigned slot.');
    const acceleration = arrive(member, slotPosition(state.formation, assignment.slot), {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    });
    const velocity = clipLength(
      add(member.velocity, scale(acceleration, example.timeStep)),
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
    {
      x: example.objectiveX,
      y: example.objectiveY,
    },
    example.timeStep,
  );
  const mean = centroid(members.map((member) => member.position));
  const proposed = add(state.formation.anchor, scale(formation.anchorVelocity, example.timeStep));
  const pulled = add(proposed, scale(subtract(mean, proposed), example.anchorPull));
  return {
    next: { formation, members },
    mean,
    proposed,
    pulled,
    pulledLag: distance(pulled, mean),
    capped: distance(pulled, mean) > state.formation.lagLimit,
  };
}

/** Retain the controller result used to advance each displayed state. */
export interface EscortSample {
  readonly state: EscortState;
  readonly calculation: ReturnType<typeof calculateEscortStep>;
  readonly next: EscortState;
}

export function escortSamples(example: EscortParameters): readonly EscortSample[] {
  const samples: EscortSample[] = [];
  let state: EscortState = initialEscort(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation = calculateEscortStep(state, example);
    const next = calculation.next;
    samples.push({ state, calculation, next });
    state = next;
  }
  return samples;
}

/** State-only access stays available to existing callers. */
export function escortStates(example: EscortParameters): readonly EscortState[] {
  return escortSamples(example).map(({ state }) => state);
}

export const escortLag = (state: EscortState) => distance(state.formation.anchor, meanOf(state));

export const escortSlotError = (state: EscortState) =>
  state.formation.assignment.reduce((sum, assignment) => {
    const member = state.members.find(({ id }) => id === assignment.unitId);
    if (!member) throw new Error('An assigned escort must be present.');
    return sum + distance(member.position, slotPosition(state.formation, assignment.slot));
  }, 0) / state.members.length;
