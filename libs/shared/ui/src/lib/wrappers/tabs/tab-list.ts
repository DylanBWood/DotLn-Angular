import { Tab, TabList } from '@angular/aria/tabs';
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import type { TabItem } from '../../types';

@Component({
  selector: 'dotln-tab-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      ngTabList
      [selectedTab]="selected()"
      (selectedTabChange)="selected.set($event)"
      selectionMode="follow"
      focusMode="roving"
      [attr.aria-label]="label()"
      translate="no"
    >
      @for (item of items(); track item.id) {
        <button type="button" ngTab [value]="item.id" [disabled]="item.disabled ?? false">
          {{ item.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    [ngTabList] {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      border-block-end: 1px solid var(--dotln-border-strong);
    }
    button {
      border: 0;
      border-block-end: 3px solid transparent;
      background: transparent;
      color: var(--dotln-muted);
      padding: 1rem 1.2rem;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 120ms ease;
    }
    button:hover {
      background: var(--dotln-surface-hover);
    }
    button[aria-selected='true'] {
      border-block-end-color: var(--dotln-accent);
      color: var(--dotln-accent);
    }
    button:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: -4px;
      border-radius: 0.3rem;
    }
    button:disabled,
    button[aria-disabled='true'] {
      opacity: 0.6;
      cursor: default;
    }
    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `,
  imports: [TabList, Tab],
})
export class DotlnTabList {
  readonly items = input.required<readonly TabItem[]>();
  readonly label = input.required<string>();
  readonly selected = model<string>();
}
