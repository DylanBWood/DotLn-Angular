# Developer reference

DotLn-Angular is an integrated Nx workspace demonstrating the operator's Angular
conventions. It contains a slim, standalone, zoneless `dotln` application, its
Playwright project and shared foundation libraries under `libs/shared/`:
`core` (typed environment, injection tokens, canonical routes, provider
composition), `utils` (the `R` and `RA` namespaces) and `i18n` (Transloco with
the house `t` pipe). The shell groups the actor board, Scene, Machinery and the
Tools catalog. Feature logic lives in libraries; the app composes providers,
navigation and lazy routes.

## Quick start

Use Node 26 (the major in `.node-version`) and npm:

```sh
npm ci
npx playwright install --with-deps chromium
npx nx serve dotln
```

Open the URL printed by Nx. The root opens **The actor board**, using the app's
mocked HTTP API; Tools opens the bundled catalog. Default development needs no
environment file, external API or account. For public local
settings, `cp .env.example .env && npm run env:prime` writes the ignored local
environment and proxy, which `npx nx serve dotln --configuration=local` uses.

## Where things live

| Path                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `apps/dotln/src/main.ts`           | Standalone bootstrap                                                 |
| `apps/dotln/src/app/app.config.ts` | `provideDotlnCore()` and `provideDotlnI18n()` composition            |
| `apps/dotln/src/app/app.ts`        | Router outlet shell                                                  |
| `apps/dotln/src/app/app.routes.ts` | Root redirect, lazy sub-app routes and the not-found fallback        |
| `apps/dotln/src/environments`      | Development and production environments; local one is generated      |
| `apps/dotln/public/i18n`           | Translation catalogs (`en.json`)                                     |
| `apps/dotln-e2e`                   | Chromium behavior, accessibility, responsive and visual tests        |
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
that enforce them. Feature libraries live under `libs/features/`.

[Performance policy](architecture/performance.md) describes bundle placement,
repeatable browser sampling, budget calibration and routine overrun diagnosis.

## Checks

```sh
npm run lint
npm test
npm run build
npm run e2e
npm run format:check
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

See [the component taxonomy and rules](architecture/component-taxonomy.md) for the UI, shell and board.

Read [sub-app architecture](architecture/sub-apps.md) for the Scene, Machinery and
Tools groups and the convention for adding a lazy feature to the one app.

Read [catalog architecture](architecture/catalog.md) for the tool-v1 schema, the
source join and its digest rule, the catalog check, the lazy loader and the Tools
reading surface.

Read [concept mapping](architecture/concept-mapping.md) for the UIFA engineer's
workshop purpose, applications across domains, diagnostic system traps, and the
RxJS modelling exercise that guides continued mining.
