import ts from 'typescript';
import {
  importedNames,
  isMain,
  location,
  readSource,
  runCheck,
  sourceFiles,
  visitTs,
} from './source-files.mjs';

export function inspectTokenNames(source) {
  const findings = [];
  const isToken = importedNames(source, '@angular/core', 'InjectionToken');
  visitTs(source, (node) => {
    if (!ts.isNewExpression(node) || !isToken(node.expression)) return;
    const description = node.arguments?.[0];
    if (
      !description ||
      !ts.isStringLiteral(description) ||
      !description.text.startsWith('dotln-angular.')
    ) {
      findings.push(node);
    }
  });
  return findings;
}

export function checkTokenNames(paths) {
  return sourceFiles(paths)
    .filter((path) => path.endsWith('.ts'))
    .flatMap((path) => {
      const source = readSource(path);
      return inspectTokenNames(source).map(
        (node) =>
          `${location(source, node)}: token description must be a string literal starting with dotln-angular.`,
      );
    });
}

if (isMain(import.meta.url)) runCheck(checkTokenNames);
