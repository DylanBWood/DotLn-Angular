import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { provideToolsTestKit } from '../../../../../testing/src';
import { fillValues } from '../../../studies/study-text';
import { marblesFixture } from '../fixtures';
import { StudyMarbles } from './marbles';

function render(step = 4) {
  TestBed.configureTestingModule({ providers: [...provideToolsTestKit().providers] });
  const fixture = TestBed.createComponent(StudyMarbles);
  fixture.componentRef.setInput('model', marblesFixture);
  fixture.componentRef.setInput('step', step);
  // The text equivalent is the frame's own sentence, as the mapper fills it from the model.
  fixture.componentRef.setInput(
    'textEquivalent',
    fillValues('Frame {frame}: {now}.', marblesFixture.frames[step].values),
  );
  fixture.componentRef.setInput('moments', [{ label: 'Switch', step: 4 }]);
  fixture.componentRef.setInput('note', 'The first inner stream is cut off.');
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

it('draws the diagram with its text equivalent as the drawing’s name and beside it', () => {
  const { element } = render();
  const drawing = element.querySelector('svg');
  expect(drawing?.getAttribute('role')).toBe('img');
  expect(drawing?.getAttribute('aria-label')).toBe(
    'Frame 4: source$ emits b (second); inner(first) is cut off; inner(second) is opened.',
  );
  expect(element.querySelector('[data-testid="study-reading"]')?.textContent).toContain(
    'source$ emits b (second)',
  );
  expect(element.querySelector('.note')?.textContent).toContain('cut off');
  expect(element.querySelector('label')?.textContent).toContain('Frame 4 of 9');
  // The first inner stream's second value and completion were never received, so neither is drawn,
  // and the output lane has not reached its later values yet.
  expect(element.querySelectorAll('.marble')).toHaveLength(6);
  expect(element.querySelectorAll('.courier')).toHaveLength(0);
  expect(element.querySelectorAll('.marble.current')).toHaveLength(1);
  expect(element.querySelectorAll('.marble.current .ripple')).toHaveLength(1);
  // The line of the stepped frame is placed by a transform, so it can glide while playing.
  expect(element.querySelector('.cursor')?.getAttribute('style')).toContain('translate(269.78px');
  expect(element.querySelector('svg')?.classList.contains('gliding')).toBe(false);
  expect(element.querySelector('.operator-name')?.textContent).toContain('switchMap');
  expect(element.querySelectorAll('.complete')).toHaveLength(2);
  expect(element.querySelectorAll('.cut')).toHaveLength(1);
});

it('rides an output value down from the emission it comes from', () => {
  const { element } = render(3);
  expect(element.querySelector('svg')?.getAttribute('aria-label')).toBe(
    'Frame 3: inner(first) emits 1; out$ emits 1.',
  );
  const courier = element.querySelector('.courier');
  expect(courier?.textContent?.trim()).toBe('1');
  expect(courier?.querySelector('circle')?.getAttribute('data-tone')).toBe('actual');
  expect(element.querySelectorAll('.marble.landing')).toHaveLength(1);
  expect(element.querySelector('.marble.landing text')?.textContent?.trim()).toBe('1');
});

it('moves only when it is told to, and asks for the next frame by its output', () => {
  const { fixture, element } = render();
  const stepped: number[] = [];
  fixture.componentInstance.stepped.subscribe((step) => stepped.push(step));
  const before = element.querySelector('svg')?.innerHTML;
  fixture.detectChanges();
  expect(element.querySelector('svg')?.innerHTML).toBe(before);
  const [back, forward, moment] = element.querySelectorAll('button');
  back.click();
  forward.click();
  moment.click();
  expect(stepped).toEqual([3, 5, 4]);
  fixture.componentRef.setInput('step', 5);
  fixture.detectChanges();
  expect(element.querySelector('label')?.textContent).toContain('Frame 5 of 9');
  expect(element.querySelector('svg')?.innerHTML).not.toBe(before);
});

it('hands the keyboard to its slider', () => {
  const { fixture, element } = render();
  document.body.append(element);
  fixture.componentInstance.focus();
  expect(document.activeElement).toBe(element.querySelector('input'));
  element.remove();
});

it('lands on the first frame before it glides when Play starts over from the end', async () => {
  const { fixture, element } = render(9);
  const svg = () => element.querySelector('svg');
  const placed = () => element.querySelector('.cursor')?.getAttribute('style') ?? '';
  // The paint after the jump lays the line out on frame 0 with no transition, which the component
  // forces with a layout read, and only the paint after that asks it to glide on.
  const landed: [boolean, string][] = [];
  const laidOut = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    landed.push([svg()?.classList.contains('gliding') ?? true, placed()]);
    return new DOMRect();
  });
  fixture.componentRef.setInput('playing', true);
  fixture.componentRef.setInput('step', 0);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  // At the layout read the line stood on frame 0 with nothing to glide by.
  expect(landed).toHaveLength(1);
  expect(landed[0][0]).toBe(false);
  expect(landed[0][1]).toContain('translate(28px');
  expect(svg()?.classList.contains('gliding')).toBe(true);
  expect(placed()).toContain('translate(88.44px');
  // A step that follows in order keeps gliding, now towards frame 2, with no landing.
  laidOut.mockClear();
  fixture.componentRef.setInput('step', 1);
  fixture.detectChanges();
  expect(laidOut).not.toHaveBeenCalled();
  expect(svg()?.classList.contains('gliding')).toBe(true);
  expect(placed()).toContain('translate(148.89px');
  laidOut.mockRestore();
});
