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

/**
 * Reads an on/off input the model needs from a record's parameters. A record and its slider hold
 * such an input as 1 for on and 0 for off; any other value is refused.
 */
export function booleanParameter(parameters: StudyParameters, name: string): boolean {
  const value = numberParameter(parameters, name);
  if (value !== 0 && value !== 1) throw new Error(`Parameter ${name} must be 0 or 1.`);
  return value === 1;
}
