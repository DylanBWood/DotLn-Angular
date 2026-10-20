# Developer reference

DotLn-Angular is an integrated Nx workspace demonstrating the operator's Angular
conventions. It contains a slim, standalone, zoneless `dotln` application, its
Playwright project and three shared foundation libraries under `libs/shared/`:
`core` (typed environment, injection tokens, canonical routes, provider
composition), `utils` (the `R` and `RA` namespaces) and `i18n` (Transloco with
the house `t` pipe). The translated home heading is the temporary feature
boundary.

## Quick start

Use Node 26 (the major in `.node-version`) and npm:

```sh
npm ci
npx playwright install --with-deps chromium
npx nx serve dotln
```

Open the URL printed by Nx. The home page renders **DotLn**. Default development
needs no environment file, API, account or mocking service. For public local
settings, `cp .env.example .env && npm run env:prime` writes the ignored local
environment and proxy, which `npx nx serve dotln --configuration=local` uses.

## Where things live

| Path                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `apps/dotln/src/main.ts`           | Standalone bootstrap                                                 |
| `apps/dotln/src/app/app.config.ts` | `provideDotlnCore()` and `provideDotlnI18n()` composition            |
| `apps/dotln/src/app/app.ts`        | Router outlet shell                                                  |
| `apps/dotln/src/app/app.routes.ts` | Root redirect and lazy home route built from `BasePaths`             |
| `apps/dotln/src/environments`      | Development and production environments; local one is generated      |
| `apps/dotln/public/i18n`           | Translation catalogs (`en.json`)                                     |
| `apps/dotln-e2e`                   | Chromium smoke test                                                  |
| `libs/shared/core`                 | Environment, tokens, routes, providers; `testing` entry point        |
| `libs/shared/utils`                | `R` and `RA` with house declarations and upstream-derived specs      |
| `libs/shared/i18n`                 | Transloco loading, missing keys, `TPipe`; `testing` entry point      |
| `eslint.config.mjs`                | Shared lint rules, token-name rule and dependency constraints        |
| `tools/scripts`                    | Environment primer, structural checks and translation extraction     |
| `tools/lint-fixtures`              | Deliberate violations each check and lint rule must reject           |
| `.github/workflows`                | CI and pull-request title automation                                 |
| `docs/ai-reference`                | Concise operating instructions for coding sessions                   |
| `docs/dotln`                       | Order and review records, populated by the launchpad at final review |

[The foundation reference](architecture/foundation.md) describes the three
libraries, the environment and proxy, the test-kit convention and the checks
that enforce them. Feature libraries join under `libs/` in later changes.

## Checks

```sh
npm run lint
npm test
npm run build
npm run e2e
npm run format:check
npm run lint:fixtures
npm run test:tooling
npm run typecheck:e2e
npm run check:templates
npm run check:tokens
npm run check:kits
npm run i18n:check
npm run typecheck:foundations
```

The registered gate uses the same Nx commands with `NX_DAEMON=false`. Unit tests
run once through Angular's Vitest integration. Playwright starts the application
itself. Keep all commands read-only with respect to versioned source; build,
coverage, cache and browser reports belong in ignored directories.

Read [the conventions](workspace/conventions.md) before changing shared
configuration. Append every project-generating command and its result to
[the generator log](workspace/generator-log.md). Use the installed generator's
`--help` before choosing options.
