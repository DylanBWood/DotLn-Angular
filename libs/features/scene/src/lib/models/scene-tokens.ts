import { InjectionToken } from '@angular/core';

import type { SceneDefinition } from '@dotln-angular/scene-engine';

export const SceneDefinitionToken = new InjectionToken<SceneDefinition>(
  'dotln-angular.features.scene.definition',
);

/** Whether the viewer asked for reduced motion: then nothing starts moving on its own. */
export const SceneReducedMotionToken = new InjectionToken<boolean>(
  'dotln-angular.features.scene.reduced-motion',
);

/** Where the feel toggle's fresh seeds come from. */
export const SceneSeedSourceToken = new InjectionToken<() => number>(
  'dotln-angular.features.scene.seed-source',
);
