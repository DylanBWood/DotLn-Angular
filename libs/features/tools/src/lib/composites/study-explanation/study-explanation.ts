import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { StudySection, StudyView } from '../../types';
import { StudyTimeline } from '../study-visuals/timeline/timeline';

// Each explanation on a page gets its own ids, so two can sit in one document.
let explanations = 0;

/** One disclosure's content. It is created the first time its disclosure opens. */
@Component({
  selector: 'tools-study-explanation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './study-explanation.html',
  styleUrl: './study-explanation.scss',
  imports: [TPipe, StudyTimeline],
})
export class StudyExplanation {
  readonly section = input.required<StudySection>();
  readonly study = input.required<StudyView>();
  readonly momentRequested = output<void>();
  /** Whether the worked step shows a rounded number, which the precision note is about. */
  readonly rounded = computed(() => {
    const worked = this.study().worked;
    return !!worked && [worked.title, ...worked.lines].some((line) => /\d\.\d/.test(line));
  });
  readonly #id = `study-explanation-${++explanations}`;
  readonly codeHeading = `${this.#id}-code`;
  readonly stepHeading = (index: number) => `${this.#id}-step-${index}`;
}
