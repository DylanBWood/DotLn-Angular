import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { StudyFrame, StudyModel, StudyWorkedStep } from '../study-model';

/** Angular quantities use degrees; only the drawing converts to radians. */
export interface AngularTuning {
  readonly slowRadius: number;
  readonly maxAngularSpeed: number;
  readonly maxAngularAcceleration: number;
  readonly responseTime: number;
  readonly angleTolerance: number;
  readonly speedTolerance: number;
  readonly timeStep: number;
}

export interface AlignParameters extends AngularTuning {
  readonly cameraX: number;
  readonly cameraY: number;
  readonly initialHeading: number;
  readonly initialAngularSpeed: number;
  readonly targetHeading: number;
  readonly directionLength: number;
  readonly steps: number;
  readonly lateSlowRadius: number;
}

export interface AngularState {
  /** Continuous, so crossing the angle boundary does not reset the accumulated turn. */
  readonly heading: number;
  readonly angularVelocity: number;
}

export interface AlignStep {
  readonly rawError: number;
  readonly error: number;
  readonly desiredVelocity: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly settled: boolean;
  readonly next: AngularState;
}

const fullTurn = 360;
export const radians = (degrees: number) => (degrees * Math.PI) / (fullTurn / 2);

/** The half-turn tie chooses the negative direction: the upper boundary is excluded. */
export const wrapDegrees = (angle: number) =>
  angle - fullTurn * Math.floor((angle + fullTurn / 2) / fullTurn);

const limit = (value: number, magnitude: number) =>
  Math.max(-magnitude, Math.min(magnitude, value));

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);

