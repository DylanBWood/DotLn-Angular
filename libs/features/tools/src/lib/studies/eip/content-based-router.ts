import { delay, filter, map, type Observable, share } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** A finding as the verifier files it: its id and the fields the router reads to route it. */
export interface Finding {
  readonly finding: string;
  /** The acceptance criterion the change leaves unmet. */
  readonly unmet?: string;
  /** What shows that the change breaks something the main branch already did, such as a probe. */
  readonly regression?: string;
  /** A decision that belongs to the operator alone. */
  readonly choice?: string;
  /** Any other defect, in a few words. */
  readonly defect?: string;
}

/** The three channels a finding can leave on. */
export type Route = 'blocking' | 'operator' | 'follow-up';

/**
 * The router's whole rule table, tried from the top: the first rule a finding passes names its
 * route. The order matters, since one finding can pass both tests.
 */
export const rules: readonly (readonly [Route, (finding: Finding) => boolean])[] = [
  ['blocking', (finding) => finding.unmet !== undefined || finding.regression !== undefined],
  ['operator', (finding) => finding.choice !== undefined],
];

/** Where a finding goes when no rule matches it. */
export const defaultRoute: Route = 'follow-up';

/** The route of one finding, read from its own fields and nothing else. */
export const routeOf = (finding: Finding): Route =>
  rules.find(([, passes]) => passes(finding))?.[0] ?? defaultRoute;

/** The five findings of one verification, by their number: token 1 is F1, and so on to 5. */
const findings = {
  1: { finding: 'F1', unmet: 'criterion 2' },
  2: { finding: 'F2', defect: 'stale index line' },
  3: { finding: 'F3', choice: 'widen the scope' },
  4: { finding: 'F4', regression: 'shown by probe 3' },
  5: { finding: 'F5', unmet: 'criterion 4', choice: 'waive or repair' },
} as const satisfies Readonly<Record<number, Finding>>;

const findingCount = Object.keys(findings).length;
const blockingCount = Object.values(findings).filter(
  (finding) => routeOf(finding) === 'blocking',
).length;

/**
 * A verifier files five findings, one every other step, and a router reads each and sends it on,
 * the step after, on exactly one of three channels: blocking to the executor, operator to the
 * operator, and follow-up to the board. The strings here are what the spec beside this file
 * asserts, and what both the flow drawing and the marble drawing read.
 */
export const example: MarbleExample = {
  inputs: {
    findings$: {
      label: 'studyEip.content-based-router.model.example.inputs.findings.label',
      // Hot: the verifier files its findings whether or not anything is listening.
      hot: true,
      marbles: '-1-2-3-4-5|',
      values: findings,

      valueMessages: {
        '1': 'studyEip.content-based-router.model.example.inputs.findings.values.1',
        '2': 'studyEip.content-based-router.model.example.inputs.findings.values.2',
        '3': 'studyEip.content-based-router.model.example.inputs.findings.values.3',
        '4': 'studyEip.content-based-router.model.example.inputs.findings.values.4',
        '5': 'studyEip.content-based-router.model.example.inputs.findings.values.5',
      },
    },
  },
  operator: 'studyEip.content-based-router.model.example.operator',
  outputs: {
    blocking$: {
      label: 'studyEip.content-based-router.model.example.outputs.blocking.label',
      marbles: '--1-----4-(5|)',
      values: { 1: findings[1], 4: findings[4], 5: findings[5] },

      valueMessages: {
        '1': 'studyEip.content-based-router.model.example.outputs.blocking.values.1',
        '4': 'studyEip.content-based-router.model.example.outputs.blocking.values.4',
        '5': 'studyEip.content-based-router.model.example.outputs.blocking.values.5',
      },
    },
    operator$: {
      label: 'studyEip.content-based-router.model.example.outputs.operator.label',
      marbles: '------3---|',
      values: { 3: findings[3] },
      valueMessages: {
        '3': 'studyEip.content-based-router.model.example.outputs.operator.values.3',
      },
    },
    followUp$: {
      label: 'studyEip.content-based-router.model.example.outputs.followUp.label',
      marbles: '----2-----|',
      values: { 2: findings[2] },
      valueMessages: {
        '2': 'studyEip.content-based-router.model.example.outputs.followUp.values.2',
      },
    },
  },
  run: ({ inputs }) => {
    // Each number stands for one finding, as the values above say.
    const findings$ = inputs['findings$'] as Observable<Finding>;
    const routed$ = findings$.pipe(
      // The router reads each finding's own fields and names its one route.
      map((finding) => ({ finding, route: routeOf(finding) })),
      // It sends the finding on one step after reading it.
      delay(1),
      // One decision per finding, however many channels are listening.
      share(),
    );
    const on = (route: Route) =>
      routed$.pipe(
        // A channel takes only the findings routed to it, unchanged.
        filter((routed) => routed.route === route),
        map((routed) => routed.finding),
      );
    // The three routes; follow-up is the default for a finding no rule fits.
    const blocking$ = on('blocking');
    const operator$ = on('operator');
    const followUp$ = on('follow-up');
    return { blocking$, operator$, followUp$ };
  },
  moments: [
    {
      label: 'studyEip.content-based-router.model.example.moments.0.label',
      frame: 2,
    },
    {
      label: 'studyEip.content-based-router.model.example.moments.1.label',
      frame: 4,
    },
    {
      label: 'studyEip.content-based-router.model.example.moments.2.label',
      frame: 6,
    },
    {
      label: 'studyEip.content-based-router.model.example.moments.3.label',
      frame: 9,
    },
    {
      label: 'studyEip.content-based-router.model.example.moments.4.label',
      frame: 10,
    },
  ],
  notes: {
    0: {
      key: 'studyEip.content-based-router.model.example.notes.0',
      params: { findings: findingCount },
    },
    1: 'studyEip.content-based-router.model.example.notes.1',
    2: 'studyEip.content-based-router.model.example.notes.2',
    3: 'studyEip.content-based-router.model.example.notes.3',
    4: 'studyEip.content-based-router.model.example.notes.4',
    5: 'studyEip.content-based-router.model.example.notes.5',
    6: 'studyEip.content-based-router.model.example.notes.6',
    7: 'studyEip.content-based-router.model.example.notes.7',
    8: 'studyEip.content-based-router.model.example.notes.8',
    9: 'studyEip.content-based-router.model.example.notes.9',
    10: {
      key: 'studyEip.content-based-router.model.example.notes.10',
      params: { blocking: blockingCount },
    },
  },
  caption: 'studyEip.content-based-router.model.example.caption',

  parameterMessages: {
    findings: 'studyEip.content-based-router.record.parameters.findings',
    rules: 'studyEip.content-based-router.record.parameters.rules',
  },
};

