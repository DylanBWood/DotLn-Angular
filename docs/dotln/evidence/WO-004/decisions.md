# WO-004 decisions

The operator dispatched `resume: next` on 2026-10-18. This executor owns the
paired launchpad and target worktrees. Decisions below record observed inputs,
the choice, alternatives and the condition for reopening it.

## WO-004-D001 Use the workspace CLI's accepted Vitest option

```json
{
  "id": "WO-004-D001",
  "date": "2026-10-18",
  "dispatch": "resume: next; WO-004 Design permits the nearest documented generator option when one is refused",
  "decision": "Pass unitTestRunner=vitest to create-nx-workspace@23.3.0, then inspect the generated Angular test target. Use noninteractive mode, skip Git initialization and GitHub push, and skip agent configuration in temporary storage before copying generated files into the existing target worktree.",
  "evidence": [
    "The initial create-nx-workspace invocation exited 1: unitTestRunner=vitest-angular is invalid; printed choices are jest, vitest, none.",
    "The same CLI help declares interactive, skipGit, skipGitHubPush and aiAgents=none.",
    "Context7 /websites/nx_dev, queried 2026-10-18, identifies angular-monorepo as the integrated Angular preset and Vitest as the application test runner. The installed generator's schema and resulting target remain the version-specific authority.",
    "docs/dev-reference/workspace/generator-log.md in the target records both invocations before the retry."
  ],
  "rejected": [
    "Repeat vitest-angular at the workspace CLI: it is rejected before any workspace is created.",
    "Hand-write an equivalent workspace: the order requires generator provenance.",
    "Initialize another Git repository or configure an agent: the target is an existing worktree and those effects are unnecessary."
  ],
  "reopenWhen": "The generated test target is not Angular's Vitest integration, or executable tests expose an incompatibility requiring the recorded Analog fallback."
}
```

## WO-004-D002 Preserve the verification boundary for the live pull request

The material trap is treating an eventual acceptance obligation as authority
to bypass its explicit ordering. The executor implements and tests the local
workspace. The draft pull request and live title workflow observation follow
independent verification, as the order states. NoOp would leave the repository
empty and discharge none of the implementation criteria.

```json
{
  "id": "WO-004-D002",
  "date": "2026-10-18",
  "dispatch": "resume: next; WO-004 Design interim review route and criterion 6",
  "decision": "Implement the local workspace and workflows now. Record criterion 6 as unmet at the executor handoff because its draft pull request is explicitly ordered after an independent verification pass. Leave commits to final review under the executor skill's no-branch-commits rule. Record the current checked worktree state by date rather than inventing a scaffold commit.",
  "evidence": [
    "Canonical resume status selects WO-004, phase active, repository dotln-angular, with legal actions next and implementation-ready.",
    "WO-004 Design requires verification-result pass before pushing wo-004 and opening the draft pull request; criterion 6 requires a live completed title workflow and review-thread capture before final review.",
    "dotln-executor/SKILL.md says no branch commits before final review and requires an honest met/unmet line for every declared criterion; unmet obligations are projected to the next dispatch."
  ],
  "rejected": [
    "Open the draft before independent verification: violates the order's explicit sequence.",
    "Mark the live workflow criterion met from local tests: local behavior cannot prove GitHub token permissions or an actual workflow run.",
    "Invent a GitHub settings blocker: no workflow has yet run."
  ],
  "reopenWhen": "Independent verification passes and authorizes the order's interim draft route, or the operator explicitly changes the sequence."
}
```

## WO-004-D003 Retain the actual Angular generator defaults

This corrects the initial D001 expectation on the same day: the workspace
CLI accepts `vitest`, but passing it through does not create an Angular test
target at Nx 23.3.0. The final invocation omits the option. All attempts and
their results remain in the target's append-only generator log.

