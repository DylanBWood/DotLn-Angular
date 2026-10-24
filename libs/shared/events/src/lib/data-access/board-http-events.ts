import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { AppError, BoardResponse } from '@dotln-angular/models';

export const boardHttpEvents = eventGroup({
  source: 'Data-access Board HTTP',
  events: {
    load: type<void>(),
    loadSuccess: type<BoardResponse>(),
    loadFailure: type<AppError>(),
  },
});