/**
 * The same run drawn as endpoints and channels, in the order a finding travels: the verifier, the
 * router, and the three destinations its channels lead to.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'verifier',
      label: 'studyEip.content-based-router.model.flow.nodes.0.label',
      stage: 0,
    },
    {
      id: 'router',
      label: 'studyEip.content-based-router.model.flow.nodes.1.label',
      stage: 1,
      tone: 'subject',
    },
    {
      id: 'executor',
      label: 'studyEip.content-based-router.model.flow.nodes.2.label',
      stage: 2,
    },
    {
      id: 'operator',
      label: 'studyEip.content-based-router.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'board',
      label: 'studyEip.content-based-router.model.flow.nodes.4.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    {
      id: 'file',
      from: 'verifier',
      to: 'router',
      label: 'studyEip.content-based-router.model.flow.links.0.label',
    },
    { id: 'to-executor', from: 'router', to: 'executor' },
    { id: 'to-operator', from: 'router', to: 'operator' },
    { id: 'to-board', from: 'router', to: 'board' },
  ],
  routes: {
    findings$: 'file',
    blocking$: 'to-executor',
    operator$: 'to-operator',
    followUp$: 'to-board',
  },
  states: {
    0: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.0.verifier',
        params: { remaining: findingCount - 0 },
      },
      router: 'studyEip.content-based-router.model.flow.states.0.router',
      executor: 'studyEip.content-based-router.model.flow.states.0.executor',
      operator: 'studyEip.content-based-router.model.flow.states.0.operator',
      board: 'studyEip.content-based-router.model.flow.states.0.board',
    },
    1: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.1.verifier',
        params: { remaining: findingCount - 1 },
      },
      router: 'studyEip.content-based-router.model.flow.states.1.router',
    },
    2: {
      router: 'studyEip.content-based-router.model.flow.states.2.router',
      executor: 'studyEip.content-based-router.model.flow.states.2.executor',
    },
    3: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.3.verifier',
        params: { remaining: findingCount - 2 },
      },
      router: 'studyEip.content-based-router.model.flow.states.3.router',
    },
    4: {
      router: 'studyEip.content-based-router.model.flow.states.4.router',
      board: 'studyEip.content-based-router.model.flow.states.4.board',
    },
    5: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.5.verifier',
        params: { remaining: findingCount - 3 },
      },
      router: 'studyEip.content-based-router.model.flow.states.5.router',
    },
    6: {
      router: 'studyEip.content-based-router.model.flow.states.6.router',
      operator: 'studyEip.content-based-router.model.flow.states.6.operator',
    },
    7: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.7.verifier',
        params: { remaining: findingCount - 4 },
      },
      router: 'studyEip.content-based-router.model.flow.states.7.router',
    },
    8: {
      router: 'studyEip.content-based-router.model.flow.states.8.router',
      executor: 'studyEip.content-based-router.model.flow.states.8.executor',
    },
    9: {
      verifier: {
        key: 'studyEip.content-based-router.model.flow.states.9.verifier',
        params: { count: findingCount },
      },
      router: 'studyEip.content-based-router.model.flow.states.9.router',
    },
    10: {
      router: {
        key: 'studyEip.content-based-router.model.flow.states.10.router',
        params: { count: findingCount },
      },
      executor: 'studyEip.content-based-router.model.flow.states.10.executor',
    },
  },
  held: {
    1: { router: ['1'] },
    2: { router: [], executor: ['1'] },
    3: { router: ['2'] },
    4: { router: [], board: ['2'] },
    5: { router: ['3'] },
    6: { router: [], operator: ['3'] },
    7: { router: ['4'] },
    8: { router: [], executor: ['1', '4'] },
    9: { router: ['5'] },
    10: { router: [], executor: ['1', '4', '5'] },
  },
  caption: 'studyEip.content-based-router.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
