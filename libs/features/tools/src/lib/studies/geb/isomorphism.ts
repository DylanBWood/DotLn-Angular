import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';

export const example: RelationsExample = {
  layout: 'columns',
  nodes: [
    {
      id: 'wordPair',
      label: 'studyGeb.isomorphism.model.nodes.wordPair',
      lane: 0,
    },
    {
      id: 'codePair',
      label: 'studyGeb.isomorphism.model.nodes.codePair',
      lane: 1,
    },
    {
      id: 'word',
      label: 'studyGeb.isomorphism.model.nodes.word',
      lane: 0,
    },
    {
      id: 'code',
      label: 'studyGeb.isomorphism.model.nodes.code',
      lane: 1,
    },
    {
      id: 'probe',
      label: 'studyGeb.isomorphism.model.nodes.probe',
      lane: 1,
    },
  ],
  relations: [
    {
      id: 'joinWords',
      from: 'wordPair',
      to: 'word',
      label: 'studyGeb.isomorphism.model.relations.joinWords',
    },
    {
      id: 'encodeWord',
      from: 'word',
      to: 'code',
      label: 'studyGeb.isomorphism.model.relations.encodeWord',
    },
    {
      id: 'encodePair',
      from: 'wordPair',
      to: 'codePair',
      label: 'studyGeb.isomorphism.model.relations.encodePair',
    },
    {
      id: 'joinCodes',
      from: 'codePair',
      to: 'code',
      label: 'studyGeb.isomorphism.model.relations.joinCodes',
    },
    {
      id: 'decode',
      from: 'code',
      to: 'word',
      label: 'studyGeb.isomorphism.model.relations.decode',
    },
  ],
  steps: [
    {
      id: 'wordsFirst',
      focus: {
        relation: 'joinWords',
      },
      note: 'studyGeb.isomorphism.model.steps.wordsFirst',
    },
    {
      id: 'encodeJoinedWord',
      focus: {
        relation: 'encodeWord',
      },
      note: 'studyGeb.isomorphism.model.steps.encodeJoinedWord',
    },
    {
      id: 'codesFirst',
      focus: {
        relation: 'encodePair',
      },
      note: 'studyGeb.isomorphism.model.steps.codesFirst',
    },
    {
      id: 'combineSeparateCodes',
      focus: {
        relation: 'joinCodes',
      },
      note: 'studyGeb.isomorphism.model.steps.combineSeparateCodes',
    },
    {
      id: 'recoverTheWord',
      focus: {
        relation: 'decode',
      },
      note: 'studyGeb.isomorphism.model.steps.recoverTheWord',
    },
    {
      id: 'outsideTheImage',
      focus: {
        node: 'probe',
      },
      note: 'studyGeb.isomorphism.model.steps.outsideTheImage',
    },
  ],
  moments: [
    {
      step: 'wordsFirst',
      label: 'studyGeb.isomorphism.model.moments.wordsFirst',
    },
    {
      step: 'codesFirst',
      label: 'studyGeb.isomorphism.model.moments.codesFirst',
    },
    {
      step: 'recoverTheWord',
      label: 'studyGeb.isomorphism.model.moments.recoverTheWord',
    },
    {
      step: 'outsideTheImage',
      label: 'studyGeb.isomorphism.model.moments.outsideTheImage',
    },
  ],
  caption: 'studyGeb.isomorphism.model.caption',
};

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel =>
  relationsModel(example, t, parameters);
