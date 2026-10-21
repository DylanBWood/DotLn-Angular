import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Cell, CellScalar } from '@dotln-angular/models';
import { DotlnBadge } from '@dotln-angular/ui';

@Component({
  selector: 'board-cell-value-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="value" translate="no">
      @switch (kind()) {
        @case ('null') {
          <span class="absent">{{ 'board.noValue' | t }}</span>
        }
        @case ('array') {
          <ul>
            @for (value of values(); track $index) {
              <li>{{ value }}</li>
            } @empty {
              <li>{{ 'board.emptyList' | t }}</li>
            }
          </ul>
        }
        @case ('boolean') {
          <span>{{ cell().value }}</span>
        }
        @case ('number') {
          <span class="number">{{ cell().value }}</span>
        }
        @case ('string') {
          <span>{{ cell().value }}</span>
        }
      }
    </div>
    <div class="status"><dotln-badge [status]="cell().status" /></div>
    @if (cell().explanation; as explanation) {
      <p class="explanation" translate="no">{{ explanation }}</p>
    }
    <div class="evidence"><ng-content /></div>
  `,
  styles: `
    :host {
      display: block;
    }
    .value {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.55;
    }
    .number {
      font-variant-numeric: tabular-nums;
    }
    ul {
      margin: 0;
      padding-inline-start: 1.1rem;
    }
    .absent {
      color: var(--dotln-muted);
    }
    .status {
      margin-block-start: 0.45rem;
    }
    .explanation {
      font-size: 0.75rem;
      color: var(--dotln-muted);
      line-height: 1.5;
      margin: 0.5rem 0;
    }
    .evidence {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }
  `,
  imports: [TPipe, DotlnBadge],
})
export class CellValueMapper {
  readonly cell = input.required<Cell>();
  readonly kind = computed(() => {
    const value = this.cell().value;
    return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  });
  readonly values = computed<readonly CellScalar[]>(() => {
    const value = this.cell().value;
    return Array.isArray(value) ? value : [];
  });
}
