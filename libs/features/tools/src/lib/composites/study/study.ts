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
import type { ToolId } from '@dotln-angular/models';

import { isPlainClick } from '../../plain-click';
import type { StudyDisclosure, StudyIntent, StudySection, StudyView } from '../../types';
import { StudyExplanation } from '../study-explanation/study-explanation';
import { StudyFlow } from '../study-visuals/flow/flow';
import { StudyInputs } from '../study-visuals/inputs/inputs';
import { StudyMarbles } from '../study-visuals/marbles/marbles';
import { StudyMotion } from '../study-visuals/motion/motion';
import { StudyTimeline } from '../study-visuals/timeline/timeline';

/**
 * A concept studied from several sides. The drawing is always there, in the family the model
 * names; each explanation sits in a native disclosure and is only created the first time it is
 * opened.
 */
@Component({
  selector: 'tools-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './study.html',
  styleUrl: './study.scss',
  imports: [
    NgTemplateOutlet,
    TPipe,
    StudyExplanation,
    StudyFlow,
    StudyInputs,
    StudyMarbles,
    StudyMotion,
    StudyTimeline,
  ],
})
export class Study {
  readonly study = input.required<StudyView>();
  readonly hrefFor = input.required<(id: ToolId) => string>();
  readonly intent = output<StudyIntent>();
  readonly followed = output<ToolId>();
  readonly sections = computed((): readonly StudySection[] =>
    this.study().rxjs
      ? ['mechanism', 'reactive', 'limits', 'elsewhere']
      : ['mechanism', 'limits', 'elsewhere'],
  );
  protected readonly motion = viewChild(StudyMotion);
  protected readonly timeline = viewChild(StudyTimeline);
  protected readonly marbles = viewChild(StudyMarbles);
  protected readonly flow = viewChild(StudyFlow);

  stepped(step: number) {
    this.intent.emit({ kind: 'step', step });
  }
  /** Returns the keyboard to the drawing after a worked step asks to show its moment. */
  showMoment() {
    (this.motion() ?? this.timeline() ?? this.marbles() ?? this.flow())?.focus();
  }
  toggled(section: StudyDisclosure, details: HTMLDetailsElement) {
    this.intent.emit({ kind: 'expand', section, open: details.open });
  }
  follow(event: MouseEvent, id: ToolId) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    this.followed.emit(id);
  }
}
