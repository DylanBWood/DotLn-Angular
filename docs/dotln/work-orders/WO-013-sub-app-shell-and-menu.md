# WO-013 — The one app and its sub-apps: the shell's sub-app menu, the `scene` and `machinery` sub-app routes with their arriving pages, the sub-app grouping convention and the two reference documents that make a sub-app a feature added by convention

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ bc9133e932a00d33c15bc5289d683b8078f51ee4
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds the `sub-app-menu` template to `libs/dotln/shell`, two feature
libraries with one arriving page each (`libs/features/scene`,
`libs/features/machinery`), two `BasePaths` members, the menu's i18n block,
two documents (`docs/dev-reference/architecture/sub-apps.md`,
`docs/ai-reference/sub-app-rules.md`), about 24 source files; adds no
dependency. Removes nothing; the board keeps its route. Wall-clock: about 2 to
4 hours of executor work plus the fixed cycle; unknown until run. Context
bytes: WS-001 house rules 2, 3, 4, 11, 12 and §The app and its sub-apps, the
shell layout and `app.ts`, this order, about 60 KB. Commands added in the
target: none. Tokens: unknown until run. Steps: 12. Re-mints: none.
Refutations paid: one (the 2026-10-24 pass's receipt on this text).
**Nomination provenance:** the operator's decisions of 2026-10-24 on the
DotLn-Angular work, given to the platform's planning pass and relayed to this
fork in the operator's own words (ignored intake capture
`docs/intake/notes/planning-2026-10-24.md`, SHA-256
`63b25fa11cbd648d224067c98d712b23e79734f35979cc8c9922566cc85e044c`, entry 9;
core's record of the same decisions is
`docs/planning/intake-mining-run-routing-2026-10-24.md` §10 at its planning
branch): one app with sub-apps behind a menu, the first two sub-apps the game-AI
scene and the view of DotLn's machinery, one workstream, the logic in
libraries. Design file this order builds from: the operator's 2026-10-22
intake mining run at `out/angular/dotln-angular-forward.md` §2.0 (the route
and shell shape a slice adds: one enum member, one lazy route, one nav link,
one i18n block, one architecture document; SHA-256
`c05dea11b47547b5e6dd9e9880758539c3a36648cda1d281a7b9a54a1f8daaf8`) and
`out/angular/README.md` (SHA-256
`4810fd3337dc3fedaaf3e37f1fe2a0841e79a91bc73dd9db38833d104223762c`), read at
the run's folder on this machine (core's ignored intake, read-only; the files
may change, so the digests pin what was read). Nothing from the run is copied
here beyond ids, short titles and generic terms. Planner-synthesized by the
2026-10-24 planning pass ([planning document](../planning/mining-run-orders-2026-10-24.md)
§6 D5 and §9). Opaque identifier, not a priority.
**Depends on:** WO-007 merged (hard: the app-tier stores, the navigation store
and the error surface this shell composes; the base above is provisional and
is set to WO-007's merge commit by the planning pass that follows it).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-007",
    "relation": "hard",
    "reason": "the navigation store, the error surface and the persisted-state feature the shell and the arriving pages compose; the base line is set to its merge commit before activation"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 2, 3, 4, 11, 12, 18, 19; §The app and its sub-apps);
`docs/repositories/dotln-angular.md`; `docs/operator/README.md`; the target's
`docs/ai-reference/component-rules.md`, `foundation-rules.md` and
`docs/dev-reference/architecture/component-taxonomy.md`; the target's
`apps/dotln/src/app/app.ts`, `app.routes.ts`,
`libs/dotln/shell/src/lib/layouts/app-layout/app-layout.ts` and
`libs/shared/core/src/lib/paths/routes.ts` at the base.

