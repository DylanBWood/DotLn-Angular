import { distance, dot, length, normalize, subtract } from '@dotln-angular/scene-engine';

import { namedBoundsOf } from '../drawing';
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { rounded as shown } from './presentation';
import {
  calculateSeparationStep,
  type SeparationParameters,
  type SeparationSample,
  separationSamples,
  type ShelfPair,
} from './separation.simulation';

const gapOf = (pair: ShelfPair) => distance(pair[0].position, pair[1].position);

const gapRate = (pair: ShelfPair) =>
  dot(
    subtract(pair[1].velocity, pair[0].velocity),
    normalize(subtract(pair[1].position, pair[0].position)),
  );

function motionOf(t: StudyTranslate, pair: ShelfPair, example: SeparationParameters): string {
  if (gapOf(pair) < 2 * example.radius) return t('studyAifg.separation.model.overlapping');
  const rate = gapRate(pair);
  return rate < 0
    ? t('studyAifg.separation.model.closing')
    : rate > 0
      ? t('studyAifg.separation.model.movingApart')
      : t('studyAifg.separation.model.rest');
}

function noteOf(
  t: StudyTranslate,
  square: ShelfPair,
  linear: ShelfPair,
  example: SeparationParameters,
): string {
  if (Math.min(gapOf(square), gapOf(linear)) < 2 * example.radius)
    return t('studyAifg.separation.model.phaseCouriersFootprintsOverlapBecause');
  const closing = [square, linear].filter((pair) => gapRate(pair) < 0).length;
  if (closing === 2) return t('studyAifg.separation.model.phasePairsClosingDespiteOutward');
  if (closing === 1) return t('studyAifg.separation.model.phaseOnePairClosingDespite');
  const squareOutside = gapOf(square) >= example.threshold;
  const linearOutside = gapOf(linear) >= example.threshold;
  if (squareOutside && linearOutside)
    return t('studyAifg.separation.model.phasePairsCoastApartBecause');
  if (linearOutside) return t('studyAifg.separation.model.phaseLinearPairCoastsBeyond');
  if (squareOutside) return t('studyAifg.separation.model.phaseInverseSquarePairCoasts');
  if (length(square[0].velocity) === 0 && length(linear[0].velocity) === 0)
    return t('studyAifg.separation.model.phasePairsStartRestDifferent');
  return t('studyAifg.separation.model.phasePairsMoveApartRepulsion');
}

function calculationLines(
  t: StudyTranslate,
  pair: ShelfPair,
  example: SeparationParameters,
  falloff: 1 | 2,
  step: ReturnType<typeof calculateSeparationStep>,
): readonly string[] {
  const name =
    falloff === 2
      ? t('studyAifg.separation.model.inverseSquare')
      : t('studyAifg.separation.model.linear');
  const a = length(step.accelerations[0]);
  const [A, R, d, c] = [
    shown(example.maxAcceleration),
    shown(example.threshold),
    shown(step.gap),
    shown(2 * example.radius),
  ];
  const strength =
    step.gap >= example.threshold
      ? t('studyAifg.separation.model.gapThresholdAccelerationZero', { name, d, R })
      : falloff === 2
        ? step.gap < 0.005
          ? t('studyAifg.separation.model.centresCloserDisplayedPrecision', {
              name,
              A,
            })
          : t('studyAifg.separation.model.minAwayOtherCourier', {
              name,
              A,
              c,
              d,
              R,
              a: shown(a),
            })
        : t('studyAifg.separation.model.awayOtherCourier', {
            name,
            A,
            R,
            d,
            a: shown(a),
          });
  const before = pair[0];
  const after = step.next[0];
  return [
    strength,
    t('studyAifg.separation.model.miraXVelocityAfter', {
      velocityX: shown(before.velocity.x),
      accelerationsX: shown(step.accelerations[0].x),
      exampleTimeStep: shown(example.timeStep),
      velocityX2: shown(after.velocity.x),
      exampleMaxSpeed: shown(example.maxSpeed),
    }),
    t('studyAifg.separation.model.miraXPositionRowan', {
      positionX: shown(before.position.x),
      velocityX: shown(after.velocity.x),
      exampleTimeStep: shown(example.timeStep),
      positionX2: shown(after.position.x),
      value5: shown(gapOf(step.next)),
    }),
  ];
}

