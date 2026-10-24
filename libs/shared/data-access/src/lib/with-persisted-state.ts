import { inject } from '@angular/core';
import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { getState, patchState } from '@ngrx/signals';

import { StorageToken } from './storage-token';
import type { PersistedStateConfig, StorageFeatureInput, StorageStrategy } from './types';

export function withPersistedState<State extends object>(options: PersistedStateConfig<State>) {
  if (!/^[a-z][a-z0-9.-]*$/.test(options.key)) throw new Error('Invalid UI storage key.');

  const key = `dotln-angular.${options.key}`;
  const factory: StorageStrategy<State> = Object.assign(
    (_config: unknown, store: Parameters<StorageStrategy<State>>[1]) => {
      const storage = inject(StorageToken);

      return {
        clearStorage() {
          try {
            storage?.removeItem(key);
          } catch {
            /* Storage is optional. */
          }
        },

        readFromStorage() {
          try {
            const raw = storage?.getItem(key);
            const state = raw == null ? undefined : options.restore(JSON.parse(raw));
            if (state) patchState(store, state);
          } catch {
            /* Keep the in-memory defaults when reads or parsing fail. */
          }
        },

        writeToStorage() {
          try {
            storage?.setItem(key, JSON.stringify(options.select(getState(store))));
          } catch {
            /* Quota and privacy failures must not block in-memory state. */
          }
        },
      };
    },
    { type: 'sync' as const },
  );

  return withStorageSync<StorageFeatureInput<State>>({ key, select: options.select }, factory);
}
