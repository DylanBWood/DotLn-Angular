import { delay, filter, map, type Observable, share, withLatestFrom } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** A release close as the recipient list receives it: the order, and the release it publishes. */
export interface Close {
  readonly order: string;
  /** The tag the close publishes, or `none` for a close that publishes no release. */
  readonly release: string;
}

/**
 * Who one close goes to, computed when it arrives: every sibling declared at that moment when
 * the close publishes a release, and nobody when it publishes none.
 */
export const recipientsOf = (close: Close, declared: readonly string[]): readonly string[] =>
  close.release === 'none' ? [] : declared;

/** The three closes, each named by the last digit of its order: 0 is WO-240, 1 and 2 the next. */
const closes = {
  0: { order: 'WO-240', release: 'v0.95.0' },
  1: { order: 'WO-241', release: 'none' },
  2: { order: 'WO-242', release: 'v0.96.0' },
} as const satisfies Readonly<Record<number, Close>>;

/**
 * Siblings A and B are declared, then three closes arrive while a third sibling, C, is declared
 * between the second and the third. The recipient list works out each close's list when the close
 * arrives and, the step after, sends every sibling on it its own copy and writes the list to the
 * close record. One thing happens in each step. The strings here are what the spec beside this
 * file asserts, and what both the flow drawing and the marble drawing read.
 */
export const example: MarbleExample = {
  inputs: {
    closes$: {
      label: 'closes$',
      // Hot: orders close whether or not anything is listening.
      hot: true,
      marbles: '--0-1--2|',
      values: closes,
    },
    declared$: {
      label: 'declared$',
      // Hot: x declares siblings A and B, and y adds C.
      hot: true,
      marbles: '-x----y',
      values: { x: ['A', 'B'], y: ['A', 'B', 'C'] },
    },
  },
  operator: 'withLatestFrom(declared$), map to a list, delay(1), share',
  outputs: {
    toA$: { label: 'toA$', marbles: '---0----(2|)', values: { 0: closes[0], 2: closes[2] } },
    toB$: { label: 'toB$', marbles: '---0----(2|)', values: { 0: closes[0], 2: closes[2] } },
    toC$: { label: 'toC$', marbles: '--------(2|)', values: { 2: closes[2] } },
    record$: {
      label: 'record$',
      marbles: '---p-q--(r|)',
      values: {
        p: { order: 'WO-240', refreshed: 'A, B' },
        q: { order: 'WO-241', refreshed: 'none' },
        r: { order: 'WO-242', refreshed: 'A, B, C' },
      },
    },
  },
  run: ({ inputs }) => {
    // The digits stand for closes and x and y for the declared siblings, as the values above say.
    const closes$ = inputs['closes$'] as Observable<Close>;
    const declared$ = inputs['declared$'] as Observable<readonly string[]>;
    const listed$ = closes$.pipe(
      // The list for each close is computed from the siblings declared at that moment.
      withLatestFrom(declared$),
      map(([close, declared]) => ({ close, to: recipientsOf(close, declared) })),
      // The copies go out one step after the close arrives.
      delay(1),
      // One list per close, however many channels read it.
      share(),
    );
    // The list is recorded with the dispatch, an empty one included.
    const record$ = listed$.pipe(
      map(({ close, to }) => ({ order: close.order, refreshed: to.join(', ') || 'none' })),
    );
    // Each recipient on the list gets its own copy of the close.
    const copyFor = (sibling: string) =>
      listed$.pipe(
        filter(({ to }) => to.includes(sibling)),
        map(({ close }) => ({ ...close })),
      );
    const toA$ = copyFor('A');
    const toB$ = copyFor('B');
    const toC$ = copyFor('C');
    return { toA$, toB$, toC$, record$ };
  },
  moments: [
    { label: 'The first list', frame: 2 },
    { label: 'Two copies', frame: 3 },
    { label: 'An empty list', frame: 4 },
    { label: 'C is declared', frame: 6 },
    { label: 'Three copies', frame: 8 },
  ],
  notes: {
    0: 'Nothing has been sent. No order has closed, and the Recipient list does not yet know which siblings receive releases.',
    1: 'Declared siblings sends x to the Recipient list: Sibling A and Sibling B are the siblings a release goes to.',
    2: 'Release close sends close 0 to the Recipient list: order WO-240 has closed and published v0.95.0. The list works out who gets it: every declared sibling, A and B.',
    3: 'The Recipient list sends a copy of close 0 to Sibling A and another to Sibling B, each on its own main branch, and sends entry p, WO-240 to A and B, to the Close record.',
    4: 'Release close sends close 1: order WO-241 changed another repository and closes without a release. The list for it is empty.',
    5: 'The Recipient list sends no copy at all, and sends entry q, WO-241 to none, to the Close record, so the empty list is on record too.',
    6: 'Declared siblings sends y to the Recipient list: Sibling C now receives releases as well. Nothing already sent is sent again, so C still has none.',
    7: 'Release close sends close 2: order WO-242 has closed and published v0.96.0. The list is worked out now, from A, B and C.',
    8: "The Recipient list sends a copy of close 2 to each of A, B and C and entry r to the Close record, and the closes end. Three closes made five copies, and v0.96.0 is C's first release.",
  },
  caption:
    "Time runs in frames, one event to a frame. closes$ is what release close sends: 0, 1 and 2 are the closes of WO-240, WO-241 and WO-242. declared$ is the declared siblings: x is A and B, y adds C. toA$, toB$ and toC$ are the three siblings' channels and record$ is the close record; a close leaves on every channel its list names, one frame after it arrives.",
};

