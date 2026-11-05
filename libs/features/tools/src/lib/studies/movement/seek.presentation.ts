import { distance, dot, length, scale, subtract } from '@dotln-angular/scene-engine';

import { drawingWidth } from '../drawing';
import type {
  MotionFrame,
  MotionLink,
  MotionMark,
  MotionStudyModel,
  StudyWorkedStep,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { fixed, motionPoints, pair } from './presentation';
import {
  beaconOf,
  calculateSeekStep,
  type SeekParameters,
  seekSamples,
  type SeekState,
  type SeekStep,
  sweptAngles,
} from './seek.simulation';

function workedStep(
  t: StudyTranslate,
  state: SeekState,
  step: number,
  example: SeekParameters,
  calculation: SeekStep,
): StudyWorkedStep {
  const { offset, acceleration, trialVelocity, next } = calculation;
  const seconds = step * example.timeStep;
  return {
    title: t('studyAifg.seek.model.workedWorkedStepSeconds', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + example.timeStep),
    }),
    lines: [
      t('studyAifg.seek.model.workedBeaconMinusMica', {
        value1: pair(beaconOf(example)),
        statePosition: pair(state.position),
        offset: pair(offset),
      }),
      t('studyAifg.seek.model.workedDistance', {
        offsetX: fixed(offset.x),
        offsetY: fixed(offset.y),
        calculationDistance: fixed(calculation.distance),
      }),
      calculation.distance === 0
        ? t('studyAifg.seek.model.workedOffsetZeroEngineSeek')
        : t('studyAifg.seek.model.workedEngineSeek', {
            offset: pair(offset),
            calculationDistance: fixed(calculation.distance),
            exampleMaxAcceleration: fixed(example.maxAcceleration),
            acceleration: pair(acceleration),
          }),
      t('studyAifg.seek.model.workedTrialVelocity', {
        stateVelocity: pair(state.velocity),
        acceleration: pair(acceleration),
        exampleTimeStep: fixed(example.timeStep),
        trialVelocity: pair(trialVelocity),
      }),
      t('studyAifg.seek.model.workedTrialSpeedCapClipLength', {
        trialVelocity: fixed(length(trialVelocity)),
        exampleMaxSpeed: fixed(example.maxSpeed),
        nextVelocity: pair(next.velocity),
      }),
      t('studyAifg.seek.model.workedNewPosition', {
        statePosition: pair(state.position),
        nextVelocity: pair(next.velocity),
        exampleTimeStep: fixed(example.timeStep),
        nextPosition: pair(next.position),
      }),
    ],
    note:
      dot(state.velocity, offset) < 0
        ? t('studyAifg.seek.model.workedMicaMovingAwayBeacon')
        : t('studyAifg.seek.model.workedPullChangesVelocityDoes'),
  };
}

function motionRelation(t: StudyTranslate, state: SeekState, calculation: SeekStep): string {
  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? t('studyAifg.seek.model.micaRestsBeaconNo')
      : t('studyAifg.seek.model.micaCoastsThroughBeacon');
  const closing = dot(state.velocity, calculation.offset);
  if (closing < 0) return t('studyAifg.seek.model.micaMovingAwayMotor');
  if (closing > 0) return t('studyAifg.seek.model.micaMovingCloserMotor');
  return t('studyAifg.seek.model.micaMovingAcrossInward');
}

function phaseNote(
  t: StudyTranslate,
  state: SeekState,
  step: number,
  angle: number,
  calculation: SeekStep,
  example: SeekParameters,
): string {
  if (calculation.distance === 0)
    return length(state.velocity) === 0
      ? t('studyAifg.seek.model.phaseMicaRestsBeaconBecause')
      : t('studyAifg.seek.model.phaseMicaBeaconMovingZero');
  if (step === 0)
    return example.velocityY === 0
      ? t('studyAifg.seek.model.phaseMicaHeadsStraightBeacon')
      : t('studyAifg.seek.model.phaseMicaStartsSidewaysMotion');
  if (dot(state.velocity, calculation.offset) < 0)
    return t('studyAifg.seek.model.phaseMicaMovingAwayInward');
  if (example.velocityY !== 0 && Math.abs(angle) >= 2 * Math.PI)
    return t('studyAifg.seek.model.phaseMicaCirclingBackAgain');
  return t('studyAifg.seek.model.phaseMicaClosingBeaconMotor');
}

