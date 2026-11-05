import type { StudyParameters } from '@dotln-angular/models';
import { matchVelocity, type SteeringBody, zero } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface MotorControlParameters {
  readonly initialSpeed: number;
  readonly steeringLimit: number;
  readonly motorBrake: number;
  readonly weakBrake: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly stopLine: number;
}

export interface MotorControlState {
  readonly position: number;
  readonly velocity: number;
}

export interface MotorControlStep {
  readonly rawRequest: number;
  readonly requested: number;
  readonly applied: number;
  readonly next: MotorControlState;
}

const readParameters = (parameters: StudyParameters): MotorControlParameters => ({
  initialSpeed: numberParameter(parameters, 'initialSpeed'),
  steeringLimit: numberParameter(parameters, 'steeringLimit'),
  motorBrake: numberParameter(parameters, 'motorBrake'),
  weakBrake: numberParameter(parameters, 'weakBrake'),
  responseTime: numberParameter(parameters, 'responseTime'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  stopLine: numberParameter(parameters, 'stopLine'),
});

const fixed = (value: number) => value.toFixed(2);

/** The engine requests a stop; the rail cart's local brake policy limits what reaches its body. */
export function motorControlStep(
  state: MotorControlState,
  example: MotorControlParameters,
  brake = example.motorBrake,
): MotorControlStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.initialSpeed,
    maxAcceleration: example.steeringLimit,
    radius: 0,
    wanderAngle: 0,
  };
  const requested = matchVelocity(body, zero, example.responseTime).x;
  const applied = Math.max(-brake, Math.min(0, requested));
  // A brake can stop this cart, but cannot propel it backwards.
  const velocity = Math.max(0, state.velocity + applied * example.timeStep);
  return {
    rawRequest: -state.velocity / example.responseTime,
    requested,
    applied,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export function motorControlFrames(
  example: MotorControlParameters,
  brake = example.motorBrake,
): readonly MotorControlState[] {
  const states: MotorControlState[] = [{ position: 0, velocity: example.initialSpeed }];
  for (let step = 0; step < example.steps; step++)
    states.push(motorControlStep(states[states.length - 1], example, brake).next);
  return states;
}

function frameOf(
  state: MotorControlState,
  step: number,
  example: MotorControlParameters,
  left: number,
  right: number,
): MotionFrame {
  const calculation = motorControlStep(state, example);
  const seconds = step * example.timeStep;
  const limited = Math.abs(calculation.requested) > example.motorBrake;
  return {
    seconds,
    bodies: [{ id: 'rail-cart', x: state.position, y: 0, heading: 0, label: 'Cart' }],
    vectors: [
      { x: state.position, y: -3, dx: calculation.requested, dy: 0, tone: 'desired' },
      { x: state.position, y: 3, dx: calculation.applied, dy: 0, tone: 'actual' },
    ],
    marks: [{ x: example.stopLine, y: 0, shape: 'cross', label: 'Safety line' }],
    links: [
      { from: { x: left, y: 0 }, to: { x: right, y: 0 } },
      {
        from: { x: example.stopLine, y: -5 },
        to: { x: example.stopLine, y: 5 },
        tone: 'target',
      },
    ],
    values: {
      position: fixed(state.position),
      speed: fixed(state.velocity),
      requested: fixed(calculation.requested),
      applied: fixed(calculation.applied),
      remaining: fixed(example.stopLine - state.position),
      elapsed: fixed(seconds),
      duration: fixed(example.steps * example.timeStep),
      initialSpeed: String(example.initialSpeed),
      steeringLimit: String(example.steeringLimit),
      motorBrake: String(example.motorBrake),
      weakBrake: String(example.weakBrake),
      responseTime: String(example.responseTime),
      timeStep: String(example.timeStep),
      stopLine: String(example.stopLine),
    },
    note:
      state.position > example.stopLine
        ? 'The cart has crossed the safety line. Obeying the brake limit does not guarantee enough stopping distance.'
        : limited
          ? 'The steering request exceeds the brake capacity. The motor applies its available braking and the cart keeps moving forwards.'
          : state.velocity > 0.01
            ? 'The requested braking now fits the motor. The velocity gap, rather than the brake capacity, sets the response.'
            : 'Speed is below the displayed precision. This run has no position snap: the brake continues to reduce the remaining velocity.',
    worked: {
      title: `Brake step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
      lines: [
        `Ask for zero velocity: (0.00 − ${fixed(state.velocity)}) / ${fixed(example.responseTime)} = ${fixed(calculation.rawRequest)} units/s².`,
        `The engine's matchVelocity clips that request to ±${fixed(example.steeringLimit)}: ${fixed(calculation.requested)} units/s².`,
        `The local motor applies max(−${fixed(example.motorBrake)}, min(0.00, ${fixed(calculation.requested)})) = ${fixed(calculation.applied)} units/s².`,
        `Brake without reversing: max(0.00, ${fixed(state.velocity)} + ${fixed(calculation.applied)} × ${fixed(example.timeStep)}) = ${fixed(calculation.next.velocity)} units/s.`,
        `Move with the updated velocity: ${fixed(state.position)} + ${fixed(calculation.next.velocity)} × ${fixed(example.timeStep)} = ${fixed(calculation.next.position)} units.`,
      ],
      note: 'Negative acceleration removes forward speed. The safety line is a distance marker, not a wall that changes the motion.',
    },
  };
}

