import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { concatMap, from, ignoreElements, tap } from 'rxjs';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { navigationEvents } from '@dotln-angular/events';

export const NavigationStore = signalStore(
  withEventHandlers(
    (_store, events = inject(Events), router = inject(Router), location = inject(Location)) => ({
      navigate: events.on(navigationEvents.navigate).pipe(
        concatMap(({ payload }) => {
          const route = buildRoute(BasePaths.Board, { query: payload.query });

          return from(
            router.navigate(route.commands, {
              queryParams: route.queryParams,
              queryParamsHandling: payload.queryParamsHandling ?? 'replace',
              fragment: payload.fragment,
            }),
          ).pipe(ignoreElements());
        }),
      ),
      back: events.on(navigationEvents.back).pipe(
        tap(() => location.back()),
        ignoreElements(),
      ),
      replaceQuery: events.on(navigationEvents.replaceQuery).pipe(
        concatMap(({ payload }) =>
          from(
            router.navigate([], {
              queryParams: payload,
              queryParamsHandling: 'replace',
              replaceUrl: true,
            }),
          ).pipe(ignoreElements()),
        ),
      ),
    }),
  ),
);
