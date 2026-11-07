import {
  add,
  distance,
  dot,
  length,
  scale,
  type SteeringBody,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { namedBoundsOf } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyLegendEntry,
  StudyMoment,
  StudyPoint,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type BlendingSample,
  blendingSamples,
  type BlendingStep,
  createNia,
  robotOf,
  targetOf,
  type WeightedBlendingParameters,
} from './weighted-blending.simulation';

const { number: shown, vector: vectorText } = createNumberFormat({ trimTrailingZeroes: true });

function describeRun(
  t: StudyTranslate,
  example: WeightedBlendingParameters,
  statesSamples: readonly BlendingSample[],
): BlendingDescription {
  const states = statesSamples.map(({ state }) => state);
  const alignedSamples = blendingSamples(example, example.alignedRobotY);
  const aligned = alignedSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const alignedStart = alignedSamples[0].calculation;
  const alignmentResult =
    length(alignedStart.raw) === 0
      ? t('studyAifg.weighted-blending.model.labels.weightedRequestsCancelNia')
      : alignedStart.raw.x > 0
        ? t('studyAifg.weighted-blending.model.labels.sumStartsNiaTowards')
        : t('studyAifg.weighted-blending.model.labels.sumStartsNiaAway');
  const closest = calculations.reduce(
    (best, calculation, step) =>
      calculation.robotDistance < calculations[best].robotDistance ? step : best,
    0,
  );
  const reading = { alignmentResult, minimumGap: calculations[closest].robotDistance };
  const seconds = states.map((_state, step) => step * example.timeStep);
  const rawMagnitudes = calculations.map(({ raw }) => length(raw));
  const usedMagnitudes = calculations.map(({ acceleration }) => length(acceleration));
  const largestRequest = rawMagnitudes.reduce(
    (best, magnitude, step) => (magnitude > rawMagnitudes[best] ? step : best),
    0,
  );
  const firstOverlap = calculations.findIndex(
    ({ robotDistance }) => robotDistance < 2 * example.radius,
  );
  const firstClip = rawMagnitudes.findIndex((magnitude) => magnitude > example.maxAcceleration);
  const firstClear = calculations.findIndex(
    ({ robotDistance }) => robotDistance >= example.threshold,
  );
  const target = targetOf(example);
  const normalDistances = states.map((state) => distance(state.position, target));
  const alignedDistances = aligned.map((state) => distance(state.position, target));

  return {
    example,
    statesSamples,
    seconds,
    alignedStart,
    normalDistances,
    alignedDistances,
    rawMagnitudes,
    usedMagnitudes,
    reading,
    firstClip,
    firstOverlap,
    largestRequest,
    firstClear,
  };
}

interface BlendingDescription {
  readonly example: WeightedBlendingParameters;
  readonly statesSamples: readonly BlendingSample[];
  readonly seconds: readonly number[];
  readonly alignedStart: BlendingStep;
  readonly normalDistances: readonly number[];
  readonly alignedDistances: readonly number[];
  readonly rawMagnitudes: readonly number[];
  readonly usedMagnitudes: readonly number[];
  readonly reading: RunReading;
  readonly firstClip: number;
  readonly firstOverlap: number;
  readonly largestRequest: number;
  readonly firstClear: number;
}
interface BlendingFrame {
  readonly run: BlendingDescription;
  readonly step: number;
  readonly body: SteeringBody;
  readonly calculation: BlendingStep;
  readonly robot: StudyPoint;
  readonly target: StudyPoint;
  readonly robotName: StudyPoint;
  readonly bayName: StudyPoint;
  readonly scaleForDrawing: number;
  readonly seekTip: StudyPoint;
  readonly rawMagnitude: number;
  readonly accelerationMagnitude: number;
  readonly factor: number;
}

interface RunReading {
  readonly alignmentResult: string;
  readonly minimumGap: number;
}

