# WO-006 — The component taxonomy made real in DotLn-Angular: `ui` as the house component library with Angular Aria and the CDK behind wrappers, the lint rules that enforce the roles by location, the `dotln` shell layout, and the `board` feature rendering the actor board (`uifa-board-v1`) from a recorded fixture through its composites, layout, mappers, container and facade behind a lazy route, with accessibility checks in e2e

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 5102783f5cf575a6b487e75ed9bb0c064d6dbd9c
**Target release classification:** minor
**Cost:** adds `libs/shared/ui`, `libs/shared/models`, `libs/dotln/shell`,
`libs/features/board`, the role-by-location lint overrides and the four
lint follow-ups WO-005 recorded, `@angular/aria`, `@angular/cdk`,
`@axe-core/playwright`, two board fixtures (the launchpad's board of
2026-10-21 at about 360 KB, scrubbed, and a derived all-unavailable one), the
pinned `uifa-board-v1` schema, about 75 source files and the taxonomy
documents. Removes the WO-004 placeholder page and `BasePaths.Home`.
Wall-clock: about 8 to 10 hours of executor work plus the fixed cycle;
unknown until run. Context bytes: WS-001 §Design and §The console, the
foundation documents, the Angular Aria guide for the Tabs and Menu patterns
and the CDK overlay and a11y entry points at the installed versions, the
`uifa-board-v1` schema, this order, about 160 KB. Commands added in the
target: `npm run lint:components`, `npm run check:fixtures`. Tokens: unknown
until run. Steps: 16. Re-mints: none.
**Nomination provenance:** the 2026-10-18 angular-workstream planning pass
([planning document](../planning/angular-workstream-2026-10-18.md) §5, §6 and
§8), on the operator's direction of 2026-10-17 (ignored intake capture,
SHA-256 `4f14c6c09512576abfd701335f4dd8a347694ff23785724422cb8d943b5d67aa`) and
their Film Study notes (ignored intake `2026-10-17-film-study.pdf`, SHA-256
`43adc54da4ed1735e1fb2309f887b9ed04801992c2af7a19c6e7f6a758ef1d08`):
containers with composed presentational components, view models from facades,
the Salesman, Connector and Maven analogy synthesized by the pass into the
Tipping Point taxonomy (WS-001 §Design), PrimeNG if free, loading buttons,
component member order, selector prefixes to be settled after seeing
implementations, WCAG to a reasonable extent, web speed and Angular best
practices over analogy. Planner-synthesized. Opaque identifier, not a
priority. Clean-room screen: the operator's own notes and public packages.
Amended by the 2026-10-18 main-rules planning pass
([planning document](../planning/main-rules-and-platform-items-2026-10-18.md)
§6 D5, D7 and §8.1): the `--draft` route, the final-review obligation and
the repairs of receipt 001's known issues. Amended by the 2026-10-21 UI
planning pass ([planning document](../planning/ui-planning-2026-10-21.md)
§6 D1 to D4): the base, the release header, the typed edge on WO-012, the
node-spelled draft publish, the house component library over Angular Aria
and the CDK in place of a vendor (the operator's direction of 2026-10-20,
WO-005-D006), and the actor board as the feature this order demonstrates
(the platform's adopted decision of 2026-09-06 that the first Angular change
is an actor view, not a phase table, and the operator's direction of
2026-10-21 that the console sits over `uifa-board-v1`; ignored intake
capture `docs/intake/notes/planning-ui-2026-10-21.md`, SHA-256 recorded in
that planning document §1).
**Depends on:** WO-005 merged (hard: `core`, `i18n`, `utils` and the test-kit
convention; the base above is WO-005's merge commit `5102783f`, DotLn-Angular
pull request #3 of 2026-10-20) and WO-012 closed (hard: the declared target
release policy, the `DotLn Angular` display name and the operator grant
naming `release.close`, which the close of this order reads from the
launchpad's `main`; WO-012 closed on 2026-10-21 as Launchpad v0.3.3).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-005",
    "relation": "hard",
    "reason": "the foundation libraries every component here imports; the base line is its merge commit 5102783f, set by the 2026-10-21 UI planning pass"
  },
  {
    "workOrderId": "WO-012",
    "relation": "hard",
    "reason": "the declared target release policy, display name and release.close grant this order's close reads from the launchpad's main; closed 2026-10-21"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(§Design: the Tipping Point taxonomy, R1 to R7; §The console: the first
screen and the road after it, H1 to H5 and G1 to G6; house rules 1, 6, 12,
13, 14, 15, 18); `docs/repositories/dotln-angular.md` (§Release close, the
header precheck and the node-spelled publish; §Upstream references);
`docs/operator/README.md`; the target's `docs/ai-reference/*` and
`docs/dev-reference/*` as WO-005 left them; WO-005's decisions D008, D020,
D021 and D022 in the target's `docs/dotln/evidence/WO-005/decisions.md`; the
Angular Aria guide (`angular.dev/guide/aria`) for the Tabs and Menu patterns
and the CDK's `overlay` and `a11y` documentation at the installed versions;
the `uifa-board-v1` schema and the console package README in the DotLn
platform repository at the commit this order pins; the angular-eslint rule
list at the installed version.

**Objective:** a developer opening any component in DotLn-Angular can tell
from its directory what it is allowed to know, lint refuses the violations the
taxonomy's rules name, the `dotln` shell renders through a layout library with
content projection, and the `board` feature renders the DotLn actor board
(`uifa-board-v1`: five panels, their sections, rows and evidence-linked cells,
with `known`, `unknown` and `unavailable` states kept visible) from a
recorded fixture of this launchpad, demonstrating every kind once: fragments
and templates in `ui`, wrappers over Angular Aria and the CDK, composites, a
layout, mappers over the cell-value and link unions, a container reading one
`vm` signal from `BoardFacade`, behind a lazy route built from `BasePaths`.

**Observed gap (dated 2026-10-18; restated 2026-10-21 by the UI planning
pass that set the base):** at `5102783f` the workspace has `core`, `utils`,
`i18n` and their `testing` entry points, one placeholder page
(`apps/dotln/src/app/home.ts`, one translated heading) and no other
component, no behavior or vendor UI library, no lint override by directory,
and no board. PrimeNG 22.x ships under the PrimeUI License (a key is
required; the free Community License is conditional and renewed annually) and
PrimeNG 21.1.10, the last MIT release, peers Angular 21 (observed 2026-10-17
and 2026-10-20, WO-005-D006). On 2026-10-20 the operator directed that the
component API, markup, styling and tests be house-owned, with Angular Aria
evaluated for reusable accessibility behavior (WO-005-D006); on 2026-10-21
they confirmed the console sits over `uifa-board-v1`. The platform renders
that board in the terminal and as a static page and exports it as JSON
(`board --json`); no browser-reachable host serves it yet (the loopback
parity contract excludes `console board`), so this order renders a recorded
board and WO-007 loads one through HTTP answered by MSW.

**Design:**

- Behavior libraries, no vendor component library (planning document §6
  D2): `@angular/aria` supplies keyboard, focus and ARIA semantics for the
  patterns it ships, and `@angular/cdk` supplies overlay positioning and
  a11y utilities (focus trap, live announcer) where Aria has no pattern.
  Both are imported only under `**/wrappers/**` and in
  `libs/shared/ui/src/lib/provide-dotln-ui.ts`; the house `ui` library owns
  every API, template, style and test. Step 2 is the evaluation
  WO-005-D006 asked for: `dotln-tabs` over Aria's Tabs pattern (arrow keys,
  Home and End, roving tabindex, `aria-selected`, focus-visible), with a DOM
  spec, the axe e2e and a recorded reading of API ergonomics, maintenance
  cost, bundle bytes and the dependency and license review
  (`docs/evidence/WO-006/decisions.md`, with the console-framework evidence
  core deferred until a shell exists). If the evaluation fails, the wrapper
  keeps its house API over CDK-only behavior and the decision says why.
  Nothing in the criteria depends on which library carries the behavior:
  they test that `@angular/aria` and `@angular/cdk` imports exist only in
  `wrappers/` and the provider file.
