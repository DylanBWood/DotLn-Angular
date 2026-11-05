import { delay, groupBy, map, merge, mergeMap, type Observable, take, toArray } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyMessage } from '../study-message';
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

/** The numeric result shared by the executable payload and its translated description. */
const summaryOf = (set: readonly Report[]) => ({
  order: set[0].order,
  findings: set.reduce((sum, { findings }) => sum + findings, 0),
  reviewers: set.length,
});

/** The aggregation stays a locale-independent string, as the channel's contract specifies. */
const gather = (set: readonly Report[]) => {
  const { order, findings, reviewers } = summaryOf(set);
  return `order ${order}: ${findings} findings from ${reviewers} reviewers`;
};

const setMessage = (set: readonly Report[]): StudyMessage => ({
  key: 'studyEip.aggregator.model.setSummary',
  params: summaryOf(set),
});

const reviewerMessages: Readonly<Record<string, string>> = {
  Criteria: 'studyEip.aggregator.model.flow.nodes.0.label',
  Design: 'studyEip.aggregator.model.flow.nodes.1.label',
  Consistency: 'studyEip.aggregator.model.flow.nodes.2.label',
};

const reportMessage = ({ order, from, findings }: Report): StudyMessage => ({
  key: 'studyEip.aggregator.model.report',
  params: { order, findings },
  messages: { reviewer: reviewerMessages[from] },
});

