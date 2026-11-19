# WO-037 — Shooting and bullets: a unit given a fire tool shoots at a target unit or point, bullets as entities with speed, range, drag and a hit radius that walls and obstacles stop, aim leading a moving target by the catalog's firing solution and by iterative targeting, hits counted in the instruments and shown on the field and in the text layer, a knockout option that takes a unit out of the run after a number of hits, all deterministic and replayed, with the rail's new `fight` group

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 6eef542987ab2183817baba329a64373cb61b157
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds to `libs/shared/scene-engine` the modules `projectiles.ts`
(bullets as entities: owner, position, velocity, range left, radius, drag;
their advance, their hit test against units and geometry) and `aiming.ts`
(single-cue and repeated-cue aim from a moving piece's board animation)
and their specs, extends `types.ts`
(`BulletState`, `hits` and the `down` activity on a unit state,
`SimulationState.bullets`, the frame's bullets), `formation.ts`
(`FormationState` keeps the pattern, spacing and slot costs it was formed
with; a formation re-forms round the members still standing when one goes
down), `interpreter.ts` (the kinds `combat.fire`, `combat.aim` and
`combat.projectile`; a `combat.fire` step's target as a unit's place in the
scene's list or the objective point; `isSafeStep`'s least values for `rate`
and `bullet-speed`), `simulation.ts` (bullets advance before units; a
knocked-out unit is not steered and leaves its formation, which re-forms),
`metrics.ts` (`shots`, `hits`, `accuracy`, `downUnits`) and `hash.ts`
(each bullet folded into the frame hash after the units); types five catalog
rows in `tools-aifg-a.json` (`aifg-a:161` Aiming and shooting, `aifg-a:163`
The firing solution, `aifg-a:166` Iterative targeting, `aifg-a:167` Moving
targets, `aifg-a:162` Projectile trajectory), grows the transform enum in
`tool-v1.schema.json` and `TransformKind`, adds the three kinds to
`sceneTransformKinds` in `models` and in `tools/scripts/catalog/check-catalog.mjs`
and to `interpretedKinds`, and rewrites `catalog-summary.json`'s `counts` and
AI for Games' `sceneTools` as WO-036 does; labels the kinds in
`libs/features/tools/src/lib/mappers/reading-mapper/reading-mapper.ts` and
`scene-labels.ts` through messages in `apps/dotln/public/i18n/en.json` and the
two testing copies; adds to the scene feature the rail group `fight`, the
inspector's fire views (the target chooser: the selected target unit or the
objective point, the preview rows), the painter's bullet, spark, wall-mark
and down-unit layers, the text layer's hit rows and each unit's hit count,
the trial compare's accuracy series; `range-known-outcome.json` listed in
`tools/scripts/check-scene-fixtures.mjs`, with the existing trial and walls
known outcomes regenerated for the expanded metrics;
e2e cases, the scene's regenerated visual baselines and the documents
(`scene.md`, `scene-rules.md`, the profile's implementation map); about 45
source files; adds no runtime dependency and no tool script. Removes
nothing. The rail grows by five tools, from twenty-eight at the base to thirty-three. Wall-clock: estimated at about 6 h 0 min to 9 h 0 min of executor
work plus the design rounds and the fixed cycle, an estimate and not a
measure; unknown until run. Context bytes: 131,976 bytes of engine TypeScript and
173,319 bytes of scene TypeScript, templates and Sass at `6eef542`
(excluding specs and stories), `scene.md`, `scene-rules.md`,
the catalog's Chapter 3 §3.5 rows and WO-028's Projectile trajectory, The
firing solution and Iterative targeting studies, WS-001 rules 9, 24, 25, 28
and 29, this order; about 450 KB for the executor, an estimate. Commands
added in the target: none. Tokens: unknown until run. Steps: 18. Re-mints:
none. Refutations paid: this pass's receipt.
**Nomination provenance:** the operator's follow-up of 2026-11-04 during
WO-028 (ignored capture
`docs/intake/notes/wo028-scene-shooting-followup-2026-11-04.md`, SHA-256
`91de02f4aa54b9300fe157b373b277993302cddf81d95f67344a8409b6733085`;
WO-028-D005; register row `FUP-2c1a53924446e9dd`): are shooting and
bullets getting added to the scene, and a note so it is not forgotten; the
expansion of 2026-11-04 (capture
`fcb33759c95fb20b77ee2bf2f48cec61a6cac1215948bcd16386448d33636186`;
WO-028-D006) asking planning to identify the combat dependencies and split
the road orders where useful; the operator's dispatch of 2026-11-05
(ignored capture `docs/intake/notes/planning-2026-11-05.md`). The split:
WO-036 lands the geometry and the ways, this order lands the shooting
over them. Planner-synthesized by the
[2026-11-05 pass](../planning/passes/standard-pass-v0-117-0-scene-reminders-2026-11-05.md)
(D5). Opaque identifier, not a priority. Amended by the 2026-11-09 pass
([planning document](../planning/passes/standard-pass-v0-122-1-open-orders-rejudged-2026-11-09.md) D6):
the knockout's formation behaviour written as what the engine must gain
(`recentred` keeps a vacated slot empty and leaves a fixed formation on its
leader) with the criterion that shows it; the fire step's target carried as
a number, since a step's parameters are numbers; WO-036's older-trial rule
followed for the four new metrics; the frame hash folding in the bullets;
the fixture written as a known outcome now that geometry is carried by
steps; `check-catalog.mjs`'s list of scene kinds, the catalog summary, the
transform labels and the visual command and baselines named; the
inspector's study links left to WO-045; the criteria rewritten so no count
is a subject and the round criterion admits rule 25's deferral; the base
and the Cost re-estimated.
**Depends on:** WO-036 merged (hard: the geometry bullets stop at, the
field steps and the older-trial rule, the rail groups, the inspector's
views and the painter's layers this order extends).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-036",
    "relation": "hard",
    "reason": "the walls and obstacles a bullet stops at, the field steps and the older-trial rule, the rail's groups and the inspector's and painter's layers this order extends"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 1, 5, 9, 12, 14, 15, 18, 24, 25, 26, 28, 29 and 30; §The app and
its sub-apps, G1, G2, G3, G5, §Design direction); `docs/repositories/dotln-angular.md`
(§Run the app and its checks, §Registered gate, §The soldier scene);
the target's `docs/dev-reference/architecture/scene.md` and
`docs/ai-reference/scene-rules.md` as WO-036 leaves them; the catalog's AI
for Games rows of Chapter 3 §3.5 (`libs/shared/catalog/src/data/tools-aifg-a.json`)
and the studies `projectile-trajectory`, `the-firing-solution` and
`iterative-targeting` under `libs/shared/catalog/src/studies/aifg/`;
WO-015's Design and WO-036's in this launchpad; WO-015's lost-member rule in
the target's `libs/shared/scene-engine/src/lib/formation.ts` (`recentred`).

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
the scene, selects three units, gives them Aiming and shooting from the
rail's new `fight` group and clicks a unit across the field as the target:
bullets stream across, sparks mark the hits, the instruments count shots,
hits and accuracy, and the target's row in the text layer counts its hits;
they set the target moving with Arrive and an objective and watch the
shots fall behind it; they give the shooters The firing solution and the
bullets lead the target and hit; they turn drag up in the inspector and the
single-cue shot misses again, then give them Iterative targeting and the
hits return; they draw a wall between shooters and target and every bullet
ends on the wall with a mark; they set knockout to three hits, and the
target goes down after the third, its squad closing up round the gap it
left; they run a trial of the two aims from one seed and read where they
diverge. What the operator learns is what it takes to hit a moving thing
and what a wall does to a line of fire; what they decide is whether the
scene's next toy is cover, or ammunition, or sides.

**Observed gap (checked 2026-11-19 at `6eef542`):** the engine has no
projectile and no aim: `SimulationState` holds units, formations and an
objective and field geometry; the catalog's §3.5 rows (Aiming and
shooting, The firing solution, Iterative targeting, Moving targets,
Projectile trajectory) are untyped, so the rail does not offer them,
although WO-028 studied three of them with executable models that the
scene does not run; a unit has no hit count and no way out of a run;
nothing on the field is consumed, ended or marked by anything else moving.
A formation cannot lose a member and close up: `recentred` in
`formation.ts` moves a two-level formation's anchor to the centre of the
slots still held and keeps every member in its slot, so a vacated slot
stays empty, and returns a fixed formation unchanged; `advanceFormation`
moves a fixed formation with whatever unit its `leader` names, so a leader
that stops leads a formation that stops with it; and `FormationState`
keeps neither the pattern, the spacing nor the slot costs it was formed
with, so nothing can lay it out again. A step's parameters are numbers
(`isNumberRecord` in `stored-scene.ts`), so a target unit cannot ride in a
step as its id. `hashFrame` hashes the units' positions and velocities
alone. `isSafeStep` consults `leastValueOf` for positive minima, including
`look-ahead`. The stored trial reader already fills a missing metric with
a null series of the length of its branch.

**Design:**

- **Bullets.** A bullet is an entity in `SimulationState.bullets`: owner,
  position, velocity, range left, radius and drag; it advances before the
  units each tick, loses speed by drag, and ends when its range is spent,
  when it crosses a wall segment or enters an obstacle (a mark on the
  geometry for a few frames; WO-036's swept test) or when it comes within
  `hit-radius` plus the unit's radius of a standing unit other than its
  owner (a hit). Bullets are drawn as short streaks in the owner's role
  colour, a hit as a spark (G2: motion means transition; nothing animates at
  rest), and every bullet and hit has a row or a count in the text layer
  (G1). `hashFrame` folds each bullet's position and velocity in after the
  units', so a frame with no bullets hashes as before and a trial's first
  divergence sees a bullet that differs.
- **Firing.** `combat.fire` (Aiming and shooting, `aifg-a:161`) on the
  selected units with a target that is a unit (the unit clicked after the
  tool is chosen, select-then-apply) or the objective point. A step's
  parameters are numbers, so the target rides as `target`, the target
  unit's place in the scene's unit list counted from 1, or 0 for the
  objective point. Its catalog parameters are `bullet-speed`, `range`,
  `rate` (shots per second, one shot every `60 / rate` ticks on the seeded
  clock), `hit-radius` and `knockout-hits` (0, the default, means a unit is
  never knocked out); `isSafeStep` gains least values above zero for `rate`
  and `bullet-speed`. A unit fires along its aim while the step is active
  and the target is within range.
- **Aim.** The firing solution (`aifg-a:163`) and Moving targets
  (`aifg-a:167`) choose a single pose from the marked piece's board
  animation. Drag stretches the shot animation. Iterative targeting
  (`aifg-a:166`) can read later cues, up to its `iterations` setting,
  so its streak can meet the later pose. With no aim tool, a streak heads
  for the piece's current position. Projectile trajectory (`aifg-a:162`,
  `combat.projectile`) sets `bullet-speed` and `drag`. The engine's
  `aiming.ts` owns the two arcade modes and the clock identifies each
  cue on replay. The three WO-028 studies keep their own mechanisms and
  the inspector's study links remain WO-045's. The executor recorded the
  operator's substitution in [WO-037-D002](../evidence/WO-037/decisions.md#wo-037-d002).
- **Hits, knockout and the formation re-forming.** A hit increments the
  unit's `hits`; at `knockout-hits` the unit's activity becomes `down`: it
  stops, is not steered, no bullet hits it again, it is drawn dim and listed
  as down in the text layer, and it leaves its formation, which re-forms
  round the members still standing. The engine gains what that needs:
  `FormationState` keeps the pattern, slot spacing and slot costs a
  two-level formation was formed with, and the spacing of a fixed one; a
  two-level formation that loses a member to a knockout lays its pattern
  out again for the members still standing (`patternSlots` at its spacing,
  the roles by `patternSlotRoles`) and reassigns them by `assignSlots` under
  its costs, so the squad closes the gap; a fixed formation whose leader
  goes down is led by the member that held the next slot, its slots
  measured from that member as `applyFixed` measures them, and a fixed
  formation's follower going down leaves the rest re-laid behind the
  leader; a formation with no member standing is removed, as
  `leaveFormations` removes one. A unit taken out of a formation by the
  operator's own later step keeps WO-015's lost-member rule (`recentred`),
  since the operator moved it on purpose and WO-015 decided that nothing
  else then moves. A restart replays the run with the unit standing until
  its third hit comes round again. Metrics: `shots`, `hits`, `accuracy`
  (hits over shots, `null` with no shots), `downUnits`; the trial compare
  carries accuracy as a series. Under WO-036's older-trial rule a trial
  saved before these metrics reads them as `null` series, with no change to
  `stored-scene.ts`'s rule and no version step.
- **The rail and the inspector.** The five rows typed, the transform enum
  grown by a recorded decision in `tool-v1.schema.json` and `TransformKind`,
  the three lists of scene kinds (`sceneTransformKinds` in `models` and in
  `check-catalog.mjs`, `interpretedKinds`) kept equal, `readsParam`
  extended, `catalog-summary.json`'s `counts` and AI for Games' `sceneTools`
  rewritten to what `checkSummary` computes as WO-036 does,
  `reading-mapper.ts` and `scene-labels.ts` labelling the three kinds
  through messages; the rail group `fight`; the inspector's fire view names
  the target (unit or objective), shows the preview rows (time to target,
  animation cue, range after drag) and the knockout setting. Every new string
  on screen is a message (rule 9).
- **Design brief and the first pair** (WS-001 rule 25, at the operator's
  sizes, rule 29): A: a hit is a spark on the field and a count in the
  instruments and the text layer, the unit itself unchanged; B: a hit is a
  spark and the unit's glyph gains a ring that fills toward knockout. One
  variable, whether the unit shows its hits on the field; both rendered at
  about 2080 by 1460 and at 360, read at 3840 by 1620; A then B with the
  round named; the rounds continue until the operator says the process is
  done; the rejected implementation leaves the code when its round is
  decided. If the operator delays the rounds, the order records the first pair without a pick, ships A, removes
  B's implementation with its screenshots and record kept, and carries the
  rounds as a follow-up, this order's own criterion run later as exactly that (rule 25). The rule of cool (rule
  28) applies in both directions.
