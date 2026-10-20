# Foundation rules

- Bootstrap through `provideDotlnCore()` and core's `provideDotlnI18n()`.
  Keep shared i18n independent of core; adapt application configuration in
  `libs/shared/core/src/lib/i18n/`.
- Use `EnvironmentConfigToken` and `provideEnvironmentConfig()`. Keep development,
  production and local file replacements aligned. Put only public browser
  settings in `.env`; never commit `.env` or `environment.local.ts`.
- Use PascalCase token names ending in `Token` and literal
  `dotln-angular.<scope>.<lib>.<name>` descriptions. Use `provide*()` functions.
  Keep the root-factory exception limited to `AppBasePathToken`.
- Declare route enums and build navigation through `buildRoute()`. Keep path
  parameters separate from query parameters. Load features lazily.
- Import `R` and `RA` from `@dotln-angular/utils`. Fix faulty upstream types in
  the house adapter; preserve the upstream runtime. Assert the intended type
  contract rather than changing assertions to accept an incorrect declaration.
  Port one attributed upstream spec for each newly used function and update
  `public_api.ts`'s used-function list. Run the compiler as well as Vitest.
- Use `| t` for template text and `translateSignal` from the house i18n entry
  point in class code. Add keys to `apps/dotln/public/i18n/en.json`.
- Export `provide<Name>TestKit()` for each injectable and token through its
  library's `testing` entry point. Spread a kit's providers in TestBed setups.
  Import same-library helpers relatively and consumer helpers through aliases.
- Keep `index.ts` to `export * from './public_api';`. Name public exports in
  `public_api.ts`; keep testing helpers out of the production API.
- Use ECMAScript `#private` and `readonly` members. Keep signals and the existing
  underscore opt-out for intentionally unused variables.
- Run `check:templates`, `check:tokens`, `check:kits`, `i18n:check`,
  `typecheck:foundations` and `lint:fixtures` with the ordinary workspace checks.
  `tools:lint` carries these into every registered gate.
- Keep Nx task cache under `.nx/cache` and Angular's additional disk cache
  disabled until a portable worktree-local setting is available. Never put an
  absolute machine path in tracked configuration.

See [the foundation reference](../dev-reference/architecture/foundation.md) for
the contracts, paths and reasons.
