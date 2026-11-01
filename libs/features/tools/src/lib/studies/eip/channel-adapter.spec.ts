import { loadFlowStudy } from '../../../../testing/src';
import type { FlowStudyModel, StudyModel } from '../study-model';
import { placeholdersIn } from '../study-text';
import { example, model } from './channel-adapter';

const path = 'libs/features/tools/src/lib/studies/eip/channel-adapter.ts';
const parameters = { route: '/uifa-board-v1', failure: 'HTTP 500' };

const flowOf = (study: StudyModel): FlowStudyModel => {
  if (study.family !== 'flow') throw new Error('The adapter is drawn as a flow.');
  return study;
};

const run = flowOf(model(parameters));
const { frames, links, nodes } = run.flow;
const linkOf = (id: string) => links.find((link) => link.id === id);

/** What crosses which link at a step, as `link key`. */
const hopsAt = (step: number) => frames[step].hops.map(({ link, key }) => `${link} ${key}`);

/** The letters of the messages a node holds after a step. */
const heldBy = (node: string, step: number) => frames[step].held[node]?.map(({ key }) => key) ?? [];

it('attaches the record to the Channel Adapter row and draws it from this module', async () => {
  const record = await loadFlowStudy('eip:73');
  expect(record.visual.model).toBe(path);
  expect(record.pseudocode.executable).toBeNull();
  expect(record.pseudocode.rxjs?.startsWith('// Illustrative: ')).toBe(true);
  expect(record.example.parameters).toEqual(parameters);
  const drawn = flowOf(model(record.example.parameters));
  expect(drawn.diagram).toBeNull();
  expect(drawn.initialStep).toBe(0);
  // Every frame supplies each value the record's prose reads.
  const names = [
    record.visual.textEquivalent,
    record.example.description,
    ...record.mechanism.steps.map(({ text }) => text),
    ...record.limits,
  ].flatMap(placeholdersIn);
  expect(new Set(names)).toEqual(new Set(['step', 'moves', 'states', 'held', 'route', 'failure']));
  for (const frame of drawn.flow.frames)
    for (const name of names) expect(frame.values[name], name).toBeDefined();
  expect(drawn.flow.frames[2].values['route']).toBe('/uifa-board-v1');
});

it('turns load into a GET, and the 200 reply into loadSuccess that the board keeps', () => {
  expect([1, 2, 3, 4].map(hopsAt)).toEqual([
    ['publish l'],
    ['request g'],
    ['response d'],
    ['deliver s'],
  ]);
  expect(frames[1].values['moves']).toBe('l (load) moves from Board to Adapter on events');
  expect(frames[2].values['moves']).toBe(
    'g (GET /uifa-board-v1) moves from Adapter to HTTP API on HTTP',
  );
  // The adapter holds the load it serves from taking it until it has published the answer.
  expect([1, 2, 3, 4].map((step) => heldBy('adapter', step))).toEqual([
    ['l'],
    ['l'],
    ['l', 'd'],
    [],
  ]);
  expect(frames[3].states['adapter']).toBe('has the reply to l');
  expect(heldBy('board', 4)).toEqual(['s']);
  expect(frames[4].states['board']).toBe('shows the document');
});

it('keeps the API off the event stream: it receives only GETs and answers only the adapter', () => {
  const intoApi = frames.flatMap(({ hops }) =>
    hops.filter((hop) => linkOf(hop.link)?.to === 'api').map(({ content }) => content),
  );
  expect(intoApi).toEqual(['GET /uifa-board-v1', 'GET /uifa-board-v1']);
  expect(links.filter(({ from }) => from === 'api').map(({ to }) => to)).toEqual(['adapter']);
  // Only the board and the adapter are on the event stream, and only the adapter speaks HTTP.
  const joins = (label: string) =>
    links.filter((link) => link.label === label).map(({ from, to }) => `${from}-${to}`);
  expect(joins('events')).toEqual(['board-adapter', 'adapter-board']);
  expect(joins('HTTP')).toEqual(['adapter-api', 'api-adapter']);
  const onEvents = frames.flatMap(({ hops }) =>
    hops
      .filter((hop) => linkOf(hop.link)?.label === 'events')
      .map((hop) => `${linkOf(hop.link)?.from}: ${hop.content}`),
  );
  expect(onEvents).toEqual([
    'board: load',
    'adapter: loadSuccess with the document',
    'board: load',
    'adapter: loadFailure with an app error',
  ]);
  expect(frames[8].states['api']).toBe('answered 500');
});

it('carries the failed refresh to the board as loadFailure, which clears the document', () => {
  expect([5, 6, 7, 8].map(hopsAt)).toEqual([
    ['publish L'],
    ['request G'],
    ['response E'],
    ['deliver F'],
  ]);
  expect(frames[7].values['moves']).toBe('E (HTTP 500) moves from HTTP API to Adapter on HTTP');
  expect(heldBy('adapter', 7)).toEqual(['L', 'E']);
  // The board keeps the old document until the failure reaches it, then keeps only the failure.
  expect(heldBy('board', 7)).toEqual(['s']);
  expect(frames[7].states['board']).toBe('shows it; refresh asked');
  expect(heldBy('board', 8)).toEqual(['F']);
  expect(frames[8].states['board']).toBe('unavailable, no document');
  expect(frames[8].values['held']).toBe('Board holds F');
});

it('moves one message at each step and names every token and box in its caption', () => {
  expect(frames[0].hops).toEqual([]);
  expect(frames.slice(1).map(({ hops }) => hops.length)).toEqual(Array(8).fill(1));
  for (const key of Object.keys(example.messages))
    expect(run.caption, key).toMatch(new RegExp(`(^|[\\s,:])${key}[\\s,]`));
  for (const { label } of nodes) expect(run.caption, label).toContain(label);
  expect(new Set(nodes.map(({ stage }) => stage)).size).toBeLessThanOrEqual(4);
  expect(nodes.length).toBeLessThanOrEqual(8);
  for (const { label } of nodes) {
    const words = label.split(' ');
    expect(words.length).toBeLessThanOrEqual(2);
    for (const word of words) expect(word.length).toBeLessThanOrEqual(10);
  }
  expect(nodes.filter(({ tone }) => tone === 'subject').map(({ id }) => id)).toEqual(['adapter']);
  for (const { states } of frames)
    for (const text of Object.values(states)) expect(text.length).toBeLessThanOrEqual(40);
  expect(frames.map(({ note }) => note)).toEqual([
    example.start.note,
    ...example.steps.map(({ note }) => note),
  ]);
  expect(run.moments.map(({ step }) => step)).toEqual([1, 2, 4, 7, 8]);
});
