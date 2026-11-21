import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'kettle-click',
      label: 'studyGeb.active-symbols.model.nodes.kettle-click',
      lane: 0,
    },
    {
      id: 'making-tea',
      label: 'studyGeb.active-symbols.model.nodes.making-tea',
      lane: 1,
    },
    {
      id: 'mug',
      label: 'studyGeb.active-symbols.model.nodes.mug',
      lane: 0,
    },
    {
      id: 'tea-bag',
      label: 'studyGeb.active-symbols.model.nodes.tea-bag',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'cue',
      from: 'kettle-click',
      to: 'making-tea',
      label: 'studyGeb.active-symbols.model.relations.cue',
    },
    {
      id: 'mug-link',
      from: 'making-tea',
      to: 'mug',
      label: 'studyGeb.active-symbols.model.relations.mug-link',
    },
    {
      id: 'tea-bag-link',
      from: 'making-tea',
      to: 'tea-bag',
      label: 'studyGeb.active-symbols.model.relations.tea-bag-link',
    },
  ],
  steps: [
    {
      id: 'hear',
      focus: {
        node: 'kettle-click',
      },
      note: 'studyGeb.active-symbols.model.steps.hear',
    },
    {
      id: 'think',
      focus: {
        relation: 'cue',
      },
      note: 'studyGeb.active-symbols.model.steps.think',
    },
    {
      id: 'consider-mug',
      focus: {
        relation: 'mug-link',
      },
      note: 'studyGeb.active-symbols.model.steps.consider-mug',
    },
    {
      id: 'consider-tea-bag',
      focus: {
        relation: 'tea-bag-link',
      },
      note: 'studyGeb.active-symbols.model.steps.consider-tea-bag',
    },
  ],
  moments: [
    {
      step: 'hear',
      label: 'studyGeb.active-symbols.model.moments.hear',
    },
    {
      step: 'think',
      label: 'studyGeb.active-symbols.model.moments.think',
    },
    {
      step: 'consider-tea-bag',
      label: 'studyGeb.active-symbols.model.moments.consider-tea-bag',
    },
  ],
  caption: 'studyGeb.active-symbols.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
