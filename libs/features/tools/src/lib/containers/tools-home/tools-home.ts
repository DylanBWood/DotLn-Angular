import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';

import { ToolsFacade } from '../../facades/tools.facade';

@Component({
  selector: 'tools-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let state = vm();
    <h1>{{ 'tools.home.title' | t }}</h1>
    <p>{{ 'tools.home.description' | t }}</p>
    <a class="catalog-link" [routerLink]="catalog.commands">{{ 'tools.home.openCatalog' | t }}</a>
    <ul>
      @for (work of state.shelf; track work.work) {
        <li><span translate="no">{{ work.title }}</span> <span>{{ 'tools.shelf.count' | t: { count: work.count } }}</span></li>
      }
    </ul>
    @if (state.history[0]; as last) {
      <p>{{ 'tools.home.last' | t }} <a [routerLink]="catalog.commands" (click)="facade.open(last.id)" translate="no">{{ last.title }}</a></p>
    }
    @if (state.failed) {
      <p role="alert">{{ 'tools.catalog.failed' | t }}</p>
      <button type="button" (click)="facade.retry()">{{ 'tools.catalog.retry' | t }}</button>
    }
  `,
  styles: `
    :host { display: block; overflow-wrap: anywhere; }
    h1 { font-family: var(--dotln-font-reading); font-weight: 500; font-size: clamp(2.25rem, 4vw, 4rem); letter-spacing: -.035em; }
    p, li { line-height: 1.8; }
    ul { padding-inline-start: 1.2rem; }
    li span + span { font-size: .8rem; color: var(--dotln-muted); margin-inline-start: 1rem; }
    a { color: var(--dotln-accent); text-underline-offset: .2em; }
    .catalog-link { font-size: 1.2rem; }
    a:focus-visible { outline: var(--dotln-focus); outline-offset: 3px; }
  `,
  providers: [ToolsFacade],
  imports: [TPipe, RouterLink],
})
export class ToolsHome {
  readonly facade = inject(ToolsFacade);
  readonly vm = this.facade.vm;
  readonly catalog = buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog });
}
