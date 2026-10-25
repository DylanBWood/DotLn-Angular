# WO-013 decisions

## WO-013-D001

```json
{
  "id": "WO-013-D001",
  "date": "2026-10-24",
  "dispatch": "resume: next; operator correction during execution",
  "kind": "correction",
  "misread": "The executor treated a stale initial-commit base pin as an unavoidable stop even though the required predecessor was merged and the clean target worktree could advance without discarding work.",
  "meant": "Resolve the available local recovery and continue the dispatched order; the operator rejected the asserted blocker.",
  "changed": "Fast-forwarded the clean target wo-013 worktree to 2ab4f28501628cf95dd0102c42440fd7de9f8055, the merged WO-007 implementation, with git merge --ff-only. Kept the activation, registry and declared ancestral base unchanged.",
  "decision": "Implement against the merged predecessor. The declared bc9133e932a00d33c15bc5289d683b8078f51ee4 remains an ancestral lifecycle binding; the actual implementation starting point is 2ab4f28501628cf95dd0102c42440fd7de9f8055. Review the new change against that implementation starting point and current origin/main.",
  "evidence": [
    "Target git status --porcelain=v1 was empty before advancing; git merge-base --is-ancestor HEAD origin/main exited 0.",
    "git show HEAD identified bc9133e as Initial commit with the empty tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904; no application source was present.",
    "git fetch origin exited 0; both local main and origin/main resolved to 2ab4f28501628cf95dd0102c42440fd7de9f8055, the merged events, stores and data-access change.",
    "git merge --ff-only 2ab4f28501628cf95dd0102c42440fd7de9f8055 exited 0 and restored the existing application by advancing the branch, without creating a commit.",
    "scripts/lib/target-worktrees.mjs reviewedTargetSubject requires descent from the activated base; scripts/lib/target-gate.mjs checks agreement between activation and registry. Both bindings remain intact."
  ],
  "rejected": [
    {
      "option": "Stop for another planning pass",
      "reason": "The operator corrected this interpretation; the merged predecessor and a non-destructive fast-forward are already available."
    },
    {
      "option": "Rewrite activation history or manually alter the registry",
      "reason": "Unnecessary: the correct implementation base descends from the recorded base and the supported checks retain their original binding."
    },
    {
      "option": "Leave the empty worktree unchanged",
      "reason": "This NoOp prevents the authorized implementation and ignores the available merged prerequisite."
    }
  ],
  "reopenWhen": "An executable lifecycle check requires an exact new base binding, ancestry ceases to hold, or origin/main advances during review."
}
```

## WO-013-D002

```json
{
  "id": "WO-013-D002",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Keep the workspace dependency set and generate the two feature projects with unitTestRunner=none after the installed Nx test generator refuses Vitest 5; apply the existing AnalogJS test configuration and strict compiler targets to the generated projects. Generate their testing secondary entry points with private package names.",
  "evidence": [
    "Both initial Nx 23.3.0 vitest-analog library invocations exited 1 before writing because the generator expects Vitest 4 or below. The workspace already declares Vitest 5.0.5, AnalogJS 2.9.1 and MSW 3.0.3.",
    "The two fallback library generators and the two secondary-entry-point generators exited 0. docs/dev-reference/workspace/generator-log.md records the exact invocations and outcomes.",
    "The first npx nx run-many -t lint test build run passed both new unit targets and the application build; 29 of 30 tasks passed, with the one failure an unrelated new test-host translation label subsequently corrected.",
    "No dependency or lockfile edit was made. Testing aliases belong to parent projects; they are not separate Nx projects."
  ],
  "rejected": [
    {
      "option": "Downgrade Vitest for generator acceptance",
      "reason": "It would undo the merged MSW-compatible workspace setup and expand a menu change into a dependency migration."
    },
    {
      "option": "Skip library generators entirely or omit tests",
      "reason": "The order requires generated projects and working test kits; generating project structure and applying the existing runner meets both."
    }
  ],
  "reopenWhen": "Nx and the installed test stack have compatible generator peer detection, or an executable test/compiler check rejects the reused runner configuration."
}
```

## WO-013-D003

```json
{
  "id": "WO-013-D003",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "kind": "experiment",
  "decision": "Use a generic menu plus a generic projected group template. Keep navigation directives in the app and replace the layout navigation wrapper with a neutral region, so the menu supplies exactly one navigation landmark.",
  "question": "Does adding a fourth group require shell template edits, and what is the component-type cost?",
  "alternatives": [
    "One shell template with fixed heading/item selectors per group",
    "A menu projecting reusable group templates"
  ],
  "observation": "The bounded Angular compiler comparison parsed both designs. The fixed template changes from six slots to eight to add a fourth group; the projected design retains one root slot and two per group. The projected design costs two component types instead of one. This measures syntax and extension surface, not runtime speed.",
  "execution": "run",
  "outcome": "adopted",
  "budget": {
    "wallSeconds": 30
  },
  "cost": {
    "wallSeconds": 0.171,
    "tokens": null,
    "commands": [
      "bounded node compare-menu.mjs"
    ],
    "source": "run-check.mjs menu-comparison receipt, 2026-10-24T16:48:18.362Z"
  },
  "effect": {
    "wallSecondsPerOrder": null,
    "tokensPerOrder": null,
    "commands": [
      "Angular parseTemplate for both three-group and four-group designs"
    ],
    "summary": "The extra group template keeps future group additions within app composition. No throughput or token savings are claimed."
  },
  "regression": "unknown",
  "history": {
    "lastAdoptedImprovementAt": null,
    "experimentsSinceAdoption": null
  },
  "evidence": [
    "Angular content-projection documentation fetched through Context7 confirms select matching and fallback content: https://angular.dev/guide/components/content-projection.",
    "The group projects headings and li items, with a translated emptyMessage fallback. Browser coverage checks the future populated Tools case through a story.",
    "The merged shell is type:feature after WO-007, although the provisional order calls it type:ui. Its templates still prohibit injection and router imports at the directory level; no retagging is needed.",
    "The independent design reviewer reported no concrete design or maintainability finding."
  ],
  "rejected": [
    {
      "option": "Retain the layout nav around the new menu nav",
      "reason": "This would create nested navigation landmarks for one menu."
    },
    {
      "option": "Hard-code all group-specific slots in the shell",
      "reason": "It has one fewer component type but requires shell changes to add a group, contrary to making addition an app composition convention."
    },
    {
      "option": "Leave only the existing board link",
      "reason": "This NoOp does not deliver the requested sub-app navigation."
    }
  ],
  "reopenWhen": "Menu behavior becomes dynamic or permission-gated, or browser evidence shows the projection-only fallback cannot represent a required state."
}
```

## WO-013-D004

```json
{
  "id": "WO-013-D004",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 finding F1",
  "decision": "Board as a follow-up, not a blocking finding: the target generator log carries both library invocations and their results, so criterion 6 holds, but the entry is split. The new 'Sub-app routes, 2026-10-24' section sits above the log's own preamble and table, and its success result is appended at the end of the file under the previous order's '2026-10-24 — events and state' heading, where a reader attributes it to that section.",
  "evidence": [
    "docs/dev-reference/workspace/generator-log.md in the target at tree df45f1b303bdf5ec312f9d2e2789a34537ab842c: line 3 is the new section's heading, line 27 is the log's preamble ('Append one entry before each generator invocation...') and the table follows it.",
    "The file's last paragraph, 'The two fallback library generators and both testing entry-point generators exited 0.', follows the WO-007 section's secondary-entry-point result with no heading of its own.",
    "Every earlier order appended its section after the last one (the board's section, then '2026-10-24 — events and state')."
  ],
  "rejected": [
    {
      "option": "Fail criterion 6",
      "reason": "The criterion asks that the log carry the two invocations with their results; it does. The placement misleads a reader but loses no record."
    },
    {
      "option": "Leave it as a report sentence",
      "reason": "A defect met and not fixed is boarded in the decisions file with a named follow-up."
    }
  ],
  "followup": "In the next repair of this order or the first order that edits the generator log: move the sub-app section, plan lines and results together, to the end of the log as one dated section under its own heading, after '2026-10-24 — events and state'; the log stays append-only in chronological order and nothing is inserted above its preamble and table.",
  "reopenWhen": "A repair of WO-013 or any later order edits docs/dev-reference/workspace/generator-log.md in DotLn-Angular."
}
```