const positionFinding = (
  states: readonly MotorControlState[],
  brake: number,
  example: MotorControlParameters,
) => {
  const last = states[states.length - 1];
  const clearance = example.stopLine - last.position;
  const crossing = states.findIndex(({ position }) => position > example.stopLine);
  return `With brake capacity ${fixed(brake)} units/s², the cart ends at ${fixed(last.position)} units, ${fixed(Math.abs(clearance))} units ${clearance >= 0 ? 'before' : 'beyond'} the safety line.${crossing < 0 ? ' It never crosses the line in this run.' : ` It first crosses at ${fixed(crossing * example.timeStep)} s.`}`;
};

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = motorControlFrames(example);
  const weak = motorControlFrames(example, example.weakBrake);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const calculations = states.map((state) => motorControlStep(state, example));
  const left =
    Math.min(0, ...states.map((state, step) => state.position + calculations[step].requested)) - 2;
  const right = Math.max(example.stopLine, ...states.map(({ position }) => position)) + 2;
  const feasible = calculations.findIndex(
    ({ requested }) => Math.abs(requested) <= example.motorBrake,
  );
  const transition = feasible < 0 ? example.steps : feasible;
  const highest = Math.max(
    example.stopLine,
    ...states.map(({ position }) => position),
    ...weak.map(({ position }) => position),
  );
  return {
    family: 'motion',
    motion: {
      bounds: { minX: left - 1, maxX: right + 1, minY: -8, maxY: 8 },
      frames: states.map((state, step) => frameOf(state, step, example, left, right)),
      trail: true,
    },
    timeline: {
      title: 'Steering request and motor response',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration · units/s²',
      seconds,
      yRange: [
        Math.min(-example.steeringLimit, ...calculations.map(({ requested }) => requested)),
        0,
      ],
      reference: 0,
      series: [
        {
          id: 'requested',
          label: 'Steering request',
          tone: 'desired',
          values: calculations.map(({ requested }) => requested),
        },
        {
          id: 'applied',
          label: 'Applied braking',
          tone: 'actual',
          values: calculations.map(({ applied }) => applied),
        },
      ],
    },
    initialStep: 0,
    moments: [
      { label: 'Brake command', step: 0 },
      { label: 'Braking under the cap', step: Math.floor(transition / 2) },
      { label: 'Request fits the motor', step: transition },
      { label: 'End of run', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Rail cart' },
      { tone: 'target', label: 'Safety line' },
      { tone: 'desired', label: 'Steering acceleration request' },
      { tone: 'actual', label: 'Acceleration the motor applies' },
    ],
    caption:
      'The cart moves along the rail towards the safety line. The upper amber arrow is the steering request; the lower green arrow is the motor response, at one drawing unit per unit/s². Both point backwards while the cart still travels forwards.',
    comparison: {
      title: 'A correct motor limit can still mean a missed stop',
      intro: `Change only brake capacity, from ${fixed(example.motorBrake)} to ${fixed(example.weakBrake)} units/s². Initial speed, steering rule, response time, time step and safety line stay the same.`,
      timeline: {
        title: 'Distance travelled while braking',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        yRange: [0, Math.ceil(highest) + 1],
        reference: example.stopLine,
        series: [
          {
            id: 'normal',
            label: `Brake capacity ${fixed(example.motorBrake)}`,
            tone: 'actual',
            values: states.map(({ position }) => position),
          },
          {
            id: 'weak',
            label: `Brake capacity ${fixed(example.weakBrake)}`,
            tone: 'desired',
            values: weak.map(({ position }) => position),
          },
        ],
      },
      findings: [
        positionFinding(states, example.motorBrake, example),
        positionFinding(weak, example.weakBrake, example),
        'The motor can limit a request to available braking. A planner still needs to allow the stopping distance produced by that limit.',
      ],
      note:
        example.motorBrake === example.weakBrake
          ? 'The capacities are equal, so these are the same run.'
          : 'The safety line has no collision response. A crossing remains visible instead of being hidden by a wall clamp.',
    },
    inputs: [
      {
        name: 'motorBrake',
        label: 'Motor brake capacity',
        unit: 'units/s²',
        min: 1,
        max: 6,
        step: 0.5,
      },
      { name: 'initialSpeed', label: 'Initial speed', unit: 'units/s', min: 2, max: 10, step: 1 },
    ],
  };
};
