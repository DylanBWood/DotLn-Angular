import { delay, filter, map, type Observable, share, withLatestFrom } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import type { MarbleExample } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** A release close as the recipient list receives it: the order, and the release it publishes. */
export interface Close {
  readonly order: string;
  /** The tag the close publishes, or `none` for a close that publishes no release. */
  readonly release: string;
}

/**
 * Who one close goes to, computed when it arrives: every sibling declared at that moment when
 * the close publishes a release, and nobody when it publishes none.
 */
export const recipientsOf = (close: Close, declared: readonly string[]): readonly string[] =>
  close.release === 'none' ? [] : declared;

/** The three closes, each named by the last digit of its order: 0 is WO-240, 1 and 2 the next. */
const closes = {
  0: { order: 'WO-240', release: 'v0.95.0' },
  1: { order: 'WO-241', release: 'none' },
  2: { order: 'WO-242', release: 'v0.96.0' },
} as const satisfies Readonly<Record<number, Close>>;

const outputs: MarbleExample['outputs'] = {
  toA$: {
    label: 'studyEip.recipient-list.model.example.outputs.toA.label',
    marbles: '---0----(2|)',
    values: { 0: closes[0], 2: closes[2] },
    valueMessages: {
      '0': 'studyEip.recipient-list.model.example.outputs.toA.values.0',
      '2': 'studyEip.recipient-list.model.example.outputs.toA.values.2',
    },
  },
  toB$: {
    label: 'studyEip.recipient-list.model.example.outputs.toB.label',
    marbles: '---0----(2|)',
    values: { 0: closes[0], 2: closes[2] },
    valueMessages: {
      '0': 'studyEip.recipient-list.model.example.outputs.toB.values.0',
      '2': 'studyEip.recipient-list.model.example.outputs.toB.values.2',
    },
  },
  toC$: {
    label: 'studyEip.recipient-list.model.example.outputs.toC.label',
    marbles: '--------(2|)',
    values: { 2: closes[2] },
    valueMessages: {
      '2': 'studyEip.recipient-list.model.example.outputs.toC.values.2',
    },
  },
  record$: {
    label: 'studyEip.recipient-list.model.example.outputs.record.label',
    marbles: '---p-q--(r|)',
    values: {
      p: { order: 'WO-240', refreshed: 'A, B' },
      q: { order: 'WO-241', refreshed: 'none' },
      r: { order: 'WO-242', refreshed: 'A, B, C' },
    },

    valueMessages: {
      p: 'studyEip.recipient-list.model.example.outputs.record.values.p',
      q: 'studyEip.recipient-list.model.example.outputs.record.values.q',
      r: 'studyEip.recipient-list.model.example.outputs.record.values.r',
    },
  },
};

const closeCount = Object.keys(closes).length;
const copyCount = Object.entries(outputs)
  .filter(([id]) => id !== 'record$')
  .reduce((sum, [, stream]) => sum + Object.keys(stream.values ?? {}).length, 0);
const firstEntry = ['p'];
const secondEntry = [...firstEntry, 'q'];
const finalEntries = [...secondEntry, 'r'];

/**
 * Siblings A and B are declared, then three closes arrive while a third sibling, C, is declared
 * between the second and the third. The recipient list works out each close's list when the close
 * arrives and, the step after, sends every sibling on it its own copy and writes the list to the
 * close record. One thing happens in each step. The strings here are what the spec beside this
 * file asserts, and what both the flow drawing and the marble drawing read.
 */
