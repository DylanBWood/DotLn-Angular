# Generator log

Append one entry before each generator invocation, then append its observed result. Every project starts with an Nx generator.

| Date       | Nx version                  | Command                                                                                                                                                                                                                                                                                                                                                                                                | Created projects / result                                                                                                                                                                                                                                                                                            |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-18 | 23.3.0 (requested)          | `npx create-nx-workspace@23.3.0 dotln-angular --preset=angular-monorepo --appName=dotln --style=scss --e2eTestRunner=playwright --unitTestRunner=vitest-angular --bundler=esbuild --ssr=false --packageManager=npm --nxCloud=skip --ci=skip --formatter=prettier`                                                                                                                                      | Scheduled in temporary storage; expected `dotln` and `dotln-e2e`.                                                                                                                                                                                                                                                    |
| 2026-10-18 | 23.3.0                      | First invocation above, with `npx --yes`                                                                                                                                                                                                                                                                                                                                                               | Refused before creation: top-level `unitTestRunner` accepts `jest`, `vitest`, `none`; `vitest-angular` belongs to the Angular generator.                                                                                                                                                                             |
| 2026-10-18 | 23.3.0                      | `npx --yes create-nx-workspace@23.3.0 dotln-angular --preset=angular-monorepo --appName=dotln --style=scss --e2eTestRunner=playwright --unitTestRunner=vitest --bundler=esbuild --ssr=false --packageManager=npm --nxCloud=skip --ci=skip --formatter=prettier --linter=eslint --interactive=false --skipGit --skipGitHubPush --aiAgents=none`                                                         | Scheduled in temporary storage with `CI=true NX_DAEMON=false NX_INTERACTIVE=false`; expected `dotln` and `dotln-e2e`. Git initialization, remote publishing and agent configuration are skipped.                                                                                                                     |
| 2026-10-18 | CLI 23.3.0; template 23.2.0 | Previous invocation result                                                                                                                                                                                                                                                                                                                                                                             | Exited 0 in 51.759 s, but the CLI's agent mode mapped `angular-monorepo` to `nrwl/angular-template`, producing `shop`, `shop-e2e`, an API and libraries with ZoneJS. This output is outside the order and is not copied into the repository.                                                                         |
| 2026-10-18 | 23.3.0                      | `env -u CODEX_THREAD_ID npx --yes create-nx-workspace@23.3.0 dotln-angular --preset=angular-monorepo --appName=dotln --style=scss --e2eTestRunner=playwright --unitTestRunner=vitest --bundler=esbuild --ssr=false --packageManager=npm --nxCloud=skip --ci=skip --formatter=prettier --linter=eslint --interactive=false --skipGit --skipGitHubPush --aiAgents=none --no-workspaces --useProjectJson` | Scheduled in separate temporary storage. The child-only environment adjustment keeps the explicit preset instead of the CLI's automatic template substitution; the parent session and resource wrapper remain unchanged. Integrated configuration uses `project.json` and a root `tsconfig.base.json`.               |
| 2026-10-18 | 23.3.0                      | Previous invocation result                                                                                                                                                                                                                                                                                                                                                                             | Created `dotln` and `dotln-e2e` in 56.764 s, but no unit-test target: the workspace CLI passes `vitest` through and the Angular generator handles only `vitest-angular`, `vitest-analog`, `jest`, `none`. Source inspection confirms that omitting the option selects `vitest-angular` for Angular 21+ with esbuild. |
| 2026-10-18 | 23.3.0                      | `env -u CODEX_THREAD_ID npx --yes create-nx-workspace@23.3.0 dotln-angular --preset=angular-monorepo --appName=dotln --style=scss --e2eTestRunner=playwright --bundler=esbuild --ssr=false --packageManager=npm --nxCloud=skip --ci=skip --formatter=prettier --linter=eslint --interactive=false --skipGit --skipGitHubPush --aiAgents=none --no-workspaces --useProjectJson`                         | Scheduled in fresh temporary storage; omit the mismatched top-level option and retain the Angular generator's standard Vitest default.                                                                                                                                                                               |
| 2026-10-18 | 23.3.0                      | Previous invocation result                                                                                                                                                                                                                                                                                                                                                                             | Exited 0 in 18.719 s. Created `dotln` and `dotln-e2e`, `@angular/build:unit-test` with `watch: false`, `tsconfig.spec.json` with `vitest/globals`, Vitest `^4.0.8`, Angular `~22.1.0` and TypeScript `~6.0.3`. This is the final generated baseline.                                                                 |
| 2026-10-18 | 23.3.0                      | `npx nx generate @nx/angular:component apps/dotln/src/app/home --name=Home --selector=dotln-home --inlineTemplate --inlineStyle --style=scss --changeDetection=OnPush`                                                                                                                                                                                                                                 | Scheduled in the target with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`; adds the home component and spec to existing project `dotln`.                                                                                                                                                                               |
| 2026-10-18 | 23.3.0                      | Previous invocation result                                                                                                                                                                                                                                                                                                                                                                             | Exited 0; created `apps/dotln/src/app/home.ts` and `home.spec.ts`, and updated generator defaults in `nx.json`. Angular 22's OnPush default is made explicit in the house configuration.                                                                                                                             |

## Installed generator help

Read `npx nx generate @nx/angular:application --help`,
`npx nx generate @nx/angular:library --help` and
`npx nx generate @nx/playwright:configuration --help` at 23.3.0 on 2026-10-18.
The application defaults to `vitest-angular` for esbuild on Angular 21+;
non-buildable libraries default to `vitest-analog`. Angular component paths
accept an extensionless `home` and generate `home.ts` without a type suffix.

The application help process exited successfully but the resource wrapper
reported briefly surviving Nx plugin workers; the workers were gone on the next
process check. Subsequent help and generation probes used
`NX_ISOLATE_PLUGINS=false`. These probes created no projects.

Read `npx nx generate @nx/angular:library --help` and
`npx nx generate @nx/angular:library-secondary-entry-point --help` at 23.3.0 on
2026-10-20. The non-buildable library runner is `vitest-analog`; the
secondary-entry-point generator reads a library `package.json` to derive the
entry point's import name.

## Foundation libraries — 2026-10-20

Each command ran in the target worktree with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`.

