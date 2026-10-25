import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-sub-app-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="'shell.navigation' | t">
      <ng-content />
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
      inline-size: 100%;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dotln-space-4) var(--dotln-space-5);
      align-items: start;
    }
  `,
  imports: [TPipe],
})
export class DotlnSubAppMenu {}
