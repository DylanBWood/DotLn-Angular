import {
  createScatteredUnits,
  createTestScene,
  createTestStep,
  createTestUnit,
} from '../../testing/src';
import { hashFrame } from './hash';
import { applyStep, interpretedKinds, objectiveKind, previewStep, readsParam } from './interpreter';
import { measure } from './metrics';
import { assignmentOf } from './queries';
import { advance, createSimulation, frameOf, frameSeconds, isAtRest } from './simulation';
import { runBranch } from './trial';
import type { CompositionStep, SimulationState } from './types';
import { centroid, distance, length } from './vectors';

const flock = { 'separation-weight': 2, 'cohesion-weight': 1, 'velocity-match-weight': 1 };
const twelve = createScatteredUnits(12);
const ids = twelve.map((unit) => unit.id);
const scene = createTestScene(twelve, { seed: 7 });

function runFor(state: SimulationState, frames: number) {
  let current = state;
  for (let frame = 0; frame < frames; frame += 1) current = advance(current);
  return current;
}

const hashes = (steps: readonly CompositionStep[], frames: number) =>
  runBranch(scene, steps, frames).map((state) => hashFrame(frameOf(state)));

describe('arrive', () => {
  it('stops one unit inside the target radius', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep('objective.set', [], { x: 70, y: 50 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ['a'], {
        'arrive-weight': 1,
        'slow-radius': 10,
        'target-radius': 1,
        'time-to-target': 0.25,
      }),
    ));
    const settled = runFor(state, 600);
    expect(distance(settled.units[0].position, { x: 70, y: 50 })).toBeLessThanOrEqual(1);
    expect(length(settled.units[0].velocity)).toBe(0);
    expect(measure(settled).timeToObjective).toBeGreaterThan(0);
    expect(isAtRest(settled)).toBe(true);
  });

  it('brings a flock in as a group: its centre stops inside the radius', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('steer.blend', ids, flock));
    state = runFor(state, 240);
    ({ state } = applyStep(state, createTestStep('objective.set', [], { x: 90, y: 60 }, 240)));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 }, 240)));
    const settled = runFor(state, 900);
    const centre = centroid(settled.units.map((unit) => unit.position));
    expect(distance(centre, { x: 90, y: 60 })).toBeLessThanOrEqual(1);
    expect(measure(settled).timeToObjective).not.toBeNull();
    expect(measure(settled).collisions).toBe(0);
  });

  it('leaves time to objective unknown until the group has arrived', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 90, y: 60 }),
    );
    expect(measure(state).timeToObjective).toBeNull();
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    expect(measure(runFor(state, 10)).timeToObjective).toBeNull();
  });

  it('brings a flock sent to an objective to a complete stop', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('steer.blend', ids, flock));
    state = runFor(state, 120);
    ({ state } = applyStep(state, createTestStep(objectiveKind, [], { x: 90, y: 40 })));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    const settled = runFor(state, 1500);
    expect(isAtRest(settled)).toBe(true);
    expect(
      distance(centroid(settled.units.map((unit) => unit.position)), { x: 90, y: 40 }),
    ).toBeLessThanOrEqual(1);
  });

  it('counts a unit stopped against a wall as being at rest', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('steer.blend', ids, flock));
    ({ state } = applyStep(state, createTestStep(objectiveKind, [], { x: 60, y: 1 })));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    expect(isAtRest(runFor(state, 2400))).toBe(true);
  });

  it('times a group held off an objective by the wall it stands against', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('steer.blend', ids, flock));
    ({ state } = applyStep(state, createTestStep(objectiveKind, [], { x: 60, y: 2 })));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    expect(measure(runFor(state, 1800)).timeToObjective).not.toBeNull();
  });

  it('has not arrived while a group scattered round the objective is still gathering', () => {
    const { x, y } = centroid(twelve.map((unit) => unit.position));
    let { state } = applyStep(createSimulation(scene), createTestStep(objectiveKind, [], { x, y }));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'seek-weight': 1 })));
    expect(measure(runFor(state, 2)).timeToObjective).toBeNull();
  });

  it('has not arrived while a group with steering it carried in forms up across the field', () => {
    const { x, y } = centroid(twelve.map((unit) => unit.position));
    let { state } = applyStep(createSimulation(scene), createTestStep(objectiveKind, [], { x, y }));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'seek-weight': 1 })));
    ({ state } = applyStep(state, createTestStep('formation.twoLevel', ids, { pattern: 0 })));
    expect(measure(runFor(state, 2)).timeToObjective).toBeNull();
  });

  it('has not arrived with two formations on either side of the objective', () => {
    const start = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids.slice(0, 6), { pattern: 0 }),
    ).state;
    const both = applyStep(
      start,
      createTestStep('formation.twoLevel', ids.slice(6), { pattern: 0 }),
    ).state;
    let standing = runFor(both, 900);
    const { x, y } = centroid(standing.units.map((unit) => unit.position));
    ({ state: standing } = applyStep(standing, createTestStep(objectiveKind, [], { x, y })));
    expect(measure(runFor(standing, 3)).timeToObjective).toBeNull();
    expect(measure(runFor(standing, 1800)).timeToObjective).not.toBeNull();
  });

  it('times a wandering group that reaches the objective, though it never stops', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep(objectiveKind, [], { x: 60, y: 40 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ids, { 'arrive-weight': 1, 'wander-weight': 0.2 }),
    ));
    expect(measure(runFor(state, 1800)).timeToObjective).not.toBeNull();
  });

  it('times a group with a wide target radius and hardly any spacing', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, { 'separation-weight': 1, threshold: 0.5 }),
    );
    ({ state } = applyStep(state, createTestStep(objectiveKind, [], { x: 60, y: 40 })));
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ids, { 'arrive-weight': 1, 'target-radius': 10 }),
    ));
    expect(measure(runFor(state, 1800)).timeToObjective).not.toBeNull();
  });

  it('gives a formation no credit for a wall nobody stands at', () => {
    const start = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
    ).state;
    let standing = runFor(start, 1200);
    ({ state: standing } = applyStep(standing, createTestStep(objectiveKind, [], { x: 60, y: 2 })));
    expect(measure(runFor(standing, 5)).timeToObjective).toBeNull();
  });

  it('gives a group on its way no credit for a wall it has not reached', () => {
    const corner = { x: 3.7, y: 77.7 };
    const start = (weights: Record<string, number>) => {
      let { state } = applyStep(createSimulation(scene), createTestStep(objectiveKind, [], corner));
      ({ state } = applyStep(state, createTestStep('steer.blend', ids, weights)));
      return state;
    };
    expect(measure(runFor(start({ 'seek-weight': 1 }), 30)).timeToObjective).toBeNull();
    expect(measure(runFor(start({ 'arrive-weight': 0.2 }), 30)).timeToObjective).toBeNull();
  });

  it('times a seeker from the moment it crosses the radius, though it never stops', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep(objectiveKind, [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ['a'], { 'seek-weight': 1 })));
    const settled = runFor(state, 900);
    expect(measure(settled).timeToObjective).not.toBeNull();
    expect(length(settled.units[0].velocity)).toBeGreaterThan(0);
    expect(frameOf(settled).units[0].activity).toBe('arrived');
  });

  it('arrives at a target radius of nothing', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep(objectiveKind, [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ['a'], { 'arrive-weight': 1, 'target-radius': 0 }),
    ));
    const settled = runFor(state, 900);
    expect(measure(settled).timeToObjective).not.toBeNull();
    expect(frameOf(settled).units[0].activity).toBe('arrived');
  });

  it('keeps the time when units already on their way are retuned', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep(objectiveKind, [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ['a'], { 'arrive-weight': 1 })));
    const settled = runFor(state, 900);
    const retuned = applyStep(
      settled,
      createTestStep('steer.blend', ['a'], { 'arrive-weight': 1, 'slow-radius': 20 }),
    ).state;
    expect(measure(retuned).timeToObjective).toBe(measure(settled).timeToObjective);
  });

  it('times afresh when a unit newly heads for the objective', () => {
    const pair = createTestScene([
      createTestUnit('a', { position: { x: 10, y: 10 } }),
      createTestUnit('b', { position: { x: 10, y: 40 } }),
    ]);
    let { state } = applyStep(
      createSimulation(pair),
      createTestStep(objectiveKind, [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ['a'], { 'arrive-weight': 1 })));
    const settled = runFor(state, 900);
    expect(measure(settled).timeToObjective).not.toBeNull();
    const joined = applyStep(
      settled,
      createTestStep('steer.blend', ['b'], { 'arrive-weight': 1 }),
    ).state;
    expect(measure(joined).timeToObjective).toBeNull();
    expect(joined.objective?.startedAt).toBe(settled.tick);
  });

  it('brakes a unit nothing is steering, rather than letting it coast', () => {
    const coasting = createTestScene([
      createTestUnit('a', { position: { x: 60, y: 40 }, velocity: { x: 8, y: 0 } }),
    ]);
    const settled = runFor(createSimulation(coasting), 240);
    expect(settled.units[0].velocity).toEqual({ x: 0, y: 0 });
    expect(settled.units[0].position.x).toBeLessThan(65);
  });

  it('stops a unit pinned against a wall and reads it as stalled', () => {
    const line = createTestScene(createScatteredUnits(9));
    const members = line.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(line),
      createTestStep(objectiveKind, [], { x: 4, y: 4 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('formation.twoLevel', members, { pattern: 1, 'slot-spacing': 20 }),
    ));
    const settled = runFor(state, 1800);
    expect(settled.units.every((unit) => length(unit.velocity) === 0)).toBe(true);
    expect(measure(settled).stalledUnits).toBeGreaterThan(0);
    expect(isAtRest(settled)).toBe(true);
  });

  it('is silent with no objective', () => {
    const { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, { 'arrive-weight': 1 }),
    );
    expect(isAtRest(state)).toBe(true);
  });
});

