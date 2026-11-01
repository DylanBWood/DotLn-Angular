import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { StudyMoment } from '../../../studies/study-model';

// Each scrubber on a page gets its own ids, so two can sit in one document.
let scrubbers = 0;

/** Moves through the example's moments: nothing here plays by itself. */
@Component({
  selector: 'tools-study-scrubber',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scrubber.html',
  styleUrl: './scrubber.scss',
  imports: [TPipe],
})
export class StudyScrubber {
  readonly step = input.required<number>();
  readonly lastStep = input.required<number>();
  /** The slider's name on the example's own clock: the seconds of a motion or timeline study. */
  readonly seconds = input<string | null>(null);
  /** Or the frame of a marble diagram, named out of the last step, which is its last frame. */
  readonly frame = input<number | null>(null);
  /** Whether that count names frames, as a marble diagram's does, or the steps of a flow. */
  readonly counting = input<'frame' | 'step'>('frame');
  readonly moments = input<readonly StudyMoment[]>([]);
  /** Null hides the control, as it does for a reader who asked for reduced motion. */
  readonly playing = input<boolean | null>(null);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly sliderId = `study-time-${++scrubbers}`;
  protected readonly slider = viewChild.required<ElementRef<HTMLInputElement>>('slider');

  /** Gives the keyboard to the slider and brings the drawing above it into view. */
  focus() {
    const slider = this.slider().nativeElement;
    slider.focus({ preventScroll: true });
    slider.closest('figure')?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }
}
