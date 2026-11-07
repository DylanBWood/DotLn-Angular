# WO-034 — FINAL-001

**Subject:** target `dotln-angular`, base `d7d842dc4fdbde03099695933a448d9632fa4335` (`v0.10.1`), reviewed as six commits on the target's `wo-034`, `4228e01` to `0ac470e`, whose last tree is `d554030f09eb631952b8b6f1c2396b6938f20398`, the tree VER-001 verified; the launchpad order worktree on `wo-034` at `527eb8c`.

**Verdict:** pass. All nine criteria are met, none waived or recorded defective. There is no blocking finding. Of four follow-ups, three are boarded in [D015](../../evidence/WO-034/decisions.md#wo-034-d015) and one, the draft's title, is fixed by the final publish.

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.319","model":"claude-opus-5-5","effort":"max","source":"claude-session-readback"}

The reviewer is Claude Code 2.1.319 on `claude-opus-5-5`. The session exports `CLAUDE_EFFORT=max`, the operator's selection; that is the selected effort, not a readback of effective effort. The order recommends `xhigh` for the reviewer; the attestation records the value actually supplied. No worker was launched (0 of the cap of 20).

**Process cost:** entry 98,353 tokens; handoff 48,412,871 tokens; source claude-transcript-message-usage (scope dispatch; entry read at 2026-11-07T02:18:02Z, handoff at 02:54:53Z, before the document gate and the result transition)

The dispatch stood at 0 h 37 min of its 8 h 0 min bound with no complete gate run: the executor's review gate row at the verified tree stands for the reviewed commit, because the commits end at that tree. Most of the handoff total is cached input re-read on each tool turn. The order's own figures from `npm run meta` during this review: 175,017,490 tokens so far, machinery share 0.366 against WO-027's 0.663.

## How this review ran

The dispatch was the operator's `resume: final review`, recorded by the harness at 2026-11-07T02:17:51Z. The reviewer read the order, the executor's handoff, evidence README, decisions and host record, VER-001 with its walkthrough, criteria and findings, the planning receipt's known issues as VER-001 read them, the publication contract (product 08 §PRs and commits and §Release-note edition), product 07 §Verification review and attack, WS-001's rules 10, 12, 20, 24, 29, 30 and 31, the profile's §Publish a change and its registered gate, and the reader profiles of the four surfaces it writes. It read the whole target diff: the shared formatter and `presentation.ts`, the corpus guard, the marble helper and its new spec, the testing translations, the drawing's five files and their specs, the wall study, the changed model specs, the EIP and RxJS specs, the two target documents and the three tools, and `two-level-formation-steering.presentation.ts` and `scalable-formations.presentation.ts` whole, beside VER-001's three.

Target commands ran one at a time: Git with `git -C` from the launchpad root, `node --test tools/` and `npx eslint --print-config` from the target worktree, and the production build, the walkthrough and the per-commit Tools suites as programs in session scratch under the launchpad's bounded wrapper. Its programs and results are under [final-001/](../../evidence/WO-034/final-001/README.md), and the host observations are in [host-qualification.md](../../evidence/WO-034/host-qualification.md#final-review-2026-11-06).

## Integration

Neither `main` had moved. `git fetch origin` in the target found `origin/main` still at the base `d7d842d`, and `worktree integrate WO-034` reported that the launchpad order worktree was not behind `main` (`527eb8c`, identical on the public repository). No conflict arose and no draft decision was carried forward.

## The session (WS-001 rule 24)

The reviewer performed the Objective's session on the reviewed sources before recording this result. It read `two-level-formation-steering.presentation.ts`, the Objective's example, top to bottom: every function takes the translator with one `EscortFrame` or the run's `EscortDescription`, or a sample, its step and the example, never more than three parameters, and the worked lines read named values through named placeholders. It drew one more module at random from the sixteen that neither VER-001 nor this review had read and read `scalable-formations.presentation.ts` whole: its run description carries the bounds, the step the patrol fills and the lane's edges once, and every frame function takes the translator, that description and one sample. It read the three tools WO-027 landed whole. It built the candidate's production bundle itself and stepped Obstacle and wall avoidance through every frame of the default run and of the one-unit-ray run in a fresh Chromium at 360×800, 768×1024, 1440×900, 2080×1460 and 3840×1620, then read the frames at both operator sizes as images. The frame data equal VER-001's walkthrough apart from timestamps and image digests ([results](../../evidence/WO-034/final-001/wall-results.json)).

What the avoidance did that Seek alone did not, read from those frames: the nine-unit ray reaches the wall on frames 5 and 6 only, and for those two frames the courier seeks a point six units back out from the wall instead of the delivery, which turns it a few degrees further towards the wall's top end. From frame 7 it seeks the delivery again. Seeking does most of the turning; avoidance buys the margin, 0.12 units of clearance rounding the wall's end at 2.9 s where the one-unit ray, which never hits, lets the body cut 0.08 units into the wall. The page says so; only the comparison chart hides it, because both traces share an axis twelve units tall (D013).

## Criteria

**Criterion 1:** met. VER-001 performed the reading on the committed tree's bytes and its `## Walkthrough` holds every step the criterion names: three modules drawn at random with the command and its output (`wander`, `formation-pattern-interface`, `arrive`), each read top to bottom, the wall study opened in a served production build at the operator's sizes and stepped through its default run and its ray-too-short comparison, frames at both operator sizes, and in the verifier's own words what each read function takes and returns and what the avoidance did that Seek alone did not. The executor recorded this criterion unmet at handoff (ordinal 2) as the verifier's act, not as a defect; VER-001's walkthrough is that act, and this review's own session above reproduces its frame data exactly.

**Criterion 2:** met. The evidence directory's `shape-audit.mjs`, rerun over the reviewed tree, writes `shape-audit-after.json` byte for byte: no function in the first batch's sixty model files takes more than four parameters, its messages hold no `valueN` placeholder and 1,251 nested model keys against no flat one, and the 23 functions of 70 counted lines or more each stand beside the executor's one-line judgment in the evidence README. VER-001 reproduced `shape-audit-before.json` from the integrated base with D060's counts (17, 38, 94). The two functions VER-001 read whole and the two modules this review read support those judgments.

**Criterion 3:** met. `dom-diff.json` compares 6,950 frame and view rows per build of the forty movement studies, none missing or added, and its only differing rows are the 162 of Obstacle and wall avoidance, the frames step 7 names; VER-001 reproduced it from the archived captures and with its own crawls of its own builds, and compared all forty models over 302 input cases, the other thirty-nine identical in every field. No simulation or scene-engine file changed. Each changed movement model spec keeps its physical-position and value assertions: four count the model's vectors apart from the drawn ones, one adds a corner-label case and the wall spec adds computed checks, and every commit of the series passes the Tools suite. The review gate row `target-gate:4fdd7930` at the reviewed tree passes the browser and visual suites, and the only change under `apps/dotln-e2e` is `movement-labels.spec.ts`, with no baseline changed.

**Criterion 4:** met. The evidence README records the three runs: the candidate passing the corpus test, and the appended literal and the literal parameter each failing it on a scratch copy. VER-001 reproduced them with VER-003's own strings at other sites and two further variations, all failing, and showed ESLint failing an 88-line study function. This review's `eslint --print-config` on `arrive.presentation.ts` resolves `max-lines-per-function` to error with `max: 80`, blank lines and comments skipped.

**Criterion 5:** met. The unchanged VER-001 label sweep, run by the executor over the candidate's production build and again by VER-001 over its own, reads 17,375 frames of both movement batches at 360, 768, 1440, 2080×1460 and 3840×1620 with zero clipped and zero overprinted frames. The three D037 regressions, one per rule (the guide's end, the unread vector, the room by font size), fail on the base drawing and pass on the candidate in both runners, and they run in the review gate's browser suite.

