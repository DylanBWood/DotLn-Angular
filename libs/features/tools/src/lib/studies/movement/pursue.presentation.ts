import { distance, dot, length, scale, subtract } from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyMoment,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { type MotionLabelRow, withLabelRow } from './presentation';
import { type PursueFrame, pursueFrames, type PursueParameters } from './pursue.simulation';

interface PursuitDescription {
  readonly example: PursueParameters;
  readonly states: readonly PursueFrame[];
  readonly gaps: readonly number[];
  readonly tagged: number;
  readonly closest: number;
  readonly shortened: number;
}
function describePursuit(
  example: PursueParameters,
  states: readonly PursueFrame[],
): PursuitDescription {
  const gaps = states.map(({ calculation }) => calculation.distance);
  const tagged = states.findIndex(({ calculation }) => calculation.distance <= example.tagRadius);
  const closest = gaps.reduce((best, gap, step) => (gap < gaps[best] ? step : best), 0);
  const shortened = states.findIndex(
    ({ calculation }) => calculation.prediction < example.maxPrediction,
  );
  return { example, states, gaps, tagged, closest, shortened };
}

const { number: fixed, vector: pair } = createNumberFormat({ normalizeNegativeZero: true });

function workedStep(
  t: StudyTranslate,
  frame: PursueFrame,
  example: PursueParameters,
): StudyWorkedStep {
  const { ash, reed, calculation, seconds } = frame;
  const { prediction, predicted, acceleration, next } = calculation;
  const offset = subtract(predicted, ash.position);
  return {
    title: t('studyAifg.pursue.model.worked.workedStepSeconds', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.pursue.model.worked.reedMinusAshSeparation', {
        reedPosition: pair(reed.position),
        ashPosition: pair(ash.position),
        calculationDistance: fixed(calculation.distance),
        calculationSpeed: fixed(calculation.speed),
      }),
      calculation.speed === 0
        ? t('studyAifg.pursue.model.worked.ashStationaryUseCap', {
            exampleMaxPrediction: fixed(example.maxPrediction),
          })
        : t('studyAifg.pursue.model.worked.lookaheadMin', {
            exampleMaxPrediction: fixed(example.maxPrediction),
            calculationDistance: fixed(calculation.distance),
            calculationSpeed: fixed(calculation.speed),
            prediction: fixed(prediction),
          }),
      t('studyAifg.pursue.model.worked.predictedReed', {
        reedPosition: pair(reed.position),
        reedVelocity: pair(reed.velocity),
        prediction: fixed(prediction),
        predicted: pair(predicted),
      }),
      length(offset) === 0
        ? t('studyAifg.pursue.model.worked.predictedPointCoincidesAsh')
        : t('studyAifg.pursue.model.worked.engineSeek', {
            offset: pair(offset),
            distance: fixed(length(offset)),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
            acceleration: pair(acceleration),
          }),
      t('studyAifg.pursue.model.worked.trialVelocityClipLength', {
        ashVelocity: pair(ash.velocity),
        acceleration: pair(acceleration),
        exampleTimeStep: fixed(example.timeStep),
        calculationTrialVelocity: pair(calculation.trialVelocity),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.pursue.model.worked.newAsh', {
        ashPosition: pair(ash.position),
        nextVelocity: pair(next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: pair(next.position),
      }),
    ],
    note: t('studyAifg.pursue.model.worked.forecastRecomputedAfterEach', {
      prediction: fixed(prediction),
      exampleTimeStep: fixed(example.timeStep),
    }),
  };
}

const closingRate = (frame: PursueFrame) =>
  dot(
    subtract(frame.ash.velocity, frame.reed.velocity),
    subtract(frame.reed.position, frame.ash.position),
  );

