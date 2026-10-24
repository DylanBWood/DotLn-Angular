import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { PanelId } from '@dotln-angular/models';

export const boardPageEvents = eventGroup({
  source: 'UI Board page',
  events: {
    opened: type<void>(),
    refreshRequested: type<void>(),
    panelSelected: type<PanelId>(),
  },
});
