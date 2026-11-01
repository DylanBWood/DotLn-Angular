import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Tool, ToolId, WorkSlug } from '@dotln-angular/models';
import { DotlnIcon } from '@dotln-angular/ui';

import { isPlainClick } from '../../plain-click';

@Component({
  selector: 'tools-catalog-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="search">
      <label for="catalog-search">{{ 'tools.search.label' | t }}</label>
      <input #field id="catalog-search" type="search" [value]="query()" [placeholder]="'tools.search.placeholder' | t" (input)="searched.emit(field.value)" (keydown.enter)="openFirst()" />
      @if (query().trim()) {
        <section [attr.aria-label]="'tools.search.results' | t">
          <p role="status" data-testid="search-count" [attr.data-count]="total()">{{ 'tools.search.count' | t: { count: total() } }}</p>
          <ng-content select="[facets]" />
          <ol>
            @for (tool of results(); track tool.id) {
              <li [attr.data-result-work]="tool.work" [attr.data-result-status]="tool.status" [attr.data-result-kind]="tool.kind">
                <a [attr.href]="hrefFor()(tool.id)" (click)="open($event, tool.id)" [attr.data-result-id]="tool.id" translate="no">{{ tool.title }}</a>
                @if (studied().has(tool.id)) {
                  <dotln-icon class="studied" [glyph]="'tools.contents.studiedGlyph' | t" [label]="'tools.contents.studied' | t" />
                }
                <small>{{ 'tools.search.place' | t: { work: workTitles()[tool.work] ?? tool.work, chapter: tool.place.chapter } }}</small>
              </li>
            }
          </ol>
          <ng-content select="[pagination]" />
        </section>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    label { display: block; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: var(--dotln-muted); margin-block-end: .5rem; }
    input { inline-size: 100%; box-sizing: border-box; font: inherit; font-size: 1.1rem; border: 0; border-block-end: 1px solid var(--dotln-border-strong); padding: .65rem .25rem; background: transparent; color: var(--dotln-ink); border-radius: 0; }
    input:focus-visible, a:focus-visible { outline: var(--dotln-focus); outline-offset: 3px; }
    ol { list-style: none; padding: 0; margin: 1rem 0; columns: 2 20rem; }
    li { break-inside: avoid; padding-block: .55rem; overflow-wrap: anywhere; }
    a { color: var(--dotln-accent); text-underline-offset: .2em; }
    small { display: block; color: var(--dotln-muted); margin-block-start: .3rem; }
    .studied { margin-inline-start: .35rem; font-size: .75em; }
  `,
  imports: [TPipe, DotlnIcon],
})
export class CatalogSearch {
  readonly query = input('');
  readonly results = input<readonly Tool[]>([]);
  readonly total = input(0);
  /** Work titles by slug, so each result names its work by title rather than slug. */
  readonly workTitles = input<Readonly<Partial<Record<WorkSlug, string>>>>({});
  readonly studied = input<ReadonlySet<ToolId>>(new Set());
  readonly hrefFor = input.required<(id: ToolId) => string>();
  readonly searched = output<string>();
  readonly opened = output<ToolId>();
  open(event: MouseEvent, id: ToolId) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    this.opened.emit(id);
  }
  openFirst() {
    const first = this.results()[0];
    if (first) this.opened.emit(first.id);
  }
}
