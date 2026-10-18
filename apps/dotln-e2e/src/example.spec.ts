import { test, expect } from '@playwright/test';

test('the shell renders the home heading', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('DotLn');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'DotLn', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
