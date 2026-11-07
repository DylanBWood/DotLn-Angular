import {
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
  MotionBody,
  MotionBounds,
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  StudyComparison,
  StudyLegendEntry,
  StudyValues,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, type PresentationMember } from './presentation';
import {
  escortLag,
  type EscortParameters,
  type EscortSample,
  escortSamples,
  escortSlotError,
  type EscortState,
  meanOf,
} from './two-level-formation-steering.simulation';

interface EscortSlot {
  readonly id: string;
  readonly position: Vec2;
}
interface EscortFrame extends EscortSample {
  readonly example: EscortParameters;
  readonly step: number;
  readonly seconds: number;
  readonly formation: FormationState;
  readonly objective: Vec2;
  readonly mean: Vec2;
  readonly slots: readonly EscortSlot[];
  readonly requestedSpeed: number;
  readonly firstTarget: Vec2;
  readonly first: PresentationMember;
  readonly acceleration: Vec2;
  readonly nextFirst: PresentationMember;
  readonly gap: number;
}
interface EscortDescription {
  readonly example: EscortParameters;
  readonly states: readonly EscortState[];
  readonly loose: readonly EscortState[];
  readonly seconds: readonly number[];
  readonly firstClip: number;
  readonly initialStep: number;
}
function describeRun(
  example: EscortParameters,
  samples: readonly EscortSample[],
): EscortDescription {
  const states = samples.map(({ state }) => state);
  const loose = escortSamples({ ...example, lagLimit: example.comparisonLagLimit }).map(
    ({ state }) => state,
  );
  const seconds = samples.map((_sample, step) => step * example.timeStep);
  const firstClip = samples.findIndex(({ calculation }) => calculation.capped);
  const initialStep =
    firstClip < 0 ? Math.floor(example.steps / 2) : Math.min(firstClip + 1, example.steps);
  return { example, states, loose, seconds, firstClip, initialStep };
}
function peakError(run: readonly EscortState[]): number {
  return Math.max(...run.map(escortSlotError));
}

const { number: decimal, vector: vectorText } = createNumberFormat({ zeroThreshold: 0.005 });

function noteOf(t: StudyTranslate, description: EscortFrame): string {
  const { example, state, step, calculation } = description;

  if (step === 0)
    return t('studyAifg.two-level-formation-steering.model.phase.robotsStartSlotsAnchor');
  const targetGap = distance(state.formation.anchor, {
    x: example.objectiveX,
    y: example.objectiveY,
  });
  if (targetGap < example.anchorSlowRadius)
    return t('studyAifg.two-level-formation-steering.model.phase.anchorSlowsNearBeacon');
  if (calculation.capped)
    return t('studyAifg.two-level-formation-steering.model.phase.lagLimitHoldsAnchor');
  if (
    length(state.formation.anchorVelocity) <
    example.anchorSpeed / example.planningStepSeconds - 0.005
  )
    return t('studyAifg.two-level-formation-steering.model.phase.anchorAcceleratesAheadDrawing');
  return t('studyAifg.two-level-formation-steering.model.phase.slotsDrawingAwayRobots');
}

