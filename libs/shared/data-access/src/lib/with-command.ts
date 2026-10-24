import { inject, Injector, runInInjectionContext } from '@angular/core';
import { setError, setLoaded, setLoading } from '@angular-architects/ngrx-toolkit';
import { signalStoreFeature, type } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { catchError, defer, map, of, switchMap } from 'rxjs';

import { toAppError } from './app-error';
import type { CommandCallState, CommandConfig } from './types';

export function withCommand<Payload, Result>(config: CommandConfig<Payload, Result>) {
  return signalStoreFeature(
    { state: type<CommandCallState>() },
    withReducer(
      on(config.trigger, () => setLoading()),
      on(config.success, () => setLoaded()),
      on(config.failure, ({ payload }) => setError(payload.message)),
    ),
    withEventHandlers((_store, events = inject(Events), injector = inject(Injector)) => ({
      command: events.on(config.trigger).pipe(
        switchMap(({ payload }) =>
          defer(() => runInInjectionContext(injector, () => config.call(payload))).pipe(
            map((result) => config.success(result)),
            catchError((error) => of(config.failure(toAppError(error)))),
          ),
        ),
      ),
    })),
  );
}
