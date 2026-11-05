import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/** The step at which the worker's machine crashes; the record's parameter names the same step. */
export const crashStep = 5;

/**
 * One command handed from a host to a worker on another machine, through a store on each side:
 * the host's outbox and the worker's inbox. Each store keeps its copy until the next holder has
 * confirmed it, so the worker's crash before its receipt loses nothing and the command is
 * delivered again. The idea is durable storage and crashes, not a stream of values, so the steps
 * are written out here rather than run.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'host',
      label: 'studyEip.guaranteed-delivery.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'outbox',
      label: 'studyEip.guaranteed-delivery.model.example.nodes.1.label',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'inbox',
      label: 'studyEip.guaranteed-delivery.model.example.nodes.2.label',
      stage: 2,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'worker',
      label: 'studyEip.guaranteed-delivery.model.example.nodes.3.label',
      stage: 3,
    },
  ],
  links: [
    { id: 'send', from: 'host', to: 'outbox' },
    { id: 'forward', from: 'outbox', to: 'inbox' },
    { id: 'saved', from: 'inbox', to: 'outbox' },
    { id: 'deliver', from: 'inbox', to: 'worker' },
    { id: 'receipt', from: 'worker', to: 'inbox' },
  ],
  messages: {
    c: {
      key: 'c',
      content: 'studyEip.guaranteed-delivery.model.example.messages.c.content',
    },
    s: {
      key: 's',
      content: 'studyEip.guaranteed-delivery.model.example.messages.s.content',
    },
    r: {
      key: 'r',
      content: 'studyEip.guaranteed-delivery.model.example.messages.r.content',
    },
  },
  start: {
    states: {
      host: 'studyEip.guaranteed-delivery.model.example.start.states.host',
      outbox: 'studyEip.guaranteed-delivery.model.example.start.states.outbox',
      inbox: 'studyEip.guaranteed-delivery.model.example.start.states.inbox',
      worker: 'studyEip.guaranteed-delivery.model.example.start.states.worker',
    },
    note: 'studyEip.guaranteed-delivery.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'c', link: 'send' }],
      states: {
        host: 'studyEip.guaranteed-delivery.model.example.steps.0.states.host',
        outbox: 'studyEip.guaranteed-delivery.model.example.steps.0.states.outbox',
      },
      held: { outbox: ['c'] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'c', link: 'forward' }],
      states: {
        outbox: 'studyEip.guaranteed-delivery.model.example.steps.1.states.outbox',
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.1.states.inbox',
      },
      held: { inbox: ['c'] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.1.note',
    },
    {
      moves: [{ message: 's', link: 'saved' }],
      states: {
        host: 'studyEip.guaranteed-delivery.model.example.steps.2.states.host',
        outbox: 'studyEip.guaranteed-delivery.model.example.steps.2.states.outbox',
      },
      held: { outbox: [] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'c', link: 'deliver' }],
      states: {
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.3.states.inbox',
        worker: 'studyEip.guaranteed-delivery.model.example.steps.3.states.worker',
      },
      held: { worker: ['c'] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.3.note',
    },
    {
      states: {
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.4.states.inbox',
        worker: 'studyEip.guaranteed-delivery.model.example.steps.4.states.worker',
      },
      held: { worker: [] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.4.note',
    },
    {
      states: {
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.5.states.inbox',
        worker: 'studyEip.guaranteed-delivery.model.example.steps.5.states.worker',
      },
      note: 'studyEip.guaranteed-delivery.model.example.steps.5.note',
    },
    {
      moves: [{ message: 'c', link: 'deliver' }],
      states: {
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.6.states.inbox',
        worker: 'studyEip.guaranteed-delivery.model.example.steps.6.states.worker',
      },
      held: { worker: ['c'] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'r', link: 'receipt' }],
      states: {
        inbox: 'studyEip.guaranteed-delivery.model.example.steps.7.states.inbox',
        worker: 'studyEip.guaranteed-delivery.model.example.steps.7.states.worker',
      },
      held: { inbox: [], worker: [] },
      note: 'studyEip.guaranteed-delivery.model.example.steps.7.note',
    },
  ],
  moments: [
    {
      label: 'studyEip.guaranteed-delivery.model.example.moments.0.label',
      step: 1,
    },
    {
      label: 'studyEip.guaranteed-delivery.model.example.moments.1.label',
      step: 3,
    },
    {
      label: 'studyEip.guaranteed-delivery.model.example.moments.2.label',
      step: crashStep,
    },
    {
      label: 'studyEip.guaranteed-delivery.model.example.moments.3.label',
      step: 7,
    },
    {
      label: 'studyEip.guaranteed-delivery.model.example.moments.4.label',
      step: 8,
    },
  ],
  caption: 'studyEip.guaranteed-delivery.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
