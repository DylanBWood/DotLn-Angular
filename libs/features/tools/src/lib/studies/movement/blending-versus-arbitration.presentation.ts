import { length } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  calculateCombinationStep,
  type CombinationParameters,
  combinationSamples,
  type CombinationState,
  type CombinationStep,
  heavierPriority,
} from './blending-versus-arbitration.simulation';
import { decimal } from './presentation';

function winnerLabel(winner: CombinationStep['winner'], t: StudyTranslate): string {
  switch (winner) {
    case 'marshal':
      return t('studyAifg.blending-versus-arbitration.model.winners.marshal');
    case 'destination':
      return t('studyAifg.blending-versus-arbitration.model.winners.destination');
    case 'none':
      return t('studyAifg.blending-versus-arbitration.model.winners.none');
  }
}

const blendLane = -5;

const priorityLane = 5;

function frameWorkedStep(
  t: StudyTranslate,
  seconds: number,
  example: CombinationParameters,
  a: CombinationStep,
  b: CombinationStep,
  blended: CombinationState,
  priority: CombinationState,
): MotionFrame['worked'] {
  return {
    title: t('studyAifg.blending-versus-arbitration.model.frame.worked.title', {
      seconds: decimal(seconds, 2, 0.000005),
    }),
    lines: [
      t('studyAifg.blending-versus-arbitration.model.frame.worked.steps.signalClampEngineSeek', {
        seconds: decimal(seconds, 2, 0.000005),
        holdSeconds: decimal(example.holdSeconds, 2, 0.000005),
        fadeSeconds: decimal(example.fadeSeconds, 2, 0.000005),
        aSignal: decimal(a.signal, 2, 0.000005),
        aMarshal: decimal(a.marshal.x, 2, 0.000005),
        aGoal: decimal(a.goal.x, 2, 0.000005),
      }),
      t('studyAifg.blending-versus-arbitration.model.frame.worked.steps.blendClip', {
        marshalWeight: decimal(example.marshalWeight, 2, 0.000005),
        aMarshal: decimal(a.marshal.x, 2, 0.000005),
        goalWeight: decimal(example.goalWeight, 2, 0.000005),
        aGoal: decimal(a.goal.x, 2, 0.000005),
        maxAcceleration: decimal(example.maxAcceleration, 2, 0.000005),
        aBlended: decimal(a.blended.x, 2, 0.000005),
      }),
      t(
        'studyAifg.blending-versus-arbitration.model.frame.worked.steps.priorityTestsCappedMarshal',
        {
          bMarshalGroup: decimal(b.marshalGroup.x, 2, 0.000005),
          epsilon: decimal(example.epsilon, 2, 0.000005),
          bWinner: winnerLabel(b.winner, t),
          bArbitrated: decimal(b.arbitrated.x, 2, 0.000005),
        },
      ),
      t('studyAifg.blending-versus-arbitration.model.frame.worked.steps.blendVClipX', {
        blendedVelocity: decimal(blended.velocity, 2, 0.000005),
        aBlended: decimal(a.blended.x, 2, 0.000005),
        timeStep: decimal(example.timeStep, 2, 0.000005),
        maxSpeed: decimal(example.maxSpeed, 2, 0.000005),
        aNextVelocity: decimal(a.next.velocity, 2, 0.000005),
        blendedPosition: decimal(blended.position, 2, 0.000005),
        aNextPosition: decimal(a.next.position, 2, 0.000005),
      }),
      t('studyAifg.blending-versus-arbitration.model.frame.worked.steps.priorityVClipX', {
        priorityVelocity: decimal(priority.velocity, 2, 0.000005),
        bArbitrated: decimal(b.arbitrated.x, 2, 0.000005),
        timeStep: decimal(example.timeStep, 2, 0.000005),
        maxSpeed: decimal(example.maxSpeed, 2, 0.000005),
        bNextVelocity: decimal(b.next.velocity, 2, 0.000005),
        priorityPosition: decimal(priority.position, 2, 0.000005),
        bNextPosition: decimal(b.next.position, 2, 0.000005),
      }),
    ],
    note: t('studyAifg.blending-versus-arbitration.model.frame.worked.note'),
  };
}

function frameValues(
  parameterValues: {
    [k: string]: string;
  },
  seconds: number,
  a: CombinationStep,
  blended: CombinationState,
  priority: CombinationState,
  b: CombinationStep,
  t: StudyTranslate,
): MotionFrame['values'] {
  return {
    ...parameterValues,
    elapsed: decimal(seconds, 2, 0.000005),
    signal: decimal(a.signal, 2, 0.000005),
    marshalRequest: decimal(a.marshal.x, 2, 0.000005),
    goalRequest: decimal(a.goal.x, 2, 0.000005),
    blendX: decimal(blended.position, 2, 0.000005),
    blendSpeed: decimal(blended.velocity, 2, 0.000005),
    priorityX: decimal(priority.position, 2, 0.000005),
    prioritySpeed: decimal(priority.velocity, 2, 0.000005),
    blendAcceleration: decimal(a.blended.x, 2, 0.000005),
    priorityAcceleration: decimal(b.arbitrated.x, 2, 0.000005),
    winner: winnerLabel(b.winner, t),
  };
}

