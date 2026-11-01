import { TestScheduler } from 'rxjs/testing';

import { loadFlowStudy } from '../../../../testing/src';
import { flowDrawing } from '../../composites/study-visuals/flow/flow-drawing';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import { type Close, example, model, recipientsOf } from './recipient-list';

const path = 'libs/features/tools/src/lib/studies/eip/recipient-list.ts';
const parameters = {
  closes: 'WO-240, WO-241 and WO-242',
  declaredFirst: 'A and B',
  declaredLater: 'A, B and C',
};

/** The example run by its model, which draws a flow. */
const flowRun = (): FlowStudyModel => {
  const run = model(parameters);
  if (run.family !== 'flow') throw new Error(`The model draws ${run.family}, not a flow.`);
  return run;
};

/** What crosses each link at a step, as `link token`. */
const hopsAt = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The copies sent to siblings at a step, leaving out the inputs and the record. */
const copiesAt = (frame: FlowFrame) =>
  frame.hops.filter(({ link }) => ['to-a', 'to-b', 'to-c'].includes(link));

/** The tokens a node holds after a step. */
const heldAt = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

it('runs the release-close example against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Recipient List row, reads this module and supplies every value its prose names', async () => {
  const record = await loadFlowStudy('eip:105');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable?.module).toBe(path);
  expect(record.example.parameters).toEqual(parameters);
  const run = flowRun();
  expect(model(record.example.parameters).family).toBe('flow');
  expect(run.diagram).not.toBeNull();
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.limits.flatMap(placeholdersIn),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
  ];
  for (const frame of run.flow.frames)
    for (const name of names) expect(frame.values[name], name).toBeDefined();
  expect(run.flow.frames[0].values['declaredLater']).toBe('A, B and C');
});

it('takes in one message a step, then sends each close to exactly the siblings on its list, recording every list', () => {
  const { flow } = flowRun();
  expect(flow.frames.map(hopsAt)).toEqual([
    [],
    ['declare x'],
    ['closes 0'],
    ['to-a 0', 'to-b 0', 'to-record p'],
    ['closes 1'],
    ['to-record q'],
    ['declare y'],
    ['closes 2'],
    ['to-a 2', 'to-b 2', 'to-c 2', 'to-record r'],
  ]);
  // The copy count of each close is the length of its list: two, none and three.
  expect(flow.frames.map((frame) => copiesAt(frame).length)).toEqual([0, 0, 0, 2, 0, 0, 0, 0, 3]);
  // Each copy says what the close said; the recipient list changes nothing in it.
  for (const hop of copiesAt(flow.frames[8]))
    expect(hop.content).toBe('order WO-242, release v0.96.0');
  // The empty list is recorded, so a close that reached nobody still leaves a trace.
  expect(flow.frames[5].hops[0].content).toBe('order WO-241, refreshed none');
  expect(heldAt(flow.frames[8], 'record')).toEqual(['p', 'q', 'r']);
});

it('holds each close in the list while it is worked out, then at every sibling it reaches', () => {
  const { flow } = flowRun();
  expect(heldAt(flow.frames[7], 'list')).toEqual(['2']);
  expect(flow.frames[7].states['list']).toBe('WO-242 to A, B, C');
  expect(heldAt(flow.frames[8], 'list')).toEqual([]);
  expect(['a', 'b', 'c'].map((id) => heldAt(flow.frames[8], id))).toEqual([['2'], ['2'], ['2']]);
  expect(flow.frames[4].states['list']).toBe('WO-241 to nobody');
  expect(heldAt(flow.frames[5], 'a')).toEqual(['0']);
});

it('computes the list when a close passes, so a sibling declared later misses earlier releases', () => {
  const { flow, moments, initialStep } = flowRun();
  const toC = flow.frames.flatMap((frame) =>
    frame.hops.filter(({ link }) => link === 'to-c').map(() => frame.step),
  );
  expect(toC).toEqual([8]);
  expect(flow.frames[6].states['c']).toBe('no release');
  expect(flow.frames[8].states['c']).toBe('v0.96.0, first');
  expect(initialStep).toBe(0);
  expect(moments.map(({ label, step }) => [label, step])).toEqual([
    ['The first list', 2],
    ['Two copies', 3],
    ['An empty list', 4],
    ['C is declared', 6],
    ['Three copies', 8],
  ]);
  // Every step has its own sentence, and no state outgrows what a box can show.
  for (const frame of flow.frames) expect(frame.note).toBe(example.notes?.[frame.step]);
  for (const frame of flow.frames)
    for (const state of Object.values(frame.states)) expect(state.length).toBeLessThanOrEqual(40);
});

it('gives nobody a close that publishes no release, whoever is declared', () => {
  expect(recipientsOf({ order: 'WO-241', release: 'none' }, ['A', 'B', 'C'])).toEqual([]);
  expect(recipientsOf({ order: 'WO-240', release: 'v0.95.0' }, ['A', 'B'])).toEqual(['A', 'B']);
});

it('hands each sibling its own object, equal to the close but not shared with the others', () => {
  const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  const close: Close = { order: 'WO-240', release: 'v0.95.0' };
  const received: unknown[] = [];
  scheduler.run(({ hot, flush }) => {
    const closes$ = hot('-c', { c: close });
    const declared$ = hot('d', { d: ['A', 'B'] });
    const { toA$, toB$ } = example.run({ inputs: { closes$, declared$ }, inner: {}, scheduler });
    toA$.subscribe((copy) => received.push(copy));
    toB$.subscribe((copy) => received.push(copy));
    flush();
  });
  expect(received).toEqual([close, close]);
  expect(received[0]).not.toBe(received[1]);
  expect(received[0]).not.toBe(close);
});

it('draws every step across and down, each name on at most two lines and each word inside its box', () => {
  const { flow } = flowRun();
  for (const direction of ['across', 'down'] as const)
    for (const { step, states } of flow.frames) {
      const drawing = flowDrawing(flow, step, direction);
      expect(drawing.nodes).toHaveLength(flow.nodes.length);
      for (const node of drawing.nodes) {
        expect(node.label.length).toBeLessThanOrEqual(2);
        // A state word wider than its box would run over the edge; 7.28 units is one character.
        for (const word of (states[node.id] ?? '').split(' '))
          expect(word.length * 7.28, `${direction} ${node.id} "${word}"`).toBeLessThanOrEqual(
            node.width - 24,
          );
      }
    }
});
