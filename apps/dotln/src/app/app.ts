import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import {
  DotlnAppLayout,
  DotlnSubAppMenu,
  DotlnSubAppMenuGroup,
  ShellNotices,
} from '@dotln-angular/dotln/shell';
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
      <dotln-sub-app-menu nav>
        <dotln-sub-app-menu-group>
          <span menu-heading>{{ 'shell.menu.scene' | t }}</span>
          <li menu-item>
            <a [routerLink]="scene.commands" routerLinkActive="active" ariaCurrentWhenActive="page">
              {{ 'shell.menu.scene' | t }}
            </a>
          </li>
        </dotln-sub-app-menu-group>
        <dotln-sub-app-menu-group>
          <span menu-heading>{{ 'shell.menu.machinery' | t }}</span>
          <li menu-item>
            <a [routerLink]="board.commands" routerLinkActive="active" ariaCurrentWhenActive="page">
              {{ 'shell.board' | t }}
            </a>
          </li>
          <li menu-item>
            <a [routerLink]="machinery.commands" routerLinkActive="active" ariaCurrentWhenActive="page">
              {{ 'shell.menu.machinery' | t }}
            </a>
          </li>
        </dotln-sub-app-menu-group>
        <dotln-sub-app-menu-group [emptyMessage]="'shell.menu.toolsEmpty' | t">
          <span menu-heading>{{ 'shell.menu.tools' | t }}</span>
          <li menu-item>
            <a [routerLink]="catalog.commands" routerLinkActive="active" ariaCurrentWhenActive="page">
              {{ 'tools.catalog.title' | t }}
            </a>
          </li>
        </dotln-sub-app-menu-group>
      </dotln-sub-app-menu>
      <dotln-shell-notices notices />
      <router-outlet main />
      <span footer>{{ 'shell.footer' | t }}</span>
      <span footer>{{ 'shell.recordedOn' | t }}</span>
    </dotln-app-layout>
  `,
  styleUrl: './app.scss',
  imports: [
    DotlnAppLayout,
    DotlnSubAppMenu,
    DotlnSubAppMenuGroup,
    ShellNotices,
    TPipe,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
})
export class App {
  readonly board = buildRoute(BasePaths.Board);
  readonly scene = buildRoute(BasePaths.Scene);
  readonly machinery = buildRoute(BasePaths.Machinery);
  readonly catalog = buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog });
}
