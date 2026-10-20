# WO-005 — Foundation libraries for DotLn-Angular: `core` (the typed environment with its production file replacement and `.env` primer, injection tokens, paths and canonical routes, the base-path token, provider composition), `utils` (the `R` and `RA` namespaces with composition typing and ported specs), `i18n` (Transloco with the house `t` pipe), the test-kit convention through secondary entry points, and the proxy configuration

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 651d76ff68e9b3a38fe770226deb634bca28b54c
**Cost:** adds three libraries under `libs/shared/` with their `testing`
entry points, the environment files and primer, the proxy configuration, the
lint rules for tokens and `#private`, three check scripts under
`tools/scripts/`, `THIRD-PARTY-NOTICES.md`, about 45 source files; adds
`ramda`, `ramda-adjunct`, `@types/ramda`, `@jsverse/transloco` and `dotenv`
to the workspace. Removes the placeholder page's inline strings (moved to
`en.json`). Wall-clock: about 4 to 6 hours of executor work plus the fixed
cycle; unknown until run. Context bytes: WS-001, the generator log, this
order, the Transloco and Ramda type declarations, about 80 KB. Commands added
in the target: `npm run env:prime`, `npm run i18n:check`,
`npm run check:templates`, `npm run check:tokens`, `npm run check:kits`.
Tokens: unknown until run. Steps: 15. Re-mints: none.
**Nomination provenance:** the 2026-10-18 angular-workstream planning pass
([planning document](../planning/angular-workstream-2026-10-18.md) §5 and §8),
on the operator's direction of 2026-10-17 (ignored intake capture, SHA-256
`4f14c6c09512576abfd701335f4dd8a347694ff23785724422cb8d943b5d67aa`):
functional, declarative, reactive first with Ramda and Ramda Adjunct behind
`import { R, RA } from '@dotln-angular/utils'`; Transloco for all user-facing
text; environment file with a typed `EnvironmentConfig`, `.env` priming and
`environment.prod.ts` with file replacements; providers for everything and
injection tokens with the `dotln-angular.<scope>.<lib>.<name>` description;
`BasePaths` and `<Feature>Paths` enums with lazy loading; `AppBasePathToken`
from `<base href>`; test kits for nearly every injectable; proxy configuration;
`#private`, `readonly`, `no-unused-vars` warn with the underscore opt-out.
Versions from the pass's research read (planning document §4). Amended by
the 2026-10-18 main-rules planning pass
([planning document](../planning/main-rules-and-platform-items-2026-10-18.md)
§6 D5 to D8 and §8.1): the base set to WO-004's merge commit, the cache step,
the `--draft` route, the final-review obligation and the repairs of receipt
001's known issues. Amended by the 2026-10-19 latest-upstream planning pass
([planning document](../planning/latest-upstream-2026-10-19.md) §6 D2, D4,
D6 and D7): the typed edge on WO-011, the route guard at starter v0.85.0,
the first draft publish recorded as the live observation of the kit's
admission, no `Target release classification` header, and the Preflight
line confirmed under the landed grammar. Planner-synthesized. Opaque
identifier, not a priority. Clean-room screen: public packages, their public
test suites (MIT and BSD-3-Clause) and the operator's own patterns.
**Depends on:** WO-004 merged (hard, met: the workspace, its tags and its
gate exist at `651d76ff68e9b3a38fe770226deb634bca28b54c`, DotLn-Angular's
`main` on 2026-10-18); WO-011 merged (hard: the class's `disposable`
declaration this order's release close needs, since starter v0.85.0's close
refuses an undeclared ignored base file, and the core-named-tag guard); and a
launchpad whose starter carries core WO-221's `--draft` form of
`worktree publish` (met by the update pull request #8 of 2026-10-19 once it
merges; step 1's route guard).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-004",
    "relation": "hard",
    "reason": "the scaffolded workspace this order adds libraries to; the base line names its merge commit"
  },
  {
    "workOrderId": "WO-011",
    "relation": "hard",
    "reason": "the class's disposable declaration this order's release close needs under starter v0.85.0, and the core-named-tag guard"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 3, 4, 5, 7, 9, 10, 11, 12, 13); `docs/repositories/dotln-angular.md`;
`docs/operator/README.md`; the target's `docs/ai-reference/README.md` and
`docs/dev-reference/workspace/conventions.md` as WO-004 left them; the Nx
generator help for `@nx/angular:library` and
`@nx/angular:library-secondary-entry-point`; the Transloco provider and loader
API of the installed version; the Ramda and Ramda Adjunct type declarations.

