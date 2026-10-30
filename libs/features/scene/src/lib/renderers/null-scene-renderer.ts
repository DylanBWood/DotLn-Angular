import type { SceneFrame, UnitId } from '@dotln-angular/scene-engine';

import type { SceneGhost, SceneRenderer } from './scene-renderer';

/** Draws nothing and remembers what it was given, so specs can run where no drawing exists. */
export class NullSceneRenderer implements SceneRenderer {
  draws = 0;
  disposed = false;
  size: { readonly width: number; readonly height: number } | null = null;
  last: {
    readonly frame: SceneFrame;
    readonly selection: readonly UnitId[];
    readonly ghost: SceneGhost | null;
  } | null = null;

  draw(frame: SceneFrame, selection: readonly UnitId[], ghost: SceneGhost | null = null) {
    this.draws += 1;
    this.last = { frame, selection, ghost };
  }

  resize(width: number, height: number) {
    this.size = { width, height };
  }

  dispose() {
    this.disposed = true;
  }
}
