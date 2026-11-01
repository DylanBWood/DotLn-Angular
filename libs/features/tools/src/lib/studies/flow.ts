import type { StudyParameters } from '@dotln-angular/models';

import { marbleCaption, type MarbleExample, marbleModel } from './rxjs/marbles';
import type {
  FlowFrame,
  FlowHop,
  FlowLink,
  FlowModel,
  FlowNode,
  FlowStudyModel,
  FlowToken,
  StudyLegendEntry,
  StudyMoment,
  StudyWorkedStep,
} from './study-model';
import { secondsPerFrame } from './study-model';

/** A message of a hand-written flow, declared once by id and moved by its steps. */
export interface FlowMessage {
  readonly key: string;
  readonly content: string;
}

/** What changes at one step of a hand-written flow. */
export interface FlowStep {
  /** The messages that cross a link now, by message id, each arriving at the link's far end. */
  readonly moves?: readonly { readonly message: string; readonly link: string }[];
  /**
   * The states that change now, by node id. A node keeps its state until a later step names it
   * again, and an empty string clears it.
   */
  readonly states?: Readonly<Record<string, string>>;
  /** What a node holds after this step, by message id; kept until a later step names the node. */
  readonly held?: Readonly<Record<string, readonly string[]>>;
  /** One plain sentence on what happens at this step. */
  readonly note: string;
  readonly worked?: StudyWorkedStep;
}

/** What every flow names, whichever way its steps are written. */
interface FlowShape {
  readonly nodes: readonly FlowNode[];
  readonly links: readonly FlowLink[];
  /** How to read the drawing; the family's own sentence when absent. */
  readonly caption?: string;
}

/** A flow written step by step: the example of a study whose idea is not a stream to run. */
export interface FlowExample extends FlowShape {
  readonly messages: Readonly<Record<string, FlowMessage>>;
  /** Step 0, before anything moves: the states and holdings the example starts from. */
  readonly start: Omit<FlowStep, 'moves'>;
  /** The steps after the start, in order: the first is step 1. */
  readonly steps: readonly FlowStep[];
  readonly moments: readonly { readonly label: string; readonly step: number }[];
}

/**
 * A flow over an executable marble example. Each frame of the diagram is a step of the flow, and
 * each emission the run delivers crosses the link its line is routed to, so the flow drawing, the
 * marble drawing and the marble spec all read the same strings.
 */
export interface MarbleFlow extends FlowShape {
  /**
   * The link a line's emissions cross, by the line's id in the example: one link for the whole
   * line, or a link for each letter when one line carries messages from several senders. A line
   * with no route crosses no link, as an inner stream an operator opens usually does not.
   */
  readonly routes: Readonly<Record<string, string | Readonly<Record<string, string>>>>;
  /** The states that change at a frame, by node id, carried forward as a hand-written flow's are. */
  readonly states?: Readonly<Record<number, Readonly<Record<string, string>>>>;
  /** What a node holds after a frame, as the letters of the messages, carried forward. */
  readonly held?: Readonly<Record<number, Readonly<Record<string, readonly string[]>>>>;
}

const defaultCaption =
  'A token is a message, with its letter: green while it moves at the selected step, outlined while a node holds it. A node a message leaves or reaches at the step is outlined in green, and the words inside a node say what it holds or decides. Step forward to move the messages on.';

/** How the marble diagram of a flow follows it, after the diagram's own caption. */
const diagramSentence =
  'Each frame of the diagram is the same step of the flow, and switching between the two keeps the moment; an output lane shows only what has been emitted by the selected frame.';

/** What each tone of a flow means; a legend lists only the kinds the flow draws. */
const legendOf = (nodes: readonly FlowNode[], held: boolean): readonly StudyLegendEntry[] => [
  ...(nodes.some(({ tone }) => tone === 'subject')
    ? [{ tone: 'subject' as const, label: 'Bold name · the part the pattern names' }]
    : []),
  { tone: 'other', label: 'Grey outline · the endpoints around it; a tinted pipe is a channel' },
  {
    tone: 'actual',
    label: 'Green · a message moving at this step, and the nodes it leaves or reaches',
  },
  ...(held ? [{ tone: 'muted' as const, label: 'Outlined · a message a node is holding' }] : []),
];

