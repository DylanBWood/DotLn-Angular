import { dot, length, normalize } from '@dotln-angular/scene-engine';

import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyPoint,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  goal,
  nearestWallPoint,
  type WallAvoidanceParameters,
  wallAvoidanceSamples,
  type WallAvoidanceState,
  type WallAvoidanceStep,
  wallClearance,
  wallEnd,
  type WallRayHit,
  wallStart,
} from './obstacle-and-wall-avoidance.simulation';
import { boundsOfPoints, fixed, pair } from './presentation';

function decision(state: WallAvoidanceState, calculation: WallAvoidanceStep, t: StudyTranslate) {
  if (calculation.clearance < 0)
    return t(
      'studyAifg.obstacle-and-wall-avoidance.model.decision.descriptions.courierDiscReachesThrough',
    );
  if (calculation.hit === null)
    return t(
      'studyAifg.obstacle-and-wall-avoidance.model.decision.descriptions.forwardSegmentMissesWall',
    );
  return dot(calculation.acceleration, state.velocity) < 0
    ? t('studyAifg.obstacle-and-wall-avoidance.model.decision.descriptions.rayHitsOffsetTarget')
    : t('studyAifg.obstacle-and-wall-avoidance.model.decision.descriptions.rayHitsSeekPulls');
}

function frameWorkedStep(
  example: WallAvoidanceParameters,
  seconds: number,
  state: WallAvoidanceState,
  calculation: WallAvoidanceStep,
  t: StudyTranslate,
): MotionFrame['worked'] {
  const hit = calculation.hit;
  const target = calculation.avoidanceTarget;
  return {
    title: t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.title', {
      seconds: fixed(seconds),
    }),
    lines: [
      t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.rayEnd', {
        position: pair(state.position),
        velocityHeadingNormalize: pair(
          length(state.velocity) === 0 ? state.heading : normalize(state.velocity),
        ),
        rayLength: fixed(example.rayLength),
        rayEnd: pair(calculation.rayEnd),
      }),
      hit === null
        ? t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.finiteRayWallSegments')
        : t(
            'studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.segmentIntersectionRayFraction',
            {
              hitRayFraction: fixed(hit.rayFraction),
              hitWallFraction: fixed(hit.wallFraction),
              hitPoint: pair(hit.point),
              hitNormal: pair(hit.normal),
            },
          ),
      hit === null || target === null
        ? t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.useDeliveryTarget', {
            goal: pair(goal(example)),
          })
        : t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.avoidTarget', {
            hitPoint: pair(hit.point),
            hitNormal: pair(hit.normal),
            avoidDistance: fixed(example.avoidDistance),
            target: pair(target),
          }),
      t(
        'studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.engineSeekTowardsReturns',
        {
          selectedTarget: pair(calculation.selectedTarget),
          acceleration: pair(calculation.acceleration),
        },
      ),
      t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.nextVelocityClip', {
        velocity: pair(state.velocity),
        acceleration: pair(calculation.acceleration),
        timeStep: fixed(example.timeStep),
        maxSpeed: fixed(example.maxSpeed),
        nextVelocity: pair(calculation.next.velocity),
      }),
      t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.steps.nextPositionCurrentBody', {
        position: pair(state.position),
        nextVelocity: pair(calculation.next.velocity),
        timeStep: fixed(example.timeStep),
        nextPosition: pair(calculation.next.position),
        nearestWallPoint: pair(nearestWallPoint(state.position, example)),
        radius: fixed(example.radius),
        clearance: fixed(calculation.clearance),
      }),
    ],
    note: t('studyAifg.obstacle-and-wall-avoidance.model.frames.worked.note'),
  };
}

function frameValues(
  example: WallAvoidanceParameters,
  seconds: number,
  state: WallAvoidanceState,
  calculation: WallAvoidanceStep,
  t: StudyTranslate,
): MotionFrame['values'] {
  const hit = calculation.hit;
  const target = calculation.avoidanceTarget;
  return {
    ...Object.fromEntries(Object.entries(example).map(([name, value]) => [name, String(value)])),
    seconds: fixed(seconds),
    position: pair(state.position),
    velocity: pair(state.velocity),
    wallStart: pair(wallStart(example)),
    wallEnd: pair(wallEnd(example)),
    goal: pair(goal(example)),
    rayStart: pair(state.position),
    rayEnd: pair(calculation.rayEnd),
    rayStatus:
      hit === null
        ? t('studyAifg.obstacle-and-wall-avoidance.model.frames.values.rayStatusCases.noHit')
        : t(
            'studyAifg.obstacle-and-wall-avoidance.model.frames.values.rayStatusCases.hitHitPoint',
            {
              hitPoint: pair(hit.point),
            },
          ),
    normal:
      hit === null
        ? t('studyAifg.obstacle-and-wall-avoidance.model.frames.values.normal')
        : pair(hit.normal),
    avoidanceTarget:
      target === null
        ? t('studyAifg.obstacle-and-wall-avoidance.model.frames.values.avoidanceTarget')
        : pair(target),
    selectedTarget: pair(calculation.selectedTarget),
    acceleration: pair(calculation.acceleration),
    clearance: fixed(calculation.clearance),
    decision: decision(state, calculation, t),
  };
}

