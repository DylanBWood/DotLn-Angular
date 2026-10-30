import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { UnitId, Vec2 } from '@dotln-angular/scene-engine';

import type { ObjectiveRegion, UnitRowView } from '../../models/scene-view-model';

/**
 * The text layer: every unit as a row with its state, the keyboard path through selection and
 * the accessibility surface of everything the field shows.
 */
@Component({
  selector: 'scene-unit-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details [open]="open()">
      <summary>{{ 'scene.units.title' | t: { count: rows().length } }}</summary>
      <ul>
        @for (row of rows(); track row.id) {
          <li [attr.data-unit-id]="row.id">
            <label>
              <input type="checkbox" [checked]="row.selected" (change)="toggled.emit(row.id)" />
              <span class="role" translate="no" [style.color]="row.colour">{{ row.label }}</span>
              <span class="detail">
                {{
                  'scene.units.detail'
                    | t: { position: row.position, speed: row.speed, activity: row.activity }
                }}
              </span>
              <span class="id" translate="no">{{ row.id }}</span>
            </label>
          </li>
        }
      </ul>
      <fieldset>
        <legend>
          @if (objective(); as place) {
            {{ 'scene.units.objectiveAt' | t: { place } }}
          } @else {
            {{ 'scene.units.noObjective' | t }}
          }
        </legend>
        @for (region of regions(); track region.id) {
          <button type="button" translate="no" (click)="objectivePlaced.emit(region.point)">
            {{ region.label }}
          </button>
        }
      </fieldset>
    </details>
  `,
  styleUrl: './unit-list.scss',
  imports: [TPipe],
})
export class UnitList {
  readonly rows = input.required<readonly UnitRowView[]>();
  readonly open = input(false);
  readonly objective = input<string | null>(null);
  readonly regions = input<readonly ObjectiveRegion[]>([]);
  readonly toggled = output<UnitId>();
  readonly objectivePlaced = output<Vec2>();
}
