import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  blend,
  centroid,
  clipLength,
  distance,
  dot,
  length,
  matchVelocity,
  normalize,
  scale,
  separate,
  type SteeringBody,
  subtract,
  type Vec2,
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

export interface FlockingParameters {
  readonly startX: number;
  readonly spacing: number;
  readonly middleSpeed: number;
  readonly cruiseSpeed: number;
  readonly cruiseWeight: number;
  readonly neighbourRadius: number;
  readonly separationThreshold: number;
  readonly separationWeight: number;
  readonly cohesionWeight: number;
  readonly alignmentWeight: number;
  readonly slowRadius: number;
  readonly responseTime: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly radius: number;
  readonly crossingX: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly crowdedSeparationWeight: number;
}

export interface Walker extends SteeringBody {
  readonly id: string;
}

export interface FlockingReading {
  readonly neighbours: readonly Walker[];
  readonly centre: Vec2;
  readonly meanVelocity: Vec2;
  readonly separation: Vec2;
  readonly cohesion: Vec2;
  readonly alignment: Vec2;
  readonly cruise: Vec2;
  readonly acceleration: Vec2;
}

export const readFlockingParameters = (parameters: StudyParameters): FlockingParameters => ({
  startX: numberParameter(parameters, 'startX'),
  spacing: numberParameter(parameters, 'spacing'),
  middleSpeed: numberParameter(parameters, 'middleSpeed'),
  cruiseSpeed: numberParameter(parameters, 'cruiseSpeed'),
  cruiseWeight: numberParameter(parameters, 'cruiseWeight'),
  neighbourRadius: numberParameter(parameters, 'neighbourRadius'),
  separationThreshold: numberParameter(parameters, 'separationThreshold'),
  separationWeight: numberParameter(parameters, 'separationWeight'),
  cohesionWeight: numberParameter(parameters, 'cohesionWeight'),
  alignmentWeight: numberParameter(parameters, 'alignmentWeight'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  radius: numberParameter(parameters, 'radius'),
  crossingX: numberParameter(parameters, 'crossingX'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  crowdedSeparationWeight: numberParameter(parameters, 'crowdedSeparationWeight'),
});

export const initialWalkers = (p: FlockingParameters): readonly Walker[] =>
  ['Mara', 'Ivo', 'Noor'].map((id, index) => ({
    id,
    position: { x: p.startX, y: (index - 1) * p.spacing },
    velocity: { x: index === 1 ? p.middleSpeed : 0, y: 0 },
    heading: { x: 1, y: 0 },
    wanderAngle: 0,
    maxSpeed: p.maxSpeed,
    maxAcceleration: p.maxAcceleration,
    radius: p.radius,
  }));

/** Each walker reads a circular neighbourhood from the unchanged frame. */
export function readFlock(
  walkers: readonly Walker[],
  index: number,
  p: FlockingParameters,
): FlockingReading {
  const body = walkers[index];
  const local = walkers.filter(
    (other) => other === body || distance(body.position, other.position) < p.neighbourRadius,
  );
  const neighbours = local.filter((other) => other !== body);
  const centre = neighbours.length
    ? centroid(neighbours.map(({ position }) => position))
    : body.position;
  const meanVelocity = neighbours.length
    ? centroid(neighbours.map(({ velocity }) => velocity))
    : body.velocity;
  const separation = separate(body, local.indexOf(body), local, {
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
  // A shared eastward velocity gives this crossing a purpose; it is separate from flocking.
  const cruise = matchVelocity(body, { x: p.cruiseSpeed, y: 0 }, p.responseTime);
  const acceleration = blend(
    [
      { weight: p.separationWeight, acceleration: separation },
      { weight: p.cohesionWeight, acceleration: cohesion },
      { weight: p.alignmentWeight, acceleration: alignment },
      { weight: p.cruiseWeight, acceleration: cruise },
    ],
    p.maxAcceleration,
  );
  return {
    neighbours,
    centre,
    meanVelocity,
    separation,
    cohesion,
    alignment,
    cruise,
    acceleration,
  };
}

/** Velocity changes first; every position then uses its own updated velocity. */
export function stepFlock(walkers: readonly Walker[], p: FlockingParameters): readonly Walker[] {
  return walkers.map((body, index) => {
    const { acceleration } = readFlock(walkers, index, p);
    const velocity = clipLength(add(body.velocity, scale(acceleration, p.timeStep)), p.maxSpeed);
    return {
      ...body,
      velocity,
      position: add(body.position, scale(velocity, p.timeStep)),
      heading: length(velocity) > 0 ? normalize(velocity) : body.heading,
    };
  });
}

export function flockingFrames(p: FlockingParameters): readonly (readonly Walker[])[] {
  const states: (readonly Walker[])[] = [initialWalkers(p)];
  for (let step = 0; step < p.steps; step++) states.push(stepFlock(states[step], p));
  return states;
}

export const nearestPair = (walkers: readonly Walker[]): number =>
  Math.min(
    ...walkers.flatMap((body, index) =>
      walkers.slice(index + 1).map((other) => distance(body.position, other.position)),
    ),
  );

/** Root mean square distance from the group's mean velocity, in units per second. */
export const velocitySpread = (walkers: readonly Walker[]): number => {
  const mean = centroid(walkers.map(({ velocity }) => velocity));
  return Math.sqrt(
    walkers.reduce((sum, { velocity }) => sum + length(subtract(velocity, mean)) ** 2, 0) /
      walkers.length,
  );
};

const fixed = (value: number) => value.toFixed(2);
const pair = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function worked(walkers: readonly Walker[], step: number, p: FlockingParameters): StudyWorkedStep {
  const body = walkers[0];
  const r = readFlock(walkers, 0, p);
  const next = stepFlock(walkers, p)[0];
  const offset = subtract(r.centre, body.position);
  const centreGap = length(offset);
  const desired = scale(normalize(offset), p.maxSpeed * Math.min(1, centreGap / p.slowRadius));
  const pushes = r.neighbours
    .filter((other) => distance(body.position, other.position) < p.separationThreshold)
    .map((other) => {
      const gap = distance(body.position, other.position);
      return `${other.id}: gap ${fixed(gap)}, strength ${fixed(p.maxAcceleration)} × (${fixed(p.separationThreshold)} − ${fixed(gap)}) / ${fixed(p.separationThreshold)} = ${fixed((p.maxAcceleration * (p.separationThreshold - gap)) / p.separationThreshold)} away`;
    });
  const contributions = [
    scale(r.separation, p.separationWeight),
    scale(r.cohesion, p.cohesionWeight),
    scale(r.alignment, p.alignmentWeight),
    scale(r.cruise, p.cruiseWeight),
  ];
  return {
    title: `Mara: ${fixed(step * p.timeStep)} → ${fixed((step + 1) * p.timeStep)} seconds`,
    lines: [
      `Read ${r.neighbours.length} neighbours strictly inside ${fixed(p.neighbourRadius)} units: ${r.neighbours.map(({ id }) => id).join(', ') || 'none'}. Their centre is ${pair(r.centre)} and mean velocity ${pair(r.meanVelocity)}.`,
      `Close-neighbour pushes: ${pushes.join('; ') || 'none'}.`,
      `For each neighbour closer than ${fixed(p.separationThreshold)}, the linear push is ${fixed(p.maxAcceleration)} × (${fixed(p.separationThreshold)} − distance) / ${fixed(p.separationThreshold)} away from it; cap the summed push at ${fixed(p.maxAcceleration)}: separation ${pair(r.separation)} units/s².`,
      r.neighbours.length
        ? `Centre offset ${pair(offset)} has length ${fixed(centreGap)}; desired speed = ${fixed(p.maxSpeed)} × min(1, ${fixed(centreGap)} / ${fixed(p.slowRadius)}) = ${fixed(length(desired))}, giving desired velocity ${pair(desired)}. Cap (${pair(desired)} − ${pair(body.velocity)}) / ${fixed(p.responseTime)} to obtain cohesion ${pair(r.cohesion)} units/s².`
        : 'There is no neighbour centre to arrive at; cohesion contributes zero.',
      `Match (${pair(r.meanVelocity)} − ${pair(body.velocity)}) / ${fixed(p.responseTime)}, capped at ${fixed(p.maxAcceleration)}: alignment ${pair(r.alignment)} when neighbours exist; match the separate crossing velocity (${fixed(p.cruiseSpeed)}, 0): cruise ${pair(r.cruise)} units/s².`,
      `Weight the outputs: ${pair(contributions[0])} + ${pair(contributions[1])} + ${pair(contributions[2])} + ${pair(contributions[3])}; clip the sum to ${fixed(p.maxAcceleration)} → ${pair(r.acceleration)} units/s².`,
      `v′ = clip(${pair(body.velocity)} + ${pair(r.acceleration)} × ${fixed(p.timeStep)}, ${fixed(p.maxSpeed)}) ≈ ${pair(next.velocity)} units/s.`,
      `p′ = ${pair(body.position)} + ${pair(next.velocity)} × ${fixed(p.timeStep)} ≈ ${pair(next.position)} units.`,
    ],
    note: 'Opposing separation and cohesion can cancel even while both are active; a small resultant does not mean every request has been met.',
  };
}

interface FlockLayout {
  readonly vectorX: number;
  readonly labelX: number;
  readonly top: number;
  readonly rowGap: number;
}

/** Keep the acceleration rows outside every neighbourhood drawn during this run. */
function layoutOf(states: readonly (readonly Walker[])[], p: FlockingParameters): FlockLayout {
  const requests = states.flatMap((walkers) => {
    const r = readFlock(walkers, 0, p);
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
export function flockNote(walkers: readonly Walker[], step: number, p: FlockingParameters): string {
  const gap = nearestPair(walkers);
  const spread = velocitySpread(walkers);
  const centre = centroid(walkers.map(({ position }) => position));
  const speed = length(centroid(walkers.map(({ velocity }) => velocity)));
  if (gap < 2 * p.radius)
    return spread < p.maxSpeed / 20
      ? 'The walkers agree about their motion but are piling up, so matching pace is hiding a spacing failure.'
      : 'The walkers are crowding one another while adjusting their pace, so the blend is failing to leave room.';
  if (step === 0) {
    if (p.cruiseWeight === 0)
      return 'Ivo starts faster, but the social rules have no continuing drive to carry the group across the field.';
    if (p.separationWeight === 0)
      return 'Ivo starts faster while cohesion pulls his neighbours in, with no separation left to protect their spacing.';
    return 'Ivo starts faster, so his neighbours match his pace while separation pushes back against cohesion.';
  }
  if (p.cruiseWeight === 0)
    return speed < p.maxSpeed / 100
      ? 'The group is almost still before the field line because its local requests have settled without a crossing drive.'
      : 'The initial motion is fading because matching neighbours supplies no continuing reason to cross the field.';
  if (p.separationWeight === 0)
    return 'The walkers are matching pace but drawing closer because no separation opposes the cohesion controller.';
  if (centre.x >= p.crossingX)
    return 'The group has passed the field line while leaving room between neighbours, so the local rules have supported the crossing.';
  if (spread < p.maxSpeed / 20)
    return 'The walkers now share a similar pace while separation checks the inward pull, keeping the crossing loose.';
  return 'The walkers are still adjusting their pace while balancing staying close against leaving room.';
}

function frameOf(
  walkers: readonly Walker[],
  step: number,
  p: FlockingParameters,
  layout: FlockLayout,
  minimumGap: number,
): MotionFrame {
  const r = readFlock(walkers, 0, p);
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
  }[] = [
    { label: 'Separation', acceleration: weighted.separation, tone: 'target' },
    { label: 'Cohesion', acceleration: weighted.cohesion, tone: 'desired' },
    { label: 'Match', acceleration: weighted.alignment, tone: 'other' },
    { label: 'Crossing', acceleration: weighted.cruise, tone: 'muted' },
    { label: 'Result', acceleration: r.acceleration, tone: 'actual' },
  ];
  const centre = centroid(walkers.map(({ position }) => position));
  const subjects = [
    ...walkers.map(({ id, position }) => ({ label: id, position })),
    ...(r.neighbours.length ? [{ label: 'Centre', position: r.centre }] : []),
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
  const marks: readonly MotionMark[] = [
    ...names.map(({ label, anchor }) => ({
      ...anchor,
      label,
      shape: 'dot' as const,
      tone: 'muted' as const,
    })),
    ...(r.neighbours.length ? [{ ...r.centre, shape: 'cross' as const }] : []),
    { x: p.crossingX, y: -p.neighbourRadius - 8, shape: 'dot', label: 'Field line', tone: 'muted' },
    ...rows.map(({ label, tone }, index) => ({
      x: layout.labelX,
      y: layout.top + index * layout.rowGap,
      shape: 'dot' as const,
      label,
      tone,
    })),
  ];
  const sum = add(
    add(weighted.separation, weighted.cohesion),
    add(weighted.alignment, weighted.cruise),
  );
  const paceRelation =
    ivo.position.x - mara.position.x > p.radius / 10
      ? 'Ivo is ahead of Mara'
      : mara.position.x - ivo.position.x > p.radius / 10
        ? 'Mara is ahead of Ivo'
        : 'The walkers are nearly abreast';
  const socialRelation =
    p.separationWeight === 0
      ? 'Mara has no separation request to oppose the cohesion controller'
      : dot(weighted.separation, weighted.cohesion) < 0
        ? 'Mara’s separation and cohesion requests oppose each other'
        : 'Mara’s social requests combine with velocity matching';
  const driveRelation =
    p.cruiseWeight === 0
      ? 'the crossing drive is off'
      : 'the crossing drive steers towards an eastward target velocity';
  return {
    seconds: step * p.timeStep,
    bodies: walkers.map(({ id, position }, index) => ({
      id,
      ...position,
      tone: index === 0 ? 'subject' : 'other',
    })),
    vectors: rows.map(({ acceleration, tone }, index) => ({
      x: layout.vectorX,
      y: layout.top + index * layout.rowGap,
      dx: acceleration.x,
      dy: acceleration.y,
      tone,
    })),
    zones: [{ ...mara.position, radius: p.neighbourRadius }],
    marks,
    links: [
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
    ],
    values: {
      seconds: fixed(step * p.timeStep),
      mara: pair(mara.position),
      ivo: pair(ivo.position),
      noor: pair(noor.position),
      neighbours: String(r.neighbours.length),
      neighbourRadius: fixed(p.neighbourRadius),
      centre: r.neighbours.length ? pair(r.centre) : 'absent',
      meanVelocity: pair(r.meanVelocity),
      velocity: pair(mara.velocity),
      separation: pair(weighted.separation),
      cohesion: pair(weighted.cohesion),
      alignment: pair(weighted.alignment),
      cruise: pair(weighted.cruise),
      acceleration: pair(r.acceleration),
      separationMagnitude: fixed(length(weighted.separation)),
      cohesionMagnitude: fixed(length(weighted.cohesion)),
      alignmentMagnitude: fixed(length(weighted.alignment)),
      accelerationMagnitude: fixed(length(r.acceleration)),
      requestedMagnitude: fixed(length(sum)),
      separationWeight: fixed(p.separationWeight),
      cruiseWeight: fixed(p.cruiseWeight),
      cruiseSpeed: fixed(p.cruiseSpeed),
      responseTime: fixed(p.responseTime),
      speed: fixed(length(mara.velocity)),
      maxAcceleration: fixed(p.maxAcceleration),
      gap: fixed(nearestPair(walkers)),
      minimumGap: fixed(minimumGap),
      spread: fixed(velocitySpread(walkers)),
      diameter: fixed(2 * p.radius),
      crossingX: fixed(p.crossingX),
      timeStep: fixed(p.timeStep),
      paceRelation,
      steeringRelation: socialRelation + ', and ' + driveRelation,
    },
    note: flockNote(walkers, step, p),
    worked: worked(walkers, step, p),
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const p = readFlockingParameters(parameters);
  const states = flockingFrames(p);
  const crowded = flockingFrames({ ...p, separationWeight: p.crowdedSeparationWeight });
  const spreads = states.map(velocitySpread);
  const gaps = states.map(nearestPair);
  const crowdedGaps = crowded.map(nearestPair);
  const layout = layoutOf(states, p);
  const frames = states.map((walkers, step) =>
    frameOf(walkers, step, p, layout, Math.min(...gaps)),
  );
  const crossing = states.findIndex(
    (walkers) => centroid(walkers.map(({ position }) => position)).x >= p.crossingX,
  );
  return {
    family: 'motion',
    motion: { bounds: boundsOf(frames, 12), frames, trail: true },
    timeline: {
      title: 'Velocity disagreement during the Reed Field crossing',
      xLabel: 'Time · seconds',
      yLabel: 'RMS velocity spread · units/s',
      seconds: frames.map(({ seconds }) => seconds),
      series: [
        {
          id: 'spread',
          label: 'Green · disagreement with the mean velocity',
          tone: 'actual',
          values: spreads,
        },
      ],
      reference: 0,
      yRange: [0, Math.max(...spreads) || p.maxSpeed],
    },
    initialStep: 0,
    moments: [
      { label: 'Different starting speeds', step: 0 },
      { label: 'Early adjustments', step: Math.round(p.steps / 5) },
      {
        label: crossing < 0 ? 'Still short of the field line' : 'Centre crosses the field line',
        step: crossing < 0 ? Math.round((3 * p.steps) / 4) : crossing,
      },
      { label: 'End of observation', step: p.steps },
    ],
    legend: [
      { tone: 'zone', label: 'Circle · Mara’s neighbourhood' },
      { tone: 'actual', label: 'Result · capped sum of the labelled requests' },
    ],
    caption:
      'Name leaders identify the walkers and Mara’s neighbour centre. The right-hand rows separate Mara’s weighted acceleration requests at one shared scale; Result is their capped sum. The crossing drive supplies travel, and the flock rules organise spacing and pace around it.',
    comparison: {
      title: 'Crossing together can still mean piling up',
      intro:
        p.separationWeight === p.crowdedSeparationWeight
          ? 'Both runs currently have separation switched off, so their curves coincide; raise Separation weight to see whether spacing improves.'
          : 'Repeat Reed Field with only separationWeight changed from ' +
            fixed(p.separationWeight) +
            ' to ' +
            fixed(p.crowdedSeparationWeight) +
            '; all starting positions, velocities, other weights and integration steps stay the same.',
      timeline: {
        title: 'Closest pair of walkers',
        xLabel: 'Time · seconds',
        yLabel: 'Centre distance · units',
        seconds: frames.map(({ seconds }) => seconds),
        reference: 2 * p.radius,
        series: [
          {
            id: 'current',
            label: 'Green · separation weight ' + fixed(p.separationWeight),
            tone: 'actual',
            values: gaps,
          },
          {
            id: 'crowded',
            label: 'Amber · separation weight ' + fixed(p.crowdedSeparationWeight),
            tone: 'desired',
            values: crowdedGaps,
          },
        ],
      },
      findings: [
        'The smallest sampled gap is ' +
          fixed(Math.min(...gaps)) +
          ' units at separation weight ' +
          fixed(p.separationWeight) +
          ' and ' +
          fixed(Math.min(...crowdedGaps)) +
          ' at weight ' +
          fixed(p.crowdedSeparationWeight) +
          '; bodies overlap below the ' +
          fixed(2 * p.radius) +
          '-unit contact line.',
        'A low velocity spread says the walkers agree about motion; it says nothing about whether they leave room for one another.',
        'Inward cohesion and outward separation can balance while velocity matching is already satisfied; reducing the crossing drive can then leave the group almost still before its destination.',
      ],
      note: 'The chart checks sampled centre distances; the steering supplies no continuous collision guarantee and has no obstacle or route planner.',
    },
    inputs: [
      {
        name: 'separationWeight',
        label: 'Separation weight',
        unit: 'weight',
        min: 0,
        max: 2,
        step: 0.25,
      },
      {
        name: 'cruiseWeight',
        label: 'Crossing drive weight',
        unit: 'weight',
        min: 0,
        max: 2,
        step: 0.25,
      },
    ],
  };
};
