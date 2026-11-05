import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * A requestor and a replier joined by two one-way channels, told as an analogy with DotLn's
 * kernel. The kernel puts a command on the Outbox, the Adapter takes it and answers on the Event
 * log, and the kernel resumes the work it set aside. A second command gets only a receipt back in
 * time, so the kernel gives up at its deadline, and the result that turns up later finds nothing
 * waiting for it. One thing happens at each step. Lower-case letters belong to the first command
 * and capitals to the second: c and C are the commands, A the receipt and r and R the results.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'kernel',
      label: 'studyEip.request-reply.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'outbox',
      label: 'studyEip.request-reply.model.example.nodes.1.label',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'log',
      label: 'studyEip.request-reply.model.example.nodes.2.label',
      stage: 1,
      row: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'adapter',
      label: 'studyEip.request-reply.model.example.nodes.3.label',
      stage: 2,
    },
  ],
  links: [
    { id: 'send', from: 'kernel', to: 'outbox' },
    { id: 'take', from: 'outbox', to: 'adapter' },
    { id: 'answer', from: 'adapter', to: 'log' },
    { id: 'read', from: 'log', to: 'kernel' },
  ],
  messages: {
    command1: {
      key: 'c',
      content: 'studyEip.request-reply.model.example.messages.command1.content',
    },
    result1: {
      key: 'r',
      content: 'studyEip.request-reply.model.example.messages.result1.content',
    },
    command2: {
      key: 'C',
      content: 'studyEip.request-reply.model.example.messages.command2.content',
    },
    receipt2: {
      key: 'A',
      content: 'studyEip.request-reply.model.example.messages.receipt2.content',
    },
    result2: {
      key: 'R',
      content: 'studyEip.request-reply.model.example.messages.result2.content',
    },
  },
  start: {
    states: {
      kernel: 'studyEip.request-reply.model.example.start.states.kernel',
      adapter: 'studyEip.request-reply.model.example.start.states.adapter',
    },
    note: 'studyEip.request-reply.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'command1', link: 'send' }],
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.0.states.kernel',
      },
      held: { outbox: ['command1'] },
      note: 'studyEip.request-reply.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'command1', link: 'take' }],
      states: {
        adapter: 'studyEip.request-reply.model.example.steps.1.states.adapter',
      },
      held: { outbox: [], adapter: ['command1'] },
      note: 'studyEip.request-reply.model.example.steps.1.note',
    },
    {
      moves: [{ message: 'result1', link: 'answer' }],
      states: {
        adapter: 'studyEip.request-reply.model.example.steps.2.states.adapter',
      },
      held: { adapter: [], log: ['result1'] },
      note: 'studyEip.request-reply.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'result1', link: 'read' }],
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.3.states.kernel',
      },
      held: { log: [] },
      note: 'studyEip.request-reply.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'command2', link: 'send' }],
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.4.states.kernel',
      },
      held: { outbox: ['command2'] },
      note: 'studyEip.request-reply.model.example.steps.4.note',
    },
    {
      moves: [{ message: 'command2', link: 'take' }],
      states: {
        adapter: 'studyEip.request-reply.model.example.steps.5.states.adapter',
      },
      held: { outbox: [], adapter: ['command2'] },
      note: 'studyEip.request-reply.model.example.steps.5.note',
    },
    {
      moves: [{ message: 'receipt2', link: 'answer' }],
      held: { log: ['receipt2'] },
      note: 'studyEip.request-reply.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'receipt2', link: 'read' }],
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.7.states.kernel',
      },
      held: { log: [] },
      note: 'studyEip.request-reply.model.example.steps.7.note',
    },
    {
      note: 'studyEip.request-reply.model.example.steps.8.note',
    },
    {
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.9.states.kernel',
      },
      note: 'studyEip.request-reply.model.example.steps.9.note',
    },
    {
      moves: [{ message: 'result2', link: 'answer' }],
      states: {
        adapter: 'studyEip.request-reply.model.example.steps.10.states.adapter',
      },
      held: { adapter: [], log: ['result2'] },
      note: 'studyEip.request-reply.model.example.steps.10.note',
    },
    {
      moves: [{ message: 'result2', link: 'read' }],
      states: {
        kernel: 'studyEip.request-reply.model.example.steps.11.states.kernel',
      },
      held: { log: [] },
      note: 'studyEip.request-reply.model.example.steps.11.note',
    },
  ],
  moments: [
    { label: 'studyEip.request-reply.model.example.moments.0.label', step: 1 },
    { label: 'studyEip.request-reply.model.example.moments.1.label', step: 4 },
    { label: 'studyEip.request-reply.model.example.moments.2.label', step: 8 },
    { label: 'studyEip.request-reply.model.example.moments.3.label', step: 10 },
    { label: 'studyEip.request-reply.model.example.moments.4.label', step: 12 },
  ],
  caption: 'studyEip.request-reply.model.example.caption',

  parameterMessages: {
    first: 'studyEip.request-reply.record.parameters.first',
    second: 'studyEip.request-reply.record.parameters.second',
  },
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
