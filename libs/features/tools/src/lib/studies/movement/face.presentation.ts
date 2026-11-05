import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import type { MotionFrame, MotionStudyModel, StudyPoint, StudyWorkedStep } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { type AlignStep, type AngularState, radians, wrapDegrees } from './align.simulation';
import {
  beaconAt,
  calculateFaceStep,
  faceFrames,
  type FaceParameters,
  faceSamples,
  type FaceStep,
} from './face.simulation';
import { fixed } from './presentation';

function alignmentLines(
  t: StudyTranslate,
  alignment: AlignStep,
  example: FaceParameters,
  state: AngularState,
): readonly string[] {
  return alignment.settled
    ? [
        t('studyAifg.face.model.workedTolerancesPassSnapSet', {
          alignmentError: fixed(alignment.error),
          exampleAngleTolerance: fixed(example.angleTolerance),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleSpeedTolerance: fixed(example.speedTolerance),
          nextHeading: fixed(alignment.next.heading),
        }),
      ]
    : [
        Math.abs(alignment.error) <= example.angleTolerance
          ? t('studyAifg.face.model.workedInsideAngularToleranceAsk', {
              exampleAngleTolerance: fixed(example.angleTolerance),
            })
          : t('studyAifg.face.model.workedDesiredAngularVelocitySign', {
              alignmentError: fixed(alignment.error),
              exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
              alignmentError2: fixed(Math.abs(alignment.error)),
              exampleSlowRadius: fixed(example.slowRadius),
              alignmentDesiredVelocity: fixed(alignment.desiredVelocity),
            }),
        t('studyAifg.face.model.workedRequestedAccelerationCapUse', {
          alignmentDesiredVelocity: fixed(alignment.desiredVelocity),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleResponseTime: fixed(example.responseTime),
          alignmentRequestedAcceleration: fixed(alignment.requestedAcceleration),
          exampleMaxAngularAcceleration: fixed(example.maxAngularAcceleration),
          alignmentAcceleration: fixed(alignment.acceleration),
        }),
        t('studyAifg.face.model.workedAngularVelocityCapped', {
          stateAngularVelocity: fixed(state.angularVelocity),
          alignmentAcceleration: fixed(alignment.acceleration),
          exampleTimeStep: fixed(example.timeStep),
          nextAngularVelocity: fixed(alignment.next.angularVelocity),
          exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
        }),
        t('studyAifg.face.model.workedHeading', {
          stateHeading: fixed(state.heading),
          nextAngularVelocity: fixed(alignment.next.angularVelocity),
          exampleTimeStep: fixed(example.timeStep),
          nextHeading: fixed(alignment.next.heading),
        }),
      ];
}

function workedLines(
  t: StudyTranslate,
  seconds: number,
  example: FaceParameters,
  travel: string,
  target: StudyPoint,
  offset: StudyPoint,
  bearing: number | null,
  state: AngularState,
  alignment: AlignStep,
): readonly string[] {
  return [
    t('studyAifg.face.model.workedBeaconTravelTimeMin', {
      seconds: fixed(seconds),
      exampleTravelDuration: fixed(example.travelDuration),
      travel,
      exampleTargetStartX: fixed(example.targetStartX),
      exampleTargetVelocityX: fixed(example.targetVelocityX),
      exampleTargetStartY: fixed(example.targetStartY),
      exampleTargetVelocityY: fixed(example.targetVelocityY),
      targetX: fixed(target.x),
      targetY: fixed(target.y),
    }),
    t('studyAifg.face.model.workedDirectionCamera', {
      targetX: fixed(target.x),
      exampleCameraX: fixed(example.cameraX),
      targetY: fixed(target.y),
      exampleCameraY: fixed(example.cameraY),
      offsetX: fixed(offset.x),
      offsetY: fixed(offset.y),
    }),
    bearing === null
      ? t('studyAifg.face.model.workedComponentsZeroBearingUndefined')
      : t('studyAifg.face.model.workedBearingAtanClockwiseRight', {
          offsetY: fixed(offset.y),
          offsetX: fixed(offset.x),
          bearing: fixed(bearing),
        }),
    t('studyAifg.face.model.workedDelegateAlignWrap', {
      bearing: fixed(bearing ?? state.heading),
      stateHeading: fixed(state.heading),
      alignmentError: fixed(alignment.error),
    }),
    ...alignmentLines(t, alignment, example, state),
    t('studyAifg.face.model.workedCameraStaysNextFrame', {
      exampleCameraX: fixed(example.cameraX),
      exampleCameraY: fixed(example.cameraY),
    }),
  ];
}

