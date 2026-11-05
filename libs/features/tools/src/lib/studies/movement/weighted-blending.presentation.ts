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
import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { rounded as shown } from './presentation';
import {
  blendingSamples,
  type BlendingStep,
  createNia,
  robotOf,
  targetOf,
  type WeightedBlendingParameters,
} from './weighted-blending.simulation';

interface RunReading {
  readonly alignmentResult: string;
  readonly minimumGap: number;
}

const vectorText = ({ x, y }: Vec2) => `(${shown(x)}, ${shown(y)})`;

function relationToRobot(t: StudyTranslate, position: Vec2, robot: Vec2): string {
  const vertical =
    position.y < robot.y
      ? t('studyAifg.weighted-blending.model.above')
      : position.y > robot.y
        ? t('studyAifg.weighted-blending.model.below')
        : '';
  const horizontal =
    position.x < robot.x
      ? t('studyAifg.weighted-blending.model.left')
      : position.x > robot.x
        ? t('studyAifg.weighted-blending.model.right')
        : '';
  return vertical && horizontal
    ? t('studyAifg.weighted-blending.model.relationToRobotAnd', {
        vertical,
        horizontal,
      })
    : vertical || horizontal || t('studyAifg.weighted-blending.model.samePlace');
}

function directionOf(t: StudyTranslate, offset: Vec2): string {
  const vertical =
    offset.y < 0
      ? t('studyAifg.weighted-blending.model.upwards')
      : offset.y > 0
        ? t('studyAifg.weighted-blending.model.downwards')
        : '';
  const horizontal =
    offset.x < 0
      ? t('studyAifg.weighted-blending.model.toTheLeft')
      : offset.x > 0
        ? t('studyAifg.weighted-blending.model.toTheRight')
        : '';
  return vertical && horizontal
    ? t('studyAifg.weighted-blending.model.relationToRobotAnd', {
        vertical,
        horizontal,
      })
    : vertical || horizontal || t('studyAifg.weighted-blending.model.away');
}

function pullsOf(t: StudyTranslate, step: BlendingStep): string {
  if (length(step.raw) === 0) return t('studyAifg.weighted-blending.model.cancel');
  if (length(step.weightedSeparation) === 0)
    return t('studyAifg.weighted-blending.model.leaveSeekActingAlone');
  if (length(step.weightedSeek) === 0)
    return t('studyAifg.weighted-blending.model.leaveSeparationActingAlone');
  return dot(step.weightedSeek, step.weightedSeparation) < 0
    ? t('studyAifg.weighted-blending.model.partlyOpposeOneAnother')
    : t('studyAifg.weighted-blending.model.reinforceOneAnother');
}

function noteOf(
  t: StudyTranslate,
  body: SteeringBody,
  calculation: BlendingStep,
  step: number,
  example: WeightedBlendingParameters,
): string {
  if (calculation.robotDistance < 2 * example.radius)
    return t('studyAifg.weighted-blending.model.phaseNiaFootprintOverlapsRobot');
  if (length(calculation.raw) === 0)
    return length(body.velocity) === 0
      ? t('studyAifg.weighted-blending.model.phasePullsCancelNiaStays')
      : t('studyAifg.weighted-blending.model.phasePullsCancelNiaKeeps');
  if (
    dot(
      subtract(targetOf(example), body.position),
      subtract(targetOf(example), createNia(example).position),
    ) < 0
  )
    return t('studyAifg.weighted-blending.model.phaseNiaPassedBaySpeed');
  if (distance(body.position, targetOf(example)) < example.radius)
    return t('studyAifg.weighted-blending.model.phaseNiaCloseBayMoving');
  if (length(calculation.weightedSeparation) === 0)
    return calculation.robotDistance >= example.threshold
      ? t('studyAifg.weighted-blending.model.phaseRobotOutsideNeighbourhoodSeek')
      : t('studyAifg.weighted-blending.model.phaseSeparationNoWeightSeek');
  if (step === 0) {
    if (dot(calculation.raw, calculation.seekRequest) < 0)
      return t('studyAifg.weighted-blending.model.phaseSeparationOutweighsSeekNia');
    if (calculation.weightedSeparation.y < 0)
      return t('studyAifg.weighted-blending.model.phaseSeparationPushesNiaAbove');
    if (calculation.weightedSeparation.y > 0)
      return t('studyAifg.weighted-blending.model.phaseSeparationPushesNiaBelow');
  }
  if (length(calculation.raw) > example.maxAcceleration)
    return t('studyAifg.weighted-blending.model.phaseRequestsExceedNiaAcceleration');
  if (calculation.weightedSeparation.y < 0)
    return t('studyAifg.weighted-blending.model.phaseSeparationKeepsPushingNia');
  if (calculation.weightedSeparation.y > 0)
    return t('studyAifg.weighted-blending.model.phaseSeparationPushesNiaDownwards');
  return t('studyAifg.weighted-blending.model.phaseRequestsPullAlongSame');
}