- `libs/shared/ui` (`@dotln-angular/ui`, `type:ui`): `fragments/`
  (`dotln-icon`, a native-emoji glyph with a text equivalent, G5;
  `dotln-badge` with `known`, `unknown` and `unavailable` variants, H2;
  `dotln-visually-hidden`), `templates/` (`dotln-button` with `loading`
  variants `replace`, `trailing` and `overlay` through host bindings and
  projection, no library import; `dotln-card` with header, body and actions
  slots; `dotln-skeleton`; `dotln-empty-state` with a projected action;
  `dotln-unavailable` showing a source's or section's explanation), `wrappers/`
  (`dotln-tabs` over Aria Tabs; `dotln-menu` over Aria Menu with CDK overlay
  positioning; `dotln-dialog` over the native `<dialog>` element with the
  CDK focus trap), `composites/` (`dotln-page-header` composing badge,
  heading and actions; `dotln-key-value-list` rendering label, value and
  status cells as a readable list, never a dense table, G6). Design tokens in
  `libs/shared/ui/src/styles/_tokens.scss` as CSS custom properties; a skin
  layer as token overrides under `[data-skin]` with the plain skin as the
  default and no second skin shipped (G4); `provideDotlnUi()` composes the
  providers the wrappers need.
- `libs/shared/models` (`@dotln-angular/models`, `type:models`): the
  `uifa-board-v1` types (`BoardDocument`, `Panel`, `Section`, `Row`, `Cell`,
  `CellValue`, `CellStatus`, `Link`, `Source`, `Evidence`, `RoleAnswer`)
  transcribed from the pinned schema; WO-007 adds `AppError` and
  `FeatureFlags` here.
