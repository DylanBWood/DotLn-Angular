import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './satisfaction-radius.presentation';
import { readParameters } from './satisfaction-radius.simulation';

export {
  type SatisfactionRadiusParameters,
  type SatisfactionRadiusStep,
  type SatisfactionRadiusSample,
  calculateSatisfactionRadiusStep,
  satisfactionRadiusSamples,
} from './satisfaction-radius.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
