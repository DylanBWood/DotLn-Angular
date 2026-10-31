# Foundation libraries

`apps/dotln/src/app/app.config.ts` boots with `provideDotlnCore({ environment,
routes: appRoutes })` and `provideDotlnI18n()`, both from
`@dotln-angular/core`, then adds `provideDotlnHttp()` and `provideDotlnStorage()`
from `@dotln-angular/data-access`, `provideDotlnState()` from `@dotln-angular/state`
and `provideDotlnUi()` from `@dotln-angular/ui`. This document covers the three
libraries everything else stands on; [events, state and HTTP](events-and-state.md)
covers the state and HTTP providers and the
[component taxonomy](component-taxonomy.md) the UI's.

| Library | Responsibility                                                | Public entry                          |
| ------- | ------------------------------------------------------------- | ------------------------------------- |
| `core`  | Application configuration, routing and integration providers  | `libs/shared/core/src/public_api.ts`  |
| `utils` | Typed `R` and `RA` namespaces                                 | `libs/shared/utils/src/public_api.ts` |
| `i18n`  | Translation loading, missing keys, `TPipe`, `translateSignal` | `libs/shared/i18n/src/public_api.ts`  |

Core depends on shared i18n. Shared i18n accepts an independent `I18nConfig`
through `provideI18n(configOrFactory)` and does not import core.
`libs/shared/core/src/lib/i18n/provide-dotln-i18n.ts` adapts the application
environment and base path to that contract. Each of the three also has a separate
`@dotln-angular/<lib>/testing` entry point.

## Environment and proxy

`libs/shared/core/src/lib/environment/environment-config.ts` declares
`EnvironmentConfig`, `EnvironmentConfigToken` and `provideEnvironmentConfig()`.
The app's development environment enables mocks; its production environment
disables them. `apps/dotln/project.json` replaces `environment.ts` with
`environment.prod.ts` for production, `environment.mocked.ts` for the optimized
mocked build and `environment.local.ts` for local builds.

To run with public local settings:

```sh
cp .env.example .env
npm run env:prime
npx nx serve dotln --configuration=local
```

`tools/scripts/prime-environment.mjs` reads the documented `DOTLN_` settings,
validates them and emits a value satisfying `EnvironmentConfig`. Named process
environment values override `.env`. Diagnostics do not print values. The
configuration enters the browser bundle, so it must contain public settings
only; `auth` remains an `unknown` placeholder.

Default development uses `apps/dotln/proxy.conf.json`, mapping `/api` and
`/api/**` to the example local service. Priming also writes
`.nx/dotln/proxy.conf.json` with `DOTLN_API_PROXY_TARGET`; local serve selects it.
A static JSON file cannot interpolate environment variables, so the generated
file supplies this behavior. `.env`, `environment.local.ts` and
`public-config.local.ts` are ignored. Remove the generated files after a local-build
check.

## Tokens, paths and providers

Use `provide*()` composition. Tokens are PascalCase names ending in `Token`
with literal descriptions under `dotln-angular.<scope>.<lib>.<name>`.
`AppBasePathToken` reads `<base href>`, defaulting to `/`. It is the only house
token with a root factory, and core also provides it explicitly. This limited
default awaits the operator's ruling.

`libs/shared/core/src/lib/paths/routes.ts` declares `BasePaths`, `ChildPaths`
and `buildRoute()`. Route commands keep path parameters separate from query
parameters. The root redirects to `BasePaths.Scene`; every feature route loads
lazily. For example:

```ts
const route = buildRoute(BasePaths.Tools, { query: { page: 1 } });
router.navigate(route.commands, { queryParams: route.queryParams });
```

Core composes HTTP, the router with component input binding, zoneless change
detection, browser error listeners, environment configuration and the base path.

## Functional utilities

Import `R` and `RA` from `@dotln-angular/utils`. The runtime implementations
remain Ramda and Ramda Adjunct. The house layer corrects declarations where
upstream types do not describe the behavior:

- `R.filter` returns a variable-length array, not the original tuple, and
  makes dictionary keys optional because filtering can remove them. It preserves
  narrowing predicates, currying, maps, custom dispatch and transducer behavior.
