import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const privatePath = /\/Users\/|\/home\/|(?:^|[^a-z0-9])[a-z]:[\\/]/iu;

export function assertScrubbed(board) {
  // Report the location, never the value that may contain private material.
  function visit(value, pointer) {
    if (typeof value === 'string' && privatePath.test(value)) {
      throw new Error(`Unscrubbed absolute path at ${pointer || '/'}`);
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (privatePath.test(key)) throw new Error(`Unscrubbed object key at ${pointer || '/'}`);
        visit(child, `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`);
      }
    }
  }
  visit(board, '');
}

export function scrubBoard(board, launchpadRoot) {
  if (!launchpadRoot || !launchpadRoot.startsWith('/')) {
    throw new Error('An absolute launchpad root is required for scrubbing.');
  }
  const prefix = launchpadRoot.replace(/\/$/u, '');
  function rewrite(value) {
    if (typeof value === 'string') {
      return value === prefix ? '<launchpad>' : value.split(`${prefix}/`).join('<launchpad>/');
    }
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
    }
    return value;
  }
  const scrubbed = rewrite(board);
  assertScrubbed(scrubbed);
  return scrubbed;
}

export function unavailableBoard(board) {
  return {
    ...board,
    panels: board.panels.map((panel) => ({
      ...panel,
      sections: panel.sections.map((section) => ({
        ...section,
        status: 'unavailable',
        explanation: 'This recorded fixture deliberately makes every section unavailable.',
        rows: [],
      })),
    })),
    sources: board.sources.map((source) => ({
      ...source,
      status: 'unavailable',
      explanation: 'This recorded fixture deliberately makes every source unavailable.',
    })),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let stage = 'arguments';
  try {
    const [input, output, root] = process.argv.slice(2);
    if (!input || !output || !root) {
      throw new Error('Usage: scrub-board-fixture.mjs <input.json> <output.json> <launchpad-root>');
    }
    stage = 'input read';
    const raw = readFileSync(input, 'utf8');
    stage = 'JSON parse';
    const inputBoard = JSON.parse(raw);
    stage = 'path scrub';
    const board = scrubBoard(inputBoard, root);
    stage = 'output write';
    writeFileSync(output, `${JSON.stringify(board, null, 2)}\n`);
    console.log('PASS board fixture scrubbed; no private paths remain.');
  } catch {
    console.error(`FAIL board fixture ${stage}; raw values and file paths are withheld.`);
    process.exitCode = 1;
  }
}
