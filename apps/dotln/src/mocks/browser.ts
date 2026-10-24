import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

const worker = setupWorker(...handlers);

export function start() {
  return worker.start({
    serviceWorker: { url: new URL('mockServiceWorker.js', document.baseURI).href },
    onUnhandledFrame: 'bypass',
  });
}

export function stop() {
  worker.stop();
}
