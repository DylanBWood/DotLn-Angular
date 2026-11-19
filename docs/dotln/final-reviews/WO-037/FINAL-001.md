# FINAL-001 — WO-037 final review

**Verdict:** pass.

2026-11-19. This review judges DotLn-Angular target tree
`27e2390c6eb19f8e988e54d6545a4a0bb563ce9e` over base
`6eef542987ab2183817baba329a64373cb61b157`, the tree
[VER-001](../../verifications/WO-037/VER-001.md) judged. The review leaves
that tree unchanged. Integration took in nothing: the target's `main` and
fetched `origin/main` both stood at the base, and the launchpad's `main` and
`origin/main` at `85eec11`, the commit the order branch stands on. All ten
criteria are met, none waived and none recorded defective. The three
follow-ups VER-001 boarded, all in the knockout step, were reproduced in the
reviewer's own session and stay boarded.

The order's aim changed during execution, and the review checked that change
before judging anything by it. The ignored capture
`d8ffd8a3348e1c616bc546b2a9480df6176583e8857b051792828cb2e90dac9e` hashes as
cited. It records the executor's question, whether to build the two aims as
arcade mechanics over the scene's recorded animation instead of a reusable
moving-target solver, and the operator's selection of animation-driven aim.
[D002](../../evidence/WO-037/decisions.md#wo-037-d002) records it, and
`docs/control/plan-refutations.jsonl` binds the amended order to D002. The
criteria are judged as amended.

Reviewer: Claude Code 2.1.328, model `claude-opus-5-5`, effort max read from
`CLAUDE_EFFORT`, which is the selected effort and not the effective one. The
order recommends xhigh for the reviewer. No worker was launched, 0 of 40.

**Actor attestation:** {"harness":"claude-code","harnessVersion":"2.1.328","model":"claude-opus-5-5","effort":"max","source":"claude-session-readback"}

**Process cost:** entry 165712 tokens; handoff 48753345 tokens; source claude-transcript-message-usage

Both figures are `node scripts/harness.mjs usage` totals for this dispatch, at
cutoffs 2026-11-19T06:35:03Z and 2026-11-19T06:59:26Z. The handoff total is
almost all cached input, 48,146,409 tokens, with 146,234 output tokens. Money
is unknown because the counter reports none. At the handoff reading the
dispatch stood at 0 h 25 min of its 8 h 0 min bound, with no complete
launchpad run. The review reused the target's passing review row at the
unchanged tree rather than running the target gate again, which took 0 h 6 min
on the executor's run of the same tree. The cost went into reading the whole
subject, the session in the production build and the withdrawn repair
described under Review.

## Findings

<!-- dotln-findings:start -->
[
  {
    "id": "F1",
    "route": "follow-up",
    "class": "escape",
    "summary": "The Down units instrument reads zero while the shooters are selected, although their target and other pieces show down on the field and in the text layer.",
    "reproduction": "docs/evidence/WO-037/ver-001-reproductions.md"
  },
  {
    "id": "F2",
    "route": "follow-up",
    "class": "escape",
    "summary": "Hits to knock out counts every hit a piece has taken since the run began, so set late in a session it retires the target and bystanders on the next shot to reach each.",
    "reproduction": "docs/evidence/WO-037/ver-001-reproductions.md"
  },
  {
    "id": "F3",
    "route": "follow-up",
    "class": "escape",
    "summary": "Aiming and shooting opens on its defaults after another tool was applied to the same pieces, and Apply then records a fire step without their target, which stops the volley.",
    "reproduction": "docs/evidence/WO-037/ver-001-reproductions.md"
  }
]
<!-- dotln-findings:end -->

The three are VER-001's findings, listed once with their original class and
route. The review found nothing new. Each is a defect in a declared surface
that breaks no criterion as written, and each keeps its rule and follow-up:
[D011](../../evidence/WO-037/decisions.md#wo-037-d011) for F1,
[D012](../../evidence/WO-037/decisions.md#wo-037-d012) for F2 and
[D013](../../evidence/WO-037/decisions.md#wo-037-d013) for F3.
[D014](../../evidence/WO-037/decisions.md#wo-037-d014) records this review's
acceptance and reopens D013 with what the review learned about its repair.

## Criterion judgments

**Criterion 1:** met. VER-001's `## Walkthrough` performs every step of the
Objective's session in the served production build, dated, with captures at
360, 768, 1440, 2080 by 1460 and 3840 by 1620 under
`docs/evidence/WO-037/walkthrough/`. It closes with the statement the criterion
asks for, in the verifier's words. Under WS-001 rule 24 the reviewer performed
the session again, below, and every step completed. Rule 28: the shooting,
the two aims, the wall and the trial read clearly and are worth watching. The
streaks visibly trail a runner, meet it on the next tool and fall late again
under drag, and the inspector's pose frame and clip length explain each
outcome. The knockout step is the rough part, for F1 to F3, and it completes
through routes the page offers and explains. Rule 29: the reviewer read the
page at 2080 by 1460 at four moments and at 3840 by 1620 at three, and found
no issue. No size overflowed, and the console and network stayed clean.

**Criterion 2:** met. The engine's known-outcome spec asserts on
`range-known-outcome.json` that branch A's target has hits before the last
frame and every shooter has scored. It asserts that branch B leaves only
geometry marks, one per shot, no bullet in flight at the end and no hit on the
target. It computes the outcome twice against the fixture, bullets included in
the hashes. The simulation spec reads 0, 1, 0 and 1 hits for plain, single cue
at drag 0, single cue at drag 0.3 and later cues at drag 0.3. `aiming.spec.ts`
asserts that the single cue's pose frame equals its clip end at drag 0, falls
short of it at drag 0.3, and that the later cue's pose frame meets the
stretched end. The reviewer compared both older fixtures with the base's
bytes. The `hashes` of `trial-known-outcome.json` and
`walls-known-outcome.json` equal the base's arrays, and the four new metric
series are the only difference in each. The target's review row passed the
unit tests at this tree.

**Criterion 3:** met. `projectiles.spec.ts` asserts that the mark stands with
two hits on the frame before it goes down. From its third hit it reads `down`
with zero velocity on every later frame. A second run goes down on the same
frame, and with knockout at 0 no unit goes down. `formation.spec.ts` holds
three knockout cases. A two-level squad keeps `patternSlots` for the members
left at its spacing, assigned as `assignSlots` assigns them under its costs,
with slot error below 1 within the spec's ticks. A fixed squad's leader is
succeeded by the next slot, with the anchor at that member's position. A
detached leader anchors only while followers remain. The existing case for a
member given another tool still holds every slot where it stood. In the
reviewer's page session the target stood with two hits at frame 563, went
down with three at frame 564, and its four squad-mates stood in formation
again by frame 964 with slot error 0.0.

**Criterion 4:** met. The facade spec compares the offered ids with
`sceneTools('aifg')` filtered by `isRunnable`. It finds exactly the five rows
in `fight`, runs every offered tool at its defaults with every parameter read,
and asserts `interpretedKinds` equal to `sceneTransformKinds`. The five rows
are typed in `tools-aifg-a.json`, the schema enum and `TransformKind` grow by
the three kinds, and `check-catalog.mjs` lists them. The summary's counts read
141 typed and AI for Games' scene tools gain the five ids at the unchanged
date. The catalog check runs in the review row's lint and the catalog tests in
its test row. The reviewer ran the criterion's `grep -cE` over `aiming.ts` and
it printed 0. `npx nx lint scene-engine` is inside the passing lint row, and
`aiming.spec.ts` asserts the pose each aim reads on a crossing piece.

**Criterion 5:** met. The store spec exports a composition with a fire step,
imports it and replays it at its tick. A stored value and an export whose kept
trial predates the four metrics restore and import with null series.
`check-scene-fixtures.mjs` lists `range-known-outcome.json`, and
`check:fixtures` runs in the review row's lint. The facade case for
WO-036-D030 restarts a composition with a recorded A* step and a selected
unit. Paused before the step, it previews a search. Playing, the inspector and
Show search both read the recorded route. Paused where the Apply preview
differs, both keep the recorded route. After a heuristic edit both show the
unapplied preview, while the unit's frame still carries the recorded search
and the commit on the unarmed tool leaves the steps unchanged. The planning
receipt's known issue for this criterion, a target saved by roster position,
is not reopened: the scene has no roster edit, and a downed unit keeps its
place.

**Criterion 6:** met. The review row at this tree carries `e2e` and `visual`,
and VER-001 ran both uncached: 186 and 53 passed. On the draft pull request,
CI's `checks` and `visual` jobs passed at the same tree. `scene.spec.ts` holds
the step 14 cases. They fire at a clicked glyph and replay it after save and
reload, run the four crossing outcomes and a kept trial of the two aims, catch
the volley on a wall, retire a piece on three hits across two restarts, and
run axe over the shooting inspector at the board's threshold. Its overflow
loop runs at 360, 768, 1440, 2080 by 1460 and 3840 by 1620. The evidence
README lists the six regenerated and three new baselines with what changed in
each. They are the nine `scene-*.png` files the target's status shows.

**Criterion 7:** met. `npm run i18n:check` runs in the review row's lint, and
the reviewer ran `node --test tools/i18n-copies.test.mjs`: 3 passed. Every
string the reviewer read on the scene, from the target chooser to the shot
counts and the tempo hint, came from the message catalog.

**Criterion 8:** met. `design/comparisons.md` records the first pair, A spark
and counts and B the hit ring, at 2080, 360 and 3840, with no pick and A
shipped. The operator's direction in capture
`b073cfb3d1a2d4b7e3f38ce843aeffb35ef5e035e80e37686e11512539094c2d`, which
hashes as cited, was to keep going without waiting for their input. D004
records the executor's application of it as rule 25's delay, and the rounds
remain this order's own follow-up. The reviewer accepts that reading for the
reason VER-001 gives: the rounds need the operator, and the delay route is
the conservative outcome. D004 names the removed
`libs/features/scene/src/lib/wrappers/scene-canvas/hit-ring-candidate.ts`, and
`ls` on it prints nothing.

**Criterion 9:** met. The production build is in the review row, and the
reviewer's own `npx nx build dotln --configuration=production` replayed it
from the cache at this tree. `npm run check:bundle` passed in VER-001 and in
the draft's CI checks job. `git diff --quiet` against the base over
`package.json` and `package-lock.json` exits 0, so the dependency keys equal
the base's.

**Criterion 10:** met. The canonical reader accepts
`target-gate:ff380c6d-cded-4d45-8185-aaec7cac370a`, recorded
2026-11-19T04:22:55Z at tree `27e2390c`. It ran install, lint, typecheck,
test, format, build, e2e and visual, all passing, with no tracked-byte
mutation. The review reuses it because the tree is unchanged, and the
completion matches the row by tree. The handoff and VER-001 place the product
Preflight and the launchpad's document rows before the first target gate.
`npm run test:docs` ran in the launchpad order worktree after this report's
last edit, and its row is the one the completion consumes.

## Walkthrough

Performed on 2026-11-19 in a headless Chromium this session launched through
the target's Playwright package. It ran at 2080 by 1460 against a loopback
static server over `dist/apps/dotln/browser`, the production build of this
tree, which the reviewer's `npx nx build dotln --configuration=production`
replayed from the Nx cache. No Playwright MCP was attached, and
the operator's own browser was not used. Reduced motion held each reading on a
stepped frame, and the scene was driven through its own controls: unit-list
checkboxes, glyph clicks, the rail, the inspector's sliders, Apply, the
transport, the field tools and Clear. The session logged no console error or
warning and no failed request.

1. **A standing target.** Selected units 03, 08 and 13, chose Aiming and
   shooting in Fight and clicked unit 09's glyph. At frame 100 the
   instruments read 12 shots, 6 hits and 50%, and unit 09's row read Hits taken
   6. [2080](../../evidence/WO-037/walkthrough/final-001-01-standing-2080.png)
2. **Set it moving.** Chose Arrive, clicked unit 09 and open ground near the
   south edge, and pressed Apply. The plain streaks went to where the runner
   stood, and its row stayed at 9 hits from frame 130 to frame 280.
   [2080](../../evidence/WO-037/walkthrough/final-001-02-plain-falls-behind-2080.png)
3. **The single cue.** Gave the shooters The firing solution. The preview read
   Recorded pose at frame +36 and a planned clip of 0.60 s (36 frames). Moved
   the objective north, and the runner's hits rose from 9 at frame 310 to 31 at
   frame 520 as accuracy climbed from 42% to 70%.
   [2080](../../evidence/WO-037/walkthrough/final-001-03-single-cue-2080.png)
4. **Drag.** Set Drag to 0.3 in Projectile trajectory and applied it. The
   single cue's preview kept frame +36 and now planned 1.20 s (72 frames). With
   the objective south, the runner's hits stayed at 31 from frame 550 to frame
   760 while 21 more shots left.
   [2080](../../evidence/WO-037/walkthrough/final-001-04-drag-misses-2080.png)
5. **The later cue.** Applied Iterative targeting at Later cues 4. Its preview
   read Recorded pose at frame +72 beside the same 72-frame clip. With the
   objective north, the hits rose from 31 to 46 by frame 1000.
   [2080](../../evidence/WO-037/walkthrough/final-001-05-later-cues-2080.png)
6. **A wall.** Drew a wall at x = 72 from the top of the lane to the bottom. Two
   streaks already past it landed, and then the runner's row held at 50 from
   frame 1060 to 1120 while the shots rose from 108 to 114. Each streak ended on
   the wall's west face with a chipped mark, and the text layer counted three
   wall marks. [2080](../../evidence/WO-037/walkthrough/final-001-06-wall-2080.png),
   [3840](../../evidence/WO-037/walkthrough/final-001-06-wall-3840.png)
7. **Knockout in the same session.** Removed the wall, selected the shooters
   and opened Aiming and shooting. It showed Objective point and two shots a
   second while they were firing at unit 09 (F3), so the reviewer chose unit 09
   in Fire at, set Hits to knock out to 3 and pressed Apply. By frame 1220 unit
   09 was down with 53 hits and bystander unit 04 with 4 (F2). Down units read
   0 with the shooters selected (F1).
   [2080](../../evidence/WO-037/walkthrough/final-001-07-continuous-knockout-2080.png)
8. **Knockout from a fresh composition.** Pressed Clear and formed units 04,
   09, 10, 14 and 19 as a line at spacing 5, standing in formation by frame
   500. Gave the shooters Aiming and shooting at unit 09 with knockout 3. Unit
   09's row read in formation with Hits taken 2 at frame 563, and down with
   Hits taken 3 at frame 564, its glyph dim.
   [2080](../../evidence/WO-037/walkthrough/final-001-08-third-hit-2080.png)
   By frame 964 the other four read in formation as a line of four, and with
   nothing selected the formation readout gave slot error 0.0 and Down units 1.
   [2080](../../evidence/WO-037/walkthrough/final-001-08-closed-up-2080.png),
   [3840](../../evidence/WO-037/walkthrough/final-001-08-closed-up-3840.png)
9. **The trial of the two aims.** In a fresh composition gave unit 09 Arrive
   toward the south, and gave the shooters Aiming and shooting at unit 09,
   Projectile trajectory at drag 0.3, The firing solution, and Iterative
   targeting at frame 25. Pressed Compare: the branches first differ at frame
   31, with shots at 63 against 63, hits 44 against 55 and accuracy 70%
   against 87%. The field drew the earlier branch's streaks dotted.
   [2080](../../evidence/WO-037/walkthrough/final-001-09-trial-2080.png),
   [360](../../evidence/WO-037/walkthrough/final-001-09-trial-360.png)

At each of the four moments captured at all five sizes the document was no
wider than the window. The reviewer read seven captures as images. At 2080 by
1460 these were the single cue, the continuous knockout, the closed-up squad
and the trial, and at 3840 by 1620 the wall, the closed-up squad and the
trial. The session agrees with VER-001's statement of what the page shows. A
plain streak goes to where the runner stands when it leaves, so it crosses the
runner's trail. The single cue plays the streak as a clip to one recorded
later pose, so the two arrive together. Drag stretches that clip without
moving the pose, so the streak arrives late. The later cue reads the pose that
matches the stretched clip. Neither aim computes a lead from velocity, and
the inspector says so.

## Review

The whole subject was read: the three engine modules and the changes to
`types.ts`, `interpreter.ts`, `simulation.ts`, `formation.ts`, `metrics.ts`,
`hash.ts`, `queries.ts` and `geometry.ts`. Also read were the catalog rows, the
schema and the three kind lists, the facade, mappers, inspector, unit list,
canvas painter and shot painter, the specs and the e2e cases, and the target's
`scene.md` and `scene-rules.md`. The engine is small and plain. Bullets
resolve before units move, an idle board returns from the projectile pass
untouched, and that is why the older hashes hold. A downed unit leaves
steering, collisions, rays, objective driving and the selection of later
steps, and a formation that loses it is laid out again by the same
`rosterSlots` that formed it. The test-timeout changes keep every assertion.
The crowd steering cases the executor gave 20-second deadlines run in under
0.4 s each on an idle host, so they reflect load and not an engine slowdown.
The two target documents integrate their new sections into the standing text.
The profile's scene map and rail count and the workstream's rows read the
current state.

The review wrote, tested and withdrew one repair. F3 lies on the Objective's
own path, so a facade-only repair was tried. It opened Aiming and shooting,
Projectile trajectory and Iterative targeting on the values every selected
standing piece shares, the mark included. A facade case failed without it at
the mark, reading 0 for 9, and passed with it beside the scene project's lint
and tests. Product 07 says a reviewer never writes a behavioral fix and
certifies it, and the review's bounded cleanup admits only low-risk cleanup,
so the repair was taken out before any gate row was relied on. The target tree
hashes again as `27e2390c`. D014 records the approach on D013 for the repair
that takes it up, and [FOR-CORE.md](../../../FOR-CORE.md) gains one entry for
the briefing that suggested the opposite.

The verification sequence is VER-001 alone, a pass. Its reproductions, probe
and three boarded decisions were read. The executor's handoff recorded
criterion 1 unmet for the later phase, and VER-001 met it.

## Publication

The verifier opened draft pull request #20 on `feat/scene-shooting` at
`58e4e9b`, whose tree is the reviewed tree. Read back at 06:58Z, it had no
review, comment or thread, and its `checks`, `visual` and `title` runs had
passed. [preview-pr.json](../../evidence/WO-037/preview-pr.json) records the
reading. No item needed a route. The reviewed tree is committed on `wo-037`
before the pass is recorded, as four commits on the base ending at `14e46e3`:
the engine, the catalog rows, the page with its e2e cases and documents, and
the test readiness changes. Only the last commit's tree is the gated one. The
order's records are filed into the target after the pass. The publish replaces the draft head under its lease and
marks #20 ready. The operator merges it, and the release close cuts the
target's minor release from [RELEASE-NOTES.md](RELEASE-NOTES.md).

## Limits

- The terms screen of this branch listed no line, so the reviewer read 0
  lines. The private list was not printed.
- The session was headless with reduced motion. Motion-on playback was not
  watched, and VER-001 sampled it.
- The review relies on the target's recorded review row for the full suites,
  plus its own reruns of the copy test, the criterion's grep, the fixture
  comparison and the scene project's lint and tests during the withdrawn
  repair. The withdrawn repair never entered a gated tree.
- DotLn recorded this review and is not the product under review.

Outcome against the goal: matched. The order is accepted on its verified tree
with the review's own session behind criterion 1. Three traps changed what
the review did. The first was passing on VER-001's walkthrough alone, which
the reviewer's session replaced. The second was certifying a fix the reviewer
wrote, which was withdrawn. The third was failing criterion 1 on defects that
break no criterion, which the three follow-ups answer instead.


Filed from the launchpad Launchpad at commit a9a9d25d3ea9d42ac746e1593e294c147a4b52be, where this record's path was docs/final-reviews/WO-037/FINAL-001.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
