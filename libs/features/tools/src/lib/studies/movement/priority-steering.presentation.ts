import { distance, length } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints, decimal as fixed, vectorText as vector } from './presentation';
import {
  type PriorityParameters,
  type PriorityStep,
  prioritySteps,
} from './priority-steering.simulation';

const orderName = (t: StudyTranslate, priority: number) =>
  priority === 1
    ? t('studyAifg.priority-steering.model.clearanceFirst')
    : t('studyAifg.priority-steering.model.travelFirst');

function noteOf(
  t: StudyTranslate,
  step: PriorityStep,
  contactDistance: number,
  example: PriorityParameters,
) {
  if (step.gap <= contactDistance)
    return t('studyAifg.priority-steering.model.phaseMicaTouchesTrolleyBecause');
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? t('studyAifg.priority-steering.model.phaseThresholdSilencesGroupsLeaving')
      : t('studyAifg.priority-steering.model.phaseNeitherGroupClearsThreshold');
  if (step.activeGroup === 'Travel') {
    if (length(step.clearance) > example.epsilon)
      return t('studyAifg.priority-steering.model.phaseTravelWinsDespiteClearance');
    return length(step.separation) === 0
      ? t('studyAifg.priority-steering.model.phaseTrolleyOutsideBufferTravel')
      : t('studyAifg.priority-steering.model.phaseClearanceTooSmallTake');
  }
  const nextGap = distance(step.next.position, { x: example.trolleyPosition, y: 0 });
  return nextGap < step.gap
    ? t('studyAifg.priority-steering.model.phaseClearanceBrakingMicaClosing')
    : t('studyAifg.priority-steering.model.phaseMicaMovesAwayTrolley');
}

function describeRun(
  t: StudyTranslate,
  example: PriorityParameters,
  run: ReturnType<typeof prioritySteps>,
) {
  const comparisonPriority = example.clearancePriority === 1 ? 2 : 1;
  const comparison = prioritySteps(example, comparisonPriority);
  const seconds = run.map((_step, index) => index * example.timeStep);
  const contactDistance = example.radius * 2;
  const minimumGap = Math.min(...run.map(({ gap }) => gap));
  const comparisonMinimumGap = Math.min(...comparison.map(({ gap }) => gap));
  const touchingSamples = run.filter(({ gap }) => gap <= contactDistance).length;
  const comparisonTouchingSamples = comparison.filter(({ gap }) => gap <= contactDistance).length;
  const switches = run.filter(
    (step, index) => index > 0 && step.activeGroup !== run[index - 1].activeGroup,
  ).length;
  const firstClearance = run.findIndex(({ activeGroup }) => activeGroup === 'Clearance');
  const closest = run.reduce((best, step, index) => (step.gap < run[best].gap ? index : best), 0);
  const order = orderName(t, example.clearancePriority);
  const comparisonOrder = orderName(t, comparisonPriority);
  const outcome =
    touchingSamples > 0
      ? t('studyAifg.priority-steering.model.micaTouchesTrolleyChosen')
      : run.every(({ activeGroup }) => activeGroup === 'None')
        ? t('studyAifg.priority-steering.model.chosenThresholdPreventsMica')
        : t('studyAifg.priority-steering.model.chosenRunStaysOutside');
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  const lane = example.separationThreshold / 2;
  // Separate label stems keep the names apart even when Mica overlaps a stationary mark.
  const labelHeight = example.separationThreshold + example.radius;
  const trolley = { x: example.trolleyPosition, y: 0 };
  const bay = { x: example.target, y: 0 };
  return {
    trolley,
    seconds,
    lane,
    bay,
    labelHeight,
    contactDistance,
    inputValues,
    minimumGap,
    comparisonMinimumGap,
    touchingSamples,
    comparisonTouchingSamples,
    switches,
    order,
    firstClearance,
    closest,
    comparisonOrder,
    comparison,
    outcome,
  };
}