/** Refuses a flow whose parts name something it does not have, so a spec fails at once. */
function checkShape({ nodes, links }: FlowShape) {
  const ids = new Set(nodes.map(({ id }) => id));
  if (ids.size !== nodes.length) throw new Error('Two nodes of the flow share an id.');
  for (const link of links)
    for (const end of [link.from, link.to])
      if (!ids.has(end)) throw new Error(`Link ${link.id} names no node ${end}.`);
  if (new Set(links.map(({ id }) => id)).size !== links.length)
    throw new Error('Two links of the flow share an id.');
}

function checkNodes(nodes: readonly FlowNode[], named: Readonly<Record<string, unknown>>) {
  for (const id of Object.keys(named))
    if (!nodes.some((node) => node.id === id)) throw new Error(`The flow has no node ${id}.`);
}

/** A node's name in prose, as the drawing labels it. */
const nameOf = (nodes: readonly FlowNode[], id: string) =>
  nodes.find((node) => node.id === id)?.label ?? id;

/** What moves at a step, in a sentence: each message, where it goes and the channel it uses. */
function movesSentence(shape: FlowShape, hops: readonly FlowHop[]) {
  if (!hops.length) return 'nothing moves';
  return hops
    .map(({ key, content, link: id }) => {
      const link = shape.links.find((candidate) => candidate.id === id);
      const from = nameOf(shape.nodes, link?.from ?? '');
      const to = nameOf(shape.nodes, link?.to ?? '');
      const label = link?.label ? ` on ${link.label}` : '';
      return `${key} (${content}) moves from ${from} to ${to}${label}`;
    })
    .join('; ');
}

const statesSentence = (nodes: readonly FlowNode[], states: Readonly<Record<string, string>>) =>
  nodes
    .filter(({ id }) => states[id])
    .map(({ id, label }) => `${label}: ${states[id]}`)
    .join('; ') || 'no state to report';

const heldSentence = (
  nodes: readonly FlowNode[],
  held: Readonly<Record<string, readonly FlowToken[]>>,
) =>
  nodes
    .filter(({ id }) => held[id]?.length)
    .map(({ id, label }) => `${label} holds ${held[id].map(({ key }) => key).join(', ')}`)
    .join('; ') || 'nothing is held';

/** The record's parameters as text, so the prose may name them with `{name}` placeholders. */
const parameterValues = (parameters: StudyParameters) =>
  Object.fromEntries(Object.entries(parameters).map(([name, value]) => [name, String(value)]));

/** One frame of a flow from what has moved and what is now held. */
function frameOf(
  shape: FlowShape,
  step: number,
  hops: readonly FlowHop[],
  states: Readonly<Record<string, string>>,
  held: Readonly<Record<string, readonly FlowToken[]>>,
  extra: Readonly<Record<string, string>>,
  note: string | undefined,
  worked: StudyWorkedStep | undefined,
): FlowFrame {
  const moves = movesSentence(shape, hops);
  return {
    step,
    seconds: step * secondsPerFrame,
    hops,
    states,
    held,
    values: {
      ...extra,
      step: String(step),
      moves,
      states: statesSentence(shape.nodes, states),
      held: heldSentence(shape.nodes, held),
    },
    note: note ?? (step === 0 ? 'Nothing has moved yet.' : `At step ${step}, ${moves}.`),
    worked,
  };
}

/** States after a step: the earlier ones, with this step's changes, an empty string clearing one. */
const nextStates = (
  states: Readonly<Record<string, string>>,
  changes: Readonly<Record<string, string>> = {},
) =>
  Object.fromEntries(
    Object.entries({ ...states, ...changes }).filter(([, text]) => text !== ''),
  ) as Readonly<Record<string, string>>;

function studyOf(
  shape: FlowShape,
  frames: readonly FlowFrame[],
  moments: readonly StudyMoment[],
  diagram: FlowStudyModel['diagram'],
): FlowStudyModel {
  const last = frames.length - 1;
  for (const { label, step } of moments)
    if (step < 0 || step > last) throw new Error(`Moment ${label} is outside the flow.`);
  const flow: FlowModel = { nodes: shape.nodes, links: shape.links, frames };
  return {
    family: 'flow',
    flow,
    diagram,
    // A flow opens at its start, before anything moves, so a reader steps through it in order.
    initialStep: 0,
    moments,
    legend: legendOf(
      shape.nodes,
      frames.some(({ held }) => Object.values(held).some((tokens) => tokens.length)),
    ),
    caption: shape.caption ?? defaultCaption,
  };
}

