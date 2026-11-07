import { distance, dot, length, scale, subtract } from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyMoment,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { type MotionLabelRow, motionPoints, withLabelRow } from './presentation';
import {
  beaconOf,
  type SeekParameters,
  type SeekSample,
  seekSamples,
  type SeekState,
  sweptAngles,
} from './seek.simulation';

interface SeekFrameDescription {
  readonly example: SeekParameters;
  readonly sample: SeekSample;
  readonly step: number;
  readonly angle: number;
  readonly states: readonly SeekState[];
}
interface SeekMoments {
  readonly initialStep: number;
  readonly circuit: number;
  readonly returning: number;
}

const { number: fixed, vector: pair } = createNumberFormat({ normalizeNegativeZero: true });

function workedStep(t: StudyTranslate, frame: SeekFrameDescription): StudyWorkedStep {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const { offset, acceleration, trialVelocity, next } = calculation;
  const seconds = step * example.timeStep;
  return {
    title: t('studyAifg.seek.model.worked.workedStepSeconds', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.seek.model.worked.beaconMinusMica', {
        beaconPosition: pair(beaconOf(example)),
        statePosition: pair(state.position),
        offset: pair(offset),
      }),
      t('studyAifg.seek.model.worked.distance', {
        offsetX: fixed(offset.x),
        offsetY: fixed(offset.y),
        calculationDistance: fixed(calculation.distance),
      }),
      calculation.distance === 0
        ? t('studyAifg.seek.model.worked.offsetZeroEngineSeek')
        : t('studyAifg.seek.model.worked.engineSeek', {
            offset: pair(offset),
            calculationDistance: fixed(calculation.distance),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
            acceleration: pair(acceleration),
          }),
      t('studyAifg.seek.model.worked.trialVelocity', {
        stateVelocity: pair(state.velocity),
        acceleration: pair(acceleration),
        exampleTimeStep: fixed(example.timeStep),
        trialVelocity: pair(trialVelocity),
      }),
      t('studyAifg.seek.model.worked.trialSpeedCapClipLength', {
        trialVelocity: fixed(length(trialVelocity)),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.seek.model.worked.newPosition', {
        statePosition: pair(state.position),
        nextVelocity: pair(next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: pair(next.position),
      }),
    ],
    note:
      dot(state.velocity, offset) < 0
        ? t('studyAifg.seek.model.worked.micaMovingAwayBeacon')
        : t('studyAifg.seek.model.worked.pullChangesVelocityDoes'),
  };
}

function motionRelation(t: StudyTranslate, frame: SeekFrameDescription): string {
  const {
    sample: { state, calculation },
  } = frame;

  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? t('studyAifg.seek.model.labels.micaRestsBeaconNo')
      : t('studyAifg.seek.model.labels.micaCoastsThroughBeacon');
  const closing = dot(state.velocity, calculation.offset);
  if (closing < 0) return t('studyAifg.seek.model.labels.micaMovingAwayMotor');
  if (closing > 0) return t('studyAifg.seek.model.labels.micaMovingCloserMotor');
  return t('studyAifg.seek.model.labels.micaMovingAcrossInward');
}

function phaseNote(t: StudyTranslate, frame: SeekFrameDescription): string {
  const {
    example,
    step,
    angle,
    sample: { state, calculation },
  } = frame;

  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? t('studyAifg.seek.model.phase.micaRestsBeaconBecause')
      : t('studyAifg.seek.model.phase.micaBeaconMovingZero');
  if (step === 0)
    return example.velocityY === 0
      ? t('studyAifg.seek.model.phase.micaHeadsStraightBeacon')
      : t('studyAifg.seek.model.phase.micaStartsSidewaysMotion');
  if (dot(state.velocity, calculation.offset) < 0)
    return t('studyAifg.seek.model.phase.micaMovingAwayInward');
  if (example.velocityY !== 0 && Math.abs(angle) >= 2 * Math.PI)
    return t('studyAifg.seek.model.phase.micaCirclingBackAgain');
  return t('studyAifg.seek.model.phase.micaClosingBeaconMotor');
}

