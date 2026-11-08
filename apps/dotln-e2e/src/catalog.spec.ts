import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import type { StudiesSummary } from '@dotln-angular/models';

const studiesSummary: StudiesSummary = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../libs/shared/catalog/src/studies/studies-summary.json'),
    'utf8',
  ),
);

const studiedCount = (work: string) =>
  studiesSummary.works.find((entry) => entry.work === work)?.studies.length ?? 0;
const totalStudied = studiesSummary.works.reduce((total, entry) => total + entry.studies.length, 0);

const search = (page: Page) => page.getByRole('searchbox', { name: 'Find a concept' });
const reading = (page: Page) => page.getByRole('region', { name: 'Concept reading', exact: true });

async function choose(page: Page, filter: string, value: string) {
  await page.getByRole('button', { name: filter, exact: true }).click();
  await page.getByRole('menuitem', { name: value, exact: true }).click();
}
async function openBySearch(page: Page, text: string, id: string) {
  await search(page).fill(text);
  await page.locator('[data-result-id="' + id + '"]').click();
  await expect(page.locator('[data-concept-id="' + id + '"]')).toBeVisible();
}

test('the board avoids menu code and catalog facets need no later script', async ({ page }) => {
  const scripts: Promise<string>[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response.text());
  });
  await page.goto('/board');
  await expect(page.getByRole('heading', { name: 'The actor board', exact: true })).toBeVisible();
  expect((await Promise.all(scripts)).join('\n')).not.toContain('dotln-menu');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Catalog', exact: true })
    .click();
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  expect((await Promise.all(scripts)).join('\n')).toContain('dotln-menu');
  await search(page).fill('message');
  await expect(page.locator('[data-result-id]').first()).toBeVisible();
  const loaded = scripts.length;
  await choose(page, 'Work', 'Enterprise Integration Patterns');
  await expect(page.locator('[data-result-work]:not([data-result-work="eip"])')).toHaveCount(0);
  expect(scripts).toHaveLength(loaded);
});