function frameValues(
  t: StudyTranslate,
  step: number,
  example: SeparationParameters,
  squareStep: ReturnType<typeof calculateSeparationStep>,
  square: ShelfPair,
  linearStep: ReturnType<typeof calculateSeparationStep>,
  linear: ShelfPair,
): Readonly<Record<string, string>> {
  return {
    seconds: shown(step * example.timeStep),
    squareGap: shown(squareStep.gap),
    squareSpeed: shown(length(square[0].velocity)),
    squareAcceleration: shown(length(squareStep.accelerations[0])),
    squareMotion: motionOf(t, square, example),
    linearGap: shown(linearStep.gap),
    linearSpeed: shown(length(linear[0].velocity)),
    linearAcceleration: shown(length(linearStep.accelerations[0])),
    linearMotion: motionOf(t, linear, example),
    initialGap: shown(example.initialGap),
    inwardSpeed: shown(example.inwardSpeed),
    fastInwardSpeed: shown(example.fastInwardSpeed),
    threshold: shown(example.threshold),
    radius: shown(example.radius),
    timeStep: shown(example.timeStep),
    maxSpeed: shown(example.maxSpeed),
    accelerationScale: shown(example.accelerationScale),
  };
}

function frameWorked(
  t: StudyTranslate,
  step: number,
  example: SeparationParameters,
  squareStep: ReturnType<typeof calculateSeparationStep>,
  linearStep: ReturnType<typeof calculateSeparationStep>,
  square: ShelfPair,
  linear: ShelfPair,
): StudyWorkedStep {
  return {
    title: t('studyAifg.separation.model.workedShelfCalculation', {
      step: shown(step * example.timeStep),
    }),
    lines: [
      t('studyAifg.separation.model.workedBodyDiameterCentreGaps', {
        exampleRadius: shown(example.radius),
        value2: shown(2 * example.radius),
        squareStepGap: shown(squareStep.gap),
        linearStepGap: shown(linearStep.gap),
      }),
      ...calculationLines(t, square, example, 2, squareStep),
      ...calculationLines(t, linear, example, 1, linearStep),
    ],
    note:
      step === example.steps
        ? t('studyAifg.separation.model.workedFinalSamplePreviewsNext')
        : t('studyAifg.separation.model.workedRunsUseSameSpeed'),
  };
}

function frameOf(
  t: StudyTranslate,
  squareSample: SeparationSample,
  linearSample: SeparationSample,
  step: number,
  example: SeparationParameters,
): MotionFrame {
  const { state: square, calculation: squareStep } = squareSample;
  const { state: linear, calculation: linearStep } = linearSample;
  const lanes = [
    { pair: square, calculation: squareStep, y: -example.laneOffset, tone: 'actual' },
    { pair: linear, calculation: linearStep, y: example.laneOffset, tone: 'desired' },
  ] as const;
  const labelLift = 8 * example.radius;
  return {
    seconds: step * example.timeStep,
    bodies: lanes.flatMap(({ pair, y, tone }) =>
      pair.map((body, index) => ({
        id: `${tone}-${index === 0 ? 'mira' : 'rowan'}`,
        x: body.position.x,
        y: body.position.y + y,
        tone,
        ...(index === 0 ? { label: t('studyAifg.separation.model.mira') } : {}),
      })),
    ),
    marks: lanes.map(({ pair, y, tone }) => ({
      x: pair[1].position.x,
      y: pair[1].position.y + y + labelLift,
      shape: 'dot',
      tone,
      label: t('studyAifg.separation.model.rowan'),
    })),
    vectors: lanes.flatMap(({ pair, calculation, y, tone }) =>
      pair.map((body, index) => ({
        x: body.position.x,
        y: body.position.y + y,
        dx: calculation.accelerations[index].x * example.accelerationScale,
        dy: calculation.accelerations[index].y * example.accelerationScale,
        tone,
      })),
    ),
    zones: lanes.flatMap(({ pair, y, tone }) => [
      { ...pair[0].position, y: pair[0].position.y + y, radius: example.threshold, tone: 'zone' },
      ...pair.map((body) => ({
        ...body.position,
        y: body.position.y + y,
        radius: example.radius,
        tone,
      })),
    ]),
    links: lanes.flatMap(({ pair, y }) => [
      {
        from: { x: pair[0].position.x, y: pair[0].position.y + y },
        to: { x: pair[1].position.x, y: pair[1].position.y + y },
        tone: 'muted',
      },
      {
        from: { x: pair[1].position.x, y: pair[1].position.y + y },
        to: { x: pair[1].position.x, y: pair[1].position.y + y + labelLift },
        tone: 'muted',
      },
    ]),
    values: frameValues(t, step, example, squareStep, square, linearStep, linear),
    note: noteOf(t, square, linear, example),
    worked: frameWorked(t, step, example, squareStep, linearStep, square, linear),
  };
}

