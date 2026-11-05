import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('study messages load with the selected work and supply the reading text', async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/i18n\/study[^/]+\/en\.json$/.test(request.url())) requests.push(request.url());
  });
  const messages = JSON.parse(
    readFileSync(resolve(__dirname, '../../dotln/public/i18n/studyAifg/en.json'), 'utf8'),
  );
  messages.flee.record.example.name = 'A translated flight from the beacon';
  // The mocked build forwards these requests through its service worker.
  await context.route('**/i18n/studyAifg/en.json', (route) => route.fulfill({ json: messages }));
  await page.goto('/board');
  await expect(page.getByRole('heading', { name: 'The actor board', exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  await page.goto('/tools/catalog');
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  expect(requests).toEqual([]);
  await page.goto('/tools/catalog/aifg-a:111');
  await expect(
    page.getByRole('heading', { name: 'A translated flight from the beacon' }),
  ).toBeVisible();
  expect(requests.some((url) => url.includes('/studyAifg/'))).toBe(true);
  expect(requests.some((url) => url.includes('/studyCommon/'))).toBe(true);
  expect(requests.some((url) => /\/study(Rxjs|Eip)\//.test(url))).toBe(false);
  await expect(page.getByRole('region', { name: 'Authored study' })).not.toContainText(
    'studyAifg.',
  );
});

test('a failed study message catalog is visible and retryable', async ({ page, context }) => {
  await context.route('**/i18n/studyAifg/en.json', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
  await page.goto('/tools/catalog/aifg-a:111');
  await expect(
    page.getByRole('alert').filter({ hasText: 'This study could not load.' }),
  ).toBeVisible();
  await context.unroute('**/i18n/studyAifg/en.json');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Authored study' })).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'This study could not load.' }),
  ).toHaveCount(0);
});
