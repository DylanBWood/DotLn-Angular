import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  clipLength,
  distance,
  dot,
  length,
  scale,
  seek,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { numberParameter } from '../parameters';
import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyWorkedStep,
} from '../study-model';

export interface PursueParameters {
  readonly startX: number;
  readonly startY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly targetVelocityX: number;
  readonly targetVelocityY: number;
  readonly turnedVelocityX: number;
  readonly turnedVelocityY: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly maxPrediction: number;
  readonly turnAt: number;
  readonly comparisonTurnAt: number;
  readonly tagRadius: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly velocitySeconds: number;
  readonly accelerationSecondsSquared: number;
}

export interface RunnerState {
  readonly position: Vec2;
  readonly velocity: Vec2;
}

export interface PursueStep {
  readonly distance: number;
  readonly speed: number;
  readonly prediction: number;
  readonly predicted: Vec2;
  readonly acceleration: Vec2;
  readonly trialVelocity: Vec2;
  readonly next: RunnerState;
}

export interface PursueFrame {
  readonly seconds: number;
  readonly ash: RunnerState;
  readonly reed: RunnerState;
  readonly calculation: PursueStep;
  readonly forecastError: number;
}

const readParameters = (parameters: StudyParameters): PursueParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  velocityX: numberParameter(parameters, 'velocityX'),
  velocityY: numberParameter(parameters, 'velocityY'),
  targetX: numberParameter(parameters, 'targetX'),
  targetY: numberParameter(parameters, 'targetY'),
  targetVelocityX: numberParameter(parameters, 'targetVelocityX'),
  targetVelocityY: numberParameter(parameters, 'targetVelocityY'),
  turnedVelocityX: numberParameter(parameters, 'turnedVelocityX'),
  turnedVelocityY: numberParameter(parameters, 'turnedVelocityY'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  maxPrediction: numberParameter(parameters, 'maxPrediction'),
  turnAt: numberParameter(parameters, 'turnAt'),
  comparisonTurnAt: numberParameter(parameters, 'comparisonTurnAt'),
  tagRadius: numberParameter(parameters, 'tagRadius'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  velocitySeconds: numberParameter(parameters, 'velocitySeconds'),
  accelerationSecondsSquared: numberParameter(parameters, 'accelerationSecondsSquared'),
});

export const predictionTime = (gap: number, speed: number, maximum: number): number =>
  speed === 0 ? maximum : Math.min(maximum, gap / speed);

/** Only current runner data enters the local predictor; the acceleration is engine seek. */
export function calculatePursueStep(
  ash: RunnerState,
  reed: RunnerState,
  example: PursueParameters,
): PursueStep {
  const gap = distance(ash.position, reed.position);
  const speed = length(ash.velocity);
  const prediction = predictionTime(gap, speed, example.maxPrediction);
  const predicted = add(reed.position, scale(reed.velocity, prediction));
  const acceleration = seek(
    {
      ...ash,
      maxSpeed: example.maxSpeed,
      maxAcceleration: example.maxAcceleration,
      // Seek reads neither facing nor the other behaviour-specific fields.
      heading: zero,
      radius: 0,
      wanderAngle: 0,
    },
    predicted,
  );
  const trialVelocity = add(ash.velocity, scale(acceleration, example.timeStep));
  const velocity = clipLength(trialVelocity, example.maxSpeed);
  return {
    distance: gap,
    speed,
    prediction,
    predicted,
    acceleration,
    trialVelocity,
    next: { position: add(ash.position, scale(velocity, example.timeStep)), velocity },
  };
}

/** The example's runner script, including exact positions between simulation samples. */
export function runnerAt(seconds: number, example: PursueParameters): RunnerState {
  const before = Math.min(seconds, example.turnAt);
  const after = Math.max(0, seconds - example.turnAt);
  const initialVelocity = { x: example.targetVelocityX, y: example.targetVelocityY };
  const turnedVelocity = { x: example.turnedVelocityX, y: example.turnedVelocityY };
  return {
    position: add(
      { x: example.targetX, y: example.targetY },
      add(scale(initialVelocity, before), scale(turnedVelocity, after)),
    ),
    velocity: seconds < example.turnAt ? initialVelocity : turnedVelocity,
  };
}

