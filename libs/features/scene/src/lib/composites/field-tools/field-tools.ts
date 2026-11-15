import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { FieldToolId, FieldView } from '../../models/scene-view-model';

/**
 * What a press on the field draws, a way to take everything off it, and the tile graph's cell
 * size, whose name the page projects as a link to the Tile graph's reading. Every edit these
 * make is also a row of the geometry list, which the keyboard reaches.
 */
@Component({
  selector: 'scene-field-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-tools.html',
  styleUrl: './field-tools.scss',
  imports: [TPipe],
})
export class FieldTools {
  readonly field = input.required<FieldView>();

  readonly toolChosen = output<FieldToolId>();
  readonly cleared = output<void>();
  readonly cellSizeChosen = output<number>();

  protected readonly tools: readonly FieldToolId[] = ['select', 'wall', 'obstacle'];

  chooseSize(event: Event) {
    this.cellSizeChosen.emit(Number((event.target as HTMLSelectElement).value));
  }
}
