import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Panel } from '@dotln-angular/models';

import type { CellTemplate, LinkTemplate } from '../../models/presentation';
import { BoardSection } from '../board-section/board-section';

@Component({
  selector: 'board-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [id]="panel().id" [attr.aria-labelledby]="panel().id + '-heading'" tabindex="-1">
      <div class="panel-heading">
        <div>
          <h2 [id]="panel().id + '-heading'" translate="no">{{ panel().title }}</h2>
          <p class="question" translate="no">{{ panel().question }}</p>
        </div>
        <ul class="roles">
          @for (role of panel().roles; track role) {
            <li translate="no">{{ role }}</li>
          }
        </ul>
      </div>
      <div class="sections">
        @for (section of panel().sections; track section.id) {
          <board-section
            [section]="section"
            [cellTemplate]="cellTemplate()"
            [linkTemplate]="linkTemplate()"
          />
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-inline-size: 0;
    }
    section:focus {
      outline: var(--dotln-focus);
      outline-offset: 6px;
    }
    .panel-heading {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
      margin-block-end: 2rem;
    }
    h2 {
      overflow-wrap: anywhere;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
      margin: 0;
    }
    .question {
      color: var(--dotln-muted);
      margin: 0.65rem 0 0;
      line-height: 1.6;
    }
    .roles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      list-style: none;
      margin: 0.2rem 0 0;
      padding: 0;
    }
    li {
      border: 1px solid var(--dotln-border);
      border-radius: 2rem;
      padding: 0.3rem 0.65rem;
      color: var(--dotln-muted);
      font-size: 0.7rem;
    }
    .sections {
      display: grid;
      gap: 2rem;
    }
  `,
  imports: [BoardSection],
})
export class BoardPanel {
  readonly panel = input.required<Panel>();
  readonly cellTemplate = input.required<CellTemplate>();
  readonly linkTemplate = input.required<LinkTemplate>();
}
