import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  advanceFormation,
  arrive,
  centroid,
  clipLength,
  createSimulation,
  distance,
  type FormationState,
  length,
  patternSlots,
  scale,
  slotPosition,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { StudyFrame, StudyModel, StudyWorkedStep } from '../study-model';

const memberIds = ['north', 'medic', 'south'] as const;
const memberNames = ['North escort', 'Medic', 'South escort'] as const;
const fixed = (value: number) => value.toFixed(2);
const point = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;

export interface GroupExample {
  readonly startX: number;
  readonly goalX: number;
  readonly spacing: number;
  readonly anchorSpeed: number;
  readonly fastAnchorSpeed: number;
  readonly escortSpeed: number;
  readonly medicSpeed: number;
  readonly maxAcceleration: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly lagLimit: number;
  readonly slotErrorBudget: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly arrivalDistance: number;
  readonly arrivalSpeed: number;
  readonly radius: number;
  readonly velocityArrowSeconds: number;
  readonly enginePlanningSeconds: number;
  readonly engineAnchorPull: number;
}

export function readGroupExample(parameters: StudyParameters): GroupExample {
  const example: GroupExample = {
    startX: numberParameter(parameters, 'startX'),
    goalX: numberParameter(parameters, 'goalX'),
    spacing: numberParameter(parameters, 'spacing'),
    anchorSpeed: numberParameter(parameters, 'anchorSpeed'),
    fastAnchorSpeed: numberParameter(parameters, 'fastAnchorSpeed'),
    escortSpeed: numberParameter(parameters, 'escortSpeed'),
    medicSpeed: numberParameter(parameters, 'medicSpeed'),
    maxAcceleration: numberParameter(parameters, 'maxAcceleration'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    lagLimit: numberParameter(parameters, 'lagLimit'),
    slotErrorBudget: numberParameter(parameters, 'slotErrorBudget'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    arrivalDistance: numberParameter(parameters, 'arrivalDistance'),
    arrivalSpeed: numberParameter(parameters, 'arrivalSpeed'),
    radius: numberParameter(parameters, 'radius'),
    velocityArrowSeconds: numberParameter(parameters, 'velocityArrowSeconds'),
    enginePlanningSeconds: numberParameter(parameters, 'enginePlanningSeconds'),
    engineAnchorPull: numberParameter(parameters, 'engineAnchorPull'),
  };
  if (!Object.values(example).every(Number.isFinite))
    throw new Error('Group parameters must be finite.');
  if (
    example.goalX <= example.startX ||
    example.spacing <= 0 ||
    example.timeStep <= 0 ||
    example.responseTime < example.timeStep ||
    example.targetRadius <= 0 ||
    example.slowRadius <= example.targetRadius / 2 ||
    example.maxAcceleration <= 0 ||
    example.escortSpeed < 0 ||
    example.medicSpeed < 0 ||
    example.anchorSpeed < 0 ||
    example.fastAnchorSpeed < 0 ||
    example.lagLimit <= 0 ||
    example.radius <= 0 ||
    example.slotErrorBudget <= 0 ||
    example.arrivalDistance <= 0 ||
    example.arrivalSpeed <= 0 ||
    example.velocityArrowSeconds <= 0 ||
    !Number.isInteger(example.steps) ||
    example.steps < 2 ||
    example.steps > 239
  )
    throw new Error(
      'The journey needs positive distances and times, non-negative speeds and at most 239 steps.',
    );
  // These parameters document fixed engine rules; accepting another value would mislabel the calculation.
  if (example.enginePlanningSeconds !== 0.25 || example.engineAnchorPull !== 0.02)
    throw new Error('The engine planning interval and anchor pull are fixed.');
  return example;
}

export interface GroupState {
  readonly members: ReturnType<typeof createSimulation>['units'];
  readonly formation: FormationState;
}

export function initialGroup(example: GroupExample): GroupState {
  const anchor = { x: example.startX, y: 0 };
  const slots = patternSlots('line', memberIds.length, example.spacing);
  const members = createSimulation({
    id: 'lantern-squad',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: { width: example.goalX - example.startX, height: example.spacing * memberIds.length },
    units: memberIds.map((id, slot) => ({
      id,
      labels: { name: memberNames[slot] },
      unitClass: id === 'medic' ? 'medic' : 'escort',
      position: add(anchor, slots[slot]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: id === 'medic' ? example.medicSpeed : example.escortSpeed,
      maxAcceleration: example.maxAcceleration,
      radius: example.radius,
    })),
  }).units;
  return {
    members,
    formation: {
      kind: 'two-level',
      slots,
      anchor,
      anchorVelocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      anchorSpeed: example.anchorSpeed,
      lagLimit: example.lagLimit,
      leader: null,
      assignment: memberIds.map((unitId, slot) => ({
        unitId,
        slot,
        slotRole: unitId === 'medic' ? 'medic' : 'escort',
        cost: 0,
      })),
    },
  };
}

/** Followers read the old slots together; the engine then advances the anchor using their new positions. */
export function calculateGroupStep(state: GroupState, example: GroupExample) {
  const targets = state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot));
  const accelerations = state.members.map((member, index) =>
    arrive(member, targets[index], {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    }),
  );
  const members = state.members.map((member, index) => {
    const velocity = clipLength(
      add(member.velocity, scale(accelerations[index], example.timeStep)),
      member.maxSpeed,
    );
    return {
      ...member,
      velocity,
      position: add(member.position, scale(velocity, example.timeStep)),
    };
  });
  const formation = advanceFormation(
    state.formation,
    members,
    { x: example.goalX, y: 0 },
    example.timeStep,
  );
  return { targets, accelerations, next: { members, formation } satisfies GroupState };
}

export function groupStates(example: GroupExample): readonly GroupState[] {
  const states: GroupState[] = [initialGroup(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateGroupStep(states[step], example).next);
  return states;
}

export const slotErrors = (state: GroupState) =>
  state.members.map((member, index) =>
    distance(
      member.position,
      slotPosition(state.formation, state.formation.assignment[index].slot),
    ),
  );
export const maxSlotError = (state: GroupState) => Math.max(...slotErrors(state));
export const anchorLag = (state: GroupState) =>
  distance(state.formation.anchor, centroid(state.members.map(({ position }) => position)));

/** Arrival means being near the final slot and slow; proximity to a moving slot is not arrival. */
export const arrivalSteps = (
  states: readonly GroupState[],
  example: GroupExample,
): readonly (number | null)[] =>
  memberIds.map((_id, index) => {
    const found = states.findIndex(
      ({ members, formation }) =>
        distance(
          members[index].position,
          add({ x: example.goalX, y: 0 }, formation.slots[index]),
        ) <= example.arrivalDistance && length(members[index].velocity) <= example.arrivalSpeed,
    );
    return found === -1 ? null : found;
  });

const arrivalSummary = (states: readonly GroupState[], example: GroupExample) => {
  const steps = arrivalSteps(states, example);
  const times = steps
    .map(
      (step, index) =>
        `${memberNames[index]} ${step === null ? 'not yet' : `${fixed(step * example.timeStep)} s`}`,
    )
    .join('; ');
  const reached = steps.filter((step): step is number => step !== null);
  return {
    times,
    spread:
      reached.length === memberIds.length
        ? `${fixed((Math.max(...reached) - Math.min(...reached)) * example.timeStep)} s`
        : 'unknown while any member has not arrived',
  };
};

function workedStep(
  state: GroupState,
  step: number,
  example: GroupExample,
  calculation = calculateGroupStep(state, example),
): StudyWorkedStep {
  const medic = state.members[1];
  const target = calculation.targets[1];
  const gap = distance(medic.position, target);
  const stop = example.targetRadius / 2;
  const desiredSpeed =
    gap <= stop
      ? 0
      : gap >= example.slowRadius
        ? medic.maxSpeed
        : (medic.maxSpeed * (gap - stop)) / (example.slowRadius - stop);
  const desiredX = Math.sign(target.x - medic.position.x) * desiredSpeed;
  const requested = (desiredX - medic.velocity.x) / example.responseTime;
  const nextMedic = calculation.next.members[1];
  const nextMean = centroid(calculation.next.members.map(({ position }) => position));
  return {
    title: `Medic’s step: ${fixed(step * example.timeStep)} → ${fixed((step + 1) * example.timeStep)} s`,
    lines: [
      ...state.members.map(
        (member, index) =>
          `${memberNames[index]}: position ${point(member.position)}, velocity ${point(member.velocity)} units/s; slot ${point(calculation.targets[index])}.`,
      ),
      `The old anchor is ${point(state.formation.anchor)}. Medic’s offset is ${point(state.formation.slots[1])}, so the old slot is ${point(target)}.`,
      `Distance to that slot: |${fixed(target.x)} − ${fixed(medic.position.x)}| = ${fixed(gap)}. The stop distance is ${fixed(example.targetRadius)} / 2 = ${fixed(stop)}.`,
      gap <= stop
        ? `Inside the stop distance, desired speed is zero; engine arrive asks to match a stationary target.`
        : gap >= example.slowRadius
          ? `Outside the slowing radius ${fixed(example.slowRadius)}, desired speed is the medic’s maximum ${fixed(medic.maxSpeed)} units/s.`
          : `Inside the slowing radius: ${fixed(medic.maxSpeed)} × (${fixed(gap)} − ${fixed(stop)}) / (${fixed(example.slowRadius)} − ${fixed(stop)}) ≈ ${fixed(desiredSpeed)} units/s.`,
      `Requested x acceleration: (${fixed(desiredX)} − ${fixed(medic.velocity.x)}) / ${fixed(example.responseTime)} ≈ ${fixed(requested)} units/s². Engine arrive caps its vector magnitude at ${fixed(example.maxAcceleration)}; it returns ${fixed(calculation.accelerations[1].x)} on x.`,
      `Update velocity, capped at ${fixed(medic.maxSpeed)}: ${fixed(medic.velocity.x)} + ${fixed(calculation.accelerations[1].x)} × ${fixed(example.timeStep)} ≈ ${fixed(nextMedic.velocity.x)} units/s. Then x: ${fixed(medic.position.x)} + ${fixed(nextMedic.velocity.x)} × ${fixed(example.timeStep)} ≈ ${fixed(nextMedic.position.x)}.`,
      `After every follower moves, the new mean is ${point(nextMean)}. Engine advanceFormation returns anchor ${point(calculation.next.formation.anchor)}, moderated towards that mean and bounded to lag ${fixed(example.lagLimit)}.`,
      ...(step === 0
        ? [
            `The initial anchor cruise request is ${fixed(example.anchorSpeed)} / ${fixed(example.enginePlanningSeconds)} = ${fixed(example.anchorSpeed / example.enginePlanningSeconds)} units/s; engine acceleration limits give steering velocity ${fixed(calculation.next.formation.anchorVelocity.x)}. Its unmoderated x is ${fixed(example.startX)} + ${fixed(calculation.next.formation.anchorVelocity.x)} × ${fixed(example.timeStep)}; pulling ${fixed(example.engineAnchorPull)} of the gap back towards the stationary mean and applying the lag cap gives ${fixed(calculation.next.formation.anchor.x)}.`,
          ]
        : []),
    ],
    note:
      step === example.steps
        ? 'This calculation previews one more update; the displayed run ends here. Passing the arrival test means near and slow, without snapping anyone onto a marker.'
        : 'Rounded values explain the calculation; the model uses full precision. The anchor’s stored steering velocity precedes its pull towards the mean, so it is not its final displacement divided by time.',
  };
}

const isArrived = (state: GroupState, index: number, example: GroupExample) =>
  distance(
    state.members[index].position,
    add({ x: example.goalX, y: 0 }, state.formation.slots[index]),
  ) <= example.arrivalDistance && length(state.members[index].velocity) <= example.arrivalSpeed;

function frameNote(state: GroupState, step: number, example: GroupExample, slowing: boolean) {
  if (step === 0)
    return 'Everyone starts on their own slot, so the anchor must move before the squad has somewhere new to follow.';
  if (state.members.every(({ velocity }) => length(velocity) === 0))
    return 'The anchor has moved ahead while the squad still waits on the old slots, so gaps open before the followers react.';
  if (maxSlotError(state) > example.slotErrorBudget)
    return 'The medic has fallen too far behind its slot, even though the anchor remains close to the squad’s mean.';
  const arrived = state.members.map((_member, index) => isArrived(state, index, example));
  if (arrived.every(Boolean))
    return 'Everyone is near their final slot and moving slowly, so the squad passes the arrival test.';
  if (arrived.some(Boolean))
    return 'Some members pass the arrival test while others are still catching up, so the squad has not arrived together.';
  if (slowing)
    return 'The anchor slows near the beacon, giving the medic time to close the gap before the squad arrives.';
  if (state.members[0].position.x - state.members[1].position.x > 0.005)
    return 'The medic trails the escorts because its lower top speed leaves a larger gap to the moving line.';
  return 'The squad starts accelerating after the anchor, so the moving slots still lead their followers.';
}

function frameOf(
  state: GroupState,
  step: number,
  example: GroupExample,
  runValues: Readonly<Record<string, string>>,
): StudyFrame {
  const slots = state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot));
  const errors = slotErrors(state);
  const error = Math.max(...errors);
  const lead = state.members[0].position.x - state.members[1].position.x;
  const memberRelation =
    Math.abs(lead) < 0.005
      ? 'The medic is nearly level with the escorts'
      : lead > 0
        ? `The medic trails both escorts by ${fixed(lead)} units`
        : `The medic is ${fixed(-lead)} units ahead of both escorts`;
  const gapOwner =
    error - Math.min(...errors) < 0.005
      ? 'All members have equal slot gaps'
      : errors[1] >= error - 1e-10
        ? 'The medic has the largest slot gap'
        : 'The escorts have the largest slot gap';
  const calculation = calculateGroupStep(state, example);
  const slowing =
    length(calculation.next.formation.anchorVelocity) <
    length(state.formation.anchorVelocity) - 1e-10;
  // Leader lines lift the anchor and beacon names away from the medic's lane, even at arrival.
  const anchorLabel = { x: state.formation.anchor.x, y: -2 * example.spacing };
  const beaconLabel = { x: example.goalX, y: 2 * example.spacing };
  return {
    seconds: step * example.timeStep,
    bodies: state.members.map((member, index) => ({
      id: member.id,
      label: ['North', 'Medic', 'South'][index],
      ...member.position,
      tone: member.id === 'medic' ? 'actual' : 'subject',
    })),
    marks: [
      ...slots.map((slot) => ({ ...slot, shape: 'ring' as const, tone: 'target' as const })),
      { ...state.formation.anchor, shape: 'dot', tone: 'desired' },
      { x: example.goalX, y: 0, shape: 'cross', tone: 'target' },
      { ...anchorLabel, shape: 'dot', tone: 'muted', label: 'Anchor' },
      { ...beaconLabel, shape: 'dot', tone: 'muted', label: 'Beacon' },
    ],
    links: [
      ...state.members.map((member, index) => ({
        from: member.position,
        to: slots[index],
        tone: 'muted' as const,
      })),
      { from: anchorLabel, to: state.formation.anchor, tone: 'desired' },
      { from: beaconLabel, to: { x: example.goalX, y: 0 }, tone: 'target' },
    ],
    vectors: state.members.map(({ position, velocity }) => ({
      ...position,
      dx: velocity.x * example.velocityArrowSeconds,
      dy: velocity.y * example.velocityArrowSeconds,
      tone: 'actual',
    })),
    values: {
      ...runValues,
      memberRelation,
      gapOwner,
      slotError: fixed(error),
      anchorLag: fixed(anchorLag(state)),
      budget: fixed(example.slotErrorBudget),
      spacing: fixed(example.spacing),
      timeStep: fixed(example.timeStep),
      responseTime: fixed(example.responseTime),
      slowRadius: fixed(example.slowRadius),
      stopDistance: fixed(example.targetRadius / 2),
      accelerationLimit: fixed(example.maxAcceleration),
      lagLimit: fixed(example.lagLimit),
      arrivalDistance: fixed(example.arrivalDistance),
      arrivalSpeed: fixed(example.arrivalSpeed),
      anchorSpeed: fixed(example.anchorSpeed),
      planningSeconds: fixed(example.enginePlanningSeconds),
      cruiseRequest: fixed(example.anchorSpeed / example.enginePlanningSeconds),
      medicSpeedNow: fixed(length(state.members[1].velocity)),
      escortSpeedNow: fixed(length(state.members[0].velocity)),
    },
    note: frameNote(state, step, example, slowing),
    worked: workedStep(state, step, example, calculation),
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readGroupExample(parameters);
  const states = groupStates(example);
  const changed = { ...example, anchorSpeed: example.fastAnchorSpeed };
  const compared = groupStates(changed);
  const errors = states.map(maxSlotError);
  const comparedErrors = compared.map(maxSlotError);
  const peak = errors.indexOf(Math.max(...errors));
  const comparedPeak = comparedErrors.indexOf(Math.max(...comparedErrors));
  const arrivals = arrivalSteps(states, example);
  const allArrived = arrivals.every((step) => step !== null);
  const lastArrival = allArrived
    ? Math.max(...arrivals.filter((step): step is number => step !== null))
    : example.steps;
  const selectedArrival = arrivalSummary(states, example);
  const comparedArrival = arrivalSummary(compared, changed);
  const runValues = {
    runPeak: fixed(errors[peak]),
    shapeOutcome:
      errors[peak] <= example.slotErrorBudget
        ? 'the selected pace stays within the slot-error allowance'
        : 'the selected pace exceeds the slot-error allowance',
    arrivalSpread: selectedArrival.spread,
    comparisonPace: fixed(changed.anchorSpeed),
  };
  const frames = states.map((state, step) => frameOf(state, step, example, runValues));
  const seconds = frames.map(({ seconds }) => seconds);
  const positions = frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const samePace = example.anchorSpeed === changed.anchorSpeed;
  return {
    motion: {
      bounds: {
        minX: Math.min(...positions.map(({ x }) => x)) - example.spacing,
        maxX: Math.max(...positions.map(({ x }) => x)) + example.spacing,
        minY: Math.min(...positions.map(({ y }) => y)) - example.spacing,
        maxY: Math.max(...positions.map(({ y }) => y)) + example.spacing,
      },
      frames,
      trail: true,
    },
    timeline: {
      title: 'A bound on the mean is different from a bound on every member',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds,
      reference: example.slotErrorBudget,
      yRange: [0, Math.max(example.slotErrorBudget, ...errors, ...comparedErrors)],
      series: [
        { id: 'member-error', label: 'Largest member-to-slot gap', tone: 'actual', values: errors },
        {
          id: 'anchor-lag',
          label: 'Anchor-to-mean distance',
          tone: 'desired',
          values: states.map(anchorLag),
        },
      ],
    },
    initialStep: peak,
    moments: [
      { label: 'At the old slots', step: 0 },
      { label: 'Anchor moves first', step: 1 },
      { label: 'Largest slot gap', step: peak },
      { label: allArrived ? 'All pass arrival test' : 'Arrival still pending', step: lastArrival },
      {
        label: states[example.steps].members.every((_member, index) =>
          isArrived(states[example.steps], index, example),
        )
          ? 'Near and slow'
          : 'Run ends',
        step: example.steps,
      },
    ],
    legend: [
      { tone: 'subject', label: 'North and South · escorts' },
      { tone: 'actual', label: 'Medic; arrows · actual velocity' },
      { tone: 'desired', label: 'Anchor · moving plan' },
      { tone: 'target', label: 'Rings · assigned slots; Beacon · destination' },
      { tone: 'muted', label: 'Short links · member-to-slot gaps' },
    ],
    caption: `The anchor carries the slot rings towards the beacon; each named follower steers to its own old ring. Leader lines lift the Anchor and Beacon labels clear of the squad. Arrow length is speed × ${fixed(example.velocityArrowSeconds)} s.`,
    comparison: {
      title: samePace
        ? 'Both runs now use the same anchor pace'
        : 'A faster plan can stretch the line',
      intro: `Selected anchor pace ${fixed(example.anchorSpeed)}; comparison pace ${fixed(changed.anchorSpeed)} units per ${fixed(example.enginePlanningSeconds)} s planning step. Only anchorSpeed changes; the members, slots, arrival rule and ${fixed(example.timeStep)} s updates stay the same.`,
      timeline: {
        title: 'Largest member-to-slot gap',
        xLabel: 'Time · seconds',
        yLabel: 'Distance · units',
        seconds,
        reference: example.slotErrorBudget,
        yRange: [0, Math.max(example.slotErrorBudget, ...errors, ...comparedErrors)],
        series: [
          { id: 'selected', label: 'Selected anchor pace', tone: 'actual', values: errors },
          {
            id: 'compared',
            label: 'Comparison anchor pace',
            tone: 'desired',
            values: comparedErrors,
          },
        ],
        marks: [
          { x: seconds[peak], y: errors[peak], tone: 'actual' },
          { x: seconds[comparedPeak], y: comparedErrors[comparedPeak], tone: 'desired' },
        ],
      },
      findings: [
        `Selected peak gap ${fixed(errors[peak])} at ${fixed(seconds[peak])} s; comparison peak gap ${fixed(comparedErrors[comparedPeak])} at ${fixed(seconds[comparedPeak])} s. Compare both with the ${fixed(example.slotErrorBudget)}-unit allowance. The comparison anchor stays within ${fixed(Math.max(...compared.map(anchorLag)))} units of the mean, while its largest member gap reaches ${fixed(comparedErrors[comparedPeak])}.`,
        `Selected arrival times: ${selectedArrival.times}; spread ${selectedArrival.spread}. Comparison arrival times: ${comparedArrival.times}; spread ${comparedArrival.spread}. Arrival requires final-slot distance ≤ ${fixed(example.arrivalDistance)} and speed ≤ ${fixed(example.arrivalSpeed)}; preserving the line during travel is a separate test.`,
      ],
      note: 'The reference is the chosen member-to-slot allowance; it does not constrain the engine. Arrival times are sampled, without promising exact rest or simultaneous arrival.',
    },
    inputs: [
      {
        name: 'anchorSpeed',
        label: 'Anchor pace',
        unit: 'units/planning step',
        min: 0.4,
        max: 1.5,
        step: 0.1,
      },
    ],
  };
};
