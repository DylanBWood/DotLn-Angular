# WO-023 — Concept studies IV: the twenty enterprise application patterns behind the app's data and state layers, from Patterns of Enterprise Application Architecture, each with a state drawing and a small executable model

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ d7d842dc4fdbde03099695933a448d9632fa4335
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/catalog/src/studies/poeaa/` (twenty records), the
`states` family under `libs/features/tools/src/lib/composites/study-visuals/states/`,
the executable TypeScript models and specs the records name under
`libs/features/tools/src/lib/studies/poeaa/`, one coverage row and one rule,
about 40 source files plus twenty data records; adds no runtime dependency.
The launchpad write-back replaces the class's explicit node_modules roots with
the released `**/node_modules` declaration and updates the profile; it deletes
no output during execution. Wall-clock: about 6 h 0 min to 10 h 0 min of executor work, of which
the fan-out runs in parallel, plus the fixed cycle; unknown until run.
Context bytes: the study record, check, families and rules as the
target's `main` leaves them at activation (WO-020's, with WO-021's,
WO-022's and WO-028's changes: the `concept-study-v1` record whose authored
text fields are message keys in the work's lazy catalog, the model split
into simulation, presentation and entry, and the study text and size
guards), `catalog.md` §Studies, the twenty catalog rows, this order,
`docs/dev-reference/architecture/events-and-state.md` and `foundation.md`
(the app's own stores, data access and persistence), about 190 KB for the
executor; each author reads two rows, the contract and the public catalog
pages it cites. Commands added: none. Tokens: unknown until run. Worker totals, the session total, stop
comparison and use count are recorded in `fan-out.md` and decisions under the
profile as process controls, outside acceptance. Steps: 12. Re-mints: none. Refutations paid before this pass: the 2026-10-30
second pass's receipt, on the text before the 2026-11-01 second pass's
authorized amendment (WO-023-D001), which this pass's fresh refutation judges.
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second.md`, SHA-256
`8e8cdbeb9b227932d9119b5a012a72086a1ebe349f368b42b0ff788d9060382e`); the
depth direction of 2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`); the
operator's standing wants (security and correctness that would hold in a
real organization; the reference workspace a colleague recognizes), which
these patterns name; register row `FUP-5f1cdfde5e860902` allocated to
WO-020 to WO-024. Planner-synthesized by the 2026-10-30 second planning pass
([planning document](../planning/passes/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D4 and D5). Opaque identifier, not a priority.
**Depends on:** WO-020 merged (hard: the record, the check, the study
composite, the addressable route and the fan-out procedure); WO-028 merged
(hard: the `concept-study-v1` record, the work catalogs, the model split and
the study guards every batch now writes to; its merge brought the four
study batches and the shared migration, which the base above includes).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-020",
    "relation": "hard",
    "reason": "the concept-study record, check, study composite, addressable route and fan-out procedure this batch reuses"
  },
  {
    "workOrderId": "WO-028",
    "relation": "hard",
    "reason": "the concept-study-v1 record, the work message catalogs, the simulation, presentation and entry split and the study guards every batch now writes to"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 7, 8, 15, 17, 23, 24, 25, 26; §The app and its sub-apps,
§Design direction); `docs/repositories/dotln-angular.md`;
`docs/product/concept-study.md`; `docs/control/budgets.json` (`subagentCap`);
the target's `catalog.md` §Studies and `catalog-rules.md` as the target's
`main` leaves them at activation (WO-020's, with WO-021's, WO-022's and
WO-028's changes), `docs/dev-reference/architecture/events-and-state.md` and
`foundation.md`; WO-020's `fan-out.md`.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog, chooses Patterns of Enterprise Application Architecture and
sees twenty studied concepts; they open Unit of Work and read its study: the
idea in plain words (one object remembers everything a business transaction
changed and writes it out once) and the situation it serves (a scene's saved
compositions written together, or not at all), a state drawing of one
example they step through as objects become new, dirty, clean and removed
with the text equivalent naming each register, the ordinary pseudocode of
registering and committing, the executable TypeScript model with the note
that it ran in the test suite, how Doctrine, Hibernate and a TypeScript ORM
name and implement it, the public catalog page and the book as references,
the limits (a long-lived unit of work holds stale objects; nothing coordinates
two units) and the nearby patterns as links (Identity Map, Data Mapper, Lazy
Load). They open Identity Map and step a lookup that hits and one that misses;
they open Optimistic and Pessimistic Offline Lock side by side and read where
each fails; they open Data Transfer Object and Remote Facade and read why the
pair exists. What the operator learns is which pattern their stores and data
access already embody, under what name, and where each breaks; what they
decide is which pattern to make explicit in the app or to show a colleague.

**Observed gap (dated 2026-10-30):** at `6268de9` the catalog carries 455
PoEAA rows (83 patterns), 3 typed, none studied; the app's own data access,
stores and persistence (`events-and-state.md`, `foundation.md`) embody several
of these patterns under other names and no page says which; no `states`
family exists.

**Design:**

- **The `states` family** (`composites/study-visuals/states/`): objects or
  records as rows and their states as columns, or a state machine as nodes
  and transitions, laid out by the model; stepping on command moves an object
  between states or fires a transition, with the text equivalent naming what
  moved and why; reduced motion steps without transition. First rendered
  pair (rule 25): A, a register table whose rows move between state columns;
  B, a state-machine diagram with the current state raised; one variable, the
  representation; both at about 2080 by 1460 and 360 (rules 25 and 29);
  the rounds continue until the operator says done.
- **Executable models**: each record's `pseudocode.executable` is
  `{ kind: 'typescript', module: 'libs/features/tools/src/lib/studies/poeaa/<slug>.model.ts' }`,
  the entry of a few lines composing `<slug>.simulation.ts` (language-free)
  and `<slug>.presentation.ts` (taking a `StudyTranslate`), together
  a small pure or in-memory model of the pattern (a unit of work over an
  in-memory store; an identity map; a lazy-loaded ghost; a lock table) with a
  spec beside it that drives the model through the study's example, whose
  states the `states` family draws from the same module; a pattern that is a
  structural choice without a mechanism to run (Domain Model, Transaction
  Script, Table Module, Template View, Page Controller, Canonical shapes)
  marks `executable: null` with its reason. The `rxjs` field is illustrative
  where a stream clarifies a pattern (Lazy Load as a deferred observable;
  Registry as a subject) and `null` otherwise.
- **Where the app embodies it**: each study's implementations begin with the
  app's own place where a pattern or its cousin lives (the SignalStores,
  `withPersistedState`, the data-access gateways, the catalog loader), named
  by repository path and stated as the author's reading of the code, never as
  a claim the pattern was designed in; then two public implementations
  (Doctrine, Hibernate or JPA, a TypeScript ORM such as MikroORM or TypeORM,
  Entity Framework) introduced on their own terms. References: the public
  catalog page of the pattern on the author's site and the book's publisher
  page, each with `accessed` and `supports`. Own words; no passage of the
  book (rule 23; the publishing decision at activation).
- **The twenty concepts**, by the pass's rule (the twenty most-related rows
  by resolved in-degree, ties toward typed rows then source order):
  `poeaa:240` Data Mapper, `poeaa:246` Unit of Work, `poeaa:218` Domain
  Model, `poeaa:254` Identity Map, `poeaa:370` Optimistic Offline Lock,
  `poeaa:377` Pessimistic Offline Lock, `poeaa:421` Registry, `poeaa:214`
  Transaction Script, `poeaa:340` Template View, `poeaa:357` Remote Facade,
  `poeaa:363` Data Transfer Object, `poeaa:408` Gateway, `poeaa:260` Lazy
  Load, `poeaa:452` Record Set, `poeaa:268` Identity Field, `poeaa:443`
  Plugin, `poeaa:226` Service Layer, `poeaa:278` Foreign Key Mapping,
  `poeaa:448` Service Stub, `poeaa:330` Page Controller. One recorded
  substitution under the rule is admitted as in WO-020.
- **The fan-out**: WO-020's authoring and critic procedure, with the
  [profile's worker-admission and accounting rules](../repositories/dotln-angular.md#run-content-workers)
  declared before any worker starts, at most twelve initial author/critic launches, with the
  factual critic also running each model's spec and checking that every
  "where the app embodies it" sentence names a file that exists at the base
  and reads as the author's reading.
- **The record and the code's shape** (WO-028's migration; WS-001 rules 9,
  30 and 31): each record is `concept-study-v1`, every authored on-screen
  field a message key in the new scope
  `apps/dotln/public/i18n/studyPoeaa/en.json` with shared narration in
  `studyCommon/`; each model's labels, notes, worked arithmetic and
  comparisons are parameterized messages with nested keys and named
  placeholders; a presentation function takes a frame, a description object
  or a translator and at most four parameters, and no function is split to
  fit the 80-line ceiling: the shape is WO-034's reshaped batch and
  WO-028's own twenty, never the first batch's as it stood before WO-034.
  The authors' and critics' briefs name rules 9, 23 and 30 and G3, and the
  critics inspect message coverage and the mechanism/presentation split
  independently of any earlier worked example (WO-028-D042; rule 30).
- **Documents:** `catalog.md` §Studies gains the PoEAA coverage row and the
  `states` family; `catalog-rules.md` gains the rule that a study naming
  where the app embodies a pattern names the file and marks the reading as
  the author's; `docs/dev-reference/architecture/events-and-state.md` gains
  one paragraph naming the patterns its stores and data access embody, with
  links to the studies.

Rejected: examples in a generic banking or e-commerce domain (axis: the
reference workspace explains itself best through its own stores); every
pattern executable (axis: a layering choice has no mechanism to run, and a
forced model misleads); a database dependency for the models (axis: an
in-memory model shows the mechanism and the gate needs no service).

Live-run surfaces at the base: the catalog with WO-020's studies and the
addressable readings.

**Deliverables:** the twenty records with their models and specs where
executable; the `states` family with its stories and specs; the coverage row,
the rule and the paragraph; `docs/evidence/WO-023/` with the fan-out record,
the review record, the link check, the walkthrough and its screenshots, and
the design record.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-023: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor <the Repository pin>
   origin/main` exits 0 (a `main` that does not contain the pin stops for a
   planning pass); the target worktree then fast-forwards to the target's
   `main`, and that integrated commit is the baseline of every later
   comparison; then the route guard and activation as WO-005 step 1; read
   the harness usage and record the subagent remainder; record the
   publishing decision as WO-020 did.
