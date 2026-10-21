import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dotln-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p translate="no">{{ message() }}</p>
    <ng-content select="[empty-action]" />
  `,
  styles: `
    :host {
      display: block;
      padding: var(--dotln-space-5);
      border: 1px dashed var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      color: var(--dotln-muted);
    }
    p {
      margin-block: 0 0.5rem;
    }
  `,
})
export class DotlnEmptyState {
  readonly message = input.required<string>();
}
