import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { from, map } from 'rxjs';

import { withCallState, withCommand, withPersistedState } from '@dotln-angular/data-access';
import { catalogEvents, catalogPageEvents } from '@dotln-angular/events';
import type { CatalogReadingState, ToolId } from '@dotln-angular/models';

import { CatalogToken } from './catalog-token';
import { emptyCatalogFilters, isCatalogFilters } from './filters';
import { chapterKey, emptyReading, readingHistoryLimit, restoreReading } from './reading';
import type { CatalogState } from './types';

/** How many earlier readings "Back to the previous reading" can return through. */
const backStackLimit = 20;

function openReading(state: CatalogState, id: ToolId, returning = false): Partial<CatalogState> {
  const tool = state.tools.find((tool) => tool.id === id);
  if (!tool) return {};
  return {
    selectedId: id,
    work: tool.work,
    chapter: chapterKey(tool),
    section: tool.place.section ?? '',
    query: '',
    page: 0,
    history: [id, ...state.history.filter((previous) => previous !== id)].slice(
      0,
      readingHistoryLimit,
    ),
    backStack: returning
      ? state.backStack.slice(0, -1)
      : state.selectedId && state.selectedId !== id
        ? [...state.backStack, state.selectedId].slice(-backStackLimit)
        : state.backStack,
  };
}

export const CatalogStore = signalStore(
  withState<CatalogState>({
    ...emptyReading,
    tools: [],
    filters: emptyCatalogFilters,
    page: 0,
    failure: null,
    query: '',
    backStack: [],
  }),
  withCallState(),
  withPersistedState<CatalogReadingState>({
    key: 'tools',
    select: ({ version, work, chapter, section, selectedId, history }) => ({
      version,
      work,
      chapter,
      section,
      selectedId,
      history,
    }),
    restore: restoreReading,
  }),
  withReducer<CatalogState>(
    on(catalogPageEvents.opened, catalogPageEvents.retryRequested, () => ({ failure: null })),
    on(catalogPageEvents.workChosen, ({ payload }, state) =>
      state.tools.some((tool) => tool.work === payload)
        ? {
            work: payload,
            chapter: null,
            section: null,
            selectedId: null,
            query: '',
            backStack: [],
          }
        : {},
    ),
    // Choosing the open chapter or section again closes it, as its expanded state says.
    on(catalogPageEvents.chapterChosen, ({ payload }, state) =>
      state.tools.some((tool) => tool.work === state.work && chapterKey(tool) === payload)
        ? { chapter: payload === state.chapter ? null : payload, section: null }
        : {},
    ),
    on(catalogPageEvents.sectionChosen, ({ payload }, state) =>
      state.tools.some(
        (tool) =>
          tool.work === state.work &&
          chapterKey(tool) === state.chapter &&
          (tool.place.section ?? '') === payload,
      )
        ? { section: payload === state.section ? null : payload }
        : {},
    ),
    on(catalogPageEvents.conceptOpened, catalogPageEvents.relationFollowed, ({ payload }, state) =>
      openReading(state, payload),
    ),
    on(catalogPageEvents.readingReturned, (_event, state) => {
      const id = state.backStack.at(-1);
      return id ? openReading(state, id, true) : {};
    }),
    on(catalogPageEvents.searched, ({ payload }) => ({ query: payload, page: 0 })),
    on(catalogPageEvents.filtersChanged, ({ payload }) =>
      isCatalogFilters(payload) ? { filters: payload, page: 0 } : {},
    ),
    on(catalogPageEvents.pageChanged, ({ payload }) =>
      Number.isSafeInteger(payload) && payload >= 0 ? { page: payload } : {},
    ),
    on(catalogEvents.loadSuccess, ({ payload }, state) => {
      const selected = payload.find((tool) => tool.id === state.selectedId);
      const history = state.history.filter((id) => payload.some((tool) => tool.id === id));
      return {
        tools: payload,
        failure: null,
        history,
        ...(selected
          ? {
              work: selected.work,
              chapter: chapterKey(selected),
              section: selected.place.section ?? '',
            }
          : !payload.some((tool) => tool.work === state.work)
            ? { ...emptyReading, history }
            : { selectedId: null }),
      };
    }),
    on(catalogEvents.loadFailure, ({ payload }) => ({ tools: [], failure: payload })),
  ),
  withCommand({
    trigger: catalogEvents.load,
    success: catalogEvents.loadSuccess,
    failure: catalogEvents.loadFailure,
    call: () => from(inject(CatalogToken).load()),
  }),
  withEventHandlers((_store, events = inject(Events)) => ({
    load: events
      .on(catalogPageEvents.opened, catalogPageEvents.retryRequested)
      .pipe(map(() => catalogEvents.load())),
  })),
);
