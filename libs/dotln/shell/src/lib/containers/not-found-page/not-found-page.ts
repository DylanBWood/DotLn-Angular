import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import { DotlnEmptyState } from '@dotln-angular/ui';

@Component({
  selector: 'dotln-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ 'shell.notFound.title' | t }}</h1>
    <dotln-empty-state [message]="'shell.notFound.description' | t">
      <a empty-action [routerLink]="board.commands">{{ 'shell.notFound.back' | t }}</a>
    </dotln-empty-state>
  `,
  styles: `
    :host { display: block; overflow-wrap: anywhere; }
    a { color: var(--dotln-accent); }
    a:focus-visible { outline: var(--dotln-focus); outline-offset: 3px; }
  `,
  imports: [RouterLink, TPipe, DotlnEmptyState],
})
export class NotFoundPage {
  readonly board = buildRoute(BasePaths.Board);
}
