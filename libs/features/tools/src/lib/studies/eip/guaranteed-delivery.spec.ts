import { loadFlowStudy } from '../../../../testing/src';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import { crashStep, example, model } from './guaranteed-delivery';

const path = 'libs/features/tools/src/lib/studies/eip/guaranteed-delivery.ts';

/** Each message that crosses a link at a step, as `link key`. */
const hopsOf = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);
/** The letters a node holds after a step. */
const heldBy = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

/** The example run from the record's own parameters, which this module always draws as a flow. */
async function run(): Promise<FlowStudyModel> {
  const drawn = model((await loadFlowStudy('eip:71')).example.parameters);
  if (drawn.family !== 'flow') throw new Error('The study is drawn as a flow.');
  return drawn;
}

it('attaches the record to the Guaranteed Delivery row, drawn by this module and not run', async () => {
  const record = await loadFlowStudy('eip:71');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toBeNull();
  expect(record.example.parameters).toEqual({ crashStep });
  const { family, diagram, initialStep, moments } = await run();
  expect(family).toBe('flow');
  expect(diagram).toBeNull();
  expect(initialStep).toBe(0);
  expect(moments).toEqual([
    { label: 'Saved', step: 1 },
    { label: 'Handed on', step: 3 },
    { label: 'Crash', step: crashStep },
    { label: 'Delivered again', step: 7 },
    { label: 'Receipt', step: 8 },
  ]);
});

it('keeps a copy on some disk from the send to the receipt, and none after it', async () => {
  const { frames } = (await run()).flow;
  expect(frames.map(({ step }) => step)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const onDisk = (frame: FlowFrame) =>
    [...heldBy(frame, 'outbox'), ...heldBy(frame, 'inbox')].includes('c');
  expect(frames.map(onDisk)).toEqual([false, true, true, true, true, true, true, true, false]);
  // The send is done only once the outbox holds the command.
  expect(hopsOf(frames[1])).toEqual(['send c']);
  expect(heldBy(frames[1], 'outbox')).toEqual(['c']);
});

it('lets the outbox delete its copy only after the inbox confirms it saved one', async () => {
  const { frames } = (await run()).flow;
  expect(hopsOf(frames[2])).toEqual(['forward c']);
  expect(heldBy(frames[2], 'outbox')).toEqual(['c']);
  expect(heldBy(frames[2], 'inbox')).toEqual(['c']);
  expect(hopsOf(frames[3])).toEqual(['saved s']);
  expect(heldBy(frames[3], 'outbox')).toEqual([]);
  expect(frames[3].values['moves']).toBe('s (saved 7) moves from Inbox to Outbox');
  // The outbox is the host's disk, so once it lets go the host no longer claims to hold c.
  expect(frames[1].states['host']).toBe('send returned');
  expect(frames[3].states['host']).toBe('send done; outbox let go');
  expect(frames[3].states['outbox']).toBe('empty: the inbox confirmed');
});

it('moves at most one message a step, and none straight through a box', async () => {
  const { frames } = (await run()).flow;
  expect(frames.map((frame) => hopsOf(frame))).toEqual([
    [],
    ['send c'],
    ['forward c'],
    ['saved s'],
    ['deliver c'],
    [],
    [],
    ['deliver c'],
    ['receipt r'],
  ]);
});

it('loses only the worker’s memory in the crash, and the inbox deletes its copy on the receipt', async () => {
  const { frames } = (await run()).flow;
  const crash = frames[crashStep];
  expect(hopsOf(crash)).toEqual([]);
  expect(heldBy(crash, 'worker')).toEqual([]);
  expect(heldBy(crash, 'inbox')).toEqual(['c']);
  expect(crash.states['worker']).toBe('crashed: memory lost');
  expect(crash.values['crashStep']).toBe(String(crashStep));
  expect(hopsOf(frames[8])).toEqual(['receipt r']);
  expect(heldBy(frames[7], 'inbox')).toEqual(['c']);
  expect(heldBy(frames[8], 'inbox')).toEqual([]);
});

it('delivers the command twice, once before the crash and once after it', async () => {
  const { frames } = (await run()).flow;
  const deliveries = frames.filter((frame) => hopsOf(frame).includes('deliver c'));
  expect(deliveries.map(({ step }) => step)).toEqual([4, 7]);
  expect(deliveries.every(({ step }) => step !== crashStep)).toBe(true);
  // Only one receipt is ever sent, after the second delivery.
  expect(frames.flatMap(hopsOf).filter((hop) => hop.startsWith('receipt'))).toEqual(['receipt r']);
});

it('fits the drawing: a note for every step and short states', () => {
  expect(example.steps.every(({ note }) => note.length > 0)).toBe(true);
  const states = [example.start, ...example.steps].flatMap(({ states: changes }) =>
    Object.values(changes ?? {}),
  );
  expect(states.every((text) => text.length <= 40)).toBe(true);
  expect(
    example.nodes.every(({ label }) => label.split(' ').every((word) => word.length <= 10)),
  ).toBe(true);
});

it('supplies every value the record’s prose reads, at every step', async () => {
  const record = await loadFlowStudy('eip:71');
  const { frames } = (await run()).flow;
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ...record.limits.flatMap(placeholdersIn),
  ];
  expect(names.length).toBeGreaterThan(0);
  for (const frame of frames)
    for (const name of names) expect(frame.values[name], `${name} at ${frame.step}`).toBeDefined();
});
