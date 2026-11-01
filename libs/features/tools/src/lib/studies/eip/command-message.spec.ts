import { loadFlowStudy } from '../../../../testing/src';
import type { FlowStudyModel } from '../study-model';
import { ticksOf } from '../study-model';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import { example, model } from './command-message';

const path = 'libs/features/tools/src/lib/studies/eip/command-message.ts';
// The record's own parameters: the order to verify and the command's id.
const parameters = { order: 41, commandId: 7 };

const flowOf = (values: Readonly<Record<string, number | string>>): FlowStudyModel => {
  const run = model(values);
  if (run.family !== 'flow') throw new Error('The command study draws a flow.');
  return run;
};

const run = flowOf(parameters);
const frame = (step: number) => run.flow.frames[step];
const hopsAt = (step: number) => frame(step).hops.map(({ key, link }) => `${key} on ${link}`);
const heldAt = (step: number, node: string) => (frame(step).held[node] ?? []).map(({ key }) => key);
const stateAt = (step: number, node: string) => frame(step).states[node];

it('attaches the record to the Command Message row and draws it from this module', async () => {
  const record = await loadFlowStudy('eip:78');
  expect(record.visual.model).toBe(path);
  expect(record.visual.family).toBe('flow');
  // A command is a kind of message, not a stream to transform, so nothing runs and no RxJS
  // reading stands in for one.
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toBeNull();
  expect(record.example.parameters).toEqual(parameters);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  const names = [
    ...placeholdersIn(record.visual.textEquivalent),
    ...placeholdersIn(record.example.description),
    ...record.mechanism.steps.flatMap(({ text }) => placeholdersIn(text)),
    ...record.limits.flatMap(placeholdersIn),
  ];
  const ticks = ticksOf(model(record.example.parameters));
  for (const tick of ticks) for (const name of names) expect(tick.values[name], name).toBeDefined();
});

it('carries the procedure, its argument and the id inside the command', () => {
  // The command is drawn as its id, and each result as the letter of the session sending it.
  const command = example.messages[String(parameters.commandId)];
  expect(command.key).toBe(String(parameters.commandId));
  expect(command.content).toContain('verify');
  expect(command.content).toContain(`order ${parameters.order}`);
  expect(command.content).toContain(`id ${parameters.commandId}`);
  // Each result names the command it answers, so it can be matched to the request.
  expect(example.messages['b'].content).toBe(`result for ${parameters.commandId} from B`);
  expect(example.messages['a'].content).toBe(`result for ${parameters.commandId} from A`);
});

it('keeps the command on the channel while both sessions are busy, then gives it to one', () => {
  expect(stateAt(0, 'sessionA')).toMatch(/^busy/);
  expect(stateAt(0, 'sessionB')).toMatch(/^busy/);
  expect(hopsAt(1)).toEqual(['7 on send']);
  expect(heldAt(1, 'dispatch')).toEqual(['7']);
  expect(stateAt(1, 'kernel')).toContain('not waiting');
  // Both sessions become free and nothing moves: the command has waited for them.
  expect(hopsAt(2)).toEqual([]);
  expect(heldAt(2, 'dispatch')).toEqual(['7']);
  expect([stateAt(2, 'sessionA'), stateAt(2, 'sessionB')]).toEqual([
    'free, listening',
    'free, listening',
  ]);
  // Exactly one taker: B receives the command and A, equally free, receives nothing.
  expect(hopsAt(3)).toEqual(['7 on to-b']);
  expect(heldAt(3, 'dispatch')).toEqual([]);
  expect(heldAt(3, 'sessionB')).toEqual(['7']);
  expect(heldAt(3, 'sessionA')).toEqual([]);
  expect(stateAt(3, 'sessionA')).toBe('free; given nothing');
  // At no step does the channel hand out more than one message.
  for (const { hops } of run.flow.frames)
    expect(hops.filter(({ link }) => link === 'to-a' || link === 'to-b').length).toBeLessThan(2);
});

