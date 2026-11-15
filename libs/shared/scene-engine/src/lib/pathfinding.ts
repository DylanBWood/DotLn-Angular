import { clearMove, touches } from './geometry';
import {
  cellCentre,
  cellCount,
  isLinked,
  nearestReachable,
  neighbourOf,
  neighbourSteps,
  type TileGraph,
  tileGraph,
} from './graph';
import type {
  Heuristic,
  NoRouteReason,
  PathSettings,
  SceneDefinition,
  SceneGeometry,
  SearchRecord,
  SearchStep,
  Vec2,
} from './types';
import { distance, length, subtract } from './vectors';

/** The heuristics a search can be given, in the order the catalog numbers them. */
export const heuristics: readonly Heuristic[] = ['zero', 'manhattan', 'euclidean', 'octile'];

/** The distance a heuristic guesses between two cells, in field units and unweighted. */
export function guess(heuristic: Heuristic, graph: TileGraph, from: number, to: number): number {
  const across = Math.abs((from % graph.columns) - (to % graph.columns)) * graph.cellSize;
  const down =
    Math.abs(Math.floor(from / graph.columns) - Math.floor(to / graph.columns)) * graph.cellSize;
  switch (heuristic) {
    case 'zero':
      return 0;
    case 'manhattan':
      return across + down;
    case 'euclidean':
      return Math.sqrt(across * across + down * down);
    case 'octile':
      return Math.max(across, down) + (Math.SQRT2 - 1) * Math.min(across, down);
  }
}

export interface SearchOptions {
  readonly heuristic: Heuristic;
  /** What every edge's length is multiplied by: the cost functions' travel weight. */
  readonly travelWeight: number;
  /** What each unit of an edge's length adds from the cost layers. */
  readonly layerCost: number;
}

export interface PathSearch {
  /** The route's cells from start to goal, or null when the goal cannot be reached. */
  readonly cells: readonly number[] | null;
  readonly record: SearchRecord;
}

// Equally cheap routes are told apart by a cost far below any real difference in length: a cell
// further from the straight line between the ends costs a hair more to enter, and each cell a
// fixed hair more again, drawn from its number, so no two routes cost exactly the same. The
// cheapest route is then one route, so a weight scaling every edge alike, or a better heuristic,
// changes how much a search expands and never which of several equally short routes it returns.
const lineBias = 1e-8;
const cellBias = 1e-10;

