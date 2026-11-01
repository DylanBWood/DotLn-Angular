import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import type { FlowStudyModel } from '../study-model';
import { fillValues, placeholdersIn } from '../study-text';
import { example, model } from './canonical-data-model';

const modulePath = 'libs/features/tools/src/lib/studies/eip/canonical-data-model.ts';
const views = ['table', 'dsl', 'chart'];

/** The model's run, which for this module is always a flow. */
function flowRun(parameters: StudyParameters): FlowStudyModel {
  const run = model(parameters);
  if (run.family !== 'flow') throw new Error('The canonical model study is drawn as a flow.');
  return run;
}

/** What crosses which link at each step, as `link key`. */
const hopsOf = (run: FlowStudyModel) =>
  run.flow.frames.map(({ hops }) => hops.map(({ link, key }) => `${link} ${key}`));

const heldBy = (run: FlowStudyModel, step: number, node: string) =>
  run.flow.frames[step].held[node] ?? [];

it('reads its record from this module and does not run', async () => {
  const record = await loadFlowStudy('eip:146');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toBeNull();
  expect(flowRun(record.example.parameters).diagram).toBeNull();
});

it('joins each view to the others only through the graph, by its own two translators', async () => {
  const record = await loadFlowStudy('eip:146');
  const { links } = flowRun(record.example.parameters).flow;
  // Every line touches the graph, so no view reaches another directly.
  expect(links.every(({ from, to }) => from === 'graph' || to === 'graph')).toBe(true);
  for (const view of views) {
    expect(links.filter(({ from, to }) => from === view && to === 'graph')).toHaveLength(1);
    expect(links.filter(({ from, to }) => from === 'graph' && to === view)).toHaveLength(1);
  }
  // The narrative and the compiler only read: one line in to each, none out.
  expect(links.filter(({ from }) => from === 'narrative' || from === 'compiler')).toEqual([]);
  expect(links.filter(({ to }) => to === 'narrative')).toHaveLength(1);
  // A view's two lines lie almost on each other, so no line carries a name to print twice.
  expect(links.filter(({ label }) => label !== undefined)).toEqual([]);
});

it('decodes an edit once and encodes it once for each other view', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  const hops = hopsOf(run);
  // The graph holds the shared form from the start, and a new one once the edit is decoded.
  expect(heldBy(run, 0, 'graph').map(({ content }) => content)).toEqual([
    'the loadout in the shared form',
  ]);
  expect(hops[1]).toEqual(['decode-table t']);
  expect(heldBy(run, 1, 'graph').map(({ content }) => content)).toEqual([
    'the loadout with the new objective',
  ]);
  expect(hops[2]).toEqual(['encode-dsl c', 'encode-chart s']);
  expect(run.flow.frames[2].states).toMatchObject({
    dsl: 'new objective',
    chart: 'new objective',
  });
  // The compiler reads the graph, never a view.
  expect(hops[3]).toEqual(['compile g']);
  expect(run.flow.frames[3].states['compiler']).toBe('new program, new hash');
  // No step ever carries a message between two views or back from the narrative.
  const used = new Set(hops.flat().map((hop) => hop.split(' ')[0]));
  expect([...used].sort()).toEqual([
    'compile',
    'decode-table',
    'encode-chart',
    'encode-dsl',
    'encode-table',
    'narrate',
  ]);
});

it('drops the row order the shared form has no place for', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  const hops = hopsOf(run);
  expect(hops[4]).toEqual(['decode-table t']);
  expect(run.flow.frames[4].hops[0]?.content).toBe('the same rows, reordered');
  // The graph after the reorder is the graph from before it, and so are the program and its hash.
  expect(heldBy(run, 4, 'graph')).toEqual(heldBy(run, 3, 'graph'));
  expect(hops[5]).toEqual(['compile g']);
  expect(run.flow.frames[5].states['compiler']).toBe('same program, same hash');
  // Encoding the graph back gives the table the graph's order, not the operator's.
  expect(hops[6]).toEqual(['encode-table t']);
  expect(run.flow.frames[6].hops[0]?.content).toBe('the rows in the graph’s order');
});

it('gives a view that cannot round-trip an encoder and no decoder', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  expect(hopsOf(run)[7]).toEqual(['narrate n']);
  expect(run.flow.frames[7].states['narrative']).toBe('can read, cannot send');
  // The narrative step is the last: nothing comes back from it.
  expect(run.flow.frames).toHaveLength(8);
});

it('moves something at every step after the start', async () => {
  const record = await loadFlowStudy('eip:146');
  const hops = hopsOf(flowRun(record.example.parameters));
  expect(hops[0]).toEqual([]);
  expect(hops.slice(1).every((step) => step.length > 0)).toBe(true);
});

it('works out the translator count where the prose points to it', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  expect(run.flow.frames[0].worked?.lines).toEqual([
    'direct, one for each ordered pair: 3 × 2 = 6',
    'through the graph, a decoder and an encoder each: 2 × 3 = 6',
  ]);
  expect(run.flow.frames[7].worked?.lines).toEqual([
    'a further full view, direct: 4 × 3 = 12, 6 more',
    'a further full view, through the graph: 2 × 4 = 8, 2 more',
    'this read-only narrative: 1 encoder, against 3 direct ones',
  ]);
});

it('opens at the start and names its moments', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  expect(run.initialStep).toBe(0);
  expect(run.moments.map(({ label, step }) => `${step} ${label}`)).toEqual([
    '1 Edit decoded',
    '2 Encoded out',
    '6 Reorder lost',
    '7 Read-only view',
  ]);
  // Every step has its own sentence, not the family's default.
  expect(run.flow.frames.map(({ note }) => note)).toEqual([
    example.start.note,
    ...example.steps.map(({ note }) => note),
  ]);
});

it('fills every placeholder the record’s prose reads, at every step', async () => {
  const record = await loadFlowStudy('eip:146');
  const run = flowRun(record.example.parameters);
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ];
  for (const frame of run.flow.frames)
    for (const text of prose) {
      for (const name of placeholdersIn(text)) expect(frame.values[name]).toBeDefined();
      expect(fillValues(text, frame.values)).not.toMatch(/\{[a-zA-Z]/);
    }
  expect(fillValues(record.visual.textEquivalent, run.flow.frames[1].values)).toContain(
    'Step 1: t (the new objective, as a table row) moves from Function table to Loadout graph. Each view',
  );
  expect(fillValues(record.example.description, run.flow.frames[0].values)).toContain(
    'a sample loadout is shown in the code view, the function table and the statechart view',
  );
});

it('stays within what the flow drawing reads at a narrow width', async () => {
  const record = await loadFlowStudy('eip:146');
  const { nodes, frames } = flowRun(record.example.parameters).flow;
  expect(nodes.length).toBeLessThanOrEqual(8);
  expect(Math.max(...nodes.map(({ stage }) => stage))).toBeLessThan(4);
  for (const stage of new Set(nodes.map((node) => node.stage)))
    expect(nodes.filter((node) => node.stage === stage).length).toBeLessThanOrEqual(4);
  for (const { label } of nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  for (const { states } of frames)
    for (const text of Object.values(states)) expect(text.length).toBeLessThanOrEqual(40);
  expect(frames.length).toBeLessThanOrEqual(17);
  expect(nodes.find(({ tone }) => tone === 'subject')).toMatchObject({
    id: 'graph',
    kind: 'channel',
  });
});
