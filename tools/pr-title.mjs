import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const gitmoji = JSON.parse(readFileSync(new URL('../.github/gitmoji-map.json', import.meta.url)));

/** @param {string} title Current title. @returns {string} Title with its supported gitmoji. */
export function decorateTitle(title) {
  if (typeof title !== 'string' || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(title)) {
    throw new Error('The pull-request title must be a single line of text.');
  }
  const prefixes = Object.values(gitmoji).flatMap(({ shortcode, emoji }) => [shortcode, emoji]);
  const prefix = prefixes.find((value) => title.startsWith(`${value} `));
  const subject = prefix ? title.slice(prefix.length + 1) : title;
  const match = /^(?<type>[a-z]+)(?:\([^()]+\))?!?: \S.*$/u.exec(subject);
  const type = match?.groups.type;
  if (prefix && /\S/u.test(subject) && !match) return title;
  if (!type || !Object.hasOwn(gitmoji, type)) {
    throw new Error(
      'Use a supported gitmoji and subject, or type(scope)?: subject with a supported type.',
    );
  }
  const { shortcode, emoji } = gitmoji[type];
  // A prefix for the title's own type stays as written; any other prefix is
  // stale (the type changed after decoration) and is replaced.
  return prefix === shortcode || prefix === emoji ? title : `${shortcode} ${subject}`;
}

/**
 * @param {{pull_request?: {number?: number}, repository?: {full_name?: string}}} event PR event.
 * @param {typeof spawnSync} run Process runner, replaceable by the tests.
 * @returns {boolean} Whether the current remote title needed and received an edit.
 */
export function updateTitle(event, run = spawnSync) {
  const number = event.pull_request?.number;
  const repository = event.repository?.full_name;
  if (
    !Number.isSafeInteger(number) ||
    number <= 0 ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')
  ) {
    throw new Error('Expected a pull-request event with its repository and number.');
  }
  const identity = [String(number), '--repo', repository];
  // An old event or rerun must decorate the current title, not restore its snapshot.
  const current = run('gh', ['pr', 'view', ...identity, '--json', 'title'], {
    encoding: 'utf8',
    shell: false,
  });
  if (current.error) throw current.error;
  if (current.status !== 0) throw new Error('Unable to read the current pull-request title.');
  const { title } = JSON.parse(current.stdout);
  const decorated = decorateTitle(title);
  if (decorated === title) return false;

  // Title text stays one argument; it is never evaluated by a shell.
  const result = run('gh', ['pr', 'edit', ...identity, '--title', decorated], {
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    // BOARDED: Fork pull-request titles still need a base-context edit route.
    throw new Error(
      'Title update failed. Check Actions workflow permissions for pull-requests: write.',
    );
  }
  return true;
}

if (import.meta.main) {
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    updateTitle(event);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
