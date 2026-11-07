import type { StudyTranslate } from '../../../src/lib/studies/study-translate';
import catalogs from './study-en.json';

/** The same English catalogs as production, checked byte-for-byte by the tooling suite. */
export const studyMessages = catalogs;

/** Test-only examples keep their messages beside their fixtures, out of the shipped catalogs. */
export function withStudyMessages(messages: Readonly<Record<string, string>>): StudyTranslate {
  return (key, parameters = {}) => {
    const message = messages[key];
    return message === undefined
      ? studyTranslate(key, parameters)
      : interpolate(message, key, parameters);
  };
}

function interpolate(
  message: string,
  key: string,
  parameters: Readonly<Record<string, string | number>>,
): string {
  return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const parameter = parameters[name];
    if (parameter === undefined) throw new Error(`Missing study message parameter: ${key}.${name}`);
    return String(parameter);
  });
}

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
  return interpolate(value, key, parameters);
};
