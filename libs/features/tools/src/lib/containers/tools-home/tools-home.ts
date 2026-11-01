import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BasePaths, buildRoute, ChildPaths } from '@dotln-angular/core';
import { TPipe } from '@dotln-angular/i18n';
import type { ToolId } from '@dotln-angular/models';

import { ToolsHomeFacade } from '../../facades/tools-home.facade';

@Component({
  selector: 'tools-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let state = vm();
    <h1>{{ 'tools.home.title' | t }}</h1>
    <p>{{ 'tools.home.description' | t }}</p>
    <a class="catalog-link" [routerLink]="catalog.commands">{{ 'tools.home.openCatalog' | t }}</a>
    <ul>
      @for (work of state.works; track work.work) {
        <li>
          <span translate="no">{{ work.title }}</span>
          <span>{{ 'tools.shelf.count' | t: { count: work.count } }}</span>
          @if (work.studied) {
            <span>{{ 'tools.shelf.studied' | t: { count: work.studied } }}</span>
          }
        </li>
      }
    </ul>
    @if (state.last; as last) {
      <p>
        @if (last.title; as title) {
          {{ 'tools.home.last' | t }}
          <a [routerLink]="reading(last.id)" translate="no">{{ title }}</a>
        } @else {
          <a [routerLink]="reading(last.id)">{{ 'tools.home.lastUntitled' | t }}</a>
        }
      </p>
    }
    @if (state.failed) {
      <p role="alert">{{ 'tools.home.failed' | t }}</p>
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
  providers: [ToolsHomeFacade],
  imports: [TPipe, RouterLink],
})
export class ToolsHome {
  readonly facade = inject(ToolsHomeFacade);
  readonly vm = this.facade.vm;
  readonly catalog = buildRoute(BasePaths.Tools, { child: ChildPaths.Catalog });
  readonly reading = (id: ToolId) =>
    buildRoute(BasePaths.Tools, { child: ChildPaths.Reading, params: { toolId: id } }).commands;
}
