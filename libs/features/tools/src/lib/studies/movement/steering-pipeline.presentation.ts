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
import type { MotionBounds, MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { decimal as fixed, vectorText as point } from './presentation';
import {
  exclusionRadius,
  goalOf,
  palletOf,
  type PipelineAttempt,
  pipelineFrames,
  type PipelineParameters,
  pipelineSamples,
  type PipelineState,
  type PipelineStep,
  repairRoute,
  routeClearance,
  segmentDetails,
} from './steering-pipeline.simulation';

const arrived = (state: PipelineState, example: PipelineParameters) =>
  distance(state.position, goalOf(example)) <= example.targetRadius &&
  length(state.velocity) <= example.cornerSpeed;

function workedAttempt(
  t: StudyTranslate,
  state: PipelineState,
  attempt: PipelineAttempt,
  index: number,
  example: PipelineParameters,
): readonly string[] {
  const points = [state.position, ...attempt.route];
  const tightest = attempt.route
    .map((to, part) => segmentDetails(points[part], to, example))
    .reduce((best, candidate) => (candidate.clearance < best.clearance ? candidate : best));
  const projection =
    tightest.squaredLength === 0
      ? t('studyAifg.steering-pipeline.model.workedSegmentNoLengthUse')
      : t('studyAifg.steering-pipeline.model.workedProjectionTClamp', {
          tightestProjection: fixed(tightest.projection),
          tightestSquaredLength: fixed(tightest.squaredLength),
          tightestFraction: fixed(tightest.fraction),
        });
  return [
    t('studyAifg.steering-pipeline.model.workedCheckDecomposerSelectsMinimum', {
      index: index + 1,
      attemptWaypoint: point(attempt.waypoint),
      attemptRouteClearance: fixed(attempt.routeClearance),
      attemptSweptClearance: fixed(attempt.sweptClearance),
      value5: attempt.accepted
        ? t('studyAifg.steering-pipeline.model.workedAcceptChecks')
        : t('studyAifg.steering-pipeline.model.workedRejectSuggestUpperBypass'),
    }),
    t('studyAifg.steering-pipeline.model.workedTightestRouteSegmentClosest', {
      tightestFrom: point(tightest.from),
      tightestTo: point(tightest.to),
      projection,
      tightestClosest: point(tightest.closest),
      value5: fixed(distance(tightest.closest, palletOf(example))),
      value6: fixed(exclusionRadius(example)),
      tightestClearance: fixed(tightest.clearance),
    }),
  ];
}

function workedLines(
  t: StudyTranslate,
  result: PipelineStep,
  state: PipelineState,
  example: PipelineParameters,
  desiredSpeed: number,
  gap: number,
  stop: number,
  desired: Vec2,
  requested: Vec2,
): readonly string[] {
  return [
    t('studyAifg.steering-pipeline.model.workedTargeterKeepsDeliveryCourier', {
      resultGoal: point(result.goal),
      statePosition: point(state.position),
    }),
    t('studyAifg.steering-pipeline.model.workedExcludeCentrePositionsWithin', {
      examplePalletRadius: fixed(example.palletRadius),
      exampleCourierRadius: fixed(example.courierRadius),
      exampleSafetyMargin: fixed(example.safetyMargin),
      value4: fixed(exclusionRadius(example)),
    }),
    ...result.attempts.flatMap((attempt, index) =>
      workedAttempt(t, state, attempt, index, example),
    ),
    ...(result.accepted
      ? [
          t('studyAifg.steering-pipeline.model.workedArriveRequestsSpeedWaypoint', {
            desiredSpeed: fixed(desiredSpeed),
            gap: fixed(gap),
            stop: fixed(stop),
            exampleMaxSpeed: fixed(example.maxSpeed),
            exampleSlowRadius: fixed(example.slowRadius),
          }),
          t('studyAifg.steering-pipeline.model.workedDesiredVelocityBeforeMagnitude', {
            desired: point(desired),
            stateVelocity: point(state.velocity),
            exampleResponseTime: fixed(example.responseTime),
            requested: point(requested),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
          }),
        ]
      : [
          t('studyAifg.steering-pipeline.model.workedBudgetExhaustedAfterChecks', {
            attemptsLength: result.attempts.length,
            zero: point(zero),
            exampleResponseTime: fixed(example.responseTime),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
          }),
        ]),
    t('studyAifg.steering-pipeline.model.workedUseAccelerationVNextClip', {
      resultAcceleration: point(result.acceleration),
      stateVelocity: point(state.velocity),
      exampleTimeStep: fixed(example.timeStep),
      exampleMaxSpeed: fixed(example.maxSpeed),
      nextVelocity: point(result.next.velocity),
    }),
    t('studyAifg.steering-pipeline.model.workedPNext', {
      statePosition: point(state.position),
      nextVelocity: point(result.next.velocity),
      exampleTimeStep: fixed(example.timeStep),
      nextPosition: point(result.next.position),
    }),
  ];
}

function workedStep(
  t: StudyTranslate,
  state: PipelineState,
  result: PipelineStep,
  step: number,
  example: PipelineParameters,
): StudyWorkedStep {
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
  return {
    title: t('studyAifg.steering-pipeline.model.workedPipelineUpdate', {
      step: fixed(step * example.timeStep),
      step2: fixed((step + 1) * example.timeStep),
    }),
    lines: workedLines(t, result, state, example, desiredSpeed, gap, stop, desired, requested),
    note: result.accepted
      ? t('studyAifg.steering-pipeline.model.workedActuatorPreviewUsesSame')
      : t('studyAifg.steering-pipeline.model.workedNoRejectedRouteExecuted'),
  };
}

function readingOf(
  t: StudyTranslate,
  state: PipelineState,
  result: PipelineStep,
  route: readonly Vec2[],
  example: PipelineParameters,
): {
  readonly note: string;
  readonly relationship: string;
} {
  if (!result.accepted)
    return length(state.velocity) > example.cornerSpeed
      ? {
          note: t('studyAifg.steering-pipeline.model.readingCourierBrakesBecauseNo'),
          relationship: t('studyAifg.steering-pipeline.model.readingBrakesBeforePalletBecause'),
        }
      : {
          note: t('studyAifg.steering-pipeline.model.readingCourierWaitsBecauseBypass'),
          relationship: t('studyAifg.steering-pipeline.model.readingWaitsBeforePalletBypass'),
        };
  if (arrived(state, example))
    return {
      note: t('studyAifg.steering-pipeline.model.readingCourierReachedDeliveryNearly'),
      relationship: t('studyAifg.steering-pipeline.model.readingDeliveryWithinStoppingTolerance'),
    };
  if (result.attempts.some((attempt) => !attempt.accepted))
    return {
      note: t('studyAifg.steering-pipeline.model.readingDirectRouteBlockedCourier'),
      relationship: t('studyAifg.steering-pipeline.model.readingStartsCheckedDetourAbove'),
    };
  if (state.route.length > route.length)
    return route.length === 2
      ? {
          note: t('studyAifg.steering-pipeline.model.readingCourierReleasesEntryCorner'),
          relationship: t('studyAifg.steering-pipeline.model.readingTurnsOntoUpperBypass'),
        }
      : {
          note: t('studyAifg.steering-pipeline.model.readingCourierReleasesExitCorner'),
          relationship: t('studyAifg.steering-pipeline.model.readingTurnsTowardsDeliveryPallet'),
        };
  const slowing = distance(state.position, route[0]) < example.slowRadius;
  if (route.length === 3)
    return slowing
      ? {
          note: t('studyAifg.steering-pipeline.model.readingCourierSlowsEntryCorner'),
          relationship: t('studyAifg.steering-pipeline.model.readingSlowsAboveBeforePallet'),
        }
      : {
          note: t('studyAifg.steering-pipeline.model.readingCourierHeadsEntryCorner'),
          relationship: t('studyAifg.steering-pipeline.model.readingHeadsAbovePalletTowards'),
        };
  if (route.length === 2) {
    if (slowing)
      return {
        note: t('studyAifg.steering-pipeline.model.readingCourierSlowsExitCorner'),
        relationship: t('studyAifg.steering-pipeline.model.readingSlowsAboveBeyondPallet'),
      };
    return state.position.x < example.palletX
      ? {
          note: t('studyAifg.steering-pipeline.model.readingCourierFollowsBypassAbove'),
          relationship: t('studyAifg.steering-pipeline.model.readingFollowsUpperBypassPallet'),
        }
      : {
          note: t('studyAifg.steering-pipeline.model.readingCourierKeepsExitWaypoint'),
          relationship: t('studyAifg.steering-pipeline.model.readingPassedAbovePalletContinues'),
        };
  }
  return slowing
    ? {
        note: t('studyAifg.steering-pipeline.model.readingCourierBrakesNearDelivery'),
        relationship: t('studyAifg.steering-pipeline.model.readingBrakesTowardsDeliveryPallet'),
      }
    : {
        note: t('studyAifg.steering-pipeline.model.readingPalletBehindCourierDelivery'),
        relationship: t('studyAifg.steering-pipeline.model.readingHeadsStraightDeliveryPallet'),
      };
}

const comparisonChecks = (example: PipelineParameters) =>
  example.maxChecks === example.failureChecks ? example.failureChecks + 1 : example.failureChecks;

function frameMarks(
  t: StudyTranslate,
  result: PipelineStep,
  example: PipelineParameters,
  route: readonly Vec2[],
): MotionFrame['marks'] {
  return [
    {
      ...result.goal,
      shape: 'cross',
      tone: 'target',
      label: t('studyAifg.steering-pipeline.model.deliveryLabel'),
    },
    {
      ...palletOf(example),
      shape: 'dot',
      tone: 'other',
      label: t('studyAifg.steering-pipeline.model.pallet'),
    },
    ...route.slice(0, -1).map((place, index) => ({
      ...place,
      shape: 'ring' as const,
      tone: index === 0 ? ('desired' as const) : ('muted' as const),
      label:
        route.length - index === 3
          ? t('studyAifg.steering-pipeline.model.entry')
          : t('studyAifg.steering-pipeline.model.exit'),
    })),
  ];
}

function describeFrame(
  t: StudyTranslate,
  state: PipelineState,
  result: PipelineStep,
  example: PipelineParameters,
) {
  const last = result.attempts.at(-1);
  const route = last?.route ?? state.route;
  const waypoint = route[0];
  const waypointName =
    route.length === 3
      ? t('studyAifg.steering-pipeline.model.entryCorner')
      : route.length === 2
        ? t('studyAifg.steering-pipeline.model.exitCorner')
        : t('studyAifg.steering-pipeline.model.delivery');
  const points = [state.position, ...route];
  const clearance = distance(state.position, palletOf(example)) - exclusionRadius(example);
  const routeGap = last?.routeClearance ?? routeClearance(state.position, route, example);
  const sweptGap = last?.sweptClearance ?? clearance;
  const localDistance = distance(state.position, waypoint);
  const bypass = repairRoute(result.goal, example);
  const reading = readingOf(t, state, result, route, example);
  const status = !result.accepted
    ? t('studyAifg.steering-pipeline.model.budgetExhaustedBraking')
    : arrived(state, example)
      ? t('studyAifg.steering-pipeline.model.deliveredWithinTolerance')
      : t('studyAifg.steering-pipeline.model.routeAccepted');
  const proposalReading = result.accepted
    ? arrived(state, example)
      ? t('studyAifg.steering-pipeline.model.courierMovingBelowStopping', {
          stateVelocity: fixed(length(state.velocity)),
          exampleCornerSpeed: fixed(example.cornerSpeed),
        })
      : t('studyAifg.steering-pipeline.model.nextStopAwayAlong', {
          waypointName,
          localDistance: fixed(localDistance),
          routeGap: fixed(routeGap),
        })
    : routeGap < 0
      ? t('studyAifg.steering-pipeline.model.directProposalOverlapsPallet', {
          value1: fixed(-routeGap),
        })
      : t('studyAifg.steering-pipeline.model.routeClearNextMovement', {
          value1: fixed(Math.max(0, -sweptGap)),
        });
  const values = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, fixed(value)]),
  );
  return {
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

function frameOf(
  t: StudyTranslate,
  state: PipelineState,
  result: PipelineStep,
  step: number,
  example: PipelineParameters,
): MotionFrame {
  const description = describeFrame(t, state, result, example);
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'courier',
        ...state.position,
        tone: 'subject',
        label: t('studyAifg.steering-pipeline.model.courier'),
      },
    ],
    zones: [
      { ...palletOf(example), radius: exclusionRadius(example) },
      { ...palletOf(example), radius: example.palletRadius },
    ],
    marks: frameMarks(t, result, example, description.route),
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
    worked: workedStep(t, state, result, step, example),
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

