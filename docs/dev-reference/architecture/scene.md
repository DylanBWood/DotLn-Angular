# The soldier scene

`/scene` is the app's root and its first toy: twenty units on a dark field, a rail of
the steering and formation tools the engine runs, and instruments that show what each
idea does to a group. The operator selects units the way a real-time strategy game
does, gives them a tool, and watches. Everything here is built for trying things: a
tool's parameters act on the units as they change, and any two moments can be compared.

## The engine

`libs/shared/scene-engine` is pure TypeScript, tagged `type:util`, so every later scene
can reuse it and nothing in it knows Angular or the DOM.

| Module                               | Holds                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vectors.ts`, `random.ts`            | 2D arithmetic, a mulberry32 generator whose state is the seed it returns                                                                                     |
| `steering.ts`, `blending.ts`         | Seek, arrive, flee, separation, velocity matching, collision avoidance, wander; weighted blending clipped to the maximum acceleration; first-active priority |
| `formation.ts`, `slot-assignment.ts` | Wedge, line and column; the two-level anchor; greedy assignment, most constrained first                                                                      |
| `interpreter.ts`                     | A `CompositionStep` becoming a behaviour on units                                                                                                            |
| `simulation.ts`                      | One fixed step of 1/60 s, the `SceneFrame` a painter draws, and whether a scene is at rest                                                                   |
| `queries.ts`                         | What a feature may ask of a scene: a unit's squad, the slot table, who is free to take an order, which units touch                                           |
| `run.ts`                             | A run in progress: the steps still to come, what falls due on a frame, and the latest refusal                                                                |
| `metrics.ts`                         | Cohesion radius, collisions, heading variance, time to objective, stalled units, anchor to mean, slot error, assignment cost                                 |
| `hash.ts`, `trial.ts`                | Frame fingerprints, first divergence, two branches compared over one window                                                                                  |

A unit reads the frame before, so the order units are visited in cannot matter.

**How a tool becomes a behaviour.** `applyStep` reads a step's parameters by name:
`separation-weight` sets a blend term, `slow-radius` tunes one, `avoidance-priority`
ranks a group, `pattern` picks a formation. No tool has code of its own, so a catalog
row with a known kind and known parameter names simply runs. A later step on the same
units overrides the terms it names and keeps the rest; a blending tool takes a unit out
of its formation, while priority steering wraps whatever the unit already does, its
formation included. `readsParam` says which names are read, and a spec runs every rail
tool at its defaults to prove none is silently ignored.

A formation's assignment is the only record of who stands where. A two-level formation
that loses members moves its anchor to the centre of the slots still held, so nobody
moves and the anchor and the members' mean keep agreeing. A fixed formation's leader
follows nothing: given steering of its own it leaves the slots and still leads them. A
leader that nothing is steering for the objective heads there, whenever one is set, for
as long as it leads. Leaders and members keep the formation's own spacing, closer than a
crowd's.

These rules are not in the catalog and are the scene's own:

- **Velocity matching needs motion to match.** A unit given it cruises at 40% of its top
  speed along its heading until an objective drives it. Without this a resting flock
  would pull together and stop, and the book's "group motion" would never appear.
- **Free-moving units turn back from the field's edge.** Everything is kept on the
  field; only cruising and wandering units, by blending or by priority, steer away from
  it. A wall stops a unit dead in that direction, so a pinned unit reads as stopped.
- **Forces fade; they do not switch.** Arrive's wanted speed reaches nothing halfway
  inside the target radius, and separation, flee and the anchor's speed all fade to
  nothing at their edges. A force that switches at a line sets a settled group shivering
  across it for ever, and the run never rests.
- **Nothing coasts.** A unit nothing is steering brakes to a stop. Priority gives the
  separation group a unit to itself, so round the objective the unit is heading for that
  group sheds its speed as well as parting it; without this a crowd boils there.
  Anywhere else it keeps its speed, so a group under priority still travels.
- **The objective is one point for the whole group.** Arrive sends each unit there, so
  units with no separation pile onto it, collisions and all. That is worth seeing. A
  group has arrived when its centre is inside the target radius and it has nearly
  stopped, because twelve units cannot all stand inside a radius of one. Every part of
  it has to be there too, since a scattered group can start with its centre on the
  objective: a free unit within the crowd's reach of it, and a formation's anchor on it.
  A seeker has no brake and a wanderer never settles, so neither need slow. A group has
  also arrived when it has stayed slow for half a second round the objective, with its
  centre within the crowd's reach and everyone within twice that, which is as close as a
  wall or its own crowding will let it come.
- **The stopwatch times one run.** It restarts when a unit newly heads for the
  objective, not when units already on their way are retuned. A fixed formation's
  followers only copy their leader, so the leader alone is timed.

An anchor's speed is given in the catalog as distance per step. That step is a planning
step, not a simulation tick; the engine reads it as a quarter of a second.

## Determinism

A run is a seed and a list of steps. Each step records the true tick it was applied at,
so a replay applies it at exactly the same moment; steps take effect on the transition
to the next frame, which is why the first divergence between a branch before and after
an equip is the equip frame plus one. A step made on a frame with one already due goes
after it, which is the order a replay applies them in. `trial-known-outcome.json` pins
the frame hashes and metric series. Native `sin` and `cos` are kept out of the engine because the host's
C++ library rounds them differently by architecture, and a committed hash must
reproduce on every machine. `feel` reseeds every run and says so in the transport.

## The renderer seam

`SceneRenderer` is `draw(frame, selection, ghost?)`, `resize` and `dispose`. The engine
emits a frame; a renderer shows it.

- `CanvasSceneRenderer` paints one pass per frame on a 2D context, with no element per
  unit: arrowheads in the role colours, fading trails, selection rings, sparks where
  units overlap, slots, the anchor, the objective and its ripple. It reads its tokens
  when the surface is sized, never per frame.
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
for ever, a wanderer wanders, a crowd under priority steering keeps a faint shimmer, and a
wedge of twenty at the widest spacing, too big for the field, keeps turning.

The facade is provided on the route, so the scene survives a visit to the catalog; the
page pauses it on leaving, so it never runs unwatched.

## Playing with it

- **Selecting:** drag a marquee, click, shift-click, double-click for a unit's group, or
  Tab and Space through the text layer. Escape clears.
- **Sending:** a right-click sets the objective and gives the selected units Arrive, as a
  strategy game's move order does. Units in a formation need no order: their anchor
  follows the objective.
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

Metrics read the selected units, or every unit when nothing is selected, and each
sparkline restarts when that changes. Time to objective stays unknown until the group
has arrived: a stopwatch still running is not the time to anything.

## The list of tools

The rail, the inspector and the `?tool=` reader share one list: `sceneTools('aifg')` from
the catalog, filtered by `isRunnable`. A `?tool=` naming anything else arrives with
nothing chosen and a notice saying why, reading the wider catalog only to name the
reason. Cohesion has no catalog row of its own; it is a weight of Flocking and Making
the creatures, and no rail entry is invented for it.

Only `CatalogToken` is injected. `CatalogStore` would write `dotln-angular.tools`.

## The store

`SceneStore` holds the live branch, the trial under comparison and the saved
compositions. Compositions persist under `dotln-angular.scene` through
`withPersistedState`, whose `writeOn` writes only when the count of saves changes, whose
`unreadable` reports a value that failed to parse or validate, and whose `unwritable`
reports a save that did not reach storage. An unreadable value is left exactly as it is
until a save replaces it, and the idle field renders. One unreadable composition costs
only itself. A save reads storage first, so it keeps what another tab has saved, unless
the last save failed and this tab holds the only copy.

`stored-scene.ts` is the only door in: storage and an imported text pass the same
validation. The shape is its own, and what the engine can run is the engine's, through
`isSafeStep`: numbers it can square, a time to target that is a real stretch of time,
and a last step inside eight hours of play. `encodeExport` and `parseExport` own the export
format, and an import of another scene's composition is refused.

In `mappers/`, a flat module holds pure functions and a folder holds a component that
chooses a sentence.

## The field skin

`[data-skin='field']` in `libs/shared/ui/src/styles/_field-skin.scss` is a token layer
over the plain skin: `--dotln-field-*` for the field itself, the plain tokens redirected
to them, and the role and work palettes lightened so they read on the dark ground. It
also reaches the shell around the page, through tokens set by
`html:has([data-skin='field'])`. Components change no behaviour for it (G4). One rule is
not a token: `[data-full-bleed]` on a routed page takes the main region's padding away,
in the app's own styles rather than the shell's.

Reduced motion stops anything starting by itself and turns off trails and ripples. The
text layer opens for it and for keyboard users, and it is present for everyone.
