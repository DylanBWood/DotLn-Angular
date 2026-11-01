import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  advanceFormation,
  arrive,
  assignSlots,
  centroid,
  clipLength,
  createSimulation,
  distance,
  type FormationPattern,
  type FormationState,
  length,
  patternSlots,
  scale,
  type SimulationState,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { withSpacedLabels } from '../drawing';
import { numberParameter, textParameter } from '../parameters';
import type { MotionBounds, StudyFrame, StudyModel } from '../study-model';

export interface EscortParameters {
  readonly pattern: FormationPattern;
  readonly memberCount: number;
  readonly spacing: number;
  readonly originX: number;
  readonly originY: number;
  readonly objectiveX: number;
  readonly objectiveY: number;
  readonly anchorSpeed: number;
  readonly lagLimit: number;
  readonly comparisonLagLimit: number;
  readonly memberSpeed: number;
  readonly memberAcceleration: number;
  readonly memberRadius: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
  readonly planningStepSeconds: number;
  readonly anchorAcceleration: number;
  readonly anchorSlowRadius: number;
  readonly anchorStopRadius: number;
  readonly anchorPull: number;
}

export interface EscortState {
  readonly formation: FormationState;
  readonly members: SimulationState['units'];
}

const names = ['lantern', 'port', 'starboard'] as const;
const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
const point = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;
const meanOf = (state: EscortState) => centroid(state.members.map((member) => member.position));

