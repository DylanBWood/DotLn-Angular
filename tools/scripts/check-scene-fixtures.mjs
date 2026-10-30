import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { isMain, workspaceRoot } from './source-files.mjs';

export const sceneFixtureDirectory = resolve(
  workspaceRoot,
  'libs/features/scene/src/testing/fixtures',
);

const fixtureNames = ['scene-twenty.json', 'cost-table.json', 'trial-known-outcome.json'];

// The order's fixture default: labels are only labels, but the counts are the contract.
const lifecycleCounts = {
  executor: 8,
  verifier: 4,
  reviewer: 3,
  repairer: 2,
  planner: 1,
  refuter: 1,
  'release-close': 1,
};

export function sceneValidator() {
  const schema = readFileSync(resolve(sceneFixtureDirectory, 'scene-v0.schema.json'));
  return new Ajv2020({ allErrors: true, allowUnionTypes: true }).compile(JSON.parse(schema));
}

/** The rules a schema cannot state: unique ids, the role counts and a clear starting field. */
export function sceneFindings(scene) {
  const findings = [];
  const ids = scene.units.map((unit) => unit.id);
  if (new Set(ids).size !== ids.length) findings.push('unit ids repeat');

  const counts = {};
  for (const { labels } of scene.units)
    counts[labels.lifecycle] = (counts[labels.lifecycle] ?? 0) + 1;
  for (const [role, count] of Object.entries(lifecycleCounts)) {
    if (counts[role] !== count) findings.push(`expected ${count} ${role} units`);
  }

  scene.units.forEach((unit, index) => {
    const { x, y } = unit.position;
    if (x < 0 || y < 0 || x > scene.field.width || y > scene.field.height)
      findings.push(`${unit.id} starts off the field`);
    for (const other of scene.units.slice(index + 1)) {
      const gap = Math.hypot(x - other.position.x, y - other.position.y);
      if (gap < unit.radius + other.radius)
        findings.push(`${unit.id} starts overlapping ${other.id}`);
    }
  });
  return findings;
}

export function checkSceneFixtures() {
  const validate = sceneValidator();
  for (const name of fixtureNames) {
    const fixture = JSON.parse(readFileSync(resolve(sceneFixtureDirectory, name), 'utf8'));
    if (!validate(fixture)) {
      const locations = validate.errors.map(
        ({ instancePath, keyword }) => `${instancePath}: ${keyword}`,
      );
      throw new Error(`${name}: schema validation failed: ${locations.join('; ')}`);
    }
    const findings = fixture.schema === 'scene-v0' ? sceneFindings(fixture) : [];
    if (findings.length) throw new Error(`${name}: ${findings.join('; ')}`);
    console.log(`PASS ${name}: scene-v0 schema`);
  }
}

if (isMain(import.meta.url)) {
  try {
    checkSceneFixtures();
  } catch (error) {
    console.error(`FAIL scene fixture validation: ${error.message}`);
    process.exitCode = 1;
  }
}
