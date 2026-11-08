import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import { arrive, type BoardOutcome, type RawReply, translate } from './gateway.simulation';

/** The example's inputs: what kind of stub answers, how it stages its cases, and the live contract. */
export interface ServiceStubParameters {
  /** 1 when the stub reads the scenario each case puts on its request; 0 when it has one answer. */
  readonly dynamicStub: number;
  /** The status the stub answers the refusal case with. */
  readonly refusalStatus: number;
  /** The gateway's time limit inside the spec, lowered so a timeout costs milliseconds. */
  readonly timeoutMs: number;
  /** How long the stub holds its answer when a case asks for a timeout, in milliseconds. */
  readonly stubDelayMs: number;
  /** The contract version of the stub's recorded board, the version the app is written for. */
  readonly fixtureVersion: number;
  /** The contract version the live API serves when the app is released against it. */
  readonly liveVersion: number;
}

/** The board store's cases, in the order the spec runs them. */
export const cases = ['recorded', 'refusal', 'network', 'timeout'] as const;
export type CaseId = (typeof cases)[number];

/** Where a case stands: not run yet, answered by the stub, or judged. */
export type CaseState = 'queued' | 'answered' | 'passed' | 'failed';

/** One case as the suite holds it. */
export interface CaseRun {
  readonly state: CaseState;
  /** What answered it, in the API's terms; null before it runs. */
  readonly answer: RawReply | null;
  /** What the gateway saw after its wait: that answer, or its own timeout; null before it runs. */
  readonly seen: RawReply | null;
  /** What the gateway made of what it saw, in the app's terms; null before it runs. */
  readonly outcome: BoardOutcome | null;
  /** How long the case waited for its answer, in milliseconds. */
  readonly waitedMs: number;
}

/** Something done to one case: the stub answers it, the spec asserts it, or it meets the live API. */
export interface CaseOperation {
  readonly kind: 'answer' | 'assert' | 'release';
  readonly id: CaseId;
}

export type SuiteOperation = { readonly kind: 'start' } | CaseOperation;

/** One moment of the suite: what was done, every case afterwards, and the calls the live API saw. */
export interface SuiteStep {
  readonly operation: SuiteOperation;
  readonly cases: Readonly<Record<CaseId, CaseRun>>;
  readonly liveCalls: number;
}

/** How the suite stands after a step: the cases passed and failed, and the stub's total wait. */
export interface SuiteTally {
  readonly passed: number;
  readonly failed: number;
  readonly waitedMs: number;
}

/** The status of a plain answer: the board, delivered. */
const okStatus = 200;

const queued: CaseRun = { state: 'queued', answer: null, seen: null, outcome: null, waitedMs: 0 };

export const readParameters = (parameters: StudyParameters): ServiceStubParameters => ({
  dynamicStub: numberParameter(parameters, 'dynamicStub'),
  refusalStatus: numberParameter(parameters, 'refusalStatus'),
  timeoutMs: numberParameter(parameters, 'timeoutMs'),
  stubDelayMs: numberParameter(parameters, 'stubDelayMs'),
  fixtureVersion: numberParameter(parameters, 'fixtureVersion'),
  liveVersion: numberParameter(parameters, 'liveVersion'),
});

/** What each case expects the store to end with, in the app's terms. */
export function expectationOf(id: CaseId, example: ServiceStubParameters): BoardOutcome {
  switch (id) {
    case 'recorded':
      return { kind: 'board', version: example.fixtureVersion };
    case 'refusal':
      return { kind: 'failure', error: 'http', status: example.refusalStatus };
    case 'network':
      return { kind: 'failure', error: 'network', status: null };
    default:
      return { kind: 'failure', error: 'timeout', status: null };
  }
}

/** Two outcomes are the same when they name the same board or the same failure. */
export const sameOutcome = (a: BoardOutcome, b: BoardOutcome): boolean =>
  a.kind === 'board' && b.kind === 'board'
    ? a.version === b.version
    : a.kind === 'failure' && b.kind === 'failure' && a.error === b.error && a.status === b.status;

/** How long the stub keeps a case waiting before its answer is ready, in milliseconds. */
export const stubDelayOf = (id: CaseId, example: ServiceStubParameters): number =>
  example.dynamicStub !== 0 && id === 'timeout' ? example.stubDelayMs : 0;

