import type { StudyParameters } from '@dotln-angular/models';

import { type RelationsExample, relationsModel, type RelationStep } from '../relations';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type ComponentAssignment,
  type ComponentId,
  contactOptions,
  type ConwayRun,
  conwayRun,
  type DependencyMapping,
  readParameters,
  type TeamId,
} from './conways-law.simulation';

const contactLabels = {
  checkoutContactsStock: 'studyTt.conways-law.model.inputs.checkoutContactsStock',
  checkoutContactsBilling: 'studyTt.conways-law.model.inputs.checkoutContactsBilling',
  billingContactsStock: 'studyTt.conways-law.model.inputs.billingContactsStock',
} satisfies Record<(typeof contactOptions)[number]['parameter'], string>;

const teamLabels = {
  stock: 'studyTt.conways-law.model.nodes.stock',
  checkout: 'studyTt.conways-law.model.nodes.checkout',
  billing: 'studyTt.conways-law.model.nodes.billing',
} satisfies Readonly<Record<TeamId, string>>;
const componentLabels = {
  inventory: 'studyTt.conways-law.model.nodes.inventory',
  'order-entry': 'studyTt.conways-law.model.nodes.orderEntry',
  payments: 'studyTt.conways-law.model.nodes.payments',
} satisfies Readonly<Record<ComponentId, string>>;

const teamNode = (team: TeamId) => `team-${team}`;
const componentNode = (component: ComponentId) => `component-${component}`;
type GraphRelation = RelationsExample['relations'][number];

function ownership({ team, component }: ComponentAssignment): GraphRelation {
  return {
    id: `owns-${team}`,
    from: teamNode(team),
    to: componentNode(component),
    label: 'studyTt.conways-law.model.edges.owns',
  };
}

function communication({ contact }: DependencyMapping): GraphRelation {
  return {
    id: `contact-${contact.id}`,
    from: teamNode(contact.from),
    to: teamNode(contact.to),
    label: 'studyTt.conways-law.model.edges.contacts',
  };
}

function componentLink({ contact, dependency }: DependencyMapping): GraphRelation {
  return {
    id: `dependency-${contact.id}`,
    from: componentNode(dependency.from),
    to: componentNode(dependency.to),
    label: 'studyTt.conways-law.model.edges.depends',
  };
}

interface ConnectionTrace {
  readonly relations: readonly GraphRelation[];
  readonly steps: readonly RelationStep[];
}

function traceConnection(mapping: DependencyMapping): ConnectionTrace {
  const { contact, dependency } = mapping;
  const input = communication(mapping);
  const output = componentLink(mapping);
  return {
    relations: [input, output],
    steps: [
      {
        id: input.id,
        focus: { relation: input.id },
        note: {
          key: 'studyTt.conways-law.model.notes.contacts',
          messages: {
            from: componentLabels[dependency.from],
            to: componentLabels[dependency.to],
          },
        },
      },
      {
        id: output.id,
        focus: { relation: output.id },
        note: {
          key: 'studyTt.conways-law.model.notes.depends',
          messages: {
            from: teamLabels[contact.from],
            to: teamLabels[contact.to],
          },
        },
      },
    ],
  };
}

function exampleOf(run: ConwayRun): RelationsExample {
  const { assignments, connections } = run;
  const owners = assignments.map(ownership);
  const traces = connections.map(traceConnection);
  const contactSteps = traces.flatMap(({ steps }) => steps);
  const review: RelationStep = {
    id: 'review',
    focus: { node: componentNode(connections[0]?.dependency.from ?? assignments[0].component) },
    note:
      traces.length > 0
        ? 'studyTt.conways-law.model.notes.review'
        : 'studyTt.conways-law.model.notes.isolated',
  };
  return {
    layout: 'columns',
    nodes: assignments.flatMap(({ team, component }) => [
      { id: teamNode(team), label: teamLabels[team], lane: 0 as const },
      {
        id: componentNode(component),
        label: componentLabels[component],
        lane: 1 as const,
      },
    ]),
    relations: [...owners, ...traces.flatMap(({ relations }) => relations)],
    steps: [
      ...owners.map(({ id }) => ({
        id,
        focus: { relation: id },
        note: 'studyTt.conways-law.model.notes.owns',
      })),
      ...contactSteps,
      review,
    ],
    moments: [
      { step: owners[0].id, label: 'studyTt.conways-law.model.moments.owners' },
      ...contactSteps
        .slice(0, 1)
        .map(({ id }) => ({ step: id, label: 'studyTt.conways-law.model.moments.edges' })),
      { step: review.id, label: 'studyTt.conways-law.model.moments.review' },
    ],
    caption: 'studyTt.conways-law.model.caption',
  };
}

export function model(parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel {
  return {
    ...relationsModel(exampleOf(conwayRun(readParameters(parameters))), t),
    inputs: contactOptions.map(({ parameter }) => ({
      name: parameter,
      label: t(contactLabels[parameter]),
      unit: t('studyTt.conways-law.model.inputs.unit'),
      min: 0,
      max: 1,
      step: 1,
    })),
  };
}
