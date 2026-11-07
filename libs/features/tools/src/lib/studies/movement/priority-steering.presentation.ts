import { distance, length } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  MotionVector,
  StudyComparison,
  StudyInput,
  StudyPoint,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { boundsOfPoints } from './presentation';
import {
  type PriorityParameters,
  type PriorityStep,
  prioritySteps,
} from './priority-steering.simulation';

interface PriorityDescription {
  readonly example: PriorityParameters;
  readonly run: readonly PriorityStep[];
  readonly comparison: readonly PriorityStep[];
  readonly seconds: readonly number[];
  readonly inputValues: StudyValues;

  readonly trolley: StudyPoint;
  readonly lane: number;
  readonly bay: StudyPoint;
  readonly labelHeight: number;
  readonly contactDistance: number;
  readonly minimumGap: number;
  readonly comparisonMinimumGap: number;
  readonly touchingSamples: number;
  readonly comparisonTouchingSamples: number;
  readonly switches: number;
  readonly order: string;
  readonly firstClearance: number;
  readonly closest: number;
  readonly comparisonOrder: string;
  readonly outcome: string;
}
interface PriorityFrame {
  readonly reading: PriorityDescription;
  readonly index: number;
  readonly step: PriorityStep;
}

const { number: fixed, vector } = createNumberFormat();

const orderName = (t: StudyTranslate, priority: number) =>
  priority === 1
    ? t('studyAifg.priority-steering.model.names.clearanceFirst')
    : t('studyAifg.priority-steering.model.names.travelFirst');

function noteOf(
  t: StudyTranslate,
  step: PriorityStep,
  contactDistance: number,
  example: PriorityParameters,
): string {
  if (step.gap <= contactDistance)
    return t('studyAifg.priority-steering.model.phase.micaTouchesTrolleyBecause');
  if (step.activeGroup === 'None')
    return length(step.state.velocity) === 0
      ? t('studyAifg.priority-steering.model.phase.thresholdSilencesGroupsLeaving')
      : t('studyAifg.priority-steering.model.phase.neitherGroupClearsThreshold');
  if (step.activeGroup === 'Travel') {
    if (length(step.clearance) > example.epsilon)
      return t('studyAifg.priority-steering.model.phase.travelWinsDespiteClearance');
    return length(step.separation) === 0
      ? t('studyAifg.priority-steering.model.phase.trolleyOutsideBufferTravel')
      : t('studyAifg.priority-steering.model.phase.clearanceTooSmallTake');
  }
  const nextGap = distance(step.next.position, { x: example.trolleyPosition, y: 0 });
  return nextGap < step.gap
    ? t('studyAifg.priority-steering.model.phase.clearanceBrakingMicaClosing')
    : t('studyAifg.priority-steering.model.phase.micaMovesAwayTrolley');
}