function frameOf(
  t: StudyTranslate,
  state: SeekState,
  step: number,
  angle: number,
  states: readonly SeekState[],
  example: SeekParameters,
  calculation: ReturnType<typeof calculateSeekStep>,
): MotionFrame {
  const acceleration = scale(calculation.acceleration, example.accelerationSecondsSquared);
  const velocity = scale(state.velocity, example.velocitySeconds);
  return {
    seconds: step * example.timeStep,
    bodies: [
      {
        id: 'mica',
        ...state.position,
        tone: 'subject',
        label: t('studyAifg.seek.model.mica'),
      },
    ],
    marks: [
      {
        ...beaconOf(example),
        shape: 'cross',
        tone: 'target',
        label: t('studyAifg.seek.model.beacon'),
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
      motionRelation: motionRelation(t, state, calculation),
      startSidewaysSpeed: fixed(Math.abs(example.velocityY)),
      maxAcceleration: fixed(example.maxAcceleration),
      accelerationMagnitude: fixed(length(calculation.acceleration)),
      pathKind:
        example.velocityY === 0
          ? t('studyAifg.seek.model.valueStraightPasses')
          : t('studyAifg.seek.model.valueCurvedReturnAroundBeacon'),
      speed: fixed(length(state.velocity)),
      trialSpeed: fixed(length(calculation.trialVelocity)),
      turns: fixed(Math.abs(angle) / (2 * Math.PI)),
    },
    note: phaseNote(t, state, step, angle, calculation, example),
    worked: workedStep(t, state, step, example, calculation),
  };
}

/** Put close names in a separated row, with connectors routed below the motion. */
function labelFrame(
  t: StudyTranslate,
  frame: MotionFrame,
  left: number,
  span: number,
  rowY: number,
): MotionFrame {
  const mica = frame.bodies[0];
  const beacon = frame.marks?.[0];
  if (!beacon) return frame;
  const unit = span / drawingWidth;
  const named = [
    { label: t('studyAifg.seek.model.mica'), point: mica },
    { label: t('studyAifg.seek.model.beacon'), point: beacon },
  ];
  const closeNames =
    Math.abs(mica.x - beacon.x) < 96 * unit && Math.abs(mica.y - beacon.y) < 32 * unit;
  const crossesArrow = named.some(({ label, point }) =>
    (frame.vectors ?? []).some((vector) => {
      const left = point.x - label.length * 8 * unit;
      const right = point.x + label.length * 8 * unit;
      const top = point.y - 40 * unit;
      const bottom = point.y - 12 * unit;
      return (
        Math.max(vector.x, vector.x + vector.dx) + 8 * unit >= left &&
        Math.min(vector.x, vector.x + vector.dx) - 8 * unit <= right &&
        Math.max(vector.y, vector.y + vector.dy) + 8 * unit >= top &&
        Math.min(vector.y, vector.y + vector.dy) - 8 * unit <= bottom
      );
    }),
  );
  if (!closeNames && !crossesArrow) return frame;
  const callouts = named.map<MotionMark>(({ label }, index) => ({
    x: left + (span * (index + 1)) / (named.length + 1),
    y: rowY,
    shape: 'dot',
    tone: 'muted',
    label,
  }));
  const connectors = named.flatMap<MotionLink>(({ point }, index) => {
    const callout = callouts[index];
    const above = { x: callout.x + 64 * unit, y: rowY - 48 * unit };
    const beside = { x: above.x, y: rowY };
    return [
      { from: point, to: above, tone: 'muted' },
      { from: above, to: beside, tone: 'muted' },
      { from: beside, to: callout, tone: 'muted' },
    ];
  });
  return {
    ...frame,
    bodies: [{ ...mica, label: undefined }],
    marks: [{ ...beacon, label: undefined }, ...callouts],
    links: [...(frame.links ?? []), ...connectors],
  };
}

function comparison(
  t: StudyTranslate,
  example: SeekParameters,
): NonNullable<MotionStudyModel['comparison']> {
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
    title: t('studyAifg.seek.model.comparisonDoesStraightStartStop'),
    intro:
      example.velocityY === changed.velocityY
        ? t('studyAifg.seek.model.comparisonSelectedStartAlreadyStraight')
        : t('studyAifg.seek.model.comparisonChangeStartingSidewaysVelocity', {
            exampleVelocityY: fixed(example.velocityY),
            changedVelocityY: fixed(changed.velocityY),
          }),
    timeline: {
      title: t('studyAifg.seek.model.comparisonDistanceBeacon'),
      xLabel: t('studyAifg.seek.model.comparisonTimeSeconds'),
      yLabel: t('studyAifg.seek.model.comparisonDistance'),
      seconds: normal.map((_state, step) => step * example.timeStep),
      reference: 0,
      yRange: [0, Math.max(...normalDistances, ...straightDistances)],
      series: [
        {
          id: 'sideways',
          label: t('studyAifg.seek.model.comparisonSelectedStart'),
          tone: 'actual',
          values: normalDistances,
        },
        {
          id: 'straight',
          label: t('studyAifg.seek.model.comparisonStraightStart'),
          tone: 'desired',
          values: straightDistances,
        },
      ],
    },
    findings: [
      example.velocityY === 0
        ? t('studyAifg.seek.model.comparisonNoSidewaysMotionMica')
        : t('studyAifg.seek.model.comparisonSidewaysStartBendsReturn', {
            exampleVelocityY: fixed(example.velocityY),
            changedVelocityY: fixed(changed.velocityY),
          }),
      firstPass < 0
        ? t('studyAifg.seek.model.comparisonChangedRunDoesNot')
        : t('studyAifg.seek.model.comparisonFirstPassStraightRun', {
            firstPass: fixed(firstPass * example.timeStep),
            positionX: fixed(straight[firstPass].position.x - example.targetX),
            velocityX: fixed(straight[firstPass].velocity.x),
          }),
    ],
    note: t('studyAifg.seek.model.comparisonLinesShowDistanceTouching'),
  };
}

