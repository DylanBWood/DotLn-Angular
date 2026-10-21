import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (id: string) => `http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`;

const examples = [
  ['ui-icon--default', 'dotln-icon'],
  ['ui-badge--default', 'dotln-badge'],
  ['ui-badge--unknown', 'dotln-badge'],
  ['ui-badge--unavailable', 'dotln-badge'],
  ['ui-visually-hidden--default', 'button'],
  ['ui-button--default', 'dotln-button'],
  ['ui-button--replace', 'dotln-button'],
  ['ui-button--trailing', 'dotln-button'],
  ['ui-button--overlay', 'dotln-button'],
  ['ui-card--default', 'dotln-card'],
  ['ui-skeleton--default', 'dotln-skeleton'],
  ['ui-empty-state--default', 'dotln-empty-state'],
  ['ui-unavailable--default', 'dotln-unavailable'],
  ['ui-page-header--default', 'dotln-page-header'],
  ['ui-key-value-list--default', 'dotln-key-value-list'],
  ['ui-tabs--default', 'dotln-tab-list'],
  ['ui-menu--default', 'dotln-menu'],
  ['ui-dialog--default', 'dotln-button'],
  ['shell-app-layout--default', 'dotln-app-layout'],
  ['board-page--recorded', 'board-page'],
  ['board-page--unavailable', 'board-page'],
  ['board-page--unsupported-version', 'dotln-unavailable'],
];
for (const [id, selector] of examples) {
  test(`${id} renders without browser errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(story(id));
    await expect(page.locator('#storybook-root').locator(selector).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('menu keyboard navigation skips disabled items, selects an item and restores trigger focus', async ({
  page,
}) => {
  await page.goto(story('ui-menu--default'));
  const trigger = page.getByRole('button', { name: 'Inspect', exact: true });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Source record', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Evidence', exact: true })).toBeFocused();
  await expect(
    page.getByRole('menuitem', { name: 'Unavailable action', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Source record', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('source');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('dialog traps focus, has an accessible label and restores focus after Escape', async ({
  page,
}) => {
  await page.goto(story('ui-dialog--default'));
  const trigger = page.getByRole('button', { name: 'Open details', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Evidence details', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('link')).toBeFocused();
  const result = await new AxeBuilder({ page })
    .include('dotln-dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    ),
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('unavailable and unsupported-version stories retain their explanations', async ({ page }) => {
  await page.goto(story('board-page--unavailable'));
  await expect(page.locator('board-section').first().locator('dotln-unavailable')).toContainText(
    'Unavailable',
  );
  await page.goto(story('board-page--unsupported-version'));
  await expect(page.locator('dotln-unavailable')).toContainText('uifa-board-v99');
  await expect(page.getByRole('tab')).toHaveCount(0);
});