function escortWorkedLines(t: StudyTranslate, description: EscortFrame): readonly string[] {
  const {
    example,
    state,
    calculation,
    formation,
    slots,
    requestedSpeed,
    firstTarget,
    first,
    acceleration,
    nextFirst,
    gap,
  } = description;

  return [
    t('studyAifg.two-level-formation-steering.model.worked.membersSlots', {
      members: state.members
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
        .join('; '),
      slots: slots
        .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
        .join('; '),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.lanternReadsCurrentSlot', {
      firstTarget: vectorText(firstTarget),
      firstPosition: vectorText(first.position),
      acceleration: vectorText(acceleration),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.updateVelocityCappedNext', {
      firstVelocity: vectorText(first.velocity),
      acceleration: vectorText(acceleration),
      exampleTimeStep: decimal(example.timeStep),
      nextFirstVelocity: vectorText(nextFirst.velocity),
      exampleMemberSpeed: decimal(example.memberSpeed),
      nextFirstPosition: vectorText(nextFirst.position),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.afterAllMembersMove', {
      calculationMean: vectorText(calculation.mean),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.requestedAnchorSpeedMin', {
      exampleAnchorSpeed: decimal(example.anchorSpeed),
      examplePlanningStepSeconds: decimal(example.planningStepSeconds),
      gap: decimal(gap),
      exampleAnchorStopRadius: decimal(example.anchorStopRadius),
      exampleAnchorSlowRadius: decimal(example.anchorSlowRadius),
      requestedSpeed: decimal(requestedSpeed),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.engineLimitsChangePlanning', {
      exampleAnchorAcceleration: decimal(example.anchorAcceleration),
      exampleTimeStep: decimal(example.timeStep),
      maximumVelocityChange: decimal(example.anchorAcceleration * example.timeStep),
      formationAnchorVelocity: vectorText(calculation.next.formation.anchorVelocity),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.propose', {
      formationAnchor: vectorText(formation.anchor),
      formationAnchorVelocity: vectorText(calculation.next.formation.anchorVelocity),
      exampleTimeStep: decimal(example.timeStep),
      calculationProposed: vectorText(calculation.proposed),
    }),
    t('studyAifg.two-level-formation-steering.model.worked.pullTowardsMeanGap', {
      calculationProposed: vectorText(calculation.proposed),
      exampleAnchorPull: decimal(example.anchorPull),
      calculationMean: vectorText(calculation.mean),
      calculationPulled: vectorText(calculation.pulled),
      calculationPulledLag: decimal(calculation.pulledLag),
    }),
    calculation.capped
      ? t('studyAifg.two-level-formation-steering.model.worked.clipGapMeanNormalise', {
          exampleLagLimit: decimal(example.lagLimit),
          formationAnchor: vectorText(calculation.next.formation.anchor),
        })
      : t('studyAifg.two-level-formation-steering.model.worked.gapWithinNextAnchor', {
          exampleLagLimit: decimal(example.lagLimit),
          formationAnchor: vectorText(calculation.next.formation.anchor),
        }),
  ];
}

function frameValues(t: StudyTranslate, description: EscortFrame): StudyValues {
  const {
    example,
    state,
    seconds,
    calculation,
    formation,
    objective,
    mean,
    slots,
    requestedSpeed,
  } = description;

  return {
    ...Object.fromEntries(
      Object.entries(example).map(([name, value]) => [
        name,
        typeof value === 'number'
          ? String(Number(decimal(value)))
          : name === 'pattern'
            ? t('studyAifg.two-level-formation-steering.record.parameters.pattern')
            : value,
      ]),
    ),
    time: decimal(seconds),
    memberPositions: state.members
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
      .join('; '),
    slotPositions: slots
      .map(({ id, position }) => `${escortName(t, id)} ${vectorText(position)}`)
      .join('; '),
    anchorPosition: vectorText(formation.anchor),
    meanPosition: vectorText(mean),
    objectivePosition: vectorText(objective),
    proposedPosition: vectorText(calculation.proposed),
    nextAnchorPosition: vectorText(calculation.next.formation.anchor),
    lag: decimal(escortLag(state)),
    slotError: decimal(escortSlotError(state)),
    requestedSpeed: decimal(requestedSpeed),
    maximumRequestedSpeed: decimal(example.anchorSpeed / example.planningStepSeconds),
    planningSpeed: decimal(length(formation.anchorVelocity)),
  };
}

function frameMarks(t: StudyTranslate, description: EscortFrame): readonly MotionMark[] {
  const { calculation, objective, mean, slots } = description;

  return [
    {
      ...objective,
      label: t('studyAifg.two-level-formation-steering.model.labels.beacon'),
      shape: 'cross',
      tone: 'target',
    },
    {
      ...mean,
      label: t('studyAifg.two-level-formation-steering.model.labels.mean'),
      shape: 'dot',
      tone: 'other',
    },
    {
      ...calculation.proposed,
      label: t('studyAifg.two-level-formation-steering.model.labels.proposal'),
      shape: 'dot',
      tone: 'muted',
    },
    ...slots.map(({ position }, index) => ({
      ...position,
      label: t('studyAifg.two-level-formation-steering.model.labels.slot', {
        index,
      }),
      shape: 'ring' as const,
      tone: 'desired' as const,
    })),
  ];
}

