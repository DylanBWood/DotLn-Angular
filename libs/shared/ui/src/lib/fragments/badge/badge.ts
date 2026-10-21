import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { CellStatus } from '@dotln-angular/models';

@Component({
  selector: 'dotln-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('known') {
        <span>{{ 'ui.status.known' | t }}</span>
      }
      @case ('unknown') {
        <span>{{ 'ui.status.unknown' | t }}</span>
      }
      @case ('unavailable') {
        <span>{{ 'ui.status.unavailable' | t }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      border: 1px solid currentColor;
      border-radius: 999px;
      padding: 0.15rem 0.55rem;
      font-size: 0.72rem;
      font-weight: 650;
      line-height: 1.5;
      white-space: nowrap;
    }
    :host([data-status='known']) {
      color: var(--dotln-known);
      background: var(--dotln-known-bg);
    }
    :host([data-status='unknown']) {
      color: var(--dotln-unknown);
      background: var(--dotln-unknown-bg);
    }
    :host([data-status='unavailable']) {
      color: var(--dotln-unavailable);
      background: var(--dotln-unavailable-bg);
    }
  `,
  host: { '[attr.data-status]': 'status()' },
  imports: [TPipe],
})
export class DotlnBadge {
  readonly status = input.required<CellStatus>();
}
