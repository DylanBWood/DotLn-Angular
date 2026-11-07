# WO-034 — Standards pass I: the first movement batch's twenty presentation modules reshaped with every output unchanged, the study guards tightened, the shared motion drawing's marks tidied, the wall study shown doing its avoidance, the work catalogs trimmed and their count-led sentences reworded, read as the example other Angular developers are meant to copy

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ d7d842dc4fdbde03099695933a448d9632fa4335
**Target release classification:** patch
**Target release notes:** reviewed
**Cost:** edits the twenty `*.presentation.ts` modules of the first movement
batch (WO-020's) under `libs/features/tools/src/lib/studies/movement/` and
their specs, the shared helpers beside them (`parameters.ts`, `study-text.ts`
and whatever number-format and description-object helpers the reshape adds
under `libs/features/tools/src/lib/studies/`), the messages those modules
read in `apps/dotln/public/i18n/studyAifg/en.json` (nested keys, named
placeholders) with the testing copy `tools/i18n-copies.test.mjs` judges, the
corpus test `libs/features/tools/src/lib/studies/study-models.spec.ts`, the
shared motion drawing (`composites/study-visuals/motion/motion.html`,
`motion-labels.ts`, `motion-drawing.ts`) and its glyph regressions, the
Obstacle and wall avoidance study's simulation, presentation and record, the
stream catalogs `apps/dotln/public/i18n/studyEip/en.json` and
`studyRxjs/en.json` (the spec-only keys, the unread key and the 48 messages
where a computed count opens a sentence or a label), and the documents
that describe them (`catalog.md` §The models, `catalog-rules.md`); about
30 source files, plus WO-027's three tool scripts and their tests under
`tools/`, read and reshaped only where the rules fail; no new page, family,
route, composite or dependency.
Removes the 94 `valueN` placeholders, the twelve spec-only keys of
`studyEip/en.json`,
`studyAifg.wander.record.parameters.drawPairs`, the title rows no record or
nearby link names, and every positional-parameter split the migration
left. Wall-clock: about 4 h 30 min to 6 h 30 min of executor work plus the
fixed cycle; unknown until run. Context bytes: the forty movement modules
and their messages (about 600 KB), `catalog-rules.md`, conventions §13, the
shape audit `docs/evidence/WO-028/final-002/shape-audit.{mjs,json}`,
WO-028-D036, D037, D042, D053, D055, D060 and D061, FINAL-002 F18, this
order; about 750 KB for the executor. Commands added: none. Tokens: unknown
until run. Steps: 12. Re-mints: none. Refutations paid: this pass's receipt.
**Nomination provenance:** the operator's direction of 2026-11-05 (journal
row 2026-11-05T15:26:03Z, SHA-256
`4d21fba1ced2decdbfa1a96d947c802d4090948955eb7e30130780eac3c5c532`;
ignored capture `docs/intake/notes/planning-2026-11-05.md`): they agree
with the final review that a refactoring pass needs to occur, the app is
the pie-in-the-sky example for other Angular developers, and coding
standards are never an afterthought but a dedicated pass that occurs often
(WS-001 rule 31); the operator's route choice at FINAL-002 (ignored capture
`docs/intake/notes/wo028-final-002-route-2026-11-05.md`, SHA-256
`077cbb1fc78e5dcc4e24250b9f3ce69a1bc0d19e64e7bd0cf7392542d8543981`): pass,
reshape next, the reshape boarded as the follow-up that gates the next
movement batch (WO-028-D059, D060); the operator's direction of 2026-11-05
that beautiful, efficient code is the goal (ignored capture
`docs/intake/notes/wo028-shared-repair-2026-11-05.md`, SHA-256
`180dfe1299ad9e796db9c0801065d16355ed05f413caaa255c9b1de1cdb0b607`;
WO-028-D042); the verifier's and reviewer's follow-ups WO-028-D036, D037,
D053, D055 and D056; register rows `FUP-f2fe0f5b3ede6609`,
`FUP-18196fce63f48718`, `FUP-ead16d35dae7cde7`, `FUP-fe64fadae3ba9bae`,
`FUP-84dd7018fe2c47a7` and `FUP-b2ca88c7d6462f27` allocated by the
[2026-11-05 pass](../planning/passes/standard-pass-v0-117-0-scene-reminders-2026-11-05.md)
(D3). Planner-synthesized. Opaque identifier, not a priority.
**Depends on:** WO-028 merged (hard: the shared study migration whose
presentation modules, guards, catalogs and drawing this pass reads; merged
as DotLn-Angular #14, released as `DotLn Angular v0.10.0`).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-028",
    "relation": "hard",
    "reason": "the shared study message and model migration whose first-batch presentation modules, guards, catalogs and drawing marks this pass reshapes"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 7, 9, 13, 23, 24, 30 and 31; §The app and its sub-apps, G3);
