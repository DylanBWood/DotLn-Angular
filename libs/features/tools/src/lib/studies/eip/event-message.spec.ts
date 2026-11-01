import { loadFlowStudy } from '../../../../testing/src';
import type { FlowStudyModel } from '../study-model';
import { ticksOf } from '../study-model';
import { codeBlocks, fillValues, placeholdersIn } from '../study-text';
import { example, model } from './event-message';

const path = 'libs/features/tools/src/lib/studies/eip/event-message.ts';
// The record's own parameters: the order and the sweep's threshold in minutes.
const parameters = { order: 41, staleAfter: 20 };

const flowOf = (values: Readonly<Record<string, number | string>>): FlowStudyModel => {
  const run = model(values);
  if (run.family !== 'flow') throw new Error('The event study draws a flow.');
  return run;
};

const run = flowOf(parameters);
const frame = (step: number) => run.flow.frames[step];
const hopsAt = (step: number) => frame(step).hops.map(({ key, link }) => `${key} on ${link}`);
const heldAt = (step: number, node: string) => (frame(step).held[node] ?? []).map(({ key }) => key);
const stateAt = (step: number, node: string) => frame(step).states[node];

/** Minutes since midnight of the first hh:mm a text names. */
const minutesIn = (text: string) => {
  const found = /(\d{2}):(\d{2})/.exec(text);
  if (!found) throw new Error(`No time in ${text}.`);
  return Number(found[1]) * 60 + Number(found[2]);
};
/** The sweep's rule, as the ordinary pseudocode states it. */
const labelFor = (age: number, threshold: number) => (age >= threshold ? 'stale' : 'fresh');

