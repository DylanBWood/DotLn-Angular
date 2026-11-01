import { drawingWidth } from '../../../studies/drawing';
import type {
  MotionBody,
  MotionModel,
  StudyFrame,
  StudyPoint,
  StudyTone,
} from '../../../studies/study-model';

const trailMoments = 24;
const trailSpacing = 3;
const arrowLength = 16;
const arrowWidth = 10;
const headLength = 10;
const headWidth = 8;
// A vector shorter than this, in the drawing's units, is too small to carry a head.
const shortestHeaded = 4;
// A label sits this far above the middle of what it names.
const labelOffset = 16;

export interface DrawnBody {
  readonly id: string;
  readonly tone: StudyTone;
  readonly x: number;
  readonly y: number;
  /** The arrowhead's points, or null for a body drawn as a dot. */
  readonly arrow: string | null;
  readonly label: string | null;
  readonly labelY: number;
}

export interface MotionDrawing {
  readonly viewBox: string;
  readonly zones: readonly (StudyPoint & { readonly r: number; readonly tone: StudyTone })[];
  readonly links: readonly {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly tone: StudyTone;
  }[];
  readonly marks: readonly (StudyPoint & {
    readonly shape: 'cross' | 'ring' | 'dot';
    readonly tone: StudyTone;
    readonly cross: string;
    readonly label: string | null;
    readonly labelY: number;
  })[];
  readonly trail: readonly StudyPoint[];
  readonly bodies: readonly DrawnBody[];
  readonly vectors: readonly {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly tone: StudyTone;
    /** The arrowhead's points, or null for a vector too short to carry one. */
    readonly head: string | null;
  }[];
}

const rounded = (value: number) => Number(value.toFixed(2));

/** A triangle at a point, pointing along a direction of unit length. */
const triangle = ({ x, y }: StudyPoint, forward: StudyPoint, length: number, width: number) => {
  const side = { x: -forward.y, y: forward.x };
  const point = (along: number, across: number) =>
    `${rounded(x + forward.x * along + side.x * across)},${rounded(y + forward.y * along + side.y * across)}`;
  return [
    point(length * 0.6, 0),
    point(-length * 0.4, width / 2),
    point(-length * 0.4, -width / 2),
  ].join(' ');
};

const arrowhead = (point: StudyPoint, heading: number) =>
  triangle(point, { x: Math.cos(heading), y: Math.sin(heading) }, arrowLength, arrowWidth);

function vectorHead(x1: number, y1: number, x2: number, y2: number) {
  const size = Math.hypot(x2 - x1, y2 - y1);
  if (size < shortestHeaded) return null;
  return triangle(
    { x: x2, y: y2 },
    { x: (x2 - x1) / size, y: (y2 - y1) / size },
    headLength,
    headWidth,
  );
}

const trailOf = (
  frames: readonly StudyFrame[],
  step: number,
  scale: (point: StudyPoint) => StudyPoint,
) =>
  frames
    .slice(Math.max(0, step - trailMoments), step)
    .filter((_frame, index) => index % trailSpacing === 0)
    .flatMap((frame) => frame.bodies.map(scale));

/** Turns a moment of the model into the drawing's coordinates, all derived from the bounds. */
export function motionDrawing(model: MotionModel, step: number): MotionDrawing {
  const { minX, maxX, minY, maxY } = model.bounds;
  const scale = drawingWidth / (maxX - minX);
  const toDrawing = ({ x, y }: StudyPoint) => ({
    x: rounded((x - minX) * scale),
    y: rounded((y - minY) * scale),
  });
  const frame = model.frames[Math.max(0, Math.min(model.frames.length - 1, step))];
  const body = ({ id, tone = 'subject', heading, label, ...place }: MotionBody): DrawnBody => {
    const point = toDrawing(place);
    return {
      id,
      tone,
      ...point,
      arrow: heading === undefined ? null : arrowhead(point, heading),
      label: label ?? null,
      labelY: point.y - labelOffset,
    };
  };
  return {
    viewBox: `0 0 ${drawingWidth} ${rounded((maxY - minY) * scale)}`,
    zones: (frame.zones ?? []).map(({ radius, tone = 'zone', ...place }) => ({
      ...toDrawing(place),
      r: rounded(radius * scale),
      tone,
    })),
    links: (frame.links ?? []).map(({ from, to, tone = 'muted' }) => {
      const [start, end] = [toDrawing(from), toDrawing(to)];
      return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, tone };
    }),
    marks: (frame.marks ?? []).map(({ shape, tone = 'target', label, ...place }) => {
      const { x, y } = toDrawing(place);
      return {
        x,
        y,
        shape,
        tone,
        cross: `M ${x - 8} ${y - 8} L ${x + 8} ${y + 8} M ${x + 8} ${y - 8} L ${x - 8} ${y + 8}`,
        label: label ?? null,
        labelY: y - labelOffset,
      };
    }),
    trail: model.trail ? trailOf(model.frames, step, toDrawing) : [],
    bodies: frame.bodies.map(body),
    vectors: (frame.vectors ?? []).map(({ dx, dy, tone, ...place }) => {
      const start = toDrawing(place);
      const [x2, y2] = [rounded(start.x + dx * scale), rounded(start.y + dy * scale)];
      return { x1: start.x, y1: start.y, x2, y2, tone, head: vectorHead(start.x, start.y, x2, y2) };
    }),
  };
}