function compareRuns(
  t: StudyTranslate,
  example: SeparationParameters,
  seconds: number[],
  contact: number,
  comparisonEnd: number,
  comparisonPeak: number,
  squareGaps: number[],
  fastGaps: number[],
  closest: number,
  firstOverlap: number,
  squareSamples: ReturnType<typeof separationSamples>,
): NonNullable<MotionStudyModel['comparison']> {
  const square = squareSamples.map(({ state }) => state);
  return {
    title: t('studyAifg.separation.model.comparisonSpacingRuleCannotEnforce'),
    intro: t('studyAifg.separation.model.comparisonCompareInitialInwardSpeeds', {
      exampleInwardSpeed: shown(example.inwardSpeed),
      exampleFastInwardSpeed: shown(example.fastInwardSpeed),
      exampleInitialGap: shown(example.initialGap),
      exampleThreshold: shown(example.threshold),
      exampleMaxAcceleration: shown(example.maxAcceleration),
    }),
    timeline: {
      title: t('studyAifg.separation.model.comparisonDoesCentreGapFall'),
      xLabel: t('studyAifg.separation.model.timeSeconds'),
      yLabel: t('studyAifg.separation.model.centreDistance'),
      seconds,
      reference: contact,
      xRange: [0, comparisonEnd],
      yRange: [0, comparisonPeak],
      series: [
        {
          id: 'reference',
          label: t('studyAifg.separation.model.comparisonInwardSpeed', {
            exampleInwardSpeed: shown(example.inwardSpeed),
          }),
          tone: 'actual',
          values: squareGaps,
        },
        {
          id: 'inward',
          label: t('studyAifg.separation.model.comparisonComparisonSpeed', {
            exampleFastInwardSpeed: shown(example.fastInwardSpeed),
          }),
          tone: 'desired',
          values: fastGaps,
        },
      ],
      marks: [{ x: seconds[closest], y: fastGaps[closest], tone: 'desired' }],
    },
    findings: [
      firstOverlap < 0
        ? t('studyAifg.separation.model.comparisonNoSampledOverlapOccurs')
        : t('studyAifg.separation.model.comparisonComparisonPairFirstOverlaps', {
            seconds: shown(seconds[firstOverlap]),
            fastGaps: shown(fastGaps[firstOverlap]),
            contact: shown(contact),
            fastGaps2: shown(fastGaps[closest]),
            seconds2: shown(seconds[closest]),
          }),
      example.inwardSpeed === example.fastInwardSpeed
        ? t('studyAifg.separation.model.comparisonChosenSpeedsMatchLines')
        : t('studyAifg.separation.model.comparisonRunsInitiallyRequestAway', {
            value1: shown(length(squareSamples[0].calculation.accelerations[0])),
          }),
      t('studyAifg.separation.model.comparisonMainInverseSquareRun', {
        squareGaps: shown(squareGaps[example.steps]),
        stepsVelocity: shown(length(square[example.steps][0].velocity)),
      }),
    ],
    note: t('studyAifg.separation.model.comparisonChartFocusesFirstBelow', {
      comparisonEnd: shown(comparisonEnd),
    }),
  };
}

