import type { StudyParameters } from '@dotln-angular/models';
import { cosine, sine } from '@dotln-angular/scene-engine';

import { createNumberFormat } from '../number-format';
import type {
  MotionFrame,
  MotionStudyModel,
  StudyComparison,
  StudyInput,
  StudyPoint,
  StudyValues,
  StudyWorkedStep,
  TimelineModel,
} from '../study-model';
import type { StudyTranslate } from '../study-translate';
import { type AngularState, radians, wrapDegrees } from './align.simulation';
import {
  beaconAt,
  type FaceParameters,
  type FaceSample,
  faceSamples,
  type FaceStep,
} from './face.simulation';

interface FaceFrameDescription {
  readonly example: FaceParameters;
  readonly sample: FaceSample;
  readonly step: number;
  readonly seconds: number;
  readonly target: StudyPoint;
  readonly parameterValues: StudyValues;
}
function describeFrame(
  example: FaceParameters,
  sample: FaceSample,
  step: number,
  parameterValues: StudyValues,
): FaceFrameDescription {
  const seconds = step * example.timeStep;
  return { example, sample, step, seconds, target: beaconAt(seconds, example), parameterValues };
}

const { number: fixed } = createNumberFormat({ normalizeNegativeZero: true });

function alignmentLines(t: StudyTranslate, frame: FaceFrameDescription): readonly string[] {
  const {
    example,
    sample: {
      state,
      calculation: { alignment },
    },
  } = frame;

  return alignment.settled
    ? [
        t('studyAifg.face.model.worked.tolerancesPassSnapSet', {
          alignmentError: fixed(alignment.error),
          exampleAngleTolerance: fixed(example.angleTolerance),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleSpeedTolerance: fixed(example.speedTolerance),
          nextHeading: fixed(alignment.next.heading),
        }),
      ]
    : [
        Math.abs(alignment.error) <= example.angleTolerance
          ? t('studyAifg.face.model.worked.insideAngularToleranceAsk', {
              exampleAngleTolerance: fixed(example.angleTolerance),
            })
          : t('studyAifg.face.model.worked.desiredAngularVelocitySign', {
              alignmentError: fixed(alignment.error),
              exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
              absoluteError: fixed(Math.abs(alignment.error)),
              exampleSlowRadius: fixed(example.slowRadius),
              alignmentDesiredVelocity: fixed(alignment.desiredVelocity),
            }),
        t('studyAifg.face.model.worked.requestedAccelerationCapUse', {
          alignmentDesiredVelocity: fixed(alignment.desiredVelocity),
          stateAngularVelocity: fixed(state.angularVelocity),
          exampleResponseTime: fixed(example.responseTime),
          alignmentRequestedAcceleration: fixed(alignment.requestedAcceleration),
          exampleMaxAngularAcceleration: fixed(example.maxAngularAcceleration),
          alignmentAcceleration: fixed(alignment.acceleration),
        }),
        t('studyAifg.face.model.worked.angularVelocityCapped', {
          stateAngularVelocity: fixed(state.angularVelocity),
          alignmentAcceleration: fixed(alignment.acceleration),
          exampleTimeStep: fixed(example.timeStep),
          nextAngularVelocity: fixed(alignment.next.angularVelocity),
          exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
        }),
        t('studyAifg.face.model.worked.heading', {
          stateHeading: fixed(state.heading),
          nextAngularVelocity: fixed(alignment.next.angularVelocity),
          exampleTimeStep: fixed(example.timeStep),
          nextHeading: fixed(alignment.next.heading),
        }),
      ];
}

