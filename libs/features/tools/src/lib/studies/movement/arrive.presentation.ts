import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  arriveFrames,
  type ArriveParameters,
  type ArriveSample,
  type ArriveState,
  calculateArriveStep,
} from './arrive.simulation';
import { brief, decimal as fixed } from './presentation';

// How long an arrow is for each unit per second, in the drawing's units.
const vectorScale = 1;

// The two arrows sit either side of the line the character moves on.
const actualLane = -8;

const desiredLane = 9;

function phaseOf(t: StudyTranslate, state: ArriveState, step: number, example: ArriveParameters) {
  const distance = Math.abs(example.target - state.position);
  if (distance === 0 && state.velocity === 0)
    return t('studyAifg.arrive.model.phaseCloseEnoughAlmostMotionless');
  if (step === 0) return t('studyAifg.arrive.model.phaseStartDesiredSpeedHigh');
  if (state.position > example.target)
    return t('studyAifg.arrive.model.phaseCharacterPassedTargetDesired');
  return distance < example.slowRadius
    ? t('studyAifg.arrive.model.phaseInsideSlowingZoneDesired')
    : t('studyAifg.arrive.model.phaseOutsideSlowingZoneCharacter');
}

function workedLines(
  t: StudyTranslate,
  position: string,
  velocity: string,
  example: ArriveParameters,
  distance: string,
  inside: boolean,
  desired: string,
  calculation: ReturnType<typeof calculateArriveStep>,
  acceleration: string,
  next: ArriveState,
): readonly string[] {
  return [
    t('studyAifg.arrive.model.workedBeginPositionVelocityTarget', {
      position,
      velocity,
      exampleTarget: fixed(example.target),
    }),
    t('studyAifg.arrive.model.workedFindRemainingDistance', {
      exampleTarget: fixed(example.target),
      position,
      distance,
    }),
    inside
      ? t('studyAifg.arrive.model.workedInsideSlowingRadiusScale', {
          exampleTarget: fixed(example.target),
          position,
          exampleMaxSpeed: fixed(example.maxSpeed),
          distance,
          exampleSlowRadius: fixed(example.slowRadius),
          desired,
        })
      : t('studyAifg.arrive.model.workedOutsideSlowingRadiusAsk', {
          exampleSlowRadius: fixed(example.slowRadius),
          desired,
        }),
    t('studyAifg.arrive.model.workedAskCloseVelocityGap', {
      exampleResponseTime: fixed(example.responseTime),
      desired,
      velocity,
      calculationRequestedAcceleration: fixed(calculation.requestedAcceleration),
    }),
    t('studyAifg.arrive.model.workedLimitAccelerationMagnitudeAcceleration', {
      exampleMaxAcceleration: fixed(example.maxAcceleration),
      acceleration,
    }),
    t('studyAifg.arrive.model.workedUpdateVelocityOverLimited', {
      exampleTimeStep: fixed(example.timeStep),
      exampleMaxSpeed: fixed(example.maxSpeed),
      velocity,
      acceleration,
      nextVelocity: fixed(next.velocity),
    }),
    t('studyAifg.arrive.model.workedUseUpdatedVelocityMove', {
      position,
      nextVelocity: fixed(next.velocity),
      exampleTimeStep: fixed(example.timeStep),
      nextPosition: fixed(next.position),
    }),
  ];
}

