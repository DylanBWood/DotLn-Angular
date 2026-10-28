import { createHash } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  batches,
  catalogDiagnostic,
  checkCheckpoint,
  checkSummary,
  createSummary,
  dataDirectory,
  verificationKind,
} from './check-catalog.mjs';
import { isMain } from '../source-files.mjs';

class JoinFailure extends Error {}

function operation(name, file, run, line) {
  try {
    return run();
  } catch (error) {
    if (error instanceof JoinFailure) throw error;
    // Only call with names from the declared inventory; never expose OS or parser messages.
    throw new JoinFailure(JSON.stringify({ operation: name, file, ...(line ? { line } : {}) }));
  }
}

export function joinDiagnostic(error) {
  return error instanceof JoinFailure ? error.message : catalogDiagnostic(error);
}

/** Read only the declared maps; the source directory is never enumerated or written. */
export function joinMaps(runRoot, directory = dataDirectory) {
  const checkpoints = Object.keys(batches).map((batch) => {
    const file = `tools-${batch}.json`;
    const bytes = operation('read checkpoint', file, () =>
      readFileSync(resolve(directory, file), 'utf8'),
    );
    const checkpoint = operation('parse checkpoint', file, () => JSON.parse(bytes));
    if (checkpoint.batch !== batch) throw new JoinFailure(`Checkpoint batch differs: ${file}.`);
    return checkpoint;
  });
  const sources = new Map();
  const digests = [];
  for (const checkpoint of checkpoints) {
    const { folder, files } = batches[checkpoint.batch];
    const inventory = Object.keys(files);
    if (
      checkpoint.maps.length !== inventory.length ||
      checkpoint.maps.some((map) => !inventory.includes(map.file))
    )
      throw new JoinFailure(`Map inventory differs: ${checkpoint.batch}.`);
    for (const map of checkpoint.maps) {
      const bytes = operation('read source', map.file, () =>
        readFileSync(resolve(runRoot, 'out', folder, map.file)),
      );
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      if (sha256 !== map.sha256)
        throw new JoinFailure(`Digest changed: ${map.file}. Join stopped.`);
      const rows = bytes
        .toString('utf8')
        .trimEnd()
        .split(/\r?\n/)
        .map((line, index) =>
          operation('parse source', map.file, () => JSON.parse(line), index + 1),
        );
      if (rows.length !== map.rows) throw new JoinFailure(`Row count changed: ${map.file}.`);
      sources.set(map.file, rows);
      digests.push({ file: map.file, rows: rows.length, sha256 });
    }
  }
  const titles = new Map();
  const joined = checkpoints.map((checkpoint) => ({
    ...checkpoint,
    schema: 'tool-v1',
    tools: checkpoint.tools.map((tool, index) => {
      if (tool.provenance !== 'map') return tool;
      const map = checkpoint.maps.find((map) => map.file === tool.map.file);
      // Diagnostics name only the batch, a position or an inventory file, never raw input.
      if (
        !map ||
        tool.map.sha256 !== map.sha256 ||
        tool.id !== `${batches[checkpoint.batch].files[map.file]}:${tool.map.line}`
      )
        throw new JoinFailure(`Tool provenance differs: ${checkpoint.batch} tool ${index + 1}.`);
      const row = sources.get(tool.map.file)?.[tool.map.line - 1];
      if (
        !row ||
        typeof row.concept !== 'string' ||
        typeof row.definition !== 'string' ||
        typeof row.verified !== 'string' ||
        !Array.isArray(row.related) ||
        !Array.isArray(row.dotlnHooks)
      )
        throw new JoinFailure(
          `Map row shape differs: ${tool.map.file}${Number.isSafeInteger(tool.map.line) ? ` line ${tool.map.line}` : ''}.`,
        );
      const key = JSON.stringify([tool.work, row.concept]);
      titles.set(key, [...(titles.get(key) ?? []), tool.id]);
      return {
        ...tool,
        title: row.concept,
        definition: row.definition,
        place: Object.fromEntries(
          ['part', 'chapter', 'section', 'subsection']
            .filter((key) => row[key] != null && row[key] !== '')
            .map((key) => [key, row[key]]),
        ),
        related: row.related.map((title) => ({ title, id: null })),
        hooks: row.dotlnHooks,
        verified: { kind: verificationKind(row.verified), note: row.verified },
      };
    }),
  }));
  for (const checkpoint of joined) {
    for (const tool of checkpoint.tools) {
      // A relation links only to one other concept with exactly that title; a title that
      // names the concept itself stays readable text rather than a link back to the page.
      tool.related = tool.related.map(({ title }) => {
        const matches = titles.get(JSON.stringify([tool.work, title])) ?? [];
        return { title, id: matches.length === 1 && matches[0] !== tool.id ? matches[0] : null };
      });
    }
    checkCheckpoint(checkpoint);
  }
  const previousSummary = operation('read summary', 'catalog-summary.json', () =>
    readFileSync(resolve(directory, 'catalog-summary.json'), 'utf8'),
  );
  const summary = createSummary(
    joined,
    operation('parse summary', 'catalog-summary.json', () => JSON.parse(previousSummary)),
  );
  checkSummary(summary, joined);
  // Validate every input and the complete result before replacing the first file.
  const outputs = joined.map((checkpoint) => [`tools-${checkpoint.batch}.json`, checkpoint]);
  outputs.push(['catalog-summary.json', summary]);
  for (const [name, value] of outputs) {
    const target = resolve(directory, name);
    operation('write output', name, () =>
      writeFileSync(`${target}.tmp`, `${JSON.stringify(value, null, 2)}\n`),
    );
    operation('replace output', name, () => renameSync(`${target}.tmp`, target));
  }
  return digests;
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new JoinFailure('Expected the research run directory.');
    for (const map of joinMaps(process.argv[2]))
      console.log(`${map.file}: ${map.rows} rows; sha256 ${map.sha256}`);
    console.log(
      'PASS catalog join: all source digests matched; eight checkpoints and summary written.',
    );
  } catch (error) {
    console.error(`FAIL catalog join: ${joinDiagnostic(error)}`);
    process.exitCode = 1;
  }
}
