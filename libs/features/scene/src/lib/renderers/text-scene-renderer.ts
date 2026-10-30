import type { SceneFrame, UnitId } from '@dotln-angular/scene-engine';

import { mapFrameToRows } from '../mappers/frame-mapper';
import type { UnitRow } from '../models/scene-view-model';
import type { SceneRenderer } from './scene-renderer';

/**
 * Renders a frame as text rows: the accessibility surface, and what specs, stories and axe read.
 * It holds plain rows rather than a signal, so the facade can publish a frame in one signal write.
 */
export class TextSceneRenderer implements SceneRenderer {
  rows: readonly UnitRow[] = [];

  draw(frame: SceneFrame, selection: readonly UnitId[]) {
    this.rows = mapFrameToRows(frame, selection);
  }

  resize() {
    // Text reflows on its own.
  }

  dispose() {
    this.rows = [];
  }
}
