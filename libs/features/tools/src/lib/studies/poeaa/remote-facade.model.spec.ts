import { loadStatesStudy, studyTranslate } from '../../../../testing/src';
import { registerDrawing } from '../../composites/study-visuals/states/states-register';
import { codeBlocks, fillValues } from '../study-text';
import {
  boardPanels,
  boardSources,
  model,
  oneByOneCalls,
  readPanel,
  remoteFacadeRun,
  walkRounds,
} from './remote-facade.model';

const record = await loadStatesStudy('poeaa:357');
const parameters = record.example.parameters;
const example = {
  rowsActors: 6,
  rowsBuilds: 6,
  rowsMechanisms: 10,
  rowsWork: 38,
  rowsBlueprint: 5,
  buildsDown: 0,
  reportsFailures: 1,
};

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.rxjs?.startsWith('// Illustrative: ')).toBe(true);
});

it('reads a panel the fine-grained way: one call for the panel and one for each row', () => {
  const sources = boardSources(example);
  expect(readPanel(sources, 'work')).toEqual({
    copy: { id: 'work', status: 'available', rows: 38 },
    calls: 39,
  });
  const down = boardSources({ ...example, buildsDown: 1 });
  expect(readPanel(down, 'builds')).toEqual({ copy: null, calls: 1 });
  // The list, five panels and 65 rows: the walk a page calling one object at a time makes.
  expect(oneByOneCalls(sources)).toBe(71);
  expect(walkRounds(sources)).toBe(3);
  const empty = { ...example, rowsActors: 0, rowsBuilds: 0, rowsMechanisms: 0 };
  expect(walkRounds(boardSources({ ...empty, rowsWork: 0, rowsBlueprint: 0 }))).toBe(2);
});

it('answers one call with the whole board, making every small call inside the facade', () => {
  const steps = remoteFacadeRun(example);
  expect(steps.map(({ operation }) => operation.kind)).toEqual([
    'call',
    'read',
    'read',
    'read',
    'read',
    'read',
    'reply',
  ]);
  // One call across the network, and one check of the caller, for the whole board.
  expect(steps.every(({ calls }) => calls.remote === 1 && calls.checks === 1)).toBe(true);
  expect(steps.map(({ calls }) => calls.local)).toEqual([1, 8, 15, 26, 65, 71, 71]);
  expect(steps.slice(0, -1).every(({ page }) => page.length === 0)).toBe(true);
  const last = steps[steps.length - 1];
  expect(last.page.map(({ id }) => id)).toEqual([
    'actors',
    'builds',
    'mechanisms',
    'work',
    'blueprint',
  ]);
  expect(last.page.reduce((sum, { rows }) => sum + rows, 0)).toBe(65);
  // A stateless facade keeps nothing once it has replied.
  expect(last.response).toEqual([]);
  expect(last.calls.oneByOne).toBe(oneByOneCalls(boardSources(example)));
});

it('keeps a failed part a part when the facade reports it in the response', () => {
  const steps = remoteFacadeRun({ ...example, buildsDown: 1 });
  expect(steps[2].operation).toEqual({ kind: 'reportUnavailable', id: 'builds' });
  const last = steps[steps.length - 1];
  expect(last.operation.kind).toBe('reply');
  expect(last.page.map(({ id, status }) => [id, status])).toEqual([
    ['actors', 'available'],
    ['builds', 'unavailable'],
    ['mechanisms', 'available'],
    ['work', 'available'],
    ['blueprint', 'available'],
  ]);
  expect(last.calls).toEqual({ remote: 1, local: 65, oneByOne: 65, checks: 1 });
});

