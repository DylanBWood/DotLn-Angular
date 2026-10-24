import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { NavigationIntent, RouteQueryParams } from '@dotln-angular/models';

export const navigationEvents = eventGroup({
  source: 'Navigation Router',
  events: {
    navigate: type<NavigationIntent>(),
    back: type<void>(),
    replaceQuery: type<RouteQueryParams>(),
  },
});