function frameDrawing(
  blended: CombinationState,
  t: StudyTranslate,
  priority: CombinationState,
  example: CombinationParameters,
  a: CombinationStep,
  b: CombinationStep,
): Pick<MotionFrame, 'bodies' | 'marks' | 'links' | 'vectors'> {
  return {
    bodies: [
      {
        id: 'blend',
        x: blended.position,
        y: blendLane,
        tone: 'actual',
        label: t('studyAifg.blending-versus-arbitration.model.frame.bodies.labels.blend'),
      },
      {
        id: 'priority',
        x: priority.position,
        y: priorityLane,
        tone: 'desired',
        label: t('studyAifg.blending-versus-arbitration.model.frame.bodies.labels.priority'),
      },
    ],
    marks: [blendLane, priorityLane].flatMap((y) => [
      {
        x: example.marshalX,
        y,
        shape: 'ring' as const,
        tone: 'other' as const,
        label: t('studyAifg.blending-versus-arbitration.model.frame.marks.labels.marshal'),
      },
      {
        x: example.targetX,
        y,
        shape: 'cross' as const,
        tone: 'target' as const,
        label: t('studyAifg.blending-versus-arbitration.model.frame.marks.labels.delivery'),
      },
    ]),
    links: [blendLane, priorityLane].map((y) => ({
      from: { x: example.marshalX, y },
      to: { x: example.targetX, y },
      tone: 'muted',
    })),
    vectors: [
      { x: blended.position, y: blendLane - 1.5, dx: a.goalGroup.x, dy: 0, tone: 'target' },
      { x: blended.position, y: blendLane + 1.5, dx: a.marshalGroup.x, dy: 0, tone: 'other' },
      { x: blended.position, y: blendLane, dx: a.blended.x, dy: 0, tone: 'actual' },
      { x: priority.position, y: priorityLane - 1.5, dx: b.goalGroup.x, dy: 0, tone: 'target' },
      { x: priority.position, y: priorityLane + 1.5, dx: b.marshalGroup.x, dy: 0, tone: 'other' },
      { x: priority.position, y: priorityLane, dx: b.arbitrated.x, dy: 0, tone: 'desired' },
    ],
  };
}