| Date       | Nx     | Command                                                                                                                                                                                                                 | Result                                                                                 |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library libs/shared/core --name=core --importPath=@dotln-angular/core --tags=scope:shared,type:core --style=scss --unitTestRunner=vitest-analog --skipModule --skipFormat --interactive=false`    | Exit 0; created `core` and installed the Nx-selected AnalogJS runner.                  |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library libs/shared/utils --name=utils --importPath=@dotln-angular/utils --tags=scope:shared,type:util --style=scss --unitTestRunner=vitest-analog --skipModule --skipFormat --interactive=false` | Exit 0; created `utils`.                                                               |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library libs/shared/i18n --name=i18n --importPath=@dotln-angular/i18n --tags=scope:shared,type:i18n --style=scss --unitTestRunner=vitest-analog --skipModule --skipFormat --interactive=false`    | Exit 0; created `i18n`.                                                                |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library-secondary-entry-point --library=core --name=testing --skipModule --skipFormat --interactive=false`                                                                                        | Exit 0; created the `testing` entry point of `core` (`@dotln-angular/core/testing`).   |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library-secondary-entry-point --library=utils --name=testing --skipModule --skipFormat --interactive=false`                                                                                       | Exit 0; created the `testing` entry point of `utils` (`@dotln-angular/utils/testing`). |
| 2026-10-20 | 23.3.0 | `npx nx g @nx/angular:library-secondary-entry-point --library=i18n --name=testing --skipModule --skipFormat --interactive=false`                                                                                        | Exit 0; created the `testing` entry point of `i18n` (`@dotln-angular/i18n/testing`).   |

## Foundation wiring and cache evidence — 2026-10-20

The secondary-entry generator reads each library's package name, so each
non-buildable library now has a private `package.json` with its import name.
The three generated `testing` entry points compile and lint through public
aliases; no sibling-library fallback was needed.

The generated AnalogJS 2.6 dependency chain introduced audit findings.
Both `@analogjs/vite-plugin-angular` and `@analogjs/vitest-angular` were pinned
to the compatible 2.9.1 repair. The generated Vitest workspace form was replaced
with the installed Vitest 4 `projects` configuration.

Read `node_modules/@angular/build/src/utils/normalize-cache.js` at Angular
22.2.3. Its relative cache path follows a worktree's common Git directory to
the main checkout. A bounded normalizer comparison returned:

| Configuration              | Angular cache enabled | Cache base inside worktree | Local path inside worktree |
| -------------------------- | --------------------- | -------------------------- | -------------------------- |
| Relative default           | true                  | false                      | true                       |
| Absolute worktree path     | true                  | true                       | true                       |
| `cli.cache.enabled: false` | false                 | false, unused              | true                       |

The selected tracked configuration disables the additional Angular disk cache
and retains Nx task caching at `.nx/cache`. It avoids a machine-specific
absolute path at the cost of Angular's additional incremental disk cache and
of the dev server's Vite dependency prebundling: `@angular/build`'s dev-server
options enable prebundling only while that cache is enabled, so every
`nx serve` and the e2e dev server print that prebundling will not be used
because caching is disabled. Weigh the absolute-path alternative at that whole
cost. No registration argv change is needed.

The main checkout's `.angular` directory was absent before uncached local
and production builds and absent afterward. Both builds exited 0.
`find . -path ./node_modules -prune -o -type d -name cache -print`
returned only `./.nx/cache`. The local build followed `cp .env.example .env`
and `npm run env:prime`; Git ignored both local environment files, and the
session removed the two files it generated after the build checks.

## Component libraries — 2026-10-21

Nx 23.3.0; generator help read from the installed package. All commands run with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`; the daemon was stopped first. `--skipPackageJson` preserves the already validated Angular and AnalogJS versions.