function phaseNote(
  t: StudyTranslate,
  frame: PursueFrame,
  example: PursueParameters,
  previous?: PursueFrame,
): string {
  if (length(frame.calculation.acceleration) === 0)
    return t('studyAifg.pursue.model.phase.ashAimMotionLeft');
  if (frame.calculation.distance <= example.tagRadius)
    return t('studyAifg.pursue.model.phase.ashCloseEnoughTag');
  if (previous && previous.calculation.distance <= example.tagRadius)
    return t('studyAifg.pursue.model.phase.ashLeftTagRange');
  if (closingRate(frame) < 0) return t('studyAifg.pursue.model.phase.ashMovingAwayReed');
  if (frame.calculation.prediction === example.maxPrediction)
    return t('studyAifg.pursue.model.phase.ashAimsAheadReed');
  if (previous && frame.calculation.prediction < previous.calculation.prediction)
    return t('studyAifg.pursue.model.phase.ashClosesReedShorter');
  return t('studyAifg.pursue.model.phase.ashClosingReedAim');
}

function frameOf(
  t: StudyTranslate,
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
      {
        id: 'ash',
        ...ash.position,
        tone: 'subject',
        label: t('studyAifg.pursue.model.labels.ash'),
      },
      {
        id: 'reed',
        ...reed.position,
        tone: 'target',
        label: t('studyAifg.pursue.model.labels.reed'),
      },
    ],
    marks: [
      {
        ...calculation.predicted,
        shape: 'cross',
        tone: 'desired',
        label: t('studyAifg.pursue.model.labels.aim'),
      },
    ],
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
          ? t('studyAifg.pursue.model.values.closing')
          : closingRate(frame) < 0
            ? t('studyAifg.pursue.model.values.movingAway')
            : t('studyAifg.pursue.model.values.holdingSameSeparation'),
      speed: fixed(calculation.speed),
      prediction: fixed(calculation.prediction),
      tagRadius: fixed(example.tagRadius),
      forecastError: fixed(frame.forecastError),
    },
    note: phaseNote(t, frame, example, previous),
    worked: workedStep(t, frame, example),
  };
}

/** Separate close names in a row below the run, keeping their connectors clear of the text. */
function labelFrame(t: StudyTranslate, frame: MotionFrame, layout: MotionLabelRow): MotionFrame {
  const mark = frame.marks?.[0];
  if (!mark) return frame;
  return withLabelRow(
    frame,
    [
      { label: t('studyAifg.pursue.model.labels.ash'), point: frame.bodies[0] },
      { label: t('studyAifg.pursue.model.labels.reed'), point: frame.bodies[1] },
      { label: t('studyAifg.pursue.model.labels.aim'), point: mark },
    ],
    layout,
  );
}

function comparison(t: StudyTranslate, example: PursueParameters): StudyComparison {
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
    title: t('studyAifg.pursue.model.comparison.whatIfReedReverses'),
    intro: t('studyAifg.pursue.model.comparison.changeReedReversalTime', {
      exampleTurnAt: fixed(example.turnAt),
      changedTurnAt: fixed(changed.turnAt),
      exampleMaxPrediction: fixed(example.maxPrediction),
      exampleSteps: fixed(example.steps * example.timeStep),
    }),
    timeline: {
      title: t('studyAifg.pursue.model.comparison.forecastMissChosenFuture'),
      xLabel: t('studyAifg.pursue.model.comparison.timeForecastWasMade'),
      yLabel: t('studyAifg.pursue.model.comparison.predictionError'),
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
          label: t('studyAifg.pursue.model.comparison.steadyReed'),
          tone: 'actual',
          values: normal.map(({ forecastError }) => forecastError),
        },
        {
          id: 'reversal',
          label: t('studyAifg.pursue.model.comparison.reedReverses'),
          tone: 'desired',
          values: turned.map(({ forecastError }) => forecastError),
        },
      ],
      marks: [{ x: peak.seconds, y: peak.forecastError, tone: 'desired' }],
    },
    findings: [
      futureTime <= changed.turnAt
        ? t('studyAifg.pursue.model.comparison.firstForecastEndsBefore', {
            calculationPrediction: fixed(first.calculation.prediction),
          })
        : t('studyAifg.pursue.model.comparison.runsInitiallyLeadReed', {
            initialLead: fixed(distance(first.reed.position, first.calculation.predicted)),
            calculationPrediction: fixed(first.calculation.prediction),
            firstForecastError: fixed(first.forecastError),
            futureTime: fixed(futureTime),
          }),
      t('studyAifg.pursue.model.comparison.largestSampledMissForecast', {
        peakForecastError: fixed(peak.forecastError),
        peakSeconds: fixed(peak.seconds),
      }),
    ],
    note: t('studyAifg.pursue.model.comparison.errorComparesEachForecast'),
  };
}

