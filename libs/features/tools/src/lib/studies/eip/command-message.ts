import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * A kernel asks for order 41 to be verified by sending one command, which names the procedure
 * and its argument and carries the id 7, onto a dispatch channel that two sessions listen on.
 * The command waits while both are busy and goes to exactly one of them. When the answer is slow
 * the kernel sends the same command again, the other session takes the copy, and the one request
 * is carried out twice. The flow is written step by step: a command is a kind of message, not a
 * transformation of a stream, so there is nothing here to run.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'kernel', label: 'Kernel', stage: 0 },
    { id: 'dispatch', label: 'Dispatch', stage: 1, kind: 'channel', tone: 'subject' },
    { id: 'sessionA', label: 'Session A', stage: 2 },
    { id: 'sessionB', label: 'Session B', stage: 2, row: 1 },
    { id: 'store', label: 'Event store', stage: 3 },
  ],
  links: [
    { id: 'send', from: 'kernel', to: 'dispatch' },
    { id: 'to-a', from: 'dispatch', to: 'sessionA' },
    { id: 'to-b', from: 'dispatch', to: 'sessionB' },
    { id: 'a-result', from: 'sessionA', to: 'store' },
    { id: 'b-result', from: 'sessionB', to: 'store' },
  ],
  // The command is drawn as its id, so its copy looks exactly like it; each result is drawn as the
  // letter of the session that sends it.
  messages: {
    '7': { key: '7', content: 'verify order 41, id 7' },
    b: { key: 'b', content: 'result for 7 from B' },
    a: { key: 'a', content: 'result for 7 from A' },
  },
  start: {
    states: {
      kernel: 'wants order 41 verified',
      dispatch: 'empty',
      sessionA: 'busy on order 39',
      sessionB: 'busy on order 40',
      store: 'no result for 7',
    },
    note: 'Nothing has moved yet, and neither session is free to take new work.',
  },
  steps: [
    {
      moves: [{ message: '7', link: 'send' }],
      states: { kernel: 'sent 7; not waiting', dispatch: 'holds 7 for one taker' },
      held: { dispatch: ['7'] },
      note: 'The kernel sends command 7, verify order 41, to the dispatch channel, and goes on with other work instead of waiting for an answer.',
    },
    {
      states: { sessionA: 'free, listening', sessionB: 'free, listening' },
      note: 'Both sessions finish their earlier orders and start listening. Command 7 has waited in the channel for them; a direct call at step 1 would have found nobody free to answer.',
    },
    {
      moves: [{ message: '7', link: 'to-b' }],
      states: {
        dispatch: 'empty',
        sessionA: 'free; given nothing',
        sessionB: 'verifying order 41',
      },
      held: { dispatch: [], sessionB: ['7'] },
      note: 'The dispatch channel gives command 7 to Session B and to nobody else. Session A, just as free, gets nothing: a command is meant to be carried out once.',
    },
    {
      states: { kernel: 'wait for 7 ran out', sessionB: 'still verifying, slowly' },
      note: 'Session B is slow. The kernel’s wait for an answer to 7 runs out, and from where it stands a slow session and a lost command look the same.',
    },
    {
      moves: [{ message: '7', link: 'send' }],
      states: { kernel: 'sent 7 again', dispatch: 'holds a copy of 7' },
      held: { dispatch: ['7'] },
      note: 'So the kernel sends command 7 to the dispatch channel again. The copy is the same message as before, and the channel cannot tell it from new work.',
    },
    {
      moves: [{ message: '7', link: 'to-a' }],
      states: { dispatch: 'empty', sessionA: 'verifying order 41' },
      held: { dispatch: [], sessionA: ['7'] },
      note: 'The dispatch channel gives the copy to Session A. Order 41 is now being verified in both sessions for a single request.',
    },
    {
      moves: [{ message: 'b', link: 'b-result' }],
      states: { sessionB: 'done with 7', store: 'one result for 7' },
      held: { sessionB: [], store: ['b'] },
      note: 'Session B sends its result, b, to the event store. It names command 7, so it can be matched to the request that asked for it.',
    },
    {
      moves: [{ message: 'a', link: 'a-result' }],
      states: { sessionA: 'done with 7', store: 'two results for 7' },
      held: { sessionA: [], store: ['b', 'a'] },
      note: 'Session A sends its result, a, to the event store, also naming 7. The id shows that both answer one request, so a reader can keep one, but nothing undoes the second verification.',
    },
  ],
  moments: [
    { label: 'Sent', step: 1 },
    { label: 'One taker', step: 3 },
    { label: 'Sent again', step: 5 },
    { label: 'Run twice', step: 6 },
    { label: 'Two results', step: 8 },
  ],
  caption:
    'Each box is one part of the example. The Kernel, the part of DotLn that decides what happens next, sends commands. Dispatch, the pipe with the bold name, is the channel the pattern relies on: a command waits there until one session takes it. Session A and Session B are the two sessions that can carry a command out, and the Event store keeps their results. A token is a message: 7 is command 7, verify order 41, and b and a are the results that Session B and Session A send back. A token is green while it moves and outlined inside the box that holds it; a box a message leaves or reaches is outlined in green, and the words inside each box say what it is doing. Step forward to move the messages on.',
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
