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
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  flockingFrames,
  type FlockingParameters,
  type FlockingReading,
  type FlockingSample,
  nearestPair,
  velocitySpread,
  type Walker,
} from './flocking.simulation';
import type { AccelerationRow, AnchoredLabel } from './presentation';

function describeRun(
  p: FlockingParameters,
  statesSamples: readonly FlockingSample[],
): FlockDescription {
  const states = statesSamples.map(({ state }) => state);
  const crowded = flockingFrames({ ...p, separationWeight: p.crowdedSeparationWeight });
  const spreads = states.map(velocitySpread);
  const gaps = states.map(nearestPair);
  const crowdedGaps = crowded.map(nearestPair);
  const layout = layoutOf(statesSamples, p);
  const minimumGap = Math.min(...gaps);
  const crossing = states.findIndex(
    (walkers) => centroid(walkers.map(({ position }) => position)).x >= p.crossingX,
  );

  const seconds = states.map((_state, step) => step * p.timeStep);
  return { p, states, layout, gaps, crowdedGaps, spreads, minimumGap, crossing, seconds };
}

interface FlockCalculation {
  readonly pushes: readonly string[];
  readonly offset: Vec2;
  readonly centreGap: number;
  readonly desired: Vec2;
  readonly body: Walker;
  readonly contributions: readonly Vec2[];
  readonly next: Walker;
}

interface FlockForces {
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly cruise: Vec2;
}
interface FlockDescription {
  readonly p: FlockingParameters;
  readonly states: readonly (readonly Walker[])[];
  readonly layout: FlockLayout;
  readonly seconds: readonly number[];
  readonly gaps: readonly number[];
  readonly crowdedGaps: readonly number[];
  readonly spreads: readonly number[];
  readonly minimumGap: number;
  readonly crossing: number;
}
interface FlockFrame {
  readonly run: FlockDescription;
  readonly sample: FlockingSample;
  readonly step: number;
  readonly rows: readonly AccelerationRow[];
  readonly names: readonly AnchoredLabel[];
  readonly r: FlockingReading;
  readonly weighted: FlockForces;
  readonly mara: Walker;
  readonly ivo: Walker;
  readonly noor: Walker;
  readonly sum: Vec2;
  readonly paceRelation: string;
  readonly socialRelation: string;
  readonly driveRelation: string;
}

const { number: fixed, vector: pair } = createNumberFormat();

function workedLines(
  t: StudyTranslate,
  description: FlockFrame,
  calculation: FlockCalculation,
): readonly string[] {
  const {
    r,
    run: { p },
  } = description;
  const { pushes, offset, centreGap, desired, body, contributions, next } = calculation;

  return [
    t('studyAifg.flocking.model.worked.readNeighboursStrictlyInside', {
      neighboursLength: r.neighbours.length,
      pNeighbourRadius: fixed(p.neighbourRadius),
      neighbourNames:
        r.neighbours.map(({ id }) => walkerName(t, id)).join(', ') ||
        t('studyAifg.flocking.model.worked.none'),
      rCentre: pair(r.centre),
      rMeanVelocity: pair(r.meanVelocity),
    }),
    t('studyAifg.flocking.model.worked.closeNeighbourPushes', {
      pushes: pushes.join('; ') || t('studyAifg.flocking.model.worked.none'),
    }),
    t('studyAifg.flocking.model.worked.eachNeighbourCloserLinear', {
      pSeparationThreshold: fixed(p.separationThreshold),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rSeparation: pair(r.separation),
    }),
    r.neighbours.length
      ? t('studyAifg.flocking.model.worked.centreOffsetLengthDesired', {
          offset: pair(offset),
          centreGap: fixed(centreGap),
          pMaxSpeed: fixed(p.maxSpeed),
          pSlowRadius: fixed(p.slowRadius),
          desiredSpeed: fixed(length(desired)),
          desiredVelocity: pair(desired),
          bodyVelocity: pair(body.velocity),
          pResponseTime: fixed(p.responseTime),
          rCohesion: pair(r.cohesion),
        })
      : t('studyAifg.flocking.model.worked.thereNoNeighbourCentre'),
    t('studyAifg.flocking.model.worked.matchCappedAlignmentWhen', {
      rMeanVelocity: pair(r.meanVelocity),
      bodyVelocity: pair(body.velocity),
      pResponseTime: fixed(p.responseTime),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rAlignment: pair(r.alignment),
      pCruiseSpeed: fixed(p.cruiseSpeed),
      rCruise: pair(r.cruise),
    }),
    t('studyAifg.flocking.model.worked.weightOutputsClipSum', {
      separationContribution: pair(contributions[0]),
      cohesionContribution: pair(contributions[1]),
      alignmentContribution: pair(contributions[2]),
      cruiseContribution: pair(contributions[3]),
      pMaxAcceleration: fixed(p.maxAcceleration),
      rAcceleration: pair(r.acceleration),
    }),
    t('studyAifg.flocking.model.worked.vClip', {
      bodyVelocity: pair(body.velocity),
      rAcceleration: pair(r.acceleration),
      pTimeStep: fixed(p.timeStep),
      pMaxSpeed: fixed(p.maxSpeed),
      nextVelocity: pair(next.velocity),
    }),
    t('studyAifg.flocking.model.worked.p', {
      bodyPosition: pair(body.position),
      nextVelocity: pair(next.velocity),
      pTimeStep: fixed(p.timeStep),
      nextPosition: pair(next.position),
    }),
  ];
}

