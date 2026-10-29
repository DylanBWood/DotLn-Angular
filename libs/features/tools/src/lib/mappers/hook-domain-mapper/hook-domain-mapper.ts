import type { Tool } from '@dotln-angular/models';
import { HookDomain } from '@dotln-angular/models';

export function mapHookDomains(hooks: Tool['hooks'], labels: Readonly<Record<HookDomain, string>>) {
  return Object.values(HookDomain).flatMap((domain) => {
    const clauses = hooks.filter((hook) => hook.domain === domain).map((hook) => hook.clause);
    return clauses.length ? [{ domain: labels[domain], clauses }] : [];
  });
}
