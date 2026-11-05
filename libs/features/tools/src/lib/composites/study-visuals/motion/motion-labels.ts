import { drawingWidth } from '../../../studies/drawing';
import type { StudyPoint } from '../../../studies/study-model';

interface LabelBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

// Reserve room at the narrow-screen 24-unit font size, also safe for the 15-unit desktop text.
// Wide letters need more than the average glyph; punctuation and spaces need less.
const labelWidth = (label: string) =>
  [...label].reduce(
    (width, letter) =>
      width + (/^[ilI.,' ·]$/.test(letter) ? 8 : /^[MWmw@%]$/.test(letter) ? 24 : 16),
    8,
  );
const lineHeight = 34;
const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Places names independently of physical coordinates, keeping the nearest free line. */
export function motionLabels(height: number) {
  const placed: LabelBox[] = [];
  return (point: StudyPoint, label: string | undefined) => {
    if (!label) return { label: null, labelX: point.x, labelY: point.y - 16 };
    const half = labelWidth(label) / 2;
    const x = Math.max(half, Math.min(drawingWidth - half, point.x));
    const preferred = point.y - 16;
    // Consider the nearest clear line and the edges of names already placed. Sideways room
    // matters when a short, crowded drawing has too few rows to stack all its names.
    const candidates: StudyPoint[] = [];
    for (let line = 0; line <= Math.ceil(height / lineHeight); line++) {
      const rows =
        line === 0 ? [preferred] : [preferred - line * lineHeight, preferred + line * lineHeight];
      for (const y of rows)
        for (const nextX of [
          x,
          ...placed.flatMap((box) => [box.left - half - 2, box.right + half + 2]),
        ])
          candidates.push({ x: nextX, y });
    }
    const distance = (candidate: StudyPoint) =>
      (candidate.x - point.x) ** 2 + (candidate.y - preferred) ** 2;
    candidates.sort((a, b) => distance(a) - distance(b));
    for (const candidate of candidates) {
      const box = {
        left: candidate.x - half,
        right: candidate.x + half,
        top: candidate.y - 26,
        bottom: candidate.y + 6,
      };
      if (
        box.left < 0 ||
        box.right > drawingWidth ||
        box.top < 0 ||
        box.bottom > height ||
        placed.some((other) => overlaps(box, other))
      )
        continue;
      placed.push(box);
      return { label, labelX: candidate.x, labelY: candidate.y };
    }
    return { label: null, labelX: point.x, labelY: preferred };
  };
}