**Objective:** `apps/dotln` is one app whose primary navigation is a menu of
sub-apps: **Scene** (the game-AI authoring scene, `/scene`), **Machinery**
(the view of DotLn's machinery, `/machinery`, with the existing actor board
listed under it at `/board`) and **Tools** (side utilities; the group is
rendered with no entries until WO-014 adds the catalog browser); each sub-app
is a lazily loaded feature library that exports only its routes; `/scene` and
`/machinery` render an arriving page that names the sub-app and the order
that lands it; the grouping convention for sub-apps is written once for people
and once for sessions; and the root still redirects to `/board`.

**Observed gap (dated 2026-10-24; restated by the pass that sets the base):**
at `90fa6e8d` the shell's `[nav]` slot carries one link (`shell.board`), the
route enum has one member (`Board`), `app.routes.ts` has one lazy child and a
root redirect, and no sub-app exists. The shell library is `scope:dotln,
type:ui`, so it may not import the router; the app composes router links into
the layout's `[nav]` slot. WO-006-D005 asked that app-scoped grouping be
evaluated before a second app or a foundation migration; the operator's
decision of 2026-10-24 answers it: one app, sub-apps behind a menu, the logic
in libraries so splitting later is cheap.

**Design:**

- **The menu is a shell template.** `libs/dotln/shell/src/lib/templates/sub-app-menu/`
  (`dotln-sub-app-menu`, a Template in the taxonomy: content projection, no
  injection): renders a `<nav>` with the translated label, one `<ul>` per
  group and a projected `<li>` per item. Groups and items are projected from
  `app.ts`, where `routerLink`, `routerLinkActive` and `ariaCurrentWhenActive`
  stay, because the shell is `type:ui` and the lint refuses the router there
  (house rule 15; the board's link is the precedent). Each group has a heading
  (`shell.menu.scene`, `shell.menu.machinery`, `shell.menu.tools`) and the
  Tools group renders its empty state (`shell.menu.toolsEmpty`) when it has no
  projected item. The layout's `[nav]` slot takes the menu; the menu replaces
  the bare link.
- **Routes.** `BasePaths` gains `Scene = 'scene'` and `Machinery =
  'machinery'`; `app.routes.ts` gains two lazy `loadChildren` entries to
  `@dotln-angular/scene` (`sceneRoutes`) and `@dotln-angular/machinery`
  (`machineryRoutes`); the root redirect stays on `BasePaths.Board` (the e2e
  asserts it). `Tools` is added as a `BasePaths` member only when WO-014 adds
  its route; the menu group exists now so the shape is complete.
- **Arriving pages.** Each new feature library ships one container
  (`scene-arriving-page`, `machinery-arriving-page`) over the house
  `dotln-empty-state` template: the sub-app's name, one sentence saying what
  arrives and which order lands it (`scene.arriving.*`, `machinery.arriving.*`
  keys), and a link back to the board. No facade, no store, no data.
- **Grouping convention (WO-006-D005 settled).** A sub-app is a feature library
  under `libs/features/<sub-app>` tagged `scope:dotln, type:feature`, importing
  as `@dotln-angular/<sub-app>` and exporting only its routes; a sub-app's own
  data access lives in `libs/features/<sub-app>-data-access`; engines, models,
  readers and clocks every sub-app may read live under `libs/shared/`
  (`type:util`, `type:models`, `type:data-access`); `libs/dotln/` stays the
  shell's. Child routes inside a sub-app are `ChildPaths` members. Written
  into WS-001 by the 2026-10-24 pass; this order confirms it by the generator
  log and the two documents.
- **Documents.** `docs/dev-reference/architecture/sub-apps.md` (the one app,
  its menu, the three groups, how a sub-app is added: generator, enum member,
  lazy route, menu item, i18n block, document; what a sub-app never does:
  write a control record, call the platform) and
  `docs/ai-reference/sub-app-rules.md` (imperative rules: a sub-app is a
  feature library and exports routes only; the menu is the shell's and the
  links are the app's; every new idea lands in the app as a toy first;
  nothing in the app writes a control record or reaches core; graduation is
  a GitHub issue on the platform's repository). `conventions.md` gains the
  grouping rule.

Rejected: a menu component that owns the router (axis: the shell is `type:ui`
and the lint refuses the router in presentational code; the app owns
navigation); a second app for the scene (axis: the operator's decision of
2026-10-24, one app with sub-apps and the logic in libraries); moving the
board under `/machinery/board` now (axis: churn in the board's routes while
WO-007's rewiring is fresh; the Machinery group lists the board at its route
and a later pass may move it, candidate C8 of the 2026-10-24 planning
document); a `Tools` route with an empty page (axis: a route with nothing
behind it; WO-014 brings the first utility and its route together).

Live-run surfaces at the base: WO-006's served production build and
Storybook; WO-007's MSW worker in the served build.

**Deliverables:** the menu template with its stories; the two feature
libraries with their arriving pages, routes and test kits; the enum members
and routes; the i18n keys; the two documents and the `conventions.md` rule;
`docs/evidence/WO-013/`.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-013; `npm run plan --
   check` on the launchpad's `main` recorded in the evidence README (green at
   starter v0.94.0 since #23).
2. Generate `libs/features/scene` and `libs/features/machinery` with logged
   commands (`--tags=scope:dotln,type:feature`, prefixes `scene` and
   `machinery`) and their `testing` entry points. Check: `npx nx show
   projects` lists `scene`, `machinery` and both testing entry points;
   `docs/dev-reference/workspace/generator-log.md` carries each invocation
   and result.
3. `libs/shared/core/src/lib/paths/routes.ts`: `BasePaths.Scene` and
   `BasePaths.Machinery`; a spec asserts `buildRoute(BasePaths.Scene)`
   yields `['/', 'scene']`. Check: `npx nx test core` exits 0.
4. `libs/dotln/shell/src/lib/templates/sub-app-menu/sub-app-menu.ts` with
   `.spec.ts` and `.stories.ts` (groups projected; empty group renders its
   empty-state line; `nav` labelled). Check: `npx nx test dotln-shell` exits
   0; `npm run lint:components` exits 0.
5. The arriving pages (`libs/features/<sub-app>/src/lib/containers/
   <sub-app>-arriving-page/`) over `dotln-empty-state`, each with a spec and a
   story; `sceneRoutes` and `machineryRoutes`. Check: `npx nx test scene
   machinery` exits 0.
6. `apps/dotln/src/app/app.routes.ts` (two lazy children) and `app.ts` (the
   menu with three groups projected into `[nav]`; the Scene group links
   `/scene`, the Machinery group links `/board` and `/machinery`, the Tools
   group has no item). Check: `npx nx build dotln` exits 0.
7. `apps/dotln/public/i18n/en.json`: `shell.menu.*`, `scene.arriving.*`,
   `machinery.arriving.*`. Check: `npm run i18n:check` exits 0.
8. e2e `apps/dotln-e2e/src/sub-apps.spec.ts`: the menu renders three groups
   with their headings; the Tools group shows its empty line; `/scene` and
   `/machinery` render their arriving pages with the order named; the
   keyboard path reaches every menu link; axe at the board spec's threshold;
   no horizontal overflow at 360, 768 and 1440; the root still redirects to
   `/board`. Check: `npx nx e2e dotln-e2e` exits 0.
9. Stories added to the Storybook e2e list. Check: `npx nx e2e dotln-e2e`
   exits 0 including the storybook spec.
10. Documents: `docs/dev-reference/architecture/sub-apps.md`,
    `docs/ai-reference/sub-app-rules.md`, the `conventions.md` rule, a pointer
    from `docs/dev-reference/README.md` and `docs/ai-reference/README.md`.
    Check: files exist; `npm run i18n:check` exits 0.
11. Gate plain and review. Check: passing rows, no tracked-byte mutation.
12. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains the menu template and a sub-app route; WS-001's
    delivery states updated by the final review. Check: `npm run test:docs`.
    Then the publish, review and records steps as WO-007 steps 15 to 17, with
    the branch `feat/sub-app-menu`, the title `feat: add the sub-app menu and
    the scene and machinery routes`, `docs/evidence/WO-013/` and
    `docs/final-reviews/WO-013/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run i18n:check`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. `libs/shared/core/src/lib/paths/routes.ts` declares `BasePaths.Scene` and
   `BasePaths.Machinery`, `apps/dotln/src/app/app.routes.ts` lazy-loads
   `@dotln-angular/scene` and `@dotln-angular/machinery`, and
   `grep -c "redirectTo: BasePaths.Board" apps/dotln/src/app/app.routes.ts`
   is at least 1.
2. `libs/dotln/shell/src/lib/templates/sub-app-menu/sub-app-menu.ts` exists,
   contains no `inject(` and imports nothing from `@angular/router`
   (`grep -c "@angular/router" libs/dotln/shell/src -r` prints 0), and
   `npx nx test dotln-shell` exits 0 with a spec that renders three projected
   groups and the empty-state line for a group with no item.
3. `libs/features/scene/src/index.ts` and `libs/features/machinery/src/index.ts`
   each export exactly one `*Routes` symbol (`grep -c "export" <file>` is 1),
   both libraries are tagged `scope:dotln,type:feature` in their
   `project.json`, and `npx nx test scene machinery` exits 0.
4. `npx nx e2e dotln-e2e` exits 0 and includes: the menu's three group
   headings rendered; `/scene` and `/machinery` rendering their arriving
   pages; the root redirecting to `/board`; the keyboard path over every
   menu link; axe at the board spec's threshold; no horizontal overflow at
   360, 768 and 1440.
5. `npm run i18n:check` exits 0 and `apps/dotln/public/i18n/en.json` carries
   `shell.menu.scene`, `shell.menu.machinery`, `shell.menu.tools` and
   `shell.menu.toolsEmpty`.
6. `docs/dev-reference/architecture/sub-apps.md` and
   `docs/ai-reference/sub-app-rules.md` exist, the rules file states that a
   sub-app writes no control record and that graduation is a GitHub issue on
   the platform's repository
   (`grep -c "control record" docs/ai-reference/sub-app-rules.md` is at least
   1), and `docs/dev-reference/workspace/generator-log.md` carries the two
   library invocations with their results.
7. `node scripts/target-gate.mjs WO-013 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-013/README.md` and
`docs/evidence/WO-013/host-qualification.md`.

**Known issues and carry-ins:** the base line is provisional until the pass
after WO-007 sets it to WO-007's merge commit; WO-007's own text decides
whether the board keeps `BoardFacade`'s shape this order's Machinery link
points at (the link is a route, not a dependency on the facade). Starter
v0.94.0 prints an advisory that this order's execution plan names launchpad
record paths carrying the order id (`host-qualification.md`,
`preview-pr.json`, `RELEASE-NOTES.md`); they are the launchpad's own evidence
paths and are kept; the publish command's body file must not name them (the
2026-10-24 planning document, §11 item 1). This order activates only on a
launchpad whose starter carries core WO-221's `--draft` form (WO-005 step 1's
route guard); the draft pull request and its workflow runs are a final-review
obligation read from `docs/evidence/WO-013/preview-pr.json`, never a
criterion. `Target release classification: minor` and `Target release notes:
reviewed` were set by the 2026-10-24 pass under WO-012's declared policy.

**Non-goals:** the scene and the machinery view themselves (WO-015, WO-016);
the Tools route and the catalog browser (WO-014); moving the board under
`/machinery`; permission-gated menu items (WO-008); drag; any read of the
platform.

**Operator-review assumptions:** the operator accepts the three group names
(Scene, Machinery, Tools) as the menu's first wording and reads the one draft
pull request before final review, which the final publish reuses.
