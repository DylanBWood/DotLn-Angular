import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './align.presentation';
import { alignSamples, readParameters } from './align.simulation';

export { alignFrames, calculateAlignStep, radians, wrapDegrees } from './align.simulation';

export type { AlignParameters, AlignStep, AngularState, AngularTuning } from './align.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, alignSamples(example), parameters, t);
};
