# Developer reference

DotLn-Angular is an integrated Nx workspace demonstrating the operator's Angular
conventions. A slim, standalone, zoneless `dotln` application composes providers,
navigation and lazy routes; `dotln-e2e` is its Playwright project; everything else
lives in libraries. The shell's menu groups Scene, Machinery and Tools, and the sub-apps
behind it are the soldier scene, the actor board, the Machinery placeholder and the
tool catalog.

## Quick start

Use Node 26 (the major in `.node-version`) and npm:

```sh
npm ci
npx playwright install --with-deps chromium
npx nx serve dotln
```

Open the URL printed by Nx. The root opens **The soldier scene**. Machinery links the
actor board, using the app's mocked HTTP API, and Tools links the bundled catalog.
Default development needs no environment file, external API or account. For public
local settings, `cp .env.example .env && npm run env:prime` writes the ignored local
environment and proxy, which `npx nx serve dotln --configuration=local` uses.

## Find a convention

| What you want to know                                                                                            | Read                                                       | Start from                                                        |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| How a feature library is laid out, and how to add a lazy feature to the one app                                  | [Sub-app architecture](architecture/sub-apps.md)           | `libs/features/board/src/lib/board.routes.ts`                     |
| What a component may know: the seven roles, the UI, the shell and the board                                      | [Component taxonomy](architecture/component-taxonomy.md)   | `libs/features/board/src/lib/composites/board-row/board-row.ts`   |
| Where state lives: events, stores, HTTP, persistence and mocks                                                   | [Events, state and HTTP](architecture/events-and-state.md) | `libs/features/board-data-access/src/lib/board-store.ts`          |
| How the scene works: the pure engine, the renderer seam, the clock, determinism and its own steering rules       | [Scene architecture](architecture/scene.md)                | `libs/shared/scene-engine/src/lib/simulation.ts`                  |
| How the catalog works: the tool-v1 schema, the join and its digests, the loader and the reading surface          | [Catalog architecture](architecture/catalog.md)            | `tools/scripts/catalog/join-maps.mjs`                             |
| How a concept is applied elsewhere: the UIFA engineer's workshop, diagnostic traps, RxJS as a modelling language | [Concept mapping](architecture/concept-mapping.md)         | `libs/shared/models/src/lib/toolbox.ts`                           |
| The three foundation libraries, the environment and proxy, the test-kit convention                               | [Foundation libraries](architecture/foundation.md)         | `libs/shared/core/src/lib/providers/provide-dotln-core.ts`        |
| What the board renders and how it treats its contract                                                            | [Recorded actor board](architecture/console.md)            | `libs/features/board/src/lib/containers/board-page/board-page.ts` |
| Bundle placement, repeatable browser sampling, budgets and routine overrun diagnosis                             | [Performance policy](architecture/performance.md)          | `tools/scripts/check-bundle.mjs`                                  |
| The house rules as they apply in this workspace                                                                  | [Workspace conventions](workspace/conventions.md)          | `eslint.config.mjs`                                               |
| Every command, its purpose and which gate runs it                                                                | [Workspace scripts](workspace/scripts.md)                  | `package.json`                                                    |
| Stories, the browser suite and screenshot baselines                                                              | [Storybook and visual review](workspace/storybook.md)      | `apps/dotln-e2e/playwright.visual.config.mts`                     |

## Where things live

| Path                               | Purpose                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/dotln/src/main.ts`           | Standalone bootstrap                                                                     |
| `apps/dotln/src/app/app.config.ts` | Provider composition: core, HTTP, storage, state, i18n and UI                            |
| `apps/dotln/src/app/app.ts`        | The shell: the sub-app menu's links and the router outlet, projected into the app layout |
| `apps/dotln/src/app/app.routes.ts` | Root redirect, lazy sub-app routes and the not-found fallback                            |
| `apps/dotln/src/environments`      | Development, mocked and production environments; local ones are generated                |
| `apps/dotln/public/i18n`           | Translation catalogs (`en.json`)                                                         |
| `apps/dotln-e2e`                   | Chromium behavior, accessibility, responsive and visual tests                            |
| `libs/dotln/shell`                 | App layout, sub-app menu, shell notices and the not-found page                           |
| `libs/features`                    | The sub-apps and their data-access libraries                                             |
| `libs/shared/core`                 | Environment, tokens, routes, providers; `testing` entry point                            |
| `libs/shared/utils`                | `R` and `RA` with house declarations and upstream-derived specs                          |
| `libs/shared/i18n`                 | Transloco loading, missing keys, `TPipe`; `testing` entry point                          |
| `libs/shared/ui`                   | House components, the plain and field skins, and the lazy `@dotln-angular/ui/menu` entry |
| `libs/shared/models`               | Shared types and the versioned contracts: the board, the catalog's `tool-v1`             |
| `libs/shared/events`               | Every event group, by source tier                                                        |
| `libs/shared/state`                | App stores: feature flags, errors and navigation                                         |
| `libs/shared/data-access`          | Commands, persistence, interceptors and the mock-worker start                            |
| `libs/shared/catalog`              | The catalog's data, schema, loader and reading store                                     |
| `libs/shared/scene-engine`         | The pure scene engine                                                                    |
| `eslint.config.mjs`                | Shared lint rules, token-name rule and dependency constraints                            |
| `tools/scripts`                    | Environment primer, structural checks, translation extraction and the catalog pipeline   |
| `tools/lint-fixtures`              | Deliberate violations each check and lint rule must reject                               |
| `.github/workflows`                | CI and pull-request title automation                                                     |
| `docs/ai-reference`                | Concise operating instructions for coding sessions                                       |
| `docs/dotln`                       | Order and review records, populated by the launchpad at final review                     |

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

`npm run lint` already runs the workspace checks in this list;
[the scripts reference](workspace/scripts.md) says what each protects. The registered
gate uses the same Nx commands with `NX_DAEMON=false`. Unit tests
run once, through Angular's Vitest integration in the app and Nx's Vitest executor in
the libraries. Playwright starts the application itself. Keep all commands read-only with respect to versioned source; build,
coverage, cache and browser reports belong in ignored directories.

Read [the conventions](workspace/conventions.md) before changing shared
configuration. Append every project-generating command and its result to
[the generator log](workspace/generator-log.md). Use the installed generator's
`--help` before choosing options.
