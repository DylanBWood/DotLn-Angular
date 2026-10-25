import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideDotlnI18nTestKit } from '@dotln-angular/i18n/testing';

import { DotlnSubAppMenu } from './sub-app-menu';
import { DotlnSubAppMenuGroup } from './sub-app-menu-group';

@Component({
  selector: 'dotln-menu-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dotln-sub-app-menu>
      <dotln-sub-app-menu-group [emptyMessage]="empty">
        <span menu-heading translate="no">{{ scene }}</span>
        <li menu-item><a href="#scene" translate="no">{{ scene }}</a></li>
      </dotln-sub-app-menu-group>
      <dotln-sub-app-menu-group [emptyMessage]="empty">
        <span menu-heading translate="no">{{ machinery }}</span>
        <li menu-item><a href="#board" translate="no">{{ board }}</a></li>
        <li menu-item><a href="#machinery" translate="no">{{ machinery }}</a></li>
      </dotln-sub-app-menu-group>
      <dotln-sub-app-menu-group [emptyMessage]="empty">
        <span menu-heading translate="no">{{ tools }}</span>
      </dotln-sub-app-menu-group>
    </dotln-sub-app-menu>
  `,
  imports: [DotlnSubAppMenu, DotlnSubAppMenuGroup],
})
class MenuHost {
  readonly scene = 'Scene';
  readonly machinery = 'Machinery';
  readonly tools = 'Tools';
  readonly board = 'Board';
  readonly empty = 'No tools yet.';
}

it('projects three groups into one labelled navigation landmark with valid lists and an empty line', async () => {
  TestBed.configureTestingModule({
    imports: [MenuHost],
    providers: [
      ...provideDotlnI18nTestKit({
        langs: { en: { shell: { navigation: 'Primary navigation' } } },
      }).providers,
    ],
  });
  const fixture = TestBed.createComponent(MenuHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelectorAll('nav')).toHaveLength(1);
  expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Primary navigation');
  expect([...element.querySelectorAll('h2')].map((heading) => heading.textContent?.trim())).toEqual(
    ['Scene', 'Machinery', 'Tools'],
  );
  const lists = [...element.querySelectorAll('ul')];
  expect(lists).toHaveLength(3);
  expect(lists.map((list) => list.querySelectorAll(':scope > li > a').length)).toEqual([1, 2, 0]);
  expect(element.querySelectorAll('.empty')).toHaveLength(1);
  expect(lists[2].textContent?.trim()).toBe('No tools yet.');
  expect(lists.every((list) => [...list.children].every((child) => child.tagName === 'LI'))).toBe(
    true,
  );
});
