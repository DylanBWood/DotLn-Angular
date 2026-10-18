# WO-004 — Scaffold the DotLn-Angular workspace: an Nx integrated monorepo on Angular 22 with the slim `dotln` shell app, zoneless and standalone, Vitest, Playwright, Sass, ESLint and Prettier, tagged module boundaries, CI with the gitmoji title workflow, and the two documentation roots with the generator log, gated by the repository's own declared gate

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release
(the change ships in DotLn-Angular through its pull request).
**Repository:** dotln-angular @ bc9133e932a00d33c15bc5289d683b8078f51ee4
**Cost:** adds the whole workspace to an empty repository: about 60 files from
the Nx generators plus the CI workflows, the two documentation roots and the
house configuration; `package-lock.json` is the largest. Removes the
generator's `nx-welcome` component and every placeholder the shell does not
need. Wall-clock: about 3 to 5 hours of executor work (one `npm ci`, one
Playwright browser install and the gate's first runs dominate) plus the fixed
cycle; unknown until run. Context bytes: WS-001 (19 KB), the profile (4 KB),
this order and the Nx generator help output. Commands added in the target:
`npm run lint|test|build|e2e|format:check` mirroring the gate. Tokens: unknown
until run. Steps: 14. Re-mints: none; the launchpad's evidence sources are not
edited.
**Nomination provenance:** the 2026-10-18 angular-workstream planning pass
([planning document](../planning/angular-workstream-2026-10-18.md) §5 and §8),
on the operator's direction of 2026-10-17 (ignored intake capture, SHA-256
`4f14c6c09512576abfd701335f4dd8a347694ff23785724422cb8d943b5d67aa`): latest
Angular, Angular best practices, signals everywhere, zoneless, Nx integrated
monorepo, feature libraries, slim app, Vitest, Playwright, Sass, ESLint,
tsconfig and Prettier, libraries added by Nx commands with the commands
recorded, `docs/dev-reference` and `docs/ai-reference`, conventional commits
and gitmoji titles. Versions from the pass's research read of 2026-10-17
(planning document §4). Planner-synthesized. Opaque identifier, not a
priority. Clean-room screen: public packages and the operator's own public
repository.
**Depends on:** WO-003 merged (hard: activation and publication read the
registration, the grant and the vocabulary from this launchpad's `main`).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-003",
    "relation": "hard",
    "reason": "the registration, grant and outward vocabulary this order activates and publishes under live on main"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 1 to 6, 12, 13, 15, 19, 20, 21); `docs/repositories/dotln-angular.md`
(commands, startup, branch policy); `docs/operator/README.md`;
07-execution-guide.md §Where the control plane finds its documents (target
orders), §Workflow closeout and releases (target publish, the session form),
§Preflight before the full gate; the Nx generator help for
`@nx/angular:application`, `@nx/angular:library` and
`@nx/playwright:configuration` at the installed version.

**Objective:** DotLn-Angular's `main` becomes a working Nx integrated
monorepo: the `dotln` shell app renders a one-line home page, every declared
gate command passes in the target worktree without mutating tracked bytes, the
module-boundary tags and dependency constraints of house rule 15 are declared
and exercised, CI runs the same checks on pull requests and the title workflow
prepends the gitmoji, and `docs/dev-reference` and `docs/ai-reference` exist
with the generator log listing every command that created a project.

**Observed gap (dated 2026-10-18, target `main` at `bc9133e9`):** the
repository has one commit and no files; the launchpad has never run a target
order; the gate commands WO-003 declares have never run. Versions observed on
2026-10-17 (planning document §4): Angular 22.2.3 (Node `^22.22.3 || ^24.15.0 || >=26`,
TypeScript `>=6.0 <6.1`, so `~6.0.3`; the npm `latest` TypeScript 7.0.2 is
refused), Nx 23.3.0 (its generators install Angular `~22.1.0`; Vitest is
capped at 4.x in an Angular workspace; the unit-test runner values are
`vitest-angular`, `vitest-analog`, `jest`, `none`, with `vitest-angular`
default for applications and `vitest-analog` default for non-buildable
libraries), Playwright 1.64.1, angular-eslint 22.6.0, typescript-eslint
8.71.2, ESLint 10.13.0, Prettier 3.9.10, Sass through `sass-embedded`. Nx 23
shares its cache and database across every checkout of one workspace under
the user's home unless `cacheDirectory` is set.

**Design:** create the workspace with Nx's generators and nothing by hand
that a generator provides, then apply the house configuration:

