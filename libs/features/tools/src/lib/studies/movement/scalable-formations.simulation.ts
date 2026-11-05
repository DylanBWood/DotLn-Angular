import type { StudyParameters } from '@dotln-angular/models';
import {
  add,
  centroid,
  distance,
  patternSlots,
  subtract,
  type Vec2,
} from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface ScalableFormationParameters {
  readonly initialCount: number;
  readonly targetCount: number;
  readonly comparisonCount: number;
  readonly spacing: number;
  readonly memberRadius: number;
  readonly laneWidth: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly joinStart: number;
  readonly joinInterval: number;
  readonly timeStep: number;
  readonly steps: number;
}

export interface ScalableFormationSample {
  readonly step: number;
  readonly seconds: number;
  readonly count: number;
  readonly offsets: readonly Vec2[];
  readonly rawOffsets: readonly Vec2[];
  readonly rawCentre: Vec2;
  readonly positions: readonly Vec2[];
  readonly retainedShift: number;
  readonly centreSpan: number;
  readonly width: number;
  readonly clearance: number;
}

export const readParameters = (parameters: StudyParameters): ScalableFormationParameters => ({
  initialCount: numberParameter(parameters, 'initialCount'),
  targetCount: numberParameter(parameters, 'targetCount'),
  comparisonCount: numberParameter(parameters, 'comparisonCount'),
  spacing: numberParameter(parameters, 'spacing'),
  memberRadius: numberParameter(parameters, 'memberRadius'),
  laneWidth: numberParameter(parameters, 'laneWidth'),
  anchorX: numberParameter(parameters, 'anchorX'),
  anchorY: numberParameter(parameters, 'anchorY'),
  joinStart: numberParameter(parameters, 'joinStart'),
  joinInterval: numberParameter(parameters, 'joinInterval'),
  timeStep: numberParameter(parameters, 'timeStep'),
  steps: numberParameter(parameters, 'steps'),
});

export const anchorOf = (example: ScalableFormationParameters): Vec2 => ({
  x: example.anchorX,
  y: example.anchorY,
});

/** Membership is a scripted input to the pattern, not the result of moving scouts. */
export function countAt(
  step: number,
  example: ScalableFormationParameters,
  targetCount = example.targetCount,
): number {
  const joins = Math.max(
    0,
    Math.min(
      targetCount - example.initialCount,
      1 + Math.floor((step - example.joinStart) / example.joinInterval),
    ),
  );
  return example.initialCount + joins;
}

/** Run the engine's geometry and measure proposals without inventing a travel controller. */
export function scalableFormationSamples(
  example: ScalableFormationParameters,
  targetCount = example.targetCount,
): readonly ScalableFormationSample[] {
  const anchor = anchorOf(example);
  const upperEdge = anchor.y - example.laneWidth / 2;
  const lowerEdge = anchor.y + example.laneWidth / 2;
  const samples: ScalableFormationSample[] = [];
  for (let step = 0; step <= example.steps; step++) {
    const count = countAt(step, example, targetCount);
    const offsets = patternSlots('wedge', count, example.spacing);
    const positions = offsets.map((offset) => add(anchor, offset));
    // A wedge's raw tip is the origin. Recover the raw offsets for the worked calculation
    // from the engine output instead of maintaining a second layout implementation.
    const rawOffsets = offsets.map((offset) => subtract(offset, offsets[0]));
    const rawCentre = centroid(rawOffsets);
    const previous = samples.at(-1)?.positions ?? positions;
    const retainedShift = Math.max(
      ...positions
        .slice(0, previous.length)
        .map((position, index) => distance(position, previous[index])),
    );
    const upper = Math.min(...positions.map(({ y }) => y));
    const lower = Math.max(...positions.map(({ y }) => y));
    const centreSpan = lower - upper;
    const width = centreSpan + 2 * example.memberRadius;
    const clearance = Math.min(
      upper - example.memberRadius - upperEdge,
      lowerEdge - lower - example.memberRadius,
    );
    samples.push({
      step,
      seconds: step * example.timeStep,
      count,
      offsets,
      rawOffsets,
      rawCentre,
      positions,
      retainedShift,
      centreSpan,
      width,
      clearance,
    });
  }
  return samples;
}
