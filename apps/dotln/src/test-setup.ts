import '@dotln-angular/testing-network';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { boardHandlers } from '@dotln-angular/board-data-access/testing/handlers';

const server = setupServer(...boardHandlers);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
