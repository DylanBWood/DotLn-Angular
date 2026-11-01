import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import type { StudyInputView } from '../../../types';

/** The example's inputs a reader can change; each change reruns the example. */
@Component({
  selector: 'tools-study-inputs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inputs.html',
  styleUrl: './inputs.scss',
  imports: [TPipe],
})
export class StudyInputs {
  readonly inputs = input.required<readonly StudyInputView[]>();
  readonly open = input(false);
  readonly changed = output<{ readonly name: string; readonly value: number }>();
  readonly restored = output<void>();
  readonly toggled = output<boolean>();
}
