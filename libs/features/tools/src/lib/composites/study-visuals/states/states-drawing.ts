import { drawingWidth } from '../../../studies/drawing';
import type { StateMove, StatesFrame, StatesModel, StudyTone } from '../../../studies/study-model';

/** How the drawing is laid out: across for a wide reading measure, narrow for a phone. */
export type StatesLayout = 'wide' | 'narrow';

/** The width each layout is drawn in, in drawing units; the stylesheet's sizes are in the same units. */
export const statesWidth: Readonly<Record<StatesLayout, number>> = {
  wide: drawingWidth,
  narrow: 330,
};

// Text is measured in drawing units at the stylesheet's sizes: the width of one character and the
// height of one line.
export const statesText = {
  heading: { char: 14 * 0.58, line: 19 },
  name: { char: 14 * 0.56, line: 19 },
  note: { char: 12 * 0.55, line: 16 },
  transition: { char: 12 * 0.55, line: 15 },
} as const;
export const tokenRadius = 12;

/** An object's token where its state puts it at the stepped moment. */
export interface DrawnStatesToken {
  readonly id: string;
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Moving at the stepped moment, drawn green, or resting where it was, drawn outlined. */
  readonly state: 'moving' | 'resting';
  /** How far along its row a moving token sets out from where it is drawn, for the glide. */
  readonly fromDx: number;
}

/** A place an object left at the stepped moment without arriving anywhere the drawing shows. */
export interface DrawnStatesGhost {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/** How many characters of a kind of text fit a width, never fewer than one. */
export const fitting = (width: number, kind: keyof typeof statesText) =>
  Math.max(1, Math.floor(width / statesText[kind].char));

/** The frame at a step, kept inside the run. */
export function frameAt(model: StatesModel, step: number): StatesFrame {
  const last = model.frames.length - 1;
  return model.frames[Math.max(0, Math.min(last, Math.round(step)))];
}

/** The states an object moved into at the stepped moment, which the drawing marks as acting. */
export const arrivals = (moves: readonly StateMove[]): ReadonlySet<string> =>
  new Set(moves.flatMap(({ to }) => (to === null ? [] : [to])));

/** A state's tone, `other` when the model gives none. */
export const toneOf = (tone: StudyTone | undefined): StudyTone => tone ?? 'other';
