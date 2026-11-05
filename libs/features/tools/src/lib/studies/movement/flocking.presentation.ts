import {
  add,
  centroid,
  distance,
  dot,
  length,
  normalize,
  scale,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { boundsOf } from '../drawing';
import type {
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  MotionVector,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  flockingFrames,
  type FlockingParameters,
  type FlockingReading,
  type FlockingSample,
  flockingSamples,
  nearestPair,
  readFlock,
  velocitySpread,
  type Walker,
} from './flocking.simulation';
import { decimal as fixed, vectorText as pair } from './presentation';

function workedLines(
  t: StudyTranslate,
  r: ReturnType<typeof readFlock>,
  p: FlockingParameters,
  pushes: string[],
  offset: Vec2,
  centreGap: number,
  desired: Vec2,
  body: Walker,
  contributions: Vec2[],
  next: Walker,
): readonly string[] {
  return [
    t('studyAifg.flocking.model.workedReadNeighboursStrictlyInside', {
      neighboursLength: r.neighbours.length,
      pNeighbourRadius: fixed(p.neighbourRadius),
      value3:
        r.neighbours.map(({ id }) => walkerName(t, id)).join(', ') ||
        t('studyAifg.flocking.model.workedNone'),
      rCentre: pair(r.centre),
      rMeanVelocity: pair(r.meanVelocity),
    }),
    t('studyAifg.flocking.model.workedCloseNeighbourPushes', {
      value1: pushes.join('; ') || t('studyAifg.flocking.model.workedNone'),
    }),
    t('studyAifg.flocking.model.workedEachNeighbourCloserLinear', {
      pSeparationThreshold: fixed(p.separationThreshold),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rSeparation: pair(r.separation),
    }),
    r.neighbours.length
      ? t('studyAifg.flocking.model.workedCentreOffsetLengthDesired', {
          offset: pair(offset),
          centreGap: fixed(centreGap),
          pMaxSpeed: fixed(p.maxSpeed),
          pSlowRadius: fixed(p.slowRadius),
          desired: fixed(length(desired)),
          desired2: pair(desired),
          bodyVelocity: pair(body.velocity),
          pResponseTime: fixed(p.responseTime),
          rCohesion: pair(r.cohesion),
        })
      : t('studyAifg.flocking.model.workedThereNoNeighbourCentre'),
    t('studyAifg.flocking.model.workedMatchCappedAlignmentWhen', {
      rMeanVelocity: pair(r.meanVelocity),
      bodyVelocity: pair(body.velocity),
      pResponseTime: fixed(p.responseTime),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rAlignment: pair(r.alignment),
      pCruiseSpeed: fixed(p.cruiseSpeed),
      rCruise: pair(r.cruise),
    }),
    t('studyAifg.flocking.model.workedWeightOutputsClipSum', {
      contributions: pair(contributions[0]),
      contributions2: pair(contributions[1]),
      contributions3: pair(contributions[2]),
      contributions4: pair(contributions[3]),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rAcceleration: pair(r.acceleration),
    }),
    t('studyAifg.flocking.model.workedVClip', {
      bodyVelocity: pair(body.velocity),
      rAcceleration: pair(r.acceleration),
      pTimeStep: fixed(p.timeStep),
      pMaxSpeed: fixed(p.maxSpeed),
      nextVelocity: pair(next.velocity),
    }),
    t('studyAifg.flocking.model.workedP', {
      bodyPosition: pair(body.position),
      nextVelocity: pair(next.velocity),
      pTimeStep: fixed(p.timeStep),
      nextPosition: pair(next.position),
    }),
  ];
}

function worked(
  t: StudyTranslate,
  sample: FlockingSample,
  step: number,
  p: FlockingParameters,
): StudyWorkedStep {
  const walkers = sample.state;
  const body = walkers[0];
  const r = sample.readings[0];
  const next = sample.next[0];
  const offset = subtract(r.centre, body.position);
  const centreGap = length(offset);
  const desired = scale(normalize(offset), p.maxSpeed * Math.min(1, centreGap / p.slowRadius));
  const pushes = r.neighbours
    .filter((other) => distance(body.position, other.position) < p.separationThreshold)
    .map((other) => {
      const gap = distance(body.position, other.position);
      return t('studyAifg.flocking.model.workedGapStrengthAway', {
        otherId: walkerName(t, other.id),
        gap: fixed(gap),
        pMaxAcceleration: fixed(p.maxAcceleration),
        pSeparationThreshold: fixed(p.separationThreshold),
        pMaxAcceleration2: fixed(
          (p.maxAcceleration * (p.separationThreshold - gap)) / p.separationThreshold,
        ),
      });
    });
  const contributions = [
    scale(r.separation, p.separationWeight),
    scale(r.cohesion, p.cohesionWeight),
    scale(r.alignment, p.alignmentWeight),
    scale(r.cruise, p.cruiseWeight),
  ];
  return {
    title: t('studyAifg.flocking.model.workedMaraSeconds', {
      step: fixed(step * p.timeStep),
      step2: fixed((step + 1) * p.timeStep),
    }),
    lines: workedLines(t, r, p, pushes, offset, centreGap, desired, body, contributions, next),
    note: t('studyAifg.flocking.model.workedOpposingSeparationCohesionCan'),
  };
}

interface FlockLayout {
  readonly vectorX: number;
  readonly labelX: number;
  readonly top: number;
  readonly rowGap: number;
}

/** Keep the acceleration rows outside every neighbourhood drawn during this run. */
function layoutOf(samples: readonly FlockingSample[], p: FlockingParameters): FlockLayout {
  const states = samples.map(({ state }) => state);
  const requests = samples.flatMap(({ readings }) => {
    const r = readings[0];
    return [
      scale(r.separation, p.separationWeight),
      scale(r.cohesion, p.cohesionWeight),
      scale(r.alignment, p.alignmentWeight),
      scale(r.cruise, p.cruiseWeight),
      r.acceleration,
    ];
  });
  const widest = Math.max(...requests.map(({ x }) => Math.abs(x)));
  const tallest = Math.max(...requests.map(({ y }) => Math.abs(y)));
  const right = Math.max(
    p.crossingX,
    ...states.flatMap((walkers) => walkers.map(({ position }) => position.x + p.neighbourRadius)),
  );
  const top = Math.min(
    -p.neighbourRadius,
    ...states.map((walkers) => walkers[0].position.y - p.neighbourRadius),
  );
  return {
    labelX: right + 12,
    vectorX: right + widest + 24,
    top: top + tallest + 4,
    rowGap: Math.max(6, 2 * tallest + 4),
  };
}

/** Notes follow the crossing itself, including the failures the live controls can expose. */
export function flockNote(
  t: StudyTranslate,
  walkers: readonly Walker[],
  step: number,
  p: FlockingParameters,
): string {
  const gap = nearestPair(walkers);
  const spread = velocitySpread(walkers);
  const centre = centroid(walkers.map(({ position }) => position));
  const speed = length(centroid(walkers.map(({ velocity }) => velocity)));
  if (gap < 2 * p.radius)
    return spread < p.maxSpeed / 20
      ? t('studyAifg.flocking.model.walkersAgreeAboutMotion')
      : t('studyAifg.flocking.model.walkersCrowdingOneAnother');
  if (step === 0) {
    if (p.cruiseWeight === 0) return t('studyAifg.flocking.model.ivoStartsFasterSocial');
    if (p.separationWeight === 0) return t('studyAifg.flocking.model.ivoStartsFasterCohesion');
    return t('studyAifg.flocking.model.ivoStartsFasterHis');
  }
  if (p.cruiseWeight === 0)
    return speed < p.maxSpeed / 100
      ? t('studyAifg.flocking.model.groupAlmostBeforeField')
      : t('studyAifg.flocking.model.initialMotionFadingBecause');
  if (p.separationWeight === 0) return t('studyAifg.flocking.model.walkersMatchingPaceDrawing');
  if (centre.x >= p.crossingX) return t('studyAifg.flocking.model.groupPassedFieldLine');
  if (spread < p.maxSpeed / 20) return t('studyAifg.flocking.model.walkersNowShareSimilar');
  return t('studyAifg.flocking.model.walkersAdjustingPaceBalancing');
}

function frameLinks(
  names: {
    label: string;
    position: Vec2;
    anchor: {
      x: number;
      y: number;
    };
  }[],
  p: FlockingParameters,
  r: FlockingReading,
  mara: Walker,
): MotionFrame['links'] {
  return [
    ...names.map(({ anchor, position }) => ({ from: anchor, to: position })),
    {
      from: { x: p.crossingX, y: -p.neighbourRadius },
      to: { x: p.crossingX, y: -p.neighbourRadius - 8 },
    },
    ...r.neighbours.map(({ position }) => ({ from: mara.position, to: position })),
    {
      from: { x: p.crossingX, y: -p.neighbourRadius },
      to: { x: p.crossingX, y: p.neighbourRadius },
    },
  ];
}

function steeringRows(
  t: StudyTranslate,
  weighted: {
    separation: Vec2;
    cohesion: Vec2;
    alignment: Vec2;
    cruise: Vec2;
  },
  r: ReturnType<typeof readFlock>,
): readonly {
  readonly label: string;
  readonly acceleration: Vec2;
  readonly tone: MotionVector['tone'];
}[] {
  return [
    {
      label: t('studyAifg.flocking.model.separation'),
      acceleration: weighted.separation,
      tone: 'target',
    },
    {
      label: t('studyAifg.flocking.model.cohesion'),
      acceleration: weighted.cohesion,
      tone: 'desired',
    },
    {
      label: t('studyAifg.flocking.model.match'),
      acceleration: weighted.alignment,
      tone: 'other',
    },
    {
      label: t('studyAifg.flocking.model.crossing'),
      acceleration: weighted.cruise,
      tone: 'muted',
    },
    {
      label: t('studyAifg.flocking.model.result'),
      acceleration: r.acceleration,
      tone: 'actual',
    },
  ];
}

function labelMarks(
  t: StudyTranslate,
  names: {
    label: string;
    position: Vec2;
    anchor: {
      x: number;
      y: number;
    };
  }[],
  r: ReturnType<typeof readFlock>,
  p: FlockingParameters,
  rows: readonly {
    readonly label: string;
    readonly acceleration: Vec2;
    readonly tone: MotionVector['tone'];
  }[],
  layout: FlockLayout,
): readonly MotionMark[] {
  return [
    ...names.map(({ label, anchor }) => ({
      ...anchor,
      label,
      shape: 'dot' as const,
      tone: 'muted' as const,
    })),
    ...(r.neighbours.length ? [{ ...r.centre, shape: 'cross' as const }] : []),
    {
      x: p.crossingX,
      y: -p.neighbourRadius - 8,
      shape: 'dot',
      label: t('studyAifg.flocking.model.fieldLine'),
      tone: 'muted',
    },
    ...rows.map(({ label, tone }, index) => ({
      x: layout.labelX,
      y: layout.top + index * layout.rowGap,
      shape: 'dot' as const,
      label,
      tone,
    })),
  ];
}

function describeFrame(
  t: StudyTranslate,
  walkers: readonly Walker[],
  p: FlockingParameters,
  layout: FlockLayout,
  r: FlockingReading,
) {
  const [mara, ivo, noor] = walkers;
  const weighted = {
    separation: scale(r.separation, p.separationWeight),
    cohesion: scale(r.cohesion, p.cohesionWeight),
    alignment: scale(r.alignment, p.alignmentWeight),
    cruise: scale(r.cruise, p.cruiseWeight),
  };
  const rows: readonly {
    readonly label: string;
    readonly acceleration: Vec2;
    readonly tone: MotionVector['tone'];
  }[] = steeringRows(t, weighted, r);
  const centre = centroid(walkers.map(({ position }) => position));
  const subjects = [
    ...walkers.map(({ id, position }) => ({ label: walkerName(t, id), position })),
    ...(r.neighbours.length
      ? [{ label: t('studyAifg.flocking.model.centre'), position: r.centre }]
      : []),
  ].sort(
    (left, right) =>
      left.position.y - right.position.y ||
      (left.label === right.label ? 0 : left.label < right.label ? -1 : 1),
  );
  const nameX = Math.min(...walkers.map(({ position }) => position.x)) - 8;
  const names = subjects.map(({ label, position }, index) => ({
    label,
    position,
    anchor: { x: nameX, y: centre.y + (index - (subjects.length - 1) / 2) * 8 },
  }));
  const marks: readonly MotionMark[] = labelMarks(t, names, r, p, rows, layout);
  const sum = add(
    add(weighted.separation, weighted.cohesion),
    add(weighted.alignment, weighted.cruise),
  );
  const paceRelation =
    ivo.position.x - mara.position.x > p.radius / 10
      ? t('studyAifg.flocking.model.ivoAheadMara')
      : mara.position.x - ivo.position.x > p.radius / 10
        ? t('studyAifg.flocking.model.maraAheadIvo')
        : t('studyAifg.flocking.model.walkersNearlyAbreast');
  const socialRelation =
    p.separationWeight === 0
      ? t('studyAifg.flocking.model.maraNoSeparationRequest')
      : dot(weighted.separation, weighted.cohesion) < 0
        ? t('studyAifg.flocking.model.maraSeparationCohesionRequests')
        : t('studyAifg.flocking.model.maraSocialRequestsCombine');
  const driveRelation =
    p.cruiseWeight === 0
      ? t('studyAifg.flocking.model.crossingDriveOff')
      : t('studyAifg.flocking.model.crossingDriveSteersTowards');
  return {
    mara,
    ivo,
    noor,
    rows,
    marks,
    names,
    r,
    weighted,
    sum,
    paceRelation,
    socialRelation,
    driveRelation,
  };
}

function frameOf(
  t: StudyTranslate,
  walkers: readonly Walker[],
  step: number,
  p: FlockingParameters,
  layout: FlockLayout,
  minimumGap: number,
  sample: FlockingSample,
): MotionFrame {
  const description = describeFrame(t, walkers, p, layout, sample.readings[0]);
  return {
    seconds: step * p.timeStep,
    bodies: walkers.map(({ id, position }, index) => ({
      id,
      ...position,
      tone: index === 0 ? 'subject' : 'other',
    })),
    vectors: description.rows.map(({ acceleration, tone }, index) => ({
      x: layout.vectorX,
      y: layout.top + index * layout.rowGap,
      dx: acceleration.x,
      dy: acceleration.y,
      tone,
    })),
    zones: [{ ...description.mara.position, radius: p.neighbourRadius }],
    marks: description.marks,
    links: frameLinks(description.names, p, description.r, description.mara),
    values: {
      seconds: fixed(step * p.timeStep),
      mara: pair(description.mara.position),
      ivo: pair(description.ivo.position),
      noor: pair(description.noor.position),
      neighbours: String(description.r.neighbours.length),
      neighbourRadius: fixed(p.neighbourRadius),
      centre: description.r.neighbours.length
        ? pair(description.r.centre)
        : t('studyAifg.flocking.model.valueAbsent'),
      meanVelocity: pair(description.r.meanVelocity),
      velocity: pair(description.mara.velocity),
      separation: pair(description.weighted.separation),
      cohesion: pair(description.weighted.cohesion),
      alignment: pair(description.weighted.alignment),
      cruise: pair(description.weighted.cruise),
      acceleration: pair(description.r.acceleration),
      separationMagnitude: fixed(length(description.weighted.separation)),
      cohesionMagnitude: fixed(length(description.weighted.cohesion)),
      alignmentMagnitude: fixed(length(description.weighted.alignment)),
      accelerationMagnitude: fixed(length(description.r.acceleration)),
      requestedMagnitude: fixed(length(description.sum)),
      separationWeight: fixed(p.separationWeight),
      cruiseWeight: fixed(p.cruiseWeight),
      cruiseSpeed: fixed(p.cruiseSpeed),
      responseTime: fixed(p.responseTime),
      speed: fixed(length(description.mara.velocity)),
      maxAcceleration: fixed(p.maxAcceleration),
      gap: fixed(nearestPair(walkers)),
      minimumGap: fixed(minimumGap),
      spread: fixed(velocitySpread(walkers)),
      diameter: fixed(2 * p.radius),
      crossingX: fixed(p.crossingX),
      timeStep: fixed(p.timeStep),
      paceRelation: description.paceRelation,
      steeringRelation: t('studyAifg.flocking.model.steeringRelationship', {
        socialRelation: description.socialRelation,
        driveRelation: description.driveRelation,
      }),
    },
    note: flockNote(t, walkers, step, p),
    worked: worked(t, sample, step, p),
  };
}

function compareRuns(
  t: StudyTranslate,
  p: FlockingParameters,
  frames: MotionFrame[],
  gaps: number[],
  crowdedGaps: number[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.flocking.model.comparisonCrossingTogetherCanMean'),
    intro:
      p.separationWeight === p.crowdedSeparationWeight
        ? t('studyAifg.flocking.model.comparisonRunsCurrentlySeparationSwitched')
        : t('studyAifg.flocking.model.comparisonRepeatReedFieldSeparationWeight', {
            pSeparationWeight: fixed(p.separationWeight),
            pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
          }),
    timeline: {
      title: t('studyAifg.flocking.model.comparisonClosestPairWalkers'),
      xLabel: t('studyAifg.flocking.model.timeSeconds'),
      yLabel: t('studyAifg.flocking.model.comparisonCentreDistance'),
      seconds: frames.map(({ seconds }) => seconds),
      reference: 2 * p.radius,
      series: [
        {
          id: 'current',
          label: t('studyAifg.flocking.model.comparisonGreenSeparationWeight', {
            pSeparationWeight: fixed(p.separationWeight),
          }),
          tone: 'actual',
          values: gaps,
        },
        {
          id: 'crowded',
          label: t('studyAifg.flocking.model.comparisonAmberSeparationWeight', {
            pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
          }),
          tone: 'desired',
          values: crowdedGaps,
        },
      ],
    },
    findings: [
      t('studyAifg.flocking.model.comparisonSmallestSampledGapSeparation', {
        value1: fixed(Math.min(...gaps)),
        pSeparationWeight: fixed(p.separationWeight),
        value3: fixed(Math.min(...crowdedGaps)),
        pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
        value5: fixed(2 * p.radius),
      }),
      t('studyAifg.flocking.model.comparisonLowVelocitySpreadSays'),
      t('studyAifg.flocking.model.comparisonInwardCohesionOutwardSeparation'),
    ],
    note: t('studyAifg.flocking.model.comparisonChartChecksSampledCentre'),
  };
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'separationWeight',
      label: t('studyAifg.flocking.model.separationWeight'),
      unit: t('studyAifg.flocking.model.weight'),
      min: 0,
      max: 2,
      step: 0.25,
    },
    {
      name: 'cruiseWeight',
      label: t('studyAifg.flocking.model.crossingDriveWeight'),
      unit: t('studyAifg.flocking.model.weight'),
      min: 0,
      max: 2,
      step: 0.25,
    },
  ];
}

