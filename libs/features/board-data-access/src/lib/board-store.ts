import { inject } from '@angular/core';
import { emptyFeature, withConditional, withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { map } from 'rxjs';

import { EnvironmentConfigToken } from '@dotln-angular/core';
import { withCallState, withCommand, withPersistedState } from '@dotln-angular/data-access';
import { boardHttpEvents, boardPageEvents } from '@dotln-angular/events';
import type { AppError, BoardResponse, PanelId } from '@dotln-angular/models';
import { isPanelId } from '@dotln-angular/models';

import { BoardApi } from './board-api';

interface BoardState {
  readonly document: BoardResponse | null;
  readonly selectedPanel: PanelId;
  readonly failure: AppError | null;
}

export const BoardStore = signalStore(
  withState<BoardState>({
    document: null as BoardResponse | null,
    selectedPanel: 'actors' as PanelId,
    failure: null as AppError | null,
  }),
  withCallState(),
  withPersistedState<{ selectedPanel: PanelId }>({
    key: 'board',
    select: (state) => ({ selectedPanel: state.selectedPanel }),
    restore: (value) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('selectedPanel' in value) ||
        !isPanelId(value.selectedPanel)
      )
        return undefined;

      return { selectedPanel: value.selectedPanel };
    },
  }),
  withReducer<BoardState>(
    on(boardPageEvents.opened, boardPageEvents.refreshRequested, () => ({ failure: null })),
    on(boardPageEvents.panelSelected, ({ payload }) =>
      isPanelId(payload) ? { selectedPanel: payload } : {},
    ),
    on(boardHttpEvents.loadSuccess, ({ payload }) => ({ document: payload, failure: null })),
    on(boardHttpEvents.loadFailure, ({ payload }) => ({ document: null, failure: payload })),
  ),
  withCommand({
    trigger: boardHttpEvents.load,
    success: boardHttpEvents.loadSuccess,
    failure: boardHttpEvents.loadFailure,
    call: () => inject(BoardApi).load(),
  }),
  withEventHandlers((_store, events = inject(Events)) => ({
    load: events
      .on(boardPageEvents.opened, boardPageEvents.refreshRequested)
      .pipe(map(() => boardHttpEvents.load())),
  })),
  withConditional(
    () => !inject(EnvironmentConfigToken).production,
    withDevtools('Board'),
    emptyFeature,
  ),
);

export function provideBoardDataAccess() {
  return [BoardApi, BoardStore];
}
