import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dotln-sub-app-menu-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>
      <ng-content select="[menu-heading]" />
    </h2>
    <ul>
      <ng-content select="[menu-item]">
        <li class="empty" translate="no">{{ emptyMessage() }}</li>
      </ng-content>
    </ul>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      max-inline-size: 100%;
      overflow-wrap: anywhere;
    }
    h2 {
      margin: 0 0 var(--dotln-space-2);
      color: var(--dotln-muted);
      font-size: 0.7rem;
      font-weight: 650;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dotln-space-2);
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .empty {
      color: var(--dotln-muted);
      font-size: 0.8rem;
      padding-block: 0.3rem;
    }
  `,
})
export class DotlnSubAppMenuGroup {
  readonly emptyMessage = input('');
}
