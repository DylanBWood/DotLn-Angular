import { ReadableStream, WritableStream, TransformStream } from 'node:stream/web';

// jsdom exposes DOM globals but omits the web streams used by Node fetch and MSW.
Object.assign(globalThis, { ReadableStream, WritableStream, TransformStream });
