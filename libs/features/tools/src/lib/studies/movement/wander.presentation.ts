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

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type WanderParameters,
  type WanderSample,
  wanderSamples,
  type WanderState,
  type WanderStep,
} from './wander.simulation';

const { number: decimal, vector: vectorText } = createNumberFormat({ zeroThreshold: 0.005 });

function selectMoments(calculations: readonly WanderStep[]): WanderMoments {
  const peak = calculations.reduce(
    (best, calculation, step) =>
      Math.abs(calculation.angle) > Math.abs(calculations[best].angle) ? step : best,
    0,
  );
  const negative = calculations.findIndex(({ angle }) => angle < 0);
  const returned = calculations.findIndex(({ angle }, step) => step > negative && angle === 0);

  return { peak, negative, returned };
}

function describeFrame(
  t: StudyTranslate,
  example: WanderParameters,
  sample: WanderSample,
  step: number,
): WanderFrameDescription {
  const { state, calculation } = sample;

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
      ? t('studyAifg.wander.model.labels.straightAhead')
      : calculation.desiredTurn > 0
        ? t('studyAifg.wander.model.labels.aheadRight')
        : t('studyAifg.wander.model.labels.aheadLeft');

  return { example, sample, step, heading, centre, target, actual, desired, targetRelation };
}

interface WanderFrameDescription {
  readonly example: WanderParameters;
  readonly sample: WanderSample;
  readonly step: number;
  readonly heading: number;
  readonly centre: Vec2;
  readonly target: Vec2;
  readonly actual: Vec2;
  readonly desired: Vec2;
  readonly targetRelation: string;
}
interface WanderMoments {
  readonly peak: number;
  readonly negative: number;
  readonly returned: number;
}

function workedStep(t: StudyTranslate, frame: WanderFrameDescription): StudyWorkedStep {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  return {
    title: t('studyAifg.wander.model.worked.niaNextUpdate', {
      step: decimal(step * example.timeStep),
    }),
    lines: [
      t('studyAifg.wander.model.worked.readTapePair', {
        drawFirst: decimal(calculation.draw.first),
        drawSecond: decimal(calculation.draw.second),
        calculationBinomial: decimal(calculation.binomial),
      }),
      t('studyAifg.wander.model.worked.carryAngleForwardWrap', {
        stateWanderAngle: decimal(state.wanderAngle),
        calculationBinomial: decimal(calculation.binomial),
        exampleTurnScale: decimal(example.turnScale),
        calculationAngle: decimal(calculation.angle),
      }),
      t('studyAifg.wander.model.worked.projectCircleCentre', {
        statePosition: vectorText(state.position),
        exampleWanderOffset: decimal(example.wanderOffset),
        stateHeading: vectorText(state.heading),
        calculationCentre: vectorText(calculation.centre),
      }),
      t('studyAifg.wander.model.worked.rotateCosAngleSin', {
        exampleWanderRadius: decimal(example.wanderRadius),
        calculationTarget: vectorText(calculation.target),
      }),
      t('studyAifg.wander.model.worked.engineWalkingSpeedPoint', {
        exampleMaxSpeed: decimal(example.maxSpeed),
        exampleWalkingFraction: decimal(example.walkingFraction),
        walkingSpeed: decimal(example.maxSpeed * example.walkingFraction),
        calculationDesired: vectorText(calculation.desired),
      }),
      t('studyAifg.wander.model.worked.requestDesiredActualResponseTime', {
        calculationDesired: vectorText(calculation.desired),
        stateVelocity: vectorText(state.velocity),
        exampleResponseTime: decimal(example.responseTime),
        calculationRequestedAcceleration: vectorText(calculation.requestedAcceleration),
      }),
      t('studyAifg.wander.model.worked.engineCapsAccelerationUse', {
        exampleMaxAcceleration: decimal(example.maxAcceleration),
        calculationAcceleration: vectorText(calculation.acceleration),
        stateVelocity: vectorText(state.velocity),
        exampleTimeStep: decimal(example.timeStep),
        nextVelocity: vectorText(calculation.next.velocity),
        exampleMaxSpeed: decimal(example.maxSpeed),
      }),
      t('studyAifg.wander.model.worked.newPositionFaceNew', {
        statePosition: vectorText(state.position),
        nextVelocity: vectorText(calculation.next.velocity),
        exampleTimeStep: decimal(example.timeStep),
        nextPosition: vectorText(calculation.next.position),
      }),
    ],
    note: t('studyAifg.wander.model.worked.circleTargetDescribePending'),
  };
}

