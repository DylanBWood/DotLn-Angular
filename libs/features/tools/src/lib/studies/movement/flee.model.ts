import type { StudyParameters } from '@dotln-angular/models';
import { flee, type SteeringBody } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface FleeParameters {
  readonly start: number;
  readonly threat: number;
  readonly initialVelocity: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly engineRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly bodyRadius: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
  readonly arrowLane: number;
  readonly padding: number;
}

export interface FleeState {
  readonly position: number;
  readonly velocity: number;
}

export interface FleeStep {
  readonly offset: number;
  readonly distance: number;
  readonly direction: number;
  readonly fade: number;
  readonly acceleration: number;
  readonly trialVelocity: number;
  readonly next: FleeState;
}

const readParameters = (parameters: StudyParameters): FleeParameters => {
  const example: FleeParameters = {
    start: numberParameter(parameters, 'start'),
    threat: numberParameter(parameters, 'threat'),
    initialVelocity: numberParameter(parameters, 'initialVelocity'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    engineRadius: numberParameter(parameters, 'engineRadius'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    bodyRadius: numberParameter(parameters, 'bodyRadius'),
    velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
    accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
    arrowLane: numberParameter(parameters, 'arrowLane'),
    padding: numberParameter(parameters, 'padding'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.timeStep <= 0 ||
    example.bodyRadius <= 0 ||
    example.velocitySeconds <= 0 ||
    example.accelerationSecondsSquared <= 0 ||
    example.arrowLane <= 0 ||
    example.padding <= 0 ||
    Math.abs(example.initialVelocity) > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 4 ||
    example.steps > 239 ||
    example.engineRadius !== 20
  )
    throw new Error(
      'Flee needs finite values, positive limits, 4–239 steps and the engine radius of 20.',
    );
  return example;
};

/** The engine chooses the push; this study's motor advances Pip on an open line. */
export function calculateFleeStep(state: FleeState, example: FleeParameters): FleeStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.bodyRadius,
    wanderAngle: 0,
  };
  const offset = state.position - example.threat;
  const gap = Math.abs(offset);
  const acceleration = flee(body, { x: example.threat, y: 0 }).x;
  const trialVelocity = state.velocity + acceleration * example.timeStep;
  const velocity = Math.max(-example.maxSpeed, Math.min(example.maxSpeed, trialVelocity));
  return {
    offset,
    distance: gap,
    direction: Math.sign(offset),
    fade: Math.max(0, 1 - gap / example.engineRadius),
    acceleration,
    trialVelocity,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export function fleeFrames(example: FleeParameters): readonly FleeState[] {
  const states: FleeState[] = [{ position: example.start, velocity: example.initialVelocity }];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateFleeStep(states[step], example).next);
  return states;
}

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

function relationOf(state: FleeState, calculation: FleeStep): string {
  if (calculation.distance === 0)
    return state.velocity === 0
      ? 'Pip has no direction away and remains still'
      : 'Pip has no push at coincidence but its existing velocity carries it on';
  if (calculation.acceleration === 0)
    return state.velocity === 0
      ? 'the beacon is outside the active response and Pip remains still'
      : 'the push is zero while Pip keeps its existing velocity';
  if (state.velocity * calculation.offset < 0)
    return 'Pip is still travelling towards the beacon while the outward push brakes that approach';
  return state.velocity === 0
    ? 'the outward push begins to build Pip’s velocity'
    : 'Pip is travelling away while the outward push fades with distance';
}

function workedStep(
  state: FleeState,
  step: number,
  calculation: FleeStep,
  example: FleeParameters,
): StudyWorkedStep {
  return {
    title: `Pip's next update at ${fixed(step * example.timeStep)} s`,
    lines: [
      `Pip minus beacon: ${fixed(state.position)} − ${fixed(example.threat)} = ${fixed(calculation.offset)} units; distance = ${fixed(calculation.distance)} units.`,
      `Away direction = sign(${fixed(calculation.offset)}) = ${fixed(calculation.direction)}; fade = max(0, 1 − ${fixed(calculation.distance)} / ${fixed(example.engineRadius)}) = ${fixed(calculation.fade)}.`,
      `Engine flee returns ${fixed(calculation.direction)} × ${fixed(example.maxAcceleration)} × ${fixed(calculation.fade)} = ${fixed(calculation.acceleration)} units/s².`,
      `Trial velocity = ${fixed(state.velocity)} + ${fixed(calculation.acceleration)} × ${fixed(example.timeStep)} = ${fixed(calculation.trialVelocity)} units/s; cap at ±${fixed(example.maxSpeed)} gives ${fixed(calculation.next.velocity)} units/s.`,
      `New position = ${fixed(state.position)} + ${fixed(calculation.next.velocity)} × ${fixed(example.timeStep)} = ${fixed(calculation.next.position)} units.`,
    ],
    note:
      calculation.distance === 0
        ? 'Normalising a zero displacement gives the engine no escape direction. The model supplies no arbitrary fallback. Printed values are rounded.'
        : calculation.acceleration === 0
          ? 'Zero acceleration is not a stop instruction. This open-line motor retains the velocity already acquired. Printed values are rounded.'
          : 'The fading magnitude belongs to this repository’s engine. The motor applies it before moving; it supplies no braking at the response boundary. Printed values are rounded.',
  };
}

function frameOf(state: FleeState, step: number, example: FleeParameters): MotionFrame {
  const calculation = calculateFleeStep(state, example);
  const motionState = relationOf(state, calculation);
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'pip', x: state.position, y: 0, tone: 'subject' }],
    marks: [{ x: example.threat, y: 0, shape: 'cross', tone: 'target' }],
    zones: [{ x: example.threat, y: 0, radius: example.engineRadius, tone: 'zone' }],
    links: [
      {
        from: { x: state.position, y: 0 },
        to: { x: example.threat, y: 0 },
        tone: 'muted',
      },
    ],
    vectors: [
      {
        x: state.position,
        y: -example.arrowLane,
        dx: state.velocity * example.velocitySeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.position,
        y: example.arrowLane,
        dx: calculation.acceleration * example.accelerationSecondsSquared,
        dy: 0,
        tone: 'desired',
      },
    ],
    values: {
      seconds: fixed(step * example.timeStep),
      start: fixed(example.start),
      threat: fixed(example.threat),
      initialVelocity: fixed(example.initialVelocity),
      position: fixed(state.position),
      velocity: fixed(state.velocity),
      offset: fixed(calculation.offset),
      distance: fixed(calculation.distance),
      direction: fixed(calculation.direction),
      fade: fixed(calculation.fade),
      acceleration: fixed(calculation.acceleration),
      nextVelocity: fixed(calculation.next.velocity),
      nextPosition: fixed(calculation.next.position),
      maxSpeed: fixed(example.maxSpeed),
      maxAcceleration: fixed(example.maxAcceleration),
      engineRadius: fixed(example.engineRadius),
      timeStep: fixed(example.timeStep),
      duration: fixed(example.steps * example.timeStep),
      velocitySeconds: fixed(example.velocitySeconds),
      accelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
      motionState,
    },
    note: `${motionState.charAt(0).toUpperCase()}${motionState.slice(1)}.`,
    worked: workedStep(state, step, calculation, example),
  };
}