**Criterion 6:** met, by the criterion's alternative. The frame "Turning along the wall" opened is gone, so the first branch's order is not the judgment. The caption says only what the run shows, "a small clearance correction, not sustained steering along the wall", which this review's frames confirm. [D002](../../evidence/WO-034/decisions.md#wo-034-d002) and [D005](../../evidence/WO-034/decisions.md#wo-034-d005) record why no honest default achieved the turn: a bounded search of 63 and then 945 parameter sets, rerun with a corrected angle metric, found none meeting the sustained-contact, later-tangent, clearance and short-ray conditions. The rest of the first branch holds as well: the ray-too-short comparison is on the page, the limits state the 0.74 overlap computed from the unchanged simulation for lengths 10 to 12, and `review.md` records both critics' findings disposed with the record `checked`.

**Criterion 7:** met. `studyEip/en.json` holds none of the twelve spec-only keys, each now defined beside its spec; `studyAifg/en.json` holds no `wander.record.parameters.drawPairs`, and its title rows are exactly the 89 that records and nearby links name; no model message among 1,022 EIP and 486 RxJS ones begins with a placeholder; `tools/i18n-copies.test.mjs` passes within the tooling suite and at every commit of the series; the evidence README lists all 29 reworded messages with their text before and after; and `transfer.json` records the first AI for Games reading at 185,788 gzipped bytes at the base and 178,607 at the candidate, which VER-001 reproduced.

