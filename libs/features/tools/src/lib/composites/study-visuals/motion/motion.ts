import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { MotionModel, StudyMoment } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';
import { motionDrawing } from './motion-drawing';

/**
 * The positions of the example's bodies at one moment, stepped by hand. What the text equivalent
 * says is what the drawing shows, so a reader who cannot see it loses nothing.
 */
@Component({
  selector: 'tools-study-motion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './motion.html',
  styleUrl: './motion.scss',
  imports: [TPipe, StudyScrubber],
})
export class StudyMotion implements OnDestroy {
  // Match chart-text's font breakpoint so placement reserves the room the glyphs use.
  readonly #narrowScreen = globalThis.matchMedia?.('(max-width: 600px)');
  readonly #fontSize = signal(this.#narrowScreen?.matches ? 24 : 15);
  readonly #resize = () => this.#fontSize.set(this.#narrowScreen?.matches ? 24 : 15);
  readonly model = input.required<MotionModel>();
  readonly step = input.required<number>();
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly note = input<string | null>(null);
  readonly playing = input<boolean | null>(null);
  readonly numbersOpen = input(false);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly numbersToggled = output<boolean>();
  readonly drawing = computed(() => motionDrawing(this.model(), this.step(), this.#fontSize()));
  readonly lastStep = computed(() => this.model().frames.length - 1);
  readonly seconds = computed(() => this.model().frames[this.step()].seconds.toFixed(1));
  protected readonly scrubber = viewChild.required(StudyScrubber);

  constructor() {
    this.#narrowScreen?.addEventListener('change', this.#resize);
  }

  ngOnDestroy() {
    this.#narrowScreen?.removeEventListener('change', this.#resize);
  }

  focus() {
    this.scrubber().focus();
  }
}
