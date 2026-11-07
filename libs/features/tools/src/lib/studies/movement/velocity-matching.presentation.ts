import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type VelocityMatchingParameters,
  type VelocityMatchingSample,
  velocityMatchingSamples,
  type VelocityMatchingState,
} from './velocity-matching.simulation';

const { number: decimal } = createNumberFormat({ zeroThreshold: 0.005 });

function describeMatching(
  example: VelocityMatchingParameters,
  statesSamples: readonly VelocityMatchingSample[],
): VelocityMatchingSummary {
  const states = statesSamples.map(({ state }) => state);
  const capped = statesSamples.findIndex(
    ({ calculation }) => Math.abs(calculation.requestedAcceleration) > example.maxAcceleration,
  );
  const release = statesSamples.findIndex(
    ({ calculation }, step) =>
      step > capped && Math.abs(calculation.requestedAcceleration) <= example.maxAcceleration,
  );
  const overshoot = states.findIndex(
    ({ courierVelocity }) => courierVelocity > example.cartVelocity,
  );
  const initialStep =
    release > 0
      ? release
      : overshoot >= 0
        ? overshoot
        : Math.min(Math.ceil(example.responseTime / example.timeStep), example.steps);
  const last = states[states.length - 1];

  return { capped, release, overshoot, initialStep, last };
}

interface VelocityFrameDescription {
  readonly example: VelocityMatchingParameters;
  readonly sample: VelocityMatchingSample;
  readonly step: number;
}
interface VelocityMatchingSummary {
  readonly capped: number;
  readonly release: number;
  readonly overshoot: number;
  readonly initialStep: number;
  readonly last: VelocityMatchingState;
}

function workedStep(t: StudyTranslate, frame: VelocityFrameDescription): StudyWorkedStep {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  return {
    title: t('studyAifg.velocity-matching.model.worked.miraNextUpdate', {
      step: decimal(step * example.timeStep),
    }),
    lines: [
      t('studyAifg.velocity-matching.model.worked.readCartVelocityNot', {
        exampleCartVelocity: decimal(example.cartVelocity),
        stateCourierVelocity: decimal(state.courierVelocity),
        calculationVelocityGap: decimal(calculation.velocityGap),
      }),
      t('studyAifg.velocity-matching.model.worked.requestAcceleration', {
        calculationVelocityGap: decimal(calculation.velocityGap),
        exampleResponseTime: decimal(example.responseTime),
        calculationRequestedAcceleration: decimal(calculation.requestedAcceleration),
      }),
      t('studyAifg.velocity-matching.model.worked.engineLimitsMagnitudeUse', {
        exampleMaxAcceleration: decimal(example.maxAcceleration),
        calculationAcceleration: decimal(calculation.acceleration),
      }),
      t('studyAifg.velocity-matching.model.worked.updateVelocityLimited', {
        exampleMaxSpeed: decimal(example.maxSpeed),
        stateCourierVelocity: decimal(state.courierVelocity),
        calculationAcceleration: decimal(calculation.acceleration),
        exampleTimeStep: decimal(example.timeStep),
        nextCourierVelocity: decimal(calculation.next.courierVelocity),
      }),
      t('studyAifg.velocity-matching.model.worked.moveMiraUpdatedVelocity', {
        stateCourierPosition: decimal(state.courierPosition),
        nextCourierVelocity: decimal(calculation.next.courierVelocity),
        exampleTimeStep: decimal(example.timeStep),
        nextCourierPosition: decimal(calculation.next.courierPosition),
      }),
      t('studyAifg.velocity-matching.model.worked.moveCartPrescribedVelocity', {
        stateCartPosition: decimal(state.cartPosition),
        exampleCartVelocity: decimal(example.cartVelocity),
        exampleTimeStep: decimal(example.timeStep),
        nextCartPosition: decimal(calculation.next.cartPosition),
      }),
      t('studyAifg.velocity-matching.model.worked.nextPositionGapNever', {
        nextCartPosition: decimal(calculation.next.cartPosition - calculation.next.courierPosition),
      }),
    ],
    note:
      Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
        ? t('studyAifg.velocity-matching.model.worked.accelerationCapActiveResponse')
        : t('studyAifg.velocity-matching.model.worked.belowAccelerationCapSpeed'),
  };
}

