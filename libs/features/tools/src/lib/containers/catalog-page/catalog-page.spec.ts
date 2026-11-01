import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import type { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { CatalogToken } from '@dotln-angular/catalog';
import { ChildPaths } from '@dotln-angular/core';

import { provideToolsTestKit } from '../../../../testing/src';
import { CatalogPage } from './catalog-page';

const heading = (harness: RouterTestingHarness) =>
  (harness.routeNativeElement as HTMLElement).querySelector('article h2')?.textContent;

async function open(path: string, more: readonly Provider[] = []) {
  TestBed.configureTestingModule({
    providers: [
      ...provideToolsTestKit().providers,
      ...more,
      provideRouter(
        [
          { path: `tools/${ChildPaths.Catalog}`, component: CatalogPage },
          { path: `tools/${ChildPaths.Reading}`, component: CatalogPage },
        ],
        withComponentInputBinding(),
      ),
      provideLocationMocks(),
    ],
  });
  const harness = await RouterTestingHarness.create(path);
  // An app does this on its first navigation; it is what makes the router hear Back.
  TestBed.inject(Router).setUpLocationChangeListener();
  await vi.waitFor(() => {
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('tools-work-shelf')).not.toBeNull();
  });
  return harness;
}

const settle = async (harness: RouterTestingHarness) => {
  await harness.fixture.whenStable();
  harness.detectChanges();
};

it('presents a shelf, a readable definition and an untyped reason without a label-value grid', async () => {
  const harness = await open('/tools/catalog/sample:2');
  await settle(harness);
  const element = harness.routeNativeElement as HTMLElement;
  expect(element.querySelector('h1')?.textContent).toBe('Catalog');
  expect(element.querySelectorAll('tools-work-shelf li')).toHaveLength(3);
  expect(element.querySelector('[data-testid="definition"]')?.textContent).toContain(
    'business transaction',
  );
  expect(element.querySelector('tools-concept-reading')?.textContent).toContain(
    'The scene needs a transaction contract.',
  );
  expect(element.querySelector('dl')).toBeNull();
});

it('opens the reading a shared link names, and says when it names nothing', async () => {
  const harness = await open('/tools/catalog/sample:1');
  await settle(harness);
  expect(heading(harness)).toBe('Flock');
  await harness.navigateByUrl('/tools/catalog/nothing:1');
  await settle(harness);
  const element = harness.routeNativeElement as HTMLElement;
  expect(element.querySelector('[role="alert"]')?.textContent).toContain('names no concept');
});

it('writes the address when a concept opens, and Back returns to the previous reading', async () => {
  const harness = await open('/tools/catalog/sample:1');
  await settle(harness);
  const page = harness.routeDebugElement?.componentInstance as CatalogPage;
  const location = TestBed.inject(Location);
  page.open('sample:2');
  await settle(harness);
  expect(location.path()).toBe('/tools/catalog/sample:2');
  expect(heading(harness)).toBe('Unit of Work');
  location.back();
  await vi.waitFor(() => {
    harness.detectChanges();
    expect(heading(harness)).toBe('Flock');
  });
  expect(location.path()).toBe('/tools/catalog/sample:1');
  // Back was a return, so the page's own return control has nowhere left to go.
  expect(page.vm().canReturn).toBe(false);
});

it('moves the address with the page’s own return control', async () => {
  const harness = await open('/tools/catalog/sample:1');
  await settle(harness);
  const page = harness.routeDebugElement?.componentInstance as CatalogPage;
  page.open('sample:2');
  await settle(harness);
  page.back();
  await settle(harness);
  expect(TestBed.inject(Location).path()).toBe('/tools/catalog/sample:1');
  expect(heading(harness)).toBe('Flock');
});

it('leaves the reading when another work is chosen', async () => {
  const harness = await open('/tools/catalog/sample:1');
  await settle(harness);
  const page = harness.routeDebugElement?.componentInstance as CatalogPage;
  page.chooseWork('poeaa');
  await settle(harness);
  expect(TestBed.inject(Location).path()).toBe('/tools/catalog');
  expect(heading(harness)).toBeUndefined();
});

it('lists a chosen work’s studied concepts when no concept is open', async () => {
  const harness = await open('/tools/catalog');
  await settle(harness);
  const page = harness.routeDebugElement?.componentInstance as CatalogPage;
  const element = harness.routeNativeElement as HTMLElement;
  expect(element.querySelector('.studied-list')).toBeNull();
  page.chooseWork('aifg');
  await settle(harness);
  expect(element.querySelector('.studied-list a')?.textContent).toBe('Flock');
  expect(element.querySelector('.studied-list a')?.getAttribute('href')).toBe(
    '/tools/catalog/sample:1',
  );
});

it('says when the studied marks could not load, keeps the catalog and retries them', async () => {
  const { loader } = provideToolsTestKit().catalog;
  let fail = true;
  const summary = async () => {
    if (fail) throw new Error('Unavailable');
    return loader.summary();
  };
  const harness = await open('/tools/catalog', [
    { provide: CatalogToken, useValue: { ...loader, summary } },
  ]);
  const element = harness.routeNativeElement as HTMLElement;
  await vi.waitFor(() => {
    harness.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('marks');
  });
  expect(element.querySelector('tools-work-shelf')).not.toBeNull();
  fail = false;
  (element.querySelector('[role="alert"] + button') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    harness.detectChanges();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });
});

it('gives every reading link a real address', async () => {
  const harness = await open('/tools/catalog/sample:1');
  await settle(harness);
  const page = harness.routeDebugElement?.componentInstance as CatalogPage;
  expect(page.hrefFor('aifg-a:186')).toBe('/tools/catalog/aifg-a:186');
});