## WO-013-D005

```json
{
  "id": "WO-013-D005",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 finding F2 and the planning receipt's criterion:1 known issue",
  "decision": "Board two order-text observations for the next planning pass; neither is an implementation defect and neither fails a criterion. (1) Criterion 3's literal command 'npx nx test scene machinery' runs only scene:test, because Nx parses machinery as an argument to that target; it exits 0, and both suites pass when run as projects, so the criterion's intent holds on other evidence. (2) The reopening condition of the 2026-10-24 receipt's criterion:1 known issue occurred: the subject imports nothing from @dotln-angular/state, @dotln-angular/data-access or @dotln-angular/events, so the hard dependency on WO-007 was merge ordering on libs/dotln/shell and apps/dotln/src/app/app.ts, not composition.",
  "evidence": [
    "VER-001: 'npx nx test scene machinery --skip-nx-cache' printed '> nx run scene:test machinery', ran one file (scene-arriving-page.spec.ts) and ended 'Successfully ran target test for project scene', exit 0.",
    "VER-001: 'npx nx run-many -t test -p dotln-shell core scene machinery --skip-nx-cache' ran scene 1, machinery 1, dotln-shell 4 and core 8 tests, exit 0; the gate's 'npx nx run-many -t test' row passed at the same tree.",
    "A grep of the target's tracked diff and untracked files for '@dotln-angular/(state|data-access|events)' matched nothing (exit 1).",
    "A single-line grep of WO-013 to WO-018 for 'npx nx (test|lint|build) <project> <project>' matched only WO-013 line 220."
  ],
  "rejected": [
    {
      "option": "Fail criterion 3 on the literal command",
      "reason": "The literal command exits 0, as written; the planner's intent, both suites passing, is established by the uncached run-many and the gate row. Failing it would send a repair for text the executor does not own."
    },
    {
      "option": "Amend the order",
      "reason": "A verifier does not amend criteria; the planning pass owns the order text."
    }
  ],
  "followup": "Next planning pass: (1) write a multi-project check as 'npx nx run-many -t <target> -p <a> <b>' in any order it files or amends; (2) restate WO-013's dependency on WO-007 as merge ordering on the shell and app.ts, and do not cite it to block a lane pair among WO-014 to WO-018.",
  "reopenWhen": "The next planning pass files or amends a DotLn-Angular order, or a later pass cites WO-013's WO-007 dependency as composition."
}
```

## WO-013-D006

```json
{
  "id": "WO-013-D006",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 finding F3",
  "decision": "Record the verifier's judgment of the six pending follow-up rows the implementation-ready advisory matched, which the executor's evidence neither fixed nor recorded as left. Only WO-007-D019 item (e) has an occurred condition: this order touched the Storybook catalog (four stories and the catalog's browser list). Items (a) to (d) and (f) of that row did not occur: no RouteId was added (RouteId stays 'board' and only the board facade dispatches navigate), and libs/shared/state, the persisted-state feature, the shell notices container and the board store's devtools condition are untouched. FUP-1508c6254455ccf3, FUP-2479f6d32b2396a8 and FUP-98c85b750cb36bd4 wait on this order's verified-phase draft publish, whose host outcome is recorded in host-qualification.md. FUP-48b1009d908e251d waits on WO-016's merge, and FUP-ffa034330edc5ff0 waits on core's answer. Leave every row for final review to dispose.",
  "evidence": [
    "npm run plan -- followups --touching listed 24 pending rows and matched 6: FUP-1508c6254455ccf3, FUP-2479f6d32b2396a8, FUP-48b1009d908e251d, FUP-98c85b750cb36bd4, FUP-d1253c8eb7d324d7 and FUP-ffa034330edc5ff0.",
    "The target diff changes apps/dotln-e2e/src/storybook.spec.ts (four entries) and adds stories under libs/dotln/shell and libs/features/{scene,machinery}; ui's build-storybook inputs include libs/**/*.",
    "libs/shared/models/src/lib/app-state.ts still declares RouteId = 'board'; libs/shared/state/src/lib/navigation-store.ts is unchanged; the diff touches no file under libs/shared/state, libs/shared/data-access or libs/features/board-data-access, and shell-notices is unchanged.",
    "The executor's README, handoff and decisions do not mention the six rows."
  ],
  "rejected": [
    {
      "option": "Fix item (e) here",
      "reason": "A verifier writes no implementation; and the toast story and failure-state axe check are not among this order's criteria."
    },
    {
      "option": "Fail the verdict for the missing disposition",
      "reason": "The advisory never refuses completion, and no criterion depends on it; final review disposes rows."
    }
  ],
  "followup": "Final review of WO-013 disposes the six rows: for WO-007-D019 item (e), add a dotln-toast story and an axe check of the board's failure state within the Boy Scout bound, or record it as left with its reason; leave the other five with the conditions named here.",
  "reopenWhen": "WO-013's final review runs, or a repair of WO-013 changes the Storybook catalog, libs/shared/state or the shell notices container."
}
```

## WO-013-D007

```json
{
  "id": "WO-013-D007",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 finding F4",
  "decision": "Board as a follow-up the app's handling of an unknown path, which this order neither introduced nor changed: a path no route matches, such as /tools before it has a route or /scene/x, fails the initial navigation with NG04002, leaves the URL at / and the main region empty, and shows the generic application-error notice. main's app.routes.ts has no wildcard route either, so this is not a regression; the new Tools group, which has no route, makes the path likelier to be tried.",
  "evidence": [
    "VER-001 scratch Playwright probe against the served production build: for /tools and /scene/x the console logs NG04002, page.url() is http://127.0.0.1:4211/, main's text is empty and dotln-shell-notices reads 'An unexpected application error occurred.' with a Dismiss button.",
    "The same probe: /machinery/ and /scene?x=1 render their arriving pages with no error.",
    "git diff of apps/dotln/src/app/app.routes.ts adds two lazy children and no wildcard; the base file has none."
  ],
  "rejected": [
    {
      "option": "Block this order",
      "reason": "It breaks no criterion and no behavior main had."
    },
    {
      "option": "Treat it as acceptable without a record",
      "reason": "A person following a stale or mistyped link sees an empty page and a notice that names no cause; the gap is met here, so it is boarded."
    }
  ],
  "followup": "In the first order that next changes apps/dotln/src/app/app.routes.ts (WO-014 adds the Tools route): add a not-found route that renders a translated not-found page with a link back to the board, or redirects to the board, with an e2e case for an unknown path.",
  "reopenWhen": "An order changes apps/dotln/src/app/app.routes.ts, or the operator reports an empty page after following a link."
}
```

## WO-013-D008

