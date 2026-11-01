import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  arrive,
  assignSlots,
  centroid,
  clipLength,
  cosine,
  createSimulation,
  distance,
  type FormationPattern,
  type FormationState,
  length,
  patternSlots,
  scale,
  type SimulationState,
  sine,
  slotPosition,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { withSpacedLabels } from '../drawing';
import { numberParameter, textParameter } from '../parameters';
import type { MotionBounds, MotionFrame, MotionStudyModel } from '../study-model';

export interface RosterParameters {
  readonly pattern: FormationPattern;
  readonly capacity: number;
  readonly spacing: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly releaseStep: number;
  readonly turnStartStep: number;
  readonly turnEndStep: number;
  readonly turnDegrees: number;
  readonly driftCorrection: number;
  readonly comparisonCorrection: number;
  readonly memberSpeed: number;
  readonly memberAcceleration: number;
  readonly memberRadius: number;
  readonly slowRadius: number;
  readonly targetRadius: number;
  readonly responseTime: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface RosterPattern {
  readonly supportsSlots: (count: number) => boolean;
  readonly slotOffset: (slot: number) => Vec2;
  readonly driftOffset: (occupied: readonly number[]) => Vec2;
}

export interface RosterState {
  readonly step: number;
  readonly formation: FormationState;
  readonly members: SimulationState['units'];
  readonly rawSlots: readonly Vec2[];
  readonly drift: Vec2;
  readonly angle: number;
}

const names = ['lookout', 'port', 'starboard'] as const;
const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
const point = ({ x, y }: Vec2) => `(${fixed(x)}, ${fixed(y)})`;

export function readRosterParameters(parameters: StudyParameters): RosterParameters {
  const pattern = textParameter(parameters, 'pattern');
  if (pattern !== 'wedge' && pattern !== 'line' && pattern !== 'column')
    throw new RangeError('The roster needs an engine formation pattern.');
  const example: RosterParameters = {
    pattern,
    capacity: numberParameter(parameters, 'capacity'),
    spacing: numberParameter(parameters, 'spacing'),
    anchorX: numberParameter(parameters, 'anchorX'),
    anchorY: numberParameter(parameters, 'anchorY'),
    releaseStep: numberParameter(parameters, 'releaseStep'),
    turnStartStep: numberParameter(parameters, 'turnStartStep'),
    turnEndStep: numberParameter(parameters, 'turnEndStep'),
    turnDegrees: numberParameter(parameters, 'turnDegrees'),
    driftCorrection: numberParameter(parameters, 'driftCorrection'),
    comparisonCorrection: numberParameter(parameters, 'comparisonCorrection'),
    memberSpeed: numberParameter(parameters, 'memberSpeed'),
    memberAcceleration: numberParameter(parameters, 'memberAcceleration'),
    memberRadius: numberParameter(parameters, 'memberRadius'),
    slowRadius: numberParameter(parameters, 'slowRadius'),
    targetRadius: numberParameter(parameters, 'targetRadius'),
    responseTime: numberParameter(parameters, 'responseTime'),
    timeStep: numberParameter(parameters, 'timeStep'),
    steps: numberParameter(parameters, 'steps'),
  };
  const boundaries = [
    example.releaseStep,
    example.turnStartStep,
    example.turnEndStep,
    example.steps,
  ];
  if (
    example.capacity !== names.length ||
    boundaries.some((value) => !Number.isInteger(value)) ||
    !(
      0 < example.releaseStep &&
      example.releaseStep < example.turnStartStep &&
      example.turnStartStep < example.turnEndStep &&
      example.turnEndStep < example.steps &&
      example.steps <= 239
    )
  )
    throw new RangeError(
      'The named roster needs an ordered release, turn and finish within 240 frames.',
    );
  if (![0, 1].includes(example.driftCorrection) || ![0, 1].includes(example.comparisonCorrection))
    throw new RangeError('Drift correction must be enabled or disabled.');
  return example;
}

/** A local contract adds capacity and occupied-slot drift to the engine's centred geometry. */
export function createRosterPattern(
  pattern: FormationPattern,
  capacity: number,
  spacing: number,
): RosterPattern {
  const offsets = patternSlots(pattern, capacity, spacing);
  const slotOffset = (slot: number): Vec2 => {
    if (!Number.isInteger(slot) || slot < 0 || slot >= capacity)
      throw new RangeError('The pattern has no such slot.');
    return offsets[slot];
  };
  return {
    supportsSlots: (count) => Number.isInteger(count) && count > 0 && count <= capacity,
    slotOffset,
    driftOffset: (occupied) => centroid(occupied.map(slotOffset)),
  };
}

export function advanceRosterMembers(
  state: RosterState,
  example: RosterParameters,
): SimulationState['units'] {
  return state.members.map((member) => {
    const assignment = state.formation.assignment.find(({ unitId }) => unitId === member.id);
    if (!assignment) throw new Error('Each present escort needs its original slot.');
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
}

export function rosterStates(example: RosterParameters): readonly RosterState[] {
  const pattern = createRosterPattern(example.pattern, example.capacity, example.spacing);
  if (!pattern.supportsSlots(names.length))
    throw new RangeError('The pattern cannot hold the roster.');
  const anchor = { x: example.anchorX, y: example.anchorY };
  const rawSlots = names.map((_name, slot) => pattern.slotOffset(slot));
  let members = createSimulation({
    id: 'harbour-lookout-release',
    sceneType: 'units-on-terrain',
    seed: 0,
    field: {
      width: example.anchorX + example.spacing * 2,
      height: example.anchorY + example.spacing * 2,
    },
    units: names.map((id, slot) => ({
      id,
      labels: {},
      unitClass: 'escort',
      position: add(anchor, rawSlots[slot]),
      velocity: { x: 0, y: 0 },
      heading: { x: 1, y: 0 },
      maxSpeed: example.memberSpeed,
      maxAcceleration: example.memberAcceleration,
      radius: example.memberRadius,
    })),
  }).units;
  const assignment = assignSlots(
    members,
    names.map(() => 'escort'),
    { 'cost.escort.escort': 0 },
  );
  const states: RosterState[] = [];
  for (let step = 0; step <= example.steps; step++) {
    if (step >= example.releaseStep) members = members.filter(({ id }) => id !== names[0]);
    const present = new Set(members.map(({ id }) => id));
    const held = assignment.filter(({ unitId }) => present.has(unitId));
    if (!pattern.supportsSlots(held.length))
      throw new RangeError('The pattern cannot hold the active roster.');
    const drift = pattern.driftOffset(held.map(({ slot }) => slot));
    const progress = Math.max(
      0,
      Math.min(1, (step - example.turnStartStep) / (example.turnEndStep - example.turnStartStep)),
    );
    const angle = example.turnDegrees * (Math.PI / 180) * progress;
    const state: RosterState = {
      step,
      members,
      rawSlots,
      drift,
      angle,
      formation: {
        kind: 'two-level',
        anchor,
        heading: { x: cosine(angle), y: sine(angle) },
        slots: rawSlots.map((offset) => subtract(offset, scale(drift, example.driftCorrection))),
        assignment: held,
        anchorVelocity: { x: 0, y: 0 },
        anchorSpeed: 0,
        lagLimit: 0,
        leader: null,
      },
    };
    states.push(state);
    if (step < example.steps) members = advanceRosterMembers(state, example);
  }
  return states;
}

export const rosterMemberMean = (state: RosterState) =>
  centroid(state.members.map(({ position }) => position));
export const rosterTargetMean = (state: RosterState) =>
  centroid(state.formation.assignment.map(({ slot }) => slotPosition(state.formation, slot)));
export const rosterCentreGap = (state: RosterState) =>
  distance(rosterMemberMean(state), state.formation.anchor);
export const rosterTargetGap = (state: RosterState) =>
  distance(rosterTargetMean(state), state.formation.anchor);

function noteOf(state: RosterState, example: RosterParameters): string {
  if (state.step < example.releaseStep)
    return 'All escorts occupy their slots, so the complete wedge needs no drift correction.';
  if (state.step === example.releaseStep)
    return example.driftCorrection === 1
      ? 'The lookout leaves, so the wing targets shift towards the anchor while the robots still cover their old targets.'
      : 'The lookout leaves, but keeping the old offsets leaves the remaining targets off-centre.';
  if (state.step < example.turnStartStep)
    return example.driftCorrection === 1
      ? 'The wings approach their recentred slots, turning a geometric correction into real movement.'
      : 'The wings stay on their old targets, so their shared centre remains displaced from the anchor.';
  if (state.step < example.turnEndStep)
    return example.driftCorrection === 1
      ? 'The centred targets turn with the anchor, but finite acceleration makes the escorts lag behind.'
      : 'The off-centre targets turn with the anchor, carrying the geometric bias into the new direction.';
  const trackingError =
    state.formation.assignment.reduce((sum, { slot, unitId }) => {
      const member = state.members.find(({ id }) => id === unitId);
      return sum + (member ? distance(member.position, slotPosition(state.formation, slot)) : 0);
    }, 0) / state.members.length;
  if (example.driftCorrection === 0)
    return trackingError < 0.02
      ? 'The wings are nearly on their targets, yet their shared centre is still displaced from the anchor.'
      : 'The turn has ended, but reaching these uncorrected targets will leave the wings off-centre.';
  return trackingError < 0.02
    ? 'The wings are nearly on their centred targets, so the real formation now follows the corrected pattern.'
    : 'The turn has ended, so the wings can close the tracking gap to their centred targets.';
}

function frameOf(state: RosterState, example: RosterParameters): MotionFrame {
  const { formation } = state;
  const rawFormation = { ...formation, slots: state.rawSlots };
  const targets = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    slot,
    position: slotPosition(formation, slot),
  }));
  const rawTargets = formation.assignment.map(({ unitId, slot }) => ({
    id: unitId,
    slot,
    position: slotPosition(rawFormation, slot),
  }));
  const occupied = formation.assignment.map(({ slot }) => state.rawSlots[slot]);
  const focus = state.members[0];
  const focusSlot = formation.assignment[0].slot;
  const raw = state.rawSlots[focusSlot];
  const corrected = formation.slots[focusSlot];
  const target = targets[0].position;
  const next = advanceRosterMembers(state, example)[0];
  const acceleration = scale(subtract(next.velocity, focus.velocity), 1 / example.timeStep);
  const seconds = state.step * example.timeStep;
  const count = state.members.length;
  const occupiedText = formation.assignment
    .map(({ slot }) => `slot ${slot} ${point(state.rawSlots[slot])}`)
    .join('; ');
  const relationship =
    state.step < example.releaseStep
      ? 'The full roster and its targets share the anchor’s centre.'
      : example.driftCorrection === 0
        ? 'The wing targets remain off-centre because occupied-slot drift has not been subtracted.'
        : state.step === example.releaseStep
          ? 'The corrected wing targets are centred on the anchor while the escorts still occupy their old target positions.'
          : 'The corrected wing targets stay centred on the anchor as the escorts follow them.';
  return {
    seconds,
    bodies: state.members.map(({ id, position }) => ({
      id,
      ...position,
      label: id === 'lookout' ? 'Lookout' : id === 'port' ? 'Port' : 'Starboard',
      tone: 'subject',
    })),
    marks: [
      { ...formation.anchor, label: 'Anchor', shape: 'cross', tone: 'target' },
      { ...rosterMemberMean(state), label: 'Mean', shape: 'dot', tone: 'actual' },
      ...rawTargets.map(({ position }) => ({
        ...position,
        shape: 'dot' as const,
        tone: 'muted' as const,
      })),
      ...targets.map(({ slot, position }) => ({
        ...position,
        label: `Slot ${slot}`,
        shape: 'ring' as const,
        tone: 'desired' as const,
      })),
    ],
    links: [
      ...state.members.map((member, index) => ({
        from: member.position,
        to: targets[index].position,
        tone: 'desired' as const,
      })),
      { from: formation.anchor, to: rosterMemberMean(state), tone: 'actual' },
    ],
    vectors: [
      {
        ...formation.anchor,
        dx: formation.heading.x * example.spacing,
        dy: formation.heading.y * example.spacing,
        tone: 'other',
      },
    ],
    values: {
      ...Object.fromEntries(
        Object.entries(example).map(([name, value]) => [
          name,
          typeof value === 'number' ? String(Number(fixed(value))) : value,
        ]),
      ),
      correctionState: example.driftCorrection === 1 ? 'on' : 'off',
      correctionReading:
        example.driftCorrection === 1
          ? 'the occupied targets are centred on the anchor'
          : 'the original offsets are kept and their occupied centre is displaced',
      departureDriftLength: fixed(length(centroid(state.rawSlots.slice(1)))),
      patternRelationship: relationship,
      time: fixed(seconds),
      releaseSeconds: fixed(example.releaseStep * example.timeStep),
      turnStartSeconds: fixed(example.turnStartStep * example.timeStep),
      turnEndSeconds: fixed(example.turnEndStep * example.timeStep),
      activeCount: String(count),
      occupiedSlots: formation.assignment.map(({ slot }) => String(slot)).join(', '),
      supportAnswer: count <= example.capacity ? 'yes' : 'no',
      driftPosition: point(state.drift),
      driftLength: fixed(length(state.drift)),
      headingDegrees: fixed((state.angle * 180) / Math.PI),
      anchorPosition: point(formation.anchor),
      meanPosition: point(rosterMemberMean(state)),
      memberPositions: state.members
        .map(({ id, position }) => `${id} ${point(position)}`)
        .join('; '),
      slotPositions: targets
        .map(({ id, slot, position }) => `${id}, slot ${slot}, ${point(position)}`)
        .join('; '),
      rawPositions: rawTargets
        .map(({ slot, position }) => `slot ${slot} ${point(position)}`)
        .join('; '),
      centreGap: fixed(rosterCentreGap(state)),
      targetGap: fixed(rosterTargetGap(state)),
    },
    note: noteOf(state, example),
    worked: {
      title: `Pattern contract at ${fixed(seconds)} s`,
      lines: [
        `Escorts: ${state.members.map(({ id, position }) => `${id} ${point(position)}`).join('; ')}. Chosen targets: ${targets.map(({ slot, position }) => `slot ${slot} ${point(position)}`).join('; ')}. Uncorrected targets: ${rawTargets.map(({ slot, position }) => `slot ${slot} ${point(position)}`).join('; ')}.`,
        `supportsSlots(${count}) is true for this ${example.capacity}-place pattern. Occupied offsets: ${occupiedText}.`,
        `Drift x = (${occupied.map(({ x }) => fixed(x)).join(' + ')}) / ${count} = ${fixed(state.drift.x)}; drift y = (${occupied.map(({ y }) => fixed(y)).join(' + ')}) / ${count} = ${fixed(state.drift.y)}.`,
        `${focus.id} keeps slot ${focusSlot}. Correct its local offset: ${point(raw)} − ${fixed(example.driftCorrection)} × ${point(state.drift)} = ${point(corrected)}.`,
        `Heading ${fixed((state.angle * 180) / Math.PI)}° gives cos = ${fixed(formation.heading.x)}, sin = ${fixed(formation.heading.y)}. World x = ${fixed(formation.anchor.x)} + ${fixed(corrected.x)} × cos − ${fixed(corrected.y)} × sin = ${fixed(target.x)}.`,
        `World y = ${fixed(formation.anchor.y)} + ${fixed(corrected.x)} × sin + ${fixed(corrected.y)} × cos = ${fixed(target.y)}. The engine's slotPosition performs this rotation and translation.`,
        `From ${point(focus.position)}, engine arrive gives acceleration ${point(acceleration)} units/s². Velocity ${point(focus.velocity)} + acceleration × ${fixed(example.timeStep)} = ${point(next.velocity)} units/s after the speed cap.`,
        `Integrate the updated velocity: ${point(focus.position)} + ${point(next.velocity)} × ${fixed(example.timeStep)} = ${point(next.position)}. Target mean gap is ${fixed(rosterTargetGap(state))}; real member mean gap is ${fixed(rosterCentreGap(state))} units.`,
      ],
      note: 'Subtract drift in local coordinates before rotating. The pattern describes targets; the arrive step moves the escorts. Values are rounded for display.',
    },
  };
}

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readRosterParameters(parameters);
  const states = rosterStates(example);
  const comparisonCorrection =
    example.driftCorrection === example.comparisonCorrection
      ? 1 - example.comparisonCorrection
      : example.comparisonCorrection;
  const alternative = rosterStates({ ...example, driftCorrection: comparisonCorrection });
  const corrected = example.driftCorrection === 1 ? states : alternative;
  const uncorrected = example.driftCorrection === 0 ? states : alternative;
  const rawFrames = states.map((state) => frameOf(state, example));
  const seconds = rawFrames.map(({ seconds: value }) => value);
  const points = rawFrames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);
  const last = corrected[example.steps];
  const lastUncorrected = uncorrected[example.steps];
  const bounds: MotionBounds = {
    minX: Math.min(...points.map(({ x }) => x)) - example.spacing / 2,
    maxX: Math.max(...points.map(({ x }) => x)) + example.spacing / 2,
    minY: Math.min(...points.map(({ y }) => y)) - example.spacing / 2,
    maxY: Math.max(...points.map(({ y }) => y)) + example.spacing / 2,
  };
  const frames = rawFrames.map((frame) => withSpacedLabels(frame, bounds, 'marks'));
  return {
    family: 'motion',
    motion: { frames, bounds },
    timeline: {
      title: 'Geometric drift and the centre that actually moves',
      xLabel: 'Time · seconds',
      yLabel: 'Distance · units',
      seconds,
      yRange: [
        0,
        Math.max(...states.map((state) => Math.max(length(state.drift), rosterCentreGap(state)))) *
          1.1,
      ],
      series: [
        {
          id: 'drift',
          label: 'Occupied local drift magnitude',
          tone: 'muted',
          values: states.map(({ drift }) => length(drift)),
        },
        {
          id: 'targets',
          label: 'Chosen target mean to anchor',
          tone: 'desired',
          values: states.map(rosterTargetGap),
        },
        {
          id: 'members',
          label: 'Actual member mean to anchor',
          tone: 'actual',
          values: states.map(rosterCentreGap),
        },
      ],
    },
    initialStep: example.releaseStep,
    moments: [
      { label: 'Full pattern', step: 0 },
      { label: 'Lookout leaves', step: example.releaseStep },
      { label: 'Turn starts', step: example.turnStartStep },
      { label: 'Turn ends', step: example.turnEndStep },
      { label: 'Targets followed', step: example.steps },
    ],
    legend: [
      { tone: 'subject', label: 'Dots · escorts still in the roster' },
      { tone: 'target', label: 'Cross · fixed anchor' },
      { tone: 'desired', label: 'Chosen slot rings and links; chart · target mean to anchor' },
      { tone: 'muted', label: 'Uncorrected target dots; chart · occupied local drift magnitude' },
      { tone: 'actual', label: 'Actual member mean dot and link; chart · its anchor gap' },
      { tone: 'other', label: 'Arrow · anchor forward direction' },
    ],
    caption:
      'At “Lookout leaves”, the escort centres cover the muted dots marking their uncorrected targets. The rings show the chosen targets, labelled by slot index; switching drift correction off leaves their centre displaced from the anchor. The arrow shows the anchor’s forward direction.',
    comparison: {
      title: 'Compare occupied-slot drift correction',
      intro: `Change only driftCorrection from ${fixed(example.driftCorrection)} to ${fixed(comparisonCorrection)}. The chart compares correction on and off with the same departure, turn, slot identities and member steering.`,
      timeline: {
        title: 'Actual member mean to the fixed anchor',
        xLabel: 'Time · seconds',
        yLabel: 'Centre gap · units',
        seconds,
        yRange: [
          0,
          Math.max(...corrected.map(rosterCentreGap), ...uncorrected.map(rosterCentreGap)) * 1.1,
        ],
        series: [
          {
            id: 'corrected',
            label: 'Subtract occupied-slot drift',
            tone: 'actual',
            values: corrected.map(rosterCentreGap),
          },
          {
            id: 'uncorrected',
            label: 'Use the full pattern offsets unchanged',
            tone: 'desired',
            values: uncorrected.map(rosterCentreGap),
          },
        ],
      },
      findings: [
        `At ${fixed(example.steps * example.timeStep)} s the actual centre gap is ${fixed(rosterCentreGap(last))} units with correction and ${fixed(rosterCentreGap(lastUncorrected))} without it.`,
        `Without correction the target mean itself remains ${fixed(rosterTargetGap(lastUncorrected))} units from the anchor. Faster member steering cannot remove that geometric bias; the escorts are pursuing the targets they were given.`,
      ],
      note: 'The anchor stays fixed in both runs. This isolates a pattern contract problem from anchor moderation and route following.',
    },
    inputs: [
      { name: 'spacing', label: 'Slot spacing', unit: 'units', min: 2, max: 4, step: 0.5 },
      {
        name: 'driftCorrection',
        label: 'Drift correction',
        unit: '0 off; 1 on',
        min: 0,
        max: 1,
        step: 1,
      },
    ],
  };
};
