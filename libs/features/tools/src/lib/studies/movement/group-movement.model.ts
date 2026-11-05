import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './group-movement.presentation';
import { groupSamples, readGroupExample } from './group-movement.simulation';

export {
  anchorLag,
  arrivalSteps,
  calculateGroupStep,
  groupStates,
  initialGroup,
  maxSlotError,
  readGroupExample,
  slotErrors,
} from './group-movement.simulation';

export type { GroupExample, GroupState } from './group-movement.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readGroupExample(parameters);
  return present(example, groupSamples(example), t);
};
