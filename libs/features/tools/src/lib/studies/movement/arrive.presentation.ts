import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  arriveFrames,
  type ArriveParameters,
  type ArriveSample,
  type ArriveState,
} from './arrive.simulation';

function describeComparison(
  example: ArriveParameters,
  normal: readonly ArriveState[],
): ArrivalComparison {
  const late =
    example.slowRadius === example.lateRadius ? normal : arriveFrames(example, example.lateRadius);
  const seconds = normal.map((_frame, step) => Number(fixed(step * example.timeStep, 1)));
  const normalPeak = peakOf(normal, example);
  const latePeak = peakOf(late, example);
  // Keep the chart on arrival, widening it only for runs that need more room.
  const highest = Math.max(normalPeak.reached, latePeak.reached);
  const top = Math.max(110, Math.ceil((highest + 5) / 10) * 10);
  const lastPeak = Math.max(
    ...[normalPeak, latePeak]
      .filter(({ overshoot }) => overshoot > 0.005)
      .map(({ step }) => seconds[step]),
    0,
  );
  const end = Math.max(16, Math.min(seconds[seconds.length - 1], Math.ceil(lastPeak / 4 + 1) * 4));
  return {
    example,
    current: { states: normal, peak: normalPeak },
    late: { states: late, peak: latePeak },
    seconds,
    end,
    top,
  };
}

interface ArriveFrameDescription {
  readonly example: ArriveParameters;
  readonly sample: ArriveSample;
  readonly step: number;
}
interface ArrivalPeak {
  readonly step: number;
  readonly reached: number;
  readonly overshoot: number;
}
interface ArrivalTrace {
  readonly states: readonly ArriveState[];
  readonly peak: ArrivalPeak;
}
interface ArrivalComparison {
  readonly example: ArriveParameters;
  readonly current: ArrivalTrace;
  readonly late: ArrivalTrace;
  readonly seconds: readonly number[];
  readonly end: number;
  readonly top: number;
}

const { number: fixed } = createNumberFormat();
const brief = (value: number): string => fixed(value, 1);

// How long an arrow is for each unit per second, in the drawing's units.
const vectorScale = 1;

// The two arrows sit either side of the line the character moves on.
const actualLane = -8;

const desiredLane = 9;

function phaseOf(t: StudyTranslate, frame: ArriveFrameDescription): string {
  const {
    example,
    step,
    sample: { state },
  } = frame;

  const distance = Math.abs(example.target - state.position);
  if (distance === 0 && state.velocity === 0)
    return t('studyAifg.arrive.model.phase.closeEnoughAlmostMotionless');
  if (step === 0) return t('studyAifg.arrive.model.phase.startDesiredSpeedHigh');
  if (state.position > example.target)
    return t('studyAifg.arrive.model.phase.characterPassedTargetDesired');
  return distance < example.slowRadius
    ? t('studyAifg.arrive.model.phase.insideSlowingZoneDesired')
    : t('studyAifg.arrive.model.phase.outsideSlowingZoneCharacter');
}

function workedLines(t: StudyTranslate, frame: ArriveFrameDescription): readonly string[] {
  const {
    example,
    sample: { state, calculation },
  } = frame;
  const position = fixed(state.position);
  const velocity = fixed(state.velocity);
  const distance = fixed(calculation.distance);
  const desired = fixed(calculation.desired);
  const acceleration = fixed(calculation.acceleration);
  const inside = calculation.distance < example.slowRadius;
  const next = calculation.next;

  return [
    t('studyAifg.arrive.model.worked.beginPositionVelocityTarget', {
      position,
      velocity,
      exampleTarget: fixed(example.target),
    }),
    t('studyAifg.arrive.model.worked.findRemainingDistance', {
      exampleTarget: fixed(example.target),
      position,
      distance,
    }),
    inside
      ? t('studyAifg.arrive.model.worked.insideSlowingRadiusScale', {
          exampleTarget: fixed(example.target),
          position,
          exampleMaxSpeed: fixed(example.maxSpeed),
          distance,
          exampleSlowRadius: fixed(example.slowRadius),
          desired,
        })
      : t('studyAifg.arrive.model.worked.outsideSlowingRadiusAsk', {
          exampleSlowRadius: fixed(example.slowRadius),
          desired,
        }),
    t('studyAifg.arrive.model.worked.askCloseVelocityGap', {
      exampleResponseTime: fixed(example.responseTime),
      desired,
      velocity,
      calculationRequestedAcceleration: fixed(calculation.requestedAcceleration),
    }),
    t('studyAifg.arrive.model.worked.limitAccelerationMagnitudeAcceleration', {
      exampleMaxAcceleration: fixed(example.maxAcceleration),
      acceleration,
    }),
    t('studyAifg.arrive.model.worked.updateVelocityOverLimited', {
      exampleTimeStep: fixed(example.timeStep),
      exampleMaxSpeed: fixed(example.maxSpeed),
      velocity,
      acceleration,
      nextVelocity: fixed(next.velocity),
    }),
    t('studyAifg.arrive.model.worked.useUpdatedVelocityMove', {
      position,
      nextVelocity: fixed(next.velocity),
      exampleTimeStep: fixed(example.timeStep),
      nextPosition: fixed(next.position),
    }),
  ];
}

