import recordedBoard from '../../testing/fixtures/launchpad-board-2026-10-21.json';
import { BoardFacade } from '../facades/board.facade';
import { BoardFixtureToken } from '../models/board-fixture-token';
import type { BoardInput } from '../models/board-view-model';

export function provideBoardFeature(document: BoardInput = recordedBoard as BoardInput) {
  return [{ provide: BoardFixtureToken, useValue: document }, BoardFacade];
}
