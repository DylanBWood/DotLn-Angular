import aggregator from './eip/aggregator.json';
import canonicalDataModel from './eip/canonical-data-model.json';
import channelAdapter from './eip/channel-adapter.json';
import commandMessage from './eip/command-message.json';
import competingConsumers from './eip/competing-consumers.json';
import contentBasedRouter from './eip/content-based-router.json';
import controlBus from './eip/control-bus.json';
import correlationIdentifier from './eip/correlation-identifier.json';
import eventMessage from './eip/event-message.json';
import guaranteedDelivery from './eip/guaranteed-delivery.json';
import messageDispatcher from './eip/message-dispatcher.json';
import messageExpiration from './eip/message-expiration.json';
import messageStore from './eip/message-store.json';
import messageTranslator from './eip/message-translator.json';
import processManager from './eip/process-manager.json';
import publishSubscribeChannel from './eip/publish-subscribe-channel.json';
import recipientList from './eip/recipient-list.json';
import requestReply from './eip/request-reply.json';
import resequencer from './eip/resequencer.json';
import transactionalClient from './eip/transactional-client.json';

// The work's studies load as one chunk, the first time one of them is read. The studies check
// refuses a record this list misses.
export default [
  aggregator,
  canonicalDataModel,
  channelAdapter,
  commandMessage,
  competingConsumers,
  contentBasedRouter,
  controlBus,
  correlationIdentifier,
  eventMessage,
  guaranteedDelivery,
  messageDispatcher,
  messageExpiration,
  messageStore,
  messageTranslator,
  processManager,
  publishSubscribeChannel,
  recipientList,
  requestReply,
  resequencer,
  transactionalClient,
];
