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
import type {
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  MotionVector,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type Creature,
  creatureFrames,
  type CreatureParameters,
  type CreatureReading,
  type CreatureSample,
  creatureSamples,
  playerAt,
  readCreature,
  speciesTravel,
} from './making-the-creatures.simulation';
import { decimal as fixed, vectorText as pair } from './presentation';

function worked(
  t: StudyTranslate,
  sample: CreatureSample,
  step: number,
  p: CreatureParameters,
): StudyWorkedStep {
  const creatures = sample.state;
  const seconds = step * p.timeStep;
  const body = creatures[0];
  const r = sample.readings[0];
  const next = sample.next[0];
  const gap = distance(body.position, playerAt(seconds, p));
  const strength = p.maxAcceleration * Math.max(0, 1 - gap / p.fleeRadius);
  return {
    title: t('studyAifg.making-the-creatures.model.workedFernSeconds', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + p.timeStep),
    }),
    lines: [
      t('studyAifg.making-the-creatures.model.workedReadSheepNeighboursCentre', {
        value1:
          r.neighbours.map(({ id }) => creatureName(t, id)).join(', ') ||
          t('studyAifg.making-the-creatures.model.workedNone'),
        rCentre: pair(r.centre),
        rMeanVelocity: pair(r.meanVelocity),
      }),
      t('studyAifg.making-the-creatures.model.workedEngineOutputsSeparationArrive', {
        rSeparation: pair(r.separation),
        rCohesion: pair(r.cohesion),
        rAlignment: pair(r.alignment),
      }),
      t('studyAifg.making-the-creatures.model.workedPrescribeWanderAngleSine', {
        pWanderAmplitude: fixed(p.wanderAmplitude),
        pWanderRate: fixed(p.wanderRate),
        seconds: fixed(seconds),
        rAngle: fixed(r.angle),
        rWandering: pair(r.wandering),
      }),
      t('studyAifg.making-the-creatures.model.workedKitGapGivesFlee', {
        value1: pair(playerAt(seconds, p)),
        gap: fixed(gap),
        pMaxAcceleration: fixed(p.maxAcceleration),
        pFleeRadius: fixed(p.fleeRadius),
        strength: fixed(strength),
        rFleeing: pair(r.fleeing),
      }),
      t('studyAifg.making-the-creatures.model.workedFernSheepProfileSelects', {
        rWanderWeight: fixed(r.wanderWeight),
        rFleeWeight: fixed(r.fleeWeight),
        value3: pair(scale(r.separation, p.separationWeight)),
        value4: pair(scale(r.cohesion, p.cohesionWeight)),
        value5: pair(scale(r.alignment, p.alignmentWeight)),
        value6: pair(scale(r.wandering, r.wanderWeight)),
        value7: pair(scale(r.fleeing, r.fleeWeight)),
      }),
      t('studyAifg.making-the-creatures.model.workedEngineBlendCapsSum', {
        pMaxAcceleration: fixed(p.maxAcceleration),
        rAcceleration: pair(r.acceleration),
        bodyVelocity: pair(body.velocity),
        pTimeStep: fixed(p.timeStep),
        pMaxSpeed: fixed(p.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.making-the-creatures.model.workedPKitNextPosition', {
        bodyPosition: pair(body.position),
        nextVelocity: pair(next.velocity),
        pTimeStep: fixed(p.timeStep),
        nextPosition: pair(next.position),
        value5: pair(playerAt(seconds + p.timeStep, p)),
      }),
    ],
    note: t('studyAifg.making-the-creatures.model.workedSheepGoatProfilesAuthored'),
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
export function creatureNote(
  t: StudyTranslate,
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
  r: CreatureReading,
): string {
  const seconds = step * p.timeStep;
  const fern = creatures[0];
  const kit = playerAt(seconds, p);
  const gap = distance(fern.position, kit);
  if (p.fleeScale === 0) {
    if (step === 0) return t('studyAifg.making-the-creatures.model.kitStartsBehindSheep');
    if (gap < 2 * p.radius) return t('studyAifg.making-the-creatures.model.kitCrowdingFernHer');
    if (kit.x >= fern.position.x)
      return t('studyAifg.making-the-creatures.model.kitPassedFernBecause');
    return t('studyAifg.making-the-creatures.model.kitClosingFernShe');
  }
  if (step === 0) return t('studyAifg.making-the-creatures.model.kitStartsBehindFern');
  if (gap >= p.fleeRadius) return t('studyAifg.making-the-creatures.model.fernOutsideKitFlee');
  const relativeVelocity = subtract(fern.velocity, { x: p.playerSpeed, y: 0 });
  if (dot(relativeVelocity, subtract(fern.position, kit)) < 0)
    return t('studyAifg.making-the-creatures.model.kitGainingFernHer');
  const social = add(
    add(scale(r.separation, p.separationWeight), scale(r.cohesion, p.cohesionWeight)),
    scale(r.alignment, p.alignmentWeight),
  );
  if (dot(social, r.fleeing) < 0)
    return t('studyAifg.making-the-creatures.model.fernOpeningGapKit');
  return t('studyAifg.making-the-creatures.model.sharedRequestsOpenGap');
}

function steeringRows(
  t: StudyTranslate,
  social: Vec2,
  weighted: {
    separation: Vec2;
    cohesion: Vec2;
    alignment: Vec2;
    wandering: Vec2;
    fleeing: Vec2;
  },
  r: ReturnType<typeof readCreature>,
): readonly {
  readonly label: string;
  readonly acceleration: Vec2;
  readonly tone: MotionVector['tone'];
}[] {
  return [
    {
      label: t('studyAifg.making-the-creatures.model.social'),
      acceleration: social,
      tone: 'desired',
    },
    {
      label: t('studyAifg.making-the-creatures.model.wander'),
      acceleration: weighted.wandering,
      tone: 'other',
    },
    {
      label: t('studyAifg.making-the-creatures.model.flee'),
      acceleration: weighted.fleeing,
      tone: 'target',
    },
    {
      label: t('studyAifg.making-the-creatures.model.result'),
      acceleration: r.acceleration,
      tone: 'actual',
    },
  ];
}

function labelMarks(
  names: {
    label: string;
    position: Vec2;
    anchor: {
      x: number;
      y: number;
    };
  }[],
  rows: readonly {
    readonly label: string;
    readonly acceleration: Vec2;
    readonly tone: MotionVector['tone'];
  }[],
  layout: CreatureLayout,
): readonly MotionMark[] {
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
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
  layout: CreatureLayout,
  sample: CreatureSample,
) {
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
  const rows: readonly {
    readonly label: string;
    readonly acceleration: Vec2;
    readonly tone: MotionVector['tone'];
  }[] = steeringRows(t, social, weighted, r);
  const subjects = [
    ...creatures.map(({ id, position }) => ({ label: creatureName(t, id), position })),
    { label: t('studyAifg.making-the-creatures.model.kit'), position: kit },
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
  const marks: readonly MotionMark[] = labelMarks(names, rows, layout);
  const sheepCentre = centroid(
    creatures.filter(({ species }) => species === 'sheep').map(({ position }) => position),
  );
  const playerRelation =
    kit.x - sheepCentre.x > p.radius / 10
      ? t('studyAifg.making-the-creatures.model.ahead')
      : sheepCentre.x - kit.x > p.radius / 10
        ? t('studyAifg.making-the-creatures.model.behind')
        : t('studyAifg.making-the-creatures.model.alongside');
  const sheepLinkRelation = r.neighbours.length
    ? t('studyAifg.making-the-creatures.model.linkedSheep')
    : t('studyAifg.making-the-creatures.model.lostSocialLink');
  const goatLinkRelation = sample.readings[2].neighbours.length
    ? t('studyAifg.making-the-creatures.model.linkedGoats')
    : t('studyAifg.making-the-creatures.model.lostSocialLink');
  const creatureSteeringRelation =
    p.fleeScale === 0
      ? t('studyAifg.making-the-creatures.model.fernSocialWanderRequests')
      : dot(social, weighted.fleeing) < 0
        ? t('studyAifg.making-the-creatures.model.fernSocialPullOpposes')
        : t('studyAifg.making-the-creatures.model.fernBlendsSocialWander');
  return {
    seconds,
    kit,
    rows,
    marks,
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

function frameOf(
  t: StudyTranslate,
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
  layout: CreatureLayout,
  sample: CreatureSample,
): MotionFrame {
  const description = describeFrame(t, creatures, step, p, layout, sample);
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
    marks: description.marks,
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
        : t('studyAifg.making-the-creatures.model.valueAbsent'),
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
    note: creatureNote(t, creatures, step, p, sample.readings[0]),
    worked: worked(t, sample, step, p),
  };
}

function compareRuns(
  t: StudyTranslate,
  p: CreatureParameters,
  frames: MotionFrame[],
  gaps: number[],
  unresponsiveGaps: number[],
  states: readonly (readonly Creature[])[],
): NonNullable<MotionStudyModel['comparison']> {
  return {
    title: t('studyAifg.making-the-creatures.model.comparisonHerdIgnoresPlayer'),
    intro:
      p.fleeScale === p.unresponsiveFleeScale
        ? t('studyAifg.making-the-creatures.model.comparisonRunsCurrentlyPlayerResponse')
        : t('studyAifg.making-the-creatures.model.comparisonRepeatSameDriveFleeScale', {
            pFleeScale: fixed(p.fleeScale),
            pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
          }),
    timeline: {
      title: t('studyAifg.making-the-creatures.model.comparisonFernDistanceKit'),
      xLabel: t('studyAifg.making-the-creatures.model.timeSeconds'),
      yLabel: t('studyAifg.making-the-creatures.model.comparisonDistance'),
      seconds: frames.map(({ seconds }) => seconds),
      series: [
        {
          id: 'current',
          label: t('studyAifg.making-the-creatures.model.comparisonGreenFleeScale', {
            pFleeScale: fixed(p.fleeScale),
          }),
          tone: 'actual',
          values: gaps,
        },
        {
          id: 'unresponsive',
          label: t('studyAifg.making-the-creatures.model.comparisonAmberFleeScale', {
            pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
          }),
          tone: 'desired',
          values: unresponsiveGaps,
        },
      ],
    },
    findings: [
      t('studyAifg.making-the-creatures.model.comparisonClosestSampledApproachFern', {
        value1: fixed(Math.min(...gaps)),
        pFleeScale: fixed(p.fleeScale),
        value3: fixed(Math.min(...unresponsiveGaps)),
        pUnresponsiveFleeScale: fixed(p.unresponsiveFleeScale),
      }),
      t('studyAifg.making-the-creatures.model.comparisonCurrentRunEastwardCentre', {
        value1: fixed(speciesTravel(states[p.steps], 'sheep', p)),
        value2: fixed(speciesTravel(states[p.steps], 'goat', p)),
      }),
      t('studyAifg.making-the-creatures.model.comparisonWeightedFleeRequestRequest'),
    ],
    note: t('studyAifg.making-the-creatures.model.comparisonMeasuredDistanceBelongsFern'),
  };
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  states: readonly (readonly Creature[])[],
  p: CreatureParameters,
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.making-the-creatures.model.speciesMovementAcrossBracken'),
    xLabel: t('studyAifg.making-the-creatures.model.timeSeconds'),
    yLabel: t('studyAifg.making-the-creatures.model.eastwardCentreDisplacement'),
    seconds: frames.map(({ seconds }) => seconds),
    series: [
      {
        id: 'sheep',
        label: t('studyAifg.making-the-creatures.model.greenSheepCentreDisplacement'),
        tone: 'actual',
        values: states.map((creatures) => speciesTravel(creatures, 'sheep', p)),
      },
      {
        id: 'goats',
        label: t('studyAifg.making-the-creatures.model.amberGoatCentreDisplacement'),
        tone: 'desired',
        values: states.map((creatures) => speciesTravel(creatures, 'goat', p)),
      },
    ],
  };
}

export const present = (
  p: CreatureParameters,
  statesSamples: ReturnType<typeof creatureSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const layout = layoutOf(statesSamples, p);
  const frames = states.map((creatures, step) =>
    frameOf(t, creatures, step, p, layout, statesSamples[step]),
  );
  const unresponsive = creatureFrames({ ...p, fleeScale: p.unresponsiveFleeScale });
  const gaps = states.map((creatures, step) =>
    distance(creatures[0].position, playerAt(step * p.timeStep, p)),
  );
  const unresponsiveGaps = unresponsive.map((creatures, step) =>
    distance(creatures[0].position, playerAt(step * p.timeStep, p)),
  );
  return {
    family: 'motion',
    motion: { bounds: boundsOf(frames, 12), frames, trail: true },
    timeline: runTimeline(t, frames, states, p),
    initialStep: 0,
    moments: [
      { label: t('studyAifg.making-the-creatures.model.kitBeginsDrive'), step: 0 },
      {
        label: t('studyAifg.making-the-creatures.model.earlyProfileResponses'),
        step: Math.round(p.steps / 4),
      },
      {
        label: t('studyAifg.making-the-creatures.model.playerContinuesEast'),
        step: Math.round(p.steps / 2),
      },
      {
        label: t('studyAifg.making-the-creatures.model.endObservation'),
        step: p.steps,
      },
    ],
    legend: [
      {
        tone: 'zone',
        label: t('studyAifg.making-the-creatures.model.circleKitFleeRange'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.making-the-creatures.model.socialSeparationCohesionVelocity'),
      },
      {
        tone: 'actual',
        label: t('studyAifg.making-the-creatures.model.resultCappedSumLabelled'),
      },
    ],
    caption: t('studyAifg.making-the-creatures.model.caption'),
    comparison: compareRuns(t, p, frames, gaps, unresponsiveGaps, states),
    inputs: [
      {
        name: 'fleeScale',
        label: t('studyAifg.making-the-creatures.model.playerResponse'),
        unit: t('studyAifg.making-the-creatures.model.weightMultiplier'),
        min: 0,
        max: 2,
        step: 0.25,
      },
      {
        name: 'goatWanderWeight',
        label: t('studyAifg.making-the-creatures.model.goatWanderWeight'),
        unit: t('studyAifg.making-the-creatures.model.weight'),
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
      return t('studyAifg.making-the-creatures.model.creatureNameFern');
    case 'Moss':
      return t('studyAifg.making-the-creatures.model.creatureNameMoss');
    case 'Flint':
      return t('studyAifg.making-the-creatures.model.creatureNameFlint');
    case 'Pebble':
      return t('studyAifg.making-the-creatures.model.creatureNamePebble');
    default:
      return value;
  }
}
