import type { Provider } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

import { provideCatalog } from '@dotln-angular/catalog';

import { provideSceneFacadeTestKit } from '../../../../testing/src';
import { SceneReducedMotionToken } from '../../models/scene-tokens';
import {
  createCanvasRenderer,
  SceneRendererFactoryToken,
} from '../../wrappers/scene-canvas/scene-renderer-factory';
import { ScenePage } from './scene-page';

// The bundled catalog and the real painter, over the kit's still clock and fake storage.
const providers = (...extra: readonly Provider[]) => [
  ...provideSceneFacadeTestKit().providers,
  ...provideCatalog(),
  { provide: SceneRendererFactoryToken, useValue: createCanvasRenderer },
  ...extra,
];

const meta: Meta<ScenePage> = {
  title: 'Scene/page',
  component: ScenePage,
  decorators: [applicationConfig({ providers: providers() })],
  parameters: { layout: 'fullscreen' },
};
export default meta;
export const Twenty: StoryObj<ScenePage> = {};
export const ReducedMotion: StoryObj<ScenePage> = {
  decorators: [
    applicationConfig({
      providers: providers({ provide: SceneReducedMotionToken, useValue: true }),
    }),
  ],
};
export const ChromeColumn: StoryObj<ScenePage> = {};
