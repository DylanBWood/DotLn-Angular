import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import { type MarblesModel, secondsPerFrame, type StudyMoment } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';
import { marblesDrawing } from './marbles-drawing';

/**
 * A marble diagram at one frame, stepped by hand: the input streams, the operator and what comes
 * out, read from the strings the example's spec asserts. The text equivalent names the emission
 * of the selected frame, so a reader who cannot see the drawing loses nothing.
 */
@Component({
  selector: 'tools-study-marbles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './marbles.html',
  styleUrl: './marbles.scss',
  imports: [TPipe, StudyScrubber],
})
export class StudyMarbles {
  readonly model = input.required<MarblesModel>();
  readonly step = input.required<number>();
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly note = input<string | null>(null);
  readonly playing = input<boolean | null>(null);
  readonly numbersOpen = input(false);
  /** How long the line of the stepped frame takes to glide to the next frame while playing. */
  readonly frameSeconds = `${secondsPerFrame}s`;
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly numbersToggled = output<boolean>();
  readonly drawing = computed(() => marblesDrawing(this.model(), this.step()));
  readonly lastStep = computed(() => this.model().frames.length - 1);
  readonly frame = computed(() => this.model().frames[this.step()]?.frame ?? 0);
  /**
   * True for the one paint after the step changes by other than one frame while playing, as when
   * Play starts, or starts over from the end: the line lands on the frame without a transition
   * and glides on from the next paint.
   */
  readonly #landing = signal(false);
  #previousStep: number | null = null;
  /** While playing the line leads to the next frame; a hand step or a landing places it exactly. */
  readonly glides = computed(() => this.playing() === true && !this.#landing());
  readonly cursorX = computed(() =>
    this.glides() ? this.drawing().cursorNext : this.drawing().cursor.x1,
  );
  protected readonly scrubber = viewChild.required(StudyScrubber);
  protected readonly cursor = viewChild.required<ElementRef<SVGLineElement>>('cursor');

  constructor() {
    effect(() => {
      const step = this.step();
      const playing = this.playing();
      untracked(() => {
        const previous = this.#previousStep;
        this.#previousStep = step;
        if (playing === true && previous !== null && step !== previous + 1) this.#landing.set(true);
      });
    });
    afterEveryRender(() => {
      if (!this.#landing()) return;
      // The browser lays the line out where it landed before it is asked to glide on.
      this.cursor().nativeElement.getBoundingClientRect();
      this.#landing.set(false);
    });
  }

  focus() {
    this.scrubber().focus();
  }
}