function workedStep(
  t: StudyTranslate,
  state: AngularState,
  target: StudyPoint,
  calculation: FaceStep,
  step: number,
  example: FaceParameters,
): StudyWorkedStep {
  const { alignment, bearing, offset } = calculation;
  const seconds = step * example.timeStep;
  const travel = fixed(Math.min(seconds, example.travelDuration));
  return {
    title: t('studyAifg.face.model.workedWorkedFacingStep', {
      seconds: fixed(seconds),
      seconds2: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(t, seconds, example, travel, target, offset, bearing, state, alignment),
    note:
      bearing === null
        ? t('studyAifg.face.model.workedNoDirectionExistsCoincidence')
        : seconds < example.travelDuration
          ? t('studyAifg.face.model.workedBeaconKeepsMovingMotor')
          : t('studyAifg.face.model.workedBeaconStoppedSameController'),
  };
}

function phaseOf(
  t: StudyTranslate,
  state: AngularState,
  calculation: FaceStep,
  step: number,
  example: FaceParameters,
): string {
  const { bearing, alignment, offset } = calculation;
  if (bearing === null) return t('studyAifg.face.model.phaseBeaconPedestalThereNo');
  if (step === 0) return t('studyAifg.face.model.phaseCameraStartsTurningTowards');
  if (step * example.timeStep >= example.travelDuration)
    return alignment.settled
      ? state.angularVelocity === 0 && alignment.error === 0
        ? t('studyAifg.face.model.phaseCameraPointsStoppedBeacon')
        : t('studyAifg.face.model.phaseBeaconStoppedCameraClose')
      : alignment.error * state.angularVelocity < 0
        ? t('studyAifg.face.model.phaseCameraTurnedPastStopped')
        : t('studyAifg.face.model.phaseBeaconStoppedCameraNeeds');
  if (alignment.error * state.angularVelocity < 0)
    return t('studyAifg.face.model.phaseCameraTurnedPastMoving');
  const bearingRate =
    (((offset.x * example.targetVelocityY - offset.y * example.targetVelocityX) /
      (offset.x * offset.x + offset.y * offset.y)) *
      180) /
    Math.PI;
  const fallingBehind = alignment.error * (bearingRate - state.angularVelocity) > 0;
  if (fallingBehind)
    return Math.abs(state.angularVelocity) >= example.maxAngularSpeed - 1e-8
      ? t('studyAifg.face.model.phaseBeaconPullsAheadBecause')
      : t('studyAifg.face.model.phaseBeaconBearingChangesFaster');
  return alignment.acceleration * state.angularVelocity < 0
    ? t('studyAifg.face.model.phaseCameraEasesTurnCatches')
    : t('studyAifg.face.model.phaseCameraNarrowsGapBeacon');
}

function frameValues(
  t: StudyTranslate,
  parameterValues: Readonly<Record<string, string>>,
  seconds: number,
  target: ReturnType<typeof beaconAt>,
  offset: StudyPoint,
  bearing: number | null,
  alignment: AlignStep,
  state: AngularState,
): Readonly<Record<string, string>> {
  return {
    ...parameterValues,
    seconds: fixed(seconds),
    targetX: fixed(target.x),
    targetY: fixed(target.y),
    dx: fixed(offset.x),
    dy: fixed(offset.y),
    bearing: bearing === null ? t('studyAifg.face.model.valueUndefined') : fixed(bearing),
    bearingText:
      bearing === null
        ? t('studyAifg.face.model.valueUndefinedBecauseBeaconCamera')
        : t('studyAifg.face.model.valueClockwiseRight', {
            bearing: fixed(bearing),
          }),
    bearingRelation:
      bearing === null
        ? t('studyAifg.face.model.valueBeaconCameraCoincideThere')
        : alignment.error === 0
          ? t('studyAifg.face.model.valueCameraPointsDirectlyBeacon')
          : t('studyAifg.face.model.valueBeaconLiesCameraFacing', {
              alignmentError: fixed(Math.abs(alignment.error)),
              value2:
                alignment.error > 0
                  ? t('studyAifg.face.model.valueClockwise')
                  : t('studyAifg.face.model.valueAnticlockwise'),
            }),
    heading: fixed(wrapDegrees(state.heading)),
    error: fixed(alignment.error),
    angularSpeed: fixed(state.angularVelocity),
    desiredAngularSpeed: fixed(alignment.desiredVelocity),
    acceleration: fixed(alignment.acceleration),
    nextAngularSpeed: fixed(alignment.next.angularVelocity),
    nextHeading: fixed(alignment.next.heading),
  };
}

function frameOf(
  t: StudyTranslate,
  state: AngularState,
  step: number,
  example: FaceParameters,
  parameterValues: Readonly<Record<string, string>>,
  calculation: ReturnType<typeof calculateFaceStep>,
): MotionFrame {
  const seconds = step * example.timeStep;
  const target = beaconAt(seconds, example);
  const { alignment, bearing, offset } = calculation;
  const distance = Math.hypot(offset.x, offset.y);
  // End the rays before the beacon so neither ray crosses the name above it.
  const rayLength =
    bearing === null ? example.directionLength : Math.min(example.directionLength, distance / 2);
  return {
    seconds,
    bodies: [
      {
        id: 'dock-camera',
        label: t('studyAifg.face.model.camera'),
        x: example.cameraX,
        y: example.cameraY,
        heading: radians(state.heading),
      },
      {
        id: 'ferry-beacon',
        label: bearing === null ? undefined : t('studyAifg.face.model.beacon'),
        ...target,
        tone: 'target',
      },
    ],
    vectors: [
      {
        x: example.cameraX,
        y: example.cameraY,
        dx: cosine(radians(state.heading)) * rayLength,
        dy: sine(radians(state.heading)) * rayLength,
        tone: 'actual',
      },
      ...(bearing === null
        ? []
        : [
            {
              x: example.cameraX,
              y: example.cameraY,
              dx: (offset.x / distance) * rayLength,
              dy: (offset.y / distance) * rayLength,
              tone: 'desired' as const,
            },
          ]),
    ],
    links: [
      { from: beaconAt(0, example), to: beaconAt(example.travelDuration, example), tone: 'muted' },
    ],
    values: frameValues(t, parameterValues, seconds, target, offset, bearing, alignment, state),
    note: phaseOf(t, state, calculation, step, example),
    worked: workedStep(t, state, target, calculation, step, example),
  };
}

function slowMotor(
  t: StudyTranslate,
  example: FaceParameters,
  currentSamples: ReturnType<typeof faceSamples>,
): NonNullable<MotionStudyModel['comparison']> {
  const current = currentSamples.map(({ state }) => state);
  const slowSamples = faceSamples(example, example.slowMotorSpeed);
  const slow = slowSamples.map(({ state }) => state);
  const seconds = current.map((_state, step) => step * example.timeStep);
  const currentErrors = currentSamples.map(({ calculation }) => calculation.alignment.error);
  const slowErrors = slowSamples.map(({ calculation }) => calculation.alignment.error);
  const stopStep = Math.min(example.steps, Math.ceil(example.travelDuration / example.timeStep));
  const last = current.length - 1;
  return {
    title: t('studyAifg.face.model.compareMotorSpeedLimits'),
    intro:
      example.maxAngularSpeed === example.slowMotorSpeed
        ? t('studyAifg.face.model.motorsLimitLinesCoincide', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          })
        : t('studyAifg.face.model.changeMotorSpeedLimit', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
            exampleSlowMotorSpeed: fixed(example.slowMotorSpeed),
          }),
    timeline: {
      title: t('studyAifg.face.model.signedFacingError'),
      xLabel: t('studyAifg.face.model.timeSeconds'),
      yLabel: t('studyAifg.face.model.signedFacingErrorDegrees'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.face.model.solidGreenCurrentMotor', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          }),
          tone: 'actual',
          values: currentErrors,
        },
        {
          id: 'slow',
          label: t('studyAifg.face.model.dashedAmberMotorLimit', {
            exampleSlowMotorSpeed: fixed(example.slowMotorSpeed),
          }),
          tone: 'desired',
          values: slowErrors,
        },
      ],
      marks: [
        { x: seconds[stopStep], y: currentErrors[stopStep], tone: 'actual' },
        { x: seconds[stopStep], y: slowErrors[stopStep], tone: 'desired' },
      ],
    },
    findings: [
      t('studyAifg.face.model.whenBeaconStopsCurrent', {
        seconds: fixed(seconds[stopStep]),
        currentErrors: fixed(currentErrors[stopStep]),
        slowErrors: fixed(slowErrors[stopStep]),
      }),
      t('studyAifg.face.model.currentCameraComparisonCamera', {
        seconds: fixed(seconds[last]),
        value2:
          currentErrors[last] === 0 && current[last].angularVelocity === 0
            ? t('studyAifg.face.model.restBeaconBearing')
            : t('studyAifg.face.model.correctingSignedErrorAngular', {
                currentErrors: fixed(currentErrors[last]),
                currentLastAngularVelocity: fixed(current[last].angularVelocity),
              }),
        slowErrors: fixed(slowErrors[last]),
        slowLastAngularVelocity: fixed(slow[last].angularVelocity),
      }),
    ],
    note: t('studyAifg.face.model.dotsMarkWhenBeacon'),
  };
}

