import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/** The step at which the worker's machine crashes; the record's parameter names the same step. */
export const crashStep = 5;

/**
 * One command handed from a host to a worker on another machine, through a store on each side:
 * the host's outbox and the worker's inbox. Each store keeps its copy until the next holder has
 * confirmed it, so the worker's crash before its receipt loses nothing and the command is
 * delivered again. The idea is durable storage and crashes, not a stream of values, so the steps
 * are written out here rather than run.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'host', label: 'Host', stage: 0 },
    { id: 'outbox', label: 'Outbox', stage: 1, kind: 'channel', tone: 'subject' },
    { id: 'inbox', label: 'Inbox', stage: 2, kind: 'channel', tone: 'subject' },
    { id: 'worker', label: 'Worker', stage: 3 },
  ],
  links: [
    { id: 'send', from: 'host', to: 'outbox' },
    { id: 'forward', from: 'outbox', to: 'inbox' },
    { id: 'saved', from: 'inbox', to: 'outbox' },
    { id: 'deliver', from: 'inbox', to: 'worker' },
    { id: 'receipt', from: 'worker', to: 'inbox' },
  ],
  messages: {
    c: { key: 'c', content: 'command 7' },
    s: { key: 's', content: 'saved 7' },
    r: { key: 'r', content: 'receipt 7' },
  },
  start: {
    states: {
      host: 'about to send command 7',
      outbox: 'empty',
      inbox: 'empty',
      worker: 'idle',
    },
    note: 'The host has decided to send command 7 to the worker. The command exists only in the host’s memory, and nothing is on any disk yet.',
  },
  steps: [
    {
      moves: [{ message: 'c', link: 'send' }],
      states: { host: 'send returned', outbox: 'holds c on disk' },
      held: { outbox: ['c'] },
      note: 'The host writes command 7 to its outbox and syncs the disk, and only then does its send return. From here on a copy is always on some disk.',
    },
    {
      moves: [{ message: 'c', link: 'forward' }],
      states: { outbox: 'keeps c until inbox confirms', inbox: 'holds c on disk' },
      held: { inbox: ['c'] },
      note: 'The outbox forwards a copy to the worker’s inbox, which writes it to its own disk. The outbox keeps its copy: it has no word yet that the inbox saved it.',
    },
    {
      moves: [{ message: 's', link: 'saved' }],
      states: { host: 'send done; outbox let go', outbox: 'empty: the inbox confirmed' },
      held: { outbox: [] },
      note: 'The inbox confirms that command 7 is on its disk, and only then does the outbox delete its copy. The inbox now holds the only copy.',
    },
    {
      moves: [{ message: 'c', link: 'deliver' }],
      states: { inbox: 'keeps c until the receipt', worker: 'working on command 7' },
      held: { worker: ['c'] },
      note: 'The inbox hands command 7 to the worker, which starts on it. The inbox keeps its copy until the worker sends a receipt.',
    },
    {
      states: { inbox: 'machine down; c safe on disk', worker: 'crashed: memory lost' },
      held: { worker: [] },
      note: 'The worker’s machine crashes before the worker has sent a receipt. The command the worker held in memory is gone; the inbox’s copy is on disk and untouched.',
    },
    {
      states: { inbox: 'back up, still holds c', worker: 'restarted, idle' },
      note: 'The machine restarts. The inbox reads its disk and finds command 7 still there, never acknowledged.',
    },
    {
      moves: [{ message: 'c', link: 'deliver' }],
      states: { inbox: 'sent c again; still keeps it', worker: 'on command 7 a second time' },
      held: { worker: ['c'] },
      note: 'The inbox delivers command 7 again. Whatever the worker did before the crash, it now sees the same command a second time, and its id is how it can tell.',
    },
    {
      moves: [{ message: 'r', link: 'receipt' }],
      states: { inbox: 'empty: the receipt arrived', worker: 'done; receipt sent' },
      held: { inbox: [], worker: [] },
      note: 'The worker finishes and sends a receipt. Only now does the inbox delete its copy: command 7 has been delivered, and no disk needs to keep it.',
    },
  ],
  moments: [
    { label: 'Saved', step: 1 },
    { label: 'Handed on', step: 3 },
    { label: 'Crash', step: crashStep },
    { label: 'Delivered again', step: 7 },
    { label: 'Receipt', step: 8 },
  ],
  caption:
    'Each token is one message: c is command 7 itself, s is the Inbox’s word to the Outbox that it has saved c, and r is the Worker’s receipt for c. The Host decides to send the command, and the Outbox is the store on the Host’s disk. The Inbox is the store on the Worker’s machine, and the Worker carries the command out. The two stores are drawn as pipes because they are channels on disk, so a token they hold survives a crash; a token the Worker holds is only in its memory. The words in a box say what that box is doing or holding. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.',
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