function frameWorked(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  index: number,
  step: PriorityStep,
  example: PriorityParameters,
): StudyWorkedStep {
  return {
    title: t('studyAifg.priority-steering.model.workedMica', {
      seconds: fixed(reading.seconds[index]),
    }),
    lines: [
      t('studyAifg.priority-steering.model.workedBeginPositionVelocityTrolley', {
        statePosition: vector(step.state.position),
        stateVelocity: vector(step.state.velocity),
        trolley: vector(reading.trolley),
        stepGap: fixed(step.gap),
      }),
      length(step.separation) === 0
        ? t('studyAifg.priority-steering.model.workedGapLeastSeparationWhole', {
            exampleSeparationThreshold: fixed(example.separationThreshold),
          })
        : step.gap === 0 || step.state.position.y !== 0
          ? t('studyAifg.priority-steering.model.workedEngineSeparationDisplacementGives', {
              stepSeparation: vector(step.separation),
            })
          : t('studyAifg.priority-steering.model.workedLinearSeparationAlongAisle', {
              value1: Math.sign(step.state.position.x - reading.trolley.x),
              exampleMaxAcceleration: fixed(example.maxAcceleration),
              exampleSeparationThreshold: fixed(example.separationThreshold),
              stepGap: fixed(step.gap),
              separationX: fixed(step.separation.x),
            }),
      t('studyAifg.priority-steering.model.workedBrakeClipLength', {
        stateVelocity: vector(step.state.velocity),
        exampleResponseTime: fixed(example.responseTime),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepBrake: vector(step.brake),
      }),
      t('studyAifg.priority-steering.model.workedWhenSeparationActiveClearance', {
        exampleSeparationWeight: fixed(example.separationWeight),
        stepSeparation: vector(step.separation),
        exampleBrakeWeight: fixed(example.brakeWeight),
        stepBrake: vector(step.brake),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepClearance: vector(step.clearance),
      }),
      t('studyAifg.priority-steering.model.workedTravelEngineArriveTowards', {
        bay: vector(reading.bay),
        stepTravel: vector(step.travel),
        order: reading.order,
        stepActiveGroup: groupName(t, step.activeGroup),
        exampleEpsilon: fixed(example.epsilon),
      }),
      t('studyAifg.priority-steering.model.workedNewVelocityClipLength', {
        stateVelocity: vector(step.state.velocity),
        stepAcceleration: vector(step.acceleration),
        exampleTimeStep: fixed(example.timeStep),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: vector(step.next.velocity),
      }),
      t('studyAifg.priority-steering.model.workedNewPosition', {
        statePosition: vector(step.state.position),
        nextVelocity: vector(step.next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: vector(step.next.position),
      }),
    ],
    note: t('studyAifg.priority-steering.model.workedDisplayedValuesRoundedCalculations'),
  };
}

function compareRuns(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  run: ReturnType<typeof prioritySteps>,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.priority-steering.model.comparisonReverseGroupOrder'),
    intro: t('studyAifg.priority-steering.model.comparisonChangeClearancePriorityBecomes', {
      order: reading.order,
      comparisonOrder: reading.comparisonOrder,
      contactDistance: fixed(reading.contactDistance),
    }),
    timeline: {
      title: t('studyAifg.priority-steering.model.comparisonDistanceParkedTrolley'),
      xLabel: t('studyAifg.priority-steering.model.timeSeconds'),
      yLabel: t('studyAifg.priority-steering.model.comparisonCentreDistance'),
      seconds: reading.seconds,
      yRange: [
        0,
        Math.max(
          reading.contactDistance,
          ...run.map(({ gap }) => gap),
          ...reading.comparison.map(({ gap }) => gap),
        ),
      ],
      reference: reading.contactDistance,
      series: [
        { id: 'chosen', label: reading.order, tone: 'actual', values: run.map(({ gap }) => gap) },
        {
          id: 'reversed',
          label: reading.comparisonOrder,
          tone: 'desired',
          values: reading.comparison.map(({ gap }) => gap),
        },
      ],
    },
    findings: [
      t('studyAifg.priority-steering.model.comparisonMinimumGapSampledTouching', {
        order: reading.order,
        minimumGap: fixed(reading.minimumGap),
        touchingSamples: reading.touchingSamples,
        comparisonOrder: reading.comparisonOrder,
        comparisonMinimumGap: fixed(reading.comparisonMinimumGap),
        comparisonTouchingSamples: reading.comparisonTouchingSamples,
      }),
      t('studyAifg.priority-steering.model.comparisonChosenRunChangesSelected', {
        outcome: reading.outcome,
        switches: reading.switches,
      }),
    ],
    note: t('studyAifg.priority-steering.model.comparisonLinesJoinFixedStep'),
  };
}

