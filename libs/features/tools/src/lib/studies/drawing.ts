import type { MotionBounds, StudyFrame, StudyPoint } from './study-model';

/** The width a drawing is laid out in, whatever size it is shown at. */
export const drawingWidth = 600;

/** Every point a frame draws. */
const pointsOf = (frame: StudyFrame): readonly StudyPoint[] => [
  ...frame.bodies,
  ...(frame.marks ?? []),
  ...(frame.zones ?? []).flatMap(({ x, y, radius }) => [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y + radius },
  ]),
  ...(frame.vectors ?? []).flatMap((vector) => [
    vector,
    { x: vector.x + vector.dx, y: vector.y + vector.dy },
  ]),
  ...(frame.links ?? []).flatMap(({ from, to }) => [from, to]),
];

const boxOf = (points: readonly StudyPoint[], padding: number): MotionBounds => ({
  minX: Math.min(...points.map(({ x }) => x)) - padding,
  maxX: Math.max(...points.map(({ x }) => x)) + padding,
  minY: Math.min(...points.map(({ y }) => y)) - padding,
  maxY: Math.max(...points.map(({ y }) => y)) + padding,
});

/** A box round everything the frames draw, with the margin the study needs. */
export function boundsOf(frames: readonly StudyFrame[], padding: number): MotionBounds {
  return boxOf(frames.flatMap(pointsOf), padding);
}

/** The same box with room for the frames' names at the drawing's larger text size. */
export function namedBoundsOf(frames: readonly StudyFrame[], padding: number): MotionBounds {
  const raw = frames.flatMap(pointsOf);
  const names = frames.flatMap((frame) =>
    [...frame.bodies, ...(frame.marks ?? [])].flatMap((point) =>
      point.label ? [{ ...point, label: point.label }] : [],
    ),
  );
  const widest = Math.max(0, ...names.map(({ label }) => label.length * 8));
  const span =
    Math.max(...raw.map(({ x }) => x)) - Math.min(...raw.map(({ x }) => x)) + 2 * padding;
  const unitsPerPixel = span / (drawingWidth - 2 * widest);
  return boxOf(
    [
      ...raw,
      ...names.flatMap(({ x, y, label }) => [
        { x: x - label.length * 8 * unitsPerPixel, y: y - 42 * unitsPerPixel },
        { x: x + label.length * 8 * unitsPerPixel, y },
      ]),
    ],
    padding,
  );
}

/**
 * Keeps a frame's names readable even at the drawing's larger narrow-screen text size: a label that
 * would collide with one already placed is dropped, so a crowded moment names fewer things rather
 * than overprinting them. `first` says which names a study's moment needs most: its bodies, with an
 * anchor before them, or its marks.
 */
export function withSpacedLabels(
  frame: StudyFrame,
  bounds: MotionBounds,
  first: 'bodies' | 'marks' = 'bodies',
): StudyFrame {
  const scale = drawingWidth / (bounds.maxX - bounds.minX);
  const height = (bounds.maxY - bounds.minY) * scale;
  const placed: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  }[] = [];
  const choose = ({
    x,
    y,
    label,
  }: {
    readonly x: number;
    readonly y: number;
    readonly label?: string;
  }) => {
    if (!label) return undefined;
    const middle = (x - bounds.minX) * scale;
    const baseline = (y - bounds.minY) * scale - 16;
    const box = {
      left: middle - label.length * 7.5 - 4,
      right: middle + label.length * 7.5 + 4,
      top: baseline - 26,
      bottom: baseline + 4,
    };
    if (
      box.left < 0 ||
      box.right > drawingWidth ||
      box.top < 0 ||
      box.bottom > height ||
      placed.some(
        (other) =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top,
      )
    )
      return undefined;
    placed.push(box);
    return label;
  };
  const nameBodies = () => {
    const anchor = frame.bodies.find(({ id }) => id === 'anchor');
    const anchorLabel = anchor ? choose(anchor) : undefined;
    return frame.bodies.map((body) => ({
      ...body,
      label: body.id === 'anchor' ? anchorLabel : choose(body),
    }));
  };
  const nameMarks = () => frame.marks?.map((mark) => ({ ...mark, label: choose(mark) }));
  if (first === 'marks') {
    const marks = nameMarks();
    return { ...frame, bodies: nameBodies(), marks };
  }
  const bodies = nameBodies();
  return { ...frame, bodies, marks: nameMarks() };
}
