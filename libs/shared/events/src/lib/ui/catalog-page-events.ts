import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { CatalogFilters, ToolId, WorkSlug } from '@dotln-angular/models';

export const catalogPageEvents = eventGroup({
  source: 'UI Catalog page',
  events: {
    opened: type<void>(),
    retryRequested: type<void>(),
    filtersChanged: type<CatalogFilters>(),
    workChosen: type<WorkSlug>(),
    chapterChosen: type<string>(),
    sectionChosen: type<string>(),
    conceptOpened: type<ToolId>(),
    relationFollowed: type<ToolId>(),
    readingReturned: type<void>(),
    searched: type<string>(),
    pageChanged: type<number>(),
  },
});
