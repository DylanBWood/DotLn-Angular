import { delay, groupBy, map, merge, mergeMap, type Observable, take, toArray } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** One reviewer's report on one order: the order it is about, who sent it and what it found. */
interface Report {
  readonly order: number;
  readonly from: string;
  readonly findings: number;
}

const filed = (order: number, from: string, findings: number): Report => ({
  order,
  from,
  findings,
});

/**
 * The six reports, by the letter the marble strings write for each: a, b and c are the Criteria,
 * Design and Consistency reviewers' reports on order 31, and A, B and C the same reviewers' reports
 * on order 32.
 */
const reports = {
  a: filed(31, 'Criteria', 2),
  b: filed(31, 'Design', 1),
  c: filed(31, 'Consistency', 0),
  A: filed(32, 'Criteria', 0),
  B: filed(32, 'Design', 1),
  C: filed(32, 'Consistency', 1),
} as const;

/** The aggregation: an order's complete set as one message, its reports' findings added up. */
const gather = (set: readonly Report[]) => {
  // A set is started by its first report, so it is never empty.
  const [{ order }] = set;
  const found = set.reduce((sum, { findings }) => sum + findings, 0);
  return `order ${order}: ${found} findings from ${set.length} reviewers`;
};

/**
 * Three reviewers each send one report on each of two orders, all over one shared channel, so the
 * reports on the two orders arrive mixed. The aggregator keeps a set per order and, once it sees an
 * order's set holding a report from all three reviewers, sends that set on in the next frame as one
 * message. One thing happens in each frame. The strings here are what the spec beside this file
 * asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    // A reviewer sends its report whether or not anything is listening, so each source is hot.
    criteria$: {
      label: 'criteria$',
      hot: true,
      marbles: '-a--A',
      values: { a: reports.a, A: reports.A },
    },
    design$: {
      label: 'design$',
      hot: true,
      marbles: '--B----b',
      values: { B: reports.B, b: reports.b },
    },
    consistency$: {
      label: 'consistency$',
      hot: true,
      marbles: '---c-C',
      values: { c: reports.c, C: reports.C },
    },
  },
  operator: 'groupBy(order), take(3) and toArray() per order, then delay(1)',
  outputs: {
    ready$: {
      label: 'ready$',
      marbles: '------2-1',
      values: {
        1: 'order 31: 3 findings from 3 reviewers',
        2: 'order 32: 2 findings from 3 reviewers',
      },
    },
  },
  run: ({ inputs }) => {
    // Each reviewer's reports are the records its marble string's letters stand for.
    const criteria$ = inputs['criteria$'] as Observable<Report>;
    const design$ = inputs['design$'] as Observable<Report>;
    const consistency$ = inputs['consistency$'] as Observable<Report>;
    // merge is the one channel the three reviewers share.
    const ready$ = merge(criteria$, design$, consistency$).pipe(
      // Correlation: one group for each order a report names.
      groupBy((report) => report.order),
      mergeMap((order$) =>
        order$.pipe(
          // Completion condition: an order's set is complete at its third report.
          take(3),
          // Aggregation: gather the complete set's reports into one list.
          toArray(),
          // Aggregation: make that list one message, its findings added up.
          map(gather),
        ),
      ),
      // The complete set goes on one frame after the report that completed it.
      delay(1),
    );
    return { ready$ };
  },
  moments: [
    { label: 'First report', frame: 1 },
    { label: 'A second set', frame: 2 },
    { label: 'Order 32 complete', frame: 5 },
    { label: 'Set 2 sent on', frame: 6 },
    { label: 'Set 1 sent on', frame: 8 },
  ],
  notes: {
    0: 'The Criteria, Design and Consistency reviewers are each reviewing orders 31 and 32. No report has been sent, and the Aggregator holds nothing.',
    1: 'Criteria sends a, its report on order 31, to the Aggregator. The Aggregator reads the order the report names and starts a set for order 31.',
    2: "Design sends B, its report on order 32, down the same channel. B names order 32, so the Aggregator starts a second set for it instead of adding it to order 31's.",
    3: "Consistency sends c, its report on order 31. The Aggregator puts it with a, in order 31's set.",
    4: 'Criteria sends A, its report on order 32. The Aggregator puts it with B. Each set now waits for one more reviewer.',
    5: "Consistency sends C, its report on order 32. Order 32's set now holds a report from all three reviewers, so it is complete.",
    6: "The Aggregator sends order 32's complete set on to the Next phase as one message, 2, with its findings added up, and forgets the set. Order 31's set still waits for Design.",
    7: "Design sends b, its report on order 31. Order 31's set is now complete.",
    8: "The Aggregator sends order 31's set on to the Next phase as 1. Order 32 went first, although the first report to arrive was on order 31, and the Aggregator now holds nothing.",
  },
  caption:
    "Time runs in frames, one event to a frame. criteria$, design$ and consistency$ are what each reviewer sends: a, b and c are their reports on order 31, A, B and C their reports on order 32. ready$ is what the aggregator sends on: 2 is order 32's complete set and 1 is order 31's, each one frame after the report that completed it.",
};

/** The three reviewers, each line straight into the aggregator, and the next phase after it. */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'criteria', label: 'Criteria', stage: 0 },
    { id: 'design', label: 'Design', stage: 0, row: 1 },
    { id: 'consistency', label: 'Consistency', stage: 0, row: 2 },
    { id: 'aggregator', label: 'Aggregator', stage: 1, row: 1, tone: 'subject' },
    { id: 'next', label: 'Next phase', stage: 2, row: 1 },
  ],
  links: [
    { id: 'from-criteria', from: 'criteria', to: 'aggregator' },
    { id: 'from-design', from: 'design', to: 'aggregator' },
    { id: 'from-consistency', from: 'consistency', to: 'aggregator' },
    { id: 'to-next', from: 'aggregator', to: 'next' },
  ],
  routes: {
    criteria$: 'from-criteria',
    design$: 'from-design',
    consistency$: 'from-consistency',
    ready$: 'to-next',
  },
  states: {
    0: {
      criteria: 'reviewing 31, 32',
      design: 'reviewing 31, 32',
      consistency: 'reviewing 31, 32',
      aggregator: 'no sets yet',
      next: 'no set yet',
    },
    1: { criteria: 'sent 31; 32 to go', aggregator: '31:a' },
    2: { design: 'sent 32; 31 to go', aggregator: '31:a · 32:B' },
    3: { consistency: 'sent 31; 32 to go', aggregator: '31:a,c · 32:B' },
    4: { criteria: 'sent 31 and 32', aggregator: '31:a,c · 32:A,B' },
    5: { consistency: 'sent 31 and 32', aggregator: '31:a,c · 32:A,B,C' },
    6: { aggregator: '31:a,c', next: 'has set 2 (order 32)' },
    7: { design: 'sent 31 and 32', aggregator: '31:a,b,c' },
    8: { aggregator: 'no sets', next: 'has sets 2 and 1' },
  },
  held: {
    1: { aggregator: ['a'] },
    2: { aggregator: ['a', 'B'] },
    3: { aggregator: ['a', 'c', 'B'] },
    4: { aggregator: ['a', 'c', 'A', 'B'] },
    5: { aggregator: ['a', 'c', 'A', 'B', 'C'] },
    6: { aggregator: ['a', 'c'], next: ['2'] },
    7: { aggregator: ['a', 'b', 'c'] },
    8: { aggregator: [], next: ['2', '1'] },
  },
  caption:
    "Each token is one reviewer's report on one order: a, b and c are the Criteria, Design and Consistency reviewers' reports on order 31, and A, B and C the same reviewers' reports on order 32. Tokens 1 and 2 are the complete sets for orders 31 and 32. The orders themselves never move; only reports about them do. Criteria, Design and Consistency are the three reviewers, and their three lines into the Aggregator are one shared channel, so reports on both orders arrive mixed. The Aggregator keeps a set of reports for each order, and the Next phase is where an order's set goes once all three reviewers have reported on it. The words in a box say what that box is doing or holding; in the Aggregator, 31:a,c means order 31's set holds a and c. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green; where several tokens do not fit apart, one capsule names them all.",
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