**Criterion 8:** met. The evidence README records each of the three tools with its reading under rules 26, 30 and 31, the verdict "reshaped documentation only" and its reason, and the diffs add accurate JSDoc and change no statement. `node --test tools/` passes 92 of 92 in the target worktree, and `git diff --name-only d7d842d -- tools/board-count.test.mjs tools/check-script-reference.test.mjs tools/pr-title.test.mjs` prints nothing, with all three paths tracked at the base.

**Criterion 9:** met. The canonical rows at tree `d554030f…`, which the reviewed commit carries: the plain gate (`target-gate:7c681f88…`) passes all five declared commands and the review gate (`target-gate:4fdd7930…`, 2026-11-06T23:55:19Z) all eight, with no tracked-byte mutation. The Preflight line ran first, ending with the document preflight at 23:48:00Z before the plain gate began, as VER-001 established. This review runs `npm run test:docs` in the launchpad order worktree once after its last document edit, and the completion consumes that row.

## The verification sequence

VER-001 is the only verification, a pass on every criterion with three follow-ups boarded in [D011](../../evidence/WO-034/decisions.md#wo-034-d011), [D012](../../evidence/WO-034/decisions.md#wo-034-d012) and [D013](../../evidence/WO-034/decisions.md#wo-034-d013). This review reproduced the claims its verdict rests on that a final review can check cheaply and found them as reported. It leaves the three follow-ups boarded: each preserves output and breaks no criterion, and repairing D011 and D012 here would rebuild the crawl, transfer, audit and gate evidence at a new tree after verification, which the next standards pass over the movement batches pays once; a D013 change would return the wall study to its critics ([D014](../../evidence/WO-034/decisions.md#wo-034-d014)). Their register rows are untriaged for the next planning pass.

## Review of the implementation

The reshape does what the Objective asks, and it reads well. Run and frame descriptions are named interfaces beside the functions that read them, the formatter is bound once per module with the study's authored options, and the long composition points read whole. The guard is small and strict and pins its own edge cases. The drawing's three repairs are local and legible, and the marble helper's named modes make each spec's intent visible where an identity check hid it.

This review found four things it did not repair in the source. Three are boarded in D015 and listed in its findings: the relabelled messaging flow states compose into the text alternative as "Work queue: Records: 1"; the drawing reads `globalThis.matchMedia` where the workspace injects the document, and repeats the chart text's breakpoint and font sizes by hand (WS-001 rule 10); nine name keys join a word and an id without a case boundary, carried over from the base, and four value maps trim numbers by hand beside the formatter's trim option. The fourth is a publication item: the draft's title, the conventional one the order's step 12 names, was decorated by the title workflow into `:recycle: refactor: …`, which rule 20 refuses; the final publish sets a gitmoji-and-subject title instead.

## Publication

The reviewed change is committed in the target as six commits, each passing the Tools unit suite on its own export, with plain conventional subjects and no attribution:

| Commit | Subject |
| --- | --- |
| `4228e01` | fix: end label guides at their names and omit unreadable vectors |
| `9ea00ba` | refactor: reshape the first movement batch's presentations |
| `c1f2157` | fix: say what the wall study's default run shows |
| `9d7e77c` | refactor: trim the study catalogs and reword count-led messages |
| `86ca9c3` | test: refuse literals outside resolved study messages |
| `0ac470e` | docs: describe the workspace tools' parameters and returns |

The pull request is the draft `refactor/movement-presentations` (#16), published over with the title `:recycle: Reshape the first twenty movement studies' code into the example to copy` and the body [PR.md](PR.md). The reviewed notes for the target's patch release are [RELEASE-NOTES.md](RELEASE-NOTES.md). [preview-pr.json](../../evidence/WO-034/preview-pr.json) records the draft's readback: no review, comment or thread, and CI's `checks` and `visual` jobs and the title workflow passed on its head, whose tree is the reviewed tree. The target order records no launchpad release.

## Standing documents and the register

The executor's row in the profile's implementation map adds the shared helpers as current state. WS-001's two rows for this order now read final-reviewed, replacing "active" and "verification pending". The target's catalog architecture and catalog rules replace their earlier sentences with the shape a presentation module has and the standards pass that reads each landed batch, with no dated account under a standing heading. The register rows this order was allocated, WO-028-D036, D037, D053, D056 and D060, are settled with this review's evidence; WO-028-D055's NoOp row stays deferred, since this order shrank the catalog rather than growing it; and the rows matched only by path stay as they were.

## The first record footer

The order's carry-in asks the final reviewer, after `target-records`, to read one filed record's footer and record the commit it names, whether that commit is reachable on the launchpad's public repository and whether the record's link destinations exist there. [D016](../../evidence/WO-034/decisions.md#wo-034-d016) records it. The footer names commit `527eb8c`, the launchpad HEAD when the filing begins, which is reachable on the public `dylanwoodconsulting/DotLn-Enterprise-Starter` as its `main`. None of VER-001's 35 relative link destinations exists there: all are under the order's evidence directory, which reaches the launchpad only with this order's records pull request. `FUP-575ebb5d3b7e46e0` stays deferred. The decision is written before the filing, because the filing moves the decisions file into the target; the filed footer's text is confirmed in the final-review evidence after it.

## Findings

<!-- dotln-findings:start -->
[
  {"id": "F1", "route": "follow-up", "class": "escape", "summary": "Nineteen messaging flow states the rewording turned into labels compose into the text alternative as 'Work queue: Records: 1' (WO-034-D015)."},
  {"id": "F2", "route": "follow-up", "class": "escape", "summary": "The motion drawing reads globalThis.matchMedia instead of the injected document and repeats the chart text's breakpoint and font sizes by hand (WO-034-D015)."},
  {"id": "F3", "route": "follow-up", "class": "escape", "summary": "Nine name keys join a word and an id without a case boundary, and four value maps trim numbers by hand beside the shared formatter's trim option (WO-034-D015)."},
  {"id": "F4", "route": "follow-up", "class": "integration", "summary": "The draft's conventional title, decorated by the title workflow, carries a conventional type against WS-001 rule 20; the final publish sets a gitmoji-and-subject title (WO-034-D014)."}
]
<!-- dotln-findings:end -->

F1 to F3 are `escape`: each was in the verified subject and inside verification's instructed review, and none breaks a criterion or a behavior `main` had, so each is a follow-up by product 07's rule. F4 is `integration`: it arose from publishing the draft, and the final publish fixes it.

## Limits of this review

- Chromium only, as in the verification.
- The per-commit Tools suites ran on `git archive` exports sharing the target's `node_modules`; they are probes, not gate rows, and they ran uncached, where the gate's own test step replayed Nx's cache. The browser and visual suites ran at the final tree only, in the review gate row.
- The crawl, the label sweep and the model comparison were not rerun here: the reviewed tree is the verified tree, and VER-001 reproduced each independently.
- The messaging and RxJS pages with the reworded messages were read as catalog text and in their specs, not on screen.


Filed from the launchpad Launchpad (its tree at commit 527eb8ceb044216cf2e02904fee23c8fb989d3df); this record's launchpad path was docs/final-reviews/WO-034/FINAL-001.md, and its relative links resolve against that path there, not in this repository.
