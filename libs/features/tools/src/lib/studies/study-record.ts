import type { ConceptStudy } from '@dotln-angular/models';

import type { StudyTranslate } from './study-translate';

const scopes = { aifg: 'studyAifg', rxjs: 'studyRxjs', eip: 'studyEip' } as const;

/** Only works with a shipped study chunk have a message catalog to load. */
export function studyScope(work: ConceptStudy['work']): string {
  if (!(work in scopes)) throw new Error(`No study messages are registered for ${work}.`);
  return scopes[work as keyof typeof scopes];
}

/** Resolve authored text once per language load; the selected frame supplies its numeric values. */
export function translateStudy(record: ConceptStudy, t: StudyTranslate): ConceptStudy {
  return {
    ...record,
    authored: {
      ...record.authored,
      by: t(record.authored.by),
      reviewedBy: record.authored.reviewedBy.map((key) => t(key)),
    },
    intuition: { text: t(record.intuition.text), situation: t(record.intuition.situation) },
    example: {
      ...record.example,
      name: t(record.example.name),
      description: t(record.example.description),
    },
    mechanism: {
      steps: record.mechanism.steps.map(({ title, text }) => ({ title: t(title), text: t(text) })),
    },
    pseudocode: {
      ...record.pseudocode,
      ordinary: t(record.pseudocode.ordinary),
      rxjs: record.pseudocode.rxjs === null ? null : t(record.pseudocode.rxjs),
    },
    visual: record.visual
      ? { ...record.visual, textEquivalent: t(record.visual.textEquivalent) }
      : null,
    implementations: record.implementations.map((entry) => ({
      ...entry,
      project: t(entry.project),
      relevance: t(entry.relevance),
      explanation: t(entry.explanation),
    })),
    references: record.references.map((entry) => ({
      ...entry,
      title: t(entry.title),
      supports: t(entry.supports),
    })),
    limits: record.limits.map((key) => t(key)),
    nearby: record.nearby.map((entry) => ({ ...entry, why: t(entry.why) })),
  };
}
