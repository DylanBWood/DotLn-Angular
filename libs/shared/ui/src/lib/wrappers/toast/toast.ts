import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p translate="no">{{ message() }}</p>
    <button type="button" (click)="dismissed.emit()">{{ 'ui.dismiss' | t }}</button>
  `,
  styles: `
    :host { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border: 1px solid var(--dotln-border-strong); background: var(--dotln-surface); color: var(--dotln-ink); border-radius: var(--dotln-radius); }
    p { margin: 0; }
    button { color: var(--dotln-accent); background: none; border: 0; cursor: pointer; }
    button:focus-visible { outline: var(--dotln-focus); }
  `,
  imports: [TPipe],
})
export class DotlnToast {
  readonly message = input.required<string>();
  readonly dismissed = output<void>();
  readonly #announcer = inject(LiveAnnouncer);

  constructor() {
    effect(() => {
      void this.#announcer.announce(this.message(), 'assertive');
    });
  }
}
