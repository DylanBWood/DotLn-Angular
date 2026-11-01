import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';

import { provideStorageTokenTestKit } from '@dotln-angular/data-access/testing';
import { catalogPageEvents, toolsHomeEvents } from '@dotln-angular/events';
import type { Tool } from '@dotln-angular/models';

import { catalogFixture, provideCatalogTestKit } from '../../testing/src';
import { CatalogStore } from './catalog-store';
import { CatalogToken } from './catalog-token';
import {
  catalogShelf,
  chapterKey,
  contentsFor,
  emptyReading,
  restoreReading,
  searchReadings,
} from './reading';

it('shows a loaded work the shelf does not list by its slug, without a scene type', () => {
  const tool: Tool = { ...catalogFixture[0], id: 'goal:1', work: 'goal' };
  expect(catalogShelf([tool])).toEqual([
    { work: 'goal', title: 'goal', scene: null, count: 1, studied: 0 },
  ]);
});

function setup(stored?: unknown, tools: readonly Tool[] = catalogFixture) {
  const storage = provideStorageTokenTestKit();
  if (stored !== undefined) storage.values.set('dotln-angular.tools', JSON.stringify(stored));
  TestBed.configureTestingModule({
    providers: [...storage.providers, ...provideCatalogTestKit(tools).providers],
  });
  const store = TestBed.inject(CatalogStore);
  const dispatch = TestBed.inject(Dispatcher);
  dispatch.dispatch(catalogPageEvents.opened());
  return { store, dispatch, storage };
}

it('persists the chosen work, chapter, concept and ten unique readings at the tools key', async () => {
  const { store, dispatch, storage } = setup();
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  dispatch.dispatch(catalogPageEvents.workChosen('aifg'));
  dispatch.dispatch(catalogPageEvents.chapterChosen(chapterKey(catalogFixture[0])));
  dispatch.dispatch(catalogPageEvents.conceptOpened('sample:1'));
  dispatch.dispatch(catalogPageEvents.conceptOpened('sample:2'));
  expect(store.history()).toEqual(['sample:2', 'sample:1']);
  dispatch.dispatch(catalogPageEvents.readingReturned());
  expect(store.selectedId()).toBe('sample:1');
  expect(store.work()).toBe('aifg');
  TestBed.tick();
  expect(JSON.parse(storage.values.get('dotln-angular.tools') ?? '{}')).toEqual({
    ...emptyReading,
    work: 'aifg',
    chapter: chapterKey(catalogFixture[0]),
    section: 'First concepts',
    history: ['sample:1', 'sample:2'],
    lastTitle: 'Flock',
  });
  expect(storage.values.has('dotln-angular.catalog')).toBe(false);
  dispatch.dispatch(catalogPageEvents.conceptOpened('absent:99'));
  expect(store.selectedId()).toBe('sample:1');
});

it('closes the open chapter or section when it is chosen again', async () => {
  const { store, dispatch } = setup();
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  dispatch.dispatch(catalogPageEvents.workChosen('aifg'));
  const chapter = chapterKey(catalogFixture[0]);
  dispatch.dispatch(catalogPageEvents.chapterChosen(chapter));
  dispatch.dispatch(catalogPageEvents.sectionChosen('First concepts'));
  expect(store.section()).toBe('First concepts');
  dispatch.dispatch(catalogPageEvents.sectionChosen('First concepts'));
  expect(store.section()).toBeNull();
  expect(store.chapter()).toBe(chapter);
  dispatch.dispatch(catalogPageEvents.chapterChosen(chapter));
  expect(store.chapter()).toBeNull();
});

it('opens and restores the unnamed Concepts group for a chapter without sections', async () => {
  const tool = { ...catalogFixture[2], place: { chapter: 'Preface' } };
  const { store, dispatch, storage } = setup(undefined, [tool]);
  await vi.waitFor(() => expect(store.tools()).toHaveLength(1));
  dispatch.dispatch(catalogPageEvents.workChosen('geb'));
  dispatch.dispatch(catalogPageEvents.chapterChosen(chapterKey(tool)));
  const group = contentsFor('geb')([tool])[0].sections[0];
  dispatch.dispatch(catalogPageEvents.sectionChosen(group.title));
  expect(store.section()).toBe(group.title);
  expect(group.tools).toEqual([tool]);
  dispatch.dispatch(catalogPageEvents.conceptOpened(tool.id));
  TestBed.tick();
  const persisted = JSON.parse(storage.values.get('dotln-angular.tools') ?? '{}');
  expect(restoreReading(persisted)).toEqual({
    ...emptyReading,
    work: 'geb',
    chapter: chapterKey(tool),
    section: '',
    history: [tool.id],
    lastTitle: tool.title,
  });
  TestBed.resetTestingModule();
  const reloaded = setup(persisted, [tool]).store;
  await vi.waitFor(() => expect(reloaded.tools()).toHaveLength(1));
  expect(reloaded.section()).toBe(group.title);
  // The address names the open reading, so what was stored opens nothing by itself.
  expect(reloaded.selectedId()).toBeNull();
  expect(reloaded.lastTitle()).toBe(tool.title);
});

