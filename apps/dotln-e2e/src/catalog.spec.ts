import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

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

test('the authored visual is inspectable by keyboard and connects both algorithms to references', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-arrive-study');
  await study.getByRole('button', { name: 'At rest', exact: true }).click();
  await expect(page.getByTestId('arrive-reading')).toHaveText(
    '0.0 units to go · 0.0 units/s actual · 0.0 units/s desired',
  );
  await study.getByRole('slider').focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('arrive-reading')).toContainText('100.0 units to go');
  await page.keyboard.press('ArrowRight');
  await expect(study.getByRole('slider')).toHaveValue('1');
  await expect(study.getByRole('img', { name: /Actual speed is/ })).toHaveAccessibleName(
    /Actual speed is 1.2/,
  );
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
  await study.locator('summary').filter({ hasText: 'Follow the mechanism' }).press('Enter');
  await expect(study).toContainText('Ordinary pseudocode');
  await study.locator('summary').filter({ hasText: 'Think in streams' }).press('Enter');
  await expect(study).toContainText('RxJS pseudocode');
  await study.locator('summary').filter({ hasText: 'See it elsewhere' }).press('Enter');
  await expect(
    study.getByRole('link', { name: 'Read Arrive.java — the gdx-ai library’s Java source' }),
  ).toHaveAttribute('href', /^https:\/\/github.com\/libgdx\/gdx-ai\//);
  const limits = study.locator('summary').filter({ hasText: 'Where this breaks down' });
  await limits.press('Enter');
  await expect(study).toContainText('does not avoid obstacles');
  await expect(study.locator('.failure-trace')).toHaveCount(2);
  await expect(study.locator('#arrive-failure-result')).toContainText(
    'overshooting the target by 3.93 units',
  );
  await expect(study.locator('details[open]')).toHaveCount(4);
  await limits.press('Enter');
  await expect(study.locator('.failure-trace')).toHaveCount(0);
  await expect(study.locator('tools-study-explanation')).toHaveCount(4);
  await limits.press('Enter');
  await expect(study.locator('.failure-trace')).toHaveCount(2);
  await expect(study.getByRole('slider')).toHaveValue('1');
});

