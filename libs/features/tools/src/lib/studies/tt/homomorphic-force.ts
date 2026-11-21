import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'borrowing',
      label: 'studyTt.homomorphic-force.model.nodes.borrowing',
      lane: 0,
    },
    {
      id: 'messaging',
      label: 'studyTt.homomorphic-force.model.nodes.messaging',
      lane: 0,
    },
    {
      id: 'loan-policy',
      label: 'studyTt.homomorphic-force.model.nodes.loan-policy',
      lane: 1,
    },
    {
      id: 'reminder-job',
      label: 'studyTt.homomorphic-force.model.nodes.reminder-job',
      lane: 1,
    },
    {
      id: 'delivery-gateway',
      label: 'studyTt.homomorphic-force.model.nodes.delivery-gateway',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'agree',
      from: 'borrowing',
      to: 'messaging',
      label: 'studyTt.homomorphic-force.model.relations.agree',
    },
    {
      id: 'owns-policy',
      from: 'borrowing',
      to: 'loan-policy',
      label: 'studyTt.homomorphic-force.model.relations.owns-policy',
    },
    {
      id: 'owns-job',
      from: 'borrowing',
      to: 'reminder-job',
      label: 'studyTt.homomorphic-force.model.relations.owns-job',
    },
    {
      id: 'owns-gateway',
      from: 'messaging',
      to: 'delivery-gateway',
      label: 'studyTt.homomorphic-force.model.relations.owns-gateway',
    },
    {
      id: 'due-date',
      from: 'loan-policy',
      to: 'reminder-job',
      label: 'studyTt.homomorphic-force.model.relations.due-date',
    },
    {
      id: 'send-reminder',
      from: 'reminder-job',
      to: 'delivery-gateway',
      label: 'studyTt.homomorphic-force.model.relations.send-reminder',
    },
  ],
  steps: [
    {
      id: 'agreement',
      focus: {
        relation: 'agree',
      },
      note: 'studyTt.homomorphic-force.model.steps.agreement',
    },
    {
      id: 'ownership',
      focus: {
        relation: 'owns-job',
      },
      note: 'studyTt.homomorphic-force.model.steps.ownership',
    },
    {
      id: 'request',
      focus: {
        relation: 'send-reminder',
      },
      note: 'studyTt.homomorphic-force.model.steps.request',
    },
    {
      id: 'receipt',
      focus: {
        relation: 'agree',
      },
      note: 'studyTt.homomorphic-force.model.steps.receipt',
    },
  ],
  moments: [
    {
      step: 'agreement',
      label: 'studyTt.homomorphic-force.model.moments.agreement',
    },
    {
      step: 'ownership',
      label: 'studyTt.homomorphic-force.model.moments.ownership',
    },
    {
      step: 'request',
      label: 'studyTt.homomorphic-force.model.moments.request',
    },
    {
      step: 'receipt',
      label: 'studyTt.homomorphic-force.model.moments.receipt',
    },
  ],
  caption: 'studyTt.homomorphic-force.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