test('read a work, follow Slot and return, search Arrive and recover the history after reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools');
  await page.getByRole('link', { name: 'Read the catalog', exact: true }).click();
  await expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
  const shelf = page.getByRole('navigation', { name: 'The works' });
  await expect(shelf.getByRole('button')).toHaveCount(6);
  for (const title of [
    'AI for Games',
    'Enterprise Integration Patterns',
    'Patterns of Enterprise Application Architecture',
    'RxJS',
    'Gödel, Escher, Bach',
    'Team Topologies',
  ])
    await expect(shelf.getByRole('button', { name: new RegExp(title) })).toBeVisible();
  await shelf.getByRole('button', { name: /AI for Games/ }).click();
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  await contents.getByRole('button', { name: /Chapter 3 Movement/ }).press('Enter');
  await contents.getByRole('button', { name: /3.7 Coordinated Movement/ }).press('Enter');
  await contents
    .getByRole('link', { name: 'Two-level formation steering', exact: true })
    .press('Enter');
  await expect(reading(page)).toBeFocused();
  await expect(page.getByTestId('definition')).toHaveText(
    "An invisible anchor point is steered as if it were a character; members steer to slots defined relative to the anchor; the anchor's position is moderated by the members' actual positions so it never runs away from them.",
  );
  await expect(reading(page)).toContainText('slot error');
  await reading(page).getByRole('link', { name: 'Slot', exact: true }).click();
  await expect(page.getByTestId('definition')).toContainText('position');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Slot');
  await page.getByRole('button', { name: 'Back to the previous reading', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(
    'Two-level formation steering',
  );
  await search(page).pressSequentially('ar');
  await expect(page.locator('[data-result-id="aifg-a:112"]')).toBeVisible();
  await page.locator('[data-result-id="aifg-a:112"]').scrollIntoViewIfNeeded();
  await page.locator('[data-result-id="aifg-a:112"]').click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Arrive');
  await expect(
    reading(page).getByRole('link', { name: 'Run it in the soldier scene' }),
  ).toHaveAttribute('href', /\/scene\?tool=/);
  await page.reload();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Arrive');
  const history = page.getByRole('navigation', { name: 'Recently read', exact: true });
  // Read another concept first, so Enter on "arrive" has to change the reading.
  await history.getByRole('link', { name: 'Slot', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Slot');
  await search(page).fill('arrive');
  await expect(page.locator('[data-result-id]').first()).toHaveAttribute(
    'data-result-id',
    'aifg-a:112',
  );
  await search(page).press('Enter');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Arrive');
  await expect(page.locator('[data-result-id]')).toHaveCount(0);
  await expect(
    history.getByRole('link', { name: 'Two-level formation steering', exact: true }),
  ).toBeVisible();
  await expect(history.getByRole('link', { name: 'Slot', exact: true })).toBeVisible();
  await expect(history.getByRole('link', { name: 'Arrive', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('chapters without sections expose their concepts and restore the open group', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await page
    .getByRole('navigation', { name: 'The works' })
    .getByRole('button', { name: /Gödel, Escher, Bach/ })
    .click();
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  await contents
    .getByRole('button', { name: /Preface to the twentieth-anniversary edition/ })
    .click();
  await contents.getByRole('button', { name: /^Concepts/ }).click();
  const concept = contents.getByRole('link', {
    name: "The book's real subject: the self as a strange loop",
    exact: true,
  });
  await concept.click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(
    "The book's real subject: the self as a strange loop",
  );
  await page.reload();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(
    "The book's real subject: the self as a strange loop",
  );
  await expect(concept).toBeVisible();
  await expect(concept).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('navigation', { name: 'Recently read' }).getByRole('link', {
      name: "The book's real subject: the self as a strange loop",
      exact: true,
    }),
  ).toBeVisible();
});

test('search facets, paging, source marks and untyped reasons remain readable', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await search(page).fill('a');
  await expect(page.locator('[data-result-id]')).toHaveCount(30);
  const first = await page.locator('[data-result-id]').first().getAttribute('data-result-id');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('[data-result-id]').first()).not.toHaveAttribute(
    'data-result-id',
    first ?? '',
  );
  await choose(page, 'Work', 'AI for Games');
  await choose(page, 'Kind', 'behaviour');
  await choose(page, 'Status', 'untyped');
  expect(await page.locator('[data-result-id]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-result-work]:not([data-result-work="aifg"])')).toHaveCount(0);
  await expect(page.locator('[data-result-kind]:not([data-result-kind="behaviour"])')).toHaveCount(
    0,
  );
  await expect(
    page.locator('[data-result-status]:not([data-result-status="untyped"])'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear facets' }).click();
  await openBySearch(page, 'Emergent formations', 'aifg-a:176');
  await expect(reading(page)).toContainText(
    'Needs neighbour-relative target dependencies without a central anchor.',
  );
  await openBySearch(page, 'Flocking', 'aifg-a:145');
  await expect(reading(page)).toContainText(
    'The mapping worker’s own reading; not checked against the source text.',
  );
  await expect(reading(page).locator('dl, dotln-key-value-list')).toHaveCount(0);
});

const summary = (page: Page, section: string) =>
  page.locator('tools-study').locator('summary').filter({ hasText: section });

async function showNumbers(page: Page) {
  await page.locator('tools-study .numbers summary').click();
}

test('the authored visual is inspectable by keyboard and connects the algorithm to its references', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  await showNumbers(page);
  await study.getByRole('button', { name: 'At rest', exact: true }).click();
  await expect(page.getByTestId('study-reading')).toContainText('0.0 units from the target');
  await study.getByRole('slider', { name: /^Time/ }).focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('study-reading')).toContainText('100.0 units from the target');
  await page.keyboard.press('ArrowRight');
  await expect(study.getByRole('slider', { name: /^Time/ })).toHaveValue('1');
  await expect(study.getByRole('img').first()).toHaveAccessibleName(/Actual speed is 1\.2/);
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
  await summary(page, 'Follow the mechanism').press('Enter');
  await expect(study).toContainText('Ordinary pseudocode');
  await summary(page, 'Think in streams').press('Enter');
  await expect(study).toContainText('RxJS pseudocode');
  await summary(page, 'See it elsewhere').press('Enter');
  await expect(study.getByRole('link', { name: 'gdx-ai', exact: true })).toHaveAttribute(
    'href',
    /^https:\/\/github.com\/libgdx\/gdx-ai\//,
  );
  const limits = summary(page, 'Where this breaks down');
  await limits.press('Enter');
  await expect(study).toContainText('does not avoid obstacles');
  await expect(study.locator('.comparison .line')).toHaveCount(2);
  await expect(study.getByTestId('comparison-finding').first()).toContainText(
    'overshooting the target by 3.93 units',
  );
  await expect(study.locator('section.study > details[open]')).toHaveCount(4);
  await limits.press('Enter');
  await expect(study.locator('.comparison')).toBeHidden();
  await expect(study.locator('tools-study-explanation')).toHaveCount(4);
  await limits.press('Enter');
  await expect(study.locator('.comparison')).toBeVisible();
  await expect(study.getByRole('slider', { name: /^Time/ })).toHaveValue('1');
});

test('the RxJS reading says it is illustrative and keeps the study where it was', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  const reactive = summary(page, 'Think in streams');
  await expect(study.getByTestId('rxjs-label')).toHaveCount(0);
  await summary(page, 'Follow the mechanism').press('Enter');
  const calculation = await study.locator('.worked-step').innerText();
  await reactive.press('Enter');
  await expect(study.getByTestId('rxjs-label')).toContainText('Illustrative');
  await expect(study.getByRole('slider', { name: /^Time/ })).toHaveValue('75');
  await expect(study.locator('.worked-step')).toHaveText(calculation, { useInnerText: true });
  await reactive.press('Enter');
  await expect(study.getByTestId('rxjs-label')).toBeHidden();
  await expect(study.locator('section.study > details[open]')).toHaveCount(1);
});

test('closed explanations defer creation and download, then retain their view on collapse', async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response.url());
  });
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  const mechanism = summary(page, 'Follow the mechanism');
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
  const initially = scripts.length;
  await mechanism.press('Enter');
  const guide = study.locator('.algorithm-guide');
  await expect(guide).toBeVisible();
  const renderedCode = await guide.locator('pre').allTextContents();
  expect(renderedCode.length).toBeGreaterThan(0);
  expect(scripts.length).toBeGreaterThan(initially);
  const expanded = scripts.length;
  await mechanism.press('Enter');
  await expect(guide).toHaveCount(1);
  await expect(guide).toBeHidden();
  await mechanism.press('Enter');
  await expect(guide).toBeVisible();
  await expect(guide.locator('pre')).toHaveText(renderedCode);
  expect(scripts).toHaveLength(expanded);
});

test('the code guide shows the complete pseudocode first and each step’s lines only on request', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  await summary(page, 'Follow the mechanism').press('Enter');
  const guide = study.locator('.algorithm-guide');
  const complete = guide.locator('pre').first();
  await expect(complete).toBeVisible();
  const steps = guide.locator('.code-lines');
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) await expect(step.locator('pre')).toBeHidden();
  const desired = steps.nth(1);
  await expect(desired.locator('summary')).toHaveAccessibleDescription(
    '2. Choose a desired velocity',
  );
  await desired.locator('summary').press('Enter');
  await expect(desired.locator('pre')).toBeVisible();
  const lines = await desired.locator('pre').innerText();
  expect(lines).toContain('desired = sign(offset) * maxSpeed');
  expect(await complete.innerText()).toContain(lines);
  await expect(guide.locator('.code-lines[open]')).toHaveCount(1);
  await desired.locator('summary').press('Enter');
  await expect(desired.locator('pre')).toBeHidden();
  await expect(complete).toBeVisible();
});

test('the worked first step connects its numbers to the diagram and returns keyboard focus', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await summary(page, 'Follow the mechanism').press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation).toContainText('(16.00 − 0.00) / 0.40 ≈ 40.00');
  await expect(calculation).toContainText('0.00 + (1.20 × 0.10) ≈ 0.12');
  await calculation.getByRole('button', { name: 'Show this moment in the diagram' }).click();
  const timeline = study.getByRole('slider', { name: /^Time/ });
  await expect(timeline).toBeFocused();
  await expect(timeline).toHaveValue('0');
  await timeline.press('ArrowRight');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 0.10 → 0.20 seconds');
});