export const example: MarbleExample = {
  inputs: {
    closes$: {
      label: 'studyEip.recipient-list.model.example.inputs.closes.label',
      // Hot: orders close whether or not anything is listening.
      hot: true,
      marbles: '--0-1--2|',
      values: closes,

      valueMessages: {
        '0': 'studyEip.recipient-list.model.example.inputs.closes.values.0',
        '1': 'studyEip.recipient-list.model.example.inputs.closes.values.1',
        '2': 'studyEip.recipient-list.model.example.inputs.closes.values.2',
      },
    },
    declared$: {
      label: 'studyEip.recipient-list.model.example.inputs.declared.label',
      // Hot: x declares siblings A and B, and y adds C.
      hot: true,
      marbles: '-x----y',
      values: { x: ['A', 'B'], y: ['A', 'B', 'C'] },

      valueMessages: {
        x: 'studyEip.recipient-list.model.example.inputs.declared.values.x',
        y: 'studyEip.recipient-list.model.example.inputs.declared.values.y',
      },
    },
  },
  operator: 'studyEip.recipient-list.model.example.operator',
  outputs,
  run: ({ inputs }) => {
    // The digits stand for closes and x and y for the declared siblings, as the values above say.
    const closes$ = inputs['closes$'] as Observable<Close>;
    const declared$ = inputs['declared$'] as Observable<readonly string[]>;
    const listed$ = closes$.pipe(
      // The list for each close is computed from the siblings declared at that moment.
      withLatestFrom(declared$),
      map(([close, declared]) => ({
        close,
        to: recipientsOf(close, declared),
      })),
      // The copies go out one step after the close arrives.
      delay(1),
      // One list per close, however many channels read it.
      share(),
    );
    // The list is recorded with the dispatch, an empty one included.
    const record$ = listed$.pipe(
      map(({ close, to }) => ({
        order: close.order,
        refreshed: to.join(', ') || 'none',
      })),
    );
    // Each recipient on the list gets its own copy of the close.
    const copyFor = (sibling: string) =>
      listed$.pipe(
        filter(({ to }) => to.includes(sibling)),
        map(({ close }) => ({ ...close })),
      );
    const toA$ = copyFor('A');
    const toB$ = copyFor('B');
    const toC$ = copyFor('C');
    return { toA$, toB$, toC$, record$ };
  },
  moments: [
    {
      label: 'studyEip.recipient-list.model.example.moments.0.label',
      frame: 2,
    },
    {
      label: 'studyEip.recipient-list.model.example.moments.1.label',
      frame: 3,
    },
    {
      label: 'studyEip.recipient-list.model.example.moments.2.label',
      frame: 4,
    },
    {
      label: 'studyEip.recipient-list.model.example.moments.3.label',
      frame: 6,
    },
    {
      label: 'studyEip.recipient-list.model.example.moments.4.label',
      frame: 8,
    },
  ],
  notes: {
    0: 'studyEip.recipient-list.model.example.notes.0',
    1: 'studyEip.recipient-list.model.example.notes.1',
    2: 'studyEip.recipient-list.model.example.notes.2',
    3: 'studyEip.recipient-list.model.example.notes.3',
    4: 'studyEip.recipient-list.model.example.notes.4',
    5: 'studyEip.recipient-list.model.example.notes.5',
    6: 'studyEip.recipient-list.model.example.notes.6',
    7: 'studyEip.recipient-list.model.example.notes.7',
    8: {
      key: 'studyEip.recipient-list.model.example.notes.8',
      params: { closes: closeCount, copies: copyCount },
    },
  },
  caption: 'studyEip.recipient-list.model.example.caption',

  parameterMessages: {
    closes: 'studyEip.recipient-list.record.parameters.closes',
    declaredFirst: 'studyEip.recipient-list.record.parameters.declaredFirst',
    declaredLater: 'studyEip.recipient-list.record.parameters.declaredLater',
  },
};