function frameOf(t: StudyTranslate, frame: SeekFrameDescription): MotionFrame {
  const {
    example,
    step,
    angle,
    states,
    sample: { state, calculation },
  } = frame;

  const acceleration = scale(calculation.acceleration, example.accelerationSecondsSquared);
  const velocity = scale(state.velocity, example.velocitySeconds);
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'mica',
        ...state.position,
        tone: 'subject',
        label: t('studyAifg.seek.model.labels.mica'),
      },
    ],
    marks: [
      {
        ...beaconOf(example),
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.seek.model.labels.beacon'),
      },
    ],
    vectors: [
      { ...state.position, dx: velocity.x, dy: velocity.y, tone: 'actual' },
      { ...state.position, dx: acceleration.x, dy: acceleration.y, tone: 'desired' },
    ],
    links: states.slice(0, step).map((before, index) => ({
      from: before.position,
      to: states[index + 1].position,
      tone: 'muted',
    })),
    values: {
      positionX: fixed(state.position.x),
      positionY: fixed(state.position.y),
      targetX: fixed(example.targetX),
      targetY: fixed(example.targetY),
      velocityX: fixed(state.velocity.x),
      velocityY: fixed(state.velocity.y),
      accelerationX: fixed(calculation.acceleration.x),
      accelerationY: fixed(calculation.acceleration.y),
      offsetX: fixed(calculation.offset.x),
      offsetY: fixed(calculation.offset.y),
      distance: fixed(calculation.distance),
      motionRelation: motionRelation(t, frame),
      startSidewaysSpeed: fixed(Math.abs(example.velocityY)),
      maxAcceleration: fixed(example.maxAcceleration),
      accelerationMagnitude: fixed(length(calculation.acceleration)),
      pathKind:
        example.velocityY === 0
          ? t('studyAifg.seek.model.values.straightPasses')
          : t('studyAifg.seek.model.values.curvedReturnAroundBeacon'),
      speed: fixed(length(state.velocity)),
      trialSpeed: fixed(length(calculation.trialVelocity)),
      turns: fixed(Math.abs(angle) / (2 * Math.PI)),
    },
    note: phaseNote(t, frame),
    worked: workedStep(t, frame),
  };
}

/** Put close names in a separated row, with connectors routed below the motion. */
function labelFrame(t: StudyTranslate, frame: MotionFrame, layout: MotionLabelRow): MotionFrame {
  const mark = frame.marks?.[0];
  if (!mark) return frame;
  return withLabelRow(
    frame,
    [
      { label: t('studyAifg.seek.model.labels.mica'), point: frame.bodies[0] },
      { label: t('studyAifg.seek.model.labels.beacon'), point: mark },
    ],
    layout,
  );
}

function comparison(t: StudyTranslate, example: SeekParameters): StudyComparison {
  const changed = { ...example, velocityY: example.comparisonVelocityY };
  const normalSamples = seekSamples(example);
  const normal = normalSamples.map(({ state }) => state);
  const straightSamples = seekSamples(changed);
  const straight = straightSamples.map(({ state }) => state);
  const beacon = beaconOf(example);
  const distances = (states: readonly SeekState[]) =>
    states.map(({ position }) => distance(position, beacon));
  const normalDistances = distances(normal);
  const straightDistances = distances(straight);
  const firstPass = straight.findIndex(({ position }) => position.x > example.targetX);
  return {
    title: t('studyAifg.seek.model.comparison.doesStraightStartStop'),
    intro:
      example.velocityY === changed.velocityY
        ? t('studyAifg.seek.model.comparison.selectedStartAlreadyStraight')
        : t('studyAifg.seek.model.comparison.changeStartingSidewaysVelocity', {
            exampleVelocityY: fixed(example.velocityY),
            changedVelocityY: fixed(changed.velocityY),
          }),
    timeline: {
      title: t('studyAifg.seek.model.comparison.distanceBeacon'),
      xLabel: t('studyAifg.seek.model.comparison.timeSeconds'),
      yLabel: t('studyAifg.seek.model.comparison.distance'),
      seconds: normal.map((_state, step) => step * example.timeStep),
      reference: 0,
      yRange: [0, Math.max(...normalDistances, ...straightDistances)],
      series: [
        {
          id: 'sideways',
          label: t('studyAifg.seek.model.comparison.selectedStart'),
          tone: 'actual',
          values: normalDistances,
        },
        {
          id: 'straight',
          label: t('studyAifg.seek.model.comparison.straightStart'),
          tone: 'desired',
          values: straightDistances,
        },
      ],
    },
    findings: [
      example.velocityY === 0
        ? t('studyAifg.seek.model.comparison.noSidewaysMotionMica')
        : t('studyAifg.seek.model.comparison.sidewaysStartBendsReturn', {
            exampleVelocityY: fixed(example.velocityY),
            changedVelocityY: fixed(changed.velocityY),
          }),
      firstPass < 0
        ? t('studyAifg.seek.model.comparison.changedRunDoesNot')
        : t('studyAifg.seek.model.comparison.firstPassStraightRun', {
            firstPass: fixed(firstPass * example.timeStep),
            positionX: fixed(straight[firstPass].position.x - example.targetX),
            velocityX: fixed(straight[firstPass].velocity.x),
          }),
    ],
    note: t('studyAifg.seek.model.comparison.linesShowDistanceTouching'),
  };
}

