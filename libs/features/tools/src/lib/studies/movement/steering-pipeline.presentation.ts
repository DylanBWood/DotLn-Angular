import {
  distance,
  length,
  normalize,
  scale,
  subtract,
  type Vec2,
  zero,
} from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionBounds,
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  exclusionRadius,
  goalOf,
  palletOf,
  type PipelineAttempt,
  type PipelineParameters,
  type PipelineSample,
  pipelineSamples,
  type PipelineState,
  type PipelineStep,
  repairRoute,
  routeClearance,
  segmentDetails,
} from './steering-pipeline.simulation';

const { number: fixed, vector: point } = createNumberFormat();

function describeRun(
  example: PipelineParameters,
  statesSamples: readonly PipelineSample[],
): PipelineDescription {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const otherChecks = comparisonChecks(example);
  const otherExample = { ...example, maxChecks: otherChecks };
  const otherSamples = pipelineSamples(otherExample);
  const other = otherSamples.map(({ state }) => state);
  const otherCalculations = otherSamples.map(({ calculation }) => calculation);
  const seconds = states.map((_state, step) => step * example.timeStep);
  const goalDistances = states.map((state) => distance(state.position, goalOf(example)));
  const otherDistances = other.map((state) => distance(state.position, goalOf(example)));
  const find = (predicate: PipelinePredicate) => {
    const index = states.findIndex((state, step) => predicate(state, calculations[step]));
    return index < 0 ? example.steps : index;
  };
  const deliveredAt = find((state) => arrived(state, example));
  const refused = calculations.slice(0, -1).filter((calculation) => !calculation.accepted).length;
  const otherRefused = otherCalculations
    .slice(0, -1)
    .filter((calculation) => !calculation.accepted).length;
  const blocked = refused === example.steps;

  const selection = {
    deliveredAt,
    entry: find((_state, calculation) => calculation.attempts.at(-1)?.route.length === 2),
    pallet: find((state) => state.position.x >= example.palletX),
    delivery: find(
      (state, calculation) =>
        calculation.attempts.at(-1)?.route.length === 1 && state.position.x > example.palletX,
    ),
  };
  return {
    example,
    states,
    calculations,
    otherChecks,
    other,
    seconds,
    goalDistances,
    otherDistances,
    refused,
    otherRefused,
    blocked,
    selection,
  };
}

function describeRequest(sample: PipelineSample, example: PipelineParameters): WaypointRequest {
  const { state, calculation: result } = sample;

  const last = result.attempts.at(-1);
  const waypoint = last?.waypoint ?? state.route[0];
  const gap = distance(state.position, waypoint);
  const stop = example.targetRadius / 2;
  const desiredSpeed =
    gap <= stop
      ? 0
      : gap >= example.slowRadius
        ? example.maxSpeed
        : (example.maxSpeed * (gap - stop)) / (example.slowRadius - stop);
  const desired = scale(normalize(subtract(waypoint, state.position)), desiredSpeed);
  const requested = scale(subtract(desired, state.velocity), 1 / example.responseTime);

  return { gap, stop, desiredSpeed, desired, requested };
}

interface PipelineReading {
  readonly note: string;
  readonly relationship: string;
}
interface WaypointRequest {
  readonly gap: number;
  readonly stop: number;
  readonly desiredSpeed: number;
  readonly desired: Vec2;
  readonly requested: Vec2;
}
interface PipelineFrame {
  readonly sample: PipelineSample;
  readonly step: number;
  readonly example: PipelineParameters;
  readonly request: WaypointRequest;
  readonly route: readonly Vec2[];
  readonly points: readonly Vec2[];
  readonly values: StudyValues;
  readonly waypoint: Vec2;
  readonly waypointName: string;
  readonly reading: PipelineReading;
  readonly proposalReading: string;
  readonly localDistance: number;
  readonly bypass: readonly Vec2[];
  readonly clearance: number;
  readonly routeGap: number;
  readonly sweptGap: number;
  readonly status: string;
}
interface PipelineSelection {
  readonly entry: number;
  readonly pallet: number;
  readonly delivery: number;
  readonly deliveredAt: number;
}
interface PipelineDescription {
  readonly example: PipelineParameters;
  readonly states: readonly PipelineState[];
  readonly calculations: readonly PipelineStep[];
  readonly other: readonly PipelineState[];
  readonly otherChecks: number;
  readonly seconds: readonly number[];
  readonly goalDistances: readonly number[];
  readonly otherDistances: readonly number[];
  readonly refused: number;
  readonly otherRefused: number;
  readonly blocked: boolean;
  readonly selection: PipelineSelection;
}
interface PipelinePredicate {
  (state: PipelineState, calculation: PipelineStep): boolean;
}

