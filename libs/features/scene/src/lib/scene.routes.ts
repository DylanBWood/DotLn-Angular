import type { Routes } from '@angular/router';

import { ScenePage } from './containers/scene-page/scene-page';
import { provideSceneFeature } from './providers/provide-scene-feature';

export const sceneRoutes: Routes = [
  { path: '', component: ScenePage, providers: [provideSceneFeature()] },
];