```json
{
  "id": "WO-004-D003",
  "date": "2026-10-18",
  "dispatch": "resume: next; WO-004 generator provenance and documented-option fallback",
  "decision": "Use the explicit angular-monorepo preset with no-workspaces and useProjectJson, omit unitTestRunner so the Angular 21+ esbuild default selects vitest-angular, and remove CODEX_THREAD_ID only from the generator child environment to avoid the workspace CLI agent-template substitution.",
  "evidence": [
    "The accepted vitest invocation entered the workspace CLI agent path and generated the unrelated nrwl/angular-template (Nx 23.2.0, shop, API and libraries with ZoneJS); none of it was copied to the target.",
    "The explicit-preset invocation with vitest created dotln and dotln-e2e but no unit-test target. Installed generator source handles vitest-angular, vitest-analog, jest and none, and defaults to vitest-angular for Angular 21+ with esbuild.",
    "The final default-runner invocation created dotln and dotln-e2e in 18.719 seconds with @angular/build:unit-test, watch false and vitest/globals. The accepted-option arm took 56.764 seconds and lacked the required test target. This bounded comparison selects fidelity to the standard generator wiring, with elapsed time secondary.",
    "The installed application, library and Playwright generator help was read. The generated home component uses the installed @nx/angular:component generator and its invocation is recorded."
  ],
  "rejected": [
    "Hand-write a missing test target: the working standard generator default is available.",
    "Use the template workspace: it adds prohibited libraries, an API and a different app.",
    "Switch to Analog for the app: the standard Angular test route passes."
  ],
  "reopenWhen": "A later Nx version changes the workspace-to-Angular option translation or removes the agent-template substitution; use its documented defaults and rerun the recorded probes."
}
```

## WO-004-D004 Pin the compatible stack and exercise the house rules

```json
{
  "id": "WO-004-D004",
  "date": "2026-10-18",
  "dispatch": "resume: next; WO-004 installed versions and house configuration",
  "decision": "Keep all Nx packages at 23.3.0, Angular at 22.2.3, TypeScript ~6.0.3 and Vitest 4.1.12; retain the generated Angular unit-test integration and explicit zoneless providers. Keep Playwright on Chromium with a fresh local server and add the house lint, cache, documentation and title-workflow configuration.",
  "evidence": [
    "The npm package metadata, Nx peer ranges and installed generator help were inspected before updating the generated Angular 22.1 set.",
    "npx nx report observes Nx 23.3.0 and TypeScript 6.0.3; npm ls observes Angular 22.2.3 and Vitest 4.1.12 without peer errors. The target has no zone.js dependency.",
    "The root boundary configuration declares both scope rows and all eleven type rows. lint:fixtures uses an actual temporary Nx graph: models to util is refused specifically by @nx/enforce-module-boundaries and util to util is accepted.",
    "Public release refs for actions/checkout v7.0.1, actions/setup-node v7.1.0 and nrwl/nx-set-shas v5.0.1 were resolved to full commit pins on 2026-10-18. The title helper passes event text as literal gh arguments; its tests cover all types, idempotence, malformed titles and shell metacharacters."
  ],
  "rejected": [
    "Use npm latest TypeScript 7: outside Angular 22 compatibility.",
    "Reuse an existing Playwright server: it could prove a different worktree.",
    "Mock the Nx boundary report: a real graph and allowed control prove enforcement.",
    "Interpolate a PR title in a shell command: title text must stay data."
  ],
  "reopenWhen": "A coordinated Angular/Nx upgrade changes admitted versions, or a new project requires the documented tags, library aliases and generator defaults."
}
```

## WO-004-D005 Apply the operator-selected scoped security patch

```json
{
  "id": "WO-004-D005",
  "date": "2026-10-18",
  "dispatch": "resume: next; operator reply: Use the scoped patch override",
  "decision": "Override only Undici under nx@23.3.0 to 7.29.1, regenerate the npm lockfile and retain peer checks. The queued adjacent-0001 records the diagnosis, actual announcement, operator steering and required audit/target-gate checks.",
  "evidence": [
    "npm audit reported nine affected packages through Nx 23.3.0 pinning undici 7.29.0. The Node.js Undici v7.29.1 release and GHSA-w293-vg96-wgc3 advisory identify the patched version.",
    "Context7 /npm/cli documents the version-qualified parent override form on 2026-10-18.",
    "npm install changed one package and reported zero vulnerabilities; npm audit then exited 0 with found 0 vulnerabilities. npm ls shows nx@23.3.0 to undici@7.29.1 overridden, while jsdom keeps undici@8.12.2.",
    "The target conventions document the reason and removal condition; the full review gate is required before the queue item completes."
  ],
  "rejected": [
    "Leave the published security fix unapplied: a bounded patch is available and the operator selected it.",
    "Override all Undici versions: jsdom uses another supported major and does not need the Nx-specific change.",
    "Upgrade or misalign Nx packages to avoid one pin: larger compatibility scope than necessary."
  ],
  "reopenWhen": "Nx itself selects a fixed Undici version; remove the override after npm audit and the workspace checks pass."
}
```

## WO-004-D006 Preserve generated local harness bytes

