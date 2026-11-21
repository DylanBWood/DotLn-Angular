import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'reliability',
      label: 'studyTt.facilitating-mode.model.nodes.reliability',
      lane: 0,
    },
    {
      id: 'returns',
      label: 'studyTt.facilitating-mode.model.nodes.returns',
      lane: 1,
    },
    {
      id: 'drill',
      label: 'studyTt.facilitating-mode.model.nodes.drill',
      lane: 0,
    },
    {
      id: 'runbook',
      label: 'studyTt.facilitating-mode.model.nodes.runbook',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'request',
      from: 'returns',
      to: 'reliability',
      label: 'studyTt.facilitating-mode.model.relations.request',
    },
    {
      id: 'teach',
      from: 'reliability',
      to: 'returns',
      label: 'studyTt.facilitating-mode.model.relations.teach',
    },
    {
      id: 'practice',
      from: 'returns',
      to: 'drill',
      label: 'studyTt.facilitating-mode.model.relations.practice',
    },
    {
      id: 'maintain',
      from: 'returns',
      to: 'runbook',
      label: 'studyTt.facilitating-mode.model.relations.maintain',
    },
  ],
  steps: [
    {
      id: 'agree',
      focus: {
        relation: 'request',
      },
      note: 'studyTt.facilitating-mode.model.steps.agree',
    },
    {
      id: 'demonstrate',
      focus: {
        relation: 'teach',
      },
      note: 'studyTt.facilitating-mode.model.steps.demonstrate',
    },
    {
      id: 'practice',
      focus: {
        relation: 'practice',
      },
      note: 'studyTt.facilitating-mode.model.steps.practice',
    },
    {
      id: 'independent',
      focus: {
        relation: 'practice',
      },
      note: 'studyTt.facilitating-mode.model.steps.independent',
    },
    {
      id: 'own',
      focus: {
        relation: 'maintain',
      },
      note: 'studyTt.facilitating-mode.model.steps.own',
    },
  ],
  moments: [
    {
      step: 'agree',
      label: 'studyTt.facilitating-mode.model.moments.agree',
    },
    {
      step: 'practice',
      label: 'studyTt.facilitating-mode.model.moments.practice',
    },
    {
      step: 'independent',
      label: 'studyTt.facilitating-mode.model.moments.independent',
    },
    {
      step: 'own',
      label: 'studyTt.facilitating-mode.model.moments.own',
    },
  ],
  caption: 'studyTt.facilitating-mode.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
