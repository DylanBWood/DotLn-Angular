# WO-036 — Walls and ways: the soldier scene gains walls and obstacles the operator draws on the field, a tile graph those block, A* and Dijkstra with the catalog's heuristics and cost functions as rail tools, path following with replanning when the field changes and a visible no-route state, obstacle and wall avoidance from the engine with a deterministic head-on policy, and geometry saved with the composition and replayed

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ eb9d227483e30164105da077f50673789d1e5c9f
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds to `libs/shared/scene-engine` the modules `geometry.ts`
(segments with a thickness, discs, the swept-disc clearance test, a ray cast
returning the nearest hit and its normal), `graph.ts` (the tile graph over the
field at its cell size, blocked by geometry, 8-connected with octile costs
scaled by the cost weights, and the same graph built from a plain grid of
blocked cells and costs), `pathfinding.ts` (A* with a pluggable heuristic,
Dijkstra as its zero heuristic, path retrieval, line-of-sight smoothing, the
open and closed sets per expansion), `path-following.ts` (seek the next
waypoint, arrive at the last, the predictive variant) and their specs, extends
`steering.ts` (obstacle and wall avoidance by a ray and two whiskers; the
head-on policy in a function of its own, `avoid` unchanged), `simulation.ts`
(geometry stops a unit; replanning on a geometry, cell-size or objective step;
the `blocked` activity), `interpreter.ts` (the kinds `path.find`,
`path.smooth`, `path.follow` and `path.cost` interpreted; the `field.wall`,
`field.obstacle`, `field.clear` and `field.grid` steps, exempt from the
no-units refusal; `isSafeStep`'s least values), `metrics.ts` (`pathLength`,
`replans`, `blockedUnits`) and `types.ts` (`SceneGeometry`,
`SimulationState.geometry`, the `blocked` activity, the frame's geometry and
routes); types seven catalog rows in `tools-aifg-a.json` (`aifg-a:222` A* and
`aifg-a:212` Dijkstra's algorithm as `path.find`, `aifg-a:254` Path smoothing
as `path.smooth`, `aifg-a:127` Path following and `aifg-a:129` Predictive path
following as `path.follow`, `aifg-a:137` Obstacle and wall avoidance and
`aifg-a:134` Collision avoidance as `steer.blend`), grows the transform enum in
`tool-v1.schema.json` and `TransformKind` in `models`, adds the four path
kinds to `sceneTransformKinds` in `models` and in
`tools/scripts/catalog/check-catalog.mjs` and to `interpretedKinds`, which also
brings the five rows already typed `path.cost` onto the rail, and rewrites
`catalog-summary.json`'s `counts` and AI for Games' `sceneTools` to match;
labels the new kinds in `libs/features/tools/src/lib/mappers/reading-mapper/reading-mapper.ts`
and `scene-labels.ts` through messages in `apps/dotln/public/i18n/en.json` and
the two testing copies; adds to the scene feature the field tools in the
transport, the geometry list in the text layer, the rail group `ways`, the
inspector's route views and the no-route notice, the canvas painter's
geometry, path and frontier layers; the settling repair of priority
steering in `steering.ts` (WO-015-D010); `stored-scene.ts` reading a trial saved
before a metric existed; `walls-known-outcome.json` listed in
`tools/scripts/check-scene-fixtures.mjs`, and the known outcome regenerated;
e2e cases and the scene's regenerated visual baselines; the documents
(`scene.md`, `scene-rules.md`, the profile's implementation map). About 50
source files; adds no runtime dependency and no tool script. Removes nothing.
The rail grows from sixteen tools to twenty-eight (the seven rows typed here
and the five `path.cost` rows). Wall-clock: estimated at about 6 h 0 min to
9 h 0 min of executor work plus the design rounds and the fixed cycle, an
estimate and not a measure; unknown until run. Context bytes: the engine
(68 KB of source, 131 KB with its specs, measured at `eb9d227`), the scene
feature (134 KB of source, 222 KB with its specs), `scene-data-access`
(19 KB), `scene.md` and `scene-rules.md` (18 KB), the catalog's Chapter 3
§3.3 and Chapter 4 rows, WS-001 rules 9, 15, 24, 25, 28 and 29, this order;
about 450 KB for the executor, an estimate. Commands added in the target:
none. Tokens: unknown until run. Steps: 19. Re-mints: none. Refutations paid:
this pass's receipt.
**Nomination provenance:** the operator's follow-ups of 2026-11-04 during
WO-028 (ignored captures
`docs/intake/notes/wo028-scene-shooting-followup-2026-11-04.md`, SHA-256
`91de02f4aa54b9300fe157b373b277993302cddf81d95f67344a8409b6733085`, and
`docs/intake/notes/wo028-scene-navigation-followup-2026-11-04.md`, SHA-256
`fcb33759c95fb20b77ee2bf2f48cec61a6cac1215948bcd16386448d33636186`;
WO-028-D005, D006 and D009; register row `FUP-2c1a53924446e9dd`): shooting
and bullets, then pathfinding, obstacles and walls, to be planned and not
forgotten, with the navigation, geometry and combat dependencies identified
and the road orders split where useful; the engine's exact head-on blind
spot D009 deferred to the navigation order; the operator's dispatch of
2026-11-05 asking that the reminders be addressed (ignored capture
`docs/intake/notes/planning-2026-11-05.md`); the 2026-11-04 pass's NoOp on
the pathfinding chapter's research, reopened by a road order that lands a
family drawing a graph search; register row `FUP-592e538095eaead9` (the
inspector's link to a tool's study) allocated here because this order
touches the inspector. Planner-synthesized by the
[2026-11-05 pass](../planning/passes/standard-pass-v0-117-0-scene-reminders-2026-11-05.md)
(D5). Opaque identifier, not a priority. Amended by the 2026-11-09 pass
([planning document](../planning/passes/standard-pass-v0-122-1-open-orders-rejudged-2026-11-09.md) D6):
split in two; the `grid` family, the study record's version step, the A*
study and its critics, the inspector's study link (`FUP-592e538095eaead9`),
the NoOp's reopening and the two avoidance studies' carry-ins (WO-034-D013,
and the Collision avoidance comparison as the head-on policy's regression)
moved to WO-045, so that this order edits no file WO-040 edits; the head-on
policy sits in a steering function of its own so that `avoid` and the study
that calls it are unchanged here; the Tile graph stays a background scene
element and cell size is a field setting; geometry is carried by steps, so
neither the stored composition nor the export changes version, and a trial
saved before a metric existed reads with that series as `null`; the five
`path.cost` rows, the field steps' exemption from the no-units refusal,
`check-catalog.mjs`'s list of scene kinds, the catalog summary, the
transform labels and the visual command and baselines named; the criteria
rewritten so no count is a subject and the round criterion admits rule 25's
deferral; the base set to WO-039's merge and the Cost re-estimated.
**Depends on:** WO-015 merged (hard: the engine, the renderer seam, the
rail, the inspector, the text layer, the store and the fixtures this order
extends; merged as `DotLn Angular v0.6.0`). WO-035 (reference-only: the inspector's
definition reads the catalog's messages once WO-035 lands; whichever lands
later integrates the target's `main`).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-015",
    "relation": "hard",
    "reason": "the pure scene engine, the renderer seam, the rail, the inspector, the text layer, the store and the fixture contract this order extends"
  },
  {
    "workOrderId": "WO-035",
    "relation": "reference-only",
    "reason": "the inspector's definition and the rail's names read the catalog's messages once WO-035 lands; the later of the two integrates the target's main"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 1, 5, 9, 12, 14, 15, 18, 24, 25, 26, 28, 29 and 30; §The app and
its sub-apps, G1, G2, G3, G6, §Design direction); `docs/repositories/dotln-angular.md`
(§Run the app and its checks, §Registered gate, §The soldier scene); the
target's `docs/dev-reference/architecture/scene.md`,
`docs/ai-reference/scene-rules.md`, `docs/dev-reference/architecture/catalog.md`
§Data and provenance, `docs/ai-reference/catalog-rules.md`; the catalog's AI
for Games rows of Chapter 3 §3.3 and Chapter 4 (`libs/shared/catalog/src/data/tools-aifg-a.json`)
and the four `path.cost` rows of `tools-aifg-b.json`; WO-015's Design and
WO-028-D009 in the target's `docs/dotln/`.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
the scene, chooses Draw wall and drags a wall across the field between the
units and the objective, then places two obstacles; they select a squad,
give it A* from the rail's new `ways` group and set the objective beyond the
wall; the units route around the wall's end, past the obstacles, and
arrive, the chosen unit's path drawn faintly ahead of it and the instruments
showing path length and replans; they turn on "show search" in the
inspector and see the cells the last search expanded; they drag another
wall across that path while the squad moves and watch the squad replan
around it; they close the gap entirely and read, in the inspector's notice
and in each unit's row of the text layer, that there is no route, the units
stopping where they are; they clear the walls and the squad moves again.
They give a second squad Obstacle and wall avoidance instead of a path and
watch it feel its way along the wall with its whiskers. They send two units
head on at each other and watch them part deterministically every time.
They save the composition, reload, open it, and the walls are there; they
run a trial with and without the wall from one seed and read the first
divergence. What the operator learns is how a route is found and followed
on a field with geometry, where it fails and what avoidance adds; what they
decide is whether a squad on this field is better served by a route or by
avoidance, and whether the cost functions need a cost layer to weigh.

**Observed gap (dated 2026-11-09 at `eb9d227`):** the scene's field has no
geometry: `SceneDefinition` is an id, a scene type, a 120 by 80 field, a
seed and twenty units, and the only walls are the field's edges
(`keepOnField`; `integrate` in `simulation.ts` zeroes the velocity into an
edge); the engine has no graph, no search and no path following
(`steering.ts` exports seek, matchVelocity, arrive, flee, separate, avoid,
wander and keepOnField; `interpretedKinds` are `steer.blend`,
`steer.priority`, `formation.twoLevel`, `formation.fixed` and
`objective.set`); `refusalOf` in `interpreter.ts` refuses a step whose
selection names no unit, `objective.set` alone excepted (line 305), so a
step that changes only the field would be refused. The catalog's Chapter 4
Pathfinding has 76 rows, one typed (`aifg-a:253` Cost functions, kind
`path.cost`, which no engine interprets) and none studied; four more AI for
Games rows are typed `path.cost` (`aifg-b:30` Terrain difficulty map,
`aifg-b:48` Tactical pathfinding, `aifg-b:49` The cost function, `aifg-b:50`
Tactic weights and concern blending), so interpreting the kind brings five
rows to the rail, each with a selection face naming a region; `aifg-a:247`
Tile graph is `status: background`, `kind: sceneElement`, and
`tool-v1.schema.json` forbids `faces` on a background row. The scene kinds
are listed three times: `sceneTransformKinds` in
`libs/shared/models/src/lib/toolbox.ts`, `interpretedKinds`, and a copy in
`tools/scripts/catalog/check-catalog.mjs` (line 266) that computes
`catalog-summary.json`'s per-work `sceneTools` (AI for Games' lists the
sixteen rail tools); the summary's `counts` are checked against the
checkpoints, and `npm run catalog:join`, the only writer of the summary,
needs the research run's directory. `reading-mapper.ts` under
`libs/features/tools` labels every `TransformKind` in an object the enum
indexes, so the enum cannot grow without it. `avoid` in `steering.ts`
returns zero acceleration for exactly coincident projected centres, so two
units sent exactly head on pass through each other (WO-028-D009); the
Collision avoidance study's simulation calls `avoid`, and
`collision-avoidance.model.spec.ts` pins that zero (lines 137 to 157), in a
study whose presentation and spec WO-040 reshapes. Three shapes hold scenes
and none carries geometry: the fixture schema `scene-v0.schema.json` (scene,
cost table and known outcome), which `check-scene-fixtures.mjs` applies to
the three files it lists by name; browser storage (`StoredScene`, `version:
1`, under `dotln-angular.scene`) and the export (`scene-composition-v0`),
both read by `stored-scene.ts`, whose `isTrial` requires a series for every
name in `metricNames` (lines 52 to 72), so adding a metric would make every
saved composition holding a kept trial unreadable (ignored and reported,
then overwritten by the next save) and every such export refused. The
scene's visual baselines (`scene-360.png`, `scene-768.png`,
`scene-1440.png` and the three `scene-flocking-*.png` under
`apps/dotln-e2e/src/visual-baselines/darwin/`) are compared by
`npx nx e2e-visual dotln-e2e`, the review gate's visual command; `npx nx e2e
dotln-e2e` ignores `*.visual.spec.ts`. The facade spec pins the rail at
sixteen tools.

**Design:**

- **Geometry.** Two shapes, decided here as D006 asked: a wall is a
  segment with a thickness, an obstacle a disc; a rectangle is four walls.
  Drawn on the field with two field tools in the transport, Draw wall
  (press, drag, release; Shift snaps to the axes) and Place obstacle (click
  places, drag sets the radius), and Clear; every shape is also a row of a
  geometry list under the unit list in the text layer, with editable
  coordinates, so the keyboard reaches every edit (G1). A geometry edit is a
  step with its true tick, written as `objective.set` is, its `toolId` its
  kind and its selection empty: `field.wall` (`x1`, `y1`, `x2`, `y2`,
  `thickness`, `shape`), `field.obstacle` (`x`, `y`, `radius`, `shape`),
  `field.clear` (`shape`, or every shape when it is absent) and `field.grid`
  (`cell-size`, below). A step naming an existing `shape` replaces it, so an
  edited coordinate is a step too. `refusalOf` exempts the four field kinds
  from the no-units refusal as it exempts the objective, and `isSafeStep`
  gains least values for `thickness`, `radius` and `cell-size`. A
  composition therefore replays its walls where they were drawn, and a trial
  compares two branches of one seed with and without a wall. A shape drawn
  over a unit leaves it standing, and it may then move only in a direction
  that does not deepen the contact.
- **Saved scenes, and one rule for older ones.** Of the three shapes that
  hold scenes, none changes version. The fixture schema keeps `scene-v0`:
  geometry is made by steps, so the walls fixture is a known outcome
  (`scene-known-outcome-v0`) over `scene-twenty.json` whose branches carry
  the field steps, and `check-scene-fixtures.mjs` lists it. Browser storage
  (`version: 1`) and the export (`scene-composition-v0`) already admit a
  field step, since a `toolId`, a `kind`, an empty selection and numeric
  parameters pass `isStep`; a composition saved before this order reads as
  a field with no geometry. What does change is the metric set, so this
  order decides once how an older trial is read: `isTrial` requires a valid
  series for each of the eight metrics `scene-composition-v0` carried at
  `eb9d227` (`cohesionRadius` to `assignmentCost`) and accepts a trial that
  lacks a metric named after them, which the reader fills with a series of
  `null` as long as the trial's own; a series that is present is still
  validated. `null` is already the series' reading for "no value", so the
  trial compare shows such a metric as unknown. WO-037 follows this rule for
  its metrics.
- **The graph, under one clearance contract.** The Tile graph (`aifg-a:247`)
  stays what the catalog says it is, a background scene element with no
  faces: it is the field's own representation, not a tool applied to units.
  Its one setting, cell size, is a field setting in the field tools (default
  2.5, so the 120 by 80 field is 48 by 32 cells), changed by a `field.grid`
  step and replayed like geometry; the control names the Tile graph and links
  its reading. The graph is 8-connected with octile edge costs scaled by the
  cost weights, and is rebuilt when geometry or cell size changes (the field
  is small; a rebuild per edit is cheap and deterministic). One clearance
  test serves the graph, the smoothing and the physics: a cell is blocked
  when the unit's disc at its centre meets a wall or obstacle; an edge
  between two cells is traversable only when the swept unit, the disc moved
  along the segment between the two centres, clears every wall and obstacle,
  so a thin wall between two centres blocks the edge and not only the cells
  it covers; a diagonal move needs both of its orthogonal neighbours' edges
  traversable, so no route cuts a corner; smoothing keeps a shortcut only
  when its swept segment passes the same test; and the simulation's stop at
  geometry and the avoidance rays use that test too, so a route the search
  returns is one the body can walk. A search attaches both ends to the
  graph by the same test: it starts from the nearest traversable cell whose
  centre the swept unit can reach from where it stands and ends at the
  nearest such cell to the goal, and when no cell passes for an end it
  returns no route with the reason (`unreachable-start` or
  `unreachable-goal`), which the no-route state shows, so a replan never
  returns to a cell the body cannot enter; the graph's spec covers a unit
  that a thin wall separates from its nearest free cell. `graph.ts` also builds the same graph from a plain
  grid of blocked cells and cell costs, so a study can search a grid it
  describes (WO-045).
- **The cost functions.** `path.cost` multiplies the travel cost by its
  travel weight (`travel-cost`, `distance-weight`,
  `terrain-cost-multiplier`) and adds its layer weights (`danger-cost`,
  `visibility-cost`, `danger-weight`, `exposure-weight`,
  `cover-shortfall-weight`) times layers that are uniform zero until an
  influence-map order lands one. The five rows' selection face names a
  region, which the field does not have, so a cost step applies to the
  selected units' searches. The inspector's preview row says in words that
  the layers are uniform and that a weight scaling every edge alike changes
  how far the search trusts its heuristic (its expansions, and with a weight
  below one possibly its route) rather than where the ground is dear.
- **The search.** A* with a pluggable heuristic (`zero`, `manhattan`,
  `euclidean`, `octile`), Dijkstra as the zero heuristic, path retrieval by
  back-tracking, line-of-sight smoothing; the search's open and closed sets
  per expansion kept for the painter's frontier layer and for WO-045's
  `grid` family. Integer-friendly arithmetic and the engine's own `sine` and
  `cosine`, never native `Math.sin` or `Math.cos`, so the known outcome
  reproduces on every machine (scene rules).
- **Following and replanning.** `path.follow` seeks the next waypoint
  within `waypoint-radius` and arrives at the last; the predictive variant
  looks `predict-time` ahead along the velocity; a unit replans when a
  geometry or cell-size step lands, when the objective moves or when the
  geometry stops it on its path (its swept step blocked), counted in
  `replans`; no route sets the unit's activity to `blocked`, with a text
  equivalent in its row, a notice in the inspector naming the unit and the
  reason, and a count in the instruments (`blockedUnits`); walls and
  obstacles stop a unit dead in that direction as the field's edge does, so
  a pinned unit reads as stopped. `pathLength` is the focus units' mean
  remaining route length, `null` when none follows a route.
- **Avoidance.** Obstacle and wall avoidance (`aifg-a:137`) casts a ray of
  `look-ahead` and, when `whisker-angle` is above zero, two whiskers at that
  angle, against the geometry through `geometry.ts`'s ray cast, and steers
  for a point `avoid-distance` off the nearest hit along its normal, weighted
  by `obstacle-avoidance-weight` in the avoidance group. Collision avoidance
  (`aifg-a:134`) names the existing closest-approach avoidance as a rail
  tool of its own. The head-on policy (D009): when two bodies' projected
  centres coincide, or their centres do, the pair takes one normal in world
  coordinates, the perpendicular of the offset from the earlier unit in the
  scene's unit list to the later (`SteeringBody` carries no id, and the list
  is the definition's order), or the world x-axis when that offset is zero,
  and the earlier unit steers along it while the later steers against it, so
  the two corrections are opposite in world space whatever the headings and
  the bodies separate. The policy is a steering function of its own that
  runs `avoid` and adds the side only where `avoid` is silent for that
  reason, and the simulation's avoidance term calls it; `avoid` is
  unchanged, so the Collision avoidance study, which calls `avoid` and pins
  its zero, renders at this order's candidate as at the base, and WO-045
  makes its comparison the policy's regression. The regressions in
  `steering.spec.ts` cover exact head-on with opposite headings, initial
  overlap, ordinary offset crossings and a replay of each, every one
  asserting that the pair's separation grows from the first frame after the
  policy fires and that no later frame overlaps.
- **The rail and the inspector.** Seven rows typed: `path.find` for A* with
  `heuristic` (unit `0 zero; 1 manhattan; 2 euclidean; 3 octile`, default 3,
  read as choices as the pattern parameter is) and for Dijkstra with no
  heuristic parameter, which the interpreter reads as zero; `path.smooth`
  for Path smoothing with `max-skip`; `path.follow` for Path following with
  `waypoint-radius` and `path-offset` and for Predictive path following with
  those and `predict-time`; `steer.blend` for Obstacle and wall avoidance
  with `obstacle-avoidance-weight`, `look-ahead`, `whisker-angle` and
  `avoid-distance`, and for Collision avoidance with `avoidance-weight`. The
  transform enum grows by a recorded decision in `tool-v1.schema.json` and
  `TransformKind`; the three lists of scene kinds (`sceneTransformKinds` in
  `models` and in `check-catalog.mjs`, `interpretedKinds`) name the same
  nine; `readsParam`'s tables read every parameter of the twelve tools that
  join the rail, so a new tool needs no new code; `catalog-summary.json`'s
  `counts` and AI for Games' `sceneTools` are rewritten to what
  `checkSummary` computes from the checkpoints, with `check-catalog.mjs`'s
  exported `readCheckpoints`, `catalogCounts` and `summarizeWork` run inline
  (no new script), and the summary's `date` stays the day the join last
  wrote it, as `catalog.md` §Data and provenance says. `reading-mapper.ts`
  and `scene-labels.ts` label the four new kinds through `tools.transforms.*`
  and `scene.inspector.*` messages. `railGroupOf` places the path kinds in a
  new group, `ways`, and a tool with `obstacle-avoidance-weight` in `avoid`.
  The inspector shows a route's parameters and preview rows (path length,
  expansions, the first waypoint), the cost row in words, and a "show search"
  toggle.
- **The painter and the text layer.** The canvas draws walls as bars and
  obstacles as discs in the field tokens, the chosen unit's path as a faint
  polyline, and, when "show search" is on, the last search's frontier and
  closed cells shaded; nothing animates at rest (G2); the text layer's
  geometry list and each unit's route state (on path, replanning, no route)
  are the accessibility surface (G1). Every new string on screen, the notice
  and the route states included, is a message in
  `apps/dotln/public/i18n/en.json` (rule 9).
- **Design brief and the first pair** (WS-001 rule 25, at the operator's
  sizes, rule 29): the field stays the page. A: the field tools sit in the
  transport beside Play, Pause and Step, and the geometry list sits under
  the unit list; B: a Field tab in the right column, beside the inspector,
  holds the tools and the geometry list. One variable, where field editing
  lives; both rendered at about 2080 by 1460 and at 360, read at 3840 by
  1620; A then B with the round named; the operator's preference makes the
  next pair; content and usability before polish; the rounds continue until
  the operator says the process is done, the rejected implementation leaves
  the code when its round is decided, and the decisions file records each
  round. If the operator delays the rounds,
  the order records the first pair without a pick, ships A, removes B's
  implementation with its screenshots and record kept, and carries the
  rounds as a follow-up, this order's own criterion run later as exactly that (rule 25). The rule of cool (rule
  28) applies to this scene order in both directions.
- **Fixtures and determinism.** `walls-known-outcome.json`: branch A a
  squad given A* and an objective beyond walls and obstacles drawn at tick
  0, branch B the same with a `field.wall` sealing the gap later; the file
  and the existing known outcome regenerated with `WRITE_SCENE_FIXTURES=1`,
  the reason stated in the pull request. `hashFrame` still hashes the units
  alone: geometry does not move, and the first divergence of a trial with
  and without a wall is the first frame a unit moves differently. A run
  with no field step is unchanged by this order, so `trial-known-outcome.json`
  keeps its hashes and gains only the three new metrics' series.

Rejected: a navigation mesh (axis: the tile graph is the chapter's first
representation, cheap to rebuild and honest at the field's size; a mesh is a
later tool when a scene needs it); polygon obstacles (axis: segments and
discs cover the book's ray examples and keep the tests simple, and a
rectangle is four walls); replanning every tick (axis: replan on a geometry
or objective change, deterministic and cheap); walls as catalog tools (axis:
geometry is the field's, not a concept's; the rail offers only tools the
engine runs on units); the Tile graph as a rail tool (axis: `aifg-a:247` is
a background scene element, the tool schema forbids faces on it, and cell
size belongs to the field); a geometry field in the scene definition or the
stored composition with a version step for each (axis: the steps already
carry geometry with its tick, and a snapshot beside them would be a second
record of one fact that could disagree); a storage or export version step
for the new metrics (axis: `null` already reads as no value, and a version
per added metric would move storage on every scene order); the head-on
policy inside `avoid` (axis: it would change the Collision avoidance
study's output and spec, files WO-040 reshapes, in an order that runs
beside it); the head-on fallback inside the study model (axis: D009, the
study demonstrates the engine); the `grid` family and the A* study in this
order (axis: they live in `libs/features/tools`, which rule 15 keeps apart
from the engine and the scene feature, they share only the pathfinding
module with this order, and the two outcomes together were estimated at
more than the largest cycle closed in this workspace; WO-045 takes them).

Live-run surfaces at the base: the scene with sixteen rail tools, the
trial compare and a saved composition; the catalog's readings of the rows
this order types.

**Deliverables:** the engine modules and their specs; the typed rows, the
grown enum, the three equal kind lists and the rewritten summary; the field
tools, the geometry list, the rail group, the inspector's views and notice;
the painter's layers; the older-trial rule in `stored-scene.ts`; the walls
known outcome and the regenerated known outcome; the regenerated scene
baselines; `docs/evidence/WO-036/` with the design record, `walkthrough.md`
and its screenshots; the documents.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-036: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor
   eb9d227483e30164105da077f50673789d1e5c9f origin/main` exits 0 (the pin is
   WO-039's merge; a `main` that does not contain it stops for a planning
   pass); the target worktree then fast-forwards to the target's `main`,
   and that integrated commit is the baseline of every later comparison
   until a later integration of `main` replaces it; then the route guard
   and activation as WO-005 step 1; read the harness usage and record the
   subagent remainder. Check: the decisions carry them.
