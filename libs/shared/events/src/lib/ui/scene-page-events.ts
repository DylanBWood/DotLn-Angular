import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

import type { Composition, CompositionStep, Trial } from '@dotln-angular/scene-engine';

export const scenePageEvents = eventGroup({
  source: 'UI Scene page',
  events: {
    stepApplied: type<CompositionStep>(),
    branchForked: type<void>(),
    trialCompared: type<Trial>(),
    trialKept: type<void>(),
    trialClosed: type<void>(),
    noteChanged: type<string>(),
    compositionSaved: type<Composition>(),
    compositionOpened: type<Composition>(),
    runReset: type<void>(),
  },
});