function frameDrawing(
  state: WallAvoidanceState,
  t: StudyTranslate,
  example: WallAvoidanceParameters,
  marks: readonly MotionMark[],
  links: readonly MotionLink[],
  calculation: WallAvoidanceStep,
  hit: WallRayHit | null,
): Pick<MotionFrame, 'bodies' | 'zones' | 'marks' | 'links' | 'vectors'> {
  return {
    bodies: [
      {
        id: 'courier',
        ...state.position,
        tone: 'subject',
        label: t('studyAifg.obstacle-and-wall-avoidance.model.frames.bodies.labels.courier'),
      },
    ],
    zones: [{ ...state.position, radius: example.radius, tone: 'subject' }],
    marks,
    links,
    vectors: [
      {
        x: state.position.x,
        y: state.position.y + 2,
        dx: state.velocity.x * example.velocitySeconds,
        dy: state.velocity.y * example.velocitySeconds,
        tone: 'actual',
      },
      {
        x: state.position.x,
        y: state.position.y + 4,
        dx: calculation.acceleration.x * example.accelerationSecondsSquared,
        dy: calculation.acceleration.y * example.accelerationSecondsSquared,
        tone: 'desired',
      },
      ...(hit === null
        ? []
        : [
            {
              ...hit.point,
              dx: hit.normal.x * example.avoidDistance,
              dy: hit.normal.y * example.avoidDistance,
              tone: 'muted' as const,
            },
          ]),
    ],
  };
}

function frameOf(
  calculations: WallAvoidanceStep[],
  index: number,
  example: WallAvoidanceParameters,
  state: WallAvoidanceState,
  t: StudyTranslate,
  seconds: number[],
): MotionFrame {
  const calculation = calculations[index];
  const hit = calculation.hit;
  const target = calculation.avoidanceTarget;
  const links: readonly MotionLink[] = [
    { from: wallStart(example), to: wallEnd(example), tone: 'other' },
    { from: state.position, to: calculation.rayEnd, tone: 'desired' },
    ...(hit !== null && target !== null
      ? [{ from: hit.point, to: target, tone: 'muted' as const }]
      : []),
  ];
  const marks: readonly MotionMark[] = [
    {
      ...goal(example),
      shape: 'cross',
      tone: 'target',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.frames.marks.labels.delivery'),
    },
    ...(hit === null
      ? []
      : [
          {
            ...hit.point,
            shape: 'dot' as const,
            tone: 'other' as const,
            label: t('studyAifg.obstacle-and-wall-avoidance.model.frames.marks.labels.hit'),
          },
        ]),
    ...(target === null ? [] : [{ ...target, shape: 'cross' as const, tone: 'desired' as const }]),
  ];
  return {
    seconds: seconds[index],
    values: frameValues(example, seconds[index], state, calculation, t),
    ...frameDrawing(state, t, example, marks, links, calculation, hit),
    note: decision(state, calculation, t),
    worked: frameWorkedStep(example, seconds[index], state, calculation, t),
  };
}

function comparisonTimeline(
  t: StudyTranslate,
  seconds: number[],
  example: WallAvoidanceParameters,
  clearances: number[],
  comparedClearances: number[],
): NonNullable<MotionStudyModel['comparison']>['timeline'] {
  return {
    title: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.title'),
    xLabel: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.xLabel'),
    yLabel: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'main',
        label: t(
          'studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.series.labels.deliveryHeight',
          {
            goalY: example.goalY,
          },
        ),
        tone: 'actual',
        values: clearances,
      },
      {
        id: 'head-on',
        label: t(
          'studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.series.labels.deliveryHeight2',
          { comparisonGoalY: example.comparisonGoalY },
        ),
        tone: 'other',
        values: comparedClearances,
      },
    ],
  };
}

