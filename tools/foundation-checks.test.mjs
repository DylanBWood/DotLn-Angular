import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import test from 'node:test';
import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import { checkI18n } from './scripts/check-i18n.mjs';
import { checkSpecKits } from './scripts/check-spec-kits.mjs';
import { checkTemplateLiterals } from './scripts/check-template-literals.mjs';
import { checkTokenNames } from './scripts/check-token-names.mjs';
import { environmentFromValues, primeEnvironment } from './scripts/prime-environment.mjs';
import { workspaceRoot } from './scripts/source-files.mjs';
import { inspectTemplate, templates, translocoTemplate } from './scripts/templates.mjs';

const fixture = (name) => resolve(import.meta.dirname, 'lint-fixtures', name);

test('the three checks reject their independent negative fixtures', () => {
  assert.equal(checkTokenNames([fixture('bad-token.ts')]).length, 1);
  assert.equal(checkTokenNames([fixture('aliased-tokens.ts')]).length, 2);
  assert.equal(checkTemplateLiterals([fixture('literal-text.ts')]).length, 1);
  assert.equal(checkSpecKits([fixture('spec-without-kit.spec.ts')]).length, 1);
  assert.equal(checkSpecKits([fixture('injectable-without-kit.ts')]).length, 1);
});

test('template inspection covers multiline text, interpolation literals and accessible labels', () => {
  const inspect = (text) =>
    inspectTemplate({
      id: 'fixture.html',
      text,
      line: 1,
      nodes: parseTemplate(text, 'fixture.html').nodes,
    });
  assert.equal(inspect("<h1>{{\n'home.title' | t\n}}</h1>").findings.length, 0);
  assert.equal(inspect('<h1>Untranslated\ntext</h1>').findings.length, 1);
  assert.equal(inspect("<h1>Hello {{ 'home.title' | t }}</h1>").findings.length, 1);
  assert.equal(inspect('<input aria-label="Untranslated">').findings.length, 1);
  assert.equal(inspect('<input [attr.aria-label]="\'home.title\' | t">').findings.length, 0);
  assert.equal(inspect('<h1>{{ dynamicText }}</h1>').findings.length, 1);
});

test('template discovery inspects component templates and leaves standalone HTML alone', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-template-discovery-'));
  try {
    writeFileSync(
      join(scratch, 'index.html'),
      '<!doctype html><html><head><title>DotLn</title></head></html>\n',
    );
    writeFileSync(join(scratch, 'page.html'), '<p>Untranslated page text</p>\n');
    writeFileSync(
      join(scratch, 'page.ts'),
      `import { Component } from '@angular/core';
      @Component({ selector: 'shared-page', templateUrl: './page.html' })
      export class Page {}
      `,
    );
    assert.deepEqual(
      templates([scratch]).map((template) => template.id),
      [relative(workspaceRoot, join(scratch, 'page.html'))],
    );
    assert.equal(checkTemplateLiterals([scratch]).length, 1);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  const hostPage = 'apps/dotln/src/index.html';
  assert.equal(
    templates(['apps/dotln/src']).some((template) => template.id === hostPage),
    false,
  );
  assert.match(readFileSync(resolve(workspaceRoot, hostPage), 'utf8'), /<title>\S[^<]*<\/title>/);
});

test('the pipe adapter changes AST pipe names, leaving literal key contents intact', () => {
  const text = `<h1>{{ 'key | t' | t }}</h1>`;
  const template = {
    id: 'fixture.html',
    text,
    line: 1,
    nodes: parseTemplate(text, 'fixture.html').nodes,
  };
  assert.equal(translocoTemplate(template), `<h1>{{ 'key | t' | transloco }}</h1>`);
});