function frameBodies(t: StudyTranslate, description: EscortFrame): readonly MotionBody[] {
  const { state, formation } = description;

  return [
    ...state.members.map(({ id, position }) => ({
      id,
      ...position,
      label:
        id === 'lantern'
          ? t('studyAifg.two-level-formation-steering.model.labels.lantern')
          : id === 'port'
            ? t('studyAifg.two-level-formation-steering.model.labels.port')
            : t('studyAifg.two-level-formation-steering.model.labels.starboard'),
      tone: 'subject' as const,
    })),
    {
      id: 'anchor',
      label: t('studyAifg.two-level-formation-steering.model.labels.anchor'),
      ...formation.anchor,
      tone: 'actual',
      heading: Math.atan2(formation.heading.y, formation.heading.x),
    },
  ];
}

function describeFrame(sample: EscortSample, step: number, example: EscortParameters): EscortFrame {
  const { state, calculation } = sample;

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
    ...sample,
    example,
    step,
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

function frameOf(t: StudyTranslate, description: EscortFrame): MotionFrame {
  const { example, state } = description;

  return {
    seconds: description.seconds,
    bodies: frameBodies(t, description),
    marks: frameMarks(t, description),
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
    values: frameValues(t, description),
    note: noteOf(t, description),
    worked: {
      title: t('studyAifg.two-level-formation-steering.model.worked.escortUpdate', {
        seconds: decimal(description.seconds),
        nextSeconds: decimal(description.seconds + example.timeStep),
      }),
      lines: escortWorkedLines(t, description),
      note: t('studyAifg.two-level-formation-steering.model.worked.allMembersReadPrevious'),
    },
  };
}

function compareRuns(t: StudyTranslate, run: EscortDescription): StudyComparison {
  const { example, states, loose, seconds } = run;

  return {
    title: t('studyAifg.two-level-formation-steering.model.comparison.looseLagLimitStretches'),
    intro: t(
      'studyAifg.two-level-formation-steering.model.comparison.changeLagLimitGeometryAnchor',
      {
        exampleLagLimit: decimal(example.lagLimit),
        exampleComparisonLagLimit: decimal(example.comparisonLagLimit),
      },
    ),
    timeline: {
      title: t(
        'studyAifg.two-level-formation-steering.model.comparison.meanDistanceMembersAssigned',
      ),
      xLabel: t('studyAifg.two-level-formation-steering.model.labels.timeSeconds'),
      yLabel: t('studyAifg.two-level-formation-steering.model.comparison.slotError'),
      seconds,
      yRange: [0, Math.max(peakError(states), peakError(loose)) * 1.1],
      series: [
        {
          id: 'tight',
          label: t('studyAifg.two-level-formation-steering.model.comparison.lagLimit', {
            exampleLagLimit: decimal(example.lagLimit),
          }),
          tone: 'actual',
          values: states.map(escortSlotError),
        },
        {
          id: 'loose',
          label: t('studyAifg.two-level-formation-steering.model.comparison.alternativeLagLimit', {
            exampleComparisonLagLimit: decimal(example.comparisonLagLimit),
          }),
          tone: 'desired',
          values: loose.map(escortSlotError),
        },
      ],
    },
    findings: [
      t('studyAifg.two-level-formation-steering.model.comparison.peakMeanSlotError', {
        selectedPeakError: decimal(peakError(states)),
        loosePeakError: decimal(peakError(loose)),
      }),
      t('studyAifg.two-level-formation-steering.model.comparison.tightAnchorLooseAnchor', {
        exampleSteps: decimal(example.steps * example.timeStep),
        formationAnchor: vectorText(states[example.steps].formation.anchor),
        looseAnchor: vectorText(loose[example.steps].formation.anchor),
      }),
    ],
    note: t('studyAifg.two-level-formation-steering.model.comparison.anchorCapBoundsDistance'),
  };
}

function motionLegend(t: StudyTranslate): readonly StudyLegendEntry[] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.two-level-formation-steering.model.labels.dotsLanternPortStarboard'),
    },
    {
      tone: 'actual',
      label: t(
        'studyAifg.two-level-formation-steering.model.labels.anchorArrowheadDisplacementChart',
      ),
    },
    {
      tone: 'desired',
      label: t('studyAifg.two-level-formation-steering.model.labels.slotRingsLinksChart'),
    },
    {
      tone: 'other',
      label: t('studyAifg.two-level-formation-steering.model.labels.dotLinkActualMember'),
    },
    {
      tone: 'muted',
      label: t('studyAifg.two-level-formation-steering.model.labels.dotNextAnchorProposal'),
    },
    {
      tone: 'target',
      label: t('studyAifg.two-level-formation-steering.model.labels.crossHarbourBeaconObjective'),
    },
    {
      tone: 'zone',
      label: t('studyAifg.two-level-formation-steering.model.labels.circleAllowedAnchorDistance'),
    },
  ];
}

