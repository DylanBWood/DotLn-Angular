import { drawingWidth } from '../../../studies/drawing';
import type {
  FlowFrame,
  FlowHop,
  FlowLink,
  FlowModel,
  FlowNode,
  StudyPoint,
  StudyTone,
} from '../../../studies/study-model';

// Text is measured in drawing units at the stylesheet's sizes: the width of one character and the
// height of one line. A single word too wide for its box is scaled down to fit it.
const text = {
  name: { char: 15 * 0.56, line: 28 },
  state: { char: 13 * 0.56, line: 24 },
} as const;
const tokenRadius = 12;
// Tokens side by side keep this far apart, centre to centre.
const tokenSpacing = tokenRadius * 2 + 4;
// Room between two columns for the message moving along the line that joins them.
const columnGap = 52;
const margin = 12;
// A node's box leaves this much room round its name.
const padding = 12;
// A line that skips a stage runs round the boxes through a gutter; several gutters stand apart.
const gutterSpacing = 10;

export interface DrawnNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** A channel is a pipe, with fully rounded ends; an endpoint a box. */
  readonly rx: number;
  readonly kind: 'endpoint' | 'channel';
  readonly tone: StudyTone;
  /** The name, one line per entry. */
  readonly label: readonly DrawnText[];
  /** How much the name shrinks to fit its box; 1 when it fits. */
  readonly scale: number;
  /** True when a message leaves or reaches it at the stepped moment. */
  readonly acting: boolean;
}

export interface DrawnLink {
  readonly id: string;
  /** Where the line starts and ends. */
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** The line's corners as polyline points when it runs round boxes; null for a straight line. */
  readonly points: string | null;
  /** The arrowhead at the receiving end, as polygon points. */
  readonly head: string;
  /** True when a message moves along it at the stepped moment. */
  readonly active: boolean;
  readonly label: DrawnText | null;
}

export interface DrawnToken {
  /** The link and the step it crossed at, or the node holding it, so a step keeps each element. */
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Twice the radius for one message; wider for one capsule naming several that do not fit apart. */
  readonly width: number;
  /** The message's letter, or the letters of the messages a capsule names. */
  readonly key: string;
  /** Moving at the stepped moment, drawn green, or held by a node, drawn outlined. */
  readonly state: 'moving' | 'held';
  /** Where a moving token sets out from, relative to where it is drawn, for the glide. */
  readonly fromDx: number;
  readonly fromDy: number;
}

export interface DrawnText {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly anchor: 'start' | 'middle' | 'end';
}

export interface FlowDrawing {
  readonly viewBox: string;
  readonly height: number;
  readonly nodes: readonly DrawnNode[];
  readonly links: readonly DrawnLink[];
  readonly tokens: readonly DrawnToken[];
  /** What each node holds or decides at the stepped moment, as prose inside its box. */
  readonly states: readonly DrawnText[];
}

/** Breaks a text into lines of at most `width` characters at its spaces; a longer word stands alone. */
export function wrapText(value: string, width: number): readonly string[] {
  const lines: string[] = [];
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= width)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/** How many characters of a kind of text fit a width. */
const fitting = (width: number, kind: keyof typeof text) =>
  Math.max(4, Math.floor(width / text[kind].char));

/** A name broken to fit its box, and how far its longest line must shrink to fit. */
function nameIn(label: string, width: number) {
  const lines = wrapText(label, fitting(width, 'name'));
  const longest = Math.max(...lines.map((line) => line.length));
  return { lines, scale: round(Math.min(1, width / (longest * text.name.char))) };
}

/** The most lines a node's state takes at any step, so the drawing keeps one shape throughout. */
const stateLines = (frames: readonly FlowFrame[], id: string, width: number) =>
  Math.max(0, ...frames.map(({ states }) => (states[id] ? wrapText(states[id], width).length : 0)));

/** Whether a node holds a message at any step, so its row of held messages keeps its room. */
const holdsEver = (frames: readonly FlowFrame[], id: string) =>
  frames.some(({ held }) => held[id]?.length);

const headOf = (from: StudyPoint, to: StudyPoint, size = 9) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const point = (turn: number) =>
    `${round(to.x - size * Math.cos(angle + turn))},${round(to.y - size * Math.sin(angle + turn))}`;
  return `${round(to.x)},${round(to.y)} ${point(0.45)} ${point(-0.45)}`;
};