function comparisonOf(
  t: StudyTranslate,
  example: WallAvoidanceParameters,
  seconds: number[],
  clearances: number[],
  comparedClearances: number[],
  comparison: readonly WallAvoidanceState[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.title'),
    intro: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.intro', {
      goalY: example.goalY,
      comparisonGoalY: example.comparisonGoalY,
    }),
    timeline: comparisonTimeline(t, seconds, example, clearances, comparedClearances),
    findings: [
      t(
        'studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.minimumBodyClearanceExample',
        {
          minClearances: fixed(Math.min(...clearances)),
          minComparedClearances: fixed(Math.min(...comparedClearances)),
        },
      ),
      t('studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.changedRunEndsLargest', {
        comparisonPosition: pair(comparison[comparison.length - 1].position),
        greatestSidewaysDisplacement: fixed(
          Math.max(...comparison.map((state) => Math.abs(state.position.y - example.startY))),
        ),
      }),
      ...(example.goalY === example.comparisonGoalY
        ? [
            t(
              'studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.bothDestinationHeightsEqual',
            ),
          ]
        : []),
    ],
    note: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: number[],
  clearances: number[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.obstacle-and-wall-avoidance.model.timeline.title'),
    xLabel: t('studyAifg.obstacle-and-wall-avoidance.model.timeline.xLabel'),
    yLabel: t('studyAifg.obstacle-and-wall-avoidance.model.timeline.yLabel'),
    seconds,
    reference: 0,
    series: [
      {
        id: 'clearance',
        label: t(
          'studyAifg.obstacle-and-wall-avoidance.model.timeline.series.labels.courierBodyClearance',
        ),
        tone: 'actual',
        values: clearances,
      },
    ],
  };
}

function motionOf(
  points: StudyPoint[],
  padding: number,
  frames: readonly MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: boundsOfPoints(points, padding),
    frames,
    trail: true,
  };
}

function momentsOf(
  firstHit: number,
  t: StudyTranslate,
  turning: number,
  nearest: number,
  states: readonly WallAvoidanceState[],
): MotionStudyModel['moments'] {
  return [
    {
      label:
        firstHit < 0
          ? t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.startRayMisses')
          : t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.rayFirstHits'),
      step: Math.max(0, firstHit),
    },
    ...(turning < 0
      ? []
      : [
          {
            label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.turningAlongWall'),
            step: turning,
          },
        ]),
    {
      label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.smallestClearance'),
      step: nearest,
    },
    {
      label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.endRun'),
      step: states.length - 1,
    },
  ];
}

function legendOf(t: StudyTranslate, example: WallAvoidanceParameters): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.legend.labels.courierPhysicalRadius'),
    },
    {
      tone: 'other',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.legend.labels.wallSegmentRayHit'),
    },
    {
      tone: 'desired',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.legend.labels.rayAmberCrossAvoidance', {
        accelerationSecondsSquared: example.accelerationSecondsSquared,
      }),
    },
    {
      tone: 'actual',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.legend.labels.upperLaneVelocity', {
        velocitySeconds: example.velocitySeconds,
      }),
    },
    {
      tone: 'muted',
      label: t(
        'studyAifg.obstacle-and-wall-avoidance.model.legend.labels.surfaceNormalAvoidDistance',
      ),
    },
    {
      tone: 'target',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.legend.labels.deliveryPointBeyondWall'),
    },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'goalY',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.inputs.labels.deliveryHeight'),
      unit: t('studyAifg.obstacle-and-wall-avoidance.model.inputs.units.distance'),
      min: 0,
      max: 18,
      step: 1,
    },
    {
      name: 'rayLength',
      label: t('studyAifg.obstacle-and-wall-avoidance.model.inputs.labels.forwardRayLength'),
      unit: t('studyAifg.obstacle-and-wall-avoidance.model.inputs.units.distance'),
      min: 0.5,
      max: 12,
      step: 0.5,
    },
  ];
}

export function presentStudy(
  example: WallAvoidanceParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const statesSamples = wallAvoidanceSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const comparisonSamples = wallAvoidanceSamples({ ...example, goalY: example.comparisonGoalY });
  const comparison = comparisonSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const clearances = calculations.map((calculation) => calculation.clearance);
  const comparedClearances = comparison.map((state) => wallClearance(state.position, example));
  const seconds = states.map((_state, index) => index * example.timeStep);
  const frames: readonly MotionFrame[] = states.map((state, index) =>
    frameOf(calculations, index, example, state, t, seconds),
  );
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const firstHit = calculations.findIndex((calculation) => calculation.hit !== null);
  const turning = calculations.findIndex(
    (calculation) =>
      calculation.hit !== null &&
      Math.abs(calculation.acceleration.y) > Math.abs(calculation.acceleration.x),
  );
  const nearest = clearances.indexOf(Math.min(...clearances));
  const padding = example.radius * 3;
  return {
    family: 'motion',
    initialStep: Math.max(0, firstHit),
    motion: motionOf(points, padding, frames),
    timeline: timelineOf(t, seconds, clearances),
    moments: momentsOf(firstHit, t, turning, nearest, states),
    legend: legendOf(t, example),
    caption: t('studyAifg.obstacle-and-wall-avoidance.model.caption'),
    comparison: comparisonOf(t, example, seconds, clearances, comparedClearances, comparison),
    inputs: inputsOf(t),
  };
}