**Objective:** `apps/dotln` boots from `provideDotlnCore()`, reads a typed
`EnvironmentConfig` through `EnvironmentConfigToken` with a production
replacement and a `.env` primer, builds every URL from `BasePaths` through the
canonical route builders and `AppBasePathToken`, renders its one page's text
through Transloco's `t` pipe, and imports `R` and `RA` from
`@dotln-angular/utils` with types that compose; every injectable introduced
has a test kit in its library's `testing` entry point and a spec that uses it.

**Observed gap (dated 2026-10-18, target `main` at `651d76ff`):** the
workspace holds `apps/dotln` and `apps/dotln-e2e`, the tooling, CI and the
two documentation roots WO-004 scaffolded (Node 26.9.0, npm 11.19.1, Nx
23.3.0, Angular 22.2.3, TypeScript 6.0.3, Vitest 4.1.12 observed at its
reviewed commit), and no `libs/` directory, no environment type, no i18n and
no utilities; `tsconfig.base.json` declares empty `paths`. Transloco 8.4.0's pipe is named `transloco`, so the
operator's `'key' | t` form needs a house pipe; Transloco has no typed keys
(the typed-keys lint is a later member). Ramda 0.32.0 ships no types
(`@types/ramda` 0.32.0 re-exports `types-ramda`); Ramda Adjunct 6.1.0 ships
its own types and is BSD-3-Clause.

**Design:**

- `libs/shared/core` (`@dotln-angular/core`, tags `scope:shared,type:core`),
  generated with `nx g @nx/angular:library core --directory=libs/shared/core --importPath=@dotln-angular/core --tags=scope:shared,type:core --style=scss --unitTestRunner=vitest-analog`
  (Nx's default runner for a non-buildable library; the exact command goes to
  the generator log). Contents: `environment/` with `EnvironmentConfig`
  (`production`, `apiBaseUrl`, `mocks`, `featureFlags: Record<string, boolean>`,
  `i18n: { defaultLang, availableLangs }`, `auth` placeholder typed as
  `unknown` until WO-008), `EnvironmentConfigToken = new InjectionToken<EnvironmentConfig>('dotln-angular.shared.core.environment-config')`
  and `provideEnvironmentConfig()`; `paths/` with `BasePaths` (`Home = 'home'`)
  and the `HomePaths` placeholder, `buildRoute()` returning
  `{ commands, queryParams }` from enums and typed parameters;
  `AppBasePathToken` (`dotln-angular.shared.core.app-base-path`) with
  `provideAppBasePath()` reading `document.querySelector('base')?.getAttribute('href') ?? '/'`;
  `providers/provide-dotln-core.ts` composing them. Every token is
  `PascalCaseToken` with the description string of house rule 10;
  `providedIn: 'root'` is used only for `AppBasePathToken`'s factory and the
  decision records the operator's pending ruling.
- Environments in the app: `apps/dotln/src/environments/environment.ts`
  (development defaults, `mocks: true`), `environment.prod.ts`
  (`production: true`, `mocks: false`), `environment.local.ts` (ignored,
  generated), with `fileReplacements` in the `production` configuration and
  a `local` configuration replacing with the generated file. `tools/scripts/prime-environment.mjs`
  reads `.env` through `dotenv` and writes `environment.local.ts` from
  `EnvironmentConfig` keys prefixed `DOTLN_`; `.env.example` lists them;
  `npm run env:prime` runs it. Secrets never enter the committed files.
- `libs/shared/utils` (`@dotln-angular/utils`, `type:util`): `ramda.ts`
  exporting `R` as a namespace re-export of `ramda` and `ramda-adjunct.ts`
  exporting `RA`, through `public_api.ts` as `export * as R from './ramda'`
  only where the namespace form preserves generics; where a function's
  curried generic loses inference through the namespace, a typed wrapper in
  `utils` restores it and the decision names the function. For every Ramda or
  Ramda Adjunct function the workspace uses, one spec ported from the
  library's public test suite (attribution comment with the upstream path and
  license) runs against the house export, so the re-export cannot silently
  break a function.