it('attaches the record to the Event Message row and draws it from this module', async () => {
  const record = await loadFlowStudy('eip:80');
  expect(record.visual.model).toBe(path);
  expect(record.visual.family).toBe('flow');
  // An event is a kind of message, not a stream to transform: nothing runs, and the RxJS reading
  // says so on its first line.
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs).toMatch(/^\/\/ Illustrative: \S/);
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

it('names the pattern’s parts in the illustrative RxJS reading, each above the code that carries it', async () => {
  const record = await loadFlowStudy('eip:80');
  const lines = (record.pseudocode.rxjs ?? '').split('\n');
  // A comment sits on its own line, so a wrapped line never puts its words among the code.
  const commented = (code: string, words: string) =>
    lines.some(
      (line, index) =>
        line.trim().startsWith(`// ${words}`) && (lines[index + 1] ?? '').includes(code),
    );
  expect(commented('transitions$.next(', 'the event message, sent as the change happens')).toBe(
    true,
  );
  expect(commented('quality.note(', 'a subscriber decides for itself')).toBe(true);
  expect(commented('new ReplaySubject<Transition>(1)', 'the beacon: replays the last')).toBe(true);
  expect(commented('now - at >= staleAfter', 'the age check')).toBe(true);
});

it('announces the change as it happens, naming no receiver, then writes it to the beacon', () => {
  expect(hopsAt(1)).toEqual(['v on append']);
  expect(heldAt(1, 'store')).toEqual(['v']);
  // The beacon write follows the entry that causes it, one step later, and carries the same news.
  expect(hopsAt(2)).toEqual(['v on emit']);
  expect(heldAt(2, 'beacon')).toEqual(['v']);
  expect(stateAt(2, 'beacon')).toBe('says verified, 10:00');
  // The sender has no link to any reader: every reader is reached through a channel.
  expect(example.links.filter(({ from }) => from === 'lifecycle').map(({ to }) => to)).toEqual([
    'store',
    'beacon',
  ]);
});

it('gives each watcher the same entry and lets each draw its own conclusion', () => {
  expect(hopsAt(3)).toEqual(['v on to-quality', 'v on to-intent']);
  expect(stateAt(3, 'quality')).toBe('notes a pass for 41');
  expect(stateAt(3, 'intent')).toBe('expects final review next');
  // The sender learns nothing of who read it.
  expect(stateAt(3, 'lifecycle')).toBe(stateAt(1, 'lifecycle'));
  expect(hopsAt(7)).toEqual(['r on to-quality', 'r on to-intent']);
  expect(stateAt(7, 'quality')).not.toBe(stateAt(7, 'intent'));
});

it('reads the beacon fresh at first and stale later, by its age against the threshold', () => {
  const announced = minutesIn(example.messages['v'].content);
  for (const step of [4, 8]) {
    expect(hopsAt(step)).toEqual(['v on read']);
    // Reading the beacon leaves its announcement in place.
    expect(heldAt(step, 'beacon')).toEqual(['v']);
    const sweep = stateAt(step, 'sweep');
    const age = minutesIn(sweep) - announced;
    expect(sweep).toContain(labelFor(age, parameters.staleAfter));
    expect(sweep).toContain(`${age} min old`);
  }
  expect(stateAt(4, 'sweep')).toContain('fresh');
  expect(stateAt(8, 'sweep')).toContain('stale');
  expect(frame(8).note).toContain(`${parameters.staleAfter}-minute threshold`);
  expect(stateAt(0, 'sweep')).toBe(`threshold: ${parameters.staleAfter} minutes`);
});

it('leaves the old announcement standing when the beacon write fails', () => {
  // The move to final review reaches the event store, and its beacon write fails a step later.
  expect(hopsAt(5)).toEqual(['r on append']);
  expect(heldAt(5, 'store')).toEqual(['v', 'r']);
  expect(hopsAt(6)).toEqual([]);
  expect(stateAt(6, 'lifecycle')).toBe('beacon write failed');
  expect(heldAt(6, 'beacon')).toEqual(['v']);
  const appends = run.flow.frames.flatMap(({ hops }) =>
    hops.filter(({ link }) => link === 'append'),
  );
  const emits = run.flow.frames.flatMap(({ hops }) => hops.filter(({ link }) => link === 'emit'));
  expect(appends.map(({ key }) => key)).toEqual(['v', 'r']);
  expect(emits.map(({ key }) => key)).toEqual(['v']);
  // At the stale read the store's latest entry is final review while the beacon still says
  // verified: only the age gives the beacon away.
  expect(heldAt(8, 'store').at(-1)).toBe('r');
  expect(example.messages['r'].content).toContain('final review');
  expect(example.messages['v'].content).toContain('verified');
  // With an hour's threshold the same 10:30 read would pass the outdated phase as fresh.
  const age = minutesIn(stateAt(8, 'sweep')) - minutesIn(example.messages['v'].content);
  expect(labelFor(age, 60)).toBe('fresh');
  expect(labelFor(age, parameters.staleAfter)).toBe('stale');
});

it('opens at the start and says so in the text equivalent', async () => {
  const record = await loadFlowStudy('eip:80');
  expect(run.initialStep).toBe(0);
  expect(run.moments).toEqual([
    { label: 'Announced', step: 1 },
    { label: 'Each reacts', step: 3 },
    { label: 'Fresh', step: 4 },
    { label: 'Beacon missed', step: 6 },
    { label: 'Stale', step: 8 },
  ]);
  expect(run.legend.map(({ tone }) => tone)).toEqual(['subject', 'other', 'actual', 'muted']);
  const text = fillValues(record.visual.textEquivalent, frame(8).values);
  expect(text).toContain('Order 41, step 8');
  expect(text).toContain('v (verified, pass, at 10:00) moves from Beacon to Sweep');
  expect(text).toContain('whose threshold is 20 minutes');
  expect(text).toContain('Beacon: says verified, 10:00');
  expect(text).toContain('Sweep: 10:30: stale, 30 min old');
  expect(text).toContain('Held: Event store holds v, r; Beacon holds v');
});

it('explains every box and token in its caption, in the drawing the family makes', () => {
  const caption = run.caption;
  for (const { label } of example.nodes) expect(caption).toContain(label);
  for (const { key } of Object.values(example.messages)) expect(caption).toContain(`${key} is`);
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
  // The beacon, drawn bold, is the channel where the events' age is judged.
  expect(nodes.filter(({ tone }) => tone === 'subject').map(({ id }) => id)).toEqual(['beacon']);
  expect(frames.length - 1).toBeLessThanOrEqual(16);
  for (const { states, note } of frames) {
    expect(note).toBeTruthy();
    for (const state of Object.values(states)) expect(state.length).toBeLessThanOrEqual(40);
  }
});
