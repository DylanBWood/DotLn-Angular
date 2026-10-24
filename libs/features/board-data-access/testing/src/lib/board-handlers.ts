import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';

import type { BoardResponse } from '@dotln-angular/models';

import recorded from '../../fixtures/launchpad-board-2026-10-21.json';
import unavailable from '../../fixtures/unavailable-board.json';

export const recordedBoard = recorded as BoardResponse;
export const unavailableBoard = unavailable as BoardResponse;

export const boardHandlers = [
  http.get('*/api/uifa-board-v1', async ({ request }) => {
    const scenario = request.headers.get('x-dotln-test-scenario');
    if (scenario === 'network') return HttpResponse.error();
    if (scenario === 'timeout') await delay(200);
    if (scenario === 'refusal') return HttpResponse.json(unavailableBoard, { status: 503 });
    if (scenario === 'failure')
      return HttpResponse.json({ message: 'Unavailable' }, { status: 500 });

    return HttpResponse.json(scenario === 'unavailable' ? unavailableBoard : recordedBoard);
  }),
];
