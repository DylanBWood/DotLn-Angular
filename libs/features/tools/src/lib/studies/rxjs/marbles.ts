import type { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import type { StudyParameters } from '@dotln-angular/models';

import { type StudyMessage, studyMessage, studyParameterValues } from '../study-message';
import type {
  MarbleEvent,
  MarbleFrame,
  MarbleLine,
  MarblesStudyModel,
  StudyLegendEntry,
  StudyMoment,
  StudyWorkedStep,
} from '../study-model';
import { secondsPerFrame } from '../study-model';
import type { StudyTranslate } from '../study-translate';

/** Executable values and their presentation are deliberately separate. */
export interface MarbleString {
  readonly marbles: string;
  readonly values?: Readonly<Record<string, unknown>>;
  readonly error?: unknown;
  /** Display messages for the letters, without changing what the stream carries. */
  readonly valueMessages?: Readonly<Record<string, StudyMessage>>;
  readonly errorMessage?: StudyMessage;
}

/** A stream the example subscribes to. Its label is a presentation message. */
export interface MarbleInput extends MarbleString {
  readonly label: StudyMessage;
  readonly hot?: boolean;
  readonly subscriptions?: string;
}

/** A stream opened for a value; its subscription places it in the diagram. */
export interface MarbleInner extends MarbleString {
  readonly label: StudyMessage;
  readonly subscriptions: string;
}

/** An asserted result, optionally read by a late subscriber. */
export interface MarbleOutput extends MarbleString {
  readonly label: StudyMessage;
  readonly subscriptions?: string;
}

/** The streams made from the example's strings, and the scheduler that runs them. */
export interface MarbleStreams {
  readonly inputs: Readonly<Record<string, Observable<unknown>>>;
  readonly inner: Readonly<Record<string, Observable<unknown>>>;
  readonly scheduler: TestScheduler;
}

/** One executable example; drawings and specs read the same strings and subscriptions. */
export interface MarbleExample {
  readonly inputs: Readonly<Record<string, MarbleInput>>;
  readonly inner?: Readonly<Record<string, MarbleInner>>;
  readonly operator: StudyMessage;
  readonly outputs: Readonly<Record<string, MarbleOutput>>;
  readonly run: (streams: MarbleStreams) => Readonly<Record<string, Observable<unknown>>>;
  readonly animate?: string;
  readonly moments: readonly {
    readonly label: StudyMessage;
    readonly frame: number;
  }[];
  readonly notes?: Readonly<Record<number, StudyMessage>>;
  /** Override a courier's origin with a stream id, or null for no origin. */
  readonly origins?: Readonly<Record<number, string | null>>;
  readonly caption?: StudyMessage;
  readonly parameterMessages?: Readonly<Record<string, string>>;
}

export interface MarbleModule {
  readonly example: MarbleExample;
}

const legendByRole = {
  input: { tone: 'subject', key: 'studyCommon.marbles.legend.input' },
  inner: { tone: 'other', key: 'studyCommon.marbles.legend.inner' },
  output: { tone: 'actual', key: 'studyCommon.marbles.legend.output' },
} as const;

export const marbleCaption = (example: MarbleExample, t: StudyTranslate): string =>
  studyMessage(t, example.caption ?? 'studyCommon.marbles.caption');

/** A stable description for mechanism assertions; never used as untranslated drawing prose. */
export const nameOf = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) return `Error: ${value.message}`;
  if (value === null) return 'null';
  if (Array.isArray(value)) return value.map(nameOf).join(', ');
  if (typeof value === 'object')
    return Object.entries(value)
      .filter(([, inner]) => inner !== undefined)
      .map(([key, inner]) => `${key} ${nameOf(inner)}`)
      .join(', ');
  return String(value);
};

