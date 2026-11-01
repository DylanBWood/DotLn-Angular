import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyPoint, StudyWorkedStep } from '../study-model';
import type { AlignStep, AngularState, AngularTuning } from './align.model';
import { calculateAlignStep, radians, wrapDegrees } from './align.model';

export interface FaceParameters extends AngularTuning {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly initialHeading: number;
  readonly initialAngularSpeed: number;
  readonly targetStartX: number;
  readonly targetStartY: number;
  readonly targetVelocityX: number;
  readonly targetVelocityY: number;
  readonly travelDuration: number;
  readonly directionLength: number;
  readonly steps: number;
  readonly slowMotorSpeed: number;
}

export interface FaceStep {
  readonly offset: StudyPoint;
  /** There is no bearing when the beacon and camera coincide. */
  readonly bearing: number | null;
  readonly alignment: AlignStep;
}

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);

const readParameters = (parameters: StudyParameters): FaceParameters => ({
  cameraX: numberParameter(parameters, 'cameraX'),
  cameraY: numberParameter(parameters, 'cameraY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialAngularSpeed: numberParameter(parameters, 'initialAngularSpeed'),
  targetStartX: numberParameter(parameters, 'targetStartX'),
  targetStartY: numberParameter(parameters, 'targetStartY'),
  targetVelocityX: numberParameter(parameters, 'targetVelocityX'),
  targetVelocityY: numberParameter(parameters, 'targetVelocityY'),
  travelDuration: numberParameter(parameters, 'travelDuration'),
  directionLength: numberParameter(parameters, 'directionLength'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxAngularSpeed: numberParameter(parameters, 'maxAngularSpeed'),
  maxAngularAcceleration: numberParameter(parameters, 'maxAngularAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  angleTolerance: numberParameter(parameters, 'angleTolerance'),
  speedTolerance: numberParameter(parameters, 'speedTolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  slowMotorSpeed: numberParameter(parameters, 'slowMotorSpeed'),
});

/** The ferry beacon follows its given path, then waits at the end of the crossing. */
export const beaconAt = (seconds: number, example: FaceParameters): StudyPoint => ({
  x: example.targetStartX + example.targetVelocityX * Math.min(seconds, example.travelDuration),
  y: example.targetStartY + example.targetVelocityY * Math.min(seconds, example.travelDuration),
});

/** Face derives an angular target and delegates to the same local Align step. */
export function calculateFaceStep(
  state: AngularState,
  target: StudyPoint,
  example: FaceParameters,
): FaceStep {
  const offset = { x: target.x - example.cameraX, y: target.y - example.cameraY };
  const bearing =
    offset.x === 0 && offset.y === 0 ? null : (Math.atan2(offset.y, offset.x) * 180) / Math.PI;
  return {
    offset,
    bearing,
    // Without a direction, ask Align to brake at the current heading rather than inventing one.
    alignment: calculateAlignStep(state, bearing ?? state.heading, example),
  };
}

export function faceFrames(
  example: FaceParameters,
  maxAngularSpeed = example.maxAngularSpeed,
): readonly AngularState[] {
  const tuning = { ...example, maxAngularSpeed };
  const states: AngularState[] = [
    { heading: example.initialHeading, angularVelocity: example.initialAngularSpeed },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(
      calculateFaceStep(states[step], beaconAt(step * example.timeStep, example), tuning).alignment
        .next,
    );
  return states;
}

function workedStep(
  state: AngularState,
  target: StudyPoint,
  calculation: FaceStep,
  step: number,
  example: FaceParameters,
): StudyWorkedStep {
  const { alignment, bearing, offset } = calculation;
  const seconds = step * example.timeStep;
  const travel = fixed(Math.min(seconds, example.travelDuration));
  return {
    title: `Worked facing step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
    lines: [
      `Beacon travel time = min(${fixed(seconds)}, ${fixed(example.travelDuration)}) = ${travel} s; position = (${fixed(example.targetStartX)} + ${fixed(example.targetVelocityX)} × ${travel}, ${fixed(example.targetStartY)} + ${fixed(example.targetVelocityY)} × ${travel}) = (${fixed(target.x)}, ${fixed(target.y)}).`,
      `Direction from the camera = (${fixed(target.x)} − ${fixed(example.cameraX)}, ${fixed(target.y)} − ${fixed(example.cameraY)}) = (${fixed(offset.x)}, ${fixed(offset.y)}).`,
      bearing === null
        ? 'Both components are zero, so bearing is undefined. Use the current heading as the braking target.'
        : `Bearing = atan2(${fixed(offset.y)}, ${fixed(offset.x)}) = ${fixed(bearing)}° clockwise from right. This uses the current beacon position.`,
      `Delegate to Align: wrap(${fixed(bearing ?? state.heading)} − ${fixed(state.heading)}) = ${fixed(alignment.error)}°.`,
      ...(alignment.settled
        ? [
            `Both tolerances pass: |${fixed(alignment.error)}| ≤ ${fixed(example.angleTolerance)}° and |${fixed(state.angularVelocity)}| ≤ ${fixed(example.speedTolerance)}°/s. Snap to ${fixed(alignment.next.heading)}° and set angular velocity to zero.`,
          ]
        : [
            Math.abs(alignment.error) <= example.angleTolerance
              ? `Inside the ${fixed(example.angleTolerance)}° angular tolerance, ask for zero angular velocity.`
              : `Desired angular velocity = sign(${fixed(alignment.error)}) × ${fixed(example.maxAngularSpeed)} × min(1, ${fixed(Math.abs(alignment.error))} / ${fixed(example.slowRadius)}) = ${fixed(alignment.desiredVelocity)}°/s.`,
            `Requested acceleration = (${fixed(alignment.desiredVelocity)} − ${fixed(state.angularVelocity)}) / ${fixed(example.responseTime)} = ${fixed(alignment.requestedAcceleration)}°/s²; cap at ±${fixed(example.maxAngularAcceleration)} to use ${fixed(alignment.acceleration)}°/s².`,
            `Angular velocity = ${fixed(state.angularVelocity)} + ${fixed(alignment.acceleration)} × ${fixed(example.timeStep)} → ${fixed(alignment.next.angularVelocity)}°/s, capped at ±${fixed(example.maxAngularSpeed)}°/s.`,
            `Heading = ${fixed(state.heading)} + ${fixed(alignment.next.angularVelocity)} × ${fixed(example.timeStep)} = ${fixed(alignment.next.heading)}°.`,
          ]),
      `The camera stays at (${fixed(example.cameraX)}, ${fixed(example.cameraY)}); the next frame samples the beacon again.`,
    ],
    note:
      bearing === null
        ? 'No direction exists at coincidence. Braking can still change the heading while the camera loses its remaining angular velocity.'
        : seconds < example.travelDuration
          ? 'The beacon keeps moving while the motor responds. A correctly calculated bearing can still leave a visible facing error.'
          : 'The beacon has stopped. The same controller can now finish aligning and settle.',
  };
}

function phaseOf(
  state: AngularState,
  calculation: FaceStep,
  step: number,
  example: FaceParameters,
): string {
  const { bearing, alignment, offset } = calculation;
  if (bearing === null)
    return 'The beacon is on the pedestal, so there is no sight ray and the camera brakes.';
  if (step === 0)
    return 'The camera starts turning towards the beacon because its current facing misses it.';
  if (step * example.timeStep >= example.travelDuration)
    return alignment.settled
      ? state.angularVelocity === 0 && alignment.error === 0
        ? 'The camera points at the stopped beacon and holds still because the turn is complete.'
        : 'The beacon has stopped and the camera is close and slow enough to settle.'
      : alignment.error * state.angularVelocity < 0
        ? 'The camera has turned past the stopped beacon and must brake before looking back.'
        : 'The beacon has stopped, but the camera still needs to close the remaining gap.';
  if (alignment.error * state.angularVelocity < 0)
    return 'The camera has turned past the moving beacon and must brake before looking back.';
  const bearingRate =
    (((offset.x * example.targetVelocityY - offset.y * example.targetVelocityX) /
      (offset.x * offset.x + offset.y * offset.y)) *
      180) /
    Math.PI;
  const fallingBehind = alignment.error * (bearingRate - state.angularVelocity) > 0;
  if (fallingBehind)
    return Math.abs(state.angularVelocity) >= example.maxAngularSpeed - 1e-8
      ? 'The beacon pulls ahead because the camera cannot turn any faster.'
      : 'The beacon’s bearing changes faster than the camera turns, so the camera falls further behind.';
  return alignment.acceleration * state.angularVelocity < 0
    ? 'The camera eases its turn as it catches up, while the beacon keeps moving.'
    : 'The camera narrows the gap while the beacon keeps changing the direction it must face.';
}

function frameOf(
  state: AngularState,
  step: number,
  example: FaceParameters,
  parameterValues: Readonly<Record<string, string>>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const target = beaconAt(seconds, example);
  const calculation = calculateFaceStep(state, target, example);
  const { alignment, bearing, offset } = calculation;
  const distance = Math.hypot(offset.x, offset.y);
  // End the rays before the beacon so neither ray crosses the name above it.
  const rayLength =
    bearing === null ? example.directionLength : Math.min(example.directionLength, distance / 2);
  return {
    seconds,
    bodies: [
      {
        id: 'dock-camera',
        label: 'Camera',
        x: example.cameraX,
        y: example.cameraY,
        heading: radians(state.heading),
      },
      {
        id: 'ferry-beacon',
        label: bearing === null ? undefined : 'Beacon',
        ...target,
        tone: 'target',
      },
    ],
    vectors: [
      {
        x: example.cameraX,
        y: example.cameraY,
        dx: cosine(radians(state.heading)) * rayLength,
        dy: sine(radians(state.heading)) * rayLength,
        tone: 'actual',
      },
      ...(bearing === null
        ? []
        : [
            {
              x: example.cameraX,
              y: example.cameraY,
              dx: (offset.x / distance) * rayLength,
              dy: (offset.y / distance) * rayLength,
              tone: 'desired' as const,
            },
          ]),
    ],
    links: [
      { from: beaconAt(0, example), to: beaconAt(example.travelDuration, example), tone: 'muted' },
    ],
    values: {
      ...parameterValues,
      seconds: fixed(seconds),
      targetX: fixed(target.x),
      targetY: fixed(target.y),
      dx: fixed(offset.x),
      dy: fixed(offset.y),
      bearing: bearing === null ? 'undefined' : fixed(bearing),
      bearingText:
        bearing === null
          ? 'undefined because Beacon and Camera coincide'
          : `${fixed(bearing)}° clockwise from right`,
      bearingRelation:
        bearing === null
          ? 'Beacon and Camera coincide, so there is no direction to face'
          : alignment.error === 0
            ? 'Camera points directly at Beacon'
            : `Beacon lies ${fixed(Math.abs(alignment.error))}° ${alignment.error > 0 ? 'clockwise' : 'anticlockwise'} from Camera’s facing`,
      heading: fixed(wrapDegrees(state.heading)),
      error: fixed(alignment.error),
      angularSpeed: fixed(state.angularVelocity),
      desiredAngularSpeed: fixed(alignment.desiredVelocity),
      acceleration: fixed(alignment.acceleration),
      nextAngularSpeed: fixed(alignment.next.angularVelocity),
      nextHeading: fixed(alignment.next.heading),
    },
    note: phaseOf(state, calculation, step, example),
    worked: workedStep(state, target, calculation, step, example),
  };
}

function slowMotor(
  example: FaceParameters,
  current: readonly AngularState[],
): NonNullable<MotionStudyModel['comparison']> {
  const slow = faceFrames(example, example.slowMotorSpeed);
  const seconds = current.map((_state, step) => step * example.timeStep);
  const errorOf = (state: AngularState, step: number) =>
    calculateFaceStep(state, beaconAt(seconds[step], example), example).alignment.error;
  const currentErrors = current.map(errorOf);
  const slowErrors = slow.map(errorOf);
  const stopStep = Math.min(example.steps, Math.ceil(example.travelDuration / example.timeStep));
  const last = current.length - 1;
  return {
    title: 'Compare motor speed limits on the same ferry crossing',
    intro:
      example.maxAngularSpeed === example.slowMotorSpeed
        ? `Both motors have a ${fixed(example.maxAngularSpeed)}°/s limit, so their lines coincide; raise the live motor limit to separate them.`
        : `Change only the motor speed limit from ${fixed(example.maxAngularSpeed)}°/s to ${fixed(example.slowMotorSpeed)}°/s; the beacon path, camera position, response time, acceleration limit and angular tolerances are identical.`,
    timeline: {
      title: 'Signed facing error',
      xLabel: 'Time · seconds',
      yLabel: 'Signed facing error · degrees',
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: `Solid green · current motor limit ${fixed(example.maxAngularSpeed)}°/s`,
          tone: 'actual',
          values: currentErrors,
        },
        {
          id: 'slow',
          label: `Dashed amber · motor limit ${fixed(example.slowMotorSpeed)}°/s`,
          tone: 'desired',
          values: slowErrors,
        },
      ],
      marks: [
        { x: seconds[stopStep], y: currentErrors[stopStep], tone: 'actual' },
        { x: seconds[stopStep], y: slowErrors[stopStep], tone: 'desired' },
      ],
    },
    findings: [
      `When the beacon stops at ${fixed(seconds[stopStep])} s, the current camera has ${fixed(currentErrors[stopStep])}° of signed facing error; the comparison camera has ${fixed(slowErrors[stopStep])}°.`,
      `At ${fixed(seconds[last])} s, the current camera ${currentErrors[last] === 0 && current[last].angularVelocity === 0 ? 'is at rest on the beacon bearing' : `is still correcting with ${fixed(currentErrors[last])}° of signed error and ${fixed(current[last].angularVelocity)}°/s angular velocity`}; the comparison camera has ${fixed(slowErrors[last])}° of signed error and ${fixed(slow[last].angularVelocity)}°/s angular velocity. Recomputing the bearing cannot make either motor turn faster than its limit.`,
    ],
    note: 'Dots mark when the beacon stops; Face samples its present position and adds no prediction of future position.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = faceFrames(example);
  const calculations = states.map((state, step) =>
    calculateFaceStep(state, beaconAt(step * example.timeStep, example), example),
  );
  const start = beaconAt(0, example);
  const end = beaconAt(example.travelDuration, example);
  const crossing = states.reduce(
    (best, _state, step) =>
      Math.abs(calculations[step].offset.x) < Math.abs(calculations[best].offset.x) ? step : best,
    0,
  );
  const stopStep = Math.min(example.steps, Math.ceil(example.travelDuration / example.timeStep));
  const settled = states.findIndex(
    (state, step) =>
      step >= stopStep && calculations[step].alignment.settled && state.angularVelocity === 0,
  );
  const last = states.length - 1;
  const finished = calculations[last].alignment.error === 0 && states[last].angularVelocity === 0;
  const parameterValues = {
    ...Object.fromEntries(
      Object.entries(parameters).map(([name, value]) => [
        name,
        typeof value === 'number' ? fixed(value) : value,
      ]),
    ),
    trackingOutcome: finished
      ? `The camera is at rest on the stopped beacon’s bearing by ${fixed(last * example.timeStep)} s`
      : `The camera is still correcting with ${fixed(Math.abs(calculations[last].alignment.error))}° of facing error and ${fixed(states[last].angularVelocity)}°/s angular velocity at ${fixed(last * example.timeStep)} s`,
  };
  const padding = example.directionLength / 2;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.cameraX - example.directionLength, start.x, end.x) - padding,
        maxX: Math.max(example.cameraX + example.directionLength, start.x, end.x) + padding,
        minY: Math.min(example.cameraY - example.directionLength, start.y, end.y) - padding,
        maxY: Math.max(example.cameraY + example.directionLength, start.y, end.y) + padding,
      },
      frames: states.map((state, step) => frameOf(state, step, example, parameterValues)),
    },
    timeline: {
      title: 'Camera heading and current beacon bearing',
      xLabel: 'Time · seconds',
      yLabel: 'Angle · degrees clockwise from right',
      seconds: states.map((_state, step) => step * example.timeStep),
      series: [
        {
          id: 'actual',
          label: 'Solid green · camera heading',
          tone: 'actual',
          values: states.map(({ heading }) => wrapDegrees(heading)),
        },
        {
          id: 'desired',
          label: 'Dashed amber · desired heading',
          tone: 'desired',
          values: calculations.map(({ bearing }, step) =>
            bearing === null ? wrapDegrees(states[step].heading) : bearing,
          ),
        },
      ],
    },
    initialStep: crossing,
    moments: [
      { label: 'First sight of the beacon', step: 0 },
      { label: 'Beacon crosses below the camera', step: crossing },
      { label: 'Beacon stops', step: stopStep },
      {
        label: settled < 0 ? 'Still following the stopped beacon' : 'Camera at rest on the bearing',
        step: settled < 0 ? last : settled,
      },
    ],
    legend: [
      { tone: 'actual', label: 'Solid green · actual' },
      { tone: 'desired', label: 'Dashed amber · desired' },
    ],
    caption:
      'Camera turns towards Beacon while staying on its pedestal; the thin line is the beacon’s path. Both rays show directions rather than speeds: green follows the lens and amber points towards the beacon now. The chart uses the same styles for actual heading and desired bearing. Angles increase clockwise from right.',
    comparison: slowMotor(example, states),
    inputs: [
      {
        name: 'maxAngularSpeed',
        label: 'Motor speed limit',
        unit: '°/s',
        min: 10,
        max: 120,
        step: 5,
      },
      {
        name: 'targetVelocityX',
        label: 'Beacon horizontal velocity',
        unit: 'units/s',
        min: -20,
        max: -5,
        step: 1,
      },
    ],
  };
};
