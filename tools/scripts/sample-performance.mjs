import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { arch, cpus, platform } from 'node:os';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium, expect } from '@playwright/test';
import { checkBundle } from './check-bundle.mjs';

const samples = Number(process.argv[2] ?? 5);
assert(Number.isInteger(samples) && samples > 0 && samples <= 20);
const build = 'dist/apps/dotln/browser';
const statsBytes = readFileSync('dist/apps/dotln/browser-stats.json');
const bundle = checkBundle(JSON.parse(statsBytes));
const fixtureBytes = readFileSync(
  'libs/features/board-data-access/testing/fixtures/launchpad-board-2026-10-21.json',
);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const types = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
const assets = new Map();
function collect(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const key = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) collect(path, key);
    else if (entry.isFile())
      assets.set(key, {
        body: gzipSync(readFileSync(path)),
        type: types[extname(entry.name)] ?? 'application/octet-stream',
      });
  }
}
collect(build);
assets.set('/api/uifa-board-v1', { body: gzipSync(fixtureBytes), type: types['.json'] });
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const asset = assets.get(path) ?? (!extname(path) ? assets.get('/index.html') : undefined);
  if (!asset) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    'Content-Type': asset.type,
    'Content-Encoding': 'gzip',
    'Content-Length': asset.body.length,
    'Cache-Control': asset.type === 'text/html' ? 'no-store' : 'public, max-age=3600',
  });
  response.end(asset.body);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, cpu: 1, network: null },
  {
    name: 'constrained',
    viewport: { width: 390, height: 844 },
    cpu: 4,
    network: {
      offline: false,
      latency: 150,
      downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8,
    },
  },
];
const rows = [];
const failures = [];
let browser;

// Diagnostic observations, not the web-vitals library's complete field algorithms.
function observe() {
  const entries = {};
  for (const type of [
    'largest-contentful-paint',
    'layout-shift',
    'event',
    'longtask',
    'long-animation-frame',
  ]) {
    entries[type] = [];
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    new PerformanceObserver((list) => entries[type].push(...list.getEntries())).observe({
      type,
      buffered: true,
      ...(type === 'event' ? { durationThreshold: 16 } : {}),
    });
  }
  window.performanceSample = (since = 0) => {
    const events = entries.event.filter((entry) => entry.startTime >= since && entry.interactionId);
    const tasks = entries.longtask.filter((entry) => entry.startTime >= since);
    const frames = entries['long-animation-frame'].filter((entry) => entry.startTime >= since);
    let start = 0,
      last = 0,
      value = 0,
      cls = 0;
    for (const shift of entries['layout-shift']) {
      if (shift.hadRecentInput || shift.startTime < since) continue;
      if (shift.startTime - last >= 1000 || shift.startTime - start >= 5000) {
        start = shift.startTime;
        value = 0;
      }
      value += shift.value;
      cls = Math.max(cls, value);
      last = shift.startTime;
    }
    const lcp = entries['largest-contentful-paint'].at(-1);
    const resources = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.startTime >= since)
      .map((entry) => ({
        path: new URL(entry.name).pathname,
        kind: entry.initiatorType,
        startMs: entry.startTime,
        durationMs: entry.duration,
        transferBytes: entry.transferSize,
        encodedBytes: entry.encodedBodySize,
        decodedBytes: entry.decodedBodySize,
      }));
    return {
      lcpCandidateMs: since === 0 ? (lcp?.startTime ?? null) : null,
      lcpElement: since === 0 ? (lcp?.element?.tagName ?? null) : null,
      cls,
      observedInteractionMaxMs: events.length ? Math.max(...events.map((e) => e.duration)) : null,
      interactionEntries: events.length,
      longTasks: tasks.length,
      longestTaskMs: tasks.length ? Math.max(...tasks.map((e) => e.duration)) : 0,
      longAnimationFrames: frames.length,
      longestFrameMs: frames.length ? Math.max(...frames.map((e) => e.duration)) : 0,
      supportedEntryTypes: PerformanceObserver.supportedEntryTypes,
      layoutShifts: entries['layout-shift']
        .filter((entry) => !entry.hadRecentInput && entry.startTime >= since)
        .map((entry) => ({
          startMs: entry.startTime,
          value: entry.value,
          sources: entry.sources.map((source) => ({
            element: source.node?.tagName ?? null,
            className: typeof source.node?.className === 'string' ? source.node.className : null,
            previous: source.previousRect.toJSON(),
            current: source.currentRect.toJSON(),
          })),
        })),
      resources,
    };
  };
}

