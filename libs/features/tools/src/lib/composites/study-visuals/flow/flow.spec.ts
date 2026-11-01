import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { flowFixture } from '../fixtures';
import { StudyFlow } from './flow';

const sentence = 'Step {step}: {moves}. {states}.';

function render(step = 2) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyFlow);
  fixture.componentRef.setInput('model', flowFixture);
  fixture.componentRef.setInput('step', step);
  // The text equivalent is the step's own sentence, as the mapper fills it from the model.
  fixture.componentRef.setInput(
    'textEquivalent',
    fillValues(sentence, flowFixture.frames[step].values),
  );
  fixture.componentRef.setInput('moments', [{ label: 'Taken', step: 3 }]);
  fixture.componentRef.setInput('note', flowFixture.frames[step].note ?? null);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('renders a three-stage flow to its text equivalent, naming the message that moves', () => {
  const { element } = render();
  const across = element.querySelector('.across') as HTMLElement;
  const drawing = across.querySelector('svg');
  expect(drawing?.getAttribute('role')).toBe('img');
  expect(drawing?.getAttribute('aria-label')).toBe(
    'Step 2: b (order 32) moves from Planner to Work queue. Work queue: holds orders 31 and 32; Executor: idle.',
  );
  expect(element.querySelector('[data-testid="study-reading"]')?.textContent).toContain(
    'b (order 32) moves from Planner to Work queue',
  );
  expect(element.querySelector('.note')?.textContent).toContain('Order 32 joins it');
  expect(element.querySelector('label')?.textContent).toContain('Step 2 of 3');
  expect([...across.querySelectorAll('.name')].map((name) => name.textContent?.trim())).toEqual([
    'Planner',
    'Work queue',
    'Executor',
  ]);
  expect(across.querySelectorAll('.node')).toHaveLength(3);
  expect(across.querySelectorAll('.link')).toHaveLength(2);
  expect(across.querySelectorAll('.link.active')).toHaveLength(1);
  expect(across.querySelector('.token[data-state="moving"]')?.textContent?.trim()).toBe('b');
  expect(across.querySelector('.token[data-state="held"]')?.textContent?.trim()).toBe('a');
});

it('draws the same step down the page for a phone, with the same text equivalent', () => {
  const { element } = render();
  const [across, down] = [...element.querySelectorAll('svg')];
  // The stylesheet shows one or the other by the screen's width; both say the same thing.
  expect(element.querySelector('.down svg')).toBe(down);
  expect(down.getAttribute('aria-label')).toBe(across.getAttribute('aria-label'));
  expect(down.getAttribute('viewBox')?.startsWith('0 0 360 ')).toBe(true);
  expect(down.querySelectorAll('.node')).toHaveLength(3);
  expect(down.querySelector('.token[data-state="moving"]')?.textContent?.trim()).toBe('b');
});

it('steps on command and moves nothing by itself', () => {
  const { fixture, element } = render(1);
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  const forward = [...element.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === 'Step forward',
  );
  forward?.click();
  const moment = [...element.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === 'Taken',
  );
  moment?.click();
  expect(stepped).toEqual([2, 3]);
  // Play is offered only when the reader has not asked for reduced motion.
  expect(
    [...element.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Play'),
  ).toBe(false);
});
