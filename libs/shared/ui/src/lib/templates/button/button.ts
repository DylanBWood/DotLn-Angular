import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { ButtonLoadingVariant } from '../../types';

@Component({
  selector: 'dotln-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled() || loading()" [attr.aria-busy]="loading()">
      <span class="label"><ng-content /></span>
      @if (loading()) {
        <span class="loading" role="status">{{ 'ui.loading' | t }}</span>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      min-block-size: 2.75rem;
      border: 1px solid var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      padding: 0.65rem 1rem;
      color: var(--dotln-ink);
      background: var(--dotln-surface);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 120ms ease;
    }
    button:hover:not(:disabled) {
      background: var(--dotln-surface-hover);
    }
    button:disabled {
      cursor: default;
    }
    button:disabled:not([aria-busy='true']) {
      color: var(--dotln-muted);
      background: var(--dotln-canvas);
      border-color: var(--dotln-border);
    }
    button:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 3px;
    }
    :host([data-loading='replace']) .label,
    :host([data-loading='overlay']) .label {
      visibility: hidden;
    }
    :host([data-loading='replace']) .loading,
    :host([data-loading='overlay']) .loading {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
    }
    :host([data-loading='overlay']) .loading {
      border-radius: inherit;
      background: var(--dotln-surface-hover);
    }
    :host([data-size='small']) button {
      min-block-size: 2rem;
      padding: 0.25rem 0.65rem;
      font-size: 0.8rem;
    }
    :host([data-tone='primary']) button:not(:disabled) {
      border-color: var(--dotln-accent);
      color: var(--dotln-canvas);
      background: var(--dotln-accent);
    }
    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `,
  host: {
    '[attr.data-loading]': 'loading() ? loadingVariant() : null',
    '[attr.data-size]': "size() === 'regular' ? null : size()",
    '[attr.data-tone]': "tone() === 'plain' ? null : tone()",
    '(click)': 'activate($event)',
  },
  imports: [TPipe],
})
export class DotlnButton {
  readonly loading = input(false);
  readonly loadingVariant = input<ButtonLoadingVariant>('trailing');
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly size = input<'regular' | 'small'>('regular');
  readonly tone = input<'plain' | 'primary'>('plain');
  readonly pressed = output<MouseEvent>();

  activate(event: MouseEvent) {
    if (!this.loading() && !this.disabled()) this.pressed.emit(event);
  }
}