```json
{
  "id": "WO-004-D006",
  "date": "2026-10-18",
  "dispatch": "resume: next; correction of this executor formatting side effect",
  "decision": "Exclude the launchpad-installed CLAUDE.local.md and .claude directory from target Prettier formatting, and restore only the six formatter-only changes to their original generated bytes.",
  "evidence": [
    "npm run format uses nx format:write --all, which included Git-ignored installed harness files and changed their formatting.",
    "The recovery regenerated the expected bundle in memory from the existing compiler and original launchpad, matched every original installed file hash, and required each changed file to equal the Prettier-formatted expected source before writing it. No other difference was replaced.",
    "checkTargetHarness then passed for all seven target surfaces. The target format:check passes with the explicit exclusions."
  ],
  "rejected": [
    "Leave generated-file drift: it breaks the installed bundle integrity check.",
    "Update hashes to bless modified output: that would replace the baseline instead of recovering the exact generated bytes.",
    "Reset the worktree: it would discard the scaffold and is unnecessary."
  ],
  "reopenWhen": "The launchpad changes its installed local paths or the formatter learns to honor the managed Git exclusions."
}
```

## WO-004-D007 Correct review findings before the formal gate

```json
{
  "id": "WO-004-D007",
  "date": "2026-10-18",
  "dispatch": "resume: next; required executor adversary and improver reviews",
  "decision": "Read the current PR title through gh pr view before validation and decoration, use event data only for identity, and preserve literal subprocess arguments. Correct the generated Playwright TypeScript configuration to NodeNext with explicit Node 26 types; add typecheck:e2e to the package scripts and CI. Clarify that the application Analog fallback and the deliberate non-buildable-library default are different routes.",
  "evidence": [
    "The independent improver identified one P2: rerunning an old opened event could overwrite a newer title because the original helper used the event snapshot. The adversary identified no implementation defect and correctly left formal gate and live-PR evidence pending.",
    "The updated title helper passes five tests: all type mappings and idempotence, malformed titles, a stale event with newer current shell-like text, an already-decorated current title on rerun, and invalid identity or failed lookup preventing an edit. No remote operation was executed by these tests.",
    "The executor checked the e2e TypeScript configuration separately: npx tsc --noEmit -p apps/dotln-e2e/tsconfig.json failed with TS1343 for import.meta under commonjs and TS2339 for ImportMeta.dirname. Playwright execution alone had passed because it transpiles without that type check.",
    "Context7 TypeScript documentation specifies nodenext for Node ECMAScript modules and matched moduleResolution. Adding @types/node 26.6.2 and explicit node types makes npm run typecheck:e2e exit 0. npm install still reports zero vulnerabilities.",
    "Context7 GitHub CLI documentation and installed gh pr view --help confirm the repository selector and JSON title output. All event and title fields remain data, never shell source."
  ],
  "rejected": [
    "Keep event title as the source on reruns: it is an obsolete snapshot.",
    "Disable the TypeScript diagnostics: the module configuration and missing Node types are the actual cause.",
    "Rely on a browser pass to prove type correctness: the separate compiler run demonstrated the gap."
  ],
  "reopenWhen": "A future generator or Playwright integration supplies equivalent type checking by default, or the GitHub title API changes its read/update semantics."
}
```

## WO-004-D008 Board the profile's upstream references that name no existing path

```json
{
  "id": "WO-004-D008",
  "date": "2026-10-18",
  "dispatch": "resume: verify (VER-001 implementation review)",
  "decision": "Record as a follow-up, not a blocking finding: two upstream references in docs/repositories/dotln-angular.md name a ref or path that does not exist upstream. No criterion covers the references, and the verifier does not edit the deliverable it judges.",
  "evidence": [
    "git ls-remote --tags https://github.com/nrwl/nx.git refs/tags/23.3.0: 2b305ee85b8db033e4ab998f31282cbff66ac2a8; gh api repos/nrwl/nx/contents/docs?ref=23.3.0: HTTP 404",
    "gh api repos/nrwl/nx/git/trees/23.3.0?recursive=1: the Angular pages are astro-docs/src/content/docs/technologies/angular/*.mdoc; astro-docs/package.json declares astro ^7.3.2 and @astrojs/starlight 0.42.0",
    "git ls-remote --tags https://github.com/angular/angular.git: refs/tags/v22.2.3 exists and refs/tags/22.2.3 does not; gh api repos/angular/angular/contents/adev/src/content/best-practices?ref=v22.2.3: 7 entries"
  ],
  "rejected": [
    "Fail the verification: the references are outside every acceptance criterion and break no behavior main had.",
    "Correct the profile from the verifier session: the verifier writes evidence and its report, never the implementation it judges."
  ],
  "reopenWhen": "The next repair or a later order edits docs/repositories/dotln-angular.md.",
  "followup": "In docs/repositories/dotln-angular.md § Upstream references, cite nrwl/nx@23.3.0 astro-docs/src/content/docs/technologies/angular/ and angular/angular@v22.2.3 adev/src/content/best-practices; each reference must name a tag that exists and a path present at that tag."
}
```

