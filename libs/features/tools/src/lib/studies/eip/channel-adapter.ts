import { type FlowExample, flowModel } from '../flow';
import type { StudyModelFunction } from '../study-model';

/**
 * The board loading its document, drawn as a channel adapter. The board speaks only in events on
 * the app's event stream and the HTTP API speaks only HTTP; the adapter between them turns a load
 * event into a GET, and the reply back into an event. The first load succeeds and the refresh
 * after it fails, so the failure has to reach the event stream as a message too. One message
 * moves at each step. Written step by step: what matters here is the call into an application
 * that knows no streams, which a marble example could only fake.
 */
export const example: FlowExample = {
  nodes: [
    { id: 'board', label: 'Board', stage: 0 },
    { id: 'adapter', label: 'Adapter', stage: 1, tone: 'subject' },
    { id: 'api', label: 'HTTP API', stage: 2 },
  ],
  // The board and the adapter meet on the app's event stream; the adapter and the API over HTTP.
  links: [
    { id: 'publish', from: 'board', to: 'adapter', label: 'events' },
    { id: 'deliver', from: 'adapter', to: 'board', label: 'events' },
    { id: 'request', from: 'adapter', to: 'api', label: 'HTTP' },
    { id: 'response', from: 'api', to: 'adapter', label: 'HTTP' },
  ],
  // Lower case is the first load, capitals the refresh after it.
  messages: {
    l: { key: 'l', content: 'load' },
    g: { key: 'g', content: 'GET /uifa-board-v1' },
    d: { key: 'd', content: '200 with the board document' },
    s: { key: 's', content: 'loadSuccess with the document' },
    L: { key: 'L', content: 'load' },
    G: { key: 'G', content: 'GET /uifa-board-v1' },
    E: { key: 'E', content: 'HTTP 500' },
    F: { key: 'F', content: 'loadFailure with an app error' },
  },
  start: {
    states: { board: 'no document', adapter: 'listening for load', api: 'answers HTTP only' },
    note: 'The board has opened with no document. The adapter listens on the event stream for load; the HTTP API knows nothing of events.',
  },
  steps: [
    {
      moves: [{ message: 'l', link: 'publish' }],
      states: { board: 'waiting for its document', adapter: 'serving l' },
      held: { adapter: ['l'] },
      note: 'The board publishes l, a load event, on the event stream, and the adapter, which listens for load, takes it.',
    },
    {
      moves: [{ message: 'g', link: 'request' }],
      states: { adapter: 'waiting for the reply', api: 'serving g' },
      note: 'The adapter turns l into g, a GET for /uifa-board-v1, and sends it to the HTTP API through BoardApi.',
    },
    {
      moves: [{ message: 'd', link: 'response' }],
      states: { adapter: 'has the reply to l', api: 'answered 200' },
      held: { adapter: ['l', 'd'] },
      note: 'The HTTP API answers the adapter with d, a 200 reply carrying the board document.',
    },
    {
      moves: [{ message: 's', link: 'deliver' }],
      states: { board: 'shows the document', adapter: 'listening for load' },
      held: { adapter: [], board: ['s'] },
      note: 'The adapter wraps the document in s, a loadSuccess event, and publishes it on the event stream, where the board takes it.',
    },
    {
      moves: [{ message: 'L', link: 'publish' }],
      states: { board: 'shows it; refresh asked', adapter: 'serving L' },
      held: { adapter: ['L'] },
      note: 'The reader asks for a refresh, and the board publishes L, a second load event, which the adapter takes.',
    },
    {
      moves: [{ message: 'G', link: 'request' }],
      states: { adapter: 'waiting for the reply', api: 'serving G' },
      note: 'The adapter sends G, the same GET as before, to the HTTP API.',
    },
    {
      moves: [{ message: 'E', link: 'response' }],
      states: { adapter: 'has a failure for L', api: 'answered 500' },
      held: { adapter: ['L', 'E'] },
      note: 'This time the HTTP API answers the adapter with E, an HTTP 500 reply.',
    },
    {
      moves: [{ message: 'F', link: 'deliver' }],
      states: { board: 'unavailable, no document', adapter: 'listening for load' },
      held: { adapter: [], board: ['F'] },
      note: 'The adapter turns the failure into F, a loadFailure event carrying an app error, and publishes it on the event stream, where the board takes it.',
    },
  ],
  moments: [
    { label: 'load published', step: 1 },
    { label: 'event becomes GET', step: 2 },
    { label: 'reply becomes event', step: 4 },
    { label: 'error reply', step: 7 },
    { label: 'failure as event', step: 8 },
  ],
  caption:
    "Each token is one message. Lower-case tokens belong to the first load and capitals to the refresh: l and L are the load event, g and G the GET /uifa-board-v1 request, d the API's 200 reply carrying the board document, E its HTTP 500 reply, s the loadSuccess event carrying the document and F the loadFailure event carrying an app error. The Board is the board page with its store, which publishes load and keeps what comes back; the Adapter is the store's command feature calling BoardApi; the HTTP API is the app's own API, which answers HTTP and knows nothing of events. The lines marked events are the app's event stream, and the lines marked HTTP are plain HTTP. The words in a box say what that box is doing or holding. A token is green while it moves and outlined while a box holds it, and a box a token leaves or reaches is outlined in green.",
};

export const model: StudyModelFunction = (parameters) => flowModel(example, parameters);