function describeRun(
  t: StudyTranslate,
  example: PriorityParameters,
  run: readonly PriorityStep[],
): PriorityDescription {
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
      ? t('studyAifg.priority-steering.model.labels.micaTouchesTrolleyChosen')
      : run.every(({ activeGroup }) => activeGroup === 'None')
        ? t('studyAifg.priority-steering.model.labels.chosenThresholdPreventsMica')
        : t('studyAifg.priority-steering.model.labels.chosenRunStaysOutside');
  const inputValues = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, String(Number(fixed(value)))]),
  );
  const lane = example.separationThreshold / 2;
  // Separate label stems keep the names apart even when Mica overlaps a stationary mark.
  const labelHeight = example.separationThreshold + example.radius;
  const trolley = { x: example.trolleyPosition, y: 0 };
  const bay = { x: example.target, y: 0 };
  return {
    example,
    run,
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

function frameWorked(t: StudyTranslate, frame: PriorityFrame): StudyWorkedStep {
  const { reading, index, step } = frame;
  const { example } = reading;

  return {
    title: t('studyAifg.priority-steering.model.worked.mica', {
      seconds: fixed(reading.seconds[index]),
    }),
    lines: [
      t('studyAifg.priority-steering.model.worked.beginPositionVelocityTrolley', {
        statePosition: vector(step.state.position),
        stateVelocity: vector(step.state.velocity),
        trolley: vector(reading.trolley),
        stepGap: fixed(step.gap),
      }),
      length(step.separation) === 0
        ? t('studyAifg.priority-steering.model.worked.gapLeastSeparationWhole', {
            exampleSeparationThreshold: fixed(example.separationThreshold),
          })
        : step.gap === 0 || step.state.position.y !== 0
          ? t('studyAifg.priority-steering.model.worked.engineSeparationDisplacementGives', {
              stepSeparation: vector(step.separation),
            })
          : t('studyAifg.priority-steering.model.worked.linearSeparationAlongAisle', {
              direction: Math.sign(step.state.position.x - reading.trolley.x),
              exampleMaxAcceleration: fixed(example.maxAcceleration),
              exampleSeparationThreshold: fixed(example.separationThreshold),
              stepGap: fixed(step.gap),
              separationX: fixed(step.separation.x),
            }),
      t('studyAifg.priority-steering.model.worked.brakeClipLength', {
        stateVelocity: vector(step.state.velocity),
        exampleResponseTime: fixed(example.responseTime),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepBrake: vector(step.brake),
      }),
      t('studyAifg.priority-steering.model.worked.whenSeparationActiveClearance', {
        exampleSeparationWeight: fixed(example.separationWeight),
        stepSeparation: vector(step.separation),
        exampleBrakeWeight: fixed(example.brakeWeight),
        stepBrake: vector(step.brake),
        exampleMaxAcceleration: fixed(example.maxAcceleration),
        stepClearance: vector(step.clearance),
      }),
      t('studyAifg.priority-steering.model.worked.travelEngineArriveTowards', {
        bay: vector(reading.bay),
        stepTravel: vector(step.travel),
        order: reading.order,
        stepActiveGroup: groupName(t, step.activeGroup),
        exampleEpsilon: fixed(example.epsilon),
      }),
      t('studyAifg.priority-steering.model.worked.newVelocityClipLength', {
        stateVelocity: vector(step.state.velocity),
        stepAcceleration: vector(step.acceleration),
        exampleTimeStep: fixed(example.timeStep),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: vector(step.next.velocity),
      }),
      t('studyAifg.priority-steering.model.worked.newPosition', {
        statePosition: vector(step.state.position),
        nextVelocity: vector(step.next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: vector(step.next.position),
      }),
    ],
    note: t('studyAifg.priority-steering.model.worked.displayedValuesRoundedCalculations'),
  };
}

function compareRuns(t: StudyTranslate, reading: PriorityDescription): StudyComparison {
  const { run } = reading;

  return {
    title: t('studyAifg.priority-steering.model.comparison.reverseGroupOrder'),
    intro: t('studyAifg.priority-steering.model.comparison.changeClearancePriorityBecomes', {
      order: reading.order,
      comparisonOrder: reading.comparisonOrder,
      contactDistance: fixed(reading.contactDistance),
    }),
    timeline: {
      title: t('studyAifg.priority-steering.model.comparison.distanceParkedTrolley'),
      xLabel: t('studyAifg.priority-steering.model.labels.timeSeconds'),
      yLabel: t('studyAifg.priority-steering.model.comparison.centreDistance'),
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
      t('studyAifg.priority-steering.model.comparison.minimumGapSampledTouching', {
        order: reading.order,
        minimumGap: fixed(reading.minimumGap),
        touchingSamples: reading.touchingSamples,
        comparisonOrder: reading.comparisonOrder,
        comparisonMinimumGap: fixed(reading.comparisonMinimumGap),
        comparisonTouchingSamples: reading.comparisonTouchingSamples,
      }),
      t('studyAifg.priority-steering.model.comparison.chosenRunChangesSelected', {
        outcome: reading.outcome,
        switches: reading.switches,
      }),
    ],
    note: t('studyAifg.priority-steering.model.comparison.linesJoinFixedStep'),
  };
}

function frameValues(t: StudyTranslate, frame: PriorityFrame, pushDirection: string): StudyValues {
  const { reading, index, step } = frame;

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
        ? t('studyAifg.priority-steering.model.values.standsBetweenMicaLoading')
        : step.state.position.x > reading.trolley.x
          ? t('studyAifg.priority-steering.model.values.behindMicaTowardsStart')
          : t('studyAifg.priority-steering.model.values.alongsideMica'),
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

function runTimeline(t: StudyTranslate, reading: PriorityDescription): TimelineModel {
  const { example, run } = reading;

  return {
    title: t('studyAifg.priority-steering.model.timeline.groupRequestsSelectedAcceleration'),
    xLabel: t('studyAifg.priority-steering.model.labels.timeSeconds'),
    yLabel: t('studyAifg.priority-steering.model.timeline.magnitude'),
    seconds: reading.seconds,
    reference: example.epsilon,
    series: [
      {
        id: 'clearance',
        label: t('studyAifg.priority-steering.model.timeline.clearanceGroup'),
        tone: 'other',
        values: run.map(({ clearance }) => length(clearance)),
      },
      {
        id: 'travel',
        label: t('studyAifg.priority-steering.model.timeline.travelGroup'),
        tone: 'desired',
        values: run.map(({ travel }) => length(travel)),
      },
      {
        id: 'selected',
        label: t('studyAifg.priority-steering.model.timeline.selectedAcceleration'),
        tone: 'actual',
        values: run.map(({ acceleration }) => length(acceleration)),
      },
    ],
  };
}

function frameVectors(step: PriorityStep, reading: PriorityDescription): readonly MotionVector[] {
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

function motionFrames(t: StudyTranslate, reading: PriorityDescription): readonly MotionFrame[] {
  const { example, run } = reading;

  return run.map((step, index) => {
    const away =
      (step.state.position.x - reading.trolley.x) * step.acceleration.x +
      step.state.position.y * step.acceleration.y;
    const pushDirection =
      length(step.acceleration) === 0
        ? t('studyAifg.priority-steering.model.labels.noDirectionalCorrection')
        : away > 0
          ? t('studyAifg.priority-steering.model.labels.awayTrolley')
          : away < 0
            ? t('studyAifg.priority-steering.model.labels.towardsTrolley')
            : t('studyAifg.priority-steering.model.labels.acrossAisle');
    return {
      seconds: reading.seconds[index],
      bodies: [
        {
          id: 'Mica',
          ...step.state.position,
          tone: 'subject',
          label: t('studyAifg.priority-steering.model.labels.mica'),
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
          label: t('studyAifg.priority-steering.model.labels.trolley'),
        },
        {
          x: reading.bay.x,
          y: reading.labelHeight,
          shape: 'dot',
          tone: 'target',
          label: t('studyAifg.priority-steering.model.labels.bay'),
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
      values: frameValues(t, { reading, index, step }, pushDirection),
      note: noteOf(t, step, reading.contactDistance, example),
      worked: frameWorked(t, { reading, index, step }),
    };
  });
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'clearancePriority',
      label: t('studyAifg.priority-steering.model.inputs.clearancePriority'),
      unit: t('studyAifg.priority-steering.model.inputs.rank'),
      min: 1,
      max: 2,
      step: 1,
    },
    {
      name: 'separationThreshold',
      label: t('studyAifg.priority-steering.model.inputs.clearanceDistance'),
      unit: t('studyAifg.priority-steering.model.inputs.unitUnits'),
      min: 1.25,
      max: 5,
      step: 0.25,
    },
    {
      name: 'epsilon',
      label: t('studyAifg.priority-steering.model.inputs.activationThreshold'),
      unit: t('studyAifg.priority-steering.model.inputs.unitUnitsS'),
      min: 0,
      max: 4,
      step: 0.1,
    },
  ];
}

export const present = (
  example: PriorityParameters,
  run: readonly PriorityStep[],
  t: StudyTranslate,
): MotionStudyModel => {
  const reading = describeRun(t, example, run);
  const frames: readonly MotionFrame[] = motionFrames(t, reading);
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
    timeline: runTimeline(t, reading),
    initialStep: reading.firstClearance < 0 ? 0 : reading.firstClearance,
    moments: [
      { label: t('studyAifg.priority-steering.model.labels.firstDecision'), step: 0 },
      ...(reading.firstClearance > 0
        ? [
            {
              label: t('studyAifg.priority-steering.model.labels.clearanceTakesOver'),
              step: reading.firstClearance,
            },
          ]
        : [
            {
              label: t('studyAifg.priority-steering.model.labels.nextDecision'),
              step: Math.min(1, example.steps),
            },
          ]),
      {
        label: t('studyAifg.priority-steering.model.labels.closestApproach'),
        step: reading.closest,
      },
      { label: t('studyAifg.priority-steering.model.labels.endRun'), step: example.steps },
    ],
    legend: [
      {
        tone: 'other',
        label: t('studyAifg.priority-steering.model.labels.upperArrowClearanceRequest'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.priority-steering.model.labels.lowerArrowTravelRequest'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.priority-steering.model.labels.arrowThroughMicaSelected'),
      },
      {
        tone: 'zone',
        label: t('studyAifg.priority-steering.model.labels.outerRingClearanceDistance'),
      },
    ],
    caption: t('studyAifg.priority-steering.model.overview.caption'),
    comparison: compareRuns(t, reading),
    inputs: runInputs(t),
  };
};

function groupName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Clearance':
      return t('studyAifg.priority-steering.model.names.groupNameClearance');
    case 'Travel':
      return t('studyAifg.priority-steering.model.names.groupNameTravel');
    case 'None':
      return t('studyAifg.priority-steering.model.names.groupNameNone');
    default:
      return value;
  }
}
