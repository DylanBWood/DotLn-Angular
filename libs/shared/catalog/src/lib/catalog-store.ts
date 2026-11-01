import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { catchError, filter, from, map, merge, of, switchMap } from 'rxjs';

import {
  toAppError,
  withCallState,
  withCommand,
  withPersistedState,
} from '@dotln-angular/data-access';
import { catalogEvents, catalogPageEvents, toolsHomeEvents } from '@dotln-angular/events';
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
    lastTitle: tool.title,
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
    summary: null,
    summaryFailure: null,
  }),
  withCallState(),
  withPersistedState<CatalogReadingState>({
    key: 'tools',
    // The address names the open reading, so it is not stored here.
    select: ({ version, work, chapter, section, history, lastTitle }) => ({
      version,
      work,
      chapter,
      section,
      selectedId: null,
      history,
      lastTitle,
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
    on(catalogPageEvents.conceptOpened, ({ payload }, state) => openReading(state, payload)),
    on(catalogPageEvents.readingClosed, () => ({ selectedId: null })),
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
      // The title follows whichever reading is now the newest, since pruning can change it.
      const lastTitle = payload.find((tool) => tool.id === history[0])?.title ?? null;
      return {
        tools: payload,
        failure: null,
        history,
        lastTitle,
        ...(selected
          ? {
              work: selected.work,
              chapter: chapterKey(selected),
              section: selected.place.section ?? '',
            }
          : !payload.some((tool) => tool.work === state.work)
            ? { ...emptyReading, history, lastTitle }
            : { selectedId: null }),
      };
    }),
    on(catalogEvents.loadFailure, ({ payload }) => ({ tools: [], failure: payload })),
    on(catalogEvents.summaryLoad, () => ({ summaryFailure: null })),
    on(catalogEvents.summaryLoadSuccess, ({ payload }) => ({ summary: payload })),
    on(catalogEvents.summaryLoadFailure, ({ payload }) => ({ summaryFailure: payload })),
  ),
  withCommand({
    trigger: catalogEvents.load,
    success: catalogEvents.loadSuccess,
    failure: catalogEvents.loadFailure,
    call: () => from(inject(CatalogToken).load()),
  }),
  withEventHandlers((store, events = inject(Events), catalog = inject(CatalogToken)) => ({
    // A page opened again over loaded data has nothing to fetch, and a load would flash its
    // loading state; a retry always fetches.
    load: merge(
      events.on(catalogPageEvents.opened).pipe(filter(() => store.tools().length === 0)),
      events.on(catalogPageEvents.retryRequested),
    ).pipe(map(() => catalogEvents.load())),
    summaryRequested: events
      .on(
        catalogPageEvents.opened,
        catalogPageEvents.retryRequested,
        catalogPageEvents.summaryRetryRequested,
        toolsHomeEvents.opened,
        toolsHomeEvents.retryRequested,
      )
      .pipe(map(() => catalogEvents.summaryLoad())),
    // This does not share the catalog's call state: the summary answering first would mark
    // the catalog loaded while its tools are still on their way.
    summary: events.on(catalogEvents.summaryLoad).pipe(
      switchMap(() =>
        from(catalog.summary()).pipe(
          map((summary) => catalogEvents.summaryLoadSuccess(summary)),
          catchError((error) => of(catalogEvents.summaryLoadFailure(toAppError(error)))),
        ),
      ),
    ),
  })),
);
