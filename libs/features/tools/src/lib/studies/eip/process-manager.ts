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
export const opened: Status = {
  phrase: 'nothing yet',
  failures: 0,
  stopped: false,
};

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
        : {
            failures,
            phrase: `stop after ${failures} failed verifications`,
            stopped: true,
          };
    }
    case 'verification-result pass':
      return { ...status, phrase: 'resume: final review' };
    case 'final-review-result pass':
      return {
        ...status,
        phrase: 'stop for the operator merge',
        stopped: true,
      };
    default:
      throw new Error(`The router has no rule for ${String(message)}.`);
  }
}

const outcomes = {
  i: 'implementation-ready',
  x: 'verification-result fail',
  c: 'repair-complete',
  p: 'verification-result pass',
  a: 'final-review-result pass',
};

const beforeVerification = fold(opened, outcomes.i);
const afterFailure = fold(beforeVerification, outcomes.x);

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
    drive$: {
      label: 'studyEip.process-manager.model.example.inputs.drive.label',
      marbles: '^d|',
      hot: true,
      values: { d: `drive: ${order}` },
      valueMessages: {
        d: 'studyEip.process-manager.model.example.inputs.drive.values.d',
      },
    },
    outcomes$: {
      label: 'studyEip.process-manager.model.example.inputs.outcomes.label',
      marbles: '^--i-x-c-p-a',
      hot: true,
      values: outcomes,
      // The router stops reading reports when the route ends.
      subscriptions: '^----------!',

      valueMessages: {
        i: 'studyEip.process-manager.model.example.inputs.outcomes.values.i',
        x: 'studyEip.process-manager.model.example.inputs.outcomes.values.x',
        c: 'studyEip.process-manager.model.example.inputs.outcomes.values.c',
        p: 'studyEip.process-manager.model.example.inputs.outcomes.values.p',
        a: 'studyEip.process-manager.model.example.inputs.outcomes.values.a',
      },
    },
  },
  operator: 'studyEip.process-manager.model.example.operator',
  outputs: {
    phrases$: {
      label: 'studyEip.process-manager.model.example.outputs.phrases.label',
      marbles: '--N-V-F-V-R-(M|)',
      values: {
        N: 'resume: next',
        V: 'resume: verify',
        F: 'resume: fix',
        R: 'resume: final review',
        M: 'stop for the operator merge',
      },

      valueMessages: {
        N: 'studyEip.process-manager.model.example.outputs.phrases.values.N',
        V: 'studyEip.process-manager.model.example.outputs.phrases.values.V',
        F: 'studyEip.process-manager.model.example.outputs.phrases.values.F',
        R: 'studyEip.process-manager.model.example.outputs.phrases.values.R',
        M: 'studyEip.process-manager.model.example.outputs.phrases.values.M',
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
    {
      label: 'studyEip.process-manager.model.example.moments.0.label',
      frame: 1,
    },
    {
      label: 'studyEip.process-manager.model.example.moments.1.label',
      frame: 5,
    },
    {
      label: 'studyEip.process-manager.model.example.moments.2.label',
      frame: 6,
    },
    {
      label: 'studyEip.process-manager.model.example.moments.3.label',
      frame: 9,
    },
    {
      label: 'studyEip.process-manager.model.example.moments.4.label',
      frame: 12,
    },
  ],
  notes: {
    0: {
      key: 'studyEip.process-manager.model.example.notes.0',
      params: { order },
    },
    1: {
      key: 'studyEip.process-manager.model.example.notes.1',
      params: { order },
    },
    2: 'studyEip.process-manager.model.example.notes.2',
    3: 'studyEip.process-manager.model.example.notes.3',
    4: 'studyEip.process-manager.model.example.notes.4',
    5: {
      key: 'studyEip.process-manager.model.example.notes.5',
      params: { failureLimit, failures: afterFailure.failures },
    },
    6: 'studyEip.process-manager.model.example.notes.6',
    7: 'studyEip.process-manager.model.example.notes.7',
    8: 'studyEip.process-manager.model.example.notes.8',
    9: 'studyEip.process-manager.model.example.notes.9',
    10: 'studyEip.process-manager.model.example.notes.10',
    11: 'studyEip.process-manager.model.example.notes.11',
    12: 'studyEip.process-manager.model.example.notes.12',
  },
  caption: 'studyEip.process-manager.model.example.caption',

  parameterMessages: {
    order: 'studyEip.process-manager.record.parameters.order',
  },
};

/**
 * The router at the hub: every report comes in from a worker and every phrase goes out to one.
 * A line's letters say which link each message crosses.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'operator',
      label: 'studyEip.process-manager.model.flow.nodes.0.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'router',
      label: 'studyEip.process-manager.model.flow.nodes.1.label',
      stage: 1,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'executor',
      label: 'studyEip.process-manager.model.flow.nodes.2.label',
      stage: 2,
      row: 0,
    },
    {
      id: 'verifier',
      label: 'studyEip.process-manager.model.flow.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'reviewer',
      label: 'studyEip.process-manager.model.flow.nodes.4.label',
      stage: 2,
      row: 2,
    },
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
      operator: {
        key: 'studyEip.process-manager.model.flow.states.0.operator',
        params: { order },
      },
      router: 'studyEip.process-manager.model.flow.states.0.router',
      executor: 'studyEip.process-manager.model.flow.states.0.executor',
      verifier: 'studyEip.process-manager.model.flow.states.0.verifier',
      reviewer: 'studyEip.process-manager.model.flow.states.0.reviewer',
    },
    1: {
      operator: {
        key: 'studyEip.process-manager.model.flow.states.1.operator',
        params: { order },
      },
      router: {
        key: 'studyEip.process-manager.model.flow.states.1.router',
        params: { failureLimit, failures: beforeVerification.failures },
      },
    },
    2: {
      router: {
        key: 'studyEip.process-manager.model.flow.states.2.router',
        params: { failureLimit, failures: beforeVerification.failures },
      },
      executor: {
        key: 'studyEip.process-manager.model.flow.states.2.executor',
        params: { order },
      },
    },
    3: {
      executor: 'studyEip.process-manager.model.flow.states.3.executor',
      router: {
        key: 'studyEip.process-manager.model.flow.states.3.router',
        params: { failureLimit, failures: beforeVerification.failures },
      },
    },
    4: {
      router: {
        key: 'studyEip.process-manager.model.flow.states.4.router',
        params: { failureLimit, failures: beforeVerification.failures },
      },
      verifier: {
        key: 'studyEip.process-manager.model.flow.states.4.verifier',
        params: { order },
      },
    },
    5: {
      verifier: 'studyEip.process-manager.model.flow.states.5.verifier',
      router: {
        key: 'studyEip.process-manager.model.flow.states.5.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
    },
    6: {
      router: {
        key: 'studyEip.process-manager.model.flow.states.6.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
      executor: {
        key: 'studyEip.process-manager.model.flow.states.6.executor',
        params: { order },
      },
    },
    7: {
      executor: 'studyEip.process-manager.model.flow.states.7.executor',
      router: {
        key: 'studyEip.process-manager.model.flow.states.7.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
    },
    8: {
      router: {
        key: 'studyEip.process-manager.model.flow.states.8.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
      verifier: 'studyEip.process-manager.model.flow.states.8.verifier',
    },
    9: {
      verifier: 'studyEip.process-manager.model.flow.states.9.verifier',
      router: {
        key: 'studyEip.process-manager.model.flow.states.9.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
    },
    10: {
      router: {
        key: 'studyEip.process-manager.model.flow.states.10.router',
        params: { failureLimit, failures: afterFailure.failures },
      },
      reviewer: {
        key: 'studyEip.process-manager.model.flow.states.10.reviewer',
        params: { order },
      },
    },
    11: {
      reviewer: 'studyEip.process-manager.model.flow.states.11.reviewer',
      router: 'studyEip.process-manager.model.flow.states.11.router',
    },
    12: {
      router: 'studyEip.process-manager.model.flow.states.12.router',
      operator: {
        key: 'studyEip.process-manager.model.flow.states.12.operator',
        params: { order },
      },
    },
  },
  caption: {
    key: 'studyEip.process-manager.model.flow.caption',
    params: { failureLimit },
  },
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
