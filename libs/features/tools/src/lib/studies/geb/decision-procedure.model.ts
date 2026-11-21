import type { StudyParameters } from '@dotln-angular/models';

import { type KindTable, matchKind } from '../match-kind';
import { type RelationsExample, relationsModel, type RelationStep } from '../relations';
import type { RelationsStudyModel, StudyInput } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type Lantern,
  lanterns,
  readParameters,
  type RelayRule,
  type RelayRun,
  relayRun,
  type RelayStep,
} from './decision-procedure.simulation';

const lanternNodes = {
  dock: { label: 'studyGeb.decision-procedure.model.lanterns.dock', lane: 0 },
  steps: { label: 'studyGeb.decision-procedure.model.lanterns.steps', lane: 0 },
  bell: { label: 'studyGeb.decision-procedure.model.lanterns.bell', lane: 0 },
  beacon: { label: 'studyGeb.decision-procedure.model.lanterns.beacon', lane: 1 },
  cove: { label: 'studyGeb.decision-procedure.model.lanterns.cove', lane: 1 },
} as const satisfies Readonly<Record<Lantern, { label: string; lane: 0 | 1 }>>;

const ruleId = ({ from, to }: RelayRule): string => `${from}-${to}`;

const stepViews = {
  seed: ({ lantern }) => ({
    id: 'seed',
    focus: { node: lantern },
    note: {
      key: 'studyGeb.decision-procedure.model.notes.seed',
      messages: { lantern: lanternNodes[lantern].label },
    },
  }),
  rule: ({ rule, discovered }) => ({
    id: `rule-${ruleId(rule)}`,
    focus: { relation: ruleId(rule) },
    note: {
      key: discovered
        ? 'studyGeb.decision-procedure.model.notes.lights'
        : 'studyGeb.decision-procedure.model.notes.known',
      messages: { from: lanternNodes[rule.from].label, to: lanternNodes[rule.to].label },
    },
  }),
  verdict: ({ lantern, derived }) => ({
    id: `verdict-${lantern}`,
    focus: { node: lantern },
    note: {
      key: derived
        ? 'studyGeb.decision-procedure.model.notes.yes'
        : 'studyGeb.decision-procedure.model.notes.no',
      messages: { lantern: lanternNodes[lantern].label },
    },
  }),
} satisfies KindTable<RelayStep, RelationStep>;

function relayExample(run: RelayRun): RelationsExample {
  return {
    layout: 'columns',
    nodes: lanterns.map((id) => ({ id, ...lanternNodes[id] })),
    relations: run.rules.map((rule) => ({
      ...rule,
      id: ruleId(rule),
      label: 'studyGeb.decision-procedure.model.wire',
    })),
    steps: run.steps.map((step) => matchKind<RelayStep, RelationStep>(step, stepViews)),
    moments: [
      { step: 'seed', label: 'studyGeb.decision-procedure.model.moments.seed' },
      { step: 'rule-bell-steps', label: 'studyGeb.decision-procedure.model.moments.cycle' },
      { step: 'verdict-beacon', label: 'studyGeb.decision-procedure.model.moments.beacon' },
      { step: 'verdict-cove', label: 'studyGeb.decision-procedure.model.moments.cove' },
    ],
    caption: 'studyGeb.decision-procedure.model.caption',
  };
}

const coveWireInput = (t: StudyTranslate): StudyInput => ({
  name: 'coveWire',
  label: t('studyGeb.decision-procedure.model.input.label'),
  unit: t('studyGeb.decision-procedure.model.input.unit'),
  min: 0,
  max: 1,
  step: 1,
});

export const model = (parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel => {
  const run = relayRun(readParameters(parameters));
  return { ...relationsModel(relayExample(run), t), inputs: [coveWireInput(t)] };
};
