import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { FlowModel, StudyMoment } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';
import { flowDrawing } from './flow-drawing';

/**
 * Messages stepping through endpoints and channels, one step at a time on command. The text
 * equivalent names what moves at the selected step and what each stage holds, so a reader who
 * cannot see the drawing loses nothing.
 */
@Component({
  selector: 'tools-study-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './flow.html',
  styleUrl: './flow.scss',
  imports: [NgTemplateOutlet, TPipe, StudyScrubber],
})
export class StudyFlow {
  readonly model = input.required<FlowModel>();
  readonly step = input.required<number>();
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly note = input<string | null>(null);
  readonly playing = input<boolean | null>(null);
  readonly numbersOpen = input(false);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly numbersToggled = output<boolean>();
  /** The stages across, a column each, for a wide screen. */
  readonly drawing = computed(() => flowDrawing(this.model(), this.step()));
  /** The stages down, a row each, for a phone, where the stylesheet shows this one instead. */
  readonly downward = computed(() => flowDrawing(this.model(), this.step(), 'down'));
  readonly lastStep = computed(() => this.model().frames.length - 1);
  protected readonly scrubber = viewChild.required(StudyScrubber);

  focus() {
    this.scrubber().focus();
  }
}
