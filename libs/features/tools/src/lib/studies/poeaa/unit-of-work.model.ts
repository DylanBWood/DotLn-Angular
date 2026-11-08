import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './unit-of-work.presentation';
import { readParameters, unitOfWorkRun } from './unit-of-work.simulation';

export {
  commit,
  load,
  readParameters,
  registerDirty,
  registerNew,
  registerRemoved,
  unitOfWorkRun,
} from './unit-of-work.simulation';

export type { CompositionStore, UnitOfWork, UnitOfWorkStep } from './unit-of-work.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: unitOfWorkRun(example), parameters }, t);
};
