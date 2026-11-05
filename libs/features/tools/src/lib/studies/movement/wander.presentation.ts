import {
  add,
  alongHeading,
  cosine,
  length,
  scale,
  sine,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal, vectorText } from './presentation';
import {
  type WanderParameters,
  wanderSamples,
  type WanderState,
  type WanderStep,
} from './wander.simulation';

function workedStep(
  t: StudyTranslate,
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): StudyWorkedStep {
  return {
    title: t('studyAifg.wander.model.workedNiaNextUpdate', {
      step: decimal(step * example.timeStep, 2, 0.005),
    }),
    lines: [
      t('studyAifg.wander.model.workedReadTapePair', {
        drawFirst: decimal(calculation.draw.first, 2, 0.005),
        drawSecond: decimal(calculation.draw.second, 2, 0.005),
        calculationBinomial: decimal(calculation.binomial, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedCarryAngleForwardWrap', {
        stateWanderAngle: decimal(state.wanderAngle, 2, 0.005),
        calculationBinomial: decimal(calculation.binomial, 2, 0.005),
        exampleTurnScale: decimal(example.turnScale, 2, 0.005),
        calculationAngle: decimal(calculation.angle, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedProjectCircleCentre', {
        statePosition: vectorText(state.position, 2, 0.005),
        exampleWanderOffset: decimal(example.wanderOffset, 2, 0.005),
        stateHeading: vectorText(state.heading, 2, 0.005),
        calculationCentre: vectorText(calculation.centre, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedRotateCosAngleSin', {
        exampleWanderRadius: decimal(example.wanderRadius, 2, 0.005),
        calculationTarget: vectorText(calculation.target, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedEngineWalkingSpeedPoint', {
        exampleMaxSpeed: decimal(example.maxSpeed, 2, 0.005),
        exampleWalkingFraction: decimal(example.walkingFraction, 2, 0.005),
        exampleMaxSpeed2: decimal(example.maxSpeed * example.walkingFraction, 2, 0.005),
        calculationDesired: vectorText(calculation.desired, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedRequestDesiredActualResponseTime', {
        calculationDesired: vectorText(calculation.desired, 2, 0.005),
        stateVelocity: vectorText(state.velocity, 2, 0.005),
        exampleResponseTime: decimal(example.responseTime, 2, 0.005),
        calculationRequestedAcceleration: vectorText(calculation.requestedAcceleration, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedEngineCapsAccelerationUse', {
        exampleMaxAcceleration: decimal(example.maxAcceleration, 2, 0.005),
        calculationAcceleration: vectorText(calculation.acceleration, 2, 0.005),
        stateVelocity: vectorText(state.velocity, 2, 0.005),
        exampleTimeStep: decimal(example.timeStep, 2, 0.005),
        nextVelocity: vectorText(calculation.next.velocity, 2, 0.005),
        exampleMaxSpeed: decimal(example.maxSpeed, 2, 0.005),
      }),
      t('studyAifg.wander.model.workedNewPositionFaceNew', {
        statePosition: vectorText(state.position, 2, 0.005),
        nextVelocity: vectorText(calculation.next.velocity, 2, 0.005),
        exampleTimeStep: decimal(example.timeStep, 2, 0.005),
        nextPosition: vectorText(calculation.next.position, 2, 0.005),
      }),
    ],
    note: t('studyAifg.wander.model.workedCircleTargetDescribePending'),
  };
}

function frameNote(
  t: StudyTranslate,
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): string {
  if (step === 0) return t('studyAifg.wander.model.phaseNiaSetsOffTowards');
  if (example.turnScale === 0) return t('studyAifg.wander.model.phaseNoAngularNudgesNia');
  if (Math.abs(calculation.desiredTurn) < 1e-8)
    return state.wanderAngle !== 0
      ? t('studyAifg.wander.model.phaseTargetReturnsAheadNia')
      : t('studyAifg.wander.model.phaseNiaKeepsHerCurrent');
  if (example.wanderRadius / example.wanderOffset < 0.15)
    return t('studyAifg.wander.model.phaseTargetStaysCloseNia');
  if (calculation.binomial === 0) return t('studyAifg.wander.model.phaseNoNewNudgeRemembered');
  return calculation.desiredTurn > 0
    ? t('studyAifg.wander.model.phaseTargetLiesNiaRight')
    : t('studyAifg.wander.model.phaseTargetLiesNiaLeft');
}

function frameValues(
  step: number,
  example: WanderParameters,
  state: WanderState,
  heading: number,
  calculation: WanderStep,
  targetRelation: string,
  target: Vec2,
): Readonly<Record<string, string>> {
  return {
    seconds: decimal(step * example.timeStep, 2, 0.005),
    x: decimal(state.position.x, 2, 0.005),
    y: decimal(state.position.y, 2, 0.005),
    heading: decimal(heading, 2, 0.005),
    headingX: decimal(state.heading.x, 2, 0.005),
    headingY: decimal(state.heading.y, 2, 0.005),
    velocityX: decimal(state.velocity.x, 2, 0.005),
    velocityY: decimal(state.velocity.y, 2, 0.005),
    speed: decimal(length(state.velocity), 2, 0.005),
    firstDraw: decimal(calculation.draw.first, 2, 0.005),
    secondDraw: decimal(calculation.draw.second, 2, 0.005),
    binomial: decimal(calculation.binomial, 2, 0.005),
    oldAngle: decimal(state.wanderAngle, 2, 0.005),
    angle: decimal(calculation.angle, 2, 0.005),
    turnScale: decimal(example.turnScale, 2, 0.005),
    centreX: decimal(calculation.centre.x, 2, 0.005),
    centreY: decimal(calculation.centre.y, 2, 0.005),
    targetX: decimal(calculation.target.x, 2, 0.005),
    targetY: decimal(calculation.target.y, 2, 0.005),
    wanderRadius: decimal(example.wanderRadius, 2, 0.005),
    wanderOffset: decimal(example.wanderOffset, 2, 0.005),
    walkingFraction: decimal(example.walkingFraction, 2, 0.005),
    walkingSpeed: decimal(example.maxSpeed * example.walkingFraction, 2, 0.005),
    maxSpeed: decimal(example.maxSpeed, 2, 0.005),
    desiredX: decimal(calculation.desired.x, 2, 0.005),
    desiredY: decimal(calculation.desired.y, 2, 0.005),
    responseTime: decimal(example.responseTime, 2, 0.005),
    maxAcceleration: decimal(example.maxAcceleration, 2, 0.005),
    accelerationX: decimal(calculation.acceleration.x, 2, 0.005),
    accelerationY: decimal(calculation.acceleration.y, 2, 0.005),
    timeStep: decimal(example.timeStep, 2, 0.005),
    nextX: decimal(calculation.next.position.x, 2, 0.005),
    nextY: decimal(calculation.next.position.y, 2, 0.005),
    desiredTurn: decimal(calculation.desiredTurn, 2, 0.005),
    actualTurn: decimal(calculation.actualTurn, 2, 0.005),
    arrowSeconds: decimal(example.arrowSeconds, 2, 0.005),
    narrowRadius: decimal(example.narrowRadius, 2, 0.005),
    targetRelation,
    targetDistance: decimal(length(target), 2, 0.005),
    desiredTurnMagnitude: decimal(Math.abs(calculation.desiredTurn), 2, 0.005),
    actualTurnMagnitude: decimal(Math.abs(calculation.actualTurn), 2, 0.005),
    velocityChange: decimal(length(subtract(calculation.desired, state.velocity)), 2, 0.005),
    requestedMagnitude: decimal(length(calculation.requestedAcceleration), 2, 0.005),
    accelerationMagnitude: decimal(length(calculation.acceleration), 2, 0.005),
    stepDistance: decimal(length(scale(calculation.next.velocity, example.timeStep)), 2, 0.005),
  };
}

function frameOf(
  t: StudyTranslate,
  state: WanderState,
  step: number,
  calculation: WanderStep,
  example: WanderParameters,
): MotionFrame {
  const heading = Math.atan2(state.heading.y, state.heading.x);
  // Keep Nia at the origin and her forward direction to the right as the patrol moves.
  const intoView = (vector: Vec2) =>
    alongHeading(vector, { x: state.heading.x, y: -state.heading.y });
  const centre = { x: example.wanderOffset, y: 0 };
  const target = add(
    centre,
    scale({ x: cosine(calculation.angle), y: sine(calculation.angle) }, example.wanderRadius),
  );
  const actual = intoView(state.velocity);
  const desired = intoView(calculation.desired);
  const targetRelation =
    Math.abs(calculation.desiredTurn) < 0.005
      ? t('studyAifg.wander.model.straightAhead')
      : calculation.desiredTurn > 0
        ? t('studyAifg.wander.model.aheadRight')
        : t('studyAifg.wander.model.aheadLeft');
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'nia',
        label: t('studyAifg.wander.model.nia'),
        x: 0,
        y: 0,
        heading: 0,
        tone: 'subject',
      },
    ],
    zones: [{ ...centre, radius: example.wanderRadius, tone: 'zone' }],
    marks: [
      { ...centre, shape: 'dot', tone: 'muted' },
      {
        ...target,
        label: t('studyAifg.wander.model.target'),
        shape: 'cross',
        tone: 'target',
      },
    ],
    links: [
      { from: { x: 0, y: 0 }, to: centre, tone: 'muted' },
      { from: centre, to: target, tone: 'target' },
    ],
    vectors: [
      {
        x: 0,
        y: 0,
        dx: actual.x * example.arrowSeconds,
        dy: actual.y * example.arrowSeconds,
        tone: 'actual',
      },
      {
        x: 0,
        y: 0,
        dx: desired.x * example.arrowSeconds,
        dy: desired.y * example.arrowSeconds,
        tone: 'desired',
      },
    ],
    values: frameValues(step, example, state, heading, calculation, targetRelation, target),
    note: frameNote(t, state, step, calculation, example),
    worked: workedStep(t, state, step, calculation, example),
  };
}

function narrowCircleComparison(
  t: StudyTranslate,
  states: readonly WanderState[],
  example: WanderParameters,
): NonNullable<MotionStudyModel['comparison']> {
  const narrowSamples = wanderSamples(example, example.narrowRadius);
  const narrow = narrowSamples.map(({ state }) => state);
  const spread = (run: readonly WanderState[]) => {
    const ys = run.map(({ position }) => position.y);
    return Math.max(...ys) - Math.min(...ys);
  };
  return {
    title: t('studyAifg.wander.model.howMuchSidewaysMovement'),
    intro:
      example.wanderRadius === example.narrowRadius
        ? t('studyAifg.wander.model.tracesNowUseRadius', {
            exampleWanderRadius: decimal(example.wanderRadius, 2, 0.005),
          })
        : t('studyAifg.wander.model.compareChosenCircleRadius', {
            exampleWanderRadius: decimal(example.wanderRadius, 2, 0.005),
            exampleNarrowRadius: decimal(example.narrowRadius, 2, 0.005),
          }),
    timeline: {
      title: t('studyAifg.wander.model.sidewaysPositionGallery'),
      xLabel: t('studyAifg.wander.model.timeSeconds'),
      yLabel: t('studyAifg.wander.model.worldY'),
      seconds: states.map((_state, step) => step * example.timeStep),
      series: [
        {
          id: 'normal',
          label: t('studyAifg.wander.model.solidGreenChosenRadius', {
            exampleWanderRadius: decimal(example.wanderRadius, 2, 0.005),
          }),
          tone: 'actual',
          values: states.map(({ position }) => position.y),
        },
        {
          id: 'narrow',
          label: t('studyAifg.wander.model.dashedAmberReferenceRadius', {
            exampleNarrowRadius: decimal(example.narrowRadius, 2, 0.005),
          }),
          tone: 'desired',
          values: narrow.map(({ position }) => position.y),
        },
      ],
    },
    findings: [
      t('studyAifg.wander.model.overSidewaysRangeChosen', {
        exampleSteps: decimal(example.steps * example.timeStep, 2, 0.005),
        value2: decimal(spread(states), 2, 0.005),
        value3: decimal(spread(narrow), 2, 0.005),
      }),
      t('studyAifg.wander.model.smallRadiusBesideLong'),
      t('studyAifg.wander.model.repeatablePathsScriptedTape'),
    ],
    note: t('studyAifg.wander.model.comparisonUsesWorldPositions'),
  };
}

function runMoments(
  t: StudyTranslate,
  peak: number,
  example: WanderParameters,
  negative: number,
  returned: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.wander.model.forwardTarget'), step: 0 },
    peak > 0
      ? { label: t('studyAifg.wander.model.targetDriftsAside'), step: peak }
      : {
          label: t('studyAifg.wander.model.walkingStraight'),
          step: Math.floor(example.steps / 4),
        },
    negative >= 0
      ? { label: t('studyAifg.wander.model.targetCrossesHeading'), step: negative }
      : {
          label: t('studyAifg.wander.model.sameHeading'),
          step: Math.floor(example.steps / 2),
        },
    negative >= 0 && returned >= 0
      ? { label: t('studyAifg.wander.model.relativeAngleReturns'), step: returned }
      : {
          label: t('studyAifg.wander.model.stillStraightAheadMoment'),
          step: Math.floor((example.steps * 3) / 4),
        },
    { label: t('studyAifg.wander.model.patrolContinues'), step: example.steps },
  ];
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  calculations: WanderStep[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.wander.model.turnRequestedTurnMade'),
    xLabel: t('studyAifg.wander.model.timeSeconds'),
    yLabel: t('studyAifg.wander.model.turnCurrentHeadingRadians'),
    seconds: frames.map(({ seconds }) => seconds),
    reference: 0,
    series: [
      {
        id: 'actual-turn',
        label: t('studyAifg.wander.model.solidGreenTurnMade'),
        tone: 'actual',
        values: calculations.map(({ actualTurn }) => actualTurn),
      },
      {
        id: 'desired-turn',
        label: t('studyAifg.wander.model.dashedAmberBearingCircle'),
        tone: 'desired',
        values: calculations.map(({ desiredTurn }) => desiredTurn),
      },
    ],
  };
}

export const present = (
  example: WanderParameters,
  statesSamples: ReturnType<typeof wanderSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const frames = states.map((state, step) => frameOf(t, state, step, calculations[step], example));
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).flatMap(({ x, y, dx, dy }) => [
      { x, y },
      { x: x + dx, y: y + dy },
    ]),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
  ]);
  const padding = example.radius * 1.5;
  const minX = Math.min(...points.map(({ x }) => x)) - padding;
  const maxX = Math.max(...points.map(({ x }) => x)) + padding;
  const lowY = Math.min(...points.map(({ y }) => y)) - padding;
  const highY = Math.max(...points.map(({ y }) => y)) + padding;
  const height = highY - lowY;
  const width = Math.max(maxX - minX, height * 1.5);
  const midX = (minX + maxX) / 2;
  const peak = calculations.reduce(
    (best, calculation, step) =>
      Math.abs(calculation.angle) > Math.abs(calculations[best].angle) ? step : best,
    0,
  );
  const negative = calculations.findIndex(({ angle }) => angle < 0);
  const returned = calculations.findIndex(({ angle }, step) => step > negative && angle === 0);
  return {
    family: 'motion',
    motion: {
      bounds: { minX: midX - width / 2, maxX: midX + width / 2, minY: lowY, maxY: highY },
      frames,
      trail: false,
    },
    timeline: runTimeline(t, frames, calculations),
    initialStep: peak,
    moments: runMoments(t, peak, example, negative, returned),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.wander.model.solidGreenCurrentVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.wander.model.dashedAmberDesiredVelocity'),
      },
    ],
    caption: t('studyAifg.wander.model.caption', {
      exampleArrowSeconds: decimal(example.arrowSeconds, 2, 0.005),
    }),
    comparison: narrowCircleComparison(t, states, example),
    inputs: [
      {
        name: 'wanderRadius',
        label: t('studyAifg.wander.model.circleRadius'),
        unit: t('studyAifg.wander.model.inputsUnitUnits'),
        min: 0.5,
        max: 5,
        step: 0.5,
      },
      {
        name: 'turnScale',
        label: t('studyAifg.wander.model.angleNudgeScale'),
        unit: t('studyAifg.wander.model.radUpdate'),
        min: 0,
        max: 1.2,
        step: 0.1,
      },
    ],
  };
};