2. `libs/shared/scene-engine/src/lib/types.ts` and a new `geometry.ts`:
   `SceneGeometry` (walls, obstacles, cell size), `SimulationState.geometry`
   starting empty in `createSimulation`, the `blocked` activity, the
   frame's geometry; the swept-disc clearance test and the ray cast with a
   spec. Check: `npx nx test scene-engine` exits 0.
3. `interpreter.ts`: the four field kinds applied to `geometry`, exempt in
   `refusalOf` beside `objective.set`, `isSafeStep`'s least values for
   `thickness`, `radius` and `cell-size`. Check: `npx nx test scene-engine`
   exits 0 with a spec that a `field.wall` step with an empty selection
   applies and a `steer.blend` step with an empty selection is still
   refused `no-units`.
4. `libs/features/scene-data-access/src/lib/stored-scene.ts`: `isTrial`
   under the older-trial rule, the reader filling a missing later series
   with `null`. Check: `npx nx test scene-data-access` exits 0 with specs
   that a stored value whose kept trial carries only the eight series at
   `eb9d227` restores complete with the new series `null`, that the same
   trial in an export imports, and that a present series holding a string
   is still refused.
5. `graph.ts` and `pathfinding.ts` with the heuristics, Dijkstra, retrieval,
   smoothing and the per-expansion trace; a spec on a fixed field with a
   wall asserting the path, the expansions, the no-route case, a thin wall
   between two cell centres (no edge across it), a diagonal past a blocked
   corner (refused) and the graph built from a plain grid. Check:
   `npx nx test scene-engine` exits 0.
