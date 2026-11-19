import { createTestScene, createTestStep, createTestUnit } from '../../testing/src';
import { applyStep, isSafeStep, previewStep } from './interpreter';
import { measure } from './metrics';
import { advanceProjectiles } from './projectiles';
import { advanceMovement, createSimulation, frameOf, frameSeconds } from './simulation';
import { runBranch } from './trial';
import type { CompositionStep } from './types';

const source = createTestUnit('source', { position: { x: 20, y: 24 } });
const mark = createTestUnit('mark', { position: { x: 60, y: 24 } });
const board = createTestScene([source, mark]);
const fire = (params: CompositionStep['params'] = {}) =>
  createTestStep('combat.fire', [source.id], { target: 2, rate: 4, 'bullet-speed': 90, ...params });
const stop = { ...fire({ target: 0 }), at: 1 };

it.each([
  createTestStep('field.wall', [], { x1: 40, y1: 10, x2: 40, y2: 50, thickness: 1 }),
  createTestStep('field.obstacle', [], { x: 40, y: 24, radius: 2 }),
])('ends the streak on the first field shape it meets', (field) => {
  const states = runBranch(board, [field, fire(), stop], 90);
  const contacts = states.flatMap((state) =>
    state.impacts.filter((mark) => mark.at === state.tick),
  );
  expect(contacts).toHaveLength(1);
  expect(contacts[0].unitId).toBeNull();
  expect(contacts[0].position.x).toBeLessThan(40);
  expect(measure(states[90])).toMatchObject({ shots: 1, hits: 0, accuracy: 0 });
  expect(states[90].impacts).toEqual([]);
});

it('credits the owner, counts the hit on the struck piece, and respects range', () => {
  const result = runBranch(board, [fire(), stop], 90)[90];
  expect(result.units.map(({ hits }) => hits)).toEqual([0, 1]);
  expect(measure(result, [source.id])).toMatchObject({ shots: 1, hits: 1, accuracy: 1 });
  expect(measure(runBranch(board, [fire({ range: 10 })], 90)[90])).toMatchObject({
    shots: 0,
    accuracy: null,
  });
});

it('stops a piece on hit three and repeats the same knockout after restart', () => {
  const steps = [
    createTestStep('steer.blend', [mark.id], { 'obstacle-avoidance-weight': 1 }),
    fire({ 'knockout-hits': 3 }),
  ];
  const first = runBranch(board, steps, 160);
  const at = first.findIndex((state) => state.units[1].down);
  expect(at).toBeGreaterThan(0);
  expect(first[at - 1].units[1].hits).toBe(2);
  expect(frameOf(first[at - 1]).rays.some(({ id }) => id === mark.id)).toBe(true);
  expect(frameOf(first[at]).rays.some(({ id }) => id === mark.id)).toBe(false);
  expect(
    first
      .slice(at)
      .every(
        (state) =>
          state.units[1].hits === 3 &&
          frameOf(state).units[1].activity === 'down' &&
          state.units[1].velocity.x === 0 &&
          state.units[1].velocity.y === 0,
      ),
  ).toBe(true);
  expect(runBranch(board, steps, 160).findIndex((state) => state.units[1].down)).toBe(at);
  const standing = runBranch(board, [fire({ 'knockout-hits': 0 })], 160)[160];
  expect(standing.units[1].hits).toBeGreaterThan(3);
  expect(standing.units.every((unit) => !unit.down)).toBe(true);
});

it('keeps a zero speed or rate out of stored steps', () => {
  for (const name of ['rate', 'bullet-speed']) expect(isSafeStep(fire({ [name]: 0 }))).toBe(false);
});

it('previews the marked board pose, the range cutoff and a stationary objective separately', () => {
  const state = [
    createTestStep('objective.set', [], { x: 105, y: 24 }),
    createTestStep('steer.blend', [mark.id], { 'arrive-weight': 1 }),
    createTestStep('combat.aim', [source.id], { iterations: 4 }),
    createTestStep('combat.projectile', [source.id], { drag: 0.3 }),
  ].reduce((current, step) => applyStep(current, step).state, createSimulation(board));
  const moving = previewStep(state, fire({ 'bullet-speed': 36, range: 40.1 })).shot;
  expect(moving).toMatchObject({
    hasTarget: true,
    seconds: 1.2,
    cue: { poseFrame: 72, endFrame: 72, beyondRange: true },
  });
  const point = previewStep(state, fire({ 'bullet-speed': 36, target: 0 })).shot;
  expect(point?.cue).toEqual({ poseFrame: null, endFrame: 72, beyondRange: false });
});

it('records the shared clip before adding either a straight or an assisted shot to the volley', () => {
  const trio = createTestScene([
    source,
    mark,
    createTestUnit('last', { position: { x: 75, y: 36 } }),
  ]);
  const start = [
    fire({ target: 3 }),
    createTestStep('combat.aim', [mark.id]),
    createTestStep('combat.fire', [mark.id], { target: 3 }),
  ].reduce((current, step) => applyStep(current, step).state, createSimulation(trio));
  const first = vi.fn(advanceMovement);
  const next = advanceProjectiles(start, frameSeconds, first);
  const recorded = first.mock.calls[0][0];
  expect(recorded.units.map(({ shots }) => shots)).toEqual([0, 0, 0]);
  expect(recorded.bullets).toHaveLength(0);
  expect(next.units.map(({ shots }) => shots)).toEqual([1, 1, 0]);
  expect(next.bullets).toHaveLength(2);
});
