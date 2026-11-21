import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'pa-proofs',
      label: 'studyGeb.sentence-g.model.nodes.pa-proofs',
      lane: 0,
    },
    {
      id: 'proof-codes',
      label: 'studyGeb.sentence-g.model.nodes.proof-codes',
      lane: 1,
    },
    {
      id: 'formula-b',
      label: 'studyGeb.sentence-g.model.nodes.formula-b',
      lane: 0,
    },
    {
      id: 'consistency',
      label: 'studyGeb.sentence-g.model.nodes.consistency',
      lane: 1,
    },
    {
      id: 'sentence-g',
      label: 'studyGeb.sentence-g.model.nodes.sentence-g',
      lane: 0,
    },
    {
      id: 'natural-numbers',
      label: 'studyGeb.sentence-g.model.nodes.natural-numbers',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'encode',
      from: 'pa-proofs',
      to: 'proof-codes',
      label: 'studyGeb.sentence-g.model.relations.encode',
    },
    {
      id: 'describe',
      from: 'formula-b',
      to: 'proof-codes',
      label: 'studyGeb.sentence-g.model.relations.describe',
    },
    {
      id: 'substitute',
      from: 'formula-b',
      to: 'sentence-g',
      label: 'studyGeb.sentence-g.model.relations.substitute',
    },
    {
      id: 'rule-out',
      from: 'consistency',
      to: 'sentence-g',
      label: 'studyGeb.sentence-g.model.relations.rule-out',
    },
    {
      id: 'interpret',
      from: 'natural-numbers',
      to: 'sentence-g',
      label: 'studyGeb.sentence-g.model.relations.interpret',
    },
  ],
  steps: [
    {
      id: 'encode-proof',
      focus: {
        relation: 'encode',
      },
      note: 'studyGeb.sentence-g.model.steps.encode-proof',
    },
    {
      id: 'make-template',
      focus: {
        relation: 'describe',
      },
      note: 'studyGeb.sentence-g.model.steps.make-template',
    },
    {
      id: 'close-template',
      focus: {
        relation: 'substitute',
      },
      note: 'studyGeb.sentence-g.model.steps.close-template',
    },
    {
      id: 'assume-consistency',
      focus: {
        relation: 'rule-out',
      },
      note: 'studyGeb.sentence-g.model.steps.assume-consistency',
    },
    {
      id: 'read-truth',
      focus: {
        relation: 'interpret',
      },
      note: 'studyGeb.sentence-g.model.steps.read-truth',
    },
  ],
  moments: [
    {
      step: 'encode-proof',
      label: 'studyGeb.sentence-g.model.moments.encode-proof',
    },
    {
      step: 'close-template',
      label: 'studyGeb.sentence-g.model.moments.close-template',
    },
    {
      step: 'assume-consistency',
      label: 'studyGeb.sentence-g.model.moments.assume-consistency',
    },
    {
      step: 'read-truth',
      label: 'studyGeb.sentence-g.model.moments.read-truth',
    },
  ],
  caption: 'studyGeb.sentence-g.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
