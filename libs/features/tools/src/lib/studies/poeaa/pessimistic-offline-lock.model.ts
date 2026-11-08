import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './pessimistic-offline-lock.presentation';
import { pessimisticRun, readParameters } from './pessimistic-offline-lock.simulation';

export {
  lostBy,
  pessimisticRun,
  readParameters,
  requestLock,
  saveUnderLock,
  waitedBy,
} from './pessimistic-offline-lock.simulation';

export type {
  CompositionLock,
  PessimisticLockParameters,
  PessimisticStep,
} from './pessimistic-offline-lock.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: pessimisticRun(example), parameters }, t);
};