## WO-004-D009 Board the missing formatting exclusion for docs/dotln

```json
{
  "id": "WO-004-D009",
  "date": "2026-10-18",
  "dispatch": "resume: verify (planning receipt 2026-10-18-planning-afc1740dd0afc954-001, known issue criterion:5)",
  "decision": "Record the planning known issue's reopen condition as met by the subject, and route it as a follow-up. The target has no Prettier or CI exclusion for docs/dotln. Today's record sources are Prettier-clean under the target configuration, so no CI failure is expected yet.",
  "evidence": [
    "<worktree>/.prettierignore lists dist, coverage, .nx, package-lock.json, .angular, test-output, playwright-report, test-results, CLAUDE.local.md and .claude/; it has no docs/dotln entry, and ci.yml runs npx nx format:check unfiltered",
    "Scratch copy under the session scratch with the target .prettierrc, .editorconfig and .prettierignore: the target's prettier 3.9.10 output equals the input bytes for the WO-004 order, WO-004 decisions.md, and WO-003 VER-001, VER-002, FINAL-001, PR.md and RELEASE-NOTES.md as report-shaped proxies (7 of 7 same)",
    "package.json format runs nx format:write --all, which would rewrite any record under docs/dotln that Prettier formats differently; validateTargetRecordsCommit rechecks every recorded blob"
  ],
  "rejected": [
    "Fail the verification: CI runs format check as criterion 5 requires; the records commit follows the reviewed commit that criterion 7 gates.",
    "Rely on every future report staying Prettier-clean: launchpad reports are written to the launchpad's formatter, not the target's."
  ],
  "reopenWhen": "The CI format check on a DotLn-Angular pull request reports a file under docs/dotln/, or the next repair edits .prettierignore.",
  "followup": "Add docs/dotln/ to the target's .prettierignore so launchpad-owned, hash-bound records are neither checked nor rewritten by the target formatter; nx format:check and npm run format must then leave docs/dotln untouched."
}
```

## WO-004-D010 Board the title workflow's failure on pull requests from forks

```json
{
  "id": "WO-004-D010",
  "date": "2026-10-18",
  "dispatch": "resume: verify (VER-001 implementation review, authority lens)",
  "decision": "Record as a follow-up: pr-title.yml runs on pull_request, so a pull request from a fork gets a read-only GITHUB_TOKEN and gh pr edit cannot decorate its title. Same-repository pull requests, the operator's route and criterion 5, are unaffected.",
  "evidence": [
    "<worktree>/.github/workflows/pr-title.yml triggers on pull_request types opened and edited, checks out the pull request and runs node tools/pr-title.mjs with GH_TOKEN set to github.token",
    "GitHub Docs, Events that trigger workflows, read 2026-10-18: the GITHUB_TOKEN has read-only permissions in pull requests from forked repositories; pull_request_target runs in the context of the base repository's default branch and is unsafe if it builds or runs code from the pull request",
    "tools/pr-title.mjs reports a failed edit as: Title update failed. Check Actions workflow permissions for pull-requests: write. That message misdirects a fork contributor to a repository setting",
    "Not reproduced live: no fork pull request exists; the claim rests on the documented token behavior"
  ],
  "rejected": [
    "Fail the verification: criterion 5 is met for the operator's same-repository pull requests.",
    "Switch to pull_request_target while checking out the pull request: runs untrusted code with a write token."
  ],
  "reopenWhen": "A pull request from a fork is opened against DotLn-Angular, or the next repair edits the title workflow.",
  "followup": "Decorate fork pull-request titles without running pull-request code (pull_request_target with the default base checkout running the base's tools/pr-title.mjs), or state that fork titles are out of scope and fail with a message naming the read-only fork token; keep the existing same-repository tests."
}
```

## WO-004-D011 Name the actor and commit the interim draft route needs

