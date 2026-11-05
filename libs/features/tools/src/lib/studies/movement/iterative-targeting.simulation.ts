import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';

export interface IterativeTargetingParameters {
  readonly targetX: number;
  readonly launchSpeed: number;
  readonly gravity: number;
  readonly drag: number;
  readonly timeStep: number;
  readonly flightSteps: number;
  readonly lowerAngle: number;
  readonly upperAngle: number;
  readonly tolerance: number;
  readonly maxIterations: number;
  readonly shortBudget: number;
  readonly guessSeconds: number;
}

export interface TargetFlightPoint {
  readonly seconds: number;
  readonly x: number;
  readonly height: number;
  readonly vx: number;
  readonly vy: number;
}

export interface TargetFlight {
  readonly angle: number;
  readonly points: readonly TargetFlightPoint[];
  readonly range: number | null;
}

export interface TargetFlightSample extends TargetFlight {
  readonly firstStep: TargetFlightPoint;
}

export interface TargetingAttempt {
  readonly iteration: number;
  readonly lowerAngle: number;
  readonly upperAngle: number;
  readonly angle: number;
  readonly flight: TargetFlightSample;
  readonly error: number | null;
  readonly nextLower: number;
  readonly nextUpper: number;
}

export interface TargetingResult {
  readonly status: 'hit' | 'budget-exhausted' | 'unbracketed' | 'flight-unfinished';
  readonly attempts: readonly TargetingAttempt[];
  readonly lowerFlight: TargetFlightSample;
  readonly upperFlight: TargetFlightSample;
  readonly endpointHit: TargetFlightSample | null;
}

export const readParameters = (parameters: StudyParameters): IterativeTargetingParameters => {
  const example: IterativeTargetingParameters = {
    targetX: numberParameter(parameters, 'targetX'),
    launchSpeed: numberParameter(parameters, 'launchSpeed'),
    gravity: numberParameter(parameters, 'gravity'),
    drag: numberParameter(parameters, 'drag'),
    timeStep: numberParameter(parameters, 'timeStep'),
    flightSteps: numberParameter(parameters, 'flightSteps'),
    lowerAngle: numberParameter(parameters, 'lowerAngle'),
    upperAngle: numberParameter(parameters, 'upperAngle'),
    tolerance: numberParameter(parameters, 'tolerance'),
    maxIterations: numberParameter(parameters, 'maxIterations'),
    shortBudget: numberParameter(parameters, 'shortBudget'),
    guessSeconds: numberParameter(parameters, 'guessSeconds'),
  };
  if (
    !Object.values(example).every(Number.isFinite) ||
    example.targetX <= 0 ||
    example.launchSpeed <= 0 ||
    example.gravity <= 0 ||
    example.drag < 0 ||
    example.timeStep <= 0 ||
    example.drag * example.timeStep >= 1 ||
    example.lowerAngle < 0 ||
    example.upperAngle > 80 ||
    example.lowerAngle >= example.upperAngle ||
    example.tolerance <= 0 ||
    example.guessSeconds <= 0 ||
    !Number.isInteger(example.flightSteps) ||
    example.flightSteps < 1 ||
    example.flightSteps > 239 ||
    !Number.isInteger(example.maxIterations) ||
    example.maxIterations < 1 ||
    example.maxIterations > 20 ||
    !Number.isInteger(example.shortBudget) ||
    example.shortBudget < 1 ||
    example.shortBudget > 20
  )
    throw new Error(
      'Targeting needs finite positive limits, ordered angles and bounded integer budgets.',
    );
  return example;
};

/** The local flight model updates velocity before position, with linear drag on both axes. */
export function targetFlightStep(
  point: TargetFlightPoint,
  example: IterativeTargetingParameters,
): TargetFlightPoint {
  const vx = point.vx + -example.drag * point.vx * example.timeStep;
  const vy = point.vy + (-example.gravity - example.drag * point.vy) * example.timeStep;
  return {
    seconds: point.seconds + example.timeStep,
    x: point.x + vx * example.timeStep,
    height: point.height + vy * example.timeStep,
    vx,
    vy,
  };
}

/** Interpolate the first ground crossing; an unfinished flight has no invented impact range. */
export function simulateTargetFlightSample(
  angle: number,
  example: IterativeTargetingParameters,
): TargetFlightSample {
  const radians = (angle * Math.PI) / 180;
  const points: TargetFlightPoint[] = [
    {
      seconds: 0,
      x: 0,
      height: 0,
      vx: example.launchSpeed * cosine(radians),
      vy: example.launchSpeed * sine(radians),
    },
  ];
  const firstStep = targetFlightStep(points[0], example);
  for (let step = 0; step < example.flightSteps; step++) {
    const before = points[points.length - 1];
    const after = step === 0 ? firstStep : targetFlightStep(before, example);
    if (after.height <= 0) {
      const fraction = before.height / (before.height - after.height);
      const impact = {
        seconds: before.seconds + fraction * example.timeStep,
        x: before.x + fraction * (after.x - before.x),
        height: 0,
        vx: before.vx + fraction * (after.vx - before.vx),
        vy: before.vy + fraction * (after.vy - before.vy),
      };
      points.push(impact);
      return { angle, points, range: impact.x, firstStep };
    }
    points.push(after);
  }
  return { angle, points, range: null, firstStep };
}

/** Preserve the state-only flight result for existing callers. */
export function simulateTargetFlight(
  angle: number,
  example: IterativeTargetingParameters,
): TargetFlight {
  const { firstStep: _firstStep, ...flight } = simulateTargetFlightSample(angle, example);
  return flight;
}

/** Two endpoint probes establish the bracket; the budget then counts midpoint flight guesses. */
export function searchTarget(
  example: IterativeTargetingParameters,
  budget = example.maxIterations,
): TargetingResult {
  const lowerFlight = simulateTargetFlightSample(example.lowerAngle, example);
  const upperFlight = simulateTargetFlightSample(example.upperAngle, example);
  const base = { lowerFlight, upperFlight, endpointHit: null };
  if (lowerFlight.range === null || upperFlight.range === null)
    return { ...base, status: 'flight-unfinished', attempts: [] };
  let lower = example.lowerAngle;
  let upper = example.upperAngle;
  let lowerError = lowerFlight.range - example.targetX;
  const upperError = upperFlight.range - example.targetX;
  const attempts: TargetingAttempt[] = [];
  const endpointHit =
    Math.abs(lowerError) <= example.tolerance
      ? lowerFlight
      : Math.abs(upperError) <= example.tolerance
        ? upperFlight
        : null;
  if (endpointHit) return { ...base, endpointHit, status: 'hit', attempts };
  if (lowerError * upperError > 0) return { ...base, status: 'unbracketed', attempts };
  for (let iteration = 1; iteration <= budget; iteration++) {
    const angle = (lower + upper) / 2;
    const flight = simulateTargetFlightSample(angle, example);
    const error = flight.range === null ? null : flight.range - example.targetX;
    const sameSign = error !== null && lowerError * error > 0;
    const nextLower = sameSign ? angle : lower;
    const nextUpper = sameSign ? upper : angle;
    attempts.push({
      iteration,
      lowerAngle: lower,
      upperAngle: upper,
      angle,
      flight,
      error,
      nextLower,
      nextUpper,
    });
    if (error === null) return { ...base, status: 'flight-unfinished', attempts };
    if (Math.abs(error) <= example.tolerance) return { ...base, status: 'hit', attempts };
    lower = nextLower;
    upper = nextUpper;
    if (sameSign) lowerError = error;
  }
  return { ...base, status: 'budget-exhausted', attempts };
}
