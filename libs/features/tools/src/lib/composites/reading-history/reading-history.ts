import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { Tool, ToolId } from '@dotln-angular/models';

@Component({
  selector: 'tools-reading-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="'tools.history.title' | t">
      <h2>{{ 'tools.history.title' | t }}</h2>
      @if (tools().length) {
        <ol>
          @for (tool of tools(); track tool.id) {
            <li><a href="#reading" (click)="$event.preventDefault(); opened.emit(tool.id)" translate="no">{{ tool.title }}</a></li>
          }
        </ol>
      } @else { <p>{{ 'tools.history.empty' | t }}</p> }
    </nav>
  `,
  styles: `
    :host { display: block; }
    h2 { font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: var(--dotln-muted); }
    ol { display: flex; flex-wrap: wrap; column-gap: 1.5rem; row-gap: .75rem; list-style: none; padding: 0; font-size: .8rem; }
    li { min-inline-size: 0; overflow-wrap: anywhere; }
    a { color: var(--dotln-accent); text-underline-offset: .2em; }
    a:focus-visible { outline: var(--dotln-focus); outline-offset: 3px; }
    p { font-size: .8rem; color: var(--dotln-muted); }
  `,
  imports: [TPipe],
})
export class ReadingHistory {
  readonly tools = input<readonly Tool[]>([]);
  readonly opened = output<ToolId>();
}