/** Rich values require an authored message; symbols and numbers have no English payload. */
export function marbleValue(
  stream: MarbleString,
  key: string,
  value: unknown,
  t: StudyTranslate,
): string {
  const message = stream.valueMessages?.[key];
  if (message !== undefined) return studyMessage(t, message);
  if (value === undefined) return t('studyCommon.marbles.undefined');
  if (value === null) return t('studyCommon.marbles.null');
  if (typeof value === 'boolean')
    return t(value ? 'studyCommon.marbles.true' : 'studyCommon.marbles.false');
  if (typeof value === 'number' || (typeof value === 'string' && value.length === 1))
    return t('studyCommon.marbles.value', { value });
  throw new Error(`No display message for marble ${key}.`);
}

export const marbleError = (stream: MarbleString, t: StudyTranslate): string =>
  studyMessage(t, stream.errorMessage ?? 'studyCommon.marbles.error');

/** Parse with the same one-character frame factor as TestScheduler.run(). */
function asRunMode<T>(parse: () => T): T {
  const factor = TestScheduler.frameTimeFactor;
  TestScheduler.frameTimeFactor = 1;
  try {
    return parse();
  } finally {
    TestScheduler.frameTimeFactor = factor;
  }
}

/** Read the scheduler's letters and payloads together, keeping subscription boundaries intact. */
function eventsOf(
  stream: MarbleString,
  from: number,
  until: number,
  heard: (frame: number) => boolean,
  t: StudyTranslate,
): readonly MarbleEvent[] {
  const letters = asRunMode(() =>
    TestScheduler.parseMarbles(stream.marbles, undefined, undefined, false, true),
  );
  const values = asRunMode(() =>
    TestScheduler.parseMarbles(stream.marbles, stream.values, stream.error, false, true),
  );
  return letters.map(({ frame, notification }, index) => {
    const at = frame + from;
    const rich = values[index].notification;
    const event = (): Pick<MarbleEvent, 'kind' | 'key' | 'value'> => {
      if (notification.kind === 'N') {
        const key = String(notification.value);
        return {
          kind: 'next',
          key,
          value: marbleValue(stream, key, rich.kind === 'N' ? rich.value : notification.value, t),
        };
      }
      if (notification.kind === 'E')
        return { kind: 'error', key: '#', value: marbleError(stream, t) };
      return {
        kind: 'complete',
        key: '|',
        value: t('studyCommon.marbles.complete'),
      };
    };
    return { frame: at, ...event(), delivered: heard(at) && at <= until };
  });
}

const subscription = (marbles: string | undefined) =>
  marbles === undefined
    ? null
    : asRunMode(() => TestScheduler.parseMarblesAsSubscriptions(marbles, true));

const cutOff = (events: readonly MarbleEvent[], until: number) =>
  until < Infinity && !events.some(({ kind, frame }) => kind !== 'next' && frame === until);

