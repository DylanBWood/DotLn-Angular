import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

const firstEvidence = ['evidence31'];
const waitingEvidence = ['evidence32'];
const backlog = [...waitingEvidence, 'evidence33'];

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
    {
      id: 'operator',
      label: 'studyEip.control-bus.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'executor',
      label: 'studyEip.control-bus.model.example.nodes.1.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'bus',
      label: 'studyEip.control-bus.model.example.nodes.2.label',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'queue',
      label: 'studyEip.control-bus.model.example.nodes.3.label',
      stage: 1,
      row: 1,
      kind: 'channel',
    },
    {
      id: 'verifier',
      label: 'studyEip.control-bus.model.example.nodes.4.label',
      stage: 2,
      row: 1,
    },
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
  caption: 'studyEip.control-bus.model.example.caption',
  messages: {
    evidence31: {
      key: '31',
      content: 'studyEip.control-bus.model.example.messages.evidence31.content',
    },
    evidence32: {
      key: '32',
      content: 'studyEip.control-bus.model.example.messages.evidence32.content',
    },
    evidence33: {
      key: '33',
      content: 'studyEip.control-bus.model.example.messages.evidence33.content',
    },
    status: {
      key: 's',
      content: 'studyEip.control-bus.model.example.messages.status.content',
    },
    executorAnswer: {
      key: 'e',
      content: 'studyEip.control-bus.model.example.messages.executorAnswer.content',
    },
    verifierAnswer: {
      key: 'v',
      content: 'studyEip.control-bus.model.example.messages.verifierAnswer.content',
    },
    pause: {
      key: 'p',
      content: 'studyEip.control-bus.model.example.messages.pause.content',
    },
    direction: {
      key: 'g',
      content: 'studyEip.control-bus.model.example.messages.direction.content',
    },
  },
  start: {
    states: {
      executor: 'studyEip.control-bus.model.example.start.states.executor',
      operator: 'studyEip.control-bus.model.example.start.states.operator',
      queue: 'studyEip.control-bus.model.example.start.states.queue',
      verifier: 'studyEip.control-bus.model.example.start.states.verifier',
    },
    note: 'studyEip.control-bus.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'evidence31', link: 'put' }],
      states: {
        executor: 'studyEip.control-bus.model.example.steps.0.states.executor',
        queue: {
          key: 'studyEip.control-bus.model.example.steps.0.states.queue',
          params: { count: firstEvidence.length },
        },
      },
      held: { queue: firstEvidence },
      note: 'studyEip.control-bus.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'evidence31', link: 'take' }],
      states: {
        queue: 'studyEip.control-bus.model.example.steps.1.states.queue',
        verifier: 'studyEip.control-bus.model.example.steps.1.states.verifier',
      },
      held: { queue: [], verifier: ['evidence31'] },
      note: 'studyEip.control-bus.model.example.steps.1.note',
    },
    {
      moves: [{ message: 'evidence32', link: 'put' }],
      states: {
        executor: 'studyEip.control-bus.model.example.steps.2.states.executor',
        queue: {
          key: 'studyEip.control-bus.model.example.steps.2.states.queue',
          params: { count: waitingEvidence.length },
        },
      },
      held: { queue: waitingEvidence },
      note: 'studyEip.control-bus.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'status', link: 'ask' }],
      states: {
        operator: 'studyEip.control-bus.model.example.steps.3.states.operator',
      },
      note: 'studyEip.control-bus.model.example.steps.3.note',
    },
    {
      moves: [
        { message: 'status', link: 'to-executor' },
        { message: 'status', link: 'to-verifier' },
      ],
      note: 'studyEip.control-bus.model.example.steps.4.note',
    },
    {
      moves: [
        { message: 'executorAnswer', link: 'from-executor' },
        { message: 'verifierAnswer', link: 'from-verifier' },
      ],
      note: 'studyEip.control-bus.model.example.steps.5.note',
    },
    {
      moves: [
        { message: 'executorAnswer', link: 'tell' },
        { message: 'verifierAnswer', link: 'tell' },
      ],
      states: {
        operator: 'studyEip.control-bus.model.example.steps.6.states.operator',
      },
      note: 'studyEip.control-bus.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'pause', link: 'ask' }],
      states: {
        operator: 'studyEip.control-bus.model.example.steps.7.states.operator',
      },
      note: 'studyEip.control-bus.model.example.steps.7.note',
    },
    {
      moves: [{ message: 'pause', link: 'to-verifier' }],
      states: {
        verifier: 'studyEip.control-bus.model.example.steps.8.states.verifier',
      },
      note: 'studyEip.control-bus.model.example.steps.8.note',
    },
    {
      moves: [{ message: 'evidence33', link: 'put' }],
      states: {
        executor: 'studyEip.control-bus.model.example.steps.9.states.executor',
        queue: {
          key: 'studyEip.control-bus.model.example.steps.9.states.queue',
          params: { count: backlog.length },
        },
      },
      held: { queue: backlog },
      note: 'studyEip.control-bus.model.example.steps.9.note',
    },
    {
      moves: [{ message: 'direction', link: 'ask' }],
      states: {
        operator: 'studyEip.control-bus.model.example.steps.10.states.operator',
      },
      note: 'studyEip.control-bus.model.example.steps.10.note',
    },
    {
      moves: [{ message: 'direction', link: 'to-verifier' }],
      states: {
        verifier: 'studyEip.control-bus.model.example.steps.11.states.verifier',
      },
      note: 'studyEip.control-bus.model.example.steps.11.note',
    },
  ],
  moments: [
    { label: 'studyEip.control-bus.model.example.moments.0.label', step: 3 },
    { label: 'studyEip.control-bus.model.example.moments.1.label', step: 7 },
    { label: 'studyEip.control-bus.model.example.moments.2.label', step: 9 },
    { label: 'studyEip.control-bus.model.example.moments.3.label', step: 10 },
    { label: 'studyEip.control-bus.model.example.moments.4.label', step: 12 },
  ],

  parameterMessages: {
    pause: 'studyEip.control-bus.record.parameters.pause',
    direction: 'studyEip.control-bus.record.parameters.direction',
  },
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