- Role-by-location lint (R1, R3, R5) in `eslint.config.mjs` overrides by
  glob: under `**/fragments/**`, `**/templates/**`, `**/composites/**` and
  `**/layouts/**`, `no-restricted-syntax` refuses `CallExpression[callee.name="inject"]`
  and constructor parameter injection, and `no-restricted-imports` refuses
  `@dotln-angular/*-data-access`, `@dotln-angular/state`, `@angular/router`,
  `@angular/aria` and `@angular/cdk`; under `**/wrappers/**` `@angular/aria`
  and `@angular/cdk` are allowed in addition; outside `**/wrappers/**` and
  `libs/shared/ui/src/lib/provide-dotln-ui.ts` both are refused everywhere;
  under `**/mappers/**` `no-restricted-imports` refuses `*-data-access` and
  `state`. The four lint follow-ups WO-005 recorded land here because this
  is the first order that edits the lint rules: `@typescript-eslint/prefer-readonly`
  made effective under every project configuration (WO-005-D008); an
  autofixable import-order rule with three groups separated by one blank
  line, packages, `@dotln-angular/*` aliases, then relative imports with the
  furthest parent first (WO-005-D021); the inline-template rule, a newline
  after the opening backtick and the closing backtick on its own line,
  applied to the existing components (WO-005-D020); and the house check
  that lists a type alias or interface name declared in more than one file
  under `libs/shared`, run by `tools:lint`, with the per-library `types.ts`
  convention of house rule 13 (WO-005-D022). Fixtures under
  `tools/lint-fixtures/taxonomy/` and `tools/lint-fixtures/conventions/` fail
  each rule once with a passing control beside each.
- Component conventions (house rule 12): decorator member order checked by
  `tools/scripts/check-component-order.mjs` (reads each `@Component({...})`
  literal, refuses out-of-order keys and an empty `providers`), run as
  `npm run lint:components` and by `tools:lint`; `host` metadata over
  `@HostBinding`; `changeDetection: ChangeDetectionStrategy.OnPush`
  everywhere; selectors: `dotln-` for `ui` and `shell`, `board-` for the
  feature, with `@angular-eslint/component-selector` per project; `#private`
  and `readonly` per WO-005's rules; `prefers-reduced-motion` honored and
  motion only on transitions (G2).
- `libs/dotln/shell` (`@dotln-angular/dotln/shell`, `scope:dotln,type:ui`):
  `layouts/app-layout` with `header`, `nav`, `main` and `footer` slots, a
  skip link, landmark roles, focus-visible styles, a fluid width with no
  fixed page width (G6); `app.ts` projects into it.