const arrived = (state: PipelineState, example: PipelineParameters) =>
  distance(state.position, goalOf(example)) <= example.targetRadius &&
  length(state.velocity) <= example.cornerSpeed;

function workedAttempt(
  t: StudyTranslate,
  description: PipelineFrame,
  attempt: PipelineAttempt,
  index: number,
): readonly string[] {
  const {
    sample: { state },
    example,
  } = description;

  const points = [state.position, ...attempt.route];
  const tightest = attempt.route
    .map((to, part) => segmentDetails(points[part], to, example))
    .reduce((best, candidate) => (candidate.clearance < best.clearance ? candidate : best));
  const projection =
    tightest.squaredLength === 0
      ? t('studyAifg.steering-pipeline.model.worked.segmentNoLengthUse')
      : t('studyAifg.steering-pipeline.model.worked.projectionTClamp', {
          tightestProjection: fixed(tightest.projection),
          tightestSquaredLength: fixed(tightest.squaredLength),
          tightestFraction: fixed(tightest.fraction),
        });
  return [
    t('studyAifg.steering-pipeline.model.worked.checkDecomposerSelectsMinimum', {
      index: index + 1,
      attemptWaypoint: point(attempt.waypoint),
      attemptRouteClearance: fixed(attempt.routeClearance),
      attemptSweptClearance: fixed(attempt.sweptClearance),
      checkOutcome: attempt.accepted
        ? t('studyAifg.steering-pipeline.model.worked.acceptChecks')
        : t('studyAifg.steering-pipeline.model.worked.rejectSuggestUpperBypass'),
    }),
    t('studyAifg.steering-pipeline.model.worked.tightestRouteSegmentClosest', {
      tightestFrom: point(tightest.from),
      tightestTo: point(tightest.to),
      projection,
      tightestClosest: point(tightest.closest),
      palletDistance: fixed(distance(tightest.closest, palletOf(example))),
      exclusionRadius: fixed(exclusionRadius(example)),
      tightestClearance: fixed(tightest.clearance),
    }),
  ];
}

function workedLines(t: StudyTranslate, description: PipelineFrame): readonly string[] {
  const {
    sample: { state, calculation: result },
    example,
    request: { gap, stop, desiredSpeed, desired, requested },
  } = description;

  return [
    t('studyAifg.steering-pipeline.model.worked.targeterKeepsDeliveryCourier', {
      resultGoal: point(result.goal),
      statePosition: point(state.position),
    }),
    t('studyAifg.steering-pipeline.model.worked.excludeCentrePositionsWithin', {
      examplePalletRadius: fixed(example.palletRadius),
      exampleCourierRadius: fixed(example.courierRadius),
      exampleSafetyMargin: fixed(example.safetyMargin),
      exclusionRadius: fixed(exclusionRadius(example)),
    }),
    ...result.attempts.flatMap((attempt, index) => workedAttempt(t, description, attempt, index)),
    ...(result.accepted
      ? [
          t('studyAifg.steering-pipeline.model.worked.arriveRequestsSpeedWaypoint', {
            desiredSpeed: fixed(desiredSpeed),
            gap: fixed(gap),
            stop: fixed(stop),
            exampleMaxSpeed: fixed(example.maxSpeed),
            exampleSlowRadius: fixed(example.slowRadius),
          }),
          t('studyAifg.steering-pipeline.model.worked.desiredVelocityBeforeMagnitude', {
            desired: point(desired),
            stateVelocity: point(state.velocity),
            exampleResponseTime: fixed(example.responseTime),
            requested: point(requested),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
          }),
        ]
      : [
          t('studyAifg.steering-pipeline.model.worked.budgetExhaustedAfterChecks', {
            attemptsLength: result.attempts.length,
            zero: point(zero),
            exampleResponseTime: fixed(example.responseTime),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
          }),
        ]),
    t('studyAifg.steering-pipeline.model.worked.useAccelerationVNextClip', {
      resultAcceleration: point(result.acceleration),
      stateVelocity: point(state.velocity),
      exampleTimeStep: fixed(example.timeStep),
      exampleMaxSpeed: fixed(example.maxSpeed),
      nextVelocity: point(result.next.velocity),
    }),
    t('studyAifg.steering-pipeline.model.worked.pNext', {
      statePosition: point(state.position),
      nextVelocity: point(result.next.velocity),
      exampleTimeStep: fixed(example.timeStep),
      nextPosition: point(result.next.position),
    }),
  ];
}