function runTimeline(
  t: StudyTranslate,
  states: ReturnType<typeof faceFrames>,
  example: FaceParameters,
  calculations: FaceStep[],
): NonNullable<MotionStudyModel['timeline']> {
  return {
    title: t('studyAifg.face.model.cameraHeadingCurrentBeacon'),
    xLabel: t('studyAifg.face.model.timeSeconds'),
    yLabel: t('studyAifg.face.model.angleDegreesClockwiseRight'),
    seconds: states.map((_state, step) => step * example.timeStep),
    series: [
      {
        id: 'actual',
        label: t('studyAifg.face.model.solidGreenCameraHeading'),
        tone: 'actual',
        values: states.map(({ heading }) => wrapDegrees(heading)),
      },
      {
        id: 'desired',
        label: t('studyAifg.face.model.dashedAmberDesiredHeading'),
        tone: 'desired',
        values: calculations.map(({ bearing }, step) =>
          bearing === null ? wrapDegrees(states[step].heading) : bearing,
        ),
      },
    ],
  };
}

function runInputs(t: StudyTranslate): MotionStudyModel['inputs'] {
  return [
    {
      name: 'maxAngularSpeed',
      label: t('studyAifg.face.model.motorSpeedLimit'),
      unit: t('studyAifg.face.model.inputsUnitS'),
      min: 10,
      max: 120,
      step: 5,
    },
    {
      name: 'targetVelocityX',
      label: t('studyAifg.face.model.beaconHorizontalVelocity'),
      unit: t('studyAifg.face.model.inputsUnitUnitsS'),
      min: -20,
      max: -5,
      step: 1,
    },
  ];
}

