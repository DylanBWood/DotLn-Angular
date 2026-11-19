# The soldier scene

`/scene` is the app's root and its first toy: twenty units on a dark field the operator can
put walls and obstacles on, a rail of the steering, path and formation tools the engine
runs, and instruments that show what each idea does to a group. The operator selects units
the way a real-time strategy game does, gives them a tool, and watches. Everything here is
built for trying things: a tool's parameters act on the units as they change, and any two
moments can be compared.

## The engine

`libs/shared/scene-engine` is pure TypeScript, tagged `type:util`, so every later scene
can reuse it and nothing in it knows Angular or the DOM. Three things keep it that way.
The tag lets it import only other `type:util` projects, so it holds its own types and
takes nothing from `models`. `libs/shared/scene-engine/vite.config.mts` runs its specs in
Vitest's `node` environment, with no Angular plugin and no DOM to reach for. And outside
its specs, no module in `libs/shared/scene-engine/src/lib/` imports a package at all,
which is a rule to keep rather than a check: nothing refuses an `@angular/core` import
([the scene rules](../../ai-reference/scene-rules.md)).
`simulation.ts` shows the result: one fixed step is a plain function from a state to the
next state, and a unit reads the frame before, so the order units are visited in cannot
matter.

| Module                               | Holds                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vectors.ts`, `random.ts`            | 2D arithmetic, a mulberry32 generator whose state is the seed it returns                                                                                                                                                                                                 |
| `steering.ts`, `blending.ts`         | Seek, arrive, flee, separation, velocity matching, collision avoidance and the head-on policy beside it, obstacle and wall avoidance, wander, what its neighbours add to a unit in a crowd; weighted blending clipped to the maximum acceleration; first-active priority |
| `geometry.ts`                        | Walls and obstacles as one shape model, its three clearance queries (standing, moving, a ray), and the stop at a shape                                                                                                                                                   |
| `graph.ts`, `pathfinding.ts`         | The tile graph over the field at its cell size, or from a plain grid; A* with its heuristics, Dijkstra as the zero heuristic, every expansion kept; line-of-sight smoothing; planning a route                                                                            |
| `path-following.ts`                  | Where a following unit aims, passing its waypoints, planning and planning again                                                                                                                                                                                          |
| `formation.ts`, `slot-assignment.ts` | Wedge, line and column; the two-level anchor; greedy assignment, most constrained first                                                                                                                                                                                  |
| `interpreter.ts`                     | A `CompositionStep` becoming a behaviour on units, or a change to the field                                                                                                                                                                                              |
| `simulation.ts`                      | One fixed step of 1/60 s, the `SceneFrame` a painter draws, and whether a scene is at rest                                                                                                                                                                               |
| `queries.ts`                         | What a feature may ask of a scene: a unit's squad, the slot table, who is free to take an order, which units touch                                                                                                                                                       |
| `run.ts`                             | A run in progress: the steps still to come, what falls due on a frame, and the latest refusal                                                                                                                                                                            |
| `metrics.ts`                         | Cohesion radius, collisions, heading variance, time to objective, stalled units, anchor to mean, slot error, assignment cost, path length, replans, blocked units                                                                                                        |
| `hash.ts`, `trial.ts`                | Frame fingerprints, first divergence, two branches compared over one window                                                                                                                                                                                              |

**How a tool becomes a behaviour.** `applyStep` reads a step's parameters by name:
`separation-weight` sets a blend term, `slow-radius` tunes one, `avoidance-priority`
ranks a group, `pattern` picks a formation, `heuristic` chooses a search's guess. No tool
has code of its own, so a catalog row with a known kind and known parameter names simply
runs. A later step on the same units overrides the terms it names and keeps the rest; a
blending or path tool takes a unit out of its formation, while priority steering wraps
whatever the unit already does, its formation included. A path step (`path.find`,
`path.smooth`, `path.follow`, `path.cost`) sets its own part of a unit's route whole, so a
parameter it does not carry reads as its default: Dijkstra's algorithm is A* with no
heuristic, and Path following is Predictive path following looking no time ahead; the cost
functions keep the weights a step does not name. `readsParam` says which names are read,
and a spec runs every rail tool at its defaults to prove none is silently ignored.

**The field is changed by steps too.** A wall, an obstacle, clearing shapes and the tile
graph's cell size are the steps `field.wall` (`x1`, `y1`, `x2`, `y2`, `thickness`,
`shape`), `field.obstacle` (`x`, `y`, `radius`, `shape`), `field.clear` (`shape`, or every
shape when it is absent) and `field.grid` (`cell-size`), each with its true tick and an
empty selection, written as the objective is. A step naming an existing `shape` replaces
it, so an edited coordinate is a step as well. They are not catalog transforms, since
geometry is the field's and not a concept's, so `fieldKinds` lists them apart from
`interpretedKinds`, and `refusalOf` exempts them from the no-units refusal as it exempts
the objective. A composition therefore replays its walls where and when they were drawn,
and a trial compares one seed with and without a wall. `hashFrame` still fingerprints the
units alone: geometry does not move, so the first divergence of such a trial is the first
frame a unit moves differently.

**Routes.** A wall is a segment with a thickness and an obstacle a disc, both held as a
segment and how far the shape reaches from it, and three queries measure clearance against
that one model alike: `touches` for a body standing, `clearMove` for a body moved in a
straight line, `castRay` for a ray. A cell is free when a unit standing at its centre
touches no shape; an edge between two cells is traversable only when the unit moved along
it clears every shape, so a thin wall between two centres cuts the edge, and a corner step
needs both of its side steps open; smoothing keeps a shortcut only when it passes the same
test, and so do a search's two ends, a follower's sight of its next waypoint and the stop
at geometry; the avoidance rays cast against the same shapes. A body a shape was drawn over
may move only in a direction that does not deepen the contact. The tile graph is eight-connected over the field at its cell size (2.5 by
default, so the field is 48 by 32 cells), with octile edge costs scaled by the cost
weights; it is built once for each geometry, field and radius. A search starts from the
nearest free cell the unit can walk to in a straight line and ends at the nearest one from
which it can walk to the objective, or there is no route, for one of three reasons: the
unit is hemmed in (`unreachable-start`), the objective stands too close to a shape for a
unit to stand there (`unreachable-goal`, decided at once, without trying every cell), or no
way round the walls reaches it (`no-path`). The end nearest a point is tried first, and the
rest are sorted once only when it fails. A* orders cells by
cost so far plus its heuristic's guess (`zero`, `manhattan`, `euclidean`, `octile`), and
the guess stays the unweighted distance whatever the weights, so a travel weight above one
makes the search expand more cells for the same route. Equally cheap routes are told apart
by a cost far below any real difference in length, favouring cells nearer the straight
line, so a weight or a better heuristic never changes which route comes back. The cost
layers that danger, visibility, exposure and cover weigh are uniform until an influence map
lands one. Every expansion is kept, the cell closed and the cells it put on the frontier,
for the painter's search layer and for stepping through a search.

**Following and planning again.** A unit given any path tool finds and follows a route to
the objective; with no seek or arrive of its own it reads arrive at one. It aims
`path-offset` along its current leg beyond where it judges itself to be (its position, or
`predict-time` ahead along its velocity), comes at each turn no faster than it can carry
round it, and arrives at the last waypoint; an aim that falls under its own body, as a
`path-offset` of zero gives a unit standing on its route, sends it to the waypoint the leg
ends at instead. It makes for the next waypoint once it is
within `waypoint-radius` of this one, or past it, and only when it can see the next one.
It plans again when a field step lands, when the objective moves, or when the geometry
stops it and it can no longer see the waypoint it makes for; each of those counts in
`replans`, the first plan does not. A unit with no route is blocked: its activity says so,
it is not counted stalled, and it leaves the objective's drivers. Nothing steers it, so it
brakes where it stands whatever else it carries, a blend with wandering in it or a
priority order; it keeps all of that, and goes on as it was composed once a step gives it
a way again. `pathLength` is the focus units' mean route
still to walk, unknown when none follows one.

A formation's assignment is the only record of who stands where. A two-level formation
that loses members moves its anchor to the centre of the slots still held, so nobody
moves and the anchor and the members' mean keep agreeing. A fixed formation's leader
follows nothing: given steering of its own it leaves the slots and still leads them. A
leader that nothing is steering for the objective heads there, whenever one is set, for
as long as it leads. Leaders and members keep the formation's own spacing, closer than a
crowd's. A unit a formation step places steers for its slot and nothing else, so it leaves
its route, as a path tool takes a unit out of its formation; a fixed formation's leader
steers for itself and keeps a route it has, and its followers go where it goes. A
two-level formation's anchor takes no route: it heads straight for the objective, so a
formation sent beyond a wall stalls at it and says so.

These rules are not in the catalog and are the scene's own:

- **Velocity matching needs motion to match.** A unit given it cruises at 40% of its top
  speed along its heading until an objective drives it. Without this a resting flock
  would pull together and stop, and the book's "group motion" would never appear.
- **Free-moving units turn back from the field's edge.** Everything is kept on the
  field; only cruising and wandering units, by blending or by priority, steer away from
  it. The edge, a wall or an obstacle stops a unit dead in the direction that would meet
  it and leaves it what slides along it, so a pinned unit reads as stopped.
- **Forces fade; they do not switch.** Arrive's wanted speed reaches nothing halfway
  inside the target radius, and separation, flee and the anchor's speed all fade to
  nothing at their edges. A force that switches at a line sets a settled group shivering
  across it for ever, and the run never rests.
- **Nothing coasts.** A unit nothing is steering brakes to a stop.
- **Separation under priority claims a unit on its push and adds only what cancels
  across the crowd.** The group fires when its push clears epsilon. Under it the unit's
  own steering keeps its whole pull, and each neighbour inside the separation threshold
  adds two things (`neighbourForces`): a push, divided by the share of the maximum
  acceleration it leaves free, so that it outgrows any pull before the two touch; and
  friction, which matches the pair's velocities faster the harder they press. Both are
  equal and opposite between the two of a pair, so a crowd's centre goes where its units'
  own steering takes it while no unit's sum passes its maximum acceleration, and at
  Arrive's defaults a settled crowd sent somewhere new, however near, starts as the same
  units would with no neighbours. One thing is taken from the unit's own steering: it is
  not asked about the speed the push gives it (`withoutCarriedSpeed`), wholly once the
  push reaches half the unit's maximum acceleration and in proportion below that, so the
  units a crowd carries along do not brake against it. At Arrive's defaults a settled
  crowd then reaches a near objective no later than the same units under Arrive alone,
  and a crowd packed round its objective keeps its spacing and comes to rest; the specs
  hold that for crowds of 3, 6, 7, 12 and 20 by the centre and for twelve units by the
  stopwatch. What the neighbours add fades in over the first epsilon past the claim, so
  nothing switches at a line. The rule does not reach every tuning of Arrive: at a slow
  radius of 3 or less such a crowd reaches a near objective a few frames after the same
  units under Arrive alone, and the case is boarded in `steering.spec.ts`. There the
  acceleration limit takes part of what the crowd asks for on its first frame; whether
  that is the whole cause, and whether another rule would close it, is not established.
- **Two units on a collision course always part.** Collision avoidance steers from the
  neighbour it predicts the soonest collision with; where that neighbour stands on the
  unit's centre, or will at their closest approach, there is no direction to steer, and
  the head-on policy beside it gives one: the perpendicular of the offset from the earlier
  unit in the scene's list to the later, or the world's x-axis when they stand on one spot,
  the earlier steering along it and the later against it. `avoid` itself is unchanged.
- **Obstacle and wall avoidance feels ahead and never runs at what it feels.** It casts a
  ray of `look-ahead` and, above a `whisker-angle` of nothing, two whiskers half as long,
  and steers for a point `avoid-distance` off the nearest hit along the surface's normal,
  fading as the hit nears the end of its ray. Unlike the book's seek of that point, it
  drops any part of the steering along the ray toward the hit, so a wall dead ahead is
  braked for and one met at a slant is turned from.
- **The objective is one point for the whole group.** Arrive sends each unit there, so
  units with no separation pile onto it, collisions and all. That is worth seeing.
- **A group arrives, not a unit.** A group has arrived when its centre is inside the
  target radius and it has nearly stopped, because twelve units cannot all stand inside
  a radius of one. Every part of
  it has to be there too, since a scattered group can start with its centre on the
  objective: a free unit within the crowd's reach of it, and a formation's anchor on it.
  A seeker has no brake and a wanderer never settles, so neither need slow. A group has
  also arrived when it has stayed slow for half a second round the objective, with its
  centre within the crowd's reach and everyone within twice that, which is as close as a
  wall or its own crowding will let it come.
- **The stopwatch times one run.** It restarts when a unit newly heads for the
  objective, not when units already on their way are retuned. A fixed formation's
  followers only copy their leader, so the leader alone is timed.
- **An anchor's step is a planning step.** The catalog gives an anchor's speed as
  distance per step; the engine reads that step as a quarter of a second, not a
  simulation tick.

## Shooting on the board

Select the pieces that will shoot, choose **Aiming and shooting** in **Fight**, then
click another glyph. Its roster number becomes the target of the recorded step.
The inspector also offers the same choice by keyboard. Choose **Objective point**
to use the current objective. Shots in the instruments belong to the pieces in
focus. Hits in those instruments count the contacts they made. Each unit's own
text row counts the contacts it received alongside its activity. Accuracy shows the percentage of shots
that made contact and stays unknown until the first shot.

The engine advances existing bullets before the units move. A straight streak
spends its remaining range, slows under drag and stops at the first standing
piece other than its owner or at field geometry. A unit contact produces a
brief radial spark. A wall or obstacle gets a chipped mark. The text layer counts
streaks in flight and both kinds of mark on the current frame.

The two assisted modes play the board animation in beats. **The firing solution**
and **Moving targets** choose one pose from the marked piece's clip. Drag
lengthens the streak's clip. **Iterative targeting** can choose a later pose
up to the **Later cues** setting. The inspector shows the planned clip duration,
the sampled frame for a marked piece, and whether range cuts the clip short.
Contact can end any streak early. Fire and Projectile trajectory share each
piece's speed setting. In an assisted clip the setting chooses two, three or four
beats. Selecting pieces with different speeds preserves each until the player
edits that control. A trial can replay the earlier branch's
dotted streaks behind the live branch and plot both accuracy series.

**Hits to knock out** defaults to zero. A positive setting retires a piece
on the hit that reaches that count. It stays on the board as a dim glyph,
stops moving and leaves its squad. A two-level squad lays out its pattern
again with its existing spacing and role costs. A fixed squad promotes the
next occupied slot if its leader went down. Moving a member by applying another
tool still follows the manual departure rule. Restart restores the original
roster and replays these changes at their recorded ticks.

## Determinism

A run is a seed and a list of steps. Each step records the true tick it was applied at,
so a replay applies it at exactly the same moment; steps take effect on the transition
to the next frame, which is why the first divergence between a branch before and after
an equip is the equip frame plus one. A step made on a frame with one already due goes
after it, which is the order a replay applies them in.
`libs/features/scene/src/testing/fixtures/trial-known-outcome.json` pins the frame hashes
and metric series of a flock, and `walls-known-outcome.json` those of a squad given A* round
a wall, with a branch in which the gap is sealed. `range-known-outcome.json` pins a three-piece volley across clear ground and against a wall. Bullet positions and velocities follow the units in the frame hash. Native `sin` and `cos` are kept out of the engine because the host's
C++ library rounds them differently by architecture, and a committed hash must
reproduce on every machine. `feel` reseeds every run and says so in the transport.

## The page around the engine

`libs/features/scene` is the sub-app. `containers/scene-page/scene-page.ts` reads one `vm`
from `facades/scene.facade.ts` and hands slices to the composites beside it: the rail,
the inspector, the instruments, the trial compare, the log and the unit list. In
`mappers/`, a flat module holds pure functions and a folder holds a component that
chooses a sentence.

## The renderer seam

`SceneRenderer` is `draw(frame, selection, ghost?)`, `resize` and `dispose`. The engine
emits a frame; a renderer shows it.

- `CanvasSceneRenderer` paints one pass per frame on a 2D context, with no element per
  unit: walls as bars and obstacles as discs, the last search's closed cells and frontier
  when the inspector shows it, the selected units' routes as faint dashed lines, the
  objective and its ripple, slots and the anchor, fading trails, the avoidance rays and
  where they hit, arrowheads in the role colours with selection rings, and sparks where
  units overlap. It reads its tokens when the surface is sized, never per frame.
- `TextSceneRenderer` turns a frame into rows. It holds plain rows, not a signal, so the
  facade can publish a whole sample in one write.
- `NullSceneRenderer` draws nothing and remembers what it was given. jsdom has no 2D
  context, so specs run with this one.

`wrappers/scene-canvas/` owns the only `<canvas>`. A WebGL or Babylon.js painter later
implements the same interface behind a dependency decision.

## The clock and the frame loop

`SceneClock` gates a driver with play and pause and takes steps by hand. There are three
drivers: animation frames (at most four fixed steps per frame, so a hidden tab does not
race to catch up), a manual `tick(n)`, and a virtual-time driver over any RxJS scheduler.

`SceneFacade` folds the clock's ticks and its own commands into a run with `scan`. Each
fold reaches two places. `frames$` goes straight to the painter, outside change
detection. A sample of it goes to the page: every sixth driver frame while running and
every change when still, in one signal write, so zoneless change detection runs at most
once per frame and usually ten times a second. The run pauses itself once nothing moves
or would move, so nothing animates at rest. Some runs never get there: a seeker overshoots
for ever, a wanderer wanders, and a wedge of twenty at the widest spacing, too big for the
field, keeps turning.

The facade is provided on the route, so the scene survives a visit to the catalog; the
page pauses it on leaving, so it never runs unwatched.

## Playing with it

- **Selecting:** drag a marquee, click, shift-click, double-click for a unit's group, or
  Tab and Space through the text layer. Escape clears.
- **Sending:** a right-click sets the objective and gives the selected units Arrive, as a
  strategy game's move order does. Units in a formation need no order: their anchor
  follows the objective.
- **Building the field:** the field tools in the transport draw a wall (press, drag,
  release; Shift keeps it straight across or down), place an obstacle (a click places one,
  a drag sets its radius) and clear the walls and obstacles, and set the tile graph's cell
  size, whose name links the Tile graph's reading. Every shape is also a row of the
  walls-and-obstacles list under the unit list, its numbers editable and the shape
  removable from the keyboard, with a wall or an obstacle addable there too; a size below
  what the engine takes is put back, and an edit keeps the shape's other numbers as they
  are, not as the list rounds them. The log tells taking one shape away from clearing the
  field.
- **Routing:** a tool from the rail's ways group sends the selected units round whatever
  stands in the way. The inspector says how many have a route, how long, what the first
  one's search expanded and where it heads next, words a cost function's weights, and
  names every unit with no route and why. Show search shades the cells and frontier for
  the search named in the inspector. After Restart, both follow the selected units' recorded
  routes through playback and pause. While paused, they preview Apply before a route exists
  or when the operator edits a path parameter. The units keep following their recorded routes
  until another step reaches them.
- **Live tuning:** once a tool is applied, changing it reaches the same units at once. A
  slider acts on release, a pattern on the click. Each change is a step, so a replay
  does exactly what the operator did; the log folds a run of them into one line.
- **Comparing:** Compare runs the branch before the last equip (or the fork) against the
  branch after it from one seed over the ten seconds from the split, then takes the live
  run back to the split and plays it, with the other branch as a ghost, so the two can
  be watched parting. What comes before the split runs once and none of it is kept, so a
  late comparison costs the frames it has to run and no more memory than an early one.
  The charts take the instruments' place, so the field keeps its size.
- **Forming:** a formation tool lists the slots Apply would fill. Once applied the table
  is the formation's own, live while the units sort, with a running count beside Apply
  because the table can sit below the fold.
- **The coach line** names the next thing worth trying and goes quiet after a comparison.
  While a field tool is chosen it says how to draw with it instead, over the field, so
  choosing a tool moves nothing on the page.

Metrics read the selected units, or every unit when nothing is selected, and each
sparkline restarts when that changes. Time to objective stays unknown until the group
has arrived: a stopwatch still running is not the time to anything. Path length stays
unknown until a unit follows a route, and a comparison leaves the route figures out when
no unit in either branch had a route.

## The list of tools

The rail, the inspector and the `?tool=` reader share one list: `sceneTools('aifg')` from
the catalog, filtered by `isRunnable`, grouped as move, ways, group, avoid, form and fight. A `?tool=` naming anything else arrives with
nothing chosen and a notice saying why, reading the wider catalog only to name the
reason. Cohesion has no catalog row of its own; it is a weight of Flocking and Making
the creatures, and no rail entry is invented for it.

The route calls `provideCatalog()`, but only `CatalogToken` is injected: `CatalogStore`,
which comes with it, would write `dotln-angular.tools`.

## The store

`SceneStore`, in `libs/features/scene-data-access/src/lib/scene-store.ts`, holds the live
branch, the trial under comparison and the saved compositions. Compositions persist under
`dotln-angular.scene` through
`withPersistedState`, whose `writeOn` writes only when the count of saves changes, whose
`unreadable` reports a value that failed to parse or validate, and whose `unwritable`
reports a save that did not reach storage. An unreadable value is left exactly as it is
until a save replaces it, and the idle field renders. One unreadable composition costs
only itself. A save reads storage first, so it keeps what another tab has saved, unless
the last save failed and this tab holds the only copy.

`stored-scene.ts` is the only door in: storage and an imported text pass the same
validation. The shape is its own, and what the engine can run is the engine's, through
`isSafeStep`: numbers it can square, a time to target that is a real stretch of time, a
shape no smaller than nothing, a cell at least one unit across, and a last step inside
eight hours of play. `encodeExport` and `parseExport` own the export format, and an import
of another scene's composition is refused. Geometry is carried by field steps, so neither
storage (`version: 1`) nor the export (`scene-composition-v0`) changed version for it.

One rule covers a kept trial saved before a metric existed: it must hold a valid series
for each of the eight metrics the export carried first (`cohesionRadius` to
`assignmentCost`), any later series it holds is checked, and a later one it lacks reads as
a series of nothing as long as the trial's own, which is unknown wherever it is shown.

## The field skin

`[data-skin='field']` in `libs/shared/ui/src/styles/_field-skin.scss` is a token layer
over the plain skin: `--dotln-field-*` for the field itself, the plain tokens redirected
to them, and the role and work palettes lightened so they read on the dark ground. It
also reaches the shell around the page, through tokens set by
`html:has([data-skin='field'])`. Components change no behaviour for it ([rule G4](../../ai-reference/component-rules.md)). One CSS
rule is not a token: `[data-full-bleed]` on a routed page takes the main region's padding away,
in the app's own styles rather than the shell's.

Reduced motion stops anything starting by itself and turns off trails and ripples. The
text layer opens for it and for keyboard users, and it is present for everyone.

See [the scene rules](../../ai-reference/scene-rules.md) and
[the sub-app convention](sub-apps.md).
