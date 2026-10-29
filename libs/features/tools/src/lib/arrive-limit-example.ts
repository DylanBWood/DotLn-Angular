import { arriveExample, arriveFrames } from './arrive-example';
import type { ArriveLimitExampleView, ArriveState } from './types';

const lateRadius = 8;
const firstStep = 40;
const lastStep = 160;
const x = (step: number) => 50 + ((step - firstStep) / (lastStep - firstStep)) * 520;
const y = (position: number) => 250 - (position - 50) * 3.5;
const positionTicks = [110, 100, 75, 50];
// Grid lines mark every labelled position except the target, which has its own line.
const gridPositions = positionTicks.filter((position) => position !== arriveExample.target);
const timeTickSteps = [40, 80, 120, 160];
// A position label's baseline sits this far below its grid line so the text reads level with it.
const labelBaseline = 7;
const left = x(firstStep);
const right = x(lastStep);

/** Compare one changed radius using the same motion rule as the interactive example. */
export function arriveLimitExampleView(): ArriveLimitExampleView {
  const normal = arriveFrames();
  const late = arriveFrames(lateRadius);
  const peakStep = (frames: readonly ArriveState[]) =>
    frames.reduce((peak, frame, step) => (frame.position > frames[peak].position ? step : peak), 0);
  const latePeak = peakStep(late);
  const cases = [
    { id: 'normal' as const, frames: normal },
    { id: 'late' as const, frames: late },
  ];
  return {
    cases: cases.map(({ id, frames }) => {
      const peak = peakStep(frames);
      return {
        id,
        points: frames
          .slice(firstStep, lastStep + 1)
          .map(
            (frame, index) => `${x(index + firstStep).toFixed(2)},${y(frame.position).toFixed(2)}`,
          )
          .join(' '),
        peakX: x(peak),
        peakY: y(frames[peak].position),
      };
    }),
    positionTicks: positionTicks.map((position) => ({
      label: String(position),
      y: y(position) + labelBaseline,
    })),
    timeTicks: timeTickSteps.map((step) => ({
      label: String(Math.round(step * arriveExample.timeStep)),
      x: Number(x(step).toFixed(2)),
    })),
    gridPath: gridPositions.map((position) => `M ${left} ${y(position)} H ${right}`).join(' '),
    targetPath: `M ${left} ${y(arriveExample.target)} H ${right}`,
    axisPath: `M ${left} ${y(Math.max(...positionTicks))} V ${y(Math.min(...positionTicks))} H ${right}`,
    values: {
      normalRadius: String(arriveExample.slowRadius),
      lateRadius: String(lateRadius),
      target: String(arriveExample.target),
      maxSpeed: String(arriveExample.maxSpeed),
      maxAcceleration: String(arriveExample.maxAcceleration),
      responseTime: String(arriveExample.responseTime),
      timeStep: String(arriveExample.timeStep),
      peakPosition: late[latePeak].position.toFixed(2),
      overshoot: (late[latePeak].position - arriveExample.target).toFixed(2),
      peakSeconds: (latePeak * arriveExample.timeStep).toFixed(1),
    },
  };
}
