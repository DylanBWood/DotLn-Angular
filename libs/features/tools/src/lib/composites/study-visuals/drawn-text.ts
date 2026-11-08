/** A line of text placed in a drawing, in the drawing's own units. */
export interface DrawnText {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly anchor: 'start' | 'middle' | 'end';
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

/**
 * Breaks a word too long for its line into the fewest parts of at most `width` characters, each
 * part but the last ending in a hyphen. The letters are shared as evenly as the parts allow, the
 * longer parts first, so a reader meets most of the word on its first line. A word that fits, or a
 * width too narrow for a letter and its hyphen, is left whole.
 */
export function breakWord(word: string, width: number): readonly string[] {
  if (word.length <= width || width < 2) return [word];
  const parts = Math.ceil((word.length - 1) / (width - 1));
  const letters = Math.min(width - 1, Math.ceil(word.length / parts));
  return Array.from({ length: parts }, (_, index) =>
    index === parts - 1
      ? word.slice(index * letters)
      : `${word.slice(index * letters, (index + 1) * letters)}-`,
  );
}