function workedStep(t: StudyTranslate, description: PipelineFrame): StudyWorkedStep {
  const {
    sample: { calculation: result },
    example,
    step,
  } = description;
  return {
    title: t('studyAifg.steering-pipeline.model.worked.pipelineUpdate', {
      seconds: fixed(step * example.timeStep),
      nextSeconds: fixed((step + 1) * example.timeStep),
    }),
    lines: workedLines(t, description),
    note: result.accepted
      ? t('studyAifg.steering-pipeline.model.worked.actuatorPreviewUsesSame')
      : t('studyAifg.steering-pipeline.model.worked.noRejectedRouteExecuted'),
  };
}

const pipelineReadings = {
  braking: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierBrakesBecauseNo',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingBrakesBeforePalletBecause',
  },
  waiting: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierWaitsBecauseBypass',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingWaitsBeforePalletBypass',
  },
  arrived: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierReachedDeliveryNearly',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingDeliveryWithinStoppingTolerance',
  },
  detourStarted: {
    note: 'studyAifg.steering-pipeline.model.phase.readingDirectRouteBlockedCourier',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingStartsCheckedDetourAbove',
  },
  entryCleared: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierReleasesEntryCorner',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingTurnsOntoUpperBypass',
  },
  exitCleared: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierReleasesExitCorner',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingTurnsTowardsDeliveryPallet',
  },
  approachingEntry: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierSlowsEntryCorner',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingSlowsAboveBeforePallet',
  },
  headingToEntry: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierHeadsEntryCorner',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingHeadsAbovePalletTowards',
  },
  approachingExit: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierSlowsExitCorner',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingSlowsAboveBeyondPallet',
  },
  followingBypass: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierFollowsBypassAbove',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingFollowsUpperBypassPallet',
  },
  pastPallet: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierKeepsExitWaypoint',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingPassedAbovePalletContinues',
  },
  brakingAtDelivery: {
    note: 'studyAifg.steering-pipeline.model.phase.readingCourierBrakesNearDelivery',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingBrakesTowardsDeliveryPallet',
  },
  headingToDelivery: {
    note: 'studyAifg.steering-pipeline.model.phase.readingPalletBehindCourierDelivery',
    relationship: 'studyAifg.steering-pipeline.model.phase.readingHeadsStraightDeliveryPallet',
  },
};

type PipelinePhase = keyof typeof pipelineReadings;

function pipelinePhase(
  sample: PipelineSample,
  route: readonly Vec2[],
  example: PipelineParameters,
): PipelinePhase {
  const { state, calculation: result } = sample;

  if (!result.accepted) return length(state.velocity) > example.cornerSpeed ? 'braking' : 'waiting';
  if (arrived(state, example)) return 'arrived';
  if (result.attempts.some((attempt) => !attempt.accepted)) return 'detourStarted';
  if (state.route.length > route.length) return route.length === 2 ? 'entryCleared' : 'exitCleared';
  const slowing = distance(state.position, route[0]) < example.slowRadius;
  if (route.length === 3) return slowing ? 'approachingEntry' : 'headingToEntry';
  if (route.length === 2) {
    if (slowing) return 'approachingExit';
    return state.position.x < example.palletX ? 'followingBypass' : 'pastPallet';
  }
  return slowing ? 'brakingAtDelivery' : 'headingToDelivery';
}

function readingOf(
  t: StudyTranslate,
  sample: PipelineSample,
  route: readonly Vec2[],
  example: PipelineParameters,
): PipelineReading {
  const messages = pipelineReadings[pipelinePhase(sample, route, example)];
  return { note: t(messages.note), relationship: t(messages.relationship) };
}

const comparisonChecks = (example: PipelineParameters) =>
  example.maxChecks === example.failureChecks ? example.failureChecks + 1 : example.failureChecks;

