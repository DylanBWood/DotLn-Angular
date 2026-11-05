import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './two-level-formation-steering.presentation';
import { escortSamples, readEscortParameters } from './two-level-formation-steering.simulation';

export {
  calculateEscortStep,
  escortLag,
  escortSlotError,
  escortStates,
  initialEscort,
  readEscortParameters,
} from './two-level-formation-steering.simulation';

export type { EscortParameters, EscortState } from './two-level-formation-steering.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readEscortParameters(parameters);
  return present(example, escortSamples(example), t);
};
