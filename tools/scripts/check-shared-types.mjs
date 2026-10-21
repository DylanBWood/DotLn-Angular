import ts from 'typescript';

import { isMain, location, readSource, runCheck, sourceFiles, visitTs } from './source-files.mjs';

export function checkSharedTypes(paths = ['libs/shared']) {
  const names = new Map();
  for (const path of sourceFiles(paths).filter((path) => path.endsWith('.ts'))) {
    const source = readSource(path);
    visitTs(source, (node) => {
      if (!ts.isTypeAliasDeclaration(node) && !ts.isInterfaceDeclaration(node)) return;
      const declarations = names.get(node.name.text) ?? new Map();
      declarations.set(path, location(source, node));
      names.set(node.name.text, declarations);
    });
  }
  return [...names]
    .filter(([, declarations]) => declarations.size > 1)
    .map(
      ([name, declarations]) =>
        `Shared type ${name} is declared in multiple files: ${[...declarations.values()].join(', ')}`,
    );
}
if (isMain(import.meta.url)) runCheck(checkSharedTypes);
