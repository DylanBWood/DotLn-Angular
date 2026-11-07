import {
  add,
  centroid,
  distance,
  dot,
  length,
  scale,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { boundsOf } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  StudyComparison,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type Creature,
  creatureFrames,
  type CreatureParameters,
  type CreatureReading,
  type CreatureSample,
  playerAt,
  speciesTravel,
} from './making-the-creatures.simulation';
import type { AccelerationRow, AnchoredLabel } from './presentation';

function describeRun(
  p: CreatureParameters,
  statesSamples: readonly CreatureSample[],
): CreatureDescription {
  const states = statesSamples.map(({ state }) => state);
  const layout = layoutOf(statesSamples, p);
  const unresponsive = creatureFrames({ ...p, fleeScale: p.unresponsiveFleeScale });
  const gaps = states.map((creatures, step) =>
    distance(creatures[0].position, playerAt(step * p.timeStep, p)),
  );
  const unresponsiveGaps = unresponsive.map((creatures, step) =>
    distance(creatures[0].position, playerAt(step * p.timeStep, p)),
  );

  const seconds = states.map((_state, step) => step * p.timeStep);
  return { p, states, layout, gaps, unresponsiveGaps, seconds };
}

interface CreatureForces {
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly wandering: Vec2;
  readonly fleeing: Vec2;
}
interface CreatureDescription {
  readonly p: CreatureParameters;
  readonly states: readonly (readonly Creature[])[];
  readonly layout: CreatureLayout;
  readonly seconds: readonly number[];
  readonly gaps: readonly number[];
  readonly unresponsiveGaps: readonly number[];
}
interface CreatureFrame {
  readonly run: CreatureDescription;
  readonly sample: CreatureSample;
  readonly step: number;
  readonly rows: readonly AccelerationRow[];
  readonly names: readonly AnchoredLabel[];
  readonly r: CreatureReading;
  readonly weighted: CreatureForces;
  readonly seconds: number;
  readonly kit: Vec2;
  readonly fern: Creature;
  readonly social: Vec2;
  readonly playerRelation: string;
  readonly sheepLinkRelation: string;
  readonly goatLinkRelation: string;
  readonly creatureSteeringRelation: string;
}

const { number: fixed, vector: pair } = createNumberFormat();

function worked(t: StudyTranslate, description: CreatureFrame): StudyWorkedStep {
  const {
    sample,
    step,
    run: { p },
  } = description;

  const creatures = sample.state;
  const seconds = step * p.timeStep;
  const body = creatures[0];
  const r = sample.readings[0];
  const next = sample.next[0];
  const gap = distance(body.position, playerAt(seconds, p));
  const strength = p.maxAcceleration * Math.max(0, 1 - gap / p.fleeRadius);
  return {
    title: t('studyAifg.making-the-creatures.model.worked.fernSeconds', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + p.timeStep),
    }),
    lines: [
      t('studyAifg.making-the-creatures.model.worked.readSheepNeighboursCentre', {
        neighbourNames:
          r.neighbours.map(({ id }) => creatureName(t, id)).join(', ') ||
          t('studyAifg.making-the-creatures.model.worked.none'),
        rCentre: pair(r.centre),
        rMeanVelocity: pair(r.meanVelocity),
      }),
      t('studyAifg.making-the-creatures.model.worked.engineOutputsSeparationArrive', {
        rSeparation: pair(r.separation),
        rCohesion: pair(r.cohesion),
        rAlignment: pair(r.alignment),
      }),
      t('studyAifg.making-the-creatures.model.worked.prescribeWanderAngleSine', {
        pWanderAmplitude: fixed(p.wanderAmplitude),
        pWanderRate: fixed(p.wanderRate),
        seconds: fixed(seconds),
        rAngle: fixed(r.angle),
        rWandering: pair(r.wandering),
      }),
      t('studyAifg.making-the-creatures.model.worked.kitGapGivesFlee', {
        playerPosition: pair(playerAt(seconds, p)),
        gap: fixed(gap),
        pMaxAcceleration: fixed(p.maxAcceleration),
        pFleeRadius: fixed(p.fleeRadius),
        strength: fixed(strength),
        rFleeing: pair(r.fleeing),
      }),
      t('studyAifg.making-the-creatures.model.worked.fernSheepProfileSelects', {
        rWanderWeight: fixed(r.wanderWeight),
        rFleeWeight: fixed(r.fleeWeight),
        separation: pair(scale(r.separation, p.separationWeight)),
        cohesion: pair(scale(r.cohesion, p.cohesionWeight)),
        alignment: pair(scale(r.alignment, p.alignmentWeight)),
        wander: pair(scale(r.wandering, r.wanderWeight)),
        flee: pair(scale(r.fleeing, r.fleeWeight)),
      }),
      t('studyAifg.making-the-creatures.model.worked.engineBlendCapsSum', {
        pMaxAcceleration: fixed(p.maxAcceleration),
        rAcceleration: pair(r.acceleration),
        bodyVelocity: pair(body.velocity),
        pTimeStep: fixed(p.timeStep),
        pMaxSpeed: fixed(p.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.making-the-creatures.model.worked.pKitNextPosition', {
        bodyPosition: pair(body.position),
        nextVelocity: pair(next.velocity),
        pTimeStep: fixed(p.timeStep),
        nextPosition: pair(next.position),
        nextPlayerPosition: pair(playerAt(seconds + p.timeStep, p)),
      }),
    ],
    note: t('studyAifg.making-the-creatures.model.worked.sheepGoatProfilesAuthored'),
  };
}

