import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="placeholder" role="status">{{ 'ui.loading' | t }}</span>
  `,
  styles: `
    :host {
      display: block;
    }
    .placeholder {
      display: block;
      padding: 1rem;
      border-radius: var(--dotln-radius);
      background: var(--dotln-surface-hover);
      color: var(--dotln-muted);
    }
  `,
  imports: [TPipe],
})
export class DotlnSkeleton {}
