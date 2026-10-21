import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';
import { provideDotlnUi } from '@dotln-angular/ui';

import { BoardFacade } from '../../../src/lib/facades/board.facade';
import { BoardFixtureToken } from '../../../src/lib/models/board-fixture-token';
import type { BoardInput } from '../../../src/lib/models/board-view-model';
import recordedBoard from '../../../src/testing/fixtures/launchpad-board-2026-10-21.json';

export function provideBoardFixtureTokenTestKit(
  document: BoardInput = recordedBoard as BoardInput,
) {
  return { document, providers: [{ provide: BoardFixtureToken, useValue: document }] };
}
export function provideBoardFacadeTestKit(document: BoardInput = recordedBoard as BoardInput) {
  const fixture = provideBoardFixtureTokenTestKit(document);
  return {
    document,
    providers: [
      ...fixture.providers,
      BoardFacade,
      provideDotlnUi(),
      ...provideDotlnI18nTestKit({
        langs: {
          en: {
            board: {
              title: 'The actor board',
              eyebrow: 'Workspace / Overview',
              description: 'Recorded board',
              panels: 'Board panels',
              sources: 'Sources & evidence',
              sourceCounts: '{{available}} available · {{unavailable}} unavailable',
              inspectSources: 'Inspect recorded sources',
              inspectEvidence: 'Inspect evidence records',
              noRows: 'No rows recorded.',
              noExplanation: 'No explanation supplied.',
              targetUnavailable: '(target unavailable)',
              noValue: 'No value recorded',
              emptyList: 'Empty list',
              unsupportedVersion: 'Unsupported board version: {{version}}',
            },
            ui: {
              status: { known: 'Known', unknown: 'Unknown', unavailable: 'Unavailable' },
              unavailableExplanation: 'This information could not be read.',
            },
          },
        },
      }).providers,
    ],
  };
}
