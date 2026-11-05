import { distance, dot, length } from '@dotln-angular/scene-engine';

import type {
  MotionBody,
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  calculateCollisionAvoidanceStep,
  type ClosestApproach,
  type CollisionAvoidanceParameters,
  collisionAvoidanceSamples,
  type CollisionAvoidanceStep,
  type CollisionState,
  minimumCollisionSeparation,
} from './collision-avoidance.simulation';
import { boundsOfPoints, fixed, pair } from './presentation';

function decision(
  state: CollisionState,
  step: CollisionAvoidanceStep,
  example: CollisionAvoidanceParameters,
  t: StudyTranslate,
) {
  const contact = example.courierRadius + example.porterRadius;
  if (distance(state.courier.position, state.porter.position) < contact)
    return t('studyAifg.collision-avoidance.model.decision.descriptions.bodiesOverlapEngineReacts');
  if (step.prediction.time === null)
    return t('studyAifg.collision-avoidance.model.decision.descriptions.equalVelocitiesGiveNo');
  if (step.prediction.time <= 0)
    return t('studyAifg.collision-avoidance.model.decision.descriptions.closestApproachNowPast');
  if (step.prediction.time >= example.predictionHorizon)
    return t(
      'studyAifg.collision-avoidance.model.decision.descriptions.closestApproachOutsideEngine',
    );
  if (step.prediction.separation >= contact)
    return t(
      'studyAifg.collision-avoidance.model.decision.descriptions.constantVelocityProjectionClears',
    );
  return length(step.acceleration) === 0
    ? t('studyAifg.collision-avoidance.model.decision.descriptions.predictedCentresCoincideExactly')
    : t('studyAifg.collision-avoidance.model.decision.descriptions.futureCollisionPredictedEngine');
}

function workedStep(
  state: CollisionState,
  calculation: CollisionAvoidanceStep,
  seconds: number,
  example: CollisionAvoidanceParameters,
  t: StudyTranslate,
): StudyWorkedStep {
  const prediction = calculation.prediction;
  return {
    title: t('studyAifg.collision-avoidance.model.workedStep.title', { seconds: fixed(seconds) }),
    lines: [
      t('studyAifg.collision-avoidance.model.workedStep.steps.relativePositionR', {
        porterPosition: pair(state.porter.position),
        courierPosition: pair(state.courier.position),
        predictionRelativePosition: pair(prediction.relativePosition),
      }),
      t('studyAifg.collision-avoidance.model.workedStep.steps.relativeVelocityV', {
        porterVelocity: pair(state.porter.velocity),
        courierVelocity: pair(state.courier.velocity),
        predictionRelativeVelocity: pair(prediction.relativeVelocity),
      }),
      prediction.time === null
        ? t('studyAifg.collision-avoidance.model.workedStep.steps.vVNoUnique')
        : t('studyAifg.collision-avoidance.model.workedStep.steps.tRVV', {
            dot: fixed(dot(prediction.relativePosition, prediction.relativeVelocity)),
            predictionRelativeSpeedSquared: fixed(prediction.relativeSpeedSquared),
            predictionTime: fixed(prediction.time),
          }),
      t('studyAifg.collision-avoidance.model.workedStep.steps.projectedCentresGapContact', {
        predictionCourierProjection: pair(prediction.courierProjection),
        predictionPorterProjection: pair(prediction.porterProjection),
        predictionSeparation: fixed(prediction.separation),
        courierRadiusPorterRadius: fixed(example.courierRadius + example.porterRadius),
      }),
      t('studyAifg.collision-avoidance.model.workedStep.steps.engineAvoidReturnsNext', {
        acceleration: pair(calculation.acceleration),
        courierVelocity: pair(state.courier.velocity),
        timeStep: fixed(example.timeStep),
        maxSpeed: fixed(example.maxSpeed),
        nextCourierVelocity: pair(calculation.next.courier.velocity),
      }),
      t('studyAifg.collision-avoidance.model.workedStep.steps.nextCourierPosition', {
        courierPosition: pair(state.courier.position),
        nextCourierVelocity: pair(calculation.next.courier.velocity),
        timeStep: fixed(example.timeStep),
        nextCourierPosition: pair(calculation.next.courier.position),
      }),
    ],
    note: t('studyAifg.collision-avoidance.model.workedStep.note', {
      decision: decision(state, calculation, example, t),
    }),
  };
}

