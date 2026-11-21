import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter } from '../parameters';

const teams = ['stock', 'checkout', 'billing'] as const;
export type TeamId = (typeof teams)[number];

const componentByTeam = {
  stock: 'inventory',
  checkout: 'order-entry',
  billing: 'payments',
} as const satisfies Readonly<Record<TeamId, string>>;

export type ComponentId = (typeof componentByTeam)[TeamId];

export const contactOptions = [
  {
    id: 'checkout-stock',
    from: 'checkout',
    to: 'stock',
    parameter: 'checkoutContactsStock',
  },
  {
    id: 'checkout-billing',
    from: 'checkout',
    to: 'billing',
    parameter: 'checkoutContactsBilling',
  },
  {
    id: 'billing-stock',
    from: 'billing',
    to: 'stock',
    parameter: 'billingContactsStock',
  },
] as const satisfies readonly {
  readonly id: string;
  readonly from: TeamId;
  readonly to: TeamId;
  readonly parameter: string;
}[];

interface DesignContact {
  readonly id: (typeof contactOptions)[number]['id'];
  readonly from: TeamId;
  readonly to: TeamId;
}

export interface TeamGraph {
  readonly teams: readonly TeamId[];
  readonly contacts: readonly DesignContact[];
}

export interface ComponentAssignment {
  readonly team: TeamId;
  readonly component: ComponentId;
}

export interface DependencyMapping {
  readonly contact: DesignContact;
  readonly dependency: { readonly from: ComponentId; readonly to: ComponentId };
}

export interface ConwayRun {
  readonly assignments: readonly ComponentAssignment[];
  readonly connections: readonly DependencyMapping[];
}

/** An enabled input records who initiates an interface negotiation. */
export function readParameters(parameters: StudyParameters): TeamGraph {
  return {
    teams,
    contacts: contactOptions
      .filter(({ parameter }) => booleanParameter(parameters, parameter))
      .map(({ id, from, to }) => ({ id, from, to })),
  };
}

/** Keep one component per team, and transport each arrow through that pairing. */
export function conwayRun(graph: TeamGraph): ConwayRun {
  const assignments = graph.teams.map((team) => ({
    team,
    component: componentByTeam[team],
  }));
  const connections = graph.contacts.map((contact) => ({
    contact,
    dependency: {
      from: componentByTeam[contact.from],
      to: componentByTeam[contact.to],
    },
  }));
  return { assignments, connections };
}
