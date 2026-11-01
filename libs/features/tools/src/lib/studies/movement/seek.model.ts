import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  dot,
  length,
  scale,
  seek,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { numberParameter } from '../parameters';
import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyWorkedStep,
} from '../study-model';

export interface SeekParameters {
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly comparisonVelocityY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface SeekState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface SeekStep {
  readonly offset: Vec2;
  readonly distance: number;
  readonly acceleration: Vec2;
  readonly trialVelocity: Vec2;
  readonly next: SeekState;
}

const readParameters = (parameters: StudyParameters): SeekParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  comparisonVelocityY: numberParameter(parameters, 'comparisonVelocityY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

const beaconOf = (example: SeekParameters): Vec2 => ({
  x: example.targetX,
  y: example.targetY,
});

/** Seek is the engine's rule; the open-plane update uses its vector operations. */
export function calculateSeekStep(state: SeekState, example: SeekParameters): SeekStep {
  const beacon = beaconOf(example);
  const offset = subtract(beacon, state.position);
  const acceleration = seek(
    {
      ...state,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      // These fields complete the steering contract; seek does not read them.
      heading: zero,
      radius: 0,
      wanderAngle: 0,
    },
    beacon,
  );
  const trialVelocity = add(state.velocity, scale(acceleration, example.timeStep));
  const velocity = clipLength(trialVelocity, example.maxSpeed);
  return {
    offset,
    distance: length(offset),
    acceleration,
    trialVelocity,
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
    },
  };
}

export function seekFrames(example: SeekParameters): readonly SeekState[] {
  const states: SeekState[] = [
    {
      position: { x: example.startX, y: example.startY },
      velocity: { x: example.velocityX, y: example.velocityY },
    },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateSeekStep(states[states.length - 1], example).next);
  return states;
}

/** Unwrap the radius direction to distinguish a complete circuit from a close pass. */
export function sweptAngles(states: readonly SeekState[], beacon: Vec2): readonly number[] {
  let angle = 0;
  return states.map((state, step) => {
    if (step > 0) {
      const before = subtract(states[step - 1].position, beacon);
      const after = subtract(state.position, beacon);
      const cross = before.x * after.y - before.y * after.x;
      angle += Math.atan2(cross, dot(before, after));
    }
    return angle;
  });
}

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function workedStep(
  state: SeekState,
  step: number,
  example: SeekParameters,
  calculation: SeekStep,
): StudyWorkedStep {
  const { offset, acceleration, trialVelocity, next } = calculation;
  const seconds = step * example.timeStep;
  return {
    title: `Worked step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} seconds`,
    lines: [
      `Beacon minus Mica: ${pair(beaconOf(example))} − ${pair(state.position)} ≈ ${pair(offset)} units.`,
      `Distance = √(${fixed(offset.x)}² + ${fixed(offset.y)}²) ≈ ${fixed(calculation.distance)} units.`,
      calculation.distance === 0
        ? 'The offset is zero, so engine seek returns zero acceleration; it leaves velocity intact.'
        : `Engine seek: ${pair(offset)} / ${fixed(calculation.distance)} × ${fixed(example.maxAcceleration)} ≈ ${pair(acceleration)} units/s².`,
      `Trial velocity: ${pair(state.velocity)} + ${pair(acceleration)} × ${fixed(example.timeStep)} ≈ ${pair(trialVelocity)} units/s.`,
      `Trial speed ${fixed(length(trialVelocity))}, cap ${fixed(example.maxSpeed)} units/s: clipLength gives ${pair(next.velocity)} units/s.`,
      `New position: ${pair(state.position)} + ${pair(next.velocity)} × ${fixed(example.timeStep)} ≈ ${pair(next.position)} units.`,
    ],
    note:
      dot(state.velocity, offset) < 0
        ? 'Mica is moving away from the beacon while the motor pulls back. The velocity must change over time before the courier can return. Printed operands are rounded.'
        : 'The pull changes velocity; it does not set a desired velocity or a stopping distance. Printed operands are rounded.',
  };
}

function motionRelation(state: SeekState, calculation: SeekStep): string {
  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? 'Mica rests on the beacon with no acceleration'
      : 'Mica coasts through the beacon with no acceleration at this instant';
  const closing = dot(state.velocity, calculation.offset);
  if (closing < 0) return 'Mica is moving away while the motor pulls back towards the beacon';
  if (closing > 0) return 'Mica is moving closer while the motor keeps pulling towards the beacon';
  return 'Mica is moving across the inward pull rather than closing on the beacon';
}

function phaseNote(
  state: SeekState,
  step: number,
  angle: number,
  calculation: SeekStep,
  example: SeekParameters,
): string {
  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? 'Mica rests on the beacon because there is no remaining motion to carry it past.'
      : 'Mica is on the beacon but still moving, so zero acceleration lets it coast past.';
  if (step === 0)
    return example.velocityY === 0
      ? 'Mica heads straight at the beacon, but a direct approach still gives the motor no stopping rule.'
      : 'Mica starts with sideways motion that the inward pull must bend into a return.';
  if (dot(state.velocity, calculation.offset) < 0)
    return 'Mica is moving away while the inward pull works against the motion left from the pass.';
  if (example.velocityY !== 0 && Math.abs(angle) >= 2 * Math.PI)
    return 'Mica is circling back again because the inward pull changes direction without finishing the delivery.';
  return 'Mica is closing on the beacon while the motor keeps pulling instead of easing the approach.';
}

function frameOf(
  state: SeekState,
  step: number,
  angle: number,
  states: readonly SeekState[],
  example: SeekParameters,
): MotionFrame {
  const calculation = calculateSeekStep(state, example);
  const acceleration = scale(calculation.acceleration, example.accelerationSecondsSquared);
  const velocity = scale(state.velocity, example.velocitySeconds);
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'mica', ...state.position, tone: 'subject', label: 'Mica' }],
    marks: [{ ...beaconOf(example), shape: 'cross', tone: 'target', label: 'Beacon' }],
    vectors: [
      { ...state.position, dx: velocity.x, dy: velocity.y, tone: 'actual' },
      { ...state.position, dx: acceleration.x, dy: acceleration.y, tone: 'desired' },
    ],
    links: states.slice(0, step).map((before, index) => ({
      from: before.position,
      to: states[index + 1].position,
      tone: 'muted',
    })),
    values: {
      positionX: fixed(state.position.x),
      positionY: fixed(state.position.y),
      targetX: fixed(example.targetX),
      targetY: fixed(example.targetY),
      velocityX: fixed(state.velocity.x),
      velocityY: fixed(state.velocity.y),
      accelerationX: fixed(calculation.acceleration.x),
      accelerationY: fixed(calculation.acceleration.y),
      offsetX: fixed(calculation.offset.x),
      offsetY: fixed(calculation.offset.y),
      distance: fixed(calculation.distance),
      motionRelation: motionRelation(state, calculation),
      startSidewaysSpeed: fixed(Math.abs(example.velocityY)),
      maxAcceleration: fixed(example.maxAcceleration),
      accelerationMagnitude: fixed(length(calculation.acceleration)),
      pathKind: example.velocityY === 0 ? 'straight passes' : 'a curved return around the beacon',
      speed: fixed(length(state.velocity)),
      trialSpeed: fixed(length(calculation.trialVelocity)),
      turns: fixed(Math.abs(angle) / (2 * Math.PI)),
    },
    note: phaseNote(state, step, angle, calculation, example),
    worked: workedStep(state, step, example, calculation),
  };
}

