import { createTestScene, createTestStep, createTestUnit } from '../../testing/src';
import { nearestOnSegment } from './geometry';
import { applyStep } from './interpreter';
import { measure } from './metrics';
import { defaultPathSettings, followTarget } from './path-following';
import { advance, createSimulation, frameOf } from './simulation';
import type { CompositionStep, SimulationState, Unit } from './types';
import { centroid, distance, length } from './vectors';

// One unit west of a wall that stands down from the top edge at x = 60 to y = 50; the objective
// lies east of it, so the way is round the wall's foot.
const walker = createTestUnit('walker', { position: { x: 20, y: 20 } });
const wallStep = createTestStep('field.wall', [], {
  x1: 60,
  y1: 0,
  x2: 60,
  y2: 50,
  thickness: 1,
  shape: 1,
});
const objectiveStep = createTestStep('objective.set', [], { x: 100, y: 20 });
const aStar = (ids: readonly string[]) => createTestStep('path.find', ids, { heuristic: 3 });

function scene(units: readonly Unit[], steps: readonly CompositionStep[]): SimulationState {
  return steps.reduce(
    (state, step) => applyStep(state, step).state,
    createSimulation(createTestScene(units)),
  );
}

function run(state: SimulationState, frames: number, watch?: (state: SimulationState) => void) {
  let current = state;
  for (let frame = 0; frame < frames; frame += 1) {
    current = advance(current);
    watch?.(current);
  }
  return current;
}

// How far the nearest body is from the nearest shape's surface; below nothing means inside it.
function leastClearance(state: SimulationState) {
  let least = Infinity;
  for (const unit of state.units) {
    for (const { from, to, thickness } of state.geometry.walls) {
      const gap = distance(unit.position, nearestOnSegment(unit.position, from, to));
      least = Math.min(least, gap - thickness / 2 - unit.radius);
    }
    for (const { centre, radius } of state.geometry.obstacles)
      least = Math.min(least, distance(unit.position, centre) - radius - unit.radius);
  }
  return least;
}

describe('following a route', () => {
  it('takes a unit round a wall to the objective, never into it', () => {
    let least = Infinity;
    const start = scene([walker], [wallStep, objectiveStep, aStar(['walker'])]);
    const end = run(start, 900, (state) => (least = Math.min(least, leastClearance(state))));
    expect(start.units[0].route?.status).toBe('following');
    expect(frameOf(end).units[0].activity).toBe('arrived');
    expect(least).toBeGreaterThanOrEqual(0);
  });

  it('reads the route still to walk, shrinking as the unit walks it, and none without a route', () => {
    const start = scene([walker], [wallStep, objectiveStep, aStar(['walker'])]);
    const before = measure(start).pathLength;
    const later = measure(run(start, 60)).pathLength;
    expect(before).toBeGreaterThan(distance(walker.position, { x: 100, y: 20 }));
    expect(later).toBeLessThan(before ?? 0);
    expect(measure(scene([walker], [wallStep, objectiveStep])).pathLength).toBeNull();
  });

  it('aims the path offset along its leg, further ahead when it predicts, never past the leg, and at the waypoint when the aim falls under the unit', () => {
    const route = {
      status: 'following' as const,
      reason: null,
      waypoints: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      next: 1,
      search: null,
      replans: 0,
      plannedAt: 0,
    };
    const unit = { position: { x: 2, y: 1 }, velocity: { x: 10, y: 0 }, radius: 0.5 };
    const settings = { ...defaultPathSettings, pathOffset: 1 };
    expect(followTarget(unit, route, settings).point).toEqual({ x: 3, y: 0 });
    expect(followTarget(unit, route, { ...settings, predictTime: 0.5 }).point).toEqual({
      x: 8,
      y: 0,
    });
    const target = followTarget(unit, route, { ...settings, predictTime: 2 });
    expect(target.point).toEqual({ x: 10, y: 0 });
    expect(target.corner?.straightness).toBeCloseTo(0);
    const standing = { ...unit, position: { x: 2, y: 0 }, velocity: { x: 0, y: 0 } };
    expect(followTarget(standing, route, { ...settings, pathOffset: 0 }).point).toEqual({
      x: 10,
      y: 0,
    });
  });

  it('arrives with the path offset and the waypoint radius at their least', () => {
    const follow = createTestStep('path.follow', ['walker'], {
      'waypoint-radius': 0.25,
      'path-offset': 0,
    });
    const end = run(scene([walker], [wallStep, objectiveStep, follow]), 900);
    expect(frameOf(end).units[0].activity).toBe('arrived');
  });
});