function workedLines(t: StudyTranslate, frame: FaceFrameDescription): readonly string[] {
  const {
    example,
    seconds,
    target,
    sample: {
      state,
      calculation: { offset, bearing, alignment },
    },
  } = frame;
  const travel = fixed(Math.min(seconds, example.travelDuration));

  return [
    t('studyAifg.face.model.worked.beaconTravelTimeMin', {
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
    t('studyAifg.face.model.worked.directionCamera', {
      targetX: fixed(target.x),
      exampleCameraX: fixed(example.cameraX),
      targetY: fixed(target.y),
      exampleCameraY: fixed(example.cameraY),
      offsetX: fixed(offset.x),
      offsetY: fixed(offset.y),
    }),
    bearing === null
      ? t('studyAifg.face.model.worked.componentsZeroBearingUndefined')
      : t('studyAifg.face.model.worked.bearingAtanClockwiseRight', {
          offsetY: fixed(offset.y),
          offsetX: fixed(offset.x),
          bearing: fixed(bearing),
        }),
    t('studyAifg.face.model.worked.delegateAlignWrap', {
      bearing: fixed(bearing ?? state.heading),
      stateHeading: fixed(state.heading),
      alignmentError: fixed(alignment.error),
    }),
    ...alignmentLines(t, frame),
    t('studyAifg.face.model.worked.cameraStaysNextFrame', {
      exampleCameraX: fixed(example.cameraX),
      exampleCameraY: fixed(example.cameraY),
    }),
  ];
}

function workedStep(t: StudyTranslate, frame: FaceFrameDescription): StudyWorkedStep {
  const {
    example,
    seconds,
    sample: {
      calculation: { bearing },
    },
  } = frame;

  return {
    title: t('studyAifg.face.model.worked.workedFacingStep', {
      seconds: fixed(seconds),
      nextSeconds: fixed(seconds + example.timeStep),
    }),
    lines: workedLines(t, frame),
    note:
      bearing === null
        ? t('studyAifg.face.model.worked.noDirectionExistsCoincidence')
        : seconds < example.travelDuration
          ? t('studyAifg.face.model.worked.beaconKeepsMovingMotor')
          : t('studyAifg.face.model.worked.beaconStoppedSameController'),
  };
}

function phaseOf(t: StudyTranslate, frame: FaceFrameDescription): string {
  const {
    example,
    step,
    sample: { state, calculation },
  } = frame;

  const { bearing, alignment, offset } = calculation;
  if (bearing === null) return t('studyAifg.face.model.phase.beaconPedestalThereNo');
  if (step === 0) return t('studyAifg.face.model.phase.cameraStartsTurningTowards');
  if (step * example.timeStep >= example.travelDuration)
    return alignment.settled
      ? state.angularVelocity === 0 && alignment.error === 0
        ? t('studyAifg.face.model.phase.cameraPointsStoppedBeacon')
        : t('studyAifg.face.model.phase.beaconStoppedCameraClose')
      : alignment.error * state.angularVelocity < 0
        ? t('studyAifg.face.model.phase.cameraTurnedPastStopped')
        : t('studyAifg.face.model.phase.beaconStoppedCameraNeeds');
  if (alignment.error * state.angularVelocity < 0)
    return t('studyAifg.face.model.phase.cameraTurnedPastMoving');
  const bearingRate =
    (((offset.x * example.targetVelocityY - offset.y * example.targetVelocityX) /
      (offset.x * offset.x + offset.y * offset.y)) *
      180) /
    Math.PI;
  const fallingBehind = alignment.error * (bearingRate - state.angularVelocity) > 0;
  if (fallingBehind)
    return Math.abs(state.angularVelocity) >= example.maxAngularSpeed - 1e-8
      ? t('studyAifg.face.model.phase.beaconPullsAheadBecause')
      : t('studyAifg.face.model.phase.beaconBearingChangesFaster');
  return alignment.acceleration * state.angularVelocity < 0
    ? t('studyAifg.face.model.phase.cameraEasesTurnCatches')
    : t('studyAifg.face.model.phase.cameraNarrowsGapBeacon');
}

function frameValues(t: StudyTranslate, frame: FaceFrameDescription): StudyValues {
  const {
    parameterValues,
    seconds,
    target,
    sample: {
      state,
      calculation: { offset, bearing, alignment },
    },
  } = frame;

  return {
    ...parameterValues,
    seconds: fixed(seconds),
    targetX: fixed(target.x),
    targetY: fixed(target.y),
    dx: fixed(offset.x),
    dy: fixed(offset.y),
    bearing: bearing === null ? t('studyAifg.face.model.values.undefined') : fixed(bearing),
    bearingText:
      bearing === null
        ? t('studyAifg.face.model.values.undefinedBecauseBeaconCamera')
        : t('studyAifg.face.model.values.clockwiseRight', {
            bearing: fixed(bearing),
          }),
    bearingRelation:
      bearing === null
        ? t('studyAifg.face.model.values.beaconCameraCoincideThere')
        : alignment.error === 0
          ? t('studyAifg.face.model.values.cameraPointsDirectlyBeacon')
          : t('studyAifg.face.model.values.beaconLiesCameraFacing', {
              alignmentError: fixed(Math.abs(alignment.error)),
              direction:
                alignment.error > 0
                  ? t('studyAifg.face.model.values.clockwise')
                  : t('studyAifg.face.model.values.anticlockwise'),
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

function frameOf(t: StudyTranslate, frame: FaceFrameDescription): MotionFrame {
  const {
    example,
    seconds,
    target,
    sample: { state, calculation },
  } = frame;

  const { bearing, offset } = calculation;
  const distance = Math.hypot(offset.x, offset.y);
  // End the rays before the beacon so neither ray crosses the name above it.
  const rayLength =
    bearing === null ? example.directionLength : Math.min(example.directionLength, distance / 2);
  return {
    seconds,
    bodies: [
      {
        id: 'dock-camera',
        label: t('studyAifg.face.model.labels.camera'),
        x: example.cameraX,
        y: example.cameraY,
        heading: radians(state.heading),
      },
      {
        id: 'ferry-beacon',
        label: bearing === null ? undefined : t('studyAifg.face.model.labels.beacon'),
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
    values: frameValues(t, frame),
    note: phaseOf(t, frame),
    worked: workedStep(t, frame),
  };
}

function slowMotor(
  t: StudyTranslate,
  example: FaceParameters,
  currentSamples: readonly FaceSample[],
): StudyComparison {
  const current = currentSamples.map(({ state }) => state);
  const slowSamples = faceSamples(example, example.slowMotorSpeed);
  const slow = slowSamples.map(({ state }) => state);
  const seconds = current.map((_state, step) => step * example.timeStep);
  const currentErrors = currentSamples.map(({ calculation }) => calculation.alignment.error);
  const slowErrors = slowSamples.map(({ calculation }) => calculation.alignment.error);
  const stopStep = Math.min(example.steps, Math.ceil(example.travelDuration / example.timeStep));
  const last = current.length - 1;
  return {
    title: t('studyAifg.face.model.labels.compareMotorSpeedLimits'),
    intro:
      example.maxAngularSpeed === example.slowMotorSpeed
        ? t('studyAifg.face.model.labels.motorsLimitLinesCoincide', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          })
        : t('studyAifg.face.model.labels.changeMotorSpeedLimit', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
            exampleSlowMotorSpeed: fixed(example.slowMotorSpeed),
          }),
    timeline: {
      title: t('studyAifg.face.model.labels.signedFacingError'),
      xLabel: t('studyAifg.face.model.labels.timeSeconds'),
      yLabel: t('studyAifg.face.model.labels.signedFacingErrorDegrees'),
      seconds,
      reference: 0,
      series: [
        {
          id: 'normal',
          label: t('studyAifg.face.model.labels.solidGreenCurrentMotor', {
            exampleMaxAngularSpeed: fixed(example.maxAngularSpeed),
          }),
          tone: 'actual',
          values: currentErrors,
        },
        {
          id: 'slow',
          label: t('studyAifg.face.model.labels.dashedAmberMotorLimit', {
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
      t('studyAifg.face.model.labels.whenBeaconStopsCurrent', {
        seconds: fixed(seconds[stopStep]),
        currentErrors: fixed(currentErrors[stopStep]),
        slowErrors: fixed(slowErrors[stopStep]),
      }),
      t('studyAifg.face.model.labels.currentCameraComparisonCamera', {
        seconds: fixed(seconds[last]),
        currentStatus:
          currentErrors[last] === 0 && current[last].angularVelocity === 0
            ? t('studyAifg.face.model.labels.restBeaconBearing')
            : t('studyAifg.face.model.labels.correctingSignedErrorAngular', {
                currentErrors: fixed(currentErrors[last]),
                currentLastAngularVelocity: fixed(current[last].angularVelocity),
              }),
        slowErrors: fixed(slowErrors[last]),
        slowLastAngularVelocity: fixed(slow[last].angularVelocity),
      }),
    ],
    note: t('studyAifg.face.model.labels.dotsMarkWhenBeacon'),
  };
}

function runTimeline(
  t: StudyTranslate,
  states: readonly AngularState[],
  example: FaceParameters,
  calculations: FaceStep[],
): TimelineModel {
  return {
    title: t('studyAifg.face.model.timeline.cameraHeadingCurrentBeacon'),
    xLabel: t('studyAifg.face.model.labels.timeSeconds'),
    yLabel: t('studyAifg.face.model.timeline.angleDegreesClockwiseRight'),
    seconds: states.map((_state, step) => step * example.timeStep),
    series: [
      {
        id: 'actual',
        label: t('studyAifg.face.model.timeline.solidGreenCameraHeading'),
        tone: 'actual',
        values: states.map(({ heading }) => wrapDegrees(heading)),
      },
      {
        id: 'desired',
        label: t('studyAifg.face.model.timeline.dashedAmberDesiredHeading'),
        tone: 'desired',
        values: calculations.map(({ bearing }, step) =>
          bearing === null ? wrapDegrees(states[step].heading) : bearing,
        ),
      },
    ],
  };
}

function runInputs(t: StudyTranslate): readonly StudyInput[] {
  return [
    {
      name: 'maxAngularSpeed',
      label: t('studyAifg.face.model.inputs.motorSpeedLimit'),
      unit: t('studyAifg.face.model.inputs.unitS'),
      min: 10,
      max: 120,
      step: 5,
    },
    {
      name: 'targetVelocityX',
      label: t('studyAifg.face.model.inputs.beaconHorizontalVelocity'),
      unit: t('studyAifg.face.model.inputs.unitUnitsS'),
      min: -20,
      max: -5,
      step: 1,
    },
  ];
}

export const present = (
  example: FaceParameters,
  statesSamples: readonly FaceSample[],
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
      ? t('studyAifg.face.model.values.cameraRestStoppedBeacon', {
          last: fixed(last * example.timeStep),
        })
      : t('studyAifg.face.model.values.cameraCorrectingFacingError', {
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
      frames: statesSamples.map((sample, step) =>
        frameOf(t, describeFrame(example, sample, step, parameterValues)),
      ),
    },
    timeline: runTimeline(t, states, example, calculations),
    initialStep: crossing,
    moments: [
      { label: t('studyAifg.face.model.labels.firstSightBeacon'), step: 0 },
      { label: t('studyAifg.face.model.labels.beaconCrossesBelowCamera'), step: crossing },
      { label: t('studyAifg.face.model.labels.beaconStops'), step: stopStep },
      {
        label:
          settled < 0
            ? t('studyAifg.face.model.labels.followingStoppedBeacon')
            : t('studyAifg.face.model.labels.cameraRestBearing'),
        step: settled < 0 ? last : settled,
      },
    ],
    legend: [
      { tone: 'actual', label: t('studyAifg.face.model.labels.solidGreenActual') },
      { tone: 'desired', label: t('studyAifg.face.model.labels.dashedAmberDesired') },
    ],
    caption: t('studyAifg.face.model.overview.caption'),
    comparison: slowMotor(t, example, statesSamples),
    inputs: runInputs(t),
  };
};
