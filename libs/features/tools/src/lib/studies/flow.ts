import type { StudyParameters } from '@dotln-angular/models';

import { marbleCaption, type MarbleExample, marbleModel } from './rxjs/marbles';
import { type StudyMessage, studyMessage, studyParameterValues } from './study-message';
import type {
  FlowFrame,
  FlowHop,
  FlowLink,
  FlowModel,
  FlowNode,
  FlowStudyModel,
  FlowToken,
  MarblesStudyModel,
  StudyLegendEntry,
  StudyMoment,
  StudyWorkedStep,
} from './study-model';
import { secondsPerFrame } from './study-model';
import type { StudyTranslate } from './study-translate';

/** A message's identity stays executable; its content is a presentation message. */
export interface FlowMessage {
  readonly key: string;
  readonly content: StudyMessage;
}

export interface FlowWorkedStep {
  readonly title: StudyMessage;
  readonly lines: readonly StudyMessage[];
  readonly note?: StudyMessage;
}

/** One change to a hand-written flow, with holdings named by message id. */
export interface FlowStep {
  readonly moves?: readonly {
    readonly message: string;
    readonly link: string;
  }[];
  /** Changes persist; an empty string clears a state. */
  readonly states?: Readonly<Record<string, StudyMessage>>;
  readonly held?: Readonly<Record<string, readonly string[]>>;
  readonly note: StudyMessage;
  readonly worked?: FlowWorkedStep;
}

interface FlowShape {
  readonly nodes: readonly (Omit<FlowNode, 'label'> & {
    readonly label: StudyMessage;
  })[];
  readonly links: readonly (Omit<FlowLink, 'label'> & {
    readonly label?: StudyMessage;
  })[];
  readonly caption?: StudyMessage;
  readonly parameterMessages?: Readonly<Record<string, string>>;
}

interface RenderedFlowShape {
  readonly nodes: readonly FlowNode[];
  readonly links: readonly FlowLink[];
  readonly caption: string;
}

/** A structure, data model or protocol written step by step instead of pretending to run. */
export interface FlowExample extends FlowShape {
  readonly messages: Readonly<Record<string, FlowMessage>>;
  readonly start: Omit<FlowStep, 'moves'>;
  readonly steps: readonly FlowStep[];
  readonly moments: readonly {
    readonly label: StudyMessage;
    readonly step: number;
  }[];
}

/** Each frame of the executable example is one step, routed by line id and marble letter. */
export interface MarbleFlow extends FlowShape {
  readonly routes: Readonly<Record<string, string | Readonly<Record<string, string>>>>;
  readonly states?: Readonly<Record<number, Readonly<Record<string, StudyMessage>>>>;
  readonly held?: Readonly<Record<number, Readonly<Record<string, readonly string[]>>>>;
}

const renderedShape = (shape: FlowShape, t: StudyTranslate): RenderedFlowShape => ({
  nodes: shape.nodes.map((node) => ({
    ...node,
    label: studyMessage(t, node.label),
  })),
  links: shape.links.map((link) => ({
    ...link,
    label: link.label === undefined ? undefined : studyMessage(t, link.label),
  })),
  caption: studyMessage(t, shape.caption ?? 'studyCommon.flow.caption'),
});

const legendOf = (
  nodes: readonly FlowNode[],
  held: boolean,
  t: StudyTranslate,
): readonly StudyLegendEntry[] => [
  ...(nodes.some(({ tone }) => tone === 'subject')
    ? [
        {
          tone: 'subject' as const,
          label: t('studyCommon.flow.legend.subject'),
        },
      ]
    : []),
  { tone: 'other', label: t('studyCommon.flow.legend.other') },
  { tone: 'actual', label: t('studyCommon.flow.legend.actual') },
  ...(held ? [{ tone: 'muted' as const, label: t('studyCommon.flow.legend.muted') }] : []),
];

/** Refuse invalid identities before constructing any displayed frame. */
function checkShape({ nodes, links }: FlowShape) {
  const ids = new Set(nodes.map(({ id }) => id));
  if (ids.size !== nodes.length) throw new Error('Two nodes of the flow share an id.');
  for (const link of links)
    for (const end of [link.from, link.to])
      if (!ids.has(end)) throw new Error(`Link ${link.id} names no node ${end}.`);
  if (new Set(links.map(({ id }) => id)).size !== links.length)
    throw new Error('Two links of the flow share an id.');
}

function checkNodes(nodes: FlowShape['nodes'], named: Readonly<Record<string, unknown>>) {
  for (const id of Object.keys(named))
    if (!nodes.some((node) => node.id === id)) throw new Error(`The flow has no node ${id}.`);
}

const nodeName = (nodes: readonly FlowNode[], id: string): string => {
  const node = nodes.find((node) => node.id === id);
  if (!node) throw new Error(`The flow has no node ${id}.`);
  return node.label;
};

