import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal } from './presentation';
import {
  calculateVelocityMatchingStep,
  velocityMatchingFrames,
  type VelocityMatchingParameters,
  velocityMatchingSamples,
  type VelocityMatchingState,
  type VelocityMatchingStep,
} from './velocity-matching.simulation';

function workedStep(
  t: StudyTranslate,
  state: VelocityMatchingState,
  step: number,
  example: VelocityMatchingParameters,
  calculation: ReturnType<typeof calculateVelocityMatchingStep>,
): StudyWorkedStep {
  return {
    title: t('studyAifg.velocity-matching.model.workedMiraNextUpdate', {
      step: decimal(step * example.timeStep, 2, 0.005),
    }),
    lines: [
      t('studyAifg.velocity-matching.model.workedReadCartVelocityNot', {
        exampleCartVelocity: decimal(example.cartVelocity, 2, 0.005),
        stateCourierVelocity: decimal(state.courierVelocity, 2, 0.005),
        calculationVelocityGap: decimal(calculation.velocityGap, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedRequestAcceleration', {
        calculationVelocityGap: decimal(calculation.velocityGap, 2, 0.005),
        exampleResponseTime: decimal(example.responseTime, 2, 0.005),
        calculationRequestedAcceleration: decimal(calculation.requestedAcceleration, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedEngineLimitsMagnitudeUse', {
        exampleMaxAcceleration: decimal(example.maxAcceleration, 2, 0.005),
        calculationAcceleration: decimal(calculation.acceleration, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedUpdateVelocityLimited', {
        exampleMaxSpeed: decimal(example.maxSpeed, 2, 0.005),
        stateCourierVelocity: decimal(state.courierVelocity, 2, 0.005),
        calculationAcceleration: decimal(calculation.acceleration, 2, 0.005),
        exampleTimeStep: decimal(example.timeStep, 2, 0.005),
        nextCourierVelocity: decimal(calculation.next.courierVelocity, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedMoveMiraUpdatedVelocity', {
        stateCourierPosition: decimal(state.courierPosition, 2, 0.005),
        nextCourierVelocity: decimal(calculation.next.courierVelocity, 2, 0.005),
        exampleTimeStep: decimal(example.timeStep, 2, 0.005),
        nextCourierPosition: decimal(calculation.next.courierPosition, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedMoveCartPrescribedVelocity', {
        stateCartPosition: decimal(state.cartPosition, 2, 0.005),
        exampleCartVelocity: decimal(example.cartVelocity, 2, 0.005),
        exampleTimeStep: decimal(example.timeStep, 2, 0.005),
        nextCartPosition: decimal(calculation.next.cartPosition, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.workedNextPositionGapNever', {
        nextCartPosition: decimal(
          calculation.next.cartPosition - calculation.next.courierPosition,
          2,
          0.005,
        ),
      }),
    ],
    note:
      Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
        ? t('studyAifg.velocity-matching.model.workedAccelerationCapActiveResponse')
        : t('studyAifg.velocity-matching.model.workedBelowAccelerationCapSpeed'),
  };
}

function frameNote(
  t: StudyTranslate,
  state: VelocityMatchingState,
  step: number,
  calculation: VelocityMatchingStep,
  example: VelocityMatchingParameters,
): string {
  if (step === 0) return t('studyAifg.velocity-matching.model.phaseCartAlreadyMovingMira');
  if (state.courierVelocity >= example.maxSpeed && example.cartVelocity > example.maxSpeed)
    return t('studyAifg.velocity-matching.model.phaseMiraReachedHerSpeed');
  if (Math.abs(calculation.velocityGap) < 0.005)
    return t('studyAifg.velocity-matching.model.phaseMiraNearlyMatchesCart');
  if (calculation.velocityGap < 0)
    return t('studyAifg.velocity-matching.model.phaseMiraMovingFasterCart');
  if (calculation.next.courierVelocity > example.cartVelocity)
    return t('studyAifg.velocity-matching.model.phaseMiraSlowerCorrectionSends');
  return Math.abs(calculation.requestedAcceleration) > example.maxAcceleration
    ? t('studyAifg.velocity-matching.model.phaseMiraAcceleratesHerLimit')
    : t('studyAifg.velocity-matching.model.phaseMiraEasesHerAcceleration');
}

function frameOf(
  t: StudyTranslate,
  state: VelocityMatchingState,
  step: number,
  example: VelocityMatchingParameters,
  calculation: ReturnType<typeof calculateVelocityMatchingStep>,
): MotionFrame {
  const lane = example.radius * 5;
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'mira',
        label: t('studyAifg.velocity-matching.model.mira'),
        x: state.courierPosition,
        y: 0,
        tone: 'subject',
      },
      {
        id: 'cart',
        label: t('studyAifg.velocity-matching.model.cart'),
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
      seconds: decimal(step * example.timeStep, 2, 0.005),
      courierPosition: decimal(state.courierPosition, 2, 0.005),
      cartPosition: decimal(state.cartPosition, 2, 0.005),
      courierVelocity: decimal(state.courierVelocity, 2, 0.005),
      cartVelocity: decimal(example.cartVelocity, 2, 0.005),
      positionGap: decimal(state.cartPosition - state.courierPosition, 2, 0.005),
      velocityGap: decimal(calculation.velocityGap, 2, 0.005),
      responseTime: decimal(example.responseTime, 2, 0.005),
      requestedAcceleration: decimal(calculation.requestedAcceleration, 2, 0.005),
      acceleration: decimal(calculation.acceleration, 2, 0.005),
      maxAcceleration: decimal(example.maxAcceleration, 2, 0.005),
      timeStep: decimal(example.timeStep, 2, 0.005),
      nextVelocity: decimal(calculation.next.courierVelocity, 2, 0.005),
      nextPosition: decimal(calculation.next.courierPosition, 2, 0.005),
      errorMultiplier: decimal(1 - example.timeStep / example.responseTime, 2, 0.005),
      arrowSeconds: decimal(example.arrowSeconds, 2, 0.005),
      shortResponseTime: decimal(example.shortResponseTime, 2, 0.005),
    },
    note: frameNote(t, state, step, calculation, example),
    worked: workedStep(t, state, step, example, calculation),
  };
}

function shortResponseComparison(
  t: StudyTranslate,
  states: readonly VelocityMatchingState[],
  example: VelocityMatchingParameters,
): NonNullable<MotionStudyModel['comparison']> {
  const shortSamples = velocityMatchingSamples(example, example.shortResponseTime);
  const short = shortSamples.map(({ state }) => state);
  const last = states[states.length - 1];
  const tail = short.slice(-2).map(({ courierVelocity }) => courierVelocity);
  const allVelocities = [...states, ...short].map(({ courierVelocity }) => courierVelocity);
  return {
    title: t('studyAifg.velocity-matching.model.quickCorrectionCanOvershoot'),
    intro:
      example.responseTime === example.shortResponseTime
        ? t('studyAifg.velocity-matching.model.tracesNowUseResponse', {
            exampleResponseTime: decimal(example.responseTime, 2, 0.005),
            exampleTimeStep: decimal(example.timeStep, 2, 0.005),
          })
        : t('studyAifg.velocity-matching.model.compareChosenResponseTime', {
            exampleResponseTime: decimal(example.responseTime, 2, 0.005),
            exampleShortResponseTime: decimal(example.shortResponseTime, 2, 0.005),
            exampleTimeStep: decimal(example.timeStep, 2, 0.005),
          }),
    timeline: {
      title: t('studyAifg.velocity-matching.model.miraVelocityTwoResponse'),
      xLabel: t('studyAifg.velocity-matching.model.timeSeconds'),
      yLabel: t('studyAifg.velocity-matching.model.velocity'),
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [Math.min(0, ...allVelocities), Math.max(example.cartVelocity, ...allVelocities)],
      reference: example.cartVelocity,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.velocity-matching.model.solidGreenChosenResponse', {
            exampleResponseTime: decimal(example.responseTime, 2, 0.005),
          }),
          tone: 'actual',
          values: states.map(({ courierVelocity }) => courierVelocity),
        },
        {
          id: 'short',
          label: t('studyAifg.velocity-matching.model.dashedAmberReferenceResponse', {
            exampleShortResponseTime: decimal(example.shortResponseTime, 2, 0.005),
          }),
          tone: 'desired',
          values: short.map(({ courierVelocity }) => courierVelocity),
        },
      ],
    },
    findings: [
      t('studyAifg.velocity-matching.model.referenceRunEndsSuccessive', {
        tail: decimal(tail[0], 2, 0.005),
        tail2: decimal(tail[1], 2, 0.005),
        exampleCartVelocity: decimal(example.cartVelocity, 2, 0.005),
        lastCourierVelocity: decimal(last.courierVelocity, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.withoutEitherCapEach', {
        value1: decimal(1 - example.timeStep / example.responseTime, 2, 0.005),
        value2: decimal(1 - example.timeStep / example.shortResponseTime, 2, 0.005),
      }),
      t('studyAifg.velocity-matching.model.chosenRunLeavesMira', {
        lastCartPosition: decimal(last.cartPosition - last.courierPosition, 2, 0.005),
      }),
    ],
    note: t('studyAifg.velocity-matching.model.horizontalReferenceCartVelocity'),
  };
}

function runMoments(
  t: StudyTranslate,
  capped: number,
  release: number,
  example: VelocityMatchingParameters,
  overshoot: number,
  initialStep: number,
  last: VelocityMatchingState,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.velocity-matching.model.cartAlreadyMoving'), step: 0 },
    capped >= 0
      ? {
          label: t('studyAifg.velocity-matching.model.accelerationLimited'),
          step: Math.min(capped + 1, release > 0 ? release - 1 : example.steps),
        }
      : {
          label: t('studyAifg.velocity-matching.model.closingVelocityGap'),
          step: Math.min(1, example.steps),
        },
    {
      label:
        overshoot >= 0
          ? t('studyAifg.velocity-matching.model.paceOvershoots')
          : t('studyAifg.velocity-matching.model.correctionEases'),
      step: overshoot >= 0 ? overshoot : initialStep,
    },
    {
      label:
        Math.abs(last.courierVelocity - example.cartVelocity) < 0.005
          ? t('studyAifg.velocity-matching.model.samePaceBehind')
          : t('studyAifg.velocity-matching.model.paceCorrecting'),
      step: example.steps,
    },
  ];
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  example: VelocityMatchingParameters,
  states: ReturnType<typeof velocityMatchingFrames>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.velocity-matching.model.miraPaceAgainstCart'),
    xLabel: t('studyAifg.velocity-matching.model.timeSeconds'),
    yLabel: t('studyAifg.velocity-matching.model.velocity'),
    seconds: frames.map(({ seconds }) => seconds),
    reference: example.cartVelocity,
    series: [
      {
        id: 'courier',
        label: t('studyAifg.velocity-matching.model.solidGreenMiraVelocity'),
        tone: 'actual',
        values: states.map(({ courierVelocity }) => courierVelocity),
      },
      {
        id: 'cart',
        label: t('studyAifg.velocity-matching.model.dashedAmberCartVelocity'),
        tone: 'desired',
        values: states.map(() => example.cartVelocity),
      },
    ],
  };
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'responseTime',
      label: t('studyAifg.velocity-matching.model.responseTime'),
      unit: t('studyAifg.velocity-matching.model.inputsUnitS'),
      min: 0.1,
      max: 1,
      step: 0.05,
    },
    {
      name: 'maxAcceleration',
      label: t('studyAifg.velocity-matching.model.accelerationLimit'),
      unit: t('studyAifg.velocity-matching.model.inputsUnitUnitsS'),
      min: 1,
      max: 8,
      step: 0.5,
    },
  ];
}

export const present = (
  example: VelocityMatchingParameters,
  statesSamples: ReturnType<typeof velocityMatchingSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(t, state, step, example, statesSamples[step].calculation),
  );
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const padding = example.radius * 4;
  const minX = Math.min(...ends) - padding;
  const maxX = Math.max(...ends) + padding;
  const height = Math.max((maxX - minX) / 2, padding * 4);
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
  return {
    family: 'motion',
    motion: {
      bounds: { minX, maxX, minY: -height / 2, maxY: height / 2 },
      frames,
      trail: true,
    },
    timeline: runTimeline(t, frames, example, states),
    initialStep,
    moments: runMoments(t, capped, release, example, overshoot, initialStep, last),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.velocity-matching.model.solidGreenMiraVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.velocity-matching.model.cartVelocityAtCourier'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.velocity-matching.model.positionGapUnusedBehaviour'),
      },
    ],
    caption: t('studyAifg.velocity-matching.model.caption', {
      exampleArrowSeconds: decimal(example.arrowSeconds, 2, 0.005),
    }),
    comparison: shortResponseComparison(t, states, example),
    inputs: runInputs(t),
  };
};