const firstSet = [reports.a, reports.b, reports.c];
const secondSet = [reports.A, reports.B, reports.C];

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
      label: 'studyEip.aggregator.model.example.inputs.criteria.label',
      hot: true,
      marbles: '-a--A',
      values: { a: reports.a, A: reports.A },

      valueMessages: {
        a: reportMessage(reports.a),
        A: reportMessage(reports.A),
      },
    },
    design$: {
      label: 'studyEip.aggregator.model.example.inputs.design.label',
      hot: true,
      marbles: '--B----b',
      values: { B: reports.B, b: reports.b },

      valueMessages: {
        B: reportMessage(reports.B),
        b: reportMessage(reports.b),
      },
    },
    consistency$: {
      label: 'studyEip.aggregator.model.example.inputs.consistency.label',
      hot: true,
      marbles: '---c-C',
      values: { c: reports.c, C: reports.C },

      valueMessages: {
        c: reportMessage(reports.c),
        C: reportMessage(reports.C),
      },
    },
  },
  operator: 'studyEip.aggregator.model.example.operator',
  outputs: {
    ready$: {
      label: 'studyEip.aggregator.model.example.outputs.ready.label',
      marbles: '------2-1',
      values: {
        1: gather(firstSet),
        2: gather(secondSet),
      },

      valueMessages: {
        1: setMessage(firstSet),
        2: setMessage(secondSet),
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
    { label: 'studyEip.aggregator.model.example.moments.0.label', frame: 1 },
    { label: 'studyEip.aggregator.model.example.moments.1.label', frame: 2 },
    { label: 'studyEip.aggregator.model.example.moments.2.label', frame: 5 },
    { label: 'studyEip.aggregator.model.example.moments.3.label', frame: 6 },
    { label: 'studyEip.aggregator.model.example.moments.4.label', frame: 8 },
  ],
  notes: {
    0: 'studyEip.aggregator.model.example.notes.0',
    1: 'studyEip.aggregator.model.example.notes.1',
    2: 'studyEip.aggregator.model.example.notes.2',
    3: 'studyEip.aggregator.model.example.notes.3',
    4: 'studyEip.aggregator.model.example.notes.4',
    5: 'studyEip.aggregator.model.example.notes.5',
    6: 'studyEip.aggregator.model.example.notes.6',
    7: 'studyEip.aggregator.model.example.notes.7',
    8: 'studyEip.aggregator.model.example.notes.8',
  },
  caption: 'studyEip.aggregator.model.example.caption',

  parameterMessages: {
    first: 'studyEip.aggregator.record.parameters.first',
    second: 'studyEip.aggregator.record.parameters.second',
  },
};

/** The three reviewers, each line straight into the aggregator, and the next phase after it. */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'criteria',
      label: 'studyEip.aggregator.model.flow.nodes.0.label',
      stage: 0,
    },
    {
      id: 'design',
      label: 'studyEip.aggregator.model.flow.nodes.1.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'consistency',
      label: 'studyEip.aggregator.model.flow.nodes.2.label',
      stage: 0,
      row: 2,
    },
    {
      id: 'aggregator',
      label: 'studyEip.aggregator.model.flow.nodes.3.label',
      stage: 1,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'next',
      label: 'studyEip.aggregator.model.flow.nodes.4.label',
      stage: 2,
      row: 1,
    },
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
      criteria: 'studyEip.aggregator.model.flow.states.0.criteria',
      design: 'studyEip.aggregator.model.flow.states.0.design',
      consistency: 'studyEip.aggregator.model.flow.states.0.consistency',
      aggregator: 'studyEip.aggregator.model.flow.states.0.aggregator',
      next: 'studyEip.aggregator.model.flow.states.0.next',
    },
    1: {
      criteria: 'studyEip.aggregator.model.flow.states.1.criteria',
      aggregator: 'studyEip.aggregator.model.flow.states.1.aggregator',
    },
    2: {
      design: 'studyEip.aggregator.model.flow.states.2.design',
      aggregator: 'studyEip.aggregator.model.flow.states.2.aggregator',
    },
    3: {
      consistency: 'studyEip.aggregator.model.flow.states.3.consistency',
      aggregator: 'studyEip.aggregator.model.flow.states.3.aggregator',
    },
    4: {
      criteria: 'studyEip.aggregator.model.flow.states.4.criteria',
      aggregator: 'studyEip.aggregator.model.flow.states.4.aggregator',
    },
    5: {
      consistency: 'studyEip.aggregator.model.flow.states.5.consistency',
      aggregator: 'studyEip.aggregator.model.flow.states.5.aggregator',
    },
    6: {
      aggregator: 'studyEip.aggregator.model.flow.states.6.aggregator',
      next: 'studyEip.aggregator.model.flow.states.6.next',
    },
    7: {
      design: 'studyEip.aggregator.model.flow.states.7.design',
      aggregator: 'studyEip.aggregator.model.flow.states.7.aggregator',
    },
    8: {
      aggregator: 'studyEip.aggregator.model.flow.states.8.aggregator',
      next: 'studyEip.aggregator.model.flow.states.8.next',
    },
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
  caption: 'studyEip.aggregator.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);

/** Change findings while retaining the reviewers, channel, timing and aggregation rule. */
export function withFindings(
  changes: Partial<Record<keyof typeof reports, number>>,
): MarbleExample {
  const next = Object.fromEntries(
    Object.entries(reports).map(([key, report]) => [
      key,
      { ...report, findings: changes[key as keyof typeof reports] ?? report.findings },
    ]),
  ) as typeof reports;
  const first = [next.a, next.b, next.c];
  const second = [next.A, next.B, next.C];
  return {
    ...example,
    inputs: {
      criteria$: {
        ...example.inputs['criteria$'],
        values: { a: next.a, A: next.A },
        valueMessages: { a: reportMessage(next.a), A: reportMessage(next.A) },
      },
      design$: {
        ...example.inputs['design$'],
        values: { B: next.B, b: next.b },
        valueMessages: { B: reportMessage(next.B), b: reportMessage(next.b) },
      },
      consistency$: {
        ...example.inputs['consistency$'],
        values: { c: next.c, C: next.C },
        valueMessages: { c: reportMessage(next.c), C: reportMessage(next.C) },
      },
    },
    outputs: {
      ready$: {
        ...example.outputs['ready$'],
        values: { 1: gather(first), 2: gather(second) },
        valueMessages: { 1: setMessage(first), 2: setMessage(second) },
      },
    },
  };
}
