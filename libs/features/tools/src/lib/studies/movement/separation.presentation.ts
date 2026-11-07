import { distance, dot, length, normalize, subtract } from '@dotln-angular/scene-engine';

import { namedBoundsOf } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type SeparationParameters,
  type SeparationSample,
  separationSamples,
  type ShelfPair,
} from './separation.simulation';

const { number: shown } = createNumberFormat({ trimTrailingZeroes: true });

function describeRun(
  example: SeparationParameters,
  squareSamples: readonly SeparationSample[],
): SeparationDescription {
  const square = squareSamples.map(({ state }) => state);
  const linearSamples = separationSamples(example, 1);
  const linear = linearSamples.map(({ state }) => state);
  const fastSamples = separationSamples(example, 2, example.fastInwardSpeed);
  const fast = fastSamples.map(({ state }) => state);
  const seconds = squareSamples.map((_sample, step) => step * example.timeStep);
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
    example,
    squareSamples,
    linearSamples,
    seconds,
    squareGaps,
    linearGaps,
    fastGaps,
    closest,
    contact,
    overlap,
    comparisonEnd,
    comparisonPeak,
    firstOverlap,
    linearExit,
    squareExit,
  };
}

interface SeparationDescription {
  readonly example: SeparationParameters;
  readonly squareSamples: readonly SeparationSample[];
  readonly linearSamples: readonly SeparationSample[];
  readonly seconds: readonly number[];
  readonly squareGaps: readonly number[];
  readonly linearGaps: readonly number[];
  readonly fastGaps: readonly number[];
  readonly closest: number;
  readonly contact: number;
  readonly overlap: number;
  readonly comparisonEnd: number;
  readonly comparisonPeak: number;
  readonly firstOverlap: number;
  readonly linearExit: number;
  readonly squareExit: number;
}
interface SeparationFrame {
  readonly example: SeparationParameters;
  readonly squareSample: SeparationSample;
  readonly linearSample: SeparationSample;
  readonly step: number;
}

const gapOf = (pair: ShelfPair) => distance(pair[0].position, pair[1].position);

const gapRate = (pair: ShelfPair) =>
  dot(
    subtract(pair[1].velocity, pair[0].velocity),
    normalize(subtract(pair[1].position, pair[0].position)),
  );

function motionOf(t: StudyTranslate, pair: ShelfPair, example: SeparationParameters): string {
  if (gapOf(pair) < 2 * example.radius) return t('studyAifg.separation.model.phase.overlapping');
  const rate = gapRate(pair);
  return rate < 0
    ? t('studyAifg.separation.model.phase.closing')
    : rate > 0
      ? t('studyAifg.separation.model.phase.movingApart')
      : t('studyAifg.separation.model.phase.rest');
}

function noteOf(t: StudyTranslate, frame: SeparationFrame): string {
  const { example, squareSample, linearSample } = frame;
  const { state: square } = squareSample;
  const { state: linear } = linearSample;

  if (Math.min(gapOf(square), gapOf(linear)) < 2 * example.radius)
    return t('studyAifg.separation.model.phase.couriersFootprintsOverlapBecause');
  const closing = [square, linear].filter((pair) => gapRate(pair) < 0).length;
  if (closing === 2) return t('studyAifg.separation.model.phase.pairsClosingDespiteOutward');
  if (closing === 1) return t('studyAifg.separation.model.phase.onePairClosingDespite');
  const squareOutside = gapOf(square) >= example.threshold;
  const linearOutside = gapOf(linear) >= example.threshold;
  if (squareOutside && linearOutside)
    return t('studyAifg.separation.model.phase.pairsCoastApartBecause');
  if (linearOutside) return t('studyAifg.separation.model.phase.linearPairCoastsBeyond');
  if (squareOutside) return t('studyAifg.separation.model.phase.inverseSquarePairCoasts');
  if (length(square[0].velocity) === 0 && length(linear[0].velocity) === 0)
    return t('studyAifg.separation.model.phase.pairsStartRestDifferent');
  return t('studyAifg.separation.model.phase.pairsMoveApartRepulsion');
}

