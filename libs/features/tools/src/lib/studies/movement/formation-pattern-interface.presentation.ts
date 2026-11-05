import {
  centroid,
  distance,
  type FormationState,
  length,
  scale,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { withSpacedLabels } from '../drawing';
import type { MotionBounds, MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  rosterCentreGap,
  rosterMemberMean,
  type RosterParameters,
  type RosterSample,
  rosterSamples,
  type RosterState,
  rosterStates,
  rosterTargetGap,
} from './formation-pattern-interface.simulation';
import { boundsOfPoints, decimal, vectorText } from './presentation';

function noteOf(t: StudyTranslate, state: RosterState, example: RosterParameters): string {
  if (state.step < example.releaseStep)
    return t('studyAifg.formation-pattern-interface.model.phaseAllEscortsOccupySlots');
  if (state.step === example.releaseStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phaseLookoutLeavesWingTargets')
      : t('studyAifg.formation-pattern-interface.model.phaseLookoutLeavesKeepingOld');
  if (state.step < example.turnStartStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phaseWingsApproachRecentredSlots')
      : t('studyAifg.formation-pattern-interface.model.phaseWingsStayOldTargets');
  if (state.step < example.turnEndStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phaseCentredTargetsTurnAnchor')
      : t('studyAifg.formation-pattern-interface.model.phaseOffCentreTargetsTurn');
  const trackingError =
    state.formation.assignment.reduce((sum, { slot, unitId }) => {
      const member = state.members.find(({ id }) => id === unitId);
      return sum + (member ? distance(member.position, slotPosition(state.formation, slot)) : 0);
    }, 0) / state.members.length;
  if (example.driftCorrection === 0)
    return trackingError < 0.02
      ? t('studyAifg.formation-pattern-interface.model.phaseWingsNearlyTargetsYet')
      : t('studyAifg.formation-pattern-interface.model.phaseTurnEndedReachingUncorrected');
  return trackingError < 0.02
    ? t('studyAifg.formation-pattern-interface.model.phaseWingsNearlyCentredTargets')
    : t('studyAifg.formation-pattern-interface.model.phaseTurnEndedWingsCan');
}

function frameValues(
  t: StudyTranslate,
  example: RosterParameters,
  state: RosterState,
  relationship: string,
  seconds: number,
  count: number,
  formation: FormationState,
  targets: {
    id: string;
    slot: number;
    position: Vec2;
  }[],
  rawTargets: {
    id: string;
    slot: number;
    position: Vec2;
  }[],
): Readonly<Record<string, string>> {
  return {
    ...Object.fromEntries(
      Object.entries(example).map(([name, value]) => [
        name,
        typeof value === 'number'
          ? String(Number(decimal(value, 2, 0.005)))
          : name === 'pattern'
            ? t('studyAifg.formation-pattern-interface.record.parameters.pattern')
            : value,
      ]),
    ),
    correctionState:
      example.driftCorrection === 1
        ? t('studyAifg.formation-pattern-interface.model.correctionEnabled')
        : t('studyAifg.formation-pattern-interface.model.valueOff'),
    correctionReading:
      example.driftCorrection === 1
        ? t('studyAifg.formation-pattern-interface.model.valueOccupiedTargetsCentredAnchor')
        : t('studyAifg.formation-pattern-interface.model.valueOriginalOffsetsKeptOccupied'),
    departureDriftLength: decimal(length(centroid(state.rawSlots.slice(1))), 2, 0.005),
    patternRelationship: relationship,
    time: decimal(seconds, 2, 0.005),
    releaseSeconds: decimal(example.releaseStep * example.timeStep, 2, 0.005),
    turnStartSeconds: decimal(example.turnStartStep * example.timeStep, 2, 0.005),
    turnEndSeconds: decimal(example.turnEndStep * example.timeStep, 2, 0.005),
    activeCount: String(count),
    occupiedSlots: formation.assignment.map(({ slot }) => String(slot)).join(', '),
    supportAnswer:
      count <= example.capacity
        ? t('studyAifg.formation-pattern-interface.model.valueYes')
        : t('studyAifg.formation-pattern-interface.model.valueNo'),
    driftPosition: vectorText(state.drift, 2, 0.005),
    driftLength: decimal(length(state.drift), 2, 0.005),
    headingDegrees: decimal((state.angle * 180) / Math.PI, 2, 0.005),
    anchorPosition: vectorText(formation.anchor, 2, 0.005),
    meanPosition: vectorText(rosterMemberMean(state), 2, 0.005),
    memberPositions: state.members
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
      .join('; '),
    slotPositions: targets
      .map(({ id, slot, position }) =>
        t('studyAifg.formation-pattern-interface.model.valueSlot', {
          id,
          slot,
          position: vectorText(position, 2, 0.005),
        }),
      )
      .join('; '),
    rawPositions: rawTargets
      .map(({ slot, position }) =>
        t('studyAifg.formation-pattern-interface.model.rawSlotPosition', {
          slot,
          position: vectorText(position, 2, 0.005),
        }),
      )
      .join('; '),
    centreGap: decimal(rosterCentreGap(state), 2, 0.005),
    targetGap: decimal(rosterTargetGap(state), 2, 0.005),
  };
}

function describeFrame(
  t: StudyTranslate,
  state: RosterState,
  example: RosterParameters,
  next: RosterSample['nextMembers'][number],
) {
  const { formation } = state;
  const rawFormation = { ...formation, slots: state.rawSlots };
  const targets = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    slot,
    position: slotPosition(formation, slot),
  }));
  const rawTargets = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    slot,
    position: slotPosition(rawFormation, slot),
  }));
  const occupied = formation.assignment.map(({ slot }) => state.rawSlots[slot]);
  const focus = state.members[0];
  const focusSlot = formation.assignment[0].slot;
  const raw = state.rawSlots[focusSlot];
  const corrected = formation.slots[focusSlot];
  const target = targets[0].position;
  const acceleration = scale(subtract(next.velocity, focus.velocity), 1 / example.timeStep);
  const seconds = state.step * example.timeStep;
  const count = state.members.length;
  const occupiedText = formation.assignment
    .map(({ slot }) =>
      t('studyAifg.formation-pattern-interface.model.slot', {
        slot,
        value2: vectorText(state.rawSlots[slot], 2, 0.005),
      }),
    )
    .join('; ');
  const relationship =
    state.step < example.releaseStep
      ? t('studyAifg.formation-pattern-interface.model.fullRosterTargetsShare')
      : example.driftCorrection === 0
        ? t('studyAifg.formation-pattern-interface.model.wingTargetsRemainOff')
        : state.step === example.releaseStep
          ? t('studyAifg.formation-pattern-interface.model.correctedWingTargetsCentred')
          : t('studyAifg.formation-pattern-interface.model.correctedWingTargetsStay');
  return {
    seconds,
    formation,
    rawTargets,
    targets,
    relationship,
    count,
    occupiedText,
    occupied,
    focus,
    focusSlot,
    raw,
    corrected,
    target,
    acceleration,
    next,
  };
}

