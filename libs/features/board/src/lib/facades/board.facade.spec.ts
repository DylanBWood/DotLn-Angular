import { TestBed } from '@angular/core/testing';

import { provideBoardFacadeTestKit } from '@dotln-angular/board/testing';

import { BoardFacade } from './board.facade';

it('preserves document order, source counts and rejects unknown panel or external link intents', () => {
  const kit = provideBoardFacadeTestKit();
  TestBed.configureTestingModule({ providers: [...kit.providers] });
  const facade = TestBed.inject(BoardFacade);
  expect(facade.vm().selectedPanel).toBe('actors');
  expect(facade.vm().document.panels).toBe(kit.document.panels);
  expect(facade.vm().availableSources + facade.vm().unavailableSources).toBe(
    kit.document.sources.length,
  );
  facade.selectPanel('work');
  expect(facade.vm().selectedPanel).toBe('work');
  facade.selectPanel('not-a-panel');
  facade.follow({ label: 'External', target: 'https://example.test/run' });
  expect(facade.vm().selectedPanel).toBe('work');
  expect(facade.vm().targets.has('https://example.test/run')).toBe(false);
});
