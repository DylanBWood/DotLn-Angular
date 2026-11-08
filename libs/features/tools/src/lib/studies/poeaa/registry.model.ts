import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './registry.presentation';
import { readParameters, registryRun } from './registry.simulation';

export {
  catalogKey,
  close,
  emptyRegistry,
  lookup,
  provide,
  readCatalog,
  registryRun,
} from './registry.simulation';

export type { Registry, RegistryStep } from './registry.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: registryRun(example), parameters }, t);
};
