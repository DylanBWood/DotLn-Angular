import type { StudyParameters } from '@dotln-angular/models';

/** Reads a number the model needs from a record's parameters, refusing a missing one. */
export function numberParameter(parameters: StudyParameters, name: string): number {
  const value = parameters[name];
  if (typeof value !== 'number') throw new Error(`Parameter ${name} must be a number.`);
  return value;
}

/** Reads text the model needs from a record's parameters, refusing a missing one. */
export function textParameter(parameters: StudyParameters, name: string): string {
  const value = parameters[name];
  if (typeof value !== 'string') throw new Error(`Parameter ${name} must be text.`);
  return value;
}
