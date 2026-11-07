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
  type WallAvoidanceSample,
  wallAvoidanceSamples,
  type WallAvoidanceState,
  type WallAvoidanceStep,
  wallEnd,
  type WallRayHit,
  wallStart,
} from './obstacle-and-wall-avoidance.simulation';
import { boundsOfPoints, fixed, pair } from './presentation';

interface WallRunDescription {
  readonly example: WallAvoidanceParameters;
  readonly samples: readonly WallAvoidanceSample[];
  readonly comparison: readonly WallAvoidanceSample[];
  readonly seconds: readonly number[];
  readonly clearances: readonly number[];
  readonly comparedClearances: readonly number[];
  readonly firstHit: number;
  readonly missesAgain: number;
  readonly nearest: number;
  readonly longRayOverlap: number;
  readonly maximumHeadingDifference: number;
}

function describeRun(example: WallAvoidanceParameters): WallRunDescription {
  const samples = wallAvoidanceSamples(example);
  const comparison = wallAvoidanceSamples(example, example.comparisonRayLength);
  const clearances = samples.map(({ calculation }) => calculation.clearance);
  const firstHit = samples.findIndex(({ calculation }) => calculation.hit !== null);
  const missesAgain =
    firstHit < 0
      ? -1
      : samples.findIndex(({ calculation }, step) => step > firstHit && calculation.hit === null);
  const longClearances = [10, 10.5, 11, 11.5, 12].flatMap((rayLength) =>
    wallAvoidanceSamples(example, rayLength).map(({ calculation }) => calculation.clearance),
  );
  const headingDifferences = samples.map(({ state }, step) => {
    const alignment = dot(state.heading, comparison[step].state.heading);
    return (Math.acos(Math.max(-1, Math.min(1, alignment))) * 180) / Math.PI;
  });
  return {
    example,
    samples,
    comparison,
    clearances,
    firstHit,
    missesAgain,
    seconds: samples.map((_sample, step) => step * example.timeStep),
    comparedClearances: comparison.map(({ calculation }) => calculation.clearance),
    nearest: clearances.indexOf(Math.min(...clearances)),
    longRayOverlap: Math.max(0, -Math.min(...longClearances)),
    maximumHeadingDifference: Math.max(...headingDifferences),
  };
}

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
  seconds: readonly number[],
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

function comparisonOf(
  t: StudyTranslate,
  run: WallRunDescription,
): NonNullable<MotionStudyModel['comparison']> {
  const { example, comparison, clearances, comparedClearances, seconds } = run;
  const hitFrames = run.samples.filter(({ calculation }) => calculation.hit !== null).length;
  const shortHitFrames = comparison.filter(({ calculation }) => calculation.hit !== null).length;
  return {
    title: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.title'),
    intro: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.intro', {
      rayLength: example.rayLength,
      comparisonRayLength: example.comparisonRayLength,
    }),
    timeline: {
      title: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.title'),
      xLabel: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.xLabel'),
      yLabel: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.yLabel'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'main',
          tone: 'actual',
          values: clearances,
          label: t(
            'studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.series.labels.rayLength',
            { rayLength: example.rayLength },
          ),
        },
        {
          id: 'short-ray',
          tone: 'other',
          values: comparedClearances,
          label: t(
            'studyAifg.obstacle-and-wall-avoidance.model.comparison.timeline.series.labels.rayLength',
            { rayLength: example.comparisonRayLength },
          ),
        },
      ],
    },
    findings: [
      t(
        'studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.minimumBodyClearanceExample',
        {
          minClearances: fixed(Math.min(...clearances)),
          minComparedClearances: fixed(Math.min(...comparedClearances)),
        },
      ),
      t('studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.rayInfluence', {
        hitFrames,
        shortHitFrames,
        frameCount: run.samples.length,
        maximumHeadingDifference: fixed(run.maximumHeadingDifference),
      }),
      ...(example.rayLength === example.comparisonRayLength
        ? [t('studyAifg.obstacle-and-wall-avoidance.model.comparison.findings.bothRayLengthsEqual')]
        : []),
    ],
    note: t('studyAifg.obstacle-and-wall-avoidance.model.comparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  seconds: readonly number[],
  clearances: readonly number[],
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

function momentsOf(t: StudyTranslate, run: WallRunDescription): MotionStudyModel['moments'] {
  return [
    {
      label:
        run.firstHit < 0
          ? t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.startRayMisses')
          : t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.rayFirstHits'),
      step: Math.max(0, run.firstHit),
    },
    ...(run.missesAgain < 0
      ? []
      : [
          {
            label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.rayMissesAgain'),
            step: run.missesAgain,
          },
        ]),
    {
      label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.smallestClearance'),
      step: run.nearest,
    },
    {
      label: t('studyAifg.obstacle-and-wall-avoidance.model.moments.labels.endRun'),
      step: run.samples.length - 1,
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
  const run = describeRun(example);
  const calculations = run.samples.map(({ calculation }) => calculation);
  const frames: readonly MotionFrame[] = run.samples.map(({ state }, index) => {
    const frame = frameOf(calculations, index, example, state, t, run.seconds);
    return { ...frame, values: { ...frame.values, longRayOverlap: fixed(run.longRayOverlap) } };
  });
  const points = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.links ?? []).flatMap((link) => [link.from, link.to]),
    ...(frame.vectors ?? []).map((vector) => ({
      x: vector.x + vector.dx,
      y: vector.y + vector.dy,
    })),
  ]);
  const padding = example.radius * 3;
  return {
    family: 'motion',
    initialStep: Math.max(0, run.firstHit),
    motion: motionOf(points, padding, frames),
    timeline: timelineOf(t, run.seconds, run.clearances),
    moments: momentsOf(t, run),
    legend: legendOf(t, example),
    caption: t('studyAifg.obstacle-and-wall-avoidance.model.caption'),
    comparison: comparisonOf(t, run),
    inputs: inputsOf(t),
  };
}
