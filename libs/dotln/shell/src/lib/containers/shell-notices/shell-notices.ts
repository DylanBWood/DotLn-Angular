import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import { DotlnToast } from '@dotln-angular/ui';

import { ShellFacade } from '../../facades/shell.facade';

@Component({
  selector: 'dotln-shell-notices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vm().latest; as error) {
      @if (error.source === 'http') {
        <dotln-toast [message]="'shell.requestFailed' | t: { kind: error.kind }" (dismissed)="facade.dismiss()" />
      } @else {
        <dotln-toast [message]="'shell.applicationFailed' | t" (dismissed)="facade.dismiss()" />
      }
    }
  `,
  styles: `
    :host { display: block; }
    :host:has(dotln-toast) { padding: 1rem clamp(1rem, 3vw, 3rem); }
  `,
  providers: [ShellFacade],
  imports: [TPipe, DotlnToast],
})
export class ShellNotices {
  readonly facade = inject(ShellFacade);
  readonly vm = this.facade.vm;
}
