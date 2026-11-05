import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The authored fields whose v1 values are message keys, never prose or machine inputs. */
export function studyMessagePaths(study) {
  const paths = [
    ['authored', 'by'],
    ['intuition', 'text'],
    ['intuition', 'situation'],
    ['example', 'name'],
    ['example', 'description'],
    ['pseudocode', 'ordinary'],
  ];
  const rows = (field, keys) =>
    study[field].forEach((_, index) => {
      for (const key of keys) paths.push([field, index, key]);
    });
  study.authored.reviewedBy.forEach((_, index) => paths.push(['authored', 'reviewedBy', index]));
  study.mechanism.steps.forEach((_, index) => {
    paths.push(['mechanism', 'steps', index, 'title'], ['mechanism', 'steps', index, 'text']);
  });
  if (study.pseudocode.rxjs !== null) paths.push(['pseudocode', 'rxjs']);
  if (study.visual) paths.push(['visual', 'textEquivalent']);
  rows('implementations', ['project', 'relevance', 'explanation']);
  rows('references', ['title', 'supports']);
  rows('nearby', ['why']);
  study.limits.forEach((_, index) => paths.push(['limits', index]));
  return paths;
}

export const atPath = (object, path) => path.reduce((value, part) => value?.[part], object);

/** Each invocation shares parsed catalogs; tests and subsequent checks get fresh file bytes. */
export function englishMessages(root) {
  const catalogs = new Map();
  return (key) => {
    const [scope, ...path] = key.split('.');
    if (!/^study[A-Z][A-Za-z0-9]*$/.test(scope)) return undefined;
    if (!catalogs.has(scope)) {
      try {
        catalogs.set(
          scope,
          JSON.parse(
            readFileSync(resolve(root, 'apps/dotln/public/i18n', scope, 'en.json'), 'utf8'),
          ),
        );
      } catch {
        catalogs.set(scope, null);
      }
    }
    const value = atPath(catalogs.get(scope), path);
    return typeof value === 'string' && value.trim() ? value : undefined;
  };
}

/** Restore prose for semantic checks; never mutate the record or treat a missing key as prose. */
export function studyContent(study, message) {
  const content = structuredClone(study);
  for (const path of studyMessagePaths(study)) {
    const key = atPath(study, path);
    const value = message(key);
    if (value === undefined) throw new Error(`missing study message at ${path.join('.')}: ${key}`);
    atPath(content, path.slice(0, -1))[path.at(-1)] = value;
  }
  return content;
}
