import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'customer-reports',
      label: 'studyTt.organizational-sensing.model.nodes.customer-reports',
      lane: 0,
    },
    {
      id: 'decoder-logs',
      label: 'studyTt.organizational-sensing.model.nodes.decoder-logs',
      lane: 0,
    },
    {
      id: 'ticket-handoffs',
      label: 'studyTt.organizational-sensing.model.nodes.ticket-handoffs',
      lane: 0,
    },
    {
      id: 'incident-review',
      label: 'studyTt.organizational-sensing.model.nodes.incident-review',
      lane: 1,
    },
    {
      id: 'triage-trial',
      label: 'studyTt.organizational-sensing.model.nodes.triage-trial',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'report-stale-update',
      from: 'customer-reports',
      to: 'incident-review',
      label: 'studyTt.organizational-sensing.model.relations.report-stale-update',
    },
    {
      id: 'show-rejects',
      from: 'decoder-logs',
      to: 'incident-review',
      label: 'studyTt.organizational-sensing.model.relations.show-rejects',
    },
    {
      id: 'show-handoffs',
      from: 'ticket-handoffs',
      to: 'incident-review',
      label: 'studyTt.organizational-sensing.model.relations.show-handoffs',
    },
    {
      id: 'start-trial',
      from: 'incident-review',
      to: 'triage-trial',
      label: 'studyTt.organizational-sensing.model.relations.start-trial',
    },
    {
      id: 'return-findings',
      from: 'triage-trial',
      to: 'incident-review',
      label: 'studyTt.organizational-sensing.model.relations.return-findings',
    },
  ],
  steps: [
    {
      id: 'stale-parcels',
      focus: {
        relation: 'report-stale-update',
      },
      note: 'studyTt.organizational-sensing.model.steps.stale-parcels',
    },
    {
      id: 'decoder-rejects',
      focus: {
        relation: 'show-rejects',
      },
      note: 'studyTt.organizational-sensing.model.steps.decoder-rejects',
    },
    {
      id: 'bounced-tickets',
      focus: {
        relation: 'show-handoffs',
      },
      note: 'studyTt.organizational-sensing.model.steps.bounced-tickets',
    },
    {
      id: 'first-responder-trial',
      focus: {
        relation: 'start-trial',
      },
      note: 'studyTt.organizational-sensing.model.steps.first-responder-trial',
    },
    {
      id: 'follow-up',
      focus: {
        relation: 'return-findings',
      },
      note: 'studyTt.organizational-sensing.model.steps.follow-up',
    },
  ],
  moments: [
    {
      step: 'stale-parcels',
      label: 'studyTt.organizational-sensing.model.moments.stale-parcels',
    },
    {
      step: 'bounced-tickets',
      label: 'studyTt.organizational-sensing.model.moments.bounced-tickets',
    },
    {
      step: 'first-responder-trial',
      label: 'studyTt.organizational-sensing.model.moments.first-responder-trial',
    },
    {
      step: 'follow-up',
      label: 'studyTt.organizational-sensing.model.moments.follow-up',
    },
  ],
  caption: 'studyTt.organizational-sensing.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
