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
    { id: 'kernel', label: 'Kernel', stage: 0 },
    { id: 'outbox', label: 'Outbox', stage: 1, kind: 'channel', tone: 'subject' },
    { id: 'log', label: 'Event log', stage: 1, row: 1, kind: 'channel', tone: 'subject' },
    { id: 'adapter', label: 'Adapter', stage: 2 },
  ],
  links: [
    { id: 'send', from: 'kernel', to: 'outbox' },
    { id: 'take', from: 'outbox', to: 'adapter' },
    { id: 'answer', from: 'adapter', to: 'log' },
    { id: 'read', from: 'log', to: 'kernel' },
  ],
  messages: {
    command1: { key: 'c', content: 'command cmd_1' },
    result1: { key: 'r', content: 'result for cmd_1: completed' },
    command2: { key: 'C', content: 'command cmd_2' },
    receipt2: { key: 'A', content: 'receipt: cmd_2 accepted' },
    result2: { key: 'R', content: 'result for cmd_2: completed' },
  },
  start: {
    states: { kernel: 'ready to send cmd_1', adapter: 'idle' },
    note: 'The Kernel has a command, cmd_1, to send, and has set aside what it will do with each kind of result.',
  },
  steps: [
    {
      moves: [{ message: 'command1', link: 'send' }],
      states: { kernel: 'waits for cmd_1' },
      held: { outbox: ['command1'] },
      note: 'The Kernel puts command c, cmd_1, on the Outbox, the request channel, and carries on without blocking.',
    },
    {
      moves: [{ message: 'command1', link: 'take' }],
      states: { adapter: 'running cmd_1' },
      held: { outbox: [], adapter: ['command1'] },
      note: 'The Adapter takes c off the Outbox and has a worker carry it out.',
    },
    {
      moves: [{ message: 'result1', link: 'answer' }],
      states: { adapter: 'idle' },
      held: { adapter: [], log: ['result1'] },
      note: 'The work is done, and the Adapter puts r, the result for cmd_1, on the Event log, the reply channel.',
    },
    {
      moves: [{ message: 'result1', link: 'read' }],
      states: { kernel: "resumed on cmd_1's result" },
      held: { log: [] },
      note: 'The Kernel takes r off the Event log and resumes the work it saved for a completed result. The request went out on one channel and the reply came back on the other.',
    },
    {
      moves: [{ message: 'command2', link: 'send' }],
      states: { kernel: 'waits for cmd_2, deadline set' },
      held: { outbox: ['command2'] },
      note: 'The Kernel puts a second command, C, cmd_2, on the Outbox, and this time gives its wait a deadline.',
    },
    {
      moves: [{ message: 'command2', link: 'take' }],
      states: { adapter: 'running cmd_2' },
      held: { outbox: [], adapter: ['command2'] },
      note: 'The Adapter takes C off the Outbox and has a worker carry it out.',
    },
    {
      moves: [{ message: 'receipt2', link: 'answer' }],
      held: { log: ['receipt2'] },
      note: 'The Adapter puts A, a receipt saying cmd_2 was accepted, on the Event log.',
    },
    {
      moves: [{ message: 'receipt2', link: 'read' }],
      states: { kernel: 'cmd_2 accepted; still waits' },
      held: { log: [] },
      note: 'The Kernel takes A off the Event log and keeps waiting: a receipt says the command arrived, not what came of it.',
    },
    {
      note: 'Nothing arrives on the Event log: the worker on cmd_2 is slow, and the Kernel goes on waiting.',
    },
    {
      states: { kernel: 'gave up on cmd_2' },
      note: 'The deadline passes with no result for cmd_2, so the Kernel stops waiting and takes its timeout path instead of hanging.',
    },
    {
      moves: [{ message: 'result2', link: 'answer' }],
      states: { adapter: 'idle' },
      held: { adapter: [], log: ['result2'] },
      note: 'The work on cmd_2 finishes after all, and the Adapter puts R, its result, on the Event log.',
    },
    {
      moves: [{ message: 'result2', link: 'read' }],
      states: { kernel: 'ignored late result' },
      held: { log: [] },
      note: 'The Kernel takes R off the Event log. It names cmd_2, which nothing waits for any more, so it changes nothing.',
    },
  ],
  moments: [
    { label: 'Request sent', step: 1 },
    { label: 'Reply resumes', step: 4 },
    { label: 'Receipt only', step: 8 },
    { label: 'Deadline', step: 10 },
    { label: 'Late reply', step: 12 },
  ],
  caption:
    'Each token is one message. Lower-case letters belong to the first command, cmd_1, and capitals to the second, cmd_2: c and C are the commands, A is a receipt saying cmd_2 was accepted, and r and R are the results. The Kernel is the requestor: it sends commands and waits for their results. The Outbox is the request channel, which carries commands to the Adapter; the Adapter is the replier, which has a worker carry out each command; the Event log is the reply channel, which carries receipts and results back to the Kernel. The words in a box say what that box is doing. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.',
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
