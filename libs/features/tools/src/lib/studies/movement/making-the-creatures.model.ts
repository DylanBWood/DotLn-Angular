import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  blend,
  centroid,
  clipLength,
  distance,
  dot,
  flee,
  length,
  matchVelocity,
  normalize,
  scale,
  separate,
  sine,
  type SteeringBody,
  subtract,
  type Vec2,
  wander,
  zero,
} from '@dotln-angular/scene-engine';

import { boundsOf } from '../drawing';
import { numberParameter } from '../parameters';
import type {
  MotionFrame,
  MotionMark,
  MotionStudyModel,
  MotionVector,
  StudyWorkedStep,
} from '../study-model';

export interface CreatureParameters {
  readonly startX: number;
  readonly sheepOffset: number;
  readonly goatOffset: number;
  readonly playerStartX: number;
  readonly playerY: number;
  readonly playerSpeed: number;
  readonly neighbourRadius: number;
  readonly separationThreshold: number;
  readonly separationWeight: number;
  readonly cohesionWeight: number;
  readonly alignmentWeight: number;
  readonly sheepWanderWeight: number;
  readonly goatWanderWeight: number;
  readonly sheepFleeWeight: number;
  readonly goatFleeWeight: number;
  readonly fleeScale: number;
  readonly unresponsiveFleeScale: number;
  readonly fleeRadius: number;
  readonly wanderRadius: number;
  readonly wanderOffset: number;
  readonly wanderAmplitude: number;
  readonly wanderRate: number;
  readonly slowRadius: number;
  readonly responseTime: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly timeStep: number;
  readonly steps: number;
}

type Species = 'sheep' | 'goat';

export interface Creature extends SteeringBody {
  readonly id: string;
  readonly species: Species;
  readonly wanderSign: number;
}

export interface CreatureReading {
  readonly neighbours: readonly Creature[];
  readonly centre: Vec2;
  readonly meanVelocity: Vec2;
  readonly angle: number;
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly wandering: Vec2;
  readonly fleeing: Vec2;
  readonly wanderWeight: number;
  readonly fleeWeight: number;
  readonly acceleration: Vec2;
}