describe('flock', () => {
  const opening = [createTestStep('steer.blend', ids, flock)];

  it('pulls the group in: the cohesion radius falls and the group moves', () => {
    const states = runBranch(scene, opening, 600);
    const start = measure(states[0]);
    const end = measure(states[600]);
    expect(end.cohesionRadius).toBeLessThan(start.cohesionRadius / 2);
    const drift = distance(
      centroid(states[300].units.map((unit) => unit.position)),
      centroid(states[600].units.map((unit) => unit.position)),
    );
    expect(drift).toBeGreaterThan(1);
  });

  it('converges headings', () => {
    const states = runBranch(scene, opening, 600);
    expect(measure(states[600]).headingVariance).toBeLessThan(
      measure(states[0]).headingVariance / 2,
    );
  });

  it('with the separation weight at zero, collides within 600 frames', () => {
    const states = runBranch(
      scene,
      [createTestStep('steer.blend', ids, { ...flock, 'separation-weight': 0 })],
      600,
    );
    expect(Math.max(...states.map((state) => measure(state).collisions))).toBeGreaterThan(0);
  });

  it('with the default weights reaches and keeps zero collisions after settling', () => {
    const states = runBranch(scene, opening, 1200);
    expect(states.slice(300).map((state) => measure(state).collisions)).toEqual(
      new Array(901).fill(0),
    );
  });
});

