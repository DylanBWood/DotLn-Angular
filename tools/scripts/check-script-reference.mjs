import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** @param {string} document Markdown text. @returns {Set<string>} Script references in tables. */
function tableReferences(document) {
  const references = new Set();
  let fence = null;
  let previousWasRow = false;
  let inTable = false;
  for (const line of document.split('\n')) {
    const boundary = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (boundary) {
      if (!fence) fence = boundary;
      else if (boundary[0] === fence[0] && boundary.length >= fence.length) fence = null;
      previousWasRow = false;
      inTable = false;
      continue;
    }
    const isRow = !fence && /^\s*\|.*\|\s*$/.test(line);
    if (!isRow) {
      previousWasRow = false;
      inTable = false;
      continue;
    }
    if (previousWasRow && /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line)) inTable = true;
    previousWasRow = true;
    if (!inTable) continue;
    for (const [, reference] of line.matchAll(
      /`(npm run [\w:-]+|tools\/scripts\/[\w.-]+\.mjs)`/g,
    )) {
      references.add(reference);
    }
  }
  return references;
}

/**
 * @param {string} root Workspace whose script inventory must match its reference tables.
 * @returns {void} Prints the checked counts; throws on missing or stale entries.
 */
export function checkScriptReference(root = process.cwd()) {
  const scripts = Object.keys(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts);
  const files = readdirSync(join(root, 'tools/scripts'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mjs'))
    .map((entry) => entry.name);
  const expected = new Set([
    ...scripts.map((name) => `npm run ${name}`),
    ...files.map((name) => `tools/scripts/${name}`),
  ]);
  const documented = tableReferences(
    readFileSync(join(root, 'docs/dev-reference/workspace/scripts.md'), 'utf8'),
  );
  const missing = [...expected].filter((name) => !documented.has(name));
  const stale = [...documented].filter((name) => !expected.has(name));
  const errors = [
    missing.length ? `Undocumented scripts: ${missing.join(', ')}` : '',
    stale.length ? `Stale script rows: ${stale.join(', ')}` : '',
  ].filter(Boolean);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`PASS script reference: ${scripts.length} npm scripts; ${files.length} files`);
}

if (import.meta.main) checkScriptReference();
