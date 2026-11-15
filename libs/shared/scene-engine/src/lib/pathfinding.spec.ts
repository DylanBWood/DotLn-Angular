import { createTestScene, createTestStep, createTestUnit } from '../../testing/src';
import { clearMove, emptyGeometry } from './geometry';
import { cellCentre, gridGraph, isLinked, neighbourOf, tileGraph } from './graph';
import { applyStep } from './interpreter';
import { defaultPathSettings } from './path-following';
import { costsOf, findPath, planRoute, searchAt, smoothPath } from './pathfinding';
import { createSimulation } from './simulation';
import type { Heuristic, PathSettings, SceneGeometry, Vec2 } from './types';
import { distance } from './vectors';

// The known field: 40 by 30, cells of 2.5, a wall standing down from the top edge at x = 20 to
// y = 22, so a body from the west must go round its foot to reach the east.
const field = { width: 40, height: 30 };
const radius = 0.5;
const wall = { shape: 1, from: { x: 20, y: 0 }, to: { x: 20, y: 22 }, thickness: 1 };
const known: SceneGeometry = { ...emptyGeometry, walls: [wall] };
const from = { x: 5, y: 5 };
const goal = { x: 35, y: 5 };
const graph = tileGraph(known, field, radius);
const cellAt = (point: Vec2) =>
  Math.floor(point.y / graph.cellSize) * graph.columns + Math.floor(point.x / graph.cellSize);

const search = (heuristic: Heuristic, costs: PathSettings['costs'] = {}) =>
  findPath(graph, cellAt(from), cellAt(goal), { heuristic, ...costsOf(costs) });

const routeLength = (cells: readonly number[]) =>
  cells.slice(1).reduce((sum, cell, index) => {
    const before = cellCentre(graph, cells[index]);
    return sum + distance(before, cellCentre(graph, cell));
  }, 0);

describe('the tile graph', () => {
  it('lays the field out at its cell size and cuts the edges across the wall', () => {
    expect([graph.columns, graph.rows]).toEqual([16, 12]);
    const west = cellAt({ x: 19, y: 5 });
    expect(graph.free[west]).toBe(1);
    expect(isLinked(graph, west, 0)).toBe(false);
    expect(isLinked(graph, cellAt({ x: 19, y: 26 }), 0)).toBe(true);
  });

  it('blocks a cell whose centre a body cannot stand on', () => {
    const heavy = tileGraph(
      { ...emptyGeometry, obstacles: [{ shape: 1, centre: { x: 21, y: 6 }, radius: 1 }] },
      field,
      radius,
    );
    expect(heavy.free[cellAt({ x: 21, y: 6 })]).toBe(0);
    expect(heavy.free[cellAt({ x: 26, y: 6 })]).toBe(1);
  });

  it('links no edge across a thin wall standing between two cell centres', () => {
    const thin: SceneGeometry = {
      ...emptyGeometry,
      walls: [{ shape: 1, from: { x: 5, y: 0 }, to: { x: 5, y: 10 }, thickness: 0.1 }],
    };
    const cut = tileGraph(thin, field, radius);
    const west = 1 * cut.columns + 1;
    const east = neighbourOf(cut, west, 0);
    expect(cut.free[west]).toBe(1);
    expect(cut.free[east]).toBe(1);
    expect(isLinked(cut, west, 0)).toBe(false);
    expect(isLinked(tileGraph(emptyGeometry, field, radius), west, 0)).toBe(true);
  });

  it('refuses a diagonal past a blocked corner, in a graph built from a plain grid', () => {
    const plain = gridGraph({ columns: 2, rows: 2, blocked: [false, true, false, false] });
    expect(isLinked(plain, 0, 4)).toBe(false);
    expect(isLinked(plain, 0, 1)).toBe(true);
    expect(
      isLinked(gridGraph({ columns: 2, rows: 2, blocked: [false, false, false, false] }), 0, 4),
    ).toBe(true);
  });

  it('prices a plain grid’s cells, so a search goes round dear ground', () => {
    // Three rows; the middle of the middle row costs ten times as much to cross.
    const costs = [1, 1, 1, 1, 10, 1, 1, 1, 1];
    const plain = gridGraph({ columns: 3, rows: 3, blocked: Array(9).fill(false), costs });
    const { cells } = findPath(plain, 3, 5, { heuristic: 'zero', travelWeight: 1, layerCost: 0 });
    expect(cells).not.toContain(4);
    expect(cells?.[0]).toBe(3);
    expect(cells?.at(-1)).toBe(5);
  });
});