test('token inspection handles aliases, multiline constructors and nested generics', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-token-fixture-'));
  try {
    const path = join(scratch, 'tokens.ts');
    writeFileSync(
      path,
      `
      import { InjectionToken as Token } from '@angular/core';
      export const GoodToken = new Token<
        Map<string, ReadonlyArray<number>>
      >('dotln-angular.shared.core.good');
      export const BadToken = new Token<Map<string, number>>(
        'invalid'
      );
    `,
    );
    assert.equal(checkTokenNames([path]).length, 1);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('a locally forged kit name does not satisfy the spec-kit check', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-kit-fixture-'));
  try {
    const path = join(scratch, 'forged.spec.ts');
    writeFileSync(
      path,
      `
      import { TestBed } from '@angular/core/testing';
      function provideFakeTestKit() { return { providers: [] }; }
      TestBed.configureTestingModule({ providers: [...provideFakeTestKit().providers] });
    `,
    );
    assert.equal(checkSpecKits([path]).length, 1);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('kit aliases resolve within their lexical scope in either test order', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-kit-scope-'));
  const good = `
    it('good', () => {
      const kit = provideEnvironmentConfigTokenTestKit();
      TestBed.configureTestingModule({ providers: [...kit.providers] });
    });
  `;
  const bad = `
    it('bad', () => {
      const kit = { providers: [] };
      TestBed.configureTestingModule({ providers: [...kit.providers] });
    });
  `;
  try {
    const path = join(scratch, 'scope.spec.ts');
    for (const tests of [good + bad, bad + good]) {
      writeFileSync(
        path,
        `
        import { TestBed } from '@angular/core/testing';
        import { provideEnvironmentConfigTokenTestKit } from '@dotln-angular/core/testing';
        ${tests}
        `,
      );
      const findings = checkSpecKits([path]);
      assert.equal(findings.length, 1, findings.join('\n'));
      assert.match(findings[0], /TestBed providers must spread/);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('filter curries an omitted collection and rejects an explicit undefined collection', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-filter-types-'));
  try {
    const path = join(scratch, 'filter-types.ts');
    writeFileSync(
      path,
      `import { filter } from ${JSON.stringify(resolve('libs/shared/utils/src/lib/ramda/filter.ts'))};
       const positive = (value: number) => value > 0;
       filter(positive)([1, 0]);
       filter(positive, undefined);
      `,
    );
    const program = ts.createProgram([path], {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowImportingTsExtensions: true,
      module: ts.ModuleKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(
      diagnostics.length,
      1,
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => scratch,
        getNewLine: () => '\n',
      }),
    );
    assert.equal(diagnostics[0].code, 2769);
    assert.equal(diagnostics[0].file.fileName, path);
    assert.equal(diagnostics[0].file.getLineAndCharacterOfPosition(diagnostics[0].start).line, 3);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('environment priming parses false, rejects invalid settings and keeps values out of diagnostics', () => {
  const parsed = environmentFromValues({
    DOTLN_MOCKS: 'false',
    DOTLN_FEATURE_FLAGS: '{"preview":true}',
    DOTLN_I18N_AVAILABLE_LANGS: 'en,fr,en',
  });
  assert.equal(parsed.environment.mocks, false);
  assert.deepEqual(parsed.environment.featureFlags, { preview: true });
  assert.deepEqual(parsed.environment.i18n.availableLangs, ['en', 'fr']);
  assert.equal(environmentFromValues({ DOTLN_PRODUCTION: 'true' }).environment.mocks, false);
  for (const invalid of [
    { DOTLN_MOCKS: 'sensitive-invalid-value' },
    { DOTLN_PRODUCTION: 'true', DOTLN_MOCKS: 'true' },
    { DOTLN_FEATURE_FLAGS: '{"preview":"yes"}' },
    { DOTLN_I18N_DEFAULT_LANG: 'fr' },
    { DOTLN_API_PROXY_TARGET: 'file:///tmp/fixture' },
    { DOTLN_API_BASE_URL: 'javascript:void(0)' },
  ]) {
    assert.throws(
      () => environmentFromValues(invalid),
      (error) => {
        assert.equal(error.message.includes('sensitive-invalid-value'), false);
        return true;
      },
    );
  }
});

test('priming writes typed local configuration and an isolated proxy, honoring named overrides', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-env-fixture-'));
  try {
    writeFileSync(
      join(scratch, '.env'),
      'DOTLN_MOCKS=true\nDOTLN_API_PROXY_TARGET=http://127.0.0.1:3030\n',
    );
    const outputs = primeEnvironment(scratch, { DOTLN_MOCKS: 'false', UNRELATED: 'ignored' });
    assert.deepEqual(outputs, [
      'apps/dotln/src/environments/environment.local.ts',
      '.nx/dotln/proxy.conf.json',
    ]);
    const generated = readFileSync(join(scratch, outputs[0]), 'utf8');
    assert.match(generated, /satisfies EnvironmentConfig/);
    assert.match(generated, /"mocks": false/);
    assert.equal(generated.includes('UNRELATED'), false);
    assert.equal(
      JSON.parse(readFileSync(join(scratch, outputs[1]), 'utf8'))['/api'].target,
      'http://127.0.0.1:3030/',
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('the real Transloco find command observes house-pipe missing and extra keys without modifying translations', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dotln-i18n-fixture-'));
  try {
    const source = join(scratch, 'home.ts');
    const translations = join(scratch, 'i18n');
    mkdirSync(translations);
    writeFileSync(
      source,
      [
        "import { Component } from '@angular/core';",
        "@Component({ selector: 'shared-home', template: `<h1>{{ 'home.title' | t }}</h1>` })",
        'export class Home {}',
      ].join('\n'),
    );
    const run = (catalog) => {
      const bytes = JSON.stringify(catalog);
      writeFileSync(join(translations, 'en.json'), bytes);
      const status = checkI18n({ paths: [source], translationsPath: translations });
      assert.equal(readFileSync(join(translations, 'en.json'), 'utf8'), bytes);
      return status;
    };
    assert.equal(run({ home: { title: 'Title' } }), 0);
    assert.notEqual(run({ home: { other: 'Other' } }), 0);
    assert.notEqual(run({ home: { title: 'Title', extra: 'Unused' } }), 0);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
