import type { MotionFrame, MotionStudyModel, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  calculateFleeStep,
  type FleeParameters,
  fleeSamples,
  type FleeState,
  type FleeStep,
} from './flee.simulation';
import { fixed } from './presentation';

function relationOf(
  state: FleeState,
  calculation: FleeStep,
  t: StudyTranslate,
): {
  readonly state: string;
  readonly note: string;
} {
  if (calculation.distance === 0)
    return state.velocity === 0
      ? {
          state: t('studyAifg.flee.model.relation.descriptions.pipHasNoDirection'),
          note: t('studyAifg.flee.model.relationNotes.descriptions.pipHasNoDirection'),
        }
      : {
          state: t('studyAifg.flee.model.relation.descriptions.pipHasNoPush'),
          note: t('studyAifg.flee.model.relationNotes.descriptions.pipHasNoPush'),
        };
  if (calculation.acceleration === 0)
    return state.velocity === 0
      ? {
          state: t('studyAifg.flee.model.relation.descriptions.beaconOutsideActiveResponse'),
          note: t('studyAifg.flee.model.relationNotes.descriptions.beaconOutsideActiveResponse'),
        }
      : {
          state: t('studyAifg.flee.model.relation.descriptions.pushZeroWhilePip'),
          note: t('studyAifg.flee.model.relationNotes.descriptions.pushZeroWhilePip'),
        };
  if (state.velocity * calculation.offset < 0)
    return {
      state: t('studyAifg.flee.model.relation.descriptions.pipStillTravellingTowards'),
      note: t('studyAifg.flee.model.relationNotes.descriptions.pipStillTravellingTowards'),
    };
  return state.velocity === 0
    ? {
        state: t('studyAifg.flee.model.relation.descriptions.outwardPushBeginsBuild'),
        note: t('studyAifg.flee.model.relationNotes.descriptions.outwardPushBeginsBuild'),
      }
    : {
        state: t('studyAifg.flee.model.relation.descriptions.pipTravellingAwayWhile'),
        note: t('studyAifg.flee.model.relationNotes.descriptions.pipTravellingAwayWhile'),
      };
}

function workedStep(
  state: FleeState,
  step: number,
  calculation: FleeStep,
  example: FleeParameters,
  t: StudyTranslate,
): StudyWorkedStep {
  return {
    title: t('studyAifg.flee.model.workedStep.title', { timeStep: fixed(step * example.timeStep) }),
    lines: [
      t('studyAifg.flee.model.workedStep.steps.pipMinusBeaconDistance', {
        position: fixed(state.position),
        threat: fixed(example.threat),
        offset: fixed(calculation.offset),
        distance: fixed(calculation.distance),
      }),
      t('studyAifg.flee.model.workedStep.steps.awayDirectionSignFade', {
        offset: fixed(calculation.offset),
        direction: fixed(calculation.direction),
        distance: fixed(calculation.distance),
        engineRadius: fixed(example.engineRadius),
        fade: fixed(calculation.fade),
      }),
      t('studyAifg.flee.model.workedStep.steps.engineFleeReturns', {
        direction: fixed(calculation.direction),
        maxAcceleration: fixed(example.maxAcceleration),
        fade: fixed(calculation.fade),
        acceleration: fixed(calculation.acceleration),
      }),
      t('studyAifg.flee.model.workedStep.steps.trialVelocityCapGives', {
        velocity: fixed(state.velocity),
        acceleration: fixed(calculation.acceleration),
        timeStep: fixed(example.timeStep),
        trialVelocity: fixed(calculation.trialVelocity),
        maxSpeed: fixed(example.maxSpeed),
        nextVelocity: fixed(calculation.next.velocity),
      }),
      t('studyAifg.flee.model.workedStep.steps.newPosition', {
        position: fixed(state.position),
        nextVelocity: fixed(calculation.next.velocity),
        timeStep: fixed(example.timeStep),
        nextPosition: fixed(calculation.next.position),
      }),
    ],
    note:
      calculation.distance === 0
        ? t('studyAifg.flee.model.workedStep.notes.normalisingZeroDisplacementGives')
        : calculation.acceleration === 0
          ? t('studyAifg.flee.model.workedStep.notes.zeroAccelerationNotStop')
          : t('studyAifg.flee.model.workedStep.notes.fadingMagnitudeBelongsRepository'),
  };
}

