# Workspace scripts

Run commands from the repository root. Registered gates disable the Nx daemon
and serialize tasks. Prefer the npm entry points below; the tools table explains
their implementations and the helpers that other checks import.

| Command                         | Purpose and intended use                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run start`                 | Serve the development app with MSW; use for local feature work without an API or environment file.                                                                                                    |
| `npm run lint`                  | Run every Nx lint target, including the tools project's structural, type, fixture and documentation checks; use before review or in CI.                                                               |
| `npm run test`                  | Run all configured unit-test projects without watch mode; use after behavior changes and before review.                                                                                               |
| `npm run build`                 | Build the production app; use to check compilation and bundle budgets. Storybook has a separate build target and is built by the browser-test dependency.                                             |
| `npm run e2e`                   | Run the browser suite against the optimized mocked app and Storybook, including keyboard, accessibility and responsive checks.                                                                        |
| `npm run format`                | Format workspace files with the repository's Prettier rules; use while editing. Generated worker and fixture exclusions stay in effect.                                                               |
| `npm run format:check`          | Check formatting without rewriting files; use before review and in CI.                                                                                                                                |
| `npm run lint:fixtures`         | Prove the dependency, component-role and convention rules reject their negative fixtures and accept controls; use when changing lint policy.                                                          |
| `npm run test:tooling`          | Test the Node-based repository checks, environment primer and PR-title helper; use after tool changes.                                                                                                |
| `npm run typecheck:e2e`         | Type-check Playwright sources under their NodeNext configuration without emitting files; use after browser-test changes.                                                                              |
| `npm run boards`                | List and count `// BOARDED:` comments under apps and libs; use to inspect explicitly boarded code issues.                                                                                             |
| `npm run env:prime`             | Validate public `.env` settings and generate ignored local environment, production public-settings and development-proxy files; run before local-configured serving or a configured production build. |
| `npm run i18n:check`            | Run translation-key extraction through the house pipe adapter and report missing or extra keys without rewriting translations; use after template or copy changes.                                    |
| `npm run check:templates`       | Refuse untranslated literal UI text in discovered Angular templates; use after changing template text or accessible labels.                                                                           |
| `npm run check:tokens`          | Check injection-token names and namespaces; use when adding or moving tokens.                                                                                                                         |
| `npm run check:kits`            | Check injectable/token test-kit exports and kit use in specs; use when adding providers, kits or tests.                                                                                               |
| `npm run typecheck:foundations` | Type-check the shared, shell and board library/spec configurations without emitting files; use when changing public types or testing entry points.                                                    |
| `npm run lint:components`       | Check component decorator/member ordering; use after adding or reorganizing Angular components.                                                                                                       |
| `npm run check:shared-types`    | Detect duplicated exported shared type declarations; use when adding or moving models.                                                                                                                |
| `npm run check:fixtures`        | Validate the recorded and unavailable board fixtures against the pinned schema and path-scrubbing rules; use when changing fixture tooling or ownership.                                              |
| `npm run msw:init`              | Regenerate the tracked public service worker from the installed MSW version; run after an MSW upgrade and review the generated diff.                                                                  |
| `npm run build:configured`      | Build the production `configured` profile with primed public API/flag settings, bypassing Nx cache because generated local settings are ignored inputs; run after `env:prime`.                        |
| `npm run lint:hygiene`          | Refuse forbidden event-tier mappings and count documented exceptions; use after adding event handlers, subscriptions or command trinities.                                                            |
| `npm run check:scripts`         | Check this reference names every npm script and every tools/scripts file; run after adding or removing a workspace command or tool.                                                                   |

| Tool file                                   | Purpose and intended use                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/scripts/check-board-fixtures.mjs`    | Implements board schema and scrub validation; normally invoke through `check:fixtures`.                                                                                    |
| `tools/scripts/check-component-order.mjs`   | Inspects component declarations for house ordering rules; normally invoke through `lint:components`.                                                                       |
| `tools/scripts/check-event-hygiene.mjs`     | Resolves event groups and inspects reducer, pipeline, subscription and command flows; `lint:hygiene` checks the workspace, while explicit paths support negative fixtures. |
| `tools/scripts/check-foundation-types.mjs`  | Runs each library/spec TypeScript configuration sequentially; normally invoke through `typecheck:foundations`.                                                             |
| `tools/scripts/check-i18n.mjs`              | Adapts the house translation pipe for the key extractor and checks the catalog without mutation; normally invoke through `i18n:check`.                                     |
| `tools/scripts/check-script-reference.mjs`  | Compares this document with package scripts and the tool directory; normally invoke through `check:scripts`.                                                               |
| `tools/scripts/check-shared-types.mjs`      | Finds duplicate exported shared type names; normally invoke through `check:shared-types`.                                                                                  |
| `tools/scripts/check-spec-kits.mjs`         | Resolves kit declarations/imports and checks provider/spec coverage; normally invoke through `check:kits`.                                                                 |
| `tools/scripts/check-template-literals.mjs` | Inspects component template text and labels for untranslated literals; normally invoke through `check:templates`.                                                          |
| `tools/scripts/check-token-names.mjs`       | Validates token declaration names and namespace strings; shared with the ESLint token rule and `check:tokens`.                                                             |
| `tools/scripts/prime-environment.mjs`       | Parses and validates public settings, then writes ignored outputs; normally invoke through `env:prime`. Diagnostics omit setting values.                                   |
| `tools/scripts/scrub-board-fixture.mjs`     | Sanitizes a captured board before it becomes a recorded fixture; use only during an authorized fixture refresh, followed by `check:fixtures`.                              |
| `tools/scripts/source-files.mjs`            | Supplies source discovery, TypeScript AST traversal and diagnostic-location helpers; imported by checks rather than run as a command.                                      |
| `tools/scripts/templates.mjs`               | Discovers Angular templates and adapts house translation pipes; imported by template and translation checks.                                                               |

The configured production build always disables mocks and URL flag overrides.
Remove generated local configuration before worktree close. For optimized local
play, use `npx nx serve dotln --configuration=mocked`; its production artifact
counterpart is `npx nx build dotln --configuration=mocked`. The registered visual
check is `npx nx e2e-visual dotln-e2e`; it compares the existing macOS baselines
and does not authorize updating them.
