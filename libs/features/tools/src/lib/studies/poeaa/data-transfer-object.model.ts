import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './data-transfer-object.presentation';
import {
  dataTransferRun,
  domainObjects,
  encodesDirectly,
  readParameters,
} from './data-transfer-object.simulation';

export {
  assembleActor,
  assembleBuild,
  assembleEvidence,
  byteLength,
  dataTransferRun,
  decode,
  domainObjects,
  emptyTransfer,
  encode,
  encodesDirectly,
  readUnchecked,
} from './data-transfer-object.simulation';

export type { BoardTransfer, DataTransferStep } from './data-transfer-object.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present(
    {
      example,
      steps: dataTransferRun(example),
      encodesDirectly: encodesDirectly(domainObjects(example)),
      parameters,
    },
    t,
  );
};
