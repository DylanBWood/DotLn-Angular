# WO-004 — FINAL-001

**Verdict:** pass.
**Date:** 2026-10-18.
**Work order:** [WO-004](../../work-orders/WO-004-scaffold-dotln-angular-workspace.md).
**Verification sequence:** [VER-001](../../verifications/WO-004/VER-001.md) (pass; criterion 6 unmet, waived by ordinal 4; four follow-ups F1 to F4), then the operator-directed interim draft (decisions D012 and D013): draft pull request #1 on `wo-004` with the work-in-progress commit `65ca027`, its title-workflow run and the automated review whose threads are captured in [preview-pr.json](../../evidence/WO-004/preview-pr.json).
**Subject:** the DotLn-Angular `wo-004` branch over the base `bc9133e932a00d33c15bc5289d683b8078f51ee4`: the reviewed series `be5ee66` (`feat: scaffold the Nx and Angular workspace`, 44 files) and `3e1c3d1` (`fix: replace a stale gitmoji when a pull-request title changes type`), HEAD `3e1c3d18cf4caaebf9a768c8137be227201e0ba9`; and the launchpad side: the order, its [evidence](../../evidence/WO-004/README.md), [decisions](../../evidence/WO-004/decisions.md) D001 to D016, the executor [handoff](../../evidence/WO-004/handoff.md) and [self-review](../../evidence/WO-004/self-review.md), the [repository profile](../../repositories/dotln-angular.md), the control segment and projection, the work-order and decisions indexes and the follow-up register.
**Publication:** [PR.md](PR.md) (the target pull request body), [RECORDS-PR.md](RECORDS-PR.md) (this instance's records branch) and [RELEASE-NOTES.md](RELEASE-NOTES.md) (no release) beside this report.
**Ideation receipt:** none exists for this order. Its provenance is the 2026-10-18 angular-workstream [planning pass](../../planning/angular-workstream-2026-10-18.md) (§5, §6 D7 to D11 and §8) and the planning [refutation receipt](../../planning/refutations/2026-10-18-planning-afc1740dd0afc954-001.md) `2026-10-18-planning-afc1740dd0afc954-001`, aligned-with-findings with no hold and three known issues for this order: criterion 5's records formatting (its reopen condition was met by the subject at VER-001, boarded as D009 and repaired here), criterion 6's title-shape and vocabulary conflict (VER-001 found the eleven types equal in both lists; the conflict stays constructible and unobserved), and criterion 3's fixture (VER-001 observed the rule id and message id on the fixture and no fixture file in ordinary lint).

Reviewer: Claude Code 2.1.302, model `claude-fable-5-1`, effort `xhigh`
read from `CLAUDE_EFFORT` (selected, not effective), dispatched by the
operator's `resume: final review` on 2026-10-18 in the `wo-004` worktree,
the order's recommended reviewer effort. No worker was spawned.

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.302","model":"claude-fable-5-1","effort":"xhigh","source":"claude-session-readback"}
**Process cost:** entry 412,952 tokens; handoff 8,406,356 tokens; source claude-transcript-message-usage

Usage scope: `dispatch`. Entry cutoff 2026-10-18T14:29:39.884Z, read after
the skill loaded and canonical status was taken; handoff cutoff
2026-10-18T15:09:21.628Z, read after both launchpad gates and before this report
was filed. Both are
cumulative counters, mostly cached input, not unique context size; cost in
dollars is unavailable. Fan-out plan: zero of the 20-agent `subagentCap`;
the readback observed zero, exact-observed, and no named claim needed a
worker I could not run myself. Final counters after filing stay in the
ignored receipt and the session response. Cost against the equivalent
outcome: the target's review gate replays the Nx cache and costs about eight
seconds, so rerunning it at the final tree after the repair cost less than
arguing that the earlier row still covered changed bytes; the uncached lint
and test rerun took two seconds; the document gate is paid twice, before and
after the records cite the rows.

## Method and limits

The operator's phrase selected WO-004 in `final-review`; the session hook
recorded the dispatch once and allocated this report, and its briefing
printed the usage command, the cost-line rule and the target publication
commands. Read: the order and its cited sections of the execution guide
(where the control plane finds its documents, workflow closeout and
releases, verification review and attack, discipline's handoff sequence and
Adjacent Repair, preflight before the full gate), WS-001's house rules, the
repository profile and its diff, the operator record, the publication
contract (PRs and commits) and the five reader profiles (balanced default;
none declared), the planning document §6 and §8 and the refutation
receipt's three known issues for this order, VER-001 in full, decisions
D001 to D013, the handoff, the self-review, the evidence README, the control
segment's six events, every authored target file except `package-lock.json`
and `favicon.ico`, the draft pull request's review, comments and workflow
runs, and the worktree, target-gate, target-records, target-publish,
off-ramp, findings-block and cost-line implementations.

Lenses: correctness and tests (every criterion reproduced at the final
tree, and the title helper's behavior under a changed type); authority and
private data (the draft's token, the records commit, the local-terms list);
operator flow (the interim draft, the undo and the two publications); and
the maintainer in six months (the namespace import, the explicit lint
executor, the formatter exclusion). Traps named before the material
choices: anchoring on VER-001's pass and the draft's green checks, met by
reproducing the static probes and the target checks myself at the final
tree; re-litigating the criterion 6 waiver, which the recorded off-ramp
forbids (its capture hashes to the recorded digest, so it is judged from
the record); reading the automated reviewer's fork suggestion as an
instruction to widen the workflow, refused by the Adjacent Repair rule and
by the fact that the suggested trigger cannot serve this pull request;
reading the skill's no-reset rule as forbidding the undo the operator's
standing rule in D012 assigns to final review, resolved by a soft reset that
loses no byte (D016); disposing follow-up rows the integration advisory
only matched by text, refused for the three whose conditions have not
occurred; and editing a verified record or a kit file to make a check pass,
refused. The NoOp, a report without the repairs and the publication, would
have left the operator with a work-in-progress draft and no mergeable pull
request.

Reproduction, in the target worktree under `node scripts/harness.mjs
bounded --` with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`, one process at
a time, outside any gate:

- Static probes at the verified tree: `grep -c '"zone.js"' package.json` 0;
  `grep -c provideZonelessChangeDetection apps/dotln/src/app/app.config.ts`
  1; 5 of 5 `uses:` lines pinned to a 40-hex commit; `npx nx show projects`
  `["dotln-e2e","dotln"]`; `npx nx report` `nx 23.3.0`, `@nx/angular
  23.3.0`, `typescript 6.0.3`; `npm ls` `@angular/core@22.2.3`,
  `vitest@4.1.12`, `typescript@6.0.3`, `nx@23.3.0 overridden`.
- The title helper before the repair: `decorateTitle(':sparkles: fix:
  correct the title')` returned the title unchanged, the defect the
  automated review named. After the repair: `npm run test:tooling` tests 7,
  pass 7, fail 0 (two new tests: a mismatched shortcode or emoji is replaced
  through `decorateTitle`, and `updateTitle` edits a current title whose
  type changed); `npx nx run-many -t lint test --skip-nx-cache` exit 0;
  `npm run lint:fixtures` PASS naming `@nx/enforce-module-boundaries`;
  `npm run typecheck:e2e` exit 0; `npx nx format:check` and `npx prettier
  --check .` clean.
- The formatter exclusion: with a badly formatted `docs/dotln/probe.md`
  present, `prettier --check --ignore-path .gitignore` on it exits 1,
  `prettier --check` with the target's `.prettierignore` exits 0, and
  `npx nx format:check` exits 0; the probe was removed before the commit.
- The declared review gate at the reviewed commit: `node
  scripts/target-gate.mjs WO-004 --review` PASS install (5083 ms), lint
  (493 ms), test (440 ms), format (631 ms), build (448 ms), e2e (481 ms);
  PASS review at `3e1c3d18cf4caaebf9a768c8137be227201e0ba9` (7576 ms), no
  tracked-byte or HEAD mutation.
- The draft: `gh pr view 1`, `gh api .../pulls/1/comments`,
  `.../pulls/1/reviews`, `.../issues/1/comments` and `gh run list --branch
  wo-004`, captured at 2026-10-18T14:44:00.744Z into `preview-pr.json`.
- The upstream references: `gh api` lists the Angular pages under
  `astro-docs/src/content/docs/technologies/angular` at `nrwl/nx` tag
  `23.3.0` and seven entries under `adev/src/content/best-practices` at
  `angular/angular` tag `v22.2.3`; the path the profile named at `nrwl/nx`
  returns HTTP 404.

Limits: the gate's build and e2e rows replay the Nx cache, as the
executor's did; the uncached e2e run that stands for criterion 2 is
VER-001's, at the same application bytes (the repair touched only
`tools/` and `.prettierignore`, neither an input of the `dotln` projects).
No pull request from a fork exists, so the fork-token follow-up rests on
documented token behavior, as VER-001 recorded. The automated reviewer's
output is data: its two claims were reproduced before being routed. The
operator left no comment on the draft. The local-terms coverage is
observed only as `present` after the ignored list was copied from the main
checkout; no term was printed.

## Criterion judgments

**Criterion 1:** met. Expected: `npx nx report` recorded in the README with `nx` 23.x, `@angular/core` 22.x, `typescript` 6.0.x and `vitest` 4.x, no `zone.js`, one `provideZonelessChangeDetection` line. Observed at the reviewed commit: the README records the report; my run shows `nx 23.3.0` and `typescript 6.0.3`, and `npm ls` supplies `@angular/core@22.2.3` and `vitest@4.1.12`, which Nx 23.3.0's report never lists (VER-001 recorded the same instrument limit); the `zone.js` count is 0 and the provider count is 1. Severity: none.

**Criterion 2:** met. Expected: `npx nx run-many -t lint test build`, `npx nx format:check` and `npx nx e2e dotln-e2e` each exit 0 and the smoke test asserts the home heading. Observed: the review gate's lint, test, build, format and e2e rows pass at `3e1c3d18…`; my uncached lint and test exit 0 at the same tree; VER-001's uncached e2e passed one Chromium test asserting the heading `DotLn` inside the main landmark, and its heading mutation failed both unit specs and the smoke test. Severity: none.

**Criterion 3:** met. Expected: `@nx/enforce-module-boundaries` with `depConstraints` rows for every `type:*` tag and the two scopes, and `npm run lint:fixtures` exiting 0 by observing the rule fail on the fixture. Observed: the root configuration declares one row each for `scope:shared`, `scope:dotln` and the eleven types, matching house rule 15 row by row; `npm run lint:fixtures` PASS, naming the rule on `tools/lint-fixtures/boundary-violation.spec.ts` and the allowed control; VER-001's boundary mutation made it fail. Severity: none.

**Criterion 4:** met. Expected: the generator log with a line for `create-nx-workspace` and every generator run, each with the Nx version and the created project, every project in `npx nx show projects` present; the three reference files exist and the conventions restate rules 1 to 6, 12, 13, 15 and 19 to 21 by number. Observed: the log has the command, its refused and discarded attempts, the final invocation creating `dotln` and `dotln-e2e` with Nx 23.3.0 and the `@nx/angular:component` line for `home`; `npx nx show projects` lists exactly those two; `docs/dev-reference/README.md`, `docs/dev-reference/workspace/conventions.md` and `docs/ai-reference/README.md` exist and the conventions carry the numbered headings 1 to 6, 12, 13, 15, 19, 20 and 21. Severity: none.

**Criterion 5:** met. Expected: `ci.yml` runs format check, lint, test, build and e2e on pull requests, `pr-title.yml` with `gitmoji-map.json` prepends the type's gitmoji, and every `uses:` is pinned to a commit SHA. Observed: on `pull_request` `ci.yml` runs `npx nx format:check`, the fixtures, the tooling tests, the e2e type check, the board count and `npx nx affected -t lint test build e2e` after `nrwl/nx-set-shas`; `pr-title.yml` runs `tools/pr-title.mjs`, which reads the map and prepends the shortcode, now also replacing a prefix that does not match the title's type; 5 of 5 `uses:` lines carry a 40-hex pin, each equal to its tag's commit per VER-001; the live run on draft #1 (run 39135428377) completed with success and decorated the title. Severity: none.

**Criterion 6:** unmet, waived by 4. The draft pull request is ordered after the verification pass, so VER-001 could not observe it; the operator waived the criterion there (capture SHA-256 `d062d38ec0cdf1aa4f44c47afdc707193a3c9b499037862a1f06c7484641f9c8`, matching the `CriterionWaived` event at ordinal 4), and this review judges it from that record. What the order asked for has since been observed and is recorded, not relabeled as a pass: draft #1 was opened after the pass under the operator's work-in-progress rule (D012, D013), its title-workflow run completed with success and the live title begins with `:sparkles:`, CI completed with success, and its threads (one automated review with two comments, no operator comment) are captured in `preview-pr.json` and routed in D015: one repaired here, one boarded. The published pull request supersedes the draft, which the operator closes.

**Criterion 7:** met. Expected: `node scripts/target-gate.mjs WO-004 --review` records a passing row for every declared command with no tracked-byte mutation, `npm run test:docs` passes in the order worktree, and the Preflight ran before the first full gate. Observed: the review row at `3e1c3d18…` passes install, lint, test, format, build and e2e with no mutation (recorded above and cited by the result transition); `npm run test:docs` passes at the reviewed records (the executed-checks section); the README records the target preflight at 12:50:47Z to 12:50:53Z and the document gate at 12:51:33Z before the first gate command at about 12:51:41Z, as VER-001 confirmed. Severity: none.

## Implementation review

The scaffold is what the Design asks for and little else: the generator's
output with the house configuration applied, the welcome component gone,
and every deviation recorded. The shell is zoneless, routed with component
input binding, served over fetch HTTP, and renders one heading through an
eager `Home`; both specs and the smoke test discriminate, as VER-001's
mutation showed. The boundary configuration is the house rule 15 table,
entry for entry, and the fixture check exercises it in a real isolated Nx
graph rather than by grepping output. The workflows pin every action to a
commit and give the title job the one permission it needs. The generator log
is honest about the three attempts the workspace CLI needed, which is the
record a maintainer will want when Nx changes its option translation again.

Two defects were repaired in this review within the Adjacent Repair bound
(D015): the title helper kept a stale gitmoji when a decorated title's type
changed, because any recognized prefix was accepted (the automated review's
second item, reproduced; F1 below); and the target formatter had no
exclusion for the records this launchpad files under `docs/dotln/`, so a
record formatted differently from the recorded bytes would have failed the
pull request's format check on files the order cannot change (VER-001 F2,
D009). The first is four lines and two tests; the second is one ignore
entry proven by a probe. Both are inside the declared surfaces and break no
criterion. The profile's two upstream references (VER-001 F1, D008) now
name a tag that exists and a path present at it.

Left as they are, with the reason: `app.config.ts` imports `@angular/core`
as a namespace so that criterion 1's `grep -c` counts exactly one line; a
named import would count two and fail the criterion as written. It is
harmless and VER-001 recorded it; a later order may normalize the import
once the criterion is history. `apps/dotln` keeps the generator's explicit
`@nx/eslint:lint` executor that Nx 23 warns is removed in v24; Nx's own
migration owns that conversion. The reference documents say the records
under `docs/dotln/` are "populated by the launchpad"; the word is this
instance's, not the product's, and the outward lint screens only what the
pull request carries, so this is an observation for a later documentation
pass, not a finding.

Private data: no absolute path, hostname, credential or home directory is
in the target or in the records; the draft's threads are public review
text; the local-terms list was copied into this worktree and never
printed.

## Draft pull request threads

Draft #1 (`wo-004`, head `65ca027`, opened 2026-10-18T14:18:51Z) carries
one review by `copilot-pull-request-reviewer` (COMMENTED,
2026-10-18T14:22:57Z) with two comments and no issue comment; the operator
left none. Routing, recorded with the capture in `preview-pr.json` and in
D015:

- Comment 4307382142 (`.github/workflows/pr-title.yml` line 4): fork pull
  requests receive a read-only token, so `gh pr edit` cannot decorate their
  titles; it suggests `pull_request_target`. Route: follow-up, the row
  VER-001 already boarded (`FUP-223cde718a523e67`, D010). The suggestion is
  not applied here: that event runs the workflow file from `main`, which
  holds no workflow until this change merges, so this order's own pull
  request would get no title run; D010 names the two routes and the next
  repair chooses.
- Comment 4307382175 (`tools/pr-title.mjs` line 18): a decorated title
  whose type changes keeps the old gitmoji. Route: finding F1, reproduced
  and repaired in the second reviewed commit with two regression tests.

## Integration and release surfaces

`npm run worktree -- integrate WO-004 --intake-backup <archive>` found
`main` and `wo-004` at the same commit `09ca250c…`, so the merge changed
nothing; checkpoint `refs/dotln/checkpoint/WO-004/7` and the named stash
`73993d32…` are retained and the nine working-tree entries were restored
intact. The intake backup (four captures) was written into the DotLn session
scratch, as WO-003's review did. Every regenerate step completed with no
pending step; the three read-only affected checks passed afterwards
(`publication:check` no editions declared; `harness check` 34 generated
surfaces, local-terms list present; `release check-surfaces --local` every
rule passed, `docs/LEGAL.md` pins unavailable because none is declared). The
integration record is completed in
[WO-004-D014](../../evidence/WO-004/decisions.md#wo-004-d014-complete-the-integration-record-main-and-wo-004-were-the-same-commit).

Release surfaces: this is a target order; `release prepare` reported that it
records no release and changed no file. The reviewed target commit series is
bound in D016: the work-in-progress commit of the draft was undone with a
soft reset that moved only the branch pointer, and two commits were made,
the scaffold and the title-helper fix, each with a plain conventional
subject and no trailer; the review gate was then run at HEAD. The profile's
`Checked` line names that commit and the observed versions. Four follow-up
rows whose conditions occurred are disposed as settled in the register
(D008 and D009 by the repairs, D011 by the operator's direction in D012,
WO-003-D004 by the clone WO-004 activated from); the rows for D010, D012
and D013 stay as filed.

## Findings

One finding, not blocking: the stale-gitmoji case in `tools/pr-title.mjs`,
present in the verified subject and inside verification's review scope
(VER-001 read the helper and tested its rerun path, so this is an escape),
named by the draft's automated review, reproduced and repaired in this
review (D015). VER-001's four follow-ups are disposed above rather than
re-listed: F1 and F2 repaired, F3 still open and reinforced by the automated
review, F4 answered by the operator in D012 with the planning duty carried by
D012's own row.

<!-- dotln-findings:start -->
[
  {
    "id": "F1",
    "route": "follow-up",
    "class": "escape",
    "summary": "tools/pr-title.mjs kept a stale gitmoji when a decorated title's conventional type changed; repaired in commit 3e1c3d1 with two regression tests, no board left (D015)"
  }
]
<!-- dotln-findings:end -->

## Executed checks and product gate

- Target, at the reviewed commit `3e1c3d18…`: the declared review gate
  passed every command (recorded above); `npm run test:tooling` 7 of 7;
  `npx nx run-many -t lint test --skip-nx-cache` exit 0; `npm run
  lint:fixtures` PASS; `npm run typecheck:e2e` exit 0; `npx nx format:check`
  and `npx prettier --check .` clean; `git status --short` empty; `git diff
  --cached --check` clean before each commit.
- Launchpad, at the reviewed records: `npm run format` applied; no file
  changed. `npm run test:docs`: 17 passed, 0 failed, recorded
  2026-10-18T15:08:17.730Z; the seventeen tasks took about five seconds of
  work inside 793.12 s of wall clock, because the scheduler waited for a host
  lane before the first task, as WO-001's and WO-003's reviews observed
  (an observation for the kit, not a finding). Advisories: the three
  pre-existing operator-word advisories on WO-003-D003, WO-001 FINAL-001 and
  WO-003 VER-002, filed records this review does not edit; none on this
  order's records. The result transition runs the document gate again
  inline over this report's final bytes.
- `npm test -- --review`: 2 passed, 0 failed, 0.57 s (`kit-verify` 0.11 s,
  928 files verified at `7b8206f4b97d290473e4e619271521f496ce56aa`;
  `harness` 0.21 s), recorded 2026-10-18T15:08:45.843Z; the review selection
  carries only those two suites because no machinery suite source changed,
  and this order changes no launchpad code, so its code identity is
  `main`'s.
- `git diff --check`: clean, including the untracked records.
- `node scripts/harness.mjs check` (34 generated surfaces; local-terms list
  present), `npm run publication:check` (no editions declared) and
  `npm run release -- check-surfaces --local` (every rule passed): as
  recorded in D014. `npm run terms -- check` over this order's seven
  records and over copies of the target's text files (the title helper, its
  test, `README.md` and the four reference documents, copied into the
  ignored control-local lane and removed): list present, no match.
- `npm run meta` and `npm run work-orders -- index`: regenerated after the
  decisions; `npm run plan -- followups --apply`: four rows settled at
  register revision `511559dc…` (D016).
- Background monitors: none left running; the three background chains this
  review started (records, document gate, product gate) completed before the
  result was recorded. No agent launched.

The outcome matched the operator's direction: the scaffold passes every
criterion that is not waived, the one waiver is judged from its capture and
the draft it waited for has been observed and routed, the two defects inside
the surfaces are repaired and the reviewed series is bound with its passing
gate, the integration and the records are prepared, and the target pull
request and the records branch are published after this result is recorded.
This report's evidence and usage have the cutoffs above; later completion
receipts do not revise these bytes.
