import { isMain, runCheck } from './source-files.mjs';
import { inspectTemplate, templates } from './templates.mjs';

export function checkTemplateLiterals(paths) {
  return templates(paths).flatMap((template) => inspectTemplate(template).findings);
}

if (isMain(import.meta.url)) runCheck(checkTemplateLiterals);