function relationToRobot(t: StudyTranslate, position: Vec2, robot: Vec2): string {
  const vertical =
    position.y < robot.y
      ? t('studyAifg.weighted-blending.model.labels.above')
      : position.y > robot.y
        ? t('studyAifg.weighted-blending.model.labels.below')
        : '';
  const horizontal =
    position.x < robot.x
      ? t('studyAifg.weighted-blending.model.labels.left')
      : position.x > robot.x
        ? t('studyAifg.weighted-blending.model.labels.right')
        : '';
  return vertical && horizontal
    ? t('studyAifg.weighted-blending.model.labels.relationToRobotAnd', {
        vertical,
        horizontal,
      })
    : vertical || horizontal || t('studyAifg.weighted-blending.model.labels.samePlace');
}

function directionOf(t: StudyTranslate, offset: Vec2): string {
  const vertical =
    offset.y < 0
      ? t('studyAifg.weighted-blending.model.labels.upwards')
      : offset.y > 0
        ? t('studyAifg.weighted-blending.model.labels.downwards')
        : '';
  const horizontal =
    offset.x < 0
      ? t('studyAifg.weighted-blending.model.labels.toTheLeft')
      : offset.x > 0
        ? t('studyAifg.weighted-blending.model.labels.toTheRight')
        : '';
  return vertical && horizontal
    ? t('studyAifg.weighted-blending.model.labels.relationToRobotAnd', {
        vertical,
        horizontal,
      })
    : vertical || horizontal || t('studyAifg.weighted-blending.model.labels.away');
}

function pullsOf(t: StudyTranslate, step: BlendingStep): string {
  if (length(step.raw) === 0) return t('studyAifg.weighted-blending.model.labels.cancel');
  if (length(step.weightedSeparation) === 0)
    return t('studyAifg.weighted-blending.model.labels.leaveSeekActingAlone');
  if (length(step.weightedSeek) === 0)
    return t('studyAifg.weighted-blending.model.labels.leaveSeparationActingAlone');
  return dot(step.weightedSeek, step.weightedSeparation) < 0
    ? t('studyAifg.weighted-blending.model.labels.partlyOpposeOneAnother')
    : t('studyAifg.weighted-blending.model.labels.reinforceOneAnother');
}

function noteOf(t: StudyTranslate, description: BlendingFrame): string {
  const {
    run: { example },
    body,
    calculation,
    step,
  } = description;

  if (calculation.robotDistance < 2 * example.radius)
    return t('studyAifg.weighted-blending.model.phase.niaFootprintOverlapsRobot');
  if (length(calculation.raw) === 0)
    return length(body.velocity) === 0
      ? t('studyAifg.weighted-blending.model.phase.pullsCancelNiaStays')
      : t('studyAifg.weighted-blending.model.phase.pullsCancelNiaKeeps');
  if (
    dot(
      subtract(targetOf(example), body.position),
      subtract(targetOf(example), createNia(example).position),
    ) < 0
  )
    return t('studyAifg.weighted-blending.model.phase.niaPassedBaySpeed');
  if (distance(body.position, targetOf(example)) < example.radius)
    return t('studyAifg.weighted-blending.model.phase.niaCloseBayMoving');
  if (length(calculation.weightedSeparation) === 0)
    return calculation.robotDistance >= example.threshold
      ? t('studyAifg.weighted-blending.model.phase.robotOutsideNeighbourhoodSeek')
      : t('studyAifg.weighted-blending.model.phase.separationNoWeightSeek');
  if (step === 0) {
    if (dot(calculation.raw, calculation.seekRequest) < 0)
      return t('studyAifg.weighted-blending.model.phase.separationOutweighsSeekNia');
    if (calculation.weightedSeparation.y < 0)
      return t('studyAifg.weighted-blending.model.phase.separationPushesNiaAbove');
    if (calculation.weightedSeparation.y > 0)
      return t('studyAifg.weighted-blending.model.phase.separationPushesNiaBelow');
  }
  if (length(calculation.raw) > example.maxAcceleration)
    return t('studyAifg.weighted-blending.model.phase.requestsExceedNiaAcceleration');
  if (calculation.weightedSeparation.y < 0)
    return t('studyAifg.weighted-blending.model.phase.separationKeepsPushingNia');
  if (calculation.weightedSeparation.y > 0)
    return t('studyAifg.weighted-blending.model.phase.separationPushesNiaDownwards');
  return t('studyAifg.weighted-blending.model.phase.requestsPullAlongSame');
}