function frameMarks(t: StudyTranslate, description: PipelineFrame): readonly MotionMark[] {
  const {
    sample: { calculation: result },
    example,
    route,
  } = description;

  return [
    {
      ...result.goal,
      shape: 'cross',
      tone: 'target',
      label: t('studyAifg.steering-pipeline.model.labels.deliveryLabel'),
    },
    {
      ...palletOf(example),
      shape: 'dot',
      tone: 'other',
      label: t('studyAifg.steering-pipeline.model.labels.pallet'),
    },
    ...route.slice(0, -1).map((place, index) => ({
      ...place,
      shape: 'ring' as const,
      tone: index === 0 ? ('desired' as const) : ('muted' as const),
      label:
        route.length - index === 3
          ? t('studyAifg.steering-pipeline.model.labels.entry')
          : t('studyAifg.steering-pipeline.model.labels.exit'),
    })),
  ];
}

function describeFrame(
  t: StudyTranslate,
  sample: PipelineSample,
  example: PipelineParameters,
  step: number,
): PipelineFrame {
  const { state, calculation: result } = sample;

  const last = result.attempts.at(-1);
  const route = last?.route ?? state.route;
  const waypoint = route[0];
  const waypointName =
    route.length === 3
      ? t('studyAifg.steering-pipeline.model.names.entryCorner')
      : route.length === 2
        ? t('studyAifg.steering-pipeline.model.names.exitCorner')
        : t('studyAifg.steering-pipeline.model.names.delivery');
  const points = [state.position, ...route];
  const clearance = distance(state.position, palletOf(example)) - exclusionRadius(example);
  const routeGap = last?.routeClearance ?? routeClearance(state.position, route, example);
  const sweptGap = last?.sweptClearance ?? clearance;
  const localDistance = distance(state.position, waypoint);
  const bypass = repairRoute(result.goal, example);
  const reading = readingOf(t, sample, route, example);
  const status = !result.accepted
    ? t('studyAifg.steering-pipeline.model.labels.budgetExhaustedBraking')
    : arrived(state, example)
      ? t('studyAifg.steering-pipeline.model.labels.deliveredWithinTolerance')
      : t('studyAifg.steering-pipeline.model.labels.routeAccepted');
  const proposalReading = result.accepted
    ? arrived(state, example)
      ? t('studyAifg.steering-pipeline.model.labels.courierMovingBelowStopping', {
          stateVelocity: fixed(length(state.velocity)),
          exampleCornerSpeed: fixed(example.cornerSpeed),
        })
      : t('studyAifg.steering-pipeline.model.labels.nextStopAwayAlong', {
          waypointName,
          localDistance: fixed(localDistance),
          routeGap: fixed(routeGap),
        })
    : routeGap < 0
      ? t('studyAifg.steering-pipeline.model.labels.directProposalOverlapsPallet', {
          overlap: fixed(-routeGap),
        })
      : t('studyAifg.steering-pipeline.model.labels.routeClearNextMovement', {
          sweptOverlap: fixed(Math.max(0, -sweptGap)),
        });
  const values = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, fixed(value)]),
  );
  return {
    sample,
    example,
    step,
    request: describeRequest(sample, example),
    route,
    points,
    values,
    waypoint,
    waypointName,
    reading,
    proposalReading,
    localDistance,
    bypass,
    clearance,
    routeGap,
    sweptGap,
    status,
  };
}

function frameOf(t: StudyTranslate, description: PipelineFrame): MotionFrame {
  const {
    sample: { state, calculation: result },
    example,
    step,
  } = description;

  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'courier',
        ...state.position,
        tone: 'subject',
        label: t('studyAifg.steering-pipeline.model.labels.courier'),
      },
    ],
    zones: [
      { ...palletOf(example), radius: exclusionRadius(example) },
      { ...palletOf(example), radius: example.palletRadius },
    ],
    marks: frameMarks(t, description),
    links: [
      { from: state.position, to: result.goal, tone: 'muted' },
      ...description.route.map((to, index) => ({
        from: description.points[index],
        to,
        tone: result.accepted ? ('desired' as const) : ('other' as const),
      })),
    ],
    values: {
      ...description.values,
      maxChecks: String(example.maxChecks),
      failureChecks: String(example.failureChecks),
      comparisonChecks: String(comparisonChecks(example)),
      steps: String(example.steps),
      initialGoalDistance: fixed(distance({ x: example.startX, y: example.startY }, result.goal)),
      position: point(state.position),
      velocity: point(state.velocity),
      speed: fixed(length(state.velocity)),
      goal: point(result.goal),
      waypoint: point(description.waypoint),
      waypointName: description.waypointName,
      relationship: description.reading.relationship,
      proposalReading: description.proposalReading,
      remainingRoute: description.route.map((value) => point(value)).join(' → '),
      localDistance: fixed(description.localDistance),
      goalDistance: fixed(distance(state.position, result.goal)),
      exclusionRadius: fixed(exclusionRadius(example)),
      offset: fixed(exclusionRadius(example) + example.detourPadding),
      firstCorner: point(description.bypass[0]),
      secondCorner: point(description.bypass[1]),
      clearance: fixed(description.clearance),
      routeClearance: fixed(description.routeGap),
      sweptClearance: fixed(description.sweptGap),
      checks: String(result.attempts.length),
      rejections: String(result.attempts.filter((attempt) => !attempt.accepted).length),
      acceleration: point(result.acceleration),
      accelerationMagnitude: fixed(length(result.acceleration)),
      nextPosition: point(result.next.position),
      nextVelocity: point(result.next.velocity),
      nextSpeed: fixed(length(result.next.velocity)),
      status: description.status,
      seconds: fixed(step * example.timeStep),
    },
    note: description.reading.note,
    worked: workedStep(t, description),
  };
}

