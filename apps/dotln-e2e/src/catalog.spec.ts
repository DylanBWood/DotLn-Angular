import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

async function choose(page: Page, filter: string, value: string) {
  await page.getByRole('button', { name: filter, exact: true }).click();
  await page.getByRole('menuitem', { name: value, exact: true }).click();
}

test('the board does not fetch menu code and catalog filters need no extra script', async ({
  page,
}) => {
  const scripts: Promise<string>[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response.text());
  });
  await page.goto('/board');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
    'The actor board',
  );
  expect((await Promise.all(scripts)).join('\n')).not.toContain('dotln-menu');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Catalog' })
    .click();
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  expect((await Promise.all(scripts)).join('\n')).toContain('dotln-menu');
  const loaded = scripts.length;
  await choose(page, 'Work', 'eip');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '288');
  expect(scripts).toHaveLength(loaded);
});

test('Tools home links to the catalog and independent filters narrow its rows', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Tools');
  await page.getByRole('link', { name: 'Browse the catalog' }).click();
  await expect(page).toHaveURL(/\/tools\/catalog$/);
  const count = page.getByTestId('catalog-count');
  await expect(count).toHaveAttribute('data-count', '3463');
  await expect(page.locator('[data-tool-id]')).toHaveCount(50);
  await choose(page, 'Work', 'eip');
  await expect(count).toHaveAttribute('data-count', '288');
  await expect(page.locator('[data-tool-id]:not([data-work="eip"])')).toHaveCount(0);
  await choose(page, 'Transform kind', 'channel.policy');
  await expect(count).not.toHaveAttribute('data-count', '288');
  expect(Number(await count.getAttribute('data-count'))).toBeGreaterThan(0);
  await expect(page.locator('[data-tool-id]:not([data-transform="channel.policy"])')).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(count).toHaveAttribute('data-count', '3463');
  expect(errors).toEqual([]);
});

test('untyped tools show their reason and selection survives a reload', async ({ page }) => {
  await page.goto('/tools/catalog');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  await choose(page, 'Status', 'untyped');
  const first = page.locator('[data-tool-id]').first();
  await expect(first).toHaveAttribute('data-status', 'untyped');
  await expect(first.locator('.reason')).not.toBeEmpty();
  const id = await first.getAttribute('data-tool-id');
  await first.getByRole('button').click();
  await expect(page.locator('tools-tool-faces')).toContainText(id ?? 'missing');
  await expect(page.locator('tools-tool-faces dt')).toHaveText([
    'Scene',
    'Selection',
    'Transform',
    'Observable',
    'Toy metrics',
  ]);
  await page.reload();
  await expect(page.locator('tools-tool-faces')).toContainText(id ?? 'missing');
  await expect(page.locator('[data-tool-id]:not([data-status="untyped"])')).toHaveCount(0);
});

test('keyboard opens a filter and pagination changes the visible slice', async ({ page }) => {
  await page.goto('/tools/catalog');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  const first = await page.locator('[data-tool-id]').first().getAttribute('data-tool-id');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('[data-tool-id]').first()).not.toHaveAttribute(
    'data-tool-id',
    first ?? 'missing',
  );
  const selected = page.locator('[data-tool-id]').last().getByRole('button');
  await selected.click();
  const details = page.getByRole('complementary', { name: 'Tool details' });
  await expect(details).toBeFocused();
  await expect(details).toBeInViewport();
  await details.getByRole('button', { name: 'Back to selected tool' }).click();
  await expect(selected).toBeFocused();
  await expect(selected).toBeInViewport();
  await page.getByRole('button', { name: 'Work', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu', { name: 'Work', exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'eip', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '288');
  await page.getByRole('button', { name: 'Work', exact: true }).press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Work', exact: true })).toBeFocused();
});

test('an unknown Tools path renders a not-found page with a working board link', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/nope');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(main.getByRole('link', { name: 'Back to the actor board' })).toHaveAttribute(
    'href',
    '/board',
  );
  await main.getByRole('link', { name: 'Back to the actor board' }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('The actor board');
  expect(errors).toEqual([]);
});

test('keyboard scrolling keeps its selection under a stationary pointer and pointer use resumes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/tools/catalog');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  const trigger = page.getByRole('button', { name: 'Transform kind', exact: true });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'steer.blend', exact: true }).hover();
  const items = page.getByRole('menuitem');
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.first()).toBeFocused();
  const names = (await items.allTextContents()).map((name) => name.trim());
  for (let index = 1; index <= names.indexOf('channel.policy'); index++) {
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(index)).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '90');
  await trigger.press('Enter');
  const pointed = page.getByRole('menuitem', { name: 'steer.blend', exact: true });
  await page.mouse.move(0, 0);
  await pointed.hover();
  await expect(pointed).toBeFocused();
  await pointed.click();
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3');
  await trigger.press('Enter');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test.describe('touch menu input', () => {
  test.use({ hasTouch: true });

  test('tap selects a filter value', async ({ page }) => {
    await page.goto('/tools/catalog');
    await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
    await page.getByRole('button', { name: 'Work', exact: true }).tap();
    await page.getByRole('menuitem', { name: 'eip', exact: true }).tap();
    await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '288');
    await expect(page.getByRole('menu', { name: 'Work', exact: true })).toHaveCount(0);
  });
});

test('catalog meets the board serious/critical accessibility threshold', async ({ page }) => {
  await page.goto('/tools/catalog');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  await page.locator('[data-tool-id]').first().getByRole('button').click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    ),
  ).toEqual([]);
});

for (const width of [360, 768, 1440]) {
  test(`catalog and its filters fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/catalog');
    await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
    await choose(page, 'Status', 'untyped');
    await page.locator('[data-tool-id]').first().getByRole('button').click();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: 'Transform kind', exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('menuitem', { name: 'level.ring', exact: true }).click();
    await expect(page.getByRole('menu', { name: 'Transform kind', exact: true })).toHaveCount(0);
    await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '0');
  });
}
