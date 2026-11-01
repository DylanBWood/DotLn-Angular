import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const toolsHomeEvents = eventGroup({
  source: 'UI Tools home',
  events: {
    opened: type<void>(),
    retryRequested: type<void>(),
  },
});
