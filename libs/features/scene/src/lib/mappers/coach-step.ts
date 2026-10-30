import type { CompositionStep } from '@dotln-angular/scene-engine';
import { objectiveKind } from '@dotln-angular/scene-engine';

import type { CoachStep } from '../models/scene-view-model';

export interface CoachInput {
  readonly selected: number;
  readonly toolChosen: boolean;
  readonly steps: readonly CompositionStep[];
  readonly objectiveSet: boolean;
  readonly compared: boolean;
}

/** The next thing worth trying, from what the operator has already done. */
export function coachStep(input: CoachInput): CoachStep | null {
  if (input.compared) return null;
  const equips = input.steps.filter(({ kind }) => kind !== objectiveKind);
  if (equips.length === 0) {
    if (input.selected === 0) return 'select';
    return input.toolChosen ? 'apply' : 'tool';
  }
  if (!input.objectiveSet) return 'send';
  return equips.some(({ kind }) => kind.startsWith('formation.')) ? 'tune' : 'form';
}
