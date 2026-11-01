import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * A worker takes a pending command from an outbox inside a transaction, makes one write that the
 * transaction does not cover, stages a receipt and a result entry, and crashes before it commits.
 * A second attempt does the same and commits. Nothing here runs as a stream: the point is when
 * the messaging system makes a receive and two sends visible, so the flow is written step by step,
 * and the spec beside this file asserts what each step shows.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'outbox', label: 'Outbox', stage: 0, row: 1, kind: 'channel' },
    { id: 'worker', label: 'Worker', stage: 1, row: 1, tone: 'subject' },
    { id: 'receipts', label: 'Receipts', stage: 2, row: 0, kind: 'channel' },
    { id: 'log', label: 'Event log', stage: 2, row: 1, kind: 'channel' },
    { id: 'outside', label: 'Outside store', stage: 2, row: 2 },
  ],
  links: [
    { id: 'take', from: 'outbox', to: 'worker' },
    { id: 'receipt', from: 'worker', to: 'receipts' },
    { id: 'append', from: 'worker', to: 'log' },
    { id: 'write', from: 'worker', to: 'outside' },
  ],
  messages: {
    c: { key: 'c', content: 'command 7' },
    r: { key: 'r', content: 'receipt for 7' },
    e: { key: 'e', content: 'result for 7' },
    w1: { key: '1', content: 'outside write, attempt 1' },
    w2: { key: '2', content: 'outside write, attempt 2' },
  },
  caption:
    'The boxes: the Outbox is the channel where command 7 waits to be taken; the Worker is the transactional client, which takes the command, works on it and sends inside a transaction; Receipts and Event log are the two channels it sends to; the Outside store is a store that no transaction covers. Each token is one message: c is command 7, r its receipt, e its result entry for the event log, and 1 and 2 the outside writes made by attempts 1 and 2. While a transaction is open, c shows in two boxes: the Worker has taken it, and the Outbox still keeps it, hidden from other workers, until the Worker commits. Tokens inside the Worker are staged in its open transaction and are on no channel yet. The words in a box say what that box is doing or holding. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.',
  start: {
    states: {
      outbox: 'command 7 waiting, visible',
      worker: 'idle',
      receipts: 'empty',
      log: 'empty',
      outside: 'empty',
    },
    held: { outbox: ['c'] },
    note: 'Command 7 waits in the Outbox, where any worker could take it. Nothing has been taken, and Receipts, Event log and the Outside store are empty.',
  },
  steps: [
    {
      moves: [{ message: 'c', link: 'take' }],
      states: { outbox: '7 hidden, kept until commit', worker: 'transaction 1 open, has 7' },
      held: { worker: ['c'] },
      note: 'The Worker opens transaction 1 and takes c, command 7, from the Outbox. The Outbox hides the command from other workers but keeps it, because the take is not final until the Worker commits.',
    },
    {
      moves: [{ message: 'w1', link: 'write' }],
      states: { worker: 'wrote outside, in transaction 1', outside: 'write 1 done, no undo' },
      held: { outside: ['w1'] },
      note: 'The Worker sends write 1 to the Outside store. No transaction covers that store, so the write takes effect at once, whatever later happens to transaction 1.',
    },
    {
      states: { worker: 'r and e staged in transaction 1' },
      held: { worker: ['c', 'r', 'e'] },
      note: 'The Worker sends r, its receipt, and e, its result entry, inside transaction 1. Both wait inside the Worker, staged, so Receipts and Event log are still empty.',
    },
    {
      states: { worker: 'crashed, transaction 1 rolled back', outbox: '7 visible again' },
      held: { worker: [] },
      note: 'The Worker crashes before committing, so transaction 1 rolls back: the staged r and e are thrown away and command 7 can be taken from the Outbox again. Write 1 is not undone.',
    },
    {
      moves: [{ message: 'c', link: 'take' }],
      states: { outbox: '7 hidden, kept until commit', worker: 'transaction 2 open, has 7 again' },
      held: { worker: ['c'] },
      note: 'A fresh attempt opens transaction 2 and takes c from the Outbox again. Nothing on the channels says that attempt 1 has already written to the Outside store.',
    },
    {
      moves: [{ message: 'w2', link: 'write' }],
      states: { worker: 'wrote outside again', outside: 'written twice for command 7' },
      held: { outside: ['w1', 'w2'] },
      note: 'The Worker sends write 2 to the Outside store: the same command has now been written there twice, a duplicate that no rollback could prevent.',
    },
    {
      states: { worker: 'r and e staged in transaction 2' },
      held: { worker: ['c', 'r', 'e'] },
      note: 'The Worker stages r and e again, in transaction 2. Receipts and Event log are still empty.',
    },
    {
      moves: [
        { message: 'r', link: 'receipt' },
        { message: 'e', link: 'append' },
      ],
      states: {
        worker: 'transaction 2 committed',
        outbox: '7 removed at commit',
        receipts: 'receipt for 7',
        log: 'result for 7',
      },
      held: { worker: [], outbox: [], receipts: ['r'], log: ['e'] },
      note: 'The Worker commits. At that one step r reaches Receipts, e reaches Event log and command 7 leaves the Outbox, so no reader sees one without the others.',
    },
  ],
  moments: [
    { label: 'Taken, not removed', step: 1 },
    { label: 'Staged, unseen', step: 3 },
    { label: 'Rolled back', step: 4 },
    { label: 'Written twice', step: 6 },
    { label: 'Commit', step: 8 },
  ],
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
