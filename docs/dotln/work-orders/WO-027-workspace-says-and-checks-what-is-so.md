# WO-027 — The workspace says and checks what is so: DotLn-Angular's gate tools and standing documents corrected from the REVIEW-002 Entropy Reducer findings

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 48c7f8e6916692bca833c4985e2cf95978ab2c06
**Target release classification:** patch
**Target release notes:** reviewed
**Cost:** edits three tool scripts (`tools/board-count.mjs`,
`tools/scripts/check-script-reference.mjs`, `tools/pr-title.mjs`) and adds
their negative-control cases under `tools/*.test.mjs`; edits eight standing documents
(`README.md`, `docs/dev-reference/README.md`, `docs/ai-reference/README.md`,
`docs/ai-reference/sub-app-rules.md`, `docs/ai-reference/foundation-rules.md`,
`docs/dev-reference/workspace/conventions.md`,
`docs/dev-reference/workspace/scripts.md`,
`docs/dev-reference/architecture/catalog.md`, `sub-apps.md` and
`performance.md`); adds `docs/dotln/evidence/WO-027/` records through the
kit's route and `docs/evidence/WO-027/` in the launchpad. Removes nothing
tracked. Wall-clock: about 2 h 0 min to 4 h 0 min of executor work plus the
fixed cycle; unknown until run. Context bytes: the two scripts and their
tests, the ten documents (about 150 KB), REVIEW-002's eight accepted
findings, WS-001 rules 2, 4, 19, 21 and 26, this order, about 220 KB for the
executor. Commands added: none. Tokens: unknown until run. Steps: 14.
Re-mints: none. Refutations paid: the 2026-11-03 Entropy Reducer pass over
dotln-angular (its receipt), the 2026-11-04 pass's receipt 020 and this
pass's receipt.
**Nomination provenance:** REVIEW-002, the Entropy Reducer review of
`dotln-angular@55b59c9` (`docs/instance/entropy-reducer/runs/REVIEW-002.md`),
findings ER-F1, ER-F2, ER-F3, ER-F4, ER-F6, ER-F7, ER-F8 and ER-F9, each
reproduced by the blinded refutation and accepted by the
[2026-11-03 entropy-reducer-dotln-angular pass](../planning/passes/entropy-reducer-dotln-angular-2026-11-03.md)
(D5); the operator's dispatch of 2026-11-05 (ignored capture
`docs/intake/notes/planning-2026-11-05.md`), which moved this order and
WO-033 to the front of the sequence; register row `FUP-f85ede7a356345c5`
(the title workflow once the kit's lint admits a gitmoji title without a
type), fired by starter v0.117.0 and allocated here by the
[2026-11-05 pass](../planning/passes/standard-pass-v0-117-0-scene-reminders-2026-11-05.md)
(D2). Planner-synthesized. Opaque identifier, not a priority.
**Depends on:** WO-028 merged (hard: the shared study migration rewrote
`catalog.md`, the catalog and foundation rules, the conventions and the
script reference, which this order corrects as they now stand; merged as
DotLn-Angular #14, released as `DotLn Angular v0.10.0`). WO-023 and WO-024
(reference-only: the pair writes into `catalog.md`, `scripts.md` and the study rules
this order passes; whichever of the three lands later integrates the
target's `main`). The base is WO-028's merge.
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-028",
    "relation": "hard",
    "reason": "the shared study migration rewrote catalog.md, the catalog and foundation rules, the conventions and the script reference that this order corrects as they now stand"
  },
  {
    "workOrderId": "WO-023",
    "relation": "reference-only",
    "reason": "the batch writes into catalog.md, scripts.md and the catalog rules this order corrects; whichever lands later integrates the target's main"
  },
  {
    "workOrderId": "WO-024",
    "relation": "reference-only",
    "reason": "the second batch of the pair writes into the same standing documents; whichever lands later integrates the target's main"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 2, 4, 19, 20, 21, 23, 26); `docs/repositories/dotln-angular.md`
(§Run the app and its checks, §Why Angular's additional disk cache is
disabled); `docs/instance/entropy-reducer/runs/REVIEW-002.md` (the eight
findings' observed, expected and reproduction fields); the target's
`docs/dev-reference/workspace/conventions.md`, `scripts.md`,
`docs/dev-reference/architecture/catalog.md`, `sub-apps.md`,
`performance.md`, `docs/ai-reference/sub-app-rules.md`,
`tools/board-count.mjs`, `tools/scripts/check-script-reference.mjs` and
`tools/pr-title.mjs`.

**Objective:** (the operator's session, WS-001 rule 24, with the documents
and CI's output as the surface) a coding session opens
`docs/ai-reference/sub-app-rules.md`, runs the commands it lists and has run
the registered gate's plain tier, no command missing and none twice; the
operator reads the board count CI prints and knows it counts a `BOARDED:`
marker anywhere the defect sits, in `tools/` or `.github/` as in `libs/`;
they open `conventions.md` and read why the Angular CLI cache is off before
touching `nx.json`; they open `catalog.md` and every pointer resolves, with
no account of which day a design round ended; they open `performance.md` and
read what the policy does about the scene the root opens; they remove a row
from `scripts.md` and `npm run check:scripts` fails; they open a pull
request titled with a gitmoji and a subject and no conventional type, and
the title workflow leaves it as written. What the operator learns is that
the workspace's documents and its gate tools say and check what is so, which
is what a colleague reading the workspace is shown.

**Observed gap (dated 2026-11-03 at `55b59c9`; re-read 2026-11-05 at
`48c7f8e`, where every count below holds although WO-028 rewrote
`catalog.md`, `conventions.md`, `scripts.md`, `foundation-rules.md` and
`docs/dev-reference/README.md`):** reproduced by REVIEW-002 and its
refutation and read again by the filing pass and by the 2026-11-05 pass:
`tools/board-count.mjs` visits only `apps/` and `libs/`, so a `// BOARDED:`
marker in `tools/pr-title.mjs` counts 0 while one in `libs/` counts 1, and
`npm run boards` prints 0 with WO-004-D010's title-workflow defect still
open (`pr-title.yml` triggers on `pull_request`); `docs/ai-reference/sub-app-rules.md`
lists no `npm run typecheck:e2e` although `ci.yml` runs it and WO-015-D022
recorded that omission breaking pull request 9, and the same list re-runs
checks `npx nx run-many -t lint` already runs through `tools/project.json`,
while `README.md`, `docs/ai-reference/README.md` and
`docs/dev-reference/README.md` name `test:tooling` as a separate command and
`README.md` says pull requests run "the checks above" where CI runs
`nx affected`; `tools/scripts/check-script-reference.mjs` matches a
backticked name anywhere in `scripts.md` and reads no table, so it passes
with the `npm run boards` row deleted and a row for a nonexistent script
added, and no test under `tools/` imports it; conventions rule 4 and
`foundation-rules.md` say an importable library's `index.ts` is one
`public_api` re-export while the board, machinery and scene features export
their routes directly, which WS-001 rule 4 and `sub-apps.md` give as the
feature shape; `catalog.md` points at "the launchpad's
`docs/product/concept-study.md`" and "the launchpad's
`docs/evidence/WO-022/design/`" as bare paths and narrates the dates design
rounds ended; `docs/dev-reference/README.md` indexes `docs/dotln/` as "Order
and review records" without saying that the records' relative links resolve
in the launchpad at the recorded commit (322 such links resolve to nothing
in the target); the reason `nx.json` disables the Angular CLI cache, and
its cost, is stated only in the dated generator log; `performance.md` and
`tools/scripts/sample-performance.mjs` mention the scene nowhere although
the root has redirected to `/scene` since #9; `tools/pr-title.mjs` refuses
a title that carries no conventional type after its gitmoji (`decorateTitle`
throws "Use a conventional title"), although the kit's publish lint admits
a gitmoji and a subject alone since starter v0.117.0 (WS-001 rule 20).

**Design:**

- **The board gauge** (`tools/board-count.mjs`): visit every tracked text
  file outside `docs/` and `node_modules`, reading `BOARDED:` markers in the
  comment syntax of `.ts`, `.mts`, `.mjs`, `.js`, `.scss`, `.html`, `.yml`
  and `.yaml`; JSON carries no comment and is not scanned. A marker is a
  line whose first non-blank characters are the file type's comment token
  followed by `BOARDED:`; a line holds at most one marker, and an occurrence
  inside a string or elsewhere on a line is not a marker, so the scanner's
  own search string and a fixture string count 0. The count CI prints is the count of markers wherever a
  defect is boarded. Rule 21's text in `conventions.md` says a boarded
  target defect leaves its marker at the defect's site, in a workflow or a
  tool as in a library.
- **The script reference check** (`tools/scripts/check-script-reference.mjs`):
  read `scripts.md`'s tables, refuse an npm script or `tools/scripts/*.mjs`
  file without a row, and refuse a row naming a script or file that does not
  exist. Its test under `tools/*.test.mjs` runs three controls on a scratch
  copy of `package.json`, `tools/scripts/` and `scripts.md`: the candidate
  passes; the copy with the `npm run boards` row removed fails; the copy with
  a row for `npm run removed:check` fails. The scope question WO-026-D011
  holds open (whether `tools/*.mjs` and `tools/scripts/*/` are covered) is
  not reopened.
- **The command lists**: `sub-app-rules.md` lists the registered gate's plain
  tier as the profile's table gives it (`npm ci`, `npx nx run-many -t lint`,
  `npm run typecheck:e2e`, `npx nx run-many -t test`, `npx nx format:check`)
  and names the review tier's `build`, `e2e` and `e2e-visual` for a change
  that adds a route or a page; it names no check `run-many -t lint` already
  runs. The three READMEs name `test:tooling` as part of `lint` and say CI
  runs the affected projects' targets.
- **The documents**: conventions rule 4 and `foundation-rules.md` state the
  feature exception in WS-001 rule 4's words (a feature library exports only
  its routes from `index.ts`); `catalog.md` states the study doctrine's
  current rule inline where it pointed at the launchpad document, names the
  launchpad repository and path for the design records instead of a bare
  path, and loses its dated narration, which the records keep;
  `docs/dev-reference/README.md`'s `docs/dotln/` row says the records are
  filed verbatim and their relative links resolve in the launchpad at the
  commit each record names; conventions rule 2 states that `nx.json`
  disables the Angular CLI cache, why (a worktree would share the base
  checkout's cache), what it costs (no dev-server prebundling, a warning on
  every serve) and when to reopen it, as the launchpad profile already does;
  `performance.md` gains a scene paragraph: the sampler covers the catalog
  journeys, the scene's steady state is bounded structurally (one signal
  write per frame, `scene-rules.md`), and scene sampling is added when a
  scene performance concern is observed.