it('sends the same command again when the answer is slow, and the copy runs a second time', () => {
  expect(hopsAt(4)).toEqual([]);
  expect(stateAt(4, 'kernel')).toBe('wait for 7 ran out');
  expect(heldAt(4, 'sessionB')).toEqual(['7']);
  expect(hopsAt(5)).toEqual(['7 on send']);
  // The copy is the same message as the first: the channel cannot tell it from new work.
  expect(frame(5).hops[0]).toEqual(frame(1).hops[0]);
  expect(hopsAt(6)).toEqual(['7 on to-a']);
  // One request is now being carried out in both sessions.
  expect(heldAt(6, 'sessionA')).toEqual(['7']);
  expect(heldAt(6, 'sessionB')).toEqual(['7']);
  expect(frame(6).note).toContain(`Order ${parameters.order} is now being verified in both`);
  const sends = run.flow.frames.flatMap(({ hops }) => hops.filter(({ link }) => link === 'send'));
  const takes = run.flow.frames.flatMap(({ hops }) =>
    hops.filter(({ link }) => link === 'to-a' || link === 'to-b'),
  );
  expect(sends.map(({ key }) => key)).toEqual(['7', '7']);
  expect(takes.map(({ link }) => link)).toEqual(['to-b', 'to-a']);
});

it('returns each result as a message of its own, two of them for one request', () => {
  expect(hopsAt(7)).toEqual(['b on b-result']);
  expect(heldAt(7, 'store')).toEqual(['b']);
  expect(hopsAt(8)).toEqual(['a on a-result']);
  expect(heldAt(8, 'store')).toEqual(['b', 'a']);
  expect(stateAt(8, 'store')).toBe('two results for 7');
  expect(heldAt(8, 'sessionA')).toEqual([]);
  expect(heldAt(8, 'sessionB')).toEqual([]);
});

it('names only the example’s own order in every note', () => {
  // The busy sessions' earlier orders appear in their states; every note is about the one order.
  for (const { note } of run.flow.frames)
    for (const [, order] of (note ?? '').matchAll(/[Oo]rder (\d+)/g))
      expect(order).toBe(String(parameters.order));
});

it('opens at the start and says so in the text equivalent', async () => {
  const record = await loadFlowStudy('eip:78');
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Sent', step: 1 },
    { label: 'One taker', step: 3 },
    { label: 'Sent again', step: 5 },
    { label: 'Run twice', step: 6 },
    { label: 'Two results', step: 8 },
  ]);
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
  const text = fillValues(record.visual.textEquivalent, frame(3).values);
  expect(text).toContain('Command 7 to verify order 41, step 3');
  expect(text).toContain('7 (verify order 41, id 7) moves from Dispatch to Session B');
  expect(text).toContain('Session A: free; given nothing');
  expect(text).toContain('Held: Session B holds 7');
});

it('explains every box and token in its caption, in the drawing the family makes', () => {
  const caption = run.caption;
  for (const { label } of example.nodes) expect(caption).toContain(label);
  for (const { key } of Object.values(example.messages)) expect(caption).toContain(`${key} `);
  // The family draws the pattern's part with a bold name and puts the words inside each box.
  expect(caption).toContain('bold name');
  expect(caption).not.toMatch(/black|beside/i);
});

it('stays legible at narrow width: few stages, short names and short states', () => {
  const { nodes, frames } = run.flow;
  expect(nodes.length).toBeLessThanOrEqual(8);
  const stages = new Set(nodes.map(({ stage }) => stage));
  expect(stages.size).toBeLessThanOrEqual(4);
  for (const stage of stages)
    expect(nodes.filter((node) => node.stage === stage).length).toBeLessThanOrEqual(4);
  for (const { label } of nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  // The dispatch channel is the part the pattern is about.
  expect(nodes.filter(({ tone }) => tone === 'subject').map(({ id }) => id)).toEqual(['dispatch']);
  expect(frames.length - 1).toBeLessThanOrEqual(16);
  for (const { states, note } of frames) {
    expect(note).toBeTruthy();
    for (const state of Object.values(states)) expect(state.length).toBeLessThanOrEqual(40);
  }
});
