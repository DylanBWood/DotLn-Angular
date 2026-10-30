import type { SceneFrame, UnitFrame, UnitId, Vec2 } from '@dotln-angular/scene-engine';
import { length, stillSpeed } from '@dotln-angular/scene-engine';

import type { PositionBucket, SpeedBucket, UnitRow, UnitRowView } from '../models/scene-view-model';
import type { SceneUnitStyle } from '../renderers/scene-renderer';

const walkingSpeed = 5;

const columns = ['west', 'centre', 'east'] as const;
const rows = ['north', 'centre', 'south'] as const;

function third(value: number, extent: number) {
  return Math.min(2, Math.floor((value / extent) * 3));
}

export function positionBucket(position: Vec2, field: SceneFrame['field']): PositionBucket {
  const column = columns[third(position.x, field.width)];
  const row = rows[third(position.y, field.height)];
  if (row === 'centre') return column;
  if (column === 'centre') return row;
  return `${row}-${column}`;
}

/** The centre of each ninth of the field, in reading order, for choosing a place by name. */
export function fieldRegions(field: SceneFrame['field']) {
  return rows.flatMap((_, row) =>
    columns.map((_, column) => {
      const point = {
        x: ((column + 0.5) / columns.length) * field.width,
        y: ((row + 0.5) / rows.length) * field.height,
      };
      return { bucket: positionBucket(point, field), point };
    }),
  );
}

export function speedBucket(unit: UnitFrame): SpeedBucket {
  const speed = length(unit.velocity);
  if (speed < stillSpeed) return 'still';
  return speed < walkingSpeed ? 'walking' : 'running';
}

export function mapFrameToRows(
  frame: SceneFrame,
  selection: readonly UnitId[],
): readonly UnitRow[] {
  const selected = new Set(selection);
  return frame.units.map((unit) => ({
    id: unit.id,
    position: positionBucket(unit.position, frame.field),
    speed: speedBucket(unit),
    activity: unit.activity,
    selected: selected.has(unit.id),
  }));
}

export interface RowWords {
  readonly position: (bucket: PositionBucket) => string;
  readonly speed: (bucket: SpeedBucket) => string;
  readonly activity: (activity: UnitRow['activity']) => string;
}

/** Each unit's label, colour and readings, as the text layer shows them. */
export function mapRowViews(
  rows: readonly UnitRow[],
  styles: readonly SceneUnitStyle[],
  words: RowWords,
): readonly UnitRowView[] {
  const byId = new Map(styles.map((style) => [style.id, style]));
  return rows.map((row) => ({
    id: row.id,
    label: byId.get(row.id)?.label ?? row.id,
    colour: `var(--dotln-role-${byId.get(row.id)?.role ?? 'executor'})`,
    position: words.position(row.position),
    speed: words.speed(row.speed),
    activity: words.activity(row.activity),
    selected: row.selected,
  }));
}
