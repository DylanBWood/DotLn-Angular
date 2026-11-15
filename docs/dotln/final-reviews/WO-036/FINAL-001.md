# FINAL-001 — WO-036 walls and ways

**Verdict:** pass.

2026-11-15. All ten criteria of the original [order](../../work-orders/WO-036-scene-walls-and-ways.md) are met, none waived and none recorded defective. The final review read the whole target change and the three verifications, reproduced every blocking claim of the sequence, performed the Objective's session in the served production build, made no source change, committed the verified tree as four commits and lists four findings, all follow-ups.

Subject: DotLn-Angular `wo-036` at the reviewed commit `a96a60cc3f2c54e5da5c9b615e9cf00a49916a0a`, tree `78254cc323844f197c04f8d1af6ae2020e655150`, four commits on the integrated base `eb9d227483e30164105da077f50673789d1e5c9f`, which is the activation pin and the target's `origin/main`: the engine (`bf9b4e8`), the catalog rows (`d0add77`), the older-trial reader (`f697147`) and the page with its tests, baselines and documents (`a96a60c`). The tree is the one [VER-002](../../verifications/WO-036/VER-002.md) and [VER-003](../../verifications/WO-036/VER-003.md) judged. The launchpad's `main` is `562fb91`; integration took in nothing on either side.

Reviewer: Claude Code 2.1.325, `claude-fable-5-2`, effort xhigh as `CLAUDE_EFFORT` reports the selected effort, which is not a reading of effective effort. No worker was launched or re-tasked.

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.325","model":"claude-fable-5-2","effort":"xhigh","source":"claude-session-readback"}

**Process cost:** entry 105319 tokens; handoff 54439592 tokens; source claude-transcript-message-usage

Scope is the dispatch; the entry read is of 21:44:13Z and the handoff read of 22:16:16Z, taken before this report's last edit and the document gate, so later counters are in the response and the ignored receipt. The handoff total is almost all cached input (53,683,851), with 150,348 output tokens; reasoning tokens and cost are unavailable. The dispatch then stood at 0 h 32 min of 8 h 0 min worked, 0 complete launchpad runs of 3 and 0 worker uses of 40. The order as a whole stands at 656,542,621 tokens by the process-health line of `npm run meta`. Running the target's review gate once at the reviewed commit, rather than consuming the repair's row for the same tree, cost 0 h 2 min and gave the commits their own row; the probes against an export of the base cost seconds and replaced reading the arms' records on trust.

## Findings

<!-- dotln-findings:start -->
[
  {
    "id": "F1",
    "route": "follow-up",
    "class": "escape",
    "summary": "With Arrive retuned to a slow radius of 3 or less, a settled crowd under priority steering reaches a near objective one to five frames after the same units under Arrive alone; outside criterion 3 as written and no behaviour main had."
  },
  {
    "id": "F2",
    "route": "follow-up",
    "class": "new-scope",
    "summary": "A two-level formation's anchor takes no route, so a formation sent beyond a wall walks at it and stalls there."
  },
  {
    "id": "F3",
    "route": "follow-up",
    "class": "escape",
    "summary": "After Restart the inspector reads a path tool's routes as a preview, and while that run plays its route section is empty and Show search shades nothing."
  },
  {
    "id": "F4",
    "route": "follow-up",
    "class": "new-scope",
    "summary": "A crowd under priority steering is first credited with arriving 2 to 31 percent later than at the base, the cost of the repair that brings it to rest."
  }
]
<!-- dotln-findings:end -->

No finding blocks: none leaves a criterion unmet and none breaks a behaviour `main` had.