/**
 * The same run drawn as endpoints and channels: what the list reads, the list and the record it
 * keeps, and the siblings it sends to.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'close',
      label: 'studyEip.recipient-list.model.flow.nodes.0.label',
      stage: 0,
    },
    {
      id: 'declared',
      label: 'studyEip.recipient-list.model.flow.nodes.1.label',
      stage: 0,
      row: 1,
    },
    {
      id: 'list',
      label: 'studyEip.recipient-list.model.flow.nodes.2.label',
      stage: 1,
      tone: 'subject',
    },
    {
      id: 'record',
      label: 'studyEip.recipient-list.model.flow.nodes.3.label',
      stage: 1,
      row: 1,
    },
    {
      id: 'a',
      label: 'studyEip.recipient-list.model.flow.nodes.4.label',
      stage: 2,
    },
    {
      id: 'b',
      label: 'studyEip.recipient-list.model.flow.nodes.5.label',
      stage: 2,
      row: 1,
    },
    {
      id: 'c',
      label: 'studyEip.recipient-list.model.flow.nodes.6.label',
      stage: 2,
      row: 2,
    },
  ],
  links: [
    { id: 'closes', from: 'close', to: 'list' },
    { id: 'declare', from: 'declared', to: 'list' },
    { id: 'to-record', from: 'list', to: 'record' },
    { id: 'to-a', from: 'list', to: 'a' },
    { id: 'to-b', from: 'list', to: 'b' },
    { id: 'to-c', from: 'list', to: 'c' },
  ],
  routes: {
    closes$: 'closes',
    declared$: 'declare',
    record$: 'to-record',
    toA$: 'to-a',
    toB$: 'to-b',
    toC$: 'to-c',
  },
  states: {
    0: {
      close: 'studyEip.recipient-list.model.flow.states.0.close',
      declared: 'studyEip.recipient-list.model.flow.states.0.declared',
      list: 'studyEip.recipient-list.model.flow.states.0.list',
      record: 'studyEip.recipient-list.model.flow.states.0.record',
      a: 'studyEip.recipient-list.model.flow.states.0.a',
      b: 'studyEip.recipient-list.model.flow.states.0.b',
      c: 'studyEip.recipient-list.model.flow.states.0.c',
    },
    1: { list: 'studyEip.recipient-list.model.flow.states.1.list' },
    2: {
      close: 'studyEip.recipient-list.model.flow.states.2.close',
      list: 'studyEip.recipient-list.model.flow.states.2.list',
    },
    3: {
      list: 'studyEip.recipient-list.model.flow.states.3.list',
      record: {
        key: 'studyEip.recipient-list.model.flow.states.3.record',
        params: { entries: firstEntry.length },
      },
      a: 'studyEip.recipient-list.model.flow.states.3.a',
      b: 'studyEip.recipient-list.model.flow.states.3.b',
    },
    4: {
      close: 'studyEip.recipient-list.model.flow.states.4.close',
      list: 'studyEip.recipient-list.model.flow.states.4.list',
    },
    5: {
      list: 'studyEip.recipient-list.model.flow.states.5.list',
      record: {
        key: 'studyEip.recipient-list.model.flow.states.5.record',
        params: { entries: secondEntry.length },
      },
    },
    6: {
      declared: 'studyEip.recipient-list.model.flow.states.6.declared',
      list: 'studyEip.recipient-list.model.flow.states.6.list',
      c: 'studyEip.recipient-list.model.flow.states.6.c',
    },
    7: {
      close: 'studyEip.recipient-list.model.flow.states.7.close',
      list: 'studyEip.recipient-list.model.flow.states.7.list',
    },
    8: {
      close: {
        key: 'studyEip.recipient-list.model.flow.states.8.close',
        params: { closes: closeCount },
      },
      list: 'studyEip.recipient-list.model.flow.states.8.list',
      record: {
        key: 'studyEip.recipient-list.model.flow.states.8.record',
        params: { entries: finalEntries.length },
      },
      a: 'studyEip.recipient-list.model.flow.states.8.a',
      b: 'studyEip.recipient-list.model.flow.states.8.b',
      c: 'studyEip.recipient-list.model.flow.states.8.c',
    },
  },
  held: {
    2: { list: ['0'] },
    3: { list: [], record: firstEntry, a: ['0'], b: ['0'] },
    4: { list: ['1'] },
    5: { list: [], record: secondEntry },
    7: { list: ['2'] },
    8: { list: [], record: finalEntries, a: ['2'], b: ['2'], c: ['2'] },
  },
  caption: 'studyEip.recipient-list.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
