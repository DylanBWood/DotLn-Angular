import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './slot-assignment.presentation';
import { allocate, readSlotExample } from './slot-assignment.simulation';

export {
  acceptableCounts,
  allocate,
  assignmentCost,
  cheapestComplete,
  readSlotExample,
  slotCost,
} from './slot-assignment.simulation';

export type { SlotExample } from './slot-assignment.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readSlotExample(parameters);
  return present(example, allocate(example), t);
};