test('the worked calculation follows the timeline and explains the stopping branch', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  const mechanism = summary(page, 'Follow the mechanism');
  await mechanism.press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 7.50 → 7.60 seconds');
  await expect(calculation).toContainText('Negative acceleration brakes the character');
  await study.getByRole('button', { name: 'At rest', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('At rest at 24.00 seconds');
  await expect(calculation).toContainText('Both conditions pass');
  await mechanism.press('Enter');
  await expect(calculation).toBeHidden();
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await mechanism.press('Enter');
  await expect(calculation).toContainText('0.00 + (1.20 × 0.10) ≈ 0.12');
});

test('reselecting Arrive retains its open calculation and changing concepts resets it', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-study');
  await summary(page, 'Follow the mechanism').press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 7.50 → 7.60 seconds');
  await page
    .getByRole('navigation', { name: 'Recently read', exact: true })
    .getByRole('link', { name: 'Arrive', exact: true })
    .click();
  await expect(study.locator('section.study > details[open]')).toHaveCount(1);
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 0.00 → 0.10 seconds');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  await study.getByRole('button', { name: 'Cruise', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 4.00 → 4.10 seconds');
  await reading(page).getByRole('link', { name: 'Kinematic arrive', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Kinematic arrive');
  await page.getByRole('button', { name: 'Back to the previous reading', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Arrive');
  await expect(study.locator('section.study > details[open]')).toHaveCount(0);
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
});

test('a failed explanation download gives a readable error in the open section', async ({
  page,
  context,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  await expect(page.locator('tools-study')).toBeVisible();
  const failedScripts: string[] = [];
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'script') failedScripts.push(request.url());
  });
  await context.setOffline(true);
  await page.locator('tools-study').getByText('Follow the mechanism', { exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'This explanation could not load. Reload the page to try again.',
  );
  expect(failedScripts.length).toBeGreaterThan(0);
});

test('a shared link opens its reading, in a new tab and at the study’s own measure', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tools/catalog/aifg-a:186');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Slot assignment');
  await expect(reading(page)).toBeFocused();
  await expect(page.locator('tools-study')).toBeVisible();
  const opened = await context.newPage();
  await opened.goto(page.url());
  await expect(reading(opened).getByRole('heading', { level: 2 })).toHaveText('Slot assignment');
  await opened.close();
  await page.goto('/tools/catalog/nothing:1');
  await expect(page.getByRole('alert')).toContainText('names no concept');
  expect(errors).toEqual([]);
});

test('Back returns to the previous reading, and a reading has a real address to copy', async ({
  page,
}) => {
  await page.goto('/tools/catalog/aifg-a:110');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Seek');
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  await contents.getByRole('button', { name: /3\.4 Combining Steering Behaviors/ }).click();
  const flocking = contents.getByRole('link', { name: 'Flocking', exact: true });
  await expect(flocking).toHaveAttribute('href', /\/tools\/catalog\/aifg-a:145$/);
  await flocking.click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Flocking');
  await expect(page).toHaveURL(/\/tools\/catalog\/aifg-a:145$/);
  await page.goBack();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Seek');
  await expect(page).toHaveURL(/\/tools\/catalog\/aifg-a:110$/);
  await page.goForward();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Flocking');
});

test('the scene link leaves a study and Back returns to the reading it left', async ({ page }) => {
  await page.goto('/tools/catalog/aifg-a:145');
  await reading(page).getByRole('link', { name: 'Run it in the soldier scene' }).click();
  await expect(page).toHaveURL(/\/scene\?tool=aifg-a:145/);
  await expect(page.getByRole('heading', { name: 'The soldier scene' })).toBeAttached();
  await page.goBack();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Flocking');
});

test('Flocking’s study shows its drawing and text equivalent, explains itself and links onward', async ({
  page,
}) => {
  await page.goto('/tools/catalog/aifg-a:145');
  const study = page.locator('tools-study');
  await expect(study.locator('.eyebrow')).toContainText('Authored study');
  const drawing = study.getByRole('img').first();
  await expect(drawing).toHaveAttribute('aria-label', /\S/);
  await expect(study.locator('tools-study-motion .note')).toHaveText(/\S/);
  await showNumbers(page);
  await expect(page.getByTestId('study-reading')).toHaveText(/\S/);
  await page.getByRole('button', { name: 'Jump to the study', exact: true }).click();
  await expect(study).toBeFocused();
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
  await summary(page, 'Follow the mechanism').press('Enter');
  await expect(study.locator('.algorithm-guide > pre')).toBeVisible();
  await summary(page, 'Think in streams').press('Enter');
  await expect(study.getByTestId('rxjs-label')).toContainText('Illustrative');
  await summary(page, 'See it elsewhere').press('Enter');
  await expect(study.locator('.references a').first()).toBeVisible();
  await expect(study.locator('.references a').first()).toHaveAttribute('href', /^https:\/\//);
  const nearby = study.locator('.nearby a');
  expect(await nearby.count()).toBeGreaterThan(0);
  const title = await nearby.first().innerText();
  await nearby.first().click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(title);
});

test.describe('with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a study runs only on command and a changed input reruns its example', async ({ page }) => {
    await page.goto('/tools/catalog/aifg-a:112');
    const study = page.locator('tools-study');
    const time = study.getByRole('slider', { name: /^Time/ });
    await expect(time).toHaveValue('75');
    await page.waitForTimeout(300);
    await expect(time).toHaveValue('75');
    await study.getByRole('button', { name: 'Start', exact: true }).click();
    await study.getByRole('button', { name: 'Play', exact: true }).click();
    await expect.poll(async () => Number(await time.inputValue())).toBeGreaterThan(0);
    await study.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await time.inputValue();
    await page.waitForTimeout(300);
    await expect(time).toHaveValue(paused);
    await showNumbers(page);
    await study.getByRole('button', { name: 'Slow down', exact: true }).click();
    await expect(page.getByTestId('study-reading')).toContainText('8.0 units from the target');
    const before = await page.getByTestId('study-reading').innerText();
    await study.locator('tools-study-inputs summary').click();
    await study.getByRole('slider', { name: /Slowing radius/ }).fill('8');
    await expect(page.getByTestId('study-reading')).not.toHaveText(before);
    await study.getByRole('button', { name: 'Back to the example', exact: true }).click();
    await expect(page.getByTestId('study-reading')).toHaveText(before);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Flocking’s study never runs by itself, offers no Play and still steps', async ({
    page,
  }) => {
    await page.goto('/tools/catalog/aifg-a:145');
    const study = page.locator('tools-study');
    const time = study.getByRole('slider', { name: /^Time/ });
    const opening = await time.inputValue();
    await page.waitForTimeout(400);
    await expect(time).toHaveValue(opening);
    await expect(study.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
    await study.getByRole('button', { name: 'Step forward', exact: true }).click();
    await expect(time).toHaveValue(String(Number(opening) + 1));
  });
});

