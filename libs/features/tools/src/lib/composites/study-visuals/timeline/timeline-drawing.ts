import type { StudyPoint, StudyTone, TimelineModel } from '../../../studies/study-model';

const left = 50;
const right = 570;
const top = 40;
const bottom = 250;
// A value's label sits this far below its grid line, so the text reads level with the line.
const labelBaseline = 7;
const defaultTicks = 4;

export interface TimelineDrawing {
  readonly axisPath: string;
  readonly gridPath: string;
  readonly referencePath: string | null;
  readonly xTicks: readonly { readonly label: string; readonly x: number }[];
  readonly yTicks: readonly { readonly label: string; readonly y: number }[];
  readonly series: readonly {
    readonly id: string;
    readonly tone: StudyTone;
    readonly points: string;
    /** Where this series stands at the marked moment. */
    readonly dot: StudyPoint | null;
  }[];
  readonly marks: readonly (StudyPoint & { readonly tone: StudyTone })[];
  /** The marked moment, or null for a chart with no moment. */
  readonly cursorX: number | null;
}

const rounded = (value: number) => Number(value.toFixed(2));

const label = (value: number) => String(Number(value.toFixed(2)));

const evenTicks = (low: number, high: number) =>
  Array.from({ length: defaultTicks }, (_, index) =>
    rounded(low + ((high - low) * index) / (defaultTicks - 1)),
  );

const extent = (values: readonly number[]): readonly [number, number] => {
  const [low, high] = [Math.min(...values), Math.max(...values)];
  return low === high ? [low - 1, high + 1] : [low, high];
};

/** Turns a timeline into the chart's coordinates, with every label on the scale of its lines. */
export function timelineDrawing(model: TimelineModel, step: number | null): TimelineDrawing {
  const [firstSecond, lastSecond] = model.xRange ?? extent(model.seconds);
  const [lowest, highest] = model.yRange ?? extent(model.series.flatMap(({ values }) => values));
  const x = (second: number) =>
    left + ((second - firstSecond) / (lastSecond - firstSecond)) * (right - left);
  const y = (value: number) => bottom - ((value - lowest) / (highest - lowest)) * (bottom - top);
  const shown = model.seconds.flatMap((second, index) =>
    second >= firstSecond && second <= lastSecond ? [index] : [],
  );
  const yTicks = model.yTicks ?? evenTicks(lowest, highest);
  const xTicks = model.xTicks ?? evenTicks(firstSecond, lastSecond);
  const grid = yTicks.filter((value) => value !== model.reference);
  const moment = step === null ? null : model.seconds[step];
  return {
    axisPath: `M ${left} ${y(Math.max(...yTicks))} V ${y(Math.min(...yTicks))} H ${right}`,
    gridPath: grid.map((value) => `M ${left} ${y(value)} H ${right}`).join(' '),
    referencePath:
      model.reference === undefined ? null : `M ${left} ${y(model.reference)} H ${right}`,
    xTicks: xTicks.map((value) => ({ label: label(value), x: rounded(x(value)) })),
    yTicks: yTicks.map((value) => ({ label: label(value), y: y(value) + labelBaseline })),
    series: model.series.map(({ id, tone, values }) => ({
      id,
      tone,
      points: shown
        .map((index) => `${x(model.seconds[index]).toFixed(2)},${y(values[index]).toFixed(2)}`)
        .join(' '),
      dot: moment === null ? null : { x: rounded(x(moment)), y: rounded(y(values[step ?? 0])) },
    })),
    marks: (model.marks ?? []).map((mark) => ({ ...mark, x: x(mark.x), y: y(mark.y) })),
    cursorX: moment === null ? null : rounded(x(moment)),
  };
}