/** Put close names in a separated row, with connectors routed below the motion. */
function labelFrame(frame: MotionFrame, left: number, span: number, rowY: number): MotionFrame {
  const mica = frame.bodies[0];
  const beacon = frame.marks?.[0];
  if (!beacon) return frame;
  const unit = span / drawingWidth;
  const named = [
    { label: 'Mica', point: mica },
    { label: 'Beacon', point: beacon },
  ];
  const closeNames =
    Math.abs(mica.x - beacon.x) < 96 * unit && Math.abs(mica.y - beacon.y) < 32 * unit;
  const crossesArrow = named.some(({ label, point }) =>
    (frame.vectors ?? []).some((vector) => {
      const left = point.x - label.length * 8 * unit;
      const right = point.x + label.length * 8 * unit;
      const top = point.y - 40 * unit;
      const bottom = point.y - 12 * unit;
      return (
        Math.max(vector.x, vector.x + vector.dx) + 8 * unit >= left &&
        Math.min(vector.x, vector.x + vector.dx) - 8 * unit <= right &&
        Math.max(vector.y, vector.y + vector.dy) + 8 * unit >= top &&
        Math.min(vector.y, vector.y + vector.dy) - 8 * unit <= bottom
      );
    }),
  );
  if (!closeNames && !crossesArrow) return frame;
  const callouts = named.map<MotionMark>(({ label }, index) => ({
    x: left + (span * (index + 1)) / (named.length + 1),
    y: rowY,
    shape: 'dot',
    tone: 'muted',
    label,
  }));
  const connectors = named.flatMap<MotionLink>(({ point }, index) => {
    const callout = callouts[index];
    const above = { x: callout.x + 64 * unit, y: rowY - 48 * unit };
    const beside = { x: above.x, y: rowY };
    return [
      { from: point, to: above, tone: 'muted' },
      { from: above, to: beside, tone: 'muted' },
      { from: beside, to: callout, tone: 'muted' },
    ];
  });
  return {
    ...frame,
    bodies: [{ ...mica, label: undefined }],
    marks: [{ ...beacon, label: undefined }, ...callouts],
    links: [...(frame.links ?? []), ...connectors],
  };
}

