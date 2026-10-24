import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { AppError } from '@dotln-angular/models';

export const errorEvents = eventGroup({
  source: 'App Errors',
  events: {
    httpFailed: type<AppError>(),
    unhandled: type<AppError>(),
  },
});
