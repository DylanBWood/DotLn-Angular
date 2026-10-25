import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import { DotlnEmptyState } from '@dotln-angular/ui';

@Component({
  selector: 'scene-arriving-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ 'scene.arriving.title' | t }}</h1>
    <dotln-empty-state [message]="'scene.arriving.description' | t">
      <a empty-action [routerLink]="board.commands">{{ 'scene.arriving.backToBoard' | t }}</a>
    </dotln-empty-state>
  `,
  styles: `
    :host {
      display: block;
      overflow-wrap: anywhere;
    }
    h1 {
      margin-block: 0 var(--dotln-space-5);
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      letter-spacing: -0.035em;
    }
    a {
      color: var(--dotln-accent);
    }
    a:focus-visible {
      outline: var(--dotln-focus);
      outline-offset: 3px;
    }
  `,
  imports: [DotlnEmptyState, RouterLink, TPipe],
})
export class SceneArrivingPage {
  readonly board = buildRoute(BasePaths.Board);
}
