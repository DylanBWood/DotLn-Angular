import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { isMain, readSource, sourceFiles, workspaceRoot } from './source-files.mjs';
import { templates, translocoTemplate } from './templates.mjs';

export function houseSignalSource(path) {
  const source = readSource(path);
  const imports = source.statements.filter(
    (node) =>
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text === '@dotln-angular/i18n' &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      node.importClause.namedBindings.elements.some(
        (element) => (element.propertyName ?? element.name).text === 'translateSignal',
      ),
  );
  if (!imports.length) return undefined;
  let text = source.text;
  for (const node of imports.reverse()) {
    text = `${text.slice(0, node.moduleSpecifier.getStart())}'@jsverse/transloco'${text.slice(node.moduleSpecifier.end)}`;
  }
  return text;
}

export function checkI18n({ paths, translationsPath = 'apps/dotln/public/i18n' } = {}) {
  const catalogPath = resolve(workspaceRoot, translationsPath, 'en.json');
  if (!existsSync(catalogPath) || !statSync(catalogPath).isFile()) {
    throw new Error('The English translation catalog must exist before checking keys.');
  }
  mkdirSync(join(workspaceRoot, '.nx'), { recursive: true });
  const scratch = mkdtempSync(join(workspaceRoot, '.nx/i18n-check-'));
  try {
    let index = 0;
    for (const template of templates(paths).filter(
      (entry) => !/\.spec\.ts#|\/testing\//.test(entry.id),
    )) {
      writeFileSync(join(scratch, `template-${index++}.html`), translocoTemplate(template));
    }
    for (const path of sourceFiles(paths).filter(
      (path) => path.endsWith('.ts') && !/\.spec\.ts$|\/testing\//.test(path),
    )) {
      const text = houseSignalSource(path);
      if (text) writeFileSync(join(scratch, `signal-${index++}.ts`), text);
    }
    const packageDirectory = join(workspaceRoot, 'node_modules/@jsverse/transloco-keys-manager');
    const pkg = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'));
    const result = spawnSync(
      process.execPath,
      [
        join(packageDirectory, pkg.bin['transloco-keys-manager']),
        'find',
        '--project',
        'dotln',
        '--input',
        scratch,
        '--translations-path',
        resolve(workspaceRoot, translationsPath),
        '--emit-error-on-extra-keys',
      ],
      { cwd: workspaceRoot, stdio: 'inherit', timeout: 60_000 },
    );
    if (result.error) throw result.error;
    return result.status ?? 1;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) {
  try {
    process.exitCode = checkI18n();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