export function pursueFrames(example: PursueParameters): readonly PursueFrame[] {
  let ash: RunnerState = {
    position: { x: example.startX, y: example.startY },
    velocity: { x: example.velocityX, y: example.velocityY },
  };
  const frames: PursueFrame[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const seconds = step * example.timeStep;
    const reed = runnerAt(seconds, example);
    const calculation = calculatePursueStep(ash, reed, example);
    // Future script data is a diagnostic only; it never feeds the predictor or motion.
    const actualFuture = runnerAt(seconds + calculation.prediction, example).position;
    frames.push({
      seconds,
      ash,
      reed,
      calculation,
      forecastError: distance(calculation.predicted, actualFuture),
    });
    ash = calculation.next;
  }
  return frames;
}

const fixed = (value: number) => Number(value.toFixed(2)).toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function workedStep(frame: PursueFrame, example: PursueParameters): StudyWorkedStep {
  const { ash, reed, calculation, seconds } = frame;
  const { prediction, predicted, acceleration, next } = calculation;
  const offset = subtract(predicted, ash.position);
  return {
    title: `Worked step: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} seconds`,
    lines: [
      `Reed minus Ash: ${pair(reed.position)} − ${pair(ash.position)}; separation ${fixed(calculation.distance)} units, Ash's speed ${fixed(calculation.speed)} units/s.`,
      calculation.speed === 0
        ? `Ash is stationary: use the ${fixed(example.maxPrediction)} s cap without dividing by speed.`
        : `Lookahead = min(${fixed(example.maxPrediction)}, ${fixed(calculation.distance)} / ${fixed(calculation.speed)}) ≈ ${fixed(prediction)} s.`,
      `Predicted Reed: ${pair(reed.position)} + ${pair(reed.velocity)} × ${fixed(prediction)} ≈ ${pair(predicted)} units.`,
      length(offset) === 0
        ? 'The predicted point coincides with Ash, so engine seek gives zero acceleration without cancelling velocity.'
        : `Engine seek: ${pair(offset)} / ${fixed(length(offset))} × ${fixed(example.maxAcceleration)} ≈ ${pair(acceleration)} units/s².`,
      `Trial velocity: ${pair(ash.velocity)} + ${pair(acceleration)} × ${fixed(example.timeStep)} ≈ ${pair(calculation.trialVelocity)} units/s; clip its length to ${fixed(example.maxSpeed)} to get ${pair(next.velocity)} units/s.`,
      `New Ash: ${pair(ash.position)} + ${pair(next.velocity)} × ${fixed(example.timeStep)} ≈ ${pair(next.position)} units.`,
    ],
    note: `The ${fixed(prediction)} s forecast is recomputed after each ${fixed(example.timeStep)} s update. It assumes Reed keeps the sampled velocity; it is not an interception deadline. Printed operands are rounded.`,
  };
}

const closingRate = (frame: PursueFrame) =>
  dot(
    subtract(frame.ash.velocity, frame.reed.velocity),
    subtract(frame.reed.position, frame.ash.position),
  );

function phaseNote(frame: PursueFrame, example: PursueParameters, previous?: PursueFrame): string {
  if (length(frame.calculation.acceleration) === 0)
    return 'Ash is on the aim with motion still left, so zero acceleration lets the tagger coast past.';
  if (frame.calculation.distance <= example.tagRadius)
    return 'Ash is close enough to tag Reed, but the steering still pulls towards the moving aim.';
  if (previous && previous.calculation.distance <= example.tagRadius)
    return 'Ash has left tag range because reaching the runner did not cancel the motion.';
  if (closingRate(frame) < 0)
    return 'Ash is moving away from Reed while the pull towards the aim works to bring the runners together.';
  if (frame.calculation.prediction === example.maxPrediction)
    return 'Ash aims ahead of Reed, with the cap limiting how much of the runner’s motion to predict.';
  if (previous && frame.calculation.prediction < previous.calculation.prediction)
    return 'As Ash closes on Reed, the shorter lookahead brings the aim nearer to the runner.';
  return 'Ash is closing on Reed while the aim is rebuilt from the runner’s latest motion.';
}

