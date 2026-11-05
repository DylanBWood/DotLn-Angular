import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface VariableMatchingParameters {
  readonly skiffStart: number;
  readonly initialVelocity: number;
  readonly pilotStart: number;
  readonly pilotVelocity: number;
  readonly correctionDirection: number;
  readonly responseTime: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly matchingTolerance: number;
  readonly bodyRadius: number;
  readonly arrowSeconds: number;
  readonly arrowLane: number;
  readonly padding: number;
}

export interface VariableMatchingState {
  readonly skiffPosition: number;
  readonly skiffVelocity: number;
  readonly pilotPosition: number;
}

export interface VariableMatchingStep {
  readonly velocityError: number;
  readonly correctionTarget: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly trialVelocity: number;
  readonly next: VariableMatchingState;
}

const readParameters = (parameters: StudyParameters): VariableMatchingParameters => {
  const example: VariableMatchingParameters = {
    skiffStart: numberParameter(parameters, 'skiffStart'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    pilotStart: numberParameter(parameters, 'pilotStart'),
    pilotVelocity: numberParameter(parameters, 'pilotVelocity'),
    correctionDirection: numberParameter(parameters, 'correctionDirection'),
    responseTime: numberParameter(parameters, 'responseTime'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    matchingTolerance: numberParameter(parameters, 'matchingTolerance'),
    bodyRadius: numberParameter(parameters, 'bodyRadius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
    arrowLane: numberParameter(parameters, 'arrowLane'),
    padding: numberParameter(parameters, 'padding'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    ![1, -1].includes(example.correctionDirection) ||
    example.responseTime <= 0 ||
    example.maxAcceleration <= 0 ||
    example.maxSpeed <= 0 ||
    example.timeStep <= 0 ||
    example.matchingTolerance <= 0 ||
    example.bodyRadius <= 0 ||
    example.arrowSeconds <= 0 ||
    example.arrowLane <= 0 ||
    example.padding <= 0 ||
    Math.abs(example.initialVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 4 ||
    example.steps > 239
  )
    throw new Error(
      'Variable matching needs finite values, positive limits, a direction of ±1 and 4–239 steps.',
    );
  return example;
};

/** Select a velocity error, then ask the engine to reduce it or its deliberately reversed form. */
export function calculateVariableMatchingStep(
  state: VariableMatchingState,
  example: VariableMatchingParameters,
): VariableMatchingStep {
  const velocityError = example.pilotVelocity - state.skiffVelocity;
  const correctionTarget = state.skiffVelocity + example.correctionDirection * velocityError;
  const body: SteeringBody = {
    position: { x: state.skiffPosition, y: 0 },
    velocity: { x: state.skiffVelocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.bodyRadius,
    wanderAngle: 0,
  };
  const acceleration = matchVelocity(body, { x: correctionTarget, y: 0 }, example.responseTime).x;
  const trialVelocity = state.skiffVelocity + acceleration * example.timeStep;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, trialVelocity));
  return {
    velocityError,
    correctionTarget,
    requestedAcceleration: (correctionTarget - state.skiffVelocity) / example.responseTime,
    acceleration,
    trialVelocity,
    next: {
      skiffVelocity: velocity,
      skiffPosition: state.skiffPosition + velocity * example.timeStep,
      pilotPosition: state.pilotPosition + example.pilotVelocity * example.timeStep,
    },
  };
}

export function variableMatchingFrames(
  example: VariableMatchingParameters,
): readonly VariableMatchingState[] {
  const states: VariableMatchingState[] = [
    {
      skiffPosition: example.skiffStart,
      skiffVelocity: example.initialVelocity,
      pilotPosition: example.pilotStart,
    },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateVariableMatchingStep(states[step], example).next);
  return states;
}

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

function workedStep(
  state: VariableMatchingState,
  step: number,
  calculation: VariableMatchingStep,
  example: VariableMatchingParameters,
): StudyWorkedStep {
  return {
    title: `Sora's next update at ${fixed(step * example.timeStep)} s`,
    lines: [
      `Select velocity: pilot − Sora = ${fixed(example.pilotVelocity)} − ${fixed(state.skiffVelocity)} = ${fixed(calculation.velocityError)} units/s.`,
      `Correction target = ${fixed(state.skiffVelocity)} + ${fixed(example.correctionDirection)} × ${fixed(calculation.velocityError)} = ${fixed(calculation.correctionTarget)} units/s.`,
      `Request (${fixed(calculation.correctionTarget)} − ${fixed(state.skiffVelocity)}) / ${fixed(example.responseTime)} = ${fixed(calculation.requestedAcceleration)} units/s²; engine matchVelocity caps this to ${fixed(calculation.acceleration)} units/s².`,
      `Trial velocity = ${fixed(state.skiffVelocity)} + ${fixed(calculation.acceleration)} × ${fixed(example.timeStep)} = ${fixed(calculation.trialVelocity)} units/s; the ±${fixed(example.maxSpeed)} limit gives ${fixed(calculation.next.skiffVelocity)} units/s.`,
      `Move Sora: ${fixed(state.skiffPosition)} + ${fixed(calculation.next.skiffVelocity)} × ${fixed(example.timeStep)} = ${fixed(calculation.next.skiffPosition)} units.`,
      `Move the pilot: ${fixed(state.pilotPosition)} + ${fixed(example.pilotVelocity)} × ${fixed(example.timeStep)} = ${fixed(calculation.next.pilotPosition)} units; position gap becomes ${fixed(calculation.next.pilotPosition - calculation.next.skiffPosition)} units.`,
    ],
    note:
      Math.abs(calculation.requestedAcceleration) > example.maxAcceleration ||
      Math.abs(calculation.trialVelocity) > example.maxSpeed
        ? 'A limit clips this update, so the simple error multiplier does not describe it. Printed values are rounded.'
        : `With neither limit clipping, the next velocity error equals this error × (1 − ${fixed(example.correctionDirection)} × ${fixed(example.timeStep)} / ${fixed(example.responseTime)}) = error × ${fixed(1 - (example.correctionDirection * example.timeStep) / example.responseTime)}. Printed values are rounded.`,
  };
}

function frameOf(
  state: VariableMatchingState,
  step: number,
  example: VariableMatchingParameters,
): MotionFrame {
  const calculation = calculateVariableMatchingStep(state, example);
  const positionGap = state.pilotPosition - state.skiffPosition;
  const errorMagnitude = Math.abs(calculation.velocityError);
  const nextErrorMagnitude = Math.abs(example.pilotVelocity - calculation.next.skiffVelocity);
  const note =
    errorMagnitude <= example.matchingTolerance
      ? 'The velocities nearly agree, but position is not the variable being matched: the gap remains.'
      : nextErrorMagnitude > errorMagnitude
        ? 'The reversed correction increases the velocity error while the pilot continues on its course.'
        : nextErrorMagnitude < errorMagnitude
          ? 'Sora closes the velocity error; any distance lost while accelerating remains uncorrected.'
          : 'The motor cannot change the velocity error at its current limit.';
  return {
    seconds: step * example.timeStep,
    bodies: [
      { id: 'sora', label: 'Sora', x: state.skiffPosition, y: 0, tone: 'subject' },
      { id: 'pilot', label: 'Pilot', x: state.pilotPosition, y: 0, tone: 'target' },
    ],
    vectors: [
      {
        x: state.skiffPosition,
        y: -example.arrowLane,
        dx: state.skiffVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.skiffPosition,
        y: example.arrowLane,
        dx: example.pilotVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    links: [
      {
        from: { x: state.skiffPosition, y: 0 },
        to: { x: state.pilotPosition, y: 0 },
        tone: 'muted',
      },
    ],
    values: {
      seconds: fixed(step * example.timeStep),
      skiffStart: fixed(example.skiffStart),
      initialVelocity: fixed(example.initialVelocity),
      pilotStart: fixed(example.pilotStart),
      pilotVelocity: fixed(example.pilotVelocity),
      skiffPosition: fixed(state.skiffPosition),
      skiffVelocity: fixed(state.skiffVelocity),
      pilotPosition: fixed(state.pilotPosition),
      positionGap: fixed(positionGap),
      velocityError: fixed(calculation.velocityError),
      correctionDirection: fixed(example.correctionDirection),
      comparisonDirection: fixed(-example.correctionDirection),
      correctionTarget: fixed(calculation.correctionTarget),
      requestedAcceleration: fixed(calculation.requestedAcceleration),
      acceleration: fixed(calculation.acceleration),
      nextVelocity: fixed(calculation.next.skiffVelocity),
      nextPosition: fixed(calculation.next.skiffPosition),
      responseTime: fixed(example.responseTime),
      maxAcceleration: fixed(example.maxAcceleration),
      maxSpeed: fixed(example.maxSpeed),
      timeStep: fixed(example.timeStep),
      errorMultiplier: fixed(
        1 - (example.correctionDirection * example.timeStep) / example.responseTime,
      ),
      arrowSeconds: fixed(example.arrowSeconds),
      matchingTolerance: fixed(example.matchingTolerance),
    },
    note,
    worked: workedStep(state, step, calculation, example),
  };
}

function reversedComparison(
  states: readonly VariableMatchingState[],
  example: VariableMatchingParameters,
): NonNullable<MotionStudyModel['comparison']> {
  const reversed = variableMatchingFrames({
    ...example,
    correctionDirection: -example.correctionDirection,
  });
  const errors = (run: readonly VariableMatchingState[]) =>
    run.map(({ skiffVelocity }) => example.pilotVelocity - skiffVelocity);
  const selectedErrors = errors(states);
  const reversedErrors = errors(reversed);
  const last = states[states.length - 1];
  const reversedLast = reversed[reversed.length - 1];
  return {
    title: 'Reverse the correction: what starts moving apart?',
    intro: `Change only correctionDirection from ${fixed(example.correctionDirection)} to ${fixed(-example.correctionDirection)}. Both runs read the same pilot velocity and retain the same response time, limits, starting positions and update interval.`,
    timeline: {
      title: 'The selected variable’s error',
      xLabel: 'Time · seconds',
      yLabel: 'Pilot velocity − Sora velocity · units/s',
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [
        Math.min(0, ...selectedErrors, ...reversedErrors),
        Math.max(example.matchingTolerance, ...selectedErrors, ...reversedErrors),
      ],
      reference: 0,
      series: [
        {
          id: 'selected',
          label: `Direction ${example.correctionDirection}`,
          tone: 'actual',
          values: selectedErrors,
        },
        {
          id: 'reversed',
          label: `Direction ${-example.correctionDirection}`,
          tone: 'desired',
          values: reversedErrors,
        },
      ],
    },
    findings: [
      `The selected direction ends with velocity error ${fixed(example.pilotVelocity - last.skiffVelocity)} units/s and position gap ${fixed(last.pilotPosition - last.skiffPosition)} units. The reversed direction ends with velocity error ${fixed(example.pilotVelocity - reversedLast.skiffVelocity)} units/s and position gap ${fixed(reversedLast.pilotPosition - reversedLast.skiffPosition)} units.`,
      'The reversal acts on velocity error. It does not select a position error or choose a route; the speed limit eventually prevents further divergence in velocity even though separation can keep growing.',
    ],
    note: 'Zero on this chart means equal velocities. It says nothing about the boats occupying the same position.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = variableMatchingFrames(example);
  const frames = states.map((state, step) => frameOf(state, step, example));
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const minX = Math.min(...ends) - example.padding;
  const maxX = Math.max(...ends) + example.padding;
  const height = Math.max((maxX - minX) / 2, 2 * (example.arrowLane + example.padding));
  const firstUnclipped = states.findIndex((state) => {
    const calculation = calculateVariableMatchingStep(state, example);
    return (
      Math.abs(calculation.requestedAcceleration) <= example.maxAcceleration &&
      Math.abs(calculation.trialVelocity) <= example.maxSpeed
    );
  });
  const nearlyMatched = states.findIndex(
    ({ skiffVelocity }) =>
      Math.abs(example.pilotVelocity - skiffVelocity) <= example.matchingTolerance,
  );
  const initialStep = firstUnclipped >= 0 ? firstUnclipped : Math.floor(example.steps / 2);
  const errors = states.map(({ skiffVelocity }) => example.pilotVelocity - skiffVelocity);
  return {
    family: 'motion',
    motion: {
      bounds: { minX, maxX, minY: -height / 2, maxY: height / 2 },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Velocity error, not position error',
      xLabel: 'Time · seconds',
      yLabel: 'Pilot velocity − Sora velocity · units/s',
      seconds: frames.map(({ seconds }) => seconds),
      yRange: [Math.min(0, ...errors), Math.max(example.matchingTolerance, ...errors)],
      reference: 0,
      series: [{ id: 'velocity-error', label: 'Velocity error', tone: 'actual', values: errors }],
    },
    initialStep,
    moments: [
      { label: 'Select velocity', step: 0 },
      { label: 'Unclipped correction', step: initialStep },
      {
        label: nearlyMatched >= 0 ? 'Nearly the same pace' : 'Error still present',
        step: nearlyMatched >= 0 ? nearlyMatched : Math.floor(example.steps / 2),
      },
      { label: 'Inspect the position gap', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Sora, the cargo skiff' },
      { tone: 'target', label: 'Pilot launch' },
      { tone: 'actual', label: 'Sora’s velocity' },
      { tone: 'desired', label: 'Pilot velocity, moved to Sora for comparison' },
      { tone: 'muted', label: 'Position gap, unused by this correction' },
    ],
    caption: `The boats travel on the same line. Green is Sora's velocity and amber the pilot's velocity translated to the same starting point; both arrows are scaled by ${fixed(example.arrowSeconds)} s. Their difference is the variable being corrected. The grey link shows the separate position gap.`,
    comparison: reversedComparison(states, example),
    inputs: [
      { name: 'responseTime', label: 'Response time', unit: 's', min: 0.5, max: 2, step: 0.25 },
      {
        name: 'maxAcceleration',
        label: 'Acceleration limit',
        unit: 'units/s²',
        min: 1,
        max: 6,
        step: 0.5,
      },
    ],
  };
};
