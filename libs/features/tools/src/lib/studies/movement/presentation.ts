import type { SteeringBody, Vec2 } from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionBounds,
  MotionFrame,
  MotionLink,
  MotionMark,
  StudyPoint,
  StudyTone,
} from '../study-model';

export interface MotionLabelRow {
  readonly left: number;
  readonly span: number;
  readonly y: number;
  readonly minimumGap: number;
}

export interface MotionLabelAnchor {
  readonly label: string;
  readonly point: StudyPoint;
}

function needsLabelRow(
  frame: MotionFrame,
  names: readonly MotionLabelAnchor[],
  layout: MotionLabelRow,
): boolean {
  const unit = layout.span / drawingWidth;
  const crowded = names.some(({ point }, index) =>
    names
      .slice(index + 1)
      .some(
        ({ point: other }) =>
          Math.abs(point.x - other.x) < layout.minimumGap * unit &&
          Math.abs(point.y - other.y) < 32 * unit,
      ),
  );
  const crossesArrow = names.some(({ label, point }) =>
    (frame.vectors ?? []).some((vector) => {
      const left = point.x - label.length * 8 * unit;
      const right = point.x + label.length * 8 * unit;
      const top = point.y - 40 * unit;
      const bottom = point.y - 12 * unit;
      return (
        Math.max(vector.x, vector.x + vector.dx) + 8 * unit >= left &&
        Math.min(vector.x, vector.x + vector.dx) - 8 * unit <= right &&
        Math.max(vector.y, vector.y + vector.dy) + 8 * unit >= top &&
        Math.min(vector.y, vector.y + vector.dy) - 8 * unit <= bottom
      );
    }),
  );
  return crowded || crossesArrow;
}

/** Move crowded names below a run, routing their connectors around the text. */
export function withLabelRow(
  frame: MotionFrame,
  names: readonly MotionLabelAnchor[],
  layout: MotionLabelRow,
): MotionFrame {
  if (!needsLabelRow(frame, names, layout)) return frame;
  const { left, span, y } = layout;
  const unit = span / drawingWidth;
  const callouts = names.map<MotionMark>(({ label }, index) => ({
    x: left + (span * (index + 1)) / (names.length + 1),
    y,
    shape: 'dot',
    tone: 'muted',
    label,
  }));
  const connectors = names.flatMap<MotionLink>(({ point }, index) => {
    const callout = callouts[index];
    const above = { x: callout.x + 64 * unit, y: y - 48 * unit };
    const beside = { x: above.x, y };
    return [
      { from: point, to: above, tone: 'muted' },
      { from: above, to: beside, tone: 'muted' },
      { from: beside, to: callout, tone: 'muted' },
    ];
  });
  return {
    ...frame,
    bodies: frame.bodies.map((body) => ({ ...body, label: undefined })),
    marks: [...(frame.marks ?? []).map((mark) => ({ ...mark, label: undefined })), ...callouts],
    links: [...(frame.links ?? []), ...connectors],
  };
}

/** Keep trailing digits while normalising a rounded negative zero. */
export const { number: fixed, vector: pair } = createNumberFormat({ normalizeNegativeZero: true });

/** Preserve the authored precision and any explicitly chosen near-zero cutoff. */
export const decimal = (value: number, digits = 2, zeroThreshold = 0): string =>
  createNumberFormat({ digits, zeroThreshold }).number(value);

export const brief = (value: number, digits = 1): string => decimal(value, digits);

export const vectorText = (value: Vec2, digits = 2, zeroThreshold = 0): string =>
  createNumberFormat({ digits, zeroThreshold }).vector(value);

/** Drop insignificant trailing zeroes in studies authored with compact numbers. */
export const { number: rounded } = createNumberFormat({ trimTrailingZeroes: true });

/** Fit the authored points without changing a study's choice of padding. */
export function boundsOfPoints(points: readonly Vec2[], padding: number): MotionBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
}

/** The ordinary motion bounds use bodies, marks and arrow tips at each sample. */
export const motionPoints = (frames: readonly MotionFrame[]): readonly Vec2[] =>
  frames.flatMap((frame) => [
    ...frame.bodies,
    ...(frame.marks ?? []),
    ...(frame.vectors ?? []).map(({ x, y, dx, dy }) => ({ x: x + dx, y: y + dy })),
  ]);

/** A label attached to a world position, with a separate clear place for its text. */
export interface AnchoredLabel {
  readonly label: string;
  readonly position: StudyPoint;
  readonly anchor: StudyPoint;
}

/** One labelled acceleration in the study's vector inset. */
export interface AccelerationRow {
  readonly label: string;
  readonly acceleration: StudyPoint;
  readonly tone: StudyTone;
}

/** The named moving body a formation explanation reads from the simulation. */
export interface PresentationMember extends SteeringBody {
  readonly id: string;
}
