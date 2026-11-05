import type { StudyParameters } from '@dotln-angular/models';

import type { MotionStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './steering-pipeline.presentation';
import { pipelineSamples, readParameters } from './steering-pipeline.simulation';

export {
  calculatePipelineStep,
  pipelineFrames,
  segmentClearance,
} from './steering-pipeline.simulation';

export type {
  PipelineAttempt,
  PipelineParameters,
  PipelineState,
  PipelineStep,
} from './steering-pipeline.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): MotionStudyModel => {
  const example = readParameters(parameters);
  return present(example, pipelineSamples(example), t);
};
