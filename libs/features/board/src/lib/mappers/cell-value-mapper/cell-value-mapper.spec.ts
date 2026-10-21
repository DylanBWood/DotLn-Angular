import { TestBed } from '@angular/core/testing';

import { provideBoardFacadeTestKit } from '@dotln-angular/board/testing';
import type { Cell, CellValue } from '@dotln-angular/models';

import { CellValueMapper } from './cell-value-mapper';

it.each<[CellValue, string]>([
  [false, 'false'],
  [0, '0'],
  ['', ''],
  [null, 'No value recorded'],
  [['a', 0, false], 'a0false'],
  [[], 'Empty list'],
])('preserves cell value %j and its status', async (value, expected) => {
  TestBed.configureTestingModule({
    imports: [CellValueMapper],
    providers: [...provideBoardFacadeTestKit().providers],
  });
  const fixture = TestBed.createComponent(CellValueMapper);
  const common = {
    key: 'value',
    label: 'Value',
    explanation: 'Recorded explanation',
    evidence: [],
  };
  const cell: Cell =
    value === null
      ? { ...common, value, status: 'unknown' }
      : { ...common, value, status: 'known' };
  fixture.componentRef.setInput('cell', cell);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('.value')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(expected);
  expect(element.textContent).toContain(value === null ? 'Unknown' : 'Known');
  expect(element.textContent).toContain('Recorded explanation');
});
