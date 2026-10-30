import type { Composition, CompositionStep } from '@dotln-angular/scene-engine';

import type { LogStepView, LogView } from '../models/scene-view-model';

export interface LogInput {
  readonly steps: readonly CompositionStep[];
  readonly compositions: readonly Composition[];
  readonly forkIndex: number | null;
  readonly kept: number;
  readonly exported: string | null;
  readonly titleOf: (step: CompositionStep) => string;
}

const sameTool = (a: CompositionStep, b: CompositionStep) =>
  a.toolId === b.toolId && a.selection.join() === b.selection.join();

/** One entry per run of the same tool on the same units, so live changes do not flood the log. */
function mapSteps(input: LogInput): readonly LogStepView[] {
  const { steps, forkIndex, titleOf } = input;
  const entries: LogStepView[] = [];
  steps.forEach((step, index) => {
    const afterFork = forkIndex === index;
    const previous = index > 0 ? steps[index - 1] : null;
    if (previous !== null && !afterFork && sameTool(previous, step)) {
      const last = entries[entries.length - 1];
      entries[entries.length - 1] = { ...last, repeats: last.repeats + 1 };
      return;
    }
    entries.push({
      at: step.at,
      title: titleOf(step),
      units: step.selection.length,
      repeats: 1,
      afterFork,
    });
  });
  return entries;
}

export function mapLog(input: LogInput): LogView {
  const { steps, compositions, kept, exported } = input;
  return {
    steps: mapSteps(input),
    compositions: compositions.map((composition) => ({
      id: composition.id,
      title: composition.title,
      steps: composition.steps.length,
      trials: composition.trials.length,
      note: composition.note,
    })),
    kept,
    exported,
    canSave: steps.length > 0,
  };
}