describe('determinism', () => {
  const steps = [
    createTestStep('steer.blend', ids.slice(0, 6), flock),
    createTestStep('steer.blend', ids.slice(6), { 'wander-weight': 1 }),
  ];

  it('two runs from one seed and one step list hash identically over 600 frames', () => {
    expect(hashes(steps, 600)).toEqual(hashes(steps, 600));
  });

  it('a different seed changes a wandering run', () => {
    const other = createTestScene(twelve, { seed: 8 });
    const first = runBranch(scene, steps, 60).at(-1);
    const second = runBranch(other, steps, 60).at(-1);
    expect(hashFrame(frameOf(first as SimulationState))).not.toBe(
      hashFrame(frameOf(second as SimulationState)),
    );
  });

  it('a wandering unit stays on the field', () => {
    const states = runBranch(
      scene,
      [createTestStep('steer.blend', ids, { 'wander-weight': 1 })],
      1800,
    );
    for (const unit of states[1800].units) {
      expect(unit.position.x).toBeGreaterThanOrEqual(unit.radius);
      expect(unit.position.x).toBeLessThanOrEqual(120 - unit.radius);
      expect(unit.position.y).toBeGreaterThanOrEqual(unit.radius);
      expect(unit.position.y).toBeLessThanOrEqual(80 - unit.radius);
    }
  });
});