/**
 * The same run drawn as endpoints and channels: what the list reads, the list and the record it
 * keeps, and the siblings it sends to.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'close', label: 'Release close', stage: 0 },
    { id: 'declared', label: 'Declared siblings', stage: 0, row: 1 },
    { id: 'list', label: 'Recipient list', stage: 1, tone: 'subject' },
    { id: 'record', label: 'Close record', stage: 1, row: 1 },
    { id: 'a', label: 'Sibling A', stage: 2 },
    { id: 'b', label: 'Sibling B', stage: 2, row: 1 },
    { id: 'c', label: 'Sibling C', stage: 2, row: 2 },
  ],
  links: [
    { id: 'closes', from: 'close', to: 'list' },
    { id: 'declare', from: 'declared', to: 'list' },
    { id: 'to-record', from: 'list', to: 'record' },
    { id: 'to-a', from: 'list', to: 'a' },
    { id: 'to-b', from: 'list', to: 'b' },
    { id: 'to-c', from: 'list', to: 'c' },
  ],
  routes: {
    closes$: 'closes',
    declared$: 'declare',
    record$: 'to-record',
    toA$: 'to-a',
    toB$: 'to-b',
    toC$: 'to-c',
  },
  states: {
    0: {
      close: 'nothing closed yet',
      declared: 'A and B',
      list: 'knows no siblings',
      record: 'no entries',
      a: 'no release',
      b: 'no release',
      c: 'not set up',
    },
    1: { list: 'siblings: A, B' },
    2: { close: 'WO-240: v0.95.0', list: 'WO-240 to A, B' },
    3: { list: 'siblings: A, B', record: 'one entry', a: 'v0.95.0', b: 'v0.95.0' },
    4: { close: 'WO-241: no release', list: 'WO-241 to nobody' },
    5: { list: 'siblings: A, B', record: 'two entries' },
    6: { declared: 'A, B and C', list: 'siblings: A, B, C', c: 'no release' },
    7: { close: 'WO-242: v0.96.0', list: 'WO-242 to A, B, C' },
    8: {
      close: 'all three closed',
      list: 'siblings: A, B, C',
      record: 'three entries',
      a: 'v0.96.0',
      b: 'v0.96.0',
      c: 'v0.96.0, first',
    },
  },
  held: {
    2: { list: ['0'] },
    3: { list: [], record: ['p'], a: ['0'], b: ['0'] },
    4: { list: ['1'] },
    5: { list: [], record: ['p', 'q'] },
    7: { list: ['2'] },
    8: { list: [], record: ['p', 'q', 'r'], a: ['2'], b: ['2'], c: ['2'] },
  },
  caption:
    "Tokens 0, 1 and 2 are the closes of orders WO-240, WO-241 and WO-242, named by the last digit of the order; x declares siblings A and B and y adds C; p, q and r are the close record's entries for closes 0, 1 and 2. Release close is the step that finishes an order and may publish a release. Declared siblings is the set of repositories that receive releases, and Sibling A, B and C are those repositories; each sibling's main branch is its own channel, so a line into a sibling is that sibling's channel. The Recipient list works out, for each close, which siblings get it, holding the close for a step while it does, and the Close record keeps each close's list. The words in a box say what that box holds or knows. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
