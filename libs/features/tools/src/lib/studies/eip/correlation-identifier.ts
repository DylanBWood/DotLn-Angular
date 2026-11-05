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

const commandCount = Object.keys(commands).length;

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
    command$: {
      label: 'studyEip.correlation-identifier.model.example.inputs.command.label',
      marbles: '-abc',
      values: commands,
      valueMessages: {
        a: 'studyEip.correlation-identifier.model.example.inputs.command.values.a',
        b: 'studyEip.correlation-identifier.model.example.inputs.command.values.b',
        c: 'studyEip.correlation-identifier.model.example.inputs.command.values.c',
      },
    },
    // The shared channel delivers results whether or not a wait is open, so it is hot.
    result$: {
      label: 'studyEip.correlation-identifier.model.example.inputs.result.label',
      hot: true,
      marbles: '----C-A-B-D',
      values: channel,
      valueMessages: {
        A: 'studyEip.correlation-identifier.model.example.inputs.result.values.A',
        B: 'studyEip.correlation-identifier.model.example.inputs.result.values.B',
        C: 'studyEip.correlation-identifier.model.example.inputs.result.values.C',
        D: 'studyEip.correlation-identifier.model.example.inputs.result.values.D',
      },
    },
  },
  operator: 'studyEip.correlation-identifier.model.example.operator',
  outputs: {
    resumed$: {
      label: 'studyEip.correlation-identifier.model.example.outputs.resumed.label',
      marbles: '-----C-A-B',
      values: results,
      valueMessages: {
        A: 'studyEip.correlation-identifier.model.example.outputs.resumed.values.A',
        B: 'studyEip.correlation-identifier.model.example.outputs.resumed.values.B',
        C: 'studyEip.correlation-identifier.model.example.outputs.resumed.values.C',
      },
    },
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
    {
      label: 'studyEip.correlation-identifier.model.example.moments.0.label',
      frame: 3,
    },
    {
      label: 'studyEip.correlation-identifier.model.example.moments.1.label',
      frame: 4,
    },
    {
      label: 'studyEip.correlation-identifier.model.example.moments.2.label',
      frame: 5,
    },
    {
      label: 'studyEip.correlation-identifier.model.example.moments.3.label',
      frame: 9,
    },
    {
      label: 'studyEip.correlation-identifier.model.example.moments.4.label',
      frame: 10,
    },
  ],
  notes: {
    0: {
      key: 'studyEip.correlation-identifier.model.example.notes.0',
      params: { commands: commandCount },
    },
    1: 'studyEip.correlation-identifier.model.example.notes.1',
    2: 'studyEip.correlation-identifier.model.example.notes.2',
    3: 'studyEip.correlation-identifier.model.example.notes.3',
    4: 'studyEip.correlation-identifier.model.example.notes.4',
    5: 'studyEip.correlation-identifier.model.example.notes.5',
    6: 'studyEip.correlation-identifier.model.example.notes.6',
    7: 'studyEip.correlation-identifier.model.example.notes.7',
    8: 'studyEip.correlation-identifier.model.example.notes.8',
    9: 'studyEip.correlation-identifier.model.example.notes.9',
    10: 'studyEip.correlation-identifier.model.example.notes.10',
  },
  caption: 'studyEip.correlation-identifier.model.example.caption',

  parameterMessages: {
    commands: 'studyEip.correlation-identifier.record.parameters.commands',
    replyOrder: 'studyEip.correlation-identifier.record.parameters.replyOrder',
  },
};

/**
 * The same run as messages between boxes: the Kernel, a worker per command, the shared Results
 * channel and one wait per command sent, which is the part the pattern is about.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'kernel',
      label: 'studyEip.correlation-identifier.model.flow.nodes.0.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'worker1',
      label: 'studyEip.correlation-identifier.model.flow.nodes.1.label',
      stage: 1,
      row: 0,
    },
    {
      id: 'worker2',
      label: 'studyEip.correlation-identifier.model.flow.nodes.2.label',
      stage: 1,
      row: 1,
    },
    {
      id: 'worker3',
      label: 'studyEip.correlation-identifier.model.flow.nodes.3.label',
      stage: 1,
      row: 2,
    },
    {
      id: 'results',
      label: 'studyEip.correlation-identifier.model.flow.nodes.4.label',
      stage: 2,
      row: 1,
      kind: 'channel',
    },
    {
      id: 'await1',
      label: 'studyEip.correlation-identifier.model.flow.nodes.5.label',
      stage: 3,
      row: 0,
      tone: 'subject',
    },
    {
      id: 'await2',
      label: 'studyEip.correlation-identifier.model.flow.nodes.6.label',
      stage: 3,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'await3',
      label: 'studyEip.correlation-identifier.model.flow.nodes.7.label',
      stage: 3,
      row: 2,
      tone: 'subject',
    },
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
      kernel: {
        key: 'studyEip.correlation-identifier.model.flow.states.0.kernel',
        params: { pending: commandCount - 0 },
      },
      worker1: 'studyEip.correlation-identifier.model.flow.states.0.worker1',
      worker2: 'studyEip.correlation-identifier.model.flow.states.0.worker2',
      worker3: 'studyEip.correlation-identifier.model.flow.states.0.worker3',
      results: 'studyEip.correlation-identifier.model.flow.states.0.results',
      await1: 'studyEip.correlation-identifier.model.flow.states.0.await1',
      await2: 'studyEip.correlation-identifier.model.flow.states.0.await2',
      await3: 'studyEip.correlation-identifier.model.flow.states.0.await3',
    },
    1: {
      kernel: {
        key: 'studyEip.correlation-identifier.model.flow.states.1.kernel',
        params: { pending: commandCount - 1 },
      },
      worker1: 'studyEip.correlation-identifier.model.flow.states.1.worker1',
      await1: 'studyEip.correlation-identifier.model.flow.states.1.await1',
    },
    2: {
      kernel: {
        key: 'studyEip.correlation-identifier.model.flow.states.2.kernel',
        params: { pending: commandCount - 2 },
      },
      worker2: 'studyEip.correlation-identifier.model.flow.states.2.worker2',
      await2: 'studyEip.correlation-identifier.model.flow.states.2.await2',
    },
    3: {
      kernel: 'studyEip.correlation-identifier.model.flow.states.3.kernel',
      worker3: 'studyEip.correlation-identifier.model.flow.states.3.worker3',
      await3: 'studyEip.correlation-identifier.model.flow.states.3.await3',
    },
    4: {
      worker3: 'studyEip.correlation-identifier.model.flow.states.4.worker3',
    },
    5: { await3: 'studyEip.correlation-identifier.model.flow.states.5.await3' },
    6: {
      worker1: 'studyEip.correlation-identifier.model.flow.states.6.worker1',
    },
    7: { await1: 'studyEip.correlation-identifier.model.flow.states.7.await1' },
    8: {
      worker2: 'studyEip.correlation-identifier.model.flow.states.8.worker2',
    },
    9: { await2: 'studyEip.correlation-identifier.model.flow.states.9.await2' },
    10: {
      worker2: 'studyEip.correlation-identifier.model.flow.states.10.worker2',
      results: 'studyEip.correlation-identifier.model.flow.states.10.results',
    },
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
  caption: 'studyEip.correlation-identifier.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