describe('the interpreter', () => {
  it('refuses a kind it does not interpret, naming it and changing nothing', () => {
    const start = createSimulation(scene);
    const step = createTestStep('ground.influence', ids);
    const result = applyStep(start, step);
    expect(result.refusal?.kind).toBe('ground.influence');
    expect(result.refusal?.reason).toContain('ground.influence');
    expect(result.state).toBe(start);
  });

  it('a refused step leaves the next hash and the tick count as if it were never made', () => {
    const steps = [createTestStep('steer.blend', ids, flock)];
    const withRefused = [...steps, createTestStep('ground.influence', ids)];
    const refusedRun = runBranch(scene, withRefused, 2);
    const plainRun = runBranch(scene, steps, 2);
    expect(hashFrame(frameOf(refusedRun[1]))).toBe(hashFrame(frameOf(plainRun[1])));
    expect(refusedRun[1].tick).toBe(plainRun[1].tick);
    expect(refusedRun[2].tick).toBe(2);
  });

  it('refuses a unit transform with no units, and names it', () => {
    const result = applyStep(createSimulation(scene), createTestStep('steer.blend', []));
    expect(result.refusal?.reason).toContain('steer.blend');
  });

  it('refuses a step whose units are not in the scene', () => {
    const result = applyStep(createSimulation(scene), createTestStep('steer.blend', ['ghost']));
    expect(result.refusal?.kind).toBe('steer.blend');
  });

  it('runs each interpreted kind', () => {
    const params: Readonly<Record<string, CompositionStep['params']>> = {
      'steer.blend': flock,
      'steer.priority': { 'avoidance-priority': 1, 'seek-priority': 2 },
      'formation.twoLevel': { pattern: 0 },
      'formation.fixed': {},
      'objective.set': { x: 10, y: 10 },
    };
    for (const kind of interpretedKinds) {
      const result = applyStep(createSimulation(scene), createTestStep(kind, ids, params[kind]));
      expect(result.refusal).toBeNull();
    }
  });

  it('reads every parameter family the catalog gives scene tools', () => {
    for (const name of [
      'seek-weight',
      'alignment-weight',
      'flee-player-weight',
      'time-to-target',
      'random-binomial-scale',
      'epsilon',
      'wander-priority',
      'anchor-lag-limit',
      'cost.close-combat.ranged',
    ])
      expect(readsParam(name)).toBe(true);
    expect(readsParam('unheard-of')).toBe(false);
  });

  it('a later step overrides a term and keeps the others', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('steer.blend', ids, flock));
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ids, { 'cohesion-weight': 3, 'wander-weight': 0.5 }),
    ));
    expect(state.units[0].behaviour.weights).toEqual({
      separation: 2,
      cohesion: 3,
      velocityMatch: 1,
      wander: 0.5,
    });
  });

  it('previews the first accelerations without changing the scene', () => {
    const start = createSimulation(scene);
    const preview = previewStep(start, createTestStep('steer.blend', ids, flock));
    expect(preview.arrows).toHaveLength(12);
    expect(preview.arrows.some(({ acceleration }) => length(acceleration) > 0)).toBe(true);
    expect(start.units[0].behaviour.weights).toEqual({});
  });

  it('previews a formation with its slot table', () => {
    const preview = previewStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
    );
    expect(preview.assignment).toHaveLength(12);
  });

  it('previews the slot table when a formation is formed again', () => {
    const step = createTestStep('formation.twoLevel', ids, { pattern: 0 });
    const { state } = applyStep(createSimulation(scene), step);
    const preview = previewStep(state, createTestStep('formation.twoLevel', ids, { pattern: 1 }));
    expect(preview.assignment).toHaveLength(12);
  });

  it('reads the slot table of the formation holding a unit', () => {
    const { state } = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids.slice(0, 4), { pattern: 0 }),
    );
    expect(assignmentOf(state, ids.slice(2, 3))).toHaveLength(4);
    expect(assignmentOf(state, ids.slice(5, 6))).toEqual([]);
  });

  it('previews a refusal instead of arrows', () => {
    const preview = previewStep(createSimulation(scene), createTestStep('level.ring', ids));
    expect(preview.arrows).toEqual([]);
    expect(preview.refusal?.kind).toBe('level.ring');
  });
});

