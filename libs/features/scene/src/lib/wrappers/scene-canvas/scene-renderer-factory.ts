import { InjectionToken } from '@angular/core';

import { NullSceneRenderer } from '../../renderers/null-scene-renderer';
import type { SceneRenderer, SceneRendererOptions } from '../../renderers/scene-renderer';
import { CanvasSceneRenderer } from './canvas-scene-renderer';

export type SceneRendererFactory = (
  canvas: HTMLCanvasElement,
  options: SceneRendererOptions,
) => SceneRenderer;

export const SceneRendererFactoryToken = new InjectionToken<SceneRendererFactory>(
  'dotln-angular.features.scene.renderer-factory',
);

/** The 2D painter, or the null renderer where the browser gives no drawing context. */
export const createCanvasRenderer: SceneRendererFactory = (canvas, options) => {
  const context = canvas.getContext('2d');
  return context ? new CanvasSceneRenderer(canvas, context, options) : new NullSceneRenderer();
};
