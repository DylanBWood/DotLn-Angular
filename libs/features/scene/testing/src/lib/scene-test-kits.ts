import { provideRouter } from '@angular/router';

import { catalogFixture, provideCatalogTestKit } from '@dotln-angular/catalog/testing';
import type { BrowserStorage } from '@dotln-angular/data-access';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import type { Tool } from '@dotln-angular/models';
import { provideSceneStoreTestKit } from '@dotln-angular/scene-data-access/testing';
import type { SceneDefinition } from '@dotln-angular/scene-engine';

import {
  manualDriver,
  SceneClock,
  SceneClockDriverToken,
} from '../../../src/lib/clock/scene-clock';
import { SceneFacade } from '../../../src/lib/facades/scene.facade';
import {
  SceneDefinitionToken,
  SceneReducedMotionToken,
  SceneSeedSourceToken,
} from '../../../src/lib/models/scene-tokens';
import { sceneTwenty } from '../../../src/lib/providers/provide-scene-feature';
import { NullSceneRenderer } from '../../../src/lib/renderers/null-scene-renderer';
import { SceneRendererFactoryToken } from '../../../src/lib/wrappers/scene-canvas/scene-renderer-factory';
import en from './scene-en.json';

export function provideSceneDefinitionTokenTestKit(definition: SceneDefinition = sceneTwenty) {
  return {
    definition,
    providers: [{ provide: SceneDefinitionToken, useValue: definition }],
  };
}

/** Reduced motion by default, so nothing starts moving until a spec says so. */
export function provideSceneReducedMotionTokenTestKit(reduced = true) {
  return { providers: [{ provide: SceneReducedMotionToken, useValue: reduced }] };
}

export function provideSceneSeedSourceTokenTestKit(seed = 4242) {
  return { seed, providers: [{ provide: SceneSeedSourceToken, useValue: () => seed }] };
}

export function provideSceneClockDriverTokenTestKit() {
  const driver = manualDriver();
  return {
    ...driver,
    providers: [{ provide: SceneClockDriverToken, useValue: driver }],
  };
}

export function provideSceneClockTestKit() {
  const driver = provideSceneClockDriverTokenTestKit();
  return { ...driver, providers: [...driver.providers, SceneClock] };
}

export function provideSceneRendererFactoryTokenTestKit() {
  const renderer = new NullSceneRenderer();
  return {
    renderer,
    providers: [{ provide: SceneRendererFactoryToken, useValue: () => renderer }],
  };
}

export interface SceneFacadeKitOptions {
  readonly tools?: readonly Tool[];
  readonly reducedMotion?: boolean;
  readonly definition?: SceneDefinition;
  readonly storage?: BrowserStorage;
}

export function provideSceneFacadeTestKit(options: SceneFacadeKitOptions = {}) {
  const clock = provideSceneClockTestKit();
  const catalog = provideCatalogTestKit(options.tools ?? catalogFixture);
  const store = provideSceneStoreTestKit(options.storage);
  const renderer = provideSceneRendererFactoryTokenTestKit();
  return {
    clock,
    catalog,
    store,
    renderer,
    providers: [
      ...clock.providers,
      ...catalog.providers,
      ...store.providers,
      ...renderer.providers,
      ...provideSceneDefinitionTokenTestKit(options.definition).providers,
      ...provideSceneReducedMotionTokenTestKit(options.reducedMotion ?? true).providers,
      ...provideSceneSeedSourceTokenTestKit().providers,
      ...provideDotlnI18nTestKit({ langs: { en } }).providers,
      provideRouter([]),
      SceneFacade,
    ],
  };
}