**F1** is the finding VER-002 routed as blocking and VER-003 re-routed. The reviewer reproduced it and no more than it: at a slow radius of 3 the spec's crowd is 1 to 3 frames late at 2, 5, 8 and 12 units, and at a slow radius of 1 up to 5 frames late from 1.5 units on, every crowd at rest. It is an escape, present in the verified subject and inside verification's scope, and a follow-up because it is outside criterion 3 as the judgment below reads it and because the base is not better there but far worse: the same crowds at the base never rest and, sent 2 units or more, never arrive in 80 and 71 of 80 cases. It stays boarded in `steering.spec.ts` and carried by `FUP-74e51991919f0a80` and `FUP-daf1ce232223262a` ([D020](../../evidence/WO-036/decisions.md#wo-036-d020), [D026](../../evidence/WO-036/decisions.md#wo-036-d026), [D029](../../evidence/WO-036/decisions.md#wo-036-d029)).

**F2** is the repair's own recorded limit, boarded in `path-following.spec.ts` and carried by `FUP-bdcc89104aa99bb0` ([D022](../../evidence/WO-036/decisions.md#wo-036-d022)). It is new scope: routing a formation is a feature the order does not ask for, and `main` had no wall for a formation to meet.

**F3** the reviewer met in its own session: Restart puts the applied tool down, as it does for every tool at the base, so the replayed squad follows its routes while the inspector reads a preview and, the run playing, nothing. With the tool live, which is the Objective's order of steps, the section reads the squad's own routes and the search stays shaded through a replan. An escape in the verified subject that breaks no criterion; boarded by [D030](../../evidence/WO-036/decisions.md#wo-036-d030) as `FUP-30951011cc6745a0`.

**F4** is a cost, not a defect of the criteria: across five crowds the stopwatch's first credit comes at frames 354, 342, 395, 384 and 418 where the base credits 270, 309, 344, 315 and 411, and the base earns its credit from a crowd that never stops moving. The order directs the repair and no criterion fixes the first credit, so it is new scope, recorded for the operator's play by [D031](../../evidence/WO-036/decisions.md#wo-036-d031) as `FUP-91fba006916ff8c6`.

The executor's recorded and unfixed items, D013 to D016 and the two handoffs, were read; none is a criterion failure, and the one the reviewer watched on the page, a squad given a path tool alone piling onto the objective with every pair counted as a collision, is the scene's rule for plain Arrive at the base and stays D013's record.

## Criterion judgments

**Criterion 1:** met. VER-002's and VER-003's walkthrough performed every step of the Objective's session in the served production build with captures at the five sizes and the statement the criterion asks for, and the blocked-Wander failure that made VER-001 judge it unmet is repaired: the reviewer's probe finds a unit sealed off on the move at rest under eight compositions, Wander among them. The reviewer performed the session again, below, with every step completing. The scene is not sloppy and is, in rule 28's sense, cool: a second wall dragged across a moving squad's way bends eleven routes at once with the search re-shaded under them. No UI issue was found at 2080 by 1460 or 3840 by 1620.

**Criterion 2:** met. The target's review gate passed its test row at the reviewed commit, and the engine's suite run by itself there passes 217 with the 2 boarded cases skipped: the known-outcome spec holds branch A's squad arrived with no frame inside a shape, the `pathLength` and `replans` series and the hashes across two runs, and branch B's twelve blocked and counted; `pathfinding.spec.ts` cuts the edge across a thin wall, refuses the diagonal past a blocked corner and pins 80 and 180 expansions; `path-following.spec.ts` has a stopped unit plan again within 60 frames. Independently, `trial-known-outcome.json`'s `hashes`, its other fields and its eight carried series equal the file at `eb9d227`, the three added series being nulls and zeros, and `avoid` is unchanged.

**Criterion 3:** met. `steering.spec.ts` covers the exact head-on pair, the pair on one spot, the ordinary offset crossing and a replay of each, asserting that separation across the policy's normal grows from the first frame after it fires, that no frame overlaps once the pair is apart and that a second run is equal; the reviewer's probe on two of the scene's own units agrees. The engine's specs assert that twelve units under priority steering with Arrive come to rest and that a settled crowd sent somewhere near reaches it no later than plain Arrive from the same places, now from 1.05 to 14 units away; both arms' exit codes are in the [evidence README](../../evidence/WO-036/README.md#the-arms), 1 at the base and 0 at the candidate. The reviewer ran its own probe on both engines: at the base none of four crowds rests and a settled crowd sent 2 units or more never arrives in 70 to 80 of 80 cases; at the reviewed commit all four rest and none of 112 near objectives a crowd is reached later, on the spec's units and on two twelves of the scene's own twenty. The executor and VER-002 judged this criterion unmet on the reading that the comparison binds every tuning of Arrive the catalog admits. The reviewer does not take that reading: the criterion names two cases for the engine's specs to assert, the crowd of twelve and the two tools, and sets no tuning, so the tools at the catalog's defaults are the case it names; VER-001's finding varied the criterion's own word, nearby, and was repaired, while VER-002's varied a parameter the criterion does not mention (F1). The repair changes priority steering's separation group alone, the known outcomes keep their hashes, the target gate's test row covers the tools project and `git diff --quiet eb9d227 -- libs/features/tools/src/lib/studies` exits 0.

**Criterion 4:** met. `scene-store.spec.ts`, run without the cache at the reviewed commit (34 passed), restores and imports a trial carrying only the eight first series with the later three as nulls and the restore complete, refuses a series of words, and exports and imports field steps as written; `check:fixtures` validates `walls-known-outcome.json` in the gate's lint row. In the reviewer's session a saved composition, reloaded and opened, held the wall and both obstacles at frame 1 and replayed the later steps at their frames.

**Criterion 5:** met. The scene feature's suite (191 passed, uncached) compares the offered ids with `sceneTools('aifg')` filtered by `isRunnable`, 28 tools, places the path kinds in Ways and both avoidance rows in Avoid, runs every tool at its defaults with every parameter read and holds `interpretedKinds` equal to `sceneTransformKinds`. `pathfinding.spec.ts` shows a travel weight above one raising the expansions with the route's cells unchanged and the two uniform-layer rows changing nothing, and the inspector says which in words: the mappers' spec holds the wording of a travel weight and of uniform layers alone, and the three messages say what the Design asks. The reviewer read that row in the template and the catalog, not on the page. `catalog:check` passes in the gate's lint row and `nx test catalog` in its test row; `aifg-a:247` reads `status: background` with no `faces`.

**Criterion 6:** met. The gate's e2e and visual rows passed at the reviewed commit; the repair's Preflight ran them fresh on the same code, 181 browser cases with the step 15 cases, axe at the board spec's threshold and the overflow check at the five sizes, and 50 visual cases. The evidence README lists the six regenerated baselines with what changed in each, every one a `scene-*.png`. The reviewer's own session found no horizontal overflow at any of the five sizes.

**Criterion 7:** met. `i18n:check` and `test:tooling`, which runs `tools/i18n-copies.test.mjs` with the other tooling tests, are steps of the workspace checks the gate's lint row ran at the reviewed commit, and the repair's Preflight ran the copies test by itself, 3 of 3. The notice, the route readings, the field tools, the coach lines and the instruments the reviewer read on the page are keys under `scene.` in the app's catalog, and the diff adds no literal to a template.

**Criterion 8:** met. [comparisons.md](../../evidence/WO-036/design/comparisons.md) records the first pair, A the transport and B a Field tab, the operator's pick of A and the end of the rounds, and the capture of that answer (SHA-256 `e6413fd7cfe87de62b3754c9da7966a92df9e9e92021470011119705097471c9`) reads as [D009](../../evidence/WO-036/decisions.md#wo-036-d009) says. B had no file of its own, so the decisions name the four files it lived in and the counts that show it gone, and there is no removed file for `ls` to print.

**Criterion 9:** met. The gate's build row passed at the reviewed commit and `npm run check:bundle` exits 0 there with 406,919 initial bytes and no lazy code in the initial files, inside the declared budgets; `package.json` and `package-lock.json` have no diff against `eb9d227`.

**Criterion 10:** met. `node scripts/target-gate.mjs WO-036 --review` recorded a passing row for every declared command at `a96a60cc3f2c54e5da5c9b615e9cf00a49916a0a`: install, lint, typecheck, test, format, build, e2e and visual, with the target's tree and `HEAD` the same before and after each. `npm run test:docs` stands on the document gate's passing row for the tree that holds this report, run after its last edit and consumed by the result transition. The Preflight line ran before the first full gate in the execution and again before the repair's.

## Walkthrough

2026-11-15, by the reviewer, in a Chromium launched from the target's Playwright installation against `npx nx build dotln --configuration=production` served on the loopback, at 2080 by 1460 unless a step names another size. The session had no Playwright MCP, so a [script](../../evidence/WO-036/final-001-walkthrough.mjs) performed the steps and read the page's text into two logs, and the reviewer read each linked capture as an image.

1. Drew a wall from the top edge at x = 70 down to y = 64, placed one obstacle by a click and one by a drag, selected the eleven units west of the wall with a marquee, chose A* from the rail's Ways group, set the objective at (100, 40) and pressed Apply. The inspector read eleven routes, 90.0 long on average, and a search for unit-01 of 531 cells. Play: the squad went round the wall's foot, its routes drawn faintly ahead, the path length falling ([on the way](../../evidence/WO-036/walkthrough/final-001-03-route-2080.png)), and arrived at 9.5 s with eleven rows reading arrived ([arrived](../../evidence/WO-036/walkthrough/final-001-04-arrived-2080.png)).
2. Pressed Restart, stepped six frames and turned on Show search: the cells the search closed and the frontier it left shaded over the field ([search](../../evidence/WO-036/walkthrough/final-001-05-show-search-2080.png)). Played, dragged a second wall across the way at about frame 93, and Replans read 11 with eleven rows replanning; after the restart the inspector read the routes as a preview and, the run playing, nothing (F3).
3. Paused, pressed Fork at frame 157 and sealed the gap. The notice named the eight units still west of the wall and said each stops where it stands; ninety Step presses on, all eight rows read still, blocked and no route, Blocked units read 8 and the three already through kept their routes ([sealed](../../evidence/WO-036/walkthrough/final-001-07-no-route-2080.png)). Read that state at 360 by 800 ([field](../../evidence/WO-036/walkthrough/final-001-08-blocked-360.png), [notice](../../evidence/WO-036/walkthrough/final-001-08-notice-360.png)), 768 by 900 ([768](../../evidence/WO-036/walkthrough/final-001-08-blocked-768.png)), 1440 by 900 ([1440](../../evidence/WO-036/walkthrough/final-001-08-blocked-1440.png)) and 3840 by 1620 ([3840](../../evidence/WO-036/walkthrough/final-001-08-blocked-3840.png)), each with no horizontal overflow.
4. Pressed Compare: the branches first differ at frame 158, blocked units 0 against 8 ([trial](../../evidence/WO-036/walkthrough/final-001-09-trial-2080.png)). Kept the trial, cleared the walls, and the squad moved again and arrived.
5. On a fresh page did steps 1 and 2 in the Objective's own order, without a restart, so the tool stayed live: with the search shown, a second wall dragged across the moving squad's way made Replans read 11, the routes bent round it and the inspector read the squad's own routes at 67.1 long, the search still shaded ([replan](../../evidence/WO-036/walkthrough/final-001-06b-replan-live-2080.png)). Sealing the gap with the run still playing named nine units in the notice, and two and a half seconds later all nine rows read still, blocked and no route.
6. Saved, reloaded and opened the composition: the wall and both obstacles were on the field at frame 1 with their numbers in the list, and the later steps replayed at their frames ([reopened](../../evidence/WO-036/walkthrough/final-001-11-reopened-2080.png)).
7. On a fresh page gave five units Obstacle and wall avoidance and sent them at a wall: rays and whiskers with a mark at each hit, the units turning along the wall's face toward its ends, and no route in the inspector ([whiskers](../../evidence/WO-036/walkthrough/final-001-13-whiskers-2080.png), [later](../../evidence/WO-036/walkthrough/final-001-14-whiskers-later-2080.png)).
8. On a fresh page sent unit-02 and unit-04 at the point between them with Collision avoidance: they parted, one above the other, with no collision and 2.5 s to the objective, and the same on a restart ([parted](../../evidence/WO-036/walkthrough/final-001-16-head-on-parted-2080.png)).

Read from the page alone: the squad finds its way by a search over the field's cells, which the shading shows spreading from the unit until it rounds the wall, and follows the line that search returns; when the field changes under it every unit plans again and the line moves; when there is no way the search fills everything it can reach and the units stop where they stand and say so, in the notice and in their rows. Avoidance adds a reaction and not a plan: the units feel the wall and slide along it, with nothing drawn ahead of them. The console and the network reported nothing in any phase.

## Review

Read: the order; the operator record; WS-001's rules; the profile's gate, scene map and publish route; decisions D001 to D028 whole; the evidence README, both handoffs, the host record, the design comparison and the operator's two captures it rests on; VER-001, VER-002 and VER-003 with both reproduction records; and in the target the change against `eb9d227`: the engine's six changed and four new modules line by line; its steering, search and known-outcome specs whole and the other specs by their cases; the stored-scene reader, the facade, the mappers, the two new composites, the canvas and its painter, the inspector, the catalog rows, schema and kind lists, the tooling, the messages, the browser spec's new cases and the two scene documents. The feature's specs were read by their case names and the styles not at all.

Reproduced, as step 3 of final review asks of each blocking claim in the sequence: VER-001 F1 does not reproduce at the reviewed commit, at its own three offsets or at any of the 112 a crowd in the reviewer's probe; VER-001 F2 does not reproduce under Wander or seven other compositions; VER-001 F3 closed on the document gate's own rows; VER-002 F1 reproduces as measured and is F1 above. The probe, its two engine roots and its raw results are in the [evidence README](../../evidence/WO-036/README.md#the-final-review).

Beyond the criteria the reviewer looked for a behaviour of `main`'s the change breaks and found none: a run with no field step and no path tool keeps every hash; `separate` gives what it gave through the helper it now shares; the avoidance term's new policy acts only where `avoid` was silent; and the diff leaves the facade's Restart, slot table and live tuning as they were. The one change to a behaviour of the base a saved composition can show, the crowd under priority steering, is the repair the order directs (F4).

No source change was made, so no lint or type suppression was added and nothing was reformatted; the boarded cases are the two the repair filed, each a skipped failing test under a `BOARDED:` comment as rule 21 asks.

The 149 lines changed after the repair's one review, which the handoff counts as unreviewed, were read here: the carried-speed rule in `simulation.ts`, its spec cases and the two documents' passages.

## Standing documents and records

The target's `scene.md` and `scene-rules.md` and both READMEs change by replacement: each passage states what holds, the limits included, and none appends a dated account. The launchpad's profile gains the scene map's rows and the rail's count, replaced in place. The workstream's two rows for this order read final-reviewed, written by this review in place of the repair's state. The register settles the carried settling defect (`FUP-e9b95694a5de071e`) and the two repair rows VER-001 raised, and folds VER-002's repair row into `FUP-74e51991919f0a80`. `FOR-CORE.md` gains five entries.

## Integration, commits and release surfaces

Neither `main` had moved, so the reviewed base is the activation pin. The verified tree is committed as four commits whose subjects name their change; the first three do not build alone, because the layers after them read the engine's new metrics and kinds, and only the last commit's tree was gated, which the target body says. The target release classification is minor with reviewed notes; this target order records no launchpad release, and release preparation changes no file. [TARGET-PR.md](TARGET-PR.md) is the DotLn-Angular body, [PR.md](PR.md) the launchpad records body and [RELEASE-NOTES.md](RELEASE-NOTES.md) the five-section notes.

No draft pull request preceded this review. The order makes the draft's workflow runs and threads a final-review duty read from `preview-pr.json`; the session that recorded the passing verification published nothing, the target's remote held only `main`, and the kit refused the draft form at this phase with the message [D029](../../evidence/WO-036/decisions.md#wo-036-d029) records. There was therefore nothing to read and no thread to route. The pull request is opened ready after this pass, its workflows run there, and the operator reads the code on it before merging; a failing run or a thread naming a defect returns the order through `resume: fix`.

## Limits

The reviewer's probe samples twelve units, four crowds at the defaults, seven distances and sixteen directions; it is not a proof over every crowd, place or tuning, and the repair's wider scans are the executor's. The session on the page ran in Chromium only and was driven by a script, whose three racing counts the evidence README names. The gate's test, build and e2e rows at the reviewed commit replayed runs of the same bytes from Nx's cache; the engine's, the scene's and the scene store's suites and the bundle check were run fresh there, the browser suite was not. The first three commits were not built or tested on their own. The raw review reports under the private control directory were not read; their dispositions in D013 to D016 and D025 were.

`node scripts/terms.mjs branch` listed no line in either mode over the branch's changed files, so the reviewer read 0 lines beside the private list; it screens the launchpad, not the target.

The outcome matches the dispatch: a judged, accepted order on a committed, gated tree, with what was met and not fixed boarded. The traps named before the material choice, the reading of criterion 3: taking the operator's words as a waiver, which they are not; passing on VER-003's say-so, which the base and candidate probes replaced with the reviewer's own evidence; and widening the criterion to fail it, which D029 answers from its text.


Filed from the launchpad Launchpad at commit 74aaf3eccf4736f9dcb3c4b81d315a685594b058, where this record's path was docs/final-reviews/WO-036/FINAL-001.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
