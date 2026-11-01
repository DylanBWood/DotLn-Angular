import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { ToolId } from '@dotln-angular/models';

import { isPlainClick } from '../../plain-click';
import type { ReadingView, StudyIntent } from '../../types';
import { Study } from '../study/study';

@Component({
  selector: 'tools-concept-reading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concept-reading.html',
  styleUrl: './concept-reading.scss',
  imports: [TPipe, Study],
})
export class ConceptReading {
  readonly reading = input.required<ReadingView>();
  readonly hrefFor = input.required<(id: ToolId) => string>();
  readonly followed = output<ToolId>();
  readonly studyIntent = output<StudyIntent>();
  readonly studyRetried = output<void>();
  readonly studies = computed(() => {
    const { study } = this.reading();
    return study ? [study] : [];
  });

  protected readonly studyElement = viewChild('study', { read: ElementRef });

  /** Takes the reader, and the keyboard, past the definition to the study. */
  jumpToStudy() {
    const element: HTMLElement | undefined = this.studyElement()?.nativeElement;
    element?.focus({ preventScroll: true });
    element?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }
  follow(event: MouseEvent, id: ToolId) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    this.followed.emit(id);
  }
}
