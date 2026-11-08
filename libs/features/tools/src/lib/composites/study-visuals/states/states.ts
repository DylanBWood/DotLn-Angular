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

import type { StatesModel, StudyMoment } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';
import { registerDrawing } from './states-register';

/**
 * Objects stepping between the states a pattern gives them, one step at a time on command. The
 * text equivalent names what moved, how and where every object stands, so a reader who cannot see
 * the drawing loses nothing.
 */
@Component({
  selector: 'tools-study-states',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './states.html',
  styleUrl: './states.scss',
  imports: [NgTemplateOutlet, TPipe, StudyScrubber],
})
export class StudyStates {
  readonly model = input.required<StatesModel>();
  readonly step = input.required<number>();
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly note = input<string | null>(null);
  readonly playing = input<boolean | null>(null);
  readonly numbersOpen = input(false);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly numbersToggled = output<boolean>();
  /** The register: states across as columns, objects down as rows. */
  readonly register = computed(() => registerDrawing(this.model(), this.step()));
  readonly narrowRegister = computed(() => registerDrawing(this.model(), this.step(), 'narrow'));
  readonly lastStep = computed(() => this.model().frames.length - 1);
  protected readonly scrubber = viewChild.required(StudyScrubber);

  focus() {
    this.scrubber().focus();
  }
}