function boundsOf(frames: readonly MotionFrame[], example: PipelineParameters): MotionBounds {
  const radius = exclusionRadius(example);
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
  ]);
  const minX = Math.min(...points.map(({ x }) => x), example.palletX - radius);
  const maxX = Math.max(...points.map(({ x }) => x), example.palletX + radius);
  const minY = Math.min(...points.map(({ y }) => y), example.palletY - radius);
  const maxY = Math.max(...points.map(({ y }) => y), example.palletY + radius);
  // Leave space for centred names at the larger narrow-screen font size.
  const horizontalPadding = Math.max(
    example.courierRadius + example.safetyMargin,
    (maxX - minX) * 0.16,
  );
  const verticalPadding = (maxX - minX + 2 * horizontalPadding) * 0.08;
  return {
    minX: minX - horizontalPadding,
    maxX: maxX + horizontalPadding,
    minY: minY - verticalPadding,
    maxY: maxY + verticalPadding,
  };
}

/** Keep the courier's name when it reaches a named mark, instead of writing both names together. */
function spaceLabels(frames: readonly MotionFrame[], bounds: MotionBounds): readonly MotionFrame[] {
  const drawingScale = drawingWidth / (bounds.maxX - bounds.minX);
  return frames.map((frame) => {
    const occupied = frame.bodies.flatMap((body) =>
      body.label ? [{ ...body, label: body.label }] : [],
    );
    return {
      ...frame,
      marks: frame.marks?.map((mark) => {
        if (!mark.label) return mark;
        const label = mark.label;
        const overlaps = occupied.some(
          (place) =>
            Math.abs(mark.x - place.x) * drawingScale <
              ((label.length + place.label.length) * 15) / 2 + 12 &&
            Math.abs(mark.y - place.y) * drawingScale < 32,
        );
        if (overlaps) {
          const { label: _label, ...unnamed } = mark;
          return unnamed;
        }
        occupied.push({ ...mark, id: label, label });
        return mark;
      }),
    };
  });
}

function compareRuns(t: StudyTranslate, run: PipelineDescription): StudyComparison {
  const {
    example,
    states,
    other,
    goalDistances,
    otherDistances,
    otherChecks,
    otherRefused,
    refused,
    seconds,
  } = run;

  return {
    title: t('studyAifg.steering-pipeline.model.comparison.repairNeedsCheckOwn'),
    intro: t('studyAifg.steering-pipeline.model.comparison.changeCheckBudgetRejected', {
      exampleMaxChecks: example.maxChecks,
      otherChecks,
    }),
    timeline: {
      title: t('studyAifg.steering-pipeline.model.comparison.distanceDeliver'),
      xLabel: t('studyAifg.steering-pipeline.model.labels.timeSeconds'),
      yLabel: t('studyAifg.steering-pipeline.model.comparison.deliveryDistance'),
      seconds,
      reference: example.targetRadius,
      series: [
        {
          id: 'selected',
          label: t('studyAifg.steering-pipeline.model.comparison.selectedBudget', {
            exampleMaxChecks: example.maxChecks,
          }),
          tone: 'actual',
          values: goalDistances,
        },
        {
          id: 'comparison',
          label: t('studyAifg.steering-pipeline.model.comparison.comparisonBudget', {
            otherChecks,
          }),
          tone: 'desired',
          values: otherDistances,
        },
      ],
    },
    findings: [
      t('studyAifg.steering-pipeline.model.comparison.checkRunRefusesUpdates', {
        exampleMaxChecks: example.maxChecks,
        refused,
        goalDistances: fixed(goalDistances[example.steps]),
        stepsVelocity: fixed(length(states[example.steps].velocity)),
      }),
      t('studyAifg.steering-pipeline.model.comparison.otherRunResult', {
        otherChecks,
        otherRefused,
        otherDistances: fixed(otherDistances[example.steps]),
        stepsVelocity: fixed(length(other[example.steps].velocity)),
      }),
      t('studyAifg.steering-pipeline.model.comparison.checkRunStaysRest', {
        exampleFailureChecks: example.failureChecks,
      }),
    ],
    note: t('studyAifg.steering-pipeline.model.comparison.lowerBudgetRepeatsSame'),
  };
}