2. The `states` family with stories `StudyStates` and a spec that renders a
   four-state register to its text equivalent. Check: `npx nx test tools`
   exits 0; `npm run lint:components` exits 0.
3. The first rendered pair (A register table, B state machine) at about
   2080 by 1460 and 360; the rounds; the rejected implementation removed with its record.
   Check: `grep -c "Round" docs/evidence/WO-023/design/comparisons.md` is at
   least 1.
4. Record the stop figure and the launch/re-task budget in `fan-out.md` as the
   profile directs. The authors' brief with the embodiment rule goes there; dispatch
   the ten authors; merge the twenty drafts. Check: `npx nx test tools` exits
   0 over the models' specs.
5. Dispatch the two critics; dispose the findings; rewrite through the same
   authors or apply the bounded corrections in the parent under the profile; set `checked`. Check: `npm run studies:check` and
   `npm run i18n:check` exit 0 over `studies/poeaa/` and `studyPoeaa/en.json`.
6. The link check into `docs/evidence/WO-023/README.md`. Check: every URL has
   a status.
7. e2e `apps/dotln-e2e/src/catalog.spec.ts`: PoEAA shows twenty studied; Unit
   of Work's study steps its states under reduced motion with the text
   equivalent naming the register; Identity Map's study shows a hit and a
   miss; the two lock studies open from the contents; axe; no overflow at
   360, 768 and 1440. Check: `npx nx e2e dotln-e2e` exits 0.
