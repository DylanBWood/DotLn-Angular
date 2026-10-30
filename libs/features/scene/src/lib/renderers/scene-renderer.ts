import type { PreviewArrow, SceneFrame, UnitFrame, UnitId } from '@dotln-angular/scene-engine';

/** What is drawn faintly over a frame: a preview's arrows and a compared branch's units. */
export interface SceneGhost {
  readonly arrows: readonly PreviewArrow[];
  readonly units: readonly UnitFrame[];
}

/** How a painter shows one unit: the label a person reads and the role its colour comes from. */
export interface SceneUnitStyle {
  readonly id: UnitId;
  readonly label: string;
  readonly role: string;
}

/** What every painter is made with, beside the surface it paints on. */
export interface SceneRendererOptions {
  /** The label and role of each unit, read at draw time so a label switch shows at once. */
  readonly styles: () => readonly SceneUnitStyle[];
  /** Whether motion effects draw: trails and ripples. Reduced motion turns them off. */
  readonly motion: () => boolean;
}

/**
 * The seam between the engine and whatever shows it. The engine emits a frame; a renderer shows
 * it. A later painter implements this same interface without the engine or the feature changing.
 */
export interface SceneRenderer {
  draw(frame: SceneFrame, selection: readonly UnitId[], ghost?: SceneGhost | null): void;
  resize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}
