import {
  createScatteredUnits,
  createTestScene,
  createTestStep,
  createTestUnit,
} from '../../testing/src';
import { memberMean, patternSlotRoles, patternSlots, placeOf, slotPosition } from './formation';
import { applyStep } from './interpreter';
import { measure } from './metrics';
import { squadOf, unitsFollowingNothing } from './queries';
import { advance, createSimulation, isAtRest } from './simulation';
import { assignSlots, slotCostKey } from './slot-assignment';
import type { SimulationState, Vec2 } from './types';
import { centroid, distance, length } from './vectors';

const units = createScatteredUnits(9);
const ids = units.map((unit) => unit.id);
const scene = createTestScene(units);

function runFor(state: SimulationState, frames: number) {
  let current = state;
  for (let frame = 0; frame < frames; frame += 1) current = advance(current);
  return current;
}

const near = (slots: readonly Vec2[]) => slots.map(({ x, y }) => ({ x, y }));

describe('patterns', () => {
  it('centres every pattern on the anchor', () => {
    for (const pattern of ['wedge', 'line', 'column'] as const) {
      const middle = centroid(patternSlots(pattern, 7, 2));
      expect(middle.x).toBeCloseTo(0);
      expect(middle.y).toBeCloseTo(0);
    }
  });

  it('spaces a line abreast and a column in file', () => {
    expect(near(patternSlots('line', 3, 2))).toEqual([
      { x: 0, y: -2 },
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ]);
    expect(near(patternSlots('column', 3, 2))).toEqual([
      { x: 2, y: 0 },
      { x: 0, y: 0 },
      { x: -2, y: 0 },
    ]);
  });

  it('leads a wedge with its tip and widens each row behind it', () => {
    const slots = patternSlots('wedge', 5, 1);
    expect(slots[0].x).toBeGreaterThan(slots[1].x);
    expect(slots[1].x).toBe(slots[2].x);
    expect(slots[1].y).toBe(-slots[2].y);
    expect(Math.abs(slots[3].y)).toBeGreaterThan(Math.abs(slots[1].y));
  });

  it('gives the leading third close-combat slots', () => {
    expect(patternSlotRoles(6)).toEqual([
      'close-combat',
      'close-combat',
      'ranged',
      'ranged',
      'support',
      'support',
    ]);
  });
});

describe('greedy slot assignment', () => {
  const costs = {
    [slotCostKey('scout', 'front')]: 0,
    [slotCostKey('scout', 'rear')]: 5,
    [slotCostKey('medic', 'front')]: 0,
    [slotCostKey('medic', 'rear')]: 0,
    [slotCostKey('gunner', 'front')]: 3,
    [slotCostKey('gunner', 'rear')]: 0,
  };

  it('places the hardest to place first', () => {
    // Worked by hand. Gunner accepts one slot (the rear), scout two (both fronts), medic all
    // three. Order: gunner, scout, medic. Gunner takes rear 2, scout front 0, medic front 1.
    const assignment = assignSlots(
      [
        { id: 'medic', unitClass: 'medic' },
        { id: 'scout', unitClass: 'scout' },
        { id: 'gunner', unitClass: 'gunner' },
      ],
      ['front', 'front', 'rear'],
      costs,
    );
    expect(assignment).toEqual([
      { unitId: 'gunner', slot: 2, slotRole: 'rear', cost: 0 },
      { unitId: 'scout', slot: 0, slotRole: 'front', cost: 0 },
      { unitId: 'medic', slot: 1, slotRole: 'front', cost: 0 },
    ]);
  });

  it('charges the cost a constrained unit cannot avoid', () => {
    const assignment = assignSlots(
      [
        { id: 'first', unitClass: 'scout' },
        { id: 'second', unitClass: 'scout' },
      ],
      ['front', 'rear'],
      costs,
    );
    expect(assignment.map(({ cost }) => cost)).toEqual([0, 5]);
  });

  it('treats a missing cost as unsuitable, never as free', () => {
    const [only] = assignSlots([{ id: 'a', unitClass: 'unknown' }], ['front'], costs);
    expect(only.cost).toBe(100);
  });
});

