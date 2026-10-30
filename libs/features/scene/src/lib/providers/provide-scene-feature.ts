import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

import { provideCatalog } from '@dotln-angular/catalog';
import { provideSceneDataAccess } from '@dotln-angular/scene-data-access';
import type { SceneDefinition } from '@dotln-angular/scene-engine';

import twenty from '../../testing/fixtures/scene-twenty.json';
import { animationFrameDriver, SceneClock, SceneClockDriverToken } from '../clock/scene-clock';
import { SceneFacade } from '../facades/scene.facade';
import {
  SceneDefinitionToken,
  SceneReducedMotionToken,
  SceneSeedSourceToken,
} from '../models/scene-tokens';
import {
  createCanvasRenderer,
  SceneRendererFactoryToken,
} from '../wrappers/scene-canvas/scene-renderer-factory';

export const sceneTwenty = twenty as SceneDefinition;

export function provideSceneFeature() {
  return [
    ...provideCatalog(),
    ...provideSceneDataAccess(),
    { provide: SceneDefinitionToken, useValue: sceneTwenty },
    { provide: SceneClockDriverToken, useFactory: animationFrameDriver },
    { provide: SceneRendererFactoryToken, useValue: createCanvasRenderer },
    {
      provide: SceneReducedMotionToken,
      useFactory: () =>
        inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
        false,
    },
    { provide: SceneSeedSourceToken, useValue: () => Math.floor(Math.random() * 2 ** 31) },
    SceneClock,
    SceneFacade,
  ];
}
