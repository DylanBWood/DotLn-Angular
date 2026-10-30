import type { SceneFrame, Vec2 } from '@dotln-angular/scene-engine';

/** How the field sits in a drawing surface: one scale on both axes, centred. */
export interface FieldView {
  readonly scale: number;
  readonly left: number;
  readonly top: number;
}

export function fieldView(width: number, height: number, field: SceneFrame['field']): FieldView {
  // An unmeasured surface has no size yet; a scale of one keeps its coordinates finite.
  const scale = Math.min(width / field.width, height / field.height) || 1;
  return {
    scale,
    left: (width - field.width * scale) / 2,
    top: (height - field.height * scale) / 2,
  };
}

export const toScreen = (view: FieldView, point: Vec2): Vec2 => ({
  x: view.left + point.x * view.scale,
  y: view.top + point.y * view.scale,
});

export const toField = (view: FieldView, point: Vec2): Vec2 => ({
  x: (point.x - view.left) / view.scale,
  y: (point.y - view.top) / view.scale,
});

/** The unit nearest a field point within reach of a pointer, or null if none is. */
export function unitAt(frame: SceneFrame, point: Vec2, reach: number) {
  let nearest: string | null = null;
  let closest = reach;
  for (const unit of frame.units) {
    const gap = Math.hypot(unit.position.x - point.x, unit.position.y - point.y);
    if (gap <= closest) {
      closest = gap;
      nearest = unit.id;
    }
  }
  return nearest;
}