The operator waived criterion 6 at verification (CriterionWaived ordinal 4;
capture SHA-256
`d062d38ec0cdf1aa4f44c47afdc707193a3c9b499037862a1f06c7484641f9c8`) after the
verifier reported that the draft pull request cannot exist before the pass.
The interim route itself still has a gap, recorded here.

```json
{
  "id": "WO-004-D011",
  "date": "2026-10-18",
  "dispatch": "resume: verify; operator selection to waive criterion 6 (capture sha256:d062d38ec0cdf1aa4f44c47afdc707193a3c9b499037862a1f06c7484641f9c8)",
  "decision": "Record as a planning follow-up: the order's interim draft route has no assigned actor and no commit to publish. Step 13 asks for commits on wo-004 before implementation-ready, but the executor skill forbids branch commits before final review, and the target source is untracked. Pushing wo-004 now would publish only the empty base commit.",
  "evidence": [
    "git -C <worktree> log --oneline: bc9133e Initial commit only; git status --porcelain lists 16 untracked entries and no tracked change",
    "dotln-executor/SKILL.md: No branch commits before final review; WO-004 step 13: Commit on wo-004 with conventional messages; npm run resume -- implementation-ready",
    "WO-004 Design § Interim review route names the effects (push, draft, Copilot request, evidence record) but no role; the verifier role is read-only and the reviewer publishes the reviewed branch only after a passing final review",
    "npm run resume -- waive 6: Recorded CriterionWaived for WO-004 criterion 6 at ordinal 4"
  ],
  "rejected": [
    "Commit and push from the verifier session: the verifier never edits or publishes the implementation, and pushing needs explicit operator authority.",
    "Treat the waiver as cancelling the route: the waiver releases the criterion, not the operator's wish to read the draft before final review."
  ],
  "reopenWhen": "The operator directs who commits and pushes wo-004 for the draft, or the kit lands the draft-at-verified route (planning document D8, C7(c)).",
  "followup": "Planning: assign the interim draft route to a named role with the authority to make one reviewable commit on wo-004 after the verification pass, push it and open the draft; until then the operator directs that step explicitly before final review."
}
```

## WO-004-D012 The interim draft is a work-in-progress commit, title and body

After VER-001 passed, the operator set a standing rule for the interim draft
(capture SHA-256
`34e742f6f806b03b0cc39376265521e6543d9e477255f5754131e0d5a8441408`): until
something official changes, the draft carries a work-in-progress commit, title
and body only so the operator can read the code, and final review undoes that
commit and finishes the publication. This answers the open question in
WO-004-D011.

```json
{
  "id": "WO-004-D012",
  "date": "2026-10-18",
  "dispatch": "resume: verify; operator direction after the pass on the interim draft (capture sha256:34e742f6f806b03b0cc39376265521e6543d9e477255f5754131e0d5a8441408)",
  "decision": "Commit the verified scaffold on wo-004 as one work-in-progress commit, push wo-004 and open a draft pull request with a work-in-progress title and body. Use the conventional-shaped title feat: WIP scaffold the Nx and Angular workspace so the title workflow validates it instead of failing on shape. Final review undoes the commit before it binds the reviewed commit and publishes.",
  "evidence": [
    "git -C <worktree> commit: 65ca027 feat: WIP scaffold the Nx and Angular workspace, 44 files, author Dylan Wood, no trailer; git diff --cached --check passed",
    "gateTreeHash of the target worktree after the commit: 028a72f4549768e4ed7b2a956556e21560209655, unchanged, so the passing review row still covers these bytes; HEAD moved from bc9133e to 65ca027",
    "Before publishing to the public repository, the 43 text files had no private absolute path (privatePathLines), no local-term match against the main checkout's list, and no private-key or token pattern",
    "git push -u origin wo-004 was refused by the host permission check (Out-of-Place Publication) on 2026-10-18; nothing was pushed and no pull request exists yet"
  ],
  "rejected": [
    "Wait for final review to make the first commit: the operator wants to read the code before final review.",
    "Title the draft WIP: scaffold ...: tools/pr-title.mjs refuses that shape, so the title workflow would fail on every draft."
  ],
  "reopenWhen": "The kit lands an official draft-at-verified route, or the operator changes this rule; docs/operator/README.md § Standing preferences does not yet carry it, so the next planning pass records it there.",
  "followup": "Planning: add the work-in-progress draft rule to docs/operator/README.md § Standing preferences and to target orders' interim route, naming final review as the step that undoes the commit."
}
```

## WO-004-D013 The interim draft needed a manual command from the operator

