import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'levels',
  nodes: [
    {
      id: 'gallery',
      label: 'studyGeb.strange-loop.model.nodes.gallery',
    },
    {
      id: 'seaport-print',
      label: 'studyGeb.strange-loop.model.nodes.seaport-print',
    },
    {
      id: 'seaport-scene',
      label: 'studyGeb.strange-loop.model.nodes.seaport-scene',
    },
  ],
  relations: [
    {
      id: 'exhibits',
      from: 'gallery',
      to: 'seaport-print',
      label: 'studyGeb.strange-loop.model.relations.exhibits',
    },
    {
      id: 'depicts',
      from: 'seaport-print',
      to: 'seaport-scene',
      label: 'studyGeb.strange-loop.model.relations.depicts',
    },
    {
      id: 'return',
      from: 'seaport-scene',
      to: 'gallery',
      label: 'studyGeb.strange-loop.model.relations.return',
    },
  ],
  steps: [
    {
      id: 'begin',
      focus: {
        node: 'gallery',
      },
      note: 'studyGeb.strange-loop.model.steps.begin',
    },
    {
      id: 'look',
      focus: {
        relation: 'exhibits',
      },
      note: 'studyGeb.strange-loop.model.steps.look',
    },
    {
      id: 'read',
      focus: {
        relation: 'depicts',
      },
      note: 'studyGeb.strange-loop.model.steps.read',
    },
    {
      id: 'recognize',
      focus: {
        relation: 'return',
      },
      note: 'studyGeb.strange-loop.model.steps.recognize',
    },
    {
      id: 'back',
      focus: {
        node: 'gallery',
      },
      note: 'studyGeb.strange-loop.model.steps.back',
    },
  ],
  moments: [
    {
      step: 'begin',
      label: 'studyGeb.strange-loop.model.moments.begin',
    },
    {
      step: 'read',
      label: 'studyGeb.strange-loop.model.moments.read',
    },
    {
      step: 'back',
      label: 'studyGeb.strange-loop.model.moments.back',
    },
  ],
  caption: 'studyGeb.strange-loop.model.caption',
  specimen: {
    title: 'studyGeb.strange-loop.model.specimen.title',
    source: 'studyGeb.strange-loop.model.specimen.source',
    reading: 'studyGeb.strange-loop.model.specimen.reading',
    question: 'studyGeb.strange-loop.model.specimen.question',
    answer: 'studyGeb.strange-loop.model.specimen.answer',
    samples: [
      'studyGeb.strange-loop.model.specimen.samples.item0',
      'studyGeb.strange-loop.model.specimen.samples.item1',
    ],
  },
  sourceUrl: 'https://www.escherinhetpaleis.nl/en/about-escher/masterpieces/print-gallery',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