- `libs/shared/i18n` (`@dotln-angular/i18n`, `type:i18n`): `provideDotlnI18n()`
  wrapping `provideTransloco` with a `TranslocoHttpLoader` reading
  `/i18n/<lang>.json` relative to `AppBasePathToken`, `defaultLang` and
  `availableLangs` from `EnvironmentConfig`, `reRenderOnLangChange`, a
  missing-key handler that throws in development; the house `TPipe`
  (`name: 't'`, extending `TranslocoPipe`) so templates read `'home.title' | t`;
  `translateSignal` re-exported for class code. `apps/dotln/public/i18n/en.json`
  holds the shell's strings; `npm run i18n:check` runs
  `transloco-keys-manager find` against the templates with
  `--emit-error-on-extra-keys`.
- Test kits: each library gets a `testing` secondary entry point
  (`nx g @nx/angular:library-secondary-entry-point --library=<project> --name=testing`),
  importing as `@dotln-angular/<lib>/testing`, exporting
  `provide<Name>TestKit(overrides?)` functions that return the providers a
  spec needs plus handles (`{ providers, config }`), and
  `provideDotlnI18nTestKit()` on `TranslocoTestingModule`. The spike in step
  7 confirms the entry point compiles and lints under Nx's wiring; the
  fallback is a sibling `<lib>-testing` library, recorded.
- Lint: `@typescript-eslint/no-unused-vars` already at `warn` with the
  underscore patterns (WO-004); `no-restricted-syntax` for TypeScript
  `private`; `@typescript-eslint/prefer-readonly` (type-aware) on class
  members; `@angular-eslint/prefer-signals`; a custom
  `no-restricted-syntax` rule refusing `new InjectionToken(` whose first
  argument does not start with `dotln-angular.` (selector on the literal).
  The lint rule is the one guard for token names; `check:tokens` is its
  cross-check for constructions the selector cannot read across lines, and
  a disagreement between them is a finding, never two rules (receipt 002's
  finding, applied by the 2026-10-19 pass).
- Proxy: `apps/dotln/proxy.conf.json` mapping `/api` to the
  `DOTLN_API_PROXY_TARGET` from the primed environment, wired to `serve`
  through the `proxyConfig` option of the app's `serve` target.
- Page: the WO-004 placeholder page reads its heading through `'home.title' | t`.
- Build cache per worktree (planning document §6 D8): `@angular/build`
  resolves a relative cache path to the main checkout when the workspace is
  a Git worktree (`src/utils/normalize-cache.js`, read by core's
  release-close session on 2026-10-18). Step 5 reads that file in the
  worktree's `node_modules`, determines which setting keeps the cache under
  the worktree (an absolute `cli.cache.path` per worktree, an environment
  variable, or none needed), applies it so a gate never touches another
  checkout's cache, and records the finding in the repository profile and
  the generator log; a setting that belongs to the registration's gate argv
  rather than the target is boarded for the upgrade order.
