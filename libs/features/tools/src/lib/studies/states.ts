import type {
  StateMove,
  StateNode,
  StateObject,
  StatePlacement,
  StatesFrame,
  StatesModel,
  StatesStudyModel,
  StateTransition,
  StudyComparison,
  StudyInput,
  StudyLegendEntry,
  StudyMoment,
  StudyValues,
  StudyWorkedStep,
} from './study-model';
import { secondsPerFrame } from './study-model';
import type { StudyTranslate } from './study-translate';

/**
 * One moment of a simulation, in its own identifiers: the state each tracked object is in, and the
 * transition that brought an object there where the simulation names one. It carries no words, so
 * the mechanism that produced it stays independent of language.
 */
export interface StatesSnapshot {
  /** The state each tracked object is in, by object id; an untracked object is absent. */
  readonly at: Readonly<Record<string, string>>;
  /** The transition each object took to reach this moment, by object id, where it names one. */
  readonly took?: Readonly<Record<string, string>>;
}

/** The words of one moment, from the presentation: what the prose reads and what is happening. */
export interface StatesMomentText {
  readonly values?: StudyValues;
  readonly note?: string;
  readonly worked?: StudyWorkedStep;
  /** A few words beside an object at this moment, such as `version 4`, by object id. */
  readonly notes?: Readonly<Record<string, string>>;
}

/** The states, the objects and the transitions of an example, with their names translated. */
export interface StatesShape {
  readonly nodes: readonly StateNode[];
  readonly objects: readonly StateObject[];
  readonly transitions: readonly StateTransition[];
}

/** One snapshot per moment of the run, and the words the presentation gives each of them. */
export interface StatesRun {
  readonly shape: StatesShape;
  readonly snapshots: readonly StatesSnapshot[];
  readonly text: readonly StatesMomentText[];
}

/** What a states study shows around its drawing; the family's own legend and caption by default. */
export interface StatesStudyParts {
  readonly moments: readonly StudyMoment[];
  readonly legend?: readonly StudyLegendEntry[];
  readonly caption?: string;
  /** The moment the drawing opens on; the start when absent. */
  readonly initialStep?: number;
  readonly comparison?: StudyComparison;
  readonly inputs?: readonly StudyInput[];
}

/** Refuses a shape whose ids repeat or whose transitions name a state it does not have. */
function checkShape({ nodes, objects, transitions }: StatesShape) {
  for (const [kind, ids] of [
    ['state', nodes.map(({ id }) => id)],
    ['object', objects.map(({ id }) => id)],
    ['transition', transitions.map(({ id }) => id)],
  ] as const) {
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated !== undefined)
      throw new Error(`Two of the example's ${kind}s share the id ${repeated}.`);
  }
  const states = new Set(nodes.map(({ id }) => id));
  const known = (end: string | null) => end === null || states.has(end);
  for (const { id, from, to } of transitions)
    if (!known(from) || !known(to) || (from === null && to === null))
      throw new Error(`Transition ${id} names a state the example does not have.`);
}

/** Refuses a snapshot that places an unknown object, uses an unknown state or names a stray move. */
function checkSnapshot(shape: StatesShape, snapshot: StatesSnapshot, step: number) {
  for (const [object, state] of Object.entries(snapshot.at)) {
    if (!shape.objects.some(({ id }) => id === object))
      throw new Error(`Step ${step} places ${object}, which the example does not have.`);
    if (!shape.nodes.some(({ id }) => id === state))
      throw new Error(`Step ${step} puts ${object} in ${state}, which the example does not have.`);
  }
  for (const [object, transition] of Object.entries(snapshot.took ?? {}))
    if (!shape.transitions.some(({ id }) => id === transition))
      throw new Error(`Step ${step} moves ${object} by ${transition}, which the example lacks.`);
}

/**
 * What changed between two snapshots, in the shape's object order. An object whose state did not
 * change still moves when the snapshot names a transition back into the same state.
 */
function movesBetween(
  shape: StatesShape,
  before: StatesSnapshot,
  after: StatesSnapshot,
): readonly StateMove[] {
  return shape.objects.flatMap(({ id: object }): StateMove[] => {
    const from = before.at[object] ?? null;
    const to = after.at[object] ?? null;
    const transitionId = after.took?.[object];
    if (from === to && transitionId === undefined) return [];
    if (transitionId === undefined) return [{ object, from, to }];
    const transition = shape.transitions.find(({ id }) => id === transitionId);
    if (!transition || transition.from !== from || transition.to !== to)
      throw new Error(`${object} cannot take ${transitionId} from ${from} to ${to}.`);
    return [{ object, from, to, transition: transitionId }];
  });
}

function labelOf(
  items: readonly { readonly id: string; readonly label: string }[],
  id: string,
  kind: 'state' | 'object' | 'transition',
) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`The example has no ${kind} called ${id}.`);
  return item.label;
}

/** Names joined as one list in the language's own way, or the word for none when there are none. */
export const listOf = (t: StudyTranslate, words: readonly string[]): string =>
  words.length ? words.join(t('studyCommon.states.listSeparator')) : t('studyCommon.states.empty');

