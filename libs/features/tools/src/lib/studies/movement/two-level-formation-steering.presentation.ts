import {
  distance,
  length,
  scale,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { withSpacedLabels } from '../drawing';
import type { MotionBounds, MotionFrame, MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, decimal, vectorText } from './presentation';
import {
  calculateEscortStep,
  escortLag,
  type EscortParameters,
  escortSamples,
  escortSlotError,
  type EscortState,
  escortStates,
  meanOf,
} from './two-level-formation-steering.simulation';

function noteOf(
  t: StudyTranslate,
  state: EscortState,
  step: number,
  example: EscortParameters,
  calculation: ReturnType<typeof calculateEscortStep>,
): string {
  if (step === 0)
    return t('studyAifg.two-level-formation-steering.model.phaseRobotsStartSlotsAnchor');
  const targetGap = distance(state.formation.anchor, {
    x: example.objectiveX,
    y: example.objectiveY,
  });
  if (targetGap < example.anchorSlowRadius)
    return t('studyAifg.two-level-formation-steering.model.phaseAnchorSlowsNearBeacon');
  if (calculation.capped)
    return t('studyAifg.two-level-formation-steering.model.phaseLagLimitHoldsAnchor');
  if (
    length(state.formation.anchorVelocity) <
    example.anchorSpeed / example.planningStepSeconds - 0.005
  )
    return t('studyAifg.two-level-formation-steering.model.phaseAnchorAcceleratesAheadDrawing');
  return t('studyAifg.two-level-formation-steering.model.phaseSlotsDrawingAwayRobots');
}

function escortWorkedLines(
  t: StudyTranslate,
  state: EscortState,
  slots: {
    id: string;
    position: Vec2;
  }[],
  firstTarget: Vec2,
  first: EscortState['members'][number],
  acceleration: Vec2,
  example: EscortParameters,
  nextFirst: EscortState['members'][number],
  calculation: ReturnType<typeof calculateEscortStep>,
  gap: number,
  requestedSpeed: number,
  formation: EscortState['formation'],
): readonly string[] {
  return [
    t('studyAifg.two-level-formation-steering.model.workedMembersSlots', {
      value1: state.members
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
        .join('; '),
      value2: slots
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
        .join('; '),
    }),
    t('studyAifg.two-level-formation-steering.model.workedLanternReadsCurrentSlot', {
      firstTarget: vectorText(firstTarget, 2, 0.005),
      firstPosition: vectorText(first.position, 2, 0.005),
      acceleration: vectorText(acceleration, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedUpdateVelocityCappedNext', {
      firstVelocity: vectorText(first.velocity, 2, 0.005),
      acceleration: vectorText(acceleration, 2, 0.005),
      exampleTimeStep: decimal(example.timeStep, 2, 0.005),
      nextFirstVelocity: vectorText(nextFirst.velocity, 2, 0.005),
      exampleMemberSpeed: decimal(example.memberSpeed, 2, 0.005),
      nextFirstPosition: vectorText(nextFirst.position, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedAfterAllMembersMove', {
      calculationMean: vectorText(calculation.mean, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedRequestedAnchorSpeedMin', {
      exampleAnchorSpeed: decimal(example.anchorSpeed, 2, 0.005),
      examplePlanningStepSeconds: decimal(example.planningStepSeconds, 2, 0.005),
      gap: decimal(gap, 2, 0.005),
      exampleAnchorStopRadius: decimal(example.anchorStopRadius, 2, 0.005),
      exampleAnchorSlowRadius: decimal(example.anchorSlowRadius, 2, 0.005),
      requestedSpeed: decimal(requestedSpeed, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedEngineLimitsChangePlanning', {
      exampleAnchorAcceleration: decimal(example.anchorAcceleration, 2, 0.005),
      exampleTimeStep: decimal(example.timeStep, 2, 0.005),
      exampleAnchorAcceleration2: decimal(example.anchorAcceleration * example.timeStep, 2, 0.005),
      formationAnchorVelocity: vectorText(calculation.next.formation.anchorVelocity, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedPropose', {
      formationAnchor: vectorText(formation.anchor, 2, 0.005),
      formationAnchorVelocity: vectorText(calculation.next.formation.anchorVelocity, 2, 0.005),
      exampleTimeStep: decimal(example.timeStep, 2, 0.005),
      calculationProposed: vectorText(calculation.proposed, 2, 0.005),
    }),
    t('studyAifg.two-level-formation-steering.model.workedPullTowardsMeanGap', {
      calculationProposed: vectorText(calculation.proposed, 2, 0.005),
      exampleAnchorPull: decimal(example.anchorPull, 2, 0.005),
      calculationMean: vectorText(calculation.mean, 2, 0.005),
      calculationPulled: vectorText(calculation.pulled, 2, 0.005),
      calculationPulledLag: decimal(calculation.pulledLag, 2, 0.005),
    }),
    calculation.capped
      ? t('studyAifg.two-level-formation-steering.model.workedClipGapMeanNormalise', {
          exampleLagLimit: decimal(example.lagLimit, 2, 0.005),
          formationAnchor: vectorText(calculation.next.formation.anchor, 2, 0.005),
        })
      : t('studyAifg.two-level-formation-steering.model.workedGapWithinNextAnchor', {
          exampleLagLimit: decimal(example.lagLimit, 2, 0.005),
          formationAnchor: vectorText(calculation.next.formation.anchor, 2, 0.005),
        }),
  ];
}

function frameValues(
  t: StudyTranslate,
  example: EscortParameters,
  seconds: number,
  state: EscortState,
  slots: {
    id: string;
    position: Vec2;
  }[],
  formation: EscortState['formation'],
  mean: Vec2,
  objective: {
    x: number;
    y: number;
  },
  calculation: ReturnType<typeof calculateEscortStep>,
  requestedSpeed: number,
): Readonly<Record<string, string>> {
  return {
    ...Object.fromEntries(
      Object.entries(example).map(([name, value]) => [
        name,
        typeof value === 'number'
          ? String(Number(decimal(value, 2, 0.005)))
          : name === 'pattern'
            ? t('studyAifg.two-level-formation-steering.record.parameters.pattern')
            : value,
      ]),
    ),
    time: decimal(seconds, 2, 0.005),
    memberPositions: state.members
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
      .join('; '),
    slotPositions: slots
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
      .join('; '),
    anchorPosition: vectorText(formation.anchor, 2, 0.005),
    meanPosition: vectorText(mean, 2, 0.005),
    objectivePosition: vectorText(objective, 2, 0.005),
    proposedPosition: vectorText(calculation.proposed, 2, 0.005),
    nextAnchorPosition: vectorText(calculation.next.formation.anchor, 2, 0.005),
    lag: decimal(escortLag(state), 2, 0.005),
    slotError: decimal(escortSlotError(state), 2, 0.005),
    requestedSpeed: decimal(requestedSpeed, 2, 0.005),
    maximumRequestedSpeed: decimal(example.anchorSpeed / example.planningStepSeconds, 2, 0.005),
    planningSpeed: decimal(length(formation.anchorVelocity), 2, 0.005),
  };
}

function frameMarks(
  t: StudyTranslate,
  objective: {
    x: number;
    y: number;
  },
  mean: ReturnType<typeof meanOf>,
  calculation: ReturnType<typeof calculateEscortStep>,
  slots: {
    id: string;
    position: Vec2;
  }[],
): MotionFrame['marks'] {
  return [
    {
      ...objective,
      label: t('studyAifg.two-level-formation-steering.model.beacon'),
      shape: 'cross',
      tone: 'target',
    },
    {
      ...mean,
      label: t('studyAifg.two-level-formation-steering.model.mean'),
      shape: 'dot',
      tone: 'other',
    },
    {
      ...calculation.proposed,
      label: t('studyAifg.two-level-formation-steering.model.proposal'),
      shape: 'dot',
      tone: 'muted',
    },
    ...slots.map(({ position }, index) => ({
      ...position,
      label: t('studyAifg.two-level-formation-steering.model.slot', {
        index,
      }),
      shape: 'ring' as const,
      tone: 'desired' as const,
    })),
  ];
}

function frameBodies(
  t: StudyTranslate,
  state: EscortState,
  formation: EscortState['formation'],
): MotionFrame['bodies'] {
  return [
    ...state.members.map(({ id, position }) => ({
      id,
      ...position,
      label:
        id === 'lantern'
          ? t('studyAifg.two-level-formation-steering.model.lantern')
          : id === 'port'
            ? t('studyAifg.two-level-formation-steering.model.port')
            : t('studyAifg.two-level-formation-steering.model.starboard'),
      tone: 'subject' as const,
    })),
    {
      id: 'anchor',
      label: t('studyAifg.two-level-formation-steering.model.anchor'),
      ...formation.anchor,
      tone: 'actual',
      heading: Math.atan2(formation.heading.y, formation.heading.x),
    },
  ];
}

function describeFrame(
  state: EscortState,
  step: number,
  example: EscortParameters,
  calculation: ReturnType<typeof calculateEscortStep>,
) {
  const mean = meanOf(state);
  const formation = state.formation;
  const slots = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    position: slotPosition(formation, slot),
  }));
  const first = state.members[0];
  const nextFirst = calculation.next.members[0];
  const firstTarget = slots[0].position;
  const acceleration = scale(subtract(nextFirst.velocity, first.velocity), 1 / example.timeStep);
  const objective = { x: example.objectiveX, y: example.objectiveY };
  const gap = distance(formation.anchor, objective);
  const requestedSpeed =
    gap <= example.anchorStopRadius
      ? 0
      : (example.anchorSpeed / example.planningStepSeconds) *
        Math.min(
          1,
          (gap - example.anchorStopRadius) / (example.anchorSlowRadius - example.anchorStopRadius),
        );
  const seconds = step * example.timeStep;
  return {
    seconds,
    formation,
    objective,
    mean,
    calculation,
    slots,
    requestedSpeed,
    firstTarget,
    first,
    acceleration,
    nextFirst,
    gap,
  };
}

function frameOf(
  t: StudyTranslate,
  state: EscortState,
  step: number,
  example: EscortParameters,
  calculation: ReturnType<typeof calculateEscortStep>,
): MotionFrame {
  const description = describeFrame(state, step, example, calculation);
  return {
    seconds: description.seconds,
    bodies: frameBodies(t, state, description.formation),
    marks: frameMarks(
      t,
      description.objective,
      description.mean,
      description.calculation,
      description.slots,
    ),
    zones: [{ ...description.mean, radius: example.lagLimit }],
    links: [
      { from: description.mean, to: description.formation.anchor, tone: 'other' },
      ...state.members.map((member, index) => ({
        from: member.position,
        to: description.slots[index].position,
        tone: 'desired' as const,
      })),
    ],
    vectors: [
      {
        ...description.formation.anchor,
        dx: description.calculation.next.formation.anchor.x - description.formation.anchor.x,
        dy: description.calculation.next.formation.anchor.y - description.formation.anchor.y,
        tone: 'actual',
      },
    ],
    values: frameValues(
      t,
      example,
      description.seconds,
      state,
      description.slots,
      description.formation,
      description.mean,
      description.objective,
      description.calculation,
      description.requestedSpeed,
    ),
    note: noteOf(t, state, step, example, calculation),
    worked: {
      title: t('studyAifg.two-level-formation-steering.model.workedEscortUpdate', {
        seconds: decimal(description.seconds, 2, 0.005),
        seconds2: decimal(description.seconds + example.timeStep, 2, 0.005),
      }),
      lines: escortWorkedLines(
        t,
        state,
        description.slots,
        description.firstTarget,
        description.first,
        description.acceleration,
        example,
        description.nextFirst,
        description.calculation,
        description.gap,
        description.requestedSpeed,
        description.formation,
      ),
      note: t('studyAifg.two-level-formation-steering.model.workedAllMembersReadPrevious'),
    },
  };
}

function compareRuns(
  t: StudyTranslate,
  example: EscortParameters,
  seconds: number[],
  peakError: (run: readonly EscortState[]) => number,
  states: ReturnType<typeof escortStates>,
  loose: ReturnType<typeof escortStates>,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.two-level-formation-steering.model.comparisonLooseLagLimitStretches'),
    intro: t(
      'studyAifg.two-level-formation-steering.model.comparisonChangeLagLimitGeometryAnchor',
      {
        exampleLagLimit: decimal(example.lagLimit, 2, 0.005),
        exampleComparisonLagLimit: decimal(example.comparisonLagLimit, 2, 0.005),
      },
    ),
    timeline: {
      title: t(
        'studyAifg.two-level-formation-steering.model.comparisonMeanDistanceMembersAssigned',
      ),
      xLabel: t('studyAifg.two-level-formation-steering.model.timeSeconds'),
      yLabel: t('studyAifg.two-level-formation-steering.model.comparisonSlotError'),
      seconds,
      yRange: [0, Math.max(peakError(states), peakError(loose)) * 1.1],
      series: [
        {
          id: 'tight',
          label: t('studyAifg.two-level-formation-steering.model.comparisonLagLimit', {
            exampleLagLimit: decimal(example.lagLimit, 2, 0.005),
          }),
          tone: 'actual',
          values: states.map(escortSlotError),
        },
        {
          id: 'loose',
          label: t('studyAifg.two-level-formation-steering.model.comparisonAlternativeLagLimit', {
            exampleComparisonLagLimit: decimal(example.comparisonLagLimit, 2, 0.005),
          }),
          tone: 'desired',
          values: loose.map(escortSlotError),
        },
      ],
    },
    findings: [
      t('studyAifg.two-level-formation-steering.model.comparisonPeakMeanSlotError', {
        value1: decimal(peakError(states), 2, 0.005),
        value2: decimal(peakError(loose), 2, 0.005),
      }),
      t('studyAifg.two-level-formation-steering.model.comparisonTightAnchorLooseAnchor', {
        exampleSteps: decimal(example.steps * example.timeStep, 2, 0.005),
        formationAnchor: vectorText(states[example.steps].formation.anchor, 2, 0.005),
        formationAnchor2: vectorText(loose[example.steps].formation.anchor, 2, 0.005),
      }),
    ],
    note: t('studyAifg.two-level-formation-steering.model.comparisonAnchorCapBoundsDistance'),
  };
}

function motionLegend(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.two-level-formation-steering.model.dotsLanternPortStarboard'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.two-level-formation-steering.model.anchorArrowheadDisplacementChart'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.two-level-formation-steering.model.slotRingsLinksChart'),
    },
    {
      tone: 'other',
      label: t('studyAifg.two-level-formation-steering.model.dotLinkActualMember'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.two-level-formation-steering.model.dotNextAnchorProposal'),
    },
    {
      tone: 'target',
      label: t('studyAifg.two-level-formation-steering.model.crossHarbourBeaconObjective'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.two-level-formation-steering.model.circleAllowedAnchorDistance'),
    },
  ];
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: EscortParameters,
  states: ReturnType<typeof escortStates>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.two-level-formation-steering.model.anchorLagMeanSlot'),
    xLabel: t('studyAifg.two-level-formation-steering.model.timeSeconds'),
    yLabel: t('studyAifg.two-level-formation-steering.model.distance'),
    seconds,
    yRange: [0, Math.max(example.lagLimit, ...states.map(escortSlotError)) * 1.1],
    reference: example.lagLimit,
    series: [
      {
        id: 'lag',
        label: t('studyAifg.two-level-formation-steering.model.anchorActualMemberMean'),
        tone: 'actual',
        values: states.map(escortLag),
      },
      {
        id: 'slot-error',
        label: t('studyAifg.two-level-formation-steering.model.meanMemberAssignedSlot'),
        tone: 'desired',
        values: states.map(escortSlotError),
      },
    ],
  };
}

export const present = (
  example: EscortParameters,
  statesSamples: ReturnType<typeof escortSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const looseSamples = escortSamples({ ...example, lagLimit: example.comparisonLagLimit });
  const loose = looseSamples.map(({ state }) => state);
  const rawFrames = states.map((state, step) =>
    frameOf(t, state, step, example, statesSamples[step].calculation),
  );
  const seconds = rawFrames.map((frame) => frame.seconds);
  const firstClip = statesSamples.findIndex(({ calculation }) => calculation.capped);
  const initialStep =
    firstClip < 0 ? Math.floor(example.steps / 2) : Math.min(firstClip + 1, example.steps);
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const peakError = (run: readonly EscortState[]) => Math.max(...run.map(escortSlotError));
  const bounds: MotionBounds = boundsOfPoints(points, example.spacing * 2);
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds));
  return {
    family: 'motion',
    motion: { frames, bounds },
    timeline: runTimeline(t, seconds, example, states),
    initialStep,
    moments: [
      {
        label: t('studyAifg.two-level-formation-steering.model.formedRest'),
        step: 0,
      },
      {
        label: t('studyAifg.two-level-formation-steering.model.firstAnchorPull'),
        step: 1,
      },
      {
        label:
          firstClip < 0
            ? t('studyAifg.two-level-formation-steering.model.pullRestrainsLead')
            : t('studyAifg.two-level-formation-steering.model.lagLimitActs'),
        step: initialStep,
      },
      {
        label: t('studyAifg.two-level-formation-steering.model.laterMarch'),
        step: example.steps,
      },
    ],
    legend: motionLegend(t),
    caption: t('studyAifg.two-level-formation-steering.model.caption'),
    comparison: compareRuns(t, example, seconds, peakError, states, loose),
    inputs: [
      {
        name: 'lagLimit',
        label: t('studyAifg.two-level-formation-steering.model.anchorLagLimit'),
        unit: t('studyAifg.two-level-formation-steering.model.inputsUnitUnits'),
        min: 4,
        max: 10,
        step: 1,
      },
      {
        name: 'memberSpeed',
        label: t('studyAifg.two-level-formation-steering.model.robotSpeedLimit'),
        unit: t('studyAifg.two-level-formation-steering.model.inputsUnitUnitsS'),
        min: 0.5,
        max: 3,
        step: 0.5,
      },
    ],
  };
};

function escortName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'lantern':
      return t('studyAifg.two-level-formation-steering.model.escortNamelantern');
    case 'port':
      return t('studyAifg.two-level-formation-steering.model.escortNameport');
    case 'starboard':
      return t('studyAifg.two-level-formation-steering.model.escortNamestarboard');
    default:
      return value;
  }
}