const round = (value: number) => Math.round(value * 100) / 100;

const toneOf = (node: FlowNode): StudyTone => node.tone ?? 'other';
const kindOf = (node: FlowNode) => node.kind ?? 'endpoint';

/** The stepped moment's hops by the link they cross. */
function hopsByLink(hops: readonly FlowHop[]) {
  const byLink = new Map<string, FlowHop[]>();
  for (const hop of hops) byLink.set(hop.link, [...(byLink.get(hop.link) ?? []), hop]);
  return byLink;
}

/**
 * What a node holds at a step, less a message arriving there at that step: that one is drawn on
 * its way in, so it is not drawn twice.
 */
function heldAfter(model: FlowModel, frame: FlowFrame, id: string) {
  const arriving = new Set(
    frame.hops
      .filter((hop) => model.links.find((link) => link.id === hop.link)?.to === id)
      .map(({ key }) => key),
  );
  return (frame.held[id] ?? []).filter(({ key }) => !arriving.has(key));
}

/** Whether a message leaves or reaches a node at a step. */
const acting = (model: FlowModel, frame: FlowFrame, id: string) =>
  frame.hops.some(({ link }) => {
    const crossed = model.links.find((candidate) => candidate.id === link);
    return crossed?.from === id || crossed?.to === id;
  });

/** How wide a capsule must be to show some letters. */
const capsuleWidth = (key: string) => Math.max(tokenRadius * 2, key.length * 8 + 14);

/** The room a moving message keeps from the boxes either side of its line. */
const clearance = 4;

/**
 * The widest run of messages any line the test admits carries at any step, one token or the
 * capsule naming several, with room either side, so a layout can leave every gap such a line
 * crosses wide enough at every step and the drawing keeps one shape.
 */
function roomFor(model: FlowModel, admits: (link: FlowLink) => boolean): number {
  const lines = new Map(model.links.map((link) => [link.id, link]));
  let widest = tokenRadius * 2;
  for (const { hops } of model.frames)
    for (const [id, onLink] of hopsByLink(hops)) {
      const link = lines.get(id);
      if (!link || !admits(link) || onLink.length < 2) continue;
      widest = Math.max(widest, capsuleWidth(onLink.map(({ key }) => key).join(' ')));
    }
  return widest + 2 * clearance;
}

/**
 * The messages a node holds, in a row under its state, or one outlined capsule naming them all when
 * the row would not fit the box.
 */
function heldIn(
  id: string,
  tokens: readonly { readonly key: string }[],
  centre: number,
  y: number,
  room: number,
): readonly DrawnToken[] {
  const token = (key: string, index: number | 'all', x: number, width: number): DrawnToken => ({
    id: `${id}:held:${index}`,
    x: round(x),
    y: round(y),
    r: tokenRadius,
    width,
    key,
    state: 'held',
    fromDx: 0,
    fromDy: 0,
  });
  if (tokens.length * tokenSpacing <= room)
    return tokens.map(({ key }, index) =>
      token(key, index, centre + (index - (tokens.length - 1) / 2) * tokenSpacing, tokenRadius * 2),
    );
  const key = tokens.map((held) => held.key).join(' ');
  return [token(key, 'all', centre, Math.min(room, capsuleWidth(key)))];
}

/** A line between nodes: its corners, where its moving messages rest, and where its name sits. */
interface Route {
  readonly link: FlowLink;
  readonly points: readonly StudyPoint[];
  /** The corner after which messages rest: the line's middle when straight, the first run when routed. */
  readonly restSegment: number;
  /** How far along that segment messages rest. */
  readonly restShare: number;
  readonly label: DrawnText | null;
}

/** A point a share of the way along one segment of a line, with the segment's direction. */
function onSegment(points: readonly StudyPoint[], segment: number, share: number) {
  const from = points[segment];
  const to = points[segment + 1];
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return {
    x: from.x + (to.x - from.x) * share,
    y: from.y + (to.y - from.y) * share,
    dx: (to.x - from.x) / length,
    dy: (to.y - from.y) / length,
    length,
  };
}

/**
 * The messages crossing one line at the stepped moment: each its own token, spaced along the line
 * where they fit, or one capsule naming them all where they would overlap.
 */
