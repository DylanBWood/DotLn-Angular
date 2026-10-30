import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  checkSceneFixtures,
  sceneFindings,
  sceneFixtureDirectory,
  sceneValidator,
} from './scripts/check-scene-fixtures.mjs';

const scene = () =>
  JSON.parse(readFileSync(resolve(sceneFixtureDirectory, 'scene-twenty.json'), 'utf8'));

test('the committed scene fixtures pass', () => {
  assert.doesNotThrow(checkSceneFixtures);
  assert.deepEqual(sceneFindings(scene()), []);
});

test('the schema refuses a scene that is not twenty units', () => {
  const short = scene();
  short.units.pop();
  assert.equal(sceneValidator()(short), false);
});

test('the schema refuses an unknown field and a role outside the label sets', () => {
  const validate = sceneValidator();
  const extra = scene();
  extra.units[0].behaviour = 'flock';
  assert.equal(validate(extra), false);
  const invented = scene();
  invented.units[0].labels.lifecycle = 'captain';
  assert.equal(validate(invented), false);
});

test('a wrong role count, a repeated id and an overlap are each named', () => {
  const miscounted = scene();
  miscounted.units[0].labels.lifecycle = 'refuter';
  miscounted.units[1].labels.lifecycle = 'refuter';
  assert.ok(sceneFindings(miscounted).some((finding) => finding.includes('refuter')));

  const repeated = scene();
  repeated.units[1].id = repeated.units[0].id;
  assert.ok(sceneFindings(repeated).includes('unit ids repeat'));

  const crowded = scene();
  crowded.units[1].position = crowded.units[0].position;
  assert.ok(sceneFindings(crowded).some((finding) => finding.includes('overlapping')));
});
