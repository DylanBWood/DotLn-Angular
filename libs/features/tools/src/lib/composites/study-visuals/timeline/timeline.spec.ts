import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { timelineFixture } from '../fixtures';
import { StudyTimeline } from './timeline';

function render(step: number | null) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyTimeline);
  fixture.componentRef.setInput('model', timelineFixture);
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('textEquivalent', 'Speed rises, then falls.');
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('marks the moment, one dot on each series, and moves by hand', () => {
  const { fixture, element } = render(4);
  expect(element.querySelector('svg')?.getAttribute('aria-label')).toBe('Speed rises, then falls.');
  expect(element.querySelectorAll('.line')).toHaveLength(2);
  expect(element.querySelectorAll('.dot')).toHaveLength(2);
  expect(element.querySelector('.cursor')).not.toBeNull();
  expect(element.querySelector('label')?.textContent).toContain('2.0 seconds');
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  element.querySelectorAll('button')[1].click();
  expect(stepped).toEqual([5]);
});

it('keeps its controls at the first moment', () => {
  expect(render(0).element.querySelector('input')).not.toBeNull();
});

it('is a still chart without a moment', () => {
  const { element } = render(null);
  expect(element.querySelector('.cursor')).toBeNull();
  expect(element.querySelector('input')).toBeNull();
  expect(element.querySelector('[data-testid="study-reading"]')).toBeNull();
  expect(element.querySelectorAll('.line')).toHaveLength(2);
});