// A complete message owns each phrase, so word order can change with the language; the second
// pair names several objects that took the same way at one step.
const moveMessages = {
  enters: [
    'studyCommon.states.enters',
    'studyCommon.states.entersBy',
    'studyCommon.states.entersMany',
    'studyCommon.states.entersManyBy',
  ],
  leaves: [
    'studyCommon.states.leaves',
    'studyCommon.states.leavesBy',
    'studyCommon.states.leavesMany',
    'studyCommon.states.leavesManyBy',
  ],
  stays: [
    'studyCommon.states.stays',
    'studyCommon.states.staysBy',
    'studyCommon.states.staysMany',
    'studyCommon.states.staysManyBy',
  ],
  move: [
    'studyCommon.states.move',
    'studyCommon.states.moveBy',
    'studyCommon.states.moveMany',
    'studyCommon.states.moveManyBy',
  ],
} as const;

/** One way taken at a step, by every object that took it: from which state to which, and by what. */
function moveSentence(shape: StatesShape, group: readonly StateMove[], t: StudyTranslate): string {
  const [move] = group;
  const kind =
    move.from === null
      ? 'enters'
      : move.to === null
        ? 'leaves'
        : move.from === move.to
          ? 'stays'
          : 'move';
  const [one, oneBy, many, manyBy] = moveMessages[kind];
  const named = move.transition !== undefined;
  const objects = group.map(({ object }) => labelOf(shape.objects, object, 'object'));
  return t(group.length === 1 ? (named ? oneBy : one) : named ? manyBy : many, {
    object: objects[0],
    objects: objects.join(t('studyCommon.states.listSeparator')),
    from: move.from === null ? '' : labelOf(shape.nodes, move.from, 'state'),
    to: move.to === null ? '' : labelOf(shape.nodes, move.to, 'state'),
    transition:
      move.transition === undefined
        ? ''
        : labelOf(shape.transitions, move.transition, 'transition'),
  });
}

/** A step's moves in words, one sentence for each way taken, in the order the ways first occur. */
function movesSentence(shape: StatesShape, moves: readonly StateMove[], t: StudyTranslate): string {
  if (!moves.length) return t('studyCommon.states.nothingMoves');
  const ways = new Map<string, StateMove[]>();
  for (const move of moves) {
    const way = JSON.stringify([move.from, move.to, move.transition ?? null]);
    ways.set(way, [...(ways.get(way) ?? []), move]);
  }
  return [...ways.values()]
    .map((group) => moveSentence(shape, group, t))
    .join(t('studyCommon.states.sentenceSeparator'));
}

/** Every state in the shape's order, with the objects it holds after a step. */
function placementsSentence(
  shape: StatesShape,
  placements: readonly StatePlacement[],
  t: StudyTranslate,
): string {
  return shape.nodes
    .map(({ id, label }) => {
      const objects = listOf(
        t,
        placements
          .filter(({ node }) => node === id)
          .map(({ object }) => labelOf(shape.objects, object, 'object')),
      );
      return t('studyCommon.states.placement', { state: label, objects });
    })
    .join(t('studyCommon.states.sentenceSeparator'));
}

/** A frame of the drawing from one snapshot, the moves into it and its words. */
function frameOf(run: StatesRun, step: number, t: StudyTranslate): StatesFrame {
  const { shape, snapshots, text } = run;
  const snapshot = snapshots[step];
  const words = text[step] ?? {};
  checkSnapshot(shape, snapshot, step);
  const moves = step === 0 ? [] : movesBetween(shape, snapshots[step - 1], snapshot);
  const placements = shape.objects.flatMap(({ id: object }): StatePlacement[] => {
    const node = snapshot.at[object];
    if (node === undefined) return [];
    const note = words.notes?.[object];
    return [note === undefined ? { object, node } : { object, node, note }];
  });
  const movesText = movesSentence(shape, moves, t);
  return {
    step,
    seconds: step * secondsPerFrame,
    moves,
    placements,
    values: {
      ...words.values,
      step: String(step),
      moves: movesText,
      placements: placementsSentence(shape, placements, t),
    },
    note:
      words.note ??
      (step === 0
        ? t('studyCommon.states.startNote')
        : t('studyCommon.states.note', { step, moves: movesText })),
    worked: words.worked,
  };
}

/**
 * Builds a states study from a simulation's snapshots and the presentation's words: the moves of
 * each step are read from where the objects stood before it, so the drawing and the mechanism's
 * spec read the same run. It refuses an example that names a state, object or move it lacks.
 */
export function statesModel(
  run: StatesRun,
  parts: StatesStudyParts,
  t: StudyTranslate,
): StatesStudyModel {
  checkShape(run.shape);
  if (run.snapshots.length < 2) throw new Error('A states example needs at least two moments.');
  if (run.text.length > run.snapshots.length)
    throw new Error('The example has words for more moments than it has.');
  const frames = run.snapshots.map((_, step) => frameOf(run, step, t));
  for (const { label, step } of parts.moments)
    if (step < 0 || step >= frames.length) throw new Error(`Moment ${label} is outside the run.`);
  const states: StatesModel = { ...run.shape, frames };
  return {
    family: 'states',
    states,
    initialStep: parts.initialStep ?? 0,
    moments: parts.moments,
    legend: parts.legend ?? [
      { tone: 'subject', label: t('studyCommon.states.legend.subject') },
      { tone: 'other', label: t('studyCommon.states.legend.other') },
      { tone: 'actual', label: t('studyCommon.states.legend.actual') },
      { tone: 'muted', label: t('studyCommon.states.legend.muted') },
    ],
    caption: parts.caption ?? t('studyCommon.states.caption'),
    ...(parts.comparison ? { comparison: parts.comparison } : {}),
    ...(parts.inputs ? { inputs: parts.inputs } : {}),
  };
}
