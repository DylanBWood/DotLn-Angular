import '@dotln-angular/testing-network';
import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed();

import { setupServer } from 'msw/node';

import { boardHandlers } from '../testing/src/handlers';

export const server = setupServer(...boardHandlers);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
