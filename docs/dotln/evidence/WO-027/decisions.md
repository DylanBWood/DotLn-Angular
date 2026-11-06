# WO-027 decisions

The operator selected the next implementation phase on 2026-11-06. The executor owns the paired launchpad and target worktrees.

## WO-027-D001 Use the integrated target base

```json
{
  "id": "WO-027-D001",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Compare the candidate with target main 48c7f8e6916692bca833c4985e2cf95978ab2c06. HEAD, local main and fetched origin/main agree; no merge is needed. Launchpad HEAD and main both name a33191ae54f68ea9d0051f2dc9f54ccd1a1069fa.",
  "evidence": [
    "Canonical resume status selects active WO-027 and reports the WO-028 dependency met.",
    "Target git fetch --no-tags origin succeeded; git rev-parse origin/main main HEAD prints the declared base three times.",
    "git merge-base --is-ancestor 48c7f8e6916692bca833c4985e2cf95978ab2c06 HEAD exits 0.",
    "npm run release -- prepare --local reports that the target order records no launchpad release and changes no files."
  ],
  "rejected": [
    "Do nothing: retains the reproduced tool and documentation failures.",
    "Change runtime dependencies or application code: the correction is confined to the declared tools and standing guidance."
  ],
  "reopenWhen": "Main moves before the complete handoff run, or the implementation needs a contract outside the declared scope."
}
```

## WO-027-D002 Make the gauges observe their declared inputs

```json
{
  "id": "WO-027-D002",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Use git ls-files with NUL-separated paths, exclude documentation and dependency trees and inspect leading comment markers in the declared extensions. Parse script comments with the already-installed TypeScript parser so template strings and regular expressions are not comments; preserve quote and comment context in Sass, HTML and YAML. The script-reference check reads table rows outside fences and checks coverage and existence in both directions. Preserve the existing direct-module scope.",
  "evidence": [
    "Read tools/board-count.mjs, tools/scripts/check-script-reference.mjs, tools/project.json and their test consumers before editing.",
    "REVIEW-002 reproduces the board gauge scope gap and missing/stale script-row failures.",
    "Existing test:tooling runs tools/*.test.mjs through workspace-tools:lint; the new controls use that existing route."
  ],
  "rejected": [
    "Substring matching: a name in prose survives removal of its row.",
    "Line matching without string context: multiline example strings can manufacture markers.",
    "Widen check:scripts to nested script modules or all tools/*.mjs: WO-026-D011 remains outside this order.",
    "Add a new gate-mirror script: duplicates the registration and adds drift."
  ],
  "reopenWhen": "A real marker syntax or table form is missed, or a control can manufacture a false marker or coverage claim."
}
```

## WO-027-D003 Align the standing instructions

```json
{
  "id": "WO-027-D003",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Correct the ten target documents in place and the declared launchpad profile and WS-001 write-backs. State the study doctrine inline; name DylanBWood/DotLn-Instance and the design record path without inventing a public URL. Explain the Angular cache cost and reopening, the route-only feature exception, and the scene sampling boundary. Preserve gitmoji-and-subject titles while retaining conventional-title decoration.",
  "evidence": [
    "Read the registered gate table, tools/project.json, CI workflow, feature barrels, scene rules and concept-study doctrine.",
    "Installed @angular/build normalize-cache.js resolves a linked worktree cache through the common Git directory; dev-server/options.js disables prebundling when that cache is disabled.",
    "board, machinery and scene export named routes directly; tools re-exports a public_api.ts that exports toolsRoutes alone.",
    "Target docs/dotln records remain unchanged."
  ],
  "rejected": [
    "Rewrite immutable records or the generator log: their provenance remains binding.",
    "Require direct route exports and rewrite Tools: the route-only public surface already agrees, and apps/libs edits are excluded.",
    "Add scene sampling without an observed concern: the order requires an explicit boundary and reopening."
  ],
  "reopenWhen": "The gate registration, barrel contract, cache behavior or scene performance evidence changes."
}
```

## WO-027-D004 Make the existing fork-title board visible

