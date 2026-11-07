import { drawingWidth } from '../../../studies/drawing';
import type { StudyPoint } from '../../../studies/study-model';

interface LabelBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface PlacedLabel {
  readonly label: string | null;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelGuide: StudyPoint | null;
}

// Wide letters need more than the average glyph; punctuation and spaces need less.
// These widths are measured conservatively at 24 units, then scaled to the active font.
const labelWidth = (label: string, fontSize: number) =>
  (fontSize / 24) *
  [...label].reduce(
    (width, letter) =>
      width + (/^[ilI.,' ·]$/.test(letter) ? 8 : /^[MWmw@%]$/.test(letter) ? 24 : 16),
    8,
  );
const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Stop at the near edge of the name's box, approached from its physical anchor. */
function guideEnd(point: StudyPoint, box: LabelBox): StudyPoint | null {
  const centre = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  const fraction = Math.min(
    (box.right - box.left) / 2 / Math.abs(dx),
    (box.bottom - box.top) / 2 / Math.abs(dy),
  );
  if (fraction >= 1) return null;
  return { x: centre.x + dx * fraction, y: centre.y + dy * fraction };
}

/** Places names independently of physical coordinates, keeping the nearest free line. */
export function motionLabels(height: number, fontSize = 24) {
  const placed: LabelBox[] = [];
  const lineHeight = (34 * fontSize) / 24;
  return (point: StudyPoint, label: string | undefined): PlacedLabel => {
    const absent = { label: null, labelX: point.x, labelY: point.y - 16, labelGuide: null };
    if (!label) return absent;
    const half = labelWidth(label, fontSize) / 2;
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
        top: candidate.y - (26 * fontSize) / 24,
        bottom: candidate.y + (6 * fontSize) / 24,
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
      return {
        label,
        labelX: candidate.x,
        labelY: candidate.y,
        labelGuide:
          candidate.x === point.x && candidate.y === preferred ? null : guideEnd(point, box),
      };
    }
    return absent;
  };
}
