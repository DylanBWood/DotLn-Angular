import type { StudyParameters } from '@dotln-angular/models';

import { loadFlowStudy } from '../../../../testing/src';
import { flowFromMarbles } from '../flow';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowStudyModel } from '../study-model';
import { fillValues, placeholdersIn } from '../study-text';
import { example, flow, model, toToolV1 } from './message-translator';

const modulePath = 'libs/features/tools/src/lib/studies/eip/message-translator.ts';

/** The model's run, which for this module is always a flow. */
function flowRun(parameters: StudyParameters): FlowStudyModel {
  const run = model(parameters);
  if (run.family !== 'flow') throw new Error('The translator study is drawn as a flow.');
  return run;
}

/** What crosses which link at each step, as `link key`. */
const hopsOf = (run: FlowStudyModel) =>
  run.flow.frames.map(({ hops }) => hops.map(({ link, key }) => `${link} ${key}`));

const translated = (id: string) => ({
  id,
  schema: 'tool-v1',
  definition: 'unavailable',
  verified: 'partial',
});

/**
 * The same chunk with a row in a shape the translator has never seen, x, in place of n: the case
 * the limits describe. The input declares its subscription, so the drawing knows the translator
 * stopped listening there.
 */
const unknownShape: MarbleExample = {
  ...example,
  inputs: {
    records$: {
      label: 'records$',
      marbles: '-txc|',
      values: {
        t: { id: 'eip:60', schema: 'tool-v0' },
        x: { id: 'eip:145', schema: 'tool-v2' },
        c: { id: 'eip:146', schema: 'tool-v0' },
      },
      subscriptions: '^-!',
    },
  },
  outputs: {
    rows$: {
      label: 'rows$',
      marbles: '-T#',
      values: { T: translated('eip:60') },
      error: new Error('no translation from tool-v2'),
    },
  },
  moments: [{ label: 'Refused', frame: 2 }],
  notes: {},
};

it('reads its record from this module and runs the chunk example under the TestScheduler', async () => {
  const record = await loadFlowStudy('eip:60');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: modulePath });
  expectMarbleExample(example);
});

it('hands each row on in the frame it arrives, rebuilt, in order, holding nothing', async () => {
  const record = await loadFlowStudy('eip:60');
  const run = flowRun(record.example.parameters);
  // One thing a step: each row goes in and its rebuilt copy comes out, then the chunk finishes.
  expect(hopsOf(run)).toEqual([
    [],
    ['read t', 'answer T'],
    ['read n', 'answer N'],
    ['read c', 'answer C'],
    [],
  ]);
  // The row keeps its id; the shape changes and the gaps are marked, not filled.
  const answered = run.flow.frames[1].hops.find(({ link }) => link === 'answer');
  expect(answered?.content).toBe(
    'id eip:60, schema tool-v1, definition unavailable, verified partial',
  );
  // The translator is never drawn holding a row, and the Tools home ends with all three.
  expect(run.flow.frames.every(({ held }) => !held['translator']?.length)).toBe(true);
  const last = run.flow.frames[run.flow.frames.length - 1];
  expect(last.held['home']?.map(({ key }) => key)).toEqual(['T', 'N', 'C']);
  expect(last.held['chunk']).toEqual([]);
  // Each box's words say what the box is, and stay true for the whole run.
  expect(last.states).toEqual({
    chunk: 'writes tool-v0 only',
    translator: 'keeps no rows',
    home: 'reads tool-v1 only',
  });
  // One row out for each row in, at the same frame: the diagram's lanes agree with the flow.
  const lines = run.diagram?.marbles.lines ?? [];
  const nextFrames = (label: string) =>
    lines
      .find((line) => line.label === label)
      ?.events.filter(({ kind }) => kind === 'next')
      .map(({ frame }) => frame);
  expect(nextFrames('rows$')).toEqual(nextFrames('records$'));
  expect(nextFrames('rows$')).toEqual([1, 2, 3]);
});

it('keeps the id, marks what the older shape lacks and refuses any other shape', () => {
  expect(toToolV1({ id: 'eip:146', schema: 'tool-v0' })).toEqual(translated('eip:146'));
  expect(() => toToolV1({ id: 'eip:145', schema: 'tool-v2' })).toThrow(
    'no translation from tool-v2',
  );
  expect(() => toToolV1('eip:145')).toThrow('no translation from an unnamed shape');
});

it('loses every later row when one row cannot be translated', () => {
  expectMarbleExample(unknownShape);
  // This run's chunk holds t, x and c, and the Tools home gets only T: the boxes hold what it sends.
  const run = flowFromMarbles(unknownShape, {
    ...flow,
    held: {
      0: { chunk: ['t', 'x', 'c'] },
      1: { chunk: ['x', 'c'], home: ['T'] },
      2: { chunk: ['c'] },
    },
  });
  // The unknown row reaches the translator, nothing leaves for it, and c is never read.
  expect(hopsOf(run)).toEqual([[], ['read t', 'answer T'], ['read x']]);
  expect(
    run.flow.frames.map(({ held }) =>
      Object.fromEntries(
        Object.entries(held).map(([node, tokens]) => [node, tokens.map(({ key }) => key)]),
      ),
    ),
  ).toEqual([
    { chunk: ['t', 'x', 'c'] },
    { chunk: ['x', 'c'], home: ['T'] },
    { chunk: ['c'], home: ['T'] },
  ]);
  const records = run.diagram?.marbles.lines.find(({ label }) => label === 'records$');
  expect(records).toMatchObject({ unsubscribedAt: 2, cancelled: true });
  expect(records?.events.filter(({ delivered }) => !delivered).map(({ key }) => key)).toEqual([
    'c',
    '|',
  ]);
  const rows = run.diagram?.marbles.lines.find(({ label }) => label === 'rows$');
  expect(rows?.events.map(({ frame, kind }) => `${frame} ${kind}`)).toEqual(['1 next', '2 error']);
});

it('opens at the start and names its moments by frame', async () => {
  const record = await loadFlowStudy('eip:60');
  const run = flowRun(record.example.parameters);
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'First row', step: 1 },
    { label: 'Last row', step: 3 },
    { label: 'Done', step: 4 },
  ]);
  // Every frame carries the module's own sentence, in the flow's words.
  expect(run.flow.frames.map(({ note }) => note)).toEqual(
    run.flow.frames.map(({ step }) => example.notes?.[step]),
  );
});

it('fills every placeholder the record’s prose reads, at every step', async () => {
  const record = await loadFlowStudy('eip:60');
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
    'T (id eip:60, schema tool-v1, definition unavailable, verified partial) moves from Translator to Tools home on tool-v1',
  );
});

it('names the translator in its RxJS reading, on the code that runs', async () => {
  const record = await loadFlowStudy('eip:60');
  const reading = record.pseudocode.rxjs ?? '';
  // Each comment sits on its own line, and the code beside it is the pipeline the run executes.
  expect(reading.split('\n').filter((line) => line.trim().startsWith('//'))).toEqual([
    '// records$ is the tool-v0 channel; rows$ is the tool-v1 channel the Tools home reads',
    '  // the translator: each record becomes one tool-v1 row as it arrives, or is refused',
  ]);
  expect(example.operator).toBe('map((record) => toToolV1(record))');
  expect(reading).toContain(example.operator);
});

it('stays within what the flow drawing reads at a narrow width', async () => {
  const record = await loadFlowStudy('eip:60');
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
  expect(nodes.find(({ tone }) => tone === 'subject')?.id).toBe('translator');
});
