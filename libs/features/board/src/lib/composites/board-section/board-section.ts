import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Section } from '@dotln-angular/models';
import { DotlnBadge, DotlnEmptyState, DotlnUnavailable } from '@dotln-angular/ui';

import type { CellTemplate, LinkTemplate } from '../../models/presentation';
import { BoardRow } from '../board-row/board-row';

@Component({
  selector: 'board-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [id]="section().id" [attr.aria-labelledby]="section().id + '-title'" tabindex="-1">
      <div class="section-heading">
        <h3 [id]="section().id + '-title'" translate="no">{{ section().title }}</h3>
        @if (section().status === 'available') {
          <dotln-badge status="known" />
        }
      </div>
      @if (section().status === 'unavailable') {
        <dotln-unavailable [explanation]="section().explanation ?? ('board.noExplanation' | t)" />
      } @else {
        @if (section().explanation; as explanation) {
          <p translate="no">{{ explanation }}</p>
        }
      }
      @if (section().rows.length || section().status === 'available') {
        <div class="rows">
          @for (row of section().rows; track row.id) {
            <board-row
              [row]="row"
              [cellTemplate]="cellTemplate()"
              [linkTemplate]="linkTemplate()"
            />
          } @empty {
            <dotln-empty-state [message]="'board.noRows' | t" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    section:focus {
      outline: var(--dotln-focus);
      outline-offset: 6px;
    }
    .section-heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-block-end: 0.8rem;
    }
    h3 {
      overflow-wrap: anywhere;
      font-size: 0.95rem;
      font-weight: 650;
      margin: 0;
    }
    .rows {
      display: grid;
      gap: 1rem;
    }
    dotln-unavailable + .rows {
      margin-block-start: 1rem;
    }
  `,
  imports: [TPipe, DotlnBadge, DotlnEmptyState, DotlnUnavailable, BoardRow],
})
export class BoardSection {
  readonly section = input.required<Section>();
  readonly cellTemplate = input.required<CellTemplate>();
  readonly linkTemplate = input.required<LinkTemplate>();
}
