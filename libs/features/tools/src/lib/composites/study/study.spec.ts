import { TestBed } from '@angular/core/testing';

import { provideToolsTestKit } from '../../../../testing/src';
import type { StudyIntent, StudyView } from '../../types';
import { studyViewFixture } from './fixtures';
import { Study } from './study';

function render(study: StudyView = studyViewFixture) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(Study);
  fixture.componentRef.setInput('study', study);
  fixture.componentRef.setInput('hrefFor', (id: string) => `/tools/catalog/${id}`);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

const summaries = (element: HTMLElement) =>
  [...element.querySelectorAll('section.study > details > summary > span:first-child')].map(
    (span) => span.textContent,
  );

it('marks itself authored and sets the drawing above the closed explanations', () => {
  const { element } = render();
  expect(element.querySelector('.eyebrow')?.textContent).toContain('A study author');
  expect(element.querySelector('.eyebrow')?.textContent).toContain('2026-10-31');
  expect(element.querySelector('h3')?.textContent).toBe('A scout and a flag');
  expect(element.querySelector('figure svg')).not.toBeNull();
  expect(summaries(element)).toEqual([
    'Follow the mechanism',
    'Think in streams',
    'Where this breaks down',
    'See it elsewhere',
  ]);
  expect(element.querySelectorAll('details[open]')).toHaveLength(0);
  expect(element.querySelector('dl')).toBeNull();
  expect(element.querySelector('tools-study-inputs label')?.textContent).toContain('Gap · 10');
});

it('leaves out what the study does not have, with no empty section', () => {
  const { element } = render({ ...studyViewFixture, visual: null, rxjs: null });
  expect(element.querySelector('figure')).toBeNull();
  expect(summaries(element)).not.toContain('Think in streams');
  expect(element.textContent).toContain('See it elsewhere');
});

it('creates an explanation only when its disclosure opens, from the view’s open state', async () => {
  const { fixture, element } = render();
  await fixture.whenStable();
  expect(element.querySelector('tools-study-explanation')).toBeNull();
  fixture.componentRef.setInput('study', { ...studyViewFixture, expanded: ['mechanism'] });
  fixture.detectChanges();
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(element.querySelector('tools-study-explanation')).not.toBeNull();
  });
  expect(element.querySelectorAll('details[open]')).toHaveLength(1);
  expect(element.querySelector('.algorithm-guide pre')?.textContent).toContain('direction');
  expect(element.querySelector('.worked-step h4')?.textContent).toBe(
    'Worked step: 2.00 → 2.50 seconds',
  );
});

it('reports a disclosure a reader toggles', () => {
  const { fixture, element } = render();
  const intents: StudyIntent[] = [];
  fixture.componentInstance.intent.subscribe((intent) => intents.push(intent));
  const details = element.querySelector(
    'section.study > details:not(.how-to-read)',
  ) as HTMLDetailsElement;
  details.open = true;
  details.dispatchEvent(new Event('toggle'));
  expect(intents).toEqual([{ kind: 'expand', section: 'mechanism', open: true }]);
});

it('keeps the small disclosures open across the drawing’s views, from the view’s state', () => {
  const { fixture, element } = render({
    ...studyViewFixture,
    expanded: ['example', 'numbers', 'inputs', 'legend'],
  });
  expect(element.querySelectorAll('details[open]')).toHaveLength(4);
  const visual = studyViewFixture.visual;
  fixture.componentRef.setInput('study', {
    ...studyViewFixture,
    expanded: ['example', 'numbers', 'inputs', 'legend'],
    visual: visual && { ...visual, view: 'timeline' },
  });
  fixture.detectChanges();
  expect(element.querySelector('tools-study-timeline')).not.toBeNull();
  expect(element.querySelectorAll('details[open]')).toHaveLength(4);
});

it('switches the drawing’s view and shows the chart for the same moment', () => {
  const { fixture, element } = render();
  const intents: StudyIntent[] = [];
  fixture.componentInstance.intent.subscribe((intent) => intents.push(intent));
  const [, timeline] = element.querySelectorAll<HTMLButtonElement>('.view-choice button');
  expect(timeline.textContent).toContain('Chart');
  timeline.click();
  expect(intents).toEqual([{ kind: 'view', view: 'timeline' }]);
  const visual = studyViewFixture.visual;
  fixture.componentRef.setInput('study', {
    ...studyViewFixture,
    visual: visual && { ...visual, view: 'timeline' },
  });
  fixture.detectChanges();
  expect(element.querySelector('tools-study-timeline .cursor')).not.toBeNull();
  expect(element.querySelector('tools-study-motion')).toBeNull();
});

it('hands on to the next study when there is one, and passes it up', () => {
  const { fixture, element } = render({
    ...studyViewFixture,
    next: { id: 'sample:2', title: 'Arrive' },
  });
  const followed: string[] = [];
  fixture.componentInstance.followed.subscribe((id) => followed.push(id));
  const link = element.querySelector('.next a') as HTMLAnchorElement;
  expect(link.textContent).toContain('Next study: Arrive');
  expect(link.getAttribute('href')).toBe('/tools/catalog/sample:2');
  link.click();
  expect(followed).toEqual(['sample:2']);
  TestBed.resetTestingModule();
  expect(render().element.querySelector('.next')).toBeNull();
});

it('reports a step, and passes a nearby concept up on a plain click only', () => {
  const { fixture, element } = render();
  const intents: StudyIntent[] = [];
  const followed: string[] = [];
  fixture.componentInstance.intent.subscribe((intent) => intents.push(intent));
  fixture.componentInstance.followed.subscribe((id) => followed.push(id));
  element.querySelectorAll<HTMLButtonElement>('tools-study-scrubber button')[1].click();
  expect(intents).toEqual([{ kind: 'step', step: 3 }]);
  const link = element.querySelector('.nearby a') as HTMLAnchorElement;
  expect(link.getAttribute('href')).toBe('/tools/catalog/sample:2');
  const plain = new MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(plain);
  expect(plain.defaultPrevented).toBe(true);
  expect(followed).toEqual(['sample:2']);
  const newTab = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
  link.dispatchEvent(newTab);
  expect(newTab.defaultPrevented).toBe(false);
  expect(followed).toEqual(['sample:2']);
});