function frameOf(
  frame: PursueFrame,
  example: PursueParameters,
  previous?: PursueFrame,
): MotionFrame {
  const { ash, reed, calculation } = frame;
  const velocity = scale(ash.velocity, example.velocitySeconds);
  const targetVelocity = scale(reed.velocity, example.velocitySeconds);
  const acceleration = scale(calculation.acceleration, example.accelerationSecondsSquared);
  return {
    seconds: frame.seconds,
    bodies: [
      { id: 'ash', ...ash.position, tone: 'subject', label: 'Ash' },
      { id: 'reed', ...reed.position, tone: 'target', label: 'Reed' },
    ],
    marks: [{ ...calculation.predicted, shape: 'cross', tone: 'desired', label: 'Aim' }],
    zones: [{ ...reed.position, radius: example.tagRadius, tone: 'zone' }],
    links: [{ from: reed.position, to: calculation.predicted, tone: 'desired' }],
    vectors: [
      { ...ash.position, dx: velocity.x, dy: velocity.y, tone: 'actual' },
      { ...reed.position, dx: targetVelocity.x, dy: targetVelocity.y, tone: 'target' },
      { ...ash.position, dx: acceleration.x, dy: acceleration.y, tone: 'desired' },
    ],
    values: {
      positionX: fixed(ash.position.x),
      positionY: fixed(ash.position.y),
      velocityX: fixed(ash.velocity.x),
      velocityY: fixed(ash.velocity.y),
      targetX: fixed(reed.position.x),
      targetY: fixed(reed.position.y),
      targetVelocityX: fixed(reed.velocity.x),
      targetVelocityY: fixed(reed.velocity.y),
      predictedX: fixed(calculation.predicted.x),
      predictedY: fixed(calculation.predicted.y),
      accelerationX: fixed(calculation.acceleration.x),
      accelerationY: fixed(calculation.acceleration.y),
      distance: fixed(calculation.distance),
      leadDistance: fixed(distance(reed.position, calculation.predicted)),
      maxPrediction: fixed(example.maxPrediction),
      accelerationMagnitude: fixed(length(calculation.acceleration)),
      closingRelation:
        closingRate(frame) > 0
          ? 'closing in'
          : closingRate(frame) < 0
            ? 'moving away'
            : 'holding the same separation',
      speed: fixed(calculation.speed),
      prediction: fixed(calculation.prediction),
      tagRadius: fixed(example.tagRadius),
      forecastError: fixed(frame.forecastError),
    },
    note: phaseNote(frame, example, previous),
    worked: workedStep(frame, example),
  };
}