function runMoments(t: StudyTranslate, run: PipelineDescription): readonly StudyMoment[] {
  const { example, states, blocked, selection } = run;
  const { deliveredAt } = selection;

  return blocked
    ? [
        { label: t('studyAifg.steering-pipeline.model.moments.requestRefused'), step: 0 },
        {
          label: t('studyAifg.steering-pipeline.model.moments.waiting'),
          step: Math.floor(example.steps / 2),
        },
        {
          label: t('studyAifg.steering-pipeline.model.moments.noDelivery'),
          step: example.steps,
        },
      ]
    : [
        { label: t('studyAifg.steering-pipeline.model.moments.repairBeforeMoving'), step: 0 },
        {
          label: t('studyAifg.steering-pipeline.model.moments.leaveEntryCorner'),
          step: selection.entry,
        },
        {
          label: t('studyAifg.steering-pipeline.model.moments.passPallet'),
          step: selection.pallet,
        },
        {
          label: t('studyAifg.steering-pipeline.model.moments.deliveryLeg'),
          step: selection.delivery,
        },
        {
          label: arrived(states[deliveredAt], example)
            ? t('studyAifg.steering-pipeline.model.moments.delivered')
            : t('studyAifg.steering-pipeline.model.moments.endRun'),
          step: deliveredAt,
        },
      ];
}

function runTimeline(t: StudyTranslate, run: PipelineDescription): TimelineModel {
  const { example, states, calculations, goalDistances, seconds } = run;

  return {
    title: t('studyAifg.steering-pipeline.model.timeline.deliveryGoalActiveWaypoint'),
    xLabel: t('studyAifg.steering-pipeline.model.labels.timeSeconds'),
    yLabel: t('studyAifg.steering-pipeline.model.timeline.remainingDistance'),
    seconds,
    series: [
      {
        id: 'goal',
        label: t('studyAifg.steering-pipeline.model.timeline.deliveryDistance'),
        tone: 'actual',
        values: goalDistances,
      },
      {
        id: 'waypoint',
        label: t('studyAifg.steering-pipeline.model.timeline.nextWaypointDistance'),
        tone: 'desired',
        values: states.map((state, step) =>
          distance(state.position, calculations[step].attempts.at(-1)?.waypoint ?? state.route[0]),
        ),
      },
    ],
    reference: example.targetRadius,
  };
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'maxChecks',
      label: t('studyAifg.steering-pipeline.model.inputs.constraintChecks'),
      unit: t('studyAifg.steering-pipeline.model.inputs.checksUpdate'),
      min: 1,
      max: 2,
      step: 1,
    },
    {
      name: 'detourPadding',
      label: t('studyAifg.steering-pipeline.model.inputs.bypassPadding'),
      unit: t('studyAifg.steering-pipeline.model.inputs.unitUnits'),
      min: 2,
      max: 12,
      step: 2,
    },
  ];
}

export const present = (
  example: PipelineParameters,
  statesSamples: readonly PipelineSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(example, statesSamples);
  const unlabelled = statesSamples.map((_sample, step) =>
    frameOf(t, describeFrame(t, statesSamples[step], example, step)),
  );
  const bounds = boundsOf(unlabelled, example);
  const frames = spaceLabels(unlabelled, bounds);
  return {
    family: 'motion',
    motion: { bounds, frames, trail: true },
    timeline: runTimeline(t, run),
    initialStep: 0,
    moments: runMoments(t, run),
    legend: [
      {
        tone: 'desired',
        label: t('studyAifg.steering-pipeline.model.labels.checkedBypassNextCorner'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.steering-pipeline.model.labels.deliveryDistanceChart'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.steering-pipeline.model.labels.directDeliveryRequestLater'),
      },
    ],
    caption: t('studyAifg.steering-pipeline.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: runInputs(t),
  };
};
