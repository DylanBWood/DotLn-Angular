import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkEventHygiene } from './scripts/check-event-hygiene.mjs';

test('each hygiene fixture fails independently through the CLI', () => {
  for (const fixture of ['own-tier', 'data-mapping', 'ui-mapping']) {
    const path = `tools/lint-fixtures/hygiene/${fixture}.ts`;
    assert.ok(checkEventHygiene([path]).findings.length > 0);
    assert.equal(
      spawnSync(process.execPath, ['tools/scripts/check-event-hygiene.mjs', path]).status,
      1,
    );
  }
});
test('reads a dispatch outside stores and facades, including aliased groups and injectDispatch', () => {
  const root = mkdtempSync(join(tmpdir(), 'dotln-hygiene-'));
  try {
    const path = join(root, 'bootstrap.ts');
    writeFileSync(
      path,
      `import { boardPageEvents as page, boardHttpEvents } from '@dotln-angular/events';
      const dispatch=injectDispatch(page);
      events.on(page.opened).pipe(tap(() => dispatch.refreshRequested()));`,
    );
    const result = checkEventHygiene([path]);
    assert.equal(result.inspected.length, 1);
    assert.equal(result.findings.length, 1);
    for (const subscription of [
      'events.on(boardHttpEvents.loadSuccess).subscribe(() => dispatcher.dispatch(boardHttpEvents.load()));',
      'events.on(boardHttpEvents.loadSuccess).pipe(tap(() => {})).subscribe(() => dispatcher.dispatch(boardHttpEvents.load()));',
    ]) {
      writeFileSync(path, subscription);
      assert.equal(checkEventHygiene([path]).findings.length, 1);
    }
    writeFileSync(
      path,
      `events.on(boardPageEvents.opened).pipe(map(() => boardHttpEvents.load()));
      withCommand({trigger:boardHttpEvents.load,success:boardHttpEvents.loadSuccess,failure:boardHttpEvents.loadFailure});`,
    );
    assert.equal(checkEventHygiene([path]).findings.length, 0);
    writeFileSync(
      path,
      `events.on(boardPageEvents.opened).pipe(map(() => {
      // hygiene-exception: fixture demonstrates the counted escape hatch
      return boardPageEvents.refreshRequested();
    })); // Dispatcher`,
    );
    const exception = checkEventHygiene([path]);
    assert.equal(exception.exceptions, 1);
    assert.equal(exception.findings.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
