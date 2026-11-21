import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'checkout',
      label: 'studyTt.x-as-a-service-mode.model.nodes.checkout',
      lane: 0,
    },
    {
      id: 'release-platform',
      label: 'studyTt.x-as-a-service-mode.model.nodes.release-platform',
      lane: 1,
    },
    {
      id: 'preview-api',
      label: 'studyTt.x-as-a-service-mode.model.nodes.preview-api',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'maintain',
      from: 'release-platform',
      to: 'preview-api',
      label: 'studyTt.x-as-a-service-mode.model.relations.maintain',
    },
    {
      id: 'request',
      from: 'checkout',
      to: 'preview-api',
      label: 'studyTt.x-as-a-service-mode.model.relations.request',
    },
    {
      id: 'respond',
      from: 'preview-api',
      to: 'checkout',
      label: 'studyTt.x-as-a-service-mode.model.relations.respond',
    },
    {
      id: 'report',
      from: 'checkout',
      to: 'release-platform',
      label: 'studyTt.x-as-a-service-mode.model.relations.report',
    },
    {
      id: 'reopen',
      from: 'release-platform',
      to: 'checkout',
      label: 'studyTt.x-as-a-service-mode.model.relations.reopen',
    },
  ],
  steps: [
    {
      id: 'publish',
      focus: {
        relation: 'maintain',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.publish',
    },
    {
      id: 'call',
      focus: {
        relation: 'request',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.call',
    },
    {
      id: 'use',
      focus: {
        relation: 'respond',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.use',
    },
    {
      id: 'friction',
      focus: {
        relation: 'report',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.friction',
    },
    {
      id: 'discover',
      focus: {
        relation: 'reopen',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.discover',
    },
    {
      id: 'resume',
      focus: {
        relation: 'request',
      },
      note: 'studyTt.x-as-a-service-mode.model.steps.resume',
    },
  ],
  moments: [
    {
      step: 'publish',
      label: 'studyTt.x-as-a-service-mode.model.moments.publish',
    },
    {
      step: 'use',
      label: 'studyTt.x-as-a-service-mode.model.moments.use',
    },
    {
      step: 'friction',
      label: 'studyTt.x-as-a-service-mode.model.moments.friction',
    },
    {
      step: 'resume',
      label: 'studyTt.x-as-a-service-mode.model.moments.resume',
    },
  ],
  caption: 'studyTt.x-as-a-service-mode.model.caption',
  specimen: {
    title: 'studyTt.x-as-a-service-mode.model.specimen.title',
    source: 'studyTt.x-as-a-service-mode.model.specimen.source',
    reading: 'studyTt.x-as-a-service-mode.model.specimen.reading',
    question: 'studyTt.x-as-a-service-mode.model.specimen.question',
    answer: 'studyTt.x-as-a-service-mode.model.specimen.answer',
    samples: [
      'studyTt.x-as-a-service-mode.model.specimen.samples.item0',
      'studyTt.x-as-a-service-mode.model.specimen.samples.item1',
    ],
  },
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