it('loses the whole board when the facade lets one failed read end the call', () => {
  const failing = { ...example, buildsDown: 1, reportsFailures: 0 };
  const steps = remoteFacadeRun(failing);
  expect(steps.map(({ operation }) => operation.kind)).toEqual([
    'call',
    'read',
    'readFailed',
    'fail',
  ]);
  const last = steps[steps.length - 1];
  expect(last.page).toEqual([]);
  expect(last.response).toEqual([]);
  expect(last.discarded).toEqual(['actors']);
  // Called one panel at a time, only the Builds call fails and the other four still arrive.
  const sources = boardSources(failing);
  expect(boardPanels.filter((id) => readPanel(sources, id).copy !== null)).toEqual([
    'actors',
    'mechanisms',
    'work',
    'blueprint',
  ]);
});

it('draws each panel where it stands and names every state in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(7);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({
    actors: 'source',
    builds: 'source',
    mechanisms: 'source',
    work: 'source',
    blueprint: 'source',
  });
  expect(at(2)).toMatchObject({ actors: 'response', builds: 'response', mechanisms: 'source' });
  expect(Object.values(at(6))).toEqual(['page', 'page', 'page', 'page', 'page']);
  // The reply moves all five panels at once: one answer carries the board.
  expect(frames[6].moves.map(({ object, transition }) => [object, transition])).toEqual([
    ['actors', 'reply'],
    ['builds', 'reply'],
    ['mechanisms', 'reply'],
    ['work', 'reply'],
    ['blueprint', 'reply'],
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[1].values)).toBe(
    'Step 1: Actors moves from In its source to In the response by readPanel. The panels: In its source: Builds, Mechanisms, Work, Blueprint; In the response: Actors; On the page: none. Calls across the network so far: 1; local calls inside the facade: 8.',
  );
  expect(frames[4].placements.find(({ object }) => object === 'work')?.note).toBe(
    '38 rows, 39 local calls',
  );
  expect(frames[6].values['boardCalls']).toBe('71');
  expect(frames[6].values['rounds']).toBe('3');
  expect(frames[6].values['totalRows']).toBe('65');
});

it('draws the failed call as the copied panels leaving and the rest never read', () => {
  const failed = model({ ...parameters, buildsDown: 1, reportsFailures: 0 }, studyTranslate);
  const frames = failed.states.frames;
  const last = frames[frames.length - 1];
  expect(last.moves).toEqual([
    { object: 'actors', from: 'response', to: null, transition: 'discard' },
  ]);
  expect(last.placements.map(({ object, note }) => [object, note])).toEqual([
    ['builds', 'its source cannot be read'],
    ['mechanisms', 'never read'],
    ['work', 'never read'],
    ['blueprint', 'never read'],
  ]);
  expect(last.note).toBe(
    'The call fails after 9 local calls. The panels already copied are thrown away, and the page receives an error and no panel.',
  );
  const drawing = registerDrawing(failed.states, frames.length - 1);
  expect(drawing.ghosts).toHaveLength(1);
  expect(failed.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Call', 0],
    ['First read', 1],
    ['Builds', 2],
    ['Failure', 3],
  ]);
  const reported = model({ ...parameters, buildsDown: 1 }, studyTranslate);
  const end = reported.states.frames[reported.states.frames.length - 1];
  expect(end.placements.find(({ object }) => object === 'builds')?.note).toBe(
    'drawn as unavailable',
  );
});

it('compares one call with a call for every object, and names the moments in order', () => {
  const run = model(parameters, studyTranslate);
  const [facade, oneByOne] = run.comparison?.timeline.series ?? [];
  expect(facade.values).toEqual([1, 1, 1, 1, 1, 1, 1]);
  expect(oneByOne.values).toEqual([1, 8, 15, 26, 65, 71, 71]);
  expect(run.comparison?.findings).toEqual([
    'Calls across the network by the reply: 1 through the facade, 71 one object at a time.',
    'The facade made 71 calls of its own, all inside one process.',
  ]);
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Call', 0],
    ['First read', 1],
    ['Builds', 2],
    ['Reply', 6],
  ]);
  const failed = model({ ...parameters, buildsDown: 1, reportsFailures: 0 }, studyTranslate);
  expect(failed.comparison?.findings[0]).toBe(
    'The failed call cost the page every panel; read one object at a time, only the Builds calls would have failed.',
  );
});
