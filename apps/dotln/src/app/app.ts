import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { DotlnAppLayout, ShellNotices } from '@dotln-angular/dotln/shell';
import { TPipe } from '@dotln-angular/i18n';

@Component({
  selector: 'dotln-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-app-layout>
      <div header class="brand">
        <span class="brand-mark" aria-hidden="true"></span>{{ 'shell.brand' | t }}
      </div>
      <span header class="edition">{{ 'shell.edition' | t }}</span>
      <a nav [routerLink]="board.commands" routerLinkActive="active" ariaCurrentWhenActive="page">{{
        'shell.board' | t
      }}</a>
      <dotln-shell-notices notices />
      <router-outlet main />
      <span footer>{{ 'shell.footer' | t }}</span>
      <span footer>{{ 'shell.recordedOn' | t }}</span>
    </dotln-app-layout>
  `,
  styleUrl: './app.scss',
  imports: [DotlnAppLayout, ShellNotices, TPipe, RouterLink, RouterLinkActive, RouterOutlet],
})
export class App {
  readonly board = buildRoute(BasePaths.Board);
}
