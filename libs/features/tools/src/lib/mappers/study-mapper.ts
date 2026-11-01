import type { ConceptStudy, Tool } from '@dotln-angular/models';

import { type StudyModel, type StudyTick, ticksOf } from '../studies/study-model';
import { codeBlocks, fillValues } from '../studies/study-text';
import type { StudyDisclosure, StudyDrawingView, StudyView, StudyVisualView } from '../types';

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
  Math.max(0, Math.min(ticksOf(model).length - 1, Math.round(step ?? model.initialStep)));

const nextStudy = (id: Tool['id'], studied: readonly Tool[]) => {
  const next = studied[studied.findIndex((tool) => tool.id === id) + 1];
  return next && studied.some((tool) => tool.id === id) ? { id: next.id, title: next.title } : null;
};

/** The drawing at the selected moment, in the shape of the family the model is for. */
function drawingOf(
  record: ConceptStudy,
  model: StudyModel,
  reader: StudyReaderState,
  step: number,
  tick: StudyTick | undefined,
): StudyDrawingView {
  const shared = {
    step,
    moments: model.moments,
    legend: model.legend,
    caption: model.caption,
    textEquivalent: fillValues(record.visual?.textEquivalent ?? '', tick?.values ?? {}),
    note: tick?.note ?? null,
    playing: reader.playing,
    inputs: (model.inputs ?? []).map((input) => ({
      ...input,
      value: reader.inputs[input.name] ?? Number(record.example.parameters[input.name]),
    })),
  };
  if (model.family === 'motion')
    return {
      ...shared,
      family: 'motion',
      view: model.timeline && reader.view === 'timeline' ? 'timeline' : 'motion',
      motion: model.motion,
      timeline: model.timeline,
    };
  if (model.family === 'flow') {
    // The marble diagram, when the reader switches to it, says how to read its own lanes.
    const diagram = reader.view === 'marbles' ? model.diagram : null;
    return {
      ...shared,
      ...(diagram ? { legend: diagram.legend, caption: diagram.caption } : {}),
      family: 'flow',
      view: diagram ? 'marbles' : 'flow',
      flow: model.flow,
      marbles: model.diagram?.marbles ?? null,
    };
  }
  return { ...shared, family: 'marbles', marbles: model.marbles };
}

/** One view of a study: the record's prose, read through the model at the selected moment. */
export function mapStudy(
  { record, model }: LoadedStudy,
  reader: StudyReaderState,
  tools: readonly Tool[],
  studiedInOrder: readonly Tool[] = [],
): StudyView {
  const step = model ? clampStep(model, reader.step) : 0;
  const tick = model ? ticksOf(model)[step] : undefined;
  const values = tick?.values ?? {};
  const blocks = codeBlocks(record.pseudocode.ordinary);
  const { executable, rxjs } = record.pseudocode;
  const runs = executable?.kind === 'rxjs';
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
    visual: record.visual && model ? drawingOf(record, model, reader, step, tick) : null,
    expanded: reader.expanded,
    worked: tick?.worked ?? null,
    pseudocode: record.pseudocode.ordinary,
    steps: record.mechanism.steps.map(({ title, text }, index) => ({
      title,
      text: fillValues(text, values),
      code: blocks[index] ?? '',
    })),
    rxjs: rxjs
      ? {
          code: rxjs,
          executable: runs,
          spec: runs ? executable.module.replace(/\.ts$/, '.spec.ts') : null,
        }
      : null,
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
