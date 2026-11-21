import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { StudyRelations } from './relations';
import { loopStudy } from './relations.fixture';

it('renders a three-level return and exposes the same connection in the accessible reading', () => {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyRelations);
  const reading =
    'Meaning refers to Printed marks. To carry out the instruction, look back at the ink on this very card. Its six words have 25 letters altogether.';
  fixture.componentRef.setInput('model', loopStudy.relations);
  fixture.componentRef.setInput('step', 3);
  fixture.componentRef.setInput('textEquivalent', reading);
  fixture.detectChanges();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('svg')?.getAttribute('aria-label')).toBe(reading);
  expect(element.querySelector('[data-testid="study-reading"]')?.textContent).toContain(reading);
  expect(element.querySelector('.edge.active')?.getAttribute('data-edge')).toBe('return');
  expect(element.querySelector('.edge.active title')?.textContent).toBe(
    'Meaning refers to Printed marks',
  );
  expect(element.querySelectorAll('.node')).toHaveLength(3);
  const restart = [...element.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === 'Back to the start',
  );
  expect(restart).toBeDefined();
  const selected: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => selected.push(step));
  restart?.click();
  expect(selected).toEqual([0]);
});
