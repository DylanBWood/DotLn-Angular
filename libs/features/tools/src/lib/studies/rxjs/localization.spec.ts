import type { ToolId } from '@dotln-angular/models';

import { loadFlowStudy, loadStudy, studyTranslate } from '../../../../testing/src';
import * as eipAggregator from '../eip/aggregator';
import * as eipCanonicalDataModel from '../eip/canonical-data-model';
import * as eipChannelAdapter from '../eip/channel-adapter';
import * as eipCommandMessage from '../eip/command-message';
import * as eipCompetingConsumers from '../eip/competing-consumers';
import * as eipContentBasedRouter from '../eip/content-based-router';
import * as eipControlBus from '../eip/control-bus';
import * as eipCorrelationIdentifier from '../eip/correlation-identifier';
import * as eipEventMessage from '../eip/event-message';
import * as eipGuaranteedDelivery from '../eip/guaranteed-delivery';
import * as eipMessageDispatcher from '../eip/message-dispatcher';
import * as eipMessageExpiration from '../eip/message-expiration';
import * as eipMessageStore from '../eip/message-store';
import * as eipMessageTranslator from '../eip/message-translator';
import * as eipProcessManager from '../eip/process-manager';
import * as eipPublishSubscribeChannel from '../eip/publish-subscribe-channel';
import * as eipRecipientList from '../eip/recipient-list';
import * as eipRequestReply from '../eip/request-reply';
import * as eipResequencer from '../eip/resequencer';
import * as eipTransactionalClient from '../eip/transactional-client';
import type { FlowExample } from '../flow';
import type { MarblesModel, StudyModel, StudyModelFunction, StudyTick } from '../study-model';
import type { StudyTranslate } from '../study-translate';
import * as rxjsBehaviorSubject from './behavior-subject';
import * as rxjsCatchError from './catch-error';
import * as rxjsCombineLatest from './combine-latest';
import * as rxjsConcatMap from './concat-map';
import * as rxjsExhaustMap from './exhaust-map';
import * as rxjsFinalize from './finalize';
import { expectMarbleExample } from './marble-testing';
import type { MarbleExample } from './marbles';
import * as rxjsMaterialize from './materialize';
import * as rxjsMergeMap from './merge-map';
import * as rxjsObserveOn from './observe-on';
import * as rxjsRepeat from './repeat';
import * as rxjsReplaySubject from './replay-subject';
import * as rxjsRetry from './retry';
import * as rxjsScan from './scan';
import * as rxjsShare from './share';
import * as rxjsShareReplay from './share-replay';
import * as rxjsStartWith from './start-with';
import * as rxjsSubject from './subject';
import * as rxjsSwitchMap from './switch-map';
import * as rxjsTakeUntil from './take-until';
import * as rxjsTimeout from './timeout';

interface StudyEntry {
  readonly work: 'rxjs' | 'eip';
  readonly slug: string;
  readonly id: ToolId;
  readonly model: StudyModelFunction;
  readonly example: FlowExample | MarbleExample;
}

const studies: readonly StudyEntry[] = [
  { work: 'eip', slug: 'aggregator', id: 'eip:110', ...eipAggregator },
  { work: 'eip', slug: 'canonical-data-model', id: 'eip:146', ...eipCanonicalDataModel },
  { work: 'eip', slug: 'channel-adapter', id: 'eip:73', ...eipChannelAdapter },
  { work: 'eip', slug: 'command-message', id: 'eip:78', ...eipCommandMessage },
  { work: 'eip', slug: 'competing-consumers', id: 'eip:211', ...eipCompetingConsumers },
  { work: 'eip', slug: 'content-based-router', id: 'eip:99', ...eipContentBasedRouter },
  { work: 'eip', slug: 'control-bus', id: 'eip:184', ...eipControlBus },
  { work: 'eip', slug: 'correlation-identifier', id: 'eip:87', ...eipCorrelationIdentifier },
  { work: 'eip', slug: 'event-message', id: 'eip:80', ...eipEventMessage },
  { work: 'eip', slug: 'guaranteed-delivery', id: 'eip:71', ...eipGuaranteedDelivery },
  { work: 'eip', slug: 'message-dispatcher', id: 'eip:175', ...eipMessageDispatcher },
  { work: 'eip', slug: 'message-expiration', id: 'eip:91', ...eipMessageExpiration },
  { work: 'eip', slug: 'message-store', id: 'eip:192', ...eipMessageStore },
  { work: 'eip', slug: 'message-translator', id: 'eip:60', ...eipMessageTranslator },
  { work: 'eip', slug: 'process-manager', id: 'eip:131', ...eipProcessManager },
  { work: 'eip', slug: 'publish-subscribe-channel', id: 'eip:65', ...eipPublishSubscribeChannel },
  { work: 'eip', slug: 'recipient-list', id: 'eip:105', ...eipRecipientList },
  { work: 'eip', slug: 'request-reply', id: 'eip:83', ...eipRequestReply },
  { work: 'eip', slug: 'resequencer', id: 'eip:120', ...eipResequencer },
  { work: 'eip', slug: 'transactional-client', id: 'eip:170', ...eipTransactionalClient },
  { work: 'rxjs', slug: 'behavior-subject', id: 'rxc:62', ...rxjsBehaviorSubject },
  { work: 'rxjs', slug: 'catch-error', id: 'rxc:220', ...rxjsCatchError },
  { work: 'rxjs', slug: 'combine-latest', id: 'rxc:134', ...rxjsCombineLatest },
  { work: 'rxjs', slug: 'concat-map', id: 'rxc:147', ...rxjsConcatMap },
  { work: 'rxjs', slug: 'exhaust-map', id: 'rxc:149', ...rxjsExhaustMap },
  { work: 'rxjs', slug: 'finalize', id: 'rxc:237', ...rxjsFinalize },
  { work: 'rxjs', slug: 'materialize', id: 'rxc:229', ...rxjsMaterialize },
  { work: 'rxjs', slug: 'merge-map', id: 'rxc:150', ...rxjsMergeMap },
  { work: 'rxjs', slug: 'observe-on', id: 'rxc:230', ...rxjsObserveOn },
  { work: 'rxjs', slug: 'repeat', id: 'rxc:238', ...rxjsRepeat },
  { work: 'rxjs', slug: 'replay-subject', id: 'rxc:63', ...rxjsReplaySubject },
  { work: 'rxjs', slug: 'retry', id: 'rxc:221', ...rxjsRetry },
  { work: 'rxjs', slug: 'scan', id: 'rxc:161', ...rxjsScan },
  { work: 'rxjs', slug: 'share-replay', id: 'rxc:216', ...rxjsShareReplay },
  { work: 'rxjs', slug: 'share', id: 'rxc:215', ...rxjsShare },
  { work: 'rxjs', slug: 'start-with', id: 'rxc:199', ...rxjsStartWith },
  { work: 'rxjs', slug: 'subject', id: 'rxc:5', ...rxjsSubject },
  { work: 'rxjs', slug: 'switch-map', id: 'rxc:152', ...rxjsSwitchMap },
  { work: 'rxjs', slug: 'take-until', id: 'rxc:192', ...rxjsTakeUntil },
  { work: 'rxjs', slug: 'timeout', id: 'rxc:234', ...rxjsTimeout },
];

