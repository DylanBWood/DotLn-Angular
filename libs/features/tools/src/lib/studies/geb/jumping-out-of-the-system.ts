import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'levels',
  nodes: [
    {
      id: 'start',
      label: 'studyGeb.jumping-out-of-the-system.model.nodes.start',
    },
    {
      id: 'trial',
      label: 'studyGeb.jumping-out-of-the-system.model.nodes.trial',
    },
    {
      id: 'target',
      label: 'studyGeb.jumping-out-of-the-system.model.nodes.target',
    },
    {
      id: 'invariant',
      label: 'studyGeb.jumping-out-of-the-system.model.nodes.invariant',
    },
  ],
  relations: [
    {
      id: 'rewrite',
      from: 'start',
      to: 'trial',
      label: 'studyGeb.jumping-out-of-the-system.model.relations.rewrite',
    },
    {
      id: 'inspect',
      from: 'trial',
      to: 'invariant',
      label: 'studyGeb.jumping-out-of-the-system.model.relations.inspect',
    },
    {
      id: 'return',
      from: 'invariant',
      to: 'target',
      label: 'studyGeb.jumping-out-of-the-system.model.relations.return',
    },
  ],
  steps: [
    {
      id: 'try-rewrites',
      focus: {
        relation: 'rewrite',
      },
      note: 'studyGeb.jumping-out-of-the-system.model.steps.try-rewrites',
    },
    {
      id: 'count',
      focus: {
        relation: 'inspect',
      },
      note: 'studyGeb.jumping-out-of-the-system.model.steps.count',
    },
    {
      id: 'check-rules',
      focus: {
        node: 'invariant',
      },
      note: 'studyGeb.jumping-out-of-the-system.model.steps.check-rules',
    },
    {
      id: 'rule-out-target',
      focus: {
        relation: 'return',
      },
      note: 'studyGeb.jumping-out-of-the-system.model.steps.rule-out-target',
    },
  ],
  moments: [
    {
      step: 'try-rewrites',
      label: 'studyGeb.jumping-out-of-the-system.model.moments.try-rewrites',
    },
    {
      step: 'count',
      label: 'studyGeb.jumping-out-of-the-system.model.moments.count',
    },
    {
      step: 'check-rules',
      label: 'studyGeb.jumping-out-of-the-system.model.moments.check-rules',
    },
    {
      step: 'rule-out-target',
      label: 'studyGeb.jumping-out-of-the-system.model.moments.rule-out-target',
    },
  ],
  caption: 'studyGeb.jumping-out-of-the-system.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
