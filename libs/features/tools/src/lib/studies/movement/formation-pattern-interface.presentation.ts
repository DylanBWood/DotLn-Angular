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
import { createNumberFormat } from '../number-format';
import type {
  MotionBounds,
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyLegendEntry,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  rosterCentreGap,
  rosterMemberMean,
  type RosterParameters,
  type RosterSample,
  type RosterState,
  rosterStates,
  rosterTargetGap,
} from './formation-pattern-interface.simulation';
import { boundsOfPoints, type PresentationMember } from './presentation';

interface RosterTarget {
  readonly id: string;
  readonly slot: number;
  readonly position: Vec2;
}
interface RosterFrame {
  readonly state: RosterState;
  readonly example: RosterParameters;
  readonly seconds: number;
  readonly formation: FormationState;
  readonly rawTargets: readonly RosterTarget[];
  readonly targets: readonly RosterTarget[];
  readonly relationship: string;
  readonly count: number;
  readonly occupiedText: string;
  readonly occupied: readonly Vec2[];
  readonly focus: PresentationMember;
  readonly focusSlot: number;
  readonly raw: Vec2;
  readonly corrected: Vec2;
  readonly target: Vec2;
  readonly acceleration: Vec2;
  readonly next: PresentationMember;
}
interface RosterDescription {
  readonly example: RosterParameters;
  readonly states: readonly RosterState[];
  readonly corrected: readonly RosterState[];
  readonly uncorrected: readonly RosterState[];
  readonly comparisonCorrection: number;
  readonly seconds: readonly number[];
  readonly last: RosterState;
  readonly lastUncorrected: RosterState;
}
function describeRun(
  example: RosterParameters,
  samples: readonly RosterSample[],
): RosterDescription {
  const states = samples.map(({ state }) => state);
  const comparisonCorrection =
    example.driftCorrection === example.comparisonCorrection
      ? 1 - example.comparisonCorrection
      : example.comparisonCorrection;
  const alternative = rosterStates({ ...example, driftCorrection: comparisonCorrection });
  const corrected = example.driftCorrection === 1 ? states : alternative;
  const uncorrected = example.driftCorrection === 0 ? states : alternative;
  return {
    example,
    states,
    corrected,
    uncorrected,
    comparisonCorrection,
    seconds: states.map(({ step }) => step * example.timeStep),
    last: corrected[example.steps],
    lastUncorrected: uncorrected[example.steps],
  };
}

const { number: decimal, vector: vectorText } = createNumberFormat({ zeroThreshold: 0.005 });