function frameWorkedLines(t: StudyTranslate, description: BlendingFrame): readonly string[] {
  const {
    run: { example },
    body,
    calculation,
    robot,
    target,
    rawMagnitude,
    factor,
  } = description;

  return [
    t('studyAifg.weighted-blending.model.worked.beginVelocityRobotBay', {
      bodyPosition: vectorText(body.position),
      bodyVelocity: vectorText(body.velocity),
      robot: vectorText(robot),
      target: vectorText(target),
    }),
    t('studyAifg.weighted-blending.model.worked.bayOffsetSeekRequests', {
      bayOffset: vectorText(subtract(target, body.position)),
      exampleMaxAcceleration: shown(example.maxAcceleration),
      calculationSeekRequest: vectorText(calculation.seekRequest),
    }),
    t('studyAifg.weighted-blending.model.worked.robotDistance', {
      positionX: shown(body.position.x - robot.x),
      positionY: shown(body.position.y - robot.y),
      calculationRobotDistance: shown(calculation.robotDistance),
    }),
    calculation.robotDistance >= example.threshold
      ? t('studyAifg.weighted-blending.model.worked.distanceSeparationRequests', {
          exampleThreshold: shown(example.threshold),
        })
      : t('studyAifg.weighted-blending.model.worked.linearStrengthPointingAway', {
          exampleMaxAcceleration: shown(example.maxAcceleration),
          exampleThreshold: shown(example.threshold),
          calculationRobotDistance: shown(calculation.robotDistance),
          separationStrength: shown(length(calculation.separationRequest)),
          separationRequest: vectorText(calculation.separationRequest),
        }),
    t('studyAifg.weighted-blending.model.worked.seekSeparation', {
      exampleSeekWeight: shown(example.seekWeight),
      calculationSeekRequest: vectorText(calculation.seekRequest),
      calculationWeightedSeek: vectorText(calculation.weightedSeek),
      exampleSeparationWeight: shown(example.separationWeight),
      calculationSeparationRequest: vectorText(calculation.separationRequest),
      calculationWeightedSeparation: vectorText(calculation.weightedSeparation),
    }),
    t('studyAifg.weighted-blending.model.worked.addLength', {
      calculationWeightedSeek: vectorText(calculation.weightedSeek),
      calculationWeightedSeparation: vectorText(calculation.weightedSeparation),
      calculationRaw: vectorText(calculation.raw),
      rawMagnitude: shown(rawMagnitude),
    }),
    rawMagnitude === 0
      ? t('studyAifg.weighted-blending.model.worked.requestsCancelExactlyApplied')
      : t('studyAifg.weighted-blending.model.worked.lengthCapMultiplySum', {
          exampleMaxAcceleration: shown(example.maxAcceleration),
          rawMagnitude: shown(rawMagnitude),
          factor: shown(factor),
          calculationAcceleration: vectorText(calculation.acceleration),
        }),
    t('studyAifg.weighted-blending.model.worked.velocityCapLength', {
      bodyVelocity: vectorText(body.velocity),
      calculationAcceleration: vectorText(calculation.acceleration),
      exampleTimeStep: shown(example.timeStep),
      exampleMaxSpeed: shown(example.maxSpeed),
      nextVelocity: vectorText(calculation.next.velocity),
    }),
    t('studyAifg.weighted-blending.model.worked.position', {
      bodyPosition: vectorText(body.position),
      nextVelocity: vectorText(calculation.next.velocity),
      exampleTimeStep: shown(example.timeStep),
      nextPosition: vectorText(calculation.next.position),
    }),
  ];
}

