# WO-014 — The toolbox catalog as the app's own data: the `Tool` schema with five faces and the closed transform enum, the run's 3,463 map rows typed into tools by a checkpointed fan-out of at most twelve workers, the catalog library that loads them, the allow-list and scrub check that keeps intake out of the commit, and the catalog browser under the Tools sub-app

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ bc9133e932a00d33c15bc5289d683b8078f51ee4
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `toolbox.ts` to `libs/shared/models`, `libs/shared/catalog`
with eight data files and a summary, `tool-v0.schema.json`,
`tools/scripts/catalog/` (merge, check, report), `libs/features/tools` with
the Tools home and the catalog browser, `BasePaths.Tools`, the Tools menu
item, two documents, about 40 source files plus about 3,500 data rows; adds
no runtime dependency (Ajv is a devDependency already). Removes nothing.
Wall-clock: about 3 to 5 hours of executor work, of which the fan-out runs
in parallel, plus the fixed cycle; unknown until run. Context bytes: WS-001
§The app and its sub-apps, the two toolbox captures and design B §2.1 read at
the run's folder, the maps README, this order, about 140 KB for the executor;
each classifier reads one map family (about 60 to 320 KB). Commands added in
the target: `npm run catalog:check`, `npm run catalog:report`. Tokens:
unknown until run; the fan-out is the largest spend of this workstream so
far and is recorded per worker. Steps: 15. Re-mints: none. Refutations paid:
one (the 2026-10-24 pass's receipt on this text).
**Nomination provenance:** the operator's decisions of 2026-10-24 (ignored
intake capture `docs/intake/notes/planning-2026-10-24.md`, SHA-256
`63b25fa11cbd648d224067c98d712b23e79734f35979cc8c9922566cc85e044c`, entry 9):
the toolbox catalog pipeline turns the 3,463 map rows into tools with five
faces and an optional DotLn analog plus the tool schema, stored as this
app's own data, with at most twelve workers checkpointed per map. Design
files this order builds from, read at the run's folder on this machine
(core's ignored intake, read-only; digests pin what was read):
`out/process/toolbox-toy-scene-capture.md` (the five faces and the
toolify task; SHA-256
`7cc9b2c088d4efd00d813303fa291fd725a7e56915fd2e9e8ec3154bb679f67f`),
`out/angular/design-toolbox-toy-scene.md` §2.1 (the `Tool` shape and the
closed transform enum; SHA-256
`aab22ca10a41fa873c78e36e076a411b273a3bac49536e21e1b4949ba0f25253`),
`out/maps/README.md` (the row schema, the row-id convention and the counts;
SHA-256 `9b6c905f7a2772e5f4eb60d66f66527629467e0b549f586232870c16cc3ad5e0`)
and `digest/queue-and-rules.md` §1.2 item 14 (the twelve-worker shape;
SHA-256 `b60a7607797cd781c94dc2b872e5e478ab1eb18b42964e967d1f45269e2beb31`).
Nothing from the run is copied here beyond ids, short titles and generic
terms; the quarantine files are never opened. Planner-synthesized by the
2026-10-24 planning pass ([planning document](../planning/mining-run-orders-2026-10-24.md)
§6 D6 and §9). Opaque identifier, not a priority. Amended by the
2026-10-24 second pass ([planning document](../planning/standard-pass-v0-96-1-2026-10-24.md) §6 D4): the `provenance`
field and the mapped-rows count rule, the rerun rule inside the twelve, the
checkers' observability rule, the base clause and receipt 008's known issues.
Amended by the 2026-10-25 pass ([planning document](../planning/standard-pass-v0-99-0-2026-10-25.md)
§6 D5): the not-found route WO-013-D007 boards for the first order that
changes `app.routes.ts`, and the multi-project check form of WO-013-D005.
Amended during execution on 2026-10-25 by explicit operator direction
([WO-014-D006](../evidence/WO-014/decisions.md#wo-014-d006)): criterion 3
admits up to three typed examples with an explicit shortfall, preserving the
closed transform contract. The operator also clarified that useful metaphors
and diagnostic applications of system traps belong in catalog guidance;
exhaustive cross-area mapping may be a targeted follow-up.

Amended during repair on 2026-10-26 by explicit operator direction
([WO-014-D016](../evidence/WO-014/decisions.md#wo-014-d016)): preserve the
acceptance criteria and extend the repair with bundle attribution and regression
checks, evidence-led performance calibration guidance and a local sampler, a
small reusable filter composite and selector pipeline, curated utility exports
with runtime/type contracts, and reusable operator guidance across this order.
Native-operation spelling changes alone do not satisfy the composition aim.
Missing fork-specific interaction support goes to the next planning pass and,
if needed, its paste-ready request for a core update. No runtime integration is
added by this amendment.

**Depends on:** WO-013 merged (hard: the sub-app menu's Tools group and the
grouping convention; the base above is provisional: since starter v0.96.1 (core WO-230) the target publish describes the change from the merge base of the subject and the target's `main` and names the activation base beside it, so activation on this base publishes right; the planning pass that runs after WO-013 merges may set it to that merge commit, and none is required to (the 2026-10-24 second pass, D4)).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-013",
    "relation": "hard",
    "reason": "the Tools menu group this order fills and the sub-app convention it follows; the base line is provisional and publishes right under starter v0.96.1's merge-base publish"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 3, 4, 5, 10, 11, 15; §The app and its sub-apps, including the
clean-room rule for the catalog); `docs/repositories/dotln-angular.md`;
`docs/operator/README.md`; `docs/control/budgets.json` (`subagentCap`); the
target's `docs/ai-reference/sub-app-rules.md` and `foundation-rules.md`; the
target's `tools/scripts/scrub-board-fixture.mjs` and
`check-board-fixtures.mjs` at the base; the run's files named above, at the
sections named.

**Objective:** every one of the run's 3,463 concept rows (AI for Games parts
A and B, Enterprise Integration Patterns, Patterns of Enterprise Application
Architecture, RxJS core, RxJS practice, GEB map parts 1 and 2, Team Topologies
map parts 1 to 3) is classified once into the app's own catalog as a tool a
unit can be given, a scene element, a metric or a background concept; every
tool carries the five faces (scene, selection, transform, observable, toy
metric), a transform from the closed enum or `untyped` with its reason, and
an analog only when obvious; the catalog is committed as the app's own data
under a schema and an allow-list check that admits ids, short titles and
generic terms and refuses every other map field; the per-work scene type and
the first three tools per work are recorded; and the operator browses and
filters the catalog at `/tools/catalog`.

**Observed gap (dated 2026-10-24; restated by the pass that sets the base):**
the workspace has no catalog, no tool type and no Tools route; the run's maps
are machine-readable rows (`work, slug, part, chapter, section, concept,
type, definition, related, dotlnHooks, verified`) in core's ignored intake,
3,463 rows across eleven JSONL files in three folders, with row types
concept 1,233, technique 586, pattern 427, principle 353, tool 259,
trade-off 186, anti-pattern 154, data-structure 133, algorithm 130,
observation 2 (counted by the 2026-10-24 pass); the toolify task the run
sketched never ran; only design B's tables type faces by hand for a few dozen
tools. The run's row-id convention is `<file slug>:<1-based line>`.

**Design:**

- **Types** (`libs/shared/models/src/lib/toolbox.ts`, `type:models`):
  `ToolId` (`<slug>:<line>`); `WorkSlug` (`aifg`, `eip`, `poeaa`, `rxjs`,
  `geb`, `tt`, and later `artofwar` and the toy sources); `ToolKind`
  (`behaviour`, `rule`, `mode`, `relationship`, `analysis`, `sceneType`,
  `sceneElement`, `metric`, `background`); `SceneTypeId` (`units-on-terrain`,
  `pipeline`, `channels`, `marbles`, `levels`, `teams`, `workplace`,
  `builds`); `TransformKind`, a closed enum interpreted by scene engines:
  `steer.blend`, `steer.priority`, `formation.twoLevel`, `formation.fixed`,
  `objective.set`, `squad.form`, `squad.dissolve`, `order.issue`,
  `channel.policy`, `ground.influence`, `ground.frag`, `path.cost`,
  `level.zoom`, `level.ring`; `SelectionTarget` (`unit`, `squad`,
  `commander`, `channel`, `region`, `scene`); `MetricId`; `Tool`:
  `{ id, work, title, rowType, kind, faces?: { scene: SceneTypeId[];
  selection: { target; min; max }; transform: { kind: TransformKind; params:
  ParamSpec[] } | { kind: 'untyped'; reason }; observable: string[];
  toyMetric: MetricId[] }, analog?: { roles: DotLnRole[]; clause }, status:
  'typed' | 'untyped' | 'background', classifiedBy, provenance: 'map' |
  'public-work', map: { file, line, sha256 } | null }`; `map` is an object
  when `provenance` is `map` and `null` when it is `public-work` (the form
  WO-018's toy-source tools take), and the schema states the pairing. A tool
  of kind `background`, `sceneElement` or `metric` has no faces. Everything
  `readonly`.
- **Allow-list and scrub** (`tools/scripts/catalog/check-catalog.mjs`, run by
  `npm run catalog:check` and inside `check:fixtures`): Ajv against
  `tool-v0.schema.json` with `additionalProperties: false`; `title` at most
  80 characters; `analog.clause`, `transform.reason` and each `observable`
  entry at most 120; no row carries `definition`, `related`, `dotlnHooks`,
  `verified`, `section` or `chapter`; every string passes `assertScrubbed`;
  ids unique; the count of `provenance: 'map'` rows equals the maps' total
  recorded in the summary. The check scans `libs/shared/catalog/src/data/`
  only, so a map a later order owns lives in its own directory under its own
  check. This is the clean-room rule made mechanical: the commit carries ids, short
  titles and generic terms, never the run's own-words definitions, relations
  or hooks.
- **The data** (`libs/shared/catalog/src/data/`): one checkpoint file per
  classifier batch, `tools-aifg-a.json`, `tools-aifg-b.json`,
  `tools-eip.json`, `tools-poeaa.json`, `tools-rxjs-core.json`,
  `tools-rxjs-patterns.json`, `tools-geb.json`, `tools-tt.json`, each
  `{ schema: 'tool-v0', batch, maps: [{ file, rows, sha256 }], tools: Tool[] }`;
  `catalog-summary.json` (counts per work, kind, transform kind and status;
  the per-work scene type; the first three tools per work with typed
  transforms; the classifier, checker, synthesizer and critic labels; the
  date). The map files' SHA-256 digests are recorded; their paths are not.
- **The fan-out** (the executor's session, at most twelve workers, each a
  `dotln-worker`, or `dotln-worker-fable` when the operator's dispatch line
  names Fable, with no model override, under the launchpad's `subagentCap`
  of 20): eight classifiers, one per batch above (the GEB batch reads two
  files, the Team Topologies batch three), each given only its map file
  paths, the `Tool` type, the three enums, the allow-list rule, the rule that
  no quarantine file is opened, and an output path in the session scratch;
  each returns its checkpoint JSON and a one-line statement of what it read.
  Two sampling checkers, each over 40 typed tools drawn across all eight
  checkpoints with a seeded sample: is the transform observable in a
  twenty-unit scene, is the analog, when present, a real role of the
  platform; a failing tool is returned by id with the reason and the executor
  reruns the classifier on that batch's listed ids only (the checkpoint is
  the unit of rerun). A rerun continues the batch's own worker, sent the
  listed ids, and counts once: the twelve are twelve distinct workers with
  their reruns inside them, and the evidence README lists each rerun under
  its worker. A checker that finds a transform not observable in a
  twenty-unit scene returns the tool as `untyped` with that reason, never
  as a nearer kind, so the quota of three typed tools per work is met by
  tools the checkers admit; a work that falls short is recorded as short in
  the summary and the decisions file, never filled by force-fitting a
  transform. One synthesizer: the per-work scene type, the first
  three tools per work, the counts. One critic: reads the summary and three
  seeded samples and returns findings; the executor disposes each in the
  decisions file. The executor merges checkpoints with
  `tools/scripts/catalog/merge-checkpoints.mjs <scratch dir>` (validates,
  sorts by id, writes the data files) and records every worker's label, map,
  row count and statement in the evidence README; `node scripts/harness.mjs
  usage <session>` is read before the first spawn and at handoff.
- **The library** (`libs/shared/catalog`, `scope:shared`, `type:data-access`,
  `@dotln-angular/catalog` and `/testing`): `CatalogLoader` loading each
  work's data as a lazy chunk (`import('./data/tools-<batch>.json')`),
  `provideCatalog()`, `CatalogToken`, pure filters (`byWork`, `byKind`,
  `byTransform`, `bySceneType`, `byStatus`, `firstThree(work)`), and
  `provideCatalogTestKit()`. The loader's interface is the seam: the mining
  store's own API replaces the imports later without changing a feature
  (candidate C1 of the 2026-10-24 planning document).
- **The browser** (`libs/features/tools`, `scope:dotln`, `type:feature`,
  `toolsRoutes`; `BasePaths.Tools = 'tools'`, `ChildPaths.Catalog =
  'catalog'`): `/tools` lists the utilities (Catalog) over
  `dotln-key-value-list`; `/tools/catalog` is `catalog-page` (container)
  over `ToolsFacade` with filters (work, kind, scene type, transform kind,
  status) as `dotln-menu` wrappers, a `tool-list` composite (one row per
  tool: title, id, work, kind, transform kind or `untyped` with its reason)
  and a `tool-faces` composite (the five faces and the analog when present);
  the menu's Tools group gains the Catalog item. `app.routes.ts` gains a
  wildcard route, last, rendering a translated not-found page in the main
  region with a link to `/board` (`shell.notFound.*` keys): this is the
  first order to change that file since WO-013 boarded the unknown path
  (WO-013-D007: `/tools/x` today fails the initial navigation, leaves the
  main region empty and shows the generic error notice).
- **Report** (`npm run catalog:report`): prints the summary's counts and the
  first three tools per work; the evidence README carries its output.
- **Documents:** `docs/dev-reference/architecture/catalog.md` (the schema,
  the allow-list, the fan-out procedure, the checkpoint rule, how a new work
  enters the catalog) and `docs/ai-reference/catalog-rules.md` (a tool's five
  faces; the enum is closed and grows only by decision; ids, short titles and
  generic terms only; no quarantine file).

Rejected: committing the map rows as they are (axis: the operator's
clean-room rule for these orders; the run's definitions, relations and
hooks stay in intake); one worker over all rows (axis: the operator's cap and
the checkpoint rule; a failed batch reruns alone); an open transform string
(axis: the ledger's rule the run cites, that executable items need typed
composition; a row without a typed transform is browsable, never executable);
loading the catalog over HTTP now (axis: no store or API exists; the loader's
interface is the seam and the store member replaces the imports).

Live-run surfaces at the base: WO-006's served production build and
Storybook; WO-007's MSW worker; WO-013's menu.

**Deliverables:** the types and schema; the eight data files and the summary;
the catalog library with its kit; the three scripts and the two npm scripts;
the Tools feature with its route, pages and stories; the menu item; the two
documents; `docs/evidence/WO-014/` with the fan-out record.

Repair additions (D016): the menu secondary entry point and route-local overlay
providers; bundle graph/browser regressions and package attribution; curated
Ramda/Ramda Adjunct exports; a controlled filter-menu composite and composable
selectors; the local browser sampler and performance policy; the operator's
reusable guidance and planning/core-request handoff. The declared budgets stay
unchanged; routine future calibration uses recorded evidence rather than an
automatic operator escalation or threshold increase.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-014; read `node
   scripts/harness.mjs usage <session>` and record the subagent remainder.
2. Generate `libs/shared/catalog` (`scope:shared,type:data-access`) and
   `libs/features/tools` (`scope:dotln,type:feature`) with logged commands
   and testing entry points. Check: `npx nx show projects` lists both.
3. `libs/shared/models/src/lib/toolbox.ts` and
   `libs/shared/catalog/src/schema/tool-v0.schema.json`; a spec compiles the
   schema and refuses a row carrying `definition`. Check: `npx nx run-many
   -t test -p models catalog` exits 0 (the multi-project form Nx parses;
   `npx nx test a b` runs only the first project, WO-013-D005).
4. `tools/scripts/catalog/check-catalog.mjs`, `merge-checkpoints.mjs`,
   `report.mjs`; `npm run catalog:check` and `catalog:report`;
   `check:fixtures` runs the catalog check after the board check; a negative
   fixture under `tools/lint-fixtures/catalog/` (a row with a definition)
   fails the check in `test:tooling`. Check: `npm run test:tooling` exits 0.
5. Compute and record the SHA-256 of each of the eleven map files; write the
   classifier brief (the type, the enums, the allow-list, the quarantine
   rule, the output path) into `docs/evidence/WO-014/fan-out.md`. Check:
   the brief names no absolute path.
6. Dispatch the eight classifiers (one per batch) and merge each checkpoint
   as it returns; `npm run catalog:check` after each merge. Check: eight
   checkpoints merged; the row total equals 3,463.
7. Dispatch the two sampling checkers; rerun the named ids per batch; merge.
   Check: every checker finding has a disposition in the decisions file.
8. Dispatch the synthesizer; write `catalog-summary.json`. Check:
   `npm run catalog:report` prints six works with up to three typed tools each
   and explicit shortfalls (criterion 3 as amended by the operator).
9. Dispatch the critic; dispose its findings in the decisions file. Check:
   the evidence README lists twelve or fewer workers with their statements.
10. `CatalogLoader`, filters, `provideCatalog()`, `CatalogToken`, the test
    kit; specs over a small fixture catalog. Check: `npx nx test catalog`
    exits 0.
11. `libs/features/tools`: `toolsRoutes`, the Tools home, `catalog-page`,
    `ToolsFacade`, `tool-list`, `tool-faces`, the filters, stories; `BasePaths.Tools`,
    `ChildPaths.Catalog`; the lazy route in `app.routes.ts` and the wildcard
    not-found route last in that file; the Catalog menu item in `app.ts`;
    `tools.*` and `shell.notFound.*` i18n keys. Check: `npx nx test tools`
    and `npx nx build dotln --configuration=production` exit 0, a core
    routes spec asserts an unknown path renders the not-found page, and the
    production build's lazy chunks for the catalog data are listed with
    their sizes in the evidence README.
12. e2e `apps/dotln-e2e/src/catalog.spec.ts`: `/tools/catalog` lists tools;
    filtering by work and by transform kind narrows the list; an untyped
    tool shows its reason; `/tools/nope` renders the not-found page with a
    link back to `/board`; axe; no overflow. Check: `npx nx e2e dotln-e2e`
    exits 0.
13. Documents: `catalog.md`, `catalog-rules.md`, pointers from the two
    README files, `conventions.md` gains the catalog rule. Check: files
    exist; `npm run i18n:check` exits 0.
14. Gate plain and review. Check: passing rows, no tracked-byte mutation.
15. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains the catalog loader and the Tools route; WS-001's
    delivery states updated by the final review. Check: `npm run test:docs`.
    Then the publish, review and records steps as WO-007 steps 15 to 17,
    with the branch `feat/toolbox-catalog`, the title `feat: add the toolbox
    catalog and its browser`, `docs/evidence/WO-014/` and
    `docs/final-reviews/WO-014/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run catalog:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npm run typecheck:foundations`,
`npx nx e2e dotln-e2e`; in the launchpad order worktree `npm run test:docs`;
then the target gate plain and review once each.

For this repair, also run `npm run perf:sample` and retain all five local samples
per journey/profile, their environment and limitations. Timing data starts as
diagnostic evidence; the structural and scripted behavior assertions block.

**Acceptance criteria (all required)**

1. `npm run catalog:check` exits 0 over the eight data files, and the summary
   it validates records a row total of 3,463 across eleven map files with
   their SHA-256 digests and no absolute path.
2. `node tools/scripts/catalog/check-catalog.mjs tools/lint-fixtures/catalog/with-definition.json`
   exits nonzero, and `grep -rlE '"(definition|related|dotlnHooks|verified)"' libs/shared/catalog/src/data`
   prints nothing.
3. `npm run catalog:report` exits 0 and prints, for each of the six works,
   a primary scene type and up to three tools whose transform kind is a member
   of `TransformKind`. It records the shortfall from three explicitly. A spec
   asserts the valid typed examples and the correctly computed shortfall over
   `catalog-summary.json`. Each example retains its own applicable scene types;
   the work's primary scene is a recommendation, not a constraint on every example.
4. Every row's `status` is `typed`, `untyped` or `background`; every `typed`
   row's `transform.kind` is a member of `TransformKind`; every `untyped` row
   carries a non-empty `reason`; a spec iterates every data file and asserts
   these three.
5. `docs/evidence/WO-014/README.md` lists at most twelve workers with their
   labels, batches, row counts and one-line statements, each statement
   saying no quarantine file was read, and records the subagent count from
   `node scripts/harness.mjs usage <session>` at handoff.
6. `npx nx e2e dotln-e2e` exits 0 and includes: `/tools/catalog` rendering a
   list; a filter by work narrowing it; a filter by transform kind narrowing
   it; an untyped tool showing its reason; an unknown path (`/tools/nope`)
   rendering the not-found page with a link back to `/board`; axe at the
   board spec's threshold; no horizontal overflow at 360, 768 and 1440.
7. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets, and the evidence README records the size of each lazy
   catalog chunk.
8. `docs/dev-reference/architecture/catalog.md` and
   `docs/ai-reference/catalog-rules.md` exist, and the rules file states
   that the transform enum grows only by a recorded decision
   (`grep -c "decision" docs/ai-reference/catalog-rules.md` is at least 1).
9. `node scripts/target-gate.mjs WO-014 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-014/README.md`, `docs/evidence/WO-014/fan-out.md` and
`docs/evidence/WO-014/host-qualification.md`.

**Known issues and carry-ins:** The base line is provisional and publishes right under starter v0.96.1 (the merge-base publish of core WO-230; WO-013's fix dispatch is its first use in this fork); a pass may set it to the predecessor's merge commit. The map files are ignored intake that may change
between this pass and activation; the executor computes the digests at read
time and records them, and a changed count is a decision, never a silent
renumbering. The run's own README says many map rows are the mapping
worker's reading rather than verified text (PoEAA most of all); a classifier
types what the row says and the critic names rows that look wrong; checking
rows against the books is not this order's. Workers run under the launchpad's
`subagentCap` with the executor's own session counted; the operator may
name Fable on the dispatch line. Starter v0.96.1's plan gate no longer advises on this order's own launchpad record paths (core's answer of 2026-10-24, item 1); they stay as the kit names them and the publish command's body file must not name them. From receipt 008 (the
2026-10-24 pass's refutation), carried into this text by the 2026-10-24
second pass: the catalog is bundled JSON while the board is HTTP, two data
paths until the mining store (candidate C1) states one rule, and the
loader's interface is the seam that keeps the difference out of every
feature; a rerun is the batch's own worker continued and counts once under
the twelve; and a checker's observability judgment is the counter-pressure
on criterion 3's quota, so a short work is recorded, never force-fitted, and
criterion 3 is then amended on the operator's word rather than met by a
wrong transform. From WO-013's verification and final review, carried into
this text by the 2026-10-25 pass: the app's unknown-path handling, unchanged
since the scaffold, is this order's to fix because it is the first to change
`app.routes.ts` (WO-013-D007; the design, steps 11 and 12, criterion 6), and
every multi-project check is written in the `run-many` form (WO-013-D005;
step 3). This order activates only on a launchpad whose
starter carries core WO-221's `--draft` form; the draft pull request and its
workflow runs are a final-review obligation read from
`docs/evidence/WO-014/preview-pr.json`, never a criterion. `Target release
classification: minor` and `Target release notes: reviewed` were set by the
2026-10-24 pass under WO-012's declared policy.

**Non-goals:** the scene engine or any tool's execution (WO-015); mining a new
work (WO-018 maps The Art of War); the mining store and the HTTP API
(candidate C1); a clarify dialog with a live agent; checking model-knowledge
rows against the books; copying any definition, relation or hook from the
run.

**Operator-review assumptions:** the operator accepts the closed transform
enum as the executable floor and the allow-list as the clean-room rule made
mechanical, accepts the fan-out's cost, and reads the one draft pull request
before final review, which the final publish reuses.
