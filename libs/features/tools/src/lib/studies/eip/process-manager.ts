import { delay, map, merge, scan, takeWhile } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** The order being driven, as the drive names it. */
export const order = 'WO-031';

/** Failed verifications that end the route instead of sending the order back for repair. */
export const failureLimit = 3;

/** The router's record of the order: the phrase it calls for next and what has failed so far. */
export interface Status {
  readonly phrase: string;
  /** Verifications failed so far. */
  readonly failures: number;
  /** True once the route has ended, for the merge or at the failure limit. */
  readonly stopped: boolean;
}

/** Before the drive: nothing called for and nothing failed. */
export const opened: Status = { phrase: 'nothing yet', failures: 0, stopped: false };

/**
 * Folds one message the router reads into its record of the order and decides the phrase that
 * comes next. The decision reads the record so far, not the message alone: a failed verification
 * sends the order back for repair only while fewer than the limit have failed. A message the
 * router has no rule for is refused rather than guessed at.
 */
export function fold(status: Status, message: unknown): Status {
  switch (message) {
    case `drive: ${order}`:
      return { ...status, phrase: 'resume: next' };
    case 'implementation-ready':
    case 'repair-complete':
      return { ...status, phrase: 'resume: verify' };
    case 'verification-result fail': {
      const failures = status.failures + 1;
      return failures < failureLimit
        ? { ...status, failures, phrase: 'resume: fix' }
        : { failures, phrase: `stop after ${failures} failed verifications`, stopped: true };
    }
    case 'verification-result pass':
      return { ...status, phrase: 'resume: final review' };
    case 'final-review-result pass':
      return { ...status, phrase: 'stop for the operator merge', stopped: true };
    default:
      throw new Error(`The router has no rule for ${String(message)}.`);
  }
}

/**
 * The operator drives one order. Each worker reports one frame after the phrase that started it,
 * and the router sends its next phrase one frame after reading that report, so one message moves
 * in each frame: the first verification fails, the repair is verified again and passes, and the
 * final review passes. The reports are hot because they are scripted at the frames a worker would
 * finish; the router only sees them arrive. The strings here are what the spec beside this file
 * asserts, and both drawings read them.
 */
export const example: MarbleExample = {
  inputs: {
    drive$: { label: 'drive$', marbles: '^d|', hot: true, values: { d: `drive: ${order}` } },
    outcomes$: {
      label: 'outcomes$',
      marbles: '^--i-x-c-p-a',
      hot: true,
      values: {
        i: 'implementation-ready',
        x: 'verification-result fail',
        c: 'repair-complete',
        p: 'verification-result pass',
        a: 'final-review-result pass',
      },
      // The router stops reading reports when the route ends.
      subscriptions: '^----------!',
    },
  },
  operator: 'merge, scan(fold), takeWhile(not stopped), map(phrase), delay(1)',
  outputs: {
    phrases$: {
      label: 'phrases$',
      marbles: '--N-V-F-V-R-(M|)',
      values: {
        N: 'resume: next',
        V: 'resume: verify',
        F: 'resume: fix',
        R: 'resume: final review',
        M: 'stop for the operator merge',
      },
    },
  },
  run: ({ inputs: { drive$, outcomes$ } }) => {
    // The manager's inbox: the trigger message and every step's reply.
    const phrases$ = merge(drive$, outcomes$).pipe(
      // The process instance's state, kept by the manager; fold also decides the next step from it.
      scan(fold, opened),
      // Where the process ends: the final message still goes out, then nothing more is read.
      takeWhile(({ stopped }) => !stopped, true),
      // The command to the step that fold chose.
      map(({ phrase }) => phrase),
      // Pacing only: each command leaves one frame after the reply that called for it.
      delay(1),
    );
    return { phrases$ };
  },
  // Each phrase was held back a frame by delay, so it rides from no input lane.
  origins: { 2: null, 4: null, 6: null, 8: null, 10: null, 12: null },
  moments: [
    { label: 'Drive', frame: 1 },
    { label: 'Verification fails', frame: 5 },
    { label: 'Back to the executor', frame: 6 },
    { label: 'Passes on retry', frame: 9 },
    { label: 'Stop for merge', frame: 12 },
  ],
  notes: {
    0: `The operator has order ${order} to drive. The router has no order, and the executor, the verifier and the reviewer are idle.`,
    1: `The operator sends d, the drive that hands ${order} to the router to take through every phase. The router starts a record of the order: nothing done, no failures.`,
    2: 'The router sends N, resume: next, to the executor, which starts building the order.',
    3: 'The executor sends i, implementation-ready, back to the router. The router notes that the order is built and that verification comes next.',
    4: 'The router sends V, resume: verify, to the verifier.',
    5: `The verifier sends x, a failed verification, to the router. The router counts 1 failure of ${failureLimit}; with fewer than ${failureLimit}, a failure means repair.`,
    6: 'The router sends F, resume: fix, to the executor. A pass would have sent the order to the reviewer instead: the reply chose the step.',
    7: 'The executor sends c, repair-complete, to the router, which calls for verification again.',
    8: 'The router sends V, resume: verify, to the verifier a second time: the repair loop has gone round once.',
    9: 'The verifier sends p, a passed verification, to the router, which calls for the final review.',
    10: 'The router sends R, resume: final review, to the reviewer.',
    11: 'The reviewer sends a, a passed final review, to the router. The order is ready to merge, which only the operator may do.',
    12: 'The router sends M, its stop, to the operator, asking for the merge, and reads no more reports for this order.',
  },
  caption:
    'Time runs in frames, one message to a frame. drive$ is the operator starting the route; outcomes$ is what the executor, the verifier and the reviewer report to the router, in small letters; phrases$ is what the router sends, in capitals, each one frame after the message that called for it.',
};

