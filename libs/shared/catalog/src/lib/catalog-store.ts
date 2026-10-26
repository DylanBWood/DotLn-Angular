import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { from, map } from 'rxjs';

import { withCallState, withCommand, withPersistedState } from '@dotln-angular/data-access';
import { catalogEvents, catalogPageEvents } from '@dotln-angular/events';
import type { AppError, CatalogFilters, Tool, ToolId } from '@dotln-angular/models';

import { CatalogToken } from './catalog-token';
import { emptyCatalogFilters, isCatalogFilters } from './filters';
import type { CatalogState } from './types';

export const CatalogStore = signalStore(
  withState<CatalogState>({
    tools: [] as readonly Tool[],
    filters: emptyCatalogFilters,
    selectedId: null as ToolId | null,
    page: 0,
    failure: null as AppError | null,
  }),
  withCallState(),
  withPersistedState<{ filters: CatalogFilters; selectedId: ToolId | null }>({
    key: 'catalog',
    select: (state) => ({ filters: state.filters, selectedId: state.selectedId }),
    restore: (value) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('filters' in value) ||
        !isCatalogFilters(value.filters) ||
        !('selectedId' in value)
      )
        return undefined;
      if (
        value.selectedId !== null &&
        (typeof value.selectedId !== 'string' ||
          !/^[a-z][a-z0-9-]*:[1-9][0-9]*$/.test(value.selectedId))
      )
        return undefined;
      return { filters: value.filters, selectedId: value.selectedId as ToolId | null };
    },
  }),
  withReducer<CatalogState>(
    on(catalogPageEvents.opened, catalogPageEvents.retryRequested, () => ({ failure: null })),
    on(catalogPageEvents.filtersChanged, ({ payload }) =>
      isCatalogFilters(payload) ? { filters: payload, page: 0, selectedId: null } : {},
    ),
    on(catalogPageEvents.toolSelected, ({ payload }) => ({ selectedId: payload })),
    on(catalogPageEvents.pageChanged, ({ payload }) =>
      Number.isSafeInteger(payload) && payload >= 0 ? { page: payload } : {},
    ),
    on(catalogEvents.loadSuccess, ({ payload }) => ({ tools: payload, failure: null })),
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
