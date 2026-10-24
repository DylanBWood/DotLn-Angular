import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const appShellEvents = eventGroup({
  source: 'App Shell',
  events: {
    started: type<void>(),
    noticeDismissed: type<string>(),
  },
});
