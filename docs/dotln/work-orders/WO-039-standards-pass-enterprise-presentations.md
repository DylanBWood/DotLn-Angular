# WO-039 — Standards pass II: the enterprise pattern studies and the `states` family read as the example an executable-model batch copies, the reviewers' deferred shapes replaced by lookup tables, shared helpers and one loader, Foreign Key Mapping's read limit repaired, the narrow register's headings decided and the token rule written, with every output unchanged

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3
**Target release classification:** patch
**Target release notes:** reviewed
**Cost:** edits the sixteen `*.presentation.ts`, sixteen `*.simulation.ts`
and sixteen `*.model.ts` modules of the enterprise batch (WO-023's) under
`libs/features/tools/src/lib/studies/poeaa/` and their specs, the `states`
builder `libs/features/tools/src/lib/studies/states.ts`, the family under
`libs/features/tools/src/lib/composites/study-visuals/states/`, the tools
test kit `libs/features/tools/testing/src/lib/tools-test-kits.ts` (the two
executable-study loaders become one), `libs/features/tools/src/lib/studies/study-model.ts`
(`TimelineModel`'s x values named for what they hold), the study check
`tools/scripts/catalog/check-studies.mjs` (the states rule in a function of
its own), the messages in `apps/dotln/public/i18n/studyPoeaa/en.json` where a
key or a placeholder changes with the testing copy `tools/i18n-copies.test.mjs`
judges, and the documents that describe them (`catalog.md` §The models and
§The families, `catalog-rules.md`); about 60 source files; no new page,
family, route, composite or dependency. Removes the fifteen presentations'
switch-with-default name lookups and nested-ternary token letters, their own
list-joining and null-dropping idioms, record-set's positional transition
helper and the second loader. Wall-clock: about 3 h 0 min to 5 h 0 min of
executor work plus the fixed cycle (WO-034's reshape of twenty first-batch
presentations, its guards, drawing and wall study ran 1 h 45 min from
activation to handoff; this order's list is longer per module and its modules
fewer); unknown until run. Context bytes: the 48 enterprise source files
(6,015 presentation, 3,344 simulation and 401 entry lines by `wc -l`, about
390 KB) and their 16 specs, the states builder and family (about 1,150
lines), `catalog-rules.md`, `catalog.md` §The models and §The families,
WO-023's decisions D012, D016, D017 and D019 and FINAL-001 in the target's
`docs/dotln/`, WO-034's `shape-audit.mjs`, `crawl.mjs` and `compare-dom.mjs`
in this launchpad's `docs/evidence/WO-034/`, this order; about 650 KB for the
executor. Commands added: none. Tokens: unknown until run. Steps: 11.
Re-mints: none. Refutations paid: this pass's receipt.
**Nomination provenance:** WS-001 rule 31 (the operator's direction of
2026-11-05, journal row 2026-11-05T15:26:03Z, SHA-256
`4d21fba1ced2decdbfa1a96d947c802d4090948955eb7e30130780eac3c5c532`; ignored
capture `docs/intake/notes/planning-2026-11-05.md`): coding standards are a
dedicated pass that occurs often, over the code the orders since the previous
pass landed, read as the example other Angular developers are meant to copy;
the operator's direction of 2026-11-05 that beautiful, efficient code is the
goal (ignored capture `docs/intake/notes/wo028-shared-repair-2026-11-05.md`,
SHA-256 `180dfe1299ad9e796db9c0801065d16355ed05f413caaa255c9b1de1cdb0b607`;
WO-028-D042); WO-023's reviewers' and final reviewer's deferrals to this pass
(WO-023-D012, D016, D017 and D019, in the target's
`docs/dotln/evidence/WO-023/decisions.md`); register rows
`FUP-54793e1f600d5c5d`, `FUP-762c13bca9cf4a31`, `FUP-66323999ef4b69aa` and
`FUP-ddae97970891fbc1` allocated by the
[2026-11-07 pass](../planning/passes/standard-pass-v0-120-1-standards-orders-core-answers-2026-11-08.md)
(D3); WO-034's known issues, which give the next standards pass whatever the
pair lands. Planner-synthesized. Opaque identifier, not a priority.
**Depends on:** WO-023 merged (hard: the enterprise batch, the `states`
family, the embodiment rule and the executable-model rule this pass reads;
merged as DotLn-Angular #17, released as `DotLn Angular v0.11.0`); WO-034
merged (hard: the reshape rule, the shared formatter, the description-object
shape and the tightened corpus test the reading is held to; merged as
DotLn-Angular #16, released as `DotLn Angular v0.10.2`).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-023",
    "relation": "hard",
    "reason": "the twenty enterprise pattern studies, the states family, the embodiment rule and the executable-model rule this standards pass reads and reshapes"
  },
  {
    "workOrderId": "WO-034",
    "relation": "hard",
    "reason": "the reshape rule, the shared number formatter, the description-object shape and the tightened corpus test the reading is held to"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 7, 9, 13, 23, 24, 30 and 31; §The app and its sub-apps, G3);
`docs/operator/README.md` (§What the operator wants: beautiful, efficient
code; coding standards as a dedicated pass; §DotLn-Angular's code);
`docs/repositories/dotln-angular.md` (§Run the app and its checks, §Run
content workers, §Publish a change); the target's
`docs/ai-reference/catalog-rules.md`, `docs/dev-reference/architecture/catalog.md`
§The models and §The families and `docs/dev-reference/workspace/conventions.md`
§13; WO-023's decisions D012, D016, D017 and D019 and FINAL-001 in the
target's `docs/dotln/`; WO-034's evidence in this launchpad's
`docs/evidence/WO-034/` (`shape-audit.mjs`, `crawl.mjs`, `compare-dom.mjs`,
`README.md`).

**Objective:** (the operator's session, WS-001 rule 24, with the code as the
surface) a colleague opens any enterprise presentation module, say
`gateway.presentation.ts`, and reads it top to bottom: a state's or an
object's display name and its token letter come from one table keyed by the
study's id union, which the compiler checks, not from a `switch` with a
`default` branch that can never run; a list of names is joined by the shared
`listOf`; an on/off input is a boolean read by one helper; a move names its
transition only where two transitions join its states; a comparison run
arrives inside the run description; Gateway's success rule is the one
function Service Stub imports; the model's spec drives the mechanism and
never the register drawing. They open Foreign Key Mapping and read a
simulation that stops on its read limit only when the next key needs a read.
They open Service Layer at 360 and read the narrow register's headings in the
form this order decided, with the decision beside it in the catalog
document. Nothing else on screen has moved: the same frames, the same words,
the same numbers. They read `catalog-rules.md` and find the rule that a
drawing's token letters are symbols with the translated name beside them.
What the operator learns is that the enterprise batch now reads like the
example the next executable-model batches copy (WO-031 first); what they
decide is when the states family's deferred A/B rounds run.

**Observed gap (dated 2026-11-07 at `f99580f`):** measured with WO-034's
`shape-audit.mjs` over `libs/features/tools/src/lib/studies/` at the target's
`main` (run from the launchpad with the target's TypeScript 6.0.3 installed
in session scratch, since the registered base checkout installs no
dependencies): the enterprise group has 48 source files and 764 functions,
none with more than four parameters, one at 70 or more counted lines
(`pessimistic-offline-lock.presentation.ts`'s `shapeOf`, 71), and its
messages are nested with named placeholders (1,763 strings in
`studyPoeaa/en.json`); on the measures WO-034 set, the batch is clean. What
the measures do not see, WO-023's reviewers read and deferred to this pass.
WO-023-D016: fifteen presentations look names up with `switch` statements
that carry a `default` branch for a case the id union excludes (69 `switch`
statements across the sixteen presentations by `grep -c "switch ("`, sixteen
files with a `default:` branch) and read token letters from nested ternaries;
they join lists with their own helpers where `listOf` exists (three of
sixteen import it); on/off parameters are typed loosely; a move names a
transition where only one joins its states; `registerOf` and `placeOf`
return `string`; comparison runs are passed outside the run description;
Gateway's success rule is repeated in Service Stub; record-set keeps a
positional transition helper; `loadFlowStudy` and `loadStatesStudy` in
`tools-test-kits.ts` differ by a type; `TimelineModel`'s x values are
unnamed; and model specs read the register drawing. WO-023-D017: a state
name wider than its column is drawn smaller at 360 (Service Layer's Announced
at about 6.5 pixels) with no test that the template applies the column's
scale, no guard for a label with no words, the states drawing rule inside
`check-studies.mjs`'s `rxjsProblems`, `moveSentence` joining names without
`listOf`, and Gateway's narrow note measured by a conservative metric.
WO-023-D019 (FINAL-001 F9): Foreign Key Mapping's simulation compares the
loader's reads with the read limit instead of the keys still to resolve, so
a limit of three or less would cut the identity-map run short; the limit is
fixed at six and no input reaches it. WO-023-D012: whether the drawing
families' token letters are translatable text is undecided across the
families. The target's `catalog-rules.md` says critics read the actual code
and a dedicated standards pass reads each landed batch and the code added
since the preceding pass.

**Design:**

- **Lookups as tables.** A display name, a token letter and a state's tone
  come from one `Record` per study keyed by the study's id union, so the
  compiler refuses a missing or an extra entry and no `default` branch
  exists for a case that cannot occur; Unit of Work's names and tokens,
  which D016 made tables the compiler checks, are the shape the fifteen
  others take. A presentation keeps the reshape rule WO-034 set: one
  description object, a frame, a translator or a selection, at most four
  parameters; named interfaces; the shared formatter; nested keys with
  placeholders named for what they hold; a function as long as its job.
- **Shared helpers over local idioms.** `listOf` joins every list,
  `moveSentence` included; the builder drops nulls; one helper reads on/off
  booleans; the states builder infers a move's transition when exactly one
  joins its states and refuses an ambiguous move when it builds, with a
  spec for each; `registerOf` and `placeOf` return their state unions;
  comparison runs travel in the run description; Gateway's success rule is
  one exported function Service Stub imports; record-set's positional
  transition helper goes; `loadFlowStudy` and `loadStatesStudy` become one
  loader over the executable-study type; `TimelineModel`'s x values are
  named for what they hold (a step, a second, a count), the consumers
  following.
- **The one logic repair** (D019). Foreign Key Mapping's simulation stops
  on its read limit only when the next key needs a read, so a limit of
  three or less no longer cuts the identity-map run short; the study's
  example keeps its limit of six and its run, and a spec pins limits of one
  to three against the keys still to resolve.
- **The narrow register** (D017). `catalog.md` already says a state name
  wider than its column is drawn smaller at the narrow width; this order
  decides, in its decisions, whether such a name breaks, abbreviates or
  keeps a floor size, implements the decision, tests that the template
  applies the column's scale, guards `columnsOf` against a label with no
  words, and measures Gateway's narrow note against its column with real
  glyphs. The decided rendering at 360 is the one admitted output change
  and the evidence lists its frames. If the dedicated A/B testing pass
  (`FUP-02c1ebe8146fe2f1`) has redrawn the states register before this
  order activates, its pick stands and this item is a decisions record.
- **The token rule** (D012). Token letters stay symbols in all three
  drawing families, shown through the house symbol template with the
  translated name beside them: the marble letters are the TestScheduler's
  syntax and the flow and states tokens are machine identifiers, which G3
  keeps with display labels supplied by messages, and a translated symbol
  would part the drawing from the spec that reads the same strings.
  `catalog-rules.md` states the rule; the executor who finds a family where
  it fails records why in the decisions instead of translating one family
  alone.
- **The check's home.** The states drawing rule leaves `rxjsProblems` for a
  function named for it (`statesProblems`), the tooling test's outcome
  unchanged.
- **Every output unchanged.** WO-034's production crawl and comparator (`crawl.mjs`, `open-study-details.mjs`, `compare-dom.mjs`), copied into this order's evidence and adapted as this order's own scripts, the historical WO-034 copies and their pins left as they are: the crawl enumerates the enterprise studies from `studies-summary.json`, steps the sixteen with a `states` drawing through the family's step control to every moment, reads the four structural records as text, and pins the record count at twenty, capturing at 1440 and at 360 since the admitted change is the narrow register's; the comparator takes that inventory and permits differences only in the narrow-register frames the decision names. It runs at the integrated base and at the candidate; the two text-node sequences are equal outside those frames; a control run of the comparator over the base crawl and a copy of it with one unrelated text node changed exits non-zero, so the comparator is shown to refuse a difference it does not permit; every enterprise model spec
  keeps its assertions; the corpus test, `studies:check`, `i18n:check` and
  `test:tooling` stay green; the catalog's visual baselines are unchanged,
  or the 360 baseline is regenerated with the heading decision named in
  the decisions and the pull request.
- **The measure.** `shape-audit.mjs` before and after over
  `studies/poeaa/`: the batch stays at zero functions over four positional
  parameters, a function at 70 counted lines or more carries the
  executor's one-line judgment that it does one job and reads whole, and no
  parameter-count lint or lower line ceiling is added (WO-028-D060's
  reason: a count invites the next mechanical split; the standards pass
  reads).
- **Documents.** `catalog.md` §The models states the lookup-table shape,
  the inferred transition and the one loader; §The families states the
  narrow register's decided rule; `catalog-rules.md` states the token rule
  and the lookup-table sentence.

Rejected: a parameter-count lint rule or a lower line ceiling (axis:
D060's reason; the standards pass is the reader); folding this reading into
WO-031, the next enterprise research batch (axis: the operator's direction
of 2026-11-05, a dedicated pass and never an afterthought inside a batch,
and WS-002 rule 6, which has the batch copy a reshaped example); reading
the second movement batch and the stream batches in this order (axis:
WO-040 takes them on disjoint surfaces, so WO-024 waits only for the
example its executable models copy); a message per token letter (axis:
D012's reason, the three families would split and the marble letters are
syntax); redrawing the states register here (axis: the A/B testing pass
the operator asked for on 2026-11-07, WO-023-D008, owns the pair).

Live-run surfaces at the base: the catalog with a hundred studies in the
five landed families; the twenty enterprise studies with the `states`
register and the sixteen running models.

**Deliverables:** the reshaped enterprise modules and their specs; the
states builder's inference and refusals; the one loader; the repaired
Foreign Key Mapping simulation with its spec; the narrow register's decision
with its tests; the token rule; `docs/evidence/WO-039/` with
`shape-audit-before.json`, `shape-audit-after.json`, `dom-diff.json`, the
Foreign Key Mapping control, `walkthrough.md` and the verifier's reading,
the reading critic's record if the heading decision changes a drawing; the
two documents.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-039: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor
   f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3 origin/main` exits 0 (a `main`
   that does not contain the pin stops for a planning pass); the target worktree then fast-forwards to the target's `main`, and that integrated commit is the baseline of every later comparison, recaptured by step 2's crawl after any later integration of the target's `main`; then the route guard and activation as WO-005 step 1. Check: the decisions carry the integrated commit.
2. The audit and the crawl before: copy `docs/evidence/WO-034/shape-audit.mjs`, `crawl.mjs`, `compare-dom.mjs` and `open-study-details.mjs` into `docs/evidence/WO-039/`, adapt the crawl and the comparator to the enterprise inventory and this order's permitted differences as the Design states (the historical copies untouched), and record each script's source path, the launchpad commit it was copied from and the invocation that produced each file in the evidence README; run the audit over `studies/` at the integrated base into `shape-audit-before.json` and the adapted crawl over the twenty enterprise studies into `dom-before.json`. Check: both files exist, the before counts for the `poeaa` group match this order's Observed gap (764 functions, 0 over four positional parameters, 1 at 70 or more), and the crawl's record count is twenty.
3. The shared pieces: `listOf` in `moveSentence`; the builder's transition
   inference and its ambiguity refusal with their specs; `registerOf` and
   `placeOf` returning state unions; the one loader in `tools-test-kits.ts`
   with the flow and states specs moved onto it; `TimelineModel`'s x values
   named with their consumers; the states rule in `statesProblems`. Check:
   `npx nx test tools` and `npm run test:tooling` exit 0.
4. Presentations one to eight reshaped under the Design: lookup tables,
   `listOf`, the boolean helper, comparison runs in the run description,
   Gateway's rule shared with Service Stub, the specs kept off the register
   drawing. Check: `npx nx test tools` and `npm run i18n:check` exit 0; the
   crawl over those eight studies equals `dom-before.json` for their frames.
5. Presentations nine to sixteen likewise, record-set's positional
   transition helper removed. Check: as step 4; the audit after over
   `studies/poeaa/` prints 0 functions over four positional parameters and
   lists each function at 70 lines or more beside its judgment.
6. Foreign Key Mapping's loop, with a spec at read limits of one to three;
   the control: the same spec run on a scratch copy carrying the base's
   `foreign-key-mapping.simulation.ts`, both arms' exit codes recorded in
   the evidence README. Check: the spec passes on the candidate and fails on
   the control.
7. The narrow register: the decision recorded, implemented and documented;
   the spec that the template applies the column's scale; the empty-label
   guard; Gateway's narrow note measured with real glyphs; where the
   rendering changes, the reading critic over the changed drawing (one
   launch under the profile's worker rules) with its findings disposed.
   Check: `npx nx test tools` exits 0; the catalog's 360 baseline unchanged
   or regenerated with the decision named.
8. Documents: `catalog-rules.md` (the token rule, the lookup-table
   sentence) and `catalog.md` §The models and §The families. Check:
   `grep -c "symbol" docs/ai-reference/catalog-rules.md` is at least 1.
9. The adapted crawl after over the twenty enterprise studies into `dom-after.json` and the diff into `dom-diff.json`; the comparator's control (the base crawl against a copy of it with one unrelated text node changed) recorded with its exit code. Check: zero differing text nodes outside the frames step 7 names; the control exits non-zero.
10. Dependency check as WO-015 step 15; `npm run check:bundle`; gate plain
    and review. Check: passing rows, no tracked-byte mutation.
11. Launchpad write-back (WS-001's delivery states; the profile's
    implementation map row for the test kit's loader where its name
    changes), then the publish, review and records steps as WO-007 steps 15
    to 17, with the branch `refactor/enterprise-pattern-presentations`, the
    title `refactor: reshape the enterprise pattern studies into the example
    to copy`, `docs/evidence/WO-039/` and `docs/final-reviews/WO-039/`; the
    final reviewer commits the order's records on the order branch before
    `npm run resume -- target-records` (the profile's publish route, step
    3). Check: `npm run test:docs` in the launchpad order worktree.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test`, `npm run i18n:check`, `npm run studies:check`,
`npm run test:tooling`, `npm run check:bundle`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24, the code as the surface).** The verifier performs the Objective's reading on the candidate in the target worktree: three enterprise presentation modules chosen at random (the command and its output
   recorded), read top to bottom, and Foreign Key Mapping's and Service
   Layer's studies opened in the served production build at 360 and at the
   operator's sizes (rule 29) and stepped. The VER report carries a
   `## Walkthrough` section with the dated steps and the frames at those
   sizes under `docs/evidence/WO-039/walkthrough/`, and states in the
   verifier's own words how each read module finds a display name and a
   token letter, what Foreign Key Mapping's limit now counts, and what the
   narrow register's headings do at 360. Met only when every step completed
   and that statement is present.
2. `docs/evidence/WO-039/shape-audit-after.json`, produced by the evidence
   directory's `shape-audit.mjs` over `libs/features/tools/src/lib/studies/`
   at the candidate, lists zero functions of the `poeaa` group with more
   than four positional parameters (a single description object counts as
   one) and lists each `poeaa` function at 70 counted lines or more beside
   the executor's recorded judgment that it does one job and reads whole
   (the evidence README carries the judgments); `shape-audit-before.json`
   from the integrated base records the Observed gap's counts; and
   `grep -c "switch (" libs/features/tools/src/lib/studies/poeaa/*.presentation.ts`
   prints 0 for each of the sixteen files, the evidence README naming each
   presentation's lookup table, its `listOf` use and its boolean helper.
3. Every output is unchanged: `docs/evidence/WO-039/dom-diff.json`, produced by the evidence directory's adapted crawl and comparator over every frame of the twenty enterprise studies at the integrated base and at the candidate, records zero differing text nodes outside the narrow-register frames the decisions file names; every
   enterprise model spec passes with its mechanism assertions retained and
   none reads the register drawing; the comparator's control exits non-zero (recorded in the evidence README with its command); and `npx nx e2e dotln-e2e` passes with the catalog's visual baselines equal to the latest integrated `main`'s, except the 360 baseline where the heading decision changed it, regenerated with the decision named in the decisions file and the pull request (a sibling's regenerated baselines that an integration brings are recorded in the decisions file as the sibling's).
4. The states builder infers a move's transition when exactly one joins its
   states and refuses an ambiguous move when it builds, each with a spec
   that passes on the candidate; `registerOf` and `placeOf` return their
   state unions (the signatures recorded in the evidence README); and
   `tools-test-kits.ts` exports one loader for executable studies, with
   `grep -c "loadStatesStudy\|loadFlowStudy" libs/features/tools/testing/src/lib/tools-test-kits.ts`
   printing 0 and every flow and states spec importing the one loader.
5. Foreign Key Mapping's spec at read limits of one to three passes on the
   candidate and fails on the control that carries the base's simulation,
   both arms' exit codes recorded in the evidence README with the commands
   that produced them, and the study's default run is unchanged frame for
   frame in `dom-diff.json`.
6. The decisions file records the narrow register's decision (break,
   abbreviate or a floor size) with its reason; a spec asserts that the
   template applies the column's scale; a spec drives `columnsOf` with a
   label that has no words and the drawing throws nothing and draws no
   heading at size zero; and Gateway's narrow note's measurement against
   its column with real glyphs is recorded in the evidence README.
7. `docs/ai-reference/catalog-rules.md` states that a drawing's token
   letters are symbols shown through the house symbol template with the
   translated name beside them and are not translated
   (`grep -c "symbol" docs/ai-reference/catalog-rules.md` is at least 1),
   `docs/dev-reference/architecture/catalog.md` §The models states the
   lookup-table shape, the inferred transition and the one loader, and
   `tools/scripts/catalog/check-studies.mjs` holds the states drawing rule
   in a function named for it (`grep -c "statesProblems"
   tools/scripts/catalog/check-studies.mjs` is at least 1) with
   `npm run test:tooling` passing.
8. `node scripts/target-gate.mjs WO-039 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-039/README.md`, the two
audits, `dom-diff.json`, the Foreign Key Mapping control's record,
`walkthrough.md` and its frames, and
`docs/evidence/WO-039/host-qualification.md`.

**Known issues and carry-ins:** This is the second standards pass under
WS-001 rule 31, over the batch that landed since the first; WO-040 reads the
second movement batch, the first batch's residue and the stream batches on
disjoint surfaces, and the two orders may run in either order or beside
each other. The next enterprise research batch, WO-031, activates after
this order merges (WS-002 rule 6; its hard edge on this order), so its
authors copy the reshaped batch. The states family's deferred A/B rounds
belong to the dedicated A/B testing pass the operator asked for on
2026-11-07 (WO-023-D008, `FUP-02c1ebe8146fe2f1`); where that pass has run
first, its pick governs the narrow register and this order's step 7 is a
record. No page changes beyond the narrow register's decided rendering, so no paired comparison runs (rule 25); the use criterion reads code and two studies. A sibling that merges while this order runs (WO-029 or WO-030) is integrated before the handoff and again before the final publish; the before-crawl is recaptured at the new base, and a sibling's regenerated catalog baselines are the sibling's, recorded in the decisions. Before `target-records`, the final reviewer commits the order's
records on the order branch so the launchpad commit the filed records'
footer names holds them (the profile's publish route, step 3; core's route
until its WO-259 lands). This order activates only on a launchpad whose
starter carries core WO-221's `--draft` form; the draft pull request and its
workflow runs are a final-review obligation read from
`docs/evidence/WO-039/preview-pr.json`, never a criterion. `Target release
classification: patch` and `Target release notes: reviewed` are set under
WO-012's declared policy.

**Non-goals:** a parameter-count lint or a lower line ceiling; the second
movement batch, the first batch's residue and the stream batches (WO-040);
the states family's A/B rounds (the A/B testing pass); translating token
letters; new studies, pages, families or rounds; the mined catalog text
(WO-035); per-model catalog loading.

**Operator-review assumptions:** the operator reads the diff as the example
they mean (they read the code of an order before it is called
final-reviewed), accepts the reading criterion as a code-only order's
acceptance by use with two studies as its screens, accepts the narrow
register's decision as this pass's unless the A/B testing pass has decided
first, and accepts that token letters stay symbols across the families.


Filed from the launchpad Launchpad (its tree at commit 62c22c96685902ea42e4a65e0d7c53b3fd850af0); this record's launchpad path was docs/work-orders/WO-039-standards-pass-enterprise-presentations.md, and its relative links resolve against that path there, not in this repository.
