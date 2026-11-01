import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { StudyMoment, TimelineModel } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';
import { timelineDrawing } from './timeline-drawing';

/**
 * One or more series over time. With a step it marks that moment and moves by hand, as the
 * motion family does; without one it is a still chart.
 */
@Component({
  selector: 'tools-study-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
  imports: [TPipe, StudyScrubber],
})
export class StudyTimeline {
  readonly model = input.required<TimelineModel>();
  readonly step = input<number | null>(null);
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly note = input<string | null>(null);
  readonly playing = input<boolean | null>(null);
  readonly numbersOpen = input(false);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly numbersToggled = output<boolean>();
  readonly drawing = computed(() => timelineDrawing(this.model(), this.step()));
  readonly seconds = computed(() => this.model().seconds[this.step() ?? 0].toFixed(1));
  protected readonly scrubber = viewChild(StudyScrubber);

  focus() {
    this.scrubber()?.focus();
  }
}
