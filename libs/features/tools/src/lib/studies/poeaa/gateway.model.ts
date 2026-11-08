import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './gateway.presentation';
import { gatewayRun, readParameters } from './gateway.simulation';

export {
  arrive,
  ask,
  gatewayRun,
  get,
  load,
  send,
  serve,
  translate,
  untranslated,
} from './gateway.simulation';

export type { BoardOutcome, GatewayParameters, GatewayStep, RawReply } from './gateway.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: gatewayRun(example), parameters }, t);
};
