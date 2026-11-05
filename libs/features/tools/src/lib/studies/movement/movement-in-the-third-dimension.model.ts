import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyPoint } from '../study-model';

export interface ThirdDimensionParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startZ: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly targetZ: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly rollDegrees: number;
  readonly verticalWeight: number;
  readonly flatVerticalWeight: number;
  readonly wingSpan: number;
}

export interface VolumeVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface DroneState {
  readonly position: VolumeVector;
  readonly velocity: VolumeVector;
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
}

const readParameters = (parameters: StudyParameters): ThirdDimensionParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startZ: numberParameter(parameters, 'startZ'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  targetZ: numberParameter(parameters, 'targetZ'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  rollDegrees: numberParameter(parameters, 'rollDegrees'),
  verticalWeight: numberParameter(parameters, 'verticalWeight'),
  flatVerticalWeight: numberParameter(parameters, 'flatVerticalWeight'),
  wingSpan: numberParameter(parameters, 'wingSpan'),
});

const origin: VolumeVector = { x: 0, y: 0, z: 0 };
const add3 = (a: VolumeVector, b: VolumeVector): VolumeVector => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const subtract3 = (a: VolumeVector, b: VolumeVector): VolumeVector => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const scale3 = (value: VolumeVector, factor: number): VolumeVector => ({
  x: value.x * factor,
  y: value.y * factor,
  z: value.z * factor,
});
export const volumeLength = (value: VolumeVector) =>
  Math.sqrt(value.x * value.x + value.y * value.y + value.z * value.z);
const clipped3 = (value: VolumeVector, maximum: number) => {
  const speed = volumeLength(value);
  return speed > maximum ? scale3(value, maximum / speed) : value;
};
const targetOf = (example: ThirdDimensionParameters): VolumeVector => ({
  x: example.targetX,
  y: example.targetY,
  z: example.targetZ,
});
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (angle: number) => (angle * 180) / Math.PI;
const fixed = (value: number) => value.toFixed(2);
const vectorText = (value: VolumeVector) =>
  `(${fixed(value.x)}, ${fixed(value.y)}, ${fixed(value.z)})`;

export const initialDroneState = (example: ThirdDimensionParameters): DroneState => ({
  position: { x: example.startX, y: example.startY, z: example.startZ },
  velocity: origin,
  yaw: 0,
  pitch: 0,
  roll: radians(example.rollDegrees),
});