function frameValues(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  index: number,
  step: PriorityStep,
  pushDirection: string,
): Readonly<Record<string, string>> {
  return {
    ...reading.inputValues,
    seconds: fixed(reading.seconds[index]),
    position: vector(step.state.position),
    velocity: vector(step.state.velocity),
    gap: fixed(step.gap),
    clearanceAcceleration: fixed(step.clearance.x),
    travelAcceleration: fixed(step.travel.x),
    acceleration: fixed(step.acceleration.x),
    selectedMagnitude: fixed(length(step.acceleration)),
    activeGroup: groupName(t, step.activeGroup),
    pushDirection,
    trolleyRelationship:
      step.state.position.x < reading.trolley.x
        ? t('studyAifg.priority-steering.model.standsBetweenMicaLoading')
        : step.state.position.x > reading.trolley.x
          ? t('studyAifg.priority-steering.model.behindMicaTowardsStart')
          : t('studyAifg.priority-steering.model.alongsideMica'),
    contactDistance: fixed(reading.contactDistance),
    minimumGap: fixed(reading.minimumGap),
    comparisonMinimumGap: fixed(reading.comparisonMinimumGap),
    touchingSamples: String(reading.touchingSamples),
    comparisonTouchingSamples: String(reading.comparisonTouchingSamples),
    switches: String(reading.switches),
    order: reading.order,
    comparisonOrder: reading.comparisonOrder,
    outcome: reading.outcome,
  };
}

function runTimeline(
  t: StudyTranslate,
  reading: ReturnType<typeof describeRun>,
  example: PriorityParameters,
  run: ReturnType<typeof prioritySteps>,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.priority-steering.model.groupRequestsSelectedAcceleration'),
    xLabel: t('studyAifg.priority-steering.model.timeSeconds'),
    yLabel: t('studyAifg.priority-steering.model.magnitude'),
    seconds: reading.seconds,
    reference: example.epsilon,
    series: [
      {
        id: 'clearance',
        label: t('studyAifg.priority-steering.model.clearanceGroup'),
        tone: 'other',
        values: run.map(({ clearance }) => length(clearance)),
      },
      {
        id: 'travel',
        label: t('studyAifg.priority-steering.model.travelGroup'),
        tone: 'desired',
        values: run.map(({ travel }) => length(travel)),
      },
      {
        id: 'selected',
        label: t('studyAifg.priority-steering.model.selectedAcceleration'),
        tone: 'actual',
        values: run.map(({ acceleration }) => length(acceleration)),
      },
    ],
  };
}

function frameVectors(
  step: PriorityStep,
  reading: ReturnType<typeof describeRun>,
): MotionFrame['vectors'] {
  return [
    {
      x: step.state.position.x,
      y: step.state.position.y - reading.lane,
      dx: step.clearance.x,
      dy: step.clearance.y,
      tone: 'other',
    },
    {
      x: step.state.position.x,
      y: step.state.position.y + reading.lane,
      dx: step.travel.x,
      dy: step.travel.y,
      tone: 'desired',
    },
    {
      ...step.state.position,
      dx: step.acceleration.x,
      dy: step.acceleration.y,
      tone: 'actual',
    },
  ];
}

