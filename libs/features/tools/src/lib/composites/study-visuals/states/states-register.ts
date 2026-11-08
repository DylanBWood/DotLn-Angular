import type { StateMove, StatesModel, StudyTone } from '../../../studies/study-model';
import { type DrawnText, wrapText } from '../drawn-text';
import {
  arrivals,
  type DrawnStatesGhost,
  type DrawnStatesToken,
  fitting,
  frameAt,
  type StatesLayout,
  statesText,
  statesWidth,
  tokenRadius,
  toneOf,
} from './states-drawing';

const margin = 6;
// Inside a row: room for a transition's name above the token, then the token, then a little space.
const rowLabelZone = 21;
const rowBottom = 8;
const nameColumn: Readonly<Record<StatesLayout, readonly [number, number]>> = {
  wide: [112, 214],
  narrow: [86, 124],
};

/** A state's column, with its name wrapped above it. */
export interface DrawnStatesColumn {
  readonly id: string;
  readonly x: number;
  readonly width: number;
  readonly tone: StudyTone;
  /** True when an object moves into this state at the stepped moment. */
  readonly acting: boolean;
  readonly heading: readonly DrawnText[];
  /** How much the name shrinks so its longest word fits the column; 1 when it fits. */
  readonly scale: number;
}

/** An object's row: its name, and a few words on what it holds at the stepped moment. */
export interface DrawnStatesRow {
  readonly id: string;
  readonly y: number;
  readonly height: number;
  /** True when this object moves at the stepped moment. */
  readonly moved: boolean;
  readonly name: readonly DrawnText[];
  readonly note: readonly DrawnText[];
}

/** The way a moving object takes along its row, with the transition's name above it. */
export interface DrawnStatesArrow {
  readonly id: string;
  /** The line as SVG path data: straight between two columns, a loop over one. */
  readonly d: string;
  readonly head: string;
  readonly label: DrawnText | null;
}

export interface RegisterDrawing {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly nameWidth: number;
  readonly columns: readonly DrawnStatesColumn[];
  readonly rows: readonly DrawnStatesRow[];
  readonly tokens: readonly DrawnStatesToken[];
  readonly arrows: readonly DrawnStatesArrow[];
  readonly ghosts: readonly DrawnStatesGhost[];
}

interface RegisterGrid {
  readonly model: StatesModel;
  readonly layout: StatesLayout;
  readonly nameWidth: number;
  readonly columnWidth: number;
  readonly headerHeight: number;
}

/**
 * The name column's width: room for the longest name on one line and the longest note on two,
 * kept inside the layout's bounds, so a note does not break into a column of single words.
 */
function nameWidthOf(model: StatesModel, layout: StatesLayout): number {
  const [least, most] = nameColumn[layout];
  const longestName = Math.max(0, ...model.objects.map(({ label }) => label.length));
  const longestNote = Math.max(
    0,
    ...model.frames.flatMap(({ placements }) => placements.map(({ note }) => note?.length ?? 0)),
  );
  const wanted = Math.max(
    longestName * statesText.name.char,
    Math.ceil(longestNote / 2) * statesText.note.char,
  );
  return Math.min(most, Math.max(least, wanted + 16));
}

function gridOf(model: StatesModel, layout: StatesLayout): RegisterGrid {
  const nameWidth = nameWidthOf(model, layout);
  const columnWidth = (statesWidth[layout] - margin - nameWidth) / model.nodes.length;
  const lines = Math.max(
    1,
    ...model.nodes.map(({ label }) => wrapText(label, fitting(columnWidth - 8, 'heading')).length),
  );
  return {
    model,
    layout,
    nameWidth,
    columnWidth,
    headerHeight: lines * statesText.heading.line + 14,
  };
}

/**
 * Each state's column with its name wrapped above it. A single word wider than the column, as a
 * long state name is on a phone, is drawn smaller so it stays inside its column.
 */
function columnsOf(grid: RegisterGrid, acting: ReadonlySet<string>): readonly DrawnStatesColumn[] {
  return grid.model.nodes.map(({ id, label, tone }, index) => {
    const x = grid.nameWidth + index * grid.columnWidth;
    const lines = wrapText(label, fitting(grid.columnWidth - 8, 'heading'));
    const widest = Math.max(...lines.map((line) => line.length)) * statesText.heading.char;
    return {
      id,
      x,
      width: grid.columnWidth,
      tone: toneOf(tone),
      acting: acting.has(id),
      heading: lines.map((text, line) => ({
        x: x + grid.columnWidth / 2,
        y: 6 + (line + 1) * statesText.heading.line - 4,
        text,
        anchor: 'middle' as const,
      })),
      scale: Math.min(1, (grid.columnWidth - 6) / widest),
    };
  });
}

const centreOf = (grid: RegisterGrid, node: string) =>
  grid.nameWidth +
  grid.columnWidth * grid.model.nodes.findIndex(({ id }) => id === node) +
  grid.columnWidth / 2;

/** The lines of an object's name and the most lines its note ever needs, so a row keeps its size. */
function rowText(grid: RegisterGrid, object: string, label: string) {
  const width = grid.nameWidth - 12;
  const name = wrapText(label, fitting(width, 'name'));
  const noteLines = Math.max(
    0,
    ...grid.model.frames.map((frame) => {
      const note = frame.placements.find((placement) => placement.object === object)?.note;
      return note ? wrapText(note, fitting(width, 'note')).length : 0;
    }),
  );
  return { name, noteLines };
}