function frameValues(
  step: number,
  example: FleeParameters,
  state: FleeState,
  calculation: FleeStep,
  motionState: string,
): MotionFrame['values'] {
  return {
    seconds: fixed(step * example.timeStep),
    start: fixed(example.start),
    threat: fixed(example.threat),
    initialVelocity: fixed(example.initialVelocity),
    position: fixed(state.position),
    velocity: fixed(state.velocity),
    offset: fixed(calculation.offset),
    distance: fixed(calculation.distance),
    direction: fixed(calculation.direction),
    fade: fixed(calculation.fade),
    acceleration: fixed(calculation.acceleration),
    nextVelocity: fixed(calculation.next.velocity),
    nextPosition: fixed(calculation.next.position),
    maxSpeed: fixed(example.maxSpeed),
    maxAcceleration: fixed(example.maxAcceleration),
    engineRadius: fixed(example.engineRadius),
    timeStep: fixed(example.timeStep),
    duration: fixed(example.steps * example.timeStep),
    velocitySeconds: fixed(example.velocitySeconds),
    accelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
    motionState,
  };
}

function frameDrawing(
  state: FleeState,
  example: FleeParameters,
  calculation: FleeStep,
): Pick<MotionFrame, 'bodies' | 'marks' | 'zones' | 'links' | 'vectors'> {
  return {
    bodies: [{ id: 'pip', x: state.position, y: 0, tone: 'subject' }],
    marks: [{ x: example.threat, y: 0, shape: 'cross', tone: 'target' }],
    zones: [{ x: example.threat, y: 0, radius: example.engineRadius, tone: 'zone' }],
    links: [
      {
        from: { x: state.position, y: 0 },
        to: { x: example.threat, y: 0 },
        tone: 'muted',
      },
    ],
    vectors: [
      {
        x: state.position,
        y: -example.arrowLane,
        dx: state.velocity * example.velocitySeconds,
        dy: 0,
        tone: 'actual',
      },
      {
        x: state.position,
        y: example.arrowLane,
        dx: calculation.acceleration * example.accelerationSecondsSquared,
        dy: 0,
        tone: 'desired',
      },
    ],
  };
}

function frameOf(
  state: FleeState,
  step: number,
  example: FleeParameters,
  t: StudyTranslate,
  calculation: ReturnType<typeof calculateFleeStep>,
): MotionFrame {
  const relation = relationOf(state, calculation, t);
  return {
    seconds: step * example.timeStep,
    ...frameDrawing(state, example, calculation),
    values: frameValues(step, example, state, calculation, relation.state),
    note: relation.note,
    worked: workedStep(state, step, calculation, example, t),
  };
}

function coincidentComparison(
  states: readonly FleeState[],
  example: FleeParameters,
  t: StudyTranslate,
): NonNullable<MotionStudyModel['comparison']> {
  const changed = { ...example, start: example.threat };
  const coincidentSamples = fleeSamples(changed);
  const coincident = coincidentSamples.map(({ state }) => state);
  const distances = (run: readonly FleeState[]) =>
    run.map(({ position }) => Math.abs(position - example.threat));
  const selectedGaps = distances(states);
  const coincidentGaps = distances(coincident);
  const same = example.start === example.threat;
  const atRest = example.initialVelocity === 0;
  return {
    title: t('studyAifg.flee.model.coincidentComparison.title'),
    intro: same
      ? t('studyAifg.flee.model.coincidentComparison.introCases.bothRunsNowStart', {
          threat: fixed(example.threat),
        })
      : t('studyAifg.flee.model.coincidentComparison.introCases.changeOnlyPipStarting', {
          start: fixed(example.start),
          threat: fixed(example.threat),
          initialVelocity: fixed(example.initialVelocity),
        }),
    timeline: {
      title: t('studyAifg.flee.model.coincidentComparison.timeline.title'),
      xLabel: t('studyAifg.flee.model.coincidentComparison.timeline.xLabel'),
      yLabel: t('studyAifg.flee.model.coincidentComparison.timeline.yLabel'),
      seconds: states.map((_state, step) => step * example.timeStep),
      yRange: [0, Math.max(example.engineRadius, ...selectedGaps, ...coincidentGaps)],
      reference: example.engineRadius,
      series: [
        {
          id: 'selected',
          label: t(
            'studyAifg.flee.model.coincidentComparison.timeline.series.labels.selectedStart',
          ),
          tone: 'actual',
          values: selectedGaps,
        },
        {
          id: 'coincident',
          label: t('studyAifg.flee.model.coincidentComparison.timeline.series.labels.startBeacon'),
          tone: 'desired',
          values: coincidentGaps,
        },
      ],
    },
    findings: [
      atRest
        ? t('studyAifg.flee.model.coincidentComparison.findings.coincidenceNoInitialMotion', {
            coincidentGaps: fixed(coincidentGaps[coincidentGaps.length - 1]),
            stepsTimeStep: fixed(example.steps * example.timeStep),
          })
        : t('studyAifg.flee.model.coincidentComparison.findings.coincidenceFirstPushZero', {
            initialVelocity: fixed(example.initialVelocity),
          }),
      same
        ? t('studyAifg.flee.model.coincidentComparison.findings.twoTracesCoincideBecause')
        : t('studyAifg.flee.model.coincidentComparison.findings.selectedStartEndsBeacon', {
            selectedGaps: fixed(selectedGaps[selectedGaps.length - 1]),
            coincidentGaps: fixed(coincidentGaps[coincidentGaps.length - 1]),
          }),
    ],
    note: t('studyAifg.flee.model.coincidentComparison.note'),
  };
}