const readParameters = (parameters: StudyParameters): AlignParameters => ({
  cameraX: numberParameter(parameters, 'cameraX'),
  cameraY: numberParameter(parameters, 'cameraY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialAngularSpeed: numberParameter(parameters, 'initialAngularSpeed'),
  targetHeading: numberParameter(parameters, 'targetHeading'),
  directionLength: numberParameter(parameters, 'directionLength'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxAngularSpeed: numberParameter(parameters, 'maxAngularSpeed'),
  maxAngularAcceleration: numberParameter(parameters, 'maxAngularAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  angleTolerance: numberParameter(parameters, 'angleTolerance'),
  speedTolerance: numberParameter(parameters, 'speedTolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  lateSlowRadius: numberParameter(parameters, 'lateSlowRadius'),
});

/** A local angular controller: the scene engine has no angular acceleration behaviour. */
export function calculateAlignStep(
  state: AngularState,
  targetHeading: number,
  tuning: AngularTuning,
): AlignStep {
  const rawError = targetHeading - state.heading;
  const error = wrapDegrees(rawError);
  const settled =
    Math.abs(error) <= tuning.angleTolerance &&
    Math.abs(state.angularVelocity) <= tuning.speedTolerance;
  if (settled)
    return {
      rawError,
      error,
      desiredVelocity: 0,
      requestedAcceleration: 0,
      acceleration: 0,
      settled,
      next: { heading: targetHeading - (rawError - error), angularVelocity: 0 },
    };
  const desiredVelocity =
    Math.abs(error) <= tuning.angleTolerance
      ? 0
      : Math.sign(error) *
        tuning.maxAngularSpeed *
        Math.min(1, Math.abs(error) / tuning.slowRadius);
  const requestedAcceleration = (desiredVelocity - state.angularVelocity) / tuning.responseTime;
  const acceleration = limit(requestedAcceleration, tuning.maxAngularAcceleration);
  const angularVelocity = limit(
    state.angularVelocity + acceleration * tuning.timeStep,
    tuning.maxAngularSpeed,
  );
  return {
    rawError,
    error,
    desiredVelocity,
    requestedAcceleration,
    acceleration,
    settled,
    next: {
      heading: state.heading + angularVelocity * tuning.timeStep,
      angularVelocity,
    },
  };
}

export function alignFrames(
  example: AlignParameters,
  slowRadius = example.slowRadius,
): readonly AngularState[] {
  const tuning = { ...example, slowRadius };
  const states: AngularState[] = [
    { heading: example.initialHeading, angularVelocity: example.initialAngularSpeed },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateAlignStep(states[step], example.targetHeading, tuning).next);
  return states;
}

function workedStep(
  state: AngularState,
  step: number,
  calculation: AlignStep,
  example: AlignParameters,
): StudyWorkedStep {
  const seconds = step * example.timeStep;
  if (calculation.settled)
    return {
      title: `Settling check at ${fixed(seconds)} s`,
      lines: [
        `Wrapped error ${fixed(calculation.error)}° is within ±${fixed(example.angleTolerance)}°; angular speed ${fixed(state.angularVelocity)}°/s is within ±${fixed(example.speedTolerance)}°/s.`,
        `Apply the small final correction: ${fixed(state.heading)} + (${fixed(calculation.error)}) → ${fixed(calculation.next.heading)}°, equivalent to the commanded ${fixed(example.targetHeading)}°. Set angular velocity to zero.`,
      ],
      note: 'This explicit settling rule is a small snap after both tolerances pass, outside the normal acceleration update.',
    };
  return {
    title: `Worked turn: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
    lines: [
      `Subtract headings: ${fixed(example.targetHeading)} − ${fixed(state.heading)} = ${fixed(calculation.rawError)}°. Wrap to the shortest signed error: ${fixed(calculation.error)}°.`,
      `The stop test fails: |error| = ${fixed(Math.abs(calculation.error))}°, |angular velocity| = ${fixed(Math.abs(state.angularVelocity))}°/s. Both must pass their tolerances.`,
      Math.abs(calculation.error) <= example.angleTolerance
        ? `Inside the ${fixed(example.angleTolerance)}° tolerance, request zero angular velocity and brake the remaining rotation.`
        : `Desired angular velocity = sign(${fixed(calculation.error)}) × ${fixed(example.maxAngularSpeed)} × min(1, ${fixed(Math.abs(calculation.error))} / ${fixed(example.slowRadius)}) = ${fixed(calculation.desiredVelocity)}°/s.`,
      `Requested acceleration = (${fixed(calculation.desiredVelocity)} − ${fixed(state.angularVelocity)}) / ${fixed(example.responseTime)} = ${fixed(calculation.requestedAcceleration)}°/s²; cap at ±${fixed(example.maxAngularAcceleration)} to use ${fixed(calculation.acceleration)}°/s².`,
      `Angular velocity = ${fixed(state.angularVelocity)} + (${fixed(calculation.acceleration)} × ${fixed(example.timeStep)}) → ${fixed(calculation.next.angularVelocity)}°/s, capped at ±${fixed(example.maxAngularSpeed)}°/s.`,
      `Heading = ${fixed(state.heading)} + (${fixed(calculation.next.angularVelocity)} × ${fixed(example.timeStep)}) = ${fixed(calculation.next.heading)}°; the pedestal stays at (${fixed(example.cameraX)}, ${fixed(example.cameraY)}).`,
    ],
    note:
      calculation.acceleration * state.angularVelocity < 0
        ? 'The camera is still turning towards the command, but acceleration now opposes its angular velocity: this is braking.'
        : 'The requested angular velocity is a goal; the motor changes its actual angular velocity through bounded acceleration.',
  };
}

function phaseOf(
  state: AngularState,
  step: number,
  calculation: AlignStep,
  example: AlignParameters,
): string {
  if (calculation.settled)
    return state.angularVelocity === 0 && calculation.error === 0
      ? 'The camera holds the command because it has finished turning.'
      : 'The camera is close and slow enough to finish the turn with a small correction.';
  if (step === 0)
    return 'The command lies just across the angle boundary, so the camera starts the short turn.';
  if (Math.abs(calculation.error) <= example.angleTolerance)
    return 'The camera is near the command but still turning, so it must brake before settling.';
  if (calculation.error * state.angularVelocity < 0)
    return 'The camera has passed the command and must brake before turning back.';
  if (calculation.error * wrapDegrees(example.targetHeading - example.initialHeading) < 0)
    return 'The camera turns back towards the command to correct its overshoot.';
  if (calculation.acceleration * state.angularVelocity < 0)
    return 'The camera brakes as the gap closes because it cannot shed its turning speed instantly.';
  return calculation.acceleration * state.angularVelocity > 0 || state.angularVelocity === 0
    ? 'The camera builds turning speed because the command is still ahead of its facing.'
    : 'The camera keeps turning while its actual and requested turning speeds nearly match.';
}

function frameOf(
  state: AngularState,
  step: number,
  example: AlignParameters,
  parameterValues: Readonly<Record<string, string>>,
): StudyFrame {
  const calculation = calculateAlignStep(state, example.targetHeading, example);
  const commandLength = example.directionLength * 1.5;
  const command = {
    x: cosine(radians(example.targetHeading)) * commandLength,
    y: sine(radians(example.targetHeading)) * commandLength,
  };
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'dock-camera',
        label: 'Camera',
        x: example.cameraX,
        y: example.cameraY,
        heading: radians(state.heading),
      },
    ],
    marks: [
      {
        x: example.cameraX + command.x,
        y: example.cameraY + command.y,
        shape: 'ring',
        tone: 'desired',
        label: 'Command',
      },
    ],
    vectors: [
      {
        // Keep the facing arrow outside the name above the camera.
        x: example.cameraX + (cosine(radians(state.heading)) * example.directionLength) / 2,
        y: example.cameraY + (sine(radians(state.heading)) * example.directionLength) / 2,
        dx: (cosine(radians(state.heading)) * example.directionLength) / 2,
        dy: (sine(radians(state.heading)) * example.directionLength) / 2,
        tone: 'actual',
      },
      {
        x: example.cameraX,
        y: example.cameraY,
        dx: command.x,
        dy: command.y,
        tone: 'desired',
      },
    ],
    values: {
      ...parameterValues,
      seconds: fixed(step * example.timeStep),
      heading: fixed(wrapDegrees(state.heading)),
      continuousHeading: fixed(state.heading),
      rawError: fixed(calculation.rawError),
      error: fixed(calculation.error),
      alignmentText:
        calculation.error === 0
          ? 'Camera and Command point the same way'
          : `Command lies ${fixed(Math.abs(calculation.error))}° ${calculation.error > 0 ? 'clockwise' : 'anticlockwise'} from Camera`,
      angularSpeed: fixed(state.angularVelocity),
      desiredAngularSpeed: fixed(calculation.desiredVelocity),
      acceleration: fixed(calculation.acceleration),
      nextAngularSpeed: fixed(calculation.next.angularVelocity),
      nextHeading: fixed(calculation.next.heading),
    },
    note: phaseOf(state, step, calculation, example),
    worked: workedStep(state, step, calculation, example),
  };
}

interface AlignmentSummary {
  readonly overshoot: number;
  readonly peakStep: number;
  readonly finalError: number;
  readonly finalAngularVelocity: number;
  readonly resting: boolean;
}

function summarise(states: readonly AngularState[], example: AlignParameters): AlignmentSummary {
  const turn = wrapDegrees(example.targetHeading - example.initialHeading);
  const direction = Math.sign(turn) || 1;
  const command = example.initialHeading + turn;
  const peakStep = states.reduce(
    (best, state, step) =>
      direction * state.heading >= direction * states[best].heading ? step : best,
    0,
  );
  const last = states[states.length - 1];
  const finalError = wrapDegrees(example.targetHeading - last.heading);
  return {
    overshoot: Math.max(0, direction * (states[peakStep].heading - command)),
    peakStep,
    finalError,
    finalAngularVelocity: last.angularVelocity,
    resting: finalError === 0 && last.angularVelocity === 0,
  };
}

function lateBraking(
  example: AlignParameters,
  current: readonly AngularState[],
): NonNullable<StudyModel['comparison']> {
  const late = alignFrames(example, example.lateSlowRadius);
  const normal = summarise(current, example);
  const comparison = summarise(late, example);
  const errorOf = (state: AngularState) => wrapDegrees(example.targetHeading - state.heading);
  const seconds = current.map((_state, step) => step * example.timeStep);
  return {
    title: 'Compare slowing angles on the same camera',
    intro:
      example.slowRadius === example.lateSlowRadius
        ? `Both runs use a ${fixed(example.slowRadius)}° slowing angle, so their lines coincide; increase the live slowing angle to separate the runs.`
        : `Change only the slowing angle from ${fixed(example.slowRadius)}° to ${fixed(example.lateSlowRadius)}°; the command, starting state, response time and motor limits are identical.`,
    timeline: {
      title: 'Signed heading error',
      xLabel: 'Time · seconds',
      yLabel: 'Signed heading error · degrees',
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: `Solid green · current slowing angle ${fixed(example.slowRadius)}°`,
          tone: 'actual',
          values: current.map(errorOf),
        },
        {
          id: 'late',
          label: `Dashed amber · slowing angle ${fixed(example.lateSlowRadius)}°`,
          tone: 'desired',
          values: late.map(errorOf),
        },
      ],
      marks: [
        { x: seconds[comparison.peakStep], y: errorOf(late[comparison.peakStep]), tone: 'desired' },
      ],
    },
    findings: [
      comparison.overshoot > 0
        ? `The ${fixed(example.lateSlowRadius)}° run passes the command by ${fixed(comparison.overshoot)}° at ${fixed(seconds[comparison.peakStep])} s; the current run has a maximum overshoot of ${fixed(normal.overshoot)}°.`
        : `The ${fixed(example.lateSlowRadius)}° run approaches without passing the command; the current run has a maximum overshoot of ${fixed(normal.overshoot)}°.`,
      `At ${fixed(seconds[seconds.length - 1])} s, the current run ${normal.resting ? 'is at rest' : 'is still correcting'} with ${fixed(normal.finalError)}° of signed error and ${fixed(normal.finalAngularVelocity)}°/s angular velocity; the comparison run ${comparison.resting ? 'is at rest' : 'is still correcting'} with ${fixed(comparison.finalError)}° of signed error and ${fixed(comparison.finalAngularVelocity)}°/s angular velocity.`,
    ],
    note: 'The horizontal reference is exact alignment; crossing it while rotating is an overshoot, and bounded acceleration determines how quickly the camera can brake.',
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const states = alignFrames(example);
  const calculations = states.map((state) =>
    calculateAlignStep(state, example.targetHeading, example),
  );
  const last = states.length - 1;
  const braking = states.findIndex(
    (state, step) => calculations[step].acceleration * state.angularVelocity < 0,
  );
  const initialTurn = Math.floor((example.initialHeading + fullTurn / 2) / fullTurn);
  const boundary = states.findIndex(
    (state) => Math.floor((state.heading + fullTurn / 2) / fullTurn) !== initialTurn,
  );
  const inside = states.findIndex(
    (_state, step) => Math.abs(calculations[step].error) <= example.angleTolerance,
  );
  const stopped = states.findIndex(
    (state, step) => calculations[step].settled && state.angularVelocity === 0,
  );
  const summary = summarise(states, example);
  const duration = example.steps * example.timeStep;
  const parameterValues = {
    ...Object.fromEntries(
      Object.entries(parameters).map(([name, value]) => [
        name,
        typeof value === 'number' ? fixed(value) : value,
      ]),
    ),
    runOutcome: `The current run ${summary.overshoot > 0 ? `passes the command by ${fixed(summary.overshoot)}°` : 'approaches without passing the command'} and ${summary.resting ? 'is at rest by' : 'is still correcting at'} ${fixed(duration)} s`,
  };
  // Extra space around the fixed command keeps its name beyond every camera-facing ray.
  const extent = example.directionLength * 2;
  return {
    motion: {
      bounds: {
        minX: example.cameraX - extent,
        maxX: example.cameraX + extent,
        minY: example.cameraY - extent,
        maxY: example.cameraY + extent,
      },
      frames: states.map((state, step) => frameOf(state, step, example, parameterValues)),
    },
    timeline: {
      title: 'Angular velocity',
      xLabel: 'Time · seconds',
      yLabel: 'Angular velocity · degrees/s',
      seconds: states.map((_state, step) => step * example.timeStep),
      reference: 0,
      series: [
        {
          id: 'actual',
          label: 'Solid green · actual angular velocity',
          tone: 'actual',
          values: states.map(({ angularVelocity }) => angularVelocity),
        },
        {
          id: 'desired',
          label: 'Dashed amber · desired angular velocity',
          tone: 'desired',
          values: calculations.map(({ desiredVelocity }) => desiredVelocity),
        },
      ],
    },
    initialStep: boundary < 0 ? Math.max(0, braking) : boundary,
    moments: [
      { label: 'Start across the angle boundary', step: 0 },
      ...(braking < 0 ? [] : [{ label: 'Braking begins', step: braking }]),
      ...(boundary < 0 ? [] : [{ label: 'Heading crosses the boundary', step: boundary }]),
      ...(inside < 0 ? [] : [{ label: 'Inside the angle tolerance', step: inside }]),
      { label: stopped < 0 ? 'Still correcting' : 'At rest', step: stopped < 0 ? last : stopped },
    ],
    legend: [
      { tone: 'actual', label: 'Solid green · actual' },
      { tone: 'desired', label: 'Dashed amber · desired' },
    ],
    caption:
      'Camera turns on its pedestal towards Command; the rays show directions, and their lengths do not represent speed. The chart uses solid green for actual angular velocity and dashed amber for the request. Angles increase clockwise from right.',
    comparison: lateBraking(example, states),
    inputs: [
      { name: 'slowRadius', label: 'Slowing angle', unit: '°', min: 2, max: 90, step: 2 },
      {
        name: 'maxAngularAcceleration',
        label: 'Motor acceleration limit',
        unit: '°/s²',
        min: 30,
        max: 120,
        step: 10,
      },
    ],
  };
};
