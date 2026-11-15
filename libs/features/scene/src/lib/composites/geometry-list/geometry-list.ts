import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type {
  GeometryRowView,
  GeometryValue,
  GeometryValueView,
} from '../../models/scene-view-model';

/** An edit to one number of one shape. */
export interface ShapeEdit {
  readonly shape: number;
  readonly change: GeometryValue;
}

/**
 * The walls and obstacles on the field as rows the keyboard reaches: each number is a field that
 * replaces the shape when it is changed, each shape can be removed, and a wall or an obstacle can
 * be added at the field's centre without the pointer.
 */
@Component({
  selector: 'scene-geometry-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geometry-list.html',
  styleUrl: './geometry-list.scss',
  imports: [TPipe],
})
export class GeometryList {
  readonly shapes = input.required<readonly GeometryRowView[]>();
  readonly open = input(false);

  readonly edited = output<ShapeEdit>();
  readonly removed = output<number>();
  readonly wallAdded = output<void>();
  readonly obstacleAdded = output<void>();

  /** Sends a changed number on, or puts back the shape's own when the engine cannot take it. */
  edit(shape: number, entry: GeometryValueView, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' ? Number.NaN : Number(input.value);
    if (Number.isFinite(value) && (entry.min === null || value >= entry.min))
      this.edited.emit({ shape, change: { name: entry.name, value } });
    else input.value = String(entry.value);
  }
}
