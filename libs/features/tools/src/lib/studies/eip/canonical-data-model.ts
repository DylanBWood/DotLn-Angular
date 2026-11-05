import { type FlowExample, flowModel, type FlowWorkedStep } from '../flow';
import type { StudyModelFunction } from '../study-model';

/** The editable views that share the normalised graph, each with its own decoder and encoder. */
const views = 3;

/**
 * Translators needed so that each of `count` formats can reach every other: directly, one for
 * each ordered pair; through a shared form, a decoder and an encoder for each.
 */
const translators = (count: number) => ({
  direct: count * (count - 1),
  shared: 2 * count,
});

const countAtStart: FlowWorkedStep = ((): FlowWorkedStep => {
  const { direct, shared } = translators(views);
  return {
    title: {
      key: 'studyEip.canonical-data-model.model.countAtStart.title',
      params: { views },
    },
    lines: [
      {
        key: 'studyEip.canonical-data-model.model.countAtStart.lines.0',
        params: { views, otherViews: views - 1, direct },
      },
      {
        key: 'studyEip.canonical-data-model.model.countAtStart.lines.1',
        params: { views, shared },
      },
    ],
    note: 'studyEip.canonical-data-model.model.countAtStart.note',
  };
})();

const countForAnother: FlowWorkedStep = ((): FlowWorkedStep => {
  const before = translators(views);
  const after = translators(views + 1);
  return {
    title: 'studyEip.canonical-data-model.model.countForAnother.title',
    lines: [
      {
        key: 'studyEip.canonical-data-model.model.countForAnother.lines.0',
        params: {
          nextViews: views + 1,
          views,
          direct: after.direct,
          additionalDirect: after.direct - before.direct,
        },
      },
      {
        key: 'studyEip.canonical-data-model.model.countForAnother.lines.1',
        params: {
          nextViews: views + 1,
          shared: after.shared,
          additionalShared: after.shared - before.shared,
        },
      },
      {
        key: 'studyEip.canonical-data-model.model.countForAnother.lines.2',
        params: { views },
      },
    ],
    note: 'studyEip.canonical-data-model.model.countForAnother.note',
  };
})();

