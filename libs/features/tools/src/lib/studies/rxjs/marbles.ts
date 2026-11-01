import type { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import type { StudyParameters } from '@dotln-angular/models';

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

/** A marble string in the TestScheduler's syntax, with the values its letters stand for. */
export interface MarbleString {
  readonly marbles: string;
  readonly values?: Readonly<Record<string, unknown>>;
  /** What `#` throws. */
  readonly error?: unknown;
}

/** A stream the example subscribes to. */
export interface MarbleInput extends MarbleString {
  readonly label: string;
  /** A hot source emits whether or not anything listens; `^` marks where the example subscribes. */
  readonly hot?: boolean;
  /** The subscription marbles the spec asserts on this input, where the study shows them. */
  readonly subscriptions?: string;
}

/**
 * A stream an operator opens for one value. Its subscription marbles place it in the diagram, from
 * the `^` where the operator subscribes to the `!` where it is cut off, and the spec asserts them.
 */
export interface MarbleInner extends MarbleString {
  readonly label: string;
  readonly subscriptions: string;
}

/** A result the spec asserts. */
export interface MarbleOutput extends MarbleString {
  readonly label: string;
  /**
   * When the spec subscribes to this output, as subscription marbles (`---^` subscribes at frame
   * 3); the whole diagram from frame 0 when absent. A late subscriber to a shared source shows what
   * it missed this way, and the drawing starts its lane where it subscribes.
   */
  readonly subscriptions?: string;
}

/** The observables the spec makes from the example's strings, and the scheduler running them. */
export interface MarbleStreams {
  readonly inputs: Readonly<Record<string, Observable<unknown>>>;
  readonly inner: Readonly<Record<string, Observable<unknown>>>;
  readonly scheduler: TestScheduler;
}

/**
 * An executable marble example. The module exports one; its spec runs `run` under the
 * TestScheduler against these strings, and the drawing reads the same strings, so the two
 * cannot disagree.
 */
export interface MarbleExample {
  readonly inputs: Readonly<Record<string, MarbleInput>>;
  readonly inner?: Readonly<Record<string, MarbleInner>>;
  /** The operator as the diagram names it, in one short line. */
  readonly operator: string;
  readonly outputs: Readonly<Record<string, MarbleOutput>>;
  /** Builds the pipeline the spec runs. The record's RxJS code is this function's body. */
  readonly run: (streams: MarbleStreams) => Readonly<Record<string, Observable<unknown>>>;
  /**
   * The frames the browser paints, as marbles, for an example on the animation frame scheduler;
   * the spec hands them to the TestScheduler's `animate`.
   */
  readonly animate?: string;
  /** The moments worth naming, by frame. */
  readonly moments: readonly { readonly label: string; readonly frame: number }[];
  /** A sentence for a frame, in place of the one written from its events. */
  readonly notes?: Readonly<Record<number, string>>;
  /**
   * Where an output value of a frame comes from, for the drawing's courier, when the rule below
   * would pick wrongly: the id of an input or inner stream, or null for a value that rides from
   * nowhere, such as one a scheduler held back. Without an entry, the courier leaves the inner
   * stream, else the input, that emits at that frame, or else the one that errors or completes.
   */
  readonly origins?: Readonly<Record<number, string | null>>;
  /** How to read the drawing, before the family's sentence on how it opens; default when absent. */
  readonly caption?: string;
}

/** A marble module exports its example beside the model the drawing reads. */
export interface MarbleModule {
  readonly example: MarbleExample;
}

const defaultCaption =
  'Time runs in frames. A circle is an emission, with its letter; a bar is completion; a cross is an error. A lane that ends in a small hollow ring is where the operator stopped listening to that stream, and what it would have delivered afterwards is not drawn.';
/** Every marble diagram's caption ends with how it opens and fills in. */
const openingSentence =
  'The drawing opens at the end of the run, and an output lane shows only what has been emitted by the selected frame: step back, or press Play where it is offered, to watch each output value arrive from the emission it comes from.';

/** What each tone means; a diagram's legend lists only the kinds of line it draws. */
const legendByRole: Readonly<Record<MarbleLine['role'], StudyLegendEntry>> = {
  input: { tone: 'subject', label: 'Black · an input stream' },
  inner: { tone: 'other', label: 'Grey · a stream the operator opened' },
  output: { tone: 'actual', label: 'Green · the output' },
};

/** A value as the text equivalent names it; the spec names what it received the same way. */
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

/**
 * Parses as the TestScheduler's run mode does, where one character is one frame. Outside a run
 * the scheduler's static factor is ten frames a character, so it is set to one for the parse and
 * put back, as run() itself does.
 */
function asRunMode<T>(parse: () => T): T {
  const factor = TestScheduler.frameTimeFactor;
  TestScheduler.frameTimeFactor = 1;
  try {
    return parse();
  } finally {
    TestScheduler.frameTimeFactor = factor;
  }
}

/**
 * Reads a marble string as the TestScheduler reads it in run mode, so a frame here is a frame
 * there: the same parser, once with the letters and once with their values. An event is heard up
 * to and including the frame the subscription ends at, since what ends it is an event of that
 * frame; after that, nothing receives the stream.
 */
function eventsOf(
  stream: MarbleString,
  from: number,
  until: number,
  heard: (frame: number) => boolean,
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
    const told = (): Pick<MarbleEvent, 'kind' | 'key' | 'value'> => {
      if (notification.kind === 'N')
        return {
          kind: 'next',
          key: String(notification.value),
          value: nameOf(rich.kind === 'N' ? rich.value : notification.value),
        };
      if (notification.kind === 'E')
        return { kind: 'error', key: '#', value: nameOf(rich.kind === 'E' ? rich.error : 'error') };
      return { kind: 'complete', key: '|', value: 'complete' };
    };
    return { frame: at, ...told(), delivered: heard(at) && at <= until };
  });
}