function frameWorked(t: StudyTranslate, description: BlendingFrame): StudyWorkedStep {
  const {
    run: { example },
    step,
  } = description;

  return {
    title: t('studyAifg.weighted-blending.model.worked.loadingBayCalculation', {
      step: shown(step * example.timeStep),
    }),
    lines: frameWorkedLines(t, description),
    note:
      step === example.steps
        ? t('studyAifg.weighted-blending.model.worked.finalSamplePreviewsNext')
        : t('studyAifg.weighted-blending.model.worked.engineAppliesWeightedSum'),
  };
}

function describeFrame(
  run: BlendingDescription,
  sample: BlendingSample,
  step: number,
): BlendingFrame {
  const { example } = run;
  const { state: body, calculation } = sample;

  const robot = robotOf(example);
  const target = targetOf(example);
  const scaleForDrawing = example.accelerationScale;
  const seekTip = add(body.position, scale(calculation.weightedSeek, scaleForDrawing));
  const rawMagnitude = length(calculation.raw);
  const factor = rawMagnitude === 0 ? 1 : Math.min(1, example.maxAcceleration / rawMagnitude);
  const accelerationMagnitude = length(calculation.acceleration);
  const labelLift = 3 * example.radius;
  const robotName = { ...robot, y: robot.y + labelLift };
  const bayName = { ...target, y: target.y + labelLift };
  return {
    run,
    body,
    calculation,
    step,
    robot,
    target,
    robotName,
    bayName,
    scaleForDrawing,
    seekTip,
    rawMagnitude,
    accelerationMagnitude,
    factor,
  };
}

function frameValues(t: StudyTranslate, description: BlendingFrame): StudyValues {
  const {
    run: { example, reading },
    body,
    calculation,
    step,
  } = description;

  return {
    seconds: shown(step * example.timeStep),
    robotRelation: relationToRobot(t, body.position, description.robot),
    bayDirection: directionOf(t, subtract(description.target, body.position)),
    robotDistance: shown(calculation.robotDistance),
    bayDistance: shown(distance(body.position, description.target)),
    speed: shown(length(body.velocity)),
    seekMagnitude: shown(length(calculation.seekRequest)),
    separationMagnitude: shown(length(calculation.separationRequest)),
    weightedSeekMagnitude: shown(length(calculation.weightedSeek)),
    weightedSeparationMagnitude: shown(length(calculation.weightedSeparation)),
    rawMagnitude: shown(description.rawMagnitude),
    accelerationMagnitude: shown(description.accelerationMagnitude),
    pullRelation: pullsOf(t, calculation),
    seekWeight: shown(example.seekWeight),
    separationWeight: shown(example.separationWeight),
    weightSum: shown(example.seekWeight + example.separationWeight),
    maxAcceleration: shown(example.maxAcceleration),
    maxSpeed: shown(example.maxSpeed),
    timeStep: shown(example.timeStep),
    threshold: shown(example.threshold),
    radius: shown(example.radius),
    robotOffset: shown(example.robotY - example.startY),
    accelerationScale: shown(description.scaleForDrawing),
    alignmentResult: reading.alignmentResult,
    minimumGap: shown(reading.minimumGap),
    diameter: shown(2 * example.radius),
    clearanceSummary:
      reading.minimumGap < 2 * example.radius
        ? t('studyAifg.weighted-blending.model.values.footprintsOverlap')
        : t('studyAifg.weighted-blending.model.values.sampledFootprintsStayApart'),
  };
}