- **The title workflow** (`tools/pr-title.mjs`): `decorateTitle` leaves as
  written a title that opens with a supported gitmoji, in shortcode or emoji
  form, followed by a subject with no conventional type; a typed title is
  still decorated with its type's gitmoji; a bare subject with neither is
  still refused; its test under `tools/*.test.mjs` covers the three forms.
  WS-001 rule 20's sentence that a member's title carries both until an
  order changes the workflow ends with this order, whose own pull request
  carries the gitmoji and the subject alone.
- **Checks**: `npm run check:scripts`, `node --test tools/`,
  `npx nx format:check`, `npm run i18n:check`, the declared target gate plain
  and review.
- **Launchpad write-back**: the profile's helper table row for
  `npm run boards` and its `Find the implementation` row for the check
  scripts say what the tools now do; WS-001's delivery states by the final
  review.

Rejected: one npm script mirroring the registered gate, referenced from the
lists (axis: the gate is declared in the launchpad registration, so a local
mirror drifts on its own; the lists are corrected to the declared tier
instead); a structural check of every project's `index.ts` shape (axis: rule
26, a check earns its gate place by protecting an observed recurrence, and
the three direct exports are the documented feature shape, not drift);
scene frame sampling in `perf:sample` now (axis: no scene performance
concern is observed and the policy states the exclusion and its reopening);
a closure state on target decision follow-ups (axis: the launchpad register
is the follow-up state, and a second record would drift from it); pinned
URLs into the launchpad for the study doctrine (axis: the rule is stated
inline so it reads without another repository; the executor pins a URL only
where the launchpad repository is public and the record is immutable).