function runMoments(
  t: StudyTranslate,
  example: SeekParameters,
  selection: SeekMoments,
): readonly StudyMoment[] {
  const { initialStep, circuit, returning } = selection;

  return [
    {
      label:
        example.velocityY === 0
          ? t('studyAifg.seek.model.comparison.straightStart')
          : t('studyAifg.seek.model.labels.sidewaysStart'),
      step: 0,
    },
    { label: t('studyAifg.seek.model.moments.pastBeacon'), step: initialStep },
    {
      label:
        circuit >= 0
          ? t('studyAifg.seek.model.moments.completeCircuit')
          : returning >= 0
            ? t('studyAifg.seek.model.moments.turningBack')
            : t('studyAifg.seek.model.moments.laterMotion'),
      step: circuit >= 0 ? circuit : returning >= 0 ? returning : example.steps,
    },
    { label: t('studyAifg.seek.model.moments.moving'), step: example.steps },
  ];
}

function runTimeline(t: StudyTranslate, frames: MotionFrame[], gaps: number[]): TimelineModel {
  return {
    title: t('studyAifg.seek.model.comparison.distanceBeacon'),
    xLabel: t('studyAifg.seek.model.comparison.timeSeconds'),
    yLabel: t('studyAifg.seek.model.comparison.distance'),
    seconds: frames.map(({ seconds }) => seconds),
    yRange: [0, Math.max(...gaps)],
    reference: 0,
    series: [
      {
        id: 'distance',
        label: t('studyAifg.seek.model.timeline.greenMicaBeacon'),
        tone: 'actual',
        values: gaps,
      },
    ],
  };
}

export const present = (
  example: SeekParameters,
  statesSamples: readonly SeekSample[],
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const beacon = beaconOf(example);
  const angles = sweptAngles(states, beacon);
  const rawFrames = statesSamples.map((sample, step) =>
    frameOf(t, { example, sample, step, angle: angles[step], states }),
  );
  const rawPoints = motionPoints(rawFrames);
  const padding = Math.max(
    example.maxSpeed * example.velocitySeconds,
    example.maxAcceleration * example.accelerationSecondsSquared,
  );
  const spanX =
    Math.max(...rawPoints.map(({ x }) => x)) -
    Math.min(...rawPoints.map(({ x }) => x)) +
    2 * padding;
  const left = Math.min(...rawPoints.map(({ x }) => x)) - padding;
  const rowY = Math.max(...rawPoints.map(({ y }) => y)) + (64 * spanX) / drawingWidth;
  const frames = rawFrames.map((frame) =>
    labelFrame(t, frame, { left, span: spanX, y: rowY, minimumGap: 96 }),
  );
  const points = motionPoints(frames);
  const overshoot = states.findIndex(
    (state) =>
      state.position.x > example.targetX &&
      dot(state.velocity, subtract(beacon, state.position)) < 0,
  );
  const circuit =
    example.velocityY === 0 ? -1 : angles.findIndex((angle) => Math.abs(angle) >= 2 * Math.PI);
  const returning = states.findIndex((state, step) => step > overshoot && state.velocity.x < 0);
  const initialStep = overshoot < 0 ? 0 : overshoot;
  const gaps = states.map(({ position }) => distance(position, beacon));
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: left,
        maxX: left + spanX,
        minY: Math.min(...points.map(({ y }) => y)) - padding,
        maxY: Math.max(...points.map(({ y }) => y)) + padding,
      },
      frames,
      trail: true,
    },
    timeline: runTimeline(t, frames, gaps),
    initialStep,
    moments: runMoments(t, example, { initialStep, circuit, returning }),
    legend: [
      { tone: 'actual', label: t('studyAifg.seek.model.labels.velocity') },
      { tone: 'desired', label: t('studyAifg.seek.model.labels.inwardAcceleration') },
      { tone: 'muted', label: t('studyAifg.seek.model.labels.pathFar') },
    ],
    caption: t('studyAifg.seek.model.overview.caption', {
      exampleVelocitySeconds: fixed(example.velocitySeconds),
      exampleAccelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
    }),
    comparison: comparison(t, example),
    inputs: [
      {
        name: 'velocityY',
        label: t('studyAifg.seek.model.labels.sidewaysStart'),
        unit: t('studyAifg.seek.model.inputs.unitUnitsS'),
        min: 0,
        max: 4,
        step: 0.5,
      },
    ],
  };
};