```json
{
  "id": "WO-013-D008",
  "date": "2026-10-24",
  "dispatch": "resume: verify; verified-phase draft publish after verification-result pass",
  "decision": "Hold the verified-phase draft publish; the operator chooses the route that rebinds WO-013's base, and the safe default applies until then. The helper refused before any push: it composes the body's Change table and the base-tree exemption from the activation's base bc9133e932a00d33c15bc5289d683b8078f51ee4, the empty initial commit, so the table lists 515 files, earlier orders' docs/dotln records among them, and the outward lint refuses their launchpad identifiers (which are repaired, never confirmed). The draft commit itself is right: parent 2ab4f28501628cf95dd0102c42440fd7de9f8055, tree df45f1b303bdf5ec312f9d2e2789a34537ab842c (the verified tree), 83 files. D001's reopening condition, an executable lifecycle step that requires the exact base binding, has occurred. No role can rebind an active order's base: only WorkOrderActivated sets baseCommit, and correct cannot set it. Safe default: WO-013 stays verified and unpublished; the local ref refs/dotln/draft/WO-013 and the helper's DraftPrepared event stay as the helper left them; final review's publish would meet the same refusal, so it waits on the same choice. The verification verdict is unaffected, because the draft pull request is never a criterion.",
  "evidence": [
    "node scripts/worktree.mjs publish WO-013 --target-worktree --draft --branch feat/sub-app-menu --title \"feat: add the sub-app menu and the scene and machinery routes\" --body-file docs/evidence/WO-013/draft-pr-body.md exited 1: 'target publish refused: outward lint: pr-body refused: identifier.launchpad' with 26 findings on the 17 Change-table rows at composed lines 146 to 162, every one a docs/dotln path of WO-004 to WO-007.",
    "scripts/lib/target-publish.mjs line 1111 computes targetChanges(entry.target, state.baseCommit, draftCommit) and passes state.baseCommit to composeTargetBody and baseTreePaths; lintArtifacts runs before pushObservedCommit.",
    "git diff --name-only bc9133e9 1e24c088 lists 515 files; git diff --name-only 2ab4f285 1e24c088 lists 83; git rev-parse 1e24c08^ and 1e24c08^{tree} print 2ab4f285… and df45f1b3….",
    "scripts/lib/control.mjs sets baseCommit only from WorkOrderActivated; CORRECTABLE_FIELDS are model, effort, source, harnessVersion, reportPath, checkpointRef, checkpointSha and productGate.",
    "The reviewed body alone passes node scripts/outward-lint.mjs pr-body --target and the GitHub body profile; the title and branch pass their profiles."
  ],
  "rejected": [
    {
      "option": "Edit the activation event or the local target-worktree registry to the new base",
      "reason": "D001 rejected rewriting lifecycle history; the control store's events are append-only and the registry is checked against the activation."
    },
    {
      "option": "Confirm the refused rows with --confirm-terms",
      "reason": "Launchpad identifiers are repaired, never confirmed; and the table would still misstate the change as 515 files from an empty base."
    },
    {
      "option": "Push the branch or open the pull request by hand",
      "reason": "The operator's record routes target publication through the kit helper only; a manual push bypasses its lint and admission."
    }
  ],
  "followup": "Operator route, safe default above. Alternatives: (a) ask core for a kit route, either a base advance admitted when the new base descends from the activated base and equals the subject's parent, or a target Change table computed from the draft commit's parent; WO-013 then publishes unchanged after a starter update, at the cost of waiting for that release; (b) withdraw WO-013 as superseded with the operator's captured words and activate a successor order with the same text on base 2ab4f28501628cf95dd0102c42440fd7de9f8055; the target tree carries over and its gate rows match by tree, at the cost of a new order id and a fresh handoff and verification. Either way, the next planning pass sets a provisional base before activation, as the order's Depends on line required.",
  "reopenWhen": "The operator chooses a route, a starter update changes target-publish base handling, or origin/main of DotLn-Angular advances past 2ab4f28501628cf95dd0102c42440fd7de9f8055."
}
```

## WO-013-D009

```json
{
  "id": "WO-013-D009",
  "date": "2026-10-24",
  "dispatch": "resume: final review; operator direction during the dispatch",
  "decision": "Fail FINAL-001 on D008's blocker and send WO-013 to fix under the route the operator chose. During this dispatch the operator directed the review to send the order back to fix: the blocker needs a change in core, the operator will take the kit update that carries it, and the fix dispatch will integrate the latest changes. That is D008's route (a). A pass obliges this review to commit the reviewed target state and run the target publish, and the helper refuses that publish before any push: it composes the body's Change table and the base-tree exemption from the activation's base bc9133e932a00d33c15bc5289d683b8078f51ee4, the empty initial commit, so the table lists 515 files, 17 of them earlier orders' docs/dotln records, and the outward lint refuses their launchpad identifiers. A pass whose owed publication cannot run would be a partial completion, so the verdict is fail. The subject is unaffected: all seven criteria stand on VER-001 and this review's readbacks, the target tree is still the verified tree, and nothing was committed, pushed or published in this dispatch.",
  "evidence": [
    "Read-only reproduction in this session: in the target worktree, git diff --name-only from bc9133e9 to refs/dotln/draft/WO-013 lists 515 files (17 under docs/dotln/); from 2ab4f28501628cf95dd0102c42440fd7de9f8055, the draft's parent, it lists 83. The draft ref 1e24c0884c2bafd7ad29b3f20b4368ff2be7b1a2 has parent 2ab4f285… and tree df45f1b303bdf5ec312f9d2e2789a34537ab842c.",
    "scripts/lib/target-publish.mjs line 1111 still computes targetChanges(entry.target, state.baseCommit, draftCommit); scripts/lib/control.mjs sets baseCommit only from the activation, and CORRECTABLE_FIELDS (line 25) do not include it.",
    "npm run resume --silent -- status --json at entry: WO-013 in final-review, baseCommit bc9133e932a00d33c15bc5289d683b8078f51ee4, VER-001 pass, legalNextActions [final-review-result].",
    "The target worktree's tree, computed through a temporary index, is df45f1b303bdf5ec312f9d2e2789a34537ab842c, the tree VER-001 and the review row target-gate:5540cb1a-b9c9-4578-9f85-f8a1dc667a45 judged; git diff --check is clean; git ls-remote origin refs/heads/main prints 2ab4f285…, so origin/main has not advanced.",
    "The helper's refusal of the verified-phase draft publish, verbatim, is in host-qualification.md: 'target publish refused: outward lint: pr-body refused: identifier.launchpad', 26 findings on the Change-table rows."
  ],
  "rejected": [
    {
      "option": "Run the final publish once more to reproduce the refusal",
      "reason": "The final publish follows a commit on the target branch and attempts a push; the refusal and its cause are already recorded and the cause is reproduced read-only above, so a second attempt adds a commit and a host-admission episode for no new evidence."
    },
    {
      "option": "Pass the review and leave the publish pending until the kit changes",
      "reason": "Pass obliges the reviewed commit and the publish in the same dispatch; recording pass with the publish known to fail would claim a completion this review cannot discharge."
    },
    {
      "option": "Withdraw WO-013 and activate a successor on base 2ab4f285 (D008 route (b))",
      "reason": "The operator chose route (a); the successor would also cost a new order id, a fresh handoff and a fresh verification."
    },
    {
      "option": "Dispose D006's six follow-up rows and repair D004's generator-log layout in this review",
      "reason": "The next final review judges the integrated subject after the fix, and the generator-log move is a target edit that would change the gated tree; D004 already names the next repair of this order as its home."
    }
  ],
  "followup": "Fix dispatch of WO-013, after the operator's starter update carries core's target-publish base fix: integrate main with npm run worktree -- integrate WO-013 and run its printed affected checks; confirm against the updated kit that the target publish composes its Change table from the draft commit's parent or from an admitted base advance to 2ab4f28501628cf95dd0102c42440fd7de9f8055, so the composed body passes the outward lint; apply D004's generator-log move in the same repair; the verification that follows reruns the verified-phase draft publish, and the next final review disposes D006's six rows and publishes.",
  "reopenWhen": "The starter update leaves target-publish base handling unchanged or core declines the fix (D008 route (b) is then the remaining route), or origin/main of DotLn-Angular advances past 2ab4f28501628cf95dd0102c42440fd7de9f8055 before the fix integrates.",
  "reopens": {
    "decisionId": "WO-013-D008",
    "observation": "D008's reopening condition 'the operator chooses a route' occurred during the final-review dispatch on 2026-10-24: the operator chose route (a), a core change shipped through a kit update, with the fix dispatch integrating it. FINAL-001 records fail on D008's blocker; WO-013 goes to fix, and the local draft ref and DraftPrepared event stay as the helper left them."
  }
}
```

## WO-013-D010

<!-- integration refs/dotln/checkpoint/WO-013/8 -->

