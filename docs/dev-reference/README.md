# Developer reference

DotLn-Angular is an integrated Nx workspace demonstrating the operator's Angular
conventions. It currently contains a slim, standalone, zoneless `dotln` application
and its Playwright project. The home heading is the temporary feature boundary.

## Quick start

Use Node 26 (the major in `.node-version`) and npm:

```sh
npm ci
npx playwright install --with-deps chromium
npx nx serve dotln
```

Open the URL printed by Nx. The home page renders **DotLn**. This scaffold needs no
environment file, API, account or mocking service.

## Where things live

| Path                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `apps/dotln/src/main.ts`           | Standalone bootstrap                                                 |
| `apps/dotln/src/app/app.config.ts` | Zoneless, router and HTTP providers                                  |
| `apps/dotln/src/app/app.ts`        | Router outlet shell                                                  |
| `apps/dotln/src/app/app.routes.ts` | Eager placeholder home route                                         |
| `apps/dotln-e2e`                   | Chromium smoke test                                                  |
| `eslint.config.mjs`                | Shared lint rules and dependency constraints                         |
| `tools/lint-fixtures`              | Deliberate boundary violation, exercised separately                  |
| `.github/workflows`                | CI and pull-request title automation                                 |
| `docs/ai-reference`                | Concise operating instructions for coding sessions                   |
| `docs/dotln`                       | Order and review records, populated by the launchpad at final review |

Libraries join under `libs/` in later changes; none are needed for this scaffold.

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
```

The registered gate uses the same Nx commands with `NX_DAEMON=false`. Unit tests
run once through Angular's Vitest integration. Playwright starts the application
itself. Keep all commands read-only with respect to versioned source; build,
coverage, cache and browser reports belong in ignored directories.

Read [the conventions](workspace/conventions.md) before changing shared
configuration. Append every project-generating command and its result to
[the generator log](workspace/generator-log.md). Use the installed generator's
`--help` before choosing options.
