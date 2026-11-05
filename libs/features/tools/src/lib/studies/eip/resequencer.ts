import { concatMap, delay, type Observable, scan } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** An event of one log as the bus delivers it: the identity its log gave it, and its type. */
export interface LogEvent {
  readonly eventId: string;
  readonly type: string;
}

/** What the resequencer keeps between arrivals, and the run of events one arrival lets out. */
export interface Holding {
  /** The number of the event the projection needs next. */
  readonly next: number;
  /** Events that arrived before the one with the next number, in no particular order. */
  readonly held: readonly LogEvent[];
  /** The unbroken run this arrival released, in order; often empty. */
  readonly released: readonly LogEvent[];
}

/** The number in an `evt_<n>` identity: where the event stands in its log. */
const sequenceOf = ({ eventId }: LogEvent) => Number(eventId.slice('evt_'.length));

/**
 * Takes the unbroken run that starts at the next number out of the held events, in order, and
 * says which number to wait for after it. An event below the next number is never taken out.
 */
export function release(
  next: number,
  held: readonly LogEvent[],
  released: readonly LogEvent[] = [],
): Holding {
  const event = held.find((candidate) => sequenceOf(candidate) === next);
  return event
    ? release(
        next + 1,
        held.filter((other) => other !== event),
        [...released, event],
      )
    : { next, held, released };
}

/** Before anything arrives: the projection needs evt_1 and nothing is held. */
export const start: Holding = { next: 1, held: [], released: [] };

/** Six events of one log, two commands each persisted, acknowledged and answered, by number. */
const events = {
  1: { eventId: 'evt_1', type: 'CommandPersisted' },
  2: { eventId: 'evt_2', type: 'CommandReceipt' },
  3: { eventId: 'evt_3', type: 'CommandResult' },
  4: { eventId: 'evt_4', type: 'CommandPersisted' },
  5: { eventId: 'evt_5', type: 'CommandReceipt' },
  6: { eventId: 'evt_6', type: 'CommandResult' },
} as const;

const waiting = ['5', '6'];
const releasedTogether = ['4', ...waiting];