The operator asked for a note that this route made them run a manual command
(capture SHA-256 `6c996dda3af87b7e592697f744b604d3473f724513c86969d1a219fc8cb8ee4d`). The session could not push or fix its own
permissions, so it handed the operator a one-line command instead of
finishing the route itself.

```json
{
  "id": "WO-004-D013",
  "date": "2026-10-18",
  "dispatch": "resume: verify; operator direction to note the manual command (capture sha256:6c996dda3af87b7e592697f744b604d3473f724513c86969d1a219fc8cb8ee4d)",
  "decision": "Record that the interim draft route required the operator to run a manual command in the session: one line that adds DylanBWood/DotLn-Angular and the launchpad as trusted repos in the Claude Code auto-mode environment, pushes wo-004 and opens the draft pull request. Codex needs no change: its config already runs commands without approval or sandbox.",
  "evidence": [
    "Claude Code 2.1.302 auto mode refused git push -u origin wo-004 three times as Out-of-Place Publication, including after the host reported the permission granted",
    "Claude Code auto mode refused the update-config skill twice as Self-Modification, including after the host reported the permission granted, so the session could not add the rule itself",
    "~/.claude/settings.json autoMode.environment named only DylanBWood/DotLn at the DotLn-wo005 checkout as trusted; permissions.allow was empty in the user and launchpad settings",
    "The session first gave the operator raw settings text instead of a runnable command, and its draft wording also forbade the force push that final review needs on wo-NNN; both were corrected in the command",
    "At 2026-10-18T14:18Z the command had not yet run: no settings backup, no wo-004 on origin, no pull request",
    "~/.codex/config.toml: approval_policy never, sandbox_mode danger-full-access (Codex CLI 0.163.0)"
  ],
  "rejected": [
    "Route around the classifier with another tool: the refusals name the action's intent, not the tool.",
    "Edit the generated launchpad .claude/settings.json: it is a kit-hashed harness surface, and the trust gap is in the user settings."
  ],
  "reopenWhen": "Any order's publication step again needs the operator to run a command by hand in a Claude Code session.",
  "followup": "Launchpad setup: when a repository is registered, install or print a ready Claude Code auto-mode trusted-repo entry for it and its order worktrees, including wo-NNN pushes with lease and draft pull requests, so no order needs a manual command; record the rule in docs/operator/README.md at the next planning pass."
}
```

## WO-004-D014 Complete the integration record: main and wo-004 were the same commit

<!-- integration refs/dotln/checkpoint/WO-004/7 -->

```json
{
  "id": "WO-004-D014",
  "date": "2026-10-18",
  "dispatch": "resume: final review; worktree integrate WO-004",
  "decision": "Integration record completed by the reviewer: main and wo-004 were the same commit 09ca250c4011a36e0b6248e7d21b372350cddc34, so the merge changed nothing; the checkpoint, both bases and the named stash are retained and the nine working-tree entries were restored intact. Carried-forward claims judged against the integrated base: WO-004-D001 to D013 stand unchanged, because no byte of main moved under them. No component-version collision: release preparation reports that a target order records no release and changed no file. The three read-only affected checks passed after the integration; the review product gate runs at the handoff step and FINAL-001 cites its row. Changed evidence inputs are recorded in D015 and D016, never by editing verified records.",
  "evidence": [
    "refs/dotln/checkpoint/WO-004/7",
    "base 09ca250c4011a36e0b6248e7d21b372350cddc34",
    "upstream 09ca250c4011a36e0b6248e7d21b372350cddc34",
    "release preparation: WO-004: target order records no release; no files changed.",
    "npm run worktree -- integrate WO-004 --intake-backup <archive in the session scratch, 4 files>: Retained stash WO-004 integrate 2026-10-18 (73993d32b785cc04c3dbfcc53ed2f6c4b33ae9a9); Regenerated: runtime, harness bundle and manifest, current control projection, release preparation, integration decision stub, decisions index, follow-up register and meta, work-order index; Bases 09ca250c -> 09ca250c; Authored conflicts: none; git status --short listed the same nine entries before and after",
    "npm run publication:check: no editions declared; node scripts/harness.mjs check: 34 generated surfaces; local-terms list present after the ignored list was copied from the main checkout into this worktree, as WO-003-D003 did, and never printed; npm run release -- check-surfaces --local: every license surface PASS, docs/LEGAL.md pins unavailable because this instance declares no such file"
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance; return that finding through repair and fresh independent verification."
}
```

