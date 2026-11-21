import type { StudyParameters } from '@dotln-angular/models';

import { booleanParameter } from '../parameters';

export const lanterns = ['dock', 'steps', 'bell', 'beacon', 'cove'] as const;
export type Lantern = (typeof lanterns)[number];

const start = 'dock';
const claims = ['beacon', 'cove'] as const satisfies readonly Lantern[];
type Claim = (typeof claims)[number];

export interface RelayParameters {
  readonly coveWire: boolean;
}

export interface RelayRule {
  readonly from: Lantern;
  readonly to: Lantern;
}

export type RelayStep =
  | { readonly kind: 'seed'; readonly lantern: Lantern }
  | { readonly kind: 'rule'; readonly rule: RelayRule; readonly discovered: boolean }
  | { readonly kind: 'verdict'; readonly lantern: Claim; readonly derived: boolean };

export interface RelayRun {
  readonly rules: readonly RelayRule[];
  readonly lit: readonly Lantern[];
  readonly steps: readonly RelayStep[];
}

const wires: readonly RelayRule[] = [
  { from: 'dock', to: 'steps' },
  { from: 'steps', to: 'bell' },
  { from: 'bell', to: 'steps' },
  { from: 'bell', to: 'beacon' },
  { from: 'cove', to: 'bell' },
];

export const readParameters = (parameters: StudyParameters): RelayParameters => ({
  coveWire: booleanParameter(parameters, 'coveWire'),
});

/** The queue grows only when a lantern is first marked. Each lantern has its rules examined once. */
export function relayRun({ coveWire }: RelayParameters): RelayRun {
  const rules: readonly RelayRule[] = coveWire ? [...wires, { from: 'bell', to: 'cove' }] : wires;
  const lit = new Set<Lantern>([start]);
  const queue: Lantern[] = [start];
  const steps: RelayStep[] = [{ kind: 'seed', lantern: start }];

  for (const source of queue) {
    for (const rule of rules) {
      if (rule.from !== source) continue;

      const discovered = !lit.has(rule.to);
      if (discovered) {
        lit.add(rule.to);
        queue.push(rule.to);
      }
      steps.push({ kind: 'rule', rule, discovered });
    }
  }

  for (const lantern of claims) {
    steps.push({ kind: 'verdict', lantern, derived: lit.has(lantern) });
  }

  return { rules, lit: [...lit], steps };
}