/**
 * The events of one log reach a projection over a bus that does not keep their order. The
 * resequencer holds each event that comes early and, one frame after it sees an unbroken run from
 * the number it expects, sends that run on in order. One thing happens in each frame. The strings
 * here are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    // The bus delivers whether or not anything listens, so the source is hot.
    bus$: {
      label: 'studyEip.resequencer.model.example.inputs.bus.label',
      hot: true,
      marbles: '-1-32-564',
      values: events,
      valueMessages: {
        '1': 'studyEip.resequencer.model.example.inputs.bus.values.1',
        '2': 'studyEip.resequencer.model.example.inputs.bus.values.2',
        '3': 'studyEip.resequencer.model.example.inputs.bus.values.3',
        '4': 'studyEip.resequencer.model.example.inputs.bus.values.4',
        '5': 'studyEip.resequencer.model.example.inputs.bus.values.5',
        '6': 'studyEip.resequencer.model.example.inputs.bus.values.6',
      },
    },
  },
  operator: 'studyEip.resequencer.model.example.operator',
  outputs: {
    inOrder$: {
      label: 'studyEip.resequencer.model.example.outputs.inOrder.label',
      marbles: '--1--(23)(456)',
      values: events,
      valueMessages: {
        '1': 'studyEip.resequencer.model.example.outputs.inOrder.values.1',
        '2': 'studyEip.resequencer.model.example.outputs.inOrder.values.2',
        '3': 'studyEip.resequencer.model.example.outputs.inOrder.values.3',
        '4': 'studyEip.resequencer.model.example.outputs.inOrder.values.4',
        '5': 'studyEip.resequencer.model.example.outputs.inOrder.values.5',
        '6': 'studyEip.resequencer.model.example.outputs.inOrder.values.6',
      },
    },
  },
  run: ({ inputs }) => {
    // The bus's events are the records its marble string's digits stand for.
    const bus$ = inputs['bus$'] as Observable<LogEvent>;
    const inOrder$ = bus$.pipe(
      // Buffer: hold each early event; release takes out only the unbroken run from next.
      scan(({ next, held }, event) => release(next, [...held, event]), start),
      // Release: send that run on, one event after another, in sequence order.
      concatMap(({ released }) => released),
      // The run goes on one frame after the event that completed it.
      delay(1),
    );
    return { inOrder$ };
  },
  moments: [
    { label: 'studyEip.resequencer.model.example.moments.0.label', frame: 3 },
    { label: 'studyEip.resequencer.model.example.moments.1.label', frame: 4 },
    {
      label: {
        key: 'studyEip.resequencer.model.example.moments.2.label',
        params: { held: waiting.length },
      },
      frame: 7,
    },
    { label: 'studyEip.resequencer.model.example.moments.3.label', frame: 8 },
    {
      label: {
        key: 'studyEip.resequencer.model.example.moments.4.label',
        params: { released: releasedTogether.length },
      },
      frame: 9,
    },
  ],
  notes: {
    0: 'studyEip.resequencer.model.example.notes.0',
    1: 'studyEip.resequencer.model.example.notes.1',
    2: 'studyEip.resequencer.model.example.notes.2',
    3: 'studyEip.resequencer.model.example.notes.3',
    4: 'studyEip.resequencer.model.example.notes.4',
    5: 'studyEip.resequencer.model.example.notes.5',
    6: 'studyEip.resequencer.model.example.notes.6',
    7: { key: 'studyEip.resequencer.model.example.notes.7', params: { held: waiting.length } },
    8: 'studyEip.resequencer.model.example.notes.8',
    9: 'studyEip.resequencer.model.example.notes.9',
  },
  caption: 'studyEip.resequencer.model.example.caption',
};

/** The same run drawn as the bus, the resequencer and the projection it feeds. */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'bus',
      label: 'studyEip.resequencer.model.flow.nodes.0.label',
      stage: 0,
      kind: 'channel',
    },
    {
      id: 'resequencer',
      label: 'studyEip.resequencer.model.flow.nodes.1.label',
      stage: 1,
      tone: 'subject',
    },
    {
      id: 'projection',
      label: 'studyEip.resequencer.model.flow.nodes.2.label',
      stage: 2,
    },
  ],
  links: [
    { id: 'deliver', from: 'bus', to: 'resequencer' },
    {
      id: 'release',
      from: 'resequencer',
      to: 'projection',
      label: 'studyEip.resequencer.model.flow.links.1.label',
    },
  ],
  routes: { bus$: 'deliver', inOrder$: 'release' },
  states: {
    0: {
      bus: 'studyEip.resequencer.model.flow.states.0.bus',
      resequencer: 'studyEip.resequencer.model.flow.states.0.resequencer',
      projection: 'studyEip.resequencer.model.flow.states.0.projection',
    },
    1: { resequencer: 'studyEip.resequencer.model.flow.states.1.resequencer' },
    2: {
      resequencer: 'studyEip.resequencer.model.flow.states.2.resequencer',
      projection: 'studyEip.resequencer.model.flow.states.2.projection',
    },
    3: { resequencer: 'studyEip.resequencer.model.flow.states.3.resequencer' },
    4: { resequencer: 'studyEip.resequencer.model.flow.states.4.resequencer' },
    5: {
      resequencer: 'studyEip.resequencer.model.flow.states.5.resequencer',
      projection: 'studyEip.resequencer.model.flow.states.5.projection',
    },
    6: { resequencer: 'studyEip.resequencer.model.flow.states.6.resequencer' },
    7: { resequencer: 'studyEip.resequencer.model.flow.states.7.resequencer' },
    8: { resequencer: 'studyEip.resequencer.model.flow.states.8.resequencer' },
    9: {
      resequencer: 'studyEip.resequencer.model.flow.states.9.resequencer',
      projection: 'studyEip.resequencer.model.flow.states.9.projection',
    },
  },
  held: {
    1: { resequencer: ['1'] },
    2: { resequencer: [] },
    3: { resequencer: ['3'] },
    4: { resequencer: ['2', '3'] },
    5: { resequencer: [] },
    6: { resequencer: ['5'] },
    7: { resequencer: waiting },
    8: { resequencer: releasedTogether },
    9: { resequencer: [] },
  },
  caption: 'studyEip.resequencer.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