describe('the search on the known field', () => {
  it('finds the route round the wall’s foot', () => {
    const { cells } = search('octile');
    expect(cells?.[0]).toBe(cellAt(from));
    expect(cells?.at(-1)).toBe(cellAt(goal));
    const lowest = Math.max(...(cells ?? []).map((cell) => cellCentre(graph, cell).y));
    expect(lowest).toBeGreaterThan(wall.to.y);
    for (const [index, cell] of (cells ?? []).slice(1).entries()) {
      const before = cellCentre(graph, (cells ?? [])[index]);
      expect(clearMove(known, before, cellCentre(graph, cell), radius)).toBe(true);
    }
  });

  it('expands fewer cells with the octile heuristic than with none, for the same route', () => {
    const guided = search('octile');
    const blind = search('zero');
    expect(guided.record.expansions).toBe(80);
    expect(blind.record.expansions).toBe(180);
    expect(guided.cells).toEqual(blind.cells);
  });

  it('keeps every expansion: the cell closed and the frontier it opened', () => {
    const { record } = search('octile');
    expect(record.trace).toHaveLength(record.expansions);
    expect(record.trace[0].expanded).toBe(cellAt(from));
    expect(record.closed.at(-1)).toBe(cellAt(goal));
    const halfway = searchAt(record, 10);
    expect(halfway.closed).toHaveLength(10);
    expect(halfway.open.every((cell) => !halfway.closed.includes(cell))).toBe(true);
    expect(searchAt(record, record.expansions).closed).toEqual(record.closed);
  });

  it('expands more under a travel weight above one, and keeps the same route', () => {
    const plain = search('octile');
    const dear = search('octile', { 'terrain-cost-multiplier': 2 });
    expect(dear.record.expansions).toBeGreaterThan(plain.record.expansions);
    expect(dear.cells).toEqual(plain.cells);
  });

  it.each([
    ['Tactical pathfinding', { 'danger-weight': 2, 'exposure-weight': 1 }],
    ['Tactic weights and concern blending', { 'danger-weight': 2, 'cover-shortfall-weight': 1 }],
  ])('leaves route, length and expansions alone under %s, whose layers are uniform', (_, costs) => {
    const plain = search('octile');
    const weighed = search('octile', costs);
    expect(weighed.cells).toEqual(plain.cells);
    expect(routeLength(weighed.cells ?? [])).toBe(routeLength(plain.cells ?? []));
    expect(weighed.record.expansions).toBe(plain.record.expansions);
  });
});