function frameValues(
  example: CollisionAvoidanceParameters,
  seconds: number,
  state: CollisionState,
  calculation: CollisionAvoidanceStep,
  t: StudyTranslate,
): MotionFrame['values'] {
  const prediction = calculation.prediction;
  const contact = example.courierRadius + example.porterRadius;
  return {
    ...Object.fromEntries(Object.entries(example).map(([name, value]) => [name, String(value)])),
    seconds: fixed(seconds),
    courierPosition: pair(state.courier.position),
    courierVelocity: pair(state.courier.velocity),
    porterPosition: pair(state.porter.position),
    porterVelocity: pair(state.porter.velocity),
    currentSeparation: fixed(distance(state.courier.position, state.porter.position)),
    closestTime:
      prediction.time === null
        ? t(
            'studyAifg.collision-avoidance.model.frames.values.closestTimeCases.undefinedEqualVelocities',
          )
        : t('studyAifg.collision-avoidance.model.frames.values.closestTimeCases.predictionTime', {
            predictionTime: fixed(prediction.time),
            timeRelation:
              prediction.time > 0
                ? t('studyAifg.collision-avoidance.model.frames.values.closestTimeCases.ahead')
                : prediction.time < 0
                  ? t('studyAifg.collision-avoidance.model.frames.values.closestTimeCases.past')
                  : t('studyAifg.collision-avoidance.model.frames.values.closestTimeCases.now'),
          }),
    courierProjection: pair(prediction.courierProjection),
    porterProjection: pair(prediction.porterProjection),
    predictedSeparation: fixed(prediction.separation),
    contactDistance: fixed(contact),
    acceleration: pair(calculation.acceleration),
    decision: decision(state, calculation, example, t),
  };
}

function frameDrawing(
  state: CollisionState,
  t: StudyTranslate,
  example: CollisionAvoidanceParameters,
  prediction: ClosestApproach,
  calculation: CollisionAvoidanceStep,
): Pick<MotionFrame, 'bodies' | 'zones' | 'marks' | 'links' | 'vectors'> {
  return {
    bodies: [
      {
        id: 'courier',
        ...state.courier.position,
        tone: 'subject',
        label: t('studyAifg.collision-avoidance.model.frames.bodies.labels.courier'),
      },
      {
        id: 'porter',
        ...state.porter.position,
        tone: 'other',
        label: t('studyAifg.collision-avoidance.model.frames.bodies.labels.porter'),
      },
    ],
    zones: [
      { ...state.courier.position, radius: example.courierRadius, tone: 'subject' },
      { ...state.porter.position, radius: example.porterRadius, tone: 'other' },
    ],
    marks: [
      { ...prediction.courierProjection, shape: 'cross', tone: 'desired' },
      { ...prediction.porterProjection, shape: 'cross', tone: 'desired' },
    ],
    links: [
      { from: state.courier.position, to: prediction.courierProjection, tone: 'muted' },
      { from: state.porter.position, to: prediction.porterProjection, tone: 'muted' },
      { from: prediction.courierProjection, to: prediction.porterProjection, tone: 'desired' },
    ],
    vectors: [
      {
        ...state.courier.position,
        dx: state.courier.velocity.x * example.velocitySeconds,
        dy: state.courier.velocity.y * example.velocitySeconds,
        tone: 'actual',
      },
      {
        ...state.porter.position,
        dx: state.porter.velocity.x * example.velocitySeconds,
        dy: state.porter.velocity.y * example.velocitySeconds,
        tone: 'other',
      },
      {
        ...state.courier.position,
        dx: calculation.acceleration.x * example.accelerationSecondsSquared,
        dy: calculation.acceleration.y * example.accelerationSecondsSquared,
        tone: 'desired',
      },
    ],
  };
}

