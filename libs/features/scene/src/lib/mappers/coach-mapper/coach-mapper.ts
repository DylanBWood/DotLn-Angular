import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { CoachStep } from '../../models/scene-view-model';

/** Chooses the coach's sentence, shown quietly over the corner of the field. */
@Component({
  selector: 'scene-coach-mapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>
      @switch (step()) {
        @case ('select') {
          {{ 'scene.coach.select' | t }}
        }
        @case ('tool') {
          {{ 'scene.coach.tool' | t }}
        }
        @case ('apply') {
          {{ 'scene.coach.apply' | t }}
        }
        @case ('send') {
          <span class="fine">{{ 'scene.coach.send' | t }}</span>
          <span class="coarse">{{ 'scene.coach.sendTouch' | t }}</span>
        }
        @case ('form') {
          {{ 'scene.coach.form' | t }}
        }
        @case ('tune') {
          {{ 'scene.coach.tune' | t }}
        }
      }
    </p>
  `,
  styles: `
    :host {
      position: absolute;
      inset-block-start: var(--dotln-space-3);
      inset-inline-start: var(--dotln-space-4);
      max-inline-size: calc(100% - 2 * var(--dotln-space-4));
      border-radius: 0.3rem;
      padding: 0.1rem 0.45rem;
      color: var(--dotln-ink);
      background: var(--dotln-field-ground);
      font-size: 0.85rem;
      pointer-events: none;
    }
    p {
      margin: 0;
    }
    .coarse {
      display: none;
    }
    @media (pointer: coarse) {
      .fine {
        display: none;
      }
      .coarse {
        display: inline;
      }
    }
  `,
  imports: [TPipe],
})
export class CoachMapper {
  readonly step = input.required<CoachStep>();
}
