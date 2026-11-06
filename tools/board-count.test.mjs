import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { boardMarkers, countBoards } from './board-count.mjs';

test('markers use each file type’s leading comment token and count once per line', () => {
  for (const extension of ['ts', 'mts', 'mjs', 'js', 'scss']) {
    assert.equal(
      boardMarkers(
        `file.${extension}`,
        [
          '  // BOARDED: first BOARDED: still one',
          '/* BOARDED: second */',
          "const inert = 'BOARDED: not a marker';",
          "const other = '// BOARDED: still a string';",
          'statement(); // BOARDED: not at the start',
          '// explanatory text BOARDED: not a marker',
        ].join('\n'),
      ).length,
      2,
    );
  }
  assert.equal(
    boardMarkers('file.html', '<!-- BOARDED: first -->\n<div><!-- BOARDED: inline --></div>')
      .length,
    1,
  );
  for (const extension of ['yml', 'yaml']) {
    assert.equal(
      boardMarkers(`file.${extension}`, '# BOARDED: first\nkey: value # BOARDED: inline').length,
      1,
    );
  }
  assert.equal(boardMarkers('file.json', '// BOARDED: JSON has no comments').length, 0);
});

test('multiline strings and comment bodies cannot manufacture markers', () => {
  const script = [
    'const text = `',
    '// BOARDED: inside a template',
    '${"interpolation"}',
    '// BOARDED: after interpolation',
    '`;',
    '/* a comment containing another comment token',
    '// BOARDED: not the start of a comment',
    '*/',
    '// BOARDED: actual marker',
  ].join('\n');
  assert.deepEqual(
    boardMarkers('file.mjs', script).map(({ line }) => line),
    [9],
  );
  assert.equal(
    boardMarkers('file.scss', '$text: "\n// BOARDED: string\n";\n// BOARDED: real').length,
    1,
  );
  assert.equal(
    boardMarkers(
      'file.html',
      '<div title="\n<!-- BOARDED: string -->\n"></div>\n<!-- BOARDED: real -->',
    ).length,
    1,
  );
  assert.equal(
    boardMarkers(
      'file.yml',
      [
        'run: |',
        '  # BOARDED: scalar text',
        'quoted: "',
        '  # BOARDED: quoted text',
        '  "',
        '# BOARDED: real',
        'folded: >-',
        '  # BOARDED: folded text',
        '# BOARDED: another real marker',
      ].join('\n'),
    ).length,
    2,
  );
});

test('the gauge covers tracked tools, workflows and styles but excludes docs, dependencies and untracked files', () => {
  const root = mkdtempSync(join(tmpdir(), 'dotln-boards-'));
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  try {
    execFileSync('git', ['init', '--quiet', root]);
    write('tools/probe.mjs', '// BOARDED: tool');
    write('.github/workflows/ci.yml', '# BOARDED: workflow');
    write('styles/main.scss', '/* BOARDED: style */');
    write('docs/example.ts', '// BOARDED: docs excluded');
    write('libs/x/node_modules/example.ts', '// BOARDED: dependency excluded');
    write('config.json', '{"text":"BOARDED: inert"}');
    symlinkSync(join(root, 'tools/probe.mjs'), join(root, 'link.mjs'));
    execFileSync('git', ['add', '.'], { cwd: root });
    write('untracked.ts', '// BOARDED: not tracked');
    assert.deepEqual(
      countBoards(root).map(({ path }) => path),
      ['.github/workflows/ci.yml', 'styles/main.scss', 'tools/probe.mjs'],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('script comments before closing delimiters count, including empty blocks', () => {
  for (const extension of ['ts', 'mts', 'js', 'mjs']) {
    const source = [
      'function empty() {',
      '  // BOARDED: empty function',
      '}',
      'function used() {',
      '  work();',
      '  // BOARDED: after the final statement',
      '}',
      'const values = [',
      '  /* BOARDED: empty collection */',
      '];',
    ].join('\n');
    assert.deepEqual(
      boardMarkers(`file.${extension}`, source).map(({ line }) => line),
      [2, 6, 9],
    );
  }
});

test('quotes inside YAML plain scalars do not swallow following comments', () => {
  for (const value of [
    'Say "hello',
    "Say 'hello",
    'Something, "literal',
    'See https://example.test',
  ]) {
    assert.equal(boardMarkers('file.yml', `name: ${value}\n# BOARDED: actual comment\n`).length, 1);
  }
  assert.equal(
    boardMarkers('file.yml', 'values: ["\n# BOARDED: quoted text\n"]\n# BOARDED: real').length,
    1,
  );
});

test('HTML raw-text and RCDATA elements keep apparent comments as literal content', () => {
  for (const tag of ['textarea', 'title', 'script', 'style', 'TEXTAREA']) {
    assert.equal(
      boardMarkers(
        'file.html',
        [
          `<${tag} title=">">`,
          '<!-- BOARDED: literal text -->',
          `</${tag}>`,
          '<!-- BOARDED: real comment -->',
        ].join('\n'),
      ).length,
      1,
    );
  }
});

test('YAML adjacent quoted flow-map values retain the real marker locations', () => {
  const source = 'values: {"key":"\n  # BOARDED: quoted text\n"}\n# BOARDED: real\n';
  assert.deepEqual(
    boardMarkers('file.yml', source).map(({ line }) => line),
    [4],
  );
});

test('HTML custom-element names are not raw-text tag names', () => {
  const source = [
    '<textarea-wrapper>',
    '<!-- BOARDED: actual comment -->',
    '</textarea-wrapper>',
    '<!-- BOARDED: another comment -->',
  ].join('\n');
  assert.deepEqual(
    boardMarkers('file.html', source).map(({ line }) => line),
    [2, 4],
  );
});