/** The drawing's model for a flow written step by step. */
export function flowModel(example: FlowExample, parameters: StudyParameters = {}): FlowStudyModel {
  checkShape(example);
  const tokenOf = (id: string): FlowToken => {
    const message = example.messages[id];
    if (!message) throw new Error(`The flow has no message ${id}.`);
    return message;
  };
  const values = parameterValues(parameters);
  let states: Readonly<Record<string, string>> = {};
  let held: Readonly<Record<string, readonly FlowToken[]>> = {};
  const frames = [{ ...example.start, moves: [] }, ...example.steps].map(
    (step, index): FlowFrame => {
      checkNodes(example.nodes, { ...step.states, ...step.held });
      const hops = (step.moves ?? []).map(({ message, link }): FlowHop => {
        if (!example.links.some(({ id }) => id === link))
          throw new Error(`The flow has no link ${link}.`);
        return { ...tokenOf(message), link };
      });
      states = nextStates(states, step.states);
      held = {
        ...held,
        ...Object.fromEntries(
          Object.entries(step.held ?? {}).map(([node, ids]) => [node, ids.map(tokenOf)]),
        ),
      };
      return frameOf(example, index, hops, states, held, values, step.note, step.worked);
    },
  );
  return studyOf(example, frames, example.moments, null);
}

/**
 * The drawing's model for a flow over an executable marble example: the flow's steps are the
 * diagram's frames, and the model carries the diagram too, so a reader can switch to it.
 */
export function flowFromMarbles(
  example: MarbleExample,
  flow: MarbleFlow,
  parameters: StudyParameters = {},
): FlowStudyModel {
  checkShape(flow);
  const run = marbleModel(example, parameters);
  const { lines } = run.marbles;
  for (const id of Object.keys(flow.routes))
    if (!lines.some((line) => line.id === id)) throw new Error(`The example has no line ${id}.`);
  const linkOf = (lineId: string, key: string) => {
    const route = flow.routes[lineId];
    const link = typeof route === 'string' ? route : route?.[key];
    if (link !== undefined && !flow.links.some(({ id }) => id === link))
      throw new Error(`The flow has no link ${link}.`);
    return link;
  };
  // A held message is named by its letter; what it says is what the example's values say.
  const events = lines.flatMap((line) => line.events);
  const contentOf = (key: string) => {
    const event = events.find((candidate) => candidate.key === key);
    if (!event) throw new Error(`The example has no message ${key}.`);
    return event.value;
  };
  // A state or a holding is set at a step of the run, so it names a frame the run has.
  const steps = new Set(run.marbles.frames.map(({ frame }) => frame));
  for (const at of [...Object.keys(flow.states ?? {}), ...Object.keys(flow.held ?? {})])
    if (!steps.has(Number(at))) throw new Error(`The flow has no step ${at}.`);
  let states: Readonly<Record<string, string>> = {};
  let held: Readonly<Record<string, readonly FlowToken[]>> = {};
  const frames = run.marbles.frames.map((marbleFrame): FlowFrame => {
    const { frame } = marbleFrame;
    const changes = flow.states?.[frame] ?? {};
    const holding = flow.held?.[frame] ?? {};
    checkNodes(flow.nodes, { ...changes, ...holding });
    const hops = lines.flatMap(({ id, events }) =>
      events
        .filter((event) => event.frame === frame && event.kind === 'next' && event.delivered)
        .flatMap((event): FlowHop[] => {
          const link = linkOf(id, event.key);
          return link ? [{ key: event.key, content: event.value, link }] : [];
        }),
    );
    states = nextStates(states, changes);
    held = {
      ...held,
      ...Object.fromEntries(
        Object.entries(holding).map(([node, keys]) => [
          node,
          keys.map((key) => ({ key, content: contentOf(key) })),
        ]),
      ),
    };
    // The marble frame's values stay readable too: {frame}, {now} and {delivered}.
    return frameOf(
      flow,
      frame,
      hops,
      states,
      held,
      marbleFrame.values,
      example.notes?.[frame],
      marbleFrame.worked,
    );
  });
  return studyOf(flow, frames, run.moments, {
    marbles: run.marbles,
    legend: run.legend,
    caption: `${marbleCaption(example)} ${diagramSentence}`,
  });
}
