import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
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
export class StudyMotion {
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
  readonly drawing = computed(() => motionDrawing(this.model(), this.step()));
  readonly lastStep = computed(() => this.model().frames.length - 1);
  readonly seconds = computed(() => this.model().frames[this.step()].seconds.toFixed(1));
  protected readonly scrubber = viewChild.required(StudyScrubber);

  focus() {
    this.scrubber().focus();
  }
}
