import type { RelationNode, StudyPoint } from './study-model';

export type RelationLayout = 'levels' | 'columns';
export type RelationColumn = 0 | 1 | 2;

export const relationCanvasWidth = 400;
export const relationNodeHeight = 44;
const standardNodeWidth = 134;

interface NamedNode {
  readonly id: string;
  readonly label: string;
  readonly lane?: RelationColumn;
}

/** Two columns align corresponding rows. Three center the input and output around the groups between them. */
export function placeNodes(nodes: readonly NamedNode[], layout: RelationLayout) {
  const center = relationCanvasWidth / 2;
  if (layout === 'levels') {
    return {
      nodeWidth: standardNodeWidth,
      nodes: nodes.map(({ id, label }, index) => ({
        id,
        label,
        x: center,
        y: 38 + (nodes.length - 1 - index) * 78,
      })),
    };
  }

  const columns = nodes.map(({ lane }, index) => lane ?? index % 2);
  const count = Math.max(2, ...columns.map((column) => column + 1));
  const sizes = Array.from(
    { length: count },
    (_, lane) => columns.filter((col) => col === lane).length,
  );
  const tallest = Math.max(...sizes);
  const nextRow = sizes.map((size) => (count === 2 ? 0 : (tallest - size) / 2));
  const margin = count === 2 ? 92 : 60;
  const spacing = (relationCanvasWidth - 2 * margin) / (count - 1);
  return {
    nodeWidth: count === 2 ? standardNodeWidth : 94,
    nodes: nodes.map(({ id, label }, index) => {
      const col = columns[index];
      return { id, label, x: margin + col * spacing, y: 38 + nextRow[col]++ * 86 };
    }),
  };
}

const point = ({ x, y }: StudyPoint) => `${x},${y}`;

/** Terminate at the box boundary, so neither its name nor the arrowhead is obscured. */
function port(center: StudyPoint, toward: StudyPoint, nodeWidth: number): StudyPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale =
    1 / Math.max((2 * Math.abs(dx)) / nodeWidth, (2 * Math.abs(dy)) / relationNodeHeight);
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

function arrowhead(tip: StudyPoint, previous: StudyPoint): string {
  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const wing = (offset: number) =>
    point({
      x: tip.x - 10 * Math.cos(angle + offset),
      y: tip.y - 10 * Math.sin(angle + offset),
    });
  return [point(tip), wing(0.47), wing(-0.47)].join(' ');
}

/** Long vertical links take the outer margin. A return to the same node has its own loop. */
export function drawEdge(
  from: RelationNode,
  to: RelationNode,
  reciprocal: boolean,
  nodeWidth: number,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const self = from.id === to.id;
  const outer = dx === 0 && (self || Math.abs(dy) > 90);
  const outside = from.x < relationCanvasWidth / 2 ? -1 : 1;
  const side = reciprocal && !self && dy < 0 ? -outside : outside;
  const bend = reciprocal ? 25 : 0;
  const length = Math.hypot(dx, dy) || 1;
  const middle = {
    x: (from.x + to.x) / 2 - (dy / length) * bend,
    y: (from.y + to.y) / 2 + (dx / length) * bend,
  };
  const room = side < 0 ? from.x : relationCanvasWidth - from.x;
  const rail = from.x + side * Math.min(127, room - 2);
  const a = outer ? { x: rail, y: from.y - (self ? 42 : 0) } : middle;
  const b = outer ? { x: rail, y: to.y + (self ? 42 : 0) } : middle;
  const start = port(from, a, nodeWidth);
  const end = port(to, b, nodeWidth);
  return {
    path: `M${point(start)} C${point(a)} ${point(b)} ${point(end)}`,
    arrow: arrowhead(end, b),
  };
}