function compareRuns(
  t: StudyTranslate,
  example: PipelineParameters,
  otherChecks: ReturnType<typeof comparisonChecks>,
  seconds: number[],
  goalDistances: number[],
  otherDistances: number[],
  refused: number,
  states: ReturnType<typeof pipelineFrames>,
  otherRefused: number,
  other: ReturnType<typeof pipelineFrames>,
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.steering-pipeline.model.comparisonRepairNeedsCheckOwn'),
    intro: t('studyAifg.steering-pipeline.model.comparisonChangeCheckBudgetRejected', {
      exampleMaxChecks: example.maxChecks,
      otherChecks,
    }),
    timeline: {
      title: t('studyAifg.steering-pipeline.model.comparisonDistanceDeliver'),
      xLabel: t('studyAifg.steering-pipeline.model.timeSeconds'),
      yLabel: t('studyAifg.steering-pipeline.model.comparisonDeliveryDistance'),
      seconds,
      reference: example.targetRadius,
      series: [
        {
          id: 'selected',
          label: t('studyAifg.steering-pipeline.model.comparisonSelectedBudget', {
            exampleMaxChecks: example.maxChecks,
          }),
          tone: 'actual',
          values: goalDistances,
        },
        {
          id: 'comparison',
          label: t('studyAifg.steering-pipeline.model.comparisonComparisonBudget', {
            otherChecks,
          }),
          tone: 'desired',
          values: otherDistances,
        },
      ],
    },
    findings: [
      t('studyAifg.steering-pipeline.model.comparisonCheckRunRefusesUpdates', {
        exampleMaxChecks: example.maxChecks,
        refused,
        goalDistances: fixed(goalDistances[example.steps]),
        stepsVelocity: fixed(length(states[example.steps].velocity)),
      }),
      t('studyAifg.steering-pipeline.model.comparisonOtherRunResult', {
        otherChecks,
        otherRefused,
        otherDistances: fixed(otherDistances[example.steps]),
        stepsVelocity: fixed(length(other[example.steps].velocity)),
      }),
      t('studyAifg.steering-pipeline.model.comparisonCheckRunStaysRest', {
        exampleFailureChecks: example.failureChecks,
      }),
    ],
    note: t('studyAifg.steering-pipeline.model.comparisonLowerBudgetRepeatsSame'),
  };
}