function calculationLines(
  t: StudyTranslate,
  sample: SeparationSample,
  example: SeparationParameters,
  falloff: 1 | 2,
): readonly string[] {
  const { state: pair, calculation: step } = sample;

  const name =
    falloff === 2
      ? t('studyAifg.separation.model.labels.inverseSquare')
      : t('studyAifg.separation.model.labels.linear');
  const a = length(step.accelerations[0]);
  const [A, R, d, c] = [
    shown(example.maxAcceleration),
    shown(example.threshold),
    shown(step.gap),
    shown(2 * example.radius),
  ];
  const strength =
    step.gap >= example.threshold
      ? t('studyAifg.separation.model.labels.gapThresholdAccelerationZero', { name, d, R })
      : falloff === 2
        ? step.gap < 0.005
          ? t('studyAifg.separation.model.labels.centresCloserDisplayedPrecision', {
              name,
              A,
            })
          : t('studyAifg.separation.model.labels.minAwayOtherCourier', {
              name,
              A,
              c,
              d,
              R,
              a: shown(a),
            })
        : t('studyAifg.separation.model.labels.awayOtherCourier', {
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
    t('studyAifg.separation.model.worked.miraXVelocityAfter', {
      velocityX: shown(before.velocity.x),
      accelerationsX: shown(step.accelerations[0].x),
      exampleTimeStep: shown(example.timeStep),
      nextVelocityX: shown(after.velocity.x),
      exampleMaxSpeed: shown(example.maxSpeed),
    }),
    t('studyAifg.separation.model.worked.miraXPositionRowan', {
      positionX: shown(before.position.x),
      velocityX: shown(after.velocity.x),
      exampleTimeStep: shown(example.timeStep),
      nextPositionX: shown(after.position.x),
      nextGap: shown(gapOf(step.next)),
    }),
  ];
}

function frameValues(t: StudyTranslate, frame: SeparationFrame): StudyValues {
  const { example, step, squareSample, linearSample } = frame;
  const { state: square, calculation: squareStep } = squareSample;
  const { state: linear, calculation: linearStep } = linearSample;

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

function frameWorked(t: StudyTranslate, frame: SeparationFrame): StudyWorkedStep {
  const { example, step, squareSample, linearSample } = frame;
  const { calculation: squareStep } = squareSample;
  const { calculation: linearStep } = linearSample;

  return {
    title: t('studyAifg.separation.model.worked.shelfCalculation', {
      step: shown(step * example.timeStep),
    }),
    lines: [
      t('studyAifg.separation.model.worked.bodyDiameterCentreGaps', {
        exampleRadius: shown(example.radius),
        diameter: shown(2 * example.radius),
        squareStepGap: shown(squareStep.gap),
        linearStepGap: shown(linearStep.gap),
      }),
      ...calculationLines(t, frame.squareSample, example, 2),
      ...calculationLines(t, frame.linearSample, example, 1),
    ],
    note:
      step === example.steps
        ? t('studyAifg.separation.model.worked.finalSamplePreviewsNext')
        : t('studyAifg.separation.model.worked.runsUseSameSpeed'),
  };
}

function frameOf(t: StudyTranslate, frame: SeparationFrame): MotionFrame {
  const { example, step, squareSample, linearSample } = frame;
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
        ...(index === 0 ? { label: t('studyAifg.separation.model.labels.mira') } : {}),
      })),
    ),
    marks: lanes.map(({ pair, y, tone }) => ({
      x: pair[1].position.x,
      y: pair[1].position.y + y + labelLift,
      shape: 'dot',
      tone,
      label: t('studyAifg.separation.model.labels.rowan'),
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
    values: frameValues(t, frame),
    note: noteOf(t, frame),
    worked: frameWorked(t, frame),
  };
}

function compareRuns(t: StudyTranslate, run: SeparationDescription): StudyComparison {
  const {
    example,
    squareSamples,
    seconds,
    squareGaps,
    fastGaps,
    closest,
    contact,
    comparisonEnd,
    comparisonPeak,
    firstOverlap,
  } = run;

  const square = squareSamples.map(({ state }) => state);
  return {
    title: t('studyAifg.separation.model.comparison.spacingRuleCannotEnforce'),
    intro: t('studyAifg.separation.model.comparison.compareInitialInwardSpeeds', {
      exampleInwardSpeed: shown(example.inwardSpeed),
      exampleFastInwardSpeed: shown(example.fastInwardSpeed),
      exampleInitialGap: shown(example.initialGap),
      exampleThreshold: shown(example.threshold),
      exampleMaxAcceleration: shown(example.maxAcceleration),
    }),
    timeline: {
      title: t('studyAifg.separation.model.comparison.doesCentreGapFall'),
      xLabel: t('studyAifg.separation.model.labels.timeSeconds'),
      yLabel: t('studyAifg.separation.model.labels.centreDistance'),
      seconds,
      reference: contact,
      xRange: [0, comparisonEnd],
      yRange: [0, comparisonPeak],
      series: [
        {
          id: 'reference',
          label: t('studyAifg.separation.model.comparison.inwardSpeed', {
            exampleInwardSpeed: shown(example.inwardSpeed),
          }),
          tone: 'actual',
          values: squareGaps,
        },
        {
          id: 'inward',
          label: t('studyAifg.separation.model.comparison.comparisonSpeed', {
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
        ? t('studyAifg.separation.model.comparison.noSampledOverlapOccurs')
        : t('studyAifg.separation.model.comparison.comparisonPairFirstOverlaps', {
            firstOverlapSeconds: shown(seconds[firstOverlap]),
            firstOverlapGap: shown(fastGaps[firstOverlap]),
            contact: shown(contact),
            closestGap: shown(fastGaps[closest]),
            closestSeconds: shown(seconds[closest]),
          }),
      example.inwardSpeed === example.fastInwardSpeed
        ? t('studyAifg.separation.model.comparison.chosenSpeedsMatchLines')
        : t('studyAifg.separation.model.comparison.runsInitiallyRequestAway', {
            initialAcceleration: shown(length(squareSamples[0].calculation.accelerations[0])),
          }),
      t('studyAifg.separation.model.comparison.mainInverseSquareRun', {
        squareGaps: shown(squareGaps[example.steps]),
        stepsVelocity: shown(length(square[example.steps][0].velocity)),
      }),
    ],
    note: t('studyAifg.separation.model.comparison.chartFocusesFirstBelow', {
      comparisonEnd: shown(comparisonEnd),
    }),
  };
}

function runMoments(t: StudyTranslate, run: SeparationDescription): readonly StudyMoment[] {
  const { example, overlap, linearExit, squareExit } = run;

  return [
    { label: t('studyAifg.separation.model.moments.firstPushes'), step: 0 },
    {
      label:
        linearExit < 0
          ? t('studyAifg.separation.model.moments.linearRunEnd')
          : t('studyAifg.separation.model.moments.linearRunLeavesNeighbourhood'),
      step: linearExit < 0 ? example.steps : linearExit,
    },
    {
      label:
        squareExit < 0
          ? t('studyAifg.separation.model.moments.inverseSquareRunEnd')
          : t('studyAifg.separation.model.moments.inverseSquareRunLeaves'),
      step: squareExit < 0 ? example.steps : squareExit,
    },
    {
      label:
        overlap < 0
          ? t('studyAifg.separation.model.moments.endObservation')
          : t('studyAifg.separation.model.moments.footprintsOverlap'),
      step: overlap < 0 ? example.steps : overlap,
    },
  ];
}

function runTimeline(t: StudyTranslate, run: SeparationDescription): TimelineModel {
  const { example, squareGaps, linearGaps, seconds } = run;

  return {
    title: t('studyAifg.separation.model.timeline.spaceMadeShelf'),
    xLabel: t('studyAifg.separation.model.labels.timeSeconds'),
    yLabel: t('studyAifg.separation.model.labels.centreDistance'),
    seconds,
    reference: example.threshold,
    series: [
      {
        id: 'square-gap',
        label: t('studyAifg.separation.model.timeline.inverseSquareGap'),
        tone: 'actual',
        values: squareGaps,
      },
      {
        id: 'linear-gap',
        label: t('studyAifg.separation.model.timeline.linearGap'),
        tone: 'desired',
        values: linearGaps,
      },
    ],
  };
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'inwardSpeed',
      label: t('studyAifg.separation.model.inputs.initialInwardSpeed'),
      unit: t('studyAifg.separation.model.inputs.each'),
      min: 0,
      max: 4,
      step: 0.5,
    },
    {
      name: 'threshold',
      label: t('studyAifg.separation.model.inputs.neighbourRange'),
      unit: t('studyAifg.separation.model.inputs.unitUnits'),
      min: 2.5,
      max: 6,
      step: 0.5,
    },
  ];
}

export const present = (
  example: SeparationParameters,
  squareSamples: readonly SeparationSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, squareSamples);
  const { overlap, linearSamples } = run;
  const frames = squareSamples.map((sample, step) =>
    frameOf(t, { example, squareSample: sample, linearSample: linearSamples[step], step }),
  );
  return {
    family: 'motion',
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: runTimeline(t, run),
    initialStep: overlap < 0 ? 0 : overlap,
    moments: runMoments(t, run),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.separation.model.labels.upperPairInverseSquare'),
      },
      { tone: 'desired', label: t('studyAifg.separation.model.labels.lowerPairLinearFalloff') },
      {
        tone: 'zone',
        label: t('studyAifg.separation.model.labels.outerCirclesNeighbourhoodAround'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.separation.model.labels.innerCirclesBodyFootprints'),
      },
    ],
    caption: t('studyAifg.separation.model.overview.caption', {
      exampleAccelerationScale: shown(example.accelerationScale),
    }),
    comparison: compareRuns(t, run),
    inputs: runInputs(t),
  };
};