function noteOf(t: StudyTranslate, description: RosterFrame): string {
  const { state, example } = description;

  if (state.step < example.releaseStep)
    return t('studyAifg.formation-pattern-interface.model.phase.allEscortsOccupySlots');
  if (state.step === example.releaseStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phase.lookoutLeavesWingTargets')
      : t('studyAifg.formation-pattern-interface.model.phase.lookoutLeavesKeepingOld');
  if (state.step < example.turnStartStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phase.wingsApproachRecentredSlots')
      : t('studyAifg.formation-pattern-interface.model.phase.wingsStayOldTargets');
  if (state.step < example.turnEndStep)
    return example.driftCorrection === 1
      ? t('studyAifg.formation-pattern-interface.model.phase.centredTargetsTurnAnchor')
      : t('studyAifg.formation-pattern-interface.model.phase.offCentreTargetsTurn');
  const trackingError =
    state.formation.assignment.reduce((sum, { slot, unitId }) => {
      const member = state.members.find(({ id }) => id === unitId);
      return sum + (member ? distance(member.position, slotPosition(state.formation, slot)) : 0);
    }, 0) / state.members.length;
  if (example.driftCorrection === 0)
    return trackingError < 0.02
      ? t('studyAifg.formation-pattern-interface.model.phase.wingsNearlyTargetsYet')
      : t('studyAifg.formation-pattern-interface.model.phase.turnEndedReachingUncorrected');
  return trackingError < 0.02
    ? t('studyAifg.formation-pattern-interface.model.phase.wingsNearlyCentredTargets')
    : t('studyAifg.formation-pattern-interface.model.phase.turnEndedWingsCan');
}

function frameValues(t: StudyTranslate, description: RosterFrame): StudyValues {
  const { state, example, relationship, seconds, count, formation, targets, rawTargets } =
    description;

  return {
    ...Object.fromEntries(
      Object.entries(example).map(([name, value]) => [
        name,
        typeof value === 'number'
          ? String(Number(decimal(value)))
          : name === 'pattern'
            ? t('studyAifg.formation-pattern-interface.record.parameters.pattern')
            : value,
      ]),
    ),
    correctionState:
      example.driftCorrection === 1
        ? t('studyAifg.formation-pattern-interface.model.values.correctionEnabled')
        : t('studyAifg.formation-pattern-interface.model.values.off'),
    correctionReading:
      example.driftCorrection === 1
        ? t('studyAifg.formation-pattern-interface.model.values.occupiedTargetsCentredAnchor')
        : t('studyAifg.formation-pattern-interface.model.values.originalOffsetsKeptOccupied'),
    departureDriftLength: decimal(length(centroid(state.rawSlots.slice(1)))),
    patternRelationship: relationship,
    time: decimal(seconds),
    releaseSeconds: decimal(example.releaseStep * example.timeStep),
    turnStartSeconds: decimal(example.turnStartStep * example.timeStep),
    turnEndSeconds: decimal(example.turnEndStep * example.timeStep),
    activeCount: String(count),
    occupiedSlots: formation.assignment.map(({ slot }) => String(slot)).join(', '),
    supportAnswer:
      count <= example.capacity
        ? t('studyAifg.formation-pattern-interface.model.values.yes')
        : t('studyAifg.formation-pattern-interface.model.values.no'),
    driftPosition: vectorText(state.drift),
    driftLength: decimal(length(state.drift)),
    headingDegrees: decimal((state.angle * 180) / Math.PI),
    anchorPosition: vectorText(formation.anchor),
    meanPosition: vectorText(rosterMemberMean(state)),
    memberPositions: state.members
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
      .join('; '),
    slotPositions: targets
      .map(({ id, slot, position }) =>
        t('studyAifg.formation-pattern-interface.model.values.slot', {
          id: escortName(t, id),
          slot,
          position: vectorText(position),
        }),
      )
      .join('; '),
    rawPositions: rawTargets
      .map(({ slot, position }) =>
        t('studyAifg.formation-pattern-interface.model.labels.rawSlotPosition', {
          slot,
          position: vectorText(position),
        }),
      )
      .join('; '),
    centreGap: decimal(rosterCentreGap(state)),
    targetGap: decimal(rosterTargetGap(state)),
  };
}

function describeFrame(
  t: StudyTranslate,
  sample: RosterSample,
  example: RosterParameters,
): RosterFrame {
  const { state } = sample;
  const next = sample.nextMembers[0];

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
      t('studyAifg.formation-pattern-interface.model.labels.slot', {
        slot,
        position: vectorText(state.rawSlots[slot]),
      }),
    )
    .join('; ');
  const relationship =
    state.step < example.releaseStep
      ? t('studyAifg.formation-pattern-interface.model.labels.fullRosterTargetsShare')
      : example.driftCorrection === 0
        ? t('studyAifg.formation-pattern-interface.model.labels.wingTargetsRemainOff')
        : state.step === example.releaseStep
          ? t('studyAifg.formation-pattern-interface.model.labels.correctedWingTargetsCentred')
          : t('studyAifg.formation-pattern-interface.model.labels.correctedWingTargetsStay');
  return {
    state,
    example,
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

function frameWorkedLines(t: StudyTranslate, description: RosterFrame): readonly string[] {
  const { state, example } = description;

  return [
    t('studyAifg.formation-pattern-interface.model.worked.escortsChosenTargetsUncorrected', {
      members: state.members
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
        .join('; '),
      targets: description.targets
        .map(({ slot, position }) =>
          t('studyAifg.formation-pattern-interface.model.labels.rawSlotPosition', {
            slot,
            position: vectorText(position),
          }),
        )
        .join('; '),
      rawTargets: description.rawTargets
        .map(({ slot, position }) =>
          t('studyAifg.formation-pattern-interface.model.labels.rawSlotPosition', {
            slot,
            position: vectorText(position),
          }),
        )
        .join('; '),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.supportsSlotsTruePlacePattern', {
      count: description.count,
      exampleCapacity: example.capacity,
      occupiedText: description.occupiedText,
    }),
    t('studyAifg.formation-pattern-interface.model.worked.driftXDriftY', {
      xCoordinates: description.occupied.map(({ x }) => decimal(x)).join(' + '),
      count: description.count,
      driftX: decimal(state.drift.x),
      yCoordinates: description.occupied.map(({ y }) => decimal(y)).join(' + '),
      driftY: decimal(state.drift.y),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.keepsSlotCorrectLocal', {
      focusId: escortName(t, description.focus.id),
      focusSlot: description.focusSlot,
      raw: vectorText(description.raw),
      exampleDriftCorrection: decimal(example.driftCorrection),
      stateDrift: vectorText(state.drift),
      corrected: vectorText(description.corrected),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.headingGivesCosSin', {
      stateAngle: decimal((state.angle * 180) / Math.PI),
      headingX: decimal(description.formation.heading.x),
      headingY: decimal(description.formation.heading.y),
      anchorX: decimal(description.formation.anchor.x),
      correctedX: decimal(description.corrected.x),
      correctedY: decimal(description.corrected.y),
      targetX: decimal(description.target.x),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.worldYSinCos', {
      anchorY: decimal(description.formation.anchor.y),
      correctedX: decimal(description.corrected.x),
      correctedY: decimal(description.corrected.y),
      targetY: decimal(description.target.y),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.engineArriveGivesAcceleration', {
      focusPosition: vectorText(description.focus.position),
      acceleration: vectorText(description.acceleration),
      focusVelocity: vectorText(description.focus.velocity),
      exampleTimeStep: decimal(example.timeStep),
      nextVelocity: vectorText(description.next.velocity),
    }),
    t('studyAifg.formation-pattern-interface.model.worked.integrateUpdatedVelocityTarget', {
      focusPosition: vectorText(description.focus.position),
      nextVelocity: vectorText(description.next.velocity),
      exampleTimeStep: decimal(example.timeStep),
      nextPosition: vectorText(description.next.position),
      targetGap: decimal(rosterTargetGap(state)),
      centreGap: decimal(rosterCentreGap(state)),
    }),
  ];
}

function frameWorked(t: StudyTranslate, description: RosterFrame): StudyWorkedStep {
  return {
    title: t('studyAifg.formation-pattern-interface.model.worked.patternContract', {
      seconds: decimal(description.seconds),
    }),
    lines: frameWorkedLines(t, description),
    note: t('studyAifg.formation-pattern-interface.model.worked.subtractDriftLocalCoordinates'),
  };
}

function frameOf(t: StudyTranslate, description: RosterFrame): MotionFrame {
  const { state, example } = description;

  return {
    seconds: description.seconds,
    bodies: state.members.map(({ id, position }) => ({
      id,
      ...position,
      label:
        id === 'lookout'
          ? t('studyAifg.formation-pattern-interface.model.labels.lookout')
          : id === 'port'
            ? t('studyAifg.formation-pattern-interface.model.labels.port')
            : t('studyAifg.formation-pattern-interface.model.labels.starboard'),
      tone: 'subject',
    })),
    marks: [
      {
        ...description.formation.anchor,
        label: t('studyAifg.formation-pattern-interface.model.labels.anchor'),
        shape: 'cross',
        tone: 'target',
      },
      {
        ...rosterMemberMean(state),
        label: t('studyAifg.formation-pattern-interface.model.labels.mean'),
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
        label: t('studyAifg.formation-pattern-interface.model.labels.slotLabel', {
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
    values: frameValues(t, description),
    note: noteOf(t, description),
    worked: frameWorked(t, description),
  };
}

function compareRuns(t: StudyTranslate, run: RosterDescription): StudyComparison {
  const { example, comparisonCorrection, corrected, uncorrected, last, lastUncorrected, seconds } =
    run;

  return {
    title: t('studyAifg.formation-pattern-interface.model.comparison.compareOccupiedSlotDrift'),
    intro: t(
      'studyAifg.formation-pattern-interface.model.comparison.changeDriftCorrectionChartCompares',
      {
        exampleDriftCorrection: decimal(example.driftCorrection),
        comparisonCorrection: decimal(comparisonCorrection),
      },
    ),
    timeline: {
      title: t('studyAifg.formation-pattern-interface.model.comparison.actualMemberMeanFixed'),
      xLabel: t('studyAifg.formation-pattern-interface.model.labels.timeSeconds'),
      yLabel: t('studyAifg.formation-pattern-interface.model.comparison.centreGap'),
      seconds,
      yRange: [
        0,
        Math.max(...corrected.map(rosterCentreGap), ...uncorrected.map(rosterCentreGap)) * 1.1,
      ],
      series: [
        {
          id: 'corrected',
          label: t(
            'studyAifg.formation-pattern-interface.model.comparison.subtractOccupiedSlotDrift',
          ),
          tone: 'actual',
          values: corrected.map(rosterCentreGap),
        },
        {
          id: 'uncorrected',
          label: t('studyAifg.formation-pattern-interface.model.comparison.useFullPatternOffsets'),
          tone: 'desired',
          values: uncorrected.map(rosterCentreGap),
        },
      ],
    },
    findings: [
      t('studyAifg.formation-pattern-interface.model.comparison.actualCentreGapCorrection', {
        exampleSteps: decimal(example.steps * example.timeStep),
        correctedGap: decimal(rosterCentreGap(last)),
        uncorrectedGap: decimal(rosterCentreGap(lastUncorrected)),
      }),
      t('studyAifg.formation-pattern-interface.model.comparison.withoutCorrectionTargetMean', {
        targetGap: decimal(rosterTargetGap(lastUncorrected)),
      }),
    ],
    note: t('studyAifg.formation-pattern-interface.model.comparison.anchorStaysFixedRuns'),
  };
}

function runTimeline(t: StudyTranslate, run: RosterDescription): TimelineModel {
  const { states, seconds } = run;

  return {
    title: t('studyAifg.formation-pattern-interface.model.timeline.geometricDriftCentreActually'),
    xLabel: t('studyAifg.formation-pattern-interface.model.labels.timeSeconds'),
    yLabel: t('studyAifg.formation-pattern-interface.model.timeline.distance'),
    seconds,
    yRange: [
      0,
      Math.max(...states.map((state) => Math.max(length(state.drift), rosterCentreGap(state)))) *
        1.1,
    ],
    series: [
      {
        id: 'drift',
        label: t(
          'studyAifg.formation-pattern-interface.model.timeline.occupiedLocalDriftMagnitude',
        ),
        tone: 'muted',
        values: states.map(({ drift }) => length(drift)),
      },
      {
        id: 'targets',
        label: t('studyAifg.formation-pattern-interface.model.timeline.chosenTargetMeanAnchor'),
        tone: 'desired',
        values: states.map(rosterTargetGap),
      },
      {
        id: 'members',
        label: t('studyAifg.formation-pattern-interface.model.timeline.actualMemberMeanAnchor'),
        tone: 'actual',
        values: states.map(rosterCentreGap),
      },
    ],
  };
}

function motionLegend(t: StudyTranslate): readonly StudyLegendEntry[] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.formation-pattern-interface.model.labels.dotsEscortsRoster'),
    },
    {
      tone: 'target',
      label: t('studyAifg.formation-pattern-interface.model.labels.crossFixedAnchor'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.formation-pattern-interface.model.labels.chosenSlotRingsLinks'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.formation-pattern-interface.model.labels.uncorrectedTargetDotsChart'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.formation-pattern-interface.model.labels.actualMemberMeanDot'),
    },
    {
      tone: 'other',
      label: t('studyAifg.formation-pattern-interface.model.labels.arrowAnchorForwardDirection'),
    },
  ];
}

function runMoments(t: StudyTranslate, example: RosterParameters): readonly StudyMoment[] {
  return [
    { label: t('studyAifg.formation-pattern-interface.model.moments.fullPattern'), step: 0 },
    {
      label: t('studyAifg.formation-pattern-interface.model.moments.lookoutLeaves'),
      step: example.releaseStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.moments.turnStarts'),
      step: example.turnStartStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.moments.turnEnds'),
      step: example.turnEndStep,
    },
    {
      label: t('studyAifg.formation-pattern-interface.model.moments.targetsFollowed'),
      step: example.steps,
    },
  ];
}

export const present = (
  example: RosterParameters,
  statesSamples: readonly RosterSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, statesSamples);
  const rawFrames = statesSamples.map((sample) => frameOf(t, describeFrame(t, sample, example)));
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const bounds: MotionBounds = boundsOfPoints(points, example.spacing / 2);
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds, 'marks'));
  return {
    family: 'motion',
    motion: { frames, bounds },
    timeline: runTimeline(t, run),
    initialStep: example.releaseStep,
    moments: runMoments(t, example),
    legend: motionLegend(t),
    caption: t('studyAifg.formation-pattern-interface.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: [
      {
        name: 'spacing',
        label: t('studyAifg.formation-pattern-interface.model.labels.slotSpacing'),
        unit: t('studyAifg.formation-pattern-interface.model.inputs.unitUnits'),
        min: 2,
        max: 4,
        step: 0.5,
      },
      {
        name: 'driftCorrection',
        label: t('studyAifg.formation-pattern-interface.model.labels.driftCorrection'),
        unit: t('studyAifg.formation-pattern-interface.model.labels.off'),
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
      return t('studyAifg.formation-pattern-interface.model.names.escortNamelookout');
    case 'port':
      return t('studyAifg.formation-pattern-interface.model.names.escortNameport');
    case 'starboard':
      return t('studyAifg.formation-pattern-interface.model.names.escortNamestarboard');
    default:
      return value;
  }
}
