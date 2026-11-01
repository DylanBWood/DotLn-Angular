import { map, zip } from 'rxjs';

import { loadFlowStudy } from '../../../../testing/src';
import { expectMarbleExample } from '../rxjs/marble-testing';
import type { MarbleExample } from '../rxjs/marbles';
import type { FlowFrame, FlowModel } from '../study-model';
import { commandId, example, flow, model } from './correlation-identifier';

const modulePath = 'libs/features/tools/src/lib/studies/eip/correlation-identifier.ts';

/** The record's own run of the example, with the parameters it ships, as the flow it draws. */
async function recordRun() {
  const record = await loadFlowStudy('eip:87');
  const run = model(record.example.parameters);
  if (run.family !== 'flow') throw new Error('The model does not draw a flow.');
  return { record, run };
}

/** What crosses a link at a step, as `link key`. */
const hopsOf = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The value a letter stands for on one of the example's inputs. */
const valueOf = (input: string, key: string) => example.inputs[input]?.values?.[key];

/** Boxes that hold a message moving at this step, other than the box it is moving into. */
const heldElsewhere = (drawn: FlowModel, frame: FlowFrame) =>
  frame.hops.flatMap(({ key, link }) => {
    const to = drawn.links.find(({ id }) => id === link)?.to;
    return Object.entries(frame.held)
      .filter(([node, tokens]) => node !== to && tokens.some((token) => token.key === key))
      .map(([node]) => `${key} in ${node}`);
  });

it('runs the three commands against the marbles both drawings show', () => {
  expectMarbleExample(example);
});

it('attaches the record to the Correlation Identifier row and runs it from this module', async () => {
  const { record, run } = await recordRun();
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toEqual({ kind: 'rxjs', module: modulePath });
  expect(run.family).toBe('flow');
  expect(run.diagram?.marbles.lines.map(({ label }) => label)).toEqual([
    'command$',
    'result$',
    'resumed$',
  ]);
  // Every frame of the marble diagram is a step of the flow.
  expect(run.flow.frames.map(({ step }) => step)).toEqual(
    Array.from({ length: 11 }, (_, frame) => frame),
  );
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Three pending', step: 3 },
    { label: 'Out of order', step: 4 },
    { label: 'Taken by id', step: 5 },
    { label: 'All matched', step: 9 },
    { label: 'Duplicate', step: 10 },
  ]);
  // The waits are the pattern's own part of the drawing; the shared channel has a box of its own.
  expect(run.flow.nodes.filter(({ tone }) => tone === 'subject').map(({ id }) => id)).toEqual([
    'await1',
    'await2',
    'await3',
  ]);
  expect(flow.nodes.find(({ id }) => id === 'results')?.kind).toBe('channel');
});

it('hands each result to the Await of the command it names, whatever order they arrive in', async () => {
  const { record, run } = await recordRun();
  const { frames } = run.flow;
  expect(frames.slice(1).map(hopsOf)).toEqual([
    ['send-1 a'],
    ['send-2 b'],
    ['send-3 c'],
    ['reply-3 C'],
    ['take-3 C'],
    ['reply-1 A'],
    ['take-1 A'],
    ['reply-2 B'],
    ['take-2 B'],
    ['reply-2 D'],
  ]);
  // The first result sits on the shared channel while all three waits are still open.
  expect(frames[4].values['held']).toBe('Worker 1 holds a; Worker 2 holds b; Results holds C');
  expect(frames[4].states).toMatchObject({
    await1: 'waits for cmd_1',
    await2: 'waits for cmd_2',
    await3: 'waits for cmd_3',
  });
  expect(frames[5].states['await3']).toBe('took C: failed');
  // The result taken on take-n names the command sent on send-n.
  const sentOn = new Map(
    frames.flatMap(({ hops }) =>
      hops.filter(({ link }) => link.startsWith('send-')).map(({ link, key }) => [link, key]),
    ),
  );
  const taken = frames.flatMap(({ hops }) => hops.filter(({ link }) => link.startsWith('take-')));
  for (const { link, key } of taken)
    expect(commandId(valueOf('result$', key))).toBe(
      commandId(valueOf('command$', sentOn.get(link.replace('take-', 'send-')) ?? '')),
    );
  const last = frames[frames.length - 1];
  expect(['await1', 'await2', 'await3'].map((node) => last.held[node]?.[0]?.key)).toEqual([
    'A',
    'B',
    'C',
  ]);
  // The order the record names is the order the results were taken.
  const order = taken.map(({ key }) => String(commandId(valueOf('result$', key))));
  expect(`${order.slice(0, -1).join(', ')} and ${order[order.length - 1]}`).toBe(
    record.example.parameters['replyOrder'],
  );
});