```json
{
  "id": "WO-013-D010",
  "date": "2026-10-24",
  "dispatch": "resume: fix; operator scope expansion to integrate main",
  "decision": "Integrate current main through the canonical worktree helper and use starter v0.96.1 merge-base publication. Preserve the activation base, prior reports, draft ref, target implementation and recovery material. The operator explicitly expanded this repair to merge main; the existing final-review finding and the second planning pass already select this route. The work-order text and its acceptance criteria are unchanged.",
  "evidence": [
    "npm run worktree -- integrate WO-013 exited 0: advanced 36b2ae5df06dc023156f8c2328621440ce744ef1 to fetched main a7a076247cd817cec0b3f57c5d1fc9f44668da0c, with no authored conflicts; preserved refs/dotln/checkpoint/WO-013/8 and the named integration stash.",
    "The target main and freshly fetched main remain 2ab4f28501628cf95dd0102c42440fd7de9f8055, already the target HEAD. No target history merge is needed.",
    "The bounded publish-base probe uses the imported targetChanges, composeTargetBody, lintArtifacts and GitHub body-profile checker. For the existing prepared draft, the old base describes 515 paths including 17 prior record paths; the fetched merge base describes 83 paths and zero prior record paths, with both body checks passing. The composed text discloses the activation base separately. See repair-publication.json.",
    "The complete instance integration gate passed its seven structural and installed-kit checks. Its selection does not run publication fixtures. A separate bounded run of the six imported merge-base publication regressions passed: stale tracking refs; integrated and unintegrated subjects; fetch failure with retained preparation; no-change and unrelated-history refusals; final publication after a records commit; and a same-tree retry after the remote base advances. The last two extend the failing report's single-draft example.",
    "The integration imports upstream component versions as shipped. The local work changes no component package manifest, runtime or dependency; release preparation returns the target-order no-op."
  ],
  "rejected": [
    {
      "option": "Leave this worktree at the earlier kit",
      "reason": "The NoOp retains the reproduced publication blocker and contradicts the requested integration."
    },
    {
      "option": "Rebind the active order or change its criteria",
      "reason": "The merge-base helper repairs publication without rewriting lifecycle history or weakening acceptance."
    },
    {
      "option": "Use the draft parent as the permanent publication base",
      "reason": "A final records commit has the reviewed change as its parent; comparing only that parent would omit the implementation. The fetched merge base describes the complete change."
    },
    {
      "option": "Publish during repair",
      "reason": "Independent verification must judge the changed target tree before its verified-phase draft publication. This repair exercises composition and lint without a push or PR operation."
    }
  ],
  "reopenWhen": "The current-tree verification publish is refused, the target remote main advances, or an integrated check rejects the preserved claims.",
  "reopens": {
    "decisionId": "WO-013-D008",
    "observation": "Starter v0.96.1 reached main and this repair integrated it. The fetched-merge-base calculation and composed body now pass the local reproduction; actual draft publication remains the following verifier dispatch."
  }
}
```

Integration recovery: checkpoint `refs/dotln/checkpoint/WO-013/8`; retained stash
`2b27d71576653f8a21307b18f5e739de32fb9dcf`. No authored conflict occurred.
The helper regenerated runtime, harness, control, release and index surfaces.
The previous criterion evidence remains historical; fresh target and integration
gates and the final document gate judge the repaired state before completion.

## WO-013-D011

```json
{
  "id": "WO-013-D011",
  "date": "2026-10-24",
  "dispatch": "resume: fix; FINAL-001 repair route and VER-001 F1",
  "decision": "Move the existing sub-app generator plan and result into one dated section after the events-and-state entry. Preserve every line, command, failed attempt and success result; remove the resolved generator-log note from the draft PR body. This is the bounded documentation repair selected by D004 and the failing final review, recorded as adjacent-0001.",
  "evidence": [
    "The bounded structure/content probe passed: the complete line multiset is unchanged, the preamble and table precede the dated sections, all six invocation lines remain, and the observed success result follows its own sub-app heading. See repair-generator-log.json.",
    "A temporary-index tree comparison against the verified draft shows exactly one changed target file: docs/dev-reference/workspace/generator-log.md. The repaired target tree is dc997234bc57801c1909a76fa45f5524f3e3dfab.",
    "The next action was announced before implementation. At a safe message boundary after the publication reproduction and a steering interval, queue revision 2 was reread and no newer direction had been delivered. The check-in is actor-attested, not an inbox observation."
  ],
  "rejected": [
    {
      "option": "Leave the split entry in place",
      "reason": "The NoOp keeps the wrong attribution of the result and ignores the follow-up whose repair condition has occurred."
    },
    {
      "option": "Rewrite the commands or rerun the generators",
      "reason": "The generators already succeeded; only the placement is wrong. Rewriting the history or rerunning generation would risk unrelated changes."
    },
    {
      "option": "Combine this move with app behavior or catalog changes",
      "reason": "The failing report names this log repair; the remaining catalog and route follow-ups retain their separate recorded owners and conditions."
    }
  ],
  "reopenWhen": "The current target gate fails, a recorded generator line is missing, or a later edit separates a plan from its result.",
  "reopens": {
    "decisionId": "WO-013-D004",
    "observation": "The named next-repair condition occurred. The entry and results now share their dated heading at the end of the log, and the bounded preservation/structure check passes."
  }
}
```

## WO-013-D012

<!-- integration refs/dotln/checkpoint/WO-013/13 -->

```json
{
  "id": "WO-013-D012",
  "date": "2026-10-24",
  "dispatch": "resume: final review; worktree integrate WO-013",
  "decision": "The integration is a no-op and no launchpad complete run is owed. The order worktree was already at fetched main a7a076247cd817cec0b3f57c5d1fc9f44668da0c (starter v0.96.1), which the fix integrated in D010, so the helper moved no launchpad byte and the launchpad code identity stays 3900f6f9a5aefe0bd1f6f010bcc69f977e9f3f8855608b6e9887dd293a53dda8, the identity at which the fix recorded the passing complete review row (host-gate:3900f6f9…:npm test, 2026-10-24T22:49:00Z, seven tasks, 617 s). That row still covers the identity, so it is reused; the other affected checks the helper printed ran green. Carried-forward claims: VER-002's seven criterion judgments at target tree dc997234bc57801c1909a76fa45f5524f3e3dfab; the target review gate row target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb at that tree; the draft pull request #6 and its CI at 99a30befa150e5d77a64259013e62b9d0372270e, whose tree is dc997234…; and the repair's publication reproduction. No component version collides (release preparation returns the target-order no-op and no component manifest changed), and no evidence input changed since VER-002 except this review's own records.",
  "evidence": [
    "npm run worktree -- integrate WO-013 exited 0: Bases a7a076247cd817cec0b3f57c5d1fc9f44668da0c -> a7a076247cd817cec0b3f57c5d1fc9f44668da0c, authored conflicts none, checkpoint refs/dotln/checkpoint/WO-013/13, retained stash b3f1b2251dc554cb8d17a6b06fb909dee82bc4d4; it regenerated the runtime, the harness bundle, the control projection, release preparation, this stub, the indexes and the register; git status afterwards showed only the order's own untracked records and the generated projections.",
    "gateCodeIdentity(root) read through scripts/lib/gate-evidence.mjs prints 3900f6f9a5aefe0bd1f6f010bcc69f977e9f3f8855608b6e9887dd293a53dda8, and coveringGateCheck(root, 'npm test', [], identity) returns the row host-gate:3900f6f9…:npm test recorded 2026-10-24T22:49:00.422Z, executed, exit 0, requiredSuites kit-verify, format, configuration-root, registrations, declarations, generated and host; one candidate, nothing displaced. repair-gates.json records the same row.",
    "Affected checks: npm run publication:check printed 'publication: no editions declared' (exit 0); node scripts/harness.mjs check printed '35 generated surfaces; local-terms list: present' (exit 0); npm run release -- check-surfaces --local passed every license surface (exit 0); npm run plan -- check reported no advisories and an unchanged judged subject; npm run release -- prepare --local printed 'WO-013: target order records no release; no files changed'; npm run adjacent -- list shows the repair's completed queue and nothing pending; npm run terms -- check over the order's records found no match (the list is present).",
    "npm test -- --review was not rerun: the skill reuses the passing complete row at the integrated code identity when one exists, and the identity is unchanged since that row."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    },
    {
      "option": "Start npm test -- --review again for the ritual",
      "reason": "The identity, not the dispatch time, says what was tested; a rerun would record the same identity again after about ten minutes of lane waiting and prove nothing new."
    }
  ],
  "reopenWhen": "A later integration moves a launchpad code byte before the records publish, so the identity changes and a fresh complete row is owed, or an authored resolution changes behavior, contracts, authority or acceptance; return that finding through repair and fresh independent verification."
}
```

Integration date: 2026-10-24. Original base: `a7a076247cd817cec0b3f57c5d1fc9f44668da0c`.
Fetched main: `a7a076247cd817cec0b3f57c5d1fc9f44668da0c`. Checkpoint: `refs/dotln/checkpoint/WO-013/13`.
Named stash retained: `b3f1b2251dc554cb8d17a6b06fb909dee82bc4d4` (WO-013 integrate 2026-10-24).
Resolved projections: none.
Release preparation: WO-013: target order records no release; no files changed.
Carried-forward claims: VER-002's seven criterion judgments at target tree `dc997234bc57801c1909a76fa45f5524f3e3dfab`, the review gate row `target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb` at that tree, the draft pull request #6 and its CI at `99a30befa150e5d77a64259013e62b9d0372270e`, and the fix's complete review row at the unchanged launchpad code identity `3900f6f9a5aefe0bd1f6f010bcc69f977e9f3f8855608b6e9887dd293a53dda8`, reused.
Authored conflicts observed: none.
Affected checks run: `npm run publication:check`, `node scripts/harness.mjs check` and `npm run release -- check-surfaces --local` passed; `npm test -- --review` was not rerun because the passing complete row covers the unchanged identity.

