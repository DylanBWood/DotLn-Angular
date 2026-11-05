import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './scalable-formations.presentation';
import { readParameters, scalableFormationSamples } from './scalable-formations.simulation';

export { countAt, scalableFormationSamples } from './scalable-formations.simulation';

export type {
  ScalableFormationParameters,
  ScalableFormationSample,
} from './scalable-formations.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, scalableFormationSamples(example), t);
};
