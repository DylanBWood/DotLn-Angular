import type { StudyParameters } from '@dotln-angular/models';
import type { SteeringBody, Vec2 } from '@dotln-angular/scene-engine';
import {
  add,
  arrive,
  clipLength,
  distance,
  dot,
  length,
  matchVelocity,
  normalize,
  scale,
  subtract,
  zero,
} from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { numberParameter } from '../parameters';
import type { MotionBounds, StudyFrame, StudyModel, StudyWorkedStep } from '../study-model';

export interface PipelineParameters {
  readonly startX: number;
  readonly startY: number;
  readonly startVelocityX: number;
  readonly startVelocityY: number;
  readonly goalX: number;
  readonly goalY: number;
  readonly palletX: number;
  readonly palletY: number;
  readonly palletRadius: number;
  readonly courierRadius: number;
  readonly safetyMargin: number;
  readonly detourPadding: number;
  readonly maxSpeed: number;
  readonly maxAcceleration: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly cornerSpeed: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly maxChecks: number;
  readonly failureChecks: number;
}

export interface PipelineState {
  readonly position: Vec2;
  readonly velocity: Vec2;
  /** Only a route that passed the constraint may survive into the next update. */
  readonly route: readonly Vec2[];
}

export interface PipelineAttempt {
  readonly route: readonly Vec2[];
  readonly waypoint: Vec2;
  readonly routeClearance: number;
  readonly sweptClearance: number;
  readonly acceleration: Vec2;
  readonly accepted: boolean;
}

export interface PipelineStep {
  readonly goal: Vec2;
  readonly attempts: readonly PipelineAttempt[];
  readonly accepted: boolean;
  readonly acceleration: Vec2;
  readonly next: PipelineState;
}