function frameNote(t: StudyTranslate, frame: VelocityFrameDescription): string {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  if (step === 0) return t('studyAifg.velocity-matching.model.phase.cartAlreadyMovingMira');
  if (state.courierVelocity >= example.maxSpeed && example.cartVelocity > example.maxSpeed)
    return t('studyAifg.velocity-matching.model.phase.miraReachedHerSpeed');
  if (Math.abs(calculation.velocityGap) < 0.005)
    return t('studyAifg.velocity-matching.model.phase.miraNearlyMatchesCart');
  if (calculation.velocityGap < 0)
    return t('studyAifg.velocity-matching.model.phase.miraMovingFasterCart');
  if (calculation.next.courierVelocity > example.cartVelocity)
    return t('studyAifg.velocity-matching.model.phase.miraSlowerCorrectionSends');
  return Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
    ? t('studyAifg.velocity-matching.model.phase.miraAcceleratesHerLimit')
    : t('studyAifg.velocity-matching.model.phase.miraEasesHerAcceleration');
}

function frameOf(t: StudyTranslate, frame: VelocityFrameDescription): MotionFrame {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const lane = example.radius * 5;
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'mira',
        label: t('studyAifg.velocity-matching.model.labels.mira'),
        x: state.courierPosition,
        y: 0,
        tone: 'subject',
      },
      {
        id: 'cart',
        label: t('studyAifg.velocity-matching.model.labels.cart'),
        x: state.cartPosition,
        y: 0,
        tone: 'target',
      },
    ],
    vectors: [
      {
        x: state.courierPosition,
        y: -lane,
        dx: state.courierVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.courierPosition,
        y: lane,
        dx: example.cartVelocity * example.arrowSeconds,
        dy: 0,
        tone: 'desired',
      },
    ],
    links: [
      {
        from: { x: state.courierPosition, y: 0 },
        to: { x: state.cartPosition, y: 0 },
      },
    ],
    values: {
      seconds: decimal(step * example.timeStep),
      courierPosition: decimal(state.courierPosition),
      cartPosition: decimal(state.cartPosition),
      courierVelocity: decimal(state.courierVelocity),
      cartVelocity: decimal(example.cartVelocity),
      positionGap: decimal(state.cartPosition - state.courierPosition),
      velocityGap: decimal(calculation.velocityGap),
      responseTime: decimal(example.responseTime),
      requestedAcceleration: decimal(calculation.requestedAcceleration),
      acceleration: decimal(calculation.acceleration),
      maxAcceleration: decimal(example.maxAcceleration),
      timeStep: decimal(example.timeStep),
      nextVelocity: decimal(calculation.next.courierVelocity),
      nextPosition: decimal(calculation.next.courierPosition),
      errorMultiplier: decimal(1 - example.timeStep / example.responseTime),
      arrowSeconds: decimal(example.arrowSeconds),
      shortResponseTime: decimal(example.shortResponseTime),
    },
    note: frameNote(t, frame),
    worked: workedStep(t, frame),
  };
}

function shortResponseComparison(
  t: StudyTranslate,
  states: readonly VelocityMatchingState[],
  example: VelocityMatchingParameters,
): StudyComparison {
  const shortSamples = velocityMatchingSamples(example, example.shortResponseTime);
  const short = shortSamples.map(({ state }) => state);
  const last = states[states.length - 1];
  const tail = short.slice(-2).map(({ courierVelocity }) => courierVelocity);
  const allVelocities = [...states, ...short].map(({ courierVelocity }) => courierVelocity);
  return {
    title: t('studyAifg.velocity-matching.model.comparison.quickCorrectionCanOvershoot'),
    intro:
      example.responseTime === example.shortResponseTime
        ? t('studyAifg.velocity-matching.model.comparison.tracesNowUseResponse', {
            exampleResponseTime: decimal(example.responseTime),
            exampleTimeStep: decimal(example.timeStep),
          })
        : t('studyAifg.velocity-matching.model.comparison.compareChosenResponseTime', {
            exampleResponseTime: decimal(example.responseTime),
            exampleShortResponseTime: decimal(example.shortResponseTime),
            exampleTimeStep: decimal(example.timeStep),
          }),
    timeline: {
      title: t('studyAifg.velocity-matching.model.comparison.miraVelocityTwoResponse'),
      xLabel: t('studyAifg.velocity-matching.model.labels.timeSeconds'),
      yLabel: t('studyAifg.velocity-matching.model.labels.velocity'),
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [Math.min(0, ...allVelocities), Math.max(example.cartVelocity, ...allVelocities)],
      reference: example.cartVelocity,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.velocity-matching.model.comparison.solidGreenChosenResponse', {
            exampleResponseTime: decimal(example.responseTime),
          }),
          tone: 'actual',
          values: states.map(({ courierVelocity }) => courierVelocity),
        },
        {
          id: 'short',
          label: t('studyAifg.velocity-matching.model.comparison.dashedAmberReferenceResponse', {
            exampleShortResponseTime: decimal(example.shortResponseTime),
          }),
          tone: 'desired',
          values: short.map(({ courierVelocity }) => courierVelocity),
        },
      ],
    },
    findings: [
      t('studyAifg.velocity-matching.model.comparison.referenceRunEndsSuccessive', {
        penultimateVelocity: decimal(tail[0]),
        finalVelocity: decimal(tail[1]),
        exampleCartVelocity: decimal(example.cartVelocity),
        lastCourierVelocity: decimal(last.courierVelocity),
      }),
      t('studyAifg.velocity-matching.model.comparison.withoutEitherCapEach', {
        selectedDecay: decimal(1 - example.timeStep / example.responseTime),
        shortResponseDecay: decimal(1 - example.timeStep / example.shortResponseTime),
      }),
      t('studyAifg.velocity-matching.model.comparison.chosenRunLeavesMira', {
        lastCartPosition: decimal(last.cartPosition - last.courierPosition),
      }),
    ],
    note: t('studyAifg.velocity-matching.model.comparison.horizontalReferenceCartVelocity'),
  };
}