describe('no route', () => {
  const sealing = createTestStep('field.wall', [], {
    x1: 60,
    y1: 40,
    x2: 60,
    y2: 80,
    thickness: 1,
    shape: 2,
  });

  it('stops a unit sealed off from the objective and says why, in its activity and the count', () => {
    const sealed = scene([walker], [wallStep, sealing, objectiveStep, aStar(['walker'])]);
    const end = run(sealed, 120);
    expect(end.units[0].route).toMatchObject({ status: 'blocked', reason: 'no-path' });
    expect(frameOf(end).units[0].activity).toBe('blocked');
    expect(frameOf(end).routes[0].reason).toBe('no-path');
    expect(measure(end).blockedUnits).toBe(1);
    expect(measure(end).stalledUnits).toBe(0);
    expect(end.units[0].velocity).toEqual({ x: 0, y: 0 });
  });

  it('keeps a unit under priority steering where it stands, as any other', () => {
    const priority = createTestStep('steer.priority', ['walker'], {
      'avoidance-priority': 1,
      'separation-priority': 2,
      'seek-priority': 3,
      epsilon: 0.1,
    });
    const sealed = scene([walker], [wallStep, sealing, objectiveStep, aStar(['walker']), priority]);
    const end = run(sealed, 300);
    expect(end.units[0].route?.status).toBe('blocked');
    expect(distance(end.units[0].position, walker.position)).toBeLessThan(0.01);
  });

  it.each([
    ['Velocity matching', { 'velocity-match-weight': 1 }],
    ['Flocking', { 'separation-weight': 2, 'cohesion-weight': 1, 'velocity-match-weight': 1 }],
  ])('keeps a unit given %s where it stands, rather than cruising on', (_name, params) => {
    const blend = createTestStep('steer.blend', ['walker'], params);
    const sealed = scene([walker], [wallStep, sealing, objectiveStep, blend, aStar(['walker'])]);
    const end = run(sealed, 300);
    expect(end.units[0].route?.status).toBe('blocked');
    expect(distance(end.units[0].position, walker.position)).toBeLessThan(0.01);
  });

  it('stops a squad carrying Velocity matching, sealed off on the move, close to where it was', () => {
    const squad = [
      createTestUnit('a', { position: { x: 18, y: 18 } }),
      createTestUnit('b', { position: { x: 22, y: 18 } }),
      createTestUnit('c', { position: { x: 18, y: 22 } }),
      createTestUnit('d', { position: { x: 22, y: 22 } }),
    ];
    const ids = squad.map(({ id }) => id);
    const matching = createTestStep('steer.blend', ids, { 'velocity-match-weight': 1 });
    const moving = run(scene(squad, [wallStep, objectiveStep, matching, aStar(ids)]), 30);
    expect(Math.max(...moving.units.map(({ velocity }) => length(velocity)))).toBeGreaterThan(1);
    const sealed = applyStep(moving, { ...sealing, at: 30 }).state;
    const centre = centroid(sealed.units.map(({ position }) => position));
    const end = run(sealed, 300);
    expect(end.units.every(({ route }) => route?.status === 'blocked')).toBe(true);
    expect(distance(centroid(end.units.map(({ position }) => position)), centre)).toBeLessThan(3);
    expect(Math.max(...end.units.map(({ velocity }) => length(velocity)))).toBeLessThan(0.05);
  });

  // Whatever else a unit carries, given before its path tool or after it, having no route stops
  // it: sealed off on the move it comes to rest close by and stays there, and it goes on as it was
  // composed once the walls clear.
  const mate = createTestUnit('mate', { position: { x: 20, y: 60 } });
  const carried: readonly (readonly [
    string,
    readonly CompositionStep[],
    readonly CompositionStep[],
  ])[] = [
    ['Wander', [createTestStep('steer.blend', ['walker'], { 'wander-weight': 1 })], []],
    [
      'cohesion with a unit that has a way',
      [createTestStep('steer.blend', ['walker', 'mate'], { 'cohesion-weight': 1 })],
      [],
    ],
    [
      'a priority order that wanders once seeking is still',
      [],
      [
        createTestStep('steer.priority', ['walker'], {
          'seek-priority': 1,
          'wander-priority': 2,
          epsilon: 0.1,
        }),
      ],
    ],
  ];

  it.each(carried)(
    'brings a unit carrying %s to rest when it is sealed off on the move, and frees it when the walls clear',
    (_name, before, after) => {
      const steps = [wallStep, objectiveStep, ...before, aStar(['walker']), ...after];
      const moving = run(scene([walker, mate], steps), 30);
      expect(length(moving.units[0].velocity)).toBeGreaterThan(0.5);

      const sealed = applyStep(moving, { ...sealing, at: 30 }).state;
      const end = run(sealed, 300);
      expect(end.units[0].route).toMatchObject({ status: 'blocked', reason: 'no-path' });
      expect(frameOf(end).units[0].activity).toBe('blocked');
      expect(end.units[0].velocity).toEqual({ x: 0, y: 0 });
      expect(distance(end.units[0].position, sealed.units[0].position)).toBeLessThan(3);
      expect(run(end, 120).units[0].position).toEqual(end.units[0].position);

      const cleared = applyStep(end, createTestStep('field.clear', [], {}, end.tick)).state;
      expect(cleared.units[0].route?.status).toBe('following');
      const freed = run(cleared, 120);
      expect(distance(freed.units[0].position, end.units[0].position)).toBeGreaterThan(1);
    },
  );

  it('moves the unit on again once the walls are cleared', () => {
    const sealed = run(scene([walker], [wallStep, sealing, objectiveStep, aStar(['walker'])]), 60);
    const cleared = applyStep(sealed, createTestStep('field.clear', [], {}, 60)).state;
    expect(cleared.units[0].route?.status).toBe('following');
    expect(frameOf(run(cleared, 600)).units[0].activity).toBe('arrived');
  });
});

