import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction, StudyWorkedStep } from '../study-model';

/** The editable views that share the normalised graph, each with its own decoder and encoder. */
const views = 3;

/**
 * Translators needed so that each of `count` formats can reach every other: directly, one for
 * each ordered pair; through a shared form, a decoder and an encoder for each.
 */
const translators = (count: number) => ({ direct: count * (count - 1), shared: 2 * count });

const countAtStart: StudyWorkedStep = (() => {
  const { direct, shared } = translators(views);
  return {
    title: `Translators for ${views} views`,
    lines: [
      `direct, one for each ordered pair: ${views} × ${views - 1} = ${direct}`,
      `through the graph, a decoder and an encoder each: 2 × ${views} = ${shared}`,
    ],
    note: 'With three views the two counts are equal: the shared form has not yet saved a translator.',
  };
})();

const countForAnother: StudyWorkedStep = (() => {
  const before = translators(views);
  const after = translators(views + 1);
  return {
    title: 'What one more participant costs',
    lines: [
      `a further full view, direct: ${views + 1} × ${views} = ${after.direct}, ${after.direct - before.direct} more`,
      `a further full view, through the graph: 2 × ${views + 1} = ${after.shared}, ${after.shared - before.shared} more`,
      `this read-only narrative: 1 encoder, against ${views} direct ones`,
    ],
    note: 'From here on, every participant the graph gains costs only its own translators.',
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
    { id: 'table', label: 'Function table', stage: 0, row: 0 },
    { id: 'dsl', label: 'Code DSL', stage: 0, row: 1 },
    { id: 'chart', label: 'Statechart', stage: 0, row: 2 },
    { id: 'graph', label: 'Loadout graph', stage: 1, row: 1, kind: 'channel', tone: 'subject' },
    { id: 'compiler', label: 'Compiler', stage: 2, row: 1 },
    { id: 'narrative', label: 'Narrative', stage: 2, row: 2 },
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
    graphBefore: { key: 'g', content: 'the loadout in the shared form' },
    edit: { key: 't', content: 'the new objective, as a table row' },
    graphAfter: { key: 'g', content: 'the loadout with the new objective' },
    code: { key: 'c', content: 'the new objective, as typed code' },
    chart: { key: 's', content: 'the new objective, as statechart JSON' },
    reorder: { key: 't', content: 'the same rows, reordered' },
    rewrite: { key: 't', content: 'the rows in the graph’s order' },
    summary: { key: 'n', content: 'the loadout, summarised in prose' },
  },
  caption:
    'Function table, Code DSL and Statechart are three editable views of one loadout, each in its own format: rows, typed code and statechart JSON, a state machine written as JSON. Loadout graph, drawn as a pipe, is the shared form they all translate to: each view has one line into it, its decoder, and one line out of it, its encoder, and no line joins two views. Compiler builds the program from the graph; Narrative is a summary in prose that can only read. A token’s letter says which format a message is in: t for the table, c for typed code, s for statechart JSON, g for the graph and n for prose. A token is green while it moves and outlined while a box holds it; a box a token leaves or reaches is outlined in green, and the words inside a box say what it shows or does. Step forward to move the messages on.',
  start: {
    states: {
      table: 'the loadout as rows',
      dsl: 'the loadout as typed code',
      chart: 'the loadout as statechart JSON',
      graph: 'the shared, normalised form',
      compiler: 'builds from the graph only',
      narrative: 'not attached yet',
    },
    held: { graph: ['graphBefore'] },
    note: 'Nothing has moved yet: the graph holds g, and every view was written from it.',
    worked: countAtStart,
  },
  steps: [
    {
      moves: [{ message: 'edit', link: 'decode-table' }],
      states: { table: 'new objective' },
      held: { graph: ['graphAfter'] },
      note: 'The operator changes the objective in the function table, which sends it, t, to the graph. Only the table’s decoder reads table rows: it turns t into a new g, and no other view ever sees the table’s format.',
    },
    {
      moves: [
        { message: 'code', link: 'encode-dsl' },
        { message: 'chart', link: 'encode-chart' },
      ],
      states: { dsl: 'new objective', chart: 'new objective' },
      note: 'The graph sends g out through two encoders: to the code view as c and to the statechart view as s. Neither view can tell that the change began as a table row.',
    },
    {
      moves: [{ message: 'graphAfter', link: 'compile' }],
      states: { compiler: 'new program, new hash' },
      note: 'The graph sends g to the compiler, which builds the program from g and never from a view, so it does not matter which view the edit was made in.',
    },
    {
      moves: [{ message: 'reorder', link: 'decode-table' }],
      states: { table: 'rows in the operator’s order' },
      note: 'The operator reorders the function table’s rows, and the table sends them, t, to the graph. The decoder sorts rows by kind and key, so g comes out exactly as it was: row order has no place in the shared form.',
    },
    {
      moves: [{ message: 'graphAfter', link: 'compile' }],
      states: { compiler: 'same program, same hash' },
      note: 'The graph sends g to the compiler again; the reorder never reached it.',
    },
    {
      moves: [{ message: 'rewrite', link: 'encode-table' }],
      states: { table: 'rows in the graph’s order' },
      note: 'The graph’s encoder writes g back into the table as t, and the operator’s reorder is gone: it did not survive the trip through the shared form, which is right only because row order means nothing here.',
    },
    {
      moves: [{ message: 'summary', link: 'narrate' }],
      states: { narrative: 'can read, cannot send' },
      note: 'A narrative view is attached, and the graph’s encoder writes g into it as prose, n. There is no decoder from prose back to a graph, so nothing written in the narrative can reach the other views.',
      worked: countForAnother,
    },
  ],
  moments: [
    { label: 'Edit decoded', step: 1 },
    { label: 'Encoded out', step: 2 },
    { label: 'Reorder lost', step: 6 },
    { label: 'Read-only view', step: 7 },
  ],
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
