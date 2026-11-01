# Workspace scripts

Every tool here has one purpose and one status: it runs **in a gate**, it is a
**helper** a person runs for a task, or it is a **module** other tools import.
A tool stays because it is useful: it catches a problem someone would otherwise
ship, or it does a task someone needs. A gate check is a useful check that must
run on every change; anything useful only now and then is a helper. Run commands
from the repository root. `nx.json` sets `parallel: 1`, so Nx runs one task at a time
everywhere, and registered gates and CI also disable the Nx daemon.

## What the gates run

The registered target gate is what DotLn's launchpad runs on each order: `npm ci`,
`nx run-many -t lint`, `npm run typecheck:e2e`, `nx run-many -t test` and
`nx format:check` (plain), then `nx run-many -t build`, `nx run-many -t e2e` and
`nx e2e-visual dotln-e2e` (review). CI (`.github/workflows/ci.yml`) runs the same checks,
the workspace checks below once with `nx run workspace-tools:lint` and the other
projects' targets with `nx affected`, and adds `npm run boards` and
`npm run check:bundle`. The visual suite compares the existing macOS baselines and does
not authorize updating them.
`.github/workflows/pr-title.yml` checks pull-request titles with `tools/pr-title.mjs`.

| Command                 | Purpose and intended use                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`          | Every Nx lint target, including the workspace-tools target below and the ESLint rules in `tools/lint-rules/` (`inline-template-newlines.mjs`, `token-names.mjs`). |
| `npm run test`          | Every unit-test project without watch mode.                                                                                                                       |
| `npm run build`         | The production app, with its bundle budgets.                                                                                                                      |
| `npm run e2e`           | The browser suite against the optimized mocked app and Storybook: keyboard, accessibility and responsive checks.                                                  |
| `npm run format:check`  | Formatting, without rewriting files.                                                                                                                              |
| `npm run typecheck:e2e` | Playwright sources type-check under their NodeNext configuration; ESLint does not type-check and Playwright strips types.                                         |
| `npm run check:bundle`  | CI and changes to loading: builds production with metadata and runs `tools/scripts/check-bundle.mjs` (below). Not in the registered gate.                         |

The workspace-tools lint target (`tools/project.json`) runs these checks inside
`npm run lint`:

| Command                         | Script                                                                                                                                                                                                                               | What it protects                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check:templates`       | `tools/scripts/check-template-literals.mjs`                                                                                                                                                                                          | No untranslated literal text in component templates.                                                                                                                                                                                                                                                                                                                                 |
| `npm run check:tokens`          | `tools/scripts/check-token-names.mjs`                                                                                                                                                                                                | Injection-token names and namespaces; shared with the ESLint token rule.                                                                                                                                                                                                                                                                                                             |
| `npm run check:kits`            | `tools/scripts/check-spec-kits.mjs`                                                                                                                                                                                                  | Every `@Injectable` class and token has a test kit, and specs use kits.                                                                                                                                                                                                                                                                                                              |
| `npm run i18n:check`            | `tools/scripts/check-i18n.mjs`                                                                                                                                                                                                       | No missing or extra translation keys; adapts the house pipe for the key extractor without rewriting translations.                                                                                                                                                                                                                                                                    |
| `npm run typecheck:foundations` | `tools/scripts/check-foundation-types.mjs`                                                                                                                                                                                           | Each library's `lib` and `spec` TypeScript configurations compile (sequential, no output).                                                                                                                                                                                                                                                                                           |
| `npm run test:tooling`          | `tools/*.test.mjs`                                                                                                                                                                                                                   | The checks and helpers here behave as documented.                                                                                                                                                                                                                                                                                                                                    |
| `npm run lint:components`       | `tools/scripts/check-component-order.mjs`                                                                                                                                                                                            | Component decorator and member order.                                                                                                                                                                                                                                                                                                                                                |
| `npm run check:shared-types`    | `tools/scripts/check-shared-types.mjs`                                                                                                                                                                                               | No type alias or interface name declared in more than one file under `libs/shared`.                                                                                                                                                                                                                                                                                                  |
| `npm run check:fixtures`        | `tools/scripts/check-board-fixtures.mjs`, `tools/scripts/check-scene-fixtures.mjs`, then `npm run catalog:check` (`tools/scripts/catalog/check-catalog.mjs`) and `npm run studies:check` (`tools/scripts/catalog/check-studies.mjs`) | Board fixtures match their schema and scrub rules; the scene fixtures match `scene-v0` with their unit counts and a clear field; the catalog checkpoints and summary match the schema, provenance and counts; every concept study matches its schema, names real catalog rows, reviewers and sources, and `studies-summary.json` is current. `--write-summary` rewrites the summary. |
| `npm run lint:hygiene`          | `tools/scripts/check-event-hygiene.mjs`                                                                                                                                                                                              | Event-tier mappings in reducers, pipelines, subscriptions and command flows; explicit paths support negative fixtures.                                                                                                                                                                                                                                                               |
| `npm run check:scripts`         | `tools/scripts/check-script-reference.mjs`                                                                                                                                                                                           | This reference names every npm script and every file directly under `tools/scripts`.                                                                                                                                                                                                                                                                                                 |