function runMoments(
  t: StudyTranslate,
  example: VelocityMatchingParameters,
  summary: VelocityMatchingSummary,
): readonly StudyMoment[] {
  const { capped, release, overshoot, initialStep, last } = summary;

  return [
    { label: t('studyAifg.velocity-matching.model.moments.cartAlreadyMoving'), step: 0 },
    capped >= 0
      ? {
          label: t('studyAifg.velocity-matching.model.moments.accelerationLimited'),
          step: Math.min(capped + 1, release > 0 ? release - 1 : example.steps),
        }
      : {
          label: t('studyAifg.velocity-matching.model.moments.closingVelocityGap'),
          step: Math.min(1, example.steps),
        },
    {
      label:
        overshoot >= 0
          ? t('studyAifg.velocity-matching.model.moments.paceOvershoots')
          : t('studyAifg.velocity-matching.model.moments.correctionEases'),
      step: overshoot >= 0 ? overshoot : initialStep,
    },
    {
      label:
        Math.abs(last.courierVelocity - example.cartVelocity) < 0.005
          ? t('studyAifg.velocity-matching.model.moments.samePaceBehind')
          : t('studyAifg.velocity-matching.model.moments.paceCorrecting'),
      step: example.steps,
    },
  ];
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  example: VelocityMatchingParameters,
  states: readonly VelocityMatchingState[],
): TimelineModel {
  return {
    title: t('studyAifg.velocity-matching.model.timeline.miraPaceAgainstCart'),
    xLabel: t('studyAifg.velocity-matching.model.labels.timeSeconds'),
    yLabel: t('studyAifg.velocity-matching.model.labels.velocity'),
    seconds: frames.map(({ seconds }) => seconds),
    reference: example.cartVelocity,
    series: [
      {
        id: 'courier',
        label: t('studyAifg.velocity-matching.model.labels.solidGreenMiraVelocity'),
        tone: 'actual',
        values: states.map(({ courierVelocity }) => courierVelocity),
      },
      {
        id: 'cart',
        label: t('studyAifg.velocity-matching.model.timeline.dashedAmberCartVelocity'),
        tone: 'desired',
        values: states.map(() => example.cartVelocity),
      },
    ],
  };
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'responseTime',
      label: t('studyAifg.velocity-matching.model.inputs.responseTime'),
      unit: t('studyAifg.velocity-matching.model.inputs.unitS'),
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    {
      name: 'maxAcceleration',
      label: t('studyAifg.velocity-matching.model.inputs.accelerationLimit'),
      unit: t('studyAifg.velocity-matching.model.inputs.unitUnitsS'),
      min: 1,
      max: 8,
      step: 0.5,
    },
  ];
}

export const present = (
  example: VelocityMatchingParameters,
  statesSamples: readonly VelocityMatchingSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const frames = statesSamples.map((sample, step) => frameOf(t, { example, sample, step }));
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const padding = example.radius * 4;
  const minX = Math.min(...ends) - padding;
  const maxX = Math.max(...ends) + padding;
  const height = Math.max((maxX - minX) / 2, padding * 4);
  const summary = describeMatching(example, statesSamples);

  return {
    family: 'motion',
    motion: {
      bounds: { minX, maxX, minY: -height / 2, maxY: height / 2 },
      frames,
      trail: true,
    },
    timeline: runTimeline(t, frames, example, states),
    initialStep: summary.initialStep,
    moments: runMoments(t, example, summary),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.velocity-matching.model.labels.solidGreenMiraVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.velocity-matching.model.labels.cartVelocityAtCourier'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.velocity-matching.model.labels.positionGapUnusedBehaviour'),
      },
    ],
    caption: t('studyAifg.velocity-matching.model.overview.caption', {
      exampleArrowSeconds: decimal(example.arrowSeconds),
    }),
    comparison: shortResponseComparison(t, states, example),
    inputs: runInputs(t),
  };
};