it('drops the repeated result for cmd_2, which no Await is waiting for any more', async () => {
  const { run } = await recordRun();
  const { frames } = run.flow;
  expect(hopsOf(frames[10])).toEqual(['reply-2 D']);
  expect(frames[10].states['results']).toBe('dropped D');
  // D is a copy of B: it names the same command.
  expect(valueOf('result$', 'D')).toEqual(valueOf('result$', 'B'));
  expect(frames[10].held['results']).toEqual([]);
  const lines = run.diagram?.marbles.lines ?? [];
  const delivered = (label: string) =>
    lines
      .find((line) => line.label === label)
      ?.events.filter(({ kind, delivered: heard }) => kind === 'next' && heard)
      .map(({ key, frame }) => `${key} at ${frame}`);
  // The channel carries cmd_2's result twice, but only the first copy is handed on.
  expect(delivered('result$')).toEqual(['C at 4', 'A at 6', 'B at 8', 'D at 10']);
  expect(delivered('resumed$')).toEqual(['C at 5', 'A at 7', 'B at 9']);
  expect(frames[10].values['delivered']).toBe(
    'C (commandId cmd_3, status failed), A (commandId cmd_1, status completed), B (commandId cmd_2, status blocked)',
  );
});

it('moves one message at a time and never shows a moving message in a second box', async () => {
  const { run } = await recordRun();
  for (const frame of run.flow.frames) {
    expect(frame.hops.length).toBeLessThanOrEqual(1);
    expect(heldElsewhere(run.flow, frame)).toEqual([]);
  }
});

it('would give every command another command’s result if results were paired by arrival order', () => {
  // The same commands and results, paired in turn instead of by id.
  const byArrival: MarbleExample = {
    ...example,
    operator: 'zip(command$, result$)',
    outputs: {
      paired$: {
        label: 'paired$',
        marbles: '----x-y-z',
        values: { x: 'cmd_1 got cmd_3', y: 'cmd_2 got cmd_1', z: 'cmd_3 got cmd_2' },
      },
    },
    run: ({ inputs: { command$, result$ } }) => ({
      paired$: zip(command$, result$).pipe(
        map(
          ([command, result]) => `${String(commandId(command))} got ${String(commandId(result))}`,
        ),
      ),
    }),
  };
  expectMarbleExample(byArrival);
});

it('leaves a command waiting for ever when its result arrives before its wait opens', () => {
  // cmd_3's result comes at frame 2, before cmd_3 is sent at frame 3, and result$ keeps nothing.
  const early: MarbleExample = {
    ...example,
    inputs: {
      ...example.inputs,
      result$: { ...example.inputs['result$'], marbles: '--C--A-B' },
    },
    outputs: {
      resumed$: { ...example.outputs['resumed$'], marbles: '------A-B' },
    },
  };
  expectMarbleExample(early);
});

it('keeps every name and state short enough to read inside its box', async () => {
  const { run } = await recordRun();
  for (const { label } of run.flow.nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  for (const { states } of run.flow.frames)
    for (const state of Object.values(states)) expect(state.length).toBeLessThanOrEqual(20);
  // Every frame has its own sentence in the flow's words.
  expect(Object.keys(example.notes ?? {}).map(Number)).toEqual(
    run.flow.frames.map(({ step }) => step),
  );
});

// The drawn example leaves the commands and the results channel open. The same pipeline over the
// same messages, each stream ending on its last one, resumes the same requests at the same frames
// and completes once every wait has taken its result.
it('completes once every wait has taken its result: the same matches, then the end', () => {
  expectMarbleExample({
    ...example,
    inputs: {
      command$: { ...example.inputs['command$'], marbles: '-ab(c|)' },
      result$: { ...example.inputs['result$'], marbles: '----C-A-B-(D|)' },
    },
    outputs: { resumed$: { ...example.outputs['resumed$'], marbles: '-----C-A-(B|)' } },
  });
});