describe('two-level formation', () => {
  const objective = { x: 100, y: 60 };

  function formed(extra: Record<string, number> = {}) {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], objective),
    );
    ({ state } = applyStep(
      state,
      createTestStep('formation.twoLevel', ids, {
        pattern: 0,
        'slot-spacing': 2,
        'anchor-speed': 2,
        'anchor-lag-limit': 5,
        ...extra,
      }),
    ));
    return state;
  }

  it('sends each member to a distinct slot and holds it once the march ends', () => {
    const settled = runFor(formed(), 1800);
    const [formation] = settled.formations;
    expect(new Set(formation.assignment.map(({ slot }) => slot)).size).toBe(9);
    expect(measure(settled).slotError).toBeLessThan(1);
  });

  it('keeps the anchor within its lag limit of the members mean', () => {
    let state = formed({ 'anchor-speed': 5, 'anchor-lag-limit': 3 });
    for (let frame = 0; frame < 900; frame += 1) {
      state = advance(state);
      const [formation] = state.formations;
      expect(distance(formation.anchor, memberMean(formation, state.units))).toBeLessThanOrEqual(
        3 + 1e-9,
      );
    }
  });

  it('holds the anchor back when the members are slower than it', () => {
    const slow = createTestScene(units.map((unit) => ({ ...unit, maxSpeed: 1 })));
    let { state } = applyStep(
      createSimulation(slow),
      createTestStep('objective.set', [], objective),
    );
    ({ state } = applyStep(
      state,
      createTestStep('formation.twoLevel', ids, { 'anchor-speed': 5, 'anchor-lag-limit': 4 }),
    ));
    const later = runFor(state, 600);
    expect(measure(later).anchorToMean).toBeLessThanOrEqual(4 + 1e-9);
    expect(distance(later.formations[0].anchor, objective)).toBeGreaterThan(20);
  });

  it('carries the group to the objective', () => {
    const settled = runFor(formed({ 'anchor-speed': 5 }), 3600);
    const centre = centroid(settled.units.map((unit) => unit.position));
    expect(distance(centre, objective)).toBeLessThan(2);
    expect(measure(settled).timeToObjective).not.toBeNull();
  });

  it('reports the assignment cost from the cost table', () => {
    const state = formed({ 'cost.close-combat.close-combat': 4 });
    expect(measure(state).assignmentCost).toBeGreaterThan(0);
  });

  it('turns slots with the heading', () => {
    const state = formed();
    const [formation] = state.formations;
    const tip = slotPosition(formation, 0);
    const toObjective = { x: objective.x - tip.x, y: objective.y - tip.y };
    const fromAnchor = {
      x: tip.x - formation.anchor.x,
      y: tip.y - formation.anchor.y,
    };
    expect(fromAnchor.x * toObjective.x + fromAnchor.y * toObjective.y).toBeGreaterThan(0);
  });

  it('releases a unit given a later steering tool', () => {
    let state = formed();
    ({ state } = applyStep(state, createTestStep('steer.blend', ['unit-1'], { 'seek-weight': 1 })));
    expect(state.formations[0].assignment.map(({ unitId }) => unitId)).not.toContain('unit-1');
    expect(placeOf(state.formations, 'unit-1')).toBeNull();
  });

  it('holds still when it loses members, with its anchor among those left', () => {
    const start = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
    ).state;
    let settled = runFor(start, 900);
    ({ state: settled } = applyStep(
      settled,
      createTestStep('steer.blend', ['unit-1', 'unit-2', 'unit-3'], { 'separation-weight': 1 }),
    ));
    const [formation] = settled.formations;
    expect(distance(formation.anchor, memberMean(formation, settled.units))).toBeLessThan(0.5);
    const later = runFor(settled, 1800);
    expect(distance(later.formations[0].anchor, formation.anchor)).toBeLessThan(0.5);
    expect(isAtRest(later)).toBe(true);
  });

  it('keeps every member where it stood when others leave', () => {
    const settled = runFor(formed(), 900);
    const [formation] = settled.formations;
    const { state } = applyStep(
      settled,
      createTestStep('steer.blend', ['unit-1'], { 'separation-weight': 1 }),
    );
    for (const { unitId, slot } of state.formations[0].assignment) {
      const was = formation.assignment.find((place) => place.unitId === unitId);
      expect(
        distance(slotPosition(state.formations[0], slot), slotPosition(formation, was?.slot ?? 0)),
      ).toBeLessThan(1e-9);
    }
  });

  it('marches on under priority steering, keeping its own spacing', () => {
    let state = formed();
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    const settled = runFor(state, 1800);
    expect(measure(settled).timeToObjective).not.toBeNull();
    expect(measure(settled).slotError).toBeLessThan(1);
  });

  it('is not at rest while its anchor has somewhere to go', () => {
    const start = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
    ).state;
    let standing = runFor(start, 1200);
    expect(isAtRest(standing)).toBe(true);
    ({ state: standing } = applyStep(
      standing,
      createTestStep('objective.set', [], { x: 100, y: 60 }),
    ));
    expect(isAtRest(standing)).toBe(false);
    expect(isAtRest(advance(standing))).toBe(false);
  });

  it('marks members formed once they stand in their slots', () => {
    const scattered = applyStep(
      createSimulation(scene),
      createTestStep('formation.twoLevel', ids, { pattern: 1 }),
    ).state;
    const settled = runFor(scattered, 900);
    const frameUnits = settled.units.map((unit) => unit.id);
    expect(frameUnits).toHaveLength(9);
    expect(measure(settled).slotError).toBeLessThan(1);
  });
});