/** The public scene engine has Vec2 only; this volume step is explicitly study-local. */
export function calculateThirdDimensionStep(
  state: DroneState,
  example: ThirdDimensionParameters,
  verticalWeight = example.verticalWeight,
) {
  const target = targetOf(example);
  const effectiveTarget = {
    ...target,
    y: state.position.y + (target.y - state.position.y) * verticalWeight,
  };
  const offset = subtract3(effectiveTarget, state.position);
  const distance = volumeLength(offset);
  const acceleration = distance === 0 ? origin : scale3(offset, example.maxAcceleration / distance);
  const candidateVelocity = clipped3(
    add3(state.velocity, scale3(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const travel = scale3(candidateVelocity, example.timeStep);
  // This example approaches along one straight ray. The final partial step prevents buzzing.
  const reached = volumeLength(travel) >= distance;
  const moving = volumeLength(candidateVelocity) > 0;
  const horizontalSpeed = Math.hypot(candidateVelocity.x, candidateVelocity.z);
  const next: DroneState = {
    position: reached ? effectiveTarget : add3(state.position, travel),
    velocity: reached ? origin : candidateVelocity,
    yaw: horizontalSpeed === 0 ? state.yaw : Math.atan2(candidateVelocity.z, candidateVelocity.x),
    pitch: moving ? Math.atan2(candidateVelocity.y, horizontalSpeed) : state.pitch,
    roll: radians(example.rollDegrees),
  };
  return { offset, distance, acceleration, candidateVelocity, reached, next };
}

export function thirdDimensionStates(
  example: ThirdDimensionParameters,
  verticalWeight = example.verticalWeight,
): readonly DroneState[] {
  const states = [initialDroneState(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(
      calculateThirdDimensionStep(states[states.length - 1], example, verticalWeight).next,
    );
  return states;
}

/** Yaw and pitch choose the nose; roll independently turns the wing about that nose. */
export function droneAxes(state: Pick<DroneState, 'yaw' | 'pitch' | 'roll'>) {
  const [cy, sy] = [cosine(state.yaw), sine(state.yaw)];
  const [cp, sp] = [cosine(state.pitch), sine(state.pitch)];
  const forward = { x: cp * cy, y: sp, z: cp * sy };
  const levelRight = { x: -sy, y: 0, z: cy };
  const levelUp = { x: -sp * cy, y: cp, z: -sp * sy };
  const right = add3(scale3(levelRight, cosine(state.roll)), scale3(levelUp, sine(state.roll)));
  return { forward, levelRight, right };
}

// An oblique projection keeps height separate from depth on the existing motion surface.
export const projectDrone = ({ x, y, z }: VolumeVector): StudyPoint => ({
  x: x + z * 0.5,
  y: z * 0.35 - y,
});

function frameOf(state: DroneState, step: number, example: ThirdDimensionParameters): MotionFrame {
  const calculation = calculateThirdDimensionStep(state, example);
  const target = targetOf(example);
  const point = projectDrone(state.position);
  const shadow = projectDrone({ ...state.position, y: example.startY });
  const { forward, right, levelRight } = droneAxes(state);
  const nose = projectDrone(add3(state.position, forward));
  const wing = (axis: VolumeVector) => ({
    from: projectDrone(add3(state.position, scale3(axis, -example.wingSpan / 2))),
    to: projectDrone(add3(state.position, scale3(axis, example.wingSpan / 2))),
  });
  const seconds = step * example.timeStep;
  const speed = volumeLength(state.velocity);
  const gap = volumeLength(subtract3(target, state.position));
  return {
    seconds,
    bodies: [
      {
        id: 'drone',
        ...point,
        heading: Math.atan2(nose.y - point.y, nose.x - point.x),
        label: 'Drone',
      },
      { id: 'ground-projection', ...shadow, tone: 'muted', label: 'Ground projection' },
    ],
    marks: [
      { ...projectDrone(target), shape: 'cross', label: 'Beacon' },
      { ...projectDrone({ ...target, y: example.startY }), shape: 'ring', tone: 'muted' },
    ],
    links: [
      { from: shadow, to: point, tone: 'muted' },
      {
        from: projectDrone({ ...target, y: example.startY }),
        to: projectDrone(target),
        tone: 'target',
      },
      { ...wing(levelRight), tone: 'other' },
      { ...wing(right), tone: 'desired' },
    ],
    vectors: [
      { x: point.x, y: point.y, dx: nose.x - point.x, dy: nose.y - point.y, tone: 'actual' },
    ],
    values: {
      seconds: fixed(seconds),
      groundHeight: fixed(example.startY),
      x: fixed(state.position.x),
      y: fixed(state.position.y),
      z: fixed(state.position.z),
      targetX: fixed(example.targetX),
      targetY: fixed(example.targetY),
      targetZ: fixed(example.targetZ),
      speed: fixed(speed),
      distance: fixed(gap),
      yaw: fixed(degrees(state.yaw)),
      pitch: fixed(degrees(state.pitch)),
      roll: fixed(degrees(state.roll)),
      maxSpeed: fixed(example.maxSpeed),
      maxAcceleration: fixed(example.maxAcceleration),
      timeStep: fixed(example.timeStep),
      verticalWeight: String(example.verticalWeight),
      flatVerticalWeight: String(example.flatVerticalWeight),
    },
    note:
      gap === 0
        ? 'The drone has reached the beacon. Its last yaw and pitch remain defined while its velocity is zero.'
        : 'The height connector separates the drone from its ground projection; the wing line shows roll independently of the nose direction.',
    worked: {
      title: `Volume step at ${fixed(seconds)} seconds`,
      lines: [
        `Target minus position, retaining height: ${vectorText(calculation.offset)}; length ${fixed(calculation.distance)} units.`,
        `Local acceleration = offset × ${fixed(example.maxAcceleration)} / length = ${vectorText(calculation.acceleration)} units/s²; a zero offset produces zero acceleration.`,
        `Velocity + acceleration × ${fixed(example.timeStep)}, capped by total speed ${fixed(example.maxSpeed)}: ${vectorText(calculation.candidateVelocity)} units/s.`,
        calculation.reached
          ? `The next travel reaches the effective target, so use ${vectorText(calculation.next.position)} and stop. This last-step clamp is a teaching rule, not braking.`
          : `Position + capped velocity × ${fixed(example.timeStep)} = ${vectorText(calculation.next.position)} units.`,
        `Next yaw ${fixed(degrees(calculation.next.yaw))}°, pitch ${fixed(degrees(calculation.next.pitch))}°; the independent roll command remains ${fixed(example.rollDegrees)}°.`,
      ],
      note: 'Position, velocity and acceleration have height components. The displayed angles describe an immediate pose, not angular dynamics or an aircraft controller.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = thirdDimensionStates(example);
  const flat = thirdDimensionStates(example, example.flatVerticalWeight);
  const frames = states.map((state, step) => frameOf(state, step, example));
  const seconds = frames.map((frame) => frame.seconds);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const remaining = (run: readonly DroneState[]) =>
    run.map((state) => volumeLength(subtract3(targetOf(example), state.position)));
  const normalDistance = remaining(states);
  const flatDistance = remaining(flat);
  const padding = Math.max(2, example.wingSpan);
  const initialStep = Math.min(example.steps, 8);
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
      title: 'The drone climbs through the volume',
      xLabel: 'Time · seconds',
      yLabel: 'Height · units',
      seconds,
      reference: example.targetY,
      series: [
        {
          id: 'height',
          label: 'Actual height',
          tone: 'actual',
          values: states.map((state) => state.position.y),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'At rest', step: 0 },
      { label: 'First volume step', step: Math.min(1, example.steps) },
      { label: 'Climbing and rolled', step: initialStep },
      { label: 'End of approach', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Drone and its projected nose' },
      { tone: 'target', label: 'Beacon and its height' },
      { tone: 'desired', label: 'Wing after the roll command' },
      { tone: 'other', label: 'Wing with no roll' },
      { tone: 'muted', label: 'Ground projection and height connector' },
    ],
    caption:
      'An oblique projection of one drone: rightward combines x and depth z, upward shows height y. The connector ends at its ground projection. The wing lines compare the roll command about the nose with the unrolled reference. Angles and coordinates remain readable beside the drawing.',
    comparison: {
      title: 'What if the steering drops height?',
      intro: `Change only verticalWeight from ${example.verticalWeight} to ${example.flatVerticalWeight}. The beacon, speed cap, roll and time step stay the same; the second run aims at the beacon's ground coordinates.`,
      timeline: {
        title: 'True distance to the elevated beacon',
        xLabel: 'Time · seconds',
        yLabel: 'Distance · units',
        seconds,
        reference: 0,
        series: [
          {
            id: 'volume',
            label: `Height weight ${example.verticalWeight}`,
            tone: 'actual',
            values: normalDistance,
          },
          {
            id: 'flat',
            label: `Height weight ${example.flatVerticalWeight}`,
            tone: 'desired',
            values: flatDistance,
          },
        ],
      },
      findings: [
        `The normal run ends ${fixed(normalDistance[normalDistance.length - 1])} units from the beacon; dropping height leaves ${fixed(flatDistance[flatDistance.length - 1])} units.`,
        example.targetY === example.startY
          ? 'The beacon is at the starting height, so this input gives both runs the same reachable target.'
          : `The flattened run ends at height ${fixed(flat[flat.length - 1].position.y)} while the beacon is at ${fixed(example.targetY)}. Matching ground coordinates alone cannot close that height gap.`,
      ],
      note: 'This compares representations, not flying capability. The local model has no gravity, collision volume, turn-rate limit or aerodynamic bank law.',
    },
    inputs: [
      { name: 'targetY', label: 'Beacon height', unit: 'units', min: 0, max: 12, step: 1 },
      {
        name: 'rollDegrees',
        label: 'Independent roll',
        unit: 'degrees',
        min: -60,
        max: 60,
        step: 10,
      },
    ],
  };
};
