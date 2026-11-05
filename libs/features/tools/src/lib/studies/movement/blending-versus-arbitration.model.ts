import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  blend,
  clipLength,
  firstActive,
  length,
  scale,
  seek,
  type SteeringBody,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel } from '../study-model';

export interface CombinationParameters {
  readonly startX: number;
  readonly marshalX: number;
  readonly targetX: number;
  readonly maxAcceleration: number;
  readonly maxSpeed: number;
  readonly marshalWeight: number;
  readonly goalWeight: number;
  readonly holdSeconds: number;
  readonly fadeSeconds: number;
  readonly epsilon: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly heavierWeight: number;
}

export interface CombinationState {
  readonly position: number;
  readonly velocity: number;
}

export interface CombinedRequests {
  readonly blended: Vec2;
  readonly arbitrated: Vec2;
  readonly marshalGroup: Vec2;
  readonly goalGroup: Vec2;
  readonly winner: 'marshal' | 'destination' | 'none';
}

export interface CombinationStep extends CombinedRequests {
  readonly signal: number;
  readonly marshal: Vec2;
  readonly goal: Vec2;
  readonly acceleration: number;
  readonly next: CombinationState;
}

const readParameters = (parameters: StudyParameters): CombinationParameters => ({
  startX: numberParameter(parameters, 'startX'),
  marshalX: numberParameter(parameters, 'marshalX'),
  targetX: numberParameter(parameters, 'targetX'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  marshalWeight: numberParameter(parameters, 'marshalWeight'),
  goalWeight: numberParameter(parameters, 'goalWeight'),
  holdSeconds: numberParameter(parameters, 'holdSeconds'),
  fadeSeconds: numberParameter(parameters, 'fadeSeconds'),
  epsilon: numberParameter(parameters, 'epsilon'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  heavierWeight: numberParameter(parameters, 'heavierWeight'),
});

const fixed = (value: number) => (Math.abs(value) < 0.000005 ? '0.00' : value.toFixed(2));
const blendLane = -5;
const priorityLane = 5;

/** A scripted hand signal holds, then fades; it is an example input, not a sensor model. */
export const marshalSignal = (seconds: number, example: CombinationParameters) =>
  Math.max(0, Math.min(1, 1 - (seconds - example.holdSeconds) / example.fadeSeconds));

/** Both policies use the public engine. Priority groups are capped before firstActive selects. */
export function combineRequests(
  marshal: Vec2,
  goal: Vec2,
  example: CombinationParameters,
  marshalWeight = example.marshalWeight,
): CombinedRequests {
  const marshalTerm = { acceleration: marshal, weight: marshalWeight };
  const goalTerm = { acceleration: goal, weight: example.goalWeight };
  const marshalGroup = blend([marshalTerm], example.maxAcceleration);
  const goalGroup = blend([goalTerm], example.maxAcceleration);
  return {
    blended: blend([marshalTerm, goalTerm], example.maxAcceleration),
    arbitrated: firstActive([marshalGroup, goalGroup], example.epsilon),
    marshalGroup,
    goalGroup,
    winner:
      length(marshalGroup) > example.epsilon
        ? 'marshal'
        : length(goalGroup) > example.epsilon
          ? 'destination'
          : 'none',
  };
}

export function calculateCombinationStep(
  state: CombinationState,
  seconds: number,
  example: CombinationParameters,
  policy: 'blend' | 'priority',
  marshalWeight = example.marshalWeight,
): CombinationStep {
  const body: SteeringBody = {
    position: { x: state.position, y: 0 },
    velocity: { x: state.velocity, y: 0 },
    heading: { x: 1, y: 0 },
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: 0,
    wanderAngle: 0,
  };
  const signal = marshalSignal(seconds, example);
  const marshal = scale(seek(body, { x: example.marshalX, y: 0 }), signal);
  const goal = seek(body, { x: example.targetX, y: 0 });
  const combined = combineRequests(marshal, goal, example, marshalWeight);
  const acceleration = (policy === 'blend' ? combined.blended : combined.arbitrated).x;
  const velocity = clipLength(
    add(body.velocity, { x: acceleration * example.timeStep, y: 0 }),
    example.maxSpeed,
  ).x;
  return {
    ...combined,
    signal,
    marshal,
    goal,
    acceleration,
    next: { position: state.position + velocity * example.timeStep, velocity },
  };
}

export function combinationStates(
  example: CombinationParameters,
  policy: 'blend' | 'priority',
  marshalWeight = example.marshalWeight,
): readonly CombinationState[] {
  const states: CombinationState[] = [{ position: example.startX, velocity: 0 }];
  for (let step = 0; step < example.steps; step++)
    states.push(
      calculateCombinationStep(
        states[states.length - 1],
        step * example.timeStep,
        example,
        policy,
        marshalWeight,
      ).next,
    );
  return states;
}

function frameOf(
  blended: CombinationState,
  priority: CombinationState,
  step: number,
  example: CombinationParameters,
): MotionFrame {
  const seconds = step * example.timeStep;
  const a = calculateCombinationStep(blended, seconds, example, 'blend');
  const b = calculateCombinationStep(priority, seconds, example, 'priority');
  const parameterValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  return {
    seconds,
    bodies: [
      { id: 'blend', x: blended.position, y: blendLane, tone: 'actual', label: 'blend' },
      { id: 'priority', x: priority.position, y: priorityLane, tone: 'desired', label: 'priority' },
    ],
    marks: [blendLane, priorityLane].flatMap((y) => [
      { x: example.marshalX, y, shape: 'ring' as const, tone: 'other' as const, label: 'marshal' },
      {
        x: example.targetX,
        y,
        shape: 'cross' as const,
        tone: 'target' as const,
        label: 'delivery',
      },
    ]),
    links: [blendLane, priorityLane].map((y) => ({
      from: { x: example.marshalX, y },
      to: { x: example.targetX, y },
      tone: 'muted',
    })),
    vectors: [
      { x: blended.position, y: blendLane - 1.5, dx: a.goalGroup.x, dy: 0, tone: 'target' },
      { x: blended.position, y: blendLane + 1.5, dx: a.marshalGroup.x, dy: 0, tone: 'other' },
      { x: blended.position, y: blendLane, dx: a.blended.x, dy: 0, tone: 'actual' },
      { x: priority.position, y: priorityLane - 1.5, dx: b.goalGroup.x, dy: 0, tone: 'target' },
      { x: priority.position, y: priorityLane + 1.5, dx: b.marshalGroup.x, dy: 0, tone: 'other' },
      { x: priority.position, y: priorityLane, dx: b.arbitrated.x, dy: 0, tone: 'desired' },
    ],
    values: {
      ...parameterValues,
      elapsed: fixed(seconds),
      signal: fixed(a.signal),
      marshalRequest: fixed(a.marshal.x),
      goalRequest: fixed(a.goal.x),
      blendX: fixed(blended.position),
      blendSpeed: fixed(blended.velocity),
      priorityX: fixed(priority.position),
      prioritySpeed: fixed(priority.velocity),
      blendAcceleration: fixed(a.blended.x),
      priorityAcceleration: fixed(b.arbitrated.x),
      winner: b.winner,
    },
    note:
      a.signal === 1 && length(a.blended) <= example.epsilon
        ? 'Both destination and marshal request movement, yet their blend is silent. Priority keeps the marshal request because it is first and clears epsilon.'
        : b.winner === 'marshal'
          ? 'The fading marshal still wins priority. The blend can already point towards delivery because it combines magnitudes instead of enforcing precedence.'
          : 'The marshal no longer clears epsilon, so priority switches to delivery. Velocity changes gradually even when the selected acceleration changes abruptly.',
    worked: {
      title: `The two rules at ${fixed(seconds)} s`,
      lines: [
        `Signal = clamp(1 − (${fixed(seconds)} − ${fixed(example.holdSeconds)}) / ${fixed(example.fadeSeconds)}, 0, 1) = ${fixed(a.signal)}. Engine seek gives marshal ${fixed(a.marshal.x)} and delivery ${fixed(a.goal.x)} units/s².`,
        `Blend = clip(${fixed(example.marshalWeight)} × ${fixed(a.marshal.x)} + ${fixed(example.goalWeight)} × ${fixed(a.goal.x)}, ±${fixed(example.maxAcceleration)}) = ${fixed(a.blended.x)} units/s².`,
        `Priority tests the capped marshal group, |${fixed(b.marshalGroup.x)}| > ${fixed(example.epsilon)}, then the delivery group. Selected: ${b.winner}; acceleration ${fixed(b.arbitrated.x)} units/s².`,
        `Blend: v′ = clip(${fixed(blended.velocity)} + ${fixed(a.blended.x)} × ${fixed(example.timeStep)}, ±${fixed(example.maxSpeed)}) = ${fixed(a.next.velocity)}; x′ = ${fixed(blended.position)} + ${fixed(a.next.velocity)} × ${fixed(example.timeStep)} = ${fixed(a.next.position)}.`,
        `Priority: v′ = clip(${fixed(priority.velocity)} + ${fixed(b.arbitrated.x)} × ${fixed(example.timeStep)}, ±${fixed(example.maxSpeed)}) = ${fixed(b.next.velocity)}; x′ = ${fixed(priority.position)} + ${fixed(b.next.velocity)} × ${fixed(example.timeStep)} = ${fixed(b.next.position)}.`,
      ],
      note: 'The lanes are two runs of the same trolley and timed instructions. Neither policy checks an obstacle or decides whether the marshal instruction is sensible.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const blended = combinationStates(example, 'blend');
  const priority = combinationStates(example, 'priority');
  const heavier = combinationStates(example, 'blend', example.heavierWeight);
  const frames = blended.map((state, step) => frameOf(state, priority[step], step, example));
  const seconds = frames.map((frame) => frame.seconds);
  const blendAccelerations = blended.map(
    (state, step) => calculateCombinationStep(state, seconds[step], example, 'blend').acceleration,
  );
  const priorityAccelerations = priority.map(
    (state, step) =>
      calculateCombinationStep(state, seconds[step], example, 'priority').acceleration,
  );
  const heavierAccelerations = heavier.map(
    (state, step) =>
      calculateCombinationStep(state, seconds[step], example, 'blend', example.heavierWeight)
        .acceleration,
  );
  const release = Math.min(
    example.steps,
    Math.ceil((example.holdSeconds + example.fadeSeconds) / example.timeStep),
  );
  const disagree = heavierAccelerations.findIndex(
    (value, step) =>
      value > 0 &&
      calculateCombinationStep(
        priority[step],
        seconds[step],
        example,
        'priority',
        example.heavierWeight,
      ).arbitrated.x < 0,
  );
  const xPositions = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).map(({ x, dx }) => x + dx),
  ]);
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.marshalX, ...xPositions) - 3,
        maxX: Math.max(example.targetX, ...xPositions) + 3,
        minY: blendLane - 4,
        maxY: priorityLane + 4,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Which acceleration reaches the trolley?',
      xLabel: 'Time · seconds',
      yLabel: 'Acceleration · units/s²',
      seconds,
      reference: 0,
      yRange: [-example.maxAcceleration, example.maxAcceleration],
      series: [
        { id: 'blend', label: 'Weighted blend', tone: 'actual', values: blendAccelerations },
        {
          id: 'priority',
          label: 'Marshal-first arbitration',
          tone: 'desired',
          values: priorityAccelerations,
        },
      ],
    },
    initialStep: release,
    moments: [
      { label: 'Equal opposing requests', step: 0 },
      {
        label: 'Signal starts fading',
        step: Math.min(example.steps, Math.ceil(example.holdSeconds / example.timeStep)),
      },
      { label: 'Before release', step: Math.max(0, release - 1) },
      { label: 'Delivery takes priority', step: release },
      { label: 'Later motion', step: example.steps },
    ],
    legend: [
      { tone: 'target', label: 'Delivery request' },
      { tone: 'other', label: 'Marshal request after weighting and capping' },
      { tone: 'actual', label: 'Blended acceleration and trolley' },
      { tone: 'desired', label: 'Arbitrated acceleration and trolley' },
    ],
    caption:
      'Two lanes replay one trolley under the same timed instructions. Rings mark the marshal side and crosses the delivery side; the thin arrows show each weighted group and the central arrow is the acceleration actually used. The chart plots acceleration, so an abrupt winner change does not imply an instantaneous velocity change.',
    comparison: {
      title: 'Does a larger marshal weight replace precedence?',
      intro: `Change only marshalWeight from ${fixed(example.marshalWeight)} to ${fixed(example.heavierWeight)} in the blended run. The signal, engine seek requests, speed limit and time step stay the same.`,
      timeline: {
        title: 'Blended acceleration with a different weight',
        xLabel: 'Time · seconds',
        yLabel: 'Acceleration · units/s²',
        seconds,
        reference: 0,
        yRange: [-example.maxAcceleration, example.maxAcceleration],
        series: [
          {
            id: 'original',
            label: `Marshal weight ${fixed(example.marshalWeight)}`,
            tone: 'actual',
            values: blendAccelerations,
          },
          {
            id: 'heavier',
            label: `Marshal weight ${fixed(example.heavierWeight)}`,
            tone: 'desired',
            values: heavierAccelerations,
          },
        ],
      },
      findings: [
        `The starting blended acceleration changes from ${fixed(blendAccelerations[0])} to ${fixed(heavierAccelerations[0])} units/s². A weight changes the sum; it does not establish an order of authority.`,
        disagree < 0
          ? 'These inputs produce no sampled moment where the heavier blend points right while marshal-first priority points left. Inspect the weights and epsilon to see which policy difference remains.'
          : `At ${fixed(seconds[disagree])} s the heavier blend points right with ${fixed(heavierAccelerations[disagree])} units/s², although the weighted marshal group still clears epsilon and marshal-first priority points left.`,
      ],
    },
  };
};