const readParameters = (parameters: StudyParameters): PipelineParameters => ({
  startX: numberParameter(parameters, 'startX'),
  startY: numberParameter(parameters, 'startY'),
  startVelocityX: numberParameter(parameters, 'startVelocityX'),
  startVelocityY: numberParameter(parameters, 'startVelocityY'),
  goalX: numberParameter(parameters, 'goalX'),
  goalY: numberParameter(parameters, 'goalY'),
  palletX: numberParameter(parameters, 'palletX'),
  palletY: numberParameter(parameters, 'palletY'),
  palletRadius: numberParameter(parameters, 'palletRadius'),
  courierRadius: numberParameter(parameters, 'courierRadius'),
  safetyMargin: numberParameter(parameters, 'safetyMargin'),
  detourPadding: numberParameter(parameters, 'detourPadding'),
  maxSpeed: numberParameter(parameters, 'maxSpeed'),
  maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
  slowRadius: numberParameter(parameters, 'slowRadius'),
  targetRadius: numberParameter(parameters, 'targetRadius'),
  responseTime: numberParameter(parameters, 'responseTime'),
  cornerSpeed: numberParameter(parameters, 'cornerSpeed'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
  maxChecks: numberParameter(parameters, 'maxChecks'),
  failureChecks: numberParameter(parameters, 'failureChecks'),
});

const goalOf = (example: PipelineParameters): Vec2 => ({ x: example.goalX, y: example.goalY });
const palletOf = (example: PipelineParameters): Vec2 => ({
  x: example.palletX,
  y: example.palletY,
});
const exclusionRadius = (example: PipelineParameters) =>
  example.palletRadius + example.courierRadius + example.safetyMargin;
const fixed = (value: number) => value.toFixed(2);
const point = (value: Vec2) => `(${fixed(value.x)}, ${fixed(value.y)})`;

function segmentDetails(from: Vec2, to: Vec2, example: PipelineParameters) {
  const segment = subtract(to, from);
  const squaredLength = dot(segment, segment);
  const projection = dot(subtract(palletOf(example), from), segment);
  const fraction = squaredLength === 0 ? 0 : Math.max(0, Math.min(1, projection / squaredLength));
  const closest = add(from, scale(segment, fraction));
  const clearance = distance(closest, palletOf(example)) - exclusionRadius(example);
  return { from, to, squaredLength, projection, fraction, closest, clearance };
}

/** Signed gap from a closed movement segment to the region forbidden to the courier's centre. */
export function segmentClearance(from: Vec2, to: Vec2, example: PipelineParameters): number {
  return segmentDetails(from, to, example).clearance;
}

function routeClearance(position: Vec2, route: readonly Vec2[], example: PipelineParameters) {
  const points = [position, ...route];
  return Math.min(...route.map((to, index) => segmentClearance(points[index], to, example)));
}

/** This warehouse has a known bypass above its single circular pallet footprint. */
function repairRoute(goal: Vec2, example: PipelineParameters): readonly Vec2[] {
  const offset = exclusionRadius(example) + example.detourPadding;
  return [
    { x: example.palletX - offset, y: example.palletY - offset },
    { x: example.palletX + offset, y: example.palletY - offset },
    goal,
  ];
}

/** Corners remain active until the courier is both close and slow enough to turn. */
function decompose(state: PipelineState, route: readonly Vec2[], example: PipelineParameters) {
  let index = 0;
  while (
    index < route.length - 1 &&
    distance(state.position, route[index]) <= example.targetRadius &&
    length(state.velocity) <= example.cornerSpeed
  )
    index++;
  return route.slice(index);
}

const bodyOf = (state: PipelineState, example: PipelineParameters): SteeringBody => ({
  position: state.position,
  velocity: state.velocity,
  heading: normalize(subtract(state.route[0], state.position)),
  maxSpeed: example.maxSpeed,
  maxAcceleration: example.maxAcceleration,
  radius: example.courierRadius,
  wanderAngle: 0,
});

function integrate(
  state: PipelineState,
  acceleration: Vec2,
  route: readonly Vec2[],
  example: PipelineParameters,
): PipelineState {
  const velocity = clipLength(
    add(state.velocity, scale(acceleration, example.timeStep)),
    example.maxSpeed,
  );
  return { position: add(state.position, scale(velocity, example.timeStep)), velocity, route };
}

/** Local goal negotiation; the actuator preview and committed movement share one engine call. */
export function calculatePipelineStep(
  state: PipelineState,
  example: PipelineParameters,
): PipelineStep {
  const goal = goalOf(example);
  const body = bodyOf(state, example);
  let route = decompose(state, state.route, example);
  const attempts: PipelineAttempt[] = [];
  for (let check = 0; check < example.maxChecks; check++) {
    const waypoint = route[0];
    const acceleration = arrive(body, waypoint, {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    });
    const next = integrate(state, acceleration, route, example);
    const routeGap = routeClearance(state.position, route, example);
    const sweptGap = segmentClearance(state.position, next.position, example);
    const accepted = routeGap >= 0 && sweptGap >= 0;
    attempts.push({
      route,
      waypoint,
      routeClearance: routeGap,
      sweptClearance: sweptGap,
      acceleration,
      accepted,
    });
    if (accepted) return { goal, attempts, accepted, acceleration, next };
    route = decompose(state, repairRoute(goal, example), example);
  }
  // An unverified suggestion is discarded; braking is not a proof of collision freedom.
  const acceleration = matchVelocity(body, zero, example.responseTime);
  return {
    goal,
    attempts,
    accepted: false,
    acceleration,
    next: integrate(state, acceleration, state.route, example),
  };
}

export function pipelineFrames(example: PipelineParameters): readonly PipelineState[] {
  const states: PipelineState[] = [
    {
      position: { x: example.startX, y: example.startY },
      velocity: { x: example.startVelocityX, y: example.startVelocityY },
      route: [goalOf(example)],
    },
  ];
  for (let step = 0; step < example.steps; step++)
    states.push(calculatePipelineStep(states[states.length - 1], example).next);
  return states;
}

const arrived = (state: PipelineState, example: PipelineParameters) =>
  distance(state.position, goalOf(example)) <= example.targetRadius &&
  length(state.velocity) <= example.cornerSpeed;

function workedAttempt(
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
      ? 'The segment has no length; use its endpoint.'
      : `Projection t = clamp(${fixed(tightest.projection)} / ${fixed(tightest.squaredLength)}, 0, 1) = ${fixed(tightest.fraction)}.`;
  return [
    `Check ${index + 1}: decomposer selects ${point(attempt.waypoint)}. Minimum remaining-polyline clearance = ${fixed(attempt.routeClearance)}; next movement segment clearance = ${fixed(attempt.sweptClearance)}. ${attempt.accepted ? 'Accept both checks.' : 'Reject and suggest the upper bypass.'}`,
    `Tightest route segment ${point(tightest.from)} → ${point(tightest.to)}: ${projection} Closest point = ${point(tightest.closest)}; clearance = ${fixed(distance(tightest.closest, palletOf(example)))} − ${fixed(exclusionRadius(example))} = ${fixed(tightest.clearance)} units.`,
  ];
}

function workedStep(
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
    title: `Pipeline update: ${fixed(step * example.timeStep)} → ${fixed((step + 1) * example.timeStep)} s`,
    lines: [
      `Targeter keeps delivery at ${point(result.goal)}; the courier is at ${point(state.position)}.`,
      `Exclude centre positions within ${fixed(example.palletRadius)} + ${fixed(example.courierRadius)} + ${fixed(example.safetyMargin)} = ${fixed(exclusionRadius(example))} units of the pallet.`,
      ...result.attempts.flatMap((attempt, index) => workedAttempt(state, attempt, index, example)),
      ...(result.accepted
        ? [
            `Arrive requests speed ${fixed(desiredSpeed)} for a waypoint gap of ${fixed(gap)}. Its stop distance is ${fixed(stop)}; inside the slow radius use ${fixed(example.maxSpeed)} × (gap − ${fixed(stop)}) / (${fixed(example.slowRadius)} − ${fixed(stop)}).`,
            `Desired velocity ${point(desired)}; (${point(desired)} − ${point(state.velocity)}) / ${fixed(example.responseTime)} = ${point(requested)} units/s² before the ${fixed(example.maxAcceleration)} magnitude cap.`,
          ]
        : [
            `Budget exhausted after ${result.attempts.length} checks. Discard the suggestion and match velocity to ${point(zero)} over ${fixed(example.responseTime)} s, capped at ${fixed(example.maxAcceleration)} units/s².`,
          ]),
      `Use acceleration ${point(result.acceleration)}. vNext = clip(${point(state.velocity)} + ${point(result.acceleration)} × ${fixed(example.timeStep)}, ${fixed(example.maxSpeed)}) = ${point(result.next.velocity)} units/s.`,
      `pNext = ${point(state.position)} + ${point(result.next.velocity)} × ${fixed(example.timeStep)} = ${point(result.next.position)}.`,
    ],
    note: result.accepted
      ? 'The actuator preview uses the same acceleration and velocity-first update that is committed. A clear polyline alone would not check the courier’s current momentum.'
      : 'No rejected route is executed. From rest this fallback waits; a moving courier still needs braking distance.',
  };
}

