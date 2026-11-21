import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'baseline',
      label: 'studyTt.effective-team-size.model.nodes.baseline',
      lane: 0,
    },
    {
      id: 'expanded',
      label: 'studyTt.effective-team-size.model.nodes.expanded',
      lane: 1,
    },
    {
      id: 'seat-holds',
      label: 'studyTt.effective-team-size.model.nodes.seat-holds',
      lane: 0,
    },
    {
      id: 'waitlist',
      label: 'studyTt.effective-team-size.model.nodes.waitlist',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'grow',
      from: 'baseline',
      to: 'expanded',
      label: 'studyTt.effective-team-size.model.relations.grow',
    },
    {
      id: 'seat-holds-team',
      from: 'expanded',
      to: 'seat-holds',
      label: 'studyTt.effective-team-size.model.relations.seat-holds-team',
    },
    {
      id: 'waitlist-team',
      from: 'expanded',
      to: 'waitlist',
      label: 'studyTt.effective-team-size.model.relations.waitlist-team',
    },
    {
      id: 'release-seat',
      from: 'seat-holds',
      to: 'waitlist',
      label: 'studyTt.effective-team-size.model.relations.release-seat',
    },
  ],
  steps: [
    {
      id: 'baseline',
      focus: {
        node: 'baseline',
      },
      note: 'studyTt.effective-team-size.model.steps.baseline',
    },
    {
      id: 'growth',
      focus: {
        relation: 'grow',
      },
      note: 'studyTt.effective-team-size.model.steps.growth',
    },
    {
      id: 'split',
      focus: {
        relation: 'seat-holds-team',
      },
      note: 'studyTt.effective-team-size.model.steps.split',
    },
    {
      id: 'handoff',
      focus: {
        relation: 'release-seat',
      },
      note: 'studyTt.effective-team-size.model.steps.handoff',
    },
  ],
  moments: [
    {
      step: 'baseline',
      label: 'studyTt.effective-team-size.model.moments.baseline',
    },
    {
      step: 'growth',
      label: 'studyTt.effective-team-size.model.moments.growth',
    },
    {
      step: 'split',
      label: 'studyTt.effective-team-size.model.moments.split',
    },
    {
      step: 'handoff',
      label: 'studyTt.effective-team-size.model.moments.handoff',
    },
  ],
  caption: 'studyTt.effective-team-size.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