test('the shelf and the home count the studies, and contents and results mark them', async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response.url());
  });
  await page.goto('/tools');
  const home = (title: string) => page.getByRole('listitem').filter({ hasText: title });
  await expect(home('AI for Games')).toContainText('768 concepts');
  await expect(home('AI for Games')).toContainText(`${studiedCount('aifg')} studied`);
  await expect(home('RxJS')).toContainText(`${studiedCount('rxjs')} studied`);
  expect(scripts.some((url) => url.includes('tools-aifg'))).toBe(false);
  await page.getByRole('link', { name: 'Read the catalog', exact: true }).click();
  const shelf = page.getByRole('navigation', { name: 'The works' });
  await expect(shelf.getByRole('button', { name: /AI for Games/ })).toContainText(
    `${studiedCount('aifg')} studied`,
  );
  await shelf.getByRole('button', { name: /AI for Games/ }).click();
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  await contents.getByRole('button', { name: /Chapter 3 Movement/ }).click();
  await contents.getByRole('button', { name: /3\.3 Steering Behaviors/ }).click();
  await expect(contents.getByRole('img', { name: 'Has a study' })).not.toHaveCount(0);
  await search(page).fill('Flocking');
  await expect(
    page.getByRole('listitem').filter({ has: page.locator('[data-result-id="aifg-a:145"]') }),
  ).toContainText('📖');
});

