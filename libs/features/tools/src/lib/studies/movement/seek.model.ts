import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './seek.presentation';
import { readParameters, seekSamples } from './seek.simulation';

export { calculateSeekStep, seekFrames, sweptAngles } from './seek.simulation';

export type { SeekParameters, SeekState, SeekStep } from './seek.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, seekSamples(example), t);
};