// A shared display scale keeps even the weak opening wander request visible.
const accelerationScale = 4;

interface CreatureLayout {
  readonly vectorX: number;
  readonly labelX: number;
  readonly top: number;
  readonly rowGap: number;
}

/** The inset uses separate labelled rows, so aligned wander and flee requests stay visible. */
function layoutOf(samples: readonly CreatureSample[], p: CreatureParameters): CreatureLayout {
  const states = samples.map(({ state }) => state);
  const requests = samples.flatMap(({ readings }) => {
    const r = readings[0];
    return [
      add(
        add(scale(r.separation, p.separationWeight), scale(r.cohesion, p.cohesionWeight)),
        scale(r.alignment, p.alignmentWeight),
      ),
      scale(r.wandering, r.wanderWeight),
      scale(r.fleeing, r.fleeWeight),
      r.acceleration,
    ];
  });
  const widest = accelerationScale * Math.max(...requests.map(({ x }) => Math.abs(x)));
  const tallest = accelerationScale * Math.max(...requests.map(({ y }) => Math.abs(y)));
  const right = Math.max(
    ...states.flatMap((creatures, step) => [
      playerAt(step * p.timeStep, p).x + p.fleeRadius,
      ...creatures.map(({ position }) => position.x),
    ]),
  );
  const top = Math.min(
    ...states.flatMap((creatures, step) => [
      playerAt(step * p.timeStep, p).y - p.fleeRadius,
      ...creatures.map(({ position }) => position.y),
    ]),
  );
  return {
    labelX: right + 12,
    vectorX: right + widest + 24,
    top: top + tallest + 4,
    rowGap: Math.max(6, 2 * tallest + 4),
  };
}

/** Read the current response rather than assigning a story to an elapsed-time threshold. */
export interface CreatureObservation {
  readonly creatures: readonly Creature[];
  readonly example: CreatureParameters;
  readonly step: number;
  readonly reading: CreatureReading;
}

export function creatureNote(t: StudyTranslate, observation: CreatureObservation): string {
  const { creatures, example: p, step, reading: r } = observation;
  const seconds = step * p.timeStep;
  const fern = creatures[0];
  const kit = playerAt(seconds, p);
  const gap = distance(fern.position, kit);
  if (p.fleeScale === 0) {
    if (step === 0) return t('studyAifg.making-the-creatures.model.phase.kitStartsBehindSheep');
    if (gap < 2 * p.radius)
      return t('studyAifg.making-the-creatures.model.phase.kitCrowdingFernHer');
    if (kit.x >= fern.position.x)
      return t('studyAifg.making-the-creatures.model.phase.kitPassedFernBecause');
    return t('studyAifg.making-the-creatures.model.phase.kitClosingFernShe');
  }
  if (step === 0) return t('studyAifg.making-the-creatures.model.phase.kitStartsBehindFern');
  if (gap >= p.fleeRadius)
    return t('studyAifg.making-the-creatures.model.phase.fernOutsideKitFlee');
  const relativeVelocity = subtract(fern.velocity, { x: p.playerSpeed, y: 0 });
  if (dot(relativeVelocity, subtract(fern.position, kit)) < 0)
    return t('studyAifg.making-the-creatures.model.phase.kitGainingFernHer');
  const social = add(
    add(scale(r.separation, p.separationWeight), scale(r.cohesion, p.cohesionWeight)),
    scale(r.alignment, p.alignmentWeight),
  );
  if (dot(social, r.fleeing) < 0)
    return t('studyAifg.making-the-creatures.model.phase.fernOpeningGapKit');
  return t('studyAifg.making-the-creatures.model.phase.sharedRequestsOpenGap');
}