function workedStep(
  t: StudyTranslate,
  state: ArriveState,
  step: number,
  example: ArriveParameters,
  calculation: ReturnType<typeof calculateArriveStep>,
): StudyWorkedStep {
  const seconds = step * example.timeStep;
  const position = fixed(state.position);
  const velocity = fixed(state.velocity);
  const desired = fixed(calculation.desired);
  const distance = fixed(calculation.distance);
  if (calculation.settled)
    return {
      title: t('studyAifg.arrive.model.workedRestSeconds', {
        seconds: fixed(seconds),
      }),
      lines: [],
      note: t('studyAifg.arrive.model.workedDistanceWithinToleranceSpeed', {
        distance,
        exampleTolerance: fixed(example.tolerance),
        velocity,
      }),
    };
  const next = calculation.next;
  const acceleration = fixed(calculation.acceleration);
  const inside = calculation.distance < example.slowRadius;
  const heading =
    state.velocity * (example.target - state.position) >= 0
      ? t('studyAifg.arrive.model.workedToward')
      : t('studyAifg.arrive.model.workedAway');
  const sign =
    calculation.acceleration < 0
      ? t('studyAifg.arrive.model.workedNegative')
      : t('studyAifg.arrive.model.workedPositive');
  const motion =
    Math.abs(calculation.acceleration) < 0.005
      ? t('studyAifg.arrive.model.workedAccelerationRoundsZeroPrecision')
      : calculation.acceleration * state.velocity < 0
        ? t('studyAifg.arrive.model.workedAccelerationBrakesCharacterMoving', {
            sign,
            heading,
          })
        : t('studyAifg.arrive.model.workedAccelerationBuildsSpeedTarget', {
            sign,
            heading,
          });
  return {
    title: t('studyAifg.arrive.model.workedWorkedStepSeconds', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(
      t,
      position,
      velocity,
      example,
      distance,
      inside,
      desired,
      calculation,
      acceleration,
      next,
    ),
    note: motion,
  };
}

function frameOf(
  t: StudyTranslate,
  state: ArriveState,
  step: number,
  example: ArriveParameters,
  calculation: ReturnType<typeof calculateArriveStep>,
): MotionFrame {
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
    note: phaseOf(t, state, step, example),
    worked: workedStep(t, state, step, example, calculation),
  };
}

/** What one run does at its peak, in the words the comparison reads. */
function peakOf(frames: readonly ArriveState[], example: ArriveParameters) {
  const step = frames.reduce(
    (best, frame, index) => (frame.position > frames[best].position ? index : best),
    0,
  );
  const reached = frames[step].position;
  return { step, reached, overshoot: reached - example.target };
}

