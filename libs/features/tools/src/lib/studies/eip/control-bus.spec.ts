import { loadFlowStudy } from '../../../../testing/src';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { fillValues, placeholdersIn } from '../study-text';
import { example, model } from './control-bus';

const modulePath = 'libs/features/tools/src/lib/studies/eip/control-bus.ts';
// The record's parameters: the operator's two phrases.
const parameters = { pause: 'analysis:', direction: 'go ahead' };

const run = (): FlowStudyModel => {
  const result = model(parameters);
  if (result.family !== 'flow') throw new Error('The control bus is drawn as a flow.');
  return result;
};

/** What moves at a step, as the link and the message's key. */
const hopsAt = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The keys of the messages a node holds after a step. */
const heldBy = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

/** The links of each channel: the work queue's two, and every one with the control bus at an end. */
const workLinks = ['put', 'take'];
const busLinks = example.links
  .filter(({ from, to }) => from === 'bus' || to === 'bus')
  .map(({ id }) => id);

/** What crossed any of these links over the whole run, in the order it first crossed. */
const carriedBy = (frames: readonly FlowFrame[], links: readonly string[]) => [
  ...new Set(
    frames.flatMap(({ hops }) =>
      hops.filter(({ link }) => links.includes(link)).map(({ content }) => content),
    ),
  ),
];

it('attaches the record to the Control Bus row and draws its flow from this module', async () => {
  const record = await loadFlowStudy('eip:184');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toBeNull();
  expect(record.example.parameters).toEqual(parameters);
  const { flow, diagram } = run();
  expect(diagram).toBeNull();
  // Every value the record's prose reads is supplied at every step.
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ...record.limits.flatMap(placeholdersIn),
  ];
  for (const frame of flow.frames)
    for (const name of names) expect(frame.values[name], name).toBeDefined();
  expect(fillValues(record.visual.textEquivalent, flow.frames[9].values)).toBe(
    'At step 9, on the work queue and the control bus, p (analysis:) moves from Control bus to Verifier. Now Operator: sent the pause; Executor: works on order 33; Work queue: 1 record; Verifier: paused; Work queue holds 32; Verifier holds 31.',
  );
});

it('keeps evidence on the work queue and every question, command and answer on the bus', () => {
  const { flow } = run();
  expect(carriedBy(flow.frames, workLinks)).toEqual([
    'evidence of order 31',
    'evidence of order 32',
    'evidence of order 33',
  ]);
  expect(carriedBy(flow.frames, busLinks)).toEqual([
    'status?',
    'executor: on order 33',
    'verifier: checking 31',
    'analysis:',
    'go ahead',
  ]);
  // The pause and the direction are the phrases the record names.
  expect(example.messages['pause'].content).toBe(parameters.pause);
  expect(example.messages['direction'].content).toBe(parameters.direction);
  expect(flow.frames[0].values).toMatchObject(parameters);
  // The bus only carries: it holds nothing and has nothing to say about itself.
  for (const frame of flow.frames) {
    expect(frame.states['bus']).toBeUndefined();
    expect(heldBy(frame, 'bus')).toEqual([]);
  }
});

it('queues evidence 32 behind 31, then asks both roles for their status without moving it', () => {
  const { flow, initialStep, moments } = run();
  expect(initialStep).toBe(0);
  expect(hopsAt(flow.frames[1])).toEqual(['put 31']);
  expect(hopsAt(flow.frames[2])).toEqual(['take 31']);
  expect(hopsAt(flow.frames[3])).toEqual(['put 32']);
  expect(hopsAt(flow.frames[4])).toEqual(['ask s']);
  expect(hopsAt(flow.frames[5])).toEqual(['to-executor s', 'to-verifier s']);
  expect(hopsAt(flow.frames[6])).toEqual(['from-executor e', 'from-verifier v']);
  expect(hopsAt(flow.frames[7])).toEqual(['tell e', 'tell v']);
  expect(flow.frames[7].states['operator']).toBe('has both answers');
  // While the question and its answers travel, nothing moves on the work queue: 32 stays queued
  // and the verifier keeps checking 31.
  for (const frame of flow.frames.slice(4, 8)) {
    expect(
      frame.hops.some(({ link }) => workLinks.includes(link)),
      `step ${frame.step}`,
    ).toBe(false);
    expect(heldBy(frame, 'queue'), `step ${frame.step}`).toEqual(['32']);
    expect(heldBy(frame, 'verifier'), `step ${frame.step}`).toEqual(['31']);
  }
  expect(moments).toEqual([
    { label: 'Queued', step: 3 },
    { label: 'Answers in', step: 7 },
    { label: 'Pause arrives', step: 9 },
    { label: 'Backlog grows', step: 10 },
    { label: 'Resumed', step: 12 },
  ]);
});