```json
{
  "id": "WO-027-D004",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Place a BOARDED marker beside the failing edit path in tools/pr-title.mjs, mapped to existing follow-up FUP-223cde718a523e67. Preserve the workflow event and permissions; this order changes title syntax and the gauge, not the privileged event route.",
  "evidence": [
    "Target WO-004-D010 and launchpad follow-up FUP-223cde718a523e67 retain the fork-token limitation.",
    ".github/workflows/pr-title.yml still runs pull_request events; the title helper attempts an edit only when decoration changes the current title.",
    "No fork pull request or live workflow has been run during implementation."
  ],
  "rejected": [
    "Leave the known defect only in a historical decision: CI would still print zero while the named case remains open.",
    "Switch event context as part of a title-format change: that is a separate authority and workflow design decision."
  ],
  "reopenWhen": "A fork pull request needs title decoration or a change explicitly includes the workflow event route.",
  "reopens": {
    "decisionId": "WO-004-D010",
    "observation": "A fork pull request needs decoration or an order changes the privileged event route."
  }
}
```

## WO-027-D005 Preserve the independent walkthrough and publication sequence

```json
{
  "id": "WO-027-D005",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Prepare all implementation evidence now; criterion 1 remains unmet at executor handoff, class later-phase, because it requires the independent verifier to perform the walkthrough on the committed tree and file a VER Walkthrough section. Verification and the later draft workflow observation retain their own dispatches.",
  "evidence": [
    "WO-027 criterion 1 explicitly names the verifier and VER report.",
    "The known carry-ins place the draft PR and title workflow observation after verification passes.",
    "The executor skill permits an honest unmet judgment with a defect class for the verifier; the executor records no waiver or defect event."
  ],
  "rejected": [
    "Claim a verifier walkthrough from executor tests: substitutes actors and fabricates an unfiled report.",
    "Publish early to reach the live title observation: violates the phase sequence."
  ],
  "reopenWhen": "The independent verification dispatch files the required walkthrough and its verdict."
}
```


## WO-027-D006 Resolve the first independent review

```json
{
  "id": "WO-027-D006",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Fix all four findings: inspect script token children so closing-delimiter comments count, recognize quotes only at YAML scalar starts, consume HTML raw-text and RCDATA bodies before looking for comments, and link the motion-label decision to its already-filed local record. Add regression controls for each parser case.",
  "evidence": [
    "Round-1 criteria reviewer found three P2 parser defects; parent single-test bounded probes reproduced 0 instead of 1 for empty script blocks and YAML plain quotes, and 1 instead of 0 for textarea text.",
    "After the repair the same three bounded probes pass.",
    "Round-1 consistency reviewer demonstrated the old WO-028 decision path absent from the launchpad candidate; target docs/dotln/evidence/WO-028/decisions.md contains D026.",
    "Round-1 design reviewer found no actionable issues."
  ],
  "rejected": [
    "Count raw marker lines regardless of context: strings would manufacture boards.",
    "Restore the moved record in the launchpad: duplicates a bound record instead of linking to its current home."
  ],
  "reopenWhen": "The targeted recheck or a full gate exposes a remaining criterion failure."
}
```

## WO-027-D007 Qualify native worker recording metadata

```json
{
  "id": "WO-027-D007",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Use the required worker record command to retain the native reviewers and their findings. Treat its wrapper host/model fields as helper defaults, not worker readback: the actual reviewers are codex-spawn-agent, gpt-6.1-sol at max, named in each report and the handoff. Keep this target order out of kit implementation.",
  "evidence": [
    "scripts/lib/review-worker.mjs recordAgentReview hard-codes host claude and TRANSPORT_DEFAULTS[claude-cli-print] even for a native Codex returned report.",
    "The three actual collaboration.spawn_agent calls used fork_turns none, model gpt-6.1-sol and reasoning_effort max."
  ],
  "rejected": [
    "Relabel the actual Codex workers as Claude: false attestation.",
    "Patch pinned kit/runtime files in this target correction: outside the declared deliverable."
  ],
  "reopenWhen": "A core update carries a native Codex record route or the wrapper fields become a relied-on host attestation.",
  "followup": "Ask the next core planning pass to make worker record accept and preserve the actual native host, model and effort for codex-spawn-agent reports; scripts/lib/review-worker.mjs recordAgentReview currently stamps Claude defaults. Check with a Codex native returned-report fixture without changing report bytes."
}
```

## WO-027-D008 Resolve the targeted recheck