function movingOn(route: Route, hops: readonly FlowHop[], step: number): readonly DrawnToken[] {
  // A line with nothing on it draws nothing, however short it is.
  if (hops.length === 0) return [];
  const rest = onSegment(route.points, route.restSegment, route.restShare);
  const [start] = route.points;
  const token = (key: string, index: number | 'all', x: number, y: number, width: number) => ({
    id: `${route.link.id}:${step}:${index}`,
    x: round(x),
    y: round(y),
    r: tokenRadius,
    width,
    key,
    state: 'moving' as const,
    fromDx: round(start.x - x),
    fromDy: round(start.y - y),
  });
  if (hops.length === 1 || hops.length * tokenSpacing <= rest.length - tokenRadius * 2)
    return hops.map((hop, index) => {
      const shift = (index - (hops.length - 1) / 2) * tokenSpacing;
      return token(
        hop.key,
        index,
        rest.x + rest.dx * shift,
        rest.y + rest.dy * shift,
        tokenRadius * 2,
      );
    });
  // A capsule rests at the middle of its line, where the layout left room for it.
  const key = hops.map((hop) => hop.key).join(' ');
  const middle = onSegment(route.points, route.restSegment, 0.5);
  return [token(key, 'all', middle.x, middle.y, capsuleWidth(key))];
}

/** The lines and the messages moving on them at the stepped moment, in either direction. */
function drawRoutes(routes: readonly Route[], frame: FlowFrame, step: number) {
  const active = hopsByLink(frame.hops);
  const links = routes.map(({ link, points, label }): DrawnLink => {
    const first = points[0];
    const last = points[points.length - 1];
    return {
      id: link.id,
      x1: round(first.x),
      y1: round(first.y),
      x2: round(last.x),
      y2: round(last.y),
      points:
        points.length > 2 ? points.map(({ x, y }) => `${round(x)},${round(y)}`).join(' ') : null,
      head: headOf(points[points.length - 2], last),
      active: active.has(link.id),
      label,
    };
  });
  const moving = routes.flatMap((route) => movingOn(route, active.get(route.link.id) ?? [], step));
  return { links, moving };
}

