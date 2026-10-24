import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';

import { appShellEvents, errorEvents } from '@dotln-angular/events';

import type { ErrorNotice } from './types';

export const ErrorStore = signalStore(
  withState({ errors: [] as readonly ErrorNotice[] }),
  withReducer(
    on(errorEvents.httpFailed, errorEvents.unhandled, ({ payload, type }, state) => {
      const notice: ErrorNotice = {
        ...payload,
        source: type === errorEvents.httpFailed.type ? 'http' : 'application',
      };

      return {
        errors: [
          ...state.errors.filter((error) => error.correlationId !== payload.correlationId),
          notice,
        ].slice(-20),
      };
    }),
    on(appShellEvents.noticeDismissed, ({ payload }, state) => ({
      errors: state.errors.filter((error) => error.correlationId !== payload),
    })),
  ),
  withComputed(({ errors }) => ({
    latest: computed(() => errors().at(-1) ?? null),
    count: computed(() => errors().length),
  })),
  withMethods((store) => ({
    dismiss(id: string) {
      patchState(store, (state) => ({
        errors: state.errors.filter((error) => error.correlationId !== id),
      }));
    },
  })),
);