function rowsOf(grid: RegisterGrid, step: number): readonly DrawnStatesRow[] {
  const frame = frameAt(grid.model, step);
  let top = grid.headerHeight;
  return grid.model.objects.map(({ id, label }) => {
    const { name, noteLines } = rowText(grid, id, label);
    const height = Math.max(
      rowLabelZone + tokenRadius * 2 + rowBottom,
      name.length * statesText.name.line + noteLines * statesText.note.line + 14,
    );
    const note = frame.placements.find((placement) => placement.object === id)?.note;
    const row: DrawnStatesRow = {
      id,
      y: top,
      height,
      moved: frame.moves.some(({ object }) => object === id),
      name: name.map((text, line) => ({
        x: 8,
        y: top + 18 + line * statesText.name.line,
        text,
        anchor: 'start',
      })),
      note: (note ? wrapText(note, fitting(grid.nameWidth - 12, 'note')) : []).map(
        (text, line) => ({
          x: 8,
          y: top + 16 + name.length * statesText.name.line + line * statesText.note.line,
          text,
          anchor: 'start',
        }),
      ),
    };
    top += height;
    return row;
  });
}

const tokenY = (row: DrawnStatesRow) => row.y + rowLabelZone + tokenRadius;

/** The arrowhead at the end of a line from x1 to x2 at height y. */
function headAt(x1: number, x2: number, y: number): string {
  const sign = x2 >= x1 ? 1 : -1;
  return `${x2},${y} ${x2 - sign * 8},${y - 5} ${x2 - sign * 8},${y + 5}`;
}

/** Where a transition's name centres: over its arrow, moved in so the whole name stays drawn. */
function labelX(grid: RegisterGrid, label: string, x: number): number {
  const half = (label.length * statesText.transition.char) / 2;
  const least = grid.nameWidth + half + 2;
  const most = statesWidth[grid.layout] - half - 2;
  return most < least ? (least + most) / 2 : Math.min(most, Math.max(least, x));
}

function arrowOf(
  grid: RegisterGrid,
  move: StateMove,
  row: DrawnStatesRow,
  label: string | null,
): DrawnStatesArrow | null {
  const y = tokenY(row);
  const r = tokenRadius;
  const text = (x: number) =>
    label === null
      ? null
      : { x: labelX(grid, label, x), y: row.y + 15, text: label, anchor: 'middle' as const };
  // An object coming into the example arrives from its name; one leaving goes out to the right.
  if (move.from === null || move.to === null) {
    if (move.from === null && move.to === null) return null;
    const x = centreOf(grid, (move.to ?? move.from) as string);
    const [x1, x2] =
      move.from === null
        ? [grid.nameWidth + 2, x - r - 4]
        : [x + r + 3, x + grid.columnWidth / 2 - 2];
    return x2 - x1 < 6
      ? null
      : {
          id: move.object,
          d: `M ${x1} ${y} L ${x2} ${y}`,
          head: headAt(x1, x2, y),
          label: text(x),
        };
  }
  const from = centreOf(grid, move.from);
  const to = centreOf(grid, move.to);
  if (from === to)
    return {
      id: move.object,
      d: `M ${to + r} ${y - 4} C ${to + r + 16} ${y - 18}, ${to + r + 16} ${y + 10}, ${to + r + 2} ${y + 6}`,
      head: `${to + r + 2},${y + 6} ${to + r + 9},${y + 4} ${to + r + 6},${y + 11}`,
      label: text(to),
    };
  const sign = to > from ? 1 : -1;
  const x1 = from + sign * (r + 3);
  const x2 = to - sign * (r + 4);
  return {
    id: move.object,
    d: `M ${x1} ${y} L ${x2} ${y}`,
    head: headAt(x1, x2, y),
    label: text((x1 + x2) / 2),
  };
}

/**
 * The register at a step: the states across as columns, the objects down as rows, each tracked
 * object's token in the column of its state. An object that moves at the step is green, with an
 * arrow from the column it left and the transition's name above it; one that leaves leaves a ring.
 */
export function registerDrawing(
  model: StatesModel,
  step: number,
  layout: StatesLayout = 'wide',
): RegisterDrawing {
  const grid = gridOf(model, layout);
  const frame = frameAt(model, step);
  const rows = rowsOf(grid, step);
  const rowOf = (object: string) => rows[model.objects.findIndex(({ id }) => id === object)];
  const transitionLabel = (move: StateMove) =>
    model.transitions.find(({ id }) => id === move.transition)?.label ?? null;
  const moving = new Map(frame.moves.map((move) => [move.object, move]));
  const tokens = frame.placements.map(({ object, node }): DrawnStatesToken => {
    const x = centreOf(grid, node);
    const move = moving.get(object);
    const from = move?.from ?? null;
    return {
      // A moving token is drawn afresh at each step it moves, so its glide plays every time.
      id: move ? `${object}@${step}` : object,
      key: model.objects.find(({ id }) => id === object)?.key ?? '',
      x,
      y: tokenY(rowOf(object)),
      r: tokenRadius,
      state: move ? 'moving' : 'resting',
      fromDx: move ? (from === null ? grid.nameWidth - x : centreOf(grid, from) - x) : 0,
    };
  });
  const width = statesWidth[layout];
  const last = rows[rows.length - 1];
  const height = last ? last.y + last.height + margin : grid.headerHeight + margin;
  const acting = arrivals(frame.moves);
  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    nameWidth: grid.nameWidth,
    columns: columnsOf(grid, acting),
    rows,
    tokens,
    arrows: frame.moves.flatMap((move) => {
      const arrow = arrowOf(grid, move, rowOf(move.object), transitionLabel(move));
      return arrow ? [arrow] : [];
    }),
    ghosts: frame.moves.flatMap(({ object, from, to }) =>
      from !== null && to === null
        ? [{ id: object, x: centreOf(grid, from), y: tokenY(rowOf(object)), r: tokenRadius }]
        : [],
    ),
  };
}
