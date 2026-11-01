import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * The story, one sentence to a step. The executor sends evidence 31 to the verifier and fires an
 * envelope of it at the control log. The verifier sends its report on order 31 to the reviewer and
 * fires a whole copy of it at the log. The reviewer finishes with the report. The audit asks the
 * log about order 31, and the log answers. The log is down when the executor sends evidence 32, so
 * that envelope is lost. The log is up again when the verifier sends its report on order 32 and
 * its copy. The audit asks about order 32, and the log answers with a report that has no evidence
 * behind it.
 *
 * Lower case letters are order 31's records and capitals order 32's; digits are the copies. The
 * executor stands below the verifier and the log to the right of both senders, so each copy leaves
 * its sender beside the record it copies; the evidence's copy skips a stage and runs round the
 * boxes.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'executor', label: 'Executor', stage: 0, row: 1 },
    { id: 'verifier', label: 'Verifier', stage: 1 },
    { id: 'reviewer', label: 'Reviewer', stage: 2 },
    { id: 'log', label: 'Control log', stage: 2, row: 1, tone: 'subject' },
    { id: 'audit', label: 'Audit', stage: 3, row: 1 },
  ],
  links: [
    { id: 'hand-over', from: 'executor', to: 'verifier' },
    { id: 'file', from: 'verifier', to: 'reviewer' },
    { id: 'copy-evidence', from: 'executor', to: 'log' },
    { id: 'copy-report', from: 'verifier', to: 'log' },
    { id: 'ask', from: 'audit', to: 'log' },
    { id: 'answer', from: 'log', to: 'audit' },
  ],
  caption:
    "Each token is one message. e and r are the evidence and the verifier's report on order 31, and E and R the same records on order 32; they travel between the roles on the work channel. 1, 2, 3 and 4 are the copies of e, r, E and R, fired at the Control log on a channel of their own: 1 and 3 keep only an envelope saying which record went where and when, 2 and 4 the whole report. q and Q are the Audit's questions about orders 31 and 32, and a and A the log's answers. The Executor, the Verifier and the Reviewer are the roles doing the work; the Control log is the message store, keeping every copy that reaches it; the Audit is whoever questions the flow afterwards, and it asks only the log. The words in a box say what that box is doing, and the tokens in a box are the messages it holds. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
  messages: {
    evidence31: { key: 'e', content: 'evidence 31' },
    report31: { key: 'r', content: 'report 31: pass' },
    evidence32: { key: 'E', content: 'evidence 32' },
    report32: { key: 'R', content: 'report 32: pass' },
    copyEvidence31: { key: '1', content: 'envelope of evidence 31' },
    copyReport31: { key: '2', content: 'report 31 in full' },
    copyEvidence32: { key: '3', content: 'envelope of evidence 32' },
    copyReport32: { key: '4', content: 'report 32 in full' },
    ask31: { key: 'q', content: 'order 31?' },
    answer31: { key: 'a', content: '31: evidence, pass' },
    ask32: { key: 'Q', content: 'order 32?' },
    answer32: { key: 'A', content: '32: pass, no evidence' },
  },
  start: {
    states: {
      executor: 'ready to send 31',
      verifier: 'waiting',
      reviewer: 'idle',
      log: 'empty',
      audit: 'no questions yet',
    },
    note: 'Nothing has moved. The audit will learn about the work only from what reaches the control log.',
  },
  steps: [
    {
      moves: [
        { message: 'evidence31', link: 'hand-over' },
        { message: 'copyEvidence31', link: 'copy-evidence' },
      ],
      states: { executor: 'works on order 32', verifier: 'checking 31', log: '1 entry' },
      held: { verifier: ['evidence31'], log: ['copyEvidence31'] },
      note: 'The executor sends e, evidence 31, to the verifier and at the same moment fires 1, its envelope, at the control log: which record, on which channel, at which step. The hand-over does not wait for the log.',
    },
    {
      moves: [
        { message: 'report31', link: 'file' },
        { message: 'copyReport31', link: 'copy-report' },
      ],
      states: { verifier: 'waiting', reviewer: 'reviewing 31', log: '2 entries' },
      held: { verifier: [], reviewer: ['report31'], log: ['copyEvidence31', 'copyReport31'] },
      note: 'The verifier sends r, its report on order 31, to the reviewer and fires 2, a copy of the whole report, at the log. A report is short and its verdict matters later, so its copy keeps it all.',
    },
    {
      states: { reviewer: 'done with 31' },
      held: { reviewer: [] },
      note: "The reviewer finishes with r and lets it go. No role holds anything of order 31 any more; only the log's entries remain.",
    },
    {
      moves: [{ message: 'ask31', link: 'ask' }],
      states: { audit: 'asked about 31' },
      note: 'The audit sends q, a question about order 31, to the log. It asks the log, not the roles or the work channel.',
    },
    {
      moves: [{ message: 'answer31', link: 'answer' }],
      states: { audit: 'found 31 complete' },
      note: 'The log sends back a: evidence 31 was handed over and report 31 passed. It cannot say what the evidence contained, because 1 kept only its envelope.',
    },
    {
      moves: [
        { message: 'evidence32', link: 'hand-over' },
        { message: 'copyEvidence32', link: 'copy-evidence' },
      ],
      states: {
        executor: 'works on order 33',
        verifier: 'checking 32',
        log: 'down: 3 lost; 2 entries',
      },
      held: { verifier: ['evidence32'] },
      note: 'The log is down when the executor sends E, evidence 32, to the verifier. E arrives, but 3, its envelope, is lost, and nothing in the work notices.',
    },
    {
      moves: [
        { message: 'report32', link: 'file' },
        { message: 'copyReport32', link: 'copy-report' },
      ],
      states: { verifier: 'waiting', reviewer: 'reviewing 32', log: 'up; 3 entries' },
      held: {
        verifier: [],
        reviewer: ['report32'],
        log: ['copyEvidence31', 'copyReport31', 'copyReport32'],
      },
      note: 'The log is up again when the verifier sends R, its report on order 32, to the reviewer, so 4, the copy of R, is kept.',
    },
    {
      moves: [{ message: 'ask32', link: 'ask' }],
      states: { audit: 'asked about 32' },
      note: 'The audit sends Q, a question about order 32, to the log.',
    },
    {
      moves: [{ message: 'answer32', link: 'answer' }],
      states: { audit: 'found a gap in 32' },
      note: 'The log sends back A: report 32 passed, with no evidence behind it. E was handed over, so the gap is in the record and not in the work, but from the log alone the audit cannot tell a lost copy from evidence never sent.',
    },
  ],
  moments: [
    { label: 'Copies fired', step: 1 },
    { label: 'Read after use', step: 5 },
    { label: 'Copy lost', step: 6 },
    { label: 'Gap reported', step: 9 },
  ],
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