function frameNote(t: StudyTranslate, frame: WanderFrameDescription): string {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  if (step === 0) return t('studyAifg.wander.model.phase.niaSetsOffTowards');
  if (example.turnScale === 0) return t('studyAifg.wander.model.phase.noAngularNudgesNia');
  if (Math.abs(calculation.desiredTurn) < 1e-8)
    return state.wanderAngle !== 0
      ? t('studyAifg.wander.model.phase.targetReturnsAheadNia')
      : t('studyAifg.wander.model.phase.niaKeepsHerCurrent');
  if (example.wanderRadius / example.wanderOffset < 0.15)
    return t('studyAifg.wander.model.phase.targetStaysCloseNia');
  if (calculation.binomial === 0) return t('studyAifg.wander.model.phase.noNewNudgeRemembered');
  return calculation.desiredTurn > 0
    ? t('studyAifg.wander.model.phase.targetLiesNiaRight')
    : t('studyAifg.wander.model.phase.targetLiesNiaLeft');
}

function frameValues(frame: WanderFrameDescription): StudyValues {
  const {
    example,
    step,
    heading,
    targetRelation,
    target,
    sample: { state, calculation },
  } = frame;

  return {
    seconds: decimal(step * example.timeStep),
    x: decimal(state.position.x),
    y: decimal(state.position.y),
    heading: decimal(heading),
    headingX: decimal(state.heading.x),
    headingY: decimal(state.heading.y),
    velocityX: decimal(state.velocity.x),
    velocityY: decimal(state.velocity.y),
    speed: decimal(length(state.velocity)),
    firstDraw: decimal(calculation.draw.first),
    secondDraw: decimal(calculation.draw.second),
    binomial: decimal(calculation.binomial),
    oldAngle: decimal(state.wanderAngle),
    angle: decimal(calculation.angle),
    turnScale: decimal(example.turnScale),
    centreX: decimal(calculation.centre.x),
    centreY: decimal(calculation.centre.y),
    targetX: decimal(calculation.target.x),
    targetY: decimal(calculation.target.y),
    wanderRadius: decimal(example.wanderRadius),
    wanderOffset: decimal(example.wanderOffset),
    walkingFraction: decimal(example.walkingFraction),
    walkingSpeed: decimal(example.maxSpeed * example.walkingFraction),
    maxSpeed: decimal(example.maxSpeed),
    desiredX: decimal(calculation.desired.x),
    desiredY: decimal(calculation.desired.y),
    responseTime: decimal(example.responseTime),
    maxAcceleration: decimal(example.maxAcceleration),
    accelerationX: decimal(calculation.acceleration.x),
    accelerationY: decimal(calculation.acceleration.y),
    timeStep: decimal(example.timeStep),
    nextX: decimal(calculation.next.position.x),
    nextY: decimal(calculation.next.position.y),
    desiredTurn: decimal(calculation.desiredTurn),
    actualTurn: decimal(calculation.actualTurn),
    arrowSeconds: decimal(example.arrowSeconds),
    narrowRadius: decimal(example.narrowRadius),
    targetRelation,
    targetDistance: decimal(length(target)),
    desiredTurnMagnitude: decimal(Math.abs(calculation.desiredTurn)),
    actualTurnMagnitude: decimal(Math.abs(calculation.actualTurn)),
    velocityChange: decimal(length(subtract(calculation.desired, state.velocity))),
    requestedMagnitude: decimal(length(calculation.requestedAcceleration)),
    accelerationMagnitude: decimal(length(calculation.acceleration)),
    stepDistance: decimal(length(scale(calculation.next.velocity, example.timeStep))),
  };
}

function frameOf(t: StudyTranslate, frame: WanderFrameDescription): MotionFrame {
  const { example, step, centre, target, actual, desired } = frame;
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'nia',
        label: t('studyAifg.wander.model.labels.nia'),
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
        label: t('studyAifg.wander.model.labels.target'),
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
    values: frameValues(frame),
    note: frameNote(t, frame),
    worked: workedStep(t, frame),
  };
}

