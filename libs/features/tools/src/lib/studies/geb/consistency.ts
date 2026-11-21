import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'clearance',
      label: 'studyGeb.consistency.model.nodes.clearance',
      lane: 0,
    },
    {
      id: 'bookable',
      label: 'studyGeb.consistency.model.nodes.bookable',
      lane: 1,
    },
    {
      id: 'projector',
      label: 'studyGeb.consistency.model.nodes.projector',
      lane: 0,
    },
    {
      id: 'unavailable',
      label: 'studyGeb.consistency.model.nodes.unavailable',
      lane: 1,
    },
    {
      id: 'hold',
      label: 'studyGeb.consistency.model.nodes.hold',
      lane: 0,
    },
  ],
  relations: [
    {
      id: 'clears',
      from: 'clearance',
      to: 'bookable',
      label: 'studyGeb.consistency.model.relations.clears',
    },
    {
      id: 'open-projector',
      from: 'bookable',
      to: 'projector',
      label: 'studyGeb.consistency.model.relations.open-projector',
    },
    {
      id: 'bars',
      from: 'hold',
      to: 'unavailable',
      label: 'studyGeb.consistency.model.relations.bars',
    },
    {
      id: 'conflict',
      from: 'bookable',
      to: 'unavailable',
      label: 'studyGeb.consistency.model.relations.conflict',
    },
  ],
  steps: [
    {
      id: 'clear',
      focus: {
        relation: 'clears',
      },
      note: 'studyGeb.consistency.model.steps.clear',
    },
    {
      id: 'witness',
      focus: {
        relation: 'open-projector',
      },
      note: 'studyGeb.consistency.model.steps.witness',
    },
    {
      id: 'hold',
      focus: {
        relation: 'bars',
      },
      note: 'studyGeb.consistency.model.steps.hold',
    },
    {
      id: 'compare',
      focus: {
        relation: 'conflict',
      },
      note: 'studyGeb.consistency.model.steps.compare',
    },
  ],
  moments: [
    {
      step: 'clear',
      label: 'studyGeb.consistency.model.moments.clear',
    },
    {
      step: 'witness',
      label: 'studyGeb.consistency.model.moments.witness',
    },
    {
      step: 'hold',
      label: 'studyGeb.consistency.model.moments.hold',
    },
    {
      step: 'compare',
      label: 'studyGeb.consistency.model.moments.compare',
    },
  ],
  caption: 'studyGeb.consistency.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