- `npx create-nx-workspace@23.3.0 dotln-angular --preset=angular-monorepo --appName=dotln --style=scss --e2eTestRunner=playwright --unitTestRunner=vitest-angular --bundler=esbuild --ssr=false --packageManager=npm --nxCloud=skip --ci=skip --formatter=prettier`
  in a scratch directory; copy everything except `.git` into the target
  worktree (the repository already exists); record the exact command and
  the printed versions in the generator log. If the generator refuses an
  option, take the nearest documented value and record it.
- Zoneless: the application generator defaults to zoneless on Angular 21+;
  confirm `zone.js` is absent from `package.json` and
  `provideZonelessChangeDetection()` is in `app.config.ts`.
- Pin TypeScript `~6.0.3`; keep Vitest on 4.x; bump the Angular package set
  to the latest 22.x the installed Nx admits (record the versions from
  `npx nx report`).
- File names follow Angular's 2025 style guide (no `.component` suffix): house
  rule 1 defers to Angular's default.
- `nx.json`: `cacheDirectory: ".nx/cache"` (workspace-relative, ignored, so
  worktrees do not share one cache), `useDaemonProcess: true` for local work,
  generator defaults (`style: scss`, `unitTestRunner: vitest-analog` for
  libraries as Nx defaults, `linter: eslint`, `prefix` per library).
- Tags and constraints: `scope:shared`, `scope:dotln`, the `type:*` set and the
  `depConstraints` of house rule 15 in the root ESLint config through
  `@nx/enforce-module-boundaries`; the shell app is tagged
  `scope:dotln,type:app`.
- Lint: angular-eslint flat configs, `@typescript-eslint/no-unused-vars` at
  `warn` with `argsIgnorePattern: "^_"` and `varsIgnorePattern: "^_"`,
  `no-restricted-syntax` refusing TypeScript `private` members (message: use
  `#private`), `@angular-eslint/prefer-signals`, `prefer-output-readonly`,
  `component-selector` prefix per project. `.editorconfig`, `.prettierrc`
  (`singleQuote: true`, `printWidth: 100`), `.node-version` (`26`),
  `engines.node`.
- Slim shell: `apps/dotln/src/main.ts`, `app/app.config.ts`
  (`provideZonelessChangeDetection()`, `provideRouter(appRoutes, withComponentInputBinding())`,
  `provideHttpClient(withFetch())`), `app/app.ts` (`<router-outlet />`),
  `app/app.routes.ts` (one eager placeholder page `home` rendering a
  heading; WO-006 replaces it with the lazy feature). Delete `nx-welcome`.
- Scripts in `package.json` mirroring the gate: `lint`, `test`, `build`,
  `e2e`, `format:check`, each the gate's argv without `env NX_DAEMON=false`.
- CI (`.github/workflows/ci.yml`): on `pull_request` and `push` to `main`,
  Node from `.node-version`, `npm ci`, `npx playwright install --with-deps chromium`,
  `npx nx format:check`, `npx nx affected -t lint test build e2e` with
  `nrwl/nx-set-shas`; actions pinned by commit SHA (house rule 17).
  `.github/workflows/pr-title.yml`: on `pull_request` `opened` and `edited`,
  validate the conventional shape and, when the title has no leading gitmoji,
  prepend the one for its type (`feat` `:sparkles:`, `fix` `:bug:`, `docs`
  `:memo:`, `refactor` `:recycle:`, `test` `:white_check_mark:`, `chore`
  `:wrench:`, `ci` `:construction_worker:`, `build` `:package:`, `perf`
  `:zap:`, `style` `:lipstick:`, `revert` `:rewind:`) with `gh pr edit` under
  the workflow token; the mapping lives in one JSON file the workflow reads.
- Documentation: `docs/dev-reference/README.md` (purpose, quick start, where
  things live), `docs/dev-reference/workspace/generator-log.md` (append-only;
  one line per command: date, Nx version, command, what it created),
  `docs/dev-reference/workspace/conventions.md` (house rules 1 to 6, 12, 13,
  15, 19 to 21 restated for this repository), `docs/ai-reference/README.md`
  (the commands to run, the rules, the paths, in short imperative lines), a
  root `README.md` for people. `docs/dotln/` is created by the launchpad's
  records step at final review, not by this order.
- Ignore: `.nx/`, `dist/`, `coverage/`, `test-output/`, `playwright-report/`,
  `test-results/`, `.env`, `.env.*` except `.env.example`, `.DS_Store`.
- Interim review route (house rule 20, planning document §6): after
  `npm run resume -- verification-result pass` is recorded, push `wo-004` to
  origin and open a draft pull request titled `feat: scaffold the Nx and Angular workspace`
  with a body linking this order; request Copilot review if the repository
  offers it; record the pull-request number in `docs/evidence/WO-004/README.md`.
  Final review reads its threads
  (`gh api repos/DylanBWood/DotLn-Angular/pulls/<N>/comments` and
  `.../reviews`) into `docs/evidence/WO-004/preview-pr.json` and routes each
  item as a finding, a boarded follow-up or a discard with its reason. The
  published pull request (`worktree publish WO-004 --target-worktree --branch feat/scaffold-workspace --title "feat: scaffold the Nx and Angular workspace" --body-file <reviewed body>`)
  supersedes the draft; the operator closes the draft.

