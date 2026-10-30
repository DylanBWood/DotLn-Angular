import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('renders five panels, selects Actors first and preserves cell label, value and status', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/board');
  await expect(page).toHaveTitle('DotLn');
  await expect(page.getByRole('heading', { name: 'The actor board', exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveText([
    'Actors',
    'Builds',
    'Mechanisms',
    'Work',
    'Blueprint',
  ]);
  await expect(page.getByRole('tab', { name: 'Actors', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const firstRow = page.locator('board-row').first();
  await expect(firstRow.locator('dt').first()).toHaveText('Actor kind');
  await expect(firstRow.locator('dd').first()).toContainText('saved definition');
  await expect(firstRow.locator('dd').first().locator('dotln-badge')).toHaveText('Known');
  await expect(firstRow.locator('dotln-badge[data-status="unknown"]')).toHaveText('Unknown');
  expect(errors).toEqual([]);
});

test('keyboard reaches main through the skip link without a reload and navigates tabs with arrows, Home and End', async ({
  page,
}) => {
  await page.goto('/board');
  await expect(page.getByRole('tab')).toHaveCount(5);
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  // Start from a panel other than the initial one, in a document marked as this load.
  await page.getByRole('tab', { name: 'Work', exact: true }).click();
  await page.evaluate(() => {
    document.documentElement.dataset['load'] = 'first';
  });
  await skipLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page).toHaveURL(/\/board$/);
  expect(await page.evaluate(() => document.documentElement.dataset['load'])).toBe('first');
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Blueprint', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'Blueprint', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Actors', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Blueprint', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('local links select a hidden panel or disclose evidence and move focus to the target', async ({
  page,
}) => {
  await page.goto('/board');
  const link = page.getByRole('link', { name: 'Inspect saved build', exact: true }).first();
  const target = decodeURIComponent(
    new URL((await link.getAttribute('href')) ?? '', 'http://localhost').hash.slice(1),
  );
  await link.click();
  await expect(page.getByRole('tab', { name: 'Builds', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator(`[id="${target}"]`)).toBeFocused();
  await page.getByRole('link', { name: 'evidence-1', exact: true }).first().click();
  await expect(page.locator('#evidence-1')).toBeVisible();
  await expect(page.locator('#evidence-1')).toBeFocused();
  await expect(page).toHaveURL(/\/board#evidence-1$/);
});

for (const panel of ['Actors', 'Builds', 'Mechanisms', 'Work', 'Blueprint']) {
  test(`${panel} meets the serious/critical WCAG 2.2 AA threshold`, async ({ page }) => {
    await page.goto('/board');
    await page.getByRole('tab', { name: panel, exact: true }).click();
    await expect(page.getByRole('tab', { name: panel, exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      ),
    ).toEqual([]);
  });
}

for (const width of [360, 768, 1440]) {
  test(`the board fits a ${width}px viewport without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/board');
    for (const panel of ['Actors', 'Builds', 'Mechanisms', 'Work', 'Blueprint']) {
      await page.getByRole('tab', { name: panel, exact: true }).click();
      await expect(page.getByRole('heading', { name: panel, exact: true, level: 2 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits).toBe(true);
    }
  });
}

test('failure from the MSW route shows unavailable and a dismissible shell notice', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'x-dotln-test-scenario': 'refusal' });
  await page.goto('/board');
  await expect(page.locator('dotln-empty-state')).toContainText('The board is unavailable');
  await expect(page.locator('dotln-toast')).toContainText('A request failed');
  await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await expect(page.locator('dotln-toast')).toHaveCount(0);
  await page.setExtraHTTPHeaders({});
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('tab')).toHaveCount(5);
});

test('query flag hides the sources footer and navigation preserves its query', async ({ page }) => {
  await page.goto('/board?ff=sourcesFooter:off');
  await expect(page.getByRole('tab')).toHaveCount(5);
  await expect(page.locator('[sources-footer]')).toBeHidden();
  await page.getByRole('link', { name: 'Inspect saved build', exact: true }).first().click();
  await expect(page).toHaveURL(/\/board\?ff=sourcesFooter:off#/);
  await expect(page.getByRole('tab', { name: 'Builds', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('link', { name: 'evidence-1', exact: true }).first().click();
  await expect(page.locator('[sources-footer]')).toBeVisible();
  await expect(page.locator('#evidence-1')).toBeFocused();
});

test('a copied anchor opens the canonical route, selects its panel and focuses its target', async ({
  page,
  context,
}) => {
  await page.goto('/board');
  const link = page.getByRole('link', { name: 'Inspect saved build', exact: true }).first();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^\/board#/);
  const direct = await context.newPage();
  await direct.goto(href ?? '/board');
  await expect(direct.getByRole('tab', { name: 'Builds', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const target = decodeURIComponent(new URL(href ?? '', 'http://localhost').hash.slice(1));
  await expect(direct.locator(`[id="${target}"]`)).toBeFocused();
  await direct.getByRole('tab', { name: 'Work', exact: true }).click();
  await expect(direct.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(direct).toHaveURL(/\/board$/);
  await direct.reload();
  await expect(direct.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await direct.close();
});

test('selection survives a reload on the same origin', async ({ page }) => {
  await page.goto('/board');
  await page.getByRole('tab', { name: 'Work', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['dotln-angular.board']);
});