it('delivers the pause to the verifier while evidence 32 still waits in the work queue', () => {
  const { flow } = run();
  expect(hopsAt(flow.frames[8])).toEqual(['ask p']);
  const pause = flow.frames[9];
  expect(hopsAt(pause)).toEqual(['to-verifier p']);
  expect(pause.values['moves']).toBe('p (analysis:) moves from Control bus to Verifier');
  expect(heldBy(pause, 'queue')).toEqual(['32']);
  expect(heldBy(pause, 'verifier')).toEqual(['31']);
  expect(pause.states['verifier']).toBe('paused');
});

it('lets the backlog grow while the verifier is paused, and loses nothing when it resumes', () => {
  const { flow } = run();
  // The pause was addressed to the verifier alone, so the executor puts evidence 33 on the queue as usual.
  expect(hopsAt(flow.frames[10])).toEqual(['put 33']);
  expect(flow.frames.slice(9).map((frame) => heldBy(frame, 'queue'))).toEqual([
    ['32'],
    ['32', '33'],
    ['32', '33'],
    ['32', '33'],
  ]);
  // Nothing leaves the queue for the verifier after evidence 31.
  expect(flow.frames.filter(({ hops }) => hops.some(({ link }) => link === 'take'))).toHaveLength(
    1,
  );
  const last = flow.frames[flow.frames.length - 1];
  expect(last.step).toBe(12);
  expect(hopsAt(last)).toEqual(['to-verifier g']);
  expect(last.states['verifier']).toBe('checking 31 again');
  expect(heldBy(last, 'verifier')).toEqual(['31']);
});

it('keeps within what the drawing shows legibly, across a wide screen or down a phone', () => {
  const { flow, legend } = run();
  const stages = new Set(flow.nodes.map(({ stage }) => stage));
  expect(stages.size).toBeLessThanOrEqual(4);
  expect(flow.nodes.length).toBeLessThanOrEqual(8);
  for (const stage of stages)
    expect(flow.nodes.filter((node) => node.stage === stage).length).toBeLessThanOrEqual(4);
  for (const { label } of flow.nodes) {
    const words = label.split(' ');
    expect(words.length, label).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length, label).toBeLessThanOrEqual(10);
  }
  expect(flow.nodes.find(({ id }) => id === 'bus')).toMatchObject({
    kind: 'channel',
    tone: 'subject',
  });
  expect(flow.nodes.find(({ id }) => id === 'queue')?.kind).toBe('channel');
  // Every line joins neighbouring stages: none skips one, and none joins two boxes of one stage,
  // which a phone draws side by side with no room for a message between them.
  const stageOf = (id: string) => flow.nodes.find((node) => node.id === id)?.stage ?? -1;
  for (const { id, from, to } of flow.links)
    expect(Math.abs(stageOf(from) - stageOf(to)), id).toBe(1);
  expect(legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
  expect(flow.frames.length - 1).toBeLessThanOrEqual(16);
  for (const frame of flow.frames) {
    for (const state of Object.values(frame.states))
      expect(state.length, state).toBeLessThanOrEqual(40);
    expect(frame.note, `step ${frame.step}`).toBeTruthy();
  }
});