export const present = (
  example: FaceParameters,
  statesSamples: ReturnType<typeof faceSamples>,
  parameters: StudyParameters,
  t: StudyTranslate,
): MotionStudyModel => {
  const states = statesSamples.map(({ state }) => state);
  const calculations = statesSamples.map(({ calculation }) => calculation);
  const start = beaconAt(0, example);
  const end = beaconAt(example.travelDuration, example);
  const crossing = states.reduce(
    (best, _state, step) =>
      Math.abs(calculations[step].offset.x) < Math.abs(calculations[best].offset.x) ? step : best,
    0,
  );
  const stopStep = Math.min(example.steps, Math.ceil(example.travelDuration / example.timeStep));
  const settled = states.findIndex(
    (state, step) =>
      step >= stopStep && calculations[step].alignment.settled && state.angularVelocity === 0,
  );
  const last = states.length - 1;
  const finished = calculations[last].alignment.error === 0 && states[last].angularVelocity === 0;
  const parameterValues = {
    ...Object.fromEntries(
      Object.entries(parameters).map(([name, value]) => [
        name,
        typeof value === 'number' ? fixed(value) : value,
      ]),
    ),
    trackingOutcome: finished
      ? t('studyAifg.face.model.cameraRestStoppedBeacon', {
          last: fixed(last * example.timeStep),
        })
      : t('studyAifg.face.model.cameraCorrectingFacingError', {
          alignmentError: fixed(Math.abs(calculations[last].alignment.error)),
          statesLastAngularVelocity: fixed(states[last].angularVelocity),
          last: fixed(last * example.timeStep),
        }),
  };
  const padding = example.directionLength / 2;
  return {
    family: 'motion',
    motion: {
      bounds: {
        minX: Math.min(example.cameraX - example.directionLength, start.x, end.x) - padding,
        maxX: Math.max(example.cameraX + example.directionLength, start.x, end.x) + padding,
        minY: Math.min(example.cameraY - example.directionLength, start.y, end.y) - padding,
        maxY: Math.max(example.cameraY + example.directionLength, start.y, end.y) + padding,
      },
      frames: states.map((state, step) =>
        frameOf(t, state, step, example, parameterValues, statesSamples[step].calculation),
      ),
    },
    timeline: runTimeline(t, states, example, calculations),
    initialStep: crossing,
    moments: [
      { label: t('studyAifg.face.model.firstSightBeacon'), step: 0 },
      { label: t('studyAifg.face.model.beaconCrossesBelowCamera'), step: crossing },
      { label: t('studyAifg.face.model.beaconStops'), step: stopStep },
      {
        label:
          settled < 0
            ? t('studyAifg.face.model.followingStoppedBeacon')
            : t('studyAifg.face.model.cameraRestBearing'),
        step: settled < 0 ? last : settled,
      },
    ],
    legend: [
      { tone: 'actual', label: t('studyAifg.face.model.solidGreenActual') },
      { tone: 'desired', label: t('studyAifg.face.model.dashedAmberDesired') },
    ],
    caption: t('studyAifg.face.model.caption'),
    comparison: slowMotor(t, example, statesSamples),
    inputs: runInputs(t),
  };
};
