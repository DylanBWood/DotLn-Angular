import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { FeatureFlags } from '@dotln-angular/models';

export const featureFlagEvents = eventGroup({
  source: 'App Feature flags',
  events: {
    overridden: type<{ readonly flag: keyof FeatureFlags; readonly enabled: boolean }>(),
  },
});
