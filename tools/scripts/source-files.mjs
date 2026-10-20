import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
export const defaultSourceRoots = ['apps/dotln/src', 'libs'];

export function sourceFiles(paths = defaultSourceRoots, root = workspaceRoot) {
  const found = new Set();
  function visit(path) {
    if (!existsSync(path)) throw new Error(`Source path does not exist: ${relative(root, path)}`);
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        if (!entry.isSymbolicLink() && !['node_modules', '.nx', 'dist'].includes(entry.name)) {
          visit(resolve(path, entry.name));
        }
      }
    } else if (['.ts', '.html'].includes(extname(path))) {
      found.add(path);
    }
  }
  for (const path of paths) visit(resolve(root, path));
  return [...found].sort();
}

export function readSource(path) {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
}

export function visitTs(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => visitTs(child, visitor));
}

export function importedNames(source, module, exportedName) {
  const names = new Set();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== module) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        if ((binding.propertyName ?? binding.name).text === exportedName)
          names.add(binding.name.text);
      }
    }
  }
  return (expression) =>
    (ts.isIdentifier(expression) && names.has(expression.text)) ||
    (ts.isPropertyAccessExpression(expression) &&
      namespaces.has(expression.expression.getText(source)) &&
      expression.name.text === exportedName);
}

export function location(source, node) {
  return `${relative(workspaceRoot, source.fileName)}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
}

export function property(object, name) {
  return object.properties.find(
    (member) =>
      ts.isPropertyAssignment(member) &&
      member.name?.getText().replace(/^['"]|['"]$/g, '') === name,
  )?.initializer;
}

export function resolveSource(from, specifier) {
  const base = resolve(dirname(from), specifier);
  return [base, `${base}.ts`, resolve(base, 'index.ts')].find(
    (path) => existsSync(path) && statSync(path).isFile(),
  );
}

export function runCheck(check, args = process.argv.slice(2)) {
  try {
    const findings = check(args.length ? args : undefined);
    for (const finding of findings) console.error(finding);
    console.log(
      `${findings.length === 0 ? 'PASS' : 'FAIL'} ${check.name}: ${findings.length} findings`,
    );
    process.exitCode = findings.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

export function isMain(url) {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(url);
}
