import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { statesFixture } from '../fixtures';
import { StudyStates } from './states';

const sentence = 'Step {step}: {moves}. {placements}.';

function render(step = 2) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyStates);
  fixture.componentRef.setInput('model', statesFixture);
  fixture.componentRef.setInput('step', step);
  // The text equivalent is the step's own sentence, as the mapper fills it from the model.
  fixture.componentRef.setInput(
    'textEquivalent',
    fillValues(sentence, statesFixture.frames[step].values),
  );
  fixture.componentRef.setInput('moments', [{ label: 'Committed', step: 4 }]);
  fixture.componentRef.setInput('note', statesFixture.frames[step].note ?? null);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('renders a four-state register to its text equivalent, naming every register', () => {
  const { element } = render();
  const wide = element.querySelector('.wide') as HTMLElement;
  const drawing = wide.querySelector('svg');
  expect(drawing?.getAttribute('role')).toBe('img');
  expect(drawing?.getAttribute('aria-label')).toBe(
    'Step 2: Scene B moves from Clean to Dirty by registerDirty. Clean: Scene A; New: Scene C; Dirty: Scene B; Removed: none.',
  );
  expect(element.querySelector('[data-testid="study-reading"]')?.textContent).toContain(
    'New: Scene C; Dirty: Scene B; Removed: none',
  );
  expect(element.querySelector('.note')?.textContent).toContain(
    'At step 2, Scene B moves from Clean to Dirty by registerDirty.',
  );
  expect(element.querySelector('label')?.textContent).toContain('Step 2 of 4');
  expect([...wide.querySelectorAll('.heading')].map((text) => text.textContent?.trim())).toEqual([
    'Clean',
    'New',
    'Dirty',
    'Removed',
  ]);
  expect(wide.querySelector('.token[data-state="moving"]')?.textContent?.trim()).toBe('B');
  expect(wide.querySelectorAll('.token[data-state="resting"]')).toHaveLength(2);
  expect(wide.querySelector('.transition')?.textContent?.trim()).toBe('registerDirty');
});

it('draws the same step for a phone, with the same text equivalent', () => {
  const { element } = render();
  const [wide, narrow] = [...element.querySelectorAll('svg')];
  // The stylesheet shows one or the other by the screen's width; both say the same thing.
  expect(element.querySelector('.narrow svg')).toBe(narrow);
  expect(narrow.getAttribute('aria-label')).toBe(wide.getAttribute('aria-label'));
  expect(narrow.getAttribute('viewBox')?.startsWith('0 0 330 ')).toBe(true);
});

it('steps on command and moves nothing by itself', () => {
  const { fixture, element } = render(1);
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  const button = (name: string) =>
    [...element.querySelectorAll('button')].find((each) => each.textContent?.trim() === name);
  button('Step forward')?.click();
  button('Committed')?.click();
  expect(stepped).toEqual([2, 4]);
  // Play is offered only when the reader has not asked for reduced motion.
  expect(button('Play')).toBeUndefined();
});
