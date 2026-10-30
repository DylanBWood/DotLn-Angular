import {
  createScatteredUnits,
  createTestScene,
  createTestStep,
  createTestUnit,
} from '../../testing/src';
import { blend, firstActive } from './blending';
import { applyStep } from './interpreter';
import { measure } from './metrics';
import { advance, createSimulation, isAtRest } from './simulation';
import {
  arrive,
  avoid,
  flee,
  matchVelocity,
  seek,
  separate,
  type SteeringBody,
  wander,
} from './steering';
import { centroid, distance, length, sine, zero } from './vectors';

const body = (overrides: Partial<SteeringBody> = {}): SteeringBody => ({
  position: zero,
  velocity: zero,
  heading: { x: 1, y: 0 },
  maxSpeed: 12,
  maxAcceleration: 30,
  radius: 0.5,
  wanderAngle: 0,
  ...overrides,
});

const separation = { separationThreshold: 3, separationFalloff: 2 };

describe('steering on known inputs', () => {
  it('seek accelerates at the maximum straight at the target', () => {
    expect(seek(body(), { x: 10, y: 0 })).toEqual({ x: 30, y: 0 });
  });

  it('velocity matching reaches the velocity within the time to target, clipped', () => {
    expect(matchVelocity(body(), { x: 1, y: 0 }, 0.25)).toEqual({ x: 4, y: 0 });
    expect(length(matchVelocity(body(), { x: 100, y: 0 }, 0.25))).toBe(30);
  });

  it('arrive wants full speed outside the slow radius and less inside it', () => {
    const tuning = { slowRadius: 10, targetRadius: 1, timeToTarget: 0.25 };
    expect(arrive(body(), { x: 50, y: 0 }, tuning)).toEqual({ x: 30, y: 0 });
    expect(arrive(body(), { x: 5, y: 0 }, tuning).x).toBeCloseTo(22.74, 2);
  });

  it('arrive fades to nothing halfway inside the target radius, with no step on the way', () => {
    const tuning = { slowRadius: 10, targetRadius: 1, timeToTarget: 0.25 };
    const wanted = (gap: number) => arrive(body(), { x: gap, y: 0 }, tuning).x;
    expect(wanted(0.5)).toBe(0);
    expect(wanted(0.51)).toBeLessThan(0.1);
    expect(wanted(1.01) - wanted(0.99)).toBeLessThan(0.11);
  });

  it('arrive brakes a moving body inside the target radius', () => {
    const tuning = { slowRadius: 10, targetRadius: 1, timeToTarget: 0.25 };
    const moving = body({ velocity: { x: 2, y: 0 } });
    expect(arrive(moving, { x: 0.5, y: 0 }, tuning)).toEqual({ x: -8, y: 0 });
  });

  it('separation pushes apart inside the threshold and is silent beyond it', () => {
    const near = [body(), body({ position: { x: 1, y: 0 } })];
    const far = [body(), body({ position: { x: 4, y: 0 } })];
    expect(separate(near[0], 0, near, separation).x).toBeCloseTo(-26.67, 2);
    expect(separate(far[0], 0, far, separation)).toEqual(zero);
  });

  it('separation fades to nothing at the threshold in both falloffs', () => {
    const pair = [body(), body({ position: { x: 2.999, y: 0 } })];
    for (const separationFalloff of [1, 2]) {
      const push = separate(pair[0], 0, pair, { ...separation, separationFalloff });
      expect(length(push)).toBeLessThan(0.05);
    }
  });

  it('flee fades to nothing at its radius', () => {
    expect(length(flee(body(), { x: 19.9, y: 0 }))).toBeLessThan(0.2);
    expect(flee(body(), { x: 1, y: 0 }).x).toBeCloseTo(-28.5);
    expect(flee(body(), { x: 21, y: 0 })).toEqual(zero);
  });

  it('separation falls off linearly or by the inverse square', () => {
    const pair = [body(), body({ position: { x: 2, y: 0 } })];
    const linear = separate(pair[0], 0, pair, { ...separation, separationFalloff: 1 });
    const square = separate(pair[0], 0, pair, separation);
    expect(linear.x).toBeCloseTo(-10);
    expect(square.x).toBeCloseTo(-4.17, 2);
  });

  it('separation parts two units standing on the same spot in opposite directions', () => {
    const pair = [body(), body()];
    const first = separate(pair[0], 0, pair, separation);
    const second = separate(pair[1], 1, pair, separation);
    expect(length(first)).toBeGreaterThan(0);
    expect(first.x).toBeCloseTo(-second.x);
    expect(first.y).toBeCloseTo(-second.y);
  });

  it('avoidance is silent with nothing to avoid and steers from a predicted collision', () => {
    const passing = [
      body({ velocity: { x: 2, y: 0 } }),
      body({ position: { x: 0, y: 10 }, velocity: { x: 2, y: 0 } }),
    ];
    expect(avoid(passing[0], 0, passing)).toEqual(zero);
    const headOn = [
      body({ velocity: { x: 5, y: 0 } }),
      body({ position: { x: 5, y: 0.2 }, velocity: { x: -5, y: 0 } }),
    ];
    expect(length(avoid(headOn[0], 0, headOn))).toBeCloseTo(30);
  });

  it('wander heads forward on a straight line when its angle is zero', () => {
    const output = wander(body({ heading: { x: 1, y: 0 } }), {
      wanderRadius: 4,
      wanderOffset: 6,
      timeToTarget: 0.25,
    });
    expect(output.x).toBeGreaterThan(0);
    expect(output.y).toBeCloseTo(0);
  });

  it('the arithmetic sine agrees with the native one', () => {
    for (const angle of [-3, -1, 0, 0.5, 1.5, 3, 7, 100])
      expect(sine(angle)).toBeCloseTo(Math.sin(angle), 9);
  });
});