/** Each stage in its own column, left to right, and messages on the lines between them. */
function pipeline(model: FlowModel, step: number): FlowDrawing {
  const frame = model.frames[step];
  const stages = Math.max(...model.nodes.map(({ stage }) => stage)) + 1;
  const column = drawingWidth / stages;
  // The gap between columns is wide enough for the widest run any line between stages carries.
  const stageOf = new Map(model.nodes.map(({ id, stage }) => [id, stage]));
  const gap = Math.max(
    columnGap,
    roomFor(model, ({ from, to }) => stageOf.get(from) !== stageOf.get(to)),
  );
  const width = column - gap;
  const stateWidth = fitting(width - 2 * padding, 'state');
  const nameOf = (node: FlowNode) => nameIn(node.label, width - 2 * padding);
  const holding = (node: FlowNode) => (holdsEver(model.frames, node.id) ? heldRowHeight : 0);
  const stateHeight = (node: FlowNode) =>
    stateLines(model.frames, node.id, stateWidth) * text.state.line;
  // A box holds its name, then its state, then what it holds, and fits the longest state it has.
  const boxHeight = (node: FlowNode) =>
    Math.max(
      44,
      nameOf(node).lines.length * text.name.line + 2 * padding + stateHeight(node) + holding(node),
    );
  // Rows line up across the columns, each as tall as its tallest node.
  const rows = Math.max(...model.nodes.map(({ row = 0 }) => row)) + 1;
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(
      0,
      ...model.nodes.filter((node) => (node.row ?? 0) === row).map((node) => boxHeight(node) + 28),
    ),
  );
  const rowTop = (row: number) =>
    margin + rowHeights.slice(0, row).reduce((sum, height) => sum + height, 0);
  const placed = new Map(
    model.nodes.map((node) => {
      const height = boxHeight(node);
      const x = node.stage * column + gap / 2;
      const y = rowTop(node.row ?? 0);
      return [node.id, { node, x, y, width, height }] as const;
    }),
  );
  const nodes = [...placed.values()].map(({ node, x, y, height }): DrawnNode => {
    const { lines, scale } = nameOf(node);
    const first = y + padding + 18;
    return {
      id: node.id,
      x,
      y,
      width,
      height,
      // A channel is a pipe: its round ends keep their size however tall its words make it.
      rx: kindOf(node) === 'channel' ? Math.min(22, height / 2) : 6,
      kind: kindOf(node),
      tone: toneOf(node),
      label: lines.map((line, index) => ({
        x: x + width / 2,
        y: round(first + index * text.name.line),
        text: line,
        anchor: 'middle' as const,
      })),
      scale,
      acting: acting(model, frame, node.id),
    };
  });
  // Two links joining the same pair of nodes in opposite directions sit either side of the middle.
  const paired = (link: FlowLink) =>
    model.links.some((other) => other.from === link.to && other.to === link.from);
  // Gutters for the lines that skip a stage run under every row, one below another.
  const skips = model.links.filter((link) => {
    const from = placed.get(link.from);
    const to = placed.get(link.to);
    return from && to && Math.abs(to.node.stage - from.node.stage) > 1;
  });
  const gutterTop = rowTop(rows) - 8;
  const routes = model.links.map((link): Route => {
    const from = placed.get(link.from);
    const to = placed.get(link.to);
    if (!from || !to) throw new Error(`Link ${link.id} joins an unknown node.`);
    // The forward link of a pair runs left to right, or downwards within one column.
    const forward =
      from.node.stage < to.node.stage ||
      (from.node.stage === to.node.stage && (from.node.row ?? 0) < (to.node.row ?? 0));
    const offset = paired(link) ? (forward ? -9 : 9) : 0;
    const named = (x: number, y: number, anchor: DrawnText['anchor']): DrawnText | null =>
      link.label ? { x: round(x), y: round(y), text: link.label, anchor } : null;
    if (from.node.stage === to.node.stage) {
      // Within one column the line runs between the boxes, from one's edge to the other's.
      const down = to.y > from.y;
      const x = from.x + from.width / 2 + offset;
      const start = { x, y: down ? from.y + from.height : from.y };
      const end = { x, y: down ? to.y : to.y + to.height };
      return {
        link,
        points: [start, end],
        restSegment: 0,
        restShare: 0.55,
        label: named(x + 10, (start.y + end.y) / 2, 'start'),
      };
    }
    const sign = from.node.stage < to.node.stage ? 1 : -1;
    const start = {
      x: sign > 0 ? from.x + from.width : from.x,
      y: from.y + from.height / 2 + offset,
    };
    const end = { x: sign > 0 ? to.x : to.x + to.width, y: to.y + to.height / 2 + offset };
    const skip = skips.indexOf(link);
    if (skip >= 0) {
      // A line that skips a stage leaves through the gap beside its sender, runs under every row
      // and climbs to its receiver through the gap beside it, so it never passes behind a box.
      const gutter = gutterTop + skip * gutterSpacing;
      const out = start.x + (sign * gap) / 2;
      const into = end.x - (sign * gap) / 2;
      return {
        link,
        points: [
          start,
          { x: out, y: start.y },
          { x: out, y: gutter },
          { x: into, y: gutter },
          { x: into, y: end.y },
          end,
        ],
        restSegment: 1,
        restShare: 0.5,
        label: named((out + into) / 2, gutter - 6, 'middle'),
      };
    }
    return {
      link,
      points: [start, end],
      restSegment: 0,
      restShare: 0.55,
      // A label sits above its line, or below it for the lower of a pair.
      label: named(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + (offset > 0 ? 26 : -16),
        'middle',
      ),
    };
  });
  const { links, moving } = drawRoutes(routes, frame, step);
  const held = [...placed.values()].flatMap(({ node, x, y, height }) =>
    heldIn(
      node.id,
      heldAfter(model, frame, node.id),
      x + width / 2,
      y + height - padding - tokenRadius,
      width - 2 * padding,
    ),
  );
  const states = [...placed.values()].flatMap(({ node, x, y }) => {
    const top = y + padding + 18 + nameOf(node).lines.length * text.name.line;
    return wrapText(frame.states[node.id] ?? '', stateWidth).map((line, index): DrawnText => ({
      x: round(x + width / 2),
      y: round(top + index * text.state.line),
      text: line,
      anchor: 'middle',
    }));
  });
  const height = rowTop(rows) + margin + (skips.length ? skips.length * gutterSpacing : 0);
  return {
    viewBox: `0 0 ${drawingWidth} ${round(height)}`,
    height: round(height),
    nodes,
    links,
    tokens: [...moving, ...held],
    states,
  };
}

