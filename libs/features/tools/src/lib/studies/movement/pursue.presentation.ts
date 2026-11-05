import { distance, dot, length, scale, subtract } from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { fixed, pair } from './presentation';
import { type PursueFrame, pursueFrames, type PursueParameters } from './pursue.simulation';

function workedStep(
  t: StudyTranslate,
  frame: PursueFrame,
  example: PursueParameters,
): StudyWorkedStep {
  const { ash, reed, calculation, seconds } = frame;
  const { prediction, predicted, acceleration, next } = calculation;
  const offset = subtract(predicted, ash.position);
  return {
    title: t('studyAifg.pursue.model.workedWorkedStepSeconds', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.pursue.model.workedReedMinusAshSeparation', {
        reedPosition: pair(reed.position),
        ashPosition: pair(ash.position),
        calculationDistance: fixed(calculation.distance),
        calculationSpeed: fixed(calculation.speed),
      }),
      calculation.speed === 0
        ? t('studyAifg.pursue.model.workedAshStationaryUseCap', {
            exampleMaxPrediction: fixed(example.maxPrediction),
          })
        : t('studyAifg.pursue.model.workedLookaheadMin', {
            exampleMaxPrediction: fixed(example.maxPrediction),
            calculationDistance: fixed(calculation.distance),
            calculationSpeed: fixed(calculation.speed),
            prediction: fixed(prediction),
          }),
      t('studyAifg.pursue.model.workedPredictedReed', {
        reedPosition: pair(reed.position),
        reedVelocity: pair(reed.velocity),
        prediction: fixed(prediction),
        predicted: pair(predicted),
      }),
      length(offset) === 0
        ? t('studyAifg.pursue.model.workedPredictedPointCoincidesAsh')
        : t('studyAifg.pursue.model.workedEngineSeek', {
            offset: pair(offset),
            offset2: fixed(length(offset)),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
            acceleration: pair(acceleration),
          }),
      t('studyAifg.pursue.model.workedTrialVelocityClipLength', {
        ashVelocity: pair(ash.velocity),
        acceleration: pair(acceleration),
        exampleTimeStep: fixed(example.timeStep),
        calculationTrialVelocity: pair(calculation.trialVelocity),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.pursue.model.workedNewAsh', {
        ashPosition: pair(ash.position),
        nextVelocity: pair(next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: pair(next.position),
      }),
    ],
    note: t('studyAifg.pursue.model.workedForecastRecomputedAfterEach', {
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
    return t('studyAifg.pursue.model.phaseAshAimMotionLeft');
  if (frame.calculation.distance <= example.tagRadius)
    return t('studyAifg.pursue.model.phaseAshCloseEnoughTag');
  if (previous && previous.calculation.distance <= example.tagRadius)
    return t('studyAifg.pursue.model.phaseAshLeftTagRange');
  if (closingRate(frame) < 0) return t('studyAifg.pursue.model.phaseAshMovingAwayReed');
  if (frame.calculation.prediction === example.maxPrediction)
    return t('studyAifg.pursue.model.phaseAshAimsAheadReed');
  if (previous && frame.calculation.prediction < previous.calculation.prediction)
    return t('studyAifg.pursue.model.phaseAshClosesReedShorter');
  return t('studyAifg.pursue.model.phaseAshClosingReedAim');
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
        label: t('studyAifg.pursue.model.ash'),
      },
      {
        id: 'reed',
        ...reed.position,
        tone: 'target',
        label: t('studyAifg.pursue.model.reed'),
      },
    ],
    marks: [
      {
        ...calculation.predicted,
        shape: 'cross',
        tone: 'desired',
        label: t('studyAifg.pursue.model.aim'),
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
          ? t('studyAifg.pursue.model.valueClosing')
          : closingRate(frame) < 0
            ? t('studyAifg.pursue.model.valueMovingAway')
            : t('studyAifg.pursue.model.valueHoldingSameSeparation'),
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
function labelFrame(
  t: StudyTranslate,
  frame: MotionFrame,
  left: number,
  span: number,
  rowY: number,
): MotionFrame {
  const ash = frame.bodies[0];
  const reed = frame.bodies[1];
  const aim = frame.marks?.[0];
  if (!aim) return frame;
  const unit = span / drawingWidth;
  const named = [
    { label: t('studyAifg.pursue.model.ash'), point: ash },
    { label: t('studyAifg.pursue.model.reed'), point: reed },
    { label: t('studyAifg.pursue.model.aim'), point: aim },
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

function comparison(
  t: StudyTranslate,
  example: PursueParameters,
): NonNullable<MotionStudyModel['comparison']> {
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
    title: t('studyAifg.pursue.model.comparisonWhatIfReedReverses'),
    intro: t('studyAifg.pursue.model.comparisonChangeReedReversalTime', {
      exampleTurnAt: fixed(example.turnAt),
      changedTurnAt: fixed(changed.turnAt),
      exampleMaxPrediction: fixed(example.maxPrediction),
      exampleSteps: fixed(example.steps * example.timeStep),
    }),
    timeline: {
      title: t('studyAifg.pursue.model.comparisonForecastMissChosenFuture'),
      xLabel: t('studyAifg.pursue.model.comparisonTimeForecastWasMade'),
      yLabel: t('studyAifg.pursue.model.comparisonPredictionError'),
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
          label: t('studyAifg.pursue.model.comparisonSteadyReed'),
          tone: 'actual',
          values: normal.map(({ forecastError }) => forecastError),
        },
        {
          id: 'reversal',
          label: t('studyAifg.pursue.model.comparisonReedReverses'),
          tone: 'desired',
          values: turned.map(({ forecastError }) => forecastError),
        },
      ],
      marks: [{ x: peak.seconds, y: peak.forecastError, tone: 'desired' }],
    },
    findings: [
      futureTime <= changed.turnAt
        ? t('studyAifg.pursue.model.comparisonFirstForecastEndsBefore', {
            calculationPrediction: fixed(first.calculation.prediction),
          })
        : t('studyAifg.pursue.model.comparisonRunsInitiallyLeadReed', {
            value1: fixed(distance(first.reed.position, first.calculation.predicted)),
            calculationPrediction: fixed(first.calculation.prediction),
            firstForecastError: fixed(first.forecastError),
            futureTime: fixed(futureTime),
          }),
      t('studyAifg.pursue.model.comparisonLargestSampledMissForecast', {
        peakForecastError: fixed(peak.forecastError),
        peakSeconds: fixed(peak.seconds),
      }),
    ],
    note: t('studyAifg.pursue.model.comparisonErrorComparesEachForecast'),
  };
}

function runTimeline(
  t: StudyTranslate,
  states: ReturnType<typeof pursueFrames>,
  example: PursueParameters,
  gaps: number[],
  tagged: number,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.pursue.model.separationReed'),
    xLabel: t('studyAifg.pursue.model.timeSeconds'),
    yLabel: t('studyAifg.pursue.model.separation'),
    seconds: states.map(({ seconds }) => seconds),
    yRange: [0, Math.max(example.tagRadius, ...gaps)],
    reference: example.tagRadius,
    series: [
      {
        id: 'separation',
        label: t('studyAifg.pursue.model.greenAshReed'),
        tone: 'actual',
        values: gaps,
      },
    ],
    marks: tagged < 0 ? [] : [{ x: states[tagged].seconds, y: gaps[tagged], tone: 'actual' }],
  };
}

function runMoments(
  t: StudyTranslate,
  shortened: number,
  tagged: number,
  closest: number,
  example: PursueParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.pursue.model.cappedLead'), step: 0 },
    ...(shortened >= 0
      ? [{ label: t('studyAifg.pursue.model.leadShortens'), step: shortened }]
      : []),
    {
      label:
        tagged >= 0
          ? t('studyAifg.pursue.model.tagRange')
          : t('studyAifg.pursue.model.closestPass'),
      step: tagged >= 0 ? tagged : closest,
    },
    { label: t('studyAifg.pursue.model.steering'), step: example.steps },
  ];
}