function workedStep(t: StudyTranslate, frame: ArriveFrameDescription): StudyWorkedStep {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const seconds = step * example.timeStep;

  const velocity = fixed(state.velocity);

  const distance = fixed(calculation.distance);
  if (calculation.settled)
    return {
      title: t('studyAifg.arrive.model.worked.restSeconds', {
        seconds: fixed(seconds),
      }),
      lines: [],
      note: t('studyAifg.arrive.model.worked.distanceWithinToleranceSpeed', {
        distance,
        exampleTolerance: fixed(example.tolerance),
        velocity,
      }),
    };
  const heading =
    state.velocity * (example.target - state.position) >= 0
      ? t('studyAifg.arrive.model.worked.toward')
      : t('studyAifg.arrive.model.worked.away');
  const sign =
    calculation.acceleration < 0
      ? t('studyAifg.arrive.model.worked.negative')
      : t('studyAifg.arrive.model.worked.positive');
  const motion =
    Math.abs(calculation.acceleration) < 0.005
      ? t('studyAifg.arrive.model.worked.accelerationRoundsZeroPrecision')
      : calculation.acceleration * state.velocity < 0
        ? t('studyAifg.arrive.model.worked.accelerationBrakesCharacterMoving', {
            sign,
            heading,
          })
        : t('studyAifg.arrive.model.worked.accelerationBuildsSpeedTarget', {
            sign,
            heading,
          });
  return {
    title: t('studyAifg.arrive.model.worked.workedStepSeconds', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(t, frame),
    note: motion,
  };
}

function frameOf(t: StudyTranslate, frame: ArriveFrameDescription): MotionFrame {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const desired = calculation.desired;
  return {
    seconds: step * example.timeStep,
    bodies: [{ id: 'character', x: state.position, y: 0 }],
    vectors: [
      {
        x: state.position,
        y: actualLane,
        dx: state.velocity * vectorScale,
        dy: 0,
        tone: 'actual',
      },
      { x: state.position, y: desiredLane, dx: desired * vectorScale, dy: 0, tone: 'desired' },
    ],
    zones: [{ x: example.target, y: 0, radius: example.slowRadius }],
    marks: [{ x: example.target, y: 0, shape: 'cross' }],
    links: [{ from: { x: -10, y: 0 }, to: { x: example.target + 40, y: 0 } }],
    values: {
      distance: brief(Math.abs(example.target - state.position)),
      speed: brief(Math.abs(state.velocity)),
      desired: brief(Math.abs(desired)),
      slowRadius: String(example.slowRadius),
      maxAcceleration: String(example.maxAcceleration),
    },
    note: phaseOf(t, frame),
    worked: workedStep(t, frame),
  };
}

/** What one run does at its peak, in the words the comparison reads. */
function peakOf(frames: readonly ArriveState[], example: ArriveParameters): ArrivalPeak {
  const step = frames.reduce(
    (best, frame, index) => (frame.position > frames[best].position ? index : best),
    0,
  );
  const reached = frames[step].position;
  return { step, reached, overshoot: reached - example.target };
}

/** The motion rule and limits stay the example's; only the slowing radius changes. */
function lateBrakingTimeline(t: StudyTranslate, comparison: ArrivalComparison): TimelineModel {
  const { example, seconds, end, top, current, late: other } = comparison;
  const { states: normal, peak: normalPeak } = current;
  const { states: late, peak: latePeak } = other;

  return {
    title: t('studyAifg.arrive.model.comparison.position'),
    xLabel: t('studyAifg.arrive.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.arrive.model.timeline.positionUnits'),
    seconds,
    xRange: [4, end],
    yRange: [50, top],
    xTicks: [4, 4 + (end - 4) / 3, 4 + ((end - 4) * 2) / 3, end].map(Math.round),
    yTicks: [top, 100, 75, 50],
    reference: example.target,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.arrive.model.comparison.solidGreenSlowingRadius', {
          exampleSlowRadius: example.slowRadius,
        }),
        tone: 'actual',
        values: normal.map(({ position }) => position),
      },
      {
        id: 'late',
        label: t('studyAifg.arrive.model.comparison.dashedAmberSlowingRadius', {
          exampleLateRadius: example.lateRadius,
        }),
        tone: 'desired',
        values: late.map(({ position }) => position),
      },
    ],
    marks: [
      { x: seconds[normalPeak.step], y: normalPeak.reached, tone: 'actual' },
      { x: seconds[latePeak.step], y: latePeak.reached, tone: 'desired' },
    ],
  };
}