test('the reactive explanation switches views without resetting the study or shared text', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-arrive-study');
  const reactive = study.locator('summary').filter({ hasText: 'Think in streams' });
  await expect(study.locator('.stream-example')).toHaveCount(0);
  await study.locator('summary').filter({ hasText: 'Follow the mechanism' }).press('Enter');
  const calculation = await study.locator('.worked-step').innerText();
  await reactive.press('Enter');
  const example = study.locator('.stream-example');
  const explanation = study
    .locator('tools-study-explanation')
    .filter({ has: page.locator('.stream-example') });
  const rules = await example.locator('.stream-rules').innerText();
  const pseudocode = await explanation.locator('pre').innerText();
  await expect(example.locator('.stream-flow')).toBeVisible();
  await expect(example.locator('.stream-timeline')).toHaveCount(0);
  await example.getByRole('button', { name: 'Event timeline', exact: true }).press('Space');
  await expect(
    example.getByRole('button', { name: 'Event timeline', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(example.locator('.stream-flow')).toHaveCount(0);
  await expect(example.locator('.stream-timeline')).toBeVisible();
  await expect(study.getByRole('slider')).toHaveValue('75');
  await expect(study.locator('.worked-step')).toHaveText(calculation, { useInnerText: true });
  await expect(example.locator('.stream-rules')).toHaveText(rules, { useInnerText: true });
  await expect(explanation.locator('pre')).toHaveText(pseudocode, { useInnerText: true });
  await reactive.press('Enter');
  await expect(example).toBeHidden();
  await reactive.press('Enter');
  await expect(example.locator('.stream-timeline')).toBeVisible();
  await example.getByRole('button', { name: 'Data flow', exact: true }).press('Enter');
  await expect(example.locator('.stream-flow')).toBeVisible();
  await expect(example.locator('.stream-timeline')).toHaveCount(0);
  await expect(study.locator('details[open]')).toHaveCount(2);
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
  const study = page.locator('tools-arrive-study');
  const mechanism = study.locator('summary').filter({ hasText: 'Follow the mechanism' });
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
  const study = page.locator('tools-arrive-study');
  await study.locator('summary').filter({ hasText: 'Follow the mechanism' }).press('Enter');
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
  const study = page.locator('tools-arrive-study');
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await study.locator('summary').filter({ hasText: 'Follow the mechanism' }).press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation).toContainText('(16.00 − 0.00) / 0.40 ≈ 40.00');
  await expect(calculation).toContainText('0.00 + (1.20 × 0.10) ≈ 0.12');
  await calculation.getByRole('button', { name: 'Show this moment in the diagram' }).click();
  const timeline = study.getByRole('slider');
  await expect(timeline).toBeFocused();
  await expect(timeline).toHaveValue('0');
  await timeline.press('ArrowRight');
  await expect(study.getByTestId('arrive-reading')).toContainText('1.2 units/s actual');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 0.10 → 0.20 seconds');
});

test('the worked calculation follows the timeline and explains the stopping branch', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-arrive-study');
  const mechanism = study.locator('summary').filter({ hasText: 'Follow the mechanism' });
  await mechanism.press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 7.50 → 7.60 seconds');
  await expect(calculation).toContainText('Negative acceleration brakes the character');
  await study.getByRole('button', { name: 'At rest', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('At rest at 24.00 seconds');
  await expect(calculation).toContainText('Both conditions pass');
  await mechanism.press('Enter');
  await expect(calculation).toHaveCount(0);
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await mechanism.press('Enter');
  await expect(calculation).toContainText('0.00 + (1.20 × 0.10) ≈ 0.12');
});

test('reselecting Arrive retains its open calculation and changing concepts resets it', async ({
  page,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const study = page.locator('tools-arrive-study');
  await study.locator('summary').filter({ hasText: 'Follow the mechanism' }).press('Enter');
  const calculation = study.locator('.worked-step');
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 7.50 → 7.60 seconds');
  await page
    .getByRole('navigation', { name: 'Recently read', exact: true })
    .getByRole('link', { name: 'Arrive', exact: true })
    .click();
  await expect(study.locator('details[open]')).toHaveCount(1);
  await study.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 0.00 → 0.10 seconds');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  await study.getByRole('button', { name: 'Cruise', exact: true }).click();
  await expect(calculation.getByRole('heading')).toHaveText('Worked step: 4.00 → 4.10 seconds');
  await reading(page).getByRole('link', { name: 'Kinematic arrive', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Kinematic arrive');
  await page.getByRole('button', { name: 'Back to the previous reading', exact: true }).click();
  await expect(reading(page).getByRole('heading', { level: 2 })).toHaveText('Arrive');
  await expect(study.locator('details[open]')).toHaveCount(0);
  await expect(study.locator('tools-study-explanation')).toHaveCount(0);
});

test('a failed explanation download gives a readable error in the open section', async ({
  page,
  context,
}) => {
  await page.goto('/tools/catalog');
  await openBySearch(page, 'Arrive', 'aifg-a:112');
  const failedScripts: string[] = [];
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'script') failedScripts.push(request.url());
  });
  await context.setOffline(true);
  await page
    .locator('tools-arrive-study')
    .getByText('Follow the mechanism', { exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'This explanation could not load. Reload the page to try again.',
  );
  expect(failedScripts.length).toBeGreaterThan(0);
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
      const study = page.locator('tools-arrive-study');
      for (const section of [
        'Follow the mechanism',
        'Think in streams',
        'Where this breaks down',
        'See it elsewhere',
      ])
        await study.locator('summary').filter({ hasText: section }).press('Enter');
      await study.locator('.code-lines summary').first().press('Enter');
      await expect(study.locator('.code-lines[open] pre')).toBeVisible();
      await expect(study.locator('.stream-example')).toBeVisible();
      await expect(study.locator('.failure-trace')).toHaveCount(2);
      await expect(study.locator('.implementation-group')).toHaveCount(2);
      expect(await fits()).toBe(true);
      expect(await serious()).toEqual([]);
      await search(page).fill('a');
      await page.getByRole('button', { name: 'Work', exact: true }).click();
      expect(await fits()).toBe(true);
      await page.keyboard.press('Escape');
    },
  );
}

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