describe('planning a route on the field', () => {
  const settings = defaultPathSettings;

  it('runs from where the body stands to the goal, every leg clear', () => {
    const { reason, waypoints } = planRoute(known, field, from, goal, radius, settings);
    expect(reason).toBeNull();
    expect(waypoints[0]).toEqual(from);
    expect(waypoints.at(-1)).toEqual(goal);
    for (const [index, point] of waypoints.slice(1).entries())
      expect(clearMove(known, waypoints[index], point, radius)).toBe(true);
  });

  it('has no route when a wall seals the goal off, and says the search ran out', () => {
    const sealed: SceneGeometry = {
      ...known,
      walls: [{ ...wall, to: { x: 20, y: 30 } }],
    };
    const planned = planRoute(sealed, field, from, goal, radius, settings);
    expect(planned.reason).toBe('no-path');
    expect(planned.waypoints).toEqual([]);
    expect(planned.search?.expansions).toBeGreaterThan(0);
  });

  it('says the goal cannot be reached when no cell can reach it, and the start likewise', () => {
    const boxed = (centre: Vec2): SceneGeometry => ({
      ...emptyGeometry,
      walls: [
        {
          shape: 1,
          from: { x: centre.x - 1, y: centre.y - 1 },
          to: { x: centre.x + 1, y: centre.y - 1 },
          thickness: 0.2,
        },
        {
          shape: 2,
          from: { x: centre.x + 1, y: centre.y - 1 },
          to: { x: centre.x + 1, y: centre.y + 1 },
          thickness: 0.2,
        },
        {
          shape: 3,
          from: { x: centre.x + 1, y: centre.y + 1 },
          to: { x: centre.x - 1, y: centre.y + 1 },
          thickness: 0.2,
        },
        {
          shape: 4,
          from: { x: centre.x - 1, y: centre.y + 1 },
          to: { x: centre.x - 1, y: centre.y - 1 },
          thickness: 0.2,
        },
      ],
    });
    expect(planRoute(boxed(goal), field, from, goal, radius, settings).reason).toBe(
      'unreachable-goal',
    );
    expect(planRoute(boxed(from), field, from, goal, radius, settings).reason).toBe(
      'unreachable-start',
    );
  });

  it('starts a body a thin wall parts from its nearest free cell from one on its own side', () => {
    // The cell east of the body is under an obstacle, so the nearest free one is across the wall.
    const parted: SceneGeometry = {
      ...emptyGeometry,
      walls: [{ shape: 1, from: { x: 6.1, y: 0 }, to: { x: 6.1, y: 30 }, thickness: 0.1 }],
      obstacles: [{ shape: 2, centre: { x: 8.75, y: 6.25 }, radius: 1 }],
    };
    const body = { x: 6.7, y: 6.25 };
    const { reason, waypoints } = planRoute(
      parted,
      field,
      body,
      { x: 30, y: 25 },
      radius,
      settings,
    );
    expect(reason).toBeNull();
    expect(waypoints[1].x).toBeGreaterThan(6.1);
    expect(clearMove(parted, body, waypoints[1], radius)).toBe(true);
  });

  it('smooths a route to fewer waypoints, each kept leg in sight, skipping no more than asked', () => {
    const raw = planRoute(known, field, from, goal, radius, settings).waypoints;
    const smooth = planRoute(known, field, from, goal, radius, { ...settings, maxSkip: 8 });
    const short = planRoute(known, field, from, goal, radius, { ...settings, maxSkip: 1 });
    expect(smooth.waypoints.length).toBeLessThan(short.waypoints.length);
    expect(short.waypoints.length).toBeLessThan(raw.length);
    for (const [index, point] of smooth.waypoints.slice(1).entries())
      expect(clearMove(known, smooth.waypoints[index], point, radius)).toBe(true);
    const straight = smoothPath(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      1,
      () => true,
    );
    expect(straight).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });
});

describe('cost steps on the known field', () => {
  // One unit at the known field's start, given A* and the objective at its goal.
  const routed = () => {
    const scene = createTestScene([createTestUnit('walker', { position: from })], { field });
    return [
      createTestStep('field.wall', [], { x1: 20, y1: 0, x2: 20, y2: 22, thickness: 1, shape: 1 }),
      createTestStep('objective.set', [], goal),
      createTestStep('path.find', ['walker'], { heuristic: 3 }),
    ].reduce((state, step) => applyStep(state, step).state, createSimulation(scene));
  };
  const routeOf = (state: ReturnType<typeof routed>) => {
    const route = state.units[0].route;
    if (route === null || route.search === null) throw new Error('The walker has no route.');
    return route;
  };
  const after = (params: Readonly<Record<string, number>>) =>
    routeOf(applyStep(routed(), createTestStep('path.cost', ['walker'], params)).state);

  it('expands more under a travel weight above one and keeps the route’s cells', () => {
    const plain = routeOf(routed());
    const dear = after({ 'terrain-cost-multiplier': 2 });
    expect(dear.search?.expansions).toBeGreaterThan(plain.search?.expansions ?? Infinity);
    expect(dear.waypoints).toEqual(plain.waypoints);
  });

  it.each([
    ['Tactical pathfinding (aifg-b:48)', { 'danger-weight': 2, 'exposure-weight': 1 }],
    [
      'Tactic weights and concern blending (aifg-b:50)',
      { 'danger-weight': 2, 'cover-shortfall-weight': 1 },
    ],
  ])('leaves route, length and expansions as they are under %s', (_, params) => {
    const plain = routeOf(routed());
    const weighed = after(params);
    expect(weighed.waypoints).toEqual(plain.waypoints);
    expect(weighed.search?.expansions).toBe(plain.search?.expansions);
  });
});