function timelineOf(
  t: StudyTranslate,
  frames: MotionFrame[],
  example: FleeParameters,
  gaps: number[],
): MotionStudyModel['timeline'] {
  return {
    title: t('studyAifg.flee.model.timeline.title'),
    xLabel: t('studyAifg.flee.model.timeline.xLabel'),
    yLabel: t('studyAifg.flee.model.timeline.yLabel'),
    seconds: frames.map(({ seconds }) => seconds),
    yRange: [0, Math.max(example.engineRadius, ...gaps)],
    reference: example.engineRadius,
    series: [
      {
        id: 'distance',
        label: t('studyAifg.flee.model.timeline.series.labels.pipBeacon'),
        tone: 'actual',
        values: gaps,
      },
    ],
  };
}

function motionOf(
  example: FleeParameters,
  ends: number[],
  extentY: number,
  frames: MotionFrame[],
): MotionStudyModel['motion'] {
  return {
    bounds: {
      minX: Math.min(example.threat - example.engineRadius, ...ends) - example.padding,
      maxX: Math.max(example.threat + example.engineRadius, ...ends) + example.padding,
      minY: -extentY,
      maxY: extentY,
    },
    frames,
    trail: true,
  };
}

function momentsOf(
  t: StudyTranslate,
  outside: number,
  telling: number,
  example: FleeParameters,
): MotionStudyModel['moments'] {
  return [
    { label: t('studyAifg.flee.model.moments.labels.readDisplacement'), step: 0 },
    { label: t('studyAifg.flee.model.moments.labels.firstMotorUpdate'), step: 1 },
    {
      label:
        outside >= 0
          ? t('studyAifg.flee.model.moments.labels.pushHasFadedOut')
          : t('studyAifg.flee.model.moments.labels.laterResponse'),
      step: telling,
    },
    { label: t('studyAifg.flee.model.moments.labels.endWindow'), step: example.steps },
  ];
}

function legendOf(t: StudyTranslate): MotionStudyModel['legend'] {
  return [
    { tone: 'subject', label: t('studyAifg.flee.model.legend.labels.pip') },
    { tone: 'target', label: t('studyAifg.flee.model.legend.labels.beacon') },
    { tone: 'actual', label: t('studyAifg.flee.model.legend.labels.velocity') },
    { tone: 'desired', label: t('studyAifg.flee.model.legend.labels.outwardAcceleration') },
    { tone: 'zone', label: t('studyAifg.flee.model.legend.labels.engineResponseRadius') },
  ];
}

function inputsOf(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'start',
      label: t('studyAifg.flee.model.inputs.labels.startingPosition'),
      unit: t('studyAifg.flee.model.inputs.units.distance'),
      min: 0,
      max: 12,
      step: 1,
    },
    {
      name: 'maxAcceleration',
      label: t('studyAifg.flee.model.inputs.labels.accelerationLimit'),
      unit: t('studyAifg.flee.model.inputs.units.acceleration'),
      min: 2,
      max: 12,
      step: 1,
    },
  ];
}

export function presentStudy(example: FleeParameters, t: StudyTranslate): MotionStudyModel {
  const statesSamples = fleeSamples(example);
  const states = statesSamples.map(({ state }) => state);
  const frames = states.map((state, step) =>
    frameOf(state, step, example, t, statesSamples[step].calculation),
  );
  const ends = frames.flatMap((frame) => [
    ...frame.bodies.map(({ x }) => x),
    ...(frame.vectors ?? []).flatMap(({ x, dx }) => [x, x + dx]),
  ]);
  const outside = states.findIndex(
    ({ position }) => Math.abs(position - example.threat) >= example.engineRadius,
  );
  const telling = outside >= 0 ? outside : Math.floor(example.steps / 2);
  const gaps = states.map(({ position }) => Math.abs(position - example.threat));
  const extentY = Math.max(example.engineRadius, example.arrowLane) + example.padding;
  return {
    family: 'motion',
    motion: motionOf(example, ends, extentY, frames),
    timeline: timelineOf(t, frames, example, gaps),
    initialStep: telling,
    moments: momentsOf(t, outside, telling, example),
    legend: legendOf(t),
    caption: t('studyAifg.flee.model.caption', {
      engineRadius: fixed(example.engineRadius),
      velocitySeconds: fixed(example.velocitySeconds),
      accelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
    }),
    comparison: coincidentComparison(states, example, t),
    inputs: inputsOf(t),
  };
}
