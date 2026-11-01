import { drawingWidth } from '../../../studies/drawing';
import type { MarbleLine, MarblesModel, StudyTone } from '../../../studies/study-model';

// A marble's radius at a frame spacing of fullSpacing or more; closer frames shrink it, to no less
// than half.
const fullRadius = 12;
const fullSpacing = 14;
// A line's name sits above its axis; the axis sits this far below the top of its lane.
const laneHeight = 58;
const axisOffset = 40;
const labelOffset = 22;
// The operator's band between the inputs and the outputs.
const operatorHeight = 36;
const operatorMargin = 12;
// Room at the ends for the first and last marbles, and under the lanes for the frame numbers.
const endMargin = 28;
const footer = 26;

export interface DrawnMarble {
  /** The line's id and the event's place in it, so a step keeps each marble's element. */
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly key: string;
  readonly tone: StudyTone;
  /** True for the stepped frame's emissions, drawn raised. */
  readonly current: boolean;
  /** True for an output emission of the stepped frame that a courier arrives at. */
  readonly landing: boolean;
}

/**
 * An output value of the stepped frame, riding from the emission it comes from down to where it
 * appears on the output lane, in that lane's tone.
 */
export interface DrawnCourier {
  readonly x: number;
  readonly y1: number;
  readonly y2: number;
  readonly r: number;
  readonly key: string;
  readonly tone: StudyTone;
}

export interface DrawnSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly tone: StudyTone;
}

export interface DrawnLabel {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly anchor: 'start' | 'middle' | 'end';
}

export interface MarblesDrawing {
  readonly viewBox: string;
  /** Each line's axis over the span it is listened to. */
  readonly axes: readonly DrawnSegment[];
  /** The part of a line before it is opened, when the example opens it later than frame 0. */
  readonly idle: readonly DrawnSegment[];
  readonly marbles: readonly DrawnMarble[];
  /** Completion bars. */
  readonly completes: readonly DrawnSegment[];
  /** Error crosses, as paths. */
  readonly errors: readonly { readonly d: string; readonly tone: StudyTone }[];
  /** Where the operator stopped listening to a line before it was done: a small hollow ring. */
  readonly cuts: readonly { readonly x: number; readonly y: number; readonly r: number }[];
  readonly labels: readonly DrawnLabel[];
  /** The stepped frame's couriers, from each emission to the output value it becomes. */
  readonly couriers: readonly DrawnCourier[];
  readonly operator: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly text: string;
  };
  /** The stepped frame, across every lane. */
  readonly cursor: DrawnSegment;
  /** Where the next frame sits, which the line glides towards while the example plays. */
  readonly cursorNext: number;
  readonly ticks: readonly DrawnLabel[];
}

const rounded = (value: number) => Number(value.toFixed(2));

const toneOf = (line: MarbleLine): StudyTone =>
  line.role === 'input' ? 'subject' : line.role === 'inner' ? 'other' : 'actual';

/** The frames whose numbers are written under the diagram: every one while they fit. */
const tickFrames = (lastFrame: number) => {
  const every = lastFrame <= 15 ? 1 : lastFrame <= 30 ? 2 : 5;
  return Array.from({ length: Math.floor(lastFrame / every) + 1 }, (_, index) => index * every);
};

const cross = (x: number, y: number, size: number) =>
  `M ${rounded(x - size)} ${rounded(y - size)} L ${rounded(x + size)} ${rounded(y + size)} M ${rounded(x + size)} ${rounded(y - size)} L ${rounded(x - size)} ${rounded(y + size)}`;

/**
 * The span of frames a line is listened to: from where it is subscribed to where the subscription
 * ends, or to its completion or error, or to the diagram's last frame when it never ends.
 */
const spanOf = (line: MarbleLine, lastFrame: number) => {
  const done = line.events.find(({ kind, delivered }) => kind !== 'next' && delivered)?.frame;
  return { from: line.subscribedAt ?? 0, to: line.unsubscribedAt ?? done ?? lastFrame };
};

/**
 * Turns a marble diagram into the drawing's coordinates: time runs left to right, the inputs' lanes
 * above the operator's band and the outputs' below, with the stepped frame marked down every lane.
 * A cut-off lane ends in a small hollow ring: what nothing received is not drawn; a lane opened
 * later than frame 0 is dotted before its opening; every frame that fits is numbered under the
 * diagram, and the stepped frame is a dotted line down through every lane.
 */