function frameOf(
  state: CollisionState,
  example: CollisionAvoidanceParameters,
  seconds: number,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateCollisionAvoidanceStep>,
): MotionFrame {
  const prediction = calculation.prediction;
  return {
    seconds: seconds,
    values: frameValues(example, seconds, state, calculation, t),
    ...frameDrawing(state, t, example, prediction, calculation),
    note: decision(state, calculation, example, t),
    worked: workedStep(state, calculation, seconds, example, t),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  contact: number,
  example: CollisionAvoidanceParameters,
  separations: number[],
  comparison: readonly CollisionState[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.collision-avoidance.model.comparison.timeline.title'),
    xLabel: t('studyAifg.collision-avoidance.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.collision-avoidance.model.comparison.timeline.yLabel'),
    seconds,
    reference: contact,
    series: [
      {
        id: 'main',
        label: t('studyAifg.collision-avoidance.model.comparison.timeline.series.labels.porterY', {
          porterStartY: example.porterStartY,
        }),
        tone: 'actual',
        values: separations,
      },
      {
        id: 'head-on',
        label: t('studyAifg.collision-avoidance.model.comparison.timeline.series.labels.porterY2', {
          comparisonPorterY: example.comparisonPorterY,
        }),
        tone: 'other',
        values: comparison.map((state) => distance(state.courier.position, state.porter.position)),
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: CollisionAvoidanceParameters,
  seconds: number[],
  states: readonly CollisionState[],
  separations: number[],
  comparison: readonly CollisionState[],
): NonNullable<MotionStudyModel['comparison']> {
  const contact = example.courierRadius + example.porterRadius;
  const mainMinimum = minimumCollisionSeparation(states);
  const otherMinimum = minimumCollisionSeparation(comparison);
  return {
    title: t('studyAifg.collision-avoidance.model.comparison.title'),
    intro: t('studyAifg.collision-avoidance.model.comparison.intro', {
      porterStartY: example.porterStartY,
      comparisonPorterY: example.comparisonPorterY,
    }),
    timeline: comparisonTimeline(t, seconds, contact, example, separations, comparison),
    findings: [
      t('studyAifg.collision-avoidance.model.comparison.findings.mainRunMinimumGap', {
        mainMinimum: fixed(mainMinimum),
        contact: fixed(contact),
      }),
      t('studyAifg.collision-avoidance.model.comparison.findings.changedRunMinimumGap', {
        otherMinimum: fixed(otherMinimum),
        contactResult:
          otherMinimum < contact
            ? t('studyAifg.collision-avoidance.model.comparison.findings.bodiesOverlap')
            : t('studyAifg.collision-avoidance.model.comparison.findings.bodiesRemainApart'),
      }),
      ...(example.porterStartY === example.comparisonPorterY
        ? [t('studyAifg.collision-avoidance.model.comparison.findings.bothOffsetsEqualSo')]
        : []),
    ],
    note: t('studyAifg.collision-avoidance.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  contact: number,
  separations: number[],
  predictions: ClosestApproach[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.collision-avoidance.model.timeline.title'),
    xLabel: t('studyAifg.collision-avoidance.model.timeline.xLabel'),
    yLabel: t('studyAifg.collision-avoidance.model.timeline.yLabel'),
    seconds,
    reference: contact,
    series: [
      {
        id: 'current',
        label: t('studyAifg.collision-avoidance.model.timeline.series.labels.currentGap'),
        tone: 'actual',
        values: separations,
      },
      {
        id: 'predicted',
        label: t('studyAifg.collision-avoidance.model.timeline.series.labels.closestApproachGap'),
        tone: 'desired',
        values: predictions.map((prediction) => prediction.separation),
      },
    ],
  };
}

function motionOf(
  points: (
    | MotionBody
    | MotionMark
    | {
        x: number;
        y: number;
      }
  )[],
  padding: number,
  frames: readonly MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: boundsOfPoints(points, padding),
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  cleared: number,
  nearest: number,
  passed: number,
  states: readonly CollisionState[],
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.collision-avoidance.model.moments.labels.predictThreat'), step: 0 },
    {
      label: t('studyAifg.collision-avoidance.model.moments.labels.projectionClears'),
      step: cleared < 0 ? nearest : cleared,
    },
    {
      label: t('studyAifg.collision-avoidance.model.moments.labels.nearestActualPass'),
      step: nearest,
    },
    {
      label: t('studyAifg.collision-avoidance.model.moments.labels.closestApproachPast'),
      step: passed < 0 ? states.length - 1 : passed,
    },
  ];
}

function legendOf(
  t: StudyTranslate,
  example: CollisionAvoidanceParameters,
): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.collision-avoidance.model.legend.labels.courierRadius'),
    },
    {
      tone: 'other',
      label: t('studyAifg.collision-avoidance.model.legend.labels.coastingPorterRadius'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.collision-avoidance.model.legend.labels.courierVelocity', {
        velocitySeconds: example.velocitySeconds,
      }),
    },
    {
      tone: 'desired',
      label: t('studyAifg.collision-avoidance.model.legend.labels.closestProjectionsAcceleration', {
        accelerationSecondsSquared: example.accelerationSecondsSquared,
      }),
    },
    {
      tone: 'muted',
      label: t('studyAifg.collision-avoidance.model.legend.labels.constantVelocityProjectionLinks'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'porterStartY',
      label: t('studyAifg.collision-avoidance.model.inputs.labels.porterLateralOffset'),
      unit: t('studyAifg.collision-avoidance.model.inputs.units.distance'),
      min: 0,
      max: 4,
      step: 0.25,
    },
  ];
}

export function presentStudy(
  example: CollisionAvoidanceParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = collisionAvoidanceSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const comparisonSamples = collisionAvoidanceSamples(example, example.comparisonPorterY);
  const comparison = comparisonSamples.map(({ state }) => state);
  const contact = example.courierRadius + example.porterRadius;
  const seconds = states.map((_state, index) => index * example.timeStep);
  const separations = states.map((state) =>
    distance(state.courier.position, state.porter.position),
  );
  const predictions = statesSamples.map(({ calculation }) => calculation.prediction);
  const frames: readonly MotionFrame[] = states.map((state, index) =>
    frameOf(state, example, seconds[index], t, statesSamples[index].calculation),
  );
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const padding = 3 * Math.max(example.courierRadius, example.porterRadius);
  const nearest = separations.indexOf(Math.min(...separations));
  const cleared = predictions.findIndex(
    (prediction) => prediction.separation >= contact && (prediction.time ?? 0) > 0,
  );
  const passed = predictions.findIndex(
    (prediction) => prediction.time !== null && prediction.time <= 0,
  );
  return {
    family: 'motion',
    initialStep: 0,
    motion: motionOf(points, padding, frames),
    timeline: timelineOf(t, seconds, contact, separations, predictions),
    moments: momentsOf(t, cleared, nearest, passed, states),
    legend: legendOf(t, example),
    caption: t('studyAifg.collision-avoidance.model.caption'),
    comparison: comparisonOf(t, example, seconds, states, separations, comparison),
    inputs: inputsOf(t),
  };
}
