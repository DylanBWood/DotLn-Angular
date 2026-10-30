import { expect, test } from '@playwright/test';

const story = (id: string) => `http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`;
for (const id of [
  'ui-badge--default',
  'ui-badge--unknown',
  'ui-badge--unavailable',
  'ui-button--default',
  'ui-button--disabled',
  'ui-button--replace',
  'ui-button--trailing',
  'ui-button--overlay',
  'ui-button--small',
  'ui-button--primary',
  'ui-card--default',
  'ui-skeleton--default',
  'ui-empty-state--default',
  'ui-unavailable--default',
  'ui-page-header--default',
  'ui-key-value-list--default',
  'ui-tabs--default',
]) {
  test(`${id} visual state`, async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(story(id));
    await expect(page.locator('#storybook-root > *').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#storybook-root')).toHaveScreenshot(`${id}.png`);
  });
}

test('the menu overlay is positioned and its keyboard focus is visible', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  await page.goto(story('ui-menu--default'));
  await page.getByRole('button', { name: 'Inspect', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('menu-open.png');
});

test('the dialog surface, backdrop and focus ring are legible', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto(story('ui-dialog--default'));
  await page.getByRole('button', { name: 'Open details', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('dialog-open.png');
});

for (const id of [
  'board-page--unavailable',
  'board-page--unsupported-version',
  'shell-app-layout--default',
]) {
  test(`${id} page state`, async ({ page }) => {
    await page.goto(story(id));
    await expect(page.locator('#storybook-root > *').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${id}.png`);
  });
}