function runMoments(
  t: StudyTranslate,
  example: SeekParameters,
  initialStep: number,
  circuit: number,
  returning: number,
): MotionStudyModel['moments'] {
  return [
    {
      label:
        example.velocityY === 0
          ? t('studyAifg.seek.model.comparisonStraightStart')
          : t('studyAifg.seek.model.sidewaysStart'),
      step: 0,
    },
    { label: t('studyAifg.seek.model.pastBeacon'), step: initialStep },
    {
      label:
        circuit >= 0
          ? t('studyAifg.seek.model.completeCircuit')
          : returning >= 0
            ? t('studyAifg.seek.model.turningBack')
            : t('studyAifg.seek.model.laterMotion'),
      step: circuit >= 0 ? circuit : returning >= 0 ? returning : example.steps,
    },
    { label: t('studyAifg.seek.model.moving'), step: example.steps },
  ];
}

function runTimeline(
  t: StudyTranslate,
  frames: MotionFrame[],
  gaps: number[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.seek.model.comparisonDistanceBeacon'),
    xLabel: t('studyAifg.seek.model.comparisonTimeSeconds'),
    yLabel: t('studyAifg.seek.model.comparisonDistance'),
    seconds: frames.map(({ seconds }) => seconds),
    yRange: [0, Math.max(...gaps)],
    reference: 0,
    series: [
      {
        id: 'distance',
        label: t('studyAifg.seek.model.greenMicaBeacon'),
        tone: 'actual',
        values: gaps,
      },
    ],
  };
}

export const present = (
  example: SeekParameters,
  statesSamples: ReturnType<typeof seekSamples>,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const beacon = beaconOf(example);
  const angles = sweptAngles(states, beacon);
  const rawFrames = states.map((state, step) =>
    frameOf(t, state, step, angles[step], states, example, statesSamples[step].calculation),
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
  const frames = rawFrames.map((frame) => labelFrame(t, frame, left, spanX, rowY));
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
    moments: runMoments(t, example, initialStep, circuit, returning),
    legend: [
      { tone: 'actual', label: t('studyAifg.seek.model.velocity') },
      { tone: 'desired', label: t('studyAifg.seek.model.inwardAcceleration') },
      { tone: 'muted', label: t('studyAifg.seek.model.pathFar') },
    ],
    caption: t('studyAifg.seek.model.caption', {
      exampleVelocitySeconds: fixed(example.velocitySeconds),
      exampleAccelerationSecondsSquared: fixed(example.accelerationSecondsSquared),
    }),
    comparison: comparison(t, example),
    inputs: [
      {
        name: 'velocityY',
        label: t('studyAifg.seek.model.sidewaysStart'),
        unit: t('studyAifg.seek.model.inputsUnitUnitsS'),
        min: 0,
        max: 4,
        step: 0.5,
      },
    ],
  };
};
