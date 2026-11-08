import type { StudyParameters } from '@dotln-angular/models';

import type { StatesStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { present } from './plugin.presentation';
import { configurationOf, pluginRun, readParameters } from './plugin.simulation';

export {
  bind,
  configurationOf,
  draw,
  pluginRun,
  readParameters,
  totalsOf,
} from './plugin.simulation';

export type { Configuration, PluginStep } from './plugin.simulation';

export const model = (parameters: StudyParameters, t: StudyTranslate): StatesStudyModel => {
  const example = readParameters(parameters);
  return present({ example, steps: pluginRun(configurationOf(example)), parameters }, t);
};
