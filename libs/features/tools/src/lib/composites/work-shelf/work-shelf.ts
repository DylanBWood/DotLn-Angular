import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { CatalogWork, WorkSlug } from '@dotln-angular/models';

@Component({
  selector: 'tools-work-shelf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="'tools.shelf.title' | t">
      <h2>{{ 'tools.shelf.title' | t }}</h2>
      <ol>
        @for (item of works(); track item.work) {
          <li [attr.data-work]="item.work" [class.selected]="item.work === selected()">
            <button type="button" [attr.aria-current]="item.work === selected() ? 'true' : null" (click)="chosen.emit(item.work)">
              <span class="title" translate="no">{{ item.title }}</span>
              <span class="count">{{ 'tools.shelf.count' | t: { count: item.count } }}</span>
              @if (item.studied) {
                <span class="studied">{{ 'tools.shelf.studied' | t: { count: item.studied } }}</span>
              }
              @if (item.scene; as scene) {
                <span class="scene" translate="no">{{ sceneLabel(scene) }}</span>
              }
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './work-shelf.scss',
  imports: [TPipe],
})
export class WorkShelf {
  readonly works = input.required<readonly CatalogWork[]>();
  readonly selected = input<WorkSlug | null>(null);
  readonly chosen = output<WorkSlug>();
  sceneLabel(scene: string) {
    return scene.replaceAll('-', ' ');
  }
}
