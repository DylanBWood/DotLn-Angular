import ts from 'typescript';

import {
  importedNames,
  isMain,
  location,
  property,
  readSource,
  runCheck,
  sourceFiles,
  visitTs,
} from './source-files.mjs';

const order = new Map([
  ['selector', 0],
  ['changeDetection', 1],
  ['template', 2],
  ['templateUrl', 2],
  ['styles', 3],
  ['styleUrl', 3],
  ['styleUrls', 3],
  ['providers', 4],
  ['imports', 5],
]);
export function checkComponentOrder(paths) {
  const findings = [];
  for (const path of sourceFiles(paths).filter((path) => path.endsWith('.ts'))) {
    const source = readSource(path);
    const component = importedNames(source, '@angular/core', 'Component');
    visitTs(source, (node) => {
      if (
        !ts.isDecorator(node) ||
        !ts.isCallExpression(node.expression) ||
        !component(node.expression.expression)
      )
        return;
      const metadata = node.expression.arguments[0];
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
        findings.push(`${location(source, node)}: component metadata must be an object literal`);
        return;
      }
      let last = -1;
      for (const member of metadata.properties) {
        if (!ts.isPropertyAssignment(member)) continue;
        const name = member.name.getText(source).replace(/^['"]|['"]$/g, '');
        const rank = order.get(name);
        if (rank === undefined) continue;
        if (rank < last)
          findings.push(
            `${location(source, member)}: component metadata member ${name} is out of order`,
          );
        last = Math.max(last, rank);
      }
      const providers = property(metadata, 'providers');
      if (providers && ts.isArrayLiteralExpression(providers) && !providers.elements.length) {
        findings.push(`${location(source, providers)}: omit empty providers`);
      }
    });
  }
  return findings;
}
if (isMain(import.meta.url)) runCheck(checkComponentOrder);
