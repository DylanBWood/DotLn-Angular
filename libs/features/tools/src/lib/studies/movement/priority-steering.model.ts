import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './priority-steering.presentation';
import { prioritySteps, readParameters } from './priority-steering.simulation';

export { calculatePriorityStep, prioritySteps } from './priority-steering.simulation';

export type {
  PriorityParameters,
  PriorityState,
  PriorityStep,
} from './priority-steering.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, prioritySteps(example), t);
};
