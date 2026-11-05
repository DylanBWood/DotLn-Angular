import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

const firstCopy = ['copyEvidence31'];
const order31Copies = [...firstCopy, 'copyReport31'];
const retainedCopies = [...order31Copies, 'copyReport32'];

/**
 * The story, one sentence to a step. The executor sends evidence 31 to the verifier and fires an
 * envelope of it at the control log. The verifier sends its report on order 31 to the reviewer and
 * fires a whole copy of it at the log. The reviewer finishes with the report. The audit asks the
 * log about order 31, and the log answers. The log is down when the executor sends evidence 32, so
 * that envelope is lost. The log is up again when the verifier sends its report on order 32 and
 * its copy. The audit asks about order 32, and the log answers with a report that has no evidence
 * behind it.
 *
 * Lower case letters are order 31's records and capitals order 32's; digits are the copies. The
 * executor stands below the verifier and the log to the right of both senders, so each copy leaves
 * its sender beside the record it copies; the evidence's copy skips a stage and runs round the
 * boxes.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'executor',
      label: 'studyEip.message-store.model.example.nodes.0.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'verifier',
      label: 'studyEip.message-store.model.example.nodes.1.label',
      stage: 1,
    },
    {
      id: 'reviewer',
      label: 'studyEip.message-store.model.example.nodes.2.label',
      stage: 2,
    },
    {
      id: 'log',
      label: 'studyEip.message-store.model.example.nodes.3.label',
      stage: 2,
      row: 1,
      tone: 'subject',
    },
    {
      id: 'audit',
      label: 'studyEip.message-store.model.example.nodes.4.label',
      stage: 3,
      row: 1,
    },
  ],
  links: [
    { id: 'hand-over', from: 'executor', to: 'verifier' },
    { id: 'file', from: 'verifier', to: 'reviewer' },
    { id: 'copy-evidence', from: 'executor', to: 'log' },
    { id: 'copy-report', from: 'verifier', to: 'log' },
    { id: 'ask', from: 'audit', to: 'log' },
    { id: 'answer', from: 'log', to: 'audit' },
  ],
  caption: 'studyEip.message-store.model.example.caption',
  messages: {
    evidence31: {
      key: 'e',
      content: 'studyEip.message-store.model.example.messages.evidence31.content',
    },
    report31: {
      key: 'r',
      content: 'studyEip.message-store.model.example.messages.report31.content',
    },
    evidence32: {
      key: 'E',
      content: 'studyEip.message-store.model.example.messages.evidence32.content',
    },
    report32: {
      key: 'R',
      content: 'studyEip.message-store.model.example.messages.report32.content',
    },
    copyEvidence31: {
      key: '1',
      content: 'studyEip.message-store.model.example.messages.copyEvidence31.content',
    },
    copyReport31: {
      key: '2',
      content: 'studyEip.message-store.model.example.messages.copyReport31.content',
    },
    copyEvidence32: {
      key: '3',
      content: 'studyEip.message-store.model.example.messages.copyEvidence32.content',
    },
    copyReport32: {
      key: '4',
      content: 'studyEip.message-store.model.example.messages.copyReport32.content',
    },
    ask31: {
      key: 'q',
      content: 'studyEip.message-store.model.example.messages.ask31.content',
    },
    answer31: {
      key: 'a',
      content: 'studyEip.message-store.model.example.messages.answer31.content',
    },
    ask32: {
      key: 'Q',
      content: 'studyEip.message-store.model.example.messages.ask32.content',
    },
    answer32: {
      key: 'A',
      content: 'studyEip.message-store.model.example.messages.answer32.content',
    },
  },
  start: {
    states: {
      executor: 'studyEip.message-store.model.example.start.states.executor',
      verifier: 'studyEip.message-store.model.example.start.states.verifier',
      reviewer: 'studyEip.message-store.model.example.start.states.reviewer',
      log: 'studyEip.message-store.model.example.start.states.log',
      audit: 'studyEip.message-store.model.example.start.states.audit',
    },
    note: 'studyEip.message-store.model.example.start.note',
  },
  steps: [
    {
      moves: [
        { message: 'evidence31', link: 'hand-over' },
        { message: 'copyEvidence31', link: 'copy-evidence' },
      ],
      states: {
        executor: 'studyEip.message-store.model.example.steps.0.states.executor',
        verifier: 'studyEip.message-store.model.example.steps.0.states.verifier',
        log: {
          key: 'studyEip.message-store.model.example.steps.0.states.log',
          params: { count: firstCopy.length },
        },
      },
      held: { verifier: ['evidence31'], log: firstCopy },
      note: 'studyEip.message-store.model.example.steps.0.note',
    },
    {
      moves: [
        { message: 'report31', link: 'file' },
        { message: 'copyReport31', link: 'copy-report' },
      ],
      states: {
        verifier: 'studyEip.message-store.model.example.steps.1.states.verifier',
        reviewer: 'studyEip.message-store.model.example.steps.1.states.reviewer',
        log: {
          key: 'studyEip.message-store.model.example.steps.1.states.log',
          params: { count: order31Copies.length },
        },
      },
      held: {
        verifier: [],
        reviewer: ['report31'],
        log: order31Copies,
      },
      note: 'studyEip.message-store.model.example.steps.1.note',
    },
    {
      states: {
        reviewer: 'studyEip.message-store.model.example.steps.2.states.reviewer',
      },
      held: { reviewer: [] },
      note: 'studyEip.message-store.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'ask31', link: 'ask' }],
      states: {
        audit: 'studyEip.message-store.model.example.steps.3.states.audit',
      },
      note: 'studyEip.message-store.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'answer31', link: 'answer' }],
      states: {
        audit: 'studyEip.message-store.model.example.steps.4.states.audit',
      },
      note: 'studyEip.message-store.model.example.steps.4.note',
    },
    {
      moves: [
        { message: 'evidence32', link: 'hand-over' },
        { message: 'copyEvidence32', link: 'copy-evidence' },
      ],
      states: {
        executor: 'studyEip.message-store.model.example.steps.5.states.executor',
        verifier: 'studyEip.message-store.model.example.steps.5.states.verifier',
        log: {
          key: 'studyEip.message-store.model.example.steps.5.states.log',
          params: { count: order31Copies.length },
        },
      },
      held: { verifier: ['evidence32'] },
      note: 'studyEip.message-store.model.example.steps.5.note',
    },
    {
      moves: [
        { message: 'report32', link: 'file' },
        { message: 'copyReport32', link: 'copy-report' },
      ],
      states: {
        verifier: 'studyEip.message-store.model.example.steps.6.states.verifier',
        reviewer: 'studyEip.message-store.model.example.steps.6.states.reviewer',
        log: {
          key: 'studyEip.message-store.model.example.steps.6.states.log',
          params: { count: retainedCopies.length },
        },
      },
      held: {
        verifier: [],
        reviewer: ['report32'],
        log: retainedCopies,
      },
      note: 'studyEip.message-store.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'ask32', link: 'ask' }],
      states: {
        audit: 'studyEip.message-store.model.example.steps.7.states.audit',
      },
      note: 'studyEip.message-store.model.example.steps.7.note',
    },
    {
      moves: [{ message: 'answer32', link: 'answer' }],
      states: {
        audit: 'studyEip.message-store.model.example.steps.8.states.audit',
      },
      note: 'studyEip.message-store.model.example.steps.8.note',
    },
  ],
  moments: [
    { label: 'studyEip.message-store.model.example.moments.0.label', step: 1 },
    { label: 'studyEip.message-store.model.example.moments.1.label', step: 5 },
    { label: 'studyEip.message-store.model.example.moments.2.label', step: 6 },
    { label: 'studyEip.message-store.model.example.moments.3.label', step: 9 },
  ],

  parameterMessages: {
    keptInFull: 'studyEip.message-store.record.parameters.keptInFull',
    envelopeOnly: 'studyEip.message-store.record.parameters.envelopeOnly',
  },
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