function readingOf(
  state: PipelineState,
  result: PipelineStep,
  route: readonly Vec2[],
  example: PipelineParameters,
): { readonly note: string; readonly relationship: string } {
  if (!result.accepted)
    return length(state.velocity) > example.cornerSpeed
      ? {
          note: 'The courier brakes because no proposed route has passed the constraint.',
          relationship: 'brakes before the pallet because no route has been approved',
        }
      : {
          note: 'The courier waits because the bypass was suggested but never checked.',
          relationship: 'waits before the pallet while its bypass remains unapproved',
        };
  if (arrived(state, example))
    return {
      note: 'The courier has reached delivery and is nearly still, completing the checked route.',
      relationship: 'is at delivery within the stopping tolerance',
    };
  if (result.attempts.some((attempt) => !attempt.accepted))
    return {
      note: 'The direct route is blocked, so the courier accepts a checked bypass above the pallet.',
      relationship: 'starts a checked detour above the pallet while delivery stays beyond it',
    };
  if (state.route.length > route.length)
    return route.length === 2
      ? {
          note: 'The courier releases the entry corner and follows the checked bypass past the pallet.',
          relationship: 'turns onto the upper bypass with the pallet below its route',
        }
      : {
          note: 'The courier releases the exit corner and can now head straight for delivery.',
          relationship: 'turns towards delivery with the pallet behind it',
        };
  const slowing = distance(state.position, route[0]) < example.slowRadius;
  if (route.length === 3)
    return slowing
      ? {
          note: 'The courier slows at the entry corner so the next turn stays clear of the pallet.',
          relationship: 'slows above and before the pallet for the entry turn',
        }
      : {
          note: 'The courier heads for the entry corner while delivery stays beyond the pallet.',
          relationship: 'heads above the pallet towards the entry corner',
        };
  if (route.length === 2) {
    if (slowing)
      return {
        note: 'The courier slows at the exit corner before turning towards delivery.',
        relationship: 'slows above and beyond the pallet for the exit turn',
      };
    return state.position.x < example.palletX
      ? {
          note: 'The courier follows the bypass above the pallet while delivery remains its final goal.',
          relationship: 'follows the upper bypass with the pallet still ahead and below',
        }
      : {
          note: 'The courier keeps its exit waypoint after passing the pallet so it can finish the turn safely.',
          relationship: 'has passed above the pallet and continues towards the exit corner',
        };
  }
  return slowing
    ? {
        note: 'The courier brakes near the delivery desk so arrival includes stopping.',
        relationship: 'brakes towards delivery with the pallet behind it',
      }
    : {
        note: 'The pallet is behind the courier, so the delivery desk becomes its next waypoint.',
        relationship: 'heads straight for delivery with the pallet behind it',
      };
}

