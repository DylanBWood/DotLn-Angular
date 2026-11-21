import type { StudyParameters } from '@dotln-angular/models';

import { drawEdge, placeNodes, type RelationColumn, type RelationLayout } from './relations-layout';
import { type StudyMessage, studyMessage } from './study-message';
import {
  type RelationEdge,
  type RelationFocus,
  type RelationFrame,
  type RelationNode,
  type RelationSpecimen,
  type RelationsStudyModel,
  secondsPerFrame,
} from './study-model';
import { fillValues } from './study-text';
import type { StudyTranslate } from './study-translate';

export interface RelationStep {
  readonly id: string;
  readonly focus: RelationFocus;
  readonly note: StudyMessage;
  readonly values?: Readonly<Record<string, number | StudyMessage>>;
}

/** Authored examples name what is related, why and in which order to examine it. */
export interface RelationsExample {
  readonly sourceUrl?: string;
  readonly specimen?: RelationSpecimen<StudyMessage>;
  readonly layout: RelationLayout;
  readonly nodes: readonly {
    readonly id: string;
    readonly label: StudyMessage;
    readonly lane?: RelationColumn;
  }[];
  readonly relations: readonly {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly label: StudyMessage;
  }[];
  readonly steps: readonly RelationStep[];
  readonly moments: readonly { readonly label: StudyMessage; readonly step: string }[];
  readonly caption: StudyMessage;
}

function byId<T extends { readonly id: string }>(items: readonly T[], kind: string) {
  const by = new Map(items.map((item) => [item.id, item]));
  if (by.size !== items.length) throw new Error(`Duplicate ${kind} id in the relation map.`);
  return (id: string) => {
    const item = by.get(id);
    if (!item) throw new Error(`The relation map has no ${kind} ${id}.`);
    return item;
  };
}

interface RelationMap {
  readonly parameters: Readonly<Record<string, string>>;
  readonly node: (id: string) => RelationNode;
  readonly edge: (id: string) => RelationEdge;
}

function describeFocus(focus: RelationFocus, map: RelationMap): string {
  if ('node' in focus) {
    if ('relation' in focus) throw new Error('A step must focus on exactly one node or relation.');
    return map.node(focus.node).label;
  }
  return map.edge(focus.relation).description;
}

function frameOf(
  step: RelationStep,
  index: number,
  map: RelationMap,
  t: StudyTranslate,
): RelationFrame {
  const note = fillValues(studyMessage(t, step.note), map.parameters);
  const values = Object.fromEntries(
    Object.entries(step.values ?? {}).map(([name, value]) => [
      name,
      typeof value === 'number' ? String(value) : studyMessage(t, value),
    ]),
  );
  return {
    focus: step.focus,
    seconds: index * secondsPerFrame,
    note,
    values: {
      ...map.parameters,
      ...values,
      step: String(index),
      focus: describeFocus(step.focus, map),
      note,
    },
  };
}

function translateSpecimen(
  specimen: RelationSpecimen<StudyMessage>,
  t: StudyTranslate,
): RelationSpecimen {
  return {
    title: studyMessage(t, specimen.title),
    source: studyMessage(t, specimen.source),
    samples: specimen.samples.map((sample) => studyMessage(t, sample)),
    reading: studyMessage(t, specimen.reading),
    question: studyMessage(t, specimen.question),
    answer: studyMessage(t, specimen.answer),
  };
}

/** One graph and one sequence supply the geometry, the accessible reading and all playback. */
export function relationsModel(
  example: RelationsExample,
  t: StudyTranslate,
  parameters: StudyParameters = {},
): RelationsStudyModel {
  if (!example.nodes.length || !example.steps.length)
    throw new Error('A relation map needs a node and a step.');
  const { nodes, nodeWidth } = placeNodes(
    example.nodes.map((node) => ({ ...node, label: studyMessage(t, node.label) })),
    example.layout,
  );
  const node = byId(nodes, 'node');
  const edges = example.relations.map((edge) => {
    const reciprocal = example.relations.some(
      (other) => other.from === edge.to && other.to === edge.from,
    );
    const source = node(edge.from);
    const target = node(edge.to);
    const label = studyMessage(t, edge.label);
    return {
      ...edge,
      label,
      description: t('studyCommon.relations.connection', {
        from: source.label,
        relation: label,
        to: target.label,
      }),
      ...drawEdge(source, target, reciprocal, nodeWidth),
    };
  });
  const map: RelationMap = {
    node,
    edge: byId(edges, 'relation'),
    // Numbers can appear directly in narration. Authored words enter through study messages.
    parameters: Object.fromEntries(
      Object.entries(parameters)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => [key, String(value)]),
    ),
  };
  const step = byId(
    example.steps.map(({ id }, index) => ({ id, index })),
    'step',
  );
  return {
    family: 'relations',
    initialStep: 0,
    relations: {
      sourceUrl: example.sourceUrl,
      nodeWidth,
      ...(example.specimen && { specimen: translateSpecimen(example.specimen, t) }),
      height: Math.max(...nodes.map((node) => node.y)) + 38,
      nodes,
      edges,
      frames: example.steps.map((item, index) => frameOf(item, index, map, t)),
    },
    moments: example.moments.map((moment) => ({
      label: studyMessage(t, moment.label),
      step: step(moment.step).index,
    })),
    legend: [
      { tone: 'actual', label: t('studyCommon.relations.legend.focus') },
      { tone: 'other', label: t('studyCommon.relations.legend.connection') },
    ],
    caption: studyMessage(t, example.caption),
  };
}
