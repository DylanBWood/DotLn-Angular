import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { momentsFixture, motionFixture } from '../fixtures';
import { StudyMotion } from './motion';

function render(step = 4) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyMotion);
  fixture.componentRef.setInput('model', motionFixture);
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('textEquivalent', 'The scout is 56 units away.');
  fixture.componentRef.setInput('moments', momentsFixture);
  fixture.componentRef.setInput('note', 'Still closing.');
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('draws the moment with its text equivalent as the drawing’s name and beside it', () => {
  const { element } = render();
  const drawing = element.querySelector('svg');
  expect(drawing?.getAttribute('role')).toBe('img');
  expect(drawing?.getAttribute('aria-label')).toBe('The scout is 56 units away.');
  expect(element.querySelector('[data-testid="study-reading"]')?.textContent).toContain(
    'The scout is 56 units away.',
  );
  expect(element.querySelector('.note')?.textContent).toContain('Still closing.');
  expect(element.querySelector('label')?.textContent).toContain('2.0 seconds');
  expect(element.querySelectorAll('.body')).toHaveLength(2);
  expect(element.querySelector('polygon.body')).not.toBeNull();
  expect(element.querySelector('circle.body')).not.toBeNull();
});

it('moves only when it is told to, and asks for the next moment by its output', () => {
  const { fixture, element } = render();
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  const before = element.querySelector('svg')?.innerHTML;
  fixture.detectChanges();
  expect(element.querySelector('svg')?.innerHTML).toBe(before);
  const [back, forward, start, close] = element.querySelectorAll('button');
  back.click();
  forward.click();
  start.click();
  close.click();
  expect(stepped).toEqual([3, 5, 0, 8]);
});

it('hands the keyboard to its slider', () => {
  const { fixture, element } = render();
  document.body.append(element);
  fixture.componentInstance.focus();
  expect(document.activeElement).toBe(element.querySelector('input'));
  element.remove();
});
