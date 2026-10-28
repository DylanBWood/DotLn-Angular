# Workspace conventions

These numbered rules retain the workstream's house-rule numbers. The scaffold
implements the shell and its tooling; the rules also guide later libraries.

## 1. Stack

Use the current stable Angular version admitted by Nx, standalone components,
strict TypeScript and zoneless change detection. Use signals for state and the
signal-based input, output and query APIs. Use RxJS for streams and convert at the
boundary with `toSignal` or `toObservable`. Angular's current style guide and
rendering performance take precedence. File names follow Angular's 2025 style:
`app.ts`, `board-page.ts`, without a `.component` suffix. TypeScript remains on `~6.0.3`
and Vitest with UI and coverage aligned at 5.0.5; installed Angular, Nx and AnalogJS admit this version, and MSW 3 requires its updated mocker peer.

Angular build 22.2.3 pins a vulnerable Vite patch. The direct Vite pin and a
parent-scoped override select 8.3.3; remove that override when the parent selects
a fixed patch and checks pass.

Nx 23.3.0 pins Undici 7.29.0. A parent-version-scoped npm override selects
Undici 7.30.1 for its published security fixes. Recheck the override when Nx
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
Test kits import as `@dotln-angular/<lib>/testing`. `tsconfig.base.json` maps the
shared, app-scoped and feature libraries and their testing entry points.

Every project has a scope and a type. Scopes are `scope:shared` and `scope:dotln`
for the first app; types are `app`, `feature`, `ui`, `data-access`, `state`,
`events`, `core`, `util`, `i18n`, `auth` and `models`, prefixed with `type:`.
The shell library is tagged `scope:dotln` and `type:feature` because it now hosts a facade and notices container; the application is `type:app`.

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
pages as features arrive. HTTP-bearing features use MSW 3 in development and tests. Nearly every injectable should expose a `provide<Name>TestKit()` in its
library's `testing` entry point. The board is the first HTTP-backed feature.

Playwright's `.mts` configuration uses NodeNext module resolution and Node 26
types. Run `npm run typecheck:e2e` as well as the browser test: Playwright's
transpilation alone does not check TypeScript configuration or type errors.

## 6. Style

Use Sass (`.scss`) and CSS custom properties for design tokens. Keep a component's
template and styles inline while small, extracting them when they grow. The house `ui` library owns component APIs, markup, styles and tests. Angular
Aria and CDK supply behavior behind wrappers; no vendor component library is used.
The default plain skin is a token layer under `:root` and `[data-skin='plain']`.

## 7. Functional first

Import `R` and `RA` from `@dotln-angular/utils`. Keep upstream runtime behavior
and correct faulty TypeScript declarations in the house adapters. Each used
function has an attributed upstream spec; compiler assertions establish the
intended composition types. Keep functions pure, templates declarative and
state in signals. See [the foundation reference](../architecture/foundation.md).

## 8. State and events

Use NgRx SignalStore with the Events plugin, explicit providers, toolkit call state
and the command trinity. See [state rules](../../ai-reference/state-rules.md).

## 9. Internationalization

Use Transloco through the house `t` pipe for template strings and the house
`translateSignal` export in class code. Keep translation files under
`apps/dotln/public/i18n/`. Run `npm run i18n:check` for missing and extra keys.
Typed translation keys remain a later feature. Source-provided board titles,
labels, questions and values are data under `translate="no"`. The template check
still refuses literal host text inside that marker and requires `t` for framing.

## 10. Dependency injection

Compose explicit `provide*()` functions. Tokens are `PascalCaseToken` with
literal `dotln-angular.<scope>.<lib>.<name>` descriptions. Keep the root-factory
exception limited to `AppBasePathToken` pending the operator's ruling.
Each injectable and token has an exported `provide<Name>TestKit()` in its
library's `testing` entry point, and TestBed setups spread those providers.

Core adapts application configuration to independent shared i18n through
`provideDotlnI18n()`; shared i18n exposes `provideI18n()` and does not import core.

## 11. Routing

Declare `BasePaths` and feature path enums in core; load feature routes lazily.
Build navigation with `buildRoute()`, keeping path and query parameters separate.
Use `AppBasePathToken`, derived from `<base href>`, for sub-path-aware assets.

## 12. Component conventions

Order decorator members as `selector`, `changeDetection`, `template` or
`templateUrl`, `styles` or `styleUrl`, nonempty `providers`, then `imports`.
Use OnPush and host metadata. Shared UI and shell use `dotln`; the board uses
`board`. Keep inline templates on their own lines after the opening and before
the closing backtick. Selector prefixes remain provisional for operator review. Prefer ECMAScript `#private` and mark
unreassigned members `readonly`. Put one projected element on each line. Extract a template or style section above 40 lines.