function worked(t: StudyTranslate, description: FlockFrame): StudyWorkedStep {
  const {
    sample,
    step,
    run: { p },
  } = description;

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
      return t('studyAifg.flocking.model.worked.gapStrengthAway', {
        otherId: walkerName(t, other.id),
        gap: fixed(gap),
        pMaxAcceleration: fixed(p.maxAcceleration),
        pSeparationThreshold: fixed(p.separationThreshold),
        separationStrength: fixed(
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
    title: t('studyAifg.flocking.model.worked.maraSeconds', {
      seconds: fixed(step * p.timeStep),
      nextSeconds: fixed((step + 1) * p.timeStep),
    }),
    lines: workedLines(t, description, {
      pushes,
      offset,
      centreGap,
      desired,
      body,
      contributions,
      next,
    }),
    note: t('studyAifg.flocking.model.worked.opposingSeparationCohesionCan'),
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
      ? t('studyAifg.flocking.model.phase.walkersAgreeAboutMotion')
      : t('studyAifg.flocking.model.phase.walkersCrowdingOneAnother');
  if (step === 0) {
    if (p.cruiseWeight === 0) return t('studyAifg.flocking.model.phase.ivoStartsFasterSocial');
    if (p.separationWeight === 0)
      return t('studyAifg.flocking.model.phase.ivoStartsFasterCohesion');
    return t('studyAifg.flocking.model.phase.ivoStartsFasterHis');
  }
  if (p.cruiseWeight === 0)
    return speed < p.maxSpeed / 100
      ? t('studyAifg.flocking.model.phase.groupAlmostBeforeField')
      : t('studyAifg.flocking.model.phase.initialMotionFadingBecause');
  if (p.separationWeight === 0)
    return t('studyAifg.flocking.model.phase.walkersMatchingPaceDrawing');
  if (centre.x >= p.crossingX) return t('studyAifg.flocking.model.phase.groupPassedFieldLine');
  if (spread < p.maxSpeed / 20) return t('studyAifg.flocking.model.phase.walkersNowShareSimilar');
  return t('studyAifg.flocking.model.phase.walkersAdjustingPaceBalancing');
}

function frameLinks(description: FlockFrame): readonly MotionLink[] {
  const {
    names,
    mara,
    r,
    run: { p },
  } = description;

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
  weighted: FlockForces,
  r: FlockingReading,
): readonly AccelerationRow[] {
  return [
    {
      label: t('studyAifg.flocking.model.labels.separation'),
      acceleration: weighted.separation,
      tone: 'target',
    },
    {
      label: t('studyAifg.flocking.model.labels.cohesion'),
      acceleration: weighted.cohesion,
      tone: 'desired',
    },
    {
      label: t('studyAifg.flocking.model.labels.match'),
      acceleration: weighted.alignment,
      tone: 'other',
    },
    {
      label: t('studyAifg.flocking.model.labels.crossing'),
      acceleration: weighted.cruise,
      tone: 'muted',
    },
    {
      label: t('studyAifg.flocking.model.labels.result'),
      acceleration: r.acceleration,
      tone: 'actual',
    },
  ];
}

function labelMarks(t: StudyTranslate, description: FlockFrame): readonly MotionMark[] {
  const {
    names,
    rows,
    r,
    run: { p, layout },
  } = description;

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
      label: t('studyAifg.flocking.model.labels.fieldLine'),
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
  run: FlockDescription,
  sample: FlockingSample,
  step: number,
): FlockFrame {
  const { p } = run;
  const walkers = sample.state;
  const r = sample.readings[0];

  const [mara, ivo, noor] = walkers;
  const weighted = {
    separation: scale(r.separation, p.separationWeight),
    cohesion: scale(r.cohesion, p.cohesionWeight),
    alignment: scale(r.alignment, p.alignmentWeight),
    cruise: scale(r.cruise, p.cruiseWeight),
  };
  const rows: readonly AccelerationRow[] = steeringRows(t, weighted, r);
  const centre = centroid(walkers.map(({ position }) => position));
  const subjects = [
    ...walkers.map(({ id, position }) => ({ label: walkerName(t, id), position })),
    ...(r.neighbours.length
      ? [{ label: t('studyAifg.flocking.model.labels.centre'), position: r.centre }]
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
  const sum = add(
    add(weighted.separation, weighted.cohesion),
    add(weighted.alignment, weighted.cruise),
  );
  const paceRelation =
    ivo.position.x - mara.position.x > p.radius / 10
      ? t('studyAifg.flocking.model.labels.ivoAheadMara')
      : mara.position.x - ivo.position.x > p.radius / 10
        ? t('studyAifg.flocking.model.labels.maraAheadIvo')
        : t('studyAifg.flocking.model.labels.walkersNearlyAbreast');
  const socialRelation =
    p.separationWeight === 0
      ? t('studyAifg.flocking.model.labels.maraNoSeparationRequest')
      : dot(weighted.separation, weighted.cohesion) < 0
        ? t('studyAifg.flocking.model.labels.maraSeparationCohesionRequests')
        : t('studyAifg.flocking.model.labels.maraSocialRequestsCombine');
  const driveRelation =
    p.cruiseWeight === 0
      ? t('studyAifg.flocking.model.labels.crossingDriveOff')
      : t('studyAifg.flocking.model.labels.crossingDriveSteersTowards');
  return {
    run,
    sample,
    step,
    mara,
    ivo,
    noor,
    rows,
    names,
    r,
    weighted,
    sum,
    paceRelation,
    socialRelation,
    driveRelation,
  };
}

function frameOf(t: StudyTranslate, description: FlockFrame): MotionFrame {
  const {
    run: { p, layout, minimumGap },
    step,
    sample,
  } = description;
  const walkers = sample.state;

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
    marks: labelMarks(t, description),
    links: frameLinks(description),
    values: {
      seconds: fixed(step * p.timeStep),
      mara: pair(description.mara.position),
      ivo: pair(description.ivo.position),
      noor: pair(description.noor.position),
      neighbours: String(description.r.neighbours.length),
      neighbourRadius: fixed(p.neighbourRadius),
      centre: description.r.neighbours.length
        ? pair(description.r.centre)
        : t('studyAifg.flocking.model.values.absent'),
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
      steeringRelation: t('studyAifg.flocking.model.labels.steeringRelationship', {
        socialRelation: description.socialRelation,
        driveRelation: description.driveRelation,
      }),
    },
    note: flockNote(t, walkers, step, p),
    worked: worked(t, description),
  };
}

function compareRuns(t: StudyTranslate, run: FlockDescription): StudyComparison {
  const { p, gaps, crowdedGaps } = run;

  return {
    title: t('studyAifg.flocking.model.comparison.crossingTogetherCanMean'),
    intro:
      p.separationWeight === p.crowdedSeparationWeight
        ? t('studyAifg.flocking.model.comparison.runsCurrentlySeparationSwitched')
        : t('studyAifg.flocking.model.comparison.repeatReedFieldSeparationWeight', {
            pSeparationWeight: fixed(p.separationWeight),
            pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
          }),
    timeline: {
      title: t('studyAifg.flocking.model.comparison.closestPairWalkers'),
      xLabel: t('studyAifg.flocking.model.labels.timeSeconds'),
      yLabel: t('studyAifg.flocking.model.comparison.centreDistance'),
      seconds: run.seconds,
      reference: 2 * p.radius,
      series: [
        {
          id: 'current',
          label: t('studyAifg.flocking.model.comparison.greenSeparationWeight', {
            pSeparationWeight: fixed(p.separationWeight),
          }),
          tone: 'actual',
          values: gaps,
        },
        {
          id: 'crowded',
          label: t('studyAifg.flocking.model.comparison.amberSeparationWeight', {
            pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
          }),
          tone: 'desired',
          values: crowdedGaps,
        },
      ],
    },
    findings: [
      t('studyAifg.flocking.model.comparison.smallestSampledGapSeparation', {
        selectedMinimumGap: fixed(Math.min(...gaps)),
        pSeparationWeight: fixed(p.separationWeight),
        crowdedMinimumGap: fixed(Math.min(...crowdedGaps)),
        pCrowdedSeparationWeight: fixed(p.crowdedSeparationWeight),
        diameter: fixed(2 * p.radius),
      }),
      t('studyAifg.flocking.model.comparison.lowVelocitySpreadSays'),
      t('studyAifg.flocking.model.comparison.inwardCohesionOutwardSeparation'),
    ],
    note: t('studyAifg.flocking.model.comparison.chartChecksSampledCentre'),
  };
}

function inputsOf(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'separationWeight',
      label: t('studyAifg.flocking.model.labels.separationWeight'),
      unit: t('studyAifg.flocking.model.labels.weight'),
      min: 0,
      max: 2,
      step: 0.25,
    },
    {
      name: 'cruiseWeight',
      label: t('studyAifg.flocking.model.labels.crossingDriveWeight'),
      unit: t('studyAifg.flocking.model.labels.weight'),
      min: 0,
      max: 2,
      step: 0.25,
    },
  ];
}

export const present = (
  p: FlockingParameters,
  statesSamples: readonly FlockingSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(p, statesSamples);
  const { spreads, crossing } = run;
  const frames = statesSamples.map((sample, step) =>
    frameOf(t, describeFrame(t, run, sample, step)),
  );
  return {
    family: 'motion',
    motion: { bounds: boundsOf(frames, 12), frames, trail: true },
    timeline: {
      title: t('studyAifg.flocking.model.labels.velocityDisagreementDuringReed'),
      xLabel: t('studyAifg.flocking.model.labels.timeSeconds'),
      yLabel: t('studyAifg.flocking.model.labels.rMSVelocitySpread'),
      seconds: run.seconds,
      series: [
        {
          id: 'spread',
          label: t('studyAifg.flocking.model.labels.greenDisagreementMeanVelocity'),
          tone: 'actual',
          values: spreads,
        },
      ],
      reference: 0,
      yRange: [0, Math.max(...spreads) || p.maxSpeed],
    },
    initialStep: 0,
    moments: [
      { label: t('studyAifg.flocking.model.labels.differentStartingSpeeds'), step: 0 },
      {
        label: t('studyAifg.flocking.model.labels.earlyAdjustments'),
        step: Math.round(p.steps / 5),
      },
      {
        label:
          crossing < 0
            ? t('studyAifg.flocking.model.labels.shortFieldLine')
            : t('studyAifg.flocking.model.labels.centreCrossesFieldLine'),
        step: crossing < 0 ? Math.round((3 * p.steps) / 4) : crossing,
      },
      { label: t('studyAifg.flocking.model.labels.endObservation'), step: p.steps },
    ],
    legend: [
      { tone: 'zone', label: t('studyAifg.flocking.model.labels.circleMaraNeighbourhood') },
      {
        tone: 'actual',
        label: t('studyAifg.flocking.model.labels.resultCappedSumLabelled'),
      },
    ],
    caption: t('studyAifg.flocking.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: inputsOf(t),
  };
};

function walkerName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Mara':
      return t('studyAifg.flocking.model.names.walkerNameMara');
    case 'Ivo':
      return t('studyAifg.flocking.model.names.walkerNameIvo');
    case 'Noor':
      return t('studyAifg.flocking.model.names.walkerNameNoor');
    default:
      return value;
  }
}