Integration date: 2026-10-18. Original base: `09ca250c4011a36e0b6248e7d21b372350cddc34`.
Fetched main: `09ca250c4011a36e0b6248e7d21b372350cddc34`. Checkpoint: `refs/dotln/checkpoint/WO-004/7`.
Named stash retained: `73993d32b785cc04c3dbfcc53ed2f6c4b33ae9a9` (WO-004 integrate 2026-10-18).
Resolved projections: none.
Release preparation: WO-004: target order records no release; no files changed.
Carried-forward claims: judged by the reviewer as the decision states; WO-004-D001 to D013 stand, and no acceptance judgment is recorded here (the final review records it).
Authored conflicts observed: none.
Affected checks: `npm run publication:check`, `node scripts/harness.mjs check` and `npm run release -- check-surfaces --local` passed after the integration; `npm test -- --review` runs at the review product-gate step and its row is cited in FINAL-001.

## WO-004-D015 Route the draft pull request's review threads and repair what they name inside the order's surfaces

The material trap is reading an automated reviewer's suggestion as an
instruction to widen the order (switching the workflow trigger) or as noise
to discard. Each item is routed by the rule: a repairable defect inside the
declared surfaces is repaired here; a defect whose fix is a design choice
outside this change stays boarded. The NoOp, publishing the helper the review
knows is wrong, was rejected.

```json
{
  "id": "WO-004-D015",
  "date": "2026-10-18",
  "dispatch": "resume: final review; route the draft pull request's review threads and repair the defects they name inside the order's surfaces",
  "decision": "Record the draft pull request's two automated review items in docs/evidence/WO-004/preview-pr.json and route them. The fork-token item is the follow-up VER-001 already boarded (D010), left for the next repair because the suggested pull_request_target trigger takes its workflow file from main, which holds no workflow until this change merges, so this order's own pull request would get no title run. The stale-gitmoji item is a repaired finding (FINAL-001 F1): tools/pr-title.mjs keeps a prefix only when it is the shortcode or emoji of the title's own type and replaces any other, with two regression tests. Also repair the two VER-001 follow-ups that fit the Adjacent Repair bound inside the declared surfaces: docs/dotln/ joins the target's .prettierignore (D009), and the profile's two upstream references name an existing tag and a path present at it (D008).",
  "evidence": [
    "gh pr view 1 --repo DylanBWood/DotLn-Angular: draft, head 65ca0271e4c87179b11c4e1ee001b9be89e1acc1, title :sparkles: feat: WIP scaffold the Nx and Angular workspace; one review by copilot-pull-request-reviewer (COMMENTED, 2026-10-18T14:22:57Z) with two review comments, 4307382142 on .github/workflows/pr-title.yml line 4 and 4307382175 on tools/pr-title.mjs line 18; no issue comment and no operator comment; captured in preview-pr.json at 2026-10-18T14:44:00.744Z",
    "gh run list --branch wo-004: Pull request title run 39135428377 (pull_request) completed with success; CI run 39135428411 (pull_request) completed with success; Copilot code review run 39135472686 completed with success",
    "Reproduced before the repair: decorateTitle(':sparkles: fix: correct the title') returned the title unchanged because any recognized prefix was accepted; after the repair it returns :bug: fix: correct the title, and updateTitle on a current title :sparkles: fix: newer title edits it to :bug: fix: newer title",
    "npm run test:tooling after the repair: tests 7, pass 7, fail 0; npx nx format:check and npx prettier --check . clean; npx nx run-many -t lint test --skip-nx-cache exit 0; npm run lint:fixtures PASS; npm run typecheck:e2e exit 0",
    "docs/dotln probe: with a badly formatted docs/dotln/probe.md present, npx prettier --check --ignore-path .gitignore exits 1, npx prettier --check with the target's .prettierignore exits 0 and npx nx format:check exits 0; the probe was removed before the commit",
    "gh api repos/nrwl/nx/contents/astro-docs/src/content/docs/technologies/angular?ref=23.3.0 lists the Angular pages; repos/nrwl/nx/contents/docs/shared/packages/angular?ref=23.3.0 is HTTP 404; repos/angular/angular/contents/adev/src/content/best-practices?ref=v22.2.3 lists seven entries"
  ],
  "rejected": [
    {
      "option": "Switch pr-title.yml to pull_request_target now, as the automated reviewer suggests",
      "reason": "That event takes its workflow file from main, which has no workflow until this change merges, so this order's own pull request would get no title run; the choice between D010's two routes belongs to the next repair."
    },
    {
      "option": "Leave the stale-gitmoji case as a follow-up",
      "reason": "It is a repairable defect inside the declared surfaces, four lines and two tests, and leaving it would publish a title helper the review knows is wrong."
    },
    {
      "option": "Resolve or reply to the draft's threads",
      "reason": "The order asks only that the threads be captured and routed; the operator closes the draft once the published pull request supersedes it."
    }
  ],
  "reopenWhen": "A pull request from a fork is opened against DotLn-Angular (D010), or the title workflow fails on a same-repository pull request after this change merges."
}
```