export const present = (
  p: FlockingParameters,
  statesSamples: ReturnType<typeof flockingSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const crowded = flockingFrames({ ...p, separationWeight: p.crowdedSeparationWeight });
  const spreads = states.map(velocitySpread);
  const gaps = states.map(nearestPair);
  const crowdedGaps = crowded.map(nearestPair);
  const layout = layoutOf(statesSamples, p);
  const minimumGap = Math.min(...gaps);
  const frames = states.map((walkers, step) =>
    frameOf(t, walkers, step, p, layout, minimumGap, statesSamples[step]),
  );
  const crossing = states.findIndex(
    (walkers) => centroid(walkers.map(({ position }) => position)).x >= p.crossingX,
  );
  return {
    family: 'motion',
    motion: { bounds: boundsOf(frames, 12), frames, trail: true },
    timeline: {
      title: t('studyAifg.flocking.model.velocityDisagreementDuringReed'),
      xLabel: t('studyAifg.flocking.model.timeSeconds'),
      yLabel: t('studyAifg.flocking.model.rMSVelocitySpread'),
      seconds: frames.map(({ seconds }) => seconds),
      series: [
        {
          id: 'spread',
          label: t('studyAifg.flocking.model.greenDisagreementMeanVelocity'),
          tone: 'actual',
          values: spreads,
        },
      ],
      reference: 0,
      yRange: [0, Math.max(...spreads) || p.maxSpeed],
    },
    initialStep: 0,
    moments: [
      { label: t('studyAifg.flocking.model.differentStartingSpeeds'), step: 0 },
      {
        label: t('studyAifg.flocking.model.earlyAdjustments'),
        step: Math.round(p.steps / 5),
      },
      {
        label:
          crossing < 0
            ? t('studyAifg.flocking.model.shortFieldLine')
            : t('studyAifg.flocking.model.centreCrossesFieldLine'),
        step: crossing < 0 ? Math.round((3 * p.steps) / 4) : crossing,
      },
      { label: t('studyAifg.flocking.model.endObservation'), step: p.steps },
    ],
    legend: [
      { tone: 'zone', label: t('studyAifg.flocking.model.circleMaraNeighbourhood') },
      {
        tone: 'actual',
        label: t('studyAifg.flocking.model.resultCappedSumLabelled'),
      },
    ],
    caption: t('studyAifg.flocking.model.caption'),
    comparison: compareRuns(t, p, frames, gaps, crowdedGaps),
    inputs: inputsOf(t),
  };
};

function walkerName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Mara':
      return t('studyAifg.flocking.model.walkerNameMara');
    case 'Ivo':
      return t('studyAifg.flocking.model.walkerNameIvo');
    case 'Noor':
      return t('studyAifg.flocking.model.walkerNameNoor');
    default:
      return value;
  }
}
