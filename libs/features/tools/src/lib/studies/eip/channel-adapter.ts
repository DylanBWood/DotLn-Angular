import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * The board loading its document, drawn as a channel adapter. The board speaks only in events on
 * the app's event stream and the HTTP API speaks only HTTP; the adapter between them turns a load
 * event into a GET, and the reply back into an event. The first load succeeds and the refresh
 * after it fails, so the failure has to reach the event stream as a message too. One message
 * moves at each step. Written step by step: what matters here is the call into an application
 * that knows no streams, which a marble example could only fake.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'board',
      label: 'studyEip.channel-adapter.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'adapter',
      label: 'studyEip.channel-adapter.model.example.nodes.1.label',
      stage: 1,
      tone: 'subject',
    },
    {
      id: 'api',
      label: 'studyEip.channel-adapter.model.example.nodes.2.label',
      stage: 2,
    },
  ],
  // The board and the adapter meet on the app's event stream; the adapter and the API over HTTP.
  links: [
    {
      id: 'publish',
      from: 'board',
      to: 'adapter',
      label: 'studyEip.channel-adapter.model.example.links.0.label',
    },
    {
      id: 'deliver',
      from: 'adapter',
      to: 'board',
      label: 'studyEip.channel-adapter.model.example.links.1.label',
    },
    {
      id: 'request',
      from: 'adapter',
      to: 'api',
      label: 'studyEip.channel-adapter.model.example.links.2.label',
    },
    {
      id: 'response',
      from: 'api',
      to: 'adapter',
      label: 'studyEip.channel-adapter.model.example.links.3.label',
    },
  ],
  // Lower case is the first load, capitals the refresh after it.
  messages: {
    l: {
      key: 'l',
      content: 'studyEip.channel-adapter.model.example.messages.l.content',
    },
    g: {
      key: 'g',
      content: 'studyEip.channel-adapter.model.example.messages.g.content',
    },
    d: {
      key: 'd',
      content: 'studyEip.channel-adapter.model.example.messages.d.content',
    },
    s: {
      key: 's',
      content: 'studyEip.channel-adapter.model.example.messages.s.content',
    },
    L: {
      key: 'L',
      content: 'studyEip.channel-adapter.model.example.messages.L.content',
    },
    G: {
      key: 'G',
      content: 'studyEip.channel-adapter.model.example.messages.G.content',
    },
    E: {
      key: 'E',
      content: 'studyEip.channel-adapter.model.example.messages.E.content',
    },
    F: {
      key: 'F',
      content: 'studyEip.channel-adapter.model.example.messages.F.content',
    },
  },
  start: {
    states: {
      board: 'studyEip.channel-adapter.model.example.start.states.board',
      adapter: 'studyEip.channel-adapter.model.example.start.states.adapter',
      api: 'studyEip.channel-adapter.model.example.start.states.api',
    },
    note: 'studyEip.channel-adapter.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'l', link: 'publish' }],
      states: {
        board: 'studyEip.channel-adapter.model.example.steps.0.states.board',
        adapter: 'studyEip.channel-adapter.model.example.steps.0.states.adapter',
      },
      held: { adapter: ['l'] },
      note: 'studyEip.channel-adapter.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'g', link: 'request' }],
      states: {
        adapter: 'studyEip.channel-adapter.model.example.steps.1.states.adapter',
        api: 'studyEip.channel-adapter.model.example.steps.1.states.api',
      },
      note: 'studyEip.channel-adapter.model.example.steps.1.note',
    },
    {
      moves: [{ message: 'd', link: 'response' }],
      states: {
        adapter: 'studyEip.channel-adapter.model.example.steps.2.states.adapter',
        api: 'studyEip.channel-adapter.model.example.steps.2.states.api',
      },
      held: { adapter: ['l', 'd'] },
      note: 'studyEip.channel-adapter.model.example.steps.2.note',
    },
    {
      moves: [{ message: 's', link: 'deliver' }],
      states: {
        board: 'studyEip.channel-adapter.model.example.steps.3.states.board',
        adapter: 'studyEip.channel-adapter.model.example.steps.3.states.adapter',
      },
      held: { adapter: [], board: ['s'] },
      note: 'studyEip.channel-adapter.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'L', link: 'publish' }],
      states: {
        board: 'studyEip.channel-adapter.model.example.steps.4.states.board',
        adapter: 'studyEip.channel-adapter.model.example.steps.4.states.adapter',
      },
      held: { adapter: ['L'] },
      note: 'studyEip.channel-adapter.model.example.steps.4.note',
    },
    {
      moves: [{ message: 'G', link: 'request' }],
      states: {
        adapter: 'studyEip.channel-adapter.model.example.steps.5.states.adapter',
        api: 'studyEip.channel-adapter.model.example.steps.5.states.api',
      },
      note: 'studyEip.channel-adapter.model.example.steps.5.note',
    },
    {
      moves: [{ message: 'E', link: 'response' }],
      states: {
        adapter: 'studyEip.channel-adapter.model.example.steps.6.states.adapter',
        api: 'studyEip.channel-adapter.model.example.steps.6.states.api',
      },
      held: { adapter: ['L', 'E'] },
      note: 'studyEip.channel-adapter.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'F', link: 'deliver' }],
      states: {
        board: 'studyEip.channel-adapter.model.example.steps.7.states.board',
        adapter: 'studyEip.channel-adapter.model.example.steps.7.states.adapter',
      },
      held: { adapter: [], board: ['F'] },
      note: 'studyEip.channel-adapter.model.example.steps.7.note',
    },
  ],
  moments: [
    {
      label: 'studyEip.channel-adapter.model.example.moments.0.label',
      step: 1,
    },
    {
      label: 'studyEip.channel-adapter.model.example.moments.1.label',
      step: 2,
    },
    {
      label: 'studyEip.channel-adapter.model.example.moments.2.label',
      step: 4,
    },
    {
      label: 'studyEip.channel-adapter.model.example.moments.3.label',
      step: 7,
    },
    {
      label: 'studyEip.channel-adapter.model.example.moments.4.label',
      step: 8,
    },
  ],
  caption: 'studyEip.channel-adapter.model.example.caption',

  parameterMessages: {
    route: 'studyEip.channel-adapter.record.parameters.route',
    failure: 'studyEip.channel-adapter.record.parameters.failure',
  },
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
