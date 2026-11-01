import { loadFlowStudy } from '../../../../testing/src';
import { flowDrawing } from '../../composites/study-visuals/flow/flow-drawing';
import { example, model } from './transactional-client';

const path = 'libs/features/tools/src/lib/studies/eip/transactional-client.ts';
const record = await loadFlowStudy('eip:170');
const drawn = model(record.example.parameters);
if (drawn.family !== 'flow') throw new Error('The model does not draw a flow.');
const run = drawn;
const { frames } = run.flow;
const steps = frames.map(({ step }) => step);

/** What crosses a link at a step, as `key link`. */
const movesAt = (step: number) => frames[step].hops.map(({ key, link }) => `${key} ${link}`);
/** The letters of what a node holds after a step. */
const heldBy = (step: number, node: string) =>
  (frames[step].held[node] ?? []).map(({ key }) => key);
/** The steps at which a link carries anything. */
const stepsOn = (link: string) =>
  steps.filter((step) => frames[step].hops.some((hop) => hop.link === link));

it('attaches the record to the Transactional Client row and draws it from this module', () => {
  expect(record.visual.model).toBe(path);
  expect(record.visual.family).toBe('flow');
  // The idea is a visibility boundary, not a stream, so nothing runs and no RxJS reading is offered.
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toBeNull();
  expect(run.diagram).toBeNull();
  expect(steps).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(example.messages['c']?.content).toBe(`command ${record.example.parameters['command']}`);
});

it('keeps the command in the outbox while a transaction holds it and removes it only at commit', () => {
  // The worker takes the command once per attempt.
  expect(stepsOn('take')).toHaveLength(Number(record.example.parameters['attempts']));
  expect(stepsOn('take')).toEqual([1, 5]);
  for (const step of [0, 1, 2, 3, 4, 5, 6, 7]) expect(heldBy(step, 'outbox')).toEqual(['c']);
  expect(heldBy(8, 'outbox')).toEqual([]);
  expect(frames[1].states['outbox']).toBe('7 hidden, kept until commit');
  expect(frames[8].states['outbox']).toBe('7 removed at commit');
});

it('shows nothing on Receipts or Event log until commit, then both at the same step', () => {
  expect(stepsOn('receipt')).toEqual([8]);
  expect(stepsOn('append')).toEqual([8]);
  for (const step of [0, 1, 2, 3, 4, 5, 6, 7]) {
    expect(heldBy(step, 'receipts')).toEqual([]);
    expect(heldBy(step, 'log')).toEqual([]);
  }
  expect(movesAt(8)).toEqual(['r receipt', 'e append']);
  expect(heldBy(8, 'receipts')).toEqual(['r']);
  expect(heldBy(8, 'log')).toEqual(['e']);
  expect(frames[8].states).toMatchObject({ receipts: 'receipt for 7', log: 'result for 7' });
  expect(frames[8].values['moves']).toBe(
    'r (receipt for 7) moves from Worker to Receipts; e (result for 7) moves from Worker to Event log',
  );
});

it('discards the staged sends and returns the command when the worker crashes before commit', () => {
  // Staged sends wait with the worker, on no channel.
  expect(heldBy(3, 'worker')).toEqual(['c', 'r', 'e']);
  expect(movesAt(3)).toEqual([]);
  // The crash moves nothing: the rollback drops the staged sends and the command is offered again.
  expect(movesAt(4)).toEqual([]);
  expect(heldBy(4, 'worker')).toEqual([]);
  expect(heldBy(4, 'outbox')).toEqual(['c']);
  expect(frames[4].states).toMatchObject({
    worker: 'crashed, transaction 1 rolled back',
    outbox: '7 visible again',
  });
  expect(heldBy(7, 'worker')).toEqual(['c', 'r', 'e']);
  expect(heldBy(8, 'worker')).toEqual([]);
});

it('repeats the outside write, which no rollback reaches', () => {
  expect(stepsOn('write')).toEqual([2, 6]);
  // The first write survives the rollback at step 4, and the retry writes again.
  expect(heldBy(4, 'outside')).toEqual(['1']);
  expect(heldBy(6, 'outside')).toEqual(['1', '2']);
  expect(heldBy(8, 'outside')).toEqual(['1', '2']);
  expect(stepsOn('write')).toHaveLength(Number(record.example.parameters['attempts']));
  expect(frames[6].states['outside']).toBe('written twice for command 7');
});

it('names its moments, opens at the start and fills every placeholder its prose uses', () => {
  expect(run.moments).toEqual([
    { label: 'Taken, not removed', step: 1 },
    { label: 'Staged, unseen', step: 3 },
    { label: 'Rolled back', step: 4 },
    { label: 'Written twice', step: 6 },
    { label: 'Commit', step: 8 },
  ]);
  expect(run.initialStep).toBe(0);
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
  const prose = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ].join(' ');
  const names = [...prose.matchAll(/\{(\w+)\}/g)].map(([, name]) => name);
  expect(names.length).toBeGreaterThan(0);
  for (const frame of frames) for (const name of names) expect(frame.values[name]).toBeDefined();
  // Every step has its own sentence, and no node's state outgrows the drawing.
  for (const frame of frames) {
    expect(frame.note).toMatch(/\S/);
    for (const state of Object.values(frame.states)) expect(state.length).toBeLessThanOrEqual(40);
  }
});

// The drawing sets a state in 13-unit type, about 0.56 of that to a character, inside a box with
// 12 units of padding on each side.
const stateChar = 13 * 0.56;
const padding = 12;

it('fits every state inside its box, across a wide screen and down a phone', () => {
  for (const direction of ['across', 'down'] as const)
    for (const step of steps) {
      const drawing = flowDrawing(run.flow, step, direction);
      for (const line of drawing.states) {
        const box = drawing.nodes.find(
          ({ x, y, width, height }) =>
            line.x >= x && line.x <= x + width && line.y >= y && line.y <= y + height,
        );
        expect(box, `${line.text} sits in no box`).toBeDefined();
        expect(
          line.text.length * stateChar,
          `${line.text} at step ${step}, ${direction}`,
        ).toBeLessThanOrEqual((box?.width ?? 0) - 2 * padding);
      }
    }
});
