import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

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
    { id: 'lifecycle', label: 'Lifecycle', stage: 0 },
    { id: 'store', label: 'Event store', stage: 1, kind: 'channel' },
    { id: 'beacon', label: 'Beacon', stage: 1, row: 1, kind: 'channel', tone: 'subject' },
    { id: 'quality', label: 'Quality watcher', stage: 2 },
    { id: 'intent', label: 'Intent watcher', stage: 2, row: 1 },
    { id: 'sweep', label: 'Sweep', stage: 2, row: 2 },
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
    v: { key: 'v', content: 'verified, pass, at 10:00' },
    r: { key: 'r', content: 'final review, at 10:12' },
  },
  start: {
    states: {
      lifecycle: 'order 41 is verifying',
      store: 'earlier entries kept',
      beacon: 'says verifying, 09:40',
      sweep: 'threshold: 20 minutes',
    },
    note: 'Nothing has moved yet: order 41 is still being verified.',
  },
  steps: [
    {
      moves: [{ message: 'v', link: 'append' }],
      states: { lifecycle: 'verification passed', store: 'has the 10:00 entry' },
      held: { store: ['v'] },
      note: 'At 10:00 the verification passes, and the lifecycle sends v, the news of it, to the event store as it happens. v names no reader and asks nothing of anyone.',
    },
    {
      moves: [{ message: 'v', link: 'emit' }],
      states: { beacon: 'says verified, 10:00' },
      held: { beacon: ['v'] },
      note: 'Because of that entry, the lifecycle also writes v to the order’s beacon, replacing what the beacon said before.',
    },
    {
      moves: [
        { message: 'v', link: 'to-quality' },
        { message: 'v', link: 'to-intent' },
      ],
      states: { quality: 'notes a pass for 41', intent: 'expects final review next' },
      note: 'The event store hands v to both watchers. Each draws its own conclusion; neither was told what to do, and the lifecycle knows of neither.',
    },
    {
      moves: [{ message: 'v', link: 'read' }],
      states: { sweep: '10:05: fresh, 5 min old' },
      note: 'At 10:05 the sweep reads v from the beacon. The news is under the threshold, so the sweep labels it fresh; reading it leaves it on the beacon.',
    },
    {
      moves: [{ message: 'r', link: 'append' }],
      states: { lifecycle: 'final review began', store: 'has 10:00 and 10:12' },
      held: { store: ['v', 'r'] },
      note: 'At 10:12 the order moves to final review, and the lifecycle sends r, the news of it, to the event store.',
    },
    {
      states: { lifecycle: 'beacon write failed' },
      note: 'The lifecycle tries to write r to the beacon, but the write fails with a warning. Nothing reaches the beacon, so it still holds v.',
    },
    {
      moves: [
        { message: 'r', link: 'to-quality' },
        { message: 'r', link: 'to-intent' },
      ],
      states: { quality: 'notes review began', intent: 'awaits the review' },
      note: 'The event store hands r to both watchers, so anyone reading the event store sees the order in final review.',
    },
    {
      moves: [{ message: 'v', link: 'read' }],
      states: { sweep: '10:30: stale, 30 min old' },
      note: 'At 10:30 the sweep reads the beacon again and gets v. It still says verified, but it is past the 20-minute threshold, so the sweep labels it stale instead of reporting a phase the order has left.',
    },
  ],
  moments: [
    { label: 'Announced', step: 1 },
    { label: 'Each reacts', step: 3 },
    { label: 'Fresh', step: 4 },
    { label: 'Beacon missed', step: 6 },
    { label: 'Stale', step: 8 },
  ],
  caption:
    'Each box is one part of the example. The Lifecycle, the part of DotLn that records each step of a work order, announces every change to order 41. The Event store pipe keeps every announcement for whoever reads it, and the Quality watcher and Intent watcher each read it and keep their own account. The event messages, v and r, are what the pattern is about; Beacon, the pipe with the bold name, is the channel where their age is judged: it keeps only the latest announcement, and the Sweep, an agent that looks at it now and then, judges how old that is. A token is a message: v is the news that order 41 was verified at 10:00, and r is the news that it moved to final review at 10:12; the same letter in two boxes is the same news on two channels. A token is green while it moves and outlined inside the box that holds it; a box a message leaves or reaches is outlined in green, and the words inside each box say what it knows or is doing. Reading the beacon leaves its token in place. Step forward to move the messages on.',
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