function frameWorkedLines(
  t: StudyTranslate,
  body: SteeringBody,
  robot: ReturnType<typeof robotOf>,
  target: ReturnType<typeof targetOf>,
  example: WeightedBlendingParameters,
  calculation: BlendingStep,
  rawMagnitude: number,
  factor: number,
): readonly string[] {
  return [
    t('studyAifg.weighted-blending.model.workedBeginVelocityRobotBay', {
      bodyPosition: vectorText(body.position),
      bodyVelocity: vectorText(body.velocity),
      robot: vectorText(robot),
      target: vectorText(target),
    }),
    t('studyAifg.weighted-blending.model.workedBayOffsetSeekRequests', {
      value1: vectorText(subtract(target, body.position)),
      exampleMaxAcceleration: shown(example.maxAcceleration),
      calculationSeekRequest: vectorText(calculation.seekRequest),
    }),
    t('studyAifg.weighted-blending.model.workedRobotDistance', {
      positionX: shown(body.position.x - robot.x),
      positionY: shown(body.position.y - robot.y),
      calculationRobotDistance: shown(calculation.robotDistance),
    }),
    calculation.robotDistance >= example.threshold
      ? t('studyAifg.weighted-blending.model.workedDistanceSeparationRequests', {
          exampleThreshold: shown(example.threshold),
        })
      : t('studyAifg.weighted-blending.model.workedLinearStrengthPointingAway', {
          exampleMaxAcceleration: shown(example.maxAcceleration),
          exampleThreshold: shown(example.threshold),
          calculationRobotDistance: shown(calculation.robotDistance),
          calculationSeparationRequest: shown(length(calculation.separationRequest)),
          calculationSeparationRequest2: vectorText(calculation.separationRequest),
        }),
    t('studyAifg.weighted-blending.model.workedSeekSeparation', {
      exampleSeekWeight: shown(example.seekWeight),
      calculationSeekRequest: vectorText(calculation.seekRequest),
      calculationWeightedSeek: vectorText(calculation.weightedSeek),
      exampleSeparationWeight: shown(example.separationWeight),
      calculationSeparationRequest: vectorText(calculation.separationRequest),
      calculationWeightedSeparation: vectorText(calculation.weightedSeparation),
    }),
    t('studyAifg.weighted-blending.model.workedAddLength', {
      calculationWeightedSeek: vectorText(calculation.weightedSeek),
      calculationWeightedSeparation: vectorText(calculation.weightedSeparation),
      calculationRaw: vectorText(calculation.raw),
      rawMagnitude: shown(rawMagnitude),
    }),
    rawMagnitude === 0
      ? t('studyAifg.weighted-blending.model.workedRequestsCancelExactlyApplied')
      : t('studyAifg.weighted-blending.model.workedLengthCapMultiplySum', {
          exampleMaxAcceleration: shown(example.maxAcceleration),
          rawMagnitude: shown(rawMagnitude),
          factor: shown(factor),
          calculationAcceleration: vectorText(calculation.acceleration),
        }),
    t('studyAifg.weighted-blending.model.workedVelocityCapLength', {
      bodyVelocity: vectorText(body.velocity),
      calculationAcceleration: vectorText(calculation.acceleration),
      exampleTimeStep: shown(example.timeStep),
      exampleMaxSpeed: shown(example.maxSpeed),
      nextVelocity: vectorText(calculation.next.velocity),
    }),
    t('studyAifg.weighted-blending.model.workedPosition', {
      bodyPosition: vectorText(body.position),
      nextVelocity: vectorText(calculation.next.velocity),
      exampleTimeStep: shown(example.timeStep),
      nextPosition: vectorText(calculation.next.position),
    }),
  ];
}

function frameWorked(
  t: StudyTranslate,
  step: number,
  example: WeightedBlendingParameters,
  body: SteeringBody,
  robot: ReturnType<typeof robotOf>,
  target: ReturnType<typeof targetOf>,
  calculation: BlendingStep,
  rawMagnitude: number,
  factor: number,
): StudyWorkedStep {
  return {
    title: t('studyAifg.weighted-blending.model.workedLoadingBayCalculation', {
      step: shown(step * example.timeStep),
    }),
    lines: frameWorkedLines(t, body, robot, target, example, calculation, rawMagnitude, factor),
    note:
      step === example.steps
        ? t('studyAifg.weighted-blending.model.workedFinalSamplePreviewsNext')
        : t('studyAifg.weighted-blending.model.workedEngineAppliesWeightedSum'),
  };
}