function frameWorkedLines(
  t: StudyTranslate,
  state: RosterState,
  description: ReturnType<typeof describeFrame>,
  example: RosterParameters,
): readonly string[] {
  return [
    t('studyAifg.formation-pattern-interface.model.workedEscortsChosenTargetsUncorrected', {
      value1: state.members
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position, 2, 0.005)}`)
        .join('; '),
      value2: description.targets
        .map(({ slot, position }) =>
          t('studyAifg.formation-pattern-interface.model.rawSlotPosition', {
            slot,
            position: vectorText(position, 2, 0.005),
          }),
        )
        .join('; '),
      value3: description.rawTargets
        .map(({ slot, position }) =>
          t('studyAifg.formation-pattern-interface.model.rawSlotPosition', {
            slot,
            position: vectorText(position, 2, 0.005),
          }),
        )
        .join('; '),
    }),
    t('studyAifg.formation-pattern-interface.model.workedSupportsSlotsTruePlacePattern', {
      count: description.count,
      exampleCapacity: example.capacity,
      occupiedText: description.occupiedText,
    }),
    t('studyAifg.formation-pattern-interface.model.workedDriftXDriftY', {
      value1: description.occupied.map(({ x }) => decimal(x, 2, 0.005)).join(' + '),
      count: description.count,
      driftX: decimal(state.drift.x, 2, 0.005),
      value4: description.occupied.map(({ y }) => decimal(y, 2, 0.005)).join(' + '),
      driftY: decimal(state.drift.y, 2, 0.005),
    }),
    t('studyAifg.formation-pattern-interface.model.workedKeepsSlotCorrectLocal', {
      focusId: escortName(t, description.focus.id),
      focusSlot: description.focusSlot,
      raw: vectorText(description.raw, 2, 0.005),
      exampleDriftCorrection: decimal(example.driftCorrection, 2, 0.005),
      stateDrift: vectorText(state.drift, 2, 0.005),
      corrected: vectorText(description.corrected, 2, 0.005),
    }),
    t('studyAifg.formation-pattern-interface.model.workedHeadingGivesCosSin', {
      stateAngle: decimal((state.angle * 180) / Math.PI, 2, 0.005),
      headingX: decimal(description.formation.heading.x, 2, 0.005),
      headingY: decimal(description.formation.heading.y, 2, 0.005),
      anchorX: decimal(description.formation.anchor.x, 2, 0.005),
      correctedX: decimal(description.corrected.x, 2, 0.005),
      correctedY: decimal(description.corrected.y, 2, 0.005),
      targetX: decimal(description.target.x, 2, 0.005),
    }),
    t('studyAifg.formation-pattern-interface.model.workedWorldYSinCos', {
      anchorY: decimal(description.formation.anchor.y, 2, 0.005),
      correctedX: decimal(description.corrected.x, 2, 0.005),
      correctedY: decimal(description.corrected.y, 2, 0.005),
      targetY: decimal(description.target.y, 2, 0.005),
    }),
    t('studyAifg.formation-pattern-interface.model.workedEngineArriveGivesAcceleration', {
      focusPosition: vectorText(description.focus.position, 2, 0.005),
      acceleration: vectorText(description.acceleration, 2, 0.005),
      focusVelocity: vectorText(description.focus.velocity, 2, 0.005),
      exampleTimeStep: decimal(example.timeStep, 2, 0.005),
      nextVelocity: vectorText(description.next.velocity, 2, 0.005),
    }),
    t('studyAifg.formation-pattern-interface.model.workedIntegrateUpdatedVelocityTarget', {
      focusPosition: vectorText(description.focus.position, 2, 0.005),
      nextVelocity: vectorText(description.next.velocity, 2, 0.005),
      exampleTimeStep: decimal(example.timeStep, 2, 0.005),
      nextPosition: vectorText(description.next.position, 2, 0.005),
      value5: decimal(rosterTargetGap(state), 2, 0.005),
      value6: decimal(rosterCentreGap(state), 2, 0.005),
    }),
  ];
}

function frameWorked(
  t: StudyTranslate,
  description: ReturnType<typeof describeFrame>,
  state: RosterState,
  example: RosterParameters,
): StudyWorkedStep {
  return {
    title: t('studyAifg.formation-pattern-interface.model.workedPatternContract', {
      seconds: decimal(description.seconds, 2, 0.005),
    }),
    lines: frameWorkedLines(t, state, description, example),
    note: t('studyAifg.formation-pattern-interface.model.workedSubtractDriftLocalCoordinates'),
  };
}

function frameOf(
  t: StudyTranslate,
  state: RosterState,
  example: RosterParameters,
  sample: RosterSample,
): MotionFrame {
  const description = describeFrame(t, state, example, sample.nextMembers[0]);
  return {
    seconds: description.seconds,
    bodies: state.members.map(({ id, position }) => ({
      id,
      ...position,
      label:
        id === 'lookout'
          ? t('studyAifg.formation-pattern-interface.model.lookout')
          : id === 'port'
            ? t('studyAifg.formation-pattern-interface.model.port')
            : t('studyAifg.formation-pattern-interface.model.starboard'),
      tone: 'subject',
    })),
    marks: [
      {
        ...description.formation.anchor,
        label: t('studyAifg.formation-pattern-interface.model.anchor'),
        shape: 'cross',
        tone: 'target',
      },
      {
        ...rosterMemberMean(state),
        label: t('studyAifg.formation-pattern-interface.model.mean'),
        shape: 'dot',
        tone: 'actual',
      },
      ...description.rawTargets.map(({ position }) => ({
        ...position,
        shape: 'dot' as const,
        tone: 'muted' as const,
      })),
      ...description.targets.map(({ slot, position }) => ({
        ...position,
        label: t('studyAifg.formation-pattern-interface.model.slotLabel', {
          slot,
        }),
        shape: 'ring' as const,
        tone: 'desired' as const,
      })),
    ],
    links: [
      ...state.members.map((member, index) => ({
        from: member.position,
        to: description.targets[index].position,
        tone: 'desired' as const,
      })),
      { from: description.formation.anchor, to: rosterMemberMean(state), tone: 'actual' },
    ],
    vectors: [
      {
        ...description.formation.anchor,
        dx: description.formation.heading.x * example.spacing,
        dy: description.formation.heading.y * example.spacing,
        tone: 'other',
      },
    ],
    values: frameValues(
      t,
      example,
      state,
      description.relationship,
      description.seconds,
      description.count,
      description.formation,
      description.targets,
      description.rawTargets,
    ),
    note: noteOf(t, state, example),
    worked: frameWorked(t, description, state, example),
  };
}

function compareRuns(
  t: StudyTranslate,
  example: RosterParameters,
  comparisonCorrection: number,
  seconds: number[],
  corrected: readonly RosterState[],
  uncorrected: readonly RosterState[],
  last: RosterState,
  lastUncorrected: RosterState,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.formation-pattern-interface.model.comparisonCompareOccupiedSlotDrift'),
    intro: t(
      'studyAifg.formation-pattern-interface.model.comparisonChangeDriftCorrectionChartCompares',
      {
        exampleDriftCorrection: decimal(example.driftCorrection, 2, 0.005),
        comparisonCorrection: decimal(comparisonCorrection, 2, 0.005),
      },
    ),
    timeline: {
      title: t('studyAifg.formation-pattern-interface.model.comparisonActualMemberMeanFixed'),
      xLabel: t('studyAifg.formation-pattern-interface.model.timeSeconds'),
      yLabel: t('studyAifg.formation-pattern-interface.model.comparisonCentreGap'),
      seconds,
      yRange: [
        0,
        Math.max(...corrected.map(rosterCentreGap), ...uncorrected.map(rosterCentreGap)) * 1.1,
      ],
      series: [
        {
          id: 'corrected',
          label: t(
            'studyAifg.formation-pattern-interface.model.comparisonSubtractOccupiedSlotDrift',
          ),
          tone: 'actual',
          values: corrected.map(rosterCentreGap),
        },
        {
          id: 'uncorrected',
          label: t('studyAifg.formation-pattern-interface.model.comparisonUseFullPatternOffsets'),
          tone: 'desired',
          values: uncorrected.map(rosterCentreGap),
        },
      ],
    },
    findings: [
      t('studyAifg.formation-pattern-interface.model.comparisonActualCentreGapCorrection', {
        exampleSteps: decimal(example.steps * example.timeStep, 2, 0.005),
        value2: decimal(rosterCentreGap(last), 2, 0.005),
        value3: decimal(rosterCentreGap(lastUncorrected), 2, 0.005),
      }),
      t('studyAifg.formation-pattern-interface.model.comparisonWithoutCorrectionTargetMean', {
        value1: decimal(rosterTargetGap(lastUncorrected), 2, 0.005),
      }),
    ],
    note: t('studyAifg.formation-pattern-interface.model.comparisonAnchorStaysFixedRuns'),
  };
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  states: readonly RosterState[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.formation-pattern-interface.model.geometricDriftCentreActually'),
    xLabel: t('studyAifg.formation-pattern-interface.model.timeSeconds'),
    yLabel: t('studyAifg.formation-pattern-interface.model.distance'),
    seconds,
    yRange: [
      0,
      Math.max(...states.map((state) => Math.max(length(state.drift), rosterCentreGap(state)))) *
        1.1,
    ],
    series: [
      {
        id: 'drift',
        label: t('studyAifg.formation-pattern-interface.model.occupiedLocalDriftMagnitude'),
        tone: 'muted',
        values: states.map(({ drift }) => length(drift)),
      },
      {
        id: 'targets',
        label: t('studyAifg.formation-pattern-interface.model.chosenTargetMeanAnchor'),
        tone: 'desired',
        values: states.map(rosterTargetGap),
      },
      {
        id: 'members',
        label: t('studyAifg.formation-pattern-interface.model.actualMemberMeanAnchor'),
        tone: 'actual',
        values: states.map(rosterCentreGap),
      },
    ],
  };
}

function motionLegend(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.formation-pattern-interface.model.dotsEscortsRoster'),
    },
    {
      tone: 'target',
      label: t('studyAifg.formation-pattern-interface.model.crossFixedAnchor'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.formation-pattern-interface.model.chosenSlotRingsLinks'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.formation-pattern-interface.model.uncorrectedTargetDotsChart'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.formation-pattern-interface.model.actualMemberMeanDot'),
    },
    {
      tone: 'other',
      label: t('studyAifg.formation-pattern-interface.model.arrowAnchorForwardDirection'),
    },
  ];
}

function runMoments(t: StudyTranslate, example: RosterParameters): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.formation-pattern-interface.model.fullPattern'), step: 0 },
    {
      label: t('studyAifg.formation-pattern-interface.model.lookoutLeaves'),
      step: example.releaseStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.turnStarts'),
      step: example.turnStartStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.turnEnds'),
      step: example.turnEndStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.targetsFollowed'),
      step: example.steps,
    },
  ];
}

export const present = (
  example: RosterParameters,
  statesSamples: ReturnType<typeof rosterSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const comparisonCorrection =
    example.driftCorrection === example.comparisonCorrection
      ? 1 - example.comparisonCorrection
      : example.comparisonCorrection;
  const alternative = rosterStates({ ...example, driftCorrection: comparisonCorrection });
  const corrected = example.driftCorrection === 1 ? states : alternative;
  const uncorrected = example.driftCorrection === 0 ? states : alternative;
  const rawFrames = states.map((state, step) => frameOf(t, state, example, statesSamples[step]));
  const seconds = rawFrames.map(({ seconds: value }) => value);
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const last = corrected[example.steps];
  const lastUncorrected = uncorrected[example.steps];
  const bounds: MotionBounds = boundsOfPoints(points, example.spacing / 2);
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds, 'marks'));
  return {
    family: 'motion',
    motion: { frames, bounds },
    timeline: runTimeline(t, seconds, states),
    initialStep: example.releaseStep,
    moments: runMoments(t, example),
    legend: motionLegend(t),
    caption: t('studyAifg.formation-pattern-interface.model.caption'),
    comparison: compareRuns(
      t,
      example,
      comparisonCorrection,
      seconds,
      corrected,
      uncorrected,
      last,
      lastUncorrected,
    ),
    inputs: [
      {
        name: 'spacing',
        label: t('studyAifg.formation-pattern-interface.model.slotSpacing'),
        unit: t('studyAifg.formation-pattern-interface.model.inputsUnitUnits'),
        min: 2,
        max: 4,
        step: 0.5,
      },
      {
        name: 'driftCorrection',
        label: t('studyAifg.formation-pattern-interface.model.driftCorrection'),
        unit: t('studyAifg.formation-pattern-interface.model.off'),
        min: 0,
        max: 1,
        step: 1,
      },
    ],
  };
};

function escortName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'lookout':
      return t('studyAifg.formation-pattern-interface.model.escortNamelookout');
    case 'port':
      return t('studyAifg.formation-pattern-interface.model.escortNameport');
    case 'starboard':
      return t('studyAifg.formation-pattern-interface.model.escortNamestarboard');
    default:
      return value;
  }
}