const comparisonChecks = (example: PipelineParameters) =>
  example.maxChecks === example.failureChecks ? example.failureChecks + 1 : example.failureChecks;

function frameOf(
  state: PipelineState,
  result: PipelineStep,
  step: number,
  example: PipelineParameters,
): StudyFrame {
  const last = result.attempts.at(-1);
  const route = last?.route ?? state.route;
  const waypoint = route[0];
  const waypointName =
    route.length === 3 ? 'entry corner' : route.length === 2 ? 'exit corner' : 'delivery';
  const points = [state.position, ...route];
  const clearance = distance(state.position, palletOf(example)) - exclusionRadius(example);
  const routeGap = last?.routeClearance ?? routeClearance(state.position, route, example);
  const sweptGap = last?.sweptClearance ?? clearance;
  const localDistance = distance(state.position, waypoint);
  const bypass = repairRoute(result.goal, example);
  const reading = readingOf(state, result, route, example);
  const status = !result.accepted
    ? 'budget exhausted; braking'
    : arrived(state, example)
      ? 'delivered within tolerance'
      : 'route accepted';
  const proposalReading = result.accepted
    ? arrived(state, example)
      ? `The courier is moving at ${fixed(length(state.velocity))} units/s, below the ${fixed(example.cornerSpeed)} units/s stopping threshold.`
      : `The next stop is the ${waypointName}, ${fixed(localDistance)} units away, along a checked route with ${fixed(routeGap)} units of clearance outside the pallet’s safety boundary.`
    : routeGap < 0
      ? `The direct proposal overlaps the pallet’s safety boundary by ${fixed(-routeGap)} units, and the bypass still needs validation.`
      : `The route is clear but the next movement would enter the pallet’s safety boundary by ${fixed(Math.max(0, -sweptGap))} units.`;
  const values = Object.fromEntries(
    Object.entries(example).map(([name, value]) => [name, fixed(value)]),
  );
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'courier', ...state.position, tone: 'subject', label: 'Courier' }],
    zones: [
      { ...palletOf(example), radius: exclusionRadius(example) },
      { ...palletOf(example), radius: example.palletRadius },
    ],
    marks: [
      { ...result.goal, shape: 'cross', tone: 'target', label: 'Delivery' },
      { ...palletOf(example), shape: 'dot', tone: 'other', label: 'Pallet' },
      ...route.slice(0, -1).map((place, index) => ({
        ...place,
        shape: 'ring' as const,
        tone: index === 0 ? ('desired' as const) : ('muted' as const),
        label: route.length - index === 3 ? 'Entry' : 'Exit',
      })),
    ],
    links: [
      { from: state.position, to: result.goal, tone: 'muted' },
      ...route.map((to, index) => ({
        from: points[index],
        to,
        tone: result.accepted ? ('desired' as const) : ('other' as const),
      })),
    ],
    values: {
      ...values,
      maxChecks: String(example.maxChecks),
      failureChecks: String(example.failureChecks),
      comparisonChecks: String(comparisonChecks(example)),
      steps: String(example.steps),
      initialGoalDistance: fixed(distance({ x: example.startX, y: example.startY }, result.goal)),
      position: point(state.position),
      velocity: point(state.velocity),
      speed: fixed(length(state.velocity)),
      goal: point(result.goal),
      waypoint: point(waypoint),
      waypointName,
      relationship: reading.relationship,
      proposalReading,
      remainingRoute: route.map(point).join(' → '),
      localDistance: fixed(localDistance),
      goalDistance: fixed(distance(state.position, result.goal)),
      exclusionRadius: fixed(exclusionRadius(example)),
      offset: fixed(exclusionRadius(example) + example.detourPadding),
      firstCorner: point(bypass[0]),
      secondCorner: point(bypass[1]),
      clearance: fixed(clearance),
      routeClearance: fixed(routeGap),
      sweptClearance: fixed(sweptGap),
      checks: String(result.attempts.length),
      rejections: String(result.attempts.filter((attempt) => !attempt.accepted).length),
      acceleration: point(result.acceleration),
      accelerationMagnitude: fixed(length(result.acceleration)),
      nextPosition: point(result.next.position),
      nextVelocity: point(result.next.velocity),
      nextSpeed: fixed(length(result.next.velocity)),
      status,
      seconds: fixed(step * example.timeStep),
    },
    note: reading.note,
    worked: workedStep(state, result, step, example),
  };
}

