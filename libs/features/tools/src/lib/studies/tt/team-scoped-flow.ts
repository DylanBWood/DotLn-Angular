import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'request',
      label: 'studyTt.team-scoped-flow.model.nodes.request',
      lane: 0,
    },
    {
      id: 'renewals',
      label: 'studyTt.team-scoped-flow.model.nodes.renewals',
      lane: 1,
    },
    {
      id: 'billing',
      label: 'studyTt.team-scoped-flow.model.nodes.billing',
      lane: 0,
    },
    {
      id: 'mail-gateway',
      label: 'studyTt.team-scoped-flow.model.nodes.mail-gateway',
      lane: 1,
    },
    {
      id: 'messaging',
      label: 'studyTt.team-scoped-flow.model.nodes.messaging',
      lane: 0,
    },
    {
      id: 'live',
      label: 'studyTt.team-scoped-flow.model.nodes.live',
      lane: 1,
    },
    {
      id: 'release',
      label: 'studyTt.team-scoped-flow.model.nodes.release',
      lane: 0,
    },
  ],
  relations: [
    {
      id: 'specialist-intake',
      from: 'request',
      to: 'billing',
      label: 'studyTt.team-scoped-flow.model.relations.specialist-intake',
    },
    {
      id: 'rule-handoff',
      from: 'billing',
      to: 'messaging',
      label: 'studyTt.team-scoped-flow.model.relations.rule-handoff',
    },
    {
      id: 'release-handoff',
      from: 'messaging',
      to: 'release',
      label: 'studyTt.team-scoped-flow.model.relations.release-handoff',
    },
    {
      id: 'specialist-deploy',
      from: 'release',
      to: 'live',
      label: 'studyTt.team-scoped-flow.model.relations.specialist-deploy',
    },
    {
      id: 'renewals-intake',
      from: 'request',
      to: 'renewals',
      label: 'studyTt.team-scoped-flow.model.relations.renewals-intake',
    },
    {
      id: 'gateway-contract',
      from: 'renewals',
      to: 'mail-gateway',
      label: 'studyTt.team-scoped-flow.model.relations.gateway-contract',
    },
    {
      id: 'renewals-deploy',
      from: 'renewals',
      to: 'live',
      label: 'studyTt.team-scoped-flow.model.relations.renewals-deploy',
    },
  ],
  steps: [
    {
      id: 'request',
      focus: {
        relation: 'specialist-intake',
      },
      note: 'studyTt.team-scoped-flow.model.steps.request',
    },
    {
      id: 'schedule',
      focus: {
        relation: 'rule-handoff',
      },
      note: 'studyTt.team-scoped-flow.model.steps.schedule',
    },
    {
      id: 'queue',
      focus: {
        relation: 'release-handoff',
      },
      note: 'studyTt.team-scoped-flow.model.steps.queue',
    },
    {
      id: 'specialist-live',
      focus: {
        relation: 'specialist-deploy',
      },
      note: 'studyTt.team-scoped-flow.model.steps.specialist-live',
    },
    {
      id: 'redraw',
      focus: {
        relation: 'renewals-intake',
      },
      note: 'studyTt.team-scoped-flow.model.steps.redraw',
    },
    {
      id: 'service',
      focus: {
        relation: 'gateway-contract',
      },
      note: 'studyTt.team-scoped-flow.model.steps.service',
    },
    {
      id: 'renewals-live',
      focus: {
        relation: 'renewals-deploy',
      },
      note: 'studyTt.team-scoped-flow.model.steps.renewals-live',
    },
  ],
  moments: [
    {
      step: 'request',
      label: 'studyTt.team-scoped-flow.model.moments.request',
    },
    {
      step: 'queue',
      label: 'studyTt.team-scoped-flow.model.moments.queue',
    },
    {
      step: 'redraw',
      label: 'studyTt.team-scoped-flow.model.moments.redraw',
    },
    {
      step: 'renewals-live',
      label: 'studyTt.team-scoped-flow.model.moments.renewals-live',
    },
  ],
  caption: 'studyTt.team-scoped-flow.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
