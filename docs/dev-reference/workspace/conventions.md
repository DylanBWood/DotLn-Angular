# Workspace conventions

These numbered rules retain the workstream's house-rule numbers. The scaffold
implements the shell and its tooling; the rules also guide later libraries.

## 1. Stack

Use the current stable Angular version admitted by Nx, standalone components,
strict TypeScript and zoneless change detection. Use signals for state and the
signal-based input, output and query APIs. Use RxJS for streams and convert at the
boundary with `toSignal` or `toObservable`. Angular's current style guide and
rendering performance take precedence. File names follow Angular's 2025 style:
`app.ts`, `home.ts`, without a `.component` suffix. TypeScript remains on `~6.0.3`
and Vitest on 4.x for Angular 22 compatibility.

Nx 23.3.0 pins Undici 7.29.0. A parent-version-scoped npm override selects
Undici 7.29.1 for its published security fixes. Recheck the override when Nx
changes; remove it once Nx itself selects a fixed version and the audit and
workspace checks pass. Keep Nx packages aligned and preserve peer checks.

## 2. Workspace

Keep `apps/` slim: bootstrap, providers, routes and environments. Features and
reusable behavior belong in Nx-generated libraries. Record the exact command,
Nx version and created projects in [the generator log](generator-log.md) before
each generator runs, then append its result. Stop the daemon before using
generators in a second worktree: `npx nx daemon --stop`. Use `npx nx reset` to
clear a confused cache. `.nx/cache` is local to each worktree. Local development
permits the daemon; CI and the external gate set `NX_DAEMON=false`.

## 3. Libraries and import paths

Shared libraries belong under `libs/shared/` and import as
`@dotln-angular/<name>`: `core`, `utils`, `i18n`, `ui`, `events`, `models`, `state`,
`data-access` and `auth`. Features belong under `libs/features/` as `<feature>`,
`<feature>-data-access` and, when shared, `<feature>-models`. App-scoped libraries
belong under `libs/<app>/` and import as `@dotln-angular/<app>/<name>`.
Test kits import as `@dotln-angular/<lib>/testing`. Until libraries are generated,
`tsconfig.base.json` has an empty `paths` map.

Every project has a scope and a type. Scopes are `scope:shared` and `scope:dotln`
for the first app; types are `app`, `feature`, `ui`, `data-access`, `state`,
`events`, `core`, `util`, `i18n`, `auth` and `models`, prefixed with `type:`.
The shell is tagged `scope:dotln` and `type:app`.

## 4. Barrels

An importable library's `index.ts` contains only
`export * from './public_api';`; `public_api.ts` lists exports explicitly.
A feature exposes only its routes. Inside a feature, import relatively instead
of importing its own alias. Do not create circular dependencies through barrels.

## 5. Testing

The application uses `vitest-angular`, Angular's and Nx's standard Vitest wiring;
switch it to AnalogJS only after recording a failure in that route. New
non-buildable libraries use Nx's documented `vitest-analog` default. Use one
Playwright project per app and add axe checks on key
pages as features arrive. HTTP-bearing features will use MSW in development and
tests. Nearly every injectable should expose a `provide<Name>TestKit()` in its
library's `testing` entry point. This scaffold has no injectable business service
or HTTP feature and does not install MSW.

Playwright's `.mts` configuration uses NodeNext module resolution and Node 26
types. Run `npm run typecheck:e2e` as well as the browser test: Playwright's
transpilation alone does not check TypeScript configuration or type errors.

## 6. Style

Use Sass (`.scss`) and CSS custom properties for design tokens. Keep a component's
template and styles inline while small, extracting them when they grow. PrimeNG
will be introduced behind wrappers in a later feature change; the scaffold has
no vendor UI dependency.

## 12. Component conventions

Order decorator members as `selector`, `changeDetection`, `template` or
`templateUrl`, `styles` or `styleUrl`, nonempty `providers`, then `imports`.
Use OnPush. The shell and placeholder use prefix `dotln`; new libraries declare
their own selector prefix from the house allow list (`shared`, `app`, `dotln`,
`dotln-angular`, or the feature name). Prefer ECMAScript `#private` and mark
unreassigned members `readonly`.

## 13. Lint and TypeScript

Use ESLint flat configuration with angular-eslint, strict TypeScript, Prettier
and `.editorconfig`. Unused variables warn; prefix an intentionally unused
argument or variable with `_`. TypeScript `private` members are refused in favor
of `#private`. Prefer signal APIs and readonly outputs. A lint or compiler
suppression is an exceptional, documented choice, never the fix for a failing
check. Prettier uses single quotes and a 100-column print width.

## 15. Dependency constraints

The root `@nx/enforce-module-boundaries` rule enforces every row below. A project
must satisfy both its scope constraint and its type constraint.

| Source type   | Allowed target types                              |
| ------------- | ------------------------------------------------- |
| `app`         | All types                                         |
| `feature`     | All except `app` and `feature`                    |
| `data-access` | `events`, `models`, `core`, `util`                |
| `state`       | `events`, `models`, `core`, `util`                |
| `ui`          | `util`, `i18n`, `models`                          |
| `auth`        | `data-access`, `events`, `models`, `core`, `util` |
| `events`      | `models`, `util`                                  |
| `core`        | `util`, `models`                                  |
| `i18n`        | `util`, `models`                                  |
| `util`        | `util`                                            |
| `models`      | None                                              |

Shared projects import only shared projects. DotLn-scoped projects may import
shared or DotLn-scoped projects. Add another scope's row before adding its
projects. `npm run lint:fixtures` proves the rule rejects a forbidden dependency;
the deliberately invalid file stays outside ordinary application linting.

## 19. Documentation

Maintain `docs/dev-reference/` for people and `docs/ai-reference/` for coding
sessions. DotLn's filed records belong under `docs/dotln/`, populated by the
launchpad. Keep commands, paths and generated-project provenance current.

## 20. Commits and pull requests

Write conventional commits in the present imperative. Open pull requests with a
bare conventional title; the title workflow prepends the type's gitmoji from
`.github/gitmoji-map.json`. The operator reviews the code and automated review
comments before final review, and merges with a merge commit whose message is
the pull-request title. Repository settings are operator-owned. The current
launchpad route opens a draft after verification; final publication supersedes
that draft.

## 21. Broken windows

Fix an encountered defect in the same change or board it visibly with a skipped
failing test and `// BOARDED: <follow-up>`, or a visible "not implemented" surface.
Record the follow-up and its reopening condition in the order. CI prints the
board count. Do not conceal failed checks with a suppression or passing stub.