function steeringRows(
  t: StudyTranslate,
  social: Vec2,
  weighted: CreatureForces,
  r: CreatureReading,
): readonly AccelerationRow[] {
  return [
    {
      label: t('studyAifg.making-the-creatures.model.labels.social'),
      acceleration: social,
      tone: 'desired',
    },
    {
      label: t('studyAifg.making-the-creatures.model.labels.wander'),
      acceleration: weighted.wandering,
      tone: 'other',
    },
    {
      label: t('studyAifg.making-the-creatures.model.labels.flee'),
      acceleration: weighted.fleeing,
      tone: 'target',
    },
    {
      label: t('studyAifg.making-the-creatures.model.labels.result'),
      acceleration: r.acceleration,
      tone: 'actual',
    },
  ];
}

function labelMarks(description: CreatureFrame): readonly MotionMark[] {
  const {
    names,
    rows,
    run: { layout },
  } = description;

  return [
    ...names.map(({ label, anchor }) => ({
      ...anchor,
      label,
      shape: 'dot' as const,
      tone: 'muted' as const,
    })),
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
  run: CreatureDescription,
  sample: CreatureSample,
  step: number,
): CreatureFrame {
  const { p } = run;
  const creatures = sample.state;

  const seconds = step * p.timeStep;
  const r = sample.readings[0];
  const fern = creatures[0];
  const kit = playerAt(seconds, p);
  const weighted = {
    separation: scale(r.separation, p.separationWeight),
    cohesion: scale(r.cohesion, p.cohesionWeight),
    alignment: scale(r.alignment, p.alignmentWeight),
    wandering: scale(r.wandering, r.wanderWeight),
    fleeing: scale(r.fleeing, r.fleeWeight),
  };
  const social = add(add(weighted.separation, weighted.cohesion), weighted.alignment);
  const rows: readonly AccelerationRow[] = steeringRows(t, social, weighted, r);
  const subjects = [
    ...creatures.map(({ id, position }) => ({ label: creatureName(t, id), position })),
    { label: t('studyAifg.making-the-creatures.model.labels.kit'), position: kit },
  ].sort(
    (left, right) =>
      left.position.y - right.position.y ||
      (left.label === right.label ? 0 : left.label < right.label ? -1 : 1),
  );
  const mean = centroid(subjects.map(({ position }) => position));
  const nameX = Math.min(...subjects.map(({ position }) => position.x)) - 8;
  const names = subjects.map(({ label, position }, index) => ({
    label,
    position,
    anchor: { x: nameX, y: mean.y + (index - (subjects.length - 1) / 2) * 8 },
  }));
  const sheepCentre = centroid(
    creatures.filter(({ species }) => species === 'sheep').map(({ position }) => position),
  );
  const playerRelation =
    kit.x - sheepCentre.x > p.radius / 10
      ? t('studyAifg.making-the-creatures.model.labels.ahead')
      : sheepCentre.x - kit.x > p.radius / 10
        ? t('studyAifg.making-the-creatures.model.labels.behind')
        : t('studyAifg.making-the-creatures.model.labels.alongside');
  const sheepLinkRelation = r.neighbours.length
    ? t('studyAifg.making-the-creatures.model.labels.linkedSheep')
    : t('studyAifg.making-the-creatures.model.labels.lostSocialLink');
  const goatLinkRelation = sample.readings[2].neighbours.length
    ? t('studyAifg.making-the-creatures.model.labels.linkedGoats')
    : t('studyAifg.making-the-creatures.model.labels.lostSocialLink');
  const creatureSteeringRelation =
    p.fleeScale === 0
      ? t('studyAifg.making-the-creatures.model.labels.fernSocialWanderRequests')
      : dot(social, weighted.fleeing) < 0
        ? t('studyAifg.making-the-creatures.model.labels.fernSocialPullOpposes')
        : t('studyAifg.making-the-creatures.model.labels.fernBlendsSocialWander');
  return {
    run,
    sample,
    step,
    seconds,
    kit,
    rows,
    names,
    fern,
    r,
    social,
    weighted,
    playerRelation,
    sheepLinkRelation,
    goatLinkRelation,
    creatureSteeringRelation,
  };
}

function frameOf(t: StudyTranslate, description: CreatureFrame): MotionFrame {
  const {
    run: { p, layout },
    step,
    sample,
  } = description;
  const creatures = sample.state;

  return {
    seconds: description.seconds,
    bodies: [
      ...creatures.map(({ id, species, position }) => ({
        id,
        ...position,
        tone: species === 'sheep' ? ('subject' as const) : ('other' as const),
      })),
      { id: 'Kit', ...description.kit, tone: 'target' },
    ],
    zones: [{ ...description.kit, radius: p.fleeRadius }],
    vectors: description.rows.map(({ acceleration, tone }, index) => ({
      x: layout.vectorX,
      y: layout.top + index * layout.rowGap,
      dx: acceleration.x * accelerationScale,
      dy: acceleration.y * accelerationScale,
      tone,
    })),
    marks: labelMarks(description),
    links: [
      ...description.names.map(({ anchor, position }) => ({ from: anchor, to: position })),
      ...[0, 2].flatMap((index) =>
        sample.readings[index].neighbours.map(({ position }) => ({
          from: creatures[index].position,
          to: position,
        })),
      ),
    ],
    values: {
      seconds: fixed(description.seconds),
      fern: pair(description.fern.position),
      moss: pair(creatures[1].position),
      flint: pair(creatures[2].position),
      pebble: pair(creatures[3].position),
      kit: pair(description.kit),
      fleeRadius: fixed(p.fleeRadius),
      gap: fixed(distance(description.fern.position, description.kit)),
      neighbours: String(description.r.neighbours.length),
      centre: description.r.neighbours.length
        ? pair(description.r.centre)
        : t('studyAifg.making-the-creatures.model.values.absent'),
      meanVelocity: pair(description.r.meanVelocity),
      angle: fixed(description.r.angle),
      social: pair(description.social),
      separation: pair(description.weighted.separation),
      cohesion: pair(description.weighted.cohesion),
      alignment: pair(description.weighted.alignment),
      wandering: pair(description.weighted.wandering),
      fleeing: pair(description.weighted.fleeing),
      acceleration: pair(description.r.acceleration),
      wanderMagnitude: fixed(length(description.weighted.wandering)),
      fleeMagnitude: fixed(length(description.weighted.fleeing)),
      accelerationMagnitude: fixed(length(description.r.acceleration)),
      sheepWander: fixed(p.sheepWanderWeight),
      goatWander: fixed(p.goatWanderWeight),
      sheepFlee: fixed(p.sheepFleeWeight * p.fleeScale),
      goatFlee: fixed(p.goatFleeWeight * p.fleeScale),
      fleeScale: fixed(p.fleeScale),
      sheepTravel: fixed(speciesTravel(creatures, 'sheep', p)),
      goatTravel: fixed(speciesTravel(creatures, 'goat', p)),
      timeStep: fixed(p.timeStep),
      maxAcceleration: fixed(p.maxAcceleration),
      playerRelation: description.playerRelation,
      sheepLinkRelation: description.sheepLinkRelation,
      goatLinkRelation: description.goatLinkRelation,
      creatureSteeringRelation: description.creatureSteeringRelation,
    },
    note: creatureNote(t, { creatures, example: p, step, reading: sample.readings[0] }),
    worked: worked(t, description),
  };
}

function compareRuns(t: StudyTranslate, run: CreatureDescription): StudyComparison {
  const { p, states, gaps, unresponsiveGaps } = run;

  return {
    title: t('studyAifg.making-the-creatures.model.comparison.herdIgnoresPlayer'),
    intro:
      p.fleeScale === p.unresponsiveFleeScale
        ? t('studyAifg.making-the-creatures.model.comparison.runsCurrentlyPlayerResponse')
        : t('studyAifg.making-the-creatures.model.comparison.repeatSameDriveFleeScale', {
            pFleeScale: fixed(p.fleeScale),
            pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
          }),
    timeline: {
      title: t('studyAifg.making-the-creatures.model.comparison.fernDistanceKit'),
      xLabel: t('studyAifg.making-the-creatures.model.labels.timeSeconds'),
      yLabel: t('studyAifg.making-the-creatures.model.comparison.distance'),
      seconds: run.seconds,
      series: [
        {
          id: 'current',
          label: t('studyAifg.making-the-creatures.model.comparison.greenFleeScale', {
            pFleeScale: fixed(p.fleeScale),
          }),
          tone: 'actual',
          values: gaps,
        },
        {
          id: 'unresponsive',
          label: t('studyAifg.making-the-creatures.model.comparison.amberFleeScale', {
            pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
          }),
          tone: 'desired',
          values: unresponsiveGaps,
        },
      ],
    },
    findings: [
      t('studyAifg.making-the-creatures.model.comparison.closestSampledApproachFern', {
        selectedMinimumGap: fixed(Math.min(...gaps)),
        pFleeScale: fixed(p.fleeScale),
        unresponsiveMinimumGap: fixed(Math.min(...unresponsiveGaps)),
        pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
      }),
      t('studyAifg.making-the-creatures.model.comparison.currentRunEastwardCentre', {
        sheepTravel: fixed(speciesTravel(states[p.steps], 'sheep', p)),
        goatTravel: fixed(speciesTravel(states[p.steps], 'goat', p)),
      }),
      t('studyAifg.making-the-creatures.model.comparison.weightedFleeRequestRequest'),
    ],
    note: t('studyAifg.making-the-creatures.model.comparison.measuredDistanceBelongsFern'),
  };
}

function runTimeline(t: StudyTranslate, run: CreatureDescription): TimelineModel {
  const { p, states } = run;

  return {
    title: t('studyAifg.making-the-creatures.model.timeline.speciesMovementAcrossBracken'),
    xLabel: t('studyAifg.making-the-creatures.model.labels.timeSeconds'),
    yLabel: t('studyAifg.making-the-creatures.model.timeline.eastwardCentreDisplacement'),
    seconds: run.seconds,
    series: [
      {
        id: 'sheep',
        label: t('studyAifg.making-the-creatures.model.timeline.greenSheepCentreDisplacement'),
        tone: 'actual',
        values: states.map((creatures) => speciesTravel(creatures, 'sheep', p)),
      },
      {
        id: 'goats',
        label: t('studyAifg.making-the-creatures.model.timeline.amberGoatCentreDisplacement'),
        tone: 'desired',
        values: states.map((creatures) => speciesTravel(creatures, 'goat', p)),
      },
    ],
  };
}

export const present = (
  p: CreatureParameters,
  statesSamples: readonly CreatureSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const run = describeRun(p, statesSamples);

  const frames = statesSamples.map((sample, step) =>
    frameOf(t, describeFrame(t, run, sample, step)),
  );
  return {
    family: 'motion',
    motion: { bounds: boundsOf(frames, 12), frames, trail: true },
    timeline: runTimeline(t, run),
    initialStep: 0,
    moments: [
      { label: t('studyAifg.making-the-creatures.model.labels.kitBeginsDrive'), step: 0 },
      {
        label: t('studyAifg.making-the-creatures.model.labels.earlyProfileResponses'),
        step: Math.round(p.steps / 4),
      },
      {
        label: t('studyAifg.making-the-creatures.model.labels.playerContinuesEast'),
        step: Math.round(p.steps / 2),
      },
      {
        label: t('studyAifg.making-the-creatures.model.labels.endObservation'),
        step: p.steps,
      },
    ],
    legend: [
      {
        tone: 'zone',
        label: t('studyAifg.making-the-creatures.model.labels.circleKitFleeRange'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.making-the-creatures.model.labels.socialSeparationCohesionVelocity'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.making-the-creatures.model.labels.resultCappedSumLabelled'),
      },
    ],
    caption: t('studyAifg.making-the-creatures.model.overview.caption'),
    comparison: compareRuns(t, run),
    inputs: [
      {
        name: 'fleeScale',
        label: t('studyAifg.making-the-creatures.model.labels.playerResponse'),
        unit: t('studyAifg.making-the-creatures.model.labels.weightMultiplier'),
        min: 0,
        max: 2,
        step: 0.25,
      },
      {
        name: 'goatWanderWeight',
        label: t('studyAifg.making-the-creatures.model.labels.goatWanderWeight'),
        unit: t('studyAifg.making-the-creatures.model.labels.weight'),
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  };
};

function creatureName(t: StudyTranslate, value: string): string {
  switch (value) {
    case 'Fern':
      return t('studyAifg.making-the-creatures.model.names.creatureNameFern');
    case 'Moss':
      return t('studyAifg.making-the-creatures.model.names.creatureNameMoss');
    case 'Flint':
      return t('studyAifg.making-the-creatures.model.names.creatureNameFlint');
    case 'Pebble':
      return t('studyAifg.making-the-creatures.model.names.creatureNamePebble');
    default:
      return value;
  }
}