/**
 * The router at the hub: every report comes in from a worker and every phrase goes out to one.
 * A line's letters say which link each message crosses.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'operator', label: 'Operator', stage: 0, row: 1 },
    { id: 'router', label: 'Router', stage: 1, row: 1, tone: 'subject' },
    { id: 'executor', label: 'Executor', stage: 2, row: 0 },
    { id: 'verifier', label: 'Verifier', stage: 2, row: 1 },
    { id: 'reviewer', label: 'Reviewer', stage: 2, row: 2 },
  ],
  links: [
    { id: 'drive', from: 'operator', to: 'router' },
    { id: 'to-executor', from: 'router', to: 'executor' },
    { id: 'to-verifier', from: 'router', to: 'verifier' },
    { id: 'to-reviewer', from: 'router', to: 'reviewer' },
    { id: 'from-executor', from: 'executor', to: 'router' },
    { id: 'from-verifier', from: 'verifier', to: 'router' },
    { id: 'from-reviewer', from: 'reviewer', to: 'router' },
    { id: 'stop', from: 'router', to: 'operator' },
  ],
  routes: {
    drive$: 'drive',
    outcomes$: {
      i: 'from-executor',
      c: 'from-executor',
      x: 'from-verifier',
      p: 'from-verifier',
      a: 'from-reviewer',
    },
    // S is the stop at the failure limit, which a run with more failed verifications reaches.
    phrases$: {
      N: 'to-executor',
      F: 'to-executor',
      V: 'to-verifier',
      R: 'to-reviewer',
      M: 'stop',
      S: 'stop',
    },
  },
  states: {
    0: {
      operator: `has ${order} to drive`,
      router: 'no order yet',
      executor: 'idle',
      verifier: 'idle',
      reviewer: 'idle',
    },
    1: { operator: `drove ${order}`, router: `build next, 0 of ${failureLimit} failed` },
    2: {
      router: `awaits executor, 0 of ${failureLimit} failed`,
      executor: `building ${order}`,
    },
    3: { executor: 'idle', router: `verify next, 0 of ${failureLimit} failed` },
    4: {
      router: `awaits verifier, 0 of ${failureLimit} failed`,
      verifier: `verifying ${order}`,
    },
    5: { verifier: 'idle', router: `fix next, 1 of ${failureLimit} failed` },
    6: {
      router: `awaits executor, 1 of ${failureLimit} failed`,
      executor: `repairing ${order}`,
    },
    7: { executor: 'idle', router: `verify next, 1 of ${failureLimit} failed` },
    8: {
      router: `awaits verifier, 1 of ${failureLimit} failed`,
      verifier: 'verifying again',
    },
    9: { verifier: 'idle', router: `review next, 1 of ${failureLimit} failed` },
    10: {
      router: `awaits reviewer, 1 of ${failureLimit} failed`,
      reviewer: `reviewing ${order}`,
    },
    11: { reviewer: 'idle', router: 'stop next, ready to merge' },
    12: { router: 'stopped, reads no more', operator: `asked to merge ${order}` },
  },
  caption: `The boxes: the Operator starts the route and is the only one who may merge; the Router is the process manager, which keeps its record of the order and decides each next step; the Executor builds and repairs the order, the Verifier checks it and the Reviewer gives it a final review. The workers never send to each other: every line runs to or from the Router. Each token is one message, and d is the operator's drive. Capitals are the router's phrases, each telling one worker to start: N resume: next (build), V resume: verify, F resume: fix (repair), R resume: final review, and M the stop that asks the operator to merge. Small letters are the workers' reports back: i implementation-ready, x a failed verification, c repair-complete, p a passed verification and a a passed final review. The words in a box say what that box is doing; in the Router they are its record: the step it calls for or awaits, and how many verifications have failed of the ${failureLimit} allowed. A token is green while it moves, and a box a token leaves or reaches is outlined in green.`,
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