Rejected: `ng new` without Nx (axis: the operator's direction is Nx);
`vitest-analog` for the application (axis: Nx's default for applications on
Angular 21+ is `vitest-angular`; the Analog route stays the recorded fallback
of house rule 5 and the Nx default for non-buildable libraries); Jest (axis:
Nx and Angular both default to Vitest now); a shared Nx cache across
worktrees (axis: `nx reset` in one worktree would clear the others' cache).

Live-run surfaces at the base (07-execution-guide.md §Operator-opened
planning pass, two screens): GitHub Actions on `DylanBWood/DotLn-Angular`
(exists, never run); the draft and published pull requests (none exist); the
`gh` CLI logged in as the operator (observed 2026-10-18); the target gate
rows (none exist). If Actions are disabled for the repository, criterion 6
records `blocked` with the settings page the operator must change, and the
order still passes on the other criteria only if the operator waives
criterion 6 by the off-ramp route.

**Deliverables:** the workspace on `wo-004`; the generator log; the
documentation roots; the CI workflows; the gate rows; the profile's refreshed
`Checked` line and commands table in this launchpad; `docs/evidence/WO-004/`.

**Execution plan:**

1. Activate: `npm run worktree -- start WO-004 docs/work-orders/WO-004-scaffold-dotln-angular-workspace.md`
   from this launchpad's `main`; work in the target worktree it prints and
   the launchpad order worktree beside it. Check: `npm run resume -- status --json`
   shows `repositoryId` `dotln-angular` and the base `bc9133e9…`.
2. Generator log first: `docs/dev-reference/workspace/generator-log.md` (new)
   receives the `create-nx-workspace` command before it runs, then its
   printed versions. Check: the file exists with one entry.
3. Scaffold: run the Design's `create-nx-workspace` command in
   `$(mktemp -d)`, copy the result into the target worktree without `.git`,
   run `npm ci`. Check: `npx nx report` exits 0; record its output.
4. Versions: pin TypeScript `~6.0.3`; bump the Angular package set to the
   latest 22.x the Nx peer ranges admit; keep Vitest 4.x. Check:
   `npx nx report` shows `@angular/core` 22.x, `nx` 23.x, `typescript` 6.0.x,
   `vitest` 4.x; record it.
5. Shell: `apps/dotln/src/app/app.config.ts`, `app.ts`, `app.routes.ts`,
   `home.ts` as the Design states; delete `nx-welcome`. Check:
   `npx nx build dotln` exits 0 and `grep -c provideZonelessChangeDetection apps/dotln/src/app/app.config.ts`
   prints 1.
6. `nx.json` and `tsconfig.base.json`: `cacheDirectory`, generator defaults,
   the `@dotln-angular/*` path alias root (`paths` stays empty until WO-005
   adds libraries). Check: `npx nx show projects` lists `dotln` and
   `dotln-e2e`.
7. Lint and format: root `eslint.config.mjs` with the flat configs, the
   boundary constraints of house rule 15 and the rules of the Design;
   `.prettierrc`, `.editorconfig`, `.node-version`, `engines`. Add one
   fixture violation under `tools/lint-fixtures/boundary-violation.spec.ts`
   excluded from the gate but run by a dedicated check script
   (`npm run lint:fixtures`) that expects the boundary rule to fail on it.
   Check: `npx nx run-many -t lint` exits 0 and `npm run lint:fixtures` exits
   0 (the fixture fails as expected).
8. Tests: `apps/dotln` keeps the generator's Vitest setup; one spec for the
   home page; `apps/dotln-e2e` keeps Playwright with one smoke test asserting
   the heading. Check: `npx nx run-many -t test` and
   `npx playwright install --with-deps chromium && npx nx e2e dotln-e2e` exit
   0.
9. CI: `.github/workflows/ci.yml` and `.github/workflows/pr-title.yml` with
   `.github/gitmoji-map.json` as the Design states; actions pinned by SHA.
   Check: `npx prettier --check .github` exits 0 (syntax) and the workflow
   result is read on the draft pull request in step 13.
10. Documentation: `README.md`, `docs/dev-reference/README.md`,
    `docs/dev-reference/workspace/conventions.md`, `docs/ai-reference/README.md`,
    the completed generator log. Check: every project in
    `npx nx show projects` has a generator-log line that created it.
11. Gate: `node scripts/target-gate.mjs WO-004` then
    `node scripts/target-gate.mjs WO-004 --review` from the launchpad order
    worktree. Check: both record passing rows and no command mutated tracked
    bytes; fix and rerun on failure.
12. Launchpad write-backs: `docs/repositories/dotln-angular.md` `Checked` line
    and commands table confirmed against the scaffolded commit; `<installed tag>`
    placeholders replaced. Check: `npm run test:docs` exits 0.
13. Commit on `wo-004` with conventional messages; `npm run resume -- implementation-ready`
    with attestation flags; after the verification pass, the interim draft
    pull request of the Design. Check: the pull-request number and the title
    workflow's run status are recorded in `docs/evidence/WO-004/README.md`.
14. Handoff per §Discipline; at final review, `npm run resume -- target-records`
    and the publication commands of the Design.

**Preflight:** in the target worktree, `npx nx format:check`,
`npx nx run-many -t lint test build`, `npx nx e2e dotln-e2e`; in the launchpad
order worktree, `npm run test:docs`. Then `node scripts/target-gate.mjs WO-004`
and `--review` once each.

**Acceptance criteria (all required)**

1. In the target worktree at the reviewed commit, `npx nx report` (recorded in
   `docs/evidence/WO-004/README.md`) shows `nx` 23.x, `@angular/core` 22.x,
   `typescript` 6.0.x and `vitest` 4.x; `package.json` has no `zone.js`
   dependency (`grep -c '"zone.js"' package.json` prints 0) and
   `grep -c provideZonelessChangeDetection apps/dotln/src/app/app.config.ts`
   prints 1.
2. `npx nx run-many -t lint test build`, `npx nx format:check` and
   `npx nx e2e dotln-e2e` each exit 0 in the target worktree, and the e2e smoke
   test asserts the home heading.
3. The root ESLint configuration declares `@nx/enforce-module-boundaries`
   with `depConstraints` for every `type:*` tag of house rule 15 and the
   `scope:shared` and `scope:dotln` tags (one `sourceTag` row each), and
   `npm run lint:fixtures` exits 0 by observing the boundary rule fail on
   `tools/lint-fixtures/boundary-violation.spec.ts`.
4. `docs/dev-reference/workspace/generator-log.md` has one line for the
   `create-nx-workspace` command and one for every generator run, each with
   the Nx version and the created project, and every name in
   `npx nx show projects` appears in it; `docs/dev-reference/README.md`,
   `docs/dev-reference/workspace/conventions.md` and `docs/ai-reference/README.md`
   exist and the conventions file restates house rules 1 to 6, 12, 13, 15
   and 19 to 21 by number.
5. `.github/workflows/ci.yml` runs format check, lint, test, build and e2e on
   pull requests and `.github/workflows/pr-title.yml` with
   `.github/gitmoji-map.json` prepends the gitmoji for the conventional type;
   every `uses:` is pinned to a commit SHA (`grep -E 'uses: .*@[0-9a-f]{40}' -c`
   equals the count of `uses:` lines).
6. The draft pull request opened after the verification pass shows the title
   workflow's run as completed and the title beginning with `:sparkles:`, or
   the evidence README records `blocked` with the GitHub setting that
   prevented the run; its threads are recorded in
   `docs/evidence/WO-004/preview-pr.json` before final review.
7. `node scripts/target-gate.mjs WO-004 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded `npx nx report`, the
generator log and `docs/evidence/WO-004/README.md`; `npm run resume -- status --json`
after `implementation-ready` shows the attestation recorded.

**Known issues and carry-ins:** the Nx generators install Angular `~22.1.0`
while 22.2.3 is current; step 4 bumps within the Nx peer range and records
what it reached. Nx 23 shares the cache across checkouts by default; the
`cacheDirectory` setting opts out and is the one deviation from the generated
`nx.json`. The gitmoji title workflow edits a pull request's title with the
workflow token; if the repository's Actions permissions forbid writes, the
workflow records the failure and criterion 6 is met by `blocked` with the
setting named. Angular's unit-test builder is new since 21; the Analog route
of house rule 5 is the recorded fallback and `vitest-analog` is Nx's own
default for the non-buildable libraries later orders add.

**Non-goals:** any library under `libs/` (WO-005); PrimeNG or any UI vendor
(WO-006; the vendor decision is the operator's, planning document §6); NgRx,
MSW, Transloco (WO-005 and WO-007); authentication (WO-008); Nx Cloud;
deployment; a second app.

**Operator-review assumptions:** the operator reads the draft pull request
before final review and comments or marks criterion failures there; the
operator merges the published pull request; GitHub Actions are enabled for
the repository (observed as the default for a public repository, never run).
