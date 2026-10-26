import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { batches, catalogDiagnostic, checkCheckpoint, dataDirectory } from './check-catalog.mjs';
import { isMain } from '../source-files.mjs';

export function mergeCheckpoints(source, destination = dataDirectory) {
  const incoming = new Map();
  function visit(directory, depth = 0) {
    if (depth > 2) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path, depth + 1);
      else if (
        entry.isFile() &&
        Object.keys(batches).some((batch) => entry.name === `tools-${batch}.json`)
      ) {
        const checkpoint = checkCheckpoint(JSON.parse(readFileSync(path, 'utf8')));
        if (entry.name !== `tools-${checkpoint.batch}.json` || incoming.has(checkpoint.batch))
          throw new Error('Ambiguous checkpoint inventory.');
        incoming.set(checkpoint.batch, {
          ...checkpoint,
          tools: [...checkpoint.tools].sort((a, b) => a.id.localeCompare(b.id)),
        });
      }
    }
  }
  visit(resolve(source));
  if (!incoming.size) throw new Error('No classifier checkpoints found.');
  // Validate the whole incoming set before replacing any committed candidate.
  mkdirSync(destination, { recursive: true });
  for (const [batch, checkpoint] of incoming) {
    const path = resolve(destination, `tools-${batch}.json`);
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(checkpoint, null, 2)}\n`);
    renameSync(temporary, path);
  }
  return [...incoming.keys()].sort();
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Expected one scratch directory.');
    console.log(`PASS merged catalog batches: ${mergeCheckpoints(process.argv[2]).join(', ')}`);
  } catch (error) {
    console.error(
      `FAIL checkpoint merge: ${catalogDiagnostic(error)} Raw values and paths are withheld.`,
    );
    process.exitCode = 1;
  }
}