## WO-004-D016 Undo the work-in-progress commit, bind the reviewed series and dispose the rows whose conditions occurred

The trap is the skill's no-reset rule read as forbidding the step the
operator's standing rule in D012 assigns to final review. The rule guards
against losing work; a soft reset to the base moves only the branch pointer
and keeps every byte, and the work-in-progress commit stays reachable on the
remote and in the reflog. A second trap is disposing follow-up rows the
integration advisory merely matched by text; only rows whose condition
occurred are disposed.

```json
{
  "id": "WO-004-D016",
  "date": "2026-10-18",
  "dispatch": "resume: final review; undo the work-in-progress draft commit, bind the reviewed series and dispose the follow-up rows whose conditions occurred",
  "decision": "Undo the draft's work-in-progress commit 65ca027 with git reset --soft to the base, which moves only the branch pointer and keeps every byte in the index and working tree, as D012 directs final review to do; commit the reviewed change as two commits, be5ee66 feat: scaffold the Nx and Angular workspace (the 44 scaffold files with docs/dotln/ in .prettierignore) and 3e1c3d1 fix: replace a stale gitmoji when a pull-request title changes type (the title helper repair and its tests); and run the declared review gate at 3e1c3d18cf4caaebf9a768c8137be227201e0ba9. Dispose four follow-up rows whose conditions occurred: FUP-ba85f92992bfc303 (D008) and FUP-4dfdda576bca5d80 (D009) settled by the repairs in D015; FUP-0b20d1ab2ad5c7ad (D011) settled because the operator directed the interim route in D012, whose own row carries the planning duty; FUP-1eec5d4255b0162c (WO-003-D004) settled because the clone is recorded and WO-004 activated from it. The three other matched rows (D010, D012, D013) stay as filed. Draft pull request #1 stays open for the operator to close once the published pull request supersedes it; wo-004 on origin is not force-pushed.",
  "evidence": [
    "git log --format='%h %s' -3 in the target after the series: 3e1c3d1 fix: replace a stale gitmoji when a pull-request title changes type; be5ee66 feat: scaffold the Nx and Angular workspace; bc9133e Initial commit; git status --short empty; both commits authored by Dylan Wood with no trailer; git diff --cached --check clean before each commit",
    "node scripts/target-gate.mjs WO-004 --review: PASS install (5083 ms), lint (493 ms), test (440 ms), format (631 ms), build (448 ms), e2e (481 ms); PASS target dotln-angular review at 3e1c3d18cf4caaebf9a768c8137be227201e0ba9 (7576 ms); HEAD tree 9fa7123b5965942a45571cb09f056531f41ef9fb",
    "git worktree list in the target: the clone's main checkout at bc9133e and the wo-004 worktree; docs/control/orders/WO-004.jsonl WorkOrderActivated with repositoryId dotln-angular at 2026-10-18T12:29:21.668Z, the step WO-003-D004's row waited for",
    "npm run plan -- followups --touching: 7 matched rows (D008, D009, D010, D011, D012, D013 and WO-003-D004)",
    "The working tree's gate tree hash 028a72f4549768e4ed7b2a956556e21560209655 was unchanged by the soft reset; the work-in-progress commit remains at origin/wo-004 and in the reflog"
  ],
  "rejected": [
    {
      "option": "Keep 65ca027 as the reviewed commit and add the repair on top",
      "reason": "D012 names final review as the step that undoes the work-in-progress commit, and its subject would carry WIP into the merged history."
    },
    {
      "option": "One commit for the scaffold and the repair together",
      "reason": "The publication contract separates an independent correction that can be reviewed on its own; the title-helper fix is one."
    },
    {
      "option": "Force-push wo-004 to update the draft",
      "reason": "The published pull request on feat/scaffold-workspace supersedes the draft and the operator closes it; nothing needs the draft's branch moved."
    }
  ],
  "reopenWhen": "The kit lands the draft-at-verified route (D012), which changes who undoes the interim commit, or a kit update reverts the clone record or the repairs, which reopens the settled rows."
}
```
