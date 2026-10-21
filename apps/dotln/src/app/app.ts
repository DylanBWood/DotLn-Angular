import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { DotlnAppLayout } from '@dotln-angular/dotln/shell';
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
      <router-outlet main />
      <span footer>{{ 'shell.footer' | t }}</span>
      <span footer>{{ 'shell.recordedOn' | t }}</span>
    </dotln-app-layout>
  `,
  styles: `
    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1.1rem;
      font-weight: 750;
      letter-spacing: -0.025em;
    }
    .brand-mark {
      inline-size: 0.75rem;
      block-size: 0.75rem;
      border-radius: 50%;
      background: var(--dotln-accent);
      box-shadow: 0.35rem -0.35rem 0 -0.1rem var(--dotln-border-strong);
      margin-inline-end: 0.3rem;
    }
    .edition {
      color: var(--dotln-muted);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    a {
      color: var(--dotln-accent);
      text-decoration: none;
      font-size: 0.8rem;
      padding: 0.3rem 0.5rem;
      border-radius: 0.3rem;
      font-weight: 600;
    }
    a.active {
      background: var(--dotln-surface-hover);
    }
    a:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 3px;
    }
  `,
  imports: [DotlnAppLayout, TPipe, RouterLink, RouterLinkActive, RouterOutlet],
})
export class App {
  readonly board = buildRoute(BasePaths.Board);
}
