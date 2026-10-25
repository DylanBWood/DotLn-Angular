import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the root keeps the actor board and the menu groups its three links with an empty Tools group', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/board$/);
  const menu = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(menu.getByRole('heading')).toHaveText(['Scene', 'Machinery', 'Tools']);
  await expect(menu.getByRole('list')).toHaveCount(3);
  await expect(menu.getByRole('link')).toHaveText(['Scene', 'Board', 'Machinery']);
  await expect(menu.getByText('No tools yet.', { exact: true })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Board', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
});

test('keyboard reaches every menu link and activates the sub-app routes', async ({ page }) => {
  await page.goto('/board');
  const menu = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(menu.getByRole('link')).toHaveCount(3);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  for (const name of ['Scene', 'Board', 'Machinery']) {
    await page.keyboard.press('Tab');
    await expect(menu.getByRole('link', { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/machinery$/);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Machinery');
  await expect(menu.getByRole('link', { name: 'Machinery', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
  await menu.getByRole('link', { name: 'Scene', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/scene$/);
  await expect(menu.getByRole('link', { name: 'Scene', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
});

for (const [route, title, order] of [
  ['scene', 'Scene', 'WO-015'],
  ['machinery', 'Machinery', 'WO-016'],
]) {
  test(`${route} deep link renders its arriving page, returns to the board, and supports browser history`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${route}`);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(main.locator('dotln-empty-state')).toContainText(order);
    await main.getByRole('link', { name: 'Back to the actor board' }).click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('The actor board');
    await page.goBack();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(title);
    expect(errors).toEqual([]);
  });

  test(`${route} meets the board's serious/critical WCAG threshold`, async ({ page }) => {
    await page.goto(`/${route}`);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(title);
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
    test(`${route} and the menu fit a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${route}`);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(title);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      for (const link of await page.getByRole('navigation').getByRole('link').all()) {
        await expect(link).toBeVisible();
        const bounds = await link.evaluate((element) => {
          const { x, width } = element.getBoundingClientRect();
          return { x, width };
        });
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
    });
  }
}

test('the menu story replaces the Tools empty state when an item is projected', async ({
  page,
}) => {
  await page.goto(
    'http://127.0.0.1:6006/iframe.html?id=shell-sub-app-menu--with-tools&viewMode=story',
  );
  const menu = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(menu.getByRole('link', { name: 'Catalog' })).toBeVisible();
  await expect(menu.getByText('No tools yet.', { exact: true })).toHaveCount(0);
});