```json
{
  "id": "WO-027-D008",
  "date": "2026-11-06",
  "dispatch": "resume: next — implement the selected WO-027",
  "decision": "Fix the two round-2 parser regressions before the final combined review: recognize a flow-map separator after a quoted YAML key even without following whitespace, and require an HTML tag-name delimiter rather than a word boundary before skipping raw text. Assert exact marker locations in both new permanent controls.",
  "evidence": [
    "Round-2 criteria recheck resolves F1-F3 but finds two defects in their repair delta; consistency recheck resolves its pointer finding with no new findings.",
    "Parent single-test bounded probes reproduced YAML expected [4], actual [2], and HTML custom-element expected [2,4], actual [].",
    "The same two probes pass after repair."
  ],
  "rejected": [
    "Treat equal YAML counts as correct: the marker location was wrong.",
    "Skip the final combined review: source changed after round 2."
  ],
  "reopenWhen": "The final combined review or complete validation finds a criterion defect in this delta."
}
```

## WO-027-D009 Board the title workflow's narrower gitmoji set

```json
{
  "id": "WO-027-D009",
  "date": "2026-11-06",
  "dispatch": "resume: verify — VER-001 implementation review of WO-027",
  "decision": "Record as a follow-up, not a block: tools/pr-title.mjs admits only the eleven gitmoji in .github/gitmoji-map.json, while the kit's publish lint admits any gitmoji, in emoji or shortcode form, followed by a subject. A title the kit lint admits can therefore still fail the target's title workflow. Criterion 7 names a supported gitmoji, and main refused the same titles, so no criterion fails and no behavior main had is broken.",
  "evidence": [
    "Verifier probe of decorateTitle at target tree a0dd5f8e034b425fd1c0765ae50f12822e20bdf9: ':memo: Make the gate tools and reference documents say and check what is so' and its emoji form are returned unchanged; 'docs: ...' gains ':memo:'; a bare subject is refused.",
    "The same probe refuses ':truck: Move the dated planning passes' (a gitmoji outside the map, the form of launchpad pull request #60's title), a recycle emoji without its variation selector, and ':memo: note: a subject that opens with a lowercase word and a colon'.",
    "scripts/lib/outward-lint.mjs (pr-title kind) admits a leading Extended_Pictographic emoji with an optional variation selector, or any :shortcode:, followed by a nonblank subject, before it looks for a conventional type.",
    "The 2026-11-05 planning receipt's criterion 7 known issue: the two implementations are tied by no shared fixture, and it reopens when a kit-published title fails the target's title workflow."
  ],
  "rejected": [
    "Block the order: criterion 7 is scoped to a supported gitmoji, and the order's own title passes as written.",
    "Widen the map in this verification: the verifier writes no implementation."
  ],
  "reopenWhen": "A kit-published pull-request title fails the target's title workflow, or an order next edits tools/pr-title.mjs or the kit's title lint.",
  "followup": "Align tools/pr-title.mjs with the kit's pull-request title lint: leave as written any title that opens with a gitmoji the kit admits (any emoji with an optional variation selector, or any :shortcode:) and a subject, decorating only a title that opens with a mapped conventional type, or state the narrower set where the publish route reads it. Add a shared case list both checks run, including ':truck: Move ...', an emoji without its variation selector and a subject that opens with 'word:'."
}
```

## WO-027-D010 Note the operator record's stale title sentence

```json
{
  "id": "WO-027-D010",
  "date": "2026-11-06",
  "dispatch": "resume: verify — VER-001 implementation review of WO-027",
  "decision": "Record as a follow-up for the next planning pass: docs/operator/README.md, Standing preferences, Commits, reviews and releases, still says that the DotLn-Angular title workflow requires a conventional type and stays until an order changes it. This order changes that workflow, and WS-001 rule 20 and the repository profile now say so. The operator record changes only through a planning pass, and the launchpad's own documents are this order's non-goal.",
  "evidence": [
    "docs/operator/README.md, Pull-request titles item: names the WO-004 title workflow among the lints that require a conventional type.",
    "The candidate's docs/workstreams/WS-001-dotln-angular.md rule 20 and docs/repositories/dotln-angular.md Publish a change: the workflow preserves a supported gitmoji and subject.",
    "WO-027 Non-goals: the launchpad's own documents; docs/operator/README.md, When this record changes: the next planning pass records the change."
  ],
  "rejected": [
    "Edit the operator record here: outside the verifier's authority and this order's scope."
  ],
  "reopenWhen": "The next planning pass reads the operator record, or WO-027 closes with the title workflow as verified.",
  "followup": "In the next planning pass, update docs/operator/README.md's pull-request title item: neither the kit's publish lint (since starter v0.117.0) nor the DotLn-Angular title workflow (since WO-027) requires a conventional type in a pull-request title, so the sentence naming them as lints that do is stale."
}
```