const painted = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
const catalogReady = (page) =>
  expect(page.getByTestId('catalog-count')).toHaveAttribute('data-count', '3463');
const boardReady = (page) => expect(page.getByRole('tablist')).toBeVisible();
const navigate = (page, name) =>
  page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name, exact: true })
    .click();

async function sample(profile, journey, index) {
  const context = await browser.newContext({ viewport: profile.viewport, reducedMotion: 'reduce' });
  let page;
  try {
    await context.addInitScript(observe);
    page = await context.newPage();
    page.setDefaultTimeout(30_000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    if (profile.network) await cdp.send('Network.emulateNetworkConditions', profile.network);
    const actions = [];
    async function measure(name, action, ready) {
      const start = await page.evaluate(() => performance.now());
      await action();
      await ready();
      await painted(page);
      actions.push({
        name,
        completionMs: await page.evaluate((from) => performance.now() - from, start),
      });
    }
    const firstPath = journey === 'board-to-catalog' ? '/board' : '/tools/catalog';
    await page.goto(`${origin}${firstPath}`);
    await (journey === 'board-to-catalog' ? boardReady(page) : catalogReady(page));
    await painted(page);
    let since = 0;
    const initial = await page.evaluate(() => ({
      readyMs: performance.now(),
      ...window.performanceSample(),
    }));
    if (journey === 'warm-catalog') {
      await navigate(page, 'Board');
      await boardReady(page);
      since = await page.evaluate(() => performance.now());
    }
    if (journey !== 'direct-catalog') {
      await measure(
        'navigate-catalog',
        () => navigate(page, 'Catalog'),
        () => catalogReady(page),
      );
    }
    const scriptsBeforeFilters = await page.evaluate(
      () =>
        performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'script')
          .length,
    );
    const selections =
      journey === 'board-to-catalog'
        ? [['Work', 'eip']]
        : [
            ['Work', 'eip'],
            ['Kind', 'rule'],
            ['Scene type', 'channels'],
            ['Transform kind', 'channel.policy'],
            ['Status', 'typed'],
          ];
    for (const [filter, value] of selections) {
      const button = page.getByRole('button', { name: filter, exact: true });
      await measure(
        `open-${filter}`,
        async () => {
          if (journey === 'warm-catalog') {
            await button.focus();
            await page.keyboard.press('Enter');
          } else await button.click();
        },
        () => expect(page.getByRole('menu', { name: filter, exact: true })).toBeVisible(),
      );
      await measure(
        `select-${filter}`,
        async () => {
          const item = page.getByRole('menuitem', { name: value, exact: true });
          if (journey === 'warm-catalog') {
            const items = page.getByRole('menuitem');
            const labels = (await items.allTextContents()).map((label) => label.trim());
            const index = labels.indexOf(value);
            assert(index >= 0);
            await page.keyboard.press('Home');
            await expect(items.first()).toBeFocused();
            for (let step = 0; step < index; step++) {
              await page.keyboard.press('ArrowDown');
              await expect(items.nth(step + 1)).toBeFocused();
            }
            await expect(item).toBeFocused();
            await page.keyboard.press('Enter');
          } else await item.click();
        },
        () =>
          expect(page.locator('dotln-filter-menu').filter({ has: button })).toContainText(value),
      );
      await measure(
        `reset-${filter}`,
        () => page.getByRole('button', { name: 'Reset filters' }).click(),
        () => catalogReady(page),
      );
    }
    const first = await page.locator('[data-tool-id]').first().getAttribute('data-tool-id');
    for (const name of ['Next', 'Previous']) {
      await measure(
        name,
        () => page.getByRole('button', { name, exact: true }).click(),
        async () => {
          const row = expect(page.locator('[data-tool-id]').first());
          if (name === 'Next') await row.not.toHaveAttribute('data-tool-id', first);
          else await row.toHaveAttribute('data-tool-id', first);
        },
      );
    }
    await measure(
      'show-details',
      () => page.locator('[data-tool-id]').first().getByRole('button').click(),
      () => expect(page.getByRole('complementary', { name: 'Tool details' })).toBeFocused(),
    );
    assert.equal(await page.locator('[data-tool-id]').count(), 50);
    assert.equal(
      await page.evaluate(
        () =>
          performance
            .getEntriesByType('resource')
            .filter((entry) => entry.initiatorType === 'script').length,
      ),
      scriptsBeforeFilters,
    );
    assert.equal(await page.locator('.cdk-overlay-pane').count(), 0);
    assert.deepEqual(errors, []);
    const observed = await page.evaluate((from) => window.performanceSample(from), since);
    rows.push({
      profile: profile.name,
      journey,
      index,
      initial: journey === 'warm-catalog' ? null : initial,
      actions,
      observed,
    });
    console.log(`Sample ${profile.name} ${journey} ${index}/${samples} passed`);
  } catch (error) {
    failures.push({
      profile: profile.name,
      journey,
      index,
      message: error.message.split('\n')[0],
      focus: await page?.evaluate(() => ({
        active: document.activeElement?.textContent?.trim(),
        hovered: [...document.querySelectorAll('[role="menuitem"]:hover')].map((node) =>
          node.textContent?.trim(),
        ),
      })),
    });
    throw error;
  } finally {
    await context.close();
    saveResults(false);
  }
}

