import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import {
  importedNames,
  isMain,
  location,
  property,
  readSource,
  resolveSource,
  runCheck,
  sourceFiles,
  visitTs,
  workspaceRoot,
} from './source-files.mjs';

function exportedFunctions(path, seen = new Set()) {
  if (!path || seen.has(path) || !existsSync(path)) return new Set();
  seen.add(path);
  const names = new Set();
  for (const node of readSource(path).statements) {
    const exported = ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (exported && ts.isFunctionDeclaration(node) && node.name && node.body)
      names.add(node.name.text);
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const nested = exportedFunctions(
        resolveSource(path, node.moduleSpecifier.text),
        new Set(seen),
      );
      if (!node.exportClause) for (const name of nested) names.add(name);
      else if (ts.isNamedExports(node.exportClause)) {
        for (const entry of node.exportClause.elements) {
          if (nested.has((entry.propertyName ?? entry.name).text)) names.add(entry.name.text);
        }
      }
    }
  }
  return names;
}

function kitImports(source) {
  const names = new Set();
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const specifier = node.moduleSpecifier.text;
    const match = /^@dotln-angular\/([^/]+)\/testing$/.exec(specifier);
    const entry = match
      ? resolve(workspaceRoot, 'libs/shared', match[1], 'testing/src/index.ts')
      : specifier.startsWith('.') && specifier.includes('testing')
        ? resolveSource(source.fileName, specifier)
        : undefined;
    const exports = exportedFunctions(entry);
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        const original = (binding.propertyName ?? binding.name).text;
        if (/^provide.+TestKit$/.test(original) && exports.has(original))
          names.add(binding.name.text);
      }
    }
  }
  return names;
}

export function checkSpecKits(paths = ['libs/shared']) {
  const findings = [];
  const files = sourceFiles(paths).filter((path) => path.endsWith('.ts'));
  // Bind local declarations without loading the dependency graph. Symbols
  // distinguish identically named variables in separate blocks and callbacks.
  const program = ts.createProgram(files, { noResolve: true, noLib: true });
  const checker = program.getTypeChecker();
  for (const path of files) {
    const source = program.getSourceFile(path);
    const isToken = importedNames(source, '@angular/core', 'InjectionToken');
    const isInjectable = importedNames(source, '@angular/core', 'Injectable');
    const isTestBed = importedNames(source, '@angular/core/testing', 'TestBed');
    const library = /^libs\/shared\/([^/]+)\//.exec(relative(workspaceRoot, path));
    const exportedKits = library
      ? exportedFunctions(resolve(workspaceRoot, 'libs/shared', library[1], 'testing/src/index.ts'))
      : new Set();
    const importedKits = kitImports(source);
    function kitSpread(node) {
      if (
        !ts.isSpreadElement(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        node.expression.name.text !== 'providers'
      )
        return false;
      let call = node.expression.expression;
      if (ts.isIdentifier(call)) {
        const declaration = checker.getSymbolAtLocation(call)?.valueDeclaration;
        call =
          declaration &&
          ts.isVariableDeclaration(declaration) &&
          declaration.parent.flags & ts.NodeFlags.Const
            ? declaration.initializer
            : undefined;
      }
      return (
        call &&
        ts.isCallExpression(call) &&
        ts.isIdentifier(call.expression) &&
        importedKits.has(call.expression.text) &&
        checker
          .getSymbolAtLocation(call.expression)
          ?.declarations?.some((declaration) => ts.isImportSpecifier(declaration))
      );
    }
    visitTs(source, (node) => {
      let name;
      if (
        ts.isClassDeclaration(node) &&
        ts
          .getDecorators(node)
          ?.some(
            (decorator) =>
              ts.isCallExpression(decorator.expression) &&
              isInjectable(decorator.expression.expression),
          )
      )
        name = node.name?.text;
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isNewExpression(node.initializer) &&
        isToken(node.initializer.expression)
      ) {
        name = node.name.getText(source);
      }
      if (name && !exportedKits.has(`provide${name}TestKit`)) {
        findings.push(
          `${location(source, node)}: library testing entry point must export provide${name}TestKit`,
        );
      }
      if (
        path.endsWith('.spec.ts') &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'configureTestingModule' &&
        isTestBed(node.expression.expression)
      ) {
        const metadata = node.arguments[0];
        const providers =
          metadata && ts.isObjectLiteralExpression(metadata) && property(metadata, 'providers');
        if (
          !providers ||
          !ts.isArrayLiteralExpression(providers) ||
          !providers.elements.some(kitSpread)
        ) {
          findings.push(
            `${location(source, node)}: TestBed providers must spread an exported provide*TestKit(...).providers`,
          );
        }
      }
    });
  }
  return findings;
}

if (isMain(import.meta.url)) runCheck(checkSpecKits);