## WO-027-D011 Correct repository identity and make record links traceable

```json
{
  "id": "WO-027-D011",
  "date": "2026-11-06",
  "dispatch": "resume: fix — repair VER-001 F1 and F2",
  "decision": "Correct WO-027-D003 on the same day: the earlier implementation mistook the local folder name for a GitHub repository. The intended source is the public launchpad fork dylanwoodconsulting/DotLn-Enterprise-Starter, as its origin and WO-010 record. Replace both target references, pin the catalog's design-record link to the observed launchpad base, and identify FinalReviewCompleted.checkpointSha in docs/control/orders/WO-NNN.jsonl as the local snapshot for resolving filed records from their original docs/ paths. State that checkpoint commits may not be published on GitHub.",
  "evidence": [
    "VER-001 F1 and F2 identify the two wrong references; the repair changes only docs/dev-reference/README.md and docs/dev-reference/architecture/catalog.md in the target.",
    "git remote get-url origin matches the named repository; GitHub get_repo and gh repo view both resolve it as public. GitHub contents reads resolve docs/evidence/WO-022/design on main and at a33191ae54f68ea9d0051f2dc9f54ccd1a1069fa.",
    "The bounded session-scratch check-repair.mjs passes the old-name absence check, all seven existing catalog paths and anchors, and the newly pinned external-link shape.",
    "Additional case beyond the report: WO-026's FinalReviewCompleted checkpoint reproduces its filed FINAL-001 byte for byte and resolves ../../evidence/WO-026/preview-pr.json from the original launchpad location. The checkpoint exists locally; GitHub returns HTTP 404 for that checkpoint, while the order's control segment and retained preview-pr.json resolve on main."
  ],
  "rejected": [
    "NoOp: leaves both blocking verification findings and sends readers to a nonexistent repository.",
    "Substitute another inferred repository name: repeat the same provenance error; use origin, the existing record and an independent GitHub lookup instead.",
    "Only rename the repository: leaves readers unable to identify the launchpad snapshot and implies local checkpoint commits are public.",
    "Rewrite the filed records or publish checkpoint refs: neither is needed for this documentation repair."
  ],
  "reopenWhen": "The launchpad repository moves, its record-filing or checkpoint contract changes, or a documented source path cannot be resolved at its declared identity."
}
```

## WO-027-D012 Apply the reference table's required formatting

```json
{
  "id": "WO-027-D012",
  "date": "2026-11-06",
  "dispatch": "resume: fix — repair the target plain gate's format failure",
  "decision": "Apply the installed Prettier formatter to docs/dev-reference/README.md after the longer records row changed the table's column width. Preserve the reviewed wording. The only change after the combined review is Markdown table padding, so skip another review round under the executor's formatting-only exception and rerun the complete target selections.",
  "evidence": [
    "The first repair plain gate passed install, lint, typecheck and test but failed format. A direct npx nx format:check reproduction named only docs/dev-reference/README.md.",
    "npx prettier --write docs/dev-reference/README.md exits 0; the repeated npx nx format:check exits 0.",
    "No source code, dependency, fixture, baseline or assertion changes are part of this correction."
  ],
  "rejected": [
    "NoOp or waive the format failure: leaves the declared gate failing.",
    "Shorten the recovery instructions to avoid formatting: removes useful information without addressing the formatting contract."
  ],
  "reopenWhen": "A complete target gate reports another failure or the formatting changes document meaning."
}
```

## WO-027-D013 Board the filed records' local-only link resolution