function cellHair(cell: number) {
  let hash = Math.imul(cell + 1, 0x9e3779b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 0x100000000;
}

/** A binary heap of cells by estimated total cost, then by remaining guess, then by cell. */
class Frontier {
  readonly #items: { readonly total: number; readonly rest: number; readonly cell: number }[] = [];

  get size() {
    return this.#items.length;
  }

  push(total: number, rest: number, cell: number) {
    const items = this.#items;
    items.push({ total, rest, cell });
    let at = items.length - 1;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (!this.#before(at, parent)) break;
      [items[at], items[parent]] = [items[parent], items[at]];
      at = parent;
    }
  }

  pop(): number {
    const items = this.#items;
    const top = items[0];
    const last = items.pop();
    if (last && items.length > 0) {
      items[0] = last;
      let at = 0;
      for (;;) {
        const left = 2 * at + 1;
        const right = left + 1;
        let first = at;
        if (left < items.length && this.#before(left, first)) first = left;
        if (right < items.length && this.#before(right, first)) first = right;
        if (first === at) break;
        [items[at], items[first]] = [items[first], items[at]];
        at = first;
      }
    }
    return top.cell;
  }

  #before(a: number, b: number) {
    const x = this.#items[a];
    const y = this.#items[b];
    if (x.total !== y.total) return x.total < y.total;
    if (x.rest !== y.rest) return x.rest < y.rest;
    return x.cell < y.cell;
  }
}

/**
 * A* over a tile graph: cells are expanded in order of their cost so far plus the heuristic's
 * guess of what remains, with Dijkstra's algorithm as the zero heuristic. Edge costs are octile
 * lengths, scaled by the travel weight and by the two cells' own costs when a grid gives them,
 * plus the cost layers. The guess stays the unweighted distance whatever the weights, so a weight
 * above one leaves it trusted less and a weight below one trusted more than the costs warrant.
 * Every expansion is kept: the cell it closed and the cells it put on the frontier.
 */
export function findPath(
  graph: TileGraph,
  start: number,
  goal: number,
  options: SearchOptions,
): PathSearch {
  const total = cellCount(graph);
  const spent = new Float64Array(total).fill(Infinity);
  const came = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const order: number[] = [];
  const trace: SearchStep[] = [];
  const startPoint = cellCentre(graph, start);
  const line = subtract(cellCentre(graph, goal), startPoint);
  const lineLength = length(line);
  const offLine = (cell: number) => {
    if (lineLength === 0) return 0;
    const offset = subtract(cellCentre(graph, cell), startPoint);
    return Math.abs(offset.x * line.y - offset.y * line.x) / lineLength;
  };
  const rest = (cell: number) => guess(options.heuristic, graph, cell, goal);
  const frontier = new Frontier();
  spent[start] = 0;
  frontier.push(rest(start), rest(start), start);
  while (frontier.size > 0) {
    const cell = frontier.pop();
    if (closed[cell]) continue;
    closed[cell] = 1;
    order.push(cell);
    const opened: number[] = [];
    if (cell !== goal) {
      for (let step = 0; step < neighbourSteps.length; step += 1) {
        if (!isLinked(graph, cell, step)) continue;
        const next = neighbourOf(graph, cell, step);
        if (closed[next]) continue;
        const span = (step < 4 ? 1 : Math.SQRT2) * graph.cellSize;
        const price = graph.costs ? (graph.costs[cell] + graph.costs[next]) / 2 : 1;
        const cost =
          spent[cell] +
          span * (options.travelWeight * price + options.layerCost) +
          lineBias * offLine(next) +
          cellBias * cellHair(next);
        if (cost >= spent[next]) continue;
        spent[next] = cost;
        came[next] = cell;
        frontier.push(cost + rest(next), rest(next), next);
        opened.push(next);
      }
    }
    trace.push({ expanded: cell, opened });
    if (cell === goal) break;
  }
  const open: number[] = [];
  for (let cell = 0; cell < total; cell += 1)
    if (!closed[cell] && spent[cell] < Infinity) open.push(cell);
  const record: SearchRecord = {
    columns: graph.columns,
    rows: graph.rows,
    cellSize: graph.cellSize,
    expansions: order.length,
    closed: order,
    open,
    trace,
  };
  if (!closed[goal]) return { cells: null, record };
  const cells = [goal];
  while (cells[0] !== start) cells.unshift(came[cells[0]]);
  return { cells, record };
}

/** The cells closed and left on the frontier after the first `steps` expansions of a search. */
export function searchAt(record: SearchRecord, steps: number) {
  const closed = new Set<number>();
  const open = new Set<number>();
  for (const { expanded, opened } of record.trace.slice(0, steps)) {
    closed.add(expanded);
    open.delete(expanded);
    for (const cell of opened) open.add(cell);
  }
  return { closed: [...closed], open: [...open].filter((cell) => !closed.has(cell)) };
}

/**
 * Line-of-sight smoothing: from the last waypoint kept, look along the route and keep the last
 * one in sight before one is not, skipping at most `maxSkip` waypoints at a time.
 */
export function smoothPath(
  waypoints: readonly Vec2[],
  maxSkip: number,
  inSight: (from: Vec2, to: Vec2) => boolean,
): readonly Vec2[] {
  if (waypoints.length <= 2) return waypoints;
  const last = waypoints.length - 1;
  const kept = [waypoints[0]];
  let at = 0;
  while (at < last) {
    let next = at + 1;
    while (next < last && next - at <= maxSkip && inSight(waypoints[at], waypoints[next + 1]))
      next += 1;
    kept.push(waypoints[next]);
    at = next;
  }
  return kept;
}

/** The cost functions' weights that scale every edge's length alike, multiplied together. */
export const travelWeightParams: readonly string[] = [
  'travel-cost',
  'distance-weight',
  'terrain-cost-multiplier',
];

/** The cost functions' weights of cost layers, uniform zero until an influence map lands one. */
export const layerWeightParams: readonly string[] = [
  'danger-cost',
  'visibility-cost',
  'danger-weight',
  'exposure-weight',
  'cover-shortfall-weight',
];
const uniformLayer = 0;

/** The travel weight and layer cost the cost functions' weights give a search. */
export function costsOf(costs: PathSettings['costs']) {
  return {
    travelWeight: travelWeightParams.reduce((product, name) => product * (costs[name] ?? 1), 1),
    layerCost: layerWeightParams.reduce((sum, name) => sum + (costs[name] ?? 0) * uniformLayer, 0),
  };
}

export interface PlannedRoute {
  readonly reason: NoRouteReason | null;
  readonly waypoints: readonly Vec2[];
  readonly search: SearchRecord | null;
}

/**
 * A route for a body of this radius from where it stands to a goal. The search starts from the
 * nearest free cell the body can walk to in a straight line and ends at the nearest one from which
 * it can walk to the goal, so a route never leads into a cell the body cannot enter; when no cell
 * passes for an end, or the search runs out of cells, there is no route and the reason says why.
 */
export function planRoute(
  geometry: SceneGeometry,
  field: SceneDefinition['field'],
  from: Vec2,
  goal: Vec2,
  radius: number,
  settings: PathSettings,
): PlannedRoute {
  const graph = tileGraph(geometry, field, radius);
  const clear = (a: Vec2, b: Vec2) => clearMove(geometry, a, b, radius);
  const start = nearestReachable(graph, from, (centre) => clear(from, centre));
  if (start === null) return { reason: 'unreachable-start', waypoints: [], search: null };
  // A goal the body would meet a shape standing on is out of reach from every free cell, whose
  // centres all stand clear: no cell need be tried.
  const end = touches(geometry, goal, radius)
    ? null
    : nearestReachable(graph, goal, (centre) => clear(centre, goal));
  if (end === null) return { reason: 'unreachable-goal', waypoints: [], search: null };
  const { cells, record } = findPath(graph, start, end, {
    heuristic: settings.heuristic,
    ...costsOf(settings.costs),
  });
  if (cells === null) return { reason: 'no-path', waypoints: [], search: record };
  const centres = cells.map((cell) => cellCentre(graph, cell));
  const through = [from, ...centres, goal].filter(
    (point, index, all) => index === 0 || distance(point, all[index - 1]) > 0,
  );
  const waypoints =
    settings.maxSkip === null ? through : smoothPath(through, settings.maxSkip, clear);
  return { reason: null, waypoints, search: record };
}