6. `path-following.ts`, then `simulation.ts` (the stop at geometry,
   replanning, the `blocked` activity) and `metrics.ts` (`pathLength`,
   `replans`, `blockedUnits` added to `metricNames`). Check: a spec drives a
   unit around a wall to the objective, a sealed unit to `blocked`, and a
   unit the geometry stops on its path to a replan.
7. `steering.ts`: wall avoidance and the head-on policy as its own
   function, `avoid` untouched, the simulation's avoidance term calling the
   policy; and, with the steering open, WO-015-D010's follow-up in
   `steering.ts` and `simulation.ts`: a crowd under priority steering comes
   fully to rest and a settled crowd sent somewhere near starts promptly
   (D010 names two candidates, a speed limit from the clearance ahead or
   the unit's own steering blending under separation; the choice is
   recorded in the decisions file). Check: `steering.spec.ts` covers exact
   head-on with opposite headings, initial overlap, an ordinary offset and
   a replay of each, asserting physical separation, and the specs of
   criterion 3 for the crowd at rest and the re-targeted crowd; `npx nx test scene-engine` and
   `npx nx test tools` exit 0; `git diff --quiet <latest integrated main> --
   libs/features/tools/src/lib/studies` exits 0.
8. `libs/shared/catalog/src/data/tools-aifg-a.json` (the seven rows typed),
   `libs/shared/catalog/src/schema/tool-v1.schema.json` (the enum),
   `TransformKind` and `sceneTransformKinds` in
   `libs/shared/models/src/lib/toolbox.ts`, `sceneTransformKinds` in
   `tools/scripts/catalog/check-catalog.mjs` and `interpretedKinds` in
   `interpreter.ts` (a decision records the enum's growth), `readsParam`'s
   tables. Check: `npm run catalog:check -- --partial` exits 0;
   `npx nx test scene-engine` exits 0.
9. `libs/shared/catalog/src/data/catalog-summary.json`: `counts` and AI for
   Games' `sceneTools` computed inline from the checkpoints with
   `check-catalog.mjs`'s exported functions, `date` unchanged, then
   `npx prettier --write libs/shared/catalog/src/data`. Check: `npm run
   catalog:check` and `npx nx test catalog` exit 0.
10. `reading-mapper.ts` (one `#transforms` entry per new kind),
    `scene-labels.ts`, the `tools.transforms` and `scene.inspector` messages
    in `apps/dotln/public/i18n/en.json` and their copies
    `libs/features/tools/testing/src/lib/tools-en.json` and
    `libs/features/scene/testing/src/lib/scene-en.json`. Check:
    `npx nx test tools`, `npm run i18n:check` and
    `node --test tools/i18n-copies.test.mjs` exit 0.
11. `libs/features/scene/src/lib/mappers/tool-mapper.ts` (`railGroupOf`,
    `railGroupOrder`), `RailGroupId` with `ways` and its label; the facade
    spec's every-tool-at-defaults case reads the rail's list from
    `sceneTools('aifg')` filtered by `isRunnable` instead of a fixed
    sixteen. Check: `npx nx test scene` exits 0.
12. The field tools in the transport (candidate A), the geometry list, the
    inspector's route views, cost row, "show search" and notice, the
    painter's geometry, path and frontier layers. Check: `npx nx test scene`,
    `npm run lint:components` and `npm run i18n:check` exit 0.
13. The first rendered pair (A transport, B Field tab) at about 2080 by
    1460 and 360, read at 3840 by 1620; the rounds, or their deferral as
    the Design states; the rejected or unpicked implementation removed with
    its record. Check: `docs/evidence/WO-036/design/comparisons.md` exists
    and names the pair.
14. Fixtures: `libs/features/scene/src/testing/fixtures/walls-known-outcome.json`
    written by the engine's known-outcome spec under
    `WRITE_SCENE_FIXTURES=1 npx nx test scene-engine --skip-nx-cache`, with
    `trial-known-outcome.json` regenerated the same way, both formatted with
    `npx prettier --write` and read before commit; the scene feature's
    `known-outcome.spec.ts` reading the new file as it reads the old;
    `fixtureNames` in `tools/scripts/check-scene-fixtures.mjs` naming it, with
    a case in `tools/scene-fixtures.test.mjs` that a known outcome carrying a
    field step validates. Check: `npm run check:fixtures` and
    `npm run test:tooling` exit 0; a second run of the spec without the
    variable leaves both files byte-identical.
15. e2e `apps/dotln-e2e/src/scene.spec.ts`: draw a wall, route around it,
    replan when a second wall lands, no route when sealed, clear, save,
    reload and open with geometry, the head-on pair; axe; no overflow at
    360, 768, 1440 and the operator's sizes; then the scene's baselines
    regenerated on macOS with `npx nx e2e-visual dotln-e2e --
    --update-snapshots=all`, each image read at reading size before it is
    accepted. Check: `npx nx e2e dotln-e2e` and `npx nx e2e-visual
    dotln-e2e` exit 0.
16. The walkthrough as WO-020 step 11, under `docs/evidence/WO-036/`, with
    screenshots at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620.
    Check: the files exist.
17. Documents: `scene.md` (geometry as steps, the graph and its cell size,
    the search, following, avoidance, the policy, the older-trial rule),
    `scene-rules.md` (a field step is exempt from the no-units refusal; the
    stop rule; the head-on policy beside an unchanged `avoid`; a metric
    added later reads `null` in an older trial). Check:
    `grep -c "field.wall" docs/dev-reference/architecture/scene.md` is at
    least 1.
18. Dependency check as WO-015 step 15; `npm run check:bundle`; gate plain
    and review. Check: passing rows, no tracked-byte mutation.
19. Launchpad write-back (the profile's §The soldier scene implementation
    map and its rail count; WS-001 §Delivery states), then the publish,
    review and records steps as WO-007 steps 15 to 17, with the branch
    `feat/scene-walls-and-ways`, the title `feat: add walls, obstacles and
    pathfinding to the soldier scene`, `docs/evidence/WO-036/` and
    `docs/final-reviews/WO-036/`; the final reviewer commits the order's
    records on the order branch before `npm run resume -- target-records`
    (the profile's publish route, step 3). Check: `npm run test:docs` in
    the launchpad order worktree.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run typecheck:e2e`,
`npm run lint:fixtures`, `npm run lint:components`, `npm run check:fixtures`,
`npm run studies:check`, `npm run i18n:check`, `npm run test:tooling`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`, `npx nx e2e-visual dotln-e2e`;
in the launchpad order worktree `npm run test:docs`; then the target gate
plain and review once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session
   in the served production build: draw a wall and two obstacles, give a
   squad A* and an objective beyond the wall, watch the route and the
   arrival, turn on "show search", drag a second wall across the path and
   watch the replan, seal the gap and read the no-route state in the notice
   and the text layer, clear, give a second squad Obstacle and wall
   avoidance, send two units head on, save, reload and open the
   composition, run a trial with and without the wall. The VER report
   carries a `## Walkthrough` section with the dated steps and screenshots
   at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620 under
   `docs/evidence/WO-036/walkthrough/`, and states in the verifier's own
   words how the squad found its way, what it did when there was none and
   what the avoidance added, as read from the page alone. Met only when
   every step completed and that statement is present. Rule 28 applies: a
   sloppy or uncool scene fails here, and the verifier says so in their
   words; a UI issue at about 2080 by 1460 or 3840 by 1620 fails here
   (rule 29).
2. On `walls-known-outcome.json`, the known-outcome spec asserts that in
   branch A every unit of the squad reads `arrived` by the last frame with
   no frame placing a unit's disc inside a wall or obstacle, that the
   `pathLength` and `replans` series equal the fixture's, and that the frame
   hashes reproduce across two runs; that in branch B every unit of the
   squad reads `blocked` by the last frame and `blockedUnits` equals the
   squad's size; `pathfinding.spec.ts` yields no edge across a thin wall
   between two cell centres, refuses a diagonal past a blocked corner and
   asserts the expansions on its fixed field under the octile and zero
   heuristics; a unit the geometry stops on its path replans within the
   spec's ticks; and the `hashes` of `trial-known-outcome.json` equal those
   at the latest integrated `main`, so a run with no field step moves as it
   did: that fixture's one tool is the `steer.blend` row `aifg-a:145`, whose
   parameters weight separation, cohesion and velocity matching and give the
   avoidance term none, the engine's `avoid` is unchanged, and criterion 3's
   two changes act only where priority steering is placed or a step's
   parameters give the avoidance term a weight or a priority.
3. `steering.spec.ts` covers exact head-on, initial overlap, an ordinary
   offset crossing and a replay of each, asserting that the pair's
   separation grows from the first frame after the policy fires, that no
   later frame overlaps and that the sides are the same across runs; the
   engine's specs assert that twelve units under priority steering with
   Arrive come to rest, and that a settled crowd re-targeted nearby reaches
   its new objective no later than a plain Arrive from the same positions,
   both cases failing at the integrated base with both arms' exit codes
   recorded in the evidence README (WO-015-D010), the repair changing
   priority steering alone, so criterion 2's hashes hold;
   `npx nx test tools` exits 0, and `git diff --quiet <latest integrated
   main> -- libs/features/tools/src/lib/studies` exits 0, so the Collision
   avoidance study and its spec are as they were.
4. A composition exported after drawing geometry imports and replays its
   field steps at their ticks; a stored value and an export whose kept trial
   carries only the eight series of `eb9d227` restore and import with the
   later metrics as `null` series and the restore marked complete; a
   present series that is not numbers or `null` is still refused; and
   `npm run check:fixtures` passes with `walls-known-outcome.json` among the
   files `check-scene-fixtures.mjs` validates.
5. The rail offers exactly the AI for Games rows that are typed with a kind
   in `interpretedKinds` (the facade spec compares the offered ids with
   `sceneTools('aifg')` filtered by `isRunnable`), the path kinds in `ways`
   and the two avoidance rows in `avoid`; the facade spec's
   every-tool-at-defaults case passes with every parameter read; an engine
   spec on the known field shows a travel-weight `path.cost` step above one
   raising the search's expansions over the same search without it while the
   route's cells stay the same, the heuristic being the unweighted distance
   whatever the cost weights (the Design's cost functions), and the two rows
   that weigh only the uniform
   layers (`aifg-b:48`, `aifg-b:50`) leaving route, length and expansions
   unchanged, with the inspector's preview row saying which it is in words;
   `interpretedKinds` equals `sceneTransformKinds`; `npm run catalog:check`
   and `npx nx test catalog` pass with the seven typed rows and the
   rewritten summary; and `aifg-a:247` still reads `status: background`
   with no `faces`.
6. `npx nx e2e dotln-e2e` exits 0 with the step 15 cases, axe at the board
   spec's threshold and no horizontal overflow at 360, 768, 1440, about
   2080 by 1460 and 3840 by 1620; `npx nx e2e-visual dotln-e2e` exits 0, and
   the evidence README lists each regenerated baseline with what changed in
   it, every one a `scene-*.png`.
7. `npm run i18n:check` exits 0 and `node --test tools/i18n-copies.test.mjs`
   passes, so every new string on the scene is a message key with the
   testing copies equal to the app's catalog.
8. `docs/evidence/WO-036/design/comparisons.md` records the first pair (A
   transport, B Field tab) and either every later round with its pick and
   the operator's word that ended the rounds in the decisions file, or the
   pair without a pick and the operator's word that delayed the rounds with A shipped (rule 25); in either case the
   decisions file names the removed implementation's files and `ls` on each
   prints nothing.
9. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets, `npm run check:bundle` passes, and `package.json`'s
   `dependencies` keys equal the integrated base's.
10. `node scripts/target-gate.mjs WO-036 --review` records a passing row for
    every declared command with no tracked-byte mutation, and
    `npm run test:docs` passes in the launchpad order worktree; the
    Preflight line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-036/README.md`,
`design/`, `walkthrough.md` and its screenshots, and
`docs/evidence/WO-036/host-qualification.md`.

**Known issues and carry-ins:** This order takes the scene's one boarded defect, WO-015-D010's follow-up (register row `FUP-e9b95694a5de071e`): a crowd under priority steering keeps a faint shimmer and a settled crowd crawls when sent somewhere near; step 7 repairs it and criterion 3 judges it. The danger, visibility, exposure and cover
layers of `path.cost` are uniform until an influence-map order lands one (a
candidate in the filing pass's NoOps); the inspector says so, and two of
the five cost rows (`aifg-b:48`, `aifg-b:50`) weigh only those layers. The
`grid` family, the study record's version step, the A* study, the
inspector's study link and the two avoidance studies' carry-ins
(WO-034-D013, `FUP-4e24208e45d27a1d`, and the Collision avoidance
comparison as the policy's regression) are WO-045's, which depends on this
order's `pathfinding.ts` and `graph.ts`. This order is the road entry of a
lane pair whose side entry is WO-024, the concept-study batch, which adds
its family's words to the same `tools-en.json` copy, so the second to
publish integrates the target's `main`; WO-040 follows in the next pair. The
files this order edits under `libs/features/tools` are `reading-mapper.ts`
and `testing/src/lib/tools-en.json`, which the enum's growth forces and
WO-040 does not edit; the movement studies, `studyAifg/en.json`,
`study-en.json`, `flow.ts`, the motion drawing and `catalog.md`, which
WO-040 edits, are untouched here (criterion 3 holds the studies directory
to it). Both orders write WS-001's delivery states at write-back, and the
second publisher integrates the launchpad's `main`. WO-037 (shooting and
bullets) depends on this order's geometry and follows its older-trial rule.
The scene's known outcome is regenerated here with its reason in the pull
request. This order activates only on a launchpad whose starter carries
core WO-221's `--draft` form; the draft pull request and its workflow runs
are a final-review obligation read from `docs/evidence/WO-036/preview-pr.json`,
never a criterion. Before `target-records`, the final reviewer commits the
order's records on the order branch (the profile's publish route, step 3;
since starter v0.122.0 the filing refuses a source uncommitted at the
launchpad's `HEAD`). `Target release classification: minor` and `Target
release notes: reviewed` are set under WO-012's declared policy.

**Non-goals:** a navigation mesh, polygon obstacles or hierarchical
pathfinding; a 4-connected graph; influence maps and the danger layer;
shooting and bullets (WO-037); the `grid` family, any study, the study
record's schema and the inspector's study link (WO-045); a change to
`avoid` or to any study module; Babylon.js (candidate C2).

**Operator-review assumptions:** the operator accepts segments and discs
as the field's shapes, the tile graph as the field's representation with
its cell size a field setting, the head-on policy as written, and an
older saved trial showing the new metrics as unknown; judges the first
pair and ends or delays the rounds in their own words; and reads the one
draft pull request before final review, which the final publish reuses.


Filed from the launchpad Launchpad at commit 74aaf3eccf4736f9dcb3c4b81d315a685594b058, where this record's path was docs/work-orders/WO-036-scene-walls-and-ways.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