/** Separate close names in a row below the run, keeping their connectors clear of the text. */
function labelFrame(frame: MotionFrame, left: number, span: number, rowY: number): MotionFrame {
  const ash = frame.bodies[0];
  const reed = frame.bodies[1];
  const aim = frame.marks?.[0];
  if (!aim) return frame;
  const unit = span / drawingWidth;
  const named = [
    { label: 'Ash', point: ash },
    { label: 'Reed', point: reed },
    { label: 'Aim', point: aim },
  ];
  const crowded = named.some(({ point }, index) =>
    named
      .slice(index + 1)
      .some(
        ({ point: other }) =>
          Math.abs(point.x - other.x) < 72 * unit && Math.abs(point.y - other.y) < 32 * unit,
      ),
  );
  const crossesArrow = named.some(({ label, point }) =>
    (frame.vectors ?? []).some((vector) => {
      const left = point.x - label.length * 8 * unit;
      const right = point.x + label.length * 8 * unit;
      const top = point.y - 40 * unit;
      const bottom = point.y - 12 * unit;
      return (
        Math.max(vector.x, vector.x + vector.dx) + 8 * unit >= left &&
        Math.min(vector.x, vector.x + vector.dx) - 8 * unit <= right &&
        Math.max(vector.y, vector.y + vector.dy) + 8 * unit >= top &&
        Math.min(vector.y, vector.y + vector.dy) - 8 * unit <= bottom
      );
    }),
  );
  if (!crowded && !crossesArrow) return frame;
  const callouts = named.map<MotionMark>(({ label }, index) => ({
    x: left + (span * (index + 1)) / (named.length + 1),
    y: rowY,
    shape: 'dot',
    tone: 'muted',
    label,
  }));
  const connectors = named.flatMap<MotionLink>(({ point }, index) => {
    const callout = callouts[index];
    const above = { x: callout.x + 64 * unit, y: rowY - 48 * unit };
    const beside = { x: above.x, y: rowY };
    return [
      { from: point, to: above, tone: 'muted' },
      { from: above, to: beside, tone: 'muted' },
      { from: beside, to: callout, tone: 'muted' },
    ];
  });
  return {
    ...frame,
    bodies: frame.bodies.map((body) => ({ ...body, label: undefined })),
    marks: [{ ...aim, label: undefined }, ...callouts],
    links: [...(frame.links ?? []), ...connectors],
  };
}

