import { delay, first, mergeMap } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/**
 * The identifier a message carries: a command's commandId is its request id, and a result's
 * commandId, copied from the command it answers, is its correlation id.
 */
export const commandId = (message: unknown): unknown =>
  typeof message === 'object' && message !== null && 'commandId' in message
    ? message.commandId
    : undefined;

/** The three commands, by the letter the marble strings write for each. */
const commands = {
  a: { commandId: 'cmd_1' },
  b: { commandId: 'cmd_2' },
  c: { commandId: 'cmd_3' },
} as const;

/** The three results: each capital is the result that names its lower-case command's id. */
const results = {
  A: { commandId: 'cmd_1', status: 'completed' },
  B: { commandId: 'cmd_2', status: 'blocked' },
  C: { commandId: 'cmd_3', status: 'failed' },
} as const;

/** What the shared channel carries: the three results, then D, a second copy of B, as a retry might send. */
const channel = { ...results, D: results.B } as const;

/**
 * Three commands out at once, told as an analogy with DotLn's kernel: each command carries its
 * commandId, the workers answer on one shared results channel in the order they finish, and each
 * command's wait takes only the result naming its id, one frame after it arrives. A second copy of
 * Worker 2's result, D, arrives at the end and finds no wait open. One thing happens in each frame. The
 * strings here are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    command$: { label: 'command$', marbles: '-abc', values: commands },
    // The shared channel delivers results whether or not a wait is open, so it is hot.
    result$: { label: 'result$', hot: true, marbles: '----C-A-B-D', values: channel },
  },
  operator: 'mergeMap((command) => result$.pipe(first(same commandId))), then delay(1)',
  outputs: {
    resumed$: { label: 'resumed$', marbles: '-----C-A-B', values: results },
  },
  run: ({ inputs: { command$, result$ } }) => {
    // commandId(command) is the request id; commandId(result), copied from it, is the correlation id.
    const resumed$ = command$.pipe(
      // Each command is a pending request, with its own wait on the shared reply channel.
      mergeMap((command) =>
        // The match: the first result whose correlation id equals the request id ends the wait.
        result$.pipe(first((result) => commandId(result) === commandId(command))),
      ),
      // Not part of the pattern: a matched result is handed on a frame later, as a step of its own.
      delay(1),
    );
    return { resumed$ };
  },
  moments: [
    { label: 'Three pending', frame: 3 },
    { label: 'Out of order', frame: 4 },
    { label: 'Taken by id', frame: 5 },
    { label: 'All matched', frame: 9 },
    { label: 'Duplicate', frame: 10 },
  ],
  notes: {
    0: 'The Kernel has three commands to send, cmd_1, cmd_2 and cmd_3, each carrying its own id. No wait is open yet.',
    1: 'The Kernel sends a, command cmd_1, to Worker 1, and opens Await 1 to wait for a result naming cmd_1.',
    2: 'The Kernel sends b, command cmd_2, to Worker 2, and opens Await 2 to wait for cmd_2.',
    3: 'The Kernel sends c, command cmd_3, to Worker 3, and opens Await 3 to wait for cmd_3. Three requests are out, and all their results will come back on one shared channel.',
    4: 'Worker 3 finishes first and puts its result C on the Results channel. C carries the id cmd_3, copied from command c, so of the three open waits only Await 3 will take it.',
    5: 'Await 3 takes C off the Results channel: cmd_3 failed. Await 1 and Await 2 are still waiting.',
    6: 'Worker 1 puts its result A, which names cmd_1, on the Results channel. Only Await 1 waits for that id.',
    7: 'Await 1 takes A: cmd_1 completed. Pairing by arrival would have given cmd_1 the failure that came first; the id gives it its own result.',
    8: 'Worker 2 puts its result B, which names cmd_2, on the Results channel.',
    9: 'Await 2, the last wait still open, takes B: cmd_2 is blocked.',
    10: 'Worker 2 sends D, a second copy of B carrying the same id cmd_2, as a retried attempt might. Await 2 closed when it took B and no wait is open, so D is dropped.',
  },
  caption:
    'Time runs in frames, one event to a frame. command$ is what the Kernel sends: a, b and c are the commands cmd_1, cmd_2 and cmd_3. result$ is the shared Results channel: A, B and C are the results that name cmd_1, cmd_2 and cmd_3, and D is a second copy of B. It delivers whether or not anything listens, so D is drawn on it although nothing takes it. resumed$ is each result handed to the wait it matched, one frame after it arrived.',
};

/**
 * The same run as messages between boxes: the Kernel, a worker per command, the shared Results
 * channel and one wait per command sent, which is the part the pattern is about.
 */