function frameOf(
  blended: CombinationState,
  priority: CombinationState,
  step: number,
  example: CombinationParameters,
  t: StudyTranslate,
  a: ReturnType<typeof calculateCombinationStep>,
  b: ReturnType<typeof calculateCombinationStep>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const parameterValues = Object.fromEntries(
    Object.entries(example).map(([key, value]) => [key, String(value)]),
  );
  return {
    seconds,
    ...frameDrawing(blended, t, priority, example, a, b),
    values: frameValues(parameterValues, seconds, a, blended, priority, b, t),
    note:
      a.signal === 1 && length(a.blended) <= example.epsilon
        ? t('studyAifg.blending-versus-arbitration.model.frame.notes.bothDestinationMarshalRequest')
        : b.winner === 'marshal'
          ? t('studyAifg.blending-versus-arbitration.model.frame.notes.fadingMarshalStillWins')
          : t('studyAifg.blending-versus-arbitration.model.frame.notes.marshalNoLongerClears'),
    worked: frameWorkedStep(t, seconds, example, a, b, blended, priority),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: CombinationParameters,
  blendAccelerations: number[],
  heavierAccelerations: number[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.blending-versus-arbitration.model.comparison.timeline.title'),
    xLabel: t('studyAifg.blending-versus-arbitration.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.blending-versus-arbitration.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    yRange: [-example.maxAcceleration, example.maxAcceleration],
    series: [
      {
        id: 'original',
        label: t(
          'studyAifg.blending-versus-arbitration.model.comparison.timeline.series.labels.marshalWeight',
          {
            marshalWeight: decimal(example.marshalWeight, 2, 0.000005),
          },
        ),
        tone: 'actual',
        values: blendAccelerations,
      },
      {
        id: 'heavier',
        label: t(
          'studyAifg.blending-versus-arbitration.model.comparison.timeline.series.labels.marshalWeight2',
          { heavierWeight: decimal(example.heavierWeight, 2, 0.000005) },
        ),
        tone: 'desired',
        values: heavierAccelerations,
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: CombinationParameters,
  seconds: number[],
  blendAccelerations: number[],
  heavierAccelerations: number[],
  disagree: number,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.blending-versus-arbitration.model.comparison.title'),
    intro: t('studyAifg.blending-versus-arbitration.model.comparison.intro', {
      marshalWeight: decimal(example.marshalWeight, 2, 0.000005),
      heavierWeight: decimal(example.heavierWeight, 2, 0.000005),
    }),
    timeline: comparisonTimeline(t, seconds, example, blendAccelerations, heavierAccelerations),
    findings: [
      t(
        'studyAifg.blending-versus-arbitration.model.comparison.findings.startingBlendedAccelerationChanges',
        {
          blendAccelerations: decimal(blendAccelerations[0], 2, 0.000005),
          heavierAccelerations: decimal(heavierAccelerations[0], 2, 0.000005),
        },
      ),
      disagree < 0
        ? t('studyAifg.blending-versus-arbitration.model.comparison.findings.theseInputsProduceNo')
        : t(
            'studyAifg.blending-versus-arbitration.model.comparison.findings.heavierBlendPointsRight',
            {
              secondsDisagree: decimal(seconds[disagree], 2, 0.000005),
              heavierAccelerationsDisagree: decimal(heavierAccelerations[disagree], 2, 0.000005),
            },
          ),
    ],
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  example: CombinationParameters,
  blendAccelerations: number[],
  priorityAccelerations: number[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.blending-versus-arbitration.model.timeline.title'),
    xLabel: t('studyAifg.blending-versus-arbitration.model.timeline.xLabel'),
    yLabel: t('studyAifg.blending-versus-arbitration.model.timeline.yLabel'),
    seconds,
    reference: 0,
    yRange: [-example.maxAcceleration, example.maxAcceleration],
    series: [
      {
        id: 'blend',
        label: t(
          'studyAifg.blending-versus-arbitration.model.timeline.series.labels.weightedBlend',
        ),
        tone: 'actual',
        values: blendAccelerations,
      },
      {
        id: 'priority',
        label: t(
          'studyAifg.blending-versus-arbitration.model.timeline.series.labels.marshalFirstArbitration',
        ),
        tone: 'desired',
        values: priorityAccelerations,
      },
    ],
  };
}

function motionOf(
  example: CombinationParameters,
  xPositions: number[],
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: Math.min(example.marshalX, ...xPositions) - 3,
      maxX: Math.max(example.targetX, ...xPositions) + 3,
      minY: blendLane - 4,
      maxY: priorityLane + 4,
    },
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  example: CombinationParameters,
  release: number,
): MotionStudyModel['moments'] {
  return [
    {
      label: t('studyAifg.blending-versus-arbitration.model.moments.labels.equalOpposingRequests'),
      step: 0,
    },
    {
      label: t('studyAifg.blending-versus-arbitration.model.moments.labels.signalStartsFading'),
      step: Math.min(example.steps, Math.ceil(example.holdSeconds / example.timeStep)),
    },
    {
      label: t('studyAifg.blending-versus-arbitration.model.moments.labels.beforeRelease'),
      step: Math.max(0, release - 1),
    },
    {
      label: t('studyAifg.blending-versus-arbitration.model.moments.labels.deliveryTakesPriority'),
      step: release,
    },
    {
      label: t('studyAifg.blending-versus-arbitration.model.moments.labels.laterMotion'),
      step: example.steps,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'target',
      label: t('studyAifg.blending-versus-arbitration.model.legend.labels.deliveryRequest'),
    },
    {
      tone: 'other',
      label: t(
        'studyAifg.blending-versus-arbitration.model.legend.labels.marshalRequestAfterWeighting',
      ),
    },
    {
      tone: 'actual',
      label: t(
        'studyAifg.blending-versus-arbitration.model.legend.labels.blendedAccelerationTrolley',
      ),
    },
    {
      tone: 'desired',
      label: t(
        'studyAifg.blending-versus-arbitration.model.legend.labels.arbitratedAccelerationTrolley',
      ),
    },
  ];
}

export function presentStudy(example: CombinationParameters, t: StudyTranslate): MotionStudyModel {
  const blendedSamples = combinationSamples(example, 'blend');
  const blended = blendedSamples.map(({ state }) => state);
  const prioritySamples = combinationSamples(example, 'priority');
  const priority = prioritySamples.map(({ state }) => state);
  const heavierSamples = combinationSamples(example, 'blend', example.heavierWeight);
  const frames = blended.map((state, step) =>
    frameOf(
      state,
      priority[step],
      step,
      example,
      t,
      blendedSamples[step].calculation,
      prioritySamples[step].calculation,
    ),
  );
  const seconds = frames.map((frame) => frame.seconds);
  const blendAccelerations = blendedSamples.map(({ calculation }) => calculation.acceleration);
  const priorityAccelerations = prioritySamples.map(({ calculation }) => calculation.acceleration);
  const heavierAccelerations = heavierSamples.map(({ calculation }) => calculation.acceleration);
  const release = Math.min(
    example.steps,
    Math.ceil((example.holdSeconds + example.fadeSeconds) / example.timeStep),
  );
  const disagree = heavierAccelerations.findIndex(
    (value, step) => value > 0 && heavierPriority(prioritySamples[step].calculation, example) < 0,
  );
  const xPositions = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).map(({ x, dx }) => x + dx),
  ]);
  return {
    family: 'motion',
    motion: motionOf(example, xPositions, frames),
    timeline: timelineOf(t, seconds, example, blendAccelerations, priorityAccelerations),
    initialStep: release,
    moments: momentsOf(t, example, release),
    legend: legendOf(t),
    caption: t('studyAifg.blending-versus-arbitration.model.caption'),
    comparison: comparisonOf(
      t,
      example,
      seconds,
      blendAccelerations,
      heavierAccelerations,
      disagree,
    ),
  };
}
