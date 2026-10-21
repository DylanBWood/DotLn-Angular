import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideUiTestKit } from '../../../../testing/src';
import { DotlnKeyValueList } from './key-value-list';

@Component({
  selector: 'dotln-list-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #value let-item
      ><span translate="no">{{ item.value }}</span></ng-template
    >
    <dotln-key-value-list [items]="items" scope="record" [valueTemplate]="value" />
  `,
  imports: [DotlnKeyValueList],
})
class ListHost {
  readonly items = [
    { key: 'count', label: 'Count', value: 0 },
    { key: 'enabled', label: 'Enabled', value: false },
  ];
}

it('pairs each label with the supplied value template without losing falsy values', async () => {
  TestBed.configureTestingModule({
    imports: [ListHost],
    providers: [...provideUiTestKit().providers],
  });
  const fixture = TestBed.createComponent(ListHost);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect([...element.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
    'Count',
    'Enabled',
  ]);
  expect([...element.querySelectorAll('dd')].map((node) => node.textContent?.trim())).toEqual([
    '0',
    'false',
  ]);
  expect(element.querySelector('[id="record:count"]')).not.toBeNull();
});
