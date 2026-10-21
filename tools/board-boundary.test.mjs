import assert from 'node:assert/strict';
import test from 'node:test';

import ts from 'typescript';

import { readSource, sourceFiles, visitTs } from './scripts/source-files.mjs';

test('the recorded board imports no command transport or execution API', () => {
  const forbidden = /(?:node:|child_process|http|data-access|commands|dispatch|events|state)/i;
  for (const path of sourceFiles(['libs/features/board/src/lib']).filter(
    (path) => !path.endsWith('.spec.ts'),
  )) {
    const source = readSource(path);
    visitTs(source, (node) => {
      if (ts.isImportDeclaration(node))
        assert.equal(forbidden.test(node.moduleSpecifier.text), false, path);
      if (ts.isCallExpression(node)) {
        assert.equal(
          /^(?:fetch|eval|exec|spawn)$/.test(node.expression.getText(source)),
          false,
          path,
        );
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword)
          assert.fail('Board has no dynamic transport imports');
      }
    });
  }
});