**Deliverables:** the two tool scripts and their tests; the ten standing
documents corrected; `docs/evidence/WO-027/README.md` with the checks run and
the three script-reference controls recorded; the target's `RELEASE-NOTES.md`
for the patch release.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-027; integrate the
   target's `main` and record the commit used for comparisons in the
   decisions file. Check: `git merge-base --is-ancestor
   48c7f8e6916692bca833c4985e2cf95978ab2c06 HEAD` exits 0 in the target
   worktree.
2. `tools/board-count.mjs`: the walk over every tracked text file outside
   `docs/` with the comment syntaxes and the marker definition the Design
   names. Check: on a scratch copy of the tree with `// BOARDED: probe`
   appended to `tools/pr-title.mjs` and `# BOARDED: probe` appended to
   `.github/workflows/ci.yml`, `node tools/board-count.mjs` prints a count
   two higher than on the candidate; on a second scratch copy with
   `const inert = 'BOARDED: not a marker';` appended to `tools/pr-title.mjs`,
   it prints the candidate's count.
3. `tools/scripts/check-script-reference.mjs`: table-row matching and the
   stale-row refusal. Check: `npm run check:scripts` exits 0 at the
   candidate.
4. `tools/check-script-reference.test.mjs` (or the existing tooling test
   file): the three controls of the Design. Check: `node --test tools/`
   passes and its output names the two failing controls as expected
   failures.