export function marblesDrawing(model: MarblesModel, step: number): MarblesDrawing {
  const current = model.frames[Math.max(0, Math.min(model.frames.length - 1, step))]?.frame ?? 0;
  const lastFrame = Math.max(1, model.lastFrame);
  const spacing = (drawingWidth - 2 * endMargin) / lastFrame;
  const radius = Math.min(fullRadius, Math.max(6, (spacing / fullSpacing) * fullRadius));
  const x = (frame: number) => rounded(endMargin + frame * spacing);
  const above = model.lines.filter(({ role }) => role !== 'output');
  const below = model.lines.filter(({ role }) => role === 'output');
  const operatorTop = above.length * laneHeight + operatorMargin;
  const outputsTop = operatorTop + operatorHeight + operatorMargin;
  const height = outputsTop + below.length * laneHeight + footer;
  const laneTop = (line: MarbleLine) => {
    const index = above.indexOf(line);
    return index >= 0 ? index * laneHeight : outputsTop + below.indexOf(line) * laneHeight;
  };
  const axes: DrawnSegment[] = [];
  const idle: DrawnSegment[] = [];
  const marbles: DrawnMarble[] = [];
  const completes: DrawnSegment[] = [];
  const errors: { d: string; tone: StudyTone }[] = [];
  const cuts: { x: number; y: number; r: number }[] = [];
  const labels: DrawnLabel[] = [];
  const axisY = (line: MarbleLine) => laneTop(line) + axisOffset;
  /** The lane an output value of the stepped frame rides down from, as the model names it. */
  const originOf = (from: string | undefined) =>
    from === undefined ? undefined : model.lines.find(({ label }) => label === from);
  const couriers: DrawnCourier[] = [];
  for (const line of model.lines) {
    const tone = toneOf(line);
    const y = laneTop(line) + axisOffset;
    const { from, to } = spanOf(line, lastFrame);
    labels.push({
      x: x(0) - radius,
      y: laneTop(line) + labelOffset,
      text: line.label,
      anchor: 'start',
    });
    axes.push({ x1: x(from), y1: y, x2: x(to), y2: y, tone });
    if (from > 0) idle.push({ x1: x(0), y1: y, x2: x(from), y2: y, tone });
    // An output lane fills in as the frames pass: nothing on it is drawn before its frame. The
    // inputs and the inner streams show their whole plan.
    const arrivedBy = (frame: number) => line.role !== 'output' || frame <= current;
    if (line.cancelled && line.unsubscribedAt !== undefined && arrivedBy(line.unsubscribedAt))
      cuts.push({ x: x(line.unsubscribedAt), y, r: rounded(radius * 0.45) });
    const heard = line.events.filter(({ delivered, frame }) => delivered && arrivedBy(frame));
    for (const event of heard) {
      // Emissions grouped on one frame spread out around it, the completion or error after them.
      const group = heard.filter(({ frame, kind }) => frame === event.frame && kind === 'next');
      const spread = group.length > 1 ? radius * 1.7 : 0;
      const place = (index: number) =>
        rounded(x(event.frame) + (index - (group.length - 1) / 2) * spread);
      const after = rounded(
        x(event.frame) + ((group.length - 1) / 2) * spread + (group.length ? radius + 3 : 0),
      );
      if (event.kind === 'next') {
        const origin = event.frame === current ? originOf(event.from) : undefined;
        const at = place(group.indexOf(event));
        marbles.push({
          id: `${line.id}:${line.events.indexOf(event)}`,
          x: at,
          y,
          r: radius,
          key: event.key,
          tone,
          current: event.frame === current,
          landing: origin !== undefined,
        });
        // The value rides down from the lane it comes from to where it appears.
        if (origin)
          couriers.push({ x: at, y1: axisY(origin), y2: y, r: radius, key: event.key, tone });
      } else if (event.kind === 'complete')
        completes.push({ x1: after, y1: y - radius, x2: after, y2: y + radius, tone });
      else errors.push({ d: cross(after, y, radius * 0.8), tone });
    }
  }
  return {
    viewBox: `0 0 ${drawingWidth} ${rounded(height)}`,
    axes,
    idle,
    marbles,
    completes,
    errors,
    cuts,
    labels,
    couriers,
    operator: {
      x: endMargin - radius,
      y: operatorTop,
      width: drawingWidth - 2 * (endMargin - radius),
      height: operatorHeight,
      text: model.operator,
    },
    cursor: { x1: x(current), y1: 0, x2: x(current), y2: height - footer, tone: 'muted' },
    cursorNext: x(Math.min(lastFrame, current + 1)),
    ticks: tickFrames(lastFrame).map((frame) => ({
      x: x(frame),
      y: height - 6,
      text: String(frame),
      anchor: 'middle',
    })),
  };
}
