import dataMapper from './poeaa/data-mapper.json';
import dataTransferObject from './poeaa/data-transfer-object.json';
import domainModel from './poeaa/domain-model.json';
import foreignKeyMapping from './poeaa/foreign-key-mapping.json';
import gateway from './poeaa/gateway.json';
import identityField from './poeaa/identity-field.json';
import identityMap from './poeaa/identity-map.json';
import lazyLoad from './poeaa/lazy-load.json';
import optimisticOfflineLock from './poeaa/optimistic-offline-lock.json';
import pageController from './poeaa/page-controller.json';
import pessimisticOfflineLock from './poeaa/pessimistic-offline-lock.json';
import plugin from './poeaa/plugin.json';
import recordSet from './poeaa/record-set.json';
import registry from './poeaa/registry.json';
import remoteFacade from './poeaa/remote-facade.json';
import serviceLayer from './poeaa/service-layer.json';
import serviceStub from './poeaa/service-stub.json';
import templateView from './poeaa/template-view.json';
import transactionScript from './poeaa/transaction-script.json';
import unitOfWork from './poeaa/unit-of-work.json';

// The work's studies load as one chunk, the first time one of them is read. The studies check
// refuses a record this list misses.
export default [
  dataMapper,
  dataTransferObject,
  domainModel,
  foreignKeyMapping,
  gateway,
  identityField,
  identityMap,
  lazyLoad,
  optimisticOfflineLock,
  pageController,
  pessimisticOfflineLock,
  plugin,
  recordSet,
  registry,
  remoteFacade,
  serviceLayer,
  serviceStub,
  templateView,
  transactionScript,
  unitOfWork,
];
