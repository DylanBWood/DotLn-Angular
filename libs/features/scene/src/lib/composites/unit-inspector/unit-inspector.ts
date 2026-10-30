import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';
import type { StepRefusal } from '@dotln-angular/scene-engine';
import { DotlnButton } from '@dotln-angular/ui';

import type { FormationReading, InspectorView } from '../../models/scene-view-model';

export interface ParamChange {
  readonly name: string;
  readonly value: number;
}

/** A tool's definition, faces and parameters, its previewed effect, and Apply. */
@Component({
  selector: 'scene-unit-inspector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-inspector.html',
  styleUrl: './unit-inspector.scss',
  imports: [DotlnButton, TPipe],
})
export class UnitInspector {
  readonly tool = input.required<InspectorView | null>();
  readonly refusal = input<StepRefusal | null>(null);
  readonly formation = input<FormationReading | null>(null);
  readonly selectionCount = input(0);
  readonly awaitingRun = input(false);
  readonly live = input(false);
  readonly canNote = input(false);
  readonly note = input('');

  readonly paramChanged = output<ParamChange>();
  readonly paramCommitted = output<void>();
  readonly applied = output<void>();
  readonly noted = output<string>();

  changed(name: string, event: Event) {
    this.paramChanged.emit({ name, value: Number((event.target as HTMLInputElement).value) });
  }

  chose(name: string, value: number) {
    this.paramChanged.emit({ name, value });
    this.paramCommitted.emit();
  }

  readText(event: Event) {
    return (event.target as HTMLTextAreaElement).value;
  }
}
