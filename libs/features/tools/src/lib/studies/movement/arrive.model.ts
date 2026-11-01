import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface ArriveParameters {
  readonly target: number;
  readonly slowRadius: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly tolerance: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly lateRadius: number;
}

export interface ArriveState {
  readonly position: number;
  readonly velocity: number;
}

export interface ArriveStep {
  readonly distance: number;
  readonly desired: number;
  readonly requestedAcceleration: number;
  readonly acceleration: number;
  readonly settled: boolean;
  readonly next: ArriveState;
}

const readParameters = (parameters: StudyParameters): ArriveParameters => ({
  target: numberParameter(parameters, 'target'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  responseTime: numberParameter(parameters, 'responseTime'),
  tolerance: numberParameter(parameters, 'tolerance'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  lateRadius: numberParameter(parameters, 'lateRadius'),
});

const limit = (value: number, magnitude: number) =>
  Math.max(-magnitude, Math.min(magnitude, value));

export const desiredVelocity = (
  position: number,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
) => {
  const offset = example.target - position;
  return Math.sign(offset) * example.maxSpeed * Math.min(1, Math.abs(offset) / slowRadius);
};

/** The displayed calculation and the motion use this same one-dimensional step. */
export function calculateArriveStep(
  state: ArriveState,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
): ArriveStep {
  const offset = example.target - state.position;
  const settled =
    Math.abs(offset) <= example.tolerance && Math.abs(state.velocity) <= example.tolerance;
  const desired = desiredVelocity(state.position, example, slowRadius);
  const requestedAcceleration = (desired - state.velocity) / example.responseTime;
  const acceleration = limit(requestedAcceleration, example.maxAcceleration);
  const velocity = limit(state.velocity + acceleration * example.timeStep, example.maxSpeed);
  return {
    distance: Math.abs(offset),
    desired,
    requestedAcceleration,
    acceleration,
    settled,
    next: settled
      ? { position: example.target, velocity: 0 }
      : { position: state.position + velocity * example.timeStep, velocity },
  };
}

export const stepArrive = (
  state: ArriveState,
  example: ArriveParameters,
  slowRadius = example.slowRadius,
) => calculateArriveStep(state, example, slowRadius).next;

export function arriveFrames(
  example: ArriveParameters,
  slowRadius = example.slowRadius,
): readonly ArriveState[] {
  const frames: ArriveState[] = [{ position: 0, velocity: 0 }];
  for (let step = 0; step < example.steps; step++)
    frames.push(stepArrive(frames[frames.length - 1], example, slowRadius));
  return frames;
}

// How long an arrow is for each unit per second, in the drawing's units.
const vectorScale = 1;
// The two arrows sit either side of the line the character moves on.
const actualLane = -8;
const desiredLane = 9;
const fixed = (value: number) => value.toFixed(2);
const brief = (value: number) => value.toFixed(1);

function phaseOf(state: ArriveState, step: number, example: ArriveParameters) {
  const distance = Math.abs(example.target - state.position);
  if (distance === 0 && state.velocity === 0)
    return 'Close enough and almost motionless: this example settles the character at its target. Distance alone would not be enough to call it stopped.';
  if (step === 0)
    return 'At the start, desired speed is high but actual speed is zero. Limited acceleration means the character must build up speed.';
  if (state.position > example.target)
    return 'The character has passed the target. The desired velocity now points back at it, and the limited acceleration has to turn the character around.';
  return distance < example.slowRadius
    ? 'Inside the slowing zone, the desired speed falls with distance. Actual speed follows it with a delay, so the character must brake.'
    : 'Outside the slowing zone, the character aims for its maximum speed. There is still plenty of distance left.';
}

function workedStep(state: ArriveState, step: number, example: ArriveParameters): StudyWorkedStep {
  const calculation = calculateArriveStep(state, example);
  const seconds = step * example.timeStep;
  const position = fixed(state.position);
  const velocity = fixed(state.velocity);
  const desired = fixed(calculation.desired);
  const distance = fixed(calculation.distance);
  if (calculation.settled)
    return {
      title: `At rest at ${fixed(seconds)} seconds`,
      lines: [],
      note: `Distance ${distance} is within the ${fixed(example.tolerance)}-unit tolerance, and speed ${velocity} is within the ${fixed(example.tolerance)}-units/s tolerance. Both conditions pass: snap to the target and set velocity to zero. Distance alone would not be enough.`,
    };
  const next = calculation.next;
  const acceleration = fixed(calculation.acceleration);
  const inside = calculation.distance < example.slowRadius;
  const heading = state.velocity * (example.target - state.position) >= 0 ? 'toward' : 'away from';
  const sign = calculation.acceleration < 0 ? 'Negative' : 'Positive';
  const motion =
    Math.abs(calculation.acceleration) < 0.005
      ? 'Acceleration rounds to zero at this precision. Actual and desired velocity are nearly equal, so the character is moving almost steadily.'
      : calculation.acceleration * state.velocity < 0
        ? `${sign} acceleration brakes the character, but it is still moving ${heading} the target. Wanting a slower speed does not make the current speed vanish.`
        : `${sign} acceleration builds speed ${heading} the target. It closes the gap to the desired velocity gradually; the character cannot jump instantly to the requested speed.`;
  return {
    title: `Worked step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} seconds`,
    lines: [
      `Begin at position ${position}, with velocity ${velocity} units/s and the target at ${fixed(example.target)}.`,
      `Find the remaining distance: |${fixed(example.target)} − ${position}| ≈ ${distance} units.`,
      inside
        ? `Inside the slowing radius, scale the desired speed with distance, signed toward the target: sign(${fixed(example.target)} − ${position}) × ${fixed(example.maxSpeed)} × (${distance} / ${fixed(example.slowRadius)}) ≈ ${desired} units/s.`
        : `Outside the ${fixed(example.slowRadius)}-unit slowing radius, ask for the maximum speed toward the target: ${desired} units/s.`,
      `Ask to close the velocity gap over ${fixed(example.responseTime)} s: (${desired} − ${velocity}) / ${fixed(example.responseTime)} ≈ ${fixed(calculation.requestedAcceleration)} units/s².`,
      `Limit acceleration to a magnitude of ${fixed(example.maxAcceleration)} units/s². The acceleration used is ${acceleration} units/s².`,
      `Update velocity over ${fixed(example.timeStep)} s, limited to ±${fixed(example.maxSpeed)} units/s: ${velocity} + (${acceleration} × ${fixed(example.timeStep)}) → ${fixed(next.velocity)} units/s.`,
      `Use that updated velocity to move: ${position} + (${fixed(next.velocity)} × ${fixed(example.timeStep)}) ≈ ${fixed(next.position)} units.`,
    ],
    note: motion,
  };
}

function frameOf(state: ArriveState, step: number, example: ArriveParameters): MotionFrame {
  const desired = desiredVelocity(state.position, example);
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'character', x: state.position, y: 0 }],
    vectors: [
      {
        x: state.position,
        y: actualLane,
        dx: state.velocity * vectorScale,
        dy: 0,
        tone: 'actual',
      },
      { x: state.position, y: desiredLane, dx: desired * vectorScale, dy: 0, tone: 'desired' },
    ],
    zones: [{ x: example.target, y: 0, radius: example.slowRadius }],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
    links: [{ from: { x: -10, y: 0 }, to: { x: example.target + 40, y: 0 } }],
    values: {
      distance: brief(Math.abs(example.target - state.position)),
      speed: brief(Math.abs(state.velocity)),
      desired: brief(Math.abs(desired)),
      slowRadius: String(example.slowRadius),
      maxAcceleration: String(example.maxAcceleration),
    },
    note: phaseOf(state, step, example),
    worked: workedStep(state, step, example),
  };
}