5. `docs/ai-reference/sub-app-rules.md`: the command list. Check: `grep -c
   'typecheck:e2e' docs/ai-reference/sub-app-rules.md` prints 1 and
   `grep -cE 'lint:components|lint:hygiene|check:fixtures|i18n:check'
   docs/ai-reference/sub-app-rules.md` prints 0.
6. `README.md`, `docs/ai-reference/README.md`, `docs/dev-reference/README.md`:
   `test:tooling` as part of `lint`; the pull-request sentence. Check:
   `grep -n 'test:tooling' README.md docs/ai-reference/README.md
   docs/dev-reference/README.md` shows each occurrence inside the sentence
   that names `lint`.
7. `conventions.md` rule 4 and `foundation-rules.md`: the feature exception;
   `sub-apps.md` read for agreement. Check: `grep -c 'exports only its
   routes' docs/dev-reference/workspace/conventions.md
   docs/ai-reference/foundation-rules.md` prints 1 for each.
8. `catalog.md`: the inline rule, the named repository and path, the dated
   narration removed. Check: `grep -cE "launchpad's|on 2026-1[01]-[0-9]{2}"
   docs/dev-reference/architecture/catalog.md` prints 0.
9. `docs/dev-reference/README.md`: the `docs/dotln/` row. Check: `grep -c
   'resolve in the launchpad' docs/dev-reference/README.md` prints 1.
10. `conventions.md` rule 2: the Angular CLI cache paragraph;
    `performance.md`: the scene paragraph. Check: `grep -cE
    'cli\.cache|prebundl' docs/dev-reference/workspace/conventions.md`
    prints at least 1 and `grep -ci scene
    docs/dev-reference/architecture/performance.md` prints at least 1.
11. `scripts.md`: the rows for the two changed tools say what they do now.
    Check: `npm run check:scripts` exits 0; `npx nx format:check` and
    `npm run i18n:check` exit 0.
12. `tools/pr-title.mjs`: the gitmoji-only title admitted as written, the
    typed title decorated, the bare subject refused, with the three cases in
    its test. Check: `node --test tools/` passes and its output names the
    three cases.
13. Dependency check as WO-015 step 15; gate plain and review. Check:
    passing rows, no tracked-byte mutation.
14. Launchpad write-back (the profile's two rows; WS-001 rule 20's
    sentence), then the publish, review and records steps as WO-007 steps
    15 to 17, with the branch `docs/workspace-says-and-checks-what-is-so`,
    the title `:memo: Make the gate tools and reference documents say and
    check what is so` (a gitmoji and a subject with no conventional type,
    which the kit's lint admits since v0.117.0 and this order's workflow
    leaves as written), `docs/evidence/WO-027/` and
    `docs/final-reviews/WO-027/`. Check: `npm run test:docs` in the
    launchpad order worktree.

**Preflight:** in the target worktree `npx nx format:check`,
`npm run check:scripts`, `node --test tools/`, `npm run i18n:check`,
`npx nx run-many -t lint`; in the launchpad order worktree
`npm run test:docs`; then the target gate plain and review once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24, the documents and CI's output as the surface; no
   screenshots).** The verifier performs the Objective's session on the
   committed tree: from `sub-app-rules.md` alone, run the listed commands and
   compare them with the profile's gate table; append a `BOARDED:` marker to
   a copy of a workflow file and watch the count move; read why the Angular
   cache is off from `conventions.md`; follow every pointer in `catalog.md`;
   read the scene paragraph; remove a `scripts.md` row on a scratch copy and
   watch `check:scripts` fail. The VER report carries a `## Walkthrough`
   section with the dated steps and states in the verifier's own words what
   each document told them and anything they could not find. Met only when
   every step completed and that statement is present.