function frameOf(t: StudyTranslate, description: BlendingFrame): MotionFrame {
  const {
    run: { example },
    body,
    calculation,
    step,
  } = description;

  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'nia',
        ...body.position,
        tone: 'subject',
        label: t('studyAifg.weighted-blending.model.labels.nia'),
      },
      { id: 'parked-robot', ...description.robot, tone: 'other' },
    ],
    marks: [
      { ...description.target, shape: 'cross', tone: 'target' },
      {
        ...description.robotName,
        shape: 'dot',
        tone: 'other',
        label: t('studyAifg.weighted-blending.model.labels.robot'),
      },
      {
        ...description.bayName,
        shape: 'dot',
        tone: 'target',
        label: t('studyAifg.weighted-blending.model.labels.bay'),
      },
    ],
    links: [
      { from: description.robot, to: description.robotName, tone: 'muted' },
      { from: description.target, to: description.bayName, tone: 'muted' },
    ],
    zones: [
      { ...body.position, radius: example.threshold, tone: 'zone' },
      { ...body.position, radius: example.radius, tone: 'subject' },
      { ...description.robot, radius: example.radius, tone: 'other' },
    ],
    vectors: [
      {
        ...body.position,
        dx: calculation.weightedSeek.x * description.scaleForDrawing,
        dy: calculation.weightedSeek.y * description.scaleForDrawing,
        tone: 'desired',
      },
      {
        ...description.seekTip,
        dx: calculation.weightedSeparation.x * description.scaleForDrawing,
        dy: calculation.weightedSeparation.y * description.scaleForDrawing,
        tone: 'other',
      },
      {
        ...body.position,
        dx: calculation.acceleration.x * description.scaleForDrawing,
        dy: calculation.acceleration.y * description.scaleForDrawing,
        tone: 'actual',
      },
    ],
    values: frameValues(t, description),
    note: noteOf(t, description),
    worked: frameWorked(t, description),
  };
}

function compareRuns(t: StudyTranslate, run: BlendingDescription): StudyComparison {
  const { example, seconds, alignedStart, normalDistances, alignedDistances, reading } = run;

  return {
    title:
      length(alignedStart.raw) === 0
        ? t('studyAifg.weighted-blending.model.comparison.cancellationBayAhead')
        : t('studyAifg.weighted-blending.model.comparison.changingBalanceDirectRoute'),
    intro:
      example.robotY === example.alignedRobotY
        ? t('studyAifg.weighted-blending.model.comparison.runsNowPlaceRobot')
        : t('studyAifg.weighted-blending.model.comparison.placeRobotDirectRoute', {
            exampleSeekWeight: shown(example.seekWeight),
            exampleSeparationWeight: shown(example.separationWeight),
          }),
    timeline: {
      title: t('studyAifg.weighted-blending.model.comparison.distanceRemainingBay'),
      xLabel: t('studyAifg.weighted-blending.model.labels.timeSeconds'),
      yLabel: t('studyAifg.weighted-blending.model.comparison.distance'),
      seconds,
      reference: 0,
      yRange: [0, Math.max(...normalDistances, ...alignedDistances)],
      series: [
        {
          id: 'current-robot',
          label: t('studyAifg.weighted-blending.model.comparison.currentRobotPosition'),
          tone: 'actual',
          values: normalDistances,
        },
        {
          id: 'aligned-robot',
          label: t('studyAifg.weighted-blending.model.comparison.robotDirectRoute'),
          tone: 'desired',
          values: alignedDistances,
        },
      ],
    },
    findings: [
      t('studyAifg.weighted-blending.model.comparison.directRouteSeekContributes', {
        alignedStartWeightedSeek: shown(length(alignedStart.weightedSeek)),
        alignedStartWeightedSeparation: shown(length(alignedStart.weightedSeparation)),
        alignmentResult: reading.alignmentResult,
      }),
      t('studyAifg.weighted-blending.model.comparison.currentRunLeftBay', {
        seconds: shown(seconds[example.steps]),
        normalDistances: shown(normalDistances[example.steps]),
        alignedDistances: shown(alignedDistances[example.steps]),
        readingMinimumGap: shown(reading.minimumGap),
        diameter: shown(2 * example.radius),
      }),
    ],
    note: t('studyAifg.weighted-blending.model.comparison.pathAroundRobotExists'),
  };
}