function runMoments(
  t: StudyTranslate,
  blocked: boolean,
  example: PipelineParameters,
  find: (predicate: (state: PipelineState, calculation: PipelineStep) => boolean) => number,
  states: ReturnType<typeof pipelineFrames>,
  deliveredAt: number,
): MotionStudyModel['moments'] {
  return blocked
    ? [
        { label: t('studyAifg.steering-pipeline.model.requestRefused'), step: 0 },
        {
          label: t('studyAifg.steering-pipeline.model.waiting'),
          step: Math.floor(example.steps / 2),
        },
        {
          label: t('studyAifg.steering-pipeline.model.noDelivery'),
          step: example.steps,
        },
      ]
    : [
        { label: t('studyAifg.steering-pipeline.model.repairBeforeMoving'), step: 0 },
        {
          label: t('studyAifg.steering-pipeline.model.leaveEntryCorner'),
          step: find((_state, calculation) => calculation.attempts.at(-1)?.route.length === 2),
        },
        {
          label: t('studyAifg.steering-pipeline.model.passPallet'),
          step: find((state) => state.position.x >= example.palletX),
        },
        {
          label: t('studyAifg.steering-pipeline.model.deliveryLeg'),
          step: find(
            (state, calculation) =>
              calculation.attempts.at(-1)?.route.length === 1 && state.position.x > example.palletX,
          ),
        },
        {
          label: arrived(states[deliveredAt], example)
            ? t('studyAifg.steering-pipeline.model.delivered')
            : t('studyAifg.steering-pipeline.model.endRun'),
          step: deliveredAt,
        },
      ];
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  goalDistances: number[],
  states: ReturnType<typeof pipelineFrames>,
  calculations: PipelineStep[],
  example: PipelineParameters,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.steering-pipeline.model.deliveryGoalActiveWaypoint'),
    xLabel: t('studyAifg.steering-pipeline.model.timeSeconds'),
    yLabel: t('studyAifg.steering-pipeline.model.remainingDistance'),
    seconds,
    series: [
      {
        id: 'goal',
        label: t('studyAifg.steering-pipeline.model.deliveryDistance'),
        tone: 'actual',
        values: goalDistances,
      },
      {
        id: 'waypoint',
        label: t('studyAifg.steering-pipeline.model.nextWaypointDistance'),
        tone: 'desired',
        values: states.map((state, step) =>
          distance(state.position, calculations[step].attempts.at(-1)?.waypoint ?? state.route[0]),
        ),
      },
    ],
    reference: example.targetRadius,
  };
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'maxChecks',
      label: t('studyAifg.steering-pipeline.model.constraintChecks'),
      unit: t('studyAifg.steering-pipeline.model.checksUpdate'),
      min: 1,
      max: 2,
      step: 1,
    },
    {
      name: 'detourPadding',
      label: t('studyAifg.steering-pipeline.model.bypassPadding'),
      unit: t('studyAifg.steering-pipeline.model.inputsUnitUnits'),
      min: 2,
      max: 12,
      step: 2,
    },
  ];
}

