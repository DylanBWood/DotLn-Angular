import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { numberParameter } from '../parameters';
import type { MotionFrame, MotionStudyModel, TimelineModel } from '../study-model';

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

export interface TargetingAttempt {
  readonly iteration: number;
  readonly lowerAngle: number;
  readonly upperAngle: number;
  readonly angle: number;
  readonly flight: TargetFlight;
  readonly error: number | null;
  readonly nextLower: number;
  readonly nextUpper: number;
}

export interface TargetingResult {
  readonly status: 'hit' | 'budget-exhausted' | 'unbracketed' | 'flight-unfinished';
  readonly attempts: readonly TargetingAttempt[];
  readonly lowerFlight: TargetFlight;
  readonly upperFlight: TargetFlight;
  readonly endpointHit: TargetFlight | null;
}

const readParameters = (parameters: StudyParameters): IterativeTargetingParameters => {
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
export function simulateTargetFlight(
  angle: number,
  example: IterativeTargetingParameters,
): TargetFlight {
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
  for (let step = 0; step < example.flightSteps; step++) {
    const before = points[points.length - 1];
    const after = targetFlightStep(before, example);
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
      return { angle, points, range: impact.x };
    }
    points.push(after);
  }
  return { angle, points, range: null };
}

/** Two endpoint probes establish the bracket; the budget then counts midpoint flight guesses. */
export function searchTarget(
  example: IterativeTargetingParameters,
  budget = example.maxIterations,
): TargetingResult {
  const lowerFlight = simulateTargetFlight(example.lowerAngle, example);
  const upperFlight = simulateTargetFlight(example.upperAngle, example);
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
    const flight = simulateTargetFlight(angle, example);
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

const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
const pointOf = (point: TargetFlightPoint) => ({ x: point.x, y: -point.height });

function shownAttempts(result: TargetingResult, example: IterativeTargetingParameters) {
  // The first frame is the endpoint-bracket diagnostic, outside the midpoint budget.
  const flight = result.endpointHit ?? result.upperFlight;
  const diagnostic: TargetingAttempt = {
    iteration: 0,
    lowerAngle: example.lowerAngle,
    upperAngle: example.upperAngle,
    angle: flight.angle,
    flight,
    error: flight.range === null ? null : flight.range - example.targetX,
    nextLower: example.lowerAngle,
    nextUpper: example.upperAngle,
  };
  // A terminal endpoint decision holds for one playback interval without another prediction.
  return result.attempts.length > 0 ? [diagnostic, ...result.attempts] : [diagnostic, diagnostic];
}

function frameOf(
  attempt: TargetingAttempt,
  result: TargetingResult,
  example: IterativeTargetingParameters,
): MotionFrame {
  const endpoint = attempt.flight.points[attempt.flight.points.length - 1];
  const start = attempt.flight.points[0];
  const next = targetFlightStep(start, example);
  const last = attempt.iteration === result.attempts.length;
  const diagnostic = attempt.iteration === 0;
  const status =
    diagnostic && result.attempts.length > 0
      ? 'bracket-ready'
      : diagnostic || last
        ? result.status
        : 'refining';
  const errorText = attempt.error === null ? 'unknown' : fixed(attempt.error);
  const note = diagnostic
    ? result.endpointHit
      ? 'An endpoint shot is already inside tolerance, so it is accepted without a midpoint guess.'
      : result.status === 'unbracketed'
        ? 'Both endpoint shots miss on the same side, so midpoint refinement is refused.'
        : result.status === 'flight-unfinished' && result.attempts.length === 0
          ? 'An endpoint flight has not reached the ground, so the search has no reliable bracket.'
          : 'Endpoint predictions surround the target, so midpoint refinement can begin.'
    : status === 'hit'
      ? 'The simulated impact is inside tolerance, so this candidate is accepted.'
      : status === 'budget-exhausted'
        ? 'The candidate still misses when the iteration budget ends, so the search reports failure.'
        : status === 'flight-unfinished'
          ? 'The flight horizon ends before impact, so this candidate has no measurable ground miss.'
          : 'The signed miss chooses which half of the angle bracket remains.';
  return {
    seconds: attempt.iteration * example.guessSeconds,
    bodies: [
      { id: 'launcher', x: 0, y: 0, label: 'Harbour launcher', tone: 'subject' },
      {
        id: 'prediction',
        ...pointOf(endpoint),
        label: attempt.flight.range === null ? 'Horizon' : 'Impact',
        tone: 'actual',
      },
    ],
    marks: [
      {
        x: example.targetX,
        y: 0,
        shape: 'cross',
        label: Math.abs(endpoint.x - example.targetX) < 0.8 ? undefined : 'Drum',
        tone: 'target',
      },
    ],
    zones: [{ x: example.targetX, y: 0, radius: example.tolerance, tone: 'zone' }],
    links: [
      ...attempt.flight.points.slice(1).map((point, index) => ({
        from: pointOf(attempt.flight.points[index]),
        to: pointOf(point),
        tone: 'actual' as const,
      })),
      { from: pointOf(endpoint), to: { x: example.targetX, y: 0 }, tone: 'desired' },
    ],
    values: {
      ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
      iteration: String(attempt.iteration),
      angle: fixed(attempt.angle),
      bracketLower: fixed(attempt.lowerAngle),
      bracketUpper: fixed(attempt.upperAngle),
      nextLower: fixed(attempt.nextLower),
      nextUpper: fixed(attempt.nextUpper),
      impactX: attempt.flight.range === null ? 'unknown' : fixed(attempt.flight.range),
      error: errorText,
      absError: attempt.error === null ? 'unknown' : fixed(Math.abs(attempt.error)),
      flightTime: fixed(endpoint.seconds),
      status,
    },
    note,
    worked: {
      title: diagnostic ? 'Bracket diagnostic' : `Aim attempt ${attempt.iteration}`,
      lines: diagnostic
        ? [
            `Endpoint ranges: ${result.lowerFlight.range === null ? 'unfinished' : fixed(result.lowerFlight.range)} m and ${result.upperFlight.range === null ? 'unfinished' : fixed(result.upperFlight.range)} m; target ${fixed(example.targetX)} m.`,
            result.endpointHit
              ? 'This endpoint is already within the ground-miss tolerance; no midpoint guess is needed.'
              : 'Midpoint guesses are counted only after both flights finish and their signed misses bracket zero.',
          ]
        : [
            `Bisect the current angles: (${fixed(attempt.lowerAngle)} + ${fixed(attempt.upperAngle)}) / 2 = ${fixed(attempt.angle)}°.`,
            `Launch velocity: ${fixed(example.launchSpeed)} × (cos ${fixed(attempt.angle)}°, sin ${fixed(attempt.angle)}°) ≈ (${fixed(start.vx)}, ${fixed(start.vy)}) m/s.`,
            `First step: vx = ${fixed(start.vx)} × (1 − ${fixed(example.drag)} × ${fixed(example.timeStep)}) ≈ ${fixed(next.vx)} m/s; vy = ${fixed(start.vy)} + (−${fixed(example.gravity)} − ${fixed(example.drag)} × ${fixed(start.vy)}) × ${fixed(example.timeStep)} ≈ ${fixed(next.vy)} m/s.`,
            `Then x = ${fixed(next.vx)} × ${fixed(example.timeStep)} ≈ ${fixed(next.x)} m; height = ${fixed(next.vy)} × ${fixed(example.timeStep)} ≈ ${fixed(next.height)} m; repeat until the ground crossing.`,
            attempt.error === null
              ? 'No impact within the flight horizon: do not substitute the last position for a range.'
              : `Interpolated impact ${fixed(attempt.flight.range ?? 0)} − target ${fixed(example.targetX)} = ${errorText} m; |miss| ${fixed(Math.abs(attempt.error))} ${Math.abs(attempt.error) <= example.tolerance ? '≤' : '>'} tolerance ${fixed(example.tolerance)} m.`,
            `The next bracket is [${fixed(attempt.nextLower)}, ${fixed(attempt.nextUpper)}]° if another guess is needed.`,
          ],
      note: 'This is a study-local flight and bisection search; the scene engine supplies deterministic sine and cosine only.',
    },
  };
}

function bestErrors(result: TargetingResult, example: IterativeTargetingParameters) {
  let best = Math.min(
    Math.abs((result.lowerFlight.range ?? Number.POSITIVE_INFINITY) - example.targetX),
    Math.abs((result.upperFlight.range ?? Number.POSITIVE_INFINITY) - example.targetX),
  );
  return shownAttempts(result, example).map(({ error }) => {
    if (error !== null) best = Math.min(best, Math.abs(error));
    return best;
  });
}

const errorChart = (
  title: string,
  seconds: readonly number[],
  actual: readonly number[],
  tolerance: number,
): TimelineModel => ({
  title,
  xLabel: 'Search playback · seconds',
  yLabel: 'Ground miss · metres',
  seconds,
  reference: 0,
  series: [
    { id: 'miss', label: 'Signed impact error', tone: 'actual', values: actual },
    {
      id: 'positive-tolerance',
      label: 'Positive tolerance',
      tone: 'desired',
      values: seconds.map(() => tolerance),
    },
    {
      id: 'negative-tolerance',
      label: 'Negative tolerance',
      tone: 'muted',
      values: seconds.map(() => -tolerance),
    },
  ],
});

export const model = (parameters: StudyParameters): MotionStudyModel => {
  const example = readParameters(parameters);
  const result = searchTarget(example);
  const attempts = shownAttempts(result, example);
  const frames = attempts.map((attempt, index) => ({
    ...frameOf(attempt, result, example),
    seconds: index * example.guessSeconds,
  }));
  const points = attempts.flatMap(({ flight }) => flight.points.map(pointOf));
  const seconds = frames.map(({ seconds }) => seconds);
  const short = searchTarget(example, example.shortBudget);
  const complete = result.status !== 'flight-unfinished' && short.status !== 'flight-unfinished';
  const normalErrors = complete ? bestErrors(result, example) : [];
  const shortErrors = complete ? bestErrors(short, example) : [];
  const comparisonErrors = normalErrors.map(
    (_error, index) => shortErrors[Math.min(index, shortErrors.length - 1)],
  );
  const lastNormal = normalErrors[normalErrors.length - 1];
  const lastShort = shortErrors[shortErrors.length - 1];
  const finalStep = frames.length - 1;
  const initialStep = Math.min(2, finalStep);
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: -1,
        maxX: Math.max(example.targetX, ...points.map(({ x }) => x)) + 2,
        minY: Math.min(0, ...points.map(({ y }) => y)) - 1.5,
        maxY: 1.5,
      },
      frames,
      trail: false,
    },
    timeline:
      result.status !== 'flight-unfinished' && attempts.every(({ error }) => error !== null)
        ? errorChart(
            'Simulate, measure, refine',
            seconds,
            attempts.map(({ error }) => error ?? 0),
            example.tolerance,
          )
        : null,
    initialStep,
    moments: [
      { label: 'Endpoint probes', step: 0 },
      { label: 'Refine the angle', step: initialStep },
      { label: 'Last decision', step: finalStep },
    ],
    legend: [
      { tone: 'subject', label: 'Harbour launcher' },
      { tone: 'actual', label: 'Simulated flight and impact' },
      { tone: 'target', label: 'Drum at ground level' },
      { tone: 'desired', label: 'Miss to remove' },
    ],
    caption:
      'The opening frame checks the endpoint bracket; subsequent frames show midpoint aim attempts, or hold a terminal endpoint decision. No projectile is travelling in real time. Joined points show that attempt’s fixed-step predicted flight; the connecting line measures its miss. Search playback spacing does not measure computation time.',
    comparison: complete
      ? {
          title: 'The search can run out of guesses',
          intro: `Change only the midpoint budget from ${example.maxIterations} to ${example.shortBudget}; launch speed, drag, target, bracket and flight step stay the same. Both runs also make two endpoint probes.`,
          timeline: {
            title: 'Best completed ground miss so far',
            xLabel: 'Search playback · seconds',
            yLabel: 'Absolute miss · metres',
            seconds,
            reference: example.tolerance,
            series: [
              {
                id: 'normal',
                label: `Budget ${example.maxIterations}`,
                tone: 'actual',
                values: normalErrors,
              },
              {
                id: 'short',
                label: `Budget ${example.shortBudget}`,
                tone: 'desired',
                values: comparisonErrors,
              },
            ],
          },
          findings: [
            `The main run reports ${result.status} after ${result.attempts.length} midpoint guesses; the changed run reports ${short.status} after ${short.attempts.length}.`,
            `Best measured errors are ${fixed(lastNormal)} m and ${fixed(lastShort)} m against tolerance ${fixed(example.tolerance)} m.`,
          ],
          note: 'A trace holds its last measured error after its search stops. A same-side endpoint pair rejects the bracket without proving the target unreachable at every angle.',
        }
      : undefined,
    inputs: [
      {
        name: 'maxIterations',
        label: 'Midpoint guesses',
        unit: 'guesses',
        min: 1,
        max: 12,
        step: 1,
      },
      { name: 'targetX', label: 'Drum distance', unit: 'm', min: 4, max: 10, step: 0.5 },
    ],
  };
};