function motionFrames(
  t: StudyTranslate,
  run: ReturnType<typeof prioritySteps>,
  reading: ReturnType<typeof describeRun>,
  example: PriorityParameters,
): readonly MotionFrame[] {
  return run.map((step, index) => {
    const away =
      (step.state.position.x - reading.trolley.x) * step.acceleration.x +
      step.state.position.y * step.acceleration.y;
    const pushDirection =
      length(step.acceleration) === 0
        ? t('studyAifg.priority-steering.model.noDirectionalCorrection')
        : away > 0
          ? t('studyAifg.priority-steering.model.awayTrolley')
          : away < 0
            ? t('studyAifg.priority-steering.model.towardsTrolley')
            : t('studyAifg.priority-steering.model.acrossAisle');
    return {
      seconds: reading.seconds[index],
      bodies: [
        {
          id: 'Mica',
          ...step.state.position,
          tone: 'subject',
          label: t('studyAifg.priority-steering.model.mica'),
        },
        { id: 'parked trolley', ...reading.trolley, tone: 'other' },
      ],
      vectors: frameVectors(step, reading),
      marks: [
        { ...reading.bay, shape: 'cross', tone: 'target' },
        {
          x: reading.trolley.x,
          y: -reading.labelHeight,
          shape: 'dot',
          tone: 'other',
          label: t('studyAifg.priority-steering.model.trolley'),
        },
        {
          x: reading.bay.x,
          y: reading.labelHeight,
          shape: 'dot',
          tone: 'target',
          label: t('studyAifg.priority-steering.model.bay'),
        },
      ],
      links: [
        {
          from: reading.trolley,
          to: { x: reading.trolley.x, y: -reading.labelHeight },
          tone: 'muted',
        },
        { from: reading.bay, to: { x: reading.bay.x, y: reading.labelHeight }, tone: 'muted' },
      ],
      zones: [
        { ...reading.trolley, radius: example.separationThreshold, tone: 'zone' },
        { ...reading.trolley, radius: reading.contactDistance, tone: 'other' },
      ],
      values: frameValues(t, reading, index, step, pushDirection),
      note: noteOf(t, step, reading.contactDistance, example),
      worked: frameWorked(t, reading, index, step, example),
    };
  });
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'clearancePriority',
      label: t('studyAifg.priority-steering.model.clearancePriority'),
      unit: t('studyAifg.priority-steering.model.rank'),
      min: 1,
      max: 2,
      step: 1,
    },
    {
      name: 'separationThreshold',
      label: t('studyAifg.priority-steering.model.clearanceDistance'),
      unit: t('studyAifg.priority-steering.model.inputsUnitUnits'),
      min: 1.25,
      max: 5,
      step: 0.25,
    },
    {
      name: 'epsilon',
      label: t('studyAifg.priority-steering.model.activationThreshold'),
      unit: t('studyAifg.priority-steering.model.inputsUnitUnitsS'),
      min: 0,
      max: 4,
      step: 0.1,
    },
  ];
}

export const present = (
  example: PriorityParameters,
  run: ReturnType<typeof prioritySteps>,
  t: StudyTranslate,
): MotionStudyModel => {
  const reading = describeRun(t, example, run);
  const frames: readonly MotionFrame[] = motionFrames(t, run, reading, example);
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
  const padding = Math.max(
    example.radius * 2,
    (Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x))) * 0.08,
  );
  return {
    family: 'motion',
    motion: {
      frames,
      bounds: boundsOfPoints(points, padding),
      trail: true,
    },
    timeline: runTimeline(t, reading, example, run),
    initialStep: reading.firstClearance < 0 ? 0 : reading.firstClearance,
    moments: [
      { label: t('studyAifg.priority-steering.model.firstDecision'), step: 0 },
      ...(reading.firstClearance > 0
        ? [
            {
              label: t('studyAifg.priority-steering.model.clearanceTakesOver'),
              step: reading.firstClearance,
            },
          ]
        : [
            {
              label: t('studyAifg.priority-steering.model.nextDecision'),
              step: Math.min(1, example.steps),
            },
          ]),
      { label: t('studyAifg.priority-steering.model.closestApproach'), step: reading.closest },
      { label: t('studyAifg.priority-steering.model.endRun'), step: example.steps },
    ],
    legend: [
      {
        tone: 'other',
        label: t('studyAifg.priority-steering.model.upperArrowClearanceRequest'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.priority-steering.model.lowerArrowTravelRequest'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.priority-steering.model.arrowThroughMicaSelected'),
      },
      {
        tone: 'zone',
        label: t('studyAifg.priority-steering.model.outerRingClearanceDistance'),
      },
    ],
    caption: t('studyAifg.priority-steering.model.caption'),
    comparison: compareRuns(t, reading, run),
    inputs: runInputs(t),
  };
};

function groupName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Clearance':
      return t('studyAifg.priority-steering.model.groupNameClearance');
    case 'Travel':
      return t('studyAifg.priority-steering.model.groupNameTravel');
    case 'None':
      return t('studyAifg.priority-steering.model.groupNameNone');
    default:
      return value;
  }
}
