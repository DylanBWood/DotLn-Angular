import { expect, test } from '@playwright/test';

// A meeting, a clipped edge, a launch/landing and a projected body exercise different frames
// of the shared renderer. The model suite also retains every supplied name across the corpus.
const studies = [
  { id: 'aifg-a:192', title: 'Motor control' },
  { id: 'aifg-a:166', title: 'Iterative targeting' },
  { id: 'aifg-a:163', title: 'The firing solution' },
  { id: 'aifg-a:196', title: 'Movement in the third dimension' },
];

for (const viewport of [
  { width: 2080, height: 1460 },
  { width: 3840, height: 1620 },
  { width: 360, height: 900 },
]) {
  for (const study of studies) {
    test(`${study.title} keeps its names readable on every frame at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/tools/catalog/${study.id}`);
      const svg = page.locator('tools-study-motion svg');
      await expect(svg).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const time = page.locator('tools-study-motion').getByRole('slider');
      const last = Number(await time.getAttribute('max'));
      const failures: string[] = [];
      for (let step = 0; step <= last; step++) {
        await time.fill(String(step));
        // Wait for the selected frame to be rendered before measuring its glyphs.
        await expect(svg).toHaveAttribute('data-step', String(step));
        const problems = await svg.evaluate((drawing) => {
          const bounds = drawing.getBoundingClientRect();
          const labels = [...drawing.querySelectorAll('text')].map((text) => {
            const box = text.getBoundingClientRect();
            return {
              name: text.textContent?.trim(),
              left: box.left,
              right: box.right,
              top: box.top + box.height * 0.22,
              bottom: box.bottom - box.height * 0.22,
            };
          });
          const problems: string[] = [];
          let labelPainted = false;
          for (const element of drawing.querySelectorAll('.label-guide, text.label')) {
            if (element.matches('text.label')) labelPainted = true;
            else if (labelPainted) problems.push('a guide paints above a name');
          }
          for (const [i, label] of labels.entries()) {
            if (
              label.left < bounds.left - 1 ||
              label.right > bounds.right + 1 ||
              label.top < bounds.top - 1 ||
              label.bottom > bounds.bottom + 1
            )
              problems.push(`clipped: ${label.name}`);
            for (const other of labels.slice(i + 1)) {
              const width = Math.min(label.right, other.right) - Math.max(label.left, other.left);
              const height = Math.min(label.bottom, other.bottom) - Math.max(label.top, other.top);
              if (width > 2 && height > 2)
                problems.push(`overprinted: ${label.name} / ${other.name}`);
            }
          }
          return problems;
        });
        failures.push(...problems.map((problem) => `frame ${step}: ${problem}`));
      }
      expect(failures).toEqual([]);
    });
  }
}

test('a displaced name guide stops before entering its glyphs', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/tools/catalog/aifg-a:143');
  const svg = page.locator('tools-study-motion svg');
  await expect(svg).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const slider = page.locator('tools-study-motion').getByRole('slider');
  const measurements: { step: number; bad: boolean }[] = [];
  let guides = 0;
  for (let step = 0; step <= Number(await slider.getAttribute('max')); step++) {
    await slider.fill(String(step));
    await expect(svg).toHaveAttribute('data-step', String(step));
    const result = await svg.evaluate((drawing) => {
      const boxes = [...drawing.querySelectorAll<SVGTextElement>('text.label')].map((label) => {
        const box = label.getBBox();
        return {
          x: box.x,
          y: box.y + box.height * 0.22,
          width: box.width,
          height: box.height * 0.56,
        };
      });
      const lines = [...drawing.querySelectorAll<SVGLineElement>('.label-guide')];
      const bad = lines.some((line) => {
        const start = { x: line.x1.baseVal.value, y: line.y1.baseVal.value };
        const end = { x: line.x2.baseVal.value, y: line.y2.baseVal.value };
        const distance = (box: (typeof boxes)[number]) =>
          Math.max(box.x - end.x, 0, end.x - box.x - box.width) ** 2 +
          Math.max(box.y - end.y, 0, end.y - box.y - box.height) ** 2;
        const target = [...boxes].sort((a, b) => distance(a) - distance(b))[0];
        if (!target) return false;
        // Inspect the complete segment, not just an endpoint just past the text's baseline.
        for (let part = 1; part <= 100; part++) {
          const x = start.x + ((end.x - start.x) * part) / 100;
          const y = start.y + ((end.y - start.y) * part) / 100;
          if (
            x > target.x + 1 &&
            x < target.x + target.width - 1 &&
            y > target.y + 1 &&
            y < target.y + target.height - 1
          )
            return true;
        }
        return false;
      });
      return { bad, count: lines.length };
    });
    guides += result.count;
    measurements.push({ step, bad: result.bad });
  }
  expect(guides).toBeGreaterThan(0);
  expect(measurements.filter(({ bad }) => bad).map(({ step }) => step)).toEqual([]);
});

test('a stopped cart leaves no unreadable vector tick', async ({ page }) => {
  await page.goto('/tools/catalog/aifg-a:192');
  const svg = page.locator('tools-study-motion svg');
  await expect(svg).toBeVisible();
  await page.locator('tools-study-motion').getByRole('slider').fill('100');
  await expect(svg).toHaveAttribute('data-step', '100');
  const lengths = await svg.locator('line.vector').evaluateAll((lines) =>
    lines.map((element) => {
      const line = element as SVGLineElement;
      return Math.hypot(
        line.x2.baseVal.value - line.x1.baseVal.value,
        line.y2.baseVal.value - line.y1.baseVal.value,
      );
    }),
  );
  expect(lengths.every((length) => length >= 4)).toBe(true);
});

test('a wide drawing keeps a fitting trolley name at its authored offset', async ({ page }) => {
  await page.setViewportSize({ width: 2080, height: 1460 });
  await page.goto('/tools/catalog/aifg-a:149');
  const svg = page.locator('tools-study-motion svg');
  await expect(svg).toBeVisible();
  await page.locator('tools-study-motion').getByRole('slider').fill('0');
  await expect(svg).toHaveAttribute('data-step', '0');
  await page.evaluate(() => document.fonts.ready);
  const placement = await svg.evaluate((drawing) => {
    const label = [...drawing.querySelectorAll<SVGTextElement>('text.label')].find(
      (node) => node.textContent?.trim() === 'Trolley',
    );
    const trolley = drawing.querySelector<SVGCircleElement>('circle.dot[data-tone="other"]');
    if (!label || !trolley) throw new Error('The trolley and its name must be drawn');
    const box = label.getBBox();
    const preferred = trolley.cy.baseVal.value - 16;
    return {
      fontSize: getComputedStyle(label).fontSize,
      preferred,
      actual: label.y.baseVal[0].value,
      preferredTop: box.y + preferred - label.y.baseVal[0].value,
    };
  });
  expect(placement.fontSize).toBe('15px');
  expect(placement.preferredTop).toBeGreaterThanOrEqual(0);
  expect(placement.actual).toBeCloseTo(placement.preferred, 4);
});
