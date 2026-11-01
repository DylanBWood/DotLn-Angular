# WO-021 — Concept studies II: the twenty RxJS operators and subjects the app runs on, each with an executable marble example the study's drawing and its test share

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 4c21c586634ac8a5ab5dba9852cd7da81c6d6ee9
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/catalog/src/studies/rxjs/` (twenty records), the
`marbles` family under `libs/features/tools/src/lib/composites/study-visuals/marbles/`,
twenty executable modules with marble specs under
`libs/features/tools/src/lib/studies/rxjs/`, one document section and one
rule, about 45 source files plus twenty data records; the family
discriminator on the study model and the three repairs WO-020's final review
boarded (WO-020-D018 and D020, about five source files); in the launchpad
order worktree eighteen `disposable` entries in `dotln.config.json` and in
the target one `.gitignore` line, so the target's release close meets none
of the three undeclared-material blockers that cost WO-020's close four
attempts (the 2026-11-01 pass, D3); adds no runtime
dependency (RxJS and its `TestScheduler` are installed). Removes nothing.
Wall-clock: about 6 to 10 hours of executor work, of which the fan-out runs
in parallel, plus the fixed cycle; unknown until run. Context bytes: WO-020's
record, check, families and rules as it leaves them, `catalog.md` §Studies,
the twenty catalog rows, this order, about 180 KB for the executor; each
author reads two rows, the contract and the RxJS documentation pages it
cites. Commands added: none (`studies:check` and `studies:report` exist).
Tokens: unknown until run; recorded per worker. Steps: 14. Re-mints: none.
Refutations paid: the 2026-10-30 second pass's receipt and the 2026-11-01
pass's.
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second.md`, SHA-256
`8e8cdbeb9b227932d9119b5a012a72086a1ebe349f368b42b0ff788d9060382e`): a
hundred concepts in five batches at the front of the list, side work beside
the road orders; the depth direction of 2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`;
`docs/product/concept-study.md`: an RxJS interpretation where streams clarify
the mechanism, the executable distinguished from the illustrative); register
row `FUP-5f1cdfde5e860902` allocated to WO-020 to WO-024. Planner-synthesized
by the 2026-10-30 second planning pass
([planning document](../planning/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D4 and D5). Opaque identifier, not a priority.
**Depends on:** WO-020 merged (hard: the record, the check, the study
composite, the addressable route and the fan-out procedure this order reuses;
the base above is WO-020's merge commit, DotLn-Angular #11, set by the
2026-11-01 pass; since starter v0.96.1 (core WO-230) the target publish
describes the change from the merge base of the subject and the target's
`main`, so a later `main` at activation publishes right too).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-020",
    "relation": "hard",
    "reason": "the concept-study record, check, study composite, addressable route and fan-out procedure this batch reuses; the base line is WO-020's merge commit and publishes right under starter v0.96.1's merge-base publish"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 1, 5, 7, 8, 23, 24, 25, 26; §The app and its sub-apps, §Design
direction); `docs/repositories/dotln-angular.md`; `docs/product/concept-study.md`;
`docs/control/budgets.json` (`subagentCap`); the target's `catalog.md`
§Studies and `catalog-rules.md` as WO-020 leaves them;
`docs/dev-reference/architecture/events-and-state.md` (where the app's
streams live); WO-020's `fan-out.md` as the procedure's worked example.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog, chooses RxJS on the shelf and sees twenty studied concepts;
they open switchMap and read its study: the idea in plain words (a new
request cancels the one in flight) and the situation in this app where it
serves (a search whose results must belong to the latest query), a marble
drawing of one example they step emission by emission with the text
equivalent naming each emission, the ordinary pseudocode of the mechanism, the
executable RxJS code with the note that this exact code ran in the test suite
against the marble diagram shown, where the app itself uses the operator (the
file named), where public projects use it, the references, the limits (a
cancelled save is a lost save; exhaustMap and concatMap as the nearby
choices) and the nearby operators as links. They open share and shareReplay
side by side and read how hot and cold differ on the same source, Subject,
BehaviorSubject and ReplaySubject as the three memories, and catchError and
retry as the two answers to an error. What the operator learns is which
operator fits which situation in their own code and what each one silently
drops; what they decide is which flattening or multicasting choice to make
next time.

**Observed gap (dated 2026-10-30):** at `6268de9` the catalog carries 742
RxJS rows (481 core and 261 patterns) with their definitions, 50 of them
typed, none studied; the app's stores and facades use RxJS operators the
catalog describes (switchMap, combineLatest, takeUntil, shareReplay among
them), the Arrive study's RxJS reading is illustrative, and no study in the
app carries an executable, tested RxJS example. Once WO-020 merges, the record
admits `executable: { kind: 'rxjs', module }` and the `marbles` family is
named in the enum but not built.

**Design:**

- **The `marbles` family** (`composites/study-visuals/marbles/`): input
  streams above, the operator's name, the output stream below, drawn from
  marble strings (`-a--b-|`, the RxJS `TestScheduler` syntax) and value maps,
  stepping frame by frame on command with the current emission named in the
  text equivalent; subscription marks where a study needs them (share,
  shareReplay, the subjects). The family's model is the same marble strings
  the executable module's spec asserts, read from the module, so the drawing
  and the test cannot disagree. First rendered pair (rule 25): A, horizontal
  marble lines with time left to right and the stepped emission raised; B, a
  vertical two-column timeline with time down the page, input left and output
  right; one variable, the orientation; both at 1440 and 360; the rounds
  continue until the operator says done, under WO-020's decided study form.
- **Executable examples**: every record's `pseudocode.executable` is
  `{ kind: 'rxjs', module: 'libs/features/tools/src/lib/studies/rxjs/<slug>.ts' }`,
  the module exporting the example as an RxJS pipeline over the installed
  RxJS and the marble strings the family draws, with a spec beside it running
  the pipeline under `TestScheduler` against those strings; the study's RxJS
  section is labelled executable and names the spec. The `ordinary`
  pseudocode explains the mechanism without RxJS vocabulary (what is kept,
  what is dropped, when the inner stream is cancelled, what memory a subject
  holds).
- **Implementations**: each record names where this app uses the operator
  (a repository path, read from the source at the base, introduced as "where
  this app uses it") and one or two public uses (the RxJS source and
  documentation, Angular's `toSignal` and router, public repositories), each
  introduced on its own terms (round 20's rule). References: the RxJS
  documentation page of the operator, the RxJS GitHub source at the installed
  version, and a treatment in another public reference where one exists, each
  with `accessed` and `supports`.
- **The twenty concepts**, by the pass's rule (the twenty most-related rows of
  the work by resolved in-degree, ties toward typed rows then source order):
  `rxc:152` switchMap, `rxc:215` share, `rxc:220` catchError, `rxc:161` scan,
  `rxc:216` shareReplay, `rxc:134` combineLatest, `rxc:192` takeUntil,
  `rxc:199` startWith, `rxc:237` finalize, `rxc:147` concatMap, `rxc:150`
  mergeMap, `rxc:221` retry, `rxc:5` Subject, `rxc:63` ReplaySubject,
  `rxc:234` timeout, `rxc:238` repeat, `rxc:149` exhaustMap, `rxc:229`
  materialize, `rxc:230` observeOn, `rxc:62` BehaviorSubject. One recorded
  substitution under the rule is admitted as in WO-020.
- **The fan-out**: WO-020's procedure (ten authors with two concepts each, a
  factual critic, a reading critic, at most twelve workers, the token stop
  rule, the harness usage read before the first spawn and at handoff), with
  one addition: the factual critic runs each module's spec and records the
  result beside its findings.
- **Documents:** `catalog.md` §Studies gains the RxJS coverage row and the
  `marbles` family; `catalog-rules.md` gains the rule that an RxJS study's
  code is executable with a marble spec unless the record marks it
  illustrative with its reason.

Rejected: illustrative RxJS throughout, as in the Arrive study (axis: the
depth direction asks the executable to be distinguished from the illustrative,
and RxJS is the one work where every example can run); marble images drawn by
hand (axis: a drawing the test does not share drifts from the code); studies
of RxJS patterns (`rxp`) before the core operators (axis: the patterns'
rows relate to the operators, so the operators read first).

Live-run surfaces at the base: the catalog with WO-020's studies and the
addressable readings.

**Deliverables:** the twenty records and executable modules with marble
specs; the `marbles` family with its stories and specs; the document section
and rule; `docs/evidence/WO-021/` with the fan-out record, the review record,
the link check, the walkthrough and its screenshots, and the design record.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-021: the target's `main` must
   contain the Repository pin (`git merge-base --is-ancestor <pin>
   origin/main` exits 0; a `main` that has left the pin behind, as WO-005
   step 1 refuses, stops for a planning pass), then the target worktree
   fast-forwards to the target's `main` and that integrated commit is the
   baseline of every later comparison; activation as WO-005 step 1; read the
   harness usage and record the subagent remainder; record the publishing
   decision as WO-020 did.
2. The target close's residue declared, byte-identical with WO-022's step 2
   so the pair's second merge meets no conflict. In the launchpad order
   worktree, `dotln.config.json` `classes.angular-nx-monorepo.disposable`
   becomes exactly these thirty entries in this order: `.angular`, `.nx`,
   `.runtime`, `__screenshots__`, `coverage`, `dist`, `docs/control/local`,
   `libs/dotln/shell/node_modules`,
   `libs/features/board-data-access/node_modules`,
   `libs/features/board/node_modules`, `libs/features/machinery/node_modules`,
   `libs/features/scene-data-access/node_modules`,
   `libs/features/scene/node_modules`, `libs/features/tools/node_modules`,
   `libs/shared/catalog/node_modules`, `libs/shared/core/node_modules`,
   `libs/shared/data-access/node_modules`, `libs/shared/events/node_modules`,
   `libs/shared/i18n/node_modules`, `libs/shared/models/node_modules`,
   `libs/shared/scene-engine/node_modules`, `libs/shared/state/node_modules`,
   `libs/shared/ui/node_modules`, `libs/shared/utils/node_modules`,
   `node_modules`, `out-tsc`, `playwright-report`, `test-output`,
   `test-results`, `tmp` (the entry
   `docs/control/local/harness/memory-incidents.jsonl` is replaced by its
   directory; the seventeen nested roots are the project roots that carry a
   Vite config, whose Vitest caches the close has refused as undeclared on
   every target close since WO-007). In the target worktree, `.gitignore`
   gains the line `/.runtime/` after `/docs/control/local/`, because the
   kit's temporary-root module writes `.runtime/.metadata_never_index` and
   its ledger into whichever repository a session runs in, and an untracked
   file fails the close's clean check before any disposable rule is read.
   Check: in the launchpad order worktree
   `node -e "const d=require('./dotln.config.json').classes['angular-nx-monorepo'].disposable;console.log(d.length,d.includes('.runtime'),d.includes('docs/control/local'),d.filter(p=>/^libs\/[^/]+\/[^/]+\/node_modules$/.test(p)).length)"`
   prints `30 true true 17` and `npm run test:docs` passes; in the target
   worktree `grep -c '^/\.runtime/$' .gitignore` prints 1.
3. The three repairs WO-020's final review boarded (WO-020-D020):
   `tools/scripts/catalog/check-studies.mjs` reads a file named on the
   command line through `readRecord`, so a file that does not parse is a
   schema problem under the `FAIL check-studies` prefix, with the case added
   to `tools/studies.test.mjs`; the unused computed `step` leaves
   `libs/features/tools/src/lib/composites/study-explanation/study-explanation.ts`;
   the target `README.md`'s menu table names `/tools/catalog/<tool id>` and
   the studied concepts beside `/tools/catalog` and `/tools`, as
   `docs/dev-reference/architecture/sub-apps.md` does. Check:
   `node tools/scripts/catalog/check-studies.mjs <a file holding the text { not json>`
   exits 1 and prints a `FAIL check-studies` line;
   `grep -c 'readonly step = computed' libs/features/tools/src/lib/composites/study-explanation/study-explanation.ts`
   prints 0 (the declaration at line 26 of the base is the defect; no
   template or spec calls it, so a search for calls proves nothing);
   `grep -c '/tools/catalog/<tool id>' README.md` is at least 1.
4. The study model discriminated by family before the first family without
   motion frames (WO-020-D018): in
   `libs/features/tools/src/lib/studies/study-model.ts` the common moments
   and values are separated from the drawing payload, the payload is
   discriminated by `visual.family`, and the discriminator is kept through
   `mapStudy` and the study composite, so playback, prose values and
   `clampStep` no longer read `motion.frames` for every family; then the
   `marbles` family with stories `StudyMarbles` and a spec that renders
   `-a--b-|` to its text equivalent. Check: a spec with a record whose family
   has no motion frames renders and scrubs; `npx nx test tools` exits 0;
   `npm run lint:components` exits 0.
5. The first rendered pair (A horizontal, B vertical) at 1440 and 360; the
   rounds; the rejected implementation removed with its record under
   `design/`. Check: `grep -c "Round" docs/evidence/WO-021/design/comparisons.md`
   is at least 1.
6. The authors' brief with the executable rule into `fan-out.md`; dispatch the
   ten authors; merge the twenty drafts with their modules and specs. Check:
   `npx nx test tools` exits 0 over the twenty specs.
7. Dispatch the two critics; dispose the findings; rewrite through the same
   authors; set `checked`. Check: `npm run studies:check` exits 0 over
   `studies/rxjs/`.
8. The link check into `docs/evidence/WO-021/README.md`. Check: every URL has
   a status.
9. e2e `apps/dotln-e2e/src/catalog.spec.ts`: RxJS shows twenty studied;
   switchMap's study steps its marbles under reduced motion with the text
   equivalent naming the emission, labels the code executable and names the
   spec; share's and shareReplay's studies open side by side from the nearby
   links; axe; no overflow at 360, 768 and 1440. Check: `npx nx e2e dotln-e2e`
   exits 0.
10. The walkthrough as WO-020 step 11, under `docs/evidence/WO-021/`. Check:
    the files exist.
11. Documents: the coverage row, the family and the rule. Check:
    `grep -c "marble" docs/ai-reference/catalog-rules.md` is at least 1.
12. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
    nothing; the chunk sizes recorded.
13. Gate plain and review. Check: passing rows, no tracked-byte mutation.
14. Launchpad write-back (the profile's implementation map names the
    `marbles` family; WS-001's delivery states by the final review); then the
    publish, review and records steps as WO-007 steps 15 to 17, with the
    branch `feat/rxjs-concept-studies`, the title `feat: add concept studies
    for the RxJS operators with executable marble examples`,
    `docs/evidence/WO-021/` and `docs/final-reviews/WO-021/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run studies:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session in
   the served production build: open Tools, Catalog; choose RxJS and read the
   studied count; open switchMap and step its marbles, expand the executable
   code and the limits, follow the nearby link to exhaustMap; open share and
   shareReplay; open Subject, BehaviorSubject and ReplaySubject; open
   catchError and retry. The VER report carries a `## Walkthrough` section
   with the dated steps and the screenshots at 360, 768 and 1440 under
   `docs/evidence/WO-021/walkthrough/` (`ls docs/evidence/WO-021/walkthrough | wc -l`
   prints at least 15), and states in the verifier's own words what switchMap
   drops, how share and shareReplay differ, and what the three subjects
   remember, as read from the studies alone. Met only when every step
   completed and that statement is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/rxjs/`
   with exactly the twenty ids this order names (or one recorded
   substitution), every record `checked` with at least two reviewers, every
   reference complete, and `studies-summary.json` current.
3. Every record's `pseudocode.executable` names a module under
   `libs/features/tools/src/lib/studies/rxjs/` with a spec beside it that
   runs the example under `TestScheduler` against the marble strings the
   record's visual draws (a spec in the family asserts the strings come from
   the module), except a record that marks `rxjs` illustrative with its
   reason in the record and in the decisions file, which the known issues
   admit for at most two (observeOn's scheduling, materialize's
   notifications); `npx nx test tools` exits 0 with one spec per executable
   record counted in its output, twenty less the recorded exceptions.
4. `docs/evidence/WO-021/fan-out.md`, `review.md` and `README.md` as WO-020's
   criterion 4, the review record also carrying each module's spec result
   from the factual critic.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 9 cases, axe at the
   board spec's threshold and no horizontal overflow at 360, 768 and 1440.
6. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the `marbles` family and the records in lazy chunks,
   `npm run check:bundle` passes with the chunk sizes recorded beside
   WO-020's, and `package.json`'s `dependencies` keys equal the base's.
7. `docs/dev-reference/architecture/catalog.md` §Studies lists RxJS with
   twenty studied, and `docs/ai-reference/catalog-rules.md` states the
   executable rule (`grep -c "marble" docs/ai-reference/catalog-rules.md` is
   at least 1).
8. `docs/evidence/WO-021/design/comparisons.md` records the first pair (A
   horizontal, B vertical) and every later round with its pick, and the
   decisions file records the operator's word that ended the rounds; the
   decisions file names the removed candidate's files and `ls` on each prints
   nothing.
9. The target close's residue is declared (step 2): in the launchpad order
   worktree the step's `node -e` one-liner prints `30 true true 17` and
   `npm run test:docs` passes; in the target worktree
   `grep -c '^/\.runtime/$' .gitignore` prints 1; and after the review gate
   of criterion 11, in the target worktree,
   `git ls-files --others --ignored --exclude-standard` lists no path
   outside the thirty declared roots and the files the target harness
   bundle's manifest installs (the verifier filters the listing by those
   roots as prefixes and records the command and its empty remainder), and
   `git status --porcelain --untracked-files=all` prints no line other than
   a `.DS_Store`, the close's own clean judgment of the worktree; the
   close's separate judgment of the base checkout under the registration's
   `judge-only` policy is the close's and is not claimed here.
10. The two carry-ins hold by their checks: step 3's
    `node tools/scripts/catalog/check-studies.mjs <a file holding the text { not json>`
    exits 1 and prints a `FAIL check-studies` line, with the case present in
    `tools/studies.test.mjs`;
    `grep -c 'readonly step = computed' libs/features/tools/src/lib/composites/study-explanation/study-explanation.ts`
    prints 0; `grep -c '/tools/catalog/<tool id>' README.md` is at least 1;
    and step 4's spec with a record whose family has no motion frames is
    counted in `npx nx test tools`'s passing output.
11. `node scripts/target-gate.mjs WO-021 --review` records a passing row for
    every declared command with no tracked-byte mutation, and
    `npm run test:docs` passes in the launchpad order worktree; the Preflight
    line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-021/README.md`, `fan-out.md`, `review.md`,
`walkthrough.md` and its screenshots, `design/`, and
`docs/evidence/WO-021/host-qualification.md`.

**Known issues and carry-ins:** The base line is WO-020's merge commit
(`4c21c58`, DotLn-Angular #11), set by the 2026-11-01 pass. Step 2 is byte
for byte the same edit as WO-022's step 2, so WO-022's step finds it on
`main` and only verifies; the pass that follows this order's close reads
its close record (one attempt, no blocker) and carries core's answer on an
any-depth declaration (that pass's §Requests to core, item 3). The two
carry-ins are WO-020-D018 (the study model's family discriminator, before
the `marbles` family; register row `FUP-4a1b75d959226303`) and WO-020-D020
(the three repairs the final review boarded; `FUP-27fad100153e0220`),
written into steps 3 and 4 and criterion 10. WO-022 follows this order in
the sequence and depends on it: its `flow` family is the second family
without motion frames, so it needs the discriminator step 4 lands, and its
executable arm is drawn by the `marbles` family (the 2026-11-01 pass, D4,
on all three of its reviews); the two are no longer a lane pair. The order
that publishes after this one integrates the target's `main` and rewrites
`studies-summary.json` with `npm run studies:check -- --write-summary`
before its publish. A record whose example cannot be expressed
as a marble diagram (observeOn's scheduling, materialize's notifications) may
mark `rxjs` illustrative with its reason in the record and the decisions
file; the rule the order adds says so. The RxJS patterns rows (`rxp`) and the
Angular interop functions are the next batch's candidates (the filing pass's
C3). This order activates only on a launchpad whose starter carries core
WO-221's `--draft` form; the draft pull request and its workflow runs are a
final-review obligation read from `docs/evidence/WO-021/preview-pr.json`,
never a criterion. `Target release classification: minor` and `Target
release notes: reviewed` are set under WO-012's declared policy.

**Non-goals:** the RxJS patterns rows and the Angular interop rows; changing
how the app's own stores use RxJS; a new family beyond `marbles`; the general
search controls (WO-018).

**Operator-review assumptions:** the operator accepts the in-degree selection
and the twenty operators and subjects it names, accepts the executable rule
with its recorded exceptions, judges the first pair and ends the rounds in
their own words, and reads the one draft pull request before final review,
which the final publish reuses.
