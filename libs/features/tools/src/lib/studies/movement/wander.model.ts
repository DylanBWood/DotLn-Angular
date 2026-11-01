import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  alongHeading,
  clipLength,
  cosine,
  length,
  normalize,
  scale,
  sine,
  type SteeringBody,
  subtract,
  type Vec2,
  wander,
} from '@dotln-angular/scene-engine';

import { numberParameter, textParameter } from '../parameters';
import type { StudyFrame, StudyModel, StudyWorkedStep } from '../study-model';

export interface WanderParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startHeading: number;
  readonly startSpeed: number;
  readonly initialAngle: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly responseTime: number;
  readonly wanderRadius: number;
  readonly narrowRadius: number;
  readonly wanderOffset: number;
  readonly turnScale: number;
  readonly walkingFraction: number;
  readonly drawPairs: string;
  readonly timeStep: number;
  readonly steps: number;
  readonly radius: number;
  readonly arrowSeconds: number;
}

export interface WanderState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly heading: Vec2;
  readonly wanderAngle: number;
}

interface DrawPair {
  readonly first: number;
  readonly second: number;
}

export interface WanderStep {
  readonly draw: DrawPair;
  readonly binomial: number;
  readonly angle: number;
  readonly centre: Vec2;
  readonly target: Vec2;
  readonly desired: Vec2;
  readonly requestedAcceleration: Vec2;
  readonly acceleration: Vec2;
  readonly desiredTurn: number;
  readonly actualTurn: number;
  readonly next: WanderState;
}

function drawTape(written: string): readonly DrawPair[] {
  return written.split(',').map((pair) => {
    const parts = pair.split(':');
    const values = parts.map(Number);
    if (
      parts.length !== 2 ||
      parts.some((part) => !part.trim()) ||
      values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
    )
      throw new Error('The wander tape needs pairs of uniform inputs between zero and one.');
    return { first: values[0], second: values[1] };
  });
}

