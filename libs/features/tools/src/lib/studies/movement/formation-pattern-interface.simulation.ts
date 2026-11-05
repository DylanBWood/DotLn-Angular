import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  assignSlots,
  centroid,
  clipLength,
  cosine,
  createSimulation,
  distance,
  type FormationPattern,
  type FormationState,
  patternSlots,
  scale,
  type SimulationState,
  sine,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter, textParameter } from '../parameters';

export interface RosterParameters {
  readonly pattern: FormationPattern;
  readonly capacity: number;
  readonly spacing: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly releaseStep: number;
  readonly turnStartStep: number;
  readonly turnEndStep: number;
  readonly turnDegrees: number;
  readonly driftCorrection: number;
  readonly comparisonCorrection: number;
  readonly memberSpeed: number;
  readonly memberAcceleration: number;
  readonly memberRadius: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface RosterPattern {
  readonly supportsSlots: (count: number) => boolean;
  readonly slotOffset: (slot: number) => Vec2;
  readonly driftOffset: (occupied: readonly number[]) => Vec2;
}

export interface RosterState {
  readonly step: number;
  readonly formation: FormationState;
  readonly members: SimulationState['units'];
  readonly rawSlots: readonly Vec2[];
  readonly drift: Vec2;
  readonly angle: number;
}

export const names = ['lookout', 'port', 'starboard'] as const;

export function readRosterParameters(parameters: StudyParameters): RosterParameters {
  const pattern = textParameter(parameters, 'pattern');
  if (pattern !== 'wedge' && pattern !== 'line' && pattern !== 'column')
    throw new RangeError('The roster needs an engine formation pattern.');
  const example: RosterParameters = {
    pattern,
    capacity: numberParameter(parameters, 'capacity'),
    spacing: numberParameter(parameters, 'spacing'),
    anchorX: numberParameter(parameters, 'anchorX'),
    anchorY: numberParameter(parameters, 'anchorY'),
    releaseStep: numberParameter(parameters, 'releaseStep'),
    turnStartStep: numberParameter(parameters, 'turnStartStep'),
    turnEndStep: numberParameter(parameters, 'turnEndStep'),
    turnDegrees: numberParameter(parameters, 'turnDegrees'),
    driftCorrection: numberParameter(parameters, 'driftCorrection'),
    comparisonCorrection: numberParameter(parameters, 'comparisonCorrection'),
    memberSpeed: numberParameter(parameters, 'memberSpeed'),
    memberAcceleration: numberParameter(parameters, 'memberAcceleration'),
    memberRadius: numberParameter(parameters, 'memberRadius'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
  };
  const boundaries = [
    example.releaseStep,
    example.turnStartStep,
    example.turnEndStep,
    example.steps,
  ];
  if (
    example.capacity !== names.length ||
    boundaries.some((value) => !Number.isInteger(value)) ||
    !(
      0 < example.releaseStep &&
      example.releaseStep < example.turnStartStep &&
      example.turnStartStep < example.turnEndStep &&
      example.turnEndStep < example.steps &&
      example.steps <= 239
    )
  )
    throw new RangeError(
      'The named roster needs an ordered release, turn and finish within 240 frames.',
    );
  if (![0, 1].includes(example.driftCorrection) || ![0, 1].includes(example.comparisonCorrection))
    throw new RangeError('Drift correction must be enabled or disabled.');
  return example;
}

/** A local contract adds capacity and occupied-slot drift to the engine's centred geometry. */
export function createRosterPattern(
  pattern: FormationPattern,
  capacity: number,
  spacing: number,
): RosterPattern {
  const offsets = patternSlots(pattern, capacity, spacing);
  const slotOffset = (slot: number): Vec2 => {
    if (!Number.isInteger(slot) || slot < 0 || slot >= capacity)
      throw new RangeError('The pattern has no such slot.');
    return offsets[slot];
  };
  return {
    supportsSlots: (count) => Number.isInteger(count) && count > 0 && count <= capacity,
    slotOffset,
    driftOffset: (occupied) => centroid(occupied.map(slotOffset)),
  };
}

export function advanceRosterMembers(
  state: RosterState,
  example: RosterParameters,
): SimulationState['units'] {
  return state.members.map((member) => {
    const assignment = state.formation.assignment.find(({ unitId }) => unitId === member.id);
    if (!assignment) throw new Error('Each present escort needs its original slot.');
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
}

export interface RosterSample {
  readonly state: RosterState;
  readonly nextMembers: SimulationState['units'];
}

export function rosterSamples(example: RosterParameters): readonly RosterSample[] {
  const pattern = createRosterPattern(example.pattern, example.capacity, example.spacing);
  if (!pattern.supportsSlots(names.length))
    throw new RangeError('The pattern cannot hold the roster.');
  const anchor = { x: example.anchorX, y: example.anchorY };
  const rawSlots = names.map((_name, slot) => pattern.slotOffset(slot));
  let members = createSimulation({
    id: 'harbour-lookout-release',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: {
      width: example.anchorX + example.spacing * 2,
      height: example.anchorY + example.spacing * 2,
    },
    units: names.map((id, slot) => ({
      id,
      labels: {},
      unitClass: 'escort',
      position: add(anchor, rawSlots[slot]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: example.memberSpeed,
      maxAcceleration: example.memberAcceleration,
      radius: example.memberRadius,
    })),
  }).units;
  const assignment = assignSlots(
    members,
    names.map(() => 'escort'),
    { 'cost.escort.escort': 0 },
  );
  const samples: RosterSample[] = [];
  for (let step = 0; step <= example.steps; step++) {
    if (step >= example.releaseStep) members = members.filter(({ id }) => id !== names[0]);
    const present = new Set(members.map(({ id }) => id));
    const held = assignment.filter(({ unitId }) => present.has(unitId));
    if (!pattern.supportsSlots(held.length))
      throw new RangeError('The pattern cannot hold the active roster.');
    const drift = pattern.driftOffset(held.map(({ slot }) => slot));
    const progress = Math.max(
      0,
      Math.min(1, (step - example.turnStartStep) / (example.turnEndStep - example.turnStartStep)),
    );
    const angle = example.turnDegrees * (Math.PI / 180) * progress;
    const state: RosterState = {
      step,
      members,
      rawSlots,
      drift,
      angle,
      formation: {
        kind: 'two-level',
        anchor,
        heading: { x: cosine(angle), y: sine(angle) },
        slots: rawSlots.map((offset) => subtract(offset, scale(drift, example.driftCorrection))),
        assignment: held,
        anchorVelocity: { x: 0, y: 0 },
        anchorSpeed: 0,
        lagLimit: 0,
        leader: null,
      },
    };
    const nextMembers = advanceRosterMembers(state, example);
    samples.push({ state, nextMembers });
    members = nextMembers;
  }
  return samples;
}

export function rosterStates(example: RosterParameters): readonly RosterState[] {
  return rosterSamples(example).map(({ state }) => state);
}

export const rosterMemberMean = (state: RosterState) =>
  centroid(state.members.map(({ position }) => position));

export const rosterTargetMean = (state: RosterState) =>
  centroid(state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot)));

export const rosterCentreGap = (state: RosterState) =>
  distance(rosterMemberMean(state), state.formation.anchor);

export const rosterTargetGap = (state: RosterState) =>
  distance(rosterTargetMean(state), state.formation.anchor);