- Three check scripts (receipt 001's known issues, repaired by the
  main-rules pass): `tools/scripts/check-template-literals.mjs` parses every
  inline and file template under `apps/dotln/src` and `libs` with
  `@angular/compiler`'s `parseTemplate` and lists text nodes that are not
  inside an interpolation using the `t` pipe (`npm run check:templates`);
  `tools/scripts/check-token-names.mjs` reads every `new InjectionToken`
  construction across lines and nested generics with the TypeScript compiler
  API and lists descriptions not starting with `dotln-angular.`
  (`npm run check:tokens`); `tools/scripts/check-spec-kits.mjs` reads every
  `*.spec.ts` under `libs/shared` that calls `TestBed.configureTestingModule`
  and lists those whose `providers` array does not spread a
  `provide*TestKit(` call, and also reads every `@Injectable` class and
  `InjectionToken` declaration under `libs/shared` and lists each whose
  library's `testing` entry point exports no `provide<Name>TestKit`
  function, so the objective's property (a kit for every injectable) is what
  is checked (`npm run check:kits`; receipt 002's finding, applied by the
  2026-10-19 pass). Each prints its findings and exits nonzero when any
  exist; CI runs the three, and a root `tools` project (`tools/project.json`)
  carries a `lint` target that runs them, so the registration's declared
  `npx nx run-many -t lint` executes them in every later member's gate
  without a registration change (receipt 002's finding).
- Third-party texts: each ported spec opens with the upstream file's
  copyright line and license name, and `THIRD-PARTY-NOTICES.md` at the
  workspace root holds the MIT text for Ramda and the BSD-3-Clause text for
  Ramda Adjunct.

Rejected: a `shared/testing` library holding every kit (axis: a kit lives
beside the thing it provides, so a library's `testing` entry point is the
platform's own convention); exposing Transloco's `transloco` pipe directly
(axis: the operator's `t` form is the house canonical way and the alias is
one class); typed translation keys here (axis: not day one, by direction).

**Deliverables:** the three libraries with `testing` entry points; the
environment files, primer and proxy; the lint rules; the three check
scripts; `THIRD-PARTY-NOTICES.md`; `en.json`; the generator log lines; the
cache finding in the profile and the log;
`docs/dev-reference/architecture/foundation.md` and
`docs/ai-reference/foundation-rules.md`; `docs/evidence/WO-005/`.

**Execution plan:**

1. Base guard: in the target clone, `git fetch origin && git rev-parse origin/main`
   must equal the base this order's `Repository:` line names; if not, stop
   and report that a planning pass must set the base. Route guard: in the
   launchpad, `grep -c -- '--draft' scripts/worktree.mjs` must print at
   least 1 (starter v0.85.0 carries core WO-221's draft form; update pull
   request #8 of 2026-10-19) and `npm run resume -- status --json` must show
   the typed edge on WO-011 as `met`; if either fails, stop and report that
   the update or WO-011 must land first (2026-10-18 planning document §6 D5
   and D6; 2026-10-19 planning document §6 D2). Then
   `npm run worktree -- start WO-005 docs/work-orders/WO-005-foundation-libraries.md`.
   Check: `npm run resume -- status --json` shows the base.
2. `docs/dev-reference/workspace/generator-log.md`: append each generator
   command before running it. Check: three library lines and three
   secondary-entry-point lines after step 7.
3. `libs/shared/core`: generate; write `environment/`, `paths/`,
   `providers/`, `public_api.ts`, `index.ts`. Check: `npx nx test core` and
   `npx nx lint core` exit 0.
4. `apps/dotln/src/environments/*`, `tools/scripts/prime-environment.mjs`,
   `.env.example`, `project.json` configurations (`production`
   `fileReplacements`, `local`), `package.json` `env:prime`. Check:
   `cp .env.example .env && npm run env:prime && npx nx build dotln --configuration=local`
   exits 0 and `environment.local.ts` is ignored (`git check-ignore -q apps/dotln/src/environments/environment.local.ts`).
5. Build cache per worktree: read
   `node_modules/@angular/build/src/utils/normalize-cache.js` in the
   worktree, record how a relative `cli.cache.path` resolves under a Git
   worktree, apply the setting that keeps the cache under the worktree (or
   record that none is needed), and append the finding to
   `docs/dev-reference/workspace/generator-log.md` and to the launchpad's
   `docs/repositories/dotln-angular.md` §Commands (step 14). Check: after
   `npx nx build dotln`, `find . -path ./node_modules -prune -o -type d -name cache -print`
   lists the cache under this worktree and
   `ls <main checkout>/.angular 2>/dev/null` lists nothing new since the
   step began (record both outputs).
6. `libs/shared/utils`: generate; `ramda.ts`, `ramda-adjunct.ts`,
   `public_api.ts`; the ported specs under `src/lib/upstream-specs/` with
   the upstream copyright line and license name; `THIRD-PARTY-NOTICES.md`.
   Check: `npx nx test utils` exits 0,
   `grep -rl "ported from" libs/shared/utils/src/lib/upstream-specs | wc -l`
   equals the number of functions `public_api.ts` names as used, and
   `grep -c "BSD-3-Clause" THIRD-PARTY-NOTICES.md` and `grep -c "MIT" THIRD-PARTY-NOTICES.md`
   each print at least 1.
7. `libs/shared/i18n`: generate; provider, loader, `TPipe`, missing-key
   handler; `apps/dotln/public/i18n/en.json`; `package.json` `i18n:check`.
   Check: `npx nx test i18n` and `npm run i18n:check` exit 0.
8. Test kits: generate the `testing` entry point for each library; write the
   kits; one spec per library uses its kit. Check: `npx nx run-many -t lint test`
   exits 0; on failure of the entry-point wiring, record the decision and use
   sibling `<lib>-testing` libraries.
9. Lint rules in `eslint.config.mjs` as the Design states, with
   `tools/lint-fixtures/private-keyword.ts` and `tools/lint-fixtures/bad-token.ts`
   expected to fail under `npm run lint:fixtures`. Check: `npm run lint:fixtures`
   exits 0.
10. `apps/dotln`: `app.config.ts` uses `provideDotlnCore({ environment })` and
    `provideDotlnI18n()`; the page uses `| t`; `proxy.conf.json` wired to
    `serve`. Check: `npx nx build dotln` and `npx nx e2e dotln-e2e` exit 0,
    and `node -e "const p=require('./apps/dotln/project.json');console.log(JSON.stringify(p.targets.serve).includes('proxy.conf.json'))"`
    prints `true`.
11. The three check scripts under `tools/scripts/` and their `package.json`
    commands (`check:templates`, `check:tokens`, `check:kits`), each with
    one fixture under `tools/lint-fixtures/` it must flag, run by CI and by
    the `lint` target of a root `tools` project (`tools/project.json`, new).
    Check: each command exits 0 on the workspace and nonzero on its fixture,
    and `npx nx run-many -t lint` runs `tools:lint`.
12. Documentation: `docs/dotln/work-orders/WO-004-scaffold-dotln-angular-workspace.md`
    (existing in the target): its provenance paragraph is paraphrased to the
    wording the launchpad's copy carries after the 2026-10-19 pass, so no
    direct words of the operator remain in the target (operator direction of
    2026-10-19, capture SHA-256
    `01b3d03564fe733b600083183008b4fb46ee3350ae33469cd379121cc262a177`; check:
    `grep -c paraphrased docs/dotln/work-orders/WO-004-scaffold-dotln-angular-workspace.md`
    prints 1); `docs/dev-reference/architecture/foundation.md` (the
    environment, tokens, paths, utils, i18n, kits, with one path each),
    `docs/ai-reference/foundation-rules.md` (imperative rules: token naming,
    `provide*()` only, `| t` for strings, `R`/`RA` imports, kits for
    injectables), `docs/dev-reference/workspace/conventions.md` updated with
    house rules 7, 9, 10, 11. Check: each file exists and
    `npm run i18n:check` still exits 0.
13. Gate: `node scripts/target-gate.mjs WO-005` and `--review`. Check:
    passing rows, no mutation.
14. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains the paths for a provide function, a token, the routes
    enums and a test kit, and §Commands gains the cache finding of step 5.
    Check: `npm run test:docs` exits 0.
15. Commit; `implementation-ready`; handoff per §Discipline. After the
    session that records `verification-result pass` has done so, that
    session runs
    `npm run worktree -- publish WO-005 --target-worktree --draft --branch feat/foundation-libraries --title "feat: add the core, utils and i18n foundation libraries" --body-file <reviewed path>`,
    which commits from the tree without moving `HEAD`, pushes the branch and
    opens the draft pull request. At final review: read the draft's threads
    and workflow runs into `docs/evidence/WO-005/preview-pr.json` and route
    each item (a finding, a boarded follow-up or a discard), `target-records`,
    then the same publish command without `--draft`, which force-pushes with
    lease against the recorded draft head and reuses the branch and the pull
    request. No work-in-progress commit, no force-push by hand, no manual
    close. The draft publish is the first live observation of the kit's
    admission of the target's publication commands under Claude Code auto
    mode (core v0.85.0 has qualified no host): the session that runs it
    records in `docs/evidence/WO-005/decisions.md` the hook's decision from
    the session journal, whether the host prompted, and which of the
    operator's interim trust entries were present (2026-10-19 planning
    document §6 D6).

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`, `npm run i18n:check`,
`npx nx e2e dotln-e2e`; in the launchpad order worktree `npm run test:docs`;
then `node scripts/target-gate.mjs WO-005` and `--review` once each.

**Acceptance criteria (all required)**

1. `npx nx show projects` lists `core`, `utils` and `i18n`, each tagged
   `scope:shared` and its `type:*` from house rule 3 (read from the project
   configuration), and `tsconfig.base.json` maps `@dotln-angular/core`,
   `@dotln-angular/utils`, `@dotln-angular/i18n` and the three
   `@dotln-angular/<lib>/testing` paths (or, under the recorded fallback, the
   three `@dotln-angular/<lib>-testing` paths).
2. `npm run check:tokens` exits 0 on the workspace (every `new InjectionToken`
   description starts with `dotln-angular.`, read across lines and nested
   generics) and nonzero on `tools/lint-fixtures/bad-token.ts`,
   `npm run lint:fixtures` exits 0 by observing the `#private` and token-name
   rules fail on their fixtures, and
   `node -e "const p=require('./tools/project.json');console.log(Object.keys(p.targets).includes('lint'))"`
   prints `true`.
3. `cp .env.example .env && npm run env:prime` writes
   `apps/dotln/src/environments/environment.local.ts`, which Git ignores;
   `npx nx build dotln --configuration=production` and
   `--configuration=local` both exit 0; `grep -c fileReplacements apps/dotln/project.json`
   is at least 1.
4. `grep -rhoE "'[a-z0-9.-]+' \| t\b" apps/dotln/src libs --include='*.html' --include='*.ts' | wc -l`
   is at least 1, `npm run check:templates` exits 0 on the workspace (no text
   node outside a `t` pipe interpolation, templates parsed across lines) and
   nonzero on `tools/lint-fixtures/literal-text.ts`, and `npm run i18n:check`
   exits 0.
5. `npm run check:kits` exits 0 on the workspace (every spec under
   `libs/shared` that calls `TestBed.configureTestingModule` spreads a
   `provide*TestKit(` call into its providers, and every `@Injectable` class
   and `InjectionToken` under `libs/shared` has a `provide<Name>TestKit`
   export in its library's `testing` entry point) and nonzero on
   `tools/lint-fixtures/spec-without-kit.spec.ts` and on
   `tools/lint-fixtures/injectable-without-kit.ts`, and
   `npx nx run-many -t test` exits 0.
6. `libs/shared/utils/src/lib/upstream-specs/` holds one ported spec per
   function `public_api.ts` documents as used, each opening with the
   upstream file's copyright line and license name; `THIRD-PARTY-NOTICES.md`
   exists with both license texts (`grep -c "BSD-3-Clause" THIRD-PARTY-NOTICES.md`
   and `grep -c "MIT" THIRD-PARTY-NOTICES.md` each at least 1); and
   `npx nx test utils` exits 0.
7. `apps/dotln/proxy.conf.json` exists, maps `/api`, and the app's `serve`
   target names it (`node -e "const p=require('./apps/dotln/project.json');console.log(JSON.stringify(p.targets.serve).includes('proxy.conf.json'))"`
   prints `true`).
8. `node scripts/target-gate.mjs WO-005 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs and
`docs/evidence/WO-005/README.md`.

**Known issues and carry-ins:** this order activates only on a launchpad
whose starter carries core WO-221's `--draft` form (step 1's route guard);
the operator chose to wait for it rather than run the hand route (planning
document §6 D6). The draft pull request and its workflow runs are a
final-review obligation read from `docs/evidence/WO-005/preview-pr.json`,
never a criterion (D7). The operator's interim host-trust entries of
2026-10-18 are outside the repository; whether they are present at step 15's
draft publish is the operator's choice (removed, the episode shows whether
the host honors the hook's admission; present, only the hook's own decision
is observed), and the pass after this order decides their removal or the
kit's `hostRules: "literal"` fallback (2026-10-19 planning document §6 D6).
The `providedIn: 'root'`
default awaits the operator's ruling and is recorded as a decision; Nx
secondary entry points for non-buildable libraries are a spike with a
recorded fallback. This order carries no `Target release classification`
header: DotLn-Angular declares no target release until the kit can title one
`DotLn Angular` (2026-10-19 planning document §6 D4), so its close is a
no-release close; that close deletes the declared disposable output
(`node_modules`, `.nx`, `dist`, `.angular`, `coverage`, `test-output`,
`playwright-report`, `test-results`, `tmp`, `out-tsc`, `__screenshots__`) in
the target worktree and in the clone's base checkout, never to scratch
(WO-011). The Preflight line stands under the landed grammar: a target
order's field names no `--only` suite, so the launchpad handoff rests on the
structural and document rows and the target gate is the product gate (D7 of
2026-10-19). A cache setting of step 5 that belongs to the registration's
gate argv is boarded as a follow-up for a later self order, since WO-011
precedes this order. Step 12 carries the operator's direction of 2026-10-19
that no direct quote of theirs is committed in either repository: the
target's copy of WO-004 still holds one, and this order's pull request is
the first in-kit route that reaches the target.

**Non-goals:** UI components or a vendor library (WO-006); NgRx, events, MSW
(WO-007); authentication (WO-008); typed translation keys (later member); a
second language file beyond `en.json`.

**Operator-review assumptions:** the operator accepts `providedIn: 'root'`
limited to the base-path token until they rule; the operator reads the one
draft pull request before final review, which the final publish reuses.
