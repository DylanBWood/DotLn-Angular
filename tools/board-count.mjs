import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let count = 0;

function visit(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.isFile() && /\.(?:ts|mts|js|mjs|html)$/.test(entry.name)) {
      for (const [index, line] of readFileSync(path, 'utf8').split('\n').entries()) {
        if (line.includes('// BOARDED:')) {
          count += 1;
          console.log(`${relative(root, path)}:${index + 1}: ${line.trim()}`);
        }
      }
    }
  }
}

visit(join(root, 'apps'));
visit(join(root, 'libs'));
console.log(`Board count: ${count}`);
