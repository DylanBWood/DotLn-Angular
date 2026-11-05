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
import type { MotionFrame, MotionStudyModel } from '../study-model';

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

const crew = [
  { id: 'scanner', label: 'Scanner', role: 'left' },
  { id: 'camera', label: 'Camera', role: 'centre' },
  { id: 'radio', label: 'Radio', role: 'right' },
] as const;

const readParameters = (parameters: StudyParameters): CoordinatedMovementParameters => ({
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

const fixed = (value: number) => value.toFixed(4);
const place = (position: Vec2) => `(${fixed(position.x)}, ${fixed(position.y)})`;
const arrivalTuning = (example: CoordinatedMovementParameters) => ({
  slowRadius: example.slowRadius,
  targetRadius: example.targetRadius,
  timeToTarget: example.responseTime,
});

function assignedTarget(formation: FormationState, id: string): Vec2 {
  const assignment = formation.assignment.find(({ unitId }) => unitId === id);
  if (!assignment) throw new Error(`The survey robot ${id} needs a slot.`);
  return slotPosition(formation, assignment.slot);
}

function cameraOf(state: CoordinatedMovementState) {
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
      labels: { name: member.label },
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

/** Public formation and arrival functions, followed by the study's velocity-first integrator. */
export function coordinatedMovementStep(
  state: CoordinatedMovementState,
  example: CoordinatedMovementParameters,
): CoordinatedMovementState {
  const formation = advanceFormation(
    state.formation,
    state.members,
    { x: example.targetX, y: example.targetY },
    example.timeStep,
  );
  const members = state.members.map((member) => {
    const acceleration = arrive(
      member,
      assignedTarget(formation, member.id),
      arrivalTuning(example),
    );
    const velocity = clipLength(
      add(member.velocity, scale(acceleration, example.timeStep)),
      member.maxSpeed,
    );
    return {
      ...member,
      velocity,
      position: add(member.position, scale(velocity, example.timeStep)),
      heading: length(velocity) > 0 ? normalize(velocity) : member.heading,
    };
  });
  return { formation, members };
}

export function coordinatedMovementFrames(
  example: CoordinatedMovementParameters,
): readonly CoordinatedMovementState[] {
  const states = [initialCoordinatedMovement(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(coordinatedMovementStep(states[states.length - 1], example));
  return states;
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

function frameOf(
  state: CoordinatedMovementState,
  step: number,
  example: CoordinatedMovementParameters,
): MotionFrame {
  const seconds = step * example.timeStep;
  const errors = coordinationErrors(state);
  const camera = cameraOf(state);
  const next = step === example.steps ? null : coordinatedMovementStep(state, example);
  const target = next ? assignedTarget(next.formation, 'camera') : null;
  const acceleration = target ? arrive(camera, target, arrivalTuning(example)) : null;
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
    bodies: state.members.map((member) => ({
      id: member.id,
      ...member.position,
      heading: Math.atan2(member.heading.y, member.heading.x),
      label: crew.find(({ id }) => id === member.id)?.label ?? member.id,
      tone: member.id === 'camera' ? 'actual' : 'other',
    })),
    marks: [
      ...state.formation.assignment.map(({ slot }) => ({
        ...slotPosition(state.formation, slot),
        shape: 'ring' as const,
        tone: 'desired' as const,
      })),
      { ...state.formation.anchor, shape: 'dot', tone: 'muted' },
      { x: example.targetX, y: example.targetY, shape: 'cross', tone: 'target', label: 'Gate' },
    ],
    links: state.members.map((member) => ({
      from: member.position,
      to: assignedTarget(state.formation, member.id),
      tone: 'desired',
    })),
    values: {
      ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
      ...Object.fromEntries(
        state.members.flatMap((member) => [
          [`${member.id}X`, fixed(member.position.x)],
          [`${member.id}Y`, fixed(member.position.y)],
        ]),
      ),
      seconds: fixed(seconds),
      anchorX: fixed(state.formation.anchor.x),
      anchorY: fixed(state.formation.anchor.y),
      cameraError: fixed(errors.camera),
      meanError: fixed(errors.mean),
      anchorLag: fixed(errors.anchorLag),
      slotTargets: crew
        .map(({ id, label }) => `${label} ${place(assignedTarget(state.formation, id))}`)
        .join('; '),
      memberVelocities: state.members
        .map(
          (member) =>
            `${crew.find(({ id }) => id === member.id)?.label ?? member.id} ${place(member.velocity)}`,
        )
        .join('; '),
    },
    note:
      step === 0
        ? 'Every robot owns a distinct slot and starts on it. The first anchor update will move all three targets before any robot moves.'
        : 'The rings move with the anchor. Robots move towards their own rings; the joining lines show their remaining slot errors.',
    worked:
      next && target && acceleration && nextCamera
        ? {
            title: `Camera follows its moved slot: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
            lines: [
              `advanceFormation moves the shared anchor from ${place(state.formation.anchor)} to ${place(next.formation.anchor)}; slotPosition gives Camera target ${place(target)}.`,
              `Distance from Camera ${place(camera.position)} to that target is ${fixed(gap)} units. Its speed request is ${fixed(desiredSpeed)} units/s, using maximum ${fixed(camera.maxSpeed)}, slowing radius ${fixed(example.slowRadius)} and stop distance ${fixed(stop)}.`,
              `Requested acceleration = (${place(desired)} − ${place(camera.velocity)}) / ${fixed(example.responseTime)} = ${place(requested)} units/s². Public arrive caps it at magnitude ${fixed(example.maxAcceleration)}, returning ${place(acceleration)}.`,
              `Velocity = clipLength(${place(camera.velocity)} + ${place(acceleration)} × ${fixed(example.timeStep)}, ${fixed(camera.maxSpeed)}) = ${place(nextCamera.velocity)} units/s.`,
              `Position = ${place(camera.position)} + ${place(nextCamera.velocity)} × ${fixed(example.timeStep)} = ${place(nextCamera.position)}.`,
            ],
            note: 'The anchor reads all previous member positions. Each robot then reads the same moved formation; no robot reads another robot after it has moved.',
          }
        : {
            title: `Survey sampling ends at ${fixed(seconds)} s`,
            lines: [],
            note: `Camera's remaining slot error is ${fixed(errors.camera)} units. The horizon does not assert that the survey has finished.`,
          },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = coordinatedMovementFrames(example);
  const slow = coordinatedMovementFrames({ ...example, cameraSpeed: example.failureCameraSpeed });
  const frames = states.map((state, step) => frameOf(state, step, example));
  const seconds = frames.map(({ seconds: time }) => time);
  const errors = states.map(coordinationErrors);
  const slowErrors = slow.map(coordinationErrors);
  const normalPeak = Math.max(...errors.map(({ camera }) => camera));
  const slowPeak = Math.max(...slowErrors.map(({ camera }) => camera));
  const points = frames.flatMap((frame) => [...frame.bodies, ...(frame.marks ?? [])]);
  const padding = Math.max(example.spacing, 1);
  const initialStep = Math.floor(example.steps / 3);
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - padding,
        maxX: Math.max(...points.map(({ x }) => x)) + padding,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Following the moving pattern',
      xLabel: 'Time · seconds',
      yLabel: 'Distance to assigned slot · units',
      seconds,
      series: [
        {
          id: 'camera',
          label: 'Green · Camera slot error',
          tone: 'actual',
          values: errors.map(({ camera }) => camera),
        },
        {
          id: 'mean',
          label: 'Amber · mean slot error',
          tone: 'desired',
          values: errors.map(({ mean }) => mean),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'Assigned and abreast', step: 0 },
      { label: 'Targets move first', step: 1 },
      { label: 'Following the pattern', step: initialStep },
      { label: 'Sampling horizon', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Green · Camera and its slot error' },
      { tone: 'other', label: 'Scanner and Radio' },
      { tone: 'desired', label: 'Amber rings · slots; lines · remaining errors' },
      { tone: 'muted', label: 'Small dot · shared anchor' },
      { tone: 'target', label: 'Cross · survey gate' },
    ],
    caption:
      'The named arrowheads are the survey robots. Rings are their assigned moving slots, joined to their owners. The small dot is the shared anchor; the cross is the gate. The chart measures following error, rather than treating a valid assignment as successful movement.',
    comparison: {
      title: 'A slot cannot make a slow robot keep up',
      intro: `Camera's speed limit alone changes from ${example.cameraSpeed} to ${example.failureCameraSpeed} units/s. The survey gate, slots, assignments, anchor settings, acceleration limit and ${example.timeStep}-s integration step stay the same.`,
      timeline: {
        title: 'Camera falls behind its centre slot',
        xLabel: 'Time · seconds',
        yLabel: 'Camera slot error · units',
        seconds,
        yRange: [0, Math.max(normalPeak, slowPeak, 1) * 1.1],
        series: [
          {
            id: 'normal',
            label: `Green · Camera speed ${example.cameraSpeed}`,
            tone: 'actual',
            values: errors.map(({ camera }) => camera),
          },
          {
            id: 'slow',
            label: `Amber · Camera speed ${example.failureCameraSpeed}`,
            tone: 'desired',
            values: slowErrors.map(({ camera }) => camera),
          },
        ],
      },
      findings: [
        `Camera's peak slot errors are ${fixed(normalPeak)} and ${fixed(slowPeak)} units. At the horizon they are ${fixed(errors[errors.length - 1].camera)} and ${fixed(slowErrors[slowErrors.length - 1].camera)} units.`,
        example.cameraSpeed === example.failureCameraSpeed
          ? 'The two speed limits now match, so these are the same run.'
          : 'The assignment stays intact in both runs. Anchor moderation responds to the group mean; it cannot give Camera the speed needed to reach its own moving slot.',
      ],
      note: 'This is a comparison of following ability on an empty quay. A doorway, collision policy or task change would require another decision beyond this fixed pattern.',
    },
    inputs: [
      {
        name: 'cameraSpeed',
        label: 'Camera speed limit',
        unit: 'units/s',
        min: 0.5,
        max: 8,
        step: 0.5,
      },
      {
        name: 'anchorSpeed',
        label: 'Anchor planning speed',
        unit: 'units/planning step',
        min: 0.25,
        max: 2,
        step: 0.25,
      },
    ],
  };
};
