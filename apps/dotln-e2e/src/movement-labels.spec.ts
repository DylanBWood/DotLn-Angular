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