it('gives a reading stored before titles were kept its title, and prunes stale history ids', async () => {
  const { lastTitle: _lastTitle, ...stored } = emptyReading;
  const { store } = setup({
    ...stored,
    work: 'aifg',
    selectedId: 'sample:2',
    history: ['sample:1', 'absent:99'],
  });
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  expect(store.selectedId()).toBeNull();
  expect(store.lastTitle()).toBe('Flock');
  expect(store.work()).toBe('aifg');
  expect(store.history()).toEqual(['sample:1']);
});

it('keeps the title with the newest reading that survives pruning', async () => {
  const { store } = setup({
    ...emptyReading,
    work: 'aifg',
    history: ['absent:99', 'sample:1'],
    lastTitle: 'A concept that has gone',
  });
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  expect(store.history()).toEqual(['sample:1']);
  expect(store.lastTitle()).toBe('Flock');
});

it('closes a reading and keeps the place it was read from', async () => {
  const { store, dispatch } = setup();
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  dispatch.dispatch(catalogPageEvents.conceptOpened('sample:1'));
  dispatch.dispatch(catalogPageEvents.readingClosed());
  expect(store.selectedId()).toBeNull();
  expect(store.work()).toBe('aifg');
  expect(store.history()).toEqual(['sample:1']);
});

it('does not reload a loaded catalog when a page opens again, and a retry does', async () => {
  const { store, dispatch } = setup();
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  const loader = TestBed.inject(CatalogToken);
  const load = vi.spyOn(loader, 'load');
  dispatch.dispatch(catalogPageEvents.opened());
  expect(load).not.toHaveBeenCalled();
  expect(store.loading()).toBe(false);
  dispatch.dispatch(catalogPageEvents.retryRequested());
  expect(load).toHaveBeenCalledTimes(1);
});

it('loads the summary for either page, keeps its failure apart and clears it on retry', async () => {
  const { store, dispatch } = setup();
  await vi.waitFor(() => expect(store.summary()?.works).toHaveLength(3));
  const loader = TestBed.inject(CatalogToken);
  vi.spyOn(loader, 'summary').mockRejectedValueOnce(new Error('Unavailable'));
  dispatch.dispatch(toolsHomeEvents.retryRequested());
  await vi.waitFor(() => expect(store.summaryFailure()).not.toBeNull());
  expect(store.failure()).toBeNull();
  dispatch.dispatch(toolsHomeEvents.opened());
  await vi.waitFor(() => expect(store.summaryFailure()).toBeNull());
});

it('ignores the previous filter-shaped state and opens the shelf', async () => {
  const { store } = setup({ filters: { work: 'aifg' }, selectedId: 'sample:1' });
  await vi.waitFor(() => expect(store.tools()).toHaveLength(3));
  expect(store.work()).toBeNull();
  expect(store.selectedId()).toBeNull();
  expect(store.history()).toEqual([]);
});

it('refuses malformed storage instead of partially trusting a version marker', () => {
  for (const value of [
    null,
    {},
    { ...emptyReading, work: 'nope' },
    { ...emptyReading, history: ['../../file'] },
    { ...emptyReading, chapter: 1 },
    { ...emptyReading, history: Array.from({ length: 11 }, (_, i) => `sample:${i + 1}`) },
  ])
    expect(restoreReading(value)).toBeUndefined();
  expect(restoreReading(emptyReading)).toEqual(emptyReading);
});

it('searches definitions and ranks an exact title before incidental mentions', () => {
  const mention = {
    ...catalogFixture[0],
    id: 'sample:4' as const,
    title: 'A related idea',
    definition: 'Flock appears here.',
  };
  expect(searchReadings([mention, ...catalogFixture], 'flock').map((tool) => tool.id)).toEqual([
    'sample:1',
    'sample:4',
  ]);
  expect(searchReadings(catalogFixture, 'transaction')[0]?.id).toBe('sample:2');
  expect(searchReadings(catalogFixture, '   ')).toEqual([]);
  expect(contentsFor('aifg')(catalogFixture)[0].sections[0].tools).toEqual([catalogFixture[0]]);
});

it('ranks title matches alphabetically across works before incidental mentions', () => {
  const tools: readonly Tool[] = [
    { ...catalogFixture[0], id: 'sample:4', title: 'Archive', work: 'poeaa' },
    { ...catalogFixture[0], id: 'sample:5', title: 'Arrive', work: 'aifg' },
    { ...catalogFixture[0], id: 'sample:6', title: 'AR', work: 'geb' },
    {
      ...catalogFixture[0],
      id: 'sample:7',
      title: 'Phases',
      definition: 'An ar mention.',
      work: 'aifg',
    },
    { ...catalogFixture[0], id: 'sample:8', title: 'Arbitrary', work: 'aifg' },
  ];
  expect(searchReadings(tools, ' ar ').map((tool) => tool.title)).toEqual([
    'AR',
    'Arbitrary',
    'Archive',
    'Arrive',
    'Phases',
  ]);
});
