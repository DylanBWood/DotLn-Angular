import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './identity-map.presentation';
import { identityMapRun, readParameters } from './identity-map.simulation';

export {
  checkStudy,
  copiesOf,
  find,
  identityMapRun,
  startSession,
} from './identity-map.simulation';

export type { IdentityMapStep, Session, StudyStore } from './identity-map.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: identityMapRun(example), parameters }, t);
};
