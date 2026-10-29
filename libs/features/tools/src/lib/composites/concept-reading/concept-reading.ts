import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { ToolId } from '@dotln-angular/models';

import type { ReadingView } from '../../types';

@Component({
  selector: 'tools-concept-reading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concept-reading.html',
  styleUrl: './concept-reading.scss',
  imports: [TPipe],
})
export class ConceptReading {
  readonly reading = input.required<ReadingView>();
  readonly followed = output<ToolId>();
}
