import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'checkout',
      label: 'studyTt.collaboration-mode.model.nodes.checkout',
      lane: 0,
    },
    {
      id: 'release-platform',
      label: 'studyTt.collaboration-mode.model.nodes.release-platform',
      lane: 1,
    },
    {
      id: 'preview-api',
      label: 'studyTt.collaboration-mode.model.nodes.preview-api',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'share-builds',
      from: 'checkout',
      to: 'release-platform',
      label: 'studyTt.collaboration-mode.model.relations.share-builds',
    },
    {
      id: 'try-prototype',
      from: 'release-platform',
      to: 'checkout',
      label: 'studyTt.collaboration-mode.model.relations.try-prototype',
    },
    {
      id: 'try-from-docs',
      from: 'checkout',
      to: 'preview-api',
      label: 'studyTt.collaboration-mode.model.relations.try-from-docs',
    },
    {
      id: 'publish-api',
      from: 'release-platform',
      to: 'preview-api',
      label: 'studyTt.collaboration-mode.model.relations.publish-api',
    },
  ],
  steps: [
    {
      id: 'scope',
      focus: {
        node: 'checkout',
      },
      note: 'studyTt.collaboration-mode.model.steps.scope',
    },
    {
      id: 'share',
      focus: {
        relation: 'share-builds',
      },
      note: 'studyTt.collaboration-mode.model.steps.share',
    },
    {
      id: 'revise',
      focus: {
        relation: 'try-prototype',
      },
      note: 'studyTt.collaboration-mode.model.steps.revise',
    },
    {
      id: 'prove',
      focus: {
        relation: 'try-from-docs',
      },
      note: 'studyTt.collaboration-mode.model.steps.prove',
    },
    {
      id: 'close',
      focus: {
        relation: 'publish-api',
      },
      note: 'studyTt.collaboration-mode.model.steps.close',
    },
  ],
  moments: [
    {
      step: 'scope',
      label: 'studyTt.collaboration-mode.model.moments.scope',
    },
    {
      step: 'revise',
      label: 'studyTt.collaboration-mode.model.moments.revise',
    },
    {
      step: 'prove',
      label: 'studyTt.collaboration-mode.model.moments.prove',
    },
    {
      step: 'close',
      label: 'studyTt.collaboration-mode.model.moments.close',
    },
  ],
  caption: 'studyTt.collaboration-mode.model.caption',
  specimen: {
    title: 'studyTt.collaboration-mode.model.specimen.title',
    source: 'studyTt.collaboration-mode.model.specimen.source',
    reading: 'studyTt.collaboration-mode.model.specimen.reading',
    question: 'studyTt.collaboration-mode.model.specimen.question',
    answer: 'studyTt.collaboration-mode.model.specimen.answer',
    samples: [
      'studyTt.collaboration-mode.model.specimen.samples.item0',
      'studyTt.collaboration-mode.model.specimen.samples.item1',
    ],
  },
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
