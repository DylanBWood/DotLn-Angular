import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #surface
      [attr.aria-label]="label()"
      (cancel)="dismiss($event)"
      (close)="open.set(false)"
      translate="no"
    >
      @if (open()) {
        <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          <ng-content />
          <div class="actions">
            <button type="button" (click)="open.set(false)">{{ 'ui.close' | t }}</button>
          </div>
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      border: 1px solid var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      padding: var(--dotln-space-6);
      color: var(--dotln-ink);
      background: var(--dotln-surface);
      max-inline-size: min(40rem, calc(100vw - 3rem));
    }
    dialog::backdrop {
      background: #10291fcc;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-block-start: 1.5rem;
    }
    button {
      font: inherit;
      border: 1px solid var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      padding: 0.7rem 1rem;
      color: var(--dotln-ink);
      background: var(--dotln-surface);
      cursor: pointer;
    }
    button:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 3px;
    }
  `,
  imports: [CdkTrapFocus, TPipe],
})
export class DotlnDialog {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  protected readonly surface = viewChild<ElementRef<HTMLDialogElement>>('surface');
  #returnFocus: HTMLElement | null = null;
  readonly label = input.required<string>();
  readonly open = model(false);

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.surface()?.nativeElement;
      if (!dialog) return;
      if (this.open() && !dialog.open) {
        this.#returnFocus =
          this.#document.activeElement instanceof HTMLElement ? this.#document.activeElement : null;
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
        this.#returnFocus?.focus();
        this.#returnFocus = null;
      }
    });
    this.#destroyRef.onDestroy(() => {
      if (this.open()) this.#returnFocus?.focus();
    });
  }

  dismiss(event: Event) {
    event.preventDefault();
    this.open.set(false);
  }
}
