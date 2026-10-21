import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { assertScrubbed } from './scrub-board-fixture.mjs';
import { isMain, workspaceRoot } from './source-files.mjs';

export const fixtureDirectory = resolve(workspaceRoot, 'libs/features/board/src/testing/fixtures');
export const schemaSha256 = '7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3';

export function boardValidator() {
  const bytes = readFileSync(resolve(fixtureDirectory, 'uifa-board-v1.schema.json'));
  if (createHash('sha256').update(bytes).digest('hex') !== schemaSha256) {
    throw new Error('The board schema differs from its recorded upstream pin.');
  }
  return new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(JSON.parse(bytes));
}

export function checkBoardFixtures() {
  const validate = boardValidator();
  for (const name of ['launchpad-board-2026-10-21.json', 'unavailable-board.json']) {
    const board = JSON.parse(readFileSync(resolve(fixtureDirectory, name), 'utf8'));
    assertScrubbed(board);
    if (!validate(board)) {
      const locations = validate.errors.map(
        ({ instancePath, keyword }) => `${instancePath}: ${keyword}`,
      );
      throw new Error(`${name}: schema validation failed: ${locations.join('; ')}`);
    }
    console.log(`PASS ${name}: uifa-board-v1 schema and path scrub`);
  }
}

if (isMain(import.meta.url)) {
  try {
    checkBoardFixtures();
  } catch {
    console.error(
      'FAIL board fixture validation; check the schema pin, JSON syntax, schema shape and path scrub. Raw values and file paths are withheld.',
    );
    process.exitCode = 1;
  }
}
