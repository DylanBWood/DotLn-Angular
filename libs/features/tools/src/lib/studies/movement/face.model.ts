import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './face.presentation';
import { faceSamples, readParameters } from './face.simulation';

export { beaconAt, calculateFaceStep, faceFrames } from './face.simulation';

export type { FaceParameters, FaceStep } from './face.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, faceSamples(example), parameters, t);
};
