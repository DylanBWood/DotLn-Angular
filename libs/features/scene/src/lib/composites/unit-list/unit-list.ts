import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { UnitId, Vec2 } from '@dotln-angular/scene-engine';

import type { ObjectiveRegion, UnitRowView } from '../../models/scene-view-model';

/**
 * The text layer: every unit as a row with its state, the keyboard path through selection and
 * the accessibility surface of everything the field shows. Each checkbox is controlled: its
 * click is cancelled and the selection drives `checked`, so a toggle and a clear that land before
 * one render cannot leave the native box out of step with the units.
 */
@Component({
  selector: 'scene-unit-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-list.html',
  styleUrl: './unit-list.scss',
  imports: [TPipe],
})
export class UnitList {
  readonly rows = input.required<readonly UnitRowView[]>();
  readonly inFlight = input(0);
  readonly sparks = input(0);
  readonly marks = input(0);
  readonly open = input(false);
  readonly objective = input<string | null>(null);
  readonly regions = input<readonly ObjectiveRegion[]>([]);
  readonly toggled = output<UnitId>();
  readonly objectivePlaced = output<Vec2>();
}
