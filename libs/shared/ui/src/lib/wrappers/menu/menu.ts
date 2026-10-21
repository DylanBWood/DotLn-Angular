import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';

import type { MenuOption } from '../../types';

@Component({
  selector: 'dotln-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      ngMenuTrigger
      #origin
      #trigger="ngMenuTrigger"
      [menu]="menu()"
      translate="no"
    >
      {{ label() }}
    </button>
    <ng-template
      [cdkConnectedOverlayOpen]="trigger.expanded()"
      [cdkConnectedOverlay]="{ origin, usePopover: 'inline' }"
      [cdkConnectedOverlayPositions]="positions"
      cdkAttachPopoverAsChild
    >
      <div
        ngMenu
        #menu="ngMenu"
        [softDisabled]="false"
        class="menu"
        (itemSelected)="choose($event)"
        [attr.aria-label]="label()"
        translate="no"
      >
        <ng-template ngMenuContent>
          @for (option of options(); track option.id) {
            <button
              type="button"
              ngMenuItem
              [value]="option.id"
              [disabled]="option.disabled ?? false"
            >
              {{ option.label }}
            </button>
          }
        </ng-template>
      </div>
    </ng-template>
  `,
  styles: `
    button {
      border: 1px solid var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      padding: 0.7rem 1rem;
      color: var(--dotln-ink);
      background: var(--dotln-surface);
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 2px;
    }
    .menu {
      display: grid;
      gap: 0.25rem;
      padding: 0.4rem;
      border: 1px solid var(--dotln-border-strong);
      border-radius: var(--dotln-radius);
      background: var(--dotln-surface);
      box-shadow: 0 0.5rem 1.5rem #182c2420;
    }
    .menu button {
      border: 0;
      text-align: start;
    }
    .menu button:focus,
    .menu button:hover {
      background: var(--dotln-surface-hover);
    }
    .menu button:disabled,
    .menu button[aria-disabled='true'] {
      color: var(--dotln-muted);
      opacity: 0.6;
      cursor: default;
    }
  `,
  imports: [Menu, MenuContent, MenuItem, MenuTrigger, OverlayModule],
})
export class DotlnMenu {
  readonly label = input.required<string>();
  readonly options = input.required<readonly MenuOption[]>();
  readonly selected = output<string>();
  readonly menu = viewChild<Menu<string>>('menu');
  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  ];

  choose(value: string | undefined) {
    if (value !== undefined) this.selected.emit(value);
  }
}
