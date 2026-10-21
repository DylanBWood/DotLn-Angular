import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnTabList } from './tab-list';
import { DotlnTabPanel } from './tab-panel';
import { DotlnTabs } from './tabs';

@Component({
  selector: 'dotln-tabs-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-tabs>
      <dotln-tab-list [items]="items" [label]="label" [(selected)]="selected" />
      @for (item of items; track item.id) {
        <ng-template #content
          ><p translate="no">{{ item.label }}</p></ng-template
        >
        <dotln-tab-panel [value]="item.id" [content]="content" />
      }
    </dotln-tabs>
  `,
  imports: [DotlnTabs, DotlnTabList, DotlnTabPanel],
})
class TabsHost {
  readonly label = 'Example panels';
  readonly items = [
    { id: 'actors', label: 'Actors' },
    { id: 'builds', label: 'Builds' },
    { id: 'work', label: 'Work' },
  ];
  readonly selected = signal('actors');
}

it('owns tab/panel semantics and follows arrow, Home and End focus', async () => {
  TestBed.configureTestingModule({
    imports: [TabsHost],
    providers: [...provideUiTestKit().providers],
  });
  const fixture = TestBed.createComponent(TabsHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  const tabs = [...element.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  expect(tabs).toHaveLength(3);
  expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  tabs[0].focus();
  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await fixture.whenStable();
  expect(fixture.componentInstance.selected()).toBe('builds');
  expect(document.activeElement).toBe(tabs[1]);
  tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await fixture.whenStable();
  expect(fixture.componentInstance.selected()).toBe('work');
  tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await fixture.whenStable();
  expect(fixture.componentInstance.selected()).toBe('actors');
  const panelId = tabs[0].getAttribute('aria-controls');
  expect(element.querySelector(`[id="${panelId}"]`)?.getAttribute('role')).toBe('tabpanel');
  expect(element.querySelector('[role=tabpanel]:not([hidden])')?.textContent).toContain('Actors');
});