function runMoments(t: StudyTranslate, run: BlendingDescription): readonly StudyMoment[] {
  const { example, firstClip, firstOverlap, largestRequest, firstClear } = run;

  return [
    { label: t('studyAifg.weighted-blending.model.moments.firstWeightedSum'), step: 0 },
    {
      label:
        firstClip < 0
          ? t('studyAifg.weighted-blending.model.moments.requestsWithinCap')
          : t('studyAifg.weighted-blending.model.moments.firstAccelerationCap'),
      step: firstClip < 0 ? 0 : firstClip,
    },
    {
      label:
        firstOverlap < 0
          ? t('studyAifg.weighted-blending.model.moments.largestRequestBeforeClipping')
          : t('studyAifg.weighted-blending.model.moments.footprintsOverlap'),
      step: firstOverlap < 0 ? largestRequest : firstOverlap,
    },
    {
      label:
        firstClear < 0
          ? t('studyAifg.weighted-blending.model.moments.robotStaysNearby')
          : t('studyAifg.weighted-blending.model.moments.robotOutsideNeighbourhood'),
      step: firstClear < 0 ? example.steps : firstClear,
    },
    {
      label: t('studyAifg.weighted-blending.model.moments.endObservation'),
      step: example.steps,
    },
  ];
}

function runTimeline(t: StudyTranslate, run: BlendingDescription): TimelineModel {
  const { example, rawMagnitudes, usedMagnitudes, seconds } = run;

  return {
    title: t('studyAifg.weighted-blending.model.timeline.requestAccelerationNiaCan'),
    xLabel: t('studyAifg.weighted-blending.model.labels.timeSeconds'),
    yLabel: t('studyAifg.weighted-blending.model.timeline.accelerationMagnitude'),
    seconds,
    reference: example.maxAcceleration,
    yRange: [0, Math.max(example.maxAcceleration, ...rawMagnitudes)],
    series: [
      {
        id: 'raw',
        label: t('studyAifg.weighted-blending.model.timeline.weightedSumBeforeClipping'),
        tone: 'desired',
        values: rawMagnitudes,
      },
      {
        id: 'used',
        label: t('studyAifg.weighted-blending.model.timeline.appliedAcceleration'),
        tone: 'actual',
        values: usedMagnitudes,
      },
    ],
  };
}

function motionLegend(t: StudyTranslate): readonly StudyLegendEntry[] {
  return [
    {
      tone: 'desired',
      label: t('studyAifg.weighted-blending.model.labels.amberWeightedSeek'),
    },
    {
      tone: 'other',
      label: t('studyAifg.weighted-blending.model.labels.greyWeightedSeparation'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.weighted-blending.model.labels.greenAppliedAcceleration'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.weighted-blending.model.labels.outerCircleSeparationNeighbourhood'),
    },
  ];
}

function inputsOf(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'separationWeight',
      label: t('studyAifg.weighted-blending.model.labels.separationWeight'),
      unit: t('studyAifg.weighted-blending.model.labels.weight'),
      min: 0,
      max: 4.5,
      step: 0.5,
    },
    {
      name: 'robotY',
      label: t('studyAifg.weighted-blending.model.labels.robotOffset'),
      unit: t('studyAifg.weighted-blending.model.labels.belowRoute'),
      min: 0,
      max: 3,
      step: 0.5,
    },
  ];
}

export const present = (
  example: WeightedBlendingParameters,
  statesSamples: readonly BlendingSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(t, example, statesSamples);
  const { firstOverlap, largestRequest } = run;
  const frames = statesSamples.map((sample, step) => frameOf(t, describeFrame(run, sample, step)));
  return {
    family: 'motion',
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: runTimeline(t, run),
    initialStep: firstOverlap < 0 ? largestRequest : firstOverlap,
    moments: runMoments(t, run),
    legend: motionLegend(t),
    caption: t('studyAifg.weighted-blending.model.overview.caption', {
      exampleAccelerationScale: shown(example.accelerationScale),
    }),
    comparison: compareRuns(t, run),
    inputs: inputsOf(t),
  };
};
