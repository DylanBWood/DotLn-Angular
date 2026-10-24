import {
  ErrorHandler,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';

import { appShellEvents } from '@dotln-angular/events';

import { DotlnErrorHandler } from './dotln-error-handler';
import { ErrorStore } from './error-store';
import { FeatureFlagStore } from './feature-flag-store';
import { NavigationStore } from './navigation-store';

export function provideDotlnState() {
  return makeEnvironmentProviders([
    provideDispatcher(),
    ErrorStore,
    FeatureFlagStore,
    NavigationStore,
    { provide: ErrorHandler, useClass: DotlnErrorHandler },
    provideEnvironmentInitializer(() => {
      inject(ErrorStore);
      inject(NavigationStore);
      inject(FeatureFlagStore);
      inject(Dispatcher).dispatch(appShellEvents.started());
    }),
  ]);
}
