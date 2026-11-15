import { clearMove, touches } from './geometry';
import type { SceneDefinition, SceneGeometry, Vec2 } from './types';
import { distance } from './vectors';

/** A cell's eight neighbours, the four sides first, then the four corners. */
export const neighbourSteps: readonly Vec2[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
];

// The step back along each of the steps above.
const backSteps = [2, 3, 0, 1, 6, 7, 4, 5];

/**
 * A tile graph: one node per square cell, each linked to the neighbours a body can walk to.
 * `free` says whether a body can stand at a cell's centre, `links` holds a bit per neighbour step
 * for each traversable edge, and `costs`, when present, is each cell's own price of entry. The
 * arrays belong to the graph and are not to be written.
 */
export interface TileGraph {
  readonly columns: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly free: Uint8Array;
  readonly links: Uint8Array;
  readonly costs: Float64Array | null;
}

export const cellCount = (graph: TileGraph) => graph.columns * graph.rows;

type Layout = Pick<TileGraph, 'columns' | 'rows' | 'cellSize'>;

export const cellCentre = (graph: Layout, cell: number): Vec2 => ({
  x: ((cell % graph.columns) + 0.5) * graph.cellSize,
  y: (Math.floor(cell / graph.columns) + 0.5) * graph.cellSize,
});

/** The neighbour one step away, or -1 off the graph. */
export function neighbourOf(graph: Layout, cell: number, step: number): number {
  const { x, y } = neighbourSteps[step];
  const column = (cell % graph.columns) + x;
  const row = Math.floor(cell / graph.columns) + y;
  if (column < 0 || row < 0 || column >= graph.columns || row >= graph.rows) return -1;
  return row * graph.columns + column;
}

export const isLinked = (graph: Pick<TileGraph, 'links'>, cell: number, step: number) =>
  (graph.links[cell] & (1 << step)) !== 0;

function link(links: Uint8Array, graph: Layout, cell: number, step: number) {
  const other = neighbourOf(graph, cell, step);
  links[cell] |= 1 << step;
  links[other] |= 1 << backSteps[step];
}

/**
 * Links every pair of free neighbours a test admits. A corner step needs both of its side steps
 * open from either end, so no route cuts a blocked corner.
 */
function linkCells(
  shape: Omit<TileGraph, 'links'>,
  admits: (cell: number, other: number) => boolean,
): Uint8Array {
  const links = new Uint8Array(shape.columns * shape.rows);
  const graph = { ...shape, links };
  const total = shape.columns * shape.rows;
  for (let cell = 0; cell < total; cell += 1) {
    if (!shape.free[cell]) continue;
    for (const step of [0, 1]) {
      const other = neighbourOf(graph, cell, step);
      if (other >= 0 && shape.free[other] && admits(cell, other)) link(links, shape, cell, step);
    }
  }
  for (let cell = 0; cell < total; cell += 1) {
    if (!shape.free[cell]) continue;
    for (const step of [4, 5]) {
      const other = neighbourOf(graph, cell, step);
      if (other < 0 || !shape.free[other]) continue;
      const { x } = neighbourSteps[step];
      const across = neighbourOf(graph, cell, x > 0 ? 0 : 2);
      const down = neighbourOf(graph, cell, 1);
      const open =
        isLinked(graph, cell, x > 0 ? 0 : 2) &&
        isLinked(graph, across, 1) &&
        isLinked(graph, cell, 1) &&
        isLinked(graph, down, x > 0 ? 0 : 2);
      if (open && admits(cell, other)) link(links, shape, cell, step);
    }
  }
  return links;
}

const graphs = new WeakMap<SceneGeometry, Map<string, TileGraph>>();

/**
 * The field's tile graph for a body of this radius, at the geometry's cell size. A cell is free
 * when the body standing at its centre meets no shape and stays on the field; an edge is linked
 * when the body moved along it clears every shape, so a thin wall between two centres cuts the
 * edge and not only the cells it covers. Built once per geometry, field and radius.
 */
export function tileGraph(
  geometry: SceneGeometry,
  field: SceneDefinition['field'],
  radius: number,
): TileGraph {
  const key = `${field.width}x${field.height}r${radius}`;
  const known = graphs.get(geometry)?.get(key);
  if (known) return known;
  const { cellSize } = geometry;
  const columns = Math.max(1, Math.floor(field.width / cellSize));
  const rows = Math.max(1, Math.floor(field.height / cellSize));
  const free = new Uint8Array(columns * rows);
  const shape = { columns, rows, cellSize, free, costs: null };
  for (let cell = 0; cell < free.length; cell += 1) {
    const centre = cellCentre(shape, cell);
    const onField =
      centre.x - radius >= 0 &&
      centre.y - radius >= 0 &&
      centre.x + radius <= field.width &&
      centre.y + radius <= field.height;
    free[cell] = onField && !touches(geometry, centre, radius) ? 1 : 0;
  }
  const centreOf = (cell: number) => cellCentre(shape, cell);
  const links = linkCells(shape, (cell, other) =>
    clearMove(geometry, centreOf(cell), centreOf(other), radius),
  );
  const graph: TileGraph = { ...shape, links };
  const byField = graphs.get(geometry) ?? new Map<string, TileGraph>();
  byField.set(key, graph);
  graphs.set(geometry, byField);
  return graph;
}

/** A grid a study describes by hand: which cells are blocked and, if it says, what each costs. */
export interface PlainGrid {
  readonly columns: number;
  readonly rows: number;
  readonly cellSize?: number;
  readonly blocked: readonly boolean[];
  readonly costs?: readonly number[];
}

/** The same graph built from a plain grid: free cells link to free neighbours, corners as above. */
export function gridGraph(grid: PlainGrid): TileGraph {
  const free = Uint8Array.from(grid.blocked, (blocked) => (blocked ? 0 : 1));
  const shape = {
    columns: grid.columns,
    rows: grid.rows,
    cellSize: grid.cellSize ?? 1,
    free,
    costs: grid.costs ? Float64Array.from(grid.costs) : null,
  };
  return { ...shape, links: linkCells(shape, () => true) };
}

/**
 * The free cell nearest a point that a body of this radius can move between in a straight line
 * with the point, or null when there is none: where a search starts from the unit, and where it
 * ends near the objective.
 */
export function nearestReachable(
  graph: TileGraph,
  point: Vec2,
  reachable: (centre: Vec2) => boolean,
): number | null {
  const cells: number[] = [];
  const gaps = new Float64Array(graph.free.length);
  let nearest = -1;
  for (let cell = 0; cell < graph.free.length; cell += 1) {
    if (!graph.free[cell]) continue;
    gaps[cell] = distance(point, cellCentre(graph, cell));
    cells.push(cell);
    if (nearest < 0 || gaps[cell] < gaps[nearest]) nearest = cell;
  }
  if (nearest < 0) return null;
  if (reachable(cellCentre(graph, nearest))) return nearest;
  // Mostly the nearest cell is the one. When it is not, the rest are tried nearest first, the
  // lower cell number first between equals, in one sort rather than a scan for each.
  cells.sort((a, b) => gaps[a] - gaps[b] || a - b);
  for (const cell of cells) if (cell !== nearest && reachable(cellCentre(graph, cell))) return cell;
  return null;
}
