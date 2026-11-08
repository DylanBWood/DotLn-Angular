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
