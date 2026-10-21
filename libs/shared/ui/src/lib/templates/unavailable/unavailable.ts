import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import { DotlnBadge } from '../../fragments/badge/badge';

@Component({
  selector: 'dotln-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-badge status="unavailable" />
    <p class="framing">{{ 'ui.unavailableExplanation' | t }}</p>
    <p class="explanation" translate="no">{{ explanation() }}</p>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--dotln-space-4);
      border-inline-start: 3px solid var(--dotln-unavailable);
      background: var(--dotln-unavailable-bg);
      border-radius: var(--dotln-radius);
    }
    .framing {
      margin-block: 0.75rem 0.25rem;
      font-size: 0.8rem;
      color: var(--dotln-muted);
    }
    .explanation {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
  imports: [DotlnBadge, TPipe],
})
export class DotlnUnavailable {
  readonly explanation = input.required<string>();
}
