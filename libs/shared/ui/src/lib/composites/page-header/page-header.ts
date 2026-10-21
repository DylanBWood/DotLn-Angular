import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DotlnBadge } from '../../fragments/badge/badge';
import type { PageHeaderStatus } from '../../types';

@Component({
  selector: 'dotln-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="heading">
      <p class="eyebrow" translate="no">{{ eyebrow() }}</p>
      <h1 translate="no">{{ heading() }}</h1>
      <p class="description" translate="no">{{ description() }}</p>
      @if (status(); as current) {
        <div class="status">
          <dotln-badge [status]="current.state" /><span translate="no">{{ current.label }}</span>
        </div>
      }
    </div>
    <div class="actions"><ng-content select="[header-actions]" /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--dotln-space-4);
    }
    .eyebrow {
      margin: 0 0 0.6rem;
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--dotln-accent);
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 3vw, 3.5rem);
      line-height: 1.1;
      letter-spacing: -0.045em;
      font-weight: 650;
    }
    .description {
      color: var(--dotln-muted);
      margin-block: 1rem;
    }
    .status,
    .actions {
      display: flex;
      gap: 0.6rem;
      align-items: center;
      flex-wrap: wrap;
      font-size: 0.8rem;
    }
  `,
  imports: [DotlnBadge],
})
export class DotlnPageHeader {
  readonly eyebrow = input('');
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly status = input<PageHeaderStatus>();
}
