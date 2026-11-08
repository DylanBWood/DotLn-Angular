import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './optimistic-offline-lock.presentation';
import { optimisticRun, readParameters } from './optimistic-offline-lock.simulation';

export {
  optimisticRun,
  read,
  readParameters,
  reload,
  save,
} from './optimistic-offline-lock.simulation';

export type {
  OptimisticLockParameters,
  OptimisticStep,
  StoredComposition,
  TabSession,
} from './optimistic-offline-lock.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: optimisticRun(example), parameters }, t);
};