2. On a scratch copy of the candidate tree with `// BOARDED: probe` appended
   to `tools/pr-title.mjs` and `# BOARDED: probe` appended to
   `.github/workflows/ci.yml`, `node tools/board-count.mjs` prints a count
   two higher than on the candidate; on a second scratch copy with
   `const inert = 'BOARDED: not a marker';` appended to `tools/pr-title.mjs`
   it prints the candidate's count; and on the candidate it prints the
   number of comment markers the evidence README lists after reading every
   `git grep -l 'BOARDED:'` hit and classifying each occurrence as a comment
   marker or a string (the scanner's own search string is a string). All
   three runs are recorded in the evidence README.
3. `node --test tools/` passes at the candidate and its recorded output shows
   the script-reference check failing on the copy with the `npm run boards`
   row removed and on the copy with a row for `npm run removed:check`, and
   passing on the unmodified copy; `npm run check:scripts` exits 0 at the
   candidate.
4. `docs/ai-reference/sub-app-rules.md` names `npm run typecheck:e2e` and
   every plain-tier command of the profile's gate table, and names no
   command `npx nx run-many -t lint` runs through `tools/project.json`;
   `README.md`, `docs/ai-reference/README.md` and
   `docs/dev-reference/README.md` name `test:tooling` only as part of
   `lint`, and `README.md`'s pull-request sentence names the affected
   projects' targets.
5. Conventions rule 4 and `foundation-rules.md` state the feature barrel
   shape in WS-001 rule 4's words and `libs/features/*/src/index.ts` match
   it; `catalog.md` names no bare launchpad path and no date of a design
   round (`grep -cE "launchpad's|on 2026-1[01]-[0-9]{2}"` prints 0) and every
   `](…)` link in it resolves; `docs/dev-reference/README.md`'s `docs/dotln/`
   row says where the records' relative links resolve; conventions rule 2
   states the Angular CLI cache setting, its reason, its cost and its
   reopening; `performance.md` has a scene paragraph that states the
   exclusion, its structural bound and its reopening.
6. `git diff --name-only <integrated base>` run in the target worktree
   against the working tree, where `<integrated base>` is the target `main`
   commit step 1 integrated and recorded in the decisions file (the merge
   base of the candidate and `main`), names no file under `apps/` or
   `libs/` and no file under `docs/dotln/`, and `package.json`'s
   `dependencies` keys equal that base's. The records-only commit the
   final-review route adds under `docs/dotln/` afterwards is outside this
   comparison.
7. `node --test tools/` passes with the title workflow's three cases: a
   title that opens with a supported gitmoji and carries no conventional
   type is returned as written, a typed title is decorated with its type's
   gitmoji, and a bare subject is refused.
8. `node scripts/target-gate.mjs WO-027 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-027/README.md` and
`docs/evidence/WO-027/host-qualification.md`.

**Known issues and carry-ins:** This order runs beside WO-033 at the front
of the sequence, moved up on the operator's direction of 2026-11-05, ahead
of WO-034 and the WO-023/WO-024 pair; it integrates the target's `main` at
activation, and a batch that lands after it integrates this order's
document corrections. The base is WO-028's merge, set by the 2026-11-05
pass; the observed gap was re-read there and every count held. REVIEW-002's ER-F5 (the `tool-v0`
reader kept past its one release) is WO-023's carry-in, not this order's;
ER-F10 (the duplicated budget blocks and `test-setup.ts` files) is deferred
by the filing pass with its reopening on the register. This order activates
only on a launchpad whose starter carries core WO-221's `--draft` form; the
draft pull request and its workflow runs are a final-review obligation read
from `docs/evidence/WO-027/preview-pr.json`, never a criterion; the final
reviewer reads there that the title workflow left this order's
gitmoji-and-subject title as written, which no verification criterion can
reach because the draft opens after verification passes.
`Target release classification: patch` and `Target release notes: reviewed`
are set under WO-012's declared policy.

**Non-goals:** a new npm script or a structural barrel check; scene sampling
in `perf:sample`; a closure state in the target's decision records; editing
`docs/dotln/` records, the generator log or the licence notices; code
changes under `apps/` or `libs/`; the launchpad's own documents.

**Operator-review assumptions:** the operator accepts the plain-tier list as
the command list sessions run, the feature barrel exception as WS-001 rule 4
already states it, and the scene paragraph's exclusion with its reopening,
and reads the one draft pull request before final review, which the final
publish reuses.