/** The motion rule and limits stay the example's; only the slowing radius changes. */
function lateBrakingTimeline(
  t: StudyTranslate,
  seconds: number[],
  end: number,
  top: number,
  example: ArriveParameters,
  normal: ReturnType<typeof arriveFrames>,
  late: ReturnType<typeof arriveFrames>,
  normalPeak: {
    step: number;
    reached: number;
    overshoot: number;
  },
  latePeak: {
    step: number;
    reached: number;
    overshoot: number;
  },
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.arrive.model.lateBrakingPosition'),
    xLabel: t('studyAifg.arrive.model.lateBrakingTimeSeconds'),
    yLabel: t('studyAifg.arrive.model.positionUnits'),
    seconds,
    xRange: [4, end],
    yRange: [50, top],
    xTicks: [4, 4 + (end - 4) / 3, 4 + ((end - 4) * 2) / 3, end].map(Math.round),
    yTicks: [top, 100, 75, 50],
    reference: example.target,
    series: [
      {
        id: 'normal',
        label: t('studyAifg.arrive.model.lateBrakingSolidGreenSlowingRadius', {
          exampleSlowRadius: example.slowRadius,
        }),
        tone: 'actual',
        values: normal.map(({ position }) => position),
      },
      {
        id: 'late',
        label: t('studyAifg.arrive.model.lateBrakingDashedAmberSlowingRadius', {
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
): NonNullable<MotionStudyModel['comparison']> {
  const late =
    example.slowRadius === example.lateRadius ? normal : arriveFrames(example, example.lateRadius);
  const seconds = normal.map((_frame, step) => Number((step * example.timeStep).toFixed(1)));
  const [normalPeak, latePeak] = [peakOf(normal, example), peakOf(late, example)];
  const overshootOf = ({ step, reached, overshoot }: ReturnType<typeof peakOf>) =>
    overshoot > 0.005
      ? t('studyAifg.arrive.model.lateBrakingReachesPositionAboutOvershooting', {
          value1: reached.toFixed(2),
          value2: seconds[step].toFixed(1),
          value3: overshoot.toFixed(2),
        })
      : t('studyAifg.arrive.model.lateBrakingApproachesTargetWithoutPassing');
  const same = example.slowRadius === example.lateRadius;
  // The window stays on arrival, and widens only for a run that needs more room.
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
    title: t('studyAifg.arrive.model.lateBrakingWhatHappensWhenSlowing'),
    intro: t('studyAifg.arrive.model.lateBrakingTwoRunsExampleChange', {
      exampleSlowRadius: example.slowRadius,
      exampleLateRadius: example.lateRadius,
      exampleTarget: example.target,
      exampleMaxSpeed: example.maxSpeed,
      exampleMaxAcceleration: example.maxAcceleration,
      exampleResponseTime: example.responseTime,
      exampleTimeStep: example.timeStep,
    }),
    timeline: lateBrakingTimeline(
      t,
      seconds,
      end,
      top,
      example,
      normal,
      late,
      normalPeak,
      latePeak,
    ),
    findings: same
      ? [
          t('studyAifg.arrive.model.lateBrakingRunsNowUseRadius', {
            exampleLateRadius: example.lateRadius,
            value2: overshootOf(latePeak),
          }),
        ]
      : [
          t('studyAifg.arrive.model.lateBrakingRadiusCharacterRun', {
            exampleLateRadius: example.lateRadius,
            value2: overshootOf(latePeak),
            exampleSlowRadius: example.slowRadius,
            value4: overshootOf(normalPeak),
          }),
          t('studyAifg.arrive.model.lateBrakingSmallerZoneAsksLess', {
            exampleMaxAcceleration: example.maxAcceleration,
          }),
        ],
    note: t('studyAifg.arrive.model.lateBrakingChartZoomsArrivalSeconds', {
      end,
      top,
    }),
  };
}

function runTimeline(
  t: StudyTranslate,
  seconds: number[],
  lowest: number,
  example: ArriveParameters,
  velocities: number[],
  desired: number[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.arrive.model.velocity'),
    xLabel: t('studyAifg.arrive.model.lateBrakingTimeSeconds'),
    yLabel: t('studyAifg.arrive.model.velocityUnits'),
    seconds,
    yRange: [lowest, example.maxSpeed],
    xTicks: [0, example.steps * example.timeStep],
    yTicks: lowest < 0 ? [example.maxSpeed, 0, lowest] : [example.maxSpeed, 0],
    series: [
      {
        id: 'actual',
        label: t('studyAifg.arrive.model.solidGreenActualVelocity'),
        tone: 'actual',
        values: velocities,
      },
      {
        id: 'desired',
        label: t('studyAifg.arrive.model.dashedAmberDesiredVelocity'),
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
  const seconds = states.map((_state, step) => Number((step * example.timeStep).toFixed(1)));
  // The drawing's box holds the slowing circle and the furthest the run goes, at any input.
  const furthest = Math.max(...states.map(({ position }) => position));
  const reach = Math.max(example.slowRadius, 36) + 4;
  const velocities = states.map(({ velocity }) => velocity);
  const desired = statesSamples.map(({ calculation }) => calculation.desired);
  // A run that overshoots comes back with a negative velocity, which the chart must still show.
  const lowest = Math.floor(Math.min(0, ...velocities, ...desired));
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: -10,
        maxX: Math.max(150, example.target + reach + 10, furthest + 20),
        minY: -reach,
        maxY: reach,
      },
      frames: states.map((state, step) =>
        frameOf(t, state, step, example, statesSamples[step].calculation),
      ),
      trail: true,
    },
    timeline: runTimeline(t, seconds, lowest, example, velocities, desired),
    initialStep: 75,
    moments: [
      { label: t('studyAifg.arrive.model.start'), step: 0 },
      { label: t('studyAifg.arrive.model.cruise'), step: 40 },
      { label: t('studyAifg.arrive.model.slowDown'), step: 75 },
      { label: t('studyAifg.arrive.model.rest'), step: example.steps },
    ],
    legend: [
      {
        tone: 'actual',
        label: t('studyAifg.arrive.model.solidGreenActualVelocity'),
      },
      {
        tone: 'desired',
        label: t('studyAifg.arrive.model.dashedAmberDesiredVelocity'),
      },
    ],
    caption: t('studyAifg.arrive.model.caption'),
    comparison: lateBraking(t, example, states),
    inputs: [
      {
        name: 'slowRadius',
        label: t('studyAifg.arrive.model.slowingRadius'),
        unit: t('studyAifg.arrive.model.inputsUnitUnits'),
        min: 4,
        max: 60,
        step: 2,
      },
      {
        name: 'maxAcceleration',
        label: t('studyAifg.arrive.model.maximumAcceleration'),
        unit: t('studyAifg.arrive.model.inputsUnitUnitsS'),
        min: 4,
        max: 24,
        step: 1,
      },
    ],
  };
};
