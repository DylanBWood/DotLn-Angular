import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { AppError, Tool } from '@dotln-angular/models';

export const catalogEvents = eventGroup({
  source: 'Data-access Catalog',
  events: {
    load: type<void>(),
    loadSuccess: type<readonly Tool[]>(),
    loadFailure: type<AppError>(),
  },
});
