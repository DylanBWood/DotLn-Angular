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

/**
 * A verifier files five findings, one every other step, and a router reads each and sends it on,
 * the step after, on exactly one of three channels: blocking to the executor, operator to the
 * operator, and follow-up to the board. The strings here are what the spec beside this file
 * asserts, and what both the flow drawing and the marble drawing read.
 */
export const example: MarbleExample = {
  inputs: {
    findings$: {
      label: 'findings$',
      // Hot: the verifier files its findings whether or not anything is listening.
      hot: true,
      marbles: '-1-2-3-4-5|',
      values: findings,
    },
  },
  operator: 'map to a route, delay(1), share, filter per route',
  outputs: {
    blocking$: {
      label: 'blocking$',
      marbles: '--1-----4-(5|)',
      values: { 1: findings[1], 4: findings[4], 5: findings[5] },
    },
    operator$: { label: 'operator$', marbles: '------3---|', values: { 3: findings[3] } },
    followUp$: { label: 'followUp$', marbles: '----2-----|', values: { 2: findings[2] } },
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
    { label: 'F1 is blocking', frame: 2 },
    { label: 'The default route', frame: 4 },
    { label: 'To the operator', frame: 6 },
    { label: 'First match wins', frame: 9 },
    { label: 'All routed', frame: 10 },
  ],
  notes: {
    0: 'The Verifier has five findings to file. The Finding router holds its rules: blocking first, then operator, and follow-up for anything else. Nothing has been sent.',
    1: 'The Verifier sends finding 1, F1, to the Finding router. F1 leaves acceptance criterion 2 unmet, so the blocking rule, tried first, fits.',
    2: 'The Finding router sends F1 on, unchanged, to the Executor on the blocking channel, for the change to be repaired.',
    3: 'The Verifier sends F2, a stale line in an index, to the Finding router. It has no unmet criterion, no regression and no decision for the operator, so no rule fits.',
    4: 'With no rule fitting, the Finding router sends F2 down the default route, follow-up, to the Board.',
    5: 'The Verifier sends F3 to the Finding router. F3 asks whether to widen the scope of the work, a decision that belongs to the operator alone, so the operator rule fits.',
    6: 'The Finding router sends F3 to the Operator on the operator channel.',
    7: 'The Verifier sends F4 to the Finding router. Test probe 3 shows the change breaking something the main branch already did, a regression, so the blocking rule fits.',
    8: 'The Finding router sends F4 to the Executor, which now has F1 and F4.',
    9: 'The Verifier sends F5, its last finding, to the Finding router. F5 leaves criterion 4 unmet and also asks whether to waive it, so both rules fit; blocking is tried first and wins.',
    10: 'The Finding router sends F5 to the Executor, and the findings end. Each went to exactly one box, unchanged; with three blocking findings this verification fails and the change goes back for repair.',
  },
  caption:
    "Time runs in frames, one event to a frame. findings$ is what the verifier files: 1 to 5 are findings F1 to F5. blocking$, operator$ and followUp$ are the router's three channels, and each finding leaves on one of them one frame after it arrives.",
};

/**
 * The same run drawn as endpoints and channels, in the order a finding travels: the verifier, the
 * router, and the three destinations its channels lead to.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'verifier', label: 'Verifier', stage: 0 },
    { id: 'router', label: 'Finding router', stage: 1, tone: 'subject' },
    { id: 'executor', label: 'Executor', stage: 2 },
    { id: 'operator', label: 'Operator', stage: 2, row: 1 },
    { id: 'board', label: 'Board', stage: 2, row: 2 },
  ],
  links: [
    { id: 'file', from: 'verifier', to: 'router', label: 'findings' },
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
      verifier: 'five findings to file',
      router: 'blocking, then operator, else follow-up',
      executor: 'blocking: none yet',
      operator: 'operator: none yet',
      board: 'follow-up: none yet',
    },
    1: { verifier: 'four to file', router: 'F1: unmet criterion, so blocking' },
    2: { router: 'waiting', executor: 'blocking: F1' },
    3: { verifier: 'three to file', router: 'F2: no rule fits, so follow-up' },
    4: { router: 'waiting', board: 'follow-up: F2' },
    5: { verifier: 'two to file', router: 'F3: a decision, so operator' },
    6: { router: 'waiting', operator: 'operator: F3' },
    7: { verifier: 'one to file', router: 'F4: a regression, so blocking' },
    8: { router: 'waiting', executor: 'blocking: F1, F4' },
    9: { verifier: 'all five filed', router: 'F5 fits both, blocking first' },
    10: { router: 'all five routed', executor: 'blocking: F1, F4, F5' },
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
  caption:
    "Each token is one finding, numbered as the verifier numbers it: token 1 is F1, and so on to 5. The Verifier reviews a change and files the findings. The Finding router reads each one, holds it for a step while it chooses, then sends it on. The Executor, which repairs the change, receives blocking findings; the Operator, the person directing the work, receives decisions that are theirs alone; the Board, a list of later work, receives everything else as a follow-up. The words in a box say what that box holds or has decided, and a destination's words start with the route it receives. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