/** A complete message template owns the channel phrase, so word order can change with locale. */
function movesSentence(
  shape: RenderedFlowShape,
  hops: readonly FlowHop[],
  t: StudyTranslate,
): string {
  if (!hops.length) return t('studyCommon.flow.nothingMoves');
  return hops
    .map(({ key, content, link: id }) => {
      const link = shape.links.find((candidate) => candidate.id === id);
      if (!link) throw new Error(`The flow has no link ${id}.`);
      const params = {
        key,
        content,
        from: nodeName(shape.nodes, link.from),
        to: nodeName(shape.nodes, link.to),
      };
      return link.label
        ? t('studyCommon.flow.moveOnChannel', {
            ...params,
            channel: link.label,
          })
        : t('studyCommon.flow.move', params);
    })
    .join(t('studyCommon.flow.sentenceSeparator'));
}

const statesSentence = (
  nodes: readonly FlowNode[],
  states: Readonly<Record<string, string>>,
  t: StudyTranslate,
): string =>
  nodes
    .filter(({ id }) => states[id])
    .map(({ id, label }) => t('studyCommon.flow.state', { label, state: states[id] }))
    .join(t('studyCommon.flow.sentenceSeparator')) || t('studyCommon.flow.noState');

const heldSentence = (
  nodes: readonly FlowNode[],
  held: Readonly<Record<string, readonly FlowToken[]>>,
  t: StudyTranslate,
): string =>
  nodes
    .filter(({ id }) => held[id]?.length)
    .map(({ id, label }) =>
      t('studyCommon.flow.held', {
        label,
        keys: held[id].map(({ key }) => key).join(t('studyCommon.flow.listSeparator')),
      }),
    )
    .join(t('studyCommon.flow.sentenceSeparator')) || t('studyCommon.flow.nothingHeld');

function frameOf(
  shape: RenderedFlowShape,
  step: number,
  hops: readonly FlowHop[],
  states: Readonly<Record<string, string>>,
  held: Readonly<Record<string, readonly FlowToken[]>>,
  extra: Readonly<Record<string, string>>,
  note: string | undefined,
  worked: StudyWorkedStep | undefined,
  t: StudyTranslate,
): FlowFrame {
  const moves = movesSentence(shape, hops, t);
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
      states: statesSentence(shape.nodes, states, t),
      held: heldSentence(shape.nodes, held, t),
    },
    note:
      note ??
      (step === 0 ? t('studyCommon.flow.startNote') : t('studyCommon.flow.note', { step, moves })),
    worked,
  };
}

/** Translate new states once; keep earlier states until changed or explicitly cleared. */
const nextStates = (
  states: Readonly<Record<string, string>>,
  changes: Readonly<Record<string, StudyMessage>> = {},
  t: StudyTranslate,
): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Object.entries({
      ...states,
      ...Object.fromEntries(
        Object.entries(changes).map(([id, message]) => [
          id,
          message === '' ? '' : studyMessage(t, message),
        ]),
      ),
    }).filter(([, text]) => text !== ''),
  );

const workedStep = (
  worked: FlowWorkedStep | undefined,
  t: StudyTranslate,
): StudyWorkedStep | undefined =>
  worked === undefined
    ? undefined
    : {
        title: studyMessage(t, worked.title),
        lines: worked.lines.map((line) => studyMessage(t, line)),
        note: worked.note === undefined ? undefined : studyMessage(t, worked.note),
      };

function studyOf(
  shape: RenderedFlowShape,
  frames: readonly FlowFrame[],
  moments: readonly StudyMoment[],
  diagram: FlowStudyModel['diagram'],
  t: StudyTranslate,
): FlowStudyModel {
  const last = frames.length - 1;
  for (const { label, step } of moments)
    if (step < 0 || step > last) throw new Error(`Moment ${label} is outside the flow.`);
  const flow: FlowModel = { nodes: shape.nodes, links: shape.links, frames };
  return {
    family: 'flow',
    flow,
    diagram,
    initialStep: 0,
    moments,
    legend: legendOf(
      shape.nodes,
      frames.some(({ held }) => Object.values(held).some((tokens) => tokens.length)),
      t,
    ),
    caption: shape.caption,
  };
}