`docs/operator/README.md` (§What the operator wants: beautiful, efficient
code; coding standards as a dedicated pass; §DotLn-Angular's code);
`docs/repositories/dotln-angular.md` (§Run the app and its checks, §Run
content workers); the target's `docs/ai-reference/catalog-rules.md`,
`docs/dev-reference/architecture/catalog.md` §The models and
`docs/dev-reference/workspace/conventions.md` §13; WO-028's decisions D036,
D037, D042, D053, D055, D060 and D061 and FINAL-002 (F18) in the target's
`docs/dotln/`.

**Objective:** (the operator's session, WS-001 rule 24, with the code as
the surface) a colleague opens any of the first movement batch's
presentation modules, say `two-level-formation-steering.presentation.ts`,
and reads it top to bottom: each function takes a frame, a description of
the study's example or a translator, never a dozen loose numbers; a worked
line is built from named values and a message whose placeholders say what
they hold; one shared helper formats every number; a function is as long as
its job and no longer, and nothing in it was cut to fit a guard. They open
the study on screen and nothing has moved: the same frames, the same words,
the same numbers. They open the wall study and watch the avoidance turn the
courier along the wall with the ray-too-short run beside it. They open
`tools/board-count.mjs`, `tools/scripts/check-script-reference.mjs` and
`tools/pr-title.mjs`, the workspace tools WO-027 landed, and read them
under the same rules. What the
operator learns is that this batch now reads like the example they mean
other Angular developers to copy; what they decide is whether the next
standards pass reads the stream batches the same way.

**Observed gap (dated 2026-11-05 at `48c7f8e`):** FINAL-002 F18 and
WO-028-D060 measured the migrated first batch with
`docs/evidence/WO-028/final-002/shape-audit.mjs`: 17 functions take eight
to twelve positional parameters, 38 sit between 70 and 80 counted lines,
parameter types are written inline or as another function's return type,
four modules spell one number format at 256 call sites, and the batch's
messages are keyed flat by words taken from the English with 94
placeholders named `value1`, `value2` and so on; WO-028's own twenty are
cleaner, with nested keys, named placeholders and one function of eight
parameters. The target's conventions §13 and `catalog-rules.md`, as WO-028
left them, call the 80-line guard a ceiling and not a design target, and
these modules do what that sentence refuses. VER-003 (D053) injected a
literal appended to a resolved message and a literal message parameter and
both passed `i18n:check`, the corpus test and all 962 Tools tests; VER-002
(D037) left three marks in the shared drawing (a guide behind a name
placed below its anchor on 160 of 990 new frames and 121 first-batch
frames, a stray tick over a stopped cart, a name box short of the top edge);
VER-002 (D036) showed the wall study's default run turning almost entirely
under Seek's pull, with the ray hitting on 2 of 81 frames; VER-003 (D055)
found twelve keys of `studyEip/en.json` read only by specs, one key read by
nothing and a title catalog of which records and nearby links name 89 of
768 rows. Re-read on 2026-11-06 at `d7d842d` (WO-027's merge, #15): that
merge changed twenty-one files, none under `apps/` or `libs/` (`git diff
--name-only 48c7f8e..d7d842d`), so every count above holds; it added the
three tool scripts `tools/board-count.mjs`,
`tools/scripts/check-script-reference.mjs` and `tools/pr-title.mjs` with
their tests, the code that landed between the 2026-11-05 and 2026-11-06
passes and that rule 31 gives this pass to read.

**Design:**

- **The reshape rule.** A presentation module reads as prose: one
  description object per study carries the example's named values (what
  the record's `example.parameters` and the simulation produce), and a
  function takes that object, a frame, a translator or a selection, at most
  four parameters and never a list of loose numbers that a longer function
  once shared; parameter and return types are named interfaces in the
  module or the shared `study-model.ts`; one shared number-format helper
  replaces the four modules' 256 spellings, keeping each authored rounding
  mode; messages are nested by study and part
  (`studyAifg.<slug>.model.<part>.<name>`) with placeholders named for what
  they hold (`{count}`, `{speed}`, `{clearance}`), never `valueN`; a function
  is as long as its job, the 80-line ceiling holds without a split made for
  it, and `max-lines-per-function` is not lowered and no parameter-count
  rule is added (D060's reason stands: a count invites the next mechanical
  split; the standards pass reads). The measure is the shape audit, run
  before and after over the first batch: functions with more than four
  positional parameters and `valueN` placeholders go to zero; functions at
  70 counted lines or more are a diagnostic, each one left carrying the
  executor's one-line judgment in the evidence that it does one job and
  reads whole, never a split made for the count; the 80-line ceiling holds
  through the gate's lint.
- **Every output unchanged.** The reshape changes no frame value, no
  rendered word and no number: the simulations are untouched; each model
  spec keeps its physical-position and value assertions; a crawl of the
  served production build over every frame of the forty movement studies,
  the approach of VER-003's `dom-diff.json`, runs at the integrated base and
  at the candidate and the two text-node sequences are equal, except where
  step 7's wall study changes its default run and caption, which the
  evidence names frame by frame. The stream catalogs' reworded sentences
  (below) change rendered words in the RxJS and messaging studies, outside
  that crawl, and the evidence lists each before and after.
- **The guards** (D053): the corpus test brackets each message at both ends
  and fails on letters outside the brackets, and fails on a string parameter
  with letters unless it came from the translator or is a declared machine
  value (a stream id, an order id, a marble symbol); VER-003's injections
  (`docs/evidence/WO-028/ver-003/literal-check-attack.mjs`, an appended
  literal and a literal parameter) are the negative controls, run on a
  scratch copy. D061 already repaired the Formation pattern interface
  messages and the lint glob (F14); this order keeps them and proves the
  glob with `eslint --print-config` on a study source.
- **The marks** (D037): a guide ends at the near edge of its name and never
  runs behind it; a vector too short to read is not drawn; the room a name
  needs follows the font size in use, so a wide drawing does not move a name
  that fits; VER-001's label sweep and the browser glyph regressions stay
  at zero, with one regression per rule.
- **The wall study** (D036): Obstacle and wall avoidance's default run shows
  the avoidance doing the turning: the ray stays on the wall for a stretch a
  reader can step through, "Turning along the wall" opens a later frame than
  "Ray first hits", and the same run with the ray too short to hit sits
  beside it so the reader sees what avoidance added; the limits state that
  offered ray lengths of 10 and up end in overlap of 0.74; if no honest
  default achieves this, the caption says only what the run shows. The
  changed study returns to the factual and reading critics under the
  profile's worker rules (two launches), and the record stays `checked`.
- **The catalogs** (D055): keep only the title rows records and nearby
  links name, move the twelve spec-only keys of `studyEip/en.json` into
  their specs' fixtures, delete `studyAifg.wander.record.parameters.drawPairs`,
  regenerate the testing copies and record the first AI for Games reading's
  gzipped transfer before and after; and reword the stream messages where a
  computed count opens a sentence or a label, so the digit does not lead
  (D056: 48 messages across 15 stream studies, for example a sentence that
  now reads "There are now {count} photos waiting"), the English only in
  `studyRxjs/en.json` and `studyEip/en.json`, parameters and mechanisms
  unchanged. Work-level loading stays as D042 chose it (the filing pass's
  NoOp, reopened by a measured regression on the performance guide's
  constrained surrogate).
- **Documents.** `catalog.md` §The models and `catalog-rules.md` state the
  reshape rule as the shape a presentation module has (the description
  object, the named placeholders, the one formatter), and the standards
  pass is named as the pass that reads a batch's code after it lands
  (WS-001 rule 31).

Rejected: a parameter-count lint rule or a lower line ceiling (axis: D060's
reason; a count invites the next mechanical split, and the standards pass is
the reader); reshaping WO-028's twenty and the stream batches here (axis:
WS-001 rule 31 makes each standards pass bounded to what the last one did
not read, and the next pass reads them with the pair's); per-model catalog
loading (axis: D055's numbers are below the threshold the surrogate
measures, and the filing pass recorded the NoOp); folding the reshape into
the next Movement research batch (axis: the operator's direction of
2026-11-05, a dedicated pass, never an afterthought inside a feature batch).

Live-run surfaces at the base: the catalog with eighty studies, the forty
movement studies in the message system with their models split into
simulation, presentation and entry.

**Deliverables:** the twenty reshaped presentation modules and the shared
helpers; the migrated messages; the tightened corpus test with its negative
controls; the drawing's three repairs with their regressions; the wall
study's default run and caption with the critics' dispositions; the trimmed
catalogs; `docs/evidence/WO-034/` with `shape-audit-before.json`,
`shape-audit-after.json`, the crawl's `dom-diff.json`, the transfer
measurements, `review.md` for the wall study's critics, `walkthrough.md` and
the verifier's reading; the two documents.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-034: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor
   d7d842dc4fdbde03099695933a448d9632fa4335 origin/main` exits 0 (a `main`
   that does not contain the pin stops for a planning pass); the target
   worktree then fast-forwards to the target's `main`, and that integrated
   commit is the baseline of every later comparison; then the route guard
   and activation as WO-005 step 1. Check: the decisions carry the
   integrated commit.
2. The shape audit before: copy
   `docs/evidence/WO-028/final-002/shape-audit.mjs` into
   `docs/evidence/WO-034/` and run it over `studies/movement/` at the
   integrated base into `shape-audit-before.json`; run the production crawl
   over the forty movement studies into `dom-before.json`. Check: both
   files exist and the before counts match D060's (17, 38, 94).
3. The shared helpers: the number formatter with the authored rounding
   modes, the description-object types, under
   `libs/features/tools/src/lib/studies/`; the four modules' 256 call sites
   moved onto it. Check: `npx nx test tools` exits 0.
4. Modules one to ten of the first batch reshaped under the Design's rule,
   their messages renamed to nested keys with named placeholders, the
   catalog and testing copy migrated. Check: `npx nx test tools` and
   `npm run i18n:check` exit 0; the crawl over those ten studies equals
   `dom-before.json` for their frames.
5. Modules eleven to twenty likewise. Check: as step 4; the audit after
   over the twenty prints 0 functions over four positional parameters and
   0 `valueN` placeholders, and lists each function at 70 lines or more
   beside its cohesion judgment.
6. The corpus test's brackets and parameter rule; the two injections on a
   scratch copy as negative controls, recorded in the evidence README;
   `eslint --print-config` on a study source listing
   `max-lines-per-function`. Check: the candidate passes, both injections
   fail, the print-config names the rule.
7. The drawing's three repairs with a glyph regression each; the wall
   study's default run and caption, the ray-too-short comparison, the limit
   sentence; the two critics dispatched over the changed study under the
   profile; their findings disposed. Check: VER-001's sweep script reads
   zero cut and zero overprinted frames at 360, 768, 1440, 2080×1460 and
   3840×1620; the record is `checked`.
8. The catalog trims, the rewording of the count-led stream messages and
   the transfer measurement before and after. Check:
   `tools/i18n-copies.test.mjs` passes; `npm run check:bundle` passes; no
   model message in `studyRxjs/en.json` or `studyEip/en.json` begins with
   a placeholder; the evidence records the two gzipped sizes.
9. The crawl after over the forty studies into `dom-after.json` and the
   diff. Check: zero differing text nodes outside the wall study's named
   frames.
10. WO-027's three tools (`tools/board-count.mjs`,
    `tools/scripts/check-script-reference.mjs`, `tools/pr-title.mjs`) and
    their tests read under rules 26, 30 and 31 and the operator's code
    directions, with the Design's reshape rule read for shape and not for
    types: the tools stay ES modules under `tools/` that import nothing
    from `libs/`, a function that would take more than four positional
    parameters takes a named-options object instead, parameters and
    returns are described in JSDoc rather than TypeScript interfaces, and a
    function does one job; every test unchanged as the oracle; the evidence
    README records each file with the verdict reshaped or left and its
    reason. Check: `node --test tools/` passes with the three tools' tests
    unchanged; the README lists the three files.
11. Documents (`catalog.md` §The models, `catalog-rules.md`); dependency
    check as WO-015 step 15; gate plain and review. Check: passing rows, no
    tracked-byte mutation.
12. Launchpad write-back (WS-001's delivery states and the profile's
    implementation map row for the shared helpers), then the publish, review
    and records steps as WO-007 steps 15 to 17, with the branch
    `refactor/movement-presentations`, the title `refactor: reshape the
    first movement batch's presentations and tighten the study guards`,
    `docs/evidence/WO-034/` and `docs/final-reviews/WO-034/`. Check:
    `npm run test:docs` in the launchpad order worktree.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test`, `npm run i18n:check`, `npm run studies:check`,
`npm run check:bundle`, `node --test tools/`; in the launchpad order worktree
`npm run test:docs`; then the target gate plain and review once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24, the code as the surface).** The verifier performs
   the Objective's reading on the committed tree: three presentation modules
   of the first batch chosen at random (the command and its output
   recorded), read top to bottom, and the wall study opened in the served
   production build and stepped through its default run and its
   ray-too-short comparison. The VER report carries a `## Walkthrough`
   section with the dated steps, the wall study's frames at the operator's
   sizes (rule 29) and states in the verifier's own words what each read
   function takes and returns and what the wall study's avoidance did that
   Seek alone did not. Met only when every step completed and that statement
   is present.
2. `docs/evidence/WO-034/shape-audit-after.json`, produced by the evidence
   directory's `shape-audit.mjs` over `libs/features/tools/src/lib/studies/movement/`
   at the candidate, lists zero functions of the first batch's twenty
   presentation modules with more than four positional parameters (a single
   description object counts as one) and zero `valueN` placeholders in
   their messages, lists each function at 70 counted lines or more beside
   the executor's recorded judgment that it does one job and reads whole
   (the evidence README carries the judgments), and
   `shape-audit-before.json` from the
   integrated base records the D060 counts the candidate removed.
3. Every output is unchanged: `docs/evidence/WO-034/dom-diff.json`, the
   production crawl over every frame of the forty movement studies at the
   integrated base and at the candidate, records zero differing text nodes
   outside the wall study's frames that step 7 names, every movement model
   spec passes with its physical-position and value assertions retained,
   and `npx nx e2e dotln-e2e` passes with the catalog's visual baselines
   unchanged.
4. The corpus test fails on a scratch copy carrying VER-003's appended
   literal and on one carrying its literal message parameter, passes on the
   candidate, and `eslint --print-config` on a study source lists
   `max-lines-per-function`; the three runs are recorded in the evidence
   README.
5. VER-001's label sweep reads zero cut and zero overprinted frames for both
   movement batches at 360, 768, 1440, about 2080×1460 and 3840×1620; a
   glyph regression per D037 rule (the guide's end, the unread vector, the
   room by font size) passes on the candidate and fails on the base's
   drawing.
6. In the wall study's default run, the frame "Turning along the wall" opens
   is later than the frame "Ray first hits" opens, the ray-too-short
   comparison is on the page, the limits state the overlap of 0.74 for ray
   lengths of 10 and up, and `docs/evidence/WO-034/review.md` records both
   critics' findings disposed with the record `checked`; or the caption
   states only what the run shows and the decisions file records why no
   honest default achieved the turn.
7. `studyEip/en.json` holds none of the twelve spec-only keys (they live in
   the specs' fixtures), `studyAifg/en.json` holds no
   `wander.record.parameters.drawPairs` and only the title rows a record or
   a nearby link names, `tools/i18n-copies.test.mjs` passes, no model
   message in `studyRxjs/en.json` or `studyEip/en.json` begins with a
   placeholder, the evidence README lists each reworded message with its
   text before and after, and the evidence records the first AI for Games
   reading's gzipped transfer at the base and at the candidate.
8. `docs/evidence/WO-034/README.md` records, for each of WO-027's three tools
   (`tools/board-count.mjs`, `tools/scripts/check-script-reference.mjs`,
   `tools/pr-title.mjs`), the executor's reading under rules 26, 30 and 31
   with the verdict reshaped or left and its reason; `node --test tools/`
   passes on the candidate; and `git diff --name-only <integrated base> --
   tools/board-count.test.mjs tools/check-script-reference.test.mjs
   tools/pr-title.test.mjs`, the working tree against the commit step 1
   records, prints nothing, so every output those three suites fix is
   unchanged (a sibling's `tools/studies.test.mjs` taken from `main` at an
   integration is outside the check).
9. `node scripts/target-gate.mjs WO-034 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-034/README.md`, the two
audits, `dom-diff.json`, `review.md`, `walkthrough.md` and its frames, and
`docs/evidence/WO-034/host-qualification.md`.

**Known issues and carry-ins:** This is the first standards pass under
WS-001 rule 31; it also reads WO-027's three tools and their tests, the
code that landed between the 2026-11-05 and 2026-11-06 passes (the
2026-11-06 pass, D4); the next reads WO-028's twenty, the stream batches
and whatever the pair lands. The next Movement research batch is cut only after
this order merges (WS-002 rule 6); WO-029 and WO-030 may land before it, and
this order's corpus test then judges their records when it integrates
`main`. No page changes, so no paired comparison runs (rule 25); the use
criterion reads code and the wall study. The catalog's loading unit stays
the work (D042; the filing pass's NoOp with D055's reopening). This order
activates only on a launchpad whose starter carries core WO-221's `--draft`
form; the draft pull request and its workflow runs are a final-review
obligation read from `docs/evidence/WO-034/preview-pr.json`, never a
criterion. Since starter v0.119.0 (core WO-257) `target-records` ends
every record it files with a provenance footer naming the launchpad commit
at filing and the record's path there, the layout its relative links are
read against, without claiming the link destinations are committed at that
commit (`scripts/lib/target-records.mjs`); whether a reader of the two
public repositories can follow a filed record's links is still open
(`FUP-575ebb5d3b7e46e0`). In the records step (step 12), after
`target-records`, this order's final reviewer reads one filed record's
footer and records in this order's decisions the commit it names, whether
that commit is reachable on the launchpad's public repository and whether
the record's link destinations exist there; the next planning pass reads
that decision against the row. A research order whose records are filed
before this order's does not owe the observation, and the target developer
reference's `docs/dotln` row keeps its checkpoint sentence until a pass
has that reading (the 2026-11-06 merge-upstream pass, D3); an observation
under this carry-in, not a criterion. `Target release classification: patch`
and `Target release notes: reviewed` are set under WO-012's declared policy.

**Non-goals:** a parameter-count lint or a lower line ceiling; reshaping
WO-028's twenty or the RxJS and EIP modules; per-model catalog loading; new
studies, pages, families or rounds; the mined catalog text (WO-035).

**Operator-review assumptions:** the operator reads the diff as the example
they mean (they read the code of an order before it is called
final-reviewed), accepts the reading criterion as a code-only order's
acceptance by use with the wall study as its one screen, and accepts that
the next standards pass, not this one, reads the batches this one leaves.


Filed from the launchpad Launchpad (its tree at commit 527eb8ceb044216cf2e02904fee23c8fb989d3df); this record's launchpad path was docs/work-orders/WO-034-standards-pass-movement-presentations.md, and its relative links resolve against that path there, not in this repository.