Planned invocation: `npx nx g @nx/angular:library libs/shared/ui --name=ui --importPath=@dotln-angular/ui --tags=scope:shared,type:ui --prefix=dotln --style=scss --unitTestRunner=vitest-analog --skipModule --skipPackageJson --skipFormat --interactive=false`.

Result: ui generated successfully (exit 0).

Planned invocation: `npx nx g @nx/angular:library libs/shared/models --name=models --importPath=@dotln-angular/models --tags=scope:shared,type:models --prefix=dotln --style=scss --unitTestRunner=vitest-analog --skipModule --skipPackageJson --skipFormat --interactive=false`.

Result: models generator exited 0.

Planned invocation: `npx nx g @nx/angular:library libs/dotln/shell --name=dotln-shell --importPath=@dotln-angular/dotln/shell --tags=scope:dotln,type:ui --prefix=dotln --style=scss --unitTestRunner=vitest-analog --skipModule --skipPackageJson --skipFormat --interactive=false`.

Result: dotln-shell generator exited 0.

## Recorded actor board — 2026-10-21

Captured with `node packages/console/dist/src/cli.js board --json` from the launchpad order worktree. The raw output stayed in process memory; `scrubBoard` replaced its root with `<launchpad>` before writing either fixture. `unavailableBoard` derived the unavailable fixture. The source is a recorded snapshot, not live state.

Schema: platform commit `a54f8d6520ed54d05e5209455c67541562716404`, `packages/console/uifa-board-v1.schema.json`; SHA-256 `7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3`. The schema bytes are kept exact and excluded only from formatting.

Planned invocation: `npx nx g @nx/angular:library libs/features/board --name=board --importPath=@dotln-angular/board --tags=scope:dotln,type:feature --prefix=board --style=scss --unitTestRunner=vitest-analog --skipModule --skipPackageJson --skipFormat --interactive=false`.

Result: board generator exited 0. The generated placeholder was replaced by the approved board roles.

Planned invocation: `npx nx g @nx/angular:library-secondary-entry-point --library=ui --name=testing --skipModule --skipFormat --interactive=false`.

Result: ui/testing generator exited 0.

Planned invocation: `npx nx g @nx/angular:library-secondary-entry-point --library=board --name=testing --skipModule --skipFormat --interactive=false`.

Result: board/testing generator exited 0.
