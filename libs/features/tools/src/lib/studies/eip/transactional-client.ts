import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

const firstWrite = ['w1'];
const bothWrites = [...firstWrite, 'w2'];

/**
 * A worker takes a pending command from an outbox inside a transaction, makes one write that the
 * transaction does not cover, stages a receipt and a result entry, and crashes before it commits.
 * A second attempt does the same and commits. Nothing here runs as a stream: the point is when
 * the messaging system makes a receive and two sends visible, so the flow is written step by step,
 * and the spec beside this file asserts what each step shows.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'outbox',
      label: 'studyEip.transactional-client.model.example.nodes.0.label',
      stage: 0,
      row: 1,
      kind: 'channel',
    },
    {
      id: 'worker',
      label: 'studyEip.transactional-client.model.example.nodes.1.label',
      stage: 1,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'receipts',
      label: 'studyEip.transactional-client.model.example.nodes.2.label',
      stage: 2,
      row: 0,
      kind: 'channel',
    },
    {
      id: 'log',
      label: 'studyEip.transactional-client.model.example.nodes.3.label',
      stage: 2,
      row: 1,
      kind: 'channel',
    },
    {
      id: 'outside',
      label: 'studyEip.transactional-client.model.example.nodes.4.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    { id: 'take', from: 'outbox', to: 'worker' },
    { id: 'receipt', from: 'worker', to: 'receipts' },
    { id: 'append', from: 'worker', to: 'log' },
    { id: 'write', from: 'worker', to: 'outside' },
  ],
  messages: {
    c: {
      key: 'c',
      content: 'studyEip.transactional-client.model.example.messages.c.content',
    },
    r: {
      key: 'r',
      content: 'studyEip.transactional-client.model.example.messages.r.content',
    },
    e: {
      key: 'e',
      content: 'studyEip.transactional-client.model.example.messages.e.content',
    },
    w1: {
      key: '1',
      content: 'studyEip.transactional-client.model.example.messages.w1.content',
    },
    w2: {
      key: '2',
      content: 'studyEip.transactional-client.model.example.messages.w2.content',
    },
  },
  caption: 'studyEip.transactional-client.model.example.caption',
  start: {
    states: {
      outbox: 'studyEip.transactional-client.model.example.start.states.outbox',
      worker: 'studyEip.transactional-client.model.example.start.states.worker',
      receipts: 'studyEip.transactional-client.model.example.start.states.receipts',
      log: 'studyEip.transactional-client.model.example.start.states.log',
      outside: 'studyEip.transactional-client.model.example.start.states.outside',
    },
    held: { outbox: ['c'] },
    note: 'studyEip.transactional-client.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'c', link: 'take' }],
      states: {
        outbox: 'studyEip.transactional-client.model.example.steps.0.states.outbox',
        worker: 'studyEip.transactional-client.model.example.steps.0.states.worker',
      },
      held: { worker: ['c'] },
      note: 'studyEip.transactional-client.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'w1', link: 'write' }],
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.1.states.worker',
        outside: 'studyEip.transactional-client.model.example.steps.1.states.outside',
      },
      held: { outside: firstWrite },
      note: 'studyEip.transactional-client.model.example.steps.1.note',
    },
    {
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.2.states.worker',
      },
      held: { worker: ['c', 'r', 'e'] },
      note: 'studyEip.transactional-client.model.example.steps.2.note',
    },
    {
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.3.states.worker',
        outbox: 'studyEip.transactional-client.model.example.steps.3.states.outbox',
      },
      held: { worker: [] },
      note: 'studyEip.transactional-client.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'c', link: 'take' }],
      states: {
        outbox: 'studyEip.transactional-client.model.example.steps.4.states.outbox',
        worker: 'studyEip.transactional-client.model.example.steps.4.states.worker',
      },
      held: { worker: ['c'] },
      note: 'studyEip.transactional-client.model.example.steps.4.note',
    },
    {
      moves: [{ message: 'w2', link: 'write' }],
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.5.states.worker',
        outside: {
          key: 'studyEip.transactional-client.model.example.steps.5.states.outside',
          params: { writes: bothWrites.length },
        },
      },
      held: { outside: bothWrites },
      note: {
        key: 'studyEip.transactional-client.model.example.steps.5.note',
        params: { writes: bothWrites.length },
      },
    },
    {
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.6.states.worker',
      },
      held: { worker: ['c', 'r', 'e'] },
      note: 'studyEip.transactional-client.model.example.steps.6.note',
    },
    {
      moves: [
        { message: 'r', link: 'receipt' },
        { message: 'e', link: 'append' },
      ],
      states: {
        worker: 'studyEip.transactional-client.model.example.steps.7.states.worker',
        outbox: 'studyEip.transactional-client.model.example.steps.7.states.outbox',
        receipts: 'studyEip.transactional-client.model.example.steps.7.states.receipts',
        log: 'studyEip.transactional-client.model.example.steps.7.states.log',
      },
      held: { worker: [], outbox: [], receipts: ['r'], log: ['e'] },
      note: 'studyEip.transactional-client.model.example.steps.7.note',
    },
  ],
  moments: [
    {
      label: 'studyEip.transactional-client.model.example.moments.0.label',
      step: 1,
    },
    {
      label: 'studyEip.transactional-client.model.example.moments.1.label',
      step: 3,
    },
    {
      label: 'studyEip.transactional-client.model.example.moments.2.label',
      step: 4,
    },
    {
      label: {
        key: 'studyEip.transactional-client.model.example.moments.3.label',
        params: { writes: bothWrites.length },
      },
      step: 6,
    },
    {
      label: 'studyEip.transactional-client.model.example.moments.4.label',
      step: 8,
    },
  ],
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
