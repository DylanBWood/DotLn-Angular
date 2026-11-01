import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../testing/src';
import type { StudySection, StudyView } from '../../types';
import { studyViewFixture } from '../study/fixtures';
import { StudyExplanation } from './study-explanation';

function render(section: StudySection, study: StudyView = studyViewFixture) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyExplanation);
  fixture.componentRef.setInput('section', section);
  fixture.componentRef.setInput('study', study);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('shows the complete pseudocode first and keeps each step’s lines behind a disclosure', () => {
  const { element } = render('mechanism');
  expect(element.querySelector('.algorithm-guide > pre')?.textContent).toContain(
    'position += direction * dt',
  );
  const steps = element.querySelectorAll('.code-lines');
  expect(steps).toHaveLength(2);
  expect(steps[1].querySelector('pre')?.textContent).toBe('position += direction * dt');
  expect(element.querySelectorAll('.code-lines[open]')).toHaveLength(0);
  const heading = element.querySelectorAll('h5')[1];
  expect(heading.textContent).toContain('2. Move');
  expect(steps[1].querySelector('summary')?.getAttribute('aria-describedby')).toBe(heading.id);
});

it('leaves the worked step out for a model with no arithmetic to show', () => {
  const { element } = render('mechanism', { ...studyViewFixture, worked: null });
  expect(element.querySelector('.worked-step')).toBeNull();
  expect(element.querySelector('.algorithm-guide')).not.toBeNull();
});

it('asks for the worked step’s moment to be shown', () => {
  const { fixture, element } = render('mechanism');
  let asked = 0;
  fixture.componentInstance.momentRequested.subscribe(() => asked++);
  element.querySelector<HTMLButtonElement>('.worked-step button')?.click();
  expect(asked).toBe(1);
});

it('labels the RxJS reading from the record', () => {
  const illustrative = render('reactive').element;
  expect(illustrative.querySelector('[data-testid="rxjs-label"]')?.textContent).toContain(
    'Illustrative',
  );
  TestBed.resetTestingModule();
  const executable = render('reactive', {
    ...studyViewFixture,
    rxjs: { code: 'frames$', executable: true },
  }).element;
  expect(executable.querySelector('[data-testid="rxjs-label"]')?.textContent).toContain(
    'Executable',
  );
});

it('reads the limits as prose and draws a comparison when the model has one', () => {
  const { element } = render('limits');
  expect(element.querySelector('.limits li')?.textContent).toBe('Seek overshoots a fixed target.');
  expect(element.querySelectorAll('.comparison .line')).toHaveLength(2);
  expect(element.querySelector('[data-testid="comparison-finding"]')?.textContent).toBe(
    'The scout passes the flag.',
  );
  TestBed.resetTestingModule();
  const plain = render('limits', { ...studyViewFixture, comparison: null }).element;
  expect(plain.querySelector('.comparison')).toBeNull();
});

it('introduces each implementation on its own terms and gives each reference its claim', () => {
  const { element } = render('elsewhere');
  const implementation = element.querySelector('.implementation');
  expect(implementation?.querySelector('a')?.getAttribute('href')).toBe(
    'https://example.org/library',
  );
  expect(implementation?.textContent).toContain('It runs scouts in a game.');
  expect(implementation?.textContent).toContain('It clips the acceleration itself.');
  const reference = element.querySelector('.references li');
  expect(reference?.querySelector('a')?.textContent).toBe('A public reference');
  expect(reference?.textContent).toContain('Seek accelerates toward the target at the limit.');
  TestBed.resetTestingModule();
  const none = render('elsewhere', { ...studyViewFixture, implementations: [] }).element;
  expect(none.querySelector('.implementations')).toBeNull();
});

it('gives each instance its own ids', () => {
  const one = render('mechanism').element;
  const other = TestBed.createComponent(StudyExplanation);
  other.componentRef.setInput('section', 'mechanism');
  other.componentRef.setInput('study', studyViewFixture);
  other.detectChanges();
  const two = other.nativeElement as HTMLElement;
  expect(one.querySelector('h5')?.id).not.toBe(two.querySelector('h5')?.id);
});
