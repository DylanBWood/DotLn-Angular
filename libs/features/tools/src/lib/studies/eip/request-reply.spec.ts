import { loadFlowStudy } from '../../../../testing/src';
import type { FlowFrame, FlowModel } from '../study-model';
import { example, model } from './request-reply';

const modulePath = 'libs/features/tools/src/lib/studies/eip/request-reply.ts';

/** The record's own run of the example, with the parameters it ships, as the flow it draws. */
async function recordRun() {
  const record = await loadFlowStudy('eip:83');
  const run = model(record.example.parameters);
  if (run.family !== 'flow') throw new Error('The model does not draw a flow.');
  return { record, run };
}

/** What crosses a link at a step, as `link key`. */
const hopsOf = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The first step at which a message with this content crosses this link. */
const stepOf = (frames: readonly FlowFrame[], link: string, content: string) =>
  frames.findIndex(({ hops }) => hops.some((hop) => hop.link === link && hop.content === content));

/** Boxes that hold a message moving at this step, other than the box it is moving into. */
const heldElsewhere = (flow: FlowModel, frame: FlowFrame) =>
  frame.hops.flatMap(({ key, link }) => {
    const to = flow.links.find(({ id }) => id === link)?.to;
    return Object.entries(frame.held)
      .filter(([node, tokens]) => node !== to && tokens.some((token) => token.key === key))
      .map(([node]) => `${key} in ${node}`);
  });

it('attaches the record to the Request-Reply row and draws it from this module', async () => {
  const { record, run } = await recordRun();
  expect(record.visual.model).toBe(modulePath);
  // The exchange is a protocol between two parties, so its RxJS reading is marked illustrative.
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs?.startsWith('// Illustrative: ')).toBe(true);
  expect(run.family).toBe('flow');
  expect(run.diagram).toBeNull();
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Request sent', step: 1 },
    { label: 'Reply resumes', step: 4 },
    { label: 'Receipt only', step: 8 },
    { label: 'Deadline', step: 10 },
    { label: 'Late reply', step: 12 },
  ]);
  // The two one-way channels are the pattern's own part of the drawing.
  expect(
    run.flow.nodes
      .filter(({ tone }) => tone === 'subject')
      .map(({ label, kind }) => `${label} ${kind}`),
  ).toEqual(['Outbox channel', 'Event log channel']);
  // The parameters the prose names are the commands the flow sends.
  expect(example.messages['command1']?.content).toContain(
    String(record.example.parameters['first']),
  );
  expect(example.messages['command2']?.content).toContain(
    String(record.example.parameters['second']),
  );
});

it('sends the request on the Outbox and brings the reply back on the Event log', async () => {
  const { run } = await recordRun();
  const { frames } = run.flow;
  expect(frames.slice(1, 5).map(hopsOf)).toEqual([
    ['send c'],
    ['take c'],
    ['answer r'],
    ['read r'],
  ]);
  // Each channel carries one direction only: commands out, receipts and results back.
  const keysOn = (links: readonly string[]) =>
    new Set(
      frames.flatMap(({ hops }) =>
        hops.filter(({ link }) => links.includes(link)).map(({ key }) => key),
      ),
    );
  expect(keysOn(['send', 'take'])).toEqual(new Set(['c', 'C']));
  expect(keysOn(['answer', 'read'])).toEqual(new Set(['r', 'A', 'R']));
  // A message is always in one place: on the Outbox, then with the Adapter, then on the Event log.
  expect(frames[1].values['held']).toBe('Outbox holds c');
  expect(frames[2].values['held']).toBe('Adapter holds c');
  expect(frames[3].values['held']).toBe('Event log holds r');
  expect(frames[4].values['held']).toBe('nothing is held');
  // The result, not the command going out, resumes the Kernel.
  expect(frames[1].states['kernel']).toBe('waits for cmd_1');
  expect(frames[4].states['kernel']).toBe("resumed on cmd_1's result");
  expect(frames[4].note).toContain('resumes the work it saved for a completed result');
  expect(frames[4].values['moves']).toBe(
    'r (result for cmd_1: completed) moves from Event log to Kernel',
  );
});

it('keeps waiting after a receipt, gives up at the deadline, and ignores the late result', async () => {
  const { record, run } = await recordRun();
  const { frames } = run.flow;
  const timeoutSteps = Number(record.example.parameters['timeoutSteps']);
  const sent = stepOf(frames, 'send', 'command cmd_2');
  const receipt = stepOf(frames, 'read', 'receipt: cmd_2 accepted');
  const result = stepOf(frames, 'read', 'result for cmd_2: completed');
  const deadline = frames.findIndex(({ states }) => states['kernel'] === 'gave up on cmd_2');
  // The deadline falls the record's number of steps after the command was sent.
  expect(deadline - sent).toBe(timeoutSteps);
  expect(frames[deadline].values['timeoutSteps']).toBe(String(timeoutSteps));
  // The receipt came back in time and left the Kernel waiting; the result came only afterwards.
  expect(receipt).toBeGreaterThan(sent);
  expect(receipt).toBeLessThan(deadline);
  expect(frames[receipt].states['kernel']).toBe('cmd_2 accepted; still waits');
  expect(frames.slice(receipt + 1, deadline + 1).every(({ hops }) => hops.length === 0)).toBe(true);
  expect(result).toBeGreaterThan(deadline);
  expect(frames[result].states['kernel']).toBe('ignored late result');
  expect(frames).toHaveLength(13);
});

it('moves one message at a time and never shows a moving message in a second box', async () => {
  const { run } = await recordRun();
  for (const frame of run.flow.frames) {
    expect(frame.hops.length).toBeLessThanOrEqual(1);
    expect(heldElsewhere(run.flow, frame)).toEqual([]);
  }
});

it('keeps every name and state short enough to read inside its box', async () => {
  const { run } = await recordRun();
  for (const { label } of run.flow.nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  for (const { states, note } of run.flow.frames) {
    for (const state of Object.values(states)) expect(state.length).toBeLessThanOrEqual(30);
    expect(note).toBeTruthy();
  }
});