describe('blending', () => {
  it('weighted blending sums and clips to the maximum acceleration', () => {
    const output = blend(
      [
        { weight: 2, acceleration: { x: 30, y: 0 } },
        { weight: 1, acceleration: { x: 30, y: 0 } },
      ],
      30,
    );
    expect(output).toEqual({ x: 30, y: 0 });
  });

  it('weights scale each term before the sum', () => {
    const output = blend(
      [
        { weight: 0.5, acceleration: { x: 4, y: 0 } },
        { weight: 2, acceleration: { x: 0, y: 1 } },
      ],
      30,
    );
    expect(output).toEqual({ x: 2, y: 2 });
  });
});

describe('priority steering', () => {
  it('uses the first group that clears epsilon', () => {
    expect(
      firstActive(
        [
          { x: 0.01, y: 0 },
          { x: 5, y: 0 },
          { x: 9, y: 0 },
        ],
        0.1,
      ),
    ).toEqual({ x: 5, y: 0 });
  });

  it('is silent when no group fires', () => {
    expect(firstActive([zero, { x: 0.01, y: 0 }], 0.1)).toEqual(zero);
  });

  it('is silent in a scene with nothing to avoid and no objective', () => {
    const scene = createTestScene([
      createTestUnit('a', { position: { x: 10, y: 10 } }),
      createTestUnit('b', { position: { x: 50, y: 50 } }),
    ]);
    const { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.priority', ['a', 'b'], {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    );
    expect(isAtRest(state)).toBe(true);
    expect(advance(state).units.map((unit) => unit.position)).toEqual(
      state.units.map((unit) => unit.position),
    );
  });

  it('swerves a unit heading into another before its own steering blends', () => {
    const scene = createTestScene([
      createTestUnit('a', { position: { x: 10, y: 40 }, velocity: { x: 8, y: 0 } }),
      createTestUnit('b', { position: { x: 22, y: 40.2 }, velocity: { x: -8, y: 0 } }),
    ]);
    const priority = {
      'avoidance-priority': 1,
      'separation-priority': 2,
      'seek-priority': 3,
      epsilon: 0.1,
    };
    let state = applyStep(
      createSimulation(scene),
      createTestStep('steer.priority', ['a', 'b'], priority),
    ).state;
    let closest = Infinity;
    for (let frame = 0; frame < 120; frame += 1) {
      state = advance(state);
      closest = Math.min(closest, distance(state.units[0].position, state.units[1].position));
    }
    expect(closest).toBeGreaterThan(1);
  });

  it('heads for the objective when the unit has no steering of its own', () => {
    const lone = createTestScene([createTestUnit('a', { position: { x: 10, y: 10 } })]);
    let { state } = applyStep(
      createSimulation(lone),
      createTestStep('objective.set', [], { x: 40, y: 10 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ['a'], { 'avoidance-priority': 1, 'seek-priority': 2 }),
    ));
    for (let frame = 0; frame < 600; frame += 1) state = advance(state);
    expect(distance(state.units[0].position, { x: 40, y: 10 })).toBeLessThanOrEqual(1);
    expect(measure(state).timeToObjective).not.toBeNull();
  });

  it('falls to the lower group when the higher one is in equilibrium', () => {
    const scene = createTestScene([createTestUnit('a', { position: { x: 60, y: 40 } })]);
    const { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.priority', ['a'], {
        'seek-priority': 1,
        'wander-priority': 2,
        epsilon: 0.1,
      }),
    );
    let moved = state;
    for (let frame = 0; frame < 60; frame += 1) moved = advance(moved);
    expect(distance(moved.units[0].position, state.units[0].position)).toBeGreaterThan(1);
  });

  it('turns a unit wandering by priority back from the edge', () => {
    const scene = createTestScene([createTestUnit('a', { position: { x: 60, y: 40 } })]);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.priority', ['a'], {
        'seek-priority': 1,
        'wander-priority': 2,
        epsilon: 0.1,
      }),
    );
    const { width, height } = scene.field;
    let closest = Infinity;
    for (let frame = 0; frame < 3600; frame += 1) {
      state = advance(state);
      const { x, y } = state.units[0].position;
      closest = Math.min(closest, x, y, width - x, height - y);
    }
    expect(closest).toBeGreaterThan(1);
  });

  it('leaves a flock under priority steering travelling', () => {
    const scene = createTestScene(createScatteredUnits(12));
    const ids = scene.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, {
        'separation-weight': 2,
        'cohesion-weight': 1,
        'velocity-match-weight': 1,
      }),
    );
    for (let frame = 0; frame < 120; frame += 1) state = advance(state);
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    for (let frame = 0; frame < 600; frame += 1) state = advance(state);
    const speeds = state.units.map((unit) => length(unit.velocity));
    expect(Math.max(...speeds)).toBeGreaterThan(1);
  });

  it('leaves a flock travelling past an objective it is not heading for', () => {
    const scene = createTestScene(createScatteredUnits(12));
    const ids = scene.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('steer.blend', ids, {
        'separation-weight': 2,
        'cohesion-weight': 1,
        'velocity-match-weight': 1,
      }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    for (let frame = 0; frame < 240; frame += 1) state = advance(state);
    const centre = centroid(state.units.map((unit) => unit.position));
    ({ state } = applyStep(
      state,
      createTestStep('objective.set', [], { x: centre.x, y: centre.y }),
    ));
    for (let frame = 0; frame < 600; frame += 1) state = advance(state);
    expect(Math.max(...state.units.map((unit) => length(unit.velocity)))).toBeGreaterThan(1);
  });

  it.each([1, 3, 25])('settles a crowd at a slow radius of %i too', (slowRadius) => {
    const scene = createTestScene(createScatteredUnits(12));
    const ids = scene.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 60, y: 40 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    ({ state } = applyStep(
      state,
      createTestStep('steer.blend', ids, { 'arrive-weight': 1, 'slow-radius': slowRadius }),
    ));
    for (let frame = 0; frame < 3000; frame += 1) state = advance(state);
    expect(measure(state).timeToObjective).not.toBeNull();
  });

  it('does not take a settled crowd slow to start again for one that has arrived', () => {
    const scene = createTestScene(createScatteredUnits(12));
    const ids = scene.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 60, y: 40 }),
    );
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    for (let frame = 0; frame < 2400; frame += 1) state = advance(state);
    const centre = centroid(state.units.map((unit) => unit.position));
    const farOff = { x: centre.x - 14, y: centre.y };
    ({ state } = applyStep(state, createTestStep('objective.set', [], farOff)));
    for (let frame = 0; frame < 31; frame += 1) state = advance(state);
    expect(measure(state).timeToObjective).toBeNull();
  });

  it('brings a crowd to a stop round the objective instead of leaving it to boil', () => {
    const scene = createTestScene(createScatteredUnits(12));
    const ids = scene.units.map((unit) => unit.id);
    let { state } = applyStep(
      createSimulation(scene),
      createTestStep('objective.set', [], { x: 60, y: 40 }),
    );
    ({ state } = applyStep(
      state,
      createTestStep('steer.priority', ids, {
        'avoidance-priority': 1,
        'separation-priority': 2,
        'seek-priority': 3,
        epsilon: 0.1,
      }),
    ));
    ({ state } = applyStep(state, createTestStep('steer.blend', ids, { 'arrive-weight': 1 })));
    for (let frame = 0; frame < 1800; frame += 1) state = advance(state);
    expect(Math.max(...state.units.map((unit) => length(unit.velocity)))).toBeLessThan(1);
    expect(measure(state).timeToObjective).not.toBeNull();
    expect(measure(state).collisions).toBe(0);
  });
});