/** What one run does at its peak, in the words the comparison reads. */
function peakOf(frames: readonly ArriveState[], example: ArriveParameters) {
  const step = frames.reduce(
    (best, frame, index) => (frame.position > frames[best].position ? index : best),
    0,
  );
  const reached = frames[step].position;
  return { step, reached, overshoot: reached - example.target };
}

/** The motion rule and limits stay the example's; only the slowing radius changes. */
function lateBraking(example: ArriveParameters): NonNullable<MotionStudyModel['comparison']> {
  const normal = arriveFrames(example);
  const late = arriveFrames(example, example.lateRadius);
  const seconds = normal.map((_frame, step) => Number((step * example.timeStep).toFixed(1)));
  const [normalPeak, latePeak] = [peakOf(normal, example), peakOf(late, example)];
  const overshootOf = ({ step, reached, overshoot }: ReturnType<typeof peakOf>) =>
    overshoot > 0.005
      ? `reaches position ${reached.toFixed(2)} at about ${seconds[step].toFixed(1)} s, overshooting the target by ${overshoot.toFixed(2)} units before turning back`
      : 'approaches the target without passing it';
  const same = example.slowRadius === example.lateRadius;
  // The window stays on arrival, and widens only for a run that needs more room.
  const highest = Math.max(normalPeak.reached, latePeak.reached);
  const top = Math.max(110, Math.ceil((highest + 5) / 10) * 10);
  const lastPeak = Math.max(
    ...[normalPeak, latePeak]
      .filter(({ overshoot }) => overshoot > 0.005)
      .map(({ step }) => seconds[step]),
    0,
  );
  const end = Math.max(16, Math.min(seconds[seconds.length - 1], Math.ceil(lastPeak / 4 + 1) * 4));
  return {
    title: 'What happens when slowing starts too late?',
    intro: `These two runs of the example change only the slowing radius: ${example.slowRadius} units or ${example.lateRadius} units. Both start at rest, with the target at ${example.target}, maximum speed ${example.maxSpeed} units/s, acceleration limit ${example.maxAcceleration} units/s², response time ${example.responseTime} s and time step ${example.timeStep} s.`,
    timeline: {
      title: 'Position',
      xLabel: 'Time · seconds',
      yLabel: 'Position · units',
      seconds,
      xRange: [4, end],
      yRange: [50, top],
      xTicks: [4, 4 + (end - 4) / 3, 4 + ((end - 4) * 2) / 3, end].map(Math.round),
      yTicks: [top, 100, 75, 50],
      reference: example.target,
      series: [
        {
          id: 'normal',
          label: `Solid green · slowing radius ${example.slowRadius} units`,
          tone: 'actual',
          values: normal.map(({ position }) => position),
        },
        {
          id: 'late',
          label: `Dashed amber · slowing radius ${example.lateRadius} units`,
          tone: 'desired',
          values: late.map(({ position }) => position),
        },
      ],
      marks: [
        { x: seconds[normalPeak.step], y: normalPeak.reached, tone: 'actual' },
        { x: seconds[latePeak.step], y: latePeak.reached, tone: 'desired' },
      ],
    },
    findings: same
      ? [
          `Both runs now use the ${example.lateRadius}-unit radius, so they are the same run: the character ${overshootOf(latePeak)}. Move the slowing radius away from ${example.lateRadius} to compare them.`,
        ]
      : [
          `With the ${example.lateRadius}-unit radius, the character ${overshootOf(latePeak)}. With ${example.slowRadius} units, this run ${overshootOf(normalPeak)}.`,
          `The smaller zone asks for less speed later in the approach. The character still has momentum, and the ${example.maxAcceleration} units/s² acceleration limit prevents an instant stop.`,
        ],
    note: `The chart zooms in on arrival: 4–${end} seconds, positions 50–${top}. Lines join 0.1 s simulation steps; dots mark the maximum positions. Values are rounded.`,
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = arriveFrames(example);
  const seconds = states.map((_state, step) => Number((step * example.timeStep).toFixed(1)));
  // The drawing's box holds the slowing circle and the furthest the run goes, at any input.
  const furthest = Math.max(...states.map(({ position }) => position));
  const reach = Math.max(example.slowRadius, 36) + 4;
  const velocities = states.map(({ velocity }) => velocity);
  const desired = states.map(({ position }) => desiredVelocity(position, example));
  // A run that overshoots comes back with a negative velocity, which the chart must still show.
  const lowest = Math.floor(Math.min(0, ...velocities, ...desired));
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: -10,
        maxX: Math.max(150, example.target + reach + 10, furthest + 20),
        minY: -reach,
        maxY: reach,
      },
      frames: states.map((state, step) => frameOf(state, step, example)),
      trail: true,
    },
    timeline: {
      title: 'Velocity',
      xLabel: 'Time · seconds',
      yLabel: 'Velocity · units/s',
      seconds,
      yRange: [lowest, example.maxSpeed],
      xTicks: [0, example.steps * example.timeStep],
      yTicks: lowest < 0 ? [example.maxSpeed, 0, lowest] : [example.maxSpeed, 0],
      series: [
        {
          id: 'actual',
          label: 'Solid green · actual velocity',
          tone: 'actual',
          values: velocities,
        },
        {
          id: 'desired',
          label: 'Dashed amber · desired velocity',
          tone: 'desired',
          values: desired,
        },
      ],
    },
    initialStep: 75,
    moments: [
      { label: 'Start', step: 0 },
      { label: 'Cruise', step: 40 },
      { label: 'Slow down', step: 75 },
      { label: 'At rest', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Solid green · actual velocity' },
      { tone: 'desired', label: 'Dashed amber · desired velocity' },
    ],
    caption:
      'The dot is the character; the cross is its target. The circle marks where slowing begins. The two lines show velocity at the same scale. Scrub time to inspect the approach.',
    comparison: lateBraking(example),
    inputs: [
      {
        name: 'slowRadius',
        label: 'Slowing radius',
        unit: 'units',
        min: 4,
        max: 60,
        step: 2,
      },
      {
        name: 'maxAcceleration',
        label: 'Maximum acceleration',
        unit: 'units/s²',
        min: 4,
        max: 24,
        step: 1,
      },
    ],
  };
};