describe('a route and a formation', () => {
  const squad = [
    createTestUnit('a', { position: { x: 20, y: 18 } }),
    createTestUnit('b', { position: { x: 20, y: 22 } }),
    createTestUnit('c', { position: { x: 16, y: 20 } }),
  ];
  const ids = squad.map(({ id }) => id);

  it('takes the units a two-level formation places off their routes, so none reads a route it does not follow', () => {
    const routed = scene(squad, [wallStep, objectiveStep, aStar(ids)]);
    expect(measure(routed).pathLength).not.toBeNull();
    const formed = applyStep(routed, createTestStep('formation.twoLevel', ids, { pattern: 0 }));
    expect(formed.state.units.map(({ route }) => route)).toEqual([null, null, null]);
    expect(formed.state.units.map(({ behaviour }) => behaviour.path)).toEqual([null, null, null]);
    expect(frameOf(formed.state).routes).toEqual([]);
    expect(measure(formed.state).pathLength).toBeNull();
    // A field step plans every route again, and these units have none to plan.
    const walled = applyStep(
      formed.state,
      createTestStep('field.obstacle', [], { x: 40, y: 60, radius: 3, shape: 3 }),
    );
    expect(frameOf(walled.state).routes).toEqual([]);
  });

  it('leaves a fixed formation’s leader its route and takes its followers off theirs', () => {
    const routed = scene(squad, [wallStep, objectiveStep, aStar(ids)]);
    const { state } = applyStep(routed, createTestStep('formation.fixed', ids));
    expect(state.units[0].route?.status).toBe('following');
    expect(state.units.slice(1).map(({ route }) => route)).toEqual([null, null]);
    const end = run(state, 900);
    expect(distance(end.units[0].position, { x: 100, y: 20 })).toBeLessThan(2);
  });

  // BOARDED: a two-level formation's anchor takes no route, so a formation sent beyond a wall
  // walks straight at it and stalls there. Routing a formation is a feature of its own: the
  // anchor following a route, its slots clearing the geometry, and a formation with no way.
  it.skip('takes a two-level formation round a wall to the objective', () => {
    const formed = scene(squad, [
      wallStep,
      objectiveStep,
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
    ]);
    const end = run(formed, 1500);
    expect(frameOf(end).units.every(({ activity }) => activity === 'formed')).toBe(true);
    expect(measure(end).timeToObjective).not.toBeNull();
  });

  it('takes a unit out of its formation and onto a route when a path tool follows', () => {
    const formed = scene(squad, [
      wallStep,
      objectiveStep,
      createTestStep('formation.twoLevel', ids, { pattern: 0 }),
      aStar(ids),
    ]);
    expect(formed.formations).toEqual([]);
    expect(formed.units.every(({ route }) => route?.status === 'following')).toBe(true);
  });
});

describe('planning again', () => {
  it('counts a plan made when a field step lands or the objective moves, not the first', () => {
    const start = scene([walker], [wallStep, objectiveStep, aStar(['walker'])]);
    expect(measure(start).replans).toBe(0);
    const walled = applyStep(
      run(start, 30),
      createTestStep('field.obstacle', [], { x: 40, y: 60, radius: 3, shape: 3 }, 30),
    ).state;
    expect(measure(walled).replans).toBe(1);
    const moved = applyStep(
      walled,
      createTestStep('objective.set', [], { x: 100, y: 70 }, 30),
    ).state;
    expect(measure(moved).replans).toBe(2);
    expect(frameOf(moved).routes[0].replanning).toBe(true);
    expect(frameOf(run(moved, 30)).routes[0].replanning).toBe(false);
  });

  it('plans again when the geometry stops a unit off its way, as a push off its route would', () => {
    const start = run(scene([walker], [objectiveStep, aStar(['walker'])]), 10);
    // A wall arriving between the unit and the waypoint it makes for, without a step, stands for
    // anything that leaves a unit facing geometry it did not plan round, as a push off its route
    // does: its next step into the wall is stopped, and it plans again from where it stands.
    const across = {
      ...start,
      geometry: {
        ...start.geometry,
        walls: [{ shape: 9, from: { x: 20.5, y: 0 }, to: { x: 20.5, y: 40 }, thickness: 0.2 }],
      },
    };
    const route = across.units[0].route;
    expect(route?.waypoints[route.next].x).toBeGreaterThan(20.5);
    expect(measure(across).replans).toBe(0);
    let replanned: number | null = null;
    const end = run(across, 120, (state) => {
      if (replanned === null && measure(state).replans === 1) replanned = state.tick;
    });
    expect((replanned ?? Infinity) - across.tick).toBeLessThanOrEqual(60);
    expect(frameOf(run(end, 900)).units[0].activity).toBe('arrived');
  });
});
