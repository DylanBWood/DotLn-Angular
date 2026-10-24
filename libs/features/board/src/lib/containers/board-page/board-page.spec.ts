import { TestBed } from '@angular/core/testing';

import { provideBoardFacadeTestKit } from '@dotln-angular/board/testing';
import { recordedBoard, unavailableBoard } from '@dotln-angular/board-data-access/testing';

import { BoardFacade } from '../../facades/board.facade';
import type { BoardInput } from '../../models/board-view-model';
import { BoardPage } from './board-page';

describe('recorded board container', () => {
  it('renders every unavailable section with its source explanation', async () => {
    const kit = provideBoardFacadeTestKit(unavailableBoard as BoardInput);
    TestBed.configureTestingModule({ imports: [BoardPage], providers: [...kit.providers] });
    const fixture = TestBed.createComponent(BoardPage);
    const facade = TestBed.inject(BoardFacade);
    const element: HTMLElement = fixture.nativeElement;

    for (const panel of kit.document.panels) {
      facade.selectPanel(panel.id);
      await fixture.whenStable();

      const active = element.querySelector('[role=tabpanel]:not([hidden])');
      expect(active).not.toBeNull();
      expect(active?.querySelectorAll('board-section')).toHaveLength(panel.sections.length);
      for (const section of panel.sections) {
        const rendered = active?.querySelector(`[id="${section.id}"]`);
        expect(rendered?.querySelector('dotln-unavailable')?.textContent).toContain('Unavailable');
        expect(rendered?.textContent).toContain(section.explanation);
      }
    }

    expect(facade.vm().availableSources).toBe(0);
    expect(facade.vm().unavailableSources).toBe(kit.document.sources.length);
  });

  it('refuses a mismatched view model version visibly', async () => {
    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        ...provideBoardFacadeTestKit({
          viewModelVersion: 'uifa-board-v99',
        } as BoardInput).providers,
      ],
    });
    const fixture = TestBed.createComponent(BoardPage);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('dotln-unavailable')?.textContent).toContain('uifa-board-v99');
    expect(element.querySelectorAll('[role=tab]')).toHaveLength(0);

    const facade = TestBed.inject(BoardFacade);
    expect(() => facade.selectPanel('actors')).not.toThrow();
    expect(() => facade.follow({ label: 'Old target', target: 'actors' })).not.toThrow();
  });

  it('retains addressable rows when a section is unavailable', async () => {
    const board = {
      ...recordedBoard,
      panels: recordedBoard.panels.map((panel) => ({
        ...panel,
        sections: panel.sections.map((section) => ({ ...section })),
      })),
    };

    const section = board.panels[0].sections.find((candidate) => candidate.rows.length);
    if (!section) throw new Error('The recorded Actors panel must contain a row.');
    section.status = 'unavailable';
    section.explanation = 'The source is unavailable; retained records remain evidence.';

    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [...provideBoardFacadeTestKit(board as BoardInput).providers],
    });
    const fixture = TestBed.createComponent(BoardPage);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const rendered = element.querySelector(`[id="${section.id}"]`);
    expect(rendered?.querySelector('dotln-unavailable')?.textContent).toContain(
      section.explanation,
    );
    expect(rendered?.querySelector(`[id="${section.rows[0].id}"]`)).not.toBeNull();
    expect(TestBed.inject(BoardFacade).vm().targets.has(section.rows[0].id)).toBe(true);
  });

  it('selects Actors first and exposes labels, values, statuses and local evidence links', async () => {
    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [...provideBoardFacadeTestKit().providers],
    });
    const fixture = TestBed.createComponent(BoardPage);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim()).toBe(
      'Actors',
    );
    expect(element.querySelectorAll('[role=tab]')).toHaveLength(5);
    expect(element.querySelector('board-row dt')?.textContent?.trim()).toBe('Actor kind');
    expect(element.querySelector('board-row dd')?.textContent).toContain('saved definition');
    expect(element.querySelector('board-row dd')?.textContent).toContain('Known');
    for (const link of element.querySelectorAll<HTMLAnchorElement>('board-link-mapper a'))
      expect(link.getAttribute('href')).toMatch(/^\/board#/);
  });
});
