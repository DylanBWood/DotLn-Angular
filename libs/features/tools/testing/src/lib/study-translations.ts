import type { StudyTranslate } from '../../../src/lib/studies/study-translate';
import catalogs from './study-en.json';

/** The same English catalogs as production, checked byte-for-byte by the tooling suite. */
export const studyMessages = catalogs;

/** Pure model specs need no injector; missing keys and missing arguments stay test failures. */
export const studyTranslate: StudyTranslate = (key, parameters = {}) => {
  const value = key
    .split('.')
    .reduce<unknown>(
      (entry, part) =>
        entry && typeof entry === 'object' ? (entry as Record<string, unknown>)[part] : undefined,
      catalogs,
    );
  if (typeof value !== 'string') throw new Error(`Missing study test message: ${key}`);
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const parameter = parameters[name];
    if (parameter === undefined) throw new Error(`Missing study message parameter: ${key}.${name}`);
    return String(parameter);
  });
};
