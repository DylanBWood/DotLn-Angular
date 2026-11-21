import type { StudyParameters } from '@dotln-angular/models';

import { numberParameter } from '../parameters';
import { type RelationsExample, relationsModel, type RelationStep } from '../relations';
import { listOf } from '../states';
import type { StudyMessage } from '../study-message';
import type { RelationsStudyModel } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import {
  type ChunkingRun,
  type EventChunk,
  type GuideEvent,
  guideEvents,
  runChunking,
} from './chunking.simulation';

const eventMessages = {
  runOpened: 'studyGeb.chunking.model.events.runOpened',
  guideRead: 'studyGeb.chunking.model.events.guideRead',
  writeRefused: 'studyGeb.chunking.model.events.writeRefused',
  linksChecked: 'studyGeb.chunking.model.events.linksChecked',
  gatePassed: 'studyGeb.chunking.model.events.gatePassed',
} satisfies Record<GuideEvent, string>;

function readEvents(events: readonly GuideEvent[], t: StudyTranslate): string {
  return listOf(
    t,
    events.map((event) => t(eventMessages[event])),
  );
}

function chunkNote(chunk: EventChunk, chunkSize: number, t: StudyTranslate): StudyMessage {
  return {
    key:
      chunk.members.length < chunkSize
        ? 'studyGeb.chunking.model.notes.tail'
        : 'studyGeb.chunking.model.notes.chunk',
    params: { events: readEvents(chunk.members, t), refusalCount: chunk.refusalCount },
  };
}

function exampleOf(run: ChunkingRun, t: StudyTranslate): RelationsExample {
  const chunks = run.chunks.map((chunk, index) => ({
    id: `chunk-${index + 1}`,
    label: { key: 'studyGeb.chunking.model.nodes.chunk', params: { chunkNumber: index + 1 } },
    note: chunkNote(chunk, run.chunkSize, t),
    values: { eventCount: chunk.members.length, refusalCount: chunk.refusalCount },
  }));
  const steps: readonly RelationStep[] = [
    {
      id: 'input',
      focus: { node: 'events' },
      note: {
        key: 'studyGeb.chunking.model.notes.input',
        params: { events: readEvents(run.events, t) },
      },
    },
    ...chunks.map(({ id, note, values }) => ({ id, focus: { node: id }, note, values })),
    {
      id: 'summary',
      focus: { node: 'guide-check' },
      note: { key: 'studyGeb.chunking.model.notes.summary', params: { ...run.guideCheck } },
      values: { ...run.guideCheck },
    },
  ];

  return {
    layout: 'columns',
    nodes: [
      { id: 'events', label: 'studyGeb.chunking.model.nodes.events', lane: 0 },
      ...chunks.map(({ id, label }) => ({ id, label, lane: 1 as const })),
      { id: 'guide-check', label: 'studyGeb.chunking.model.nodes.guideCheck', lane: 2 },
    ],
    relations: chunks.flatMap(({ id }) => [
      { id: `input-${id}`, from: 'events', to: id, label: 'studyGeb.chunking.model.edges.feeds' },
      {
        id: `summary-${id}`,
        from: id,
        to: 'guide-check',
        label: 'studyGeb.chunking.model.edges.contributes',
      },
    ]),
    steps,
    moments: [
      { step: 'input', label: 'studyGeb.chunking.model.moments.input' },
      { step: 'summary', label: 'studyGeb.chunking.model.moments.summary' },
    ],
    caption: 'studyGeb.chunking.model.caption',
  };
}

export function model(parameters: StudyParameters, t: StudyTranslate): RelationsStudyModel {
  const run = runChunking(guideEvents, numberParameter(parameters, 'chunkSize'));
  return {
    ...relationsModel(exampleOf(run, t), t, { chunkSize: run.chunkSize }),
    inputs: [
      {
        name: 'chunkSize',
        label: t('studyGeb.chunking.model.inputs.size'),
        unit: t('studyGeb.chunking.model.inputs.events'),
        min: 1,
        max: guideEvents.length,
        step: 1,
      },
    ],
  };
}