function runTimeline(t: StudyTranslate, run: EscortDescription): TimelineModel {
  const { example, states, seconds } = run;

  return {
    title: t('studyAifg.two-level-formation-steering.model.timeline.anchorLagMeanSlot'),
    xLabel: t('studyAifg.two-level-formation-steering.model.labels.timeSeconds'),
    yLabel: t('studyAifg.two-level-formation-steering.model.timeline.distance'),
    seconds,
    yRange: [0, Math.max(example.lagLimit, ...states.map(escortSlotError)) * 1.1],
    reference: example.lagLimit,
    series: [
      {
        id: 'lag',
        label: t('studyAifg.two-level-formation-steering.model.timeline.anchorActualMemberMean'),
        tone: 'actual',
        values: states.map(escortLag),
      },
      {
        id: 'slot-error',
        label: t('studyAifg.two-level-formation-steering.model.timeline.meanMemberAssignedSlot'),
        tone: 'desired',
        values: states.map(escortSlotError),
      },
    ],
  };
}

export const present = (
  example: EscortParameters,
  statesSamples: readonly EscortSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, statesSamples);
  const { firstClip, initialStep } = run;
  const rawFrames = statesSamples.map((sample, step) =>
    frameOf(t, describeFrame(sample, step, example)),
  );
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const bounds: MotionBounds = boundsOfPoints(points, example.spacing * 2);
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds));
  return {
    family: 'motion',
    motion: { frames, bounds },
    timeline: runTimeline(t, run),
    initialStep,
    moments: [
      {
        label: t('studyAifg.two-level-formation-steering.model.labels.formedRest'),
        step: 0,
      },
      {
        label: t('studyAifg.two-level-formation-steering.model.labels.firstAnchorPull'),
        step: 1,
      },
      {
        label:
          firstClip < 0
            ? t('studyAifg.two-level-formation-steering.model.labels.pullRestrainsLead')
            : t('studyAifg.two-level-formation-steering.model.labels.lagLimitActs'),
        step: initialStep,
      },
      {
        label: t('studyAifg.two-level-formation-steering.model.labels.laterMarch'),
        step: example.steps,
      },
    ],
    legend: motionLegend(t),
    caption: t('studyAifg.two-level-formation-steering.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: [
      {
        name: 'lagLimit',
        label: t('studyAifg.two-level-formation-steering.model.labels.anchorLagLimit'),
        unit: t('studyAifg.two-level-formation-steering.model.inputs.unitUnits'),
        min: 4,
        max: 10,
        step: 1,
      },
      {
        name: 'memberSpeed',
        label: t('studyAifg.two-level-formation-steering.model.labels.robotSpeedLimit'),
        unit: t('studyAifg.two-level-formation-steering.model.inputs.unitUnitsS'),
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
      return t('studyAifg.two-level-formation-steering.model.names.escortNamelantern');
    case 'port':
      return t('studyAifg.two-level-formation-steering.model.names.escortNameport');
    case 'starboard':
      return t('studyAifg.two-level-formation-steering.model.names.escortNamestarboard');
    default:
      return value;
  }
}
