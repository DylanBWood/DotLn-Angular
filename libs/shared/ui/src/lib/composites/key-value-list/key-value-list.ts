import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

import type { KeyValueContext, KeyValueItem } from '../../types';

@Component({
  selector: 'dotln-key-value-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl>
      @for (item of items(); track item.key) {
        <div class="entry" [attr.data-cell-key]="item.key" [id]="scope() + ':' + item.key">
          <dt translate="no">{{ item.label }}</dt>
          <dd>
            <ng-container
              [ngTemplateOutlet]="valueTemplate()"
              [ngTemplateOutletContext]="{ $implicit: item, scope: scope() }"
            />
          </dd>
        </div>
      }
    </dl>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    dl {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 23rem), 1fr));
      gap: 0 var(--dotln-space-5);
    }
    .entry {
      padding-block: 0.9rem;
      border-block-end: 1px solid var(--dotln-border);
      min-inline-size: 0;
    }
    dt {
      font-size: 0.75rem;
      font-weight: 650;
      color: var(--dotln-muted);
      margin-block-end: 0.4rem;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
      font-size: 0.88rem;
    }
  `,
  imports: [NgTemplateOutlet],
})
export class DotlnKeyValueList<T extends KeyValueItem> {
  readonly items = input.required<readonly T[]>();
  readonly valueTemplate = input.required<TemplateRef<KeyValueContext<T>>>();
  readonly scope = input.required<string>();
}
