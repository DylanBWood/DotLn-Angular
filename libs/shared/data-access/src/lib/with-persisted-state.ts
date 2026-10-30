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
      let written = options.writeOn?.(getState(store) as State);
      let merging = false;

      // State that comes from storage, or reports on it, is no reason to write to it.
      const merge = (state: Partial<State>) => {
        merging = true;
        try {
          patchState(store, state);
        } finally {
          merging = false;
        }
        written = options.writeOn?.(getState(store) as State);
      };

      return {
        clearStorage() {
          try {
            storage?.removeItem(key);
          } catch {
            /* Storage is optional. */
          }
        },

        readFromStorage() {
          let raw: string | null | undefined;
          try {
            raw = storage?.getItem(key);
          } catch {
            /* Storage is optional: a failed read is an empty one. */
          }
          if (raw == null) return;

          let state: Partial<State> | undefined;
          try {
            state = options.restore(JSON.parse(raw));
          } catch {
            /* Keep the in-memory defaults when parsing fails. */
          }
          const applied = state ?? options.unreadable?.();
          if (applied) merge(applied);
        },

        writeToStorage() {
          if (merging) return;
          const state = getState(store) as State;
          const version = options.writeOn?.(state);
          if (options.writeOn && version === written) return;
          written = version;
          try {
            storage?.setItem(key, JSON.stringify(options.select(state)));
          } catch {
            /* Quota and privacy failures must not block in-memory state. */
            const applied = options.unwritable?.();
            if (applied) merge(applied);
          }
        },
      };
    },
    { type: 'sync' as const },
  );

  return withStorageSync<StorageFeatureInput<State>>({ key, select: options.select }, factory);
}