```json
{
  "id": "WO-027-D013",
  "date": "2026-11-06",
  "dispatch": "resume: verify — VER-002 implementation review of WO-027",
  "decision": "Record as a follow-up, not a block. The developer reference's docs/dotln row now names the right place for a filed record's relative links: the record's original docs/ path in the launchpad, at the order's FinalReviewCompleted checkpoint. It also says that the checkpoint may exist only locally. For the filed orders it does exist only locally, and the target orders' records are not kept on the launchpad's main, so a colleague reading both repositories on GitHub cannot follow the links that leave the target. Criterion 5 asks the row to say where the links resolve. It does, correctly, and at the base the row named no location at all.",
  "evidence": [
    "VER-002 probe at target tree 0dd65acc3de303551c7e52a45d53f8b47d97aaff: 62 filed Markdown records; 60 are byte-identical to their original path at their order's FinalReviewCompleted checkpoint (WO-015's decisions and WO-004's order carry later recorded amendments). Of 639 relative links, 636 resolve at the checkpoint and 282 in the target; the other three are a literal ](…) placeholder in prose.",
    "gh api repos/dylanwoodconsulting/DotLn-Enterprise-Starter/commits/c5fad62b2dfb (WO-028's checkpoint) returns HTTP 422 'No commit found'; WO-027-D011 records HTTP 404 for WO-026's checkpoint.",
    "git log main -- docs/verifications/WO-028/VER-001.md in the launchpad prints nothing: the final-review route moves a target order's records into the target instead of keeping them on the launchpad's main."
  ],
  "rejected": [
    "Block the order: criterion 5 asks where the links resolve, and the row's answer is correct and states its limit.",
    "Point the row at the launchpad's main: the records are not there, and 14 of the 639 links resolve at the first main commit that holds a record.",
    "Rewrite the links when records are filed: the records are filed verbatim."
  ],
  "reopenWhen": "Someone without the operator's launchpad clone needs to follow a filed record's links, or the kit's record filing or checkpoint publication changes.",
  "followup": "In a core planning pass, decide how a filed target record's relative links become resolvable from the public repositories. Either publish each order's FinalReviewCompleted checkpoint as a ref on the launchpad's remote at release close, or record beside docs/dotln/ a public launchpad commit at which every filed record and its link destinations exist. Check by resolving every relative link in the target's docs/dotln/ records through GitHub alone."
}
```

## WO-027-D014 Carry the reviewed release notes beside the final report, not at the target's root

```json
{
  "id": "WO-027-D014",
  "date": "2026-11-06",
  "dispatch": "resume: final review — FINAL-001 acceptance of WO-027",
  "decision": "Remove from the candidate the untracked RELEASE-NOTES.md the executor added at the target's root, and carry the patch's reviewed notes as docs/final-reviews/WO-027/RELEASE-NOTES.md in the launchpad, the file the kit reads. The order's deliverable, the target's release notes for the patch release, is the target order's notes under the declared policy: the records publish checks them beside the final report, and the release close renders them as the Release body at the merged revision. The target's main carries no release-notes file, no earlier target order added one, and nothing in the target or the kit reads a root file, so it would have stood as a note for one release that the next tag leaves stale, against the order's own objective. Rerun the review gate at the repaired tree.",
  "evidence": [
    "scripts/lib/release-notes.mjs releaseNotesPathFor resolves docs/final-reviews/WO-NNN/RELEASE-NOTES.md in the launchpad; scripts/release.mjs targetReleaseNotesBody reads that path at the merged revision for a target order whose header says reviewed; scripts/worktree.mjs requireReleaseNotes checks it at the records publish. A search of scripts/ and scripts/lib/ finds no reader of a target-root RELEASE-NOTES.md.",
    "git log --all -- RELEASE-NOTES.md in the target names only the draft commit 47e739acbdb3be999f817ed1817815f2a848f36b, and git ls-files at the base lists no release file. The target's docs/dotln/final-reviews/WO-026 and WO-028 show the earlier reviewed-notes orders kept their notes beside the launchpad report.",
    "The file was moved to the DotLn session scratch, not deleted; the draft commit on origin/docs/workspace-says-and-checks-what-is-so holds its bytes, and its substance is carried into the reviewed notes.",
    "gateTreeHash of the target changed from 0dd65acc3de303551c7e52a45d53f8b47d97aaff to 314fb0e0bc20fcdb7b78d9eac74111b0d9037fb5. node scripts/target-gate.mjs WO-027 --review passed all eight commands at that tree in 0 h 2 min with no tracked-byte mutation: target-gate:90148375-fd5e-4d3f-a14b-95e2dfc8eb70, recorded 2026-11-06T17:52:57.577Z."
  ],
  "rejected": [
    "Keep the root file and board it: a reader of the target would meet a release note that no release reads and that the next tag leaves stale.",
    "Keep both files: two sources for one Release body drift apart.",
    "Read the deliverable as a target file and fail the order on its shape: the kit's contract names the launchpad path, and the executor's reading was an ambiguity in the order's words, not a defect of the product."
  ],
  "reopenWhen": "The kit or the repository profile declares a release-notes file in the target itself, or a target order's close reads its notes from the target."
}
```