describe('fixed formation', () => {
  function fixedWithWander() {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('formation.fixed', ids, { 'slot-spacing': 2 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ['unit-1'], { 'wander-weight': 1 }),
    ));
    return state;
  }

  it('follows the first selected unit as its leader', () => {
    const state = applyStep(createSimulation(scene), createTestStep('formation.fixed', ids)).state;
    const [formation] = state.formations;
    expect(formation.leader).toBe('unit-1');
    expect(placeOf(state.formations, 'unit-1')).toBeNull();
    expect(placeOf(state.formations, 'unit-2')?.formation).toBe(formation);
  });

  it('takes over from a two-level formation on the same units', () => {
    const objective = { x: 100, y: 60 };
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], objective),
    );
    ({ state } = applyStep(state, createTestStep('formation.twoLevel', ids, { pattern: 0 })));
    state = runFor(state, 60);
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    expect(state.formations).toHaveLength(1);
    const settled = runFor(state, 1200);
    expect(distance(settled.units[0].position, objective)).toBeLessThanOrEqual(1.05);
    expect(measure(settled).timeToObjective).not.toBeNull();
  });

  it('gives a leader taken from another fixed formation a lead of its own', () => {
    const objective = { x: 100, y: 60 };
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], objective),
    );
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids.slice(0, 4))));
    state = runFor(state, 60);
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids.slice(1, 6))));
    const settled = runFor(state, 1200);
    expect(distance(settled.units[1].position, objective)).toBeLessThanOrEqual(1.05);
  });

  it('follows an objective set after it formed', () => {
    const objective = { x: 100, y: 60 };
    let { state } = applyStep(createSimulation(scene), createTestStep('formation.fixed', ids));
    ({ state } = applyStep(state, createTestStep('objective.set', [], objective)));
    const settled = runFor(state, 1200);
    expect(distance(settled.units[0].position, objective)).toBeLessThanOrEqual(1.05);
    expect(measure(settled).timeToObjective).not.toBeNull();
  });

  it('times the leader alone, whatever steering its followers carried in', () => {
    const objective = { x: 60, y: 40 };
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], objective),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    state = runFor(state, 60);
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    expect(measure(runFor(state, 1200)).timeToObjective).not.toBeNull();
  });

  it('counts a leader with steering of its own in the squad it still leads', () => {
    const state = fixedWithWander();
    expect(new Set(squadOf(state, 'unit-1'))).toEqual(new Set(ids));
    expect(new Set(squadOf(state, 'unit-2'))).toEqual(new Set(ids));
    expect(unitsFollowingNothing(state, ['unit-1', 'unit-2'])).toEqual(['unit-1']);
  });

  it('propagates the leader’s wander to its followers', () => {
    const start = fixedWithWander();
    const settled = runFor(start, 600);
    const followerMoved = distance(settled.units[1].position, start.units[1].position);
    expect(followerMoved).toBeGreaterThan(1);
    expect(length(settled.units[0].velocity)).toBeGreaterThan(0);
  });

  it('gives an idle leader the objective, so the formation has a lead', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 100, y: 60 }),
    );
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    const settled = runFor(state, 900);
    expect(distance(settled.units[0].position, { x: 100, y: 60 })).toBeLessThanOrEqual(1);
  });

  it('settles under priority steering with its leader keeping the formation’s spacing', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 100, y: 60 }),
    );
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    expect(isAtRest(runFor(state, 1800))).toBe(true);
  });

  it('keeps a leader with separation from walking away from its own followers', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, { 'separation-weight': 1 }),
    );
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    const settled = runFor(state, 1800);
    expect(isAtRest(settled)).toBe(true);
    expect(distance(settled.units[0].position, state.units[0].position)).toBeLessThan(2);
  });

  it('leaves a leader told to stay where it is', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 100, y: 60 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 0 })));
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    const settled = runFor(state, 600);
    expect(distance(settled.units[0].position, state.units[0].position)).toBeLessThan(0.01);
  });

  it('gives a leader with other steering the objective too', () => {
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, { 'separation-weight': 1 }),
    );
    ({ state } = applyStep(state, createTestStep('objective.set', [], { x: 100, y: 60 })));
    ({ state } = applyStep(state, createTestStep('formation.fixed', ids)));
    const settled = runFor(state, 1200);
    expect(distance(settled.units[0].position, { x: 100, y: 60 })).toBeLessThan(5);
  });

  it('leaves no order behind on a leader that stops leading', () => {
    let { state } = applyStep(createSimulation(scene), createTestStep('formation.fixed', ids));
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ids, { 'separation-weight': 2, 'cohesion-weight': 1 }),
    ));
    expect(state.formations).toEqual([]);
    expect(state.units[0].behaviour.weights.arrive).toBeUndefined();
  });

  it('one unit alone forms with no followers', () => {
    const lone = createTestScene([createTestUnit('a')]);
    const { refusal, state } = applyStep(
      createSimulation(lone),
      createTestStep('formation.fixed', ['a']),
    );
    expect(refusal).toBeNull();
    expect(state.formations[0].leader).toBe('a');
  });
});