- `libs/features/board` (`@dotln-angular/board`, `type:feature`):
  `board.routes.ts` exporting `boardRoutes` with
  `providers: [provideBoardFeature()]`, which provides the recorded board
  through `BoardFixtureToken` until WO-007's `BoardStore` replaces it;
  `containers/board-page/` (the Maven: injects `BoardFacade`, reads `vm`,
  maps outputs to the intents `selectPanel(id)` and `follow(link)`);
  `facades/board.facade.ts` (`vm: Signal<BoardViewModel>` computed from
  signals: the version check (H1), the selected panel with the Actors panel
  first, the panels in the document's order, and the sources' availability
  counts); `layouts/board-layout/` with page-header, panel-tabs,
  panel-content and sources-footer slots; `composites/board-panel/` (title,
  roles, question, sections), `composites/board-section/` (title, status,
  explanation, rows as a readable list; `dotln-unavailable` when
  `status: 'unavailable'`), `composites/board-row/` (title, cells through
  `dotln-key-value-list`, links); `mappers/cell-value-mapper/` over
  `CellValue` (string, number, boolean, array, null) and `CellStatus` using
  `@switch` (H2, H3); `mappers/link-mapper/` resolving a link to a same-page
  anchor by id and nothing else (H4); `models/board-view-model.ts`. The
  feature has no `public_api.ts` barrel beyond the routes export (house rule
  4); files import by relative path. `apps/dotln/src/app/app.routes.ts`
  lazy-loads it at `BasePaths.Board` and redirects `''` there; the WO-004
  placeholder page and `BasePaths.Home` are removed (core's enum gains
  `Board`); a spec asserts the feature imports nothing that dispatches a
  command (H5).
- Fixtures: `libs/features/board/src/testing/fixtures/launchpad-board-2026-10-21.json`
  is this launchpad's board, captured at activation with
  `node packages/console/dist/src/cli.js board --json` from the launchpad
  root (`npm run console` builds first and fails in an exported instance,
  planning document §4), scrubbed by `tools/scripts/scrub-board-fixture.mjs`,
  which replaces the launchpad's absolute path prefix with `<launchpad>` and
  refuses any remaining `/Users/`, `/home/` or drive-letter path (the raw
  board names six absolute paths in its sources; a home-directory name is a
  private identifier under the clean-room floor); `unavailable-board.json` is
  derived from it with every section and source unavailable. The schema is
  copied to `libs/features/board/src/testing/fixtures/uifa-board-v1.schema.json`
  from the DotLn platform repository at a pinned commit with its SHA-256
  recorded in the generator log and the decision (a contract document, not
  a machinery file; WS-001 §The console). `npm run check:fixtures` runs the
  scrub check and validates both fixtures against the schema (a small house
  validator or `ajv` as a devDependency; the executor chooses and records).
- Accessibility (house rule 18, G1): `@axe-core/playwright` in `dotln-e2e`
  runs `AxeBuilder` on the board route with the WCAG 2.2 AA tags and fails on
  serious or critical violations; keyboard navigation of the shell and the
  panel tabs is one e2e test.