function describeFrame(
  body: SteeringBody,
  calculation: BlendingStep,
  example: WeightedBlendingParameters,
) {
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

function frameValues(
  t: StudyTranslate,
  step: number,
  example: WeightedBlendingParameters,
  body: SteeringBody,
  description: ReturnType<typeof describeFrame>,
  calculation: BlendingStep,
  reading: RunReading,
): Readonly<Record<string, string>> {
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
        ? t('studyAifg.weighted-blending.model.valueFootprintsOverlap')
        : t('studyAifg.weighted-blending.model.valueSampledFootprintsStayApart'),
  };
}

function frameOf(
  t: StudyTranslate,
  body: SteeringBody,
  calculation: BlendingStep,
  step: number,
  example: WeightedBlendingParameters,
  reading: RunReading,
): MotionFrame {
  const description = describeFrame(body, calculation, example);
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'nia',
        ...body.position,
        tone: 'subject',
        label: t('studyAifg.weighted-blending.model.nia'),
      },
      { id: 'parked-robot', ...description.robot, tone: 'other' },
    ],
    marks: [
      { ...description.target, shape: 'cross', tone: 'target' },
      {
        ...description.robotName,
        shape: 'dot',
        tone: 'other',
        label: t('studyAifg.weighted-blending.model.robot'),
      },
      {
        ...description.bayName,
        shape: 'dot',
        tone: 'target',
        label: t('studyAifg.weighted-blending.model.bay'),
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
    values: frameValues(t, step, example, body, description, calculation, reading),
    note: noteOf(t, body, calculation, step, example),
    worked: frameWorked(
      t,
      step,
      example,
      body,
      description.robot,
      description.target,
      calculation,
      description.rawMagnitude,
      description.factor,
    ),
  };
}

function compareRuns(
  t: StudyTranslate,
  alignedStart: BlendingStep,
  example: WeightedBlendingParameters,
  seconds: number[],
  normalDistances: number[],
  alignedDistances: number[],
  alignmentResult: string,
  reading: {
    alignmentResult: string;
    minimumGap: number;
  },
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title:
      length(alignedStart.raw) === 0
        ? t('studyAifg.weighted-blending.model.comparisonCancellationBayAhead')
        : t('studyAifg.weighted-blending.model.comparisonChangingBalanceDirectRoute'),
    intro:
      example.robotY === example.alignedRobotY
        ? t('studyAifg.weighted-blending.model.comparisonRunsNowPlaceRobot')
        : t('studyAifg.weighted-blending.model.comparisonPlaceRobotDirectRoute', {
            exampleSeekWeight: shown(example.seekWeight),
            exampleSeparationWeight: shown(example.separationWeight),
          }),
    timeline: {
      title: t('studyAifg.weighted-blending.model.comparisonDistanceRemainingBay'),
      xLabel: t('studyAifg.weighted-blending.model.timeSeconds'),
      yLabel: t('studyAifg.weighted-blending.model.comparisonDistance'),
      seconds,
      reference: 0,
      yRange: [0, Math.max(...normalDistances, ...alignedDistances)],
      series: [
        {
          id: 'current-robot',
          label: t('studyAifg.weighted-blending.model.comparisonCurrentRobotPosition'),
          tone: 'actual',
          values: normalDistances,
        },
        {
          id: 'aligned-robot',
          label: t('studyAifg.weighted-blending.model.comparisonRobotDirectRoute'),
          tone: 'desired',
          values: alignedDistances,
        },
      ],
    },
    findings: [
      t('studyAifg.weighted-blending.model.comparisonDirectRouteSeekContributes', {
        alignedStartWeightedSeek: shown(length(alignedStart.weightedSeek)),
        alignedStartWeightedSeparation: shown(length(alignedStart.weightedSeparation)),
        alignmentResult,
      }),
      t('studyAifg.weighted-blending.model.comparisonCurrentRunLeftBay', {
        seconds: shown(seconds[example.steps]),
        normalDistances: shown(normalDistances[example.steps]),
        alignedDistances: shown(alignedDistances[example.steps]),
        readingMinimumGap: shown(reading.minimumGap),
        value5: shown(2 * example.radius),
      }),
    ],
    note: t('studyAifg.weighted-blending.model.comparisonPathAroundRobotExists'),
  };
}

