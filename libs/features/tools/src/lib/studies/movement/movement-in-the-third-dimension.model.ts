import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { presentStudy } from './movement-in-the-third-dimension.presentation';
import { readParameters } from './movement-in-the-third-dimension.simulation';

export {
  type ThirdDimensionParameters,
  type VolumeVector,
  type DroneState,
  volumeLength,
  initialDroneState,
  calculateThirdDimensionStep,
  thirdDimensionStates,
  droneAxes,
  projectDrone,
} from './movement-in-the-third-dimension.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel =>
  presentStudy(readParameters(parameters), t);