const readParameters = (parameters: StudyParameters): WanderParameters => {
  const example: WanderParameters = {
    startX: numberParameter(parameters, 'startX'),
    startY: numberParameter(parameters, 'startY'),
    startHeading: numberParameter(parameters, 'startHeading'),
    startSpeed: numberParameter(parameters, 'startSpeed'),
    initialAngle: numberParameter(parameters, 'initialAngle'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    responseTime: numberParameter(parameters, 'responseTime'),
    wanderRadius: numberParameter(parameters, 'wanderRadius'),
    narrowRadius: numberParameter(parameters, 'narrowRadius'),
    wanderOffset: numberParameter(parameters, 'wanderOffset'),
    turnScale: numberParameter(parameters, 'turnScale'),
    walkingFraction: numberParameter(parameters, 'walkingFraction'),
    drawPairs: textParameter(parameters, 'drawPairs'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    radius: numberParameter(parameters, 'radius'),
    arrowSeconds: numberParameter(parameters, 'arrowSeconds'),
  };
  const numbers = Object.values(example).filter(
    (value): value is number => typeof value === 'number',
  );
  if (
    !numbers.every(Number.isFinite) ||
    example.maxSpeed <= 0 ||
    example.maxAcceleration <= 0 ||
    example.responseTime <= 0 ||
    example.timeStep <= 0 ||
    example.wanderRadius < 0 ||
    example.narrowRadius < 0 ||
    example.wanderOffset <= 0 ||
    example.radius <= 0 ||
    example.arrowSeconds <= 0 ||
    example.turnScale < 0 ||
    example.startSpeed < 0 ||
    example.startSpeed > example.maxSpeed ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error('Wander needs finite values, positive motion limits and 2–239 steps.');
  // This parameter records an engine constant, rather than introducing a second speed rule.
  if (example.walkingFraction !== 0.4)
    throw new Error('The scene engine fixes wander walkingFraction at 0.4.');
  drawTape(example.drawPairs);
  return example;
};

// The engine's angle update is internal to its full simulation; the study uses the same range.
const wrapAngle = (angle: number) =>
  angle - Math.floor((angle + Math.PI) / (2 * Math.PI)) * (2 * Math.PI);

const turnBetween = (before: Vec2, after: Vec2) =>
  Math.atan2(before.x * after.y - before.y * after.x, before.x * after.x + before.y * after.y);

export function initialWanderState(example: WanderParameters): WanderState {
  const heading = normalize({ x: cosine(example.startHeading), y: sine(example.startHeading) });
  return {
    position: { x: example.startX, y: example.startY },
    velocity: scale(heading, example.startSpeed),
    heading,
    wanderAngle: example.initialAngle,
  };
}

/** A fixed tape supplies the draws; the engine supplies the actual wander acceleration. */
export function calculateWanderStep(
  state: WanderState,
  step: number,
  example: WanderParameters,
  wanderRadius = example.wanderRadius,
): WanderStep {
  const tape = drawTape(example.drawPairs);
  const draw = tape[step % tape.length];
  const binomial = draw.first - draw.second;
  const angle = wrapAngle(state.wanderAngle + binomial * example.turnScale);
  const centre = add(state.position, scale(state.heading, example.wanderOffset));
  const onCircle = alongHeading({ x: cosine(angle), y: sine(angle) }, state.heading);
  const target = add(centre, scale(onCircle, wanderRadius));
  // Match the engine's relative-vector arithmetic, avoiding subtraction of large positions.
  const direction = normalize(
    add(scale(state.heading, example.wanderOffset), scale(onCircle, wanderRadius)),
  );
  const desired = scale(direction, example.maxSpeed * example.walkingFraction);
  const requestedAcceleration = scale(subtract(desired, state.velocity), 1 / example.responseTime);
  const body: SteeringBody = {
    ...state,
    wanderAngle: angle,
    maxSpeed: example.maxSpeed,
    maxAcceleration: example.maxAcceleration,
    radius: example.radius,
  };
  const acceleration = wander(body, {
    wanderRadius,
    wanderOffset: example.wanderOffset,
    timeToTarget: example.responseTime,
  });
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  const heading = length(velocity) === 0 ? state.heading : normalize(velocity);
  return {
    draw,
    binomial,
    angle,
    centre,
    target,
    desired,
    requestedAcceleration,
    acceleration,
    desiredTurn: turnBetween(state.heading, direction),
    actualTurn: turnBetween(state.heading, heading),
    next: {
      position: add(state.position, scale(velocity, example.timeStep)),
      velocity,
      heading,
      wanderAngle: angle,
    },
  };
}

export function wanderFrames(
  example: WanderParameters,
  wanderRadius = example.wanderRadius,
): readonly WanderState[] {
  const states: WanderState[] = [initialWanderState(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateWanderStep(states[step], step, example, wanderRadius).next);
  return states;
}

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
const point = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function workedStep(
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): StudyWorkedStep {
  return {
    title: `Nia's next update at ${fixed(step * example.timeStep)} s`,
    lines: [
      `Read the tape pair: ${fixed(calculation.draw.first)} − ${fixed(calculation.draw.second)} = ${fixed(calculation.binomial)}.`,
      `Carry the angle forward: wrap(${fixed(state.wanderAngle)} + ${fixed(calculation.binomial)} × ${fixed(example.turnScale)}) = ${fixed(calculation.angle)} rad.`,
      `Project the circle centre: ${point(state.position)} + ${fixed(example.wanderOffset)} × ${point(state.heading)} ≈ ${point(calculation.centre)}.`,
      `Rotate (cos(angle), sin(angle)) by the current heading, multiply by radius ${fixed(example.wanderRadius)}, then add the centre: target ≈ ${point(calculation.target)}.`,
      `The engine's walking speed is ${fixed(example.maxSpeed)} × ${fixed(example.walkingFraction)} = ${fixed(example.maxSpeed * example.walkingFraction)} units/s; point it towards the target: desired velocity ≈ ${point(calculation.desired)}.`,
      `Request (desired − actual) / responseTime: (${point(calculation.desired)} − ${point(state.velocity)}) / ${fixed(example.responseTime)} ≈ ${point(calculation.requestedAcceleration)} units/s².`,
      `The engine caps acceleration at ${fixed(example.maxAcceleration)} units/s²: use ${point(calculation.acceleration)}. New velocity = ${point(state.velocity)} + ${point(calculation.acceleration)} × ${fixed(example.timeStep)} ≈ ${point(calculation.next.velocity)}, limited to speed ${fixed(example.maxSpeed)}.`,
      `New position = ${point(state.position)} + ${point(calculation.next.velocity)} × ${fixed(example.timeStep)} ≈ ${point(calculation.next.position)}; face the new velocity.`,
    ],
    note: 'The circle and target describe this pending update. The target angle is relative to Nia’s current heading; returning that angle to zero means straight ahead now, not back towards her starting direction. Displayed values are rounded.',
  };
}

function frameNote(
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): string {
  if (step === 0)
    return 'Nia sets off towards the forward target, building speed before the patrol can bend.';
  if (example.turnScale === 0)
    return 'With no angular nudges, Nia keeps the target ahead and walks straight on.';
  if (Math.abs(calculation.desiredTurn) < 1e-8)
    return state.wanderAngle !== 0
      ? 'The target returns ahead, so Nia keeps the direction she has gained.'
      : 'Nia keeps her current heading because the target is straight ahead.';
  if (example.wanderRadius / example.wanderOffset < 0.15)
    return 'The target stays close to Nia’s heading, so the small circle produces only gentle turns.';
  if (calculation.binomial === 0)
    return 'With no new nudge, the remembered angle keeps pulling Nia into the turn.';
  return calculation.desiredTurn > 0
    ? 'The target lies to Nia’s right, so she turns gradually towards it.'
    : 'The target lies to Nia’s left, so she turns gradually towards it.';
}

function frameOf(
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): StudyFrame {
  const heading = Math.atan2(state.heading.y, state.heading.x);
  // Keep Nia at the origin and her forward direction to the right as the patrol moves.
  const intoView = (vector: Vec2) =>
    alongHeading(vector, { x: state.heading.x, y: -state.heading.y });
  const centre = { x: example.wanderOffset, y: 0 };
  const target = add(
    centre,
    scale({ x: cosine(calculation.angle), y: sine(calculation.angle) }, example.wanderRadius),
  );
  const actual = intoView(state.velocity);
  const desired = intoView(calculation.desired);
  const targetRelation =
    Math.abs(calculation.desiredTurn) < 0.005
      ? 'straight ahead'
      : calculation.desiredTurn > 0
        ? 'ahead and to the right'
        : 'ahead and to the left';
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'nia', label: 'Nia', x: 0, y: 0, heading: 0, tone: 'subject' }],
    zones: [{ ...centre, radius: example.wanderRadius, tone: 'zone' }],
    marks: [
      { ...centre, shape: 'dot', tone: 'muted' },
      { ...target, label: 'Target', shape: 'cross', tone: 'target' },
    ],
    links: [
      { from: { x: 0, y: 0 }, to: centre, tone: 'muted' },
      { from: centre, to: target, tone: 'target' },
    ],
    vectors: [
      {
        x: 0,
        y: 0,
        dx: actual.x * example.arrowSeconds,
        dy: actual.y * example.arrowSeconds,
        tone: 'actual',
      },
      {
        x: 0,
        y: 0,
        dx: desired.x * example.arrowSeconds,
        dy: desired.y * example.arrowSeconds,
        tone: 'desired',
      },
    ],
    values: {
      seconds: fixed(step * example.timeStep),
      x: fixed(state.position.x),
      y: fixed(state.position.y),
      heading: fixed(heading),
      headingX: fixed(state.heading.x),
      headingY: fixed(state.heading.y),
      velocityX: fixed(state.velocity.x),
      velocityY: fixed(state.velocity.y),
      speed: fixed(length(state.velocity)),
      firstDraw: fixed(calculation.draw.first),
      secondDraw: fixed(calculation.draw.second),
      binomial: fixed(calculation.binomial),
      oldAngle: fixed(state.wanderAngle),
      angle: fixed(calculation.angle),
      turnScale: fixed(example.turnScale),
      centreX: fixed(calculation.centre.x),
      centreY: fixed(calculation.centre.y),
      targetX: fixed(calculation.target.x),
      targetY: fixed(calculation.target.y),
      wanderRadius: fixed(example.wanderRadius),
      wanderOffset: fixed(example.wanderOffset),
      walkingFraction: fixed(example.walkingFraction),
      walkingSpeed: fixed(example.maxSpeed * example.walkingFraction),
      maxSpeed: fixed(example.maxSpeed),
      desiredX: fixed(calculation.desired.x),
      desiredY: fixed(calculation.desired.y),
      responseTime: fixed(example.responseTime),
      maxAcceleration: fixed(example.maxAcceleration),
      accelerationX: fixed(calculation.acceleration.x),
      accelerationY: fixed(calculation.acceleration.y),
      timeStep: fixed(example.timeStep),
      nextX: fixed(calculation.next.position.x),
      nextY: fixed(calculation.next.position.y),
      desiredTurn: fixed(calculation.desiredTurn),
      actualTurn: fixed(calculation.actualTurn),
      arrowSeconds: fixed(example.arrowSeconds),
      narrowRadius: fixed(example.narrowRadius),
      targetRelation,
      targetDistance: fixed(length(target)),
      desiredTurnMagnitude: fixed(Math.abs(calculation.desiredTurn)),
      actualTurnMagnitude: fixed(Math.abs(calculation.actualTurn)),
      velocityChange: fixed(length(subtract(calculation.desired, state.velocity))),
      requestedMagnitude: fixed(length(calculation.requestedAcceleration)),
      accelerationMagnitude: fixed(length(calculation.acceleration)),
      stepDistance: fixed(length(scale(calculation.next.velocity, example.timeStep))),
    },
    note: frameNote(state, step, calculation, example),
    worked: workedStep(state, step, calculation, example),
  };
}

function narrowCircleComparison(
  states: readonly WanderState[],
  example: WanderParameters,
): NonNullable<StudyModel['comparison']> {
  const narrow = wanderFrames(example, example.narrowRadius);
  const spread = (run: readonly WanderState[]) => {
    const ys = run.map(({ position }) => position.y);
    return Math.max(...ys) - Math.min(...ys);
  };
  return {
    title: 'How much sideways movement does the circle produce?',
    intro:
      example.wanderRadius === example.narrowRadius
        ? `Both traces now use radius ${fixed(example.wanderRadius)} units; increase the circle-radius control to compare the sideways motion with the same tape and timing.`
        : `Compare the chosen circle radius of ${fixed(example.wanderRadius)} units with a reference radius of ${fixed(example.narrowRadius)} units; only the radius changes. Nia keeps the same starting state, forward offset, draw tape, turn scale, response time and fixed update interval.`,
    timeline: {
      title: 'Sideways position in the gallery',
      xLabel: 'Time · seconds',
      yLabel: 'World y · units',
      seconds: states.map((_state, step) => step * example.timeStep),
      series: [
        {
          id: 'normal',
          label: `Solid green · chosen radius ${fixed(example.wanderRadius)}`,
          tone: 'actual',
          values: states.map(({ position }) => position.y),
        },
        {
          id: 'narrow',
          label: `Dashed amber · reference radius ${fixed(example.narrowRadius)}`,
          tone: 'desired',
          values: narrow.map(({ position }) => position.y),
        },
      ],
    },
    findings: [
      `Over ${fixed(example.steps * example.timeStep)} s, the sideways range is ${fixed(spread(states))} units with the chosen circle and ${fixed(spread(narrow))} units with the reference circle. The angle inputs are identical.`,
      'A small radius beside a long forward offset keeps the target direction close to straight ahead. Changing the target angle is therefore a poor measure of how much of the gallery Nia patrols.',
      'These are repeatable paths from a scripted tape, not a statistical coverage estimate. Neither radius promises that Nia will visit a particular place or avoid a wall; a zero turn scale keeps both paths straight.',
    ],
    note: 'The comparison uses world positions, with positive y towards the bottom of the gallery; the local drawing follows Nia and the main chart compares requested and actual turns.',
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const states = wanderFrames(example);
  const calculations = states.map((state, step) => calculateWanderStep(state, step, example));
  const frames = states.map((state, step) => frameOf(state, step, calculations[step], example));
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
  ]);
  const padding = example.radius * 1.5;
  const minX = Math.min(...points.map(({ x }) => x)) - padding;
  const maxX = Math.max(...points.map(({ x }) => x)) + padding;
  const lowY = Math.min(...points.map(({ y }) => y)) - padding;
  const highY = Math.max(...points.map(({ y }) => y)) + padding;
  const height = highY - lowY;
  const width = Math.max(maxX - minX, height * 1.5);
  const midX = (minX + maxX) / 2;
  const peak = calculations.reduce(
    (best, calculation, step) =>
      Math.abs(calculation.angle) > Math.abs(calculations[best].angle) ? step : best,
    0,
  );
  const negative = calculations.findIndex(({ angle }) => angle < 0);
  const returned = calculations.findIndex(({ angle }, step) => step > negative && angle === 0);
  return {
    motion: {
      bounds: { minX: midX - width / 2, maxX: midX + width / 2, minY: lowY, maxY: highY },
      frames,
      trail: false,
    },
    timeline: {
      title: 'Turn requested and turn made by each pending update',
      xLabel: 'Time · seconds',
      yLabel: 'Turn from current heading · radians',
      seconds: frames.map(({ seconds }) => seconds),
      reference: 0,
      series: [
        {
          id: 'actual-turn',
          label: 'Solid green · turn made by next velocity',
          tone: 'actual',
          values: calculations.map(({ actualTurn }) => actualTurn),
        },
        {
          id: 'desired-turn',
          label: 'Dashed amber · bearing of circle target',
          tone: 'desired',
          values: calculations.map(({ desiredTurn }) => desiredTurn),
        },
      ],
    },
    initialStep: peak,
    moments: [
      { label: 'Forward target', step: 0 },
      peak > 0
        ? { label: 'Target drifts aside', step: peak }
        : { label: 'Walking straight', step: Math.floor(example.steps / 4) },
      negative >= 0
        ? { label: 'Target crosses heading', step: negative }
        : { label: 'Same heading', step: Math.floor(example.steps / 2) },
      negative >= 0 && returned >= 0
        ? { label: 'Relative angle returns', step: returned }
        : { label: 'Still straight ahead', step: Math.floor((example.steps * 3) / 4) },
      { label: 'Patrol continues', step: example.steps },
    ],
    legend: [
      { tone: 'actual', label: 'Solid green · current velocity; actual turn in the chart' },
      { tone: 'desired', label: 'Dashed amber · desired velocity; target bearing in the chart' },
    ],
    caption: `The view moves and turns with Nia, keeping forward to the right and the whole circle in sight. The grey link is the forward offset and the spoke leads to Target. Both velocity arrows start at Nia and are scaled by ${fixed(example.arrowSeconds)} s; the chart shows how far her next velocity turns towards the target.`,
    comparison: narrowCircleComparison(states, example),
    inputs: [
      { name: 'wanderRadius', label: 'Circle radius', unit: 'units', min: 0.5, max: 5, step: 0.5 },
      {
        name: 'turnScale',
        label: 'Angle nudge scale',
        unit: 'rad/update',
        min: 0,
        max: 1.2,
        step: 0.1,
      },
    ],
  };
};
