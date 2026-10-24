import { readFileSync, readdirSync } from 'node:fs';
import { isMain } from './source-files.mjs';
export function checkScriptReference() {
  const scripts = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts);
  const files = readdirSync('tools/scripts').filter((name) => name.endsWith('.mjs'));
  const doc = readFileSync('docs/dev-reference/workspace/scripts.md', 'utf8');
  const missing = [
    ...scripts.map((name) => `npm run ${name}`),
    ...files.map((name) => `tools/scripts/${name}`),
  ].filter((name) => !doc.includes('`' + name + '`'));
  if (missing.length) throw new Error(`Undocumented scripts: ${missing.join(', ')}`);
  console.log(`PASS script reference: ${scripts.length} npm scripts; ${files.length} files`);
}
if (isMain(import.meta.url)) checkScriptReference();
