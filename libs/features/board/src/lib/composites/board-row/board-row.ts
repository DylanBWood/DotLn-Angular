import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Row } from '@dotln-angular/models';
import { DotlnKeyValueList } from '@dotln-angular/ui';

import type { CellTemplate, LinkTemplate } from '../../models/presentation';

@Component({
  selector: 'board-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article [id]="row().id" tabindex="-1">
      <h4 translate="no">{{ row().title }}</h4>
      <dotln-key-value-list
        [items]="row().cells"
        [scope]="row().id"
        [valueTemplate]="cellTemplate()"
      />
      @if (row().links.length) {
        <div class="links">
          @for (link of row().links; track $index) {
            <ng-container
              [ngTemplateOutlet]="linkTemplate()"
              [ngTemplateOutletContext]="{ $implicit: link }"
            />
          }
        </div>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    article {
      border: 1px solid var(--dotln-border);
      background: var(--dotln-surface);
      border-radius: var(--dotln-radius);
      padding: clamp(1rem, 2vw, 1.5rem);
    }
    article:focus {
      outline: var(--dotln-focus);
      outline-offset: 4px;
    }
    h4 {
      overflow-wrap: anywhere;
      font-size: 1.1rem;
      font-weight: 650;
      margin: 0 0 0.75rem;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-block-start: 1rem;
    }
  `,
  imports: [NgTemplateOutlet, DotlnKeyValueList],
})
export class BoardRow {
  readonly row = input.required<Row>();
  readonly cellTemplate = input.required<CellTemplate>();
  readonly linkTemplate = input.required<LinkTemplate>();
}
