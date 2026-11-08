import { loadModelStudy, studyTranslate, tokensOf } from '../../../../testing/src';
import { codeBlocks, fillValues } from '../study-text';
import {
  catalogKey,
  close,
  emptyRegistry,
  lookup,
  model,
  provide,
  readCatalog,
  readParameters,
  registryRun,
} from './registry.model';

const record = await loadModelStudy('poeaa:421', 'states');
const parameters = record.example.parameters;
const example = { perPage: false, returns: 1 };

it('runs the example the record names, from the record’s own parameters', () => {
  expect(parameters).toEqual({ ...example, perPage: 0 });
  expect(readParameters(parameters)).toEqual(example);
  expect(record.pseudocode.executable?.module).toBe(record.visual.model);
  expect(codeBlocks(record.pseudocode.ordinary)).toHaveLength(record.mechanism.steps.length);
  expect(record.pseudocode.rxjs?.startsWith('// Illustrative: ')).toBe(true);
});

it('builds on the first lookup in a scope, shares after it, and refuses a key nothing registers', () => {
  const registered = provide(provide(emptyRegistry, 'tools', catalogKey), 'scene', catalogKey);
  const first = lookup(registered, 'tools', catalogKey);
  expect(first.answer).toEqual({ kind: 'built', loader: 1 });
  const second = lookup(first.registry, 'tools', catalogKey);
  expect(second.answer).toEqual({ kind: 'shared', loader: 1 });
  // Another scope asking under the same key builds its own.
  const other = lookup(second.registry, 'scene', catalogKey);
  expect(other.answer).toEqual({ kind: 'built', loader: 2 });
  expect([other.registry.lookups, other.registry.built]).toEqual([3, 2]);
  // The dependency is found only when the lookup runs: an unregistered key is refused then.
  expect(lookup(other.registry, 'tools', 'scene-renderer').answer).toEqual({ kind: 'refused' });
  expect(lookup(other.registry, 'home', catalogKey).answer).toEqual({ kind: 'refused' });
});

it('reads once per loader, and a closed scope takes its loader with it', () => {
  const built = lookup(provide(emptyRegistry, 'catalog', catalogKey), 'catalog', catalogKey);
  const read = readCatalog(readCatalog(built.registry, 1), 1);
  expect(read.read).toEqual([1]);
  const closed = close(read, 'catalog');
  expect(closed.scopes.catalog).toBeUndefined();
  // Reopened, the page's scope starts empty and its lookup builds a second loader.
  const reopened = lookup(provide(closed, 'catalog', catalogKey), 'catalog', catalogKey);
  expect(reopened.answer).toEqual({ kind: 'built', loader: 2 });
});

it('lets the two Tools pages share one loader and its read, while the scene builds its own', () => {
  const steps = registryRun(example);
  const last = steps[steps.length - 1];
  expect(steps).toHaveLength(5);
  expect(
    steps.map(({ operation }) => (operation.kind === 'open' ? operation.answer : null)),
  ).toEqual([
    null,
    { kind: 'built', loader: 1 },
    { kind: 'shared', loader: 1 },
    { kind: 'built', loader: 2 },
    { kind: 'shared', loader: 1 },
  ]);
  expect([last.registry.lookups, last.registry.built, last.registry.read.length]).toEqual([
    4, 2, 2,
  ]);
  // More return visits cost lookups and nothing else.
  const often = registryRun({ ...example, returns: 3 });
  const end = often[often.length - 1].registry;
  expect([end.lookups, end.built, end.read.length]).toEqual([6, 2, 2]);
});

it('builds and reads again at every opening when each Tools page registers its own', () => {
  const steps = registryRun({ ...example, perPage: true });
  const last = steps[steps.length - 1];
  expect(
    steps.map(({ operation }) => (operation.kind === 'open' ? operation.answer : null)),
  ).toEqual([
    null,
    { kind: 'built', loader: 1 },
    { kind: 'built', loader: 2 },
    { kind: 'built', loader: 3 },
    { kind: 'built', loader: 4 },
  ]);
  expect([last.registry.lookups, last.registry.built, last.registry.read.length]).toEqual([
    4, 4, 4,
  ]);
  // Leaving a page closes its own scope: the home's loader is gone, as is the catalog page's first.
  expect(steps[2].operation).toMatchObject({ closed: { scope: 'home', loader: 1 } });
  expect(steps[3].operation).toMatchObject({ closed: { scope: 'catalog', loader: 2 } });
  expect(last.held.home?.discarded).toBe(true);
  expect(Object.keys(last.registry.scopes).sort()).toEqual(['catalog', 'scene']);
  const often = registryRun({ perPage: true, returns: 3 }).at(-1)?.registry;
  expect([often?.built, often?.read.length]).toEqual([6, 6]);
});

it('draws each page in the state its lookup left it and names them in the text equivalent', () => {
  const run = model(parameters, studyTranslate);
  const frames = run.states.frames;
  expect(frames).toHaveLength(5);
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(0)).toEqual({ home: 'waiting', catalog: 'waiting', scene: 'waiting' });
  expect(at(2)).toEqual({ home: 'built', catalog: 'shared', scene: 'waiting' });
  expect(at(4)).toEqual({ home: 'built', catalog: 'shared', scene: 'built' });
  // The return is a loop back into Shared loader: the same lookup, the same loader.
  expect(frames[4].moves).toEqual([
    { object: 'catalog', from: 'shared', to: 'shared', transition: 'lookupSharesAgain' },
  ]);
  expect(fillValues(record.visual.textEquivalent, frames[2].values)).toBe(
    "Step 2: Catalog page moves from Not asked to Shared loader by lookup. Each page's state: Not asked: Soldier scene; New loader: Tools home; Shared loader: Catalog page. Lookups so far: 2; loaders built: 1; reads of the catalog: 1.",
  );
  expect(frames[4].note).toBe(
    'The reader comes back to the catalog page, whose new facade asks again. The registration in the Tools routes outlived the visit to the scene, so it hands back loader 1, and nothing is read.',
  );
  expect(run.moments.map(({ label, step }) => [label, step])).toEqual([
    ['Tools home', 1],
    ['Catalog page', 2],
    ['Scene', 3],
    ['Return', 4],
  ]);
});

it('shows the per-page failure in the drawing: new loaders, a loop into New loader and notes of loss', () => {
  const run = model({ ...parameters, perPage: 1 }, studyTranslate);
  const frames = run.states.frames;
  const at = (step: number) =>
    Object.fromEntries(frames[step].placements.map(({ object, node }) => [object, node]));
  expect(at(2)).toEqual({ home: 'built', catalog: 'built', scene: 'waiting' });
  expect(frames[4].moves).toEqual([
    { object: 'catalog', from: 'built', to: 'built', transition: 'lookupBuildsAgain' },
  ]);
  const note = (step: number, object: string) =>
    frames[step].placements.find((placement) => placement.object === object)?.note;
  expect(note(4, 'home')).toBe('loader 1 gone with the page');
  expect(note(4, 'catalog')).toBe('built loader 4');
  expect(frames[2].note).toContain('loader 1 went with them');
  expect(frames[4].values['reads']).toBe('4');
  // Every page stands in the example under its token letter, and only the catalog page moves.
  const keys = tokensOf(run.states);
  expect(frames[4].placements.map(({ object }) => keys[object])).toEqual(['H', 'C', 'S']);
  expect(frames[4].moves.map(({ object }) => keys[object])).toEqual(['C']);
});