export function readEscortParameters(parameters: StudyParameters): EscortParameters {
  const pattern = textParameter(parameters, 'pattern');
  if (pattern !== 'wedge' && pattern !== 'line' && pattern !== 'column')
    throw new RangeError('The escort needs an engine formation pattern.');
  // Refuse stale teaching values instead of displaying arithmetic the engine did not run.
  const engineConstants = {
    planningStepSeconds: 0.25,
    anchorAcceleration: 24,
    anchorSlowRadius: 6,
    anchorStopRadius: 0.5,
    anchorPull: 0.02,
  } as const;
  for (const [name, expected] of Object.entries(engineConstants))
    if (numberParameter(parameters, name) !== expected)
      throw new RangeError(`${name} must describe the scene engine's fixed anchor rule.`);
  const example: EscortParameters = {
    pattern,
    memberCount: numberParameter(parameters, 'memberCount'),
    spacing: numberParameter(parameters, 'spacing'),
    originX: numberParameter(parameters, 'originX'),
    originY: numberParameter(parameters, 'originY'),
    objectiveX: numberParameter(parameters, 'objectiveX'),
    objectiveY: numberParameter(parameters, 'objectiveY'),
    anchorSpeed: numberParameter(parameters, 'anchorSpeed'),
    lagLimit: numberParameter(parameters, 'lagLimit'),
    comparisonLagLimit: numberParameter(parameters, 'comparisonLagLimit'),
    memberSpeed: numberParameter(parameters, 'memberSpeed'),
    memberAcceleration: numberParameter(parameters, 'memberAcceleration'),
    memberRadius: numberParameter(parameters, 'memberRadius'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
    planningStepSeconds: numberParameter(parameters, 'planningStepSeconds'),
    anchorAcceleration: numberParameter(parameters, 'anchorAcceleration'),
    anchorSlowRadius: numberParameter(parameters, 'anchorSlowRadius'),
    anchorStopRadius: numberParameter(parameters, 'anchorStopRadius'),
    anchorPull: numberParameter(parameters, 'anchorPull'),
  };
  if (
    example.memberCount !== names.length ||
    !Number.isInteger(example.steps) ||
    example.steps < 1 ||
    example.steps > 239
  )
    throw new RangeError('This escort has three named members and at most 240 frames.');
  return example;
}

export function initialEscort(example: EscortParameters): EscortState {
  const slots = patternSlots(example.pattern, example.memberCount, example.spacing);
  const anchor = { x: example.originX, y: example.originY };
  const members = createSimulation({
    id: 'harbour-beacon-escort',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: {
      width: Math.abs(example.objectiveX - example.originX) + example.spacing * 2,
      height: example.spacing * 4,
    },
    units: names.map((id, index) => ({
      id,
      labels: {},
      unitClass: 'escort',
      position: add(anchor, slots[index]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: example.memberSpeed,
      maxAcceleration: example.memberAcceleration,
      radius: example.memberRadius,
    })),
  }).units;
  return {
    members,
    formation: {
      kind: 'two-level',
      slots,
      assignment: assignSlots(
        members,
        names.map(() => 'escort'),
        { 'cost.escort.escort': 0 },
      ),
      anchor,
      anchorVelocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      anchorSpeed: example.anchorSpeed,
      lagLimit: example.lagLimit,
      leader: null,
    },
  };
}

/** Members read the old slots; the anchor then reads their updated positions, as in the scene. */
export function calculateEscortStep(state: EscortState, example: EscortParameters) {
  const members = state.members.map((member) => {
    const assignment = state.formation.assignment.find(({ unitId }) => unitId === member.id);
    if (!assignment) throw new Error('Each escort needs an assigned slot.');
    const acceleration = arrive(member, slotPosition(state.formation, assignment.slot), {
      slowRadius: example.slowRadius,
      targetRadius: example.targetRadius,
      timeToTarget: example.responseTime,
    });
    const velocity = clipLength(
      add(member.velocity, scale(acceleration, example.timeStep)),
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
    {
      x: example.objectiveX,
      y: example.objectiveY,
    },
    example.timeStep,
  );
  const mean = centroid(members.map((member) => member.position));
  const proposed = add(state.formation.anchor, scale(formation.anchorVelocity, example.timeStep));
  const pulled = add(proposed, scale(subtract(mean, proposed), example.anchorPull));
  return {
    next: { formation, members },
    mean,
    proposed,
    pulled,
    pulledLag: distance(pulled, mean),
    capped: distance(pulled, mean) > state.formation.lagLimit,
  };
}

export function escortStates(example: EscortParameters): readonly EscortState[] {
  const states: EscortState[] = [initialEscort(example)];
  for (let step = 0; step < example.steps; step++)
    states.push(calculateEscortStep(states[states.length - 1], example).next);
  return states;
}

export const escortLag = (state: EscortState) => distance(state.formation.anchor, meanOf(state));
export const escortSlotError = (state: EscortState) =>
  state.formation.assignment.reduce((sum, assignment) => {
    const member = state.members.find(({ id }) => id === assignment.unitId);
    if (!member) throw new Error('An assigned escort must be present.');
    return sum + distance(member.position, slotPosition(state.formation, assignment.slot));
  }, 0) / state.members.length;

function noteOf(state: EscortState, step: number, example: EscortParameters): string {
  if (step === 0)
    return 'The robots start on their slots, but the anchor is about to ask them to march.';
  const calculation = calculateEscortStep(state, example);
  const targetGap = distance(state.formation.anchor, {
    x: example.objectiveX,
    y: example.objectiveY,
  });
  if (targetGap < example.anchorSlowRadius)
    return 'The anchor slows near the beacon, giving the robots time to close the gap to their slots.';
  if (calculation.capped)
    return 'The lag limit holds the anchor near the robots, so their progress sets the pace of the slots.';
  if (
    length(state.formation.anchorVelocity) <
    example.anchorSpeed / example.planningStepSeconds - 0.005
  )
    return 'The anchor accelerates ahead, drawing the slots away before the robots can build up speed.';
  return 'The slots are still drawing away from the robots, while the pull towards their mean restrains the anchor.';
}

function frameOf(state: EscortState, step: number, example: EscortParameters): StudyFrame {
  const calculation = calculateEscortStep(state, example);
  const mean = meanOf(state);
  const formation = state.formation;
  const slots = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    position: slotPosition(formation, slot),
  }));
  const first = state.members[0];
  const nextFirst = calculation.next.members[0];
  const firstTarget = slots[0].position;
  const acceleration = scale(subtract(nextFirst.velocity, first.velocity), 1 / example.timeStep);
  const objective = { x: example.objectiveX, y: example.objectiveY };
  const gap = distance(formation.anchor, objective);
  const requestedSpeed =
    gap <= example.anchorStopRadius
      ? 0
      : (example.anchorSpeed / example.planningStepSeconds) *
        Math.min(
          1,
          (gap - example.anchorStopRadius) / (example.anchorSlowRadius - example.anchorStopRadius),
        );
  const seconds = step * example.timeStep;
  return {
    seconds,
    bodies: [
      ...state.members.map(({ id, position }) => ({
        id,
        ...position,
        label: id === 'lantern' ? 'Lantern' : id === 'port' ? 'Port' : 'Starboard',
        tone: 'subject' as const,
      })),
      {
        id: 'anchor',
        label: 'Anchor',
        ...formation.anchor,
        tone: 'actual',
        heading: Math.atan2(formation.heading.y, formation.heading.x),
      },
    ],
    marks: [
      { ...objective, label: 'Beacon', shape: 'cross', tone: 'target' },
      { ...mean, label: 'Mean', shape: 'dot', tone: 'other' },
      { ...calculation.proposed, label: 'Proposal', shape: 'dot', tone: 'muted' },
      ...slots.map(({ position }, index) => ({
        ...position,
        label: `Slot ${index}`,
        shape: 'ring' as const,
        tone: 'desired' as const,
      })),
    ],
    zones: [{ ...mean, radius: example.lagLimit }],
    links: [
      { from: mean, to: formation.anchor, tone: 'other' },
      ...state.members.map((member, index) => ({
        from: member.position,
        to: slots[index].position,
        tone: 'desired' as const,
      })),
    ],
    vectors: [
      {
        ...formation.anchor,
        dx: calculation.next.formation.anchor.x - formation.anchor.x,
        dy: calculation.next.formation.anchor.y - formation.anchor.y,
        tone: 'actual',
      },
    ],
    values: {
      ...Object.fromEntries(
        Object.entries(example).map(([name, value]) => [
          name,
          typeof value === 'number' ? String(Number(fixed(value))) : value,
        ]),
      ),
      time: fixed(seconds),
      memberPositions: state.members
        .map(({ id, position }) => `${id} ${point(position)}`)
        .join('; '),
      slotPositions: slots.map(({ id, position }) => `${id} ${point(position)}`).join('; '),
      anchorPosition: point(formation.anchor),
      meanPosition: point(mean),
      objectivePosition: point(objective),
      proposedPosition: point(calculation.proposed),
      nextAnchorPosition: point(calculation.next.formation.anchor),
      lag: fixed(escortLag(state)),
      slotError: fixed(escortSlotError(state)),
      requestedSpeed: fixed(requestedSpeed),
      maximumRequestedSpeed: fixed(example.anchorSpeed / example.planningStepSeconds),
      planningSpeed: fixed(length(formation.anchorVelocity)),
    },
    note: noteOf(state, step, example),
    worked: {
      title: `Escort update: ${fixed(seconds)} → ${fixed(seconds + example.timeStep)} s`,
      lines: [
        `Members: ${state.members.map(({ id, position }) => `${id} ${point(position)}`).join('; ')}. Slots: ${slots.map(({ id, position }) => `${id} ${point(position)}`).join('; ')}.`,
        `Lantern reads its current slot ${point(firstTarget)} from position ${point(first.position)}. Engine arrive gives acceleration ${point(acceleration)} units/s².`,
        `Update its velocity ${point(first.velocity)} + ${point(acceleration)} × ${fixed(example.timeStep)} = ${point(nextFirst.velocity)} units/s, capped at ${fixed(example.memberSpeed)} units/s; its next position is ${point(nextFirst.position)}.`,
        `After all members move, their mean is ${point(calculation.mean)}. The anchor uses this updated mean.`,
        `Requested anchor speed = (${fixed(example.anchorSpeed)} / ${fixed(example.planningStepSeconds)}) × min(1, max(0, (${fixed(gap)} − ${fixed(example.anchorStopRadius)}) / (${fixed(example.anchorSlowRadius)} − ${fixed(example.anchorStopRadius)}))) = ${fixed(requestedSpeed)} units/s.`,
        `The engine limits the change of planning velocity to ${fixed(example.anchorAcceleration)} × ${fixed(example.timeStep)} = ${fixed(example.anchorAcceleration * example.timeStep)} units/s. New planning velocity: ${point(calculation.next.formation.anchorVelocity)}.`,
        `Propose ${point(formation.anchor)} + ${point(calculation.next.formation.anchorVelocity)} × ${fixed(example.timeStep)} = ${point(calculation.proposed)}.`,
        `Pull towards the mean: ${point(calculation.proposed)} + ${fixed(example.anchorPull)} × (${point(calculation.mean)} − ${point(calculation.proposed)}) = ${point(calculation.pulled)}. Its gap is ${fixed(calculation.pulledLag)} units.`,
        calculation.capped
          ? `Clip that gap to ${fixed(example.lagLimit)}: mean + normalise(pulled − mean) × ${fixed(example.lagLimit)} = ${point(calculation.next.formation.anchor)}. This changes position, not the stored planning velocity.`
          : `The gap is within ${fixed(example.lagLimit)}, so the next anchor is ${point(calculation.next.formation.anchor)} without clipping.`,
      ],
      note: 'All members read the previous slots. The new anchor defines the slots for the following update. Displayed values are rounded; the run keeps full precision.',
    },
  };
}

export const model = (parameters: StudyParameters): StudyModel => {
  const example = readEscortParameters(parameters);
  const states = escortStates(example);
  const loose = escortStates({ ...example, lagLimit: example.comparisonLagLimit });
  const rawFrames = states.map((state, step) => frameOf(state, step, example));
  const seconds = rawFrames.map((frame) => frame.seconds);
  const firstClip = states.findIndex((state) => calculateEscortStep(state, example).capped);
  const initialStep =
    firstClip < 0 ? Math.floor(example.steps / 2) : Math.min(firstClip + 1, example.steps);
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y + radius },
    ]),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const peakError = (run: readonly EscortState[]) => Math.max(...run.map(escortSlotError));
  const bounds: MotionBounds = {
    minX: Math.min(...points.map(({ x }) => x)) - example.spacing * 2,
    maxX: Math.max(...points.map(({ x }) => x)) + example.spacing * 2,
    minY: Math.min(...points.map(({ y }) => y)) - example.spacing * 2,
    maxY: Math.max(...points.map(({ y }) => y)) + example.spacing * 2,
  };
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds));
  return {
    motion: { frames, bounds },
    timeline: {
      title: 'Anchor lag and mean slot error',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds,
      yRange: [0, Math.max(example.lagLimit, ...states.map(escortSlotError)) * 1.1],
      reference: example.lagLimit,
      series: [
        {
          id: 'lag',
          label: 'Anchor to actual member mean',
          tone: 'actual',
          values: states.map(escortLag),
        },
        {
          id: 'slot-error',
          label: 'Mean member to assigned slot distance',
          tone: 'desired',
          values: states.map(escortSlotError),
        },
      ],
    },
    initialStep,
    moments: [
      { label: 'Formed at rest', step: 0 },
      { label: 'First anchor pull', step: 1 },
      { label: firstClip < 0 ? 'Pull restrains the lead' : 'Lag limit acts', step: initialStep },
      { label: 'Later in the march', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Dots · lantern, port and starboard escorts' },
      { tone: 'actual', label: 'Anchor arrowhead and displacement; chart · anchor-to-mean lag' },
      { tone: 'desired', label: 'Slot rings and links; chart · mean slot error' },
      { tone: 'other', label: 'Dot and link · actual member mean and anchor lag' },
      { tone: 'muted', label: 'Dot · next anchor proposal before moderation' },
      { tone: 'target', label: 'Cross · harbour beacon objective' },
      { tone: 'zone', label: 'Circle · allowed anchor distance from the member mean' },
    ],
    caption:
      'Lantern is the front robot, with port and starboard on the wings; rings mark their assigned slots. The labelled anchor steers towards the beacon, while the lag circle follows the robots’ actual mean. The muted dot is its next proposal before moderation, and the arrow is its actual next displacement. In the chart, anchor lag and mean slot error coincide for this equally paced wedge.',
    comparison: {
      title: 'A loose lag limit stretches the escort',
      intro: `Change only lagLimit from ${fixed(example.lagLimit)} to ${fixed(example.comparisonLagLimit)} units. Geometry, anchor speed, member limits, integration and the engine's gentle pull stay the same.`,
      timeline: {
        title: 'Mean distance from members to their assigned slots',
        xLabel: 'Time · seconds',
        yLabel: 'Slot error · units',
        seconds,
        yRange: [0, Math.max(peakError(states), peakError(loose)) * 1.1],
        series: [
          {
            id: 'tight',
            label: `Lag limit ${fixed(example.lagLimit)}`,
            tone: 'actual',
            values: states.map(escortSlotError),
          },
          {
            id: 'loose',
            label: `Lag limit ${fixed(example.comparisonLagLimit)}`,
            tone: 'desired',
            values: loose.map(escortSlotError),
          },
        ],
      },
      findings: [
        `The peak mean slot error is ${fixed(peakError(states))} units with the tight limit and ${fixed(peakError(loose))} with the loose limit. The gentle pull remains active in both runs.`,
        `At ${fixed(example.steps * example.timeStep)} s the tight anchor is ${point(states[example.steps].formation.anchor)}, while the loose anchor is ${point(loose[example.steps].formation.anchor)}. Advancing the plan farther does not mean its members have reached their slots.`,
      ],
      note: 'The anchor cap bounds distance to the group mean. It does not bound the error of each member when a group has unequal speeds or one member is blocked.',
    },
    inputs: [
      { name: 'lagLimit', label: 'Anchor lag limit', unit: 'units', min: 4, max: 10, step: 1 },
      {
        name: 'memberSpeed',
        label: 'Robot speed limit',
        unit: 'units/s',
        min: 0.5,
        max: 3,
        step: 0.5,
      },
    ],
  };
};