function handWrittenFrames(
  example: FlowExample,
  shape: RenderedFlowShape,
  parameters: StudyParameters,
  t: StudyTranslate,
): readonly FlowFrame[] {
  const tokenOf = (id: string): FlowToken => {
    const message = example.messages[id];
    if (!message) throw new Error(`The flow has no message ${id}.`);
    return { key: message.key, content: studyMessage(t, message.content) };
  };
  const values = studyParameterValues(parameters, t, example.parameterMessages);
  let states: Readonly<Record<string, string>> = {};
  let held: Readonly<Record<string, readonly FlowToken[]>> = {};
  return [{ ...example.start, moves: [] }, ...example.steps].map((step, index): FlowFrame => {
    checkNodes(example.nodes, { ...step.states, ...step.held });
    const hops = (step.moves ?? []).map(({ message, link }): FlowHop => {
      if (!example.links.some(({ id }) => id === link))
        throw new Error(`The flow has no link ${link}.`);
      return { ...tokenOf(message), link };
    });
    states = nextStates(states, step.states, t);
    held = {
      ...held,
      ...Object.fromEntries(
        Object.entries(step.held ?? {}).map(([node, ids]) => [node, ids.map(tokenOf)]),
      ),
    };
    return frameOf(
      shape,
      index,
      hops,
      states,
      held,
      values,
      studyMessage(t, step.note),
      workedStep(step.worked, t),
      t,
    );
  });
}

export function flowModel(
  example: FlowExample,
  parameters: StudyParameters,
  t: StudyTranslate,
): FlowStudyModel {
  checkShape(example);
  const shape = renderedShape(example, t);
  const moments = example.moments.map(({ label, step }) => ({
    label: studyMessage(t, label),
    step,
  }));
  return studyOf(shape, handWrittenFrames(example, shape, parameters, t), moments, null, t);
}

function checkedRoutes(flow: MarbleFlow, run: MarblesStudyModel) {
  const { lines, frames } = run.marbles;
  for (const id of Object.keys(flow.routes))
    if (!lines.some((line) => line.id === id)) throw new Error(`The example has no line ${id}.`);
  const steps = new Set(frames.map(({ frame }) => frame));
  for (const at of [...Object.keys(flow.states ?? {}), ...Object.keys(flow.held ?? {})])
    if (!steps.has(Number(at))) throw new Error(`The flow has no step ${at}.`);
  return (lineId: string, key: string): string | undefined => {
    const route = flow.routes[lineId];
    const link = typeof route === 'string' ? route : route?.[key];
    if (link !== undefined && !flow.links.some(({ id }) => id === link))
      throw new Error(`The flow has no link ${link}.`);
    return link;
  };
}

/** Use the already rendered event value for both a moving token and a held copy of it. */
function heldMessages(run: MarblesStudyModel) {
  const events = run.marbles.lines.flatMap((line) => line.events);
  return (keys: readonly string[]): readonly FlowToken[] =>
    keys.map((key) => {
      const event = events.find((candidate) => candidate.key === key);
      if (!event) throw new Error(`The example has no message ${key}.`);
      return { key, content: event.value };
    });
}

function marbleFrames(
  example: MarbleExample,
  flow: MarbleFlow,
  shape: RenderedFlowShape,
  run: MarblesStudyModel,
  t: StudyTranslate,
): readonly FlowFrame[] {
  const linkOf = checkedRoutes(flow, run);
  const tokensOf = heldMessages(run);
  let states: Readonly<Record<string, string>> = {};
  let held: Readonly<Record<string, readonly FlowToken[]>> = {};
  return run.marbles.frames.map(({ frame, values, worked }): FlowFrame => {
    const changes = flow.states?.[frame] ?? {};
    const holding = flow.held?.[frame] ?? {};
    checkNodes(flow.nodes, { ...changes, ...holding });
    const hops = run.marbles.lines.flatMap(({ id, events }) =>
      events
        .filter((event) => event.frame === frame && event.kind === 'next' && event.delivered)
        .flatMap((event): FlowHop[] => {
          const link = linkOf(id, event.key);
          return link ? [{ key: event.key, content: event.value, link }] : [];
        }),
    );
    states = nextStates(states, changes, t);
    held = {
      ...held,
      ...Object.fromEntries(Object.entries(holding).map(([node, keys]) => [node, tokensOf(keys)])),
    };
    const note = example.notes?.[frame];
    return frameOf(
      shape,
      frame,
      hops,
      states,
      held,
      values,
      note === undefined ? undefined : studyMessage(t, note),
      worked,
      t,
    );
  });
}

/** The stream, flow and marble drawings all keep the same frames and payload identities. */
export function flowFromMarbles(
  example: MarbleExample,
  flow: MarbleFlow,
  parameters: StudyParameters,
  t: StudyTranslate,
): FlowStudyModel {
  checkShape(flow);
  const shape = renderedShape(flow, t);
  const run = marbleModel(example, parameters, t);
  const frames = marbleFrames(example, flow, shape, run, t);
  return studyOf(
    shape,
    frames,
    run.moments,
    {
      marbles: run.marbles,
      legend: run.legend,
      caption: t('studyCommon.flow.diagramCaption', {
        caption: marbleCaption(example, t),
        diagram: t('studyCommon.flow.diagram'),
      }),
    },
    t,
  );
}