function comparison(example: SeekParameters): NonNullable<MotionStudyModel['comparison']> {
  const changed = { ...example, velocityY: example.comparisonVelocityY };
  const normal = seekFrames(example);
  const straight = seekFrames(changed);
  const beacon = beaconOf(example);
  const distances = (states: readonly SeekState[]) =>
    states.map(({ position }) => distance(position, beacon));
  const normalDistances = distances(normal);
  const straightDistances = distances(straight);
  const firstPass = straight.findIndex(({ position }) => position.x > example.targetX);
  return {
    title: 'Does a straight start stop Mica?',
    intro:
      example.velocityY === changed.velocityY
        ? 'The selected start is already straight, so these runs coincide; raise Sideways start to see the return curve into an orbit.'
        : `Change only the starting sideways velocity from ${fixed(example.velocityY)} to ${fixed(changed.velocityY)} units/s; both runs keep the same motor, speed cap and update.`,
    timeline: {
      title: 'Distance from the beacon',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds: normal.map((_state, step) => step * example.timeStep),
      reference: 0,
      yRange: [0, Math.max(...normalDistances, ...straightDistances)],
      series: [
        {
          id: 'sideways',
          label: 'Selected start',
          tone: 'actual',
          values: normalDistances,
        },
        {
          id: 'straight',
          label: 'Straight start',
          tone: 'desired',
          values: straightDistances,
        },
      ],
    },
    findings: [
      example.velocityY === 0
        ? 'With no sideways motion, Mica keeps crossing the beacon along a line; straight alignment has supplied no brake.'
        : `The ${fixed(example.velocityY)} units/s sideways start bends the return around the beacon; the ${fixed(changed.velocityY)} units/s start keeps passing along a line, and neither run supplies a stop.`,
      firstPass < 0
        ? 'The changed run does not cross the beacon within the displayed window.'
        : `On its first pass at ${fixed(firstPass * example.timeStep)} s, the straight run is ${fixed(straight[firstPass].position.x - example.targetX)} units beyond the beacon and still moving at ${fixed(straight[firstPass].velocity.x)} units/s.`,
    ],
    note: 'Both lines show distance, so touching the baseline would mean coincidence, not a stop. The chart joins fixed simulation samples.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = seekFrames(example);
  const beacon = beaconOf(example);
  const angles = sweptAngles(states, beacon);
  const rawFrames = states.map((state, step) =>
    frameOf(state, step, angles[step], states, example),
  );
  const rawPoints = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const padding = Math.max(
    example.maxSpeed * example.velocitySeconds,
    example.maxAcceleration * example.accelerationSecondsSquared,
  );
  const spanX =
    Math.max(...rawPoints.map(({ x }) => x)) -
    Math.min(...rawPoints.map(({ x }) => x)) +
    2 * padding;
  const left = Math.min(...rawPoints.map(({ x }) => x)) - padding;
  const rowY = Math.max(...rawPoints.map(({ y }) => y)) + (64 * spanX) / drawingWidth;
  const frames = rawFrames.map((frame) => labelFrame(frame, left, spanX, rowY));
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const overshoot = states.findIndex(
    (state) =>
      state.position.x > example.targetX &&
      dot(state.velocity, subtract(beacon, state.position)) < 0,
  );
  const circuit =
    example.velocityY === 0 ? -1 : angles.findIndex((angle) => Math.abs(angle) >= 2 * Math.PI);
  const returning = states.findIndex((state, step) => step > overshoot && state.velocity.x < 0);
  const initialStep = overshoot < 0 ? 0 : overshoot;
  const gaps = states.map(({ position }) => distance(position, beacon));
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: left,
        maxX: left + spanX,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Distance from the beacon',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds: frames.map(({ seconds }) => seconds),
      yRange: [0, Math.max(...gaps)],
      reference: 0,
      series: [{ id: 'distance', label: 'Green · Mica to beacon', tone: 'actual', values: gaps }],
    },
    initialStep,
    moments: [
      { label: example.velocityY === 0 ? 'Straight start' : 'Sideways start', step: 0 },
      { label: 'Past the beacon', step: initialStep },
      {
        label: circuit >= 0 ? 'Complete circuit' : returning >= 0 ? 'Turning back' : 'Later motion',
        step: circuit >= 0 ? circuit : returning >= 0 ? returning : example.steps,
      },
      { label: 'Still moving', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Velocity' },
      { tone: 'desired', label: 'Inward acceleration' },
      { tone: 'muted', label: 'Path so far' },
    ],
    caption: `Mica's green arrow shows velocity × ${fixed(example.velocitySeconds)} s; the amber arrow shows acceleration × ${fixed(example.accelerationSecondsSquared)} s². Grey lines keep the path, and connectors keep names clear of the motion. Zero distance alone would not finish the delivery.`,
    comparison: comparison(example),
    inputs: [
      { name: 'velocityY', label: 'Sideways start', unit: 'units/s', min: 0, max: 4, step: 0.5 },
    ],
  };
};