export const present = (
  example: PipelineParameters,
  statesSamples: ReturnType<typeof pipelineSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const otherChecks = comparisonChecks(example);
  const otherExample = { ...example, maxChecks: otherChecks };
  const otherSamples = pipelineSamples(otherExample);
  const other = otherSamples.map(({ state }) => state);
  const otherCalculations = otherSamples.map(({ calculation }) => calculation);
  const unlabelled = states.map((state, step) =>
    frameOf(t, state, calculations[step], step, example),
  );
  const bounds = boundsOf(unlabelled, example);
  const frames = spaceLabels(unlabelled, bounds);
  const seconds = frames.map((frame) => frame.seconds);
  const goalDistances = states.map((state) => distance(state.position, goalOf(example)));
  const otherDistances = other.map((state) => distance(state.position, goalOf(example)));
  const find = (predicate: (state: PipelineState, calculation: PipelineStep) => boolean) => {
    const index = states.findIndex((state, step) => predicate(state, calculations[step]));
    return index < 0 ? example.steps : index;
  };
  const deliveredAt = find((state) => arrived(state, example));
  const refused = calculations.slice(0, -1).filter((calculation) => !calculation.accepted).length;
  const otherRefused = otherCalculations
    .slice(0, -1)
    .filter((calculation) => !calculation.accepted).length;
  const blocked = refused === example.steps;
  return {
    family: 'motion',
    motion: { bounds, frames, trail: true },
    timeline: runTimeline(t, seconds, goalDistances, states, calculations, example),
    initialStep: 0,
    moments: runMoments(t, blocked, example, find, states, deliveredAt),
    legend: [
      {
        tone: 'desired',
        label: t('studyAifg.steering-pipeline.model.checkedBypassNextCorner'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.steering-pipeline.model.deliveryDistanceChart'),
      },
      {
        tone: 'muted',
        label: t('studyAifg.steering-pipeline.model.directDeliveryRequestLater'),
      },
    ],
    caption: t('studyAifg.steering-pipeline.model.caption'),
    comparison: compareRuns(
      t,
      example,
      otherChecks,
      seconds,
      goalDistances,
      otherDistances,
      refused,
      states,
      otherRefused,
      other,
    ),
    inputs: runInputs(t),
  };
};