function comparison(example: PursueParameters): NonNullable<MotionStudyModel['comparison']> {
  const changed = { ...example, turnAt: example.comparisonTurnAt };
  const normal = pursueFrames(example);
  const turned = pursueFrames(changed);
  const first = turned[0];
  const peak = turned.reduce(
    (best, frame) => (frame.forecastError > best.forecastError ? frame : best),
    first,
  );
  const futureTime = first.seconds + first.calculation.prediction;
  return {
    title: 'What if Reed reverses after Ash takes a sample?',
    intro: `Change only Reed's reversal time from ${fixed(example.turnAt)} s to ${fixed(changed.turnAt)} s, keeping the selected ${fixed(example.maxPrediction)} s prediction cap; the main run ends at ${fixed(example.steps * example.timeStep)} s before its turn.`,
    timeline: {
      title: 'Forecast miss at the chosen future time',
      xLabel: 'Time forecast was made · seconds',
      yLabel: 'Prediction error · units',
      seconds: normal.map(({ seconds }) => seconds),
      xRange: [
        0,
        Math.min(example.steps * example.timeStep, changed.turnAt + example.maxPrediction),
      ],
      yRange: [
        0,
        Math.max(
          ...turned.map(({ forecastError }) => forecastError),
          ...normal.map(({ forecastError }) => forecastError),
        ),
      ],
      reference: 0,
      series: [
        {
          id: 'steady',
          label: 'Steady Reed',
          tone: 'actual',
          values: normal.map(({ forecastError }) => forecastError),
        },
        {
          id: 'reversal',
          label: 'Reed reverses',
          tone: 'desired',
          values: turned.map(({ forecastError }) => forecastError),
        },
      ],
      marks: [{ x: peak.seconds, y: peak.forecastError, tone: 'desired' }],
    },
    findings: [
      futureTime <= changed.turnAt
        ? `The first ${fixed(first.calculation.prediction)} s forecast ends before Reed reverses, so it is accurate; later forecasts reach across the turn and expose the assumption of unchanged velocity.`
        : `Both runs initially lead Reed by ${fixed(distance(first.reed.position, first.calculation.predicted))} units using a ${fixed(first.calculation.prediction)} s forecast; the reversal makes that first forecast miss by ${fixed(first.forecastError)} units at ${fixed(futureTime)} s.`,
      `The largest sampled miss is ${fixed(peak.forecastError)} units for the forecast made at ${fixed(peak.seconds)} s. Once Ash observes the reversed velocity, subsequent forecasts match the new straight motion, but Ash keeps the velocity already acquired towards the earlier aims.`,
    ],
    note: 'Error compares each forecast with the script at that forecast’s exact future time, including times between samples. Only this diagnostic knows the future script. The chart zooms around the reversal; a zero miss does not mean Ash has caught Reed.',
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const states = pursueFrames(example);
  const gaps = states.map(({ calculation }) => calculation.distance);
  const tagged = states.findIndex(({ calculation }) => calculation.distance <= example.tagRadius);
  const closest = gaps.reduce((best, gap, step) => (gap < gaps[best] ? step : best), 0);
  const rawFrames = states.map((frame, step) => {
    const view = frameOf(frame, example, states[step - 1]);
    return {
      ...view,
      values: {
        ...view.values,
        closestPass: fixed(gaps[closest]),
        tagOutcome:
          tagged >= 0
            ? 'Ash enters tag range, then carries on steering.'
            : 'Ash stays outside tag range in this run.',
      },
    };
  });
  const rawPoints = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
    ...(frame.zones ?? []).flatMap((zone) => [
      { x: zone.x - zone.radius, y: zone.y - zone.radius },
      { x: zone.x + zone.radius, y: zone.y + zone.radius },
    ]),
  ]);
  const padding = Math.max(
    example.maxSpeed * example.velocitySeconds,
    example.maxAcceleration * example.accelerationSecondsSquared,
    example.tagRadius,
  );
  const left = Math.min(...rawPoints.map(({ x }) => x)) - padding;
  const spanX =
    Math.max(...rawPoints.map(({ x }) => x)) -
    Math.min(...rawPoints.map(({ x }) => x)) +
    2 * padding;
  const rowY = Math.max(...rawPoints.map(({ y }) => y)) + (64 * spanX) / drawingWidth;
  const frames = rawFrames.map((frame) => labelFrame(frame, left, spanX, rowY));
  const points = [...rawPoints, ...frames.flatMap((frame) => frame.marks ?? [])];
  const shortened = states.findIndex(
    ({ calculation }) => calculation.prediction < example.maxPrediction,
  );
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: left,
        maxX: left + spanX,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'Separation from Reed',
      xLabel: 'Time · seconds',
      yLabel: 'Separation · units',
      seconds: states.map(({ seconds }) => seconds),
      yRange: [0, Math.max(example.tagRadius, ...gaps)],
      reference: example.tagRadius,
      series: [{ id: 'separation', label: 'Green · Ash to Reed', tone: 'actual', values: gaps }],
      marks: tagged < 0 ? [] : [{ x: states[tagged].seconds, y: gaps[tagged], tone: 'actual' }],
    },
    initialStep: shortened < 0 ? 0 : shortened,
    moments: [
      { label: 'Capped lead', step: 0 },
      ...(shortened >= 0 ? [{ label: 'Lead shortens', step: shortened }] : []),
      {
        label: tagged >= 0 ? 'In tag range' : 'Closest pass',
        step: tagged >= 0 ? tagged : closest,
      },
      { label: 'Still steering', step: example.steps },
    ],
    legend: [
      { tone: 'target', label: 'Reed’s velocity' },
      { tone: 'actual', label: 'Ash’s velocity' },
      { tone: 'desired', label: 'Aim and Ash’s acceleration' },
      { tone: 'zone', label: 'Tag range' },
    ],
    caption: `Ash's pull points towards Aim, the cross projected ahead of Reed. Velocity arrows show velocity × ${fixed(example.velocitySeconds)} s; Ash's amber arrow shows acceleration × ${fixed(example.accelerationSecondsSquared)} s². Grey connectors keep names clear of the motion, and the ${fixed(example.tagRadius)}-unit ring measures tag range.`,
    comparison: comparison(example),
    inputs: [
      { name: 'maxPrediction', label: 'Prediction cap', unit: 's', min: 0.25, max: 3, step: 0.25 },
    ],
  };
};