## WO-013-D013

```json
{
  "id": "WO-013-D013",
  "date": "2026-10-24",
  "dispatch": "resume: final review; the adoption of the draft commit before the result transition",
  "decision": "Before the result transition, move the wo-013 branch head to the verified draft commit 99a30befa150e5d77a64259013e62b9d0372270e without a review commit, so that a pass would bind the review to clean committed bytes: the target working tree's index tree is dc997234bc57801c1909a76fa45f5524f3e3dfab, equal to the draft commit's tree, to the tree the review gate row target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb judged, to VER-002's tree and to the head of DotLn-Angular pull request #6, so the head was moved with git add -A and git update-ref over the expected old value 2ab4f28501628cf95dd0102c42440fd7de9f8055; the status is clean, HEAD descends from the activation base and git diff --check is clean. The result transition was then refused by the kit's pre-review commit lint (D015), so the verdict is fail and no publish follows. The head stays at the draft commit: it is the pull request's head and the verified tree, the status is clean, the next draft publish reuses it at the same tree, and the next final review adopts it as the reviewed commit or supersedes it; moving it back would only turn the same bytes into staged changes. The target review gate is not rerun: no target byte changed in this review. WO-007-D019 item (e), the toast story and the board failure-state axe check, is recorded as left: the toast wrapper under libs/shared/ui and the board browser spec are outside this order's declared surfaces, and a fix would change target bytes after VER-002's uncached runs and the draft's CI, cost a gate run and a commit, and satisfy no criterion. This review found no new defect in the subject: every criterion's literal check and the four unit suites were rerun here, the whole subject diff was read, and the implementation review's observations (an empty list entry for a group given neither an item nor a message; a translate attribute on the empty line) are notes, not defects in the declared behavior. The publication bodies PR.md, RELEASE-NOTES.md and RECORDS-PR.md written before the refusal stay beside the report as drafts for the next review, which revises them.",
  "evidence": [
    "In the target: GIT_INDEX_FILE on a temporary index in the DotLn session scratch, git add -A and git write-tree printed dc997234bc57801c1909a76fa45f5524f3e3dfab before any change; git rev-parse 99a30bef^{tree} prints the same; after git add -A and git update-ref -m 'adopt the verified draft commit as the reviewed head' refs/heads/wo-013 99a30bef… 2ab4f285…, git status --short printed nothing, git merge-base --is-ancestor bc9133e9… HEAD exited 0 and git diff --check printed nothing. The draft commit's author and committer are the operator's public identity, its subject is the order's plain title and its body is empty.",
    "Criterion literals at this tree: routes.ts declares Scene and Machinery (grep counts 2); app.routes.ts names both lazy imports (2) and 'redirectTo: BasePaths.Board' (1); sub-app-menu.ts exists with 0 'inject(' and 0 '@angular/router' lines under libs/dotln/shell/src; both index.ts files count 1 export and both project.json files carry scope:dotln and type:feature; en.json carries shell.menu.scene 'Scene', machinery 'Machinery', tools 'Tools' and toolsEmpty 'No tools yet.'; both documents exist, 'control record' counts 1 in sub-app-rules.md, line 20 names the GitHub issue, and the generator log names the two libraries on six lines.",
    "node scripts/harness.mjs bounded -- env NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many -t test -p dotln-shell core scene machinery --skip-nx-cache --output-style=static: 'Successfully ran target test for 4 projects', 8.1 s, exit 0 (bounded-result exitCode 0, 2026-10-24T23:22:22Z).",
    "The added text carries no eslint-disable, @ts-ignore, @ts-expect-error, @ts-nocheck or prettier-ignore directive (0 in the tracked diff and 0 in the untracked files); the only files under the reviewed app and library paths that import @dotln-angular/state, data-access or events are app.config.ts and app.spec.ts, both unchanged from main.",
    "gh pr view 6, gh run view 40141573159 and 40141573200, the REST comment endpoints and a GraphQL count: open draft, mergeable, head 99a30bef…, CI checks and macOS visual jobs and the title job all success at that head, zero review threads, zero reviews, zero comments; recorded in preview-pr.json.",
    "WO-007-D019 item (e): libs/shared/ui/src/lib/wrappers/toast/ and apps/dotln-e2e/src/board.spec.ts are untouched by this order's diff; the order's declared surfaces are the shell templates, the two feature libraries, the core routes, the app, the sub-app specs, en.json and the documents."
  ],
  "rejected": [
    {
      "option": "Rerun node scripts/target-gate.mjs WO-013 --review",
      "reason": "No target byte changed in this review; the adopted commit's tree equals the gated tree, and a rerun would record the same tree again at about 90 s."
    },
    {
      "option": "Add the toast story and the failure-state axe check here",
      "reason": "Outside the declared surfaces; a defect outside both the criteria and the surfaces is boarded with its reproduction, and the row already exists."
    },
    {
      "option": "Make a review commit on top of the draft",
      "reason": "There is nothing to commit; a second commit with the same tree would only move the pull request's head."
    },
    {
      "option": "Move the branch head back to 2ab4f285 after the refusal",
      "reason": "The bytes would not change; the same 44 paths would become staged changes against the previous head, the pull request's head would no longer be the branch head, and the next session would have to adopt the draft commit again."
    }
  ],
  "reopenWhen": "The next final review finds the draft commit unsuitable as the reviewed commit, the pull request's head moves, or a later order finds a defect in the sub-app menu or the arriving pages that this review's reading missed."
}
```

## WO-013-D014

```json
{
  "id": "WO-013-D014",
  "date": "2026-10-24",
  "dispatch": "resume: final review; disposition of the follow-up rows this order's verification and reviews left for final review",
  "decision": "Dispose the register rows at revision 7343e68af818f31fcac3ce0caf82a49a034c9a23c160e4d07d41aad1561f2824, producing revision 4d55acd98f4ff78216d6fb50c9bddd4be03ec6e318856b6099785b81554f15f9. Settled: FUP-bc6508078fd59255 (D006, the verifier's request that this review dispose the six rows); FUP-032068baddbe1e4e (D008, the refused publish) and FUP-6f60d461e1ef101b (D009, the fix route), on the successful verified-phase draft publish under starter v0.96.1 (pull request #6, 83 change rows, no earlier-order record row) and this review's publish with the same helper. Deferred: FUP-d1253c8eb7d324d7 (WO-007-D019) with item (e) recorded as left and items (a) to (d) and (f) not occurred; FUP-2479f6d32b2396a8 (WO-004-D013, the registration trust entry) with this order's observation that both verified-phase draft publishes were admitted by the hook and allowed by the host without a prompt, the one refusal being the outward lint's; FUP-40112dbc26c91d9e (D007, the unknown path) for the order that next changes app.routes.ts; FUP-c789b3662529a11c (D005, the two order-text observations) for the next planning pass. Left as they are: FUP-3372acd8d62e8cc7 (C2, the lane pair) and FUP-48b1009d908e251d (C8, the board under /machinery), deferred candidates whose conditions have not occurred; FUP-1508c6254455ccf3 and FUP-98c85b750cb36bd4, declined by the second 2026-10-24 planning pass (D10); and FUP-ffa034330edc5ff0, settled by that pass (D3). Amended in the same dispatch: after this batch, the result transition was refused by the pre-review commit lint (D015), so the publish those two settlements anticipated did not run; D015's batch re-disposes the D008 and D009 rows as deferred with the new blocker, and the other five dispositions stand.",
  "evidence": [
    "npm run plan -- followups --touching WO-013 listed eight pending rows at revision 7343e68a…: five untriaged (the rows of D005 to D009) and three deferred (C2, C8 and WO-007-D019); --show FUP-2479f6d32b2396a8 read two source revisions and a last deferral at 2026-10-24T16:06:27Z; --show of FUP-1508c6254455ccf3 and FUP-98c85b750cb36bd4 read declined dispositions at 22:07:54Z and of FUP-ffa034330edc5ff0 a settled one at 22:07:54Z.",
    "The batch of seven requests was applied from the ignored intake path docs/intake/notes/wo013-final-review-followups-batch.json with npm run plan -- followups --apply, which returned three settled and four deferred statuses and revision 4d55acd98f4ff78216d6fb50c9bddd4be03ec6e318856b6099785b81554f15f9.",
    "docs/evidence/WO-013/host-qualification.md, the two verified-phase sections: a registeredTargetAdmission row of kind helper for each publish call and no PermissionDenied row for either, the first call ending in the outward lint's refusal and the second in pull request #6; the one classifier denial was a read-only readback in the first session.",
    "Each reason names the decision that records the observation (D013 or this one), so the next planning pass reads the row and the decision together."
  ],
  "rejected": [
    {
      "option": "Settle the trust-entry row now",
      "reason": "Its condition asks a planning pass to rule on the registration trust entry; admitted-and-allowed publishes are observations, not the ruling."
    },
    {
      "option": "Leave the five untriaged rows for the planning pass",
      "reason": "An untriaged row at a final review is a row nobody has read; each is deferred or settled with its reopening condition."
    },
    {
      "option": "Settle D008 and D009 only after the final publish",
      "reason": "The blocker was the composition from the activation base, which the successful draft publish already disproves at this tree; the final publish's outcome goes into host-qualification.md, and its refusal is the rows' reopening condition."
    }
  ],
  "reopenWhen": "The next planning pass reads the deferred rows, a listed condition occurs before then, or the final publish of this order is refused."
}
```

