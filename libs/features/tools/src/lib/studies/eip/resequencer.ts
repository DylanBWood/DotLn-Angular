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

/**
 * The events of one log reach a projection over a bus that does not keep their order. The
 * resequencer holds each event that comes early and, one frame after it sees an unbroken run from
 * the number it expects, sends that run on in order. One thing happens in each frame. The strings
 * here are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    // The bus delivers whether or not anything listens, so the source is hot.
    bus$: { label: 'bus$', hot: true, marbles: '-1-32-564', values: events },
  },
  operator: 'scan(hold early events, release the run from next), concatMap(that run), delay(1)',
  outputs: {
    inOrder$: { label: 'inOrder$', marbles: '--1--(23)(456)', values: events },
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
    { label: 'evt_3 held', frame: 3 },
    { label: 'Gap fills', frame: 4 },
    { label: 'Two held', frame: 7 },
    { label: 'evt_4 arrives', frame: 8 },
    { label: 'Run of three', frame: 9 },
  ],
  notes: {
    0: 'The Projection needs evt_1 first. No event has come off the Bus, and the Resequencer holds nothing.',
    1: 'The Bus delivers evt_1, a CommandPersisted. It is the number the Resequencer expects, so it goes on in the next step.',
    2: 'The Resequencer sends evt_1 on to the Projection and now expects evt_2.',
    3: 'The Bus delivers evt_3, a CommandResult, before evt_2. Sending it on would show the Projection a result before the receipt that comes ahead of it, so the Resequencer holds it back.',
    4: 'The Bus delivers evt_2, the CommandReceipt, and the gap before evt_3 is filled.',
    5: 'The Resequencer sends evt_2 and then evt_3 on to the Projection, in order, and now expects evt_4.',
    6: 'The Bus delivers evt_5 while evt_4 is still missing, so the Resequencer holds it.',
    7: 'The Bus delivers evt_6, and the Resequencer holds it too: one missing event holds back both that follow it.',
    8: 'The Bus delivers evt_4, the second CommandPersisted, last. The run from evt_4 to evt_6 is now unbroken.',
    9: 'The Resequencer sends evt_4, evt_5 and evt_6 on in order, and the Projection has the whole log.',
  },
  caption:
    "Time runs in frames, one event to a frame. bus$ is the order the events come off the bus, each digit an event's number in its log; inOrder$ is what the resequencer sends on to the projection, in log order, one frame after it sees an unbroken run.",
};

/** The same run drawn as the bus, the resequencer and the projection it feeds. */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'bus', label: 'Bus', stage: 0, kind: 'channel' },
    { id: 'resequencer', label: 'Resequencer', stage: 1, tone: 'subject' },
    { id: 'projection', label: 'Projection', stage: 2 },
  ],
  links: [
    { id: 'deliver', from: 'bus', to: 'resequencer' },
    { id: 'release', from: 'resequencer', to: 'projection', label: 'FIFO' },
  ],
  routes: { bus$: 'deliver', inOrder$: 'release' },
  states: {
    0: {
      bus: 'keeps no order',
      resequencer: 'expects evt_1',
      projection: 'has nothing yet',
    },
    1: { resequencer: 'expects evt_1; has it' },
    2: { resequencer: 'expects evt_2', projection: 'has evt_1' },
    3: { resequencer: 'expects evt_2; holds evt_3' },
    4: { resequencer: 'has evt_2, evt_3' },
    5: { resequencer: 'expects evt_4', projection: 'has up to evt_3' },
    6: { resequencer: 'expects evt_4; holds evt_5' },
    7: { resequencer: 'expects evt_4; holds evt_5, 6' },
    8: { resequencer: 'has evt_4, 5, 6' },
    9: { resequencer: 'expects evt_7', projection: 'has up to evt_6' },
  },
  held: {
    1: { resequencer: ['1'] },
    2: { resequencer: [] },
    3: { resequencer: ['3'] },
    4: { resequencer: ['2', '3'] },
    5: { resequencer: [] },
    6: { resequencer: ['5'] },
    7: { resequencer: ['5', '6'] },
    8: { resequencer: ['4', '5', '6'] },
    9: { resequencer: [] },
  },
  caption:
    'Each token is one event of the log, with its number: 3 is evt_3. The events themselves are not changed, only their order. The Bus is the channel they travel over, and it does not keep their order. The Resequencer holds any event that comes early and, one step after it sees an unbroken run from the number it expects, sends that run down the FIFO channel, which keeps the order. The Projection is the view of the log that must take the events in order. The words in a box say what that box expects or holds. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green; where several tokens do not fit apart, one capsule names them all.',
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
