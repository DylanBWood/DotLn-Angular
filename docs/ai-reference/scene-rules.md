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
  rail, the inspector and the `?tool=` reader all read the one list it admits. Keep
  `interpretedKinds` in the engine equal to `sceneTransformKinds` in `models`.
- A tool without a typed transform never executes. A step whose kind the engine does
  not interpret is refused with a reason naming the kind and leaves the run exactly as
  if it had never been made.
- Read a catalog tool through its parameter names, in `interpreter.ts`. A new tool
  should need no new code; a new parameter name goes in `readsParam`'s tables.
- Nothing leaves the browser. The only write is `dotln-angular.scene`, through
  `withPersistedState`, and only when the operator saves. A stored value that cannot
  be read is ignored, reported and left in place, and a failed write is reported too.
- Everything read from storage or an import passes `stored-scene.ts`, and a new
  parameter the engine divides by goes in `isSafeStep`. Do not hand the engine a
  composition any other way.
- Give forces an edge they fade to, never one they switch at. A force that switches at
  a line sets a settled group shivering across it, and the run never rests.
- Inject `CatalogToken`, never `CatalogStore`: the store persists reading state under
  another key.
- Determinism is the default. A run is its seed and its steps, and every step records
  the true tick, not the frame the page last sampled. Keep native `Math.sin` and
  `Math.cos` out of the engine: a committed frame hash must reproduce on every
  machine, and they differ by architecture.
- Regenerate the known outcome only when a change to the simulation is intended:
  `WRITE_SCENE_FIXTURES=1 npx nx test scene-engine --skip-nx-cache`, then format what it
  wrote with
  `npx prettier --write libs/features/scene/src/testing/fixtures/trial-known-outcome.json`
  and say why in the pull request. An unchanged simulation leaves the file byte-identical
  after both. Read the result before committing it.
- `<canvas>`, `getContext(` and `OffscreenCanvas` belong to `wrappers/scene-canvas/`
  and nowhere else in the feature.
- Put appearance in `--dotln-field-*` tokens and the role and work palettes. The
  painter reads them through `getComputedStyle` when it is sized, never per frame.
- Nothing animates at rest. The run pauses itself once nothing moves or would move;
  seekers, wanderers and a crowd under priority steering never quite do, so those runs
  play on. Under reduced motion nothing starts by itself, and trails and ripples stay
  off.
- Keep the page free of label-value lists ([rule G6](component-rules.md)): instruments
  are watched, definitions are read, slots are compared in a table.

Run `npx nx test scene-engine`, `npx nx test scene`,
`npx nx test scene-data-access` and `npx nx e2e dotln-e2e`, then read the page at 360,
768 and 1440. A green suite does not show that it is any good to play with.

Read [the scene architecture](../dev-reference/architecture/scene.md).