- i18n (house rule 9, G3): the board's titles, labels, questions and values
  are data from the view model; every string the shell and the feature add
  (navigation, footer, unavailable explanations' framing, button labels)
  goes through `| t`, and `npm run i18n:check` passes.
- Documents: `docs/dev-reference/architecture/component-taxonomy.md` (the
  WS-001 §Design text adapted to this repository, with one path per kind),
  `docs/ai-reference/component-rules.md` (R1 to R7, H1 to H5 and G1 to G6
  as imperative lines with the directories) and
  `docs/dev-reference/architecture/console.md` (the board's data path: the
  recorded fixture now, MSW in WO-007, the platform's host later; the
  schema pin); `conventions.md` gains house rules 6 (rewritten), 12, 14 and 18.

Rejected: PrimeNG 22 (axis: the operator's own condition, free, which its
license no longer meets as MIT); Angular Material (axis: ownership, the
operator's direction of 2026-10-20 that the component layer is house-owned);
a generic tile grid as the demonstration feature (axis: product relevance;
the platform adopted on 2026-09-06 that the first Angular change is an actor
view, not a phase table, and the board exercises the real contract at the
same size); rendering `runtime-status-v1` first (axis: it needs a running
resident and this instance has no live status file); loading the board over
HTTP in this order (axis: no browser-reachable host exists; WO-007 mocks the
endpoint and the platform's bridge is requested); a mediator service injected
into presentational components (axis: R1, platform grain); role-based
selector prefixes (axis: the operator settles prefixes after seeing
implementations; directory carries the role).

Live-run surfaces at the base: none beyond WO-004's (the draft and published
pull requests, Actions). The verified-phase draft publish is the first
observation of the host after a hook admission alone (planning pass of
2026-10-21, D4, of the latest-upstream-fixes document); its record is an
evidence obligation, never a criterion.

**Operator scope expansion (2026-10-21):** WO-006-D007 records authorization
for a local Storybook catalog and persistent Playwright screenshot coverage
with visual inspection for layout, typography, spacing and interaction states.

**Deliverables:** the local Storybook catalog and visual e2e coverage; the four libraries; the lint overrides, the four follow-up
rules and their fixtures; the component-order script; the board fixtures,
the schema pin and `check:fixtures`; the board feature behind its route; the
axe and keyboard e2e; the three documents; `docs/evidence/WO-006/` with the
host-qualification record.

**Execution plan:**

1. Base guard, route guard (`--draft` carried by `scripts/worktree.mjs`),
   the header precheck of the profile's §Release close (both counts print
   1), and activation as WO-005 step 1, for WO-006. Check: status shows the
   base `5102783f`.
2. Install `@angular/aria` and `@angular/cdk` at the versions the installed
   Angular admits; log them with their licenses. Build `dotln-tabs` over the
   Tabs pattern with its DOM spec; record the evaluation (API ergonomics,
   maintenance cost, bundle bytes of the board route, dependency and
   license review, the verdict and the fallback if any) as WO-006-D002.
   Check: `npm ls @angular/aria @angular/cdk` exits 0 and the spec passes.
3. Generate `ui`, `models`, `dotln/shell` and `board` (with tags) with the
   commands logged. Check: `npx nx show projects` lists `ui`, `models`,
   `dotln-shell`, `board`.
4. Capture, scrub and pin: the fixture from this launchpad's board, the
   derived unavailable fixture, the schema at a pinned commit with its
   SHA-256, the `models` types, `tools/scripts/scrub-board-fixture.mjs` and
   `npm run check:fixtures`. Check: `npm run check:fixtures` exits 0 and
   `grep -c "/Users/" libs/features/board/src/testing/fixtures/*.json` prints
   0 for each file.
5. `ui` fragments, templates, wrappers, composites, tokens, the plain skin
   and `provideDotlnUi()`, each with a spec. Check: `npx nx test ui` and
   `npx nx lint ui` exit 0.
6. Lint overrides, the four follow-up rules and the fixtures under
   `tools/lint-fixtures/taxonomy/` and `tools/lint-fixtures/conventions/`,
   the existing components reformatted to the template rule. Check:
   `npm run lint:fixtures` exits 0 (each fixture fails its rule, each
   control passes).
7. `tools/scripts/check-component-order.mjs` and `npm run lint:components`;
   fix every component it flags. Check: `npm run lint:components` exits 0 and
   fails on `tools/lint-fixtures/component-order.ts`.
8. `dotln/shell` layout; `apps/dotln/src/app/app.ts` projects into it. Check:
   `npx nx build dotln` exits 0.
9. `board` feature files as the Design states; `BasePaths.Board` in core;
   `app.routes.ts` lazy route and redirect; remove the placeholder page and
   `BasePaths.Home`. Check: `npx nx e2e dotln-e2e` exits 0 with the board
   route rendering the five panels and the Actors panel selected.
10. Facade and container specs with `provideBoardFacadeTestKit()` from
    `@dotln-angular/board/testing` (feature libraries may carry a `testing`
    entry point even without a barrel), including the unavailable fixture.
    Check: `npx nx test board` exits 0.
11. `@axe-core/playwright` test and the keyboard test in `dotln-e2e`. Check:
    `npx nx e2e dotln-e2e` exits 0 and the axe test asserts zero serious or
    critical violations.
12. Documents and `conventions.md`; `THIRD-PARTY-NOTICES.md` gains
    `@angular/aria` and `@angular/cdk` (MIT) and `@axe-core/playwright`
    (MPL-2.0, a development dependency). Check: files exist;
    `npm run i18n:check` exits 0 (all new strings through `| t`).
13. Gate: `node scripts/target-gate.mjs WO-006` and `--review`. Check:
    passing rows, no mutation.
14. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains one path per component kind and the board's data
    path; its Upstream references name the pinned schema commit. Check:
    `npm run test:docs`.
15. Commit; `implementation-ready`; handoff per §Discipline. After the
    session that records `verification-result pass` has done so, that
    session runs, from the launchpad root,
    `node scripts/worktree.mjs publish WO-006 --target-worktree --draft --branch feat/component-taxonomy --title "feat: add the component taxonomy, shell layout and actor board" --body-file <reviewed path>`
    (the node spelling is the only form the kit admits for a registered
    target since starter v0.87.0), which commits from the tree without
    moving `HEAD`, pushes the branch and opens the draft pull request. The
    same session writes `docs/evidence/WO-006/host-qualification.md` in the
    shape of core's row: the Claude Code version and that auto mode was on;
    the helper command line as run, verbatim; the journal row's `recordedAt`
    and `kind` for it (a `registeredTargetAdmission` row, or the advisory
    row's text if the hook withheld and something else carried the command);
    whether the host prompted, which command, who answered and what the
    journal shows; any `HostPermissionDenied` row with the rule it names;
    the trust entries by pattern (none expected) and that `hostRules` is
    absent from the registration; the pull request's URL and that it opened
    as a draft; no private journal contents copied.
16. At final review: read the draft's threads and workflow runs into
    `docs/evidence/WO-006/preview-pr.json` and route each item,
    `target-records`, then the same publish command without `--draft`, which
    force-pushes with lease against the recorded draft head and reuses the
    branch and the pull request; append to `host-qualification.md` the same
    fields for the closed-phase publish, and at the close whether the base
    checkout kept its judged output and how the Release and tag read. No
    work-in-progress commit, no force-push by hand, no manual close.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run check:fixtures`, `npm run i18n:check`,
`npx nx e2e dotln-e2e`, `npx nx build-storybook ui`,
`npx nx e2e-visual dotln-e2e`; in the launchpad order worktree `npm run test:docs`;
then the target gate plain and review once each.

**Acceptance criteria (all required)**

1. `grep -rlE "@angular/(aria|cdk)" libs apps --include='*.ts'` lists only
   files under `**/wrappers/**` and `libs/shared/ui/src/lib/provide-dotln-ui.ts`,
   and `npm run lint:fixtures` exits 0 by observing each fixture fail its
   rule with its control passing (inject in a fragment, a template, a
   composite and a layout; an `@angular/aria` import outside wrappers; a
   data-access import in a mapper; a never-reassigned private member under
   a project configuration; an out-of-order or unseparated import group; an
   inline template without the two newlines; a type alias name declared in
   two files under `libs/shared`).
2. `grep -rlE "inject\(|constructor\(" libs/shared/ui/src/lib/{fragments,templates,composites} libs/features/board/src/lib/{composites,layouts}`
   prints nothing, and every component under `libs` and `apps` declares
   `changeDetection: ChangeDetectionStrategy.OnPush`
   (`grep -rL "ChangeDetectionStrategy.OnPush" $(grep -rl "@Component" libs apps --include='*.ts' | grep -v spec)`
   prints nothing).
3. `npm run lint:components` exits 0 on the workspace and exits nonzero on
   `tools/lint-fixtures/component-order.ts`.
4. `libs/features/board/src/lib/` has `containers/`, `facades/`, `mappers/`,
   `composites/`, `layouts/` and `models/` each with at least one non-spec
   file; `libs/features/board/src/index.ts` exports only `boardRoutes`; no
   file under `libs/features/board/src/lib` imports from `@dotln-angular/board`
   (`grep -rl "@dotln-angular/board'" libs/features/board/src/lib` prints
   nothing); `apps/dotln/src/app/app.routes.ts` lazy-loads it
   (`grep -c "loadChildren" apps/dotln/src/app/app.routes.ts` is at least 1)
   and `grep -c "Home" libs/shared/core/src/lib/paths/routes.ts` prints 0.
5. `npm run check:fixtures` exits 0: both fixtures validate against the
   pinned schema, whose SHA-256 is recorded in `docs/evidence/WO-006/decisions.md`
   and the generator log, carry `"viewModelVersion": "uifa-board-v1"`, and
   contain no absolute path (`grep -cE "/Users/|/home/|[A-Z]:\\\\" libs/features/board/src/testing/fixtures/*.json`
   prints 0 for each file); and `npx nx test board` exits 0 with a spec that
   renders `unavailable-board.json` and asserts every section shows the
   unavailable state with its explanation, and a spec that renders a document
   whose `viewModelVersion` differs and asserts the page shows the unavailable
   state naming that version.
6. `npx nx e2e dotln-e2e` exits 0 and includes a test that runs
   `AxeBuilder` with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
   `wcag22aa` tags on the board route and asserts no serious or critical
   violations; a keyboard test that reaches the main landmark from the skip
   link and moves the selected panel with the arrow keys; and a test that the
   board route renders five panel tabs from the fixture with the Actors panel
   selected first and at least one row's cells showing label, value and
   status.
7. `docs/dev-reference/architecture/component-taxonomy.md` names the seven
   kinds with one repository path each, `docs/ai-reference/component-rules.md`
   states R1 to R7, H1 to H5 and G1 to G6 by identifier, and
   `docs/dev-reference/architecture/console.md` names the fixture path, the
   schema pin and the data path.
8. `node scripts/target-gate.mjs WO-006 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

9. `npx nx build-storybook ui` passes; the catalog documents every shared UI
   component and representative shell and board states. The persistent
   Playwright suite covers the board at desktop and mobile sizes and the
   component interaction states with screenshot assertions. The executor
   inspects the resulting images and records visual findings and corrections.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-006/README.md`, `docs/evidence/WO-006/decisions.md` (the
Aria evaluation, the schema pin, the fixture capture) and
`docs/evidence/WO-006/host-qualification.md`.

**Known issues and carry-ins:** `BoardFacade` reads the recorded fixture
until WO-007 provides `BoardStore` over HTTP; the platform serves the board
only as JSON and HTML output today, so a live board waits on a
browser-reachable host core has not built (the fork's request of
2026-10-21); selector prefixes are provisional until the operator rules; the
board fixture is a snapshot of this launchpad on 2026-10-21 and is refreshed
by a later order when the contract gains a section (core's WO-080 adds a
Workstreams section additively). This order activates only on a launchpad
whose starter carries core WO-221's `--draft` form (step 1's route guard);
the draft pull request and its workflow runs are a final-review obligation
read from `docs/evidence/WO-006/preview-pr.json`, never a criterion
(main-rules planning document §6 D5 and D7); the host-qualification record
of steps 15 and 16 is an evidence obligation core's 2026-10-19 and 2026-10-20
answers asked for, never a criterion. The `Target release classification`
header was added by the UI planning pass of 2026-10-21 under WO-012's
declared policy (`DotLn Angular` releases; minor, the first target release,
`DotLn Angular v0.1.0`).

**Non-goals:** stores, events, HTTP, MSW (WO-007); authentication (WO-008);
`runtime-status-v1`, the command surface over the parity contract, the
arrival screen, drag-equip authoring, counterfactual and QA views, a second
skin or the RPG layer (WS-001 §The console, later members); a hosted design-system
site; dark mode beyond token readiness; a second feature.

**Operator-review assumptions:** the operator accepts the house component
library over Angular Aria and the CDK as the reading of their direction of
2026-10-20, the actor board as the feature this order demonstrates, and
reads the one draft pull request before final review, which the final
publish reuses.