## WO-013-D015

```json
{
  "id": "WO-013-D015",
  "date": "2026-10-24",
  "dispatch": "resume: final review; final-review-result pass refused by the pre-review commit lint",
  "decision": "Fail FINAL-002 on a reproduced blocker of the same class as D008 and send WO-013 back to fix under the operator's route (a) of D009. The result transition's pre-review commit lint (scripts/lib/target-commit-lint.mjs, lintReviewedTargetCommits, called by scripts/resume.mjs for final-review-result pass on a target order) lints every commit from the reviewed subject's baseCommit to its commit, and reviewedTargetSubject binds baseCommit to the activation base bc9133e932a00d33c15bc5289d683b8078f51ee4, the repository's empty initial commit. It therefore read 17 commits, 16 of them already on the target's main, and refused before any event was appended on two merged subjects of 78 and 90 characters (the #4 merge commit and a documentation commit of #3) against the 72-character limit. The order's own commit, 99a30befa150e5d77a64259013e62b9d0372270e, has a 61-character subject, carries no launchpad identifier and no attribution, and would pass a lint over the merge base of the subject and the target's main (2ab4f28501628cf95dd0102c42440fd7de9f8055). Starter v0.96.1 (core WO-230) moved the publish's Change table, base-tree exemption and no-change check to that merge base; the pre-review lint did not move with them. No role here can rebind the base (D008), the merged subjects cannot be rewritten, the kit file is manifest-listed and verified by kit-verify so it is not this instance's to edit, and a lint limit is not raised to pass a check. Safe default: WO-013 records fail and goes to fix; the target branch head stays at the draft commit (the pull request's head, the verified tree, a clean status; D013), draft pull request #6 stays open, the launchpad records stay uncommitted in this worktree, and nothing is pushed or published. The fix waits for the kit update that carries the lint over the described merge base and integrates main first, as the operator's record directs for a fix that waits on a kit release; the following verification republishes the draft at the same tree and the next final review records pass and publishes. Override is the operator's recovery control, not a proposed way to pass; route (b) of D008 (withdraw and a successor order on base 2ab4f285) stays the operator's alternative if core declines.",
  "evidence": [
    "npm run resume --silent -- final-review-result pass --harness claude-code --harness-version 2.1.310 --model claude-fable-5-1 --effort xhigh --source claude-session-readback printed 'Error: target publish refused: commit message format refused before final review: subject.length: 90 of 72 characters' and recorded nothing: status still reads phase final-review, FINAL-002 allocated, legalNextActions [final-review-result], and the control segment's last event is FinalReviewRequested at 2026-10-24T23:15:54.181Z.",
    "scripts/resume.mjs, case final-review-result: for verdict pass on a target order it calls reviewedTargetSubject(repoRoot, state) and then lintReviewedTargetCommits(repoRoot, state, targetSubject) before targetGateEvidence; for verdict fail the subject is undefined and the lint does not run. scripts/lib/target-commit-lint.mjs targetCommits(repo, baseCommit, commit) runs git rev-list --reverse baseCommit..commit and lintReviewedTargetCommits passes subject.baseCommit; scripts/lib/target-worktrees.mjs reviewedTargetSubject requires entry.baseCommit === state.baseCommit, the activation base. scripts/lib/outward-lint.mjs exports subjectLengthLimit = 72 and rule subject.length.",
    "In the target: git rev-list --count bc9133e9..HEAD prints 17 and 2ab4f285..HEAD prints 1; git merge-base HEAD origin/main prints 2ab4f28501628cf95dd0102c42440fd7de9f8055; the subjects over 72 characters in the wider range are 2e983e8 (90 characters, 2026-10-20, 'docs: describe the foundation libraries in the developer index and order the generator log', on origin/main since #3) and 90fa6e8 (78 characters, the #4 merge commit); the order's commit 99a30bef has a 61-character subject.",
    "docs/planning/standard-pass-v0-96-1-2026-10-24.md's v0.96.1 row names the publish's Change table, base-tree exemption and no-change check as what core WO-230 moved to the merge base; it names no change to the pre-review commit lint, and the kit's target-commit-lint.mjs at 5ad686d1 still ranges from subject.baseCommit.",
    "D008 and D009 record the same class on the publish path and the operator's choice of the core route; the operator record (docs/operator/README.md, Standing preferences, Lifecycle steps) says a failed final review sends the order to resume: fix and a fix that waits on a kit release waits for the update to reach main first."
  ],
  "rejected": [
    {
      "option": "Edit scripts/lib/target-commit-lint.mjs or reviewedTargetSubject in this instance to lint from the merge base",
      "reason": "Both are manifest-listed kit files verified by kit-verify in every gate; the instance changes them only through an opted-in kit update, and a reviewer repairs no kit."
    },
    {
      "option": "Raise or bypass the 72-character limit",
      "reason": "The limit is right and the order's commit meets it; the defect is the range, and a check is never weakened to pass."
    },
    {
      "option": "Rewrite the two merged subjects",
      "reason": "They are on the target's main behind a ruleset that refuses force pushes; history is never rewritten."
    },
    {
      "option": "Record pass by operator override",
      "reason": "Override is the operator's recovery control for authorized recovery, never a proposed way to pass review; the safe default is recorded and the operator decides."
    },
    {
      "option": "Withdraw WO-013 and activate a successor on base 2ab4f285 (D008 route (b))",
      "reason": "A terminal off-ramp with the operator's captured words, and the operator chose route (a) for this class on 2026-10-24; it stays their alternative if core declines."
    }
  ],
  "followup": "Fix dispatch of WO-013 after the starter update that carries core's fix to the pre-review commit lint (lint the commits between the described merge base of the subject and the target's fetched main, as the v0.96.1 publish describes its change, naming the activation base beside it): integrate main with npm run worktree -- integrate WO-013 and run its printed affected checks; confirm against the updated kit that final-review-result pass lints only 2ab4f285..HEAD, the one commit 99a30bef; change no target byte unless the kit asks; the verification that follows reruns the verified-phase draft publish at the same tree, and the next final review records pass and publishes with PR.md, RELEASE-NOTES.md and RECORDS-PR.md revised from the drafts FINAL-002 left.",
  "reopenWhen": "The starter update leaves the pre-review commit lint ranging from the activation base, or core declines the fix (D008 route (b) is then the remaining route), or origin/main of DotLn-Angular advances past 2ab4f28501628cf95dd0102c42440fd7de9f8055 before the fix integrates.",
  "reopens": {
    "decisionId": "WO-013-D009",
    "observation": "D009's reopening condition, a starter update leaving a target-publish base path unchanged, occurred in its neighbouring form on 2026-10-24: v0.96.1 fixed the publish's description but the pre-review commit lint still ranges from the activation base, so final-review-result pass was refused before the publish could be reached."
  }
}
```

## WO-013-D016