8. The walkthrough as WO-020 step 11, under `docs/evidence/WO-023/`. Check:
   the files exist.
9. Documents: the coverage row, the family, the rule and the paragraph.
   Check: `grep -c "embod" docs/ai-reference/catalog-rules.md` is at least 1
   and `grep -c "Unit of Work" docs/dev-reference/architecture/events-and-state.md`
   is at least 1.
10. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
    nothing; the chunk sizes recorded.
11. Gate plain and review. Check: passing rows, no tracked-byte mutation.
12. Launchpad write-back (the profile's implementation map names the `states`
    family; WS-001's delivery states by the final review). In the launchpad
    order worktree, replace the seventeen nested node_modules declarations
    and the redundant root node_modules declaration in
    `dotln.config.json` `classes.angular-nx-monorepo.disposable` with
    `**/node_modules`, supported since starter v0.112.0. Preserve every other
    declaration, the registration's judge-only policy, ignored-only selection,
    tracked-file and filesystem refusals, and journal retention. Update the
    profile's effective list and its literal-path explanation to distinguish
    this pattern. Preserve the closed WO-021/WO-022 evidence and historical
    exact-root assertions. Record the probe below in `cleanup-declaration.md`;
    no deletion or target writer is part of this write-back. Then the publish,
    review and records steps as WO-007 steps 15 to 17, with the branch
    `feat/poeaa-concept-studies`, the title `feat: add concept studies for
    the enterprise application patterns`, `docs/evidence/WO-023/` and
    `docs/final-reviews/WO-023/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run studies:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session in
   the served production build: open Tools, Catalog; choose Patterns of
   Enterprise Application Architecture and read the studied count; open Unit
   of Work and step its states, expand the pseudocode, the executable model
   and the limits; open Identity Map and step a hit and a miss; open the two
   offline locks; open Data Transfer Object and Remote Facade. The VER report
   carries a `## Walkthrough` section with the dated steps and the
   screenshots at 360, 768, 1440 and the operator's sizes (rule 29) under
   `docs/evidence/WO-023/walkthrough/`
   (`ls docs/evidence/WO-023/walkthrough | wc -l` prints at least 15), and
   states in the verifier's own words what a unit of work tracks, what an
   identity map prevents, and when an optimistic lock is the wrong choice, as
   read from the studies alone. Met only when every step completed and that
   statement is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/poeaa/`
   with exactly the twenty ids this order names (or one recorded
   substitution), every record `checked` with at least two reviewers, every
   reference complete, and `studies-summary.json` current; every record is
   `concept-study-v1` with its text in `studyPoeaa/en.json`,
   `npm run i18n:check` exits 0 and the corpus test passes over the twenty
   models.
3. Every record except the four the Design names as structural choices
   without a mechanism to run (Domain Model, Transaction Script, Template
   View and Page Controller) carries `executable` naming a model entry under
   `libs/features/tools/src/lib/studies/poeaa/` that composes its simulation
   and presentation modules, with a spec beside it that imports that module
   and drives its model through the study's example; a
   recorded substitution brings in a record held to the same rule, by the
   Design's test of whether it has a mechanism to run, and the decisions
   file names which; every record with `executable: null` carries its
   reason in the decisions file (the file names each, and names no record
   outside the four and a substitution it names as structural); and
   `npx nx test tools` exits 0 with those specs.
4. The candidate studies cite supported, reachable references and embody the
   app accurately. Run `cat docs/evidence/WO-023/review.md docs/evidence/WO-023/README.md`:
   every critic finding has a disposition, every reference and
   implementation URL has its observed link-check status, and no candidate
   record cites a URL recorded unreachable or a reference the factual critic
   marked unsupported. The review record lists, per study, the app file its
   embodiment sentence names and the critic's confirmation that it exists at
   the integrated base. Worker accounting remains the profile's process duty.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 7 cases, axe at the
   board spec's threshold and no horizontal overflow at 360, 768 and 1440.
6. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the `states` family and the records in lazy chunks,
   `npm run check:bundle` passes with the chunk sizes recorded, and
   `package.json`'s `dependencies` keys equal the base's.
7. `docs/dev-reference/architecture/catalog.md` §Studies lists PoEAA with
   twenty studied; `docs/ai-reference/catalog-rules.md` states the
   embodiment rule (`grep -c "embod" docs/ai-reference/catalog-rules.md` is at
   least 1); `docs/dev-reference/architecture/events-and-state.md` names the
   patterns the stores embody with links to their studies
   (`grep -c "Unit of Work" docs/dev-reference/architecture/events-and-state.md`
   is at least 1).
8. `docs/evidence/WO-023/design/comparisons.md` records the first pair (A
   register table, B state machine), each rendered at about 2080 by 1460 and
   360, and every later round with its pick, and
   the decisions file records the operator's word that ended the rounds; the
   decisions file names the removed candidate's files and `ls` on each prints
   nothing.
9. `node scripts/target-gate.mjs WO-023 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.
10. The launchpad's effective `dotln-angular` disposable policy matches a
    root or arbitrarily nested node_modules directory, while a source path
    and a similarly named directory remain unmatched. In the launchpad order
    worktree, the following non-deleting probe exits 0; the profile's
    cleanup section describes the effective declaration and unchanged safety
    boundaries. `cleanup-declaration.md` records its output and the config diff
    showing that unrelated declarations and the judge-only policy remain intact.

    ```sh
    node scripts/harness.mjs bounded -- node --input-type=module --eval '
    import assert from "node:assert/strict";
    import { loadConfig } from "./scripts/lib/config.mjs";
    import { disposableMatchRoot } from "./scripts/lib/target-worktree-close.mjs";
    const policy = loadConfig(process.cwd()).repositories["dotln-angular"];
    assert.equal(policy.baseDisposablePolicy, "judge-only");
    assert.ok(policy.disposable.includes("**/node_modules"));
    assert.equal(policy.disposable.some(p => p === "node_modules" || p.endsWith("/node_modules") && p !== "**/node_modules"), false);
    for (const [path, expected] of [
      ["node_modules/package/index.js", "node_modules"],
      ["libs/future/deep/project/node_modules/.vite/results.json", "libs/future/deep/project/node_modules"],
      ["libs/future/deep/project/src/index.ts", null],
      ["libs/future/node_modules-backup/index.js", null],
    ]) assert.equal(disposableMatchRoot("**/node_modules", path), expected);
    console.log("cleanup declaration matches dependencies and excludes source");
    '
    ```

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-023/README.md`, `fan-out.md`, `review.md`,
`walkthrough.md` and its screenshots, `design/`, and
`docs/evidence/WO-023/host-qualification.md`; the launchpad's
`docs/evidence/WO-023/cleanup-declaration.md`.

**Known issues and carry-ins:** The 2026-11-06 pass sets the base to WO-027's
merge (#15), released as v0.10.1, which changed no file under apps/ or libs/
(the 2026-11-05 pass set it to WO-028's merge and carried the migrated
record and code shape into the Design); this order runs after WO-034, the first standards
pass, so its authors copy a reshaped batch. Step 1 still integrates the
target's current main and uses that commit for comparisons. From the 2026-11-01 pass's criteria adversary (its
R1 and R6), carried into this text by the 2026-11-01 second pass: step 1's
base guard is an ancestor check and the fast-forward, and criterion 3 names
the four records that may mark `executable: null`, because a conditional
criterion let any mechanism the Design assigns a model take that escape;
the executor reads the study record, check, families and rules as the
target's `main` leaves them, which WO-021, WO-022 and WO-028 change. This order and WO-024 are a lane pair: disjoint
surfaces, no edge, the second to publish integrates the target's `main` and
rewrites `studies-summary.json` before its publish; the operator may run them
one at a time. WO-008 (authentication and permissions) will read the
Optimistic Offline Lock, Service Stub and Gateway studies as context and owes
them nothing. The remaining sixty-odd PoEAA patterns are the next batches'
candidates (the filing pass's C3). This order activates only on a launchpad
whose starter carries core WO-221's `--draft` form; the draft pull request and
its workflow runs are a final-review obligation read from
`docs/evidence/WO-023/preview-pr.json`, never a criterion. `Target release
classification: minor` and `Target release notes: reviewed` are set under
WO-012's declared policy. The 2026-11-03 Entropy Reducer pass assigns
FUP-9a1ea6db27a8f371 to this order's launchpad write-back: core WO-252's
declaration support has shipped. WO-023-D002 records the bounded change and
why it shares this order rather than opening a separate lifecycle. The same
pass assigns REVIEW-002's ER-F5 to this order as a bounded cleanup inside
`libs/shared/catalog`, which this order already edits: remove the `tool-v0`
compatibility reader from `catalog-loader.ts` (six references at `55b59c9`),
the fake-loader branch of its spec that is the reader's only exercise, and
every standing promise of that one-release support: the sentence in
conventions rule 23, the paragraph at `catalog.md` §Loader ("accepts
tool-v0 for one compatibility release") and the rule in
`docs/ai-reference/catalog-rules.md` that names the compatibility release.
v0.4.0 shipped eight `tool-v0` data files; v0.5.0 was the one compatibility
release the reader was promised for, and no release from v0.5.0 to v0.9.0
ships `tool-v0` data, so the reader has outlived its window by four releases. The removal is checked by
`grep -c tool-v0 libs/shared/catalog/src/lib/catalog-loader.ts
docs/dev-reference/architecture/catalog.md docs/ai-reference/catalog-rules.md
docs/dev-reference/workspace/conventions.md` printing 0 for each file and the
existing catalog specs passing, and it is recorded in this order's decisions;
it adds no criterion.

**Non-goals:** refactoring the app's stores or data access toward a pattern;
a database or API dependency; the remaining patterns; the general search
controls (WO-018).

**Operator-review assumptions:** the operator accepts the in-degree selection
and the twenty patterns it names, accepts the app's own code as the first
implementation named in each study, judges the first pair and ends the rounds
in their own words, and reads the one draft pull request before final review,
which the final publish reuses.


Filed from the launchpad Launchpad (its tree at commit 330112f5a33db88037d1d4b8257441e1546296cd); this record's launchpad path was docs/work-orders/WO-023-concept-studies-poeaa.md, and its relative links resolve against that path there, not in this repository.