export function readCreatureParameters(parameters: StudyParameters): CreatureParameters {
  const p = {
    startX: numberParameter(parameters, 'startX'),
    sheepOffset: numberParameter(parameters, 'sheepOffset'),
    goatOffset: numberParameter(parameters, 'goatOffset'),
    playerStartX: numberParameter(parameters, 'playerStartX'),
    playerY: numberParameter(parameters, 'playerY'),
    playerSpeed: numberParameter(parameters, 'playerSpeed'),
    neighbourRadius: numberParameter(parameters, 'neighbourRadius'),
    separationThreshold: numberParameter(parameters, 'separationThreshold'),
    separationWeight: numberParameter(parameters, 'separationWeight'),
    cohesionWeight: numberParameter(parameters, 'cohesionWeight'),
    alignmentWeight: numberParameter(parameters, 'alignmentWeight'),
    sheepWanderWeight: numberParameter(parameters, 'sheepWanderWeight'),
    goatWanderWeight: numberParameter(parameters, 'goatWanderWeight'),
    sheepFleeWeight: numberParameter(parameters, 'sheepFleeWeight'),
    goatFleeWeight: numberParameter(parameters, 'goatFleeWeight'),
    fleeScale: numberParameter(parameters, 'fleeScale'),
    unresponsiveFleeScale: numberParameter(parameters, 'unresponsiveFleeScale'),
    fleeRadius: numberParameter(parameters, 'fleeRadius'),
    wanderRadius: numberParameter(parameters, 'wanderRadius'),
    wanderOffset: numberParameter(parameters, 'wanderOffset'),
    wanderAmplitude: numberParameter(parameters, 'wanderAmplitude'),
    wanderRate: numberParameter(parameters, 'wanderRate'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    maxSpeed: numberParameter(parameters, 'maxSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    radius: numberParameter(parameters, 'radius'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
  };
  // The engine owns this radius; refusing a mismatch keeps the drawn circle truthful.
  if (p.fleeRadius !== 20) throw new Error('The scene engine fixes fleeRadius at 20 units.');
  return p;
}

export const initialCreatures = (p: CreatureParameters): readonly Creature[] =>
  [
    { id: 'Fern', species: 'sheep', y: -p.sheepOffset },
    { id: 'Moss', species: 'sheep', y: p.sheepOffset },
    { id: 'Flint', species: 'goat', y: -p.goatOffset },
    { id: 'Pebble', species: 'goat', y: p.goatOffset },
  ].map(({ id, species, y }, index) => ({
    id,
    species: species === 'sheep' ? 'sheep' : 'goat',
    wanderSign: index % 2 === 0 ? 1 : -1,
    position: { x: p.startX, y },
    velocity: zero,
    heading: { x: 1, y: 0 },
    wanderAngle: 0,
    maxSpeed: p.maxSpeed,
    maxAcceleration: p.maxAcceleration,
    radius: p.radius,
  }));

export const playerAt = (seconds: number, p: CreatureParameters): Vec2 => ({
  x: p.playerStartX + p.playerSpeed * seconds,
  y: p.playerY,
});

/** Profiles change strengths; both species run the same steering functions. */
export function readCreature(
  creatures: readonly Creature[],
  index: number,
  seconds: number,
  p: CreatureParameters,
): CreatureReading {
  const original = creatures[index];
  // A prescribed wobble makes the example repeatable without a random generator or a clock.
  const angle = p.wanderAmplitude * sine(p.wanderRate * seconds) * original.wanderSign;
  const body = { ...original, wanderAngle: angle };
  const neighbours = creatures.filter(
    (other, otherIndex) =>
      otherIndex !== index &&
      other.species === body.species &&
      distance(body.position, other.position) < p.neighbourRadius,
  );
  const centre = neighbours.length
    ? centroid(neighbours.map(({ position }) => position))
    : body.position;
  const meanVelocity = neighbours.length
    ? centroid(neighbours.map(({ velocity }) => velocity))
    : body.velocity;
  const separation = separate(body, index, creatures, {
    separationThreshold: p.separationThreshold,
    separationFalloff: 1,
  });
  const cohesion = neighbours.length
    ? arrive(body, centre, {
        slowRadius: p.slowRadius,
        targetRadius: 0,
        timeToTarget: p.responseTime,
      })
    : zero;
  const alignment = neighbours.length ? matchVelocity(body, meanVelocity, p.responseTime) : zero;
  const wandering = wander(body, {
    wanderOffset: p.wanderOffset,
    wanderRadius: p.wanderRadius,
    timeToTarget: p.responseTime,
  });
  const fleeing = flee(body, playerAt(seconds, p));
  const wanderWeight = body.species === 'sheep' ? p.sheepWanderWeight : p.goatWanderWeight;
  const fleeWeight =
    p.fleeScale * (body.species === 'sheep' ? p.sheepFleeWeight : p.goatFleeWeight);
  const acceleration = blend(
    [
      { weight: p.separationWeight, acceleration: separation },
      { weight: p.cohesionWeight, acceleration: cohesion },
      { weight: p.alignmentWeight, acceleration: alignment },
      { weight: wanderWeight, acceleration: wandering },
      { weight: fleeWeight, acceleration: fleeing },
    ],
    p.maxAcceleration,
  );
  return {
    neighbours,
    centre,
    meanVelocity,
    angle,
    separation,
    cohesion,
    alignment,
    wandering,
    fleeing,
    wanderWeight,
    fleeWeight,
    acceleration,
  };
}

/** All creatures read the old positions and the player at the start of the interval. */
export function stepCreatures(
  creatures: readonly Creature[],
  seconds: number,
  p: CreatureParameters,
): readonly Creature[] {
  return creatures.map((body, index) => {
    const r = readCreature(creatures, index, seconds, p);
    const velocity = clipLength(add(body.velocity, scale(r.acceleration, p.timeStep)), p.maxSpeed);
    return {
      ...body,
      velocity,
      wanderAngle: r.angle,
      position: add(body.position, scale(velocity, p.timeStep)),
      heading: length(velocity) > 0 ? normalize(velocity) : body.heading,
    };
  });
}

export function creatureFrames(p: CreatureParameters): readonly (readonly Creature[])[] {
  const states: (readonly Creature[])[] = [initialCreatures(p)];
  for (let step = 0; step < p.steps; step++)
    states.push(stepCreatures(states[step], step * p.timeStep, p));
  return states;
}

export const speciesTravel = (
  creatures: readonly Creature[],
  species: Species,
  p: CreatureParameters,
): number =>
  centroid(creatures.filter((body) => body.species === species).map(({ position }) => position)).x -
  p.startX;

const fixed = (value: number) => value.toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function worked(
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
): StudyWorkedStep {
  const seconds = step * p.timeStep;
  const body = creatures[0];
  const r = readCreature(creatures, 0, seconds, p);
  const next = stepCreatures(creatures, seconds, p)[0];
  const gap = distance(body.position, playerAt(seconds, p));
  const strength = p.maxAcceleration * Math.max(0, 1 - gap / p.fleeRadius);
  return {
    title: `Fern: ${fixed(seconds)} → ${fixed(seconds + p.timeStep)} seconds`,
    lines: [
      `Read sheep neighbours ${r.neighbours.map(({ id }) => id).join(', ') || 'none'}: centre ${pair(r.centre)}, mean velocity ${pair(r.meanVelocity)}. Separation reads all creatures, including goats.`,
      `Engine outputs: separation ${pair(r.separation)}, arrive-to-centre ${pair(r.cohesion)}, velocity matching ${pair(r.alignment)} units/s².`,
      `Prescribe wander angle ${fixed(p.wanderAmplitude)} × sine(${fixed(p.wanderRate)} × ${fixed(seconds)}) = ${fixed(r.angle)} radians for Fern; engine wander returns ${pair(r.wandering)} units/s².`,
      `Kit is at ${pair(playerAt(seconds, p))}; gap ${fixed(gap)} gives flee strength ${fixed(p.maxAcceleration)} × max(0, 1 − ${fixed(gap)} / ${fixed(p.fleeRadius)}) = ${fixed(strength)}, directed away from Kit: ${pair(r.fleeing)} units/s².`,
      `Fern's sheep profile selects wander weight ${fixed(r.wanderWeight)} and effective flee weight ${fixed(r.fleeWeight)}. Weighted terms: ${pair(scale(r.separation, p.separationWeight))} + ${pair(scale(r.cohesion, p.cohesionWeight))} + ${pair(scale(r.alignment, p.alignmentWeight))} + ${pair(scale(r.wandering, r.wanderWeight))} + ${pair(scale(r.fleeing, r.fleeWeight))}.`,
      `Engine blend caps the sum at ${fixed(p.maxAcceleration)} → ${pair(r.acceleration)} units/s². v′ = clip(${pair(body.velocity)} + ${pair(r.acceleration)} × ${fixed(p.timeStep)}, ${fixed(p.maxSpeed)}) ≈ ${pair(next.velocity)} units/s.`,
      `p′ = ${pair(body.position)} + ${pair(next.velocity)} × ${fixed(p.timeStep)} ≈ ${pair(next.position)} units. Kit's next position is ${pair(playerAt(seconds + p.timeStep, p))}.`,
    ],
    note: 'These sheep and goat profiles are authored game settings. The wobble is a repeatable teaching input to engine wander, rather than a claim about animal behaviour.',
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
function layoutOf(states: readonly (readonly Creature[])[], p: CreatureParameters): CreatureLayout {
  const requests = states.flatMap((creatures, step) => {
    const r = readCreature(creatures, 0, step * p.timeStep, p);
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
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
): string {
  const seconds = step * p.timeStep;
  const fern = creatures[0];
  const kit = playerAt(seconds, p);
  const gap = distance(fern.position, kit);
  const r = readCreature(creatures, 0, seconds, p);
  if (p.fleeScale === 0) {
    if (step === 0)
      return 'Kit starts behind the sheep, but their player response is off, so only social pulls and wandering can move them.';
    if (gap < 2 * p.radius)
      return 'Kit is crowding Fern while her social and wander requests keep running without a player response.';
    if (kit.x >= fern.position.x)
      return 'Kit has passed Fern because her controller has no player response to keep him behind.';
    return 'Kit is closing on Fern while she follows her own social and wander requests, exposing the missing player response.';
  }
  if (step === 0)
    return 'Kit starts behind Fern, so fleeing adds an eastward push to her social and wander requests.';
  if (gap >= p.fleeRadius)
    return 'Fern is outside Kit’s flee range, so her social and wander requests now determine her motion.';
  const relativeVelocity = subtract(fern.velocity, { x: p.playerSpeed, y: 0 });
  if (dot(relativeVelocity, subtract(fern.position, kit)) < 0)
    return 'Kit is gaining on Fern, so her flee request competes with the social pull and wander request.';
  const social = add(
    add(scale(r.separation, p.separationWeight), scale(r.cohesion, p.cohesionWeight)),
    scale(r.alignment, p.alignmentWeight),
  );
  if (dot(social, r.fleeing) < 0)
    return 'Fern is opening a gap from Kit while her social pull resists the escape, showing how the requests share control.';
  return 'Fern is opening a gap from Kit through the combined social, wander and flee requests.';
}

function frameOf(
  creatures: readonly Creature[],
  step: number,
  p: CreatureParameters,
  layout: CreatureLayout,
): MotionFrame {
  const seconds = step * p.timeStep;
  const r = readCreature(creatures, 0, seconds, p);
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
  }[] = [
    { label: 'Social', acceleration: social, tone: 'desired' },
    { label: 'Wander', acceleration: weighted.wandering, tone: 'other' },
    { label: 'Flee', acceleration: weighted.fleeing, tone: 'target' },
    { label: 'Result', acceleration: r.acceleration, tone: 'actual' },
  ];
  const subjects = [
    ...creatures.map(({ id, position }) => ({ label: id, position })),
    { label: 'Kit', position: kit },
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
  const marks: readonly MotionMark[] = [
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
  const sheepCentre = centroid(
    creatures.filter(({ species }) => species === 'sheep').map(({ position }) => position),
  );
  const playerRelation =
    kit.x - sheepCentre.x > p.radius / 10
      ? 'ahead of'
      : sheepCentre.x - kit.x > p.radius / 10
        ? 'behind'
        : 'alongside';
  const sheepLinkRelation = r.neighbours.length
    ? 'are linked as sheep'
    : 'have lost their social link';
  const goatLinkRelation = readCreature(creatures, 2, seconds, p).neighbours.length
    ? 'are linked as goats'
    : 'have lost their social link';
  const creatureSteeringRelation =
    p.fleeScale === 0
      ? 'Fern’s social and wander requests act without a player response'
      : dot(social, weighted.fleeing) < 0
        ? 'Fern’s social pull opposes fleeing while wandering adds its own request'
        : 'Fern blends social, wander and flee requests';
  return {
    seconds,
    bodies: [
      ...creatures.map(({ id, species, position }) => ({
        id,
        ...position,
        tone: species === 'sheep' ? ('subject' as const) : ('other' as const),
      })),
      { id: 'Kit', ...kit, tone: 'target' },
    ],
    zones: [{ ...kit, radius: p.fleeRadius }],
    vectors: rows.map(({ acceleration, tone }, index) => ({
      x: layout.vectorX,
      y: layout.top + index * layout.rowGap,
      dx: acceleration.x * accelerationScale,
      dy: acceleration.y * accelerationScale,
      tone,
    })),
    marks,
    links: [
      ...names.map(({ anchor, position }) => ({ from: anchor, to: position })),
      ...[0, 2].flatMap((index) =>
        readCreature(creatures, index, seconds, p).neighbours.map(({ position }) => ({
          from: creatures[index].position,
          to: position,
        })),
      ),
    ],
    values: {
      seconds: fixed(seconds),
      fern: pair(fern.position),
      moss: pair(creatures[1].position),
      flint: pair(creatures[2].position),
      pebble: pair(creatures[3].position),
      kit: pair(kit),
      fleeRadius: fixed(p.fleeRadius),
      gap: fixed(distance(fern.position, kit)),
      neighbours: String(r.neighbours.length),
      centre: r.neighbours.length ? pair(r.centre) : 'absent',
      meanVelocity: pair(r.meanVelocity),
      angle: fixed(r.angle),
      social: pair(social),
      separation: pair(weighted.separation),
      cohesion: pair(weighted.cohesion),
      alignment: pair(weighted.alignment),
      wandering: pair(weighted.wandering),
      fleeing: pair(weighted.fleeing),
      acceleration: pair(r.acceleration),
      wanderMagnitude: fixed(length(weighted.wandering)),
      fleeMagnitude: fixed(length(weighted.fleeing)),
      accelerationMagnitude: fixed(length(r.acceleration)),
      sheepWander: fixed(p.sheepWanderWeight),
      goatWander: fixed(p.goatWanderWeight),
      sheepFlee: fixed(p.sheepFleeWeight * p.fleeScale),
      goatFlee: fixed(p.goatFleeWeight * p.fleeScale),
      fleeScale: fixed(p.fleeScale),
      sheepTravel: fixed(speciesTravel(creatures, 'sheep', p)),
      goatTravel: fixed(speciesTravel(creatures, 'goat', p)),
      timeStep: fixed(p.timeStep),
      maxAcceleration: fixed(p.maxAcceleration),
      playerRelation,
      sheepLinkRelation,
      goatLinkRelation,
      creatureSteeringRelation,
    },
    note: creatureNote(creatures, step, p),
    worked: worked(creatures, step, p),
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const p = readCreatureParameters(parameters);
  const states = creatureFrames(p);
  const layout = layoutOf(states, p);
  const frames = states.map((creatures, step) => frameOf(creatures, step, p, layout));
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
    timeline: {
      title: 'Species movement across Bracken Meadow',
      xLabel: 'Time · seconds',
      yLabel: 'Eastward centre displacement · units',
      seconds: frames.map(({ seconds }) => seconds),
      series: [
        {
          id: 'sheep',
          label: 'Green · sheep centre displacement',
          tone: 'actual',
          values: states.map((creatures) => speciesTravel(creatures, 'sheep', p)),
        },
        {
          id: 'goats',
          label: 'Amber · goat centre displacement',
          tone: 'desired',
          values: states.map((creatures) => speciesTravel(creatures, 'goat', p)),
        },
      ],
    },
    initialStep: 0,
    moments: [
      { label: 'Kit begins the drive', step: 0 },
      { label: 'Early profile responses', step: Math.round(p.steps / 4) },
      { label: 'Player continues east', step: Math.round(p.steps / 2) },
      { label: 'End of observation', step: p.steps },
    ],
    legend: [
      { tone: 'zone', label: 'Circle · Kit’s flee range' },
      { tone: 'desired', label: 'Social · separation, cohesion and velocity matching' },
      { tone: 'actual', label: 'Result · capped sum of the labelled requests' },
    ],
    caption:
      'Name leaders identify Fern and Moss, the sheep, Flint and Pebble, the goats, and Kit, the player. The circle is Kit’s flee range; links between creatures show same-species neighbours. The right-hand rows separate Fern’s social, wander and flee accelerations at a shared scale, followed by their capped result; the worked step expands the social sum.',
    comparison: {
      title: 'A herd that ignores the player',
      intro:
        p.fleeScale === p.unresponsiveFleeScale
          ? 'Both runs currently have their player response switched off, so their curves coincide; raise Player response to see the effect of fleeing.'
          : 'Repeat the same drive with only fleeScale changed from ' +
            fixed(p.fleeScale) +
            ' to ' +
            fixed(p.unresponsiveFleeScale) +
            '. The player path, wander input and all other settings stay the same.',
      timeline: {
        title: 'Fern’s distance from Kit',
        xLabel: 'Time · seconds',
        yLabel: 'Distance · units',
        seconds: frames.map(({ seconds }) => seconds),
        series: [
          {
            id: 'current',
            label: 'Green · flee scale ' + fixed(p.fleeScale),
            tone: 'actual',
            values: gaps,
          },
          {
            id: 'unresponsive',
            label: 'Amber · flee scale ' + fixed(p.unresponsiveFleeScale),
            tone: 'desired',
            values: unresponsiveGaps,
          },
        ],
      },
      findings: [
        'The closest sampled approach to Fern is ' +
          fixed(Math.min(...gaps)) +
          ' units at flee scale ' +
          fixed(p.fleeScale) +
          ' and ' +
          fixed(Math.min(...unresponsiveGaps)) +
          ' at scale ' +
          fixed(p.unresponsiveFleeScale) +
          '; flocking and wandering alone do not preserve distance from Kit.',
        'In the current run, eastward centre displacement ends at ' +
          fixed(speciesTravel(states[p.steps], 'sheep', p)) +
          ' units for sheep and ' +
          fixed(speciesTravel(states[p.steps], 'goat', p)) +
          ' for goats; changing a profile changes motion without a different algorithm.',
        'A weighted flee request is still a request: cohesion, matching and wander can oppose it, and the acceleration cap gives it no guaranteed precedence or safe distance.',
      ],
      note: 'The measured distance belongs to Fern, not to the whole herd or a collision solver; the player is sampled at the start of each fixed interval.',
    },
    inputs: [
      {
        name: 'fleeScale',
        label: 'Player response',
        unit: 'weight multiplier',
        min: 0,
        max: 2,
        step: 0.25,
      },
      {
        name: 'goatWanderWeight',
        label: 'Goat wander weight',
        unit: 'weight',
        min: 0,
        max: 1,
        step: 0.1,
      },
    ],
  };
};