test('a chosen work lists its studied concepts, and a study hands on to the next', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await page
    .getByRole('navigation', { name: 'The works' })
    .getByRole('button', { name: /AI for Games/ })
    .click();
  const list = page.locator('.studied-list');
  await expect(list.getByRole('heading')).toHaveText(`${studiedCount('aifg')} studied concepts`);
  await expect(list.getByRole('link')).toHaveCount(studiedCount('aifg'));
  await list.getByRole('link', { name: 'Seek', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Seek');
  const next = page.locator('tools-study .next a');
  await expect(next).toContainText('Next study: Flee');
  await next.click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Flee');
  await expect(page).toHaveURL(/\/tools\/catalog\/aifg-a:111$/);
});

test('the disclosures around a drawing stay open across its two views', async ({ page }) => {
  await page.goto('/tools/catalog/aifg-a:112');
  const study = page.locator('tools-study');
  await study.locator('.numbers summary').click();
  await study.locator('tools-study-inputs summary').click();
  await study.getByRole('button', { name: 'Chart', exact: true }).click();
  await expect(study.locator('.chart-title')).toHaveText('Velocity');
  await expect(study.locator('.numbers[open]')).toHaveCount(1);
  await expect(study.getByRole('slider', { name: /Slowing radius/ })).toBeVisible();
});

test('the studied facet narrows the results to the concepts with a study', async ({ page }) => {
  await page.goto('/tools/catalog');
  await search(page).fill('a');
  const all = Number(await page.getByTestId('search-count').getAttribute('data-count'));
  await choose(page, 'Study', 'Has a study');
  // The generated summary supplies the integrated inventory across independent batches.
  await expect(page.getByTestId('search-count')).toHaveAttribute(
    'data-count',
    String(totalStudied),
  );
  expect(all).toBeGreaterThan(totalStudied);
  await choose(page, 'Study', 'No study yet');
  await expect(page.getByTestId('search-count')).toHaveAttribute(
    'data-count',
    String(all - totalStudied),
  );
});

test('keyboard menu scrolling holds focus under a stationary pointer and pointer input resumes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 320 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/tools/catalog');
  await search(page).fill('a');
  const trigger = page.getByRole('button', { name: 'Work', exact: true });
  await trigger.click();
  const items = page.getByRole('menuitem');
  await items.first().hover();
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.first()).toBeFocused();
  const names = (await items.allTextContents()).map((name) => name.trim());
  const chosen = 'Enterprise Integration Patterns';
  for (let index = 1; index <= names.indexOf(chosen); index++) {
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(index)).toBeFocused();
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-result-work]:not([data-result-work="eip"])')).toHaveCount(0);
  await trigger.press('Enter');
  await page.mouse.move(0, 0);
  await page.getByRole('menuitem', { name: 'AI for Games', exact: true }).hover();
  await expect(page.getByRole('menuitem', { name: 'AI for Games', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('tap selects a search facet', async ({ page }) => {
    await page.goto('/tools/catalog');
    await search(page).fill('message');
    await page.getByRole('button', { name: 'Work', exact: true }).tap();
    await page
      .getByRole('menuitem', { name: 'Enterprise Integration Patterns', exact: true })
      .tap();
    await expect(page.locator('[data-result-work]:not([data-result-work="eip"])')).toHaveCount(0);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

test('an unknown Tools path has a working link home', async ({ page }) => {
  await page.goto('/tools/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the scene' }).click();
  await expect(page.getByRole('heading', { name: 'The soldier scene' })).toBeAttached();
});

for (const width of [360, 768, 1440]) {
  test(
    'reading, visual and facets fit ' + width + 'px and meet the board accessibility threshold',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/tools/catalog');
      await openBySearch(page, 'Arrive', 'aifg-a:112');
      await page.evaluate(() => document.fonts.ready);
      const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      const serious = async () =>
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations.filter(
          (violation) => violation.impact === 'serious' || violation.impact === 'critical',
        );
      expect(await fits()).toBe(true);
      expect(await serious()).toEqual([]);
      // The same threshold holds with every study section and one step's code open.
      const study = page.locator('tools-study');
      for (const section of [
        'Follow the mechanism',
        'Think in streams',
        'Where this breaks down',
        'See it elsewhere',
      ])
        await summary(page, section).press('Enter');
      await study.locator('.code-lines summary').first().press('Enter');
      await expect(study.locator('.code-lines[open] pre')).toBeVisible();
      await expect(study.locator('.comparison .line')).toHaveCount(2);
      await expect(study.locator('.implementation')).toHaveCount(1);
      expect(await fits()).toBe(true);
      expect(await serious()).toEqual([]);
      await search(page).fill('a');
      await page.getByRole('button', { name: 'Work', exact: true }).click();
      expect(await fits()).toBe(true);
      await page.keyboard.press('Escape');
    },
  );

  test(`switchMap's study fits ${width}px at the board accessibility threshold`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const serious = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
    await page.goto('/tools/catalog/rxc:152');
    await expect(page.locator('tools-study-marbles')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
    const study = page.locator('tools-study');
    await study.locator('.numbers summary').click();
    await study.locator('.how-to-read summary').filter({ hasText: 'How to read' }).click();
    for (const section of [
      'Follow the mechanism',
      'Think in streams',
      'Where this breaks down',
      'See it elsewhere',
    ])
      await summary(page, section).press('Enter');
    await expect(study.getByTestId('rxjs-spec')).toBeVisible();
    await expect(study.locator('.references a').first()).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
  });

  test(`Flocking's study and the home fit ${width}px at the board accessibility threshold`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const serious = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
    await page.goto('/tools/catalog/aifg-a:145');
    await expect(page.locator('tools-study')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const section of [
      'Follow the mechanism',
      'Think in streams',
      'Where this breaks down',
      'See it elsewhere',
    ])
      await summary(page, section).press('Enter');
    await expect(page.locator('tools-study .references a').first()).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
    await page.goto('/tools');
    await expect(page.getByRole('link', { name: 'Read the catalog', exact: true })).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
  });
}

test('RxJS lists its studied concepts, and switchMap’s study steps its marbles with each emission named', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  const shelf = page.getByRole('navigation', { name: 'The works' });
  await expect(shelf.getByRole('button', { name: /RxJS/ })).toContainText(
    `${studiedCount('rxjs')} studied`,
  );
  await shelf.getByRole('button', { name: /RxJS/ }).click();
  const list = page.locator('.studied-list');
  await expect(list.getByRole('heading')).toHaveText(`${studiedCount('rxjs')} studied concepts`);
  await expect(list.getByRole('link')).toHaveCount(studiedCount('rxjs'));
  await list.getByRole('link', { name: 'switchMap', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('switchMap');
  await expect(page).toHaveURL(/\/tools\/catalog\/rxc:152$/);
  const study = page.locator('tools-study');
  const marbles = study.locator('tools-study-marbles');
  // The example opens on its last frame, the whole run: every output value is drawn.
  await expect(marbles.getByRole('img')).toHaveAccessibleName(/^Frame 14: .*shown\$ completes/);
  await expect(marbles.locator('.marble')).toHaveCount(9);
  // The default browser context asks for reduced motion: nothing runs and Play is not offered.
  const time = study.getByRole('slider', { name: 'Frame 14 of 14' });
  await expect(time).toHaveValue('14');
  await page.waitForTimeout(300);
  await expect(time).toHaveValue('14');
  await expect(study.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
  // Back at a moment, the output lane shows only what has been emitted by then.
  await study.getByRole('button', { name: 'bee cancels ant', exact: true }).click();
  await expect(study.getByRole('slider', { name: 'Frame 5 of 14' })).toHaveValue('5');
  await expect(marbles.getByRole('img')).toHaveAccessibleName(/^Frame 5: query\$ emits b \(bee\)/);
  await expect(marbles.locator('.marble')).toHaveCount(7);
  // Under reduced motion no value rides down: the courier of frame 4 is drawn but not shown.
  await study.getByRole('button', { name: 'Step back', exact: true }).click();
  await expect(study.getByRole('slider', { name: 'Frame 4 of 14' })).toHaveValue('4');
  await expect(marbles.locator('.courier')).toHaveCount(1);
  await expect(marbles.locator('.courier')).toBeHidden();
  await expect(marbles.locator('.marble.landing')).toBeVisible();
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(study.getByRole('slider', { name: 'Frame 5 of 14' })).toHaveValue('5');
  await study.locator('.numbers summary').click();
  await expect(page.getByTestId('study-reading')).toContainText(
    'results(ant) is cut off; results(bee) is opened',
  );
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(study.getByRole('slider', { name: 'Frame 6 of 14' })).toHaveValue('6');
  await expect(page.getByTestId('study-reading')).toContainText('Frame 6: nothing new happens');
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(page.getByTestId('study-reading')).toContainText(
    'Frame 7: query$ emits c (cat); results(bee) is cut off; results(cat) is opened',
  );
  await expect(marbles.locator('.marble.current')).toHaveCount(1);
  await expect(marbles.locator('.cut')).toHaveCount(2);
  await summary(page, 'Think in streams').press('Enter');
  await expect(study.getByTestId('rxjs-label')).toContainText('Executable');
  await expect(study.getByTestId('rxjs-spec')).toContainText(
    'libs/features/tools/src/lib/studies/rxjs/switch-map.spec.ts',
  );
  await expect(study.locator('.algorithm-guide')).toHaveCount(0);
  await summary(page, 'Where this breaks down').press('Enter');
  await expect(study).toContainText('A cut-off request is a lost request');
  await study.locator('.nearby a', { hasText: 'exhaustMap' }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('exhaustMap');
  await expect(page.locator('tools-study-marbles')).toBeVisible();
});

test('share and shareReplay open side by side from the nearby links', async ({ page, context }) => {
  await page.goto('/tools/catalog/rxc:215');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('share');
  await expect(page.locator('tools-study-marbles')).toBeVisible();
  const link = page.locator('tools-study .nearby a', { hasText: 'shareReplay' });
  await expect(link).toHaveAttribute('href', /\/tools\/catalog\/rxc:216$/);
  const beside = await context.newPage();
  await beside.goto((await link.getAttribute('href')) ?? '');
  await expect(reading(beside).getByRole('heading', { level: 2 })).toHaveText('shareReplay');
  await expect(beside.locator('tools-study-marbles')).toBeVisible();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('share');
  // Each diagram draws two readers of one source, so the two studies can be compared lane by lane,
  // and frame 7 is where they differ: the late reader hears the last quote only under shareReplay.
  for (const opened of [page, beside]) {
    expect(await opened.locator('tools-study-marbles .axis').count()).toBeGreaterThanOrEqual(3);
    await opened.locator('tools-study').getByRole('slider').fill('7');
  }
  await expect(page.locator('tools-study-marbles').getByRole('img')).toHaveAccessibleName(
    /^Frame 7: chart\$ subscribes\./,
  );
  await expect(beside.locator('tools-study-marbles').getByRole('img')).toHaveAccessibleName(
    /^Frame 7: chart\$ subscribes; chart\$ emits b \(104\)/,
  );
  await beside.close();
});

test('a long unbroken title wraps in search results and the history at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/tools/catalog');
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await search(page).fill('expectSubscriptions');
  await expect(page.locator('[data-result-id="rxc:88"]')).toBeVisible();
  expect(await fits()).toBe(true);
  await page.locator('[data-result-id="rxc:88"]').click();
  await expect(page.locator('[data-concept-id="rxc:88"]')).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Recently read', exact: true })
      .getByRole('link', { name: 'expectSubscriptions(logs).toBe(subscriptionMarbles)' }),
  ).toBeVisible();
  expect(await fits()).toBe(true);
});

for (const width of [768, 1280])
  test(`the sticky shelf and contents stop above the history at the foot of the page at ${width}px`, async ({
    page,
  }) => {
    // A window shorter than the shelf: stuck to the top, the shelf reaches the foot of its
    // columns when the page is scrolled to the end, and must stop there.
    await page.setViewportSize({ width, height: 600 });
    await page.goto('/tools/catalog/aifg-a:112');
    const link = page
      .getByRole('navigation', { name: 'Recently read', exact: true })
      .getByRole('link', { name: 'Arrive', exact: true });
    await expect(link).toBeVisible();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(link).toBeInViewport();
    // Nothing lies over the link: the point at its centre belongs to it.
    const topmost = await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return hit !== null && element.contains(hit);
    });
    expect(topmost).toBe(true);
  });

