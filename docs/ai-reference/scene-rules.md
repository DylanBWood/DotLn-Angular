# Scene rules

- The engine imports nothing from Angular or the DOM. `libs/shared/scene-engine` is
  pure TypeScript, `type:util`, with its own types and nothing from `models`.
- One signal write per frame at most. The facade publishes a sample of the run in
  one write; the painter takes every frame from `frames$`, outside change detection.
- The text layer is the accessibility surface. A canvas is a projection: everything
  it shows has a text equivalent on the page (units in `scene-unit-list`, formation
  state and the preview in the inspector, collisions in the instruments, the compared
  branch in the trial compare), and every state stays reachable by keyboard, the
  objective included.
- The rail offers only tools the engine runs. `isRunnable` is the one test, and the
  rail, the inspector and the `?tool=` reader all read the one list it admits. Keep the
  three lists of scene kinds naming the same kinds: `interpretedKinds` in the engine,
  `sceneTransformKinds` in `models`, and its copy in `tools/scripts/catalog/check-catalog.mjs`,
  which computes the catalog summary's `sceneTools`.
- A tool without a typed transform never executes. A step whose kind the engine does
  not interpret is refused with a reason naming the kind and leaves the run exactly as
  if it had never been made.
- Geometry is the field's and changes only by a field step (`field.wall`,
  `field.obstacle`, `field.clear`, `field.grid`) with its true tick and an empty
  selection. Field steps are exempt from the no-units refusal, as the objective is, and
  stay out of `interpretedKinds`, since no catalog tool carries them. Do not keep
  geometry anywhere else: the definition and the stored composition never hold it.
- One shape model in `geometry.ts` answers whether a body fits: every wall and obstacle
  is a segment and how far its body reaches from it, and three queries measure clearance
  against it alike, `touches` for a body standing (the graph's cells), `clearMove` for a
  body moving (the graph's edges, a search's two ends, smoothing, a follower's sight of its
  next waypoint and the stop at geometry) and `castRay` for the avoidance rays. Write no
  shape arithmetic outside it. Walls and obstacles stop a unit dead in the direction that
  would meet them, as the field's edge does, and a body a shape was drawn over may only
  move away from it.
- A live field edit passes `isSafeStep` before it is made, the gate the store reads a
  composition back through, so the page never records a step the store would refuse. A
  new shape is numbered past every shape a step of the composition names, the steps
  still to come included (`nextShapeNumber`).
- The head-on policy lives in `avoidCollisions`, beside `avoid`, which stays unchanged:
  the Collision avoidance study calls `avoid` and pins its zero.
- A unit with no route is steered by nothing, and that is decided in one place:
  `steeringOf` returns nothing for it, and the rule that nothing coasts brakes it,
  whatever it carries. Do not brake a blocked unit term by term or group by group: the
  term nobody thought of keeps it walking under a notice that says it stopped.
- What priority steering's separation group adds to a unit's own steering cancels
  between the two of a pair (`neighbourForces`: a stiffened push and friction). Keep it
  so, and scale no unit's own steering there: a crowd's centre then goes where its units'
  own steering takes it, and at Arrive's defaults a settled crowd sent somewhere near
  starts as fast as the same units with no neighbours. The one thing taken from a unit's
  own steering there is the speed the push gives it (`withoutCarriedSpeed`), so a carried
  unit does not brake against the crowd; its pull stays whole, or no crowd comes to rest.
  Arrive at a slow radius of 3 or less is still a few frames late, and boarded.
- Read a catalog tool through its parameter names, in `interpreter.ts`. A new tool
  should need no new code; a new parameter name goes in `readsParam`'s tables.
- Nothing leaves the browser. The only write is `dotln-angular.scene`, through
  `withPersistedState`, and only when the operator saves. A stored value that cannot
  be read is ignored, reported and left in place, and a failed write is reported too.
- Everything read from storage or an import passes `stored-scene.ts`, and a new
  parameter the engine divides by goes in `isSafeStep`. Do not hand the engine a
  composition any other way.
- A metric added later reads as a series of `null` in a kept trial saved before it
  existed: `stored-scene.ts` requires only the eight series the export carried first
  and fills the rest, so adding a metric never moves storage's or the export's version.
- Give forces an edge they fade to, never one they switch at. A force that switches at
  a line sets a settled group shivering across it, and the run never rests.
- Inject `CatalogToken`, never `CatalogStore`: the store persists reading state under
  another key.
- Determinism is the default. A run is its seed and its steps, and every step records
  the true tick, not the frame the page last sampled. Keep native `Math.sin` and
  `Math.cos` out of the engine: a committed frame hash must reproduce on every
  machine, and they differ by architecture.
- Regenerate the known outcomes only when a change to the simulation is intended:
  `WRITE_SCENE_FIXTURES=1 npx nx test scene-engine --skip-nx-cache`, then format what it
  wrote with
  `npx prettier --write libs/features/scene/src/testing/fixtures/trial-known-outcome.json libs/features/scene/src/testing/fixtures/walls-known-outcome.json`
  and say why in the pull request. An unchanged simulation leaves both files
  byte-identical after both. Read the result before committing it.
- `<canvas>`, `getContext(` and `OffscreenCanvas` belong to `wrappers/scene-canvas/`
  and nowhere else in the feature.
- Put appearance in `--dotln-field-*` tokens and the role and work palettes. The
  painter reads them through `getComputedStyle` when it is sized, never per frame.
- Nothing animates at rest. The run pauses itself once nothing moves or would move;
  seekers and wanderers never quite do, so those runs play on. Under reduced motion
  nothing starts by itself, and trails and ripples stay off.
- Keep the page free of label-value lists ([rule G6](component-rules.md)): instruments
  are watched, definitions are read, slots are compared in a table.

Run `npx nx test scene-engine`, `npx nx test scene`,
`npx nx test scene-data-access` and `npx nx e2e dotln-e2e`, then read the page at 360,
768 and 1440. A green suite does not show that it is any good to play with.

Read [the scene architecture](../dev-reference/architecture/scene.md).
