import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './service-layer.presentation';
import { readParameters, serviceLayerRun } from './service-layer.simulation';

export {
  announce,
  check,
  readAndCheck,
  saveCalls,
  serviceLayerRun,
  stageOf,
  startState,
  writeDirect,
  writePending,
} from './service-layer.simulation';

export type { SaveCall, ServiceLayerState, ServiceLayerStep } from './service-layer.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: serviceLayerRun(example), parameters }, t);
};