test('Enterprise Integration Patterns lists its studied concepts, and Aggregator’s flow steps one message at a time', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  const shelf = page.getByRole('navigation', { name: 'The works' });
  const work = shelf.getByRole('button', { name: /Enterprise Integration Patterns/ });
  await expect(work).toContainText(`${studiedCount('eip')} studied`);
  await work.click();
  const list = page.locator('.studied-list');
  await expect(list.getByRole('heading')).toHaveText(`${studiedCount('eip')} studied concepts`);
  await expect(list.getByRole('link')).toHaveCount(studiedCount('eip'));
  await list.getByRole('link', { name: 'Aggregator', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Aggregator');
  await expect(page).toHaveURL(/\/tools\/catalog\/eip:110$/);
  const study = page.locator('tools-study');
  const flow = study.locator('tools-study-flow');
  // A messaging study opens at its start, before anything moves. The default browser context asks
  // for reduced motion: nothing runs by itself and Play is not offered.
  const time = study.getByRole('slider', { name: /^Step 0 of \d+$/ });
  await expect(time).toHaveValue('0');
  await page.waitForTimeout(300);
  await expect(time).toHaveValue('0');
  await expect(study.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
  await expect(flow.locator('.across .token[data-state="moving"]')).toHaveCount(0);
  // Each step forward moves a report to the aggregator, and the drawing's sentence names it.
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(study.getByRole('slider', { name: /^Step 1 of \d+$/ })).toHaveValue('1');
  await expect(flow.getByRole('img')).toHaveAccessibleName(/moves from .+ to Aggregator/);
  await expect(flow.locator('.across .token[data-state="moving"]')).toHaveCount(1);
  await flow.locator('.numbers summary').click();
  await expect(flow.getByTestId('study-reading')).toContainText('moves from');
  // The mechanism, the limits and the executable RxJS reading open on command.
  await summary(page, 'Follow the mechanism').press('Enter');
  await expect(study.locator('.code-lines').first()).toBeVisible();
  await summary(page, 'Where this breaks down').press('Enter');
  await expect(study).toContainText('A lost report holds its set for ever.');
  await summary(page, 'Think in streams').press('Enter');
  await expect(study.getByTestId('rxjs-label')).toContainText('Executable');
  await expect(study.getByTestId('rxjs-spec')).toContainText(
    'libs/features/tools/src/lib/studies/eip/aggregator.spec.ts',
  );
  // The same step drawn as the marble diagram the spec runs.
  await study.getByRole('button', { name: 'Marbles', exact: true }).click();
  await expect(study.locator('tools-study-marbles')).toBeVisible();
  await expect(study.getByRole('slider', { name: /^Frame 1 of \d+$/ })).toHaveValue('1');
  await study.getByRole('button', { name: 'Flow', exact: true }).click();
  await expect(study.locator('tools-study-flow')).toBeVisible();
});

test('Publish-Subscribe Channel and Competing Consumers open from the contents and deliver differently', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await page
    .getByRole('navigation', { name: 'The works' })
    .getByRole('button', { name: /Enterprise Integration Patterns/ })
    .click();
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  const open = async (chapter: RegExp, title: string) => {
    await contents.getByRole('button', { name: chapter }).click();
    await contents.getByRole('button', { name: new RegExp(`^${title}`) }).click();
    await contents.getByRole('link', { name: title, exact: true }).click();
    await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(title);
    await expect(page.locator('tools-study-flow')).toBeVisible();
  };
  // Step to step 2, where the channel delivers the first order, and read what moves there.
  const delivery = async () => {
    const study = page.locator('tools-study');
    for (const step of [1, 2]) {
      await study.getByRole('button', { name: 'Step forward', exact: true }).click();
      await expect(
        study.getByRole('slider', { name: new RegExp(`^Step ${step} of \\d+$`) }),
      ).toHaveValue(String(step));
    }
    return study.locator('tools-study-flow .across .token[data-state="moving"]');
  };
  // The same first order, a, reaches every session from the topic and one session from the queue.
  await open(/Chapter 4: Messaging Channels/, 'Publish-Subscribe Channel');
  await expect(await delivery()).toHaveText(['a', 'a', 'a']);
  await open(/Chapter 10: Messaging Endpoints/, 'Competing Consumers');
  await expect(await delivery()).toHaveText(['a']);
});

test('Request-Reply’s Correlation Identifier link opens its reading', async ({ page }) => {
  await page.goto('/tools/catalog/eip:83');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Request-Reply');
  const link = page.locator('tools-study .nearby a', { hasText: 'Correlation Identifier' });
  await expect(link).toHaveAttribute('href', /\/tools\/catalog\/eip:87$/);
  await link.click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(
    'Correlation Identifier',
  );
  await expect(page).toHaveURL(/\/tools\/catalog\/eip:87$/);
  await expect(page.locator('tools-study-flow')).toBeVisible();
});

for (const width of [360, 768, 1440])
  test(`Aggregator's study fits ${width}px at the board accessibility threshold`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const serious = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
    await page.goto('/tools/catalog/eip:110');
    await expect(page.locator('tools-study-flow')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
    const study = page.locator('tools-study');
    await study.getByRole('button', { name: 'Step forward', exact: true }).click();
    await study.locator('tools-study-flow .numbers summary').click();
    await study.locator('.how-to-read summary').filter({ hasText: 'How to read' }).click();
    for (const section of [
      'Follow the mechanism',
      'Think in streams',
      'Where this breaks down',
      'See it elsewhere',
    ])
      await summary(page, section).press('Enter');
    await expect(study.getByTestId('rxjs-spec')).toBeVisible();
    await expect(study.locator('.references a').first()).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
  });

for (const width of [360, 768, 1440])
  test(`the next movement studies can be read and stepped at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/catalog');
    const work = page
      .getByRole('navigation', { name: 'The works' })
      .getByRole('button', { name: /AI for Games/ });
    await expect(work).toContainText(`${studiedCount('aifg')} studied`);
    await work.click();
    const list = page.locator('.studied-list');
    await expect(list.getByRole('heading')).toHaveText(`${studiedCount('aifg')} studied concepts`);
    await expect(list.getByRole('link')).toHaveCount(studiedCount('aifg'));
    await list.getByRole('link', { name: 'Collision avoidance', exact: true }).click();
    const study = page.locator('tools-study');
    const motion = study.locator('tools-study-motion');
    const drawing = motion.getByRole('img');
    await expect(drawing).toHaveAccessibleName(/closest/i);
    await expect(study.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
    const time = study.getByRole('slider', { name: /^Time/ });
    await time.fill('0');
    const before = await drawing.getAttribute('aria-label');
    await study.getByRole('button', { name: 'Step forward', exact: true }).click();
    await expect(time).toHaveValue('1');
    await expect(drawing).not.toHaveAttribute('aria-label', before ?? '');
    await expect(drawing).toHaveAccessibleName(/closest/i);
    await study.locator('.numbers summary').click();
    await expect(study.getByTestId('study-reading')).toContainText(/closest/i);
    await study.getByRole('button', { name: 'Chart', exact: true }).click();
    await expect(study.locator('tools-study-timeline')).toBeVisible();
    await study.locator('.how-to-read summary').filter({ hasText: 'How to read' }).click();
    await expect(study.locator('figcaption .legend')).toContainText('Current gap');
    await expect(study.locator('figcaption .legend')).not.toContainText('Courier velocity');
    await study.getByRole('button', { name: 'Movement', exact: true }).click();
    await expect(study.locator('figcaption .legend')).toContainText('Courier velocity');
    await study.getByRole('button', { name: 'Chart', exact: true }).click();
    await summary(page, 'Follow the mechanism').press('Enter');
    await expect(study.locator('.algorithm-guide > pre')).toBeVisible();
    await study.locator('.executable-model summary').click();
    await expect(study.getByTestId('model-spec')).toContainText(
      'collision-avoidance.model.spec.ts',
    );
    await summary(page, 'Where this breaks down').press('Enter');
    await expect(study.locator('.limits')).toBeVisible();
    await summary(page, 'See it elsewhere').press('Enter');
    await expect(study.locator('.implementations .implementation')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const violations = (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations;
    expect(
      violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
    ).toEqual([]);

    const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
    await contents.getByRole('link', { name: 'Flee', exact: true }).click();
    await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Flee');
    await expect(study.locator('tools-study-motion')).toBeVisible();
    await openBySearch(page, 'Obstacle and wall avoidance', 'aifg-a:137');
    await expect(motion.getByRole('img')).toBeVisible();
    await study.getByRole('slider', { name: /^Time/ }).fill('0');
    await study.getByRole('button', { name: 'Step forward', exact: true }).click();
    await expect(study.getByRole('slider', { name: /^Time/ })).toHaveValue('1');
    await study.locator('.nearby a', { hasText: 'Corner trap' }).click();
    await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Corner trap');
    await expect(motion.getByRole('img')).toBeVisible();
    await openBySearch(page, 'Projectile trajectory', 'aifg-a:162');
    await expect(motion.getByRole('img')).toBeVisible();
    const projectileTime = study.getByRole('slider', { name: /^Time/ });
    await projectileTime.fill((await projectileTime.getAttribute('max')) ?? '0');
    await study.locator('.nearby a', { hasText: 'The firing solution' }).click();
    await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(
      'The firing solution',
    );
    await summary(page, 'Where this breaks down').press('Enter');
    await expect(study.locator('.limits')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('Patterns of Enterprise Application Architecture lists its twenty studies, and Unit of Work steps its registers by name', async ({
  page,
}) => {
  expect(studiedCount('poeaa')).toBe(20);
  await page.goto('/tools/catalog');
  const work = page
    .getByRole('navigation', { name: 'The works' })
    .getByRole('button', { name: /Patterns of Enterprise Application Architecture/ });
  await expect(work).toContainText(`${studiedCount('poeaa')} studied`);
  await work.click();
  const list = page.locator('.studied-list');
  await expect(list.getByRole('heading')).toHaveText(`${studiedCount('poeaa')} studied concepts`);
  await expect(list.getByRole('link')).toHaveCount(studiedCount('poeaa'));
  await list.getByRole('link', { name: 'Unit of Work', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Unit of Work');
  await expect(page).toHaveURL(/\/tools\/catalog\/poeaa:246$/);
  const study = page.locator('tools-study');
  const states = study.locator('tools-study-states');
  const drawing = states.locator('.wide svg');
  // The default context asks for reduced motion: the study opens at its start, nothing runs by
  // itself and Play is not offered, but every step is reachable by hand.
  const time = study.getByRole('slider', { name: /^Step 0 of \d+$/ });
  await expect(time).toHaveValue('0');
  await page.waitForTimeout(300);
  await expect(time).toHaveValue('0');
  await expect(study.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
  await expect(states.locator('.wide .token[data-state="moving"]')).toHaveCount(0);
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(study.getByRole('slider', { name: /^Step 1 of \d+$/ })).toHaveValue('1');
  await expect(drawing).toHaveAccessibleName(
    /Night march enters New by registerNew\. Where each composition stands: Clean: Flank left, Hold the ridge; New: Night march; Dirty: none; Removed: none\./,
  );
  await expect(states.locator('.wide .token[data-state="moving"]')).toHaveText('N');
  // Under reduced motion a moving token is simply there: it does not glide in.
  expect(
    await states
      .locator('.wide .token[data-state="moving"]')
      .evaluate((token) => getComputedStyle(token).animationName),
  ).toBe('none');
  await study.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(drawing).toHaveAccessibleName(
    /Hold the ridge moves from Clean to Dirty by registerDirty\. Where each composition stands: Clean: Flank left; New: Night march; Dirty: Hold the ridge; Removed: none\./,
  );
  // Every register is named in the text equivalent, filled or empty, as objects move between them.
  await study.getByRole('button', { name: 'Removed', exact: true }).click();
  await expect(drawing).toHaveAccessibleName(
    /Clean: none; New: Night march; Dirty: Hold the ridge; Removed: Flank left\. Store calls so far: 0\./,
  );
  await states.locator('.numbers summary').click();
  await expect(states.getByTestId('study-reading')).toContainText('Removed: Flank left');
  await study.getByRole('button', { name: 'Commit', exact: true }).click();
  await expect(drawing).toHaveAccessibleName(
    /Clean: Hold the ridge, Night march; New: none; Dirty: none; Removed: none\. Store calls so far: 1\./,
  );
  await expect(states.locator('.wide .ghost')).toHaveCount(1);
  // The pseudocode, the executable model that ran in the test suite and the limits open on command.
  await summary(page, 'Follow the mechanism').press('Enter');
  await expect(study.locator('.algorithm-guide > pre')).toBeVisible();
  await study.locator('.executable-model summary').click();
  await expect(study.getByTestId('model-spec')).toContainText(
    'libs/features/tools/src/lib/studies/poeaa/unit-of-work.model.spec.ts',
  );
  await summary(page, 'Where this breaks down').press('Enter');
  await expect(study.locator('.limits')).toContainText('Nothing coordinates two units of work.');
  await summary(page, 'See it elsewhere').press('Enter');
  await expect(study.locator('.implementations .implementation').first()).toContainText(
    'DotLn-Angular',
  );
  for (const nearby of ['Identity Map', 'Data Mapper', 'Lazy Load'])
    await expect(study.locator('.nearby a', { hasText: nearby })).toHaveAttribute(
      'href',
      /\/tools\/catalog\/poeaa:\d+$/,
    );
});

test('Identity Map steps a lookup that misses and one that hits, and says which in its text equivalent', async ({
  page,
}) => {
  await page.goto('/tools/catalog/poeaa:254');
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Identity Map');
  const study = page.locator('tools-study');
  const drawing = study.locator('tools-study-states .wide svg');
  await study.getByRole('button', { name: 'Miss', exact: true }).click();
  await expect(drawing).toHaveAccessibleName(/a miss, because/);
  await study.getByRole('button', { name: 'Hit', exact: true }).click();
  await expect(drawing).toHaveAccessibleName(/a hit, because/);
  await study.locator('tools-study-states .numbers summary').click();
  await expect(study.getByTestId('study-reading')).toContainText('a hit');
});

test('the two offline locks open from the contents, each drawn and each saying where it fails', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await page
    .getByRole('navigation', { name: 'The works' })
    .getByRole('button', { name: /Patterns of Enterprise Application Architecture/ })
    .click();
  const contents = page.getByRole('navigation', { name: 'Contents', exact: true });
  const study = page.locator('tools-study');
  await contents.getByRole('button', { name: /16\. Offline Concurrency Patterns/ }).click();
  for (const title of ['Optimistic Offline Lock', 'Pessimistic Offline Lock']) {
    await contents.getByRole('button', { name: new RegExp(`^${title}`) }).click();
    await contents.getByRole('link', { name: title, exact: true }).click();
    await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText(title);
    await expect(study.locator('tools-study-states .wide svg')).toHaveAccessibleName(/\S/);
    await study.getByRole('button', { name: 'Step forward', exact: true }).click();
    await expect(study.getByRole('slider', { name: /^Step 1 of \d+$/ })).toHaveValue('1');
    await summary(page, 'Where this breaks down').press('Enter');
    await expect(study.locator('.limits li').first()).toBeVisible();
  }
});

for (const width of [360, 768, 1440])
  test(`Unit of Work's study fits ${width}px at the board accessibility threshold`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const serious = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
    await page.goto('/tools/catalog/poeaa:246');
    await expect(page.locator('tools-study-states')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
    const study = page.locator('tools-study');
    await study.getByRole('button', { name: 'Commit', exact: true }).click();
    await study.locator('tools-study-states .numbers summary').click();
    await study.locator('.how-to-read summary').filter({ hasText: 'How to read' }).click();
    await study.locator('tools-study-inputs summary').click();
    for (const section of ['Follow the mechanism', 'Where this breaks down', 'See it elsewhere'])
      await summary(page, section).press('Enter');
    await expect(study.locator('.references a').first()).toBeVisible();
    expect(await fits()).toBe(true);
    expect(await serious()).toEqual([]);
  });
