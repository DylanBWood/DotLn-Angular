import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'levels',
  nodes: [
    {
      id: 'hook',
      label: 'studyGeb.levels-of-description.model.nodes.hook',
    },
    {
      id: 'gate',
      label: 'studyGeb.levels-of-description.model.nodes.gate',
    },
    {
      id: 'order',
      label: 'studyGeb.levels-of-description.model.nodes.order',
    },
    {
      id: 'pass',
      label: 'studyGeb.levels-of-description.model.nodes.pass',
    },
  ],
  relations: [
    {
      id: 'same-run',
      from: 'hook',
      to: 'gate',
      label: 'studyGeb.levels-of-description.model.relations.same-run',
    },
    {
      id: 'criterion',
      from: 'gate',
      to: 'order',
      label: 'studyGeb.levels-of-description.model.relations.criterion',
    },
    {
      id: 'sequence',
      from: 'order',
      to: 'pass',
      label: 'studyGeb.levels-of-description.model.relations.sequence',
    },
  ],
  steps: [
    {
      id: 'refusal',
      focus: {
        node: 'hook',
      },
      note: 'studyGeb.levels-of-description.model.steps.refusal',
    },
    {
      id: 'result',
      focus: {
        node: 'gate',
      },
      note: 'studyGeb.levels-of-description.model.steps.result',
    },
    {
      id: 'promise',
      focus: {
        node: 'order',
      },
      note: 'studyGeb.levels-of-description.model.steps.promise',
    },
    {
      id: 'dependency',
      focus: {
        node: 'pass',
      },
      note: 'studyGeb.levels-of-description.model.steps.dependency',
    },
  ],
  moments: [
    {
      step: 'refusal',
      label: 'studyGeb.levels-of-description.model.moments.refusal',
    },
    {
      step: 'result',
      label: 'studyGeb.levels-of-description.model.moments.result',
    },
    {
      step: 'promise',
      label: 'studyGeb.levels-of-description.model.moments.promise',
    },
    {
      step: 'dependency',
      label: 'studyGeb.levels-of-description.model.moments.dependency',
    },
  ],
  caption: 'studyGeb.levels-of-description.model.caption',
  specimen: {
    title: 'studyGeb.levels-of-description.model.specimen.title',
    source: 'studyGeb.levels-of-description.model.specimen.source',
    reading: 'studyGeb.levels-of-description.model.specimen.reading',
    question: 'studyGeb.levels-of-description.model.specimen.question',
    answer: 'studyGeb.levels-of-description.model.specimen.answer',
    samples: ['studyGeb.levels-of-description.model.specimen.samples.item0'],
  },
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