function runMoments(
  t: StudyTranslate,
  firstClip: number,
  firstOverlap: number,
  largestRequest: number,
  firstClear: number,
  example: WeightedBlendingParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.weighted-blending.model.firstWeightedSum'), step: 0 },
    {
      label:
        firstClip < 0
          ? t('studyAifg.weighted-blending.model.requestsWithinCap')
          : t('studyAifg.weighted-blending.model.firstAccelerationCap'),
      step: firstClip < 0 ? 0 : firstClip,
    },
    {
      label:
        firstOverlap < 0
          ? t('studyAifg.weighted-blending.model.largestRequestBeforeClipping')
          : t('studyAifg.weighted-blending.model.footprintsOverlap'),
      step: firstOverlap < 0 ? largestRequest : firstOverlap,
    },
    {
      label:
        firstClear < 0
          ? t('studyAifg.weighted-blending.model.robotStaysNearby')
          : t('studyAifg.weighted-blending.model.robotOutsideNeighbourhood'),
      step: firstClear < 0 ? example.steps : firstClear,
    },
    {
      label: t('studyAifg.weighted-blending.model.endObservation'),
      step: example.steps,
    },
  ];
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: WeightedBlendingParameters,
  rawMagnitudes: number[],
  usedMagnitudes: number[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.weighted-blending.model.requestAccelerationNiaCan'),
    xLabel: t('studyAifg.weighted-blending.model.timeSeconds'),
    yLabel: t('studyAifg.weighted-blending.model.accelerationMagnitude'),
    seconds,
    reference: example.maxAcceleration,
    yRange: [0, Math.max(example.maxAcceleration, ...rawMagnitudes)],
    series: [
      {
        id: 'raw',
        label: t('studyAifg.weighted-blending.model.weightedSumBeforeClipping'),
        tone: 'desired',
        values: rawMagnitudes,
      },
      {
        id: 'used',
        label: t('studyAifg.weighted-blending.model.appliedAcceleration'),
        tone: 'actual',
        values: usedMagnitudes,
      },
    ],
  };
}

function motionLegend(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'desired',
      label: t('studyAifg.weighted-blending.model.amberWeightedSeek'),
    },
    {
      tone: 'other',
      label: t('studyAifg.weighted-blending.model.greyWeightedSeparation'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.weighted-blending.model.greenAppliedAcceleration'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.weighted-blending.model.outerCircleSeparationNeighbourhood'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'separationWeight',
      label: t('studyAifg.weighted-blending.model.separationWeight'),
      unit: t('studyAifg.weighted-blending.model.weight'),
      min: 0,
      max: 4.5,
      step: 0.5,
    },
    {
      name: 'robotY',
      label: t('studyAifg.weighted-blending.model.robotOffset'),
      unit: t('studyAifg.weighted-blending.model.belowRoute'),
      min: 0,
      max: 3,
      step: 0.5,
    },
  ];
}

export const present = (
  example: WeightedBlendingParameters,
  statesSamples: ReturnType<typeof blendingSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const alignedSamples = blendingSamples(example, example.alignedRobotY);
  const aligned = alignedSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const alignedStart = alignedSamples[0].calculation;
  const alignmentResult =
    length(alignedStart.raw) === 0
      ? t('studyAifg.weighted-blending.model.weightedRequestsCancelNia')
      : alignedStart.raw.x > 0
        ? t('studyAifg.weighted-blending.model.sumStartsNiaTowards')
        : t('studyAifg.weighted-blending.model.sumStartsNiaAway');
  const closest = calculations.reduce(
    (best, calculation, step) =>
      calculation.robotDistance < calculations[best].robotDistance ? step : best,
    0,
  );
  const reading = { alignmentResult, minimumGap: calculations[closest].robotDistance };
  const frames = states.map((state, step) =>
    frameOf(t, state, calculations[step], step, example, reading),
  );
  const seconds = frames.map((frame) => frame.seconds);
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
    family: 'motion',
    motion: { bounds: namedBoundsOf(frames, 2 * example.radius), frames, trail: true },
    timeline: runTimeline(t, seconds, example, rawMagnitudes, usedMagnitudes),
    initialStep: firstOverlap < 0 ? largestRequest : firstOverlap,
    moments: runMoments(t, firstClip, firstOverlap, largestRequest, firstClear, example),
    legend: motionLegend(t),
    caption: t('studyAifg.weighted-blending.model.caption', {
      exampleAccelerationScale: shown(example.accelerationScale),
    }),
    comparison: compareRuns(
      t,
      alignedStart,
      example,
      seconds,
      normalDistances,
      alignedDistances,
      alignmentResult,
      reading,
    ),
    inputs: inputsOf(t),
  };
};