/** A deliberately different locale: strict key/argument checking, with no English fallback. */
const alternate: StudyTranslate = (key, params = {}) => {
  studyTranslate(key, params);
  return `alt ‹${key}› [${Object.values(params).join(' | ')}]`;
};

const frameWords = (frame: StudyTick, names: readonly string[]): readonly string[] =>
  [
    frame.note,
    frame.worked?.title,
    ...(frame.worked?.lines ?? []),
    frame.worked?.note,
    ...names.map((name) => frame.values[name]),
  ].filter((text): text is string => text !== undefined);

const marbleWords = (marbles: MarblesModel, parameters: readonly string[]): readonly string[] => [
  marbles.operator,
  ...marbles.lines.flatMap(({ label, events }) => [label, ...events.map(({ value }) => value)]),
  ...marbles.frames.flatMap((frame) => frameWords(frame, ['now', 'delivered', ...parameters])),
];

/** Enumerate presentation surfaces explicitly; stream ids, letters and timing remain identities. */
function visibleWords(model: StudyModel, parameters: readonly string[]): readonly string[] {
  const shared = [
    model.caption,
    ...model.legend.map(({ label }) => label),
    ...model.moments.map(({ label }) => label),
  ];
  if (model.family === 'marbles') return [...shared, ...marbleWords(model.marbles, parameters)];
  if (model.family !== 'flow') throw new Error('This corpus contains streams and messaging flows.');
  const flow = model.flow;
  return [
    ...shared,
    ...flow.nodes.map(({ label }) => label),
    ...flow.links.flatMap(({ label }) => (label === undefined ? [] : [label])),
    ...flow.frames.flatMap((frame) => [
      ...Object.values(frame.states),
      ...frame.hops.map(({ content }) => content),
      ...Object.values(frame.held).flatMap((tokens) => tokens.map(({ content }) => content)),
      ...frameWords(frame, ['moves', 'states', 'held', 'now', 'delivered', ...parameters]),
    ]),
    ...(model.diagram
      ? [
          model.diagram.caption,
          ...model.diagram.legend.map(({ label }) => label),
          ...marbleWords(model.diagram.marbles, parameters),
        ]
      : []),
  ];
}

it.each(studies)(
  'translates every presentation surface of $work:$slug without changing its run',
  async (study) => {
    const record =
      study.work === 'rxjs' ? await loadStudy(study.id) : await loadFlowStudy(study.id);
    const parameters = record.example.parameters;
    const words = Object.entries(parameters).flatMap(([name, value]) =>
      typeof value === 'string' ? [name] : [],
    );
    const before = JSON.stringify(study.example);
    const english = study.model(parameters, studyTranslate);
    const translated = study.model(parameters, alternate);
    const originalWords = visibleWords(english, words);
    const translatedWords = visibleWords(translated, words);
    expect(translatedWords).toHaveLength(originalWords.length);
    translatedWords.forEach((text, index) => {
      expect(text).toContain('alt ‹');
      expect(text).not.toBe(originalWords[index]);
    });
    expect(JSON.stringify(study.example)).toBe(before);
    expect(translated.moments.map(({ step }) => step)).toEqual(
      english.moments.map(({ step }) => step),
    );
    if ('run' in study.example) {
      expectMarbleExample(study.example);
      expectMarbleExample(study.example, alternate);
    }
  },
);
