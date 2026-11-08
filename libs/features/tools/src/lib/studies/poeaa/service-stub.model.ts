import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './service-stub.presentation';
import { readParameters, suiteRun } from './service-stub.simulation';

export {
  expectationOf,
  judge,
  liveAnswer,
  release,
  runCase,
  stubAnswer,
  suiteRun,
  tally,
} from './service-stub.simulation';

export type { CaseRun, ServiceStubParameters, SuiteStep } from './service-stub.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: suiteRun(example), parameters }, t);
};