function motionFrames(
  t: StudyTranslate,
  states: ReturnType<typeof pursueFrames>,
  example: PursueParameters,
  gaps: number[],
  closest: number,
  tagged: number,
): readonly MotionFrame[] {
  return states.map((frame, step) => {
    const view = frameOf(t, frame, example, states[step - 1]);
    return {
      ...view,
      values: {
        ...view.values,
        closestPass: fixed(gaps[closest]),
        tagOutcome:
          tagged >= 0
            ? t('studyAifg.pursue.model.ashEntersTagRange')
            : t('studyAifg.pursue.model.ashStaysOutsideTag'),
      },
    };
  });
}

export const present = (
  example: PursueParameters,
  states: ReturnType<typeof pursueFrames>,
  t: StudyTranslate,
): MotionStudyModel => {
  const gaps = states.map(({ calculation }) => calculation.distance);
  const tagged = states.findIndex(({ calculation }) => calculation.distance <= example.tagRadius);
  const closest = gaps.reduce((best, gap, step) => (gap < gaps[best] ? step : best), 0);
  const rawFrames = motionFrames(t, states, example, gaps, closest, tagged);
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
  const frames = rawFrames.map((frame) => labelFrame(t, frame, left, spanX, rowY));
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
    timeline: runTimeline(t, states, example, gaps, tagged),
    initialStep: shortened < 0 ? 0 : shortened,
    moments: runMoments(t, shortened, tagged, closest, example),
    legend: [
      { tone: 'target', label: t('studyAifg.pursue.model.reedVelocity') },
      { tone: 'actual', label: t('studyAifg.pursue.model.ashVelocity') },
      { tone: 'desired', label: t('studyAifg.pursue.model.aimAshAcceleration') },
      { tone: 'zone', label: t('studyAifg.pursue.model.tagRangeLabel') },
    ],
    caption: t('studyAifg.pursue.model.caption', {
      exampleVelocitySeconds: fixed(example.velocitySeconds),
      exampleAccelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
      exampleTagRadius: fixed(example.tagRadius),
    }),
    comparison: comparison(t, example),
    inputs: [
      {
        name: 'maxPrediction',
        label: t('studyAifg.pursue.model.predictionCap'),
        unit: t('studyAifg.pursue.model.inputsUnitS'),
        min: 0.25,
        max: 3,
        step: 0.25,
      },
    ],
  };
};
