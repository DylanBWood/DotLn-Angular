import { of } from 'rxjs';

import { BoardApi, provideBoardDataAccess } from '@dotln-angular/board-data-access';
import { recordedBoard } from '@dotln-angular/board-data-access/testing';
import { provideStorageTokenTestKit } from '@dotln-angular/data-access/testing';
import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import type { BoardResponse } from '@dotln-angular/models';
import { provideDotlnStateTestKit } from '@dotln-angular/state/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import { BoardFacade } from '../../../src/lib/facades/board.facade';

const en = {
  board: {
    eyebrow: 'Workspace / Overview',
    title: 'The actor board',
    description: 'People, builds and the evidence behind their work.',
    panels: 'Board panels',
    sources: 'Sources & evidence',
    sourceCounts: '{{available}} available \u00b7 {{unavailable}} unavailable',
    inspectSources: 'Inspect recorded sources',
    inspectEvidence: 'Inspect evidence records',
    noRows: 'No rows recorded in this section.',
    noExplanation: 'No explanation was supplied by the source.',
    targetUnavailable: '(target unavailable)',
    noValue: 'No value recorded',
    emptyList: 'Empty list',
    unsupportedVersion:
      'This board is unavailable because its version is unsupported: {{version}}.',
    loadFailed: 'The board is unavailable. Could not load {{url}}.',
    retry: 'Try again',
  },
  ui: {
    status: {
      known: 'Known',
      unknown: 'Unknown',
      unavailable: 'Unavailable',
    },
    close: 'Close',
    loading: 'Loading',
    unavailableExplanation: 'This information could not be read.',
    dismiss: 'Dismiss',
  },
};

export function provideBoardFacadeTestKit(document: BoardResponse = recordedBoard) {
  return {
    document,
    providers: [
      ...provideDotlnStateTestKit().providers,
      ...provideStorageTokenTestKit().providers,
      ...provideBoardDataAccess(),
      { provide: BoardApi, useValue: { load: () => of(document) } },
      BoardFacade,
      provideDotlnUi(),
      ...provideDotlnI18nTestKit({ langs: { en } }).providers,
    ],
  };
}
