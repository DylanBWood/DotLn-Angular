import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './identity-field.presentation';
import { identityFieldRun, readParameters } from './identity-field.simulation';

export {
  collisionsIn,
  compose,
  identityFieldRun,
  isStored,
  keyOf,
  nextKey,
  open,
  readParameters,
  save,
  sharersOf,
} from './identity-field.simulation';

export type { IdentityFieldStep, Scene } from './identity-field.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: identityFieldRun(example), parameters }, t);
};