## 13. Lint and TypeScript

Use ESLint flat configuration with angular-eslint, strict TypeScript, Prettier
and `.editorconfig`. Unused variables warn; prefix an intentionally unused
argument or variable with `_`. TypeScript `private` members are refused in favor
of `#private`. Prefer signal APIs and readonly outputs. A lint or compiler
suppression is an exceptional, documented choice, never the fix for a failing
check. Prettier uses single quotes and a 100-column print width.
Typed lint overrides use an absolute workspace `basePath` so nested project
configs still enforce readonly members. Imports have three autofixed groups:
packages, house aliases, then relatives with the furthest parent first.
Helper aliases belong in each library's `types.ts`, exported when public;
promote a reused helper to `utils`. `npm run check:shared-types` refuses names
declared in multiple files under `libs/shared`.

## 14. Behavior boundaries

Import `@angular/aria` and `@angular/cdk` only under `wrappers/` or the shared UI
provider setup. Fragments, templates, composites and layouts receive inputs and
projection instead of injection. Mappers understand value shapes, never stores.
See [component taxonomy](../architecture/component-taxonomy.md) for the seven
roles and [component rules](../../ai-reference/component-rules.md) for R1–R7.

## 15. Dependency constraints

The root `@nx/enforce-module-boundaries` rule enforces every row below. A project
must satisfy both its scope constraint and its type constraint.

| Source type   | Allowed target types                                                  |
| ------------- | --------------------------------------------------------------------- |
| `app`         | All types                                                             |
| `feature`     | All except `app` and `feature`                                        |
| `data-access` | `events`, `models`, `core`, `util`, shared data-access infrastructure |
| `state`       | `events`, `models`, `core`, `util`                                    |
| `ui`          | `util`, `i18n`, `models`                                              |
| `auth`        | `data-access`, `events`, `models`, `core`, `util`                     |
| `events`      | `models`, `util`                                                      |
| `core`        | `util`, `models`, `i18n`                                              |
| `i18n`        | `util`, `models`                                                      |
| `util`        | `util`                                                                |
| `models`      | None                                                                  |

Shared projects import only shared projects. DotLn-scoped projects may import
shared or DotLn-scoped projects. Add another scope's row before adding its
projects. `npm run lint:fixtures` proves the rule rejects a forbidden dependency;
the deliberately invalid file stays outside ordinary application linting.
Core's i18n integration is the added dependency; the reverse direction remains
forbidden.

## 16. Action hygiene

Use the [state-rule flow table](../../ai-reference/state-rules.md). No same-tier
mapping except an action's own success/failure outcomes. `lint:hygiene` inspects
all non-spec source consumers and reports the exception count.

## 18. Accessibility and visual quality

Use semantic landmarks, a working skip link, visible focus, native keyboard
behavior, and text equivalents for states and emoji. Target WCAG 2.2 AA with axe
checks and real keyboard tests. Honor reduced motion and animate only transitions.
Use fluid lists rather than fixed-width dense tables. Review screenshot baselines
for spacing, typography, clipping and interaction detail; see
[Storybook and visual review](storybook.md).

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

Prettier preserves embedded template bytes in TypeScript (`embeddedLanguageFormatting: off`); otherwise it collapses short Angular templates and conflicts with rule 12. ESLint enforces the surrounding newlines, and Angular template lint and compilation still check their contents.

## 22. Sub-apps

Keep one app with sub-apps behind the shell menu. A sub-app is a lazy feature
library under `libs/features/<sub-app>`, tagged `scope:dotln,type:feature`, importing
as `@dotln-angular/<sub-app>` and exporting only its routes. A menu group can link
several sub-apps. Feature data access lives in `<sub-app>-data-access`; reusable
engines, models, readers and clocks live under `libs/shared/`. `libs/dotln/` stays
the shell's. The shell owns menu presentation; the app owns router links.

Every new idea lands here as a toy first. The app writes no control record and
does not reach the platform; graduation is a GitHub issue on `DylanBWood/DotLn`.
Read [sub-app architecture](../architecture/sub-apps.md) for the addition steps
and [session rules](../../ai-reference/sub-app-rules.md) for the checklist.

## 23. Catalog data

The catalog carries full definitions, relations, hooks, verification notes and
place fields under `tool-v1`. The loader accepts v0 for one compatibility
release. No quarantine file is opened. Keep map ids and digests stable; join
only the declared maps; preserve uncertain candidates as untyped; and grow the
transform enum only by a recorded decision. Use the complete catalog check and
injectable lazy-loader seam. Present the data as a reading session and develop
authored concept studies without obscuring source provenance. See [catalog architecture](../architecture/catalog.md)
and [catalog rules](../../ai-reference/catalog-rules.md).
