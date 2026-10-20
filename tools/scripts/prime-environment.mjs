import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const keys = [
  'DOTLN_PRODUCTION',
  'DOTLN_API_BASE_URL',
  'DOTLN_MOCKS',
  'DOTLN_FEATURE_FLAGS',
  'DOTLN_I18N_DEFAULT_LANG',
  'DOTLN_I18N_AVAILABLE_LANGS',
  'DOTLN_AUTH',
  'DOTLN_API_PROXY_TARGET',
];

function boolean(values, key, fallback) {
  const value = values[key];
  if (value === undefined) return fallback;
  if (value !== 'true' && value !== 'false') throw new Error(`${key} must be true or false.`);
  return value === 'true';
}

function json(values, key, fallback) {
  if (values[key] === undefined) return fallback;
  try {
    return JSON.parse(values[key]);
  } catch {
    throw new Error(`${key} must be valid JSON.`);
  }
}

export function environmentFromValues(values) {
  if (Object.keys(values).some((key) => key.startsWith('DOTLN_') && !keys.includes(key))) {
    throw new Error('Unrecognized DOTLN_ setting; see .env.example.');
  }
  const production = boolean(values, 'DOTLN_PRODUCTION', false);
  const mocks = boolean(values, 'DOTLN_MOCKS', !production);
  if (production && mocks) throw new Error('Production configuration cannot enable mocks.');
  const featureFlags = json(values, 'DOTLN_FEATURE_FLAGS', {});
  if (
    featureFlags === null ||
    Array.isArray(featureFlags) ||
    typeof featureFlags !== 'object' ||
    Object.values(featureFlags).some((value) => typeof value !== 'boolean')
  ) {
    throw new Error('DOTLN_FEATURE_FLAGS must be an object of boolean flags.');
  }
  const defaultLang = values.DOTLN_I18N_DEFAULT_LANG ?? 'en';
  const availableLangs = [
    ...new Set((values.DOTLN_I18N_AVAILABLE_LANGS ?? 'en').split(',').map((lang) => lang.trim())),
  ];
  if (
    availableLangs.some((lang) => !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(lang)) ||
    !availableLangs.includes(defaultLang)
  ) {
    throw new Error('The default language must be one of the configured language identifiers.');
  }
  const apiBaseUrl = values.DOTLN_API_BASE_URL ?? '/api';
  if (!/^\/(?!\/)/.test(apiBaseUrl)) {
    let url;
    try {
      url = new URL(apiBaseUrl);
    } catch {
      throw new Error('DOTLN_API_BASE_URL must be a root-relative path or an HTTP(S) URL.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('DOTLN_API_BASE_URL must be an HTTP(S) URL without credentials.');
    }
  }
  let target;
  try {
    target = new URL(values.DOTLN_API_PROXY_TARGET ?? 'http://127.0.0.1:3000');
  } catch {
    throw new Error('DOTLN_API_PROXY_TARGET must be an HTTP(S) URL.');
  }
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.search ||
    target.hash
  ) {
    throw new Error(
      'DOTLN_API_PROXY_TARGET must be an HTTP(S) URL without credentials, query or fragment.',
    );
  }
  return {
    environment: {
      production,
      apiBaseUrl,
      mocks,
      featureFlags,
      i18n: { defaultLang, availableLangs },
      auth: json(values, 'DOTLN_AUTH', null),
    },
    proxy: Object.fromEntries(
      ['/api', '/api/**'].map((path) => [
        path,
        { target: target.href, secure: true, changeOrigin: false },
      ]),
    ),
  };
}

export function primeEnvironment(root, processValues = process.env) {
  const fromFile = parse(readFileSync(resolve(root, '.env')));
  const overrides = Object.fromEntries(
    keys.filter((key) => processValues[key] !== undefined).map((key) => [key, processValues[key]]),
  );
  const { environment, proxy } = environmentFromValues({ ...fromFile, ...overrides });
  const outputs = [
    [
      'apps/dotln/src/environments/environment.local.ts',
      `// Generated public client configuration; do not commit.\nimport type { EnvironmentConfig } from '@dotln-angular/core';\n\nexport const environment = ${JSON.stringify(environment, null, 2)} satisfies EnvironmentConfig;\n`,
    ],
    ['.nx/dotln/proxy.conf.json', `${JSON.stringify(proxy, null, 2)}\n`],
  ];
  for (const [path, contents] of outputs) {
    const absolute = resolve(root, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, contents, { mode: 0o600 });
  }
  return outputs.map(([path]) => path);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    for (const path of primeEnvironment(root)) console.log(`Generated ${path}`);
  } catch (error) {
    // Environment values never appear in diagnostics.
    console.error(
      error.code === 'ENOENT' ? 'Create .env from .env.example before priming.' : error.message,
    );
    process.exitCode = 1;
  }
}
