import type { StudyParameters } from '@dotln-angular/models';
import { add, scale, type Vec2, zero } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface OutputParameters {
  readonly initialX: number;
  readonly initialY: number;
  readonly initialVelocityX: number;
  readonly initialVelocityY: number;
  readonly initialHeading: number;
  readonly initialRotation: number;
  readonly linearAccelerationX: number;
  readonly linearAccelerationY: number;
  readonly angularAcceleration: number;
  readonly pulseSeconds: number;
  readonly comparisonLinearAccelerationY: number;
  readonly timeStep: number;
  readonly steps: number;
}

/** This study's output record; the scene engine exposes linear requests, not an angular one. */
export interface SteeringOutput {
  readonly linear: Vec2;
  readonly angular: number;
}

export interface OutputState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: number;
  readonly rotation: number;
}

export interface OutputStep {
  readonly seconds: number;
  readonly state: OutputState;
  readonly output: SteeringOutput;
  readonly next: OutputState;
}

const readParameters = (parameters: StudyParameters): OutputParameters => ({
  initialX: numberParameter(parameters, 'initialX'),
  initialY: numberParameter(parameters, 'initialY'),
  initialVelocityX: numberParameter(parameters, 'initialVelocityX'),
  initialVelocityY: numberParameter(parameters, 'initialVelocityY'),
  initialHeading: numberParameter(parameters, 'initialHeading'),
  initialRotation: numberParameter(parameters, 'initialRotation'),
  linearAccelerationX: numberParameter(parameters, 'linearAccelerationX'),
  linearAccelerationY: numberParameter(parameters, 'linearAccelerationY'),
  angularAcceleration: numberParameter(parameters, 'angularAcceleration'),
  pulseSeconds: numberParameter(parameters, 'pulseSeconds'),
  comparisonLinearAccelerationY: numberParameter(parameters, 'comparisonLinearAccelerationY'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

export function outputAt(
  seconds: number,
  example: OutputParameters,
  linearAccelerationY = example.linearAccelerationY,
): SteeringOutput {
  return seconds < example.pulseSeconds
    ? {
        linear: { x: example.linearAccelerationX, y: linearAccelerationY },
        angular: example.angularAcceleration,
      }
    : { linear: zero, angular: 0 };
}

/** A local consumer keeps acceleration, velocity and position as distinct quantities. */
export function applySteeringOutput(
  state: OutputState,
  output: SteeringOutput,
  timeStep: number,
): OutputState {
  const velocity = add(state.velocity, scale(output.linear, timeStep));
  const rotation = state.rotation + output.angular * timeStep;

  return {
    velocity,
    rotation,
    position: add(state.position, scale(velocity, timeStep)),
    heading: state.heading + rotation * timeStep,
  };
}

export function outputSteps(
  example: OutputParameters,
  linearAccelerationY = example.linearAccelerationY,
): readonly OutputStep[] {
  let state: OutputState = {
    position: { x: example.initialX, y: example.initialY },
    velocity: { x: example.initialVelocityX, y: example.initialVelocityY },
    heading: example.initialHeading,
    rotation: example.initialRotation,
  };
  const run: OutputStep[] = [];

  for (let index = 0; index <= example.steps; index++) {
    const seconds = index * example.timeStep;
    const output = outputAt(seconds, example, linearAccelerationY);
    const next = applySteeringOutput(state, output, example.timeStep);
    run.push({ seconds, state, output, next });
    state = next;
  }

  return run;
}

const fixed = (value: number) => value.toFixed(2);
const vector = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const run = outputSteps(example);
  const comparison = outputSteps(example, example.comparisonLinearAccelerationY);
  const seconds = run.map(({ seconds }) => seconds);
  const firstCoast = run.findIndex(({ seconds }) => seconds >= example.pulseSeconds);
  const cutoff = firstCoast < 0 ? example.steps : firstCoast;
  const final = run[example.steps].state;
  const comparisonFinal = comparison[example.steps].state;
  const coast = run[cutoff].state;
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  const frames: readonly MotionFrame[] = run.map((step, index) => {
    const { state, output, next } = step;
    const ghost = comparison[index].state;
    const velocityChange = scale(output.linear, example.timeStep);
    const pulsing = step.seconds < example.pulseSeconds;

    return {
      seconds: step.seconds,
      bodies: [
        { id: 'comparison', ...ghost.position, heading: ghost.heading, tone: 'other' },
        { id: 'nori', ...state.position, heading: state.heading, tone: 'subject' },
      ],
      vectors: [
        { ...state.position, dx: state.velocity.x, dy: state.velocity.y, tone: 'actual' },
        { ...state.position, dx: velocityChange.x, dy: velocityChange.y, tone: 'desired' },
      ],
      marks: [{ x: example.initialX, y: example.initialY, shape: 'cross', tone: 'muted' }],
      values: {
        ...inputValues,
        seconds: fixed(step.seconds),
        duration: fixed(example.steps * example.timeStep),
        position: vector(state.position),
        velocity: vector(state.velocity),
        heading: fixed(state.heading),
        rotation: fixed(state.rotation),
        linearOutput: vector(output.linear),
        angularOutput: fixed(output.angular),
        velocityChange: vector(velocityChange),
        comparisonPosition: vector(ghost.position),
        finalY: fixed(final.position.y),
        comparisonFinalY: fixed(comparisonFinal.position.y),
        coastSeconds: fixed(run[cutoff].seconds),
        coastVelocity: vector(coast.velocity),
        coastRotation: fixed(coast.rotation),
      },
      note: pulsing
        ? 'The pulse changes linear velocity and turning rate independently. Facing the tug does not rotate a linear request expressed in world coordinates.'
        : 'Both output channels are now zero. Nori keeps the velocity and turning rate it already had, so its position and facing keep changing.',
      worked: {
        title: `Nori at ${fixed(step.seconds)} s`,
        lines: [
          `Read position ${vector(state.position)}, velocity ${vector(state.velocity)} units/s, heading ${fixed(state.heading)} rad and turning rate ${fixed(state.rotation)} rad/s.`,
          `The ${pulsing ? 'active pulse' : 'ended pulse'} supplies linear acceleration ${vector(output.linear)} units/s² and angular acceleration ${fixed(output.angular)} rad/s².`,
          `New velocity = ${vector(state.velocity)} + ${vector(output.linear)} × ${fixed(example.timeStep)} = ${vector(next.velocity)} units/s.`,
          `New turning rate = ${fixed(state.rotation)} + ${fixed(output.angular)} × ${fixed(example.timeStep)} = ${fixed(next.rotation)} rad/s.`,
          `New position = ${vector(state.position)} + ${vector(next.velocity)} × ${fixed(example.timeStep)} = ${vector(next.position)} units.`,
          `New heading = ${fixed(state.heading)} + ${fixed(next.rotation)} × ${fixed(example.timeStep)} ≈ ${fixed(next.heading)} rad.`,
        ],
        note: 'Updated rates advance position and heading. This study-local consumer has no drag or speed cap, and its linear acceleration is in world coordinates. Values are rounded for display.',
      },
    };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
  ]);
  const padding = Math.max(
    1,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) / 8,
    (Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y))) / 8,
  );
  const same = example.linearAccelerationY === example.comparisonLinearAccelerationY;

  return {
    family: 'motion',
    motion: {
      frames,
      trail: true,
      bounds: {
        minX: Math.min(...points.map(({ x }) => x)) - padding,
        maxX: Math.max(...points.map(({ x }) => x)) + padding,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
    },
    timeline: {
      title: 'Turning rate before and after the pulse',
      xLabel: 'Time · seconds',
      yLabel: 'Angular velocity · rad/s',
      seconds,
      reference: 0,
      series: [
        {
          id: 'rotation',
          label: 'Turning rate',
          tone: 'actual',
          values: run.map(({ state }) => state.rotation),
        },
      ],
    },
    initialStep: cutoff,
    moments: [
      { label: 'Before the first update', step: 0 },
      { label: 'First rates applied', step: Math.min(1, example.steps) },
      { label: 'Pulse ends', step: cutoff },
      { label: 'Later drift', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Nori · chosen linear pulse and facing' },
      { tone: 'other', label: 'Comparison tug · changed world-y acceleration only' },
      { tone: 'actual', label: 'Green arrow · current velocity' },
      { tone: 'desired', label: 'Amber arrow · velocity change over this update' },
    ],
    caption:
      'Arrowheads show facing; trails show the paths. Green velocity and amber change in velocity use a shared numerical scale. The muted cross is the launch point. Positive angles turn towards positive world y. The comparison tug receives the same angular output, so both facings agree even when the paths separate.',
    comparison: {
      title: 'Turn the tug without its sideways thrust',
      intro: `Change only linearAccelerationY from ${fixed(example.linearAccelerationY)} to ${fixed(example.comparisonLinearAccelerationY)} units/s². The angular pulse, initial state and update interval stay the example’s.`,
      timeline: {
        title: 'World-y position',
        xLabel: 'Time · seconds',
        yLabel: 'Position · units',
        seconds,
        reference: example.initialY,
        series: [
          {
            id: 'chosen',
            label: `World-y acceleration ${fixed(example.linearAccelerationY)}`,
            tone: 'actual',
            values: run.map(({ state }) => state.position.y),
          },
          {
            id: 'comparison',
            label: `World-y acceleration ${fixed(example.comparisonLinearAccelerationY)}`,
            tone: 'other',
            values: comparison.map(({ state }) => state.position.y),
          },
        ],
      },
      findings: same
        ? [
            'Both world-y accelerations are equal, so the two paths and facings coincide. Increase the chosen acceleration to restore the comparison.',
          ]
        : [
            `At ${fixed(seconds[example.steps])} s, chosen y is ${fixed(final.position.y)} and comparison y is ${fixed(comparisonFinal.position.y)} units. The two headings and turning rates are identical throughout.`,
            'An angular request changes facing, not a linear velocity expressed in world coordinates. A craft that must follow its nose needs a movement rule coupling its thrust to that facing.',
          ],
      note: `At the first sample after the pulse, ${fixed(run[cutoff].seconds)} s, Nori’s output is zero but velocity remains ${vector(coast.velocity)} units/s and turning rate ${fixed(coast.rotation)} rad/s. The sampled integrator is a teaching consumer, not a model of a wheeled vehicle.`,
    },
    inputs: [
      {
        name: 'linearAccelerationY',
        label: 'World-y acceleration during pulse',
        unit: 'units/s²',
        min: 0,
        max: 3,
        step: 0.5,
      },
      {
        name: 'pulseSeconds',
        label: 'Pulse duration',
        unit: 'seconds',
        min: 0.5,
        max: 2,
        step: 0.25,
      },
    ],
  };
};