function runTimeline(t: StudyTranslate, run: PursuitDescription): TimelineModel {
  const { states, example, gaps, tagged } = run;

  return {
    title: t('studyAifg.pursue.model.timeline.separationReed'),
    xLabel: t('studyAifg.pursue.model.timeline.timeSeconds'),
    yLabel: t('studyAifg.pursue.model.timeline.separation'),
    seconds: states.map(({ seconds }) => seconds),
    yRange: [0, Math.max(example.tagRadius, ...gaps)],
    reference: example.tagRadius,
    series: [
      {
        id: 'separation',
        label: t('studyAifg.pursue.model.timeline.greenAshReed'),
        tone: 'actual',
        values: gaps,
      },
    ],
    marks: tagged < 0 ? [] : [{ x: states[tagged].seconds, y: gaps[tagged], tone: 'actual' }],
  };
}

function runMoments(t: StudyTranslate, run: PursuitDescription): readonly StudyMoment[] {
  const { shortened, tagged, closest, example } = run;

  return [
    { label: t('studyAifg.pursue.model.moments.cappedLead'), step: 0 },
    ...(shortened >= 0
      ? [{ label: t('studyAifg.pursue.model.moments.leadShortens'), step: shortened }]
      : []),
    {
      label:
        tagged >= 0
          ? t('studyAifg.pursue.model.moments.tagRange')
          : t('studyAifg.pursue.model.moments.closestPass'),
      step: tagged >= 0 ? tagged : closest,
    },
    { label: t('studyAifg.pursue.model.moments.steering'), step: example.steps },
  ];
}

function motionFrames(t: StudyTranslate, run: PursuitDescription): readonly MotionFrame[] {
  const { states, example, gaps, closest, tagged } = run;

  return states.map((frame, step) => {
    const view = frameOf(t, frame, example, states[step - 1]);
    return {
      ...view,
      values: {
        ...view.values,
        closestPass: fixed(gaps[closest]),
        tagOutcome:
          tagged >= 0
            ? t('studyAifg.pursue.model.labels.ashEntersTagRange')
            : t('studyAifg.pursue.model.labels.ashStaysOutsideTag'),
      },
    };
  });
}

export const present = (
  example: PursueParameters,
  states: readonly PursueFrame[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describePursuit(example, states);
  const { shortened } = run;
  const rawFrames = motionFrames(t, run);
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
  const frames = rawFrames.map((frame) =>
    labelFrame(t, frame, { left, span: spanX, y: rowY, minimumGap: 72 }),
  );
  const points = [...rawPoints, ...frames.flatMap((frame) => frame.marks ?? [])];
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
    timeline: runTimeline(t, run),
    initialStep: shortened < 0 ? 0 : shortened,
    moments: runMoments(t, run),
    legend: [
      { tone: 'target', label: t('studyAifg.pursue.model.labels.reedVelocity') },
      { tone: 'actual', label: t('studyAifg.pursue.model.labels.ashVelocity') },
      { tone: 'desired', label: t('studyAifg.pursue.model.labels.aimAshAcceleration') },
      { tone: 'zone', label: t('studyAifg.pursue.model.labels.tagRangeLabel') },
    ],
    caption: t('studyAifg.pursue.model.overview.caption', {
      exampleVelocitySeconds: fixed(example.velocitySeconds),
      exampleAccelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
      exampleTagRadius: fixed(example.tagRadius),
    }),
    comparison: comparison(t, example),
    inputs: [
      {
        name: 'maxPrediction',
        label: t('studyAifg.pursue.model.labels.predictionCap'),
        unit: t('studyAifg.pursue.model.inputs.unitS'),
        min: 0.25,
        max: 3,
        step: 0.25,
      },
    ],
  };
};
