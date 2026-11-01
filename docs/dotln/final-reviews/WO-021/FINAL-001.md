# WO-021 — FINAL-001

**Verdict:** pass — all eleven criteria are met and none is waived.
**Date:** 2026-11-01.
**Work order:** [WO-021](../../work-orders/WO-021-concept-studies-rxjs.md), as the 2026-11-01 pass left it; no amendment or override was recorded. A waiver recorded during verification was removed on the operator's direction, as [The recovery](#the-recovery) sets out.
**Verification sequence:** [VER-001](../../verifications/WO-021/VER-001.md) (fail on criterion 9's status clause alone; the other ten met on the verifier's production session and probes) and [VER-002](../../verifications/WO-021/VER-002.md) (pass on the same product tree, all eleven met).
**Subject:** the DotLn-Angular `wo-021` target worktree from the activation base `4c21c586634ac8a5ab5dba9852cd7da81c6d6ee9` to the reviewed commit `52ba4c7eef7cc30c1c92f77a9602a5aa02656d85`, tree `18e79e8409e334c35c7e1d9eec7a97e19dee556a`. The base is still the target's `main`, and integration took in nothing on either side. The launchpad worktree's change is `dotln.config.json` (step 2) and the records.
**Publication:** [PR.md](PR.md) and [RELEASE-NOTES.md](RELEASE-NOTES.md) beside this report, for the target's pull request 12 on `feat/rxjs-concept-studies`, which the verifying session opened as a draft and the final publish reuses and marks ready. [RECORDS-PR.md](RECORDS-PR.md) is the body of this worktree's records branch.
**Ideation receipt:** none exists for this order. It is planner-synthesized by the 2026-10-30 second [planning pass](../../planning/concept-batches-and-quality-passes-2026-10-30.md), judged `aligned-with-findings` in refutation receipts [`2026-10-30-planning-18e7afc23edf14c3-015`](../../planning/refutations/2026-10-30-planning-18e7afc23edf14c3-015.md) and [`2026-11-01-planning-534673481277a9fc-016`](../../planning/refutations/2026-11-01-planning-534673481277a9fc-016.md). Their seven known issues on this order are judged under [Known issues and carry-ins](#known-issues-and-carry-ins).

Reviewer: Claude Code 2.1.316 (from `claude --version`), model `claude-opus-5-5`, set by the operator immediately before this dispatch, dispatched by `resume: final review` on 2026-11-01 at 07:47Z in the `wo-021` worktree. Effort is `max`, read from `CLAUDE_EFFORT`; that is the selected effort, not proof of the effective one, and the order recommends xhigh. No worker was launched: every claim below could be run or read here.

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.316","model":"claude-opus-5-5","effort":"max","source":"claude-session-readback"}
**Process cost:** entry 106473 tokens; handoff 22734791 tokens; source claude-transcript-message-usage

Usage scope: `dispatch`. The entry reading was taken at 2026-11-01T07:47:14Z, after the skill loaded; the handoff reading at 2026-11-01T08:14:12Z, after the records were written and before this report was filed. Both are cumulative counters that include cached input, so they are not distinct context tokens. Cost in dollars and reasoning tokens are unavailable. Final counters stay in the ignored receipts and the handoff response.

## Outcome

The outcome matches the order's Objective. RxJS has twenty studied concepts; the shelf and the Tools home count them, a chosen work lists them, and each opens at its own address to a study on one example: the idea and the situation it serves, a marble diagram stepped frame by frame with a text equivalent naming each emission, ordinary pseudocode with the worked frames, the executable code with the spec that ran it named beneath, where the app uses the operator where it does, public uses, references, limits and the nearby operators as links. The drawing and the test share one module, so they cannot disagree. share and shareReplay run the same streams and differ at frame 7; Subject, BehaviorSubject and ReplaySubject read as the three memories; catchError and retry as the two answers to an error.

This review changed no byte of the target. The tree the verifier walked, the review gate judged, the draft carries and CI passed from a clean checkout is the tree the reviewed commit holds. What it did change are the launchpad's records: the write-backs step 14 leaves to it, and the small repairs below.

## The recovery

VER-001 failed criterion 9 because Git status listed the uncommitted implementation. The operator rejected that as a blocker, directed the commit, the pull request and the handoff here, and then refused a waiver the verifier had recorded without their authority; [D028](../../evidence/WO-021/decisions.md#wo-021-d028) records the exchange. I judged this recovery rather than taking it as read, because the session that wrote VER-002 also made the repair and the commit, filed its report 65 seconds after requesting it, and edited the control log by hand.

- **Authority.** Both captures hash to the digests D028 records. Their words direct the commits and the pull request, and refuse the waiver. The commit before final review and the removal of the waiver both stand on them, and neither is put back to the operator.
- **The log.** I diffed the audit capture against the live segment. Of its six lines, five are byte-identical in the live log and the sixth is the `CriterionWaived` of 07:32:27Z; the four live lines the capture lacks are the lifecycle's own later events. Nothing else moved.
- **The bytes.** The reviewed commit, the draft commit and the review gate row all name tree `18e79e84…`, the candidate tree VER-001 walked.
- **The clause.** I ran it. Status in the target prints nothing, and the ignored listing leaves no remainder. Criterion 9 is met by the command as written, not by a reading of it.
- **VER-002's evidence.** It adds no new product check and says so: its product claims are VER-001's at the identical tree. So I rested no claim on VER-002 alone, and reproduced below whatever a command could reach.

The recovery leaves two things to fix. The kit has no way to retract a waiver, so the committed segment no longer shows that one was ever recorded ([D030](../../evidence/WO-021/decisions.md#wo-021-d030)). And WO-022's criterion 9 carries the same clause, so its verifier would meet the same conflict ([D031](../../evidence/WO-021/decisions.md#wo-021-d031)); that needs a planning pass before WO-022 activates.

## Method and limits

Read whole: the order and its cited sections, product 07 §Verification review and attack and 08 §PRs and commits and §Release-note edition, the repository profile, both verification reports, decisions D001 to D028 with the operator captures they cite, the handoff, self-review, critics' record, fan-out, walkthrough, README and host-qualification record, and the source side of the target diff: the study model and its family split, the marble builder and spec helper, the drawing, component, template and styles, the study composite, mapper, facade, scrubber and explanation, the record check and its tests, the browser specs and the document write-backs. The twenty movement models were read as their aggregated diff, which is the type rename and `family: 'motion'` only. All twenty records were read as prose against RxJS 7.8.2's behaviour, and the twenty modules against their records. The specs were read at the switchMap and builder level and checked mechanically beyond that: all 203 cases carry an assertion.

Lenses: correctness and tests, because a reader will trust the drawing as evidence; operator flow, because the Objective is the operator's own session and the recovery cost them dearly; authority, because of the control-log edit; the maintainer in six months, because three batches build on this family and this check. Security confinement does not apply to this local content and rendering change.

Reproduced on the reviewed commit: every criterion's literal command, the uncached Tools suite (58 files, 515 tests), `npm run studies:check`, a fresh `npm run studies:links` (all 99 RxJS addresses answer 200; the one 403 is the movement batch's known DOI), every operator-capture digest, the app-use citations against the base source, and the launchpad's own complete gate. From the modules' syntax trees, all 112 marble strings are literals or, for observeOn's paint lane, a literal constant; no expected marble is computed. The added lines hold no skip, no type or lint suppression and no launchpad identifier or private path.

Traps named before the material choices, and what I did about each:

- **Taking VER-002's pass as the verdict.** It is a recovery report over VER-001's evidence, so I re-derived each criterion here.
- **Sending it back over the control-log edit or the early commit.** Both were the operator's direction, recorded with matching digests. Failing would hand them back the recovery they had already judged; the kit's gap is boarded instead.
- **Rerunning the target gate because a commit appeared.** The row binds bytes and they did not move; a rerun would restore the same cache entries. CI's clean checkout is the better second witness and it passed.
- **Assuming, as WO-020's review could, that no launchpad gate is owed.** Step 2 changed `dotln.config.json`, so the code identity differs from `main`'s and the records publish would refuse. The complete gate ran here and is bound after the result.
- **Leaving the order's title in place.** It cannot pass the outward lint; the draft's shortened title stands.

Limits. I did not repeat the browser walkthrough or run the e2e suite locally: criterion 1 is the verifier's, this is the tree it walked, I inspected its screenshots at 360 and 1440, and CI's e2e and visual steps passed on this tree. The gate's `test`, `build` and `e2e` rows read Nx's cache of the Preflight's run on the same tree; my uncached Tools run and CI cover that. No spec was mutated to prove it fails. The operator's own check of the finished work, which D019 promises, is still theirs.

## Criterion judgments

**Criterion 1:** met — VER-001 performed the Objective's session in the production build at 360, 768 and 1440 on 2026-11-01 from 07:14Z, and its `## Walkthrough` carries the dated steps and the verifier's own statement of what switchMap drops, how share and shareReplay differ and what the three subjects remember; VER-002 restates it at the identical tree. `ls docs/evidence/WO-021/walkthrough | wc -l` prints 59. I read the screenshots at 360 and 1440; they show what the report says.

**Criterion 2:** met — `npm run studies:check` prints `check-studies: 40 records; 0 problems` here. `tools/studies.test.mjs` pins the twenty ids, none substituted; every record is `checked` with two distinct reviewers, my read of the twenty found every reference complete, and the summary check passes.

**Criterion 3:** met — All twenty records are executable, with no illustrative exception: no record carries the mark, and each names its module under `studies/rxjs/` with a spec beside it. The uncached `nx test tools` here passes 58 files and 515 tests with twenty example specs counted. They sum to 197 tests, not the 196 in the handoff and VER reports, a figure that predates observeOn's added spec. The family's assertion that the strings come from the module is `expectMarbleExample`, which every spec calls and the record check requires: it runs the example's strings under the TestScheduler, then holds what the model built from that same object draws as delivered to what each output delivered, frame for frame.

**Criterion 4:** met — `fan-out.md` lists twelve workers with labels, statements and token totals, beside the session's own reading and WO-014's total: the stop figure was not reached. `review.md` disposes every critic finding and carries all twenty modules' spec results from the factual critic. The README's table lists exactly the 99 URLs the records cite, each at 200; my script compared the two sets, and a fresh link check agrees.

**Criterion 5:** met — The review row's `e2e` command passes, and CI's `checks` passed the same tree from a clean checkout. `catalog.spec.ts` carries the step 9 cases by name: twenty studied, switchMap stepped under reduced motion with the emission named, the executable label and spec, share and shareReplay opened in two tabs from the nearby link and compared at frame 7, axe at the board's threshold and no overflow at 360, 768 and 1440.

**Criterion 6:** met — VER-001's `npm run check:bundle` reads 403,427 initial bytes with an empty `lazyCodeInInitial`, and the review row's build passed within budgets. The records and the builder sit in lazy chunks; the composite is in the lazy Tools chunk. The README's sizes stand beside WO-020's, with the builder's row corrected here to the final tree's 14,546 bytes. Dependency keys equal the base's (15 keys; no byte of `package.json` or the lockfile changed).

**Criterion 7:** met — `catalog.md` §Studies has the coverage row `RxJS | twenty` and describes the `marbles` family, and `grep -c "marble" docs/ai-reference/catalog-rules.md` prints 2, the executable rule among them.

**Criterion 8:** met — `comparisons.md` records the first pair and all fifteen rounds with their picks; D016 and D019 carry the operator's ending words with their digests, which I verified. No candidate had a file of its own (D021), so the `ls` has nothing to run on, and D021's grep over the family, composite and RxJS paths prints nothing here.

**Criterion 9:** met — Here: the one-liner prints `30 true true 17`, and the declaration equals the order's thirty entries in order; `grep -c '^/\.runtime/$' .gitignore` prints 1; the ignored listing of 46,047 paths leaves an empty remainder against the thirty roots and seven manifest paths; `git status --porcelain --untracked-files=all` prints nothing after the review gate. `npm run test:docs` passed; its row is the one this result consumes. No waiver applies, and the base checkout's separate judgment stays the close's.

**Criterion 10:** met — A file holding `{ not json` exits 1 with `FAIL check-studies: … at /: schema type`, and the case is in `tools/studies.test.mjs`; the `readonly step = computed` grep prints 0; the README grep prints 1; "draws a study whose family has no motion frames, and scrubs it by frame" is in the passing Tools suite.

**Criterion 11:** met — `target-gate:c61b4b39-1d52-4c67-8927-bd30f5fc5aa7`, recorded 2026-11-01T07:17:20.310Z, passes install, lint, typecheck, test, format, build, e2e and visual at this tree with no tracked-byte mutation. The Preflight ran 06:59:08Z to 07:02:43Z, before the first gate row at 07:03:52Z. `npm run test:docs` passes in this worktree on the final records.

## Known issues and carry-ins

The carry-ins hold. D018's discriminator is in `study-model.ts` and kept through the mapper and the composite, and the three repairs of D020 are done; both register rows are allocated to this order. The order's Observed gap says the app uses combineLatest and shareReplay; the base imports neither, so their records rightly name no app file. Nine records name an app file; eleven name none because the app does not use those operators, a narrower result than the Design's "each record", and a true one.

Receipt 016's five findings on this order:

- (a) The residue declaration sitting inside a target order: no third order carries it, and WO-022's half has not merged, so the condition stands unmet.
- (b) The close's benefit being unmeasured: the close has not run. WO-021's close will show it.
- (c) Rule beating on the executable rule: neither exception was taken, and no expected marble is computed from the operator under test (112 strings read from the syntax trees). The condition did not occur.
- (d) The count of carry-ins: all four repairs fall inside criterion 10's checks, and no report disagrees. The condition did not occur.
- (e) Studies as bundled records: WO-018 has not planned a migration, and at 403.4 kB initial against a 500 kB warning the bundle is not near its budget. The condition did not occur.

Receipt 015's two: the records use the `pseudocode.executable` path and this diff changes neither the schema nor a second path; and I read every app file a record names at the base, each of which carries the operator it is cited for, takeUntil's as the `takeUntilDestroyed` its record names. Neither condition occurred.

[D024](../../evidence/WO-021/decisions.md#wo-021-d024)'s three deferrals stand: none of the twenty examples reaches them, and the builder refuses or the contract names each.

## Findings

Basis for the classes: F2 was in the verified subject inside the review VER-001 ran, and VER-001 consumed the README's table without remeasuring, so it is an `escape`. F1 was also in the subject, but verification found and boarded it, so it did not escape; with F3 to F6, which arise from the kit, the planning text or older records, it is `new-scope`. F1, F2 and F5 are fixed in this review and keep the `follow-up` route; nothing here is blocking.

<!-- dotln-findings:start -->
[
  {"id": "F1", "route": "follow-up", "class": "new-scope", "summary": "The repository profile's residue section still listed twelve roots and called the local-control directory non-disposable; repaired here (VER-001's F2, D026)."},
  {"id": "F2", "route": "follow-up", "class": "escape", "summary": "Evidence figures predated the recheck's last fixes: the README's builder-chunk row and the host record's Preflight time, corrected here, and the 196 example-spec tests, stated as 197 in this report."},
  {"id": "F3", "route": "follow-up", "class": "new-scope", "summary": "The kit has no route to retract a waiver recorded without authority, so the recovery removed the line from the control segment by hand (D030)."},
  {"id": "F4", "route": "follow-up", "class": "new-scope", "summary": "WO-022's criterion 9 carries the same Git status clause that produced VER-001's false blocker (D031)."},
  {"id": "F5", "route": "follow-up", "class": "new-scope", "summary": "The profile's release and area tables stopped at v0.6.0 and WO-015 and its concept count at twenty; repaired here."},
  {"id": "F6", "route": "follow-up", "class": "new-scope", "summary": "The order's prescribed pull-request title is 80 characters against the outward 72-character limit; the draft's shortened title stands (D029)."}
]
<!-- dotln-findings:end -->

## Follow-ups

| Row | Disposition |
| --- | --- |
| `FUP-41120ad91f51530b`, D026, the profile's residue section | settled: repaired here, and the list equals the config |
| `FUP-205c7278eb568fe2`, C1, a self order for the declaration | settled: this order carries it, and its reproduction is criterion 9 |
| `FUP-c8f69c4a297dd80c`, D030, a waiver retraction | new, for core |
| `FUP-6f24c707f401ecac`, D031, WO-022's criterion 9 | new, for the next planning pass, before WO-022 activates |
| `FUP-18453d87e5fb7aa4`, `FUP-48bdda2088d435b7` | left: each reopens on a close, which has not run |
| `FUP-35187266d29e00dc`, `FUP-592e538095eaead9`, `FUP-9958a2830a81ad0c`, `FUP-c9f1e0a81d3ddaba` | left: textual matches only |

## Goal alignment

The outcome matched the aim of the order: twenty studies a senior engineer can trust, because each drawing is the run its test passed. The verification's aim was missed once, on a blocker of the order's own wording; the cost was the operator's, and it is recorded where it belongs. The NoOp for the target was the right choice: any repair would have moved it off a tree that four independent readings agree on, and I found nothing that earned that.