export const flow: MarbleFlow = {
  nodes: [
    { id: 'kernel', label: 'Kernel', stage: 0, row: 1 },
    { id: 'worker1', label: 'Worker 1', stage: 1, row: 0 },
    { id: 'worker2', label: 'Worker 2', stage: 1, row: 1 },
    { id: 'worker3', label: 'Worker 3', stage: 1, row: 2 },
    { id: 'results', label: 'Results', stage: 2, row: 1, kind: 'channel' },
    { id: 'await1', label: 'Await 1', stage: 3, row: 0, tone: 'subject' },
    { id: 'await2', label: 'Await 2', stage: 3, row: 1, tone: 'subject' },
    { id: 'await3', label: 'Await 3', stage: 3, row: 2, tone: 'subject' },
  ],
  links: [
    { id: 'send-1', from: 'kernel', to: 'worker1' },
    { id: 'send-2', from: 'kernel', to: 'worker2' },
    { id: 'send-3', from: 'kernel', to: 'worker3' },
    { id: 'reply-1', from: 'worker1', to: 'results' },
    { id: 'reply-2', from: 'worker2', to: 'results' },
    { id: 'reply-3', from: 'worker3', to: 'results' },
    { id: 'take-1', from: 'results', to: 'await1' },
    { id: 'take-2', from: 'results', to: 'await2' },
    { id: 'take-3', from: 'results', to: 'await3' },
  ],
  // Each line carries several senders' messages, so each letter has its own link.
  routes: {
    command$: { a: 'send-1', b: 'send-2', c: 'send-3' },
    result$: { A: 'reply-1', B: 'reply-2', C: 'reply-3', D: 'reply-2' },
    resumed$: { A: 'take-1', B: 'take-2', C: 'take-3' },
  },
  states: {
    0: {
      kernel: '3 to send',
      worker1: 'idle',
      worker2: 'idle',
      worker3: 'idle',
      results: 'shared by all',
      await1: 'not open',
      await2: 'not open',
      await3: 'not open',
    },
    1: { kernel: '2 to send', worker1: 'running cmd_1', await1: 'waits for cmd_1' },
    2: { kernel: '1 to send', worker2: 'running cmd_2', await2: 'waits for cmd_2' },
    3: { kernel: 'all sent', worker3: 'running cmd_3', await3: 'waits for cmd_3' },
    4: { worker3: 'done' },
    5: { await3: 'took C: failed' },
    6: { worker1: 'done' },
    7: { await1: 'took A: completed' },
    8: { worker2: 'done' },
    9: { await2: 'took B: blocked' },
    10: { worker2: 'repeats B as D', results: 'dropped D' },
  },
  // A worker holds its command while it runs; the channel holds a result until its wait takes it.
  held: {
    1: { worker1: ['a'] },
    2: { worker2: ['b'] },
    3: { worker3: ['c'] },
    4: { worker3: [], results: ['C'] },
    5: { results: [], await3: ['C'] },
    6: { worker1: [], results: ['A'] },
    7: { results: [], await1: ['A'] },
    8: { worker2: [], results: ['B'] },
    9: { results: [], await2: ['B'] },
  },
  caption:
    "Each token is one message. a, b and c are the Kernel's commands cmd_1, cmd_2 and cmd_3; A, B and C are the workers' results, and each capital names its lower-case command's id: A names cmd_1, B cmd_2 and C cmd_3, and D is a second copy of B. The Kernel is the part of DotLn that sends the commands. Worker 1, 2 and 3 each run one command. Results is the one channel every worker answers on, so results arrive in the order the work finishes. Await 1, 2 and 3 are the Kernel's waits, one for each command sent, and each takes only the result naming its command's id. The words in a box say what that box is doing. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
};

export const model: StudyModelFunction = (parameters) => flowFromMarbles(example, flow, parameters);
