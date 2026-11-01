import type { ConceptStudy, Tool } from '@dotln-angular/models';

import type { StudyModel } from '../studies/study-model';
import { codeBlocks, fillValues } from '../studies/study-text';
import type { StudyDisclosure, StudyView, StudyVisualView } from '../types';

export interface LoadedStudy {
  readonly record: ConceptStudy;
  readonly model: StudyModel | null;
}

export interface StudyReaderState {
  /** The selected moment; null keeps the moment the model opens on. */
  readonly step: number | null;
  readonly view: StudyVisualView;
  readonly expanded: readonly StudyDisclosure[];
  readonly playing: boolean | null;
  /** The inputs a reader has changed, by name. */
  readonly inputs: Readonly<Record<string, number>>;
}

/** Keeps a requested moment inside the run, whatever a slider or a stale step asked for. */
export const clampStep = (model: StudyModel, step: number | null) =>
  Math.max(0, Math.min(model.motion.frames.length - 1, Math.round(step ?? model.initialStep)));

const nextStudy = (id: Tool['id'], studied: readonly Tool[]) => {
  const next = studied[studied.findIndex((tool) => tool.id === id) + 1];
  return next && studied.some((tool) => tool.id === id) ? { id: next.id, title: next.title } : null;
};

/** One view of a study: the record's prose, read through the model at the selected moment. */
export function mapStudy(
  { record, model }: LoadedStudy,
  reader: StudyReaderState,
  tools: readonly Tool[],
  studiedInOrder: readonly Tool[] = [],
): StudyView {
  const step = model ? clampStep(model, reader.step) : 0;
  const frame = model?.motion.frames[step];
  const values = frame?.values ?? {};
  const blocks = codeBlocks(record.pseudocode.ordinary);
  const { executable, rxjs } = record.pseudocode;
  return {
    id: record.id,
    authoredBy: record.authored.by,
    authoredOn: record.authored.on,
    reviewers: record.authored.reviewedBy.join(', '),
    intuition: record.intuition,
    example: {
      ...record.example,
      description: fillValues(record.example.description, values),
    },
    visual:
      record.visual && model
        ? {
            view: model.timeline ? reader.view : 'motion',
            motion: model.motion,
            timeline: model.timeline,
            step,
            moments: model.moments,
            legend: model.legend,
            caption: model.caption,
            textEquivalent: fillValues(record.visual.textEquivalent, values),
            note: frame?.note ?? null,
            playing: reader.playing,
            inputs: (model.inputs ?? []).map((input) => ({
              ...input,
              value: reader.inputs[input.name] ?? Number(record.example.parameters[input.name]),
            })),
          }
        : null,
    expanded: reader.expanded,
    worked: frame?.worked ?? null,
    pseudocode: record.pseudocode.ordinary,
    steps: record.mechanism.steps.map(({ title, text }, index) => ({
      title,
      text: fillValues(text, values),
      code: blocks[index] ?? '',
    })),
    rxjs: rxjs ? { code: rxjs, executable: executable?.kind === 'rxjs' } : null,
    limits: record.limits.map((limit) => fillValues(limit, values)),
    comparison: model?.comparison ?? null,
    implementations: record.implementations,
    references: record.references,
    nearby: record.nearby.flatMap(({ id, why }) => {
      const tool = tools.find((candidate) => candidate.id === id);
      return tool ? [{ id, title: tool.title, why }] : [];
    }),
    next: nextStudy(record.id, studiedInOrder),
  };
}