function runMoments(
  t: StudyTranslate,
  linearExit: number,
  example: SeparationParameters,
  squareExit: number,
  overlap: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.separation.model.firstPushes'), step: 0 },
    {
      label:
        linearExit < 0
          ? t('studyAifg.separation.model.linearRunEnd')
          : t('studyAifg.separation.model.linearRunLeavesNeighbourhood'),
      step: linearExit < 0 ? example.steps : linearExit,
    },
    {
      label:
        squareExit < 0
          ? t('studyAifg.separation.model.inverseSquareRunEnd')
          : t('studyAifg.separation.model.inverseSquareRunLeaves'),
      step: squareExit < 0 ? example.steps : squareExit,
    },
    {
      label:
        overlap < 0
          ? t('studyAifg.separation.model.endObservation')
          : t('studyAifg.separation.model.footprintsOverlap'),
      step: overlap < 0 ? example.steps : overlap,
    },
  ];
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: SeparationParameters,
  squareGaps: number[],
  linearGaps: number[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.separation.model.spaceMadeShelf'),
    xLabel: t('studyAifg.separation.model.timeSeconds'),
    yLabel: t('studyAifg.separation.model.centreDistance'),
    seconds,
    reference: example.threshold,
    series: [
      {
        id: 'square-gap',
        label: t('studyAifg.separation.model.inverseSquareGap'),
        tone: 'actual',
        values: squareGaps,
      },
      {
        id: 'linear-gap',
        label: t('studyAifg.separation.model.linearGap'),
        tone: 'desired',
        values: linearGaps,
      },
    ],
  };
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'inwardSpeed',
      label: t('studyAifg.separation.model.initialInwardSpeed'),
      unit: t('studyAifg.separation.model.each'),
      min: 0,
      max: 4,
      step: 0.5,
    },
    {
      name: 'threshold',
      label: t('studyAifg.separation.model.neighbourRange'),
      unit: t('studyAifg.separation.model.inputsUnitUnits'),
      min: 2.5,
      max: 6,
      step: 0.5,
    },
  ];
}

export const present = (
  example: SeparationParameters,
  squareSamples: ReturnType<typeof separationSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const square = squareSamples.map(({ state }) => state);
  const linearSamples = separationSamples(example, 1);
  const linear = linearSamples.map(({ state }) => state);
  const fastSamples = separationSamples(example, 2, example.fastInwardSpeed);
  const fast = fastSamples.map(({ state }) => state);
  const frames = squareSamples.map((sample, step) =>
    frameOf(t, sample, linearSamples[step], step, example),
  );
  const seconds = frames.map((frame) => frame.seconds);
  const squareGaps = square.map(gapOf);
  const linearGaps = linear.map(gapOf);
  const fastGaps = fast.map(gapOf);
  const closest = fastGaps.reduce((best, gap, step) => (gap < fastGaps[best] ? step : best), 0);
  const contact = 2 * example.radius;
  const overlap = squareGaps.findIndex((gap, step) => Math.min(gap, linearGaps[step]) < contact);
  const comparisonEnd = Math.min(
    seconds[example.steps],
    Math.max(example.timeStep, example.initialGap / Math.abs(example.fastInwardSpeed)),
  );
  const comparisonCount = seconds.filter((second) => second <= comparisonEnd).length;
  const comparisonPeak = Math.max(
    contact,
    ...squareGaps.slice(0, comparisonCount),
    ...fastGaps.slice(0, comparisonCount),
  );
  const firstOverlap = fastGaps.findIndex((gap) => gap < contact);
  const exit = (gaps: readonly number[]) => gaps.findIndex((gap) => gap >= example.threshold);
  const linearExit = exit(linearGaps);
  const squareExit = exit(squareGaps);
  return {
    family: 'motion',
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: runTimeline(t, seconds, example, squareGaps, linearGaps),
    initialStep: overlap < 0 ? 0 : overlap,
    moments: runMoments(t, linearExit, example, squareExit, overlap),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.separation.model.upperPairInverseSquare'),
      },
      { tone: 'desired', label: t('studyAifg.separation.model.lowerPairLinearFalloff') },
      {
        tone: 'zone',
        label: t('studyAifg.separation.model.outerCirclesNeighbourhoodAround'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.separation.model.innerCirclesBodyFootprints'),
      },
    ],
    caption: t('studyAifg.separation.model.caption', {
      exampleAccelerationScale: shown(example.accelerationScale),
    }),
    comparison: compareRuns(
      t,
      example,
      seconds,
      contact,
      comparisonEnd,
      comparisonPeak,
      squareGaps,
      fastGaps,
      closest,
      firstOverlap,
      squareSamples,
    ),
    inputs: runInputs(t),
  };
};