const heldRowHeight = tokenRadius * 2 + 8;

// The top-to-bottom drawing is laid out for a phone's width, so its words keep their own size.
const downWidth = 360;
const stageGap = 56;
const nodeGap = 14;

/**
 * Each stage in its own row, top to bottom, for a narrow screen: the nodes of a stage side by side,
 * each box holding its name, its state and what it holds, so the lines between rows stay clear.
 */
function downward(model: FlowModel, step: number): FlowDrawing {
  const frame = model.frames[step];
  const stages = Math.max(...model.nodes.map(({ stage }) => stage)) + 1;
  const rowsOf = (stage: number) =>
    model.nodes.filter((node) => node.stage === stage).sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
  // Boxes side by side keep a narrow gap, wide enough for the widest run a line within the row
  // carries where one joins them.
  const stageOf = new Map(model.nodes.map(({ id, stage }) => [id, stage]));
  const within = (stage: number) => (link: FlowLink) =>
    stageOf.get(link.from) === stage && stageOf.get(link.to) === stage;
  const gapOf = (stage: number) =>
    model.links.some(within(stage)) ? Math.max(nodeGap, roomFor(model, within(stage))) : nodeGap;
  const widthOf = (stage: number) => {
    const count = rowsOf(stage).length;
    return Math.min(170, (downWidth - 2 * margin - (count - 1) * gapOf(stage)) / count);
  };
  const fit = (value: string, width: number, kind: keyof typeof text) =>
    wrapText(value, fitting(width, kind));
  const nameOf = (node: FlowNode) => nameIn(node.label, widthOf(node.stage) - 2 * padding);
  const stateWidth = (node: FlowNode) => widthOf(node.stage) - 2 * padding;
  const stateCount = (node: FlowNode) =>
    Math.max(
      0,
      ...model.frames.map(({ states }) =>
        states[node.id] ? fit(states[node.id], stateWidth(node), 'state').length : 0,
      ),
    );
  const boxHeight = (node: FlowNode) =>
    nameOf(node).lines.length * text.name.line +
    stateCount(node) * text.state.line +
    (holdsEver(model.frames, node.id) ? heldRowHeight : 0) +
    2 * padding;
  const bandHeights = Array.from({ length: stages }, (_, stage) =>
    Math.max(0, ...rowsOf(stage).map((node) => boxHeight(node))),
  );
  const bandTop = (stage: number) =>
    margin + bandHeights.slice(0, stage).reduce((sum, height) => sum + height + stageGap, 0);
  const placed = new Map(
    Array.from({ length: stages }, (_, stage) => {
      const nodes = rowsOf(stage);
      const width = widthOf(stage);
      const gap = gapOf(stage);
      const left = (downWidth - (nodes.length * width + (nodes.length - 1) * gap)) / 2;
      return nodes.map((node, index) => {
        const height = boxHeight(node);
        // Boxes of one row share their middle, so a short one sits level with a tall one.
        const y = bandTop(stage) + (bandHeights[stage] - height) / 2;
        return [node.id, { node, x: left + index * (width + gap), y, width, height }] as const;
      });
    }).flat(),
  );
  const nodes = [...placed.values()].map(({ node, x, y, width, height }): DrawnNode => {
    const { lines, scale } = nameOf(node);
    return {
      id: node.id,
      x: round(x),
      y: round(y),
      width: round(width),
      height,
      rx: kindOf(node) === 'channel' ? 18 : 6,
      kind: kindOf(node),
      tone: toneOf(node),
      label: lines.map((line, index) => ({
        x: round(x + width / 2),
        y: round(y + padding + 18 + index * text.name.line),
        text: line,
        anchor: 'middle' as const,
      })),
      scale,
      acting: acting(model, frame, node.id),
    };
  });
  const paired = (link: FlowLink) =>
    model.links.some((other) => other.from === link.to && other.to === link.from);
  // Gutters for the lines that skip a row run down the right-hand edge, one inside another.
  const skips = model.links.filter((link) => {
    const from = placed.get(link.from);
    const to = placed.get(link.to);
    return from && to && Math.abs(to.node.stage - from.node.stage) > 1;
  });
  const routes = model.links.map((link): Route => {
    const from = placed.get(link.from);
    const to = placed.get(link.to);
    if (!from || !to) throw new Error(`Link ${link.id} joins an unknown node.`);
    const forward =
      from.node.stage < to.node.stage ||
      (from.node.stage === to.node.stage && (from.node.row ?? 0) < (to.node.row ?? 0));
    const offset = paired(link) ? (forward ? -9 : 9) : 0;
    const named = (x: number, y: number, anchor: DrawnText['anchor']): DrawnText | null =>
      link.label ? { x: round(x), y: round(y), text: link.label, anchor } : null;
    if (from.node.stage === to.node.stage) {
      // Within one row the line runs between the boxes' facing sides.
      const right = to.x > from.x;
      const start = {
        x: right ? from.x + from.width : from.x,
        y: from.y + from.height / 2 + offset,
      };
      const end = { x: right ? to.x : to.x + to.width, y: to.y + to.height / 2 + offset };
      return {
        link,
        points: [start, end],
        restSegment: 0,
        restShare: 0.55,
        label: named((start.x + end.x) / 2, start.y - 10, 'middle'),
      };
    }
    const down = from.node.stage < to.node.stage;
    const start = { x: from.x + from.width / 2 + offset, y: down ? from.y + from.height : from.y };
    const end = { x: to.x + to.width / 2 + offset, y: down ? to.y : to.y + to.height };
    const skip = skips.indexOf(link);
    if (skip >= 0) {
      // A line that skips a row leaves into the gap after its sender's row, runs down the right-hand
      // edge and comes in through the gap before its receiver's row, never behind a box.
      const sign = down ? 1 : -1;
      const out =
        (down
          ? bandTop(from.node.stage) + bandHeights[from.node.stage]
          : bandTop(from.node.stage)) +
        (sign * stageGap) / 2;
      const into =
        (down ? bandTop(to.node.stage) : bandTop(to.node.stage) + bandHeights[to.node.stage]) -
        (sign * stageGap) / 2;
      const gutter = downWidth - 5 - skip * gutterSpacing;
      return {
        link,
        points: [
          start,
          { x: start.x, y: out },
          { x: gutter, y: out },
          { x: gutter, y: into },
          { x: end.x, y: into },
          end,
        ],
        restSegment: 1,
        restShare: 0.5,
        label: named((start.x + gutter) / 2, out - 8, 'middle'),
      };
    }
    return {
      link,
      points: [start, end],
      restSegment: 0,
      restShare: 0.55,
      // A label sits beside its line, on the side away from a paired line.
      label: named(
        (start.x + end.x) / 2 + (offset < 0 ? -14 : 14),
        (start.y + end.y) / 2 + 4,
        offset < 0 ? 'end' : 'start',
      ),
    };
  });
  const { links, moving } = drawRoutes(routes, frame, step);
  const held = [...placed.values()].flatMap(({ node, x, y, width, height }) =>
    heldIn(
      node.id,
      heldAfter(model, frame, node.id),
      x + width / 2,
      y + height - padding - tokenRadius,
      width - 2 * padding,
    ),
  );
  const states = [...placed.values()].flatMap(({ node, x, y, width }) => {
    const top = y + padding + 18 + nameOf(node).lines.length * text.name.line;
    return fit(frame.states[node.id] ?? '', stateWidth(node), 'state').map(
      (line, index): DrawnText => ({
        x: round(x + width / 2),
        y: round(top + index * text.state.line),
        text: line,
        anchor: 'middle',
      }),
    );
  });
  const height = bandTop(stages) - stageGap + margin;
  return {
    viewBox: `0 0 ${downWidth} ${round(height)}`,
    height: round(height),
    nodes,
    links,
    tokens: [...moving, ...held],
    states,
  };
}

/**
 * Which way the stages run: across, a column each, as a wide screen shows the flow, or down, a row
 * each, as a phone shows it.
 */
export type FlowDirection = 'across' | 'down';

/** The flow at one step, its stages running across the drawing or down it. */
export function flowDrawing(
  model: FlowModel,
  step: number,
  direction: FlowDirection = 'across',
): FlowDrawing {
  const index = Math.max(0, Math.min(model.frames.length - 1, Math.round(step)));
  return direction === 'down' ? downward(model, index) : pipeline(model, index);
}