<!-- integration refs/dotln/checkpoint/WO-013/16 -->

```json
{
  "id": "WO-013-D016",
  "date": "2026-10-25",
  "dispatch": "resume: fix; worktree integrate WO-013",
  "decision": "Integrate main 04c45cfae32d337b367496f79f708d0913f1cb7f into the order worktree through the canonical helper, taking starter v0.99.0 and its v0.97.1 review-lint repair. This follows the operator-selected core route in D009, FINAL-002 F1 and the 2026-10-25 planning pass D3. Preserve the activation base, the target draft, the filed reports and both recovery refs. Resolve the two authored documentation conflicts by combining main's newer planning decisions with the local review facts and evidence link. The target application is unchanged. No local component version bump is warranted: all component changes arrive from the reviewed kit, release-surface checks pass, and release preparation returns the target-order no-release outcome.",
  "evidence": [
    "Integration: a7a076247cd817cec0b3f57c5d1fc9f44668da0c -> 04c45cfae32d337b367496f79f708d0913f1cb7f; checkpoint refs/dotln/checkpoint/WO-013/16; retained stash b3403ee11859fa61bcd3d4385a9d8d9d54ab28c9. The first attempt required an intake backup; backup:intake verified three files in a private session-scratch archive before integration proceeded. Intake was never removed or printed.",
    "Authored conflicts were docs/repositories/dotln-angular.md and docs/workstreams/WS-001-dotln-angular.md. Their combined resolutions retain the newer amendments to WO-008 and WO-014 through WO-018, the historical all-criteria-met/no-new-defect judgment of FINAL-002, and the order evidence link. The helper regenerated runtime, harness, control projection, release preparation, decisions index, follow-up register and work-order index.",
    "npm run publication:check exited 0 (no editions declared); node scripts/harness.mjs check exited 0 (35 generated surfaces); npm run release -- check-surfaces --local passed the release, component, workspace-pin, body-profile, license and publication-control checks. npm run plan -- check reports 10 receipts, 10 passes, no advisory and an unchanged judged subject.",
    "Changed evidence input: launchpad code identity moved from 3900f6f9a5aefe0bd1f6f010bcc69f977e9f3f8855608b6e9887dd293a53dda8 to dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897. The fresh complete launchpad review passed all seven tasks in 14.482 seconds at that identity on 2026-10-25T21:52:13.617Z, with 50 ms of host-lane waiting (repair-review-gates.json). The document gate follows the final handoff edit and is consumed by repair-complete.",
    "Carried-forward application claims: target HEAD 99a30befa150e5d77a64259013e62b9d0372270e has unchanged tree dc997234bc57801c1909a76fa45f5524f3e3dfab and clean status. targetGateEvidence(root, state, review) accepts target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb for all seven declared commands with the current command declaration. The original Preflight remains in command-results.json; the target review row and its per-command zero-write results remain in repair-gates.json. VER-001, VER-002, FINAL-001 and FINAL-002 each still match their filed hashes (repair-review-lint.json).",
    "The nested-repository scan found none in either checkout outside intake, private control, installed dependencies and generated runtime/build/test caches; symlinks were not traversed. The imported regression fixtures clean up their temporary repositories."
  ],
  "rejected": [
    {
      "option": "Leave the worktree on the old kit (NoOp)",
      "reason": "The reproduced final-review lint would continue to include merged commits and refuse WO-013."
    },
    {
      "option": "Choose either side of the authored conflicts wholesale",
      "reason": "The older side omits new planning amendments; the newer side omits local review details and an evidence link. Their factual changes are compatible and were combined."
    },
    {
      "option": "Rewrite target history, rebind the activation base, edit kit files locally or weaken the lint",
      "reason": "The operator chose the upstream route, the upstream repair is available, and the existing target commit meets the unchanged rule."
    },
    {
      "option": "Rerun the target gate after changing no target byte",
      "reason": "The current gate reader confirms the existing complete target row covers the exact tree and command declaration. A new launchpad complete run is owed for the changed kit; repeating the application gate supplies no new evidence for this repair."
    }
  ],
  "reopenWhen": "The target tree, registered command declaration or fetched base changes; an authored resolution changes behavior, authority or criteria; or the complete/document checks reject the integrated records."
}
```

## WO-013-D017

```json
{
  "id": "WO-013-D017",
  "date": "2026-10-25",
  "dispatch": "resume: fix; reproduce FINAL-002 F1 against the integrated kit",
  "decision": "The repaired rule lints only commits from the subject's merge base with the locally fetched target base when that merge base descends from the activation base. It retains the activation base as provenance, preserves the existing format/identifier/attribution refusals for new commits, and explicitly falls back to the activation range when the tracking ref is absent. Prove that rule through the real reviewed-subject reader and lint without recording a final-review result, then run the imported result-transition regressions. Keep the target and all filed reports unchanged. No independent worker is needed for repair-complete; the fresh-worker rule applies to implementation-ready, and this repair uses separate source/criteria and regression/evidence review passes.",
  "evidence": [
    "git fetch --no-tags origin main in the target succeeded; refs/remotes/origin/main remains 2ab4f28501628cf95dd0102c42440fd7de9f8055. The repair-commit-lint.mjs probe asserts the reviewed subject, clean status, activation base, merge base, 17-commit activation range, one-commit described range and 61-character new subject. The old range contains the two 78/90-character merged subjects; lintReviewedTargetCommits now returns successfully and the control segment is byte-identical before and after. See repair-review-lint.json.",
    "Seven imported regression cases in scripts/test-target-worktree-start.mjs pass under harness bounded, exit 0, 23.835 seconds. Besides the reported merged-history case, they prove the missing-ref fallback with origin offline and new format, launchpad-identifier and attribution refusals. Every negative case checks that no result event is appended; the passing case binds the unchanged activation base.",
    "Planning pass standard-pass-v0-99-0-2026-10-25 D4/D5/D15 is now integrated. D005 item 1 is addressed by the run-many forms in amended orders; item 2 stays with candidate FUP-2138dd6781c01e55 if a successor is filed, leaving this active order's text unchanged. D007's not-found page, wildcard route and tests are explicitly allocated to WO-014. Update their existing register rows instead of creating duplicate work.",
    "FUP-032068baddbe1e4e (D008), FUP-6f60d461e1ef101b (D009) and FUP-a59b958a5a2c9e8b (D015) retain the independent verification/draft and final-review/publication boundary. Their kit-integration and lint-reproduction steps are discharged here, but no live final-review pass or publication is claimed by this repair."
  ],
  "rejected": [
    {
      "option": "Treat reading the updated source as sufficient (NoOp on executable reproduction)",
      "reason": "The original blocker appears only on a result-transition path; the real-worktree lint and imported transition tests directly establish the behavior without consuming the independent reviewer's phase."
    },
    {
      "option": "Mark publication follow-ups settled before a live reviewed publish",
      "reason": "FINAL-002 already records why an anticipated publish is not completion evidence. The next verifier republishes the draft after passing; the next final reviewer judges and publishes."
    },
    {
      "option": "Add an unknown-route page or alter the active order's wording in this repair",
      "reason": "The integrated planning pass assigns the page to WO-014 and retains the dependency-wording change for a successor. FINAL-002 names an integration blocker, and the authorized repair preserves target bytes."
    }
  ],
  "reopenWhen": "The live final-review result refuses again, the target's fetched base or subject changes, or a new commit fails an unchanged outward rule.",
  "reopens": {
    "decisionId": "WO-013-D015",
    "observation": "Core shipped WO-231 in starter v0.97.1; the integrated v0.99.0 kit carries it, and both the real-worktree lint and seven imported transition controls now pass."
  }
}
```

## WO-013-D018

<!-- integration refs/dotln/checkpoint/WO-013/21 -->

