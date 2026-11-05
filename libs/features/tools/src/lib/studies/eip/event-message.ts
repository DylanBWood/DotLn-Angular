import { type FlowExample, flowModel } from '../flow';
import type { StudyMessage } from '../study-message';
import type { StudyModelFunction } from '../study-model';

const verifiedAt = 10 * 60;
const reviewedAt = verifiedAt + 12;
const firstReadAt = verifiedAt + 5;
const lastReadAt = verifiedAt + 30;
const staleAfter = 20;

const clockTime = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** The sweep reads numeric clock data; its state describes the resulting age and judgment. */
export function sweepState(now: number, announced: number, threshold: number): StudyMessage {
  const age = now - announced;
  const time = clockTime(now);
  return {
    key: 'studyEip.event-message.model.sweepState',
    params: { time, age },
    messages: {
      status:
        age >= threshold
          ? 'studyEip.event-message.model.stale'
          : 'studyEip.event-message.model.fresh',
    },
  };
}

/**
 * Order 41 passes verification at 10:00 and moves to final review at 10:12. Each change is
 * announced as it happens: appended to an event store that two watchers read, then written to the
 * order's beacon, which keeps only the latest announcement and is read by a sweep that judges its
 * age against a 20-minute threshold. The second beacon write fails, so the sweep at 10:30 finds an
 * old announcement and labels it stale. The flow is written step by step: an event is a kind of
 * message, not a transformation of a stream, so there is nothing here to run.
 */
export const example: FlowExample = {
  nodes: [
    {
      id: 'lifecycle',
      label: 'studyEip.event-message.model.example.nodes.0.label',
      stage: 0,
    },
    {
      id: 'store',
      label: 'studyEip.event-message.model.example.nodes.1.label',
      stage: 1,
      kind: 'channel',
    },
    {
      id: 'beacon',
      label: 'studyEip.event-message.model.example.nodes.2.label',
      stage: 1,
      row: 1,
      kind: 'channel',
      tone: 'subject',
    },
    {
      id: 'quality',
      label: 'studyEip.event-message.model.example.nodes.3.label',
      stage: 2,
    },
    {
      id: 'intent',
      label: 'studyEip.event-message.model.example.nodes.4.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'sweep',
      label: 'studyEip.event-message.model.example.nodes.5.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    { id: 'append', from: 'lifecycle', to: 'store' },
    { id: 'emit', from: 'lifecycle', to: 'beacon' },
    { id: 'to-quality', from: 'store', to: 'quality' },
    { id: 'to-intent', from: 'store', to: 'intent' },
    { id: 'read', from: 'beacon', to: 'sweep' },
  ],
  // One letter for each piece of news, so the same news reads the same on both channels.
  messages: {
    v: {
      key: 'v',
      content: {
        key: 'studyEip.event-message.model.example.messages.v.content',
        params: { time: clockTime(verifiedAt) },
      },
    },
    r: {
      key: 'r',
      content: {
        key: 'studyEip.event-message.model.example.messages.r.content',
        params: { time: clockTime(reviewedAt) },
      },
    },
  },
  start: {
    states: {
      lifecycle: 'studyEip.event-message.model.example.start.states.lifecycle',
      store: 'studyEip.event-message.model.example.start.states.store',
      beacon: 'studyEip.event-message.model.example.start.states.beacon',
      sweep: {
        key: 'studyEip.event-message.model.example.start.states.sweep',
        params: { threshold: staleAfter },
      },
    },
    note: 'studyEip.event-message.model.example.start.note',
  },
  steps: [
    {
      moves: [{ message: 'v', link: 'append' }],
      states: {
        lifecycle: 'studyEip.event-message.model.example.steps.0.states.lifecycle',
        store: 'studyEip.event-message.model.example.steps.0.states.store',
      },
      held: { store: ['v'] },
      note: 'studyEip.event-message.model.example.steps.0.note',
    },
    {
      moves: [{ message: 'v', link: 'emit' }],
      states: {
        beacon: 'studyEip.event-message.model.example.steps.1.states.beacon',
      },
      held: { beacon: ['v'] },
      note: 'studyEip.event-message.model.example.steps.1.note',
    },
    {
      moves: [
        { message: 'v', link: 'to-quality' },
        { message: 'v', link: 'to-intent' },
      ],
      states: {
        quality: 'studyEip.event-message.model.example.steps.2.states.quality',
        intent: 'studyEip.event-message.model.example.steps.2.states.intent',
      },
      note: 'studyEip.event-message.model.example.steps.2.note',
    },
    {
      moves: [{ message: 'v', link: 'read' }],
      states: {
        sweep: sweepState(firstReadAt, verifiedAt, staleAfter),
      },
      note: 'studyEip.event-message.model.example.steps.3.note',
    },
    {
      moves: [{ message: 'r', link: 'append' }],
      states: {
        lifecycle: 'studyEip.event-message.model.example.steps.4.states.lifecycle',
        store: 'studyEip.event-message.model.example.steps.4.states.store',
      },
      held: { store: ['v', 'r'] },
      note: 'studyEip.event-message.model.example.steps.4.note',
    },
    {
      states: {
        lifecycle: 'studyEip.event-message.model.example.steps.5.states.lifecycle',
      },
      note: 'studyEip.event-message.model.example.steps.5.note',
    },
    {
      moves: [
        { message: 'r', link: 'to-quality' },
        { message: 'r', link: 'to-intent' },
      ],
      states: {
        quality: 'studyEip.event-message.model.example.steps.6.states.quality',
        intent: 'studyEip.event-message.model.example.steps.6.states.intent',
      },
      note: 'studyEip.event-message.model.example.steps.6.note',
    },
    {
      moves: [{ message: 'v', link: 'read' }],
      states: {
        sweep: sweepState(lastReadAt, verifiedAt, staleAfter),
      },
      note: {
        key: 'studyEip.event-message.model.example.steps.7.note',
        params: { threshold: staleAfter },
      },
    },
  ],
  moments: [
    { label: 'studyEip.event-message.model.example.moments.0.label', step: 1 },
    { label: 'studyEip.event-message.model.example.moments.1.label', step: 3 },
    { label: 'studyEip.event-message.model.example.moments.2.label', step: 4 },
    { label: 'studyEip.event-message.model.example.moments.3.label', step: 6 },
    { label: 'studyEip.event-message.model.example.moments.4.label', step: 8 },
  ],
  caption: 'studyEip.event-message.model.example.caption',
};

export const model: StudyModelFunction = (parameters, t) => flowModel(example, parameters, t);
