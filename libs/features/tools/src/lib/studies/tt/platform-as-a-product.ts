import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'delivery-teams',
      label: 'studyTt.platform-as-a-product.model.nodes.delivery-teams',
      lane: 0,
    },
    {
      id: 'preview-service',
      label: 'studyTt.platform-as-a-product.model.nodes.preview-service',
      lane: 1,
    },
    {
      id: 'platform-team',
      label: 'studyTt.platform-as-a-product.model.nodes.platform-team',
      lane: 0,
    },
  ],
  relations: [
    {
      id: 'use-preview',
      from: 'delivery-teams',
      to: 'preview-service',
      label: 'studyTt.platform-as-a-product.model.relations.use-preview',
    },
    {
      id: 'report-friction',
      from: 'delivery-teams',
      to: 'platform-team',
      label: 'studyTt.platform-as-a-product.model.relations.report-friction',
    },
    {
      id: 'ship-link',
      from: 'platform-team',
      to: 'preview-service',
      label: 'studyTt.platform-as-a-product.model.relations.ship-link',
    },
    {
      id: 'show-link',
      from: 'preview-service',
      to: 'delivery-teams',
      label: 'studyTt.platform-as-a-product.model.relations.show-link',
    },
  ],
  steps: [
    {
      id: 'first-use',
      focus: {
        relation: 'use-preview',
      },
      note: 'studyTt.platform-as-a-product.model.steps.first-use',
    },
    {
      id: 'support-signal',
      focus: {
        relation: 'report-friction',
      },
      note: 'studyTt.platform-as-a-product.model.steps.support-signal',
    },
    {
      id: 'roadmap-change',
      focus: {
        relation: 'ship-link',
      },
      note: 'studyTt.platform-as-a-product.model.steps.roadmap-change',
    },
    {
      id: 'retest',
      focus: {
        relation: 'show-link',
      },
      note: 'studyTt.platform-as-a-product.model.steps.retest',
    },
  ],
  moments: [
    {
      step: 'first-use',
      label: 'studyTt.platform-as-a-product.model.moments.first-use',
    },
    {
      step: 'support-signal',
      label: 'studyTt.platform-as-a-product.model.moments.support-signal',
    },
    {
      step: 'roadmap-change',
      label: 'studyTt.platform-as-a-product.model.moments.roadmap-change',
    },
    {
      step: 'retest',
      label: 'studyTt.platform-as-a-product.model.moments.retest',
    },
  ],
  caption: 'studyTt.platform-as-a-product.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