function lateBraking(
  t: StudyTranslate,
  example: ArriveParameters,
  normal: readonly ArriveState[],
): StudyComparison {
  const comparison = describeComparison(example, normal);
  const {
    seconds,
    end,
    top,
    current: { peak: normalPeak },
    late: { peak: latePeak },
  } = comparison;
  const overshootOf = ({ step, reached, overshoot }: ArrivalPeak) =>
    overshoot > 0.005
      ? t('studyAifg.arrive.model.comparison.reachesPositionAboutOvershooting', {
          position: fixed(reached),
          seconds: fixed(seconds[step], 1),
          overshoot: fixed(overshoot),
        })
      : t('studyAifg.arrive.model.comparison.approachesTargetWithoutPassing');
  const same = example.slowRadius === example.lateRadius;
  return {
    title: t('studyAifg.arrive.model.comparison.whatHappensWhenSlowing'),
    intro: t('studyAifg.arrive.model.comparison.twoRunsExampleChange', {
      exampleSlowRadius: example.slowRadius,
      exampleLateRadius: example.lateRadius,
      exampleTarget: example.target,
      exampleMaxSpeed: example.maxSpeed,
      exampleMaxAcceleration: example.maxAcceleration,
      exampleResponseTime: example.responseTime,
      exampleTimeStep: example.timeStep,
    }),
    timeline: lateBrakingTimeline(t, comparison),
    findings: same
      ? [
          t('studyAifg.arrive.model.comparison.runsNowUseRadius', {
            exampleLateRadius: example.lateRadius,
            overshoot: overshootOf(latePeak),
          }),
        ]
      : [
          t('studyAifg.arrive.model.comparison.radiusCharacterRun', {
            exampleLateRadius: example.lateRadius,
            lateOvershoot: overshootOf(latePeak),
            exampleSlowRadius: example.slowRadius,
            normalOvershoot: overshootOf(normalPeak),
          }),
          t('studyAifg.arrive.model.comparison.smallerZoneAsksLess', {
            exampleMaxAcceleration: example.maxAcceleration,
          }),
        ],
    note: t('studyAifg.arrive.model.comparison.chartZoomsArrivalSeconds', {
      end,
      top,
    }),
  };
}

function runTimeline(
  t: StudyTranslate,
  example: ArriveParameters,
  samples: readonly ArriveSample[],
): TimelineModel {
  const seconds = samples.map((_sample, step) => Number(fixed(step * example.timeStep, 1)));
  const velocities = samples.map(({ state }) => state.velocity);
  const desired = samples.map(({ calculation }) => calculation.desired);
  // A run that overshoots comes back with a negative velocity, which the chart must still show.
  const lowest = Math.floor(Math.min(0, ...velocities, ...desired));

  return {
    title: t('studyAifg.arrive.model.timeline.velocity'),
    xLabel: t('studyAifg.arrive.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.arrive.model.timeline.velocityUnits'),
    seconds,
    yRange: [lowest, example.maxSpeed],
    xTicks: [0, example.steps * example.timeStep],
    yTicks: lowest < 0 ? [example.maxSpeed, 0, lowest] : [example.maxSpeed, 0],
    series: [
      {
        id: 'actual',
        label: t('studyAifg.arrive.model.labels.solidGreenActualVelocity'),
        tone: 'actual',
        values: velocities,
      },
      {
        id: 'desired',
        label: t('studyAifg.arrive.model.labels.dashedAmberDesiredVelocity'),
        tone: 'desired',
        values: desired,
      },
    ],
  };
}

export const present = (
  example: ArriveParameters,
  statesSamples: readonly ArriveSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  // The drawing's box holds the slowing circle and the furthest the run goes, at any input.
  const furthest = Math.max(...states.map(({ position }) => position));
  const reach = Math.max(example.slowRadius, 36) + 4;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: -10,
        maxX: Math.max(150, example.target + reach + 10, furthest + 20),
        minY: -reach,
        maxY: reach,
      },
      frames: statesSamples.map((sample, step) => frameOf(t, { example, sample, step })),
      trail: true,
    },
    timeline: runTimeline(t, example, statesSamples),
    initialStep: 75,
    moments: [
      { label: t('studyAifg.arrive.model.labels.start'), step: 0 },
      { label: t('studyAifg.arrive.model.labels.cruise'), step: 40 },
      { label: t('studyAifg.arrive.model.labels.slowDown'), step: 75 },
      { label: t('studyAifg.arrive.model.labels.rest'), step: example.steps },
    ],
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.arrive.model.labels.solidGreenActualVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.arrive.model.labels.dashedAmberDesiredVelocity'),
      },
    ],
    caption: t('studyAifg.arrive.model.overview.caption'),
    comparison: lateBraking(t, example, states),
    inputs: [
      {
        name: 'slowRadius',
        label: t('studyAifg.arrive.model.labels.slowingRadius'),
        unit: t('studyAifg.arrive.model.inputs.unitUnits'),
        min: 4,
        max: 60,
        step: 2,
      },
      {
        name: 'maxAcceleration',
        label: t('studyAifg.arrive.model.labels.maximumAcceleration'),
        unit: t('studyAifg.arrive.model.inputs.unitUnitsS'),
        min: 4,
        max: 24,
        step: 1,
      },
    ],
  };
};
