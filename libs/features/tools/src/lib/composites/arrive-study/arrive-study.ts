import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { ArriveStudyView, StudySection, StudyStreamView } from '../../types';
import { StudyExplanation } from '../study-explanation/study-explanation';

@Component({
  selector: 'tools-arrive-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './arrive-study.html',
  styleUrl: './arrive-study.scss',
  imports: [TPipe, StudyExplanation],
})
export class ArriveStudy {
  readonly study = input.required<ArriveStudyView>();
  readonly scrubbed = output<number>();
  readonly momentRequested = output<number>();
  readonly viewChanged = output<'motion' | 'velocity'>();
  readonly streamViewChanged = output<StudyStreamView>();
  readonly expanded = output<{ section: StudySection; open: boolean }>();
}