```json
{
  "id": "WO-013-D018",
  "date": "2026-10-25",
  "dispatch": "resume: final review; worktree integrate WO-013",
  "decision": "The integration is a no-op, and no launchpad complete run is owed. The order worktree was already at fetched main 04c45cfae32d337b367496f79f708d0913f1cb7f (starter v0.99.0), which the second fix integrated in D016, so the helper moved no launchpad code byte. The launchpad code identity stays dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897, where the fix recorded a passing complete review row (host-gate:dbd80775…:npm test, 2026-10-25T21:52:13.617Z, seven fresh suites, gate selection review). That row still covers the identity, so it is reused. The other affected checks the helper printed ran green. Carried-forward claims: VER-003's seven criterion judgments at target tree dc997234bc57801c1909a76fa45f5524f3e3dfab; the target review gate row target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb at that tree, which the current reader accepts for the reviewed commit 99a30befa150e5d77a64259013e62b9d0372270e; draft pull request #6 and its CI at that head; and the repaired pre-review commit lint, which this review reran read-only and which passes over the one described commit. No component version collides: release preparation returns the target-order no-op, and no component manifest changed. Since VER-003, no evidence input changed except this review's own records. The target tree did not move, and the launchpad identity did not move.",
  "evidence": [
    "npm run worktree -- integrate WO-013 exited 0: Bases 04c45cfae32d337b367496f79f708d0913f1cb7f -> 04c45cfae32d337b367496f79f708d0913f1cb7f, authored conflicts none, checkpoint refs/dotln/checkpoint/WO-013/21, retained stash 5b5e2a2ae304a1cd9aff3ce12500235e17a4e293. It regenerated the runtime, the harness bundle, the control projection, release preparation, this stub, the indexes and the register; git status afterwards showed only the order's own records and the generated projections.",
    "gateCodeIdentity(root), read through scripts/lib/gate-evidence.mjs, prints dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897. findGateCheck(root, 'npm test', …) returns host-gate:dbd80775…:npm test, recorded 2026-10-25T21:52:13.617Z: executed, exit 0, executionMode fresh, gateSelection review, 7 fresh and 0 reused suites (kit-verify, format, configuration-root, registrations, declarations, generated, host), none unrun or stale. repair-review-gates.json records the same row.",
    "Affected checks: npm run publication:check printed 'publication: no editions declared' (exit 0); node scripts/harness.mjs check printed '35 generated surfaces; local-terms list: present' (exit 0); npm run release -- check-surfaces --local passed every surface (exit 0).",
    "Read-only probe in the DotLn session scratch, under harness bounded, exit 0, 2026-10-25T22:16:48Z. reviewedTargetSubject binds base bc9133e9… and commit 99a30bef…. refs/remotes/origin/main and the merge base are both 2ab4f28501628cf95dd0102c42440fd7de9f8055. lintReviewedTargetCommits passes over 1 commit (subject 61 characters; the activation range still holds 17). targetGateEvidence accepts target-gate:b11301fb… for review and plain at tree dc997234…. The control segment's bytes and the target's clean status are unchanged before and after.",
    "npm test -- --review was not rerun: the skill reuses the passing complete row at the integrated code identity when one exists, and the identity is unchanged since that row."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    },
    {
      "option": "Start npm test -- --review again for the ritual",
      "reason": "The identity, not the dispatch time, says what was tested. A rerun would record the same identity again and prove nothing new."
    },
    {
      "option": "Rerun node scripts/target-gate.mjs WO-013 --review",
      "reason": "No target byte changed after VER-002. The reviewed commit's tree equals the gated tree, and the current reader accepts the row against the current command declaration. This review reran the unit and browser suites uncached instead, which is where the gate's cache replays were thin."
    }
  ],
  "reopenWhen": "A later integration moves a launchpad code byte before the records publish, so the identity changes and a fresh complete row is owed; the target's main advances past 2ab4f28501628cf95dd0102c42440fd7de9f8055 before the final publish; or the final publish refuses its Change table, base-tree exemption or commit range."
}
```

Integration date: 2026-10-25. Original base: `04c45cfae32d337b367496f79f708d0913f1cb7f`.
Fetched main: `04c45cfae32d337b367496f79f708d0913f1cb7f`. Checkpoint: `refs/dotln/checkpoint/WO-013/21`.
Named stash retained: `5b5e2a2ae304a1cd9aff3ce12500235e17a4e293` (WO-013 integrate 2026-10-25).
Resolved projections: none.
Release preparation: WO-013: target order records no release; no files changed.
Carried-forward claims: VER-003's seven criterion judgments at target tree `dc997234bc57801c1909a76fa45f5524f3e3dfab`; the review gate row `target-gate:b11301fb-7e55-4bd4-b12e-69c65e5f22eb` at that tree; draft pull request #6 and its CI at `99a30befa150e5d77a64259013e62b9d0372270e`; the repaired pre-review lint, rerun read-only here and passing over one commit; and the fix's complete review row at the unchanged launchpad code identity `dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897`, reused.
Authored conflicts observed: none.
Affected checks run: `npm run publication:check`, `node scripts/harness.mjs check` and `npm run release -- check-surfaces --local` passed. `npm test -- --review` was not rerun, because the passing complete row covers the unchanged identity.

## WO-013-D019

```json
{
  "id": "WO-013-D019",
  "date": "2026-10-25",
  "dispatch": "resume: final review; FINAL-003 acceptance and the publication that follows it",
  "decision": "Accept WO-013 in FINAL-003, with every criterion met and no new finding, and record pass. The reviewed commit is the verified draft commit 99a30befa150e5d77a64259013e62b9d0372270e. It is already the wo-013 branch head (D013) and the head of DotLn-Angular pull request #6, with clean status and tree dc997234bc57801c1909a76fa45f5524f3e3dfab. No review commit follows it, because this review changed no target byte. After the result: target-records adds the records commit; the instance records are committed; the target publish pushes both commits over the draft under its lease on feat/sub-app-menu, with the reviewed title and PR.md, and marks #6 ready; then the instance records branch is published with RECORDS-PR.md. The three publication rows still pending for this order are settled only from the final publish's recorded outcome, after it runs: FUP-032068baddbe1e4e (D008), FUP-6f60d461e1ef101b (D009) and FUP-a59b958a5a2c9e8b (D015). The registration trust-entry row FUP-2479f6d32b2396a8 is deferred again, with the final publish's hook admission and host decision as its new observation. The reason for both is that the decisions file moves into the target before the publish, while the register and host-qualification.md stay in the launchpad, so each disposition can cite the observed outcome instead of anticipating it, which FINAL-002 had to correct (D014, D015). Left as they are: FUP-d1253c8eb7d324d7 (WO-007-D019; no surface or condition it names changed after FINAL-002), the D005 row FUP-c789b3662529a11c and the planning candidates C1, C2 and C8 of the 2026-10-24 and 2026-10-25 passes, whose conditions have not occurred.",
  "evidence": [
    "FINAL-003: every criterion's literal check reran at the branch head. The four affected unit suites ran uncached (core 8, dotln-shell 4, scene 1, machinery 1; exit 0, 9.5 s under harness bounded). npx nx e2e dotln-e2e --skip-nx-cache passed 57 browser tests in 29.1 s, 13 of them in sub-apps.spec.ts (exit 0, 36.0 s under harness bounded). git diff --check 2ab4f285..HEAD is clean. The added lines carry no suppression directive and no import of @dotln-angular/state, data-access or events.",
    "The read-only probe recorded in D018: the pre-review lint passes over the one described commit, and the target gate reader accepts the review row at the reviewed commit's tree.",
    "gh pr view 6, the comment and review counts, a GraphQL review-thread count and gh run list for feat/sub-app-menu: open draft, mergeable, head 99a30bef…, zero comments, reviews and threads. CI run 40141573159 and title runs 40141573200 and 40238888097 succeeded at that head. Recorded in preview-pr.json.",
    "scripts/lib/target-worktrees.mjs targetRecordSources moves the decisions file and the six reports into the target's docs/dotln/ at target-records. publishTargetWorktree requires a committed passing final review and committed TargetRecordsCommitted, and reuses the recorded draft under a lease before marking it ready."
  ],
  "rejected": [
    {
      "option": "Settle the three publication rows before the publish",
      "reason": "FINAL-002 settled two rows on an anticipated publish and had to re-dispose them when the result transition refused. The outcome is observable within this dispatch, and the register stays in the launchpad."
    },
    {
      "option": "Make a review commit on top of the draft",
      "reason": "There is nothing to commit. A second commit with the same tree would only move the pull request's head and its CI."
    },
    {
      "option": "Open a new pull request for the final publish",
      "reason": "One pull request per order. The helper reuses the recorded draft #6, which the operator could read before this review."
    }
  ],
  "reopenWhen": "The final target publish or the records publish refuses, the pull request's head moves before the push, or a later order finds a defect in the sub-app menu or the arriving pages that this review's reading missed."
}
```
