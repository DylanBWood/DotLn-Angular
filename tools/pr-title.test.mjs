import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { decorateTitle, updateTitle } from './pr-title.mjs';

const map = JSON.parse(readFileSync(new URL('../.github/gitmoji-map.json', import.meta.url)));

test('every supported conventional type gains its gitmoji exactly once', () => {
  for (const [type, { shortcode, emoji }] of Object.entries(map)) {
    const subject = `${type}(workspace)!: update the workspace`;
    assert.equal(decorateTitle(subject), `${shortcode} ${subject}`);
    assert.equal(decorateTitle(`${shortcode} ${subject}`), `${shortcode} ${subject}`);
    assert.equal(decorateTitle(`${emoji} ${subject}`), `${emoji} ${subject}`);
  }
});

test('malformed titles are rejected before any remote operation', () => {
  for (const title of [
    '',
    'update the workspace',
    'other: update',
    'feat: ',
    'feat:\nupdate',
    ':unknown: feat: update',
    'feat: one\u2028two',
  ]) {
    assert.throws(() => decorateTitle(title));
  }
});

const event = {
  repository: { full_name: 'example/workspace' },
  pull_request: { number: 7, title: 'feat: original title' },
};

test('a stale event decorates the current title and passes its text as one literal argument', () => {
  const title = 'fix: preserve `code` and $(example) text; echo literal';
  const calls = [];
  const changed = updateTitle(event, (command, args, options) => {
    calls.push({ command, args, options });
    return { status: 0, stdout: JSON.stringify({ title }) };
  });
  assert.equal(changed, true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, [
    'pr',
    'view',
    '7',
    '--repo',
    'example/workspace',
    '--json',
    'title',
  ]);
  assert.deepEqual(calls[1].args, [
    'pr',
    'edit',
    '7',
    '--repo',
    'example/workspace',
    '--title',
    `:bug: ${title}`,
  ]);
  for (const call of calls) {
    assert.equal(call.command, 'gh');
    assert.equal(call.options.shell, false);
  }
});

test('a rerun leaves an already decorated current title unchanged', () => {
  let calls = 0;
  const changed = updateTitle(event, () => {
    calls += 1;
    return { status: 0, stdout: JSON.stringify({ title: ':bug: fix: newer title' }) };
  });
  assert.equal(changed, false);
  assert.equal(calls, 1);
});

test('invalid identity or a failed current-title lookup cannot trigger an edit', () => {
  let calls = 0;
  const run = () => {
    calls += 1;
    return { status: 1 };
  };
  assert.throws(() => updateTitle({ ...event, repository: { full_name: '--invalid' } }, run));
  assert.equal(calls, 0);
  assert.throws(() => updateTitle(event, run), /Unable to read/);
  assert.equal(calls, 1);
});

test('a prefix that no longer matches the title type is replaced', () => {
  assert.equal(decorateTitle(':sparkles: fix: correct the title'), ':bug: fix: correct the title');
  assert.equal(decorateTitle('✨ fix: correct the title'), ':bug: fix: correct the title');
  assert.equal(decorateTitle(':bug: fix: correct the title'), ':bug: fix: correct the title');
  assert.equal(decorateTitle('🐛 fix: correct the title'), '🐛 fix: correct the title');
});

test('a rerun replaces the prefix of a decorated title whose type changed', () => {
  const calls = [];
  const changed = updateTitle(event, (command, args) => {
    calls.push(args);
    return { status: 0, stdout: JSON.stringify({ title: ':sparkles: fix: newer title' }) };
  });
  assert.equal(changed, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].at(-1), ':bug: fix: newer title');
});