function narrowCircleComparison(
  t: StudyTranslate,
  states: readonly WanderState[],
  example: WanderParameters,
): StudyComparison {
  const narrowSamples = wanderSamples(example, example.narrowRadius);
  const narrow = narrowSamples.map(({ state }) => state);
  const spread = (run: readonly WanderState[]) => {
    const ys = run.map(({ position }) => position.y);
    return Math.max(...ys) - Math.min(...ys);
  };
  return {
    title: t('studyAifg.wander.model.comparison.howMuchSidewaysMovement'),
    intro:
      example.wanderRadius === example.narrowRadius
        ? t('studyAifg.wander.model.comparison.tracesNowUseRadius', {
            exampleWanderRadius: decimal(example.wanderRadius),
          })
        : t('studyAifg.wander.model.comparison.compareChosenCircleRadius', {
            exampleWanderRadius: decimal(example.wanderRadius),
            exampleNarrowRadius: decimal(example.narrowRadius),
          }),
    timeline: {
      title: t('studyAifg.wander.model.comparison.sidewaysPositionGallery'),
      xLabel: t('studyAifg.wander.model.labels.timeSeconds'),
      yLabel: t('studyAifg.wander.model.comparison.worldY'),
      seconds: states.map((_state, step) => step * example.timeStep),
      series: [
        {
          id: 'normal',
          label: t('studyAifg.wander.model.comparison.solidGreenChosenRadius', {
            exampleWanderRadius: decimal(example.wanderRadius),
          }),
          tone: 'actual',
          values: states.map(({ position }) => position.y),
        },
        {
          id: 'narrow',
          label: t('studyAifg.wander.model.comparison.dashedAmberReferenceRadius', {
            exampleNarrowRadius: decimal(example.narrowRadius),
          }),
          tone: 'desired',
          values: narrow.map(({ position }) => position.y),
        },
      ],
    },
    findings: [
      t('studyAifg.wander.model.comparison.overSidewaysRangeChosen', {
        exampleSteps: decimal(example.steps * example.timeStep),
        selectedRange: decimal(spread(states)),
        narrowRange: decimal(spread(narrow)),
      }),
      t('studyAifg.wander.model.comparison.smallRadiusBesideLong'),
      t('studyAifg.wander.model.comparison.repeatablePathsScriptedTape'),
    ],
    note: t('studyAifg.wander.model.comparison.usesWorldPositions'),
  };
}

function runMoments(
  t: StudyTranslate,
  example: WanderParameters,
  selection: WanderMoments,
): readonly StudyMoment[] {
  const { peak, negative, returned } = selection;

  return [
    { label: t('studyAifg.wander.model.moments.forwardTarget'), step: 0 },
    peak > 0
      ? { label: t('studyAifg.wander.model.moments.targetDriftsAside'), step: peak }
      : {
          label: t('studyAifg.wander.model.moments.walkingStraight'),
          step: Math.floor(example.steps / 4),
        },
    negative >= 0
      ? { label: t('studyAifg.wander.model.moments.targetCrossesHeading'), step: negative }
      : {
          label: t('studyAifg.wander.model.moments.sameHeading'),
          step: Math.floor(example.steps / 2),
        },
    negative >= 0 && returned >= 0
      ? { label: t('studyAifg.wander.model.moments.relativeAngleReturns'), step: returned }
      : {
          label: t('studyAifg.wander.model.moments.stillStraightAheadMoment'),
          step: Math.floor((example.steps * 3) / 4),
        },
    { label: t('studyAifg.wander.model.moments.patrolContinues'), step: example.steps },
  ];
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  calculations: WanderStep[],
): TimelineModel {
  return {
    title: t('studyAifg.wander.model.timeline.turnRequestedTurnMade'),
    xLabel: t('studyAifg.wander.model.labels.timeSeconds'),
    yLabel: t('studyAifg.wander.model.timeline.turnCurrentHeadingRadians'),
    seconds: frames.map(({ seconds }) => seconds),
    reference: 0,
    series: [
      {
        id: 'actual-turn',
        label: t('studyAifg.wander.model.timeline.solidGreenTurnMade'),
        tone: 'actual',
        values: calculations.map(({ actualTurn }) => actualTurn),
      },
      {
        id: 'desired-turn',
        label: t('studyAifg.wander.model.timeline.dashedAmberBearingCircle'),
        tone: 'desired',
        values: calculations.map(({ desiredTurn }) => desiredTurn),
      },
    ],
  };
}

export const present = (
  example: WanderParameters,
  statesSamples: readonly WanderSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const frames = statesSamples.map((sample, step) =>
    frameOf(t, describeFrame(t, example, sample, step)),
  );
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
  const selection = selectMoments(calculations);
  return {
    family: 'motion',
    motion: {
      bounds: { minX: midX - width / 2, maxX: midX + width / 2, minY: lowY, maxY: highY },
      frames,
      trail: false,
    },
    timeline: runTimeline(t, frames, calculations),
    initialStep: selection.peak,
    moments: runMoments(t, example, selection),
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.wander.model.labels.solidGreenCurrentVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.wander.model.labels.dashedAmberDesiredVelocity'),
      },
    ],
    caption: t('studyAifg.wander.model.overview.caption', {
      exampleArrowSeconds: decimal(example.arrowSeconds),
    }),
    comparison: narrowCircleComparison(t, states, example),
    inputs: [
      {
        name: 'wanderRadius',
        label: t('studyAifg.wander.model.labels.circleRadius'),
        unit: t('studyAifg.wander.model.inputs.unitUnits'),
        min: 0.5,
        max: 5,
        step: 0.5,
      },
      {
        name: 'turnScale',
        label: t('studyAifg.wander.model.labels.angleNudgeScale'),
        unit: t('studyAifg.wander.model.labels.radUpdate'),
        min: 0,
        max: 1.2,
        step: 0.1,
      },
    ],
  };
};
