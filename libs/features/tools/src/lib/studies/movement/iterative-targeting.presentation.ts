import type { MotionFrame, MotionStudyModel, TimelineModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type IterativeTargetingParameters,
  searchTarget,
  type TargetFlightPoint,
  type TargetingAttempt,
  type TargetingResult,
} from './iterative-targeting.simulation';
import { fixed } from './presentation';

function statusLabel(status: string, t: StudyTranslate): string {
  switch (status) {
    case 'bracket-ready':
      return t('studyAifg.iterative-targeting.model.statuses.bracketReady');
    case 'refining':
      return t('studyAifg.iterative-targeting.model.statuses.refining');
    case 'hit':
      return t('studyAifg.iterative-targeting.model.statuses.hit');
    case 'budget-exhausted':
      return t('studyAifg.iterative-targeting.model.statuses.budgetExhausted');
    case 'unbracketed':
      return t('studyAifg.iterative-targeting.model.statuses.unbracketed');
    case 'flight-unfinished':
      return t('studyAifg.iterative-targeting.model.statuses.flightUnfinished');
    default:
      throw new Error('The targeting status needs a presentation label.');
  }
}

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

function bracketDiagnosticLines(
  t: StudyTranslate,
  result: TargetingResult,
  example: IterativeTargetingParameters,
): NonNullable<MotionFrame['worked']>['lines'] {
  return [
    t('studyAifg.iterative-targeting.model.frame.worked.steps.endpointRangesTarget', {
      lowerRange:
        result.lowerFlight.range === null
          ? t('studyAifg.iterative-targeting.model.frame.worked.steps.unfinished')
          : fixed(result.lowerFlight.range),
      upperRange:
        result.upperFlight.range === null
          ? t('studyAifg.iterative-targeting.model.frame.worked.steps.unfinished')
          : fixed(result.upperFlight.range),
      targetX: fixed(example.targetX),
    }),
    result.endpointHit
      ? t('studyAifg.iterative-targeting.model.frame.worked.steps.endpointAlreadyWithinGround')
      : t('studyAifg.iterative-targeting.model.frame.worked.steps.midpointGuessesCountedOnly'),
  ];
}

function frameWorkedStep(
  t: StudyTranslate,
  attempt: TargetingAttempt,
  result: TargetingResult,
  example: IterativeTargetingParameters,
  errorText: string,
): MotionFrame['worked'] {
  const diagnostic = attempt.iteration === 0;
  const start = attempt.flight.points[0];
  const next = attempt.flight.firstStep;

  return {
    title: diagnostic
      ? t('studyAifg.iterative-targeting.model.frame.worked.titles.bracketDiagnostic')
      : t('studyAifg.iterative-targeting.model.frame.worked.titles.aimAttempt', {
          attemptIteration: attempt.iteration,
        }),
    lines: diagnostic
      ? bracketDiagnosticLines(t, result, example)
      : [
          t('studyAifg.iterative-targeting.model.frame.worked.steps.bisectCurrentAngles', {
            attemptLowerAngle: fixed(attempt.lowerAngle),
            attemptUpperAngle: fixed(attempt.upperAngle),
            attemptAngle: fixed(attempt.angle),
          }),
          t('studyAifg.iterative-targeting.model.frame.worked.steps.launchVelocityCosSin', {
            launchSpeed: fixed(example.launchSpeed),
            attemptAngle: fixed(attempt.angle),
            startVx: fixed(start.vx),
            startVy: fixed(start.vy),
          }),
          t('studyAifg.iterative-targeting.model.frame.worked.steps.firstStepVxVy', {
            startVx: fixed(start.vx),
            drag: fixed(example.drag),
            timeStep: fixed(example.timeStep),
            nextVx: fixed(next.vx),
            startVy: fixed(start.vy),
            gravity: fixed(example.gravity),
            nextVy: fixed(next.vy),
          }),
          t('studyAifg.iterative-targeting.model.frame.worked.steps.xHeightRepeatUntil', {
            nextVx: fixed(next.vx),
            timeStep: fixed(example.timeStep),
            next: fixed(next.x),
            nextVy: fixed(next.vy),
            nextHeight: fixed(next.height),
          }),
          attempt.error === null
            ? t('studyAifg.iterative-targeting.model.frame.worked.steps.noImpactWithinFlight')
            : t(
                'studyAifg.iterative-targeting.model.frame.worked.steps.interpolatedImpactTargetMiss',
                {
                  attemptFlightRange: fixed(attempt.flight.range ?? 0),
                  targetX: fixed(example.targetX),
                  errorText: errorText,
                  absAttemptError: fixed(Math.abs(attempt.error)),
                  toleranceComparison:
                    Math.abs(attempt.error) <= example.tolerance
                      ? t('studyAifg.iterative-targeting.model.frame.worked.steps.withinTolerance')
                      : t(
                          'studyAifg.iterative-targeting.model.frame.worked.steps.outsideTolerance',
                        ),
                  tolerance: fixed(example.tolerance),
                },
              ),
          t('studyAifg.iterative-targeting.model.frame.worked.steps.nextBracketIfAnother', {
            attemptNextLower: fixed(attempt.nextLower),
            attemptNextUpper: fixed(attempt.nextUpper),
          }),
        ],
    note: t('studyAifg.iterative-targeting.model.frame.worked.note'),
  };
}