function saveResults(completed) {
  const summary = profiles.flatMap((profile) =>
    ['board-to-catalog', 'direct-catalog', 'warm-catalog'].map((journey) => {
      const group = rows.filter((row) => row.profile === profile.name && row.journey === journey);
      const range = (values) => {
        const sorted = values.filter((value) => value !== null).sort((a, b) => a - b);
        return sorted.length
          ? { min: sorted[0], median: sorted[Math.floor(sorted.length / 2)], max: sorted.at(-1) }
          : null;
      };
      return {
        profile: profile.name,
        journey,
        lcpCandidateMs: range(group.map((row) => row.initial?.lcpCandidateMs ?? null)),
        initialReadyMs: range(group.map((row) => row.initial?.readyMs ?? null)),
        cls: range(group.map((row) => row.observed.cls)),
        observedInteractionMaxMs: range(group.map((row) => row.observed.observedInteractionMaxMs)),
        maxActionCompletionMs: range(
          group.map((row) => Math.max(...row.actions.map((a) => a.completionMs))),
        ),
      };
    }),
  );
  writeFileSync(
    'dist/performance-samples.json',
    JSON.stringify(
      {
        schema: 'local-performance-samples-v1',
        completed,
        recordedAt: new Date().toISOString(),
        environment: {
          browser: browser.version(),
          node: process.version,
          platform: platform(),
          arch: arch(),
          logicalCpus: cpus().length,
          server: 'loopback, precompressed gzip, no service worker',
          cache: 'new context per journey; warm journey preloads catalog in that context',
        },
        statsSha256: digest(statsBytes),
        fixtureSha256: digest(fixtureBytes),
        bundle,
        profiles,
        samples,
        limits:
          'Local diagnostics only. Event maximum is not INP. Completion includes automation overhead. Timings are nonblocking until calibrated.',
        summary,
        rows,
        failures,
      },
      null,
      2,
    ) + '\n',
  );
  return summary;
}

try {
  browser = await chromium.launch();
  for (const profile of profiles) {
    for (const journey of ['board-to-catalog', 'direct-catalog', 'warm-catalog']) {
      for (let index = 1; index <= samples; index++) await sample(profile, journey, index);
    }
  }
  console.log(JSON.stringify(saveResults(true), null, 2));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