function coincidentComparison(
  states: readonly FleeState[],
  example: FleeParameters,
): NonNullable<MotionStudyModel['comparison']> {
  const changed = { ...example, start: example.threat };
  const coincident = fleeFrames(changed);
  const distances = (run: readonly FleeState[]) =>
    run.map(({ position }) => Math.abs(position - example.threat));
  const selectedGaps = distances(states);
  const coincidentGaps = distances(coincident);
  const same = example.start === example.threat;
  const atRest = example.initialVelocity === 0;
  return {
    title: 'What if Pip starts on the beacon?',
    intro: same
      ? `Both runs now start at the beacon's position, ${fixed(example.threat)}; move Starting position away from it to compare them.`
      : `Change only Pip's starting position from ${fixed(example.start)} to the beacon at ${fixed(example.threat)}. Keep the initial velocity ${fixed(example.initialVelocity)} units/s and the same motor.`,
    timeline: {
      title: 'Separation from the beacon',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [0, Math.max(example.engineRadius, ...selectedGaps, ...coincidentGaps)],
      reference: example.engineRadius,
      series: [
        { id: 'selected', label: 'Selected start', tone: 'actual', values: selectedGaps },
        { id: 'coincident', label: 'Start on the beacon', tone: 'desired', values: coincidentGaps },
      ],
    },
    findings: [
      atRest
        ? `At coincidence with no initial motion, every update returns zero acceleration and zero velocity: separation stays ${fixed(coincidentGaps[coincidentGaps.length - 1])} units for the whole ${fixed(example.steps * example.timeStep)} s run.`
        : `At coincidence, the first push is zero, but the existing ${fixed(example.initialVelocity)} units/s velocity carries Pip away; later updates then have a direction to use.`,
      same
        ? 'The two traces coincide because their initial states coincide.'
        : `The selected start ends ${fixed(selectedGaps[selectedGaps.length - 1])} units from the beacon; the coincident start ends ${fixed(coincidentGaps[coincidentGaps.length - 1])} units away. Flee needs a non-zero displacement or an external rule to choose an initial escape direction.`,
    ],
    note: 'This is an exact-coincidence failure, not a distance threshold for safety. The radius line marks where this engine ceases to push.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = fleeFrames(example);
  const frames = states.map((state, step) => frameOf(state, step, example));
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const outside = states.findIndex(
    ({ position }) => Math.abs(position - example.threat) >= example.engineRadius,
  );
  const telling = outside >= 0 ? outside : Math.floor(example.steps / 2);
  const gaps = states.map(({ position }) => Math.abs(position - example.threat));
  const extentY = Math.max(example.engineRadius, example.arrowLane) + example.padding;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.threat - example.engineRadius, ...ends) - example.padding,
        maxX: Math.max(example.threat + example.engineRadius, ...ends) + example.padding,
        minY: -extentY,
        maxY: extentY,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Pip’s distance from the beacon',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds: frames.map(({ seconds }) => seconds),
      yRange: [0, Math.max(example.engineRadius, ...gaps)],
      reference: example.engineRadius,
      series: [{ id: 'distance', label: 'Pip to beacon', tone: 'actual', values: gaps }],
    },
    initialStep: telling,
    moments: [
      { label: 'Read the displacement', step: 0 },
      { label: 'First motor update', step: 1 },
      { label: outside >= 0 ? 'Push has faded out' : 'Later response', step: telling },
      { label: 'End of the window', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Pip' },
      { tone: 'target', label: 'Beacon' },
      { tone: 'actual', label: 'Velocity' },
      { tone: 'desired', label: 'Outward acceleration' },
      { tone: 'zone', label: 'Engine response radius' },
    ],
    caption: `The dot is Pip and the cross is the beacon. The circle is the engine's fixed ${fixed(example.engineRadius)}-unit response radius. Green shows velocity × ${fixed(example.velocitySeconds)} s and amber acceleration × ${fixed(example.accelerationSecondsSquared)} s²; these arrows show different quantities.`,
    comparison: coincidentComparison(states, example),
    inputs: [
      { name: 'start', label: 'Starting position', unit: 'units', min: 0, max: 12, step: 1 },
      {
        name: 'maxAcceleration',
        label: 'Acceleration limit',
        unit: 'units/s²',
        min: 2,
        max: 12,
        step: 1,
      },
    ],
  };
};