function frameValues(
  example: IterativeTargetingParameters,
  attempt: TargetingAttempt,
  t: StudyTranslate,
  errorText: string,
  endpoint: TargetFlightPoint,
  status: string,
): MotionFrame['values'] {
  return {
    ...Object.fromEntries(Object.entries(example).map(([key, value]) => [key, String(value)])),
    iteration: String(attempt.iteration),
    angle: fixed(attempt.angle),
    bracketLower: fixed(attempt.lowerAngle),
    bracketUpper: fixed(attempt.upperAngle),
    nextLower: fixed(attempt.nextLower),
    nextUpper: fixed(attempt.nextUpper),
    impactX:
      attempt.flight.range === null
        ? t('studyAifg.iterative-targeting.model.frame.values.impactX')
        : fixed(attempt.flight.range),
    error: errorText,
    absError:
      attempt.error === null
        ? t('studyAifg.iterative-targeting.model.frame.values.absError')
        : fixed(Math.abs(attempt.error)),
    flightTime: fixed(endpoint.seconds),
    status: statusLabel(status, t),
  };
}

function frameDrawing(
  t: StudyTranslate,
  endpoint: TargetFlightPoint,
  attempt: TargetingAttempt,
  example: IterativeTargetingParameters,
): Pick<MotionFrame, 'bodies' | 'marks' | 'zones' | 'links'> {
  return {
    bodies: [
      {
        id: 'launcher',
        x: 0,
        y: 0,
        label: t('studyAifg.iterative-targeting.model.frame.bodies.labels.harbourLauncher'),
        tone: 'subject',
      },
      {
        id: 'prediction',
        ...pointOf(endpoint),
        label:
          attempt.flight.range === null
            ? t('studyAifg.iterative-targeting.model.frame.bodies.labels.horizon')
            : t('studyAifg.iterative-targeting.model.frame.bodies.labels.impact'),
        tone: 'actual',
      },
    ],
    marks: [
      {
        x: example.targetX,
        y: 0,
        shape: 'cross',
        label:
          Math.abs(endpoint.x - example.targetX) < 0.8
            ? undefined
            : t('studyAifg.iterative-targeting.model.frame.marks.labels.drum'),
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
  };
}

function frameOf(
  attempt: TargetingAttempt,
  result: TargetingResult,
  example: IterativeTargetingParameters,
  t: StudyTranslate,
): MotionFrame {
  const endpoint = attempt.flight.points[attempt.flight.points.length - 1];
  const last = attempt.iteration === result.attempts.length;
  const diagnostic = attempt.iteration === 0;
  const status =
    diagnostic && result.attempts.length > 0
      ? 'bracket-ready'
      : diagnostic || last
        ? result.status
        : 'refining';
  const errorText =
    attempt.error === null
      ? t('studyAifg.iterative-targeting.model.frame.errorText')
      : fixed(attempt.error);
  const note = diagnostic
    ? result.endpointHit
      ? t('studyAifg.iterative-targeting.model.frame.notes.endpointShotAlreadyInside')
      : result.status === 'unbracketed'
        ? t('studyAifg.iterative-targeting.model.frame.notes.bothEndpointShotsMiss')
        : result.status === 'flight-unfinished' && result.attempts.length === 0
          ? t('studyAifg.iterative-targeting.model.frame.notes.endpointFlightHasNot')
          : t('studyAifg.iterative-targeting.model.frame.notes.endpointPredictionsSurroundTarget')
    : status === 'hit'
      ? t('studyAifg.iterative-targeting.model.frame.notes.simulatedImpactInsideTolerance')
      : status === 'budget-exhausted'
        ? t('studyAifg.iterative-targeting.model.frame.notes.candidateStillMissesWhen')
        : status === 'flight-unfinished'
          ? t('studyAifg.iterative-targeting.model.frame.notes.flightHorizonEndsBefore')
          : t('studyAifg.iterative-targeting.model.frame.notes.signedMissChoosesWhich');
  return {
    seconds: attempt.iteration * example.guessSeconds,
    ...frameDrawing(t, endpoint, attempt, example),
    values: frameValues(example, attempt, t, errorText, endpoint, status),
    note,
    worked: frameWorkedStep(t, attempt, result, example, errorText),
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
  t: StudyTranslate,
): TimelineModel => ({
  title,
  xLabel: t('studyAifg.iterative-targeting.model.errorChart.xLabel'),
  yLabel: t('studyAifg.iterative-targeting.model.errorChart.yLabel'),
  seconds,
  reference: 0,
  series: [
    {
      id: 'miss',
      label: t('studyAifg.iterative-targeting.model.errorChart.series.labels.signedImpactError'),
      tone: 'actual',
      values: actual,
    },
    {
      id: 'positive-tolerance',
      label: t('studyAifg.iterative-targeting.model.errorChart.series.labels.positiveTolerance'),
      tone: 'desired',
      values: seconds.map(() => tolerance),
    },
    {
      id: 'negative-tolerance',
      label: t('studyAifg.iterative-targeting.model.errorChart.series.labels.negativeTolerance'),
      tone: 'muted',
      values: seconds.map(() => -tolerance),
    },
  ],
});

function comparisonOf(
  example: IterativeTargetingParameters,
  result: TargetingResult,
  short: TargetingResult,
  seconds: number[],
  t: StudyTranslate,
): MotionStudyModel['comparison'] {
  const complete = result.status !== 'flight-unfinished' && short.status !== 'flight-unfinished';
  const normalErrors = complete ? bestErrors(result, example) : [];
  const shortErrors = complete ? bestErrors(short, example) : [];
  const comparisonErrors = normalErrors.map(
    (_error, index) => shortErrors[Math.min(index, shortErrors.length - 1)],
  );
  const lastNormal = normalErrors[normalErrors.length - 1];
  const lastShort = shortErrors[shortErrors.length - 1];

  return complete
    ? {
        title: t('studyAifg.iterative-targeting.model.comparison.title'),
        intro: t('studyAifg.iterative-targeting.model.comparison.intro', {
          maxIterations: example.maxIterations,
          shortBudget: example.shortBudget,
        }),
        timeline: {
          title: t('studyAifg.iterative-targeting.model.comparison.timeline.title'),
          xLabel: t('studyAifg.iterative-targeting.model.comparison.timeline.xLabel'),
          yLabel: t('studyAifg.iterative-targeting.model.comparison.timeline.yLabel'),
          seconds,
          reference: example.tolerance,
          series: [
            {
              id: 'normal',
              label: t(
                'studyAifg.iterative-targeting.model.comparison.timeline.series.labels.budgetMaxIterations',
                {
                  maxIterations: example.maxIterations,
                },
              ),
              tone: 'actual',
              values: normalErrors,
            },
            {
              id: 'short',
              label: t(
                'studyAifg.iterative-targeting.model.comparison.timeline.series.labels.budgetShortBudget',
                { shortBudget: example.shortBudget },
              ),
              tone: 'desired',
              values: comparisonErrors,
            },
          ],
        },
        findings: [
          t('studyAifg.iterative-targeting.model.comparison.findings.mainRunReportsAfter', {
            resultStatus: statusLabel(result.status, t),
            resultAttempts: result.attempts.length,
            shortStatus: statusLabel(short.status, t),
            shortAttempts: short.attempts.length,
          }),
          t('studyAifg.iterative-targeting.model.comparison.findings.bestMeasuredErrorsAgainst', {
            lastNormal: fixed(lastNormal),
            lastShort: fixed(lastShort),
            tolerance: fixed(example.tolerance),
          }),
        ],
        note: t('studyAifg.iterative-targeting.model.comparison.note'),
      }
    : undefined;
}

function timelineOf(
  result: TargetingResult,
  attempts: TargetingAttempt[],
  t: StudyTranslate,
  seconds: number[],
  example: IterativeTargetingParameters,
): MotionStudyModel['timeline'] {
  return result.status !== 'flight-unfinished' && attempts.every(({ error }) => error !== null)
    ? errorChart(
        t('studyAifg.iterative-targeting.model.timeline'),
        seconds,
        attempts.map(({ error }) => error ?? 0),
        example.tolerance,
        t,
      )
    : null;
}

function motionOf(
  example: IterativeTargetingParameters,
  points: { x: number; y: number }[],
  frames: readonly MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: -1,
      maxX: Math.max(example.targetX, ...points.map(({ x }) => x)) + 2,
      minY: Math.min(0, ...points.map(({ y }) => y)) - 1.5,
      maxY: 1.5,
    },
    frames,
    trail: false,
  };
}

function momentsOf(
  t: StudyTranslate,
  initialStep: number,
  finalStep: number,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.iterative-targeting.model.moments.labels.endpointProbes'), step: 0 },
    {
      label: t('studyAifg.iterative-targeting.model.moments.labels.refineAngle'),
      step: initialStep,
    },
    {
      label: t('studyAifg.iterative-targeting.model.moments.labels.lastDecision'),
      step: finalStep,
    },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    {
      tone: 'subject',
      label: t('studyAifg.iterative-targeting.model.legend.labels.harbourLauncher'),
    },
    {
      tone: 'actual',
      label: t('studyAifg.iterative-targeting.model.legend.labels.simulatedFlightImpact'),
    },
    {
      tone: 'target',
      label: t('studyAifg.iterative-targeting.model.legend.labels.drumGroundLevel'),
    },
    { tone: 'desired', label: t('studyAifg.iterative-targeting.model.legend.labels.missRemove') },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'maxIterations',
      label: t('studyAifg.iterative-targeting.model.inputs.labels.midpointGuesses'),
      unit: t('studyAifg.iterative-targeting.model.inputs.units.guesses'),
      min: 1,
      max: 12,
      step: 1,
    },
    {
      name: 'targetX',
      label: t('studyAifg.iterative-targeting.model.inputs.labels.drumDistance'),
      unit: t('studyAifg.iterative-targeting.model.inputs.units.metres'),
      min: 4,
      max: 10,
      step: 0.5,
    },
  ];
}

export function presentStudy(
  example: IterativeTargetingParameters,
  t: StudyTranslate,
): MotionStudyModel {
  const result = searchTarget(example);
  const attempts = shownAttempts(result, example);
  const frames = attempts.map((attempt, index) => ({
    ...frameOf(attempt, result, example, t),
    seconds: index * example.guessSeconds,
  }));
  const points = attempts.flatMap(({ flight }) => flight.points.map(pointOf));
  const seconds = frames.map(({ seconds }) => seconds);
  const short = searchTarget(example, example.shortBudget);
  const finalStep = frames.length - 1;
  const initialStep = Math.min(2, finalStep);
  return {
    family: 'motion',
    motion: motionOf(example, points, frames),
    timeline: timelineOf(result, attempts, t, seconds, example),
    initialStep,
    moments: momentsOf(t, initialStep, finalStep),
    legend: legendOf(t),
    caption: t('studyAifg.iterative-targeting.model.caption'),
    comparison: comparisonOf(example, result, short, seconds, t),
    inputs: inputsOf(t),
  };
}
