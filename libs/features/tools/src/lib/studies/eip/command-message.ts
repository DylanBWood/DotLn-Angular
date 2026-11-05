import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

const firstResult = ['b'];
const bothResults = [...firstResult, 'a'];

/**
 * A kernel asks for order 41 to be verified by sending one command, which names the procedure
 * and its argument and carries the id 7, onto a dispatch channel that two sessions listen on.
 * The command waits while both are busy and goes to exactly one of them. When the answer is slow
 * the kernel sends the same command again, the other session takes the copy, and the one request
 * is carried out twice. The flow is written step by step: a command is a kind of message, not a
 * transformation of a stream, so there is nothing here to run.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'kernel',
      label: 'studyEip.command-message.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'dispatch',
      label: 'studyEip.command-message.model.example.nodes.1.label',
      stage: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'sessionA',
      label: 'studyEip.command-message.model.example.nodes.2.label',
      stage: 2,
    },
    {
      id: 'sessionB',
      label: 'studyEip.command-message.model.example.nodes.3.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'store',
      label: 'studyEip.command-message.model.example.nodes.4.label',
      stage: 3,
    },
  ],
  links: [
    { id: 'send', from: 'kernel', to: 'dispatch' },
    { id: 'to-a', from: 'dispatch', to: 'sessionA' },
    { id: 'to-b', from: 'dispatch', to: 'sessionB' },
    { id: 'a-result', from: 'sessionA', to: 'store' },
    { id: 'b-result', from: 'sessionB', to: 'store' },
  ],
  // The command is drawn as its id, so its copy looks exactly like it; each result is drawn as the
  // letter of the session that sends it.
  messages: {
    '7': {
      key: '7',
      content: 'studyEip.command-message.model.example.messages.7.content',
    },
    b: {
      key: 'b',
      content: 'studyEip.command-message.model.example.messages.b.content',
    },
    a: {
      key: 'a',
      content: 'studyEip.command-message.model.example.messages.a.content',
    },
  },
  start: {
    states: {
      kernel: 'studyEip.command-message.model.example.start.states.kernel',
      dispatch: 'studyEip.command-message.model.example.start.states.dispatch',
      sessionA: 'studyEip.command-message.model.example.start.states.sessionA',
      sessionB: 'studyEip.command-message.model.example.start.states.sessionB',
      store: 'studyEip.command-message.model.example.start.states.store',
    },
    note: 'studyEip.command-message.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: '7', link: 'send' }],
      states: {
        kernel: 'studyEip.command-message.model.example.steps.0.states.kernel',
        dispatch: 'studyEip.command-message.model.example.steps.0.states.dispatch',
      },
      held: { dispatch: ['7'] },
      note: 'studyEip.command-message.model.example.steps.0.note',
    },
    {
      states: {
        sessionA: 'studyEip.command-message.model.example.steps.1.states.sessionA',
        sessionB: 'studyEip.command-message.model.example.steps.1.states.sessionB',
      },
      note: 'studyEip.command-message.model.example.steps.1.note',
    },
    {
      moves: [{ message: '7', link: 'to-b' }],
      states: {
        dispatch: 'studyEip.command-message.model.example.steps.2.states.dispatch',
        sessionA: 'studyEip.command-message.model.example.steps.2.states.sessionA',
        sessionB: 'studyEip.command-message.model.example.steps.2.states.sessionB',
      },
      held: { dispatch: [], sessionB: ['7'] },
      note: 'studyEip.command-message.model.example.steps.2.note',
    },
    {
      states: {
        kernel: 'studyEip.command-message.model.example.steps.3.states.kernel',
        sessionB: 'studyEip.command-message.model.example.steps.3.states.sessionB',
      },
      note: 'studyEip.command-message.model.example.steps.3.note',
    },
    {
      moves: [{ message: '7', link: 'send' }],
      states: {
        kernel: 'studyEip.command-message.model.example.steps.4.states.kernel',
        dispatch: 'studyEip.command-message.model.example.steps.4.states.dispatch',
      },
      held: { dispatch: ['7'] },
      note: 'studyEip.command-message.model.example.steps.4.note',
    },
    {
      moves: [{ message: '7', link: 'to-a' }],
      states: {
        dispatch: 'studyEip.command-message.model.example.steps.5.states.dispatch',
        sessionA: 'studyEip.command-message.model.example.steps.5.states.sessionA',
      },
      held: { dispatch: [], sessionA: ['7'] },
      note: 'studyEip.command-message.model.example.steps.5.note',
    },
    {
      moves: [{ message: 'b', link: 'b-result' }],
      states: {
        sessionB: 'studyEip.command-message.model.example.steps.6.states.sessionB',
        store: {
          key: 'studyEip.command-message.model.example.steps.6.states.store',
          params: { results: firstResult.length },
        },
      },
      held: { sessionB: [], store: firstResult },
      note: 'studyEip.command-message.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'a', link: 'a-result' }],
      states: {
        sessionA: 'studyEip.command-message.model.example.steps.7.states.sessionA',
        store: {
          key: 'studyEip.command-message.model.example.steps.7.states.store',
          params: { results: bothResults.length },
        },
      },
      held: { sessionA: [], store: bothResults },
      note: 'studyEip.command-message.model.example.steps.7.note',
    },
  ],
  moments: [
    {
      label: 'studyEip.command-message.model.example.moments.0.label',
      step: 1,
    },
    {
      label: 'studyEip.command-message.model.example.moments.1.label',
      step: 3,
    },
    {
      label: 'studyEip.command-message.model.example.moments.2.label',
      step: 5,
    },
    {
      label: 'studyEip.command-message.model.example.moments.3.label',
      step: 6,
    },
    {
      label: {
        key: 'studyEip.command-message.model.example.moments.4.label',
        params: { results: bothResults.length },
      },
      step: 8,
    },
  ],
  caption: 'studyEip.command-message.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
