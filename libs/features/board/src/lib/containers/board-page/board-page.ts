import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import {
  DotlnBadge,
  DotlnPageHeader,
  DotlnTabList,
  DotlnTabPanel,
  DotlnTabs,
  DotlnUnavailable,
} from '@dotln-angular/ui';

import { BoardPanel } from '../../composites/board-panel/board-panel';
import { BoardFacade } from '../../facades/board.facade';
import { BoardLayout } from '../../layouts/board-layout/board-layout';
import { CellValueMapper } from '../../mappers/cell-value-mapper/cell-value-mapper';
import { LinkMapper } from '../../mappers/link-mapper/link-mapper';

@Component({
  selector: 'board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let current = vm();
    <dotln-tabs>
      <board-layout>
        <dotln-page-header
          page-header
          [eyebrow]="'board.eyebrow' | t"
          [heading]="'board.title' | t"
          [description]="'board.description' | t"
        />
        <ng-container panel-tabs>
          @if (current.compatible) {
            <dotln-tab-list
              panel-tabs
              [items]="current.tabs"
              [label]="'board.panels' | t"
              [selected]="current.selectedPanel"
              (selectedChange)="facade.selectPanel($event)"
            />
          }
        </ng-container>
        <div panel-content>
          @if (current.compatible) {
            @for (panel of current.document.panels; track panel.id) {
              <ng-template #content
                ><board-panel [panel]="panel" [cellTemplate]="cell" [linkTemplate]="link"
              /></ng-template>
              <dotln-tab-panel [value]="panel.id" [content]="content" />
            }
          } @else {
            <dotln-unavailable
              [explanation]="
                'board.unsupportedVersion' | t: { version: current.document.viewModelVersion }
              "
            />
          }
        </div>
        <div sources-footer class="sources">
          @if (current.compatible) {
            <div class="sources-heading">
              <h2>{{ 'board.sources' | t }}</h2>
              <p>
                {{
                  'board.sourceCounts'
                    | t
                      : {
                          available: current.availableSources,
                          unavailable: current.unavailableSources,
                        }
                }}
              </p>
            </div>
            <details>
              <summary>{{ 'board.inspectSources' | t }}</summary>
              <ul class="source-list">
                @for (source of current.document.sources; track source.ref) {
                  <li [id]="source.ref" tabindex="-1">
                    <div class="source-title">
                      <span translate="no">{{ source.ref }}</span
                      ><dotln-badge
                        [status]="source.status === 'available' ? 'known' : 'unavailable'"
                      />
                    </div>
                    @if (source.explanation; as explanation) {
                      <p translate="no">{{ explanation }}</p>
                    }
                  </li>
                }
              </ul>
            </details>
            <details>
              <summary>{{ 'board.inspectEvidence' | t }}</summary>
              <ul class="source-list">
                @for (evidence of current.document.evidence; track evidence.id) {
                  <li [id]="evidence.id" tabindex="-1">
                    <strong translate="no">{{ evidence.id }}</strong>
                    <p translate="no">{{ evidence.record }}</p>
                    <board-link-mapper
                      [link]="{ label: evidence.source, target: evidence.source }"
                      [targets]="current.targets"
                      (followed)="facade.follow($event)"
                    />
                  </li>
                }
              </ul>
            </details>
          }
        </div>
      </board-layout>
    </dotln-tabs>
    <ng-template #cell let-item>
      <board-cell-value-mapper [cell]="item">
        @for (evidence of item.evidence; track evidence) {
          <board-link-mapper
            [link]="{ label: evidence, target: evidence }"
            [targets]="vm().targets"
            (followed)="facade.follow($event)"
          />
        }
      </board-cell-value-mapper>
    </ng-template>
    <ng-template #link let-item
      ><board-link-mapper [link]="item" [targets]="vm().targets" (followed)="facade.follow($event)"
    /></ng-template>
  `,
  styles: `
    :host {
      display: block;
    }
    .sources-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    h2 {
      font-size: 1rem;
      margin: 0;
    }
    .sources-heading p {
      color: var(--dotln-muted);
      font-size: 0.8rem;
    }
    details {
      margin-block-start: 1rem;
    }
    summary {
      cursor: pointer;
      color: var(--dotln-accent);
      font-size: 0.85rem;
      padding-block: 0.4rem;
    }
    summary:focus-visible,
    li:focus {
      outline: var(--dotln-focus);
      outline-offset: 4px;
    }
    .source-list {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 1rem;
    }
    li {
      padding: 1rem;
      background: var(--dotln-surface);
      border: 1px solid var(--dotln-border);
      border-radius: var(--dotln-radius);
      overflow-wrap: anywhere;
      font-size: 0.8rem;
    }
    .source-title {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      align-items: center;
    }
    li p {
      color: var(--dotln-muted);
      line-height: 1.5;
    }
  `,
  imports: [
    TPipe,
    DotlnTabs,
    DotlnTabList,
    DotlnTabPanel,
    DotlnPageHeader,
    DotlnUnavailable,
    DotlnBadge,
    BoardLayout,
    BoardPanel,
    CellValueMapper,
    LinkMapper,
  ],
})
export class BoardPage {
  readonly facade = inject(BoardFacade);
  readonly vm = this.facade.vm;
}