const inputLines = (example: MarbleExample, t: StudyTranslate): readonly MarbleLine[] =>
  Object.entries(example.inputs).map(([id, input]) => {
    const log = subscription(input.subscriptions);
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(input, 0, until, (frame) => frame >= 0, t);
    return {
      id,
      label: studyMessage(t, input.label),
      role: 'input',
      marbles: input.marbles,
      events,
      subscribedAt: input.hot ? 0 : log?.subscribedFrame,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });

const innerLines = (example: MarbleExample, t: StudyTranslate): readonly MarbleLine[] =>
  Object.entries(example.inner ?? {}).map(([id, stream]) => {
    const log = subscription(stream.subscriptions);
    const from = log?.subscribedFrame ?? 0;
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(stream, from, until, () => true, t);
    return {
      id,
      label: studyMessage(t, stream.label),
      role: 'inner',
      marbles: stream.marbles,
      events,
      subscribedAt: from,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });

/** Prefer an inner emission, then an input, then a completion or error at this frame. */
function originAt(
  example: MarbleExample,
  sources: readonly MarbleLine[],
  frame: number,
): string | undefined {
  const named = example.origins?.[frame];
  if (named === null) return undefined;
  if (named !== undefined) {
    const line = sources.find(({ id }) => id === named);
    if (!line) throw new Error(`origins names ${named}, which is no input or inner stream`);
    return line.id;
  }
  const at = (kinds: readonly MarbleEvent['kind'][]) =>
    sources.find(({ events }) =>
      events.some(
        (event) => event.frame === frame && event.delivered && kinds.includes(event.kind),
      ),
    );
  return (at(['next']) ?? at(['error', 'complete']))?.id;
}

const outputLines = (
  example: MarbleExample,
  sources: readonly MarbleLine[],
  t: StudyTranslate,
): readonly MarbleLine[] =>
  Object.entries(example.outputs).map(([id, output]) => {
    const log = subscription(output.subscriptions);
    const from = log?.subscribedFrame ?? 0;
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(output, 0, until, (frame) => frame >= from, t).map((event) => {
      const origin =
        event.kind === 'next' && event.delivered
          ? originAt(example, sources, event.frame)
          : undefined;
      return origin === undefined ? event : { ...event, from: origin };
    });
    return {
      id,
      label: studyMessage(t, output.label),
      role: 'output',
      marbles: output.marbles,
      events,
      subscribedAt: log ? from : undefined,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });

function linesOf(example: MarbleExample, t: StudyTranslate): readonly MarbleLine[] {
  const inputs = inputLines(example, t);
  const inner = innerLines(example, t);
  const lines = [...inputs, ...inner, ...outputLines(example, [...inner, ...inputs], t)];
  const ids = new Set<string>();
  for (const { id } of lines) {
    if (ids.has(id)) throw new Error(`two lines share the id ${id}`);
    ids.add(id);
  }
  return lines;
}

/** Only received events enter the narration, in drawing order. */
function sentenceOf(lines: readonly MarbleLine[], frame: number, t: StudyTranslate): string {
  const parts: string[] = [];
  for (const line of lines) {
    const { label } = line;
    if (line.role === 'inner' && line.subscribedAt === frame)
      parts.push(t('studyCommon.marbles.opened', { label }));
    if (line.role === 'output' && line.subscribedAt === frame && frame > 0)
      parts.push(t('studyCommon.marbles.subscribed', { label }));
    for (const event of line.events.filter((event) => event.frame === frame && event.delivered)) {
      const { key, value } = event;
      if (event.kind === 'complete') parts.push(t('studyCommon.marbles.completed', { label }));
      else if (event.kind === 'error')
        parts.push(t('studyCommon.marbles.errored', { label, value }));
      else
        parts.push(
          t(key === value ? 'studyCommon.marbles.emitted' : 'studyCommon.marbles.emittedValue', {
            label,
            key,
            value,
          }),
        );
    }
    if (line.cancelled && line.unsubscribedAt === frame)
      parts.push(t('studyCommon.marbles.cutOff', { label }));
  }
  if (!parts.length)
    return t(frame === 0 ? 'studyCommon.marbles.nothingAtStart' : 'studyCommon.marbles.nothingNew');
  return parts.join(t('studyCommon.marbles.sentenceSeparator'));
}

function historyOf(line: MarbleLine, frame: number, t: StudyTranslate): string {
  const past = line.events.filter((event) => event.frame <= frame && event.delivered);
  const told = past.map((event) =>
    t(
      event.kind === 'next'
        ? 'studyCommon.marbles.valueAt'
        : event.kind === 'complete'
          ? 'studyCommon.marbles.completeAt'
          : 'studyCommon.marbles.errorAt',
      { key: event.key, frame: event.frame },
    ),
  );
  const opened =
    line.role === 'inner' && line.subscribedAt !== undefined && line.subscribedAt <= frame
      ? [t('studyCommon.marbles.openedAt', { frame: line.subscribedAt })]
      : [];
  const cut =
    line.cancelled && line.unsubscribedAt !== undefined && line.unsubscribedAt <= frame
      ? [t('studyCommon.marbles.cutOffAt', { frame: line.unsubscribedAt })]
      : [];
  const story = [...opened, ...told, ...cut];
  return t('studyCommon.marbles.lineStory', {
    label: line.label,
    story: story.length
      ? story.join(t('studyCommon.marbles.listSeparator'))
      : t('studyCommon.marbles.nothingYet'),
  });
}

const workedOf = (
  lines: readonly MarbleLine[],
  frame: number,
  t: StudyTranslate,
): StudyWorkedStep => ({
  title: t('studyCommon.marbles.frame', { frame }),
  lines: lines.map((line) => historyOf(line, frame, t)),
});

function deliveredSoFar(lines: readonly MarbleLine[], frame: number, t: StudyTranslate): string {
  const listOf = (events: readonly MarbleEvent[]) =>
    events
      .filter((event) => event.kind === 'next' && event.delivered && event.frame <= frame)
      .map(({ key, value }) =>
        key === value ? value : t('studyCommon.marbles.keyValue', { key, value }),
      )
      .join(t('studyCommon.marbles.listSeparator')) || t('studyCommon.marbles.nothingDelivered');
  const outputs = lines.filter(({ role }) => role === 'output');
  return outputs.length > 1
    ? outputs
        .map(({ label, events }) =>
          t('studyCommon.marbles.deliveredBy', {
            label,
            values: listOf(events),
          }),
        )
        .join(t('studyCommon.marbles.sentenceSeparator'))
    : listOf(outputs[0]?.events ?? []);
}

/** Last received, opened, cut-off or explicitly named frame. */
const lastFrameOf = (example: MarbleExample, lines: readonly MarbleLine[]): number =>
  Math.max(
    0,
    ...lines.flatMap(({ events, subscribedAt, unsubscribedAt }) => [
      ...events.filter(({ delivered }) => delivered).map(({ frame }) => frame),
      ...(subscribedAt === undefined ? [] : [subscribedAt]),
      ...(unsubscribedAt === undefined ? [] : [unsubscribedAt]),
    ]),
    ...example.moments.map(({ frame }) => frame),
  );

/** The model translates at the boundary; no translated word enters the pipeline. */
export function marbleModel(
  example: MarbleExample,
  parameters: StudyParameters,
  t: StudyTranslate,
): MarblesStudyModel {
  const lines = linesOf(example, t);
  const lastFrame = lastFrameOf(example, lines);
  const extra = studyParameterValues(parameters, t, example.parameterMessages);
  const frames: readonly MarbleFrame[] = Array.from({ length: lastFrame + 1 }, (_, frame) => {
    const now = sentenceOf(lines, frame, t);
    return {
      frame,
      seconds: frame * secondsPerFrame,
      values: {
        ...extra,
        frame: String(frame),
        now,
        delivered: deliveredSoFar(lines, frame, t),
      },
      note:
        example.notes?.[frame] === undefined
          ? t('studyCommon.marbles.note', { frame, now })
          : studyMessage(t, example.notes[frame]),
      worked: workedOf(lines, frame, t),
    };
  });
  const moments: readonly StudyMoment[] = example.moments.map(({ label, frame }) => ({
    label: studyMessage(t, label),
    step: Math.max(0, Math.min(lastFrame, frame)),
  }));
  const legend: readonly StudyLegendEntry[] = (['input', 'inner', 'output'] as const)
    .filter((role) => lines.some((line) => line.role === role))
    .map((role) => ({
      tone: legendByRole[role].tone,
      label: t(legendByRole[role].key),
    }));
  return {
    family: 'marbles',
    marbles: {
      lines,
      operator: studyMessage(t, example.operator),
      lastFrame,
      frames,
    },
    initialStep: lastFrame,
    moments,
    legend,
    caption: t('studyCommon.marbles.captionWithOpening', {
      caption: marbleCaption(example, t),
      opening: t('studyCommon.marbles.opening'),
    }),
  };
}
