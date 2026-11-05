import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './fixed-formations.presentation';
import { fixedFormationSamples, readParameters } from './fixed-formations.simulation';

export { fixedFormationSamples, fixedOffsets } from './fixed-formations.simulation';

export type { FixedFormationParameters, FixedFormationSample } from './fixed-formations.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, fixedFormationSamples(example), t);
};