function boundsOf(frames: readonly StudyFrame[], example: PipelineParameters): MotionBounds {
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
function spaceLabels(frames: readonly StudyFrame[], bounds: MotionBounds): readonly StudyFrame[] {
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

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readParameters(parameters);
  const states = pipelineFrames(example);
  const calculations = states.map((state) => calculatePipelineStep(state, example));
  const otherChecks = comparisonChecks(example);
  const otherExample = { ...example, maxChecks: otherChecks };
  const other = pipelineFrames(otherExample);
  const otherCalculations = other.map((state) => calculatePipelineStep(state, otherExample));
  const unlabelled = states.map((state, step) => frameOf(state, calculations[step], step, example));
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
    motion: { bounds, frames, trail: true },
    timeline: {
      title: 'Delivery goal and active waypoint',
      xLabel: 'Time · seconds',
      yLabel: 'Remaining distance · units',
      seconds,
      series: [
        { id: 'goal', label: 'Delivery distance', tone: 'actual', values: goalDistances },
        {
          id: 'waypoint',
          label: 'Next waypoint distance',
          tone: 'desired',
          values: states.map((state, step) =>
            distance(
              state.position,
              calculations[step].attempts.at(-1)?.waypoint ?? state.route[0],
            ),
          ),
        },
      ],
      reference: example.targetRadius,
    },
    initialStep: 0,
    moments: blocked
      ? [
          { label: 'Request refused', step: 0 },
          { label: 'Still waiting', step: Math.floor(example.steps / 2) },
          { label: 'No delivery', step: example.steps },
        ]
      : [
          { label: 'Repair before moving', step: 0 },
          {
            label: 'Leave entry corner',
            step: find((_state, calculation) => calculation.attempts.at(-1)?.route.length === 2),
          },
          { label: 'Pass the pallet', step: find((state) => state.position.x >= example.palletX) },
          {
            label: 'Delivery leg',
            step: find(
              (state, calculation) =>
                calculation.attempts.at(-1)?.route.length === 1 &&
                state.position.x > example.palletX,
            ),
          },
          {
            label: arrived(states[deliveredAt], example) ? 'Delivered' : 'End of run',
            step: deliveredAt,
          },
        ],
    legend: [
      { tone: 'desired', label: 'Checked bypass and next corner' },
      { tone: 'actual', label: 'Delivery distance on the chart' },
      { tone: 'muted', label: 'Direct delivery request and later corners' },
    ],
    caption:
      'Entry and Exit name the bypass corners; the active corner has a dashed ring, and Delivery becomes the next waypoint after Exit is released. The inner pallet circle is its footprint and the outer circle is the safety boundary for the courier’s centre. The trail shows movement, while the grey line keeps the delivery request visible. A mark’s name hides when the courier reaches it so the names stay apart. Each frame checks its next update; the waypoint distance jumps when a corner is released.',
    comparison: {
      title: 'A repair needs a check of its own',
      intro: `Change only the check budget from ${example.maxChecks} to ${otherChecks}. A rejected direct route may suggest a bypass, but that bypass needs a later check in the same update before the courier may move.`,
      timeline: {
        title: 'Distance still to deliver',
        xLabel: 'Time · seconds',
        yLabel: 'Delivery distance · units',
        seconds,
        reference: example.targetRadius,
        series: [
          {
            id: 'selected',
            label: `Selected budget: ${example.maxChecks}`,
            tone: 'actual',
            values: goalDistances,
          },
          {
            id: 'comparison',
            label: `Comparison budget: ${otherChecks}`,
            tone: 'desired',
            values: otherDistances,
          },
        ],
      },
      findings: [
        `The ${example.maxChecks}-check run refuses ${refused} updates and ends ${fixed(goalDistances[example.steps])} units from delivery at speed ${fixed(length(states[example.steps].velocity))} units/s.`,
        `The ${otherChecks}-check run refuses ${otherRefused} updates and ends ${fixed(otherDistances[example.steps])} units from delivery. Its final speed is ${fixed(length(other[example.steps].velocity))} units/s.`,
        `The ${example.failureChecks}-check run stays at rest: refusing unchecked movement preserves safety here, but does not deliver the parcel.`,
      ],
      note: 'The lower budget repeats the same refusal every update; the larger budget checks the repair before executing it. The comparison holds the bypass padding and all movement limits fixed.',
    },
    inputs: [
      {
        name: 'maxChecks',
        label: 'Constraint checks',
        unit: 'checks/update',
        min: 1,
        max: 2,
        step: 1,
      },
      { name: 'detourPadding', label: 'Bypass padding', unit: 'units', min: 2, max: 12, step: 2 },
    ],
  };
};
