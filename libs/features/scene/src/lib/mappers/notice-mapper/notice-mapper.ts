import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { SceneNotice } from '../../models/scene-view-model';

/** Chooses the sentence for a notice; each one says what happened and why. */
@Component({
  selector: 'scene-notice-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let current = notice();
    <p role="status">
      @switch (current.code) {
        @case ('unknown-tool') {
          {{ 'scene.notice.unknownTool' | t: { id: current.id } }}
        }
        @case ('untyped-tool') {
          {{ 'scene.notice.untypedTool' | t: { title: current.title } }}
        }
        @case ('refused-tool') {
          {{ 'scene.notice.refusedTool' | t: { title: current.title, kind: current.kind } }}
        }
        @case ('catalog-unavailable') {
          {{ 'scene.notice.catalogUnavailable' | t: { id: current.id } }}
        }
        @case ('import-failed') {
          {{ 'scene.notice.importFailed' | t }}
        }
        @case ('save-failed') {
          {{ 'scene.notice.saveFailed' | t }}
        }
        @case ('stored-ignored') {
          {{ 'scene.notice.storedIgnored' | t }}
        }
      }
    </p>
  `,
  styles: `
    :host {
      display: block;
      margin-block-end: var(--dotln-space-3);
      border-inline-start: 3px solid var(--dotln-field-objective);
      padding-inline-start: var(--dotln-space-2);
      font-size: 0.85rem;
    }
    p {
      margin: 0;
    }
  `,
  imports: [TPipe],
})
export class NoticeMapper {
  readonly notice = input.required<SceneNotice>();
}