/**
 * Three editable views of one loadout meet only through its normalised graph. An edit in the
 * function table goes in through the table's decoder and out through each other view's encoder;
 * a reorder of the table's rows changes nothing the graph keeps; and a narrative view that cannot
 * be turned back into a graph is attached with an encoder alone. A message's letter says which
 * format it is in, so the same letter can stand for several messages in that format.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'table',
      label: 'studyEip.canonical-data-model.model.example.nodes.0.label',
      stage: 0,
      row: 0,
    },
    {
      id: 'dsl',
      label: 'studyEip.canonical-data-model.model.example.nodes.1.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'chart',
      label: 'studyEip.canonical-data-model.model.example.nodes.2.label',
      stage: 0,
      row: 2,
    },
    {
      id: 'graph',
      label: 'studyEip.canonical-data-model.model.example.nodes.3.label',
      stage: 1,
      row: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'compiler',
      label: 'studyEip.canonical-data-model.model.example.nodes.4.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'narrative',
      label: 'studyEip.canonical-data-model.model.example.nodes.5.label',
      stage: 2,
      row: 2,
    },
  ],
  // Each view's two lines are its two translators, decoder in and encoder out, and no line joins
  // one view to another. The lines carry no names: a view's pair would print them on each other.
  links: [
    { id: 'decode-table', from: 'table', to: 'graph' },
    { id: 'encode-table', from: 'graph', to: 'table' },
    { id: 'decode-dsl', from: 'dsl', to: 'graph' },
    { id: 'encode-dsl', from: 'graph', to: 'dsl' },
    { id: 'decode-chart', from: 'chart', to: 'graph' },
    { id: 'encode-chart', from: 'graph', to: 'chart' },
    { id: 'compile', from: 'graph', to: 'compiler' },
    { id: 'narrate', from: 'graph', to: 'narrative' },
  ],
  messages: {
    graphBefore: {
      key: 'g',
      content: 'studyEip.canonical-data-model.model.example.messages.graphBefore.content',
    },
    edit: {
      key: 't',
      content: 'studyEip.canonical-data-model.model.example.messages.edit.content',
    },
    graphAfter: {
      key: 'g',
      content: 'studyEip.canonical-data-model.model.example.messages.graphAfter.content',
    },
    code: {
      key: 'c',
      content: 'studyEip.canonical-data-model.model.example.messages.code.content',
    },
    chart: {
      key: 's',
      content: 'studyEip.canonical-data-model.model.example.messages.chart.content',
    },
    reorder: {
      key: 't',
      content: 'studyEip.canonical-data-model.model.example.messages.reorder.content',
    },
    rewrite: {
      key: 't',
      content: 'studyEip.canonical-data-model.model.example.messages.rewrite.content',
    },
    summary: {
      key: 'n',
      content: 'studyEip.canonical-data-model.model.example.messages.summary.content',
    },
  },
  caption: 'studyEip.canonical-data-model.model.example.caption',
  start: {
    states: {
      table: 'studyEip.canonical-data-model.model.example.start.states.table',
      dsl: 'studyEip.canonical-data-model.model.example.start.states.dsl',
      chart: 'studyEip.canonical-data-model.model.example.start.states.chart',
      graph: 'studyEip.canonical-data-model.model.example.start.states.graph',
      compiler: 'studyEip.canonical-data-model.model.example.start.states.compiler',
      narrative: 'studyEip.canonical-data-model.model.example.start.states.narrative',
    },
    held: { graph: ['graphBefore'] },
    note: 'studyEip.canonical-data-model.model.example.start.note',
    worked: countAtStart,
  },
  steps: [
    {
      moves: [{ message: 'edit', link: 'decode-table' }],
      states: {
        table: 'studyEip.canonical-data-model.model.example.steps.0.states.table',
      },
      held: { graph: ['graphAfter'] },
      note: 'studyEip.canonical-data-model.model.example.steps.0.note',
    },
    {
      moves: [
        { message: 'code', link: 'encode-dsl' },
        { message: 'chart', link: 'encode-chart' },
      ],
      states: {
        dsl: 'studyEip.canonical-data-model.model.example.steps.1.states.dsl',
        chart: 'studyEip.canonical-data-model.model.example.steps.1.states.chart',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.1.note',
    },
    {
      moves: [{ message: 'graphAfter', link: 'compile' }],
      states: {
        compiler: 'studyEip.canonical-data-model.model.example.steps.2.states.compiler',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'reorder', link: 'decode-table' }],
      states: {
        table: 'studyEip.canonical-data-model.model.example.steps.3.states.table',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'graphAfter', link: 'compile' }],
      states: {
        compiler: 'studyEip.canonical-data-model.model.example.steps.4.states.compiler',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.4.note',
    },
    {
      moves: [{ message: 'rewrite', link: 'encode-table' }],
      states: {
        table: 'studyEip.canonical-data-model.model.example.steps.5.states.table',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.5.note',
    },
    {
      moves: [{ message: 'summary', link: 'narrate' }],
      states: {
        narrative: 'studyEip.canonical-data-model.model.example.steps.6.states.narrative',
      },
      note: 'studyEip.canonical-data-model.model.example.steps.6.note',
      worked: countForAnother,
    },
  ],
  moments: [
    {
      label: 'studyEip.canonical-data-model.model.example.moments.0.label',
      step: 1,
    },
    {
      label: 'studyEip.canonical-data-model.model.example.moments.1.label',
      step: 2,
    },
    {
      label: 'studyEip.canonical-data-model.model.example.moments.2.label',
      step: 6,
    },
    {
      label: 'studyEip.canonical-data-model.model.example.moments.3.label',
      step: 7,
    },
  ],

  parameterMessages: {
    views: 'studyEip.canonical-data-model.record.parameters.views',
  },
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
