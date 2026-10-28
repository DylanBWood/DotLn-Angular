import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TPipe } from '@dotln-angular/i18n';

import {
  arrivePseudocode,
  arrivePseudocodeParts,
  arriveRxPseudocode,
} from '../../arrive-example-code';
import type {
  ArriveCalculationView,
  ArriveLimitExampleView,
  StudySection,
  StudyStreamView,
} from '../../types';

@Component({
  selector: 'tools-study-explanation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './study-explanation.html',
  styleUrl: './study-explanation.scss',
  imports: [TPipe],
})
export class StudyExplanation {
  readonly section = input.required<StudySection>();
  readonly calculation = input<ArriveCalculationView | null>(null);
  readonly limitExample = input<ArriveLimitExampleView | null>(null);
  readonly streamView = input<StudyStreamView>('flow');
  readonly momentRequested = output<number>();
  readonly streamViewChanged = output<StudyStreamView>();
  readonly pseudocode = arrivePseudocode;
  readonly pseudocodeParts = arrivePseudocodeParts;
  readonly rxPseudocode = arriveRxPseudocode;
  readonly timelineCode = {
    first: '[0.1, 100] · scan: S0 → S1 · draw(S1)',
    target: 'target$: 80',
    second: '[0.1, 80] · scan: S1 → S2 · draw(S2)',
    third: '[0.1, 80] · scan: S2 → S3 · draw(S3)',
    stop: 'takeUntil(stop$) → complete',
  };
  readonly flowCode = {
    frames: 'frames$',
    targets: 'target$.pipe(startWith(100))',
    sample: 'withLatestFrom',
    accumulate: 'scan',
    stop: 'takeUntil(stop$)',
    draw: 'subscribe(draw)',
    firstPair: '[0.1, 100]',
    nextPair: '[0.1, 80]',
    states: 'S0 → S1 → S2 → S3',
    drawings: 'S1 · S2 · S3',
  };
}