- `RA.isNonEmptyString` narrows primitive inputs to `RA.NonEmptyString` and
  supports placeholders. Unknown or object inputs return a boolean or a curried
  function without narrowing: an unknown object could be a Ramda placeholder.
  The branded string subtype keeps the false branch sound because an empty
  string is still a string. The brand is a compile-time refinement.

The adapters are `libs/shared/utils/src/lib/ramda/filter.ts` and
`libs/shared/utils/src/lib/ramda-adjunct/is-non-empty-string.ts`. Other declarations
remain upstream; this does not claim every upstream type has been repaired.

The used-function list in `libs/shared/utils/src/public_api.ts` names `R.pipe`, `R.map`,
`R.filter` and `RA.isNonEmptyString`. Each has an attributed upstream-derived spec under
`libs/shared/utils/src/lib/upstream-specs/`. Runtime examples check compatibility,
while compiler assertions check the house contract, including `number[]`, filtered tuples,
optional object keys and narrowed composition. `npm run typecheck:foundations`
executes these assertions; running Vitest alone does not type-check them.
Add the corresponding upstream spec and type regressions when adopting another
function. `THIRD-PARTY-NOTICES.md` carries both upstream license texts.

## Translations

Use `'scope.key' | t` in templates and `translateSignal()` from
`@dotln-angular/i18n` in class code. `apps/dotln/public/i18n/en.json` owns every
host-authored string, in one block per area. The document title is the static `<title>` in
`apps/dotln/src/index.html`. `TranslocoHttpLoader` accepts configured language
identifiers and loads assets beneath the configured base path. Missing keys
throw in development and return the key in production. The pipe rerenders on
language changes.

`npm run i18n:check` runs Transloco Keys Manager's `find` with
`--emit-error-on-extra-keys`. Its extractor recognizes upstream names. The
adapter parses templates with Angular, changes only the `t` pipe's AST name
span in temporary input, and adapts the house `translateSignal` import.
Source and catalog files remain unchanged. Tests cover missing and extra keys
and a pipe-like substring inside a literal key.

## Test kits and enforcement

Kits return `providers` and configuration handles. Each `@Injectable` class and token has
a `provide<Name>TestKit()` exported from its library's testing entry point.
Shared i18n's aggregate kit uses `TranslocoTestingModule`; its loader kit uses
Angular HTTP testing providers. Utils supplies pure sample data.

```ts
TestBed.configureTestingModule({
  providers: [...provideEnvironmentConfigTokenTestKit({ mocks: false }).providers],
});
```

Same-library specs import the relative testing entry point; consumers use the
public alias. `workspace-tools:lint` runs template, token and kit checks, translation
extraction, foundation type checks and tooling tests with the other workspace
checks, and CI runs that target once on every change. `npm run lint:fixtures`
exercises the negative lint fixtures when lint policy changes. The checks parse syntax
trees; tests cover multiline templates, nested token generics, aliases, missing
kits and missing or fabricated provider spreads. The `dotln/token-names`
ESLint rule and `check:tokens` share one import-aware inspector, so bare,
aliased and namespace constructors receive the same judgment. Kit aliases
must be `const` bindings; TypeScript symbols resolve them within their lexical
scope, including identically named variables in separate test callbacks.

## Cache and runner choices

Angular 22.2.3 resolves a relative CLI disk-cache path through a worktree's
common Git directory to the base checkout. `nx.json` disables that additional
cache and retains Nx task caching in `.nx/cache`. Angular's Vite artifacts use
its separate worktree-local path. An absolute CLI cache path would retain
Angular caching but require machine-specific configuration; this workspace
chooses portable isolation. Revisit when Angular supports a portable path that
stays within each worktree.

The generated non-buildable libraries use AnalogJS with Vitest. Both AnalogJS
packages are pinned to 2.9.1 after the generator-selected dependency chain
produced audit findings and that version supplied the compatible repair.
`models` and `scene-engine` compile no Angular, so their Vitest configuration runs in
the `node` environment without the plugin. The generated Vitest workspace setting
became the `projects` form in `vitest.config.mts`.

See [the foundation rules](../../ai-reference/foundation-rules.md).