`npm run check:bundle` walks static imports from the app and global styles,
reports raw initial bytes and package input attribution, refuses catalog/menu
code, the Angular Aria menu and the CDK overlay in the initial graph and ensures
the menu arrives with Tools. Input attribution precedes final output
optimization and need not sum to the reported output bytes. A missing
application entry or static output fails closed.

## Helpers

Run these by hand for the task named. The registered gate runs none of them, and CI
only prints the board count.

| Command or file                         | Purpose and intended use                                                                                                                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run start`                         | Serve the development app with MSW for local feature work without an API or environment file.                                                                                                                                                                     |
| `npm run format`                        | Format workspace files with the repository's Prettier rules while editing.                                                                                                                                                                                        |
| `npm run perf:sample`                   | Rebuild the production artifact and run `tools/scripts/sample-performance.mjs`: five samples of three journeys under two profiles, written to ignored `dist/performance-samples.json`. Diagnostic only; see [performance policy](../architecture/performance.md). |
| `npm run catalog:join`                  | Pass `-- <research-run-directory>` to rebuild catalog content from the pinned maps through `tools/scripts/catalog/join-maps.mjs`, then run `npx prettier --write libs/shared/catalog/src/data`. Never writes the source directory.                                |
| `npm run catalog:report`                | Print validated counts, chapter totals, each work's resolved relations and its scene tools (`tools/scripts/catalog/report.mjs`).                                                                                                                                  |
| `npm run studies:report`                | Print each work's studied, checked and total rows (`tools/scripts/catalog/check-studies.mjs --report`), to see how far the concept studies reach.                                                                                                                 |
| `npm run studies:links`                 | Open every reference and implementation a study cites once and print its status (`tools/scripts/catalog/check-studies.mjs --links`). Reaches the network, so no gate runs it; each batch records its output in its evidence.                                      |
| `npm run lint:fixtures`                 | When changing lint policy: prove the dependency, component-role and convention rules reject their negative fixtures in `tools/lint-fixtures/` and accept the controls (`tools/check-lint-fixtures.mjs`, `tools/check-taxonomy-fixtures.mjs`).                     |
| `tools/scripts/scrub-board-fixture.mjs` | Sanitize a captured board before it becomes a recorded fixture, during an authorized fixture refresh; `check-board-fixtures.mjs` imports its rules.                                                                                                               |
| `npm run env:prime`                     | Validate public `.env` settings and write ignored local environment, production public-settings and development-proxy files (`tools/scripts/prime-environment.mjs`); diagnostics omit values.                                                                     |
| `npm run build:configured`              | Build the production `configured` profile with primed settings, bypassing the Nx cache; run after `env:prime`.                                                                                                                                                    |
| `npm run msw:init`                      | Regenerate the tracked public service worker after an MSW upgrade; review the generated diff.                                                                                                                                                                     |
| `npm run boards`                        | List and count `// BOARDED:` comments under apps and libs with `tools/board-count.mjs` (CI prints the count; it never fails).                                                                                                                                     |

The configured production build always disables mocks and URL flag overrides.
Remove generated local configuration before worktree close. For optimized local
play, use `npx nx serve dotln --configuration=mocked`; its production artifact
counterpart is `npx nx build dotln --configuration=mocked`.

## Modules

| File                             | Purpose                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools/scripts/source-files.mjs` | Source discovery, TypeScript AST traversal and diagnostic locations for the checks above.  |
| `tools/scripts/templates.mjs`    | Discovers Angular templates and adapts the house translation pipe for the template checks. |