## WO-027-D015 Pass the final review on the reproduced criteria and publish over the draft

```json
{
  "id": "WO-027-D015",
  "date": "2026-11-06",
  "dispatch": "resume: final review — FINAL-001 acceptance of WO-027",
  "decision": "Pass the final review on the reproduced criteria. Integration took in nothing in either repository. The tools and documents are the bytes VER-002 verified; the one change is the root release-notes file removed under D014, and the review gate reran and passed at the resulting tree. Commit the target as four reviewed commits (the board gauge, the script-reference check, the title workflow, the documents) and publish them over the draft with the order's title; publish the launchpad records on their own branch. Write the workstream's delivery state. Leave the eight follow-up rows the change touches as they stand, each for the reason below. No launchpad complete run is owed: no launchpad code changed, and the criteria name the target gate and the document gate.",
  "evidence": [
    "git fetch in both repositories: launchpad origin/main a33191ae54f68ea9d0051f2dc9f54ccd1a1069fa and target origin/main 48c7f8e6916692bca833c4985e2cf95978ab2c06 equal the bases; node scripts/worktree.mjs integrate WO-027 from the target root printed that integration took in nothing.",
    "Reproduced at the candidate: node --test tools/ passes 92 of 92 with the five named controls; node tools/board-count.mjs prints 1 at tools/pr-title.mjs:56; npm run check:scripts prints PASS script reference: 32 npm scripts; 17 files; the criterion 4 and 5 greps print the order's counts; the six libs/features/*/src/index.ts files export only routes; git diff --name-only against the base names fourteen tracked files and two new tests, none under apps/, libs/ or docs/dotln/; the dependencies and devDependencies keys equal the base's; git diff --check is clean in both worktrees.",
    "The draft pull request DylanBWood/DotLn-Angular#15 at 47e739acbdb3be999f817ed1817815f2a848f36b (tree 0dd65acc3de303551c7e52a45d53f8b47d97aaff): the Pull request title run 42262742002 succeeded at 17:33:48Z and left the gitmoji-and-subject title as written; CI run 42262741905 succeeded, checks at 17:46:38Z and visual at 17:42:17Z; no review, comment or thread at 17:55:15Z.",
    "Follow-up rows the change touches (npm run plan -- followups --touching): FUP-aa144bbe9a1b6ec9 (D007), FUP-5538fd060f7a5e9c (D009), FUP-f02f3bea111d8864 (D010) and FUP-575ebb5d3b7e46e0 (D013) are this order's own rows for the next planning pass; FUP-d97544c4254dadd4 (WO-026-D011) is the scope question the order leaves closed, and its condition did not occur; FUP-35187266d29e00dc, FUP-8c4dcd0be9399981 and FUP-b948f8094f0419e5 match on a path name only.",
    "WS-001's lies-ahead table lists every member of the sequence except WO-027; the Delivery states table carries it, and this review writes its state there."
  ],
  "rejected": [
    "Widen the title workflow to every gitmoji the kit admits (D009): new scope under rule 26 with no reproduced failure of a published title, and a source change that would send the order through another verification.",
    "Rerun the target gate at the verified tree because commits appear: the row binds bytes, and the rerun is owed only to the D014 removal.",
    "Add the missing WO-027 row to the workstream's lies-ahead table here: the launchpad's own documents are the order's non-goal beyond the write-backs the Design names."
  ],
  "reopenWhen": "CI fails on the published head, the operator reads the pull request and judges a tool or document unfit, or the merged target's title workflow refuses a kit-admitted title.",
  "followup": "In the next planning pass, add WO-027 to WS-001's What lies ahead table, which lists every sequence member but this one, with its state; the Delivery states table already carries it."
}
```
