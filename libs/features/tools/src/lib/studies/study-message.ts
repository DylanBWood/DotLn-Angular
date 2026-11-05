import type { StudyParameters } from '@dotln-angular/models';

import type { StudyTranslate } from './study-translate';

/** A message key, with computed values and separately translated words when needed. */
export type StudyMessage =
  | string
  | {
      readonly key: string;
      readonly params?: Readonly<Record<string, string | number>>;
      readonly messages?: Readonly<Record<string, string>>;
    };

export function studyMessage(t: StudyTranslate, message: StudyMessage): string {
  if (typeof message === 'string') return t(message);
  const words = Object.fromEntries(
    Object.entries(message.messages ?? {}).map(([name, key]) => [name, t(key)]),
  );
  return t(message.key, { ...message.params, ...words });
}

/** Machine parameters stay intact; the prose receives their translated display values. */
export function studyParameterValues(
  parameters: StudyParameters,
  t: StudyTranslate,
  messages: Readonly<Record<string, string>> = {},
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(parameters).map(([name, value]) => {
      const key = messages[name];
      if (key !== undefined) return [name, t(key)];
      if (typeof value === 'string') throw new Error(`No display message for parameter ${name}.`);
      return [name, String(value)];
    }),
  );
}
