import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { signalStore, withHooks, withState } from '@ngrx/signals';
import { Dispatcher, on, withReducer } from '@ngrx/signals/events';

import { EnvironmentConfigToken } from '@dotln-angular/core';
import { featureFlagEvents } from '@dotln-angular/events';

export const FeatureFlagStore = signalStore(
  withState(() => ({ flags: inject(EnvironmentConfigToken).featureFlags })),
  withReducer(
    on(featureFlagEvents.overridden, ({ payload }, state) => ({
      flags: { ...state.flags, [payload.flag]: payload.enabled },
    })),
  ),
  withHooks({
    onInit(
      _store,
      config = inject(EnvironmentConfigToken),
      document = inject(DOCUMENT),
      dispatcher = inject(Dispatcher),
    ) {
      if (!config.featureFlagOverrides) return;

      const query = new URL(document.URL).searchParams;
      for (const value of query.getAll('ff').flatMap((value) => value.split(','))) {
        const [flag, setting] = value.split(':');
        if (flag === 'sourcesFooter' && (setting === 'on' || setting === 'off')) {
          dispatcher.dispatch(featureFlagEvents.overridden({ flag, enabled: setting === 'on' }));
        }
      }
    },
  }),
);
