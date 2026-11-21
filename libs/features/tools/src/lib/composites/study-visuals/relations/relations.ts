import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import { relationCanvasWidth, relationNodeHeight } from '../../../studies/relations-layout';
import type { RelationsModel, StudyMoment } from '../../../studies/study-model';
import { StudyScrubber } from '../scrubber/scrubber';

@Component({
  selector: 'tools-study-relations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relations.html',
  styleUrl: './relations.scss',
  imports: [TPipe, StudyScrubber],
})
export class StudyRelations {
  readonly model = input.required<RelationsModel>();
  readonly step = input.required<number>();
  readonly textEquivalent = input.required<string>();
  readonly moments = input<readonly StudyMoment[]>([]);
  readonly playing = input<boolean | null>(null);
  readonly stepped = output<number>();
  readonly played = output<boolean>();
  readonly frame = computed(() => this.model().frames[this.step()]);
  readonly activeNode = computed(() => {
    const focus = this.frame().focus;
    return 'node' in focus ? focus.node : null;
  });
  readonly activeEdge = computed(() => {
    const focus = this.frame().focus;
    return 'relation' in focus ? focus.relation : null;
  });
  protected readonly canvasWidth = relationCanvasWidth;
  protected readonly nodeHeight = relationNodeHeight;
  protected readonly scrubber = viewChild.required(StudyScrubber);

  focus() {
    this.scrubber().focus();
  }
}