describe('metrics', () => {
  it('counts an overlap and focuses on the given units', () => {
    const crowd = createTestScene([
      createTestUnit('a', { position: { x: 10, y: 10 } }),
      createTestUnit('b', { position: { x: 10.5, y: 10 } }),
      createTestUnit('c', { position: { x: 50, y: 10 } }),
    ]);
    const state = createSimulation(crowd);
    expect(measure(state).collisions).toBe(1);
    expect(measure(state, ['c']).collisions).toBe(0);
    expect(measure(state, ['a']).collisions).toBe(1);
    expect(measure(state, ['a', 'b']).cohesionRadius).toBeCloseTo(0.25);
  });

  it('reads headings as a circular variance', () => {
    const agreeing = createTestScene([createTestUnit('a'), createTestUnit('b')]);
    const opposed = createTestScene([
      createTestUnit('a'),
      createTestUnit('b', { heading: { x: -1, y: 0 } }),
    ]);
    expect(measure(createSimulation(agreeing)).headingVariance).toBe(0);
    expect(measure(createSimulation(opposed)).headingVariance).toBe(1);
  });

  it('has no fabricated formation or objective figures at idle', () => {
    const idle = measure(createSimulation(scene));
    expect(idle.timeToObjective).toBeNull();
    expect(idle.anchorToMean).toBeNull();
    expect(idle.slotError).toBeNull();
    expect(idle.assignmentCost).toBeNull();
    expect(idle.stalledUnits).toBe(0);
  });

  it('counts a unit held short of its goal as stalled', () => {
    // A pair pushed apart by separation around an objective they cannot both reach.
    const pair = createTestScene([
      createTestUnit('a', { position: { x: 40, y: 40 }, maxAcceleration: 30 }),
      createTestUnit('b', { position: { x: 40, y: 60 } }),
    ]);
    let { state } = applyStep(
      createSimulation(pair),
      createTestStep('objective.set', [], { x: 40, y: 50 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ['a', 'b'], {
        'arrive-weight': 1,
        'target-radius': 0,
        'separation-weight': 5,
        threshold: 10,
      }),
    ));
    const settled = runFor(state, 1200);
    expect(settled.units.every((unit) => length(unit.velocity) < 0.05)).toBe(true);
    const centre = centroid(settled.units.map((unit) => unit.position));
    expect(distance(centre, { x: 40, y: 50 })).toBeLessThan(1);
    // Their centre stands on the objective, so the group has arrived and nobody is stalled.
    expect(measure(settled).stalledUnits).toBe(0);
  });

  it('times a run in simulated seconds', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep('objective.set', [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ['a'], { 'arrive-weight': 1 })));
    const settled = runFor(state, 900);
    const seconds = measure(settled).timeToObjective ?? 0;
    expect(seconds).toBeGreaterThan(30 / 12);
    expect(seconds).toBeLessThan(900 * frameSeconds);
  });
});
