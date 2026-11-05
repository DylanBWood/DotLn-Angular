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
  type FormationState,
  length,
  normalize,
  patternSlots,
  scale,
  type SimulationState,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface CoordinatedMovementParameters {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly spacing: number;
  readonly memberSpeed: number;
  readonly cameraSpeed: number;
  readonly failureCameraSpeed: number;
  readonly maxAcceleration: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly anchorSpeed: number;
  readonly lagLimit: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly radius: number;
  readonly preferredCost: number;
  readonly otherCost: number;
  readonly seed: number;
}

export interface CoordinatedMovementState {
  readonly formation: FormationState;
  readonly members: SimulationState['units'];
}

export const crew = [
  { id: 'scanner', role: 'left' },
  { id: 'camera', role: 'centre' },
  { id: 'radio', role: 'right' },
] as const;

export const readParameters = (parameters: StudyParameters): CoordinatedMovementParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  spacing: numberParameter(parameters, 'spacing'),
  memberSpeed: numberParameter(parameters, 'memberSpeed'),
  cameraSpeed: numberParameter(parameters, 'cameraSpeed'),
  failureCameraSpeed: numberParameter(parameters, 'failureCameraSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  targetRadius: numberParameter(parameters, 'targetRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  anchorSpeed: numberParameter(parameters, 'anchorSpeed'),
  lagLimit: numberParameter(parameters, 'lagLimit'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  radius: numberParameter(parameters, 'radius'),
  preferredCost: numberParameter(parameters, 'preferredCost'),
  otherCost: numberParameter(parameters, 'otherCost'),
  seed: numberParameter(parameters, 'seed'),
});

export const arrivalTuning = (example: CoordinatedMovementParameters) => ({
  slowRadius: example.slowRadius,
  targetRadius: example.targetRadius,
  timeToTarget: example.responseTime,
});

export function assignedTarget(formation: FormationState, id: string): Vec2 {
  const assignment = formation.assignment.find(({ unitId }) => unitId === id);
  if (!assignment) throw new Error(`The survey robot ${id} needs a slot.`);
  return slotPosition(formation, assignment.slot);
}

export function cameraOf(state: CoordinatedMovementState) {
  const camera = state.members.find(({ id }) => id === 'camera');
  if (!camera) throw new Error('The Harbour survey includes Camera.');
  return camera;
}

export function initialCoordinatedMovement(
  example: CoordinatedMovementParameters,
): CoordinatedMovementState {
  const slots = patternSlots('line', crew.length, example.spacing);
  const anchor = { x: example.startX, y: example.startY };
  const costs = Object.fromEntries(
    crew.flatMap((member) =>
      crew.map(
        ({ role }) =>
          [
            `cost.${member.role}.${role}`,
            member.role === role ? example.preferredCost : example.otherCost,
          ] as const,
      ),
    ),
  );
  // Initialisation supplies the public simulation's member state; this study advances its
  // small formation explicitly, without the full scene's field or collision policies.
  const members = createSimulation({
    id: 'harbour-survey-trio',
    sceneType: 'units-on-terrain',
    field: {
      width: Math.abs(example.targetX - example.startX) + example.spacing * 2,
      height: Math.abs(example.targetY - example.startY) + example.spacing * 4,
    },
    seed: example.seed,
    units: crew.map((member, index) => ({
      id: member.id,
      labels: { name: member.id },
      unitClass: member.role,
      position: add(anchor, slots[index]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: member.id === 'camera' ? example.cameraSpeed : example.memberSpeed,
      maxAcceleration: example.maxAcceleration,
      radius: example.radius,
    })),
  }).units;
  return {
    members,
    formation: {
      kind: 'two-level',
      slots,
      assignment: assignSlots(
        members,
        crew.map(({ role }) => role),
        costs,
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

/** Formation movement and follower requests are evaluated together for one snapshot. */
export function calculateCoordinatedMovementStep(
  state: CoordinatedMovementState,
  example: CoordinatedMovementParameters,
) {
  const formation = advanceFormation(
    state.formation,
    state.members,
    { x: example.targetX, y: example.targetY },
    example.timeStep,
  );
  const accelerations = state.members.map((member) =>
    arrive(member, assignedTarget(formation, member.id), arrivalTuning(example)),
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
      heading: length(velocity) > 0 ? normalize(velocity) : member.heading,
    };
  });
  return { accelerations, next: { formation, members } satisfies CoordinatedMovementState };
}

export function coordinatedMovementStep(
  state: CoordinatedMovementState,
  example: CoordinatedMovementParameters,
): CoordinatedMovementState {
  return calculateCoordinatedMovementStep(state, example).next;
}

export interface CoordinatedMovementSample {
  readonly state: CoordinatedMovementState;
  readonly calculation: ReturnType<typeof calculateCoordinatedMovementStep> | null;
  readonly next: CoordinatedMovementState | null;
  readonly readout: ReturnType<typeof cameraReadout>;
}

export function coordinatedMovementSamples(
  example: CoordinatedMovementParameters,
): readonly CoordinatedMovementSample[] {
  const samples: CoordinatedMovementSample[] = [];
  let state = initialCoordinatedMovement(example);
  for (let step = 0; step <= example.steps; step++) {
    const calculation =
      step === example.steps ? null : calculateCoordinatedMovementStep(state, example);
    const next = calculation?.next ?? null;
    const readout = cameraReadout(state, step, example, calculation);
    samples.push({ state, calculation, next, readout });
    if (next) state = next;
  }
  return samples;
}

export function coordinatedMovementFrames(
  example: CoordinatedMovementParameters,
): readonly CoordinatedMovementState[] {
  return coordinatedMovementSamples(example).map(({ state }) => state);
}

export function coordinationErrors(state: CoordinatedMovementState) {
  const errors = state.members.map((member) =>
    distance(member.position, assignedTarget(state.formation, member.id)),
  );
  return {
    camera: distance(cameraOf(state).position, assignedTarget(state.formation, 'camera')),
    mean: errors.reduce((sum, error) => sum + error, 0) / errors.length,
    anchorLag: distance(
      state.formation.anchor,
      centroid(state.members.map(({ position }) => position)),
    ),
  };
}

export function cameraReadout(
  state: CoordinatedMovementState,
  step: number,
  example: CoordinatedMovementParameters,
  calculation = step === example.steps ? null : calculateCoordinatedMovementStep(state, example),
) {
  const seconds = step * example.timeStep;
  const errors = coordinationErrors(state);
  const camera = cameraOf(state);
  const next = calculation?.next ?? null;
  const target = next ? assignedTarget(next.formation, 'camera') : null;
  const acceleration = calculation
    ? calculation.accelerations[state.members.indexOf(camera)]
    : null;
  const gap = target ? distance(camera.position, target) : 0;
  const stop = example.targetRadius / 2;
  // This readout expands arrive's speed request; motion uses the public arrive result above.
  const desiredSpeed =
    gap <= stop ? 0 : camera.maxSpeed * Math.min(1, (gap - stop) / (example.slowRadius - stop));
  const desired = target
    ? scale(normalize(subtract(target, camera.position)), desiredSpeed)
    : { x: 0, y: 0 };
  const requested = scale(subtract(desired, camera.velocity), 1 / example.responseTime);
  const nextCamera = next ? cameraOf(next) : null;
  return {
    seconds,
    errors,
    camera,
    next,
    target,
    acceleration,
    gap,
    stop,
    desiredSpeed,
    desired,
    requested,
    nextCamera,
  };
}
