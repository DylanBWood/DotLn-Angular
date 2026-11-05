import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  avoid,
  clipLength,
  distance,
  dot,
  length,
  normalize,
  scale,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';

export interface CollisionAvoidanceParameters {
  readonly courierStartX: number;
  readonly courierStartY: number;
  readonly courierVelocityX: number;
  readonly courierVelocityY: number;
  readonly porterStartX: number;
  readonly porterStartY: number;
  readonly porterVelocityX: number;
  readonly porterVelocityY: number;
  readonly courierRadius: number;
  readonly porterRadius: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly predictionHorizon: number;
  readonly comparisonPorterY: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface CollisionAgent {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface CollisionState {
  readonly courier: CollisionAgent;
  readonly porter: CollisionAgent;
}

export interface ClosestApproach {
  readonly relativePosition: Vec2;
  readonly relativeVelocity: Vec2;
  readonly relativeSpeedSquared: number;
  readonly time: number | null;
  readonly courierProjection: Vec2;
  readonly porterProjection: Vec2;
  readonly separation: number;
}

export interface CollisionAvoidanceStep {
  readonly prediction: ClosestApproach;
  readonly acceleration: Vec2;
  readonly next: CollisionState;
}

const readParameters = (parameters: StudyParameters): CollisionAvoidanceParameters => ({
  courierStartX: numberParameter(parameters, 'courierStartX'),
  courierStartY: numberParameter(parameters, 'courierStartY'),
  courierVelocityX: numberParameter(parameters, 'courierVelocityX'),
  courierVelocityY: numberParameter(parameters, 'courierVelocityY'),
  porterStartX: numberParameter(parameters, 'porterStartX'),
  porterStartY: numberParameter(parameters, 'porterStartY'),
  porterVelocityX: numberParameter(parameters, 'porterVelocityX'),
  porterVelocityY: numberParameter(parameters, 'porterVelocityY'),
  courierRadius: numberParameter(parameters, 'courierRadius'),
  porterRadius: numberParameter(parameters, 'porterRadius'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  predictionHorizon: numberParameter(parameters, 'predictionHorizon'),
  comparisonPorterY: numberParameter(parameters, 'comparisonPorterY'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const initialCollisionState = (
  example: CollisionAvoidanceParameters,
  porterY = example.porterStartY,
): CollisionState => ({
  courier: {
    position: { x: example.courierStartX, y: example.courierStartY },
    velocity: { x: example.courierVelocityX, y: example.courierVelocityY },
  },
  porter: {
    position: { x: example.porterStartX, y: porterY },
    velocity: { x: example.porterVelocityX, y: example.porterVelocityY },
  },
});

/** Constant-velocity projections explain the same dot-product test that engine avoid reads. */
export function closestApproach(state: CollisionState): ClosestApproach {
  const relativePosition = subtract(state.porter.position, state.courier.position);
  const relativeVelocity = subtract(state.porter.velocity, state.courier.velocity);
  const relativeSpeedSquared = dot(relativeVelocity, relativeVelocity);
  const time =
    relativeSpeedSquared === 0
      ? null
      : -dot(relativePosition, relativeVelocity) / relativeSpeedSquared;
  const courierProjection = add(state.courier.position, scale(state.courier.velocity, time ?? 0));
  const porterProjection = add(state.porter.position, scale(state.porter.velocity, time ?? 0));
  return {
    relativePosition,
    relativeVelocity,
    relativeSpeedSquared,
    time,
    courierProjection,
    porterProjection,
    separation: distance(courierProjection, porterProjection),
  };
}

const steeringBody = (
  agent: CollisionAgent,
  radius: number,
  example: CollisionAvoidanceParameters,
): SteeringBody => ({
  ...agent,
  heading: normalize(agent.velocity),
  radius,
  maxSpeed: example.maxSpeed,
  maxAcceleration: example.maxAcceleration,
  wanderAngle: 0,
});

/** Engine avoid chooses the acceleration; the study advances an open plane at fixed steps. */
export function calculateCollisionAvoidanceStep(
  state: CollisionState,
  example: CollisionAvoidanceParameters,
): CollisionAvoidanceStep {
  if (example.predictionHorizon !== 1.5)
    throw new Error('Engine avoid has a fixed prediction horizon of 1.5 seconds.');
  const courier = steeringBody(state.courier, example.courierRadius, example);
  const porter = steeringBody(state.porter, example.porterRadius, example);
  const acceleration = avoid(courier, 0, [courier, porter]);
  const velocity = clipLength(
    add(state.courier.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return {
    prediction: closestApproach(state),
    acceleration,
    next: {
      courier: {
        position: add(state.courier.position, scale(velocity, example.timeStep)),
        velocity,
      },
      porter: {
        position: add(state.porter.position, scale(state.porter.velocity, example.timeStep)),
        velocity: state.porter.velocity,
      },
    },
  };
}

export function collisionAvoidanceFrames(
  example: CollisionAvoidanceParameters,
  porterY = example.porterStartY,
): readonly CollisionState[] {
  const states: CollisionState[] = [initialCollisionState(example, porterY)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateCollisionAvoidanceStep(states[states.length - 1], example).next);
  return states;
}

/** Check the straight movement between samples as well as the displayed sample positions. */
export function minimumCollisionSeparation(states: readonly CollisionState[]): number {
  return Math.min(
    ...states.map((state, index) => {
      const start = subtract(state.porter.position, state.courier.position);
      if (index === states.length - 1) return length(start);
      const next = states[index + 1];
      const change = subtract(subtract(next.porter.position, next.courier.position), start);
      const square = dot(change, change);
      const fraction = square === 0 ? 0 : Math.max(0, Math.min(1, -dot(start, change) / square));
      return length(add(start, scale(change, fraction)));
    }),
  );
}

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function decision(
  state: CollisionState,
  step: CollisionAvoidanceStep,
  example: CollisionAvoidanceParameters,
) {
  const contact = example.courierRadius + example.porterRadius;
  if (distance(state.courier.position, state.porter.position) < contact)
    return 'The bodies overlap; the engine reacts to their current offset.';
  if (step.prediction.time === null)
    return 'Equal velocities give no unique closest-approach time; there is no predicted avoidance.';
  if (step.prediction.time <= 0)
    return 'Closest approach is now or in the past; there is no future threat to steer from.';
  if (step.prediction.time >= example.predictionHorizon)
    return 'Closest approach is outside the engine prediction window; avoidance is silent.';
  if (step.prediction.separation >= contact)
    return 'The constant-velocity projection clears the combined radii; avoidance is silent.';
  return length(step.acceleration) === 0
    ? 'Predicted centres coincide exactly; the engine has no away direction and returns zero.'
    : 'A future collision is predicted; the engine accelerates away from the projected relative offset.';
}

function workedStep(
  state: CollisionState,
  calculation: CollisionAvoidanceStep,
  seconds: number,
  example: CollisionAvoidanceParameters,
): StudyWorkedStep {
  const prediction = calculation.prediction;
  return {
    title: `Closest-approach calculation at ${fixed(seconds)} seconds`,
    lines: [
      `Relative position r = ${pair(state.porter.position)} − ${pair(state.courier.position)} = ${pair(prediction.relativePosition)}.`,
      `Relative velocity v = ${pair(state.porter.velocity)} − ${pair(state.courier.velocity)} = ${pair(prediction.relativeVelocity)}.`,
      prediction.time === null
        ? 'v · v = 0: no unique closest-approach time; the displayed projections stay at the current positions.'
        : `t = −(r · v) / (v · v) = −(${fixed(dot(prediction.relativePosition, prediction.relativeVelocity))}) / ${fixed(prediction.relativeSpeedSquared)} = ${fixed(prediction.time)} s.`,
      `Projected centres: ${pair(prediction.courierProjection)} and ${pair(prediction.porterProjection)}; gap ${fixed(prediction.separation)}, contact distance ${fixed(example.courierRadius + example.porterRadius)} units.`,
      `Engine avoid returns a = ${pair(calculation.acceleration)} units/s²; next courier velocity = clip(${pair(state.courier.velocity)} + a × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) = ${pair(calculation.next.courier.velocity)}.`,
      `Next courier position = ${pair(state.courier.position)} + ${pair(calculation.next.courier.velocity)} × ${fixed(example.timeStep)} = ${pair(calculation.next.courier.position)}.`,
    ],
    note: `${decision(state, calculation, example)} Predictions hold current velocities constant; printed operands are rounded.`,
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = collisionAvoidanceFrames(example);
  const comparison = collisionAvoidanceFrames(example, example.comparisonPorterY);
  const contact = example.courierRadius + example.porterRadius;
  const seconds = states.map((_state, index) => index * example.timeStep);
  const separations = states.map((state) =>
    distance(state.courier.position, state.porter.position),
  );
  const predictions = states.map(closestApproach);
  const frames: readonly MotionFrame[] = states.map((state, index) => {
    const calculation = calculateCollisionAvoidanceStep(state, example);
    const prediction = calculation.prediction;
    return {
      seconds: seconds[index],
      values: {
        ...Object.fromEntries(
          Object.entries(example).map(([name, value]) => [name, String(value)]),
        ),
        seconds: fixed(seconds[index]),
        courierPosition: pair(state.courier.position),
        courierVelocity: pair(state.courier.velocity),
        porterPosition: pair(state.porter.position),
        porterVelocity: pair(state.porter.velocity),
        currentSeparation: fixed(separations[index]),
        closestTime:
          prediction.time === null
            ? 'undefined at equal velocities'
            : `${fixed(prediction.time)} s (${prediction.time > 0 ? 'ahead' : prediction.time < 0 ? 'in the past' : 'now'})`,
        courierProjection: pair(prediction.courierProjection),
        porterProjection: pair(prediction.porterProjection),
        predictedSeparation: fixed(prediction.separation),
        contactDistance: fixed(contact),
        acceleration: pair(calculation.acceleration),
        decision: decision(state, calculation, example),
      },
      bodies: [
        { id: 'courier', ...state.courier.position, tone: 'subject', label: 'Courier' },
        { id: 'porter', ...state.porter.position, tone: 'other', label: 'Porter' },
      ],
      zones: [
        { ...state.courier.position, radius: example.courierRadius, tone: 'subject' },
        { ...state.porter.position, radius: example.porterRadius, tone: 'other' },
      ],
      marks: [
        { ...prediction.courierProjection, shape: 'cross', tone: 'desired' },
        { ...prediction.porterProjection, shape: 'cross', tone: 'desired' },
      ],
      links: [
        { from: state.courier.position, to: prediction.courierProjection, tone: 'muted' },
        { from: state.porter.position, to: prediction.porterProjection, tone: 'muted' },
        { from: prediction.courierProjection, to: prediction.porterProjection, tone: 'desired' },
      ],
      vectors: [
        {
          ...state.courier.position,
          dx: state.courier.velocity.x * example.velocitySeconds,
          dy: state.courier.velocity.y * example.velocitySeconds,
          tone: 'actual',
        },
        {
          ...state.porter.position,
          dx: state.porter.velocity.x * example.velocitySeconds,
          dy: state.porter.velocity.y * example.velocitySeconds,
          tone: 'other',
        },
        {
          ...state.courier.position,
          dx: calculation.acceleration.x * example.accelerationSecondsSquared,
          dy: calculation.acceleration.y * example.accelerationSecondsSquared,
          tone: 'desired',
        },
      ],
      note: decision(state, calculation, example),
      worked: workedStep(state, calculation, seconds[index], example),
    };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const padding = 3 * Math.max(example.courierRadius, example.porterRadius);
  const nearest = separations.indexOf(Math.min(...separations));
  const cleared = predictions.findIndex(
    (prediction) => prediction.separation >= contact && (prediction.time ?? 0) > 0,
  );
  const passed = predictions.findIndex(
    (prediction) => prediction.time !== null && prediction.time <= 0,
  );
  const mainMinimum = minimumCollisionSeparation(states);
  const otherMinimum = minimumCollisionSeparation(comparison);
  return {
    family: 'motion',
    initialStep: 0,
    motion: {
      bounds: {
        minX: Math.min(...points.map((point) => point.x)) - padding,
        maxX: Math.max(...points.map((point) => point.x)) + padding,
        minY: Math.min(...points.map((point) => point.y)) - padding,
        maxY: Math.max(...points.map((point) => point.y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Current and predicted separation',
      xLabel: 'Time (s)',
      yLabel: 'Centre separation (units)',
      seconds,
      reference: contact,
      series: [
        { id: 'current', label: 'Current gap', tone: 'actual', values: separations },
        {
          id: 'predicted',
          label: 'Closest-approach gap',
          tone: 'desired',
          values: predictions.map((prediction) => prediction.separation),
        },
      ],
    },
    moments: [
      { label: 'Predict the threat', step: 0 },
      { label: 'Projection clears', step: cleared < 0 ? nearest : cleared },
      { label: 'Nearest actual pass', step: nearest },
      { label: 'Closest approach is past', step: passed < 0 ? states.length - 1 : passed },
    ],
    legend: [
      { tone: 'subject', label: 'Courier and its radius' },
      { tone: 'other', label: 'Coasting porter and its radius' },
      { tone: 'actual', label: `Courier velocity × ${example.velocitySeconds} s` },
      {
        tone: 'desired',
        label: `Closest projections; acceleration × ${example.accelerationSecondsSquared} s²`,
      },
      { tone: 'muted', label: 'Constant-velocity projection links' },
    ],
    caption:
      'The circles show physical radii. Crosses and their connecting line show the closest pair of positions if both current velocities stayed constant, including a past closest approach once they have passed. Only the courier steers; the porter keeps its velocity. The horizontal chart line is the sum of their radii.',
    comparison: {
      title: 'Remove the lateral offset',
      intro: `Change only porterStartY from ${example.porterStartY} to ${example.comparisonPorterY}. An exact head-on projection can leave engine avoid with no direction to normalise.`,
      timeline: {
        title: 'Separation with and without the offset',
        xLabel: 'Time (s)',
        yLabel: 'Centre separation (units)',
        seconds,
        reference: contact,
        series: [
          {
            id: 'main',
            label: `Porter y = ${example.porterStartY}`,
            tone: 'actual',
            values: separations,
          },
          {
            id: 'head-on',
            label: `Porter y = ${example.comparisonPorterY}`,
            tone: 'other',
            values: comparison.map((state) =>
              distance(state.courier.position, state.porter.position),
            ),
          },
        ],
      },
      findings: [
        `The main run's minimum gap, including straight travel between samples, is ${fixed(mainMinimum)} units; contact begins below ${fixed(contact)}.`,
        `The changed run's minimum gap is ${fixed(otherMinimum)} units, so ${otherMinimum < contact ? 'the bodies overlap' : 'the bodies remain apart'} with these inputs.`,
        ...(example.porterStartY === example.comparisonPorterY
          ? ['Both offsets are equal, so these are the same run.']
          : []),
      ],
      note: 'This exposes the engine rule as it stands. A tie-breaking sideways direction or a braking policy would be an additional mechanism; no collision response hides the overlap here.',
    },
    inputs: [
      {
        name: 'porterStartY',
        label: 'Porter lateral offset',
        unit: 'units',
        min: 0,
        max: 4,
        step: 0.25,
      },
    ],
  };
};
