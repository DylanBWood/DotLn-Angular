import { loadFlowStudy } from '../../../../testing/src';
import type { FlowFrame, FlowStudyModel } from '../study-model';
import { fillValues, placeholdersIn } from '../study-text';
import { example, model } from './message-store';

const modulePath = 'libs/features/tools/src/lib/studies/eip/message-store.ts';
// The record's parameters: which kind of record the log keeps whole and which as an envelope.
const parameters = { keptInFull: 'verification reports', envelopeOnly: 'evidence' };

const run = (): FlowStudyModel => {
  const result = model(parameters);
  if (result.family !== 'flow') throw new Error('The message store is drawn as a flow.');
  return result;
};

/** What moves at a step, as the link and the message's key. */
const hopsAt = (frame: FlowFrame) => frame.hops.map(({ link, key }) => `${link} ${key}`);

/** The keys of the messages a node holds after a step. */
const heldBy = (frame: FlowFrame, node: string) => (frame.held[node] ?? []).map(({ key }) => key);

/** Everything that crossed one link over the whole run, in order. */
const carriedBy = (frames: readonly FlowFrame[], link: string) =>
  frames.flatMap(({ hops }) =>
    hops.filter((hop) => hop.link === link).map(({ content }) => content),
  );

it('attaches the record to the Message Store row and draws its flow from this module', async () => {
  const record = await loadFlowStudy('eip:192');
  expect(record.visual.model).toBe(modulePath);
  expect(record.pseudocode.executable).toBeNull();
  // The reading does not run, says so first, and names the pattern's parts where the code has them.
  const reading = record.pseudocode.rxjs ?? '';
  expect(reading.startsWith('// Illustrative: ')).toBe(true);
  for (const part of ['// the copy channel', '// the message store', '// the query'])
    expect(reading).toContain(part);
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
  expect(fillValues(record.visual.textEquivalent, flow.frames[6].values)).toBe(
    'At step 6, E (evidence 32) moves from Executor to Verifier; 3 (envelope of evidence 32) moves from Executor to Control log. Work records travel between the roles, copies travel to the control log on a channel of their own, and the audit asks only the log. Now Executor: works on order 33; Verifier: checking 32; Reviewer: done with 31; Control log: down: 3 lost; 2 entries; Audit: found 31 complete; Verifier holds E; Control log holds 1, 2.',
  );
});

it('fires each copy in the same step as the hand-over it copies', () => {
  const { flow } = run();
  expect(hopsAt(flow.frames[1])).toEqual(['hand-over e', 'copy-evidence 1']);
  expect(hopsAt(flow.frames[2])).toEqual(['file r', 'copy-report 2']);
  expect(heldBy(flow.frames[2], 'log')).toEqual(['1', '2']);
});

it('keeps only the envelope of evidence and the whole of a verification report', () => {
  const { flow } = run();
  expect(carriedBy(flow.frames, 'copy-evidence')).toEqual([
    'envelope of evidence 31',
    'envelope of evidence 32',
  ]);
  expect(carriedBy(flow.frames, 'copy-report')).toEqual(['report 31 in full', 'report 32 in full']);
  for (const copy of carriedBy(flow.frames, 'copy-evidence'))
    expect(copy.startsWith(`envelope of ${parameters.envelopeOnly}`)).toBe(true);
  expect(flow.frames[0].values).toMatchObject(parameters);
});

it('answers the audit from the log after the roles have let go of order 31', () => {
  const { flow, initialStep, moments } = run();
  // The audit is joined to the log alone, never to the work.
  expect(
    example.links
      .filter(({ from, to }) => from === 'audit' || to === 'audit')
      .map(({ from, to }) => `${from} to ${to}`),
  ).toEqual(['audit to log', 'log to audit']);
  // The reviewer lets the report go, and nothing moves while it does.
  const done = flow.frames[3];
  expect(done.hops).toEqual([]);
  expect(done.states['reviewer']).toBe('done with 31');
  expect(hopsAt(flow.frames[4])).toEqual(['ask q']);
  const answer = flow.frames[5];
  expect(hopsAt(answer)).toEqual(['answer a']);
  // No role holds anything of order 31 any more; only the log does.
  for (const role of ['executor', 'verifier', 'reviewer']) expect(heldBy(answer, role)).toEqual([]);
  expect(heldBy(answer, 'log')).toEqual(['1', '2']);
  expect(answer.states['audit']).toBe('found 31 complete');
  expect(initialStep).toBe(0);
  expect(moments).toEqual([
    { label: 'Copies fired', step: 1 },
    { label: 'Read after use', step: 5 },
    { label: 'Copy lost', step: 6 },
    { label: 'Gap reported', step: 9 },
  ]);
});

it('loses a copy while the log is down without the work noticing, and reports the gap later', () => {
  const { flow } = run();
  const lost = flow.frames[6];
  expect(hopsAt(lost)).toEqual(['hand-over E', 'copy-evidence 3']);
  expect(lost.states['log']).toBe('down: 3 lost; 2 entries');
  // The evidence arrives; its copy does not join the log's entries.
  expect(heldBy(lost, 'verifier')).toEqual(['E']);
  expect(heldBy(lost, 'log')).toEqual(['1', '2']);
  // The work runs for order 32 as it ran for order 31.
  const work = (frame: FlowFrame) =>
    frame.hops
      .filter(({ link }) => link === 'hand-over' || link === 'file')
      .map(({ link }) => link);
  expect([1, 2, 6, 7].map((step) => work(flow.frames[step]))).toEqual([
    ['hand-over'],
    ['file'],
    ['hand-over'],
    ['file'],
  ]);
  expect(hopsAt(flow.frames[8])).toEqual(['ask Q']);
  const gap = flow.frames[9];
  expect(gap.step).toBe(flow.frames.length - 1);
  expect(hopsAt(gap)).toEqual(['answer A']);
  expect(heldBy(gap, 'log')).toEqual(['1', '2', '4']);
  expect((gap.held['log'] ?? []).some(({ content }) => content.includes('evidence 32'))).toBe(
    false,
  );
  expect(gap.states['audit']).toBe('found a gap in 32');
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
  expect(flow.nodes.find(({ id }) => id === 'log')?.tone).toBe('subject');
  // No line joins two boxes of one stage, which a phone draws side by side with no room between.
  const stageOf = (id: string) => flow.nodes.find((node) => node.id === id)?.stage ?? -1;
  for (const { id, from, to } of flow.links) expect(stageOf(from), id).not.toBe(stageOf(to));
  expect(legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
  expect(flow.frames.length - 1).toBeLessThanOrEqual(16);
  for (const frame of flow.frames) {
    for (const state of Object.values(frame.states))
      expect(state.length, state).toBeLessThanOrEqual(40);
    // One message per line at a step, so two tokens never share a short line.
    const links = frame.hops.map(({ link }) => link);
    expect(new Set(links).size, `step ${frame.step}`).toBe(links.length);
    expect(frame.note, `step ${frame.step}`).toBeTruthy();
  }
});
