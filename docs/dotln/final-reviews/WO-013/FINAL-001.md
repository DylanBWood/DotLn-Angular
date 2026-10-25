# WO-013 — FINAL-001

**Verdict:** fail.
**Date:** 2026-10-24.
**Work order:** [WO-013](../../work-orders/WO-013-sub-app-shell-and-menu.md).
**Verification sequence:** [VER-001](../../verifications/WO-013/VER-001.md) (pass: all seven criteria met on uncached runs and probes at target tree `df45f1b303bdf5ec312f9d2e2789a34537ab842c`; four follow-ups boarded in [D004](../../evidence/WO-013/decisions.md#wo-013-d004) to [D007](../../evidence/WO-013/decisions.md#wo-013-d007)). After that verification, its verified-phase draft publish was refused before any push. [D008](../../evidence/WO-013/decisions.md#wo-013-d008) records the cause and holds the publish for the operator's choice of route.
**Subject:** the DotLn-Angular `wo-013` target worktree at `HEAD` `2ab4f28501628cf95dd0102c42440fd7de9f8055` (WO-007's merge, still `origin/main`), with the verified working tree uncommitted (44 paths, tree `df45f1b…`), and the local draft ref `refs/dotln/draft/WO-013` at `1e24c0884c2bafd7ad29b3f20b4368ff2be7b1a2`. The activation's base is `bc9133e932a00d33c15bc5289d683b8078f51ee4`, the empty initial commit, as [D001](../../evidence/WO-013/decisions.md#wo-013-d001) records. On the launchpad side: the `wo-013` order worktree's control segment, [evidence](../../evidence/WO-013/README.md), [handoff](../../evidence/WO-013/handoff.md), [host qualification](../../evidence/WO-013/host-qualification.md) and [decisions](../../evidence/WO-013/decisions.md) D001 to D009.
**Publication:** none prepared. The review fails before the publication step, so no PR.md or RELEASE-NOTES.md is written beside this report, and nothing was committed, pushed or published.
**Ideation receipt:** `2026-10-24-planning-45059c186a40389b-008`, no hold. VER-001 judged its two WO-013 known issues from the record (the dependency's stated reason, boarded in D005; the two meanings of sub-app, not reopened). This review does not reopen them.

Reviewer: Claude Code 2.1.310, model `claude-opus-5-5`, dispatched by the operator's `resume: final review` on 2026-10-24 in the `wo-013` worktree. Effort is `xhigh`, read from `CLAUDE_EFFORT`. That is the selected effort, not proof of the effective one, and it matches the order's recommended reviewer effort. No worker was spawned (0 of the 20-agent `subagentCap`; the readback counts zero, exact-observed).

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.310","model":"claude-opus-5-5","effort":"xhigh","source":"claude-session-readback"}
**Process cost:** entry 91624 tokens; handoff 1272657 tokens; source claude-transcript-message-usage

Usage scope: `dispatch`. The entry reading's cutoff was 2026-10-24T17:36:05.570Z, after the skill loaded and canonical status was taken. The handoff reading's cutoff was 2026-10-24T17:38:21.184Z, after the reproduction and readbacks and before the decision and this report were written. Of the handoff total, 1,186,282 were cached input, 77,034 cache-write and 9,309 output tokens, over 21 steps. These are cumulative counters, not unique context, and USD cost is unavailable. Compared with the equivalent outcome: no target gate, launchpad complete run or browser run was started. The subject's tree is the gated and verified tree, and a reproduced blocker goes straight to a failing review. The cost is the reading and the read-only reproduction. Final counters after filing stay in the ignored receipt and the session response.

## Method and limits

The operator's phrase selected WO-013 in `final-review`. The session hook recorded the dispatch once and allocated this report. Early in the dispatch the operator directed that the order be sent back to fix: the blocker needs a change in core, they will take the kit update that carries it, and the fix dispatch will integrate the latest changes. I read that as D008's route (a) and as a scope instruction for this dispatch: record a truthful failing review now, and leave integration and repair to the fix. [D009](../../evidence/WO-013/decisions.md#wo-013-d009) records the choice and reopens D008.

What I read: the order in full; VER-001 in full; the executor's evidence README, handoff and host qualification, including the verified-phase draft-publish episode; decisions D001 to D008, D008 in full; canonical status; the follow-up register rows the verification added; and WO-007's FINAL-001 as the form precedent for a target order. I did not reread the whole subject diff. VER-001 read it, the tree is unchanged since that reading (below), and the verdict here does not rest on the code.

Traps named before the material choice:

- Passing because every criterion is met. Refused. A pass obliges this review to commit the reviewed target state and run the target publish in the same dispatch, and that publish is refused (F1). Recording pass with the owed publication known to fail would claim a completion this review cannot discharge.
- Rerunning the final publish to see the refusal myself. Refused. It would commit on the target branch and attempt a push. The refusal is recorded verbatim in the host qualification, and its cause is reproduced read-only below.
- Integrating `main` now. Refused for this dispatch. The operator put integration in the fix, after the kit update. Launchpad `main` is at `36b2ae5`, which is this branch's head, so nothing is waiting to integrate today.
- Disposing D006's six follow-up rows or repairing D004's generator-log layout here. Refused. The next final review judges the integrated subject after the fix, and the generator-log move changes target bytes. D004 names the next repair of this order as its home.

The NoOp, filing pass on VER-001, would have left this session owing a publish that the kit refuses.

Reproduction, read-only, from 2026-10-24T17:36Z:

- Base binding: in the target worktree, `git diff --name-only` from `bc9133e9…` to `refs/dotln/draft/WO-013` lists 515 files, 17 of them under `docs/dotln/`. From `2ab4f285…`, the draft's parent, it lists 83. The draft ref's parent is `2ab4f285…` and its tree is `df45f1b…`.
- Cause in source: `scripts/lib/target-publish.mjs` line 1111 computes `targetChanges(entry.target, state.baseCommit, draftCommit)`. `scripts/lib/control.mjs` sets `baseCommit` only from the activation, and `CORRECTABLE_FIELDS` (line 25) do not include it. No role here can rebind the base.
- Subject identity: the target working tree's index tree, computed through a temporary index in the DotLn session scratch, is `df45f1b303bdf5ec312f9d2e2789a34537ab842c`. That equals the draft's tree and the tree VER-001 and the review row `target-gate:5540cb1a-b9c9-4578-9f85-f8a1dc667a45` judged. `git diff --check` is clean. `git ls-remote origin refs/heads/main` prints `2ab4f285…`, so the target's `main` has not advanced.

## Criterion judgments

**Criterion 1:** met — Observed: `routes.ts` declares `Scene = 'scene'` and `Machinery = 'machinery'` (the grep counts 2); `app.routes.ts` names `@dotln-angular/scene` and `@dotln-angular/machinery` (2); `grep -c "redirectTo: BasePaths.Board"` prints 1. The core spec and the build pass in VER-001's uncached run at this tree. Evidence: this review's readbacks, VER-001 criterion 1.

**Criterion 2:** met — Observed: `sub-app-menu.ts` exists, `grep -c "inject("` on it prints 0, and `@angular/router` appears on 0 lines under `libs/dotln/shell/src`. `npx nx test dotln-shell` passed uncached in VER-001, with the menu spec rendering three projected groups and the Tools empty line. Evidence: readbacks, VER-001 criterion 2.

**Criterion 3:** met — Observed: `grep -c export` prints 1 for both `src/index.ts` files; both `project.json` files carry `"tags": ["scope:dotln", "type:feature"]`. Both suites passed as projects uncached in VER-001 and in the gate's test row. The criterion's literal command runs only `scene:test`, a text defect D005 boards for planning. Evidence: readbacks, VER-001 criterion 3, D005.

**Criterion 4:** met — Observed in VER-001: `npx nx e2e dotln-e2e --skip-nx-cache` exited 0 with 57 tests, the 13 sub-app checks among them (headings, both arriving pages, root redirect, keyboard path, axe at the board's threshold, no overflow at 360, 768 and 1440). Not rerun here; the tree is unchanged. Evidence: VER-001 criterion 4, the review row at tree `df45f1b…`.

**Criterion 5:** met — Observed: `en.json` carries `shell.menu.scene`, `shell.menu.machinery`, `shell.menu.tools` and `shell.menu.toolsEmpty` (read with Node). `npm run i18n:check` exited 0 in VER-001 and in the gate's lint row. Evidence: readback, VER-001 criterion 5.

**Criterion 6:** met — Observed: both documents exist; `grep -c "control record" docs/ai-reference/sub-app-rules.md` prints 1. VER-001 read the graduation rule and the generator log's two invocations with their results; the log's layout is D004's follow-up. Evidence: readbacks, VER-001 criterion 6, D004.

**Criterion 7:** met — Observed: the review row `target-gate:5540cb1a-b9c9-4578-9f85-f8a1dc667a45` passed all seven declared commands at tree `df45f1b…` with no tracked-byte mutation, and the Preflight preceded the first gate (VER-001 criterion 7). `npm run test:docs` runs once after this report's last edit in this order worktree. Evidence: VER-001 criterion 7, the gate store, the document row.

## Findings

VER-001's four findings stand as routed follow-ups (D004 to D007). Verification found them, so the block below does not list them. D006's six register rows remain for the next final review to dispose.

- **F1** (blocking, integration; [D008](../../evidence/WO-013/decisions.md#wo-013-d008), [D009](../../evidence/WO-013/decisions.md#wo-013-d009)). The publish this review owes on pass cannot run. The target publish helper composes the pull request's Change table and base-tree exemption from the activation's base `bc9133e9…`, the empty initial commit. The table therefore lists 515 files instead of the change's 83, and the outward lint refuses the 17 earlier-order `docs/dotln/` paths as launchpad identifiers. Reproduced read-only above. No role can rebind an active order's base. Repair: the operator's route (a), core's base-handling fix shipped through a kit update, which the fix dispatch integrates before the publish is retried. Class basis: the defect is in the kit's publication step, not in the verified subject. Verification found and disclosed it, so it measures no verification miss. It arises from preparing publication, so it is recorded as integration.

<!-- dotln-findings:start -->
[{"id": "F1", "route": "blocking", "class": "integration", "summary": "The owed target publish is refused: the helper composes the Change table from the activation base bc9133e9 (515 files, 17 earlier-order docs/dotln paths) and the outward lint refuses the body; the fix integrates core's base-handling fix through a kit update (D008, D009)."}]
<!-- dotln-findings:end -->

## Executed checks

- `npm run resume --silent -- status --json`: WO-013 in `final-review`, VER-001 pass, `legalNextActions` `[final-review-result]`.
- The read-only reproduction and the criterion readbacks listed above; `git diff --check` clean in the target.
- `node scripts/target-gate.mjs WO-013 --review`: not rerun. The row `target-gate:5540cb1a-b9c9-4578-9f85-f8a1dc667a45` stands at the unchanged tree `df45f1b…`, and this review changed no target byte.
- `npm test -- --review`: not run. A reproduced blocker goes straight to a failing review, and the kit acquires no launchpad complete gate for a target order.
- `npm run worktree -- integrate WO-013`: not run, by the operator's direction. Integration belongs to the fix, after the kit update.
- `npm run meta`, then `npm run test:docs` once after this report's last edit, before the result transition.
- Background monitors: none started. No agent launched. No commit, push or publish.

The outcome matched the operator's direction: a truthful failing review naming the blocker, with WO-013 sent to fix. Next: the operator updates the kit with core's target-publish base fix, then dispatches `resume: fix` in this worktree. The fix integrates `main`, confirms that the target publish composes its table from the draft commit's parent, applies D004's generator-log move, and hands off for verification. This report's evidence and usage have the cutoffs above; later completion receipts do not revise these bytes.
