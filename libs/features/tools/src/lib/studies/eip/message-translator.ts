import { map } from 'rxjs';

import { flowFromMarbles, type MarbleFlow } from '../flow';
import { type MarbleExample, nameOf } from '../rxjs/marbles';
import type { StudyModelFunction } from '../study-model';

/** A catalog row in the older shape: its id and the shape it says it is written in. */
interface LegacyRow {
  readonly id: string;
  readonly schema: 'tool-v0';
}

/**
 * The same row in the shape the Tools home reads. The older shape has no definition and no
 * reading of its source, so the row says so rather than carrying an invented value.
 */
export interface CurrentRow {
  readonly id: string;
  readonly schema: 'tool-v1';
  readonly definition: 'unavailable';
  readonly verified: 'partial';
}

const isLegacyRow = (record: unknown): record is LegacyRow =>
  typeof record === 'object' &&
  record !== null &&
  'id' in record &&
  typeof record.id === 'string' &&
  'schema' in record &&
  record.schema === 'tool-v0';

/** The shape a record says it is in, for the error that refuses it. */
const shapeOf = (record: unknown) =>
  typeof record === 'object' && record !== null && 'schema' in record
    ? nameOf(record.schema)
    : 'an unnamed shape';

/**
 * The translator: rebuilds one row in the newer shape, keeping its id and marking what the older
 * shape cannot supply. A record in any other shape is refused, since a guess would hand the
 * Tools home a row that looks right and is not.
 */
export function toToolV1(record: unknown): CurrentRow {
  if (!isLegacyRow(record)) throw new Error(`no translation from ${shapeOf(record)}`);
  return {
    id: record.id,
    schema: 'tool-v1',
    definition: 'unavailable',
    verified: 'partial',
  };
}

const legacyRows = {
  t: { id: 'eip:60', schema: 'tool-v0' },
  n: { id: 'eip:145', schema: 'tool-v0' },
  c: { id: 'eip:146', schema: 'tool-v0' },
};

const currentRows = {
  T: { id: 'eip:60', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
  N: { id: 'eip:145', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
  C: { id: 'eip:146', schema: 'tool-v1', definition: 'unavailable', verified: 'partial' },
};

/**
 * A chunk written in the older shape sends its three rows, one a step, and the translator hands
 * each one on in the newer shape in the step it arrives. A row's letter is the first letter of its
 * title: small as the chunk wrote it, capital once rebuilt for the Tools home. The strings here
 * are what the spec beside this file asserts and what both drawings read.
 */
export const example: MarbleExample = {
  inputs: {
    records$: {
      label: 'studyEip.message-translator.model.example.inputs.records.label',
      marbles: '-tnc|',
      values: legacyRows,

      valueMessages: {
        t: 'studyEip.message-translator.model.example.inputs.records.values.t',
        n: 'studyEip.message-translator.model.example.inputs.records.values.n',
        c: 'studyEip.message-translator.model.example.inputs.records.values.c',
      },
    },
  },
  operator: 'studyEip.message-translator.model.example.operator',
  outputs: {
    rows$: {
      label: 'studyEip.message-translator.model.example.outputs.rows.label',
      marbles: '-TNC|',
      values: currentRows,

      valueMessages: {
        T: 'studyEip.message-translator.model.example.outputs.rows.values.T',
        N: 'studyEip.message-translator.model.example.outputs.rows.values.N',
        C: 'studyEip.message-translator.model.example.outputs.rows.values.C',
      },
    },
  },
  run: ({ inputs: { records$ } }) => {
    // records$ is the tool-v0 channel; rows$ is the tool-v1 channel the Tools home reads
    const rows$ = records$.pipe(
      // the translator: each record becomes one tool-v1 row as it arrives, or is refused
      map((record) => toToolV1(record)),
    );
    return { rows$ };
  },
  moments: [
    {
      label: 'studyEip.message-translator.model.example.moments.0.label',
      frame: 1,
    },
    {
      label: 'studyEip.message-translator.model.example.moments.1.label',
      frame: 3,
    },
    {
      label: 'studyEip.message-translator.model.example.moments.2.label',
      frame: 4,
    },
  ],
  notes: {
    0: {
      key: 'studyEip.message-translator.model.example.notes.0',
      params: { inputCount: Object.keys(legacyRows).length },
    },
    1: 'studyEip.message-translator.model.example.notes.1',
    2: 'studyEip.message-translator.model.example.notes.2',
    3: {
      key: 'studyEip.message-translator.model.example.notes.3',
      params: {
        inputCount: Object.keys(legacyRows).length,
        outputCount: Object.keys(currentRows).length,
      },
    },
    4: 'studyEip.message-translator.model.example.notes.4',
  },

  parameterMessages: {
    from: 'studyEip.message-translator.record.parameters.from',
    to: 'studyEip.message-translator.record.parameters.to',
    rows: 'studyEip.message-translator.record.parameters.rows',
  },
};

/**
 * Where the rows travel: from the chunk to the translator on the older shape's channel, and from
 * the translator to the Tools home on the newer one's. The translator never holds a row, which is
 * why no frame names anything held by it, and each box's words say what it is, not what moved.
 */
export const flow: MarbleFlow = {
  nodes: [
    {
      id: 'chunk',
      label: 'studyEip.message-translator.model.flow.nodes.0.label',
      stage: 0,
    },
    {
      id: 'translator',
      label: 'studyEip.message-translator.model.flow.nodes.1.label',
      stage: 1,
      tone: 'subject',
    },
    {
      id: 'home',
      label: 'studyEip.message-translator.model.flow.nodes.2.label',
      stage: 2,
    },
  ],
  links: [
    {
      id: 'read',
      from: 'chunk',
      to: 'translator',
      label: 'studyEip.message-translator.model.flow.links.0.label',
    },
    {
      id: 'answer',
      from: 'translator',
      to: 'home',
      label: 'studyEip.message-translator.model.flow.links.1.label',
    },
  ],
  routes: { records$: 'read', rows$: 'answer' },
  states: {
    0: {
      chunk: 'studyEip.message-translator.model.flow.states.0.chunk',
      translator: 'studyEip.message-translator.model.flow.states.0.translator',
      home: 'studyEip.message-translator.model.flow.states.0.home',
    },
  },
  held: {
    0: { chunk: ['t', 'n', 'c'] },
    1: { chunk: ['n', 'c'], home: ['T'] },
    2: { chunk: ['c'], home: ['T', 'N'] },
    3: { chunk: [], home: ['T', 'N', 'C'] },
  },
  caption: 'studyEip.message-translator.model.flow.caption',
};

export const model: StudyModelFunction = (parameters, t) =>
  flowFromMarbles(example, flow, parameters, t);
