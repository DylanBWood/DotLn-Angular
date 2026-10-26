import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { CatalogFilters, ToolId } from '@dotln-angular/models';

export const catalogPageEvents = eventGroup({
  source: 'UI Catalog page',
  events: {
    opened: type<void>(),
    retryRequested: type<void>(),
    filtersChanged: type<CatalogFilters>(),
    toolSelected: type<ToolId>(),
    pageChanged: type<number>(),
  },
});
