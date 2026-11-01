import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * The story, one sentence to a step. The executor puts evidence 31 on the work queue, and the queue
 * delivers it to the verifier. The executor puts evidence 32 on the queue, where it waits because
 * the verifier is busy. The operator puts a status question on the control bus; the bus delivers
 * it to both roles; both answer on the bus; the bus delivers the answers to the operator. The
 * operator puts a pause on the bus, and the bus delivers it to the verifier, which stops at once
 * although 32 is still queued. The executor was sent no pause, so it puts evidence 33 on the queue
 * as usual, and the backlog grows. The operator puts the go-ahead on the bus; the bus delivers it, and
 * the verifier goes back to evidence 31.
 *
 * The two channels are pipes side by side, the control bus above the work queue, and every line
 * joins neighbouring stages, so no line skips a stage, runs behind a box or joins two boxes of one
 * stage, which a phone would draw side by side with no room for a message between them. The boxes
 * stand so that no message is drawn over a box while it moves, across the screen or down it.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'operator', label: 'Operator', stage: 0 },
    { id: 'executor', label: 'Executor', stage: 0, row: 1 },
    { id: 'bus', label: 'Control bus', stage: 1, kind: 'channel', tone: 'subject' },
    { id: 'queue', label: 'Work queue', stage: 1, row: 1, kind: 'channel' },
    { id: 'verifier', label: 'Verifier', stage: 2, row: 1 },
  ],
  links: [
    { id: 'put', from: 'executor', to: 'queue' },
    { id: 'take', from: 'queue', to: 'verifier' },
    { id: 'ask', from: 'operator', to: 'bus' },
    { id: 'tell', from: 'bus', to: 'operator' },
    { id: 'to-executor', from: 'bus', to: 'executor' },
    { id: 'from-executor', from: 'executor', to: 'bus' },
    { id: 'to-verifier', from: 'bus', to: 'verifier' },
    { id: 'from-verifier', from: 'verifier', to: 'bus' },
  ],
  caption:
    "Each token is one message. 31, 32 and 33 are the evidence of those orders, which the Executor puts on the Work queue for the Verifier. On the Control bus, s is the Operator's status question, e and v are the Executor's and the Verifier's answers, p is the pause, analysis:, and g is the go-ahead. The Executor and the Verifier are the two roles doing the work, and the Operator is the person steering them. The Work queue and the Control bus are the two channels every role is joined to: the queue carries only evidence and holds what the Verifier has not yet taken, the bus carries only questions, commands and answers and holds nothing. The words in a box say what that box is doing, and the tokens in a box are the messages it holds. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
  messages: {
    evidence31: { key: '31', content: 'evidence of order 31' },
    evidence32: { key: '32', content: 'evidence of order 32' },
    evidence33: { key: '33', content: 'evidence of order 33' },
    status: { key: 's', content: 'status?' },
    executorAnswer: { key: 'e', content: 'executor: on order 33' },
    verifierAnswer: { key: 'v', content: 'verifier: checking 31' },
    pause: { key: 'p', content: 'analysis:' },
    direction: { key: 'g', content: 'go ahead' },
  },
  start: {
    states: {
      executor: 'finishing order 31',
      operator: 'watching',
      queue: 'empty',
      verifier: 'waiting',
    },
    note: 'Nothing has moved. The executor is finishing order 31, the work queue is empty, the verifier is waiting for evidence and the control bus is quiet.',
  },
  steps: [
    {
      moves: [{ message: 'evidence31', link: 'put' }],
      states: { executor: 'works on order 32', queue: '1 record' },
      held: { queue: ['evidence31'] },
      note: 'The executor puts 31, the evidence of order 31, on the work queue.',
    },
    {
      moves: [{ message: 'evidence31', link: 'take' }],
      states: { queue: 'empty', verifier: 'checking 31' },
      held: { queue: [], verifier: ['evidence31'] },
      note: 'The work queue delivers 31 to the verifier, which starts checking it.',
    },
    {
      moves: [{ message: 'evidence32', link: 'put' }],
      states: { executor: 'works on order 33', queue: '1 record' },
      held: { queue: ['evidence32'] },
      note: 'The executor puts 32 on the work queue. The verifier is busy with 31, so 32 waits in the queue.',
    },
    {
      moves: [{ message: 'status', link: 'ask' }],
      states: { operator: 'awaits answers' },
      note: 'The operator puts s, a status question, on the control bus. It is not on the work queue, so it does not wait behind 32.',
    },
    {
      moves: [
        { message: 'status', link: 'to-executor' },
        { message: 'status', link: 'to-verifier' },
      ],
      note: 'The control bus delivers s to the executor and to the verifier, each at its control port. 32 stays where it is in the work queue.',
    },
    {
      moves: [
        { message: 'executorAnswer', link: 'from-executor' },
        { message: 'verifierAnswer', link: 'from-verifier' },
      ],
      note: 'Both roles answer on the control bus: the executor sends e, that it is working on order 33, and the verifier sends v, that it is checking 31.',
    },
    {
      moves: [
        { message: 'executorAnswer', link: 'tell' },
        { message: 'verifierAnswer', link: 'tell' },
      ],
      states: { operator: 'has both answers' },
      note: 'The control bus delivers e and v to the operator. Nothing on the work queue moved to produce them.',
    },
    {
      moves: [{ message: 'pause', link: 'ask' }],
      states: { operator: 'sent the pause' },
      note: 'The operator puts p, the pause analysis:, on the control bus, addressed to the verifier.',
    },
    {
      moves: [{ message: 'pause', link: 'to-verifier' }],
      states: { verifier: 'paused' },
      note: 'The control bus delivers p to the verifier, which stops at once and keeps 31. Put on the work queue instead, p would still be waiting behind 32.',
    },
    {
      moves: [{ message: 'evidence33', link: 'put' }],
      states: { executor: 'works on order 34', queue: '2 records' },
      held: { queue: ['evidence32', 'evidence33'] },
      note: 'The pause was addressed to the verifier alone, so the executor puts 33 on the work queue as usual. It joins 32, and the backlog grows while the verifier is paused.',
    },
    {
      moves: [{ message: 'direction', link: 'ask' }],
      states: { operator: 'sent the go-ahead' },
      note: 'The operator puts g, the go-ahead, on the control bus for the verifier.',
    },
    {
      moves: [{ message: 'direction', link: 'to-verifier' }],
      states: { verifier: 'checking 31 again' },
      note: 'The control bus delivers g to the verifier, which goes back to checking 31. 32 and 33 wait in the work queue for their turn.',
    },
  ],
  moments: [
    { label: 'Queued', step: 3 },
    { label: 'Answers in', step: 7 },
    { label: 'Pause arrives', step: 9 },
    { label: 'Backlog grows', step: 10 },
    { label: 'Resumed', step: 12 },
  ],
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