const subscription = (marbles: string | undefined) =>
  marbles === undefined
    ? null
    : asRunMode(() => TestScheduler.parseMarblesAsSubscriptions(marbles, true));

/** True when a subscription ended before its stream was done: something was cut off. */
const cutOff = (events: readonly MarbleEvent[], until: number) =>
  until < Infinity && !events.some(({ kind, frame }) => kind !== 'next' && frame === until);

const linesOf = (example: MarbleExample): readonly MarbleLine[] => {
  const inputs = Object.entries(example.inputs).map(([id, input]): MarbleLine => {
    const log = subscription(input.subscriptions);
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(input, 0, until, (frame) => frame >= 0);
    return {
      id,
      label: input.label,
      role: 'input',
      marbles: input.marbles,
      events,
      subscribedAt: input.hot ? 0 : log?.subscribedFrame,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });
  const inner = Object.entries(example.inner ?? {}).map(([id, stream]): MarbleLine => {
    const log = subscription(stream.subscriptions);
    const from = log?.subscribedFrame ?? 0;
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(stream, from, until, () => true);
    return {
      id,
      label: stream.label,
      role: 'inner',
      marbles: stream.marbles,
      events,
      subscribedAt: from,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });
  // The lane an output value of a frame rides down from: the example's word, or the inner stream,
  // else the input, that emits at that frame, or else the one that errors or completes there.
  const sources = [...inner, ...inputs];
  const originOf = (frame: number): string | undefined => {
    const named = example.origins?.[frame];
    if (named === null) return undefined;
    if (named !== undefined) {
      const line = sources.find(({ id }) => id === named);
      if (!line) throw new Error(`origins names ${named}, which is no input or inner stream`);
      return line.label;
    }
    const at = (kinds: readonly MarbleEvent['kind'][]) =>
      sources.find(({ events }) =>
        events.some(
          (event) => event.frame === frame && event.delivered && kinds.includes(event.kind),
        ),
      );
    return (at(['next']) ?? at(['error', 'complete']))?.label;
  };
  const outputs = Object.entries(example.outputs).map(([id, output]): MarbleLine => {
    const log = subscription(output.subscriptions);
    const from = log?.subscribedFrame ?? 0;
    const until = log?.unsubscribedFrame ?? Infinity;
    const events = eventsOf(output, 0, until, (frame) => frame >= from).map((event) => {
      const origin = event.kind === 'next' && event.delivered ? originOf(event.frame) : undefined;
      return origin === undefined ? event : { ...event, from: origin };
    });
    return {
      id,
      label: output.label,
      role: 'output',
      marbles: output.marbles,
      events,
      subscribedAt: log ? from : undefined,
      unsubscribedAt: until < Infinity ? until : undefined,
      cancelled: cutOff(events, until),
    };
  });
  const lines = [...inputs, ...inner, ...outputs];
  // The drawing finds a value's origin lane by label, so two lines cannot share one.
  const labels = lines.map(({ label }) => label);
  const repeated = labels.find((label, index) => labels.indexOf(label) !== index);
  if (repeated !== undefined) throw new Error(`two lines share the label ${repeated}`);
  return lines;
};

/**
 * One sentence on what a frame's events do, in the order the lines are drawn. A value nothing
 * receives is not an event of the diagram: the drawing leaves it out, and so does the sentence.
 */
function sentenceOf(lines: readonly MarbleLine[], frame: number): string {
  const parts: string[] = [];
  for (const line of lines) {
    if (line.role === 'inner' && line.subscribedAt === frame) parts.push(`${line.label} is opened`);
    if (line.role === 'output' && line.subscribedAt === frame && frame > 0)
      parts.push(`${line.label} subscribes`);
    for (const event of line.events.filter((event) => event.frame === frame && event.delivered)) {
      if (event.kind === 'complete') parts.push(`${line.label} completes`);
      else if (event.kind === 'error') parts.push(`${line.label} errors with ${event.value}`);
      else if (event.key === event.value) parts.push(`${line.label} emits ${event.key}`);
      else parts.push(`${line.label} emits ${event.key} (${event.value})`);
    }
    if (line.cancelled && line.unsubscribedAt === frame) parts.push(`${line.label} is cut off`);
  }
  if (parts.length === 0) return frame === 0 ? 'nothing has happened yet' : 'nothing new happens';
  return parts.join('; ');
}

/** What each line has done so far, as the worked step lists it. */
function workedOf(lines: readonly MarbleLine[], frame: number): StudyWorkedStep {
  return {
    title: `Frame ${frame}`,
    lines: lines.map((line) => {
      const past = line.events.filter((event) => event.frame <= frame && event.delivered);
      const told = past.map((event) =>
        event.kind === 'next'
          ? `${event.key} at ${event.frame}`
          : `${event.kind} at ${event.frame}`,
      );
      const opened =
        line.role === 'inner' && line.subscribedAt !== undefined && line.subscribedAt <= frame
          ? [`opened at ${line.subscribedAt}`]
          : [];
      const cut =
        line.cancelled && line.unsubscribedAt !== undefined && line.unsubscribedAt <= frame
          ? [`cut off at ${line.unsubscribedAt}`]
          : [];
      const story = [...opened, ...told, ...cut];
      return `${line.label}: ${story.length ? story.join(', ') : 'nothing yet'}`;
    }),
  };
}

/**
 * The values the output lines have delivered up to a frame, as prose lists them; with more than
 * one output, each line's values under its name, so a reader hears which output got what.
 */
const deliveredSoFar = (lines: readonly MarbleLine[], frame: number) => {
  const listOf = (events: readonly MarbleEvent[]) =>
    events
      .filter((event) => event.kind === 'next' && event.delivered && event.frame <= frame)
      .map(({ key, value }) => (key === value ? key : `${key} (${value})`))
      .join(', ') || 'nothing';
  const outputs = lines.filter(({ role }) => role === 'output');
  return outputs.length > 1
    ? outputs.map(({ label, events }) => `${label}: ${listOf(events)}`).join('; ')
    : listOf(outputs[0]?.events ?? []);
};

/**
 * The drawing's model for an executable marble example. The record's parameters are offered to
 * the prose as values, so a study may name them with `{name}` placeholders.
 */
export function marbleModel(
  example: MarbleExample,
  parameters: StudyParameters = {},
): MarblesStudyModel {
  const lines = linesOf(example);
  // Every frame of the diagram is a step, so Play and the slider run through them one by one, and
  // the last frame is the last thing received, opened or cut off.
  const lastFrame = Math.max(
    0,
    ...lines.flatMap(({ events, subscribedAt, unsubscribedAt }) => [
      ...events.filter(({ delivered }) => delivered).map(({ frame }) => frame),
      ...(subscribedAt === undefined ? [] : [subscribedAt]),
      ...(unsubscribedAt === undefined ? [] : [unsubscribedAt]),
    ]),
    ...example.moments.map(({ frame }) => frame),
    0,
  );
  const shown = Array.from({ length: lastFrame + 1 }, (_, frame) => frame);
  const stepOf = (frame: number) => Math.max(0, Math.min(lastFrame, frame));
  const parameterValues = Object.fromEntries(
    Object.entries(parameters).map(([name, value]) => [name, String(value)]),
  );
  const frames: readonly MarbleFrame[] = shown.map((frame) => {
    const now = sentenceOf(lines, frame);
    return {
      frame,
      seconds: frame * secondsPerFrame,
      values: {
        ...parameterValues,
        frame: String(frame),
        now,
        delivered: deliveredSoFar(lines, frame),
      },
      note: example.notes?.[frame] ?? `At frame ${frame}, ${now}.`,
      worked: workedOf(lines, frame),
    };
  });
  const moments: readonly StudyMoment[] = example.moments.map(({ label, frame }) => ({
    label,
    step: stepOf(frame),
  }));
  return {
    family: 'marbles',
    marbles: { lines, operator: example.operator, lastFrame, frames },
    // The drawing opens on the last frame, the whole run; Play from there runs from the first.
    initialStep: lastFrame,
    moments,
    legend: (['input', 'inner', 'output'] as const)
      .filter((role) => lines.some((line) => line.role === role))
      .map((role) => legendByRole[role]),
    caption: `${example.caption ?? defaultCaption} ${openingSentence}`,
  };
}
