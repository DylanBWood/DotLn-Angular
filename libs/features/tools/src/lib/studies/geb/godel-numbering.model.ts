import type { StudyParameters } from '@dotln-angular/models';

import { type KindTable, matchKind } from '../match-kind';
import { type RelationsExample, relationsModel, type RelationStep } from '../relations';
import type { StudyMessage } from '../study-message';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type AlphabetSymbol,
  type DecodedCode,
  type GodelNumberingRun,
  godelNumberingRun,
  readParameters,
} from './godel-numbering.simulation';

const symbolLabel = {
  L: 'studyGeb.godel-numbering.model.symbol.left',
  R: 'studyGeb.godel-numbering.model.symbol.right',
} satisfies Record<AlphabetSymbol, string>;

function wordLabel(word: readonly AlphabetSymbol[], t: StudyTranslate): string {
  if (word.length === 0) return t('studyGeb.godel-numbering.model.emptyWord');
  return word.map((symbol) => t(symbolLabel[symbol])).join('');
}

function nodesOf(run: GodelNumberingRun, t: StudyTranslate): RelationsExample['nodes'] {
  const wordNode = (word: readonly AlphabetSymbol[]): StudyMessage =>
    word.length
      ? { key: 'studyGeb.godel-numbering.model.node.word', params: { word: wordLabel(word, t) } }
      : 'studyGeb.godel-numbering.model.emptyWord';
  const nodes: RelationsExample['nodes'] = [
    {
      id: 'wordPair',
      lane: 0,
      label: {
        key: 'studyGeb.godel-numbering.model.node.wordPair',
        params: {
          left: wordLabel(run.example.leftWord, t),
          right: wordLabel(run.example.rightWord, t),
        },
      },
    },
    {
      id: 'codePair',
      lane: 1,
      label: {
        key: 'studyGeb.godel-numbering.model.node.codePair',
        params: { left: run.leftCode.toString(), right: run.rightCode.toString() },
      },
    },
    {
      id: 'word',
      lane: 0,
      label: wordNode(run.joinedWord),
    },
    {
      id: 'code',
      lane: 1,
      label: {
        key: 'studyGeb.godel-numbering.model.node.code',
        params: { code: run.joined.code.toString() },
      },
    },
    {
      id: 'probe',
      lane: 1,
      label: {
        key: 'studyGeb.godel-numbering.model.node.probe',
        params: { code: run.example.probeCode.toString() },
      },
    },
  ];

  return run.probe.kind === 'word'
    ? [
        ...nodes,
        {
          id: 'probeWord',
          lane: 0,
          label: wordNode(run.probe.word),
        },
      ]
    : nodes;
}

const links = [
  {
    id: 'joinWords',
    from: 'wordPair',
    to: 'word',
    label: 'studyGeb.godel-numbering.model.link.joinWords',
  },
  {
    id: 'encodeWord',
    from: 'word',
    to: 'code',
    label: 'studyGeb.godel-numbering.model.link.encodeWord',
  },
  {
    id: 'encodePair',
    from: 'wordPair',
    to: 'codePair',
    label: 'studyGeb.godel-numbering.model.link.encodePair',
  },
  {
    id: 'joinCodes',
    from: 'codePair',
    to: 'code',
    label: 'studyGeb.godel-numbering.model.link.joinCodes',
  },
  { id: 'decode', from: 'code', to: 'word', label: 'studyGeb.godel-numbering.model.link.decode' },
] as const satisfies RelationsExample['relations'];

function probeStep(run: GodelNumberingRun, t: StudyTranslate): RelationStep {
  const notes = {
    word: ({ word }) => ({
      key: 'studyGeb.godel-numbering.model.step.probeWord',
      params: { word: wordLabel(word, t) },
    }),
    negative: () => 'studyGeb.godel-numbering.model.step.probeNegative',
    zeroDigit: ({ remaining }) => ({
      key: 'studyGeb.godel-numbering.model.step.probeZeroDigit',
      params: { dividend: remaining.toString(), ternary: run.example.probeCode.toString(3) },
    }),
  } satisfies KindTable<DecodedCode, StudyMessage>;

  return {
    id: 'probe',
    focus: run.probe.kind === 'word' ? { relation: 'decodeProbe' } : { node: 'probe' },
    note: matchKind<DecodedCode, StudyMessage>(run.probe, notes),
  };
}

function stepsOf(run: GodelNumberingRun, t: StudyTranslate): readonly RelationStep[] {
  const code = run.joined.code.toString();
  return [
    {
      id: 'encode',
      focus: { relation: 'encodePair' },
      note: 'studyGeb.godel-numbering.model.step.encode',
    },
    {
      id: 'numbersFirst',
      focus: { relation: 'joinCodes' },
      note: {
        key: 'studyGeb.godel-numbering.model.step.joinCodes',
        params: {
          rightPlaces: run.joined.rightPlaces,
          left: run.leftCode.toString(),
          multiplier: run.joined.multiplier.toString(),
          right: run.rightCode.toString(),
          code,
        },
      },
    },
    {
      id: 'wordsFirst',
      focus: { relation: 'joinWords' },
      note: 'studyGeb.godel-numbering.model.step.joinWords',
    },
    {
      id: 'compare',
      focus: { relation: 'encodeWord' },
      note: {
        key: 'studyGeb.godel-numbering.model.step.compare',
        params: { codeFromWords: run.codeFromWords.toString(), codeFromNumbers: code },
      },
    },
    {
      id: 'reverse',
      focus: { relation: 'decode' },
      note: {
        key: 'studyGeb.godel-numbering.model.step.decode',
        params: { code, word: wordLabel(run.recovered, t) },
      },
    },
    probeStep(run, t),
  ];
}

function exampleOf(run: GodelNumberingRun, t: StudyTranslate): RelationsExample {
  return {
    layout: 'columns',
    nodes: nodesOf(run, t),
    relations:
      run.probe.kind === 'word'
        ? [
            ...links,
            {
              id: 'decodeProbe',
              from: 'probe',
              to: 'probeWord',
              label: 'studyGeb.godel-numbering.model.link.decode',
            },
          ]
        : links,
    steps: stepsOf(run, t),
    moments: [
      { step: 'encode', label: 'studyGeb.godel-numbering.model.moment.encode' },
      { step: 'numbersFirst', label: 'studyGeb.godel-numbering.model.moment.join' },
      { step: 'compare', label: 'studyGeb.godel-numbering.model.moment.compare' },
      { step: 'reverse', label: 'studyGeb.godel-numbering.model.moment.decode' },
      { step: 'probe', label: 'studyGeb.godel-numbering.model.moment.probe' },
    ],
    caption: 'studyGeb.godel-numbering.model.caption',
  };
}

export function model(parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel {
  const run = godelNumberingRun(readParameters(parameters));
  return {
    ...relationsModel(exampleOf(run, t), t),
    inputs: [
      {
        name: 'probeCode',
        label: t('studyGeb.godel-numbering.model.input.label'),
        unit: t('studyGeb.godel-numbering.model.input.unit'),
        min: 0,
        max: 12,
        step: 1,
      },
    ],
  };
}