- **Fixtures and determinism.** `range-known-outcome.json`, a known outcome
  (`scene-known-outcome-v0`) over `scene-twenty.json`: branch A three
  shooters firing at a standing target, branch B the same with a wall drawn
  between them at tick 0; it and the existing known outcome regenerated
  with the reason in the pull request; a replay applies fire steps at their
  ticks; the frame hashes with bullets reproduce; `trial-known-outcome.json`
  keeps its hashes, since its frames carry no bullet.

Rejected: ballistic arcs drawn in height over the top-down field (axis: the
field is a plan view and a lob's arc is the study's drawing, not the
scene's; drag is the honest difference between the two aims here); sides
or teams (axis: the operator's sandbox has roles, and a target is whatever
the operator points at; sides are a later toy); ammunition and reloading
(axis: nothing in the request asks for it, and rate and range bound a run
already); removing a knocked-out unit from the scene definition (axis: a
reset revives it and the fixture's twenty units stay twenty); bullets as
units (axis: a bullet has no steering and no role, and twenty units stay
the scene's contract); a knockout leaving its slot empty through
`recentred` (axis: the squad would march on round a hole and a downed
leader would hold a fixed formation in place, where the Objective has it
close up); the target as a unit id string in the step (axis: a step's
parameters are numbers, and widening the step's shape would change the
stored composition and the export).

Live-run surfaces at the base: the scene after WO-036 with its geometry,
its field steps and the rail's `ways` group; the Projectile trajectory, The
firing solution and Iterative targeting studies.

**Deliverables:** the engine modules and their specs; the formation's
re-forming; the typed rows, the grown enum, the equal kind lists and the
rewritten summary; the rail group, the inspector's fire views, the painter's
layers, the text layer's rows; the fixtures; the regenerated scene
baselines; `docs/evidence/WO-037/` with the design record, `walkthrough.md`
and its screenshots; the documents.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-037: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor 6eef542987ab2183817baba329a64373cb61b157
   origin/main` exits 0 (a `main`
   that does not contain it stops for a planning pass); the target worktree
   then fast-forwards to the target's `main`, and that integrated commit is
   the baseline of every later comparison until a later integration of
   `main` replaces it; then the route guard and activation as WO-005 step 1.
   Check: the decisions carry the integrated commit.
2. `libs/shared/scene-engine/src/lib/projectiles.ts` and `types.ts`: advance,
   drag, range, the hit tests against units and geometry, the frame's
   bullets. Check: `npx nx test scene-engine` exits 0 with a spec that ends
   a bullet on a wall, in an obstacle and on a unit.
3. Implement the two animation-cue modes in `aiming.ts`, with imports inside
   the engine. Check that a single cue meets a crossing piece at drag 0
   and misses it at drag 0.3, where reading later cues restores the hit.
4. `formation.ts`: `FormationState` keeping its pattern, spacing and slot
   costs (set by `applyTwoLevel` and `applyFixed` in `interpreter.ts`), and
   the re-forming of a formation that loses a member to a knockout. Check:
   `formation.spec.ts` covers a two-level formation re-laid and reassigned
   after a knockout, a fixed formation whose leader goes down, a fixed
   formation's follower going down, and an operator's step still keeping a
   vacated slot empty; `npx nx test scene-engine` exits 0.
5. `interpreter.ts` (the three kinds, the fire step's `target`,
   `isSafeStep`'s least values, `readsParam`), `simulation.ts` (bullets
   before units, the knockout and `down`, no steering for a downed unit),
   `metrics.ts` (the four metrics) and `hash.ts` (bullets folded in). Check:
   `npx nx test scene-engine` exits 0; the known-outcome spec reproduces
   `trial-known-outcome.json`'s hashes unchanged.
6. `libs/shared/catalog/src/data/tools-aifg-a.json` (the five rows typed),
   `tool-v1.schema.json` (the enum), `TransformKind` and
   `sceneTransformKinds` in `libs/shared/models/src/lib/toolbox.ts`,
   `sceneTransformKinds` in `tools/scripts/catalog/check-catalog.mjs` and
   `interpretedKinds` (a decision records the enum's growth). Check:
   `npm run catalog:check -- --partial` exits 0.
7. `libs/shared/catalog/src/data/catalog-summary.json`: `counts` and AI for
   Games' `sceneTools` computed inline from the checkpoints as WO-036 did,
   `date` unchanged, then `npx prettier --write libs/shared/catalog/src/data`.
   Check: `npm run catalog:check` and `npx nx test catalog` exit 0.
8. `reading-mapper.ts` (one `#transforms` entry per new kind),
   `scene-labels.ts`, the `tools.transforms` and `scene` messages in
   `apps/dotln/public/i18n/en.json` and their copies `tools-en.json` and
   `scene-en.json`. Check: `npx nx test tools`, `npm run i18n:check` and
   `node --test tools/i18n-copies.test.mjs` exit 0.
9. `libs/features/scene/src/lib/mappers/tool-mapper.ts` (`railGroupOf`,
   `railGroupOrder`) and `RailGroupId` with `fight` and its label. Check:
   `npx nx test scene` exits 0, the every-tool-at-defaults case over the
   rail as the catalog now gives it.
10. The inspector's fire views and target chooser, the painter's bullet,
    spark, wall-mark and down layers (candidate A), the text layer's rows
    and counts, the trial's accuracy series. In `scene.facade.ts` keep the
    route display independent of whether a tool is armed. The inspector and
    Show search use the same route choice. During playback they read the
    selected units’ current routes. While paused, an explicit unapplied
    path edit previews what Apply would do, including after a replayed
    route is present. Otherwise show the selected units’ current routes,
    falling back to the existing paused preview before the recorded step.
    Keep Restart’s tool arming, parameter commits and formation slots intact. Check: `npx nx test scene`,
    `npm run lint:components` and `npm run i18n:check` exit 0.
11. The first rendered pair (A spark and counts, B the hit ring) at about
    2080 by 1460 and 360, read at 3840 by 1620; the rounds, or their
    deferral as the Design states; the rejected or unpicked implementation
    removed with its record. Check:
    `docs/evidence/WO-037/design/comparisons.md` exists and names the pair.
12. `libs/features/scene-data-access/src/lib/stored-scene.ts`'s spec: a
    stored value and an export whose kept trial predates the four metrics.
    Check: `npx nx test scene-data-access` exits 0.
13. Fixtures: `libs/features/scene/src/testing/fixtures/range-known-outcome.json`
    written by the engine's known-outcome spec under
    `WRITE_SCENE_FIXTURES=1 npx nx test scene-engine --skip-nx-cache`, with
    `trial-known-outcome.json` and `walls-known-outcome.json` regenerated by
    the same writer for the four additional metrics. Format all three and
    compare both existing frame-hash arrays with the integrated base.
    Add the range fixture to the scene feature’s `known-outcome.spec.ts`
    and to `fixtureNames` in `tools/scripts/check-scene-fixtures.mjs`.
    Check: the engine and scene specs, `npm run check:fixtures` and
    `npm run test:tooling` pass. A normal run leaves all three files
    byte-identical.
14. e2e `apps/dotln-e2e/src/scene.spec.ts`: fire at a standing unit and read
    the hits, lead a moving target with the two aims under drag, a wall
    between them, knockout at three, save and reload with the fire step,
    the trial; axe; no overflow at 360, 768, 1440 and the operator's sizes;
    then the scene's baselines regenerated on macOS with
    `npx nx e2e-visual dotln-e2e -- --update-snapshots=all`, each image read
    at reading size before it is accepted. Check: `npx nx e2e dotln-e2e`
    and `npx nx e2e-visual dotln-e2e` exit 0.
15. The walkthrough as WO-020 step 11, under `docs/evidence/WO-037/`, with
    screenshots at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620.
    Check: the files exist.
16. Documents: `scene.md` (bullets, aim, hits, knockout and the re-forming),
    `scene-rules.md` (bullets advance before units; a bullet ends on
    geometry; the aims are the engine's; a knockout re-forms a formation
    while an operator's step keeps the lost-member rule). Check:
    `grep -ci bullet docs/dev-reference/architecture/scene.md` is at least 1.
17. Dependency check as WO-015 step 15; `npm run check:bundle`; gate plain
    and review. Check: passing rows, no tracked-byte mutation.
18. Launchpad write-back (the profile's §The soldier scene implementation
    map and its rail count; WS-001 §Delivery states), then the publish,
    review and records steps as WO-007 steps 15 to 17, with the branch
    `feat/scene-shooting`, the title `feat: add shooting and bullets to the
    soldier scene`, `docs/evidence/WO-037/` and `docs/final-reviews/WO-037/`;
    the final reviewer commits the order's records on the order branch
    before `npm run resume -- target-records` (the profile's publish route,
    step 3). Check: `npm run test:docs` in the launchpad order worktree.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run typecheck:e2e`,
`npm run lint:fixtures`, `npm run lint:components`, `npm run check:fixtures`,
`npm run i18n:check`, `npm run test:tooling`, `npm run check:bundle`,
`npx nx e2e dotln-e2e`, `npx nx e2e-visual dotln-e2e`; in the launchpad
order worktree `npm run test:docs`; then the target gate plain and review
once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session
   in the served production build: fire at a standing unit, set it moving,
   lead it with the single cue, raise drag and watch the miss, lead it
   with Iterative targeting, draw a wall between them, set knockout to
   three and watch the target go down and its squad close up, run the
   trial of the two aims. The VER report carries a `## Walkthrough` section
   with the dated steps and screenshots at 360, 768, 1440, about 2080 by
   1460 and 3840 by 1620 under `docs/evidence/WO-037/walkthrough/`, and
   states in the verifier's own words why the plain shot fell behind the
   moving target, what each aim did about it, what the wall did to the
   line of fire and what the squad did when the target went down, as read
   from the page alone. Met only when every step completed and that
   statement is present. Rule 28 applies: a sloppy or uncool scene fails
   here, and the verifier says so in their words; a UI issue at about 2080
   by 1460 or 3840 by 1620 fails here (rule 29).
2. On `range-known-outcome.json`, the known-outcome spec asserts that in
   branch A the three shooters hit the standing target before the last
   frame, that in branch B no bullet reaches the target and every bullet
   ends on the wall, and that the frame hashes, bullets included, reproduce
   across two runs; `aiming.spec.ts` and a simulation spec assert that a
   crossing target is hit by the single cue at drag 0 and missed by it at
   drag 0.3 where the iterative aim hits; and the `hashes` of
   `trial-known-outcome.json` and `walls-known-outcome.json` equal their
   respective arrays at the latest integrated `main`.
3. With `knockout-hits` at 3, the target's activity reads `down` after its
   third hit and its velocity is zero on every later frame; in
   `formation.spec.ts`, a two-level formation that loses a member to a
   knockout holds the slots `patternSlots` gives for the members still
   standing at its spacing, assigned as `assignSlots` assigns them under
   its costs, and its `slotError` falls below 1 (the bound the spec already
   reads as settled) within the spec's ticks; a fixed formation whose leader
   goes down is led by the member that held the next slot, its anchor at
   that member's position on the next frame; a unit removed by an
   operator's later step still leaves its slot empty; a restart replays the
   run with the target standing until its third hit; and with
   `knockout-hits` at 0 no unit goes down over the run.
4. The rail offers exactly the AI for Games rows that are typed with a kind
   in `interpretedKinds` (the facade spec compares the offered ids with
   `sceneTools('aifg')` filtered by `isRunnable`), the five rows in `fight`;
   the every-tool-at-defaults case passes with every parameter read;
   `interpretedKinds` equals `sceneTransformKinds`; `npm run catalog:check`
   and `npx nx test catalog` pass with the five typed rows and the rewritten
   summary; `libs/shared/scene-engine/src/lib/aiming.ts` imports nothing
   outside the engine (`grep -cE "@dotln-angular/|libs/features"
   libs/shared/scene-engine/src/lib/aiming.ts` prints 0), `npx nx lint
   scene-engine` passes the module-boundary rule, and `aiming.spec.ts`
   asserts which recorded pose each aim reads on a crossing target.
5. A composition exported with a fire step imports and replays it at its
   tick; a stored value and an export whose kept trial predates the four
   metrics restore and import with them as `null` series; and
   `npm run check:fixtures` passes with `range-known-outcome.json` among the
   files `check-scene-fixtures.mjs` validates. A scene test restarts a
   composition with a recorded path step and a selected unit. Before the
   step, its paused inspector can preview the route. After the step, the
   playing inspector and Show search both show the recorded route. Pause without
   editing at a frame where the Apply preview differs. Both continue to show
   the recorded route. Then change a path parameter. Both show the unapplied preview,
   the unit keeps following its recorded route, and a parameter commit on
   the unarmed tool adds no composition step. The test covers WO-036-D030.
6. `npx nx e2e dotln-e2e` exits 0 with the step 14 cases, axe at the board
   spec's threshold and no horizontal overflow at 360, 768, 1440, about
   2080 by 1460 and 3840 by 1620; `npx nx e2e-visual dotln-e2e` exits 0, and
   the evidence README lists each regenerated baseline with what changed in
   it, every one a `scene-*.png`.
7. `npm run i18n:check` exits 0 and `node --test tools/i18n-copies.test.mjs`
   passes, so every new string on the scene is a message key with the
   testing copies equal to the app's catalog.
8. `docs/evidence/WO-037/design/comparisons.md` records the first pair (A
   spark and counts, B the hit ring) and either every later round with its
   pick and the operator's word that ended the rounds in the decisions
   file, or the pair without a pick and the operator's word that delayed
   the rounds with A shipped (rule 25); in
   either case the decisions file names the removed implementation's files
   and `ls` on each prints nothing.
9. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets, `npm run check:bundle` passes, and `package.json`'s
   `dependencies` keys equal the integrated base's.
10. `node scripts/target-gate.mjs WO-037 --review` records a passing row for
    every declared command with no tracked-byte mutation, and
    `npm run test:docs` passes in the launchpad order worktree; the
    Preflight line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-037/README.md`,
`design/`, `walkthrough.md` and its screenshots, and
`docs/evidence/WO-037/host-qualification.md`.

**Known issues and carry-ins:** WO-036 merged in DotLn-Angular #19. The
pinned target contains its geometry, routes and inspector. WO-024 can run
beside this order. Either verified draft can open first. After one sibling
merges, the remaining branch integrates target `main`, keeps both sets of English
messages and runs `node --test tools/i18n-copies.test.mjs` before it lands,
including when its PR was already ready. The inspector's link to the three studies is WO-045's.
Sides, cover, ammunition and a lobbed arc are later toys the operator picks
after playing. The scene's known outcome is regenerated here with its
reason in the pull request. This order activates only on a launchpad whose
starter carries core WO-221's `--draft` form; the draft pull request and
its workflow runs are a final-review obligation read from
`docs/evidence/WO-037/preview-pr.json`, never a criterion. Before
`target-records`, the final reviewer commits the order's records on the
order branch (the profile's publish route, step 3). `Target release
classification: minor` and `Target release notes: reviewed` are set under
WO-012's declared policy.

**Non-goals:** sides or teams; ammunition; a lobbed trajectory drawn in
height; cover and line of sight beyond the wall stop; a study of its own
(the three studies exist); a link from the inspector to a study (WO-045);
Babylon.js (candidate C2).

**Operator-review assumptions:** the operator accepts straight bullets with
drag as the scene's projectiles, the single-cue and repeated-cue aims as the
two tools, knockout as a parameter that defaults off and a squad that
closes up round a downed member, judges the first pair and ends or delays
the rounds in their own words, and reads the one draft pull request before
final review, which the final publish reuses.


Filed from the launchpad Launchpad at commit a9a9d25d3ea9d42ac746e1593e294c147a4b52be, where this record's path was docs/work-orders/WO-037-scene-shooting-and-bullets.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