/**
 * The stub's answer to one case, in the API's own terms. A static stub has one answer, the
 * recorded board; a dynamic one reads the scenario the case puts on its request.
 */
export function stubAnswer(id: CaseId, example: ServiceStubParameters): RawReply {
  const board: RawReply = { kind: 'response', status: okStatus, version: example.fixtureVersion };
  if (example.dynamicStub === 0) return board;
  switch (id) {
    case 'refusal':
      return { kind: 'response', status: example.refusalStatus, version: example.fixtureVersion };
    case 'network':
      return { kind: 'unreachable' };
    default:
      // The timeout case gets the board too, but late: the gateway's limit decides whether it waits.
      return board;
  }
}

/**
 * One case through the production gateway: the stub answers in place of the API, and the
 * gateway's own wait and translation turn that answer into the outcome the store receives.
 */
export function runCase(id: CaseId, example: ServiceStubParameters): CaseRun {
  const delay = stubDelayOf(id, example);
  const answer = stubAnswer(id, example);
  const seen = arrive(answer, delay, example.timeoutMs);
  return {
    state: 'answered',
    answer,
    seen,
    outcome: translate(seen),
    waitedMs: seen.kind === 'silence' ? seen.waitedMs : delay,
  };
}

/** The case's assertion: passed when the store holds what it expects, failed otherwise. */
export function judge(run: CaseRun, expected: BoardOutcome): CaseRun {
  if (run.outcome === null) throw new Error('A case is judged only after it is answered.');
  return { ...run, state: sameOutcome(run.outcome, expected) ? 'passed' : 'failed' };
}

/** What the live API answers the recorded case's request with: the board it serves now. */
export const liveAnswer = (example: ServiceStubParameters): RawReply => ({
  kind: 'response',
  status: okStatus,
  version: example.liveVersion,
});

/**
 * The recorded case's expectation, met once against the live API. The other cases cannot be
 * staged there: the live API does not refuse, drop or stall on request.
 */
export function release(run: CaseRun, example: ServiceStubParameters): CaseRun {
  const answer = liveAnswer(example);
  const outcome = translate(answer);
  const holds = run.state === 'passed' && sameOutcome(outcome, expectationOf('recorded', example));
  return { ...run, state: holds ? 'passed' : 'failed', answer, seen: answer, outcome };
}

/** The suite one step on: one case changed, and the live API's calls counted. */
const after = (step: SuiteStep, operation: CaseOperation, run: CaseRun): SuiteStep => ({
  operation,
  cases: { ...step.cases, [operation.id]: run },
  liveCalls: step.liveCalls + (operation.kind === 'release' ? 1 : 0),
});

/**
 * The example as the spec runs it: each case answered by the stub and then asserted, in order,
 * and at release the recorded case's request sent once to the live API.
 */
export function suiteRun(example: ServiceStubParameters): readonly SuiteStep[] {
  const start: SuiteStep = {
    operation: { kind: 'start' },
    cases: { recorded: queued, refusal: queued, network: queued, timeout: queued },
    liveCalls: 0,
  };
  const suite = cases.reduce<readonly SuiteStep[]>(
    (steps, id) => {
      const last = steps[steps.length - 1];
      const answered = after(last, { kind: 'answer', id }, runCase(id, example));
      const judged = judge(answered.cases[id], expectationOf(id, example));
      return [...steps, answered, after(answered, { kind: 'assert', id }, judged)];
    },
    [start],
  );
  const done = suite[suite.length - 1];
  const live = release(done.cases.recorded, example);
  return [...suite, after(done, { kind: 'release', id: 'recorded' }, live)];
}

/** Counts the cases passed and failed after a step, and adds up how long the stub kept them waiting. */
export function tally(step: SuiteStep): SuiteTally {
  const runs = cases.map((id) => step.cases[id]);
  return {
    passed: runs.filter(({ state }) => state === 'passed').length,
    failed: runs.filter(({ state }) => state === 'failed').length,
    waitedMs: runs.reduce((total, { waitedMs }) => total + waitedMs, 0),
  };
}
