# WO-015 — The soldier scene: twenty units on a 2D canvas behind a renderer seam, a rail of the tools the engine runs with each tool's definition read from the catalog, real-time-strategy selection, flock, arrive and a two-level formation with slot roles, a deterministic seeded clock, before-and-after trials, the first real look, the root route, and the pure scene engine every later scene reuses

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ bc9133e932a00d33c15bc5289d683b8078f51ee4
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/scene-engine` (pure TypeScript), the `scene`
feature's page, layout, rail, inspector, text layer, canvas wrapper, log,
trial compare, facade, store, clock and tokens, the field skin's token layer,
four fixtures, the scene fixture check, two documents, one taxonomy
sentence, about 70 source files; adds no runtime dependency. Removes the
arriving page WO-013 shipped for `/scene`; moves the root redirect from
`/board` to `/scene`. Wall-clock: about 8 to 12 hours of executor work plus
the fixed cycle; unknown until run. Context bytes: WS-001 house rules 1, 5,
12, 14, 18, 24 and 25 and §The app and its sub-apps, design B §1 to §4 read
at the run's folder, the catalog types and the scene tools WO-019 types,
this order, about 180 KB. Commands added in the target: none. Tokens:
unknown until run. Steps: 17. Re-mints: none. Refutations paid: three (the
2026-10-24 pass's receipt on the first text, the 2026-10-26 pass's on the
rewrite, the 2026-10-28 pass's on this one).
**Nomination provenance:** the operator's decisions of 2026-10-24 (ignored
intake capture `docs/intake/notes/planning-2026-10-24.md`, SHA-256
`63b25fa11cbd648d224067c98d712b23e79734f35979cc8c9922566cc85e044c`, entry 9):
the soldier scene is a sub-app in its own right, twenty units, a tool rail
from the catalog, RTS selection, flock, arrive, formation, 2D first behind a
renderer seam with Babylon.js later; the baby example the operator gave on
2026-10-22. Design file this order builds from, read at the run's folder on
this machine (core's ignored intake, read-only; the digest pins what was
read): `out/angular/design-toolbox-toy-scene.md` §1 (the 2D canvas decision
and the clock), §2 (selection, equip, trial, compositions), §3 T1 and §4
(the first buildable slice), §5 (the shared substrate); SHA-256
`aab22ca10a41fa873c78e36e076a411b273a3bac49536e21e1b4949ba0f25253`; with
`out/process/toolbox-toy-scene-capture.md` (SHA-256
`7cc9b2c088d4efd00d813303fa291fd725a7e56915fd2e9e8ec3154bb679f67f`). The
design files are the operator's own research and lie outside the clean
room (WS-001 rule 23 as corrected on 2026-10-26). Planner-synthesized by the
2026-10-24 planning pass ([planning document](../planning/mining-run-orders-2026-10-24.md)
§6 D7 and §9); amended by the 2026-10-24 second pass and the 2026-10-25
pass for receipts 008 and 009. Rewritten by the 2026-10-26 pass
([planning document](../planning/acceptance-by-use-2026-10-26.md) §6 D7) on
the operator's direction of that day (capture SHA-256
`9ec78ddbc267936d59fc7fe88b4a8b9c8d42d4692979db31be5129c817fd72a6`): the
rail carries only tools the engine runs, with each tool's definition read
from the catalog; the "three tools per work" rail rule, which came from the
prompt core's session drafted for the operator and not from the operator's
statement, is gone with the clarify fixture; the order carries the
acceptance-by-use criterion (rule 24) and a design brief (rule 25); the root
route moves to the scene. Amended by the 2026-10-28 pass
([planning document](../planning/standard-pass-v0-100-0-2026-10-28.md) §6
D4 and D6): the design comparison reads as the operator corrected it in
WO-019 (the two chromes are the first pair of an ongoing process the operator
ends; the selected implementation alone remains after each decided round),
receipt 011's items are written in (one list, `sceneTools`, behind the rail,
the inspector and the `?tool=` reader, with a refused or unknown id arriving
with no tool chosen and a notice; criterion 7 counting the one remaining
chrome story), and the not-found page's link points home to `/scene` once
the root moves (receipt 011 on WO-014, item (c)). Opaque identifier, not a
priority.
**Depends on:** WO-019 merged (hard: the catalog's definitions and the
steering, formation and objective tools it types for this rail; the base
above is provisional: since starter v0.96.1 (core WO-230) the target publish describes the change from the merge base of the subject and the target's `main` and names the activation base beside it, so activation on this base publishes right; the planning pass that runs after WO-019 merges may set it to that merge commit, and none is required to (the 2026-10-24 second pass, D4)).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-019",
    "relation": "hard",
    "reason": "the catalog's definitions and the typed steering, formation and objective tools the rail and the engine's interpreter read; the base line is provisional and publishes right under starter v0.96.1's merge-base publish"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 1, 5, 8, 10, 12, 14, 15, 18, 24, 25; §Design: the Tipping Point
taxonomy, the wrapper sentence on browser drawing APIs; §The app and its
sub-apps and §Design direction); `docs/repositories/dotln-angular.md`;
`docs/operator/README.md`; the target's `docs/ai-reference/*`,
`docs/dev-reference/architecture/component-taxonomy.md` and `catalog.md`;
`libs/shared/models/src/lib/toolbox.ts` and `catalog-summary.json` at the
base; design B at the sections named above.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens the app and lands
on `/scene`: twenty units idling on a dark field that fills the page below
the shell's header, each labelled with a lifecycle role and coloured by it;
a narrow rail on the right lists the tools the engine runs, grouped by what
they do (move: seek, arrive, wander; group: separation, cohesion, velocity
matching, flock; avoid: priority steering; form: wedge, line, column, with
two-level and fixed formation and slot roles), each name in its work's
colour; an instrument strip along the bottom shows cohesion radius,
collisions, heading variance, time to objective and stalled units at their
idle values beside the seed and the transport. They drag a marquee round
twelve units (or click, shift-click, double-click a squad, Escape to clear,
or Tab and Space through the text layer below the field). They choose Flock
in the rail and the inspector shows the catalog's definition of flocking in
a readable measure, its five faces as a sentence, its three weights as
sliders with defaults, and ghost arrows on the selected units showing the
first frame's accelerations. They apply: the twelve pull together and move
as a group, the cohesion radius falls, collisions stay at zero, and a
sparkline under each figure shows the change. They click the field to set an
objective and apply Arrive: the group slows and stops inside the target
radius. They select eight more and apply Formation: wedge; the units sort
themselves into slots, the hardest to place first, while the slot table in
the inspector fills from the cost table. They open Compare and see the
branch before the equip as a ghost under the branch after, two series per
metric, with the first divergence frame marked; they keep the trial. They
save the composition, reload, and find it. Under reduced motion the field is
still until they press Step or Play; the same seed and the same steps
reproduce the same frames; nothing leaves the browser. A tool opened from
the catalog's "runs in the soldier scene" link arrives chosen in the rail.
What the operator learns is what each movement idea does to a group when
they can see it; what they decide is which ideas to keep and which to try
on the agents next.

**Observed gap (dated 2026-10-26; restated by the pass that sets the base):**
`/scene` renders WO-013's arriving page and the root redirects to `/board`,
whose recorded fixture reads unavailable for 13 of its 21 sources; no engine,
canvas, clock or scene feature exists; the workspace has no canvas, chart or
3D dependency and its unit tests run under jsdom, which has no 2D context;
at `1c3a4ff2` the catalog's steering and formation kinds have eight typed
tools and no `objective.set` row, so WO-019 types the rail floor (seek,
arrive, separation, velocity matching, wander, flocking, priority steering,
two-level formation steering, fixed formations, slot assignment and the
patterns) by decision before this order activates, and this order reads
them from `catalog-summary.json`'s `sceneTools`; WO-007's `withPersistedState`
is the single write path to browser storage; the operator has decided 2D
first and determinism as evidence, and on 2026-10-26 that every page is
accepted by use and briefed for its look.

**Design:**

- **Engine** (`libs/shared/scene-engine`, `scope:shared`, `type:util`,
  `@dotln-angular/scene-engine` and `/testing`; pure TypeScript, no Angular,
  no DOM): vectors and kinematics; steering (seek, arrive with slow and
  target radii, separation with linear or inverse-square falloff, velocity
  matching, wander on a seeded generator); weighted blending clipped to the
  unit's maximum acceleration; priority steering (the avoidance group first,
  silent when nothing fires); two-level formation (an anchor steered as a
  unit and moderated toward the members' mean, slots from a pattern,
  members arriving at their slots) with patterns wedge, line and column and
  a greedy most-constrained-first slot assignment over a cost table by role;
  fixed formation as the contrast; the objective (`objective.set`) as a
  target position on the scene; a fixed-step clock (1/60 s simulated per
  tick); `SceneFrame`; the transform interpreter (a `CompositionStep` with a
  `TransformKind` from the catalog becomes a behaviour on the selected
  units; a step whose kind this engine does not interpret is refused with a
  reason naming the kind, and the inspector shows the refusal on Apply
  instead of applying nothing silently; the rail never offers such a tool,
  so the refusal is reached only through an imported composition); metrics
  (cohesion radius, collisions, heading variance, time to objective, stalled
  units, anchor-to-mean distance, slot error, assignment cost); frame hash;
  first divergence between two branches. Its own types (`SceneDefinition`,
  `Unit`, `UnitState`, `SceneFrame`, `CompositionStep`, `Trial`) and nothing
  from `models`, so it stays `type:util`.
- **Renderer seam.** `SceneRenderer` (`draw(frame, selection, ghost?)`,
  `resize`, `dispose`) with `CanvasSceneRenderer` (one `draw` per animation
  frame on a 2D context; no retained DOM per unit; units as role-coloured
  glyphs with a short fading trail, selection rings in the accent, ghost
  arrows near-transparent), `TextSceneRenderer` (the DOM text layer the
  specs, Storybook and axe assert on) and `NullSceneRenderer` (tests). The
  engine emits a frame; the painters render it. A WebGL or Babylon.js
  painter later implements the same interface behind a dependency decision
  (candidate C2 of the 2026-10-24 planning document).
- **Feature** (`libs/features/scene`, replacing the arriving page):
  `scene-page` (container) over `SceneFacade`; `scene-layout` (slots field,
  rail, inspector, instruments, transport, text layer; the field fills the
  viewport below the header and the rest recedes; fluid); composites
  `toolbox-rail` (the tools from `catalog-summary.json`'s `sceneTools`
  whose kind the engine interprets, grouped move, group, avoid, form; each
  name in its work's colour; the chosen tool marked; a `?tool=<id>` query
  from the catalog's link chooses it on arrival, and one naming a tool the
  rail does not offer, refused or unknown, arrives with no tool chosen and a
  notice naming why; the rail, the inspector and that reader share the one
  filtered list, `sceneTools` as the interpreter admits it, so no second
  source of truth exists), `unit-inspector` (the
  tool's definition from the catalog in a 60ch measure, the faces as a
  sentence, the parameters as sliders with defaults and units, the preview
  rows, Apply, a note field whose text is kept with the composition),
  `instrument-strip` (each metric as a large figure with a small label and
  a sparkline of the last 600 frames; `unknown` admitted; the seed, Play,
  Pause, Step and the feel toggle at its left), `unit-list` (the text layer:
  one row per unit with id, role label, position and speed buckets, state,
  selected; Space toggles; rendered as a disclosure under the field, open by
  default under reduced motion and for keyboard users, present always),
  `tool-log`, `trial-compare` (two series per metric as inline SVG, the
  first divergence marked); wrapper `scene-canvas` (owns the `<canvas>` and
  the painter; pointer events emit `select`, `marquee`, `pointAt`; honours
  reduced motion); mappers `frame-mapper`, `tool-mapper` (a catalog `Tool`
  to the engine's behaviour), `metric-mapper`. `SceneFacade` holds signals
  for scene, selection, tools, selected tool, branch, trial, playing and
  frame number and exposes `select`, `toggle`, `marquee`, `setObjective`,
  `chooseTool`, `preview`, `equip`, `play`, `pause`, `step`, `fork`,
  `compare`, `save`, `exportJson`, `importJson`, `note`. The frame loop is an
  RxJS stream on the clock folded into frames, painted directly, and sampled
  into signals at the animation frame or slower, so zoneless change
  detection runs at most once per frame.
- **Store and clock.** `SceneStore` (`libs/features/scene-data-access`,
  `type:data-access`): a SignalStore whose live frame state is in memory and
  whose saved compositions and notes persist through WO-007's
  `withPersistedState({ key: 'scene', select })` under `dotln-angular.scene`;
  JSON export and import. A stored value under that key that fails to parse
  or to validate against the composition schema is ignored, the idle field
  renders and the tool log notes it; it is never thrown and never rewritten
  until the operator saves. `SceneClock` with three drivers: animation
  frame, manual `tick(n)` (specs and reduced motion), and RxJS virtual time
  (this order's own driver; WO-016's replay clock lands later over a generic
  `{ recordedAt }` shape and may adopt it, so nothing here waits on it).
- **Selection** shown twice, as rings on the canvas and as checked rows in
  the text layer; the unit's role label is what a person reads and its id is
  the DOM and test identity.
- **Determinism** by default: a seed shown in the transport; `feel` is a
  toggle that reseeds every run and is labelled as such; a trial compares two
  branches from one seed over the same frames and marks the first divergence.
- **Unit labels:** the lifecycle roles (8 executor, 4 verifier, 3 reviewer,
  2 repairer, 1 planner, 1 refuter, 1 release-close) as the fixture's
  default, with the board's five UIFA roles as a second label set the
  operator can switch; the label is a label, the behaviours come from the
  toolbox; the role colours are the one role palette every sub-app uses
  (rule 25).
- **The root route** moves from `/board` to `/scene` in `app.routes.ts`; the
  board keeps its route under the Machinery group and its e2e asserts its
  own path rather than the root.
- **Design brief** (WS-001 rule 25): the field is the page. A dark field
  token set (`[data-skin='field']` scoped to the scene region over the plain
  skin's tokens, so G4 holds: appearance is tokens, never behaviour) with
  the chrome receding; one role palette for the units, one work palette for
  the rail, both shared with the catalog and the machinery view; the
  instrument strip reads as instruments (large figures, small labels,
  sparklines), never as a definition list; a type scale with the tool's name
  as the inspector's largest element; motion only when something moves,
  nothing animated at rest (G2); the text layer present and legible but
  visually secondary. The comparison runs as the operator's eye doctor test
  (WS-001 rule 25 as revised on 2026-10-28): the first pair is the rail and
  inspector as one right column against the inspector as a drawer over the
  field's lower edge, built and rendered at 1440 and 360 during execution,
  presented as A then B with the round named in the question and both
  captions, one independent variable per pair; the operator's preference
  makes the next pair, content and usability before cosmetic polish, until
  the operator says the process is done, and a preferred candidate alone is
  not acceptance; the decisions file records each round's pair and pick, the
  rejected implementation leaves the code when its round is decided (its
  screenshots and an implementation record under
  `docs/evidence/WO-015/design/` are the history), and a decided choice is
  not relitigated for this order.
- **Fixtures** (`libs/features/scene/src/testing/fixtures/`): `scene-twenty.json`,
  `cost-table.json`, `trial-known-outcome.json` (expected metric series and
  frame hashes, generated once by the engine's spec and committed);
  `tools/scripts/check-scene-fixtures.mjs` (Ajv against `scene-v0.schema.json`)
  wired into `check:fixtures`.
- **Taxonomy:** a wrapper may own a browser drawing API such as `<canvas>`
  (the pass wrote the sentence into WS-001; this order adds it to
  `component-taxonomy.md`); the lint's wrapper rules admit `ElementRef`
  already.
- **Documents:** `docs/dev-reference/architecture/scene.md` (the engine, the
  seam, the clock, the loop's coalescing rule, determinism, how a tool
  becomes a behaviour, the field skin) and `docs/ai-reference/scene-rules.md`
  (the engine imports nothing from Angular or the DOM; one signal write per
  frame at most; the text layer is the accessibility surface; the rail
  offers only tools the engine runs; a tool without a typed transform never
  executes; nothing leaves the browser).

Rejected: WebGL or Babylon.js now (axis: the operator's decision, 2D first
with the painter behind a seam; a dependency decision is the operator's);
SVG for the field (axis: the later heat layer draws hundreds of cells per
frame, and canvas draws it as one image); a behaviour per role (axis: the
behaviours come from the toolbox, the label is a label); randomness by
default (axis: determinism makes the known outcome and the first divergence
checkable); the engine inside the feature (axis: every later scene reuses
it, and `type:util` keeps it free of Angular); a rail of three tools per
work with untyped tools as a special case (axis: the operator never asked
for it, it came from the drafted prompt, and a rail where most entries
refuse on Apply is the hollow page again); a clarify dialog answered from a
fixture (axis: a toy answers by running; a note the operator keeps is the
honest form until a live agent exists).

Live-run surfaces at the base: WO-006's served production build and
Storybook; WO-007's MSW worker; WO-013's menu; WO-019's catalog.

**Deliverables:** the engine with its specs and kit; the scene feature and
its data-access library with kits; the renderer seam and three painters; the
field skin's tokens; the three fixtures and their check; the taxonomy
sentence; the root route; the two documents; `docs/evidence/WO-015/` with
the walkthrough and its screenshots.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-015.
2. Generate `libs/shared/scene-engine` (`scope:shared,type:util`) and
   `libs/features/scene-data-access` (`scope:dotln,type:data-access`) with
   logged commands and testing entry points. Check: `npx nx show projects`
   lists both.
3. Engine: vectors, kinematics, steering, blending, priority, formation,
   slot assignment, the objective, clock, frame, interpreter, metrics, hash,
   divergence; specs for each known input (arrive stops inside the target
   radius; blending clips; priority is silent with nothing to avoid; the
   anchor stays within a bound of the members' mean; greedy assignment
   equals the hand-computed table; determinism over 600 frames; the
   interpreter refuses an uninterpreted kind with a reason naming it and
   leaves the next frame hash and the clock's tick count equal to a run
   without that step). Check: `npx nx test scene-engine` exits 0.
4. `SceneRenderer`, `CanvasSceneRenderer`, `TextSceneRenderer`,
   `NullSceneRenderer`; `SceneClock` with the three drivers. Check: `npx nx
   test scene` exits 0 with the clock's manual and virtual drivers.
5. Fixtures and `check-scene-fixtures.mjs`; `trial-known-outcome.json`
   generated once by the engine spec. Check: `npm run check:fixtures` exits 0.
6. `SceneStore` with `withPersistedState` for compositions and notes;
   `tool-mapper` from catalog `Tool` to behaviour. Check: `npx nx test
   scene-data-access` exits 0 including the persisted-state spec over a fake
   storage asserting the `dotln-angular.scene` key and no other write.
7. The field skin's token layer under `libs/shared/ui/src/styles/` and the
   role and work palettes as tokens; composites, the wrapper, mappers,
   layout, container, facade; stories `Twenty`, `ReducedMotion` and one
   story per chrome candidate while its round is open, the selected chrome's
   alone afterwards. Check: `npx nx test scene` exits 0;
   `npm run lint:components` and `npm run check:tokens` exit 0.
8. The rail reads `catalog-summary.json`'s `sceneTools` and keeps the tools
   whose kind the engine interprets, grouped move, group, avoid, form (a
   list whose floor is seek, arrive, separation, velocity matching, wander,
   flocking, priority steering, two-level formation steering with the
   wedge, line and column patterns, fixed formations and slot assignment);
   the inspector shows the definition and the preview arrows; equip appends
   a step; `?tool=<id>` chooses on arrival. Check: a facade spec applies
   flock to twelve units and the cohesion metric falls; a second asserts
   every rail entry's kind is interpreted.
9. RTS selection on the canvas and the text layer. Check: specs for click,
   shift-click, marquee, double-click, Escape and Space.
10. Trials: fork, compare, first divergence; export and import; notes.
    Check: the facade spec's export-then-import yields equal state.
11. Replace the arriving page in `sceneRoutes`; move the root redirect to
    `BasePaths.Scene` and the board's e2e to its own path; `scene.*` i18n
    keys; the not-found page's home link (WO-014's wildcard route) points to
    `/scene` with the root, and its routes spec and e2e case follow;
    `component-taxonomy.md` gains the wrapper sentence. Check: `npm
    run i18n:check` exits 0; `npx nx build dotln --configuration=production`
    exits 0; the routes spec asserts the root redirects to `/scene` and the
    not-found page links to it.
12. e2e `apps/dotln-e2e/src/scene.spec.ts`: the root lands on `/scene`;
    twenty rows in the text layer; Step advances the frame counter under
    reduced motion; the rail lists the floor of step 8 and nothing whose
    kind the engine refuses; a marquee selects at least two units and Escape
    clears; equip Flock changes the cohesion figure's text and its
    sparkline; a clicked objective and Arrive change time to objective; a
    saved composition survives a reload; `/scene?tool=<flock id>` arrives
    with Flock chosen and `/scene?tool=<unknown id>` with no tool chosen and
    the notice visible; an unknown path's page links home to `/scene`; axe
    at the board spec's threshold; no horizontal
    overflow at 360, 768 and 1440; the visual baselines for the chosen
    chrome. Check: `npx nx e2e dotln-e2e` exits 0.
13. The walkthrough: the executor performs the Objective's session in the
    served production build, saves one screenshot per step at 360, 768 and
    1440 under `docs/evidence/WO-015/walkthrough/` and writes
    `docs/evidence/WO-015/walkthrough.md` with the dated steps and what each
    metric did; the verifier repeats the session independently for
    criterion 1. Check: the files exist.
14. Documents: `scene.md`, `scene-rules.md`, pointers, `conventions.md`.
    Check: files exist.
15. Dependency check: `node -e` compares `package.json` `dependencies` keys
    with the base's and prints nothing when equal. Check: prints nothing.
16. Gate plain and review. Check: passing rows, no tracked-byte mutation.
17. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains the engine, the wrapper, the seam and the field skin;
    WS-001's delivery states updated by the final review. Check: `npm run
    test:docs`. Then the publish, review and records steps as WO-007 steps
    15 to 17, with the branch `feat/soldier-scene`, the title `feat: add the
    soldier scene with flock, arrive and formation`, `docs/evidence/WO-015/`
    and `docs/final-reviews/WO-015/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run check:tokens`, `npm run catalog:check`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session
   in the served production build in this order: open the root and land on
   `/scene`; marquee twelve units; choose Flock, read its definition, apply;
   click the field and apply Arrive; select eight more and apply the wedge;
   open Compare and keep the trial; save, reload, find the composition; open
   `/scene?tool=<flock id>` from the catalog's link. The VER report carries
   a `## Walkthrough` section with the dated steps and names the
   screenshots at 360, 768 and 1440 under `docs/evidence/WO-015/walkthrough/`
   (`ls docs/evidence/WO-015/walkthrough | wc -l` prints at least 12), and
   states in the verifier's own words what cohesion radius, collisions and
   time to objective did at each equip. The criterion is met only when
   every step completed and that statement is present; a step that could
   not be completed, a tool in the rail that refused on Apply, or a
   definition that could not be read in the inspector is unmet.
2. `grep -rlE "@angular|document\.|window\." libs/shared/scene-engine/src --include='*.ts' | grep -v spec`
   prints nothing, and `npx nx test scene-engine` exits 0 with specs that
   two runs from one seed and one step list produce identical frame hashes
   over 600 frames, that flock with the separation weight at zero yields
   collisions greater than zero within 600 frames while the default weights
   reach and keep zero after settling, that greedy slot assignment equals
   the committed hand-computed table, that the first divergence between a
   branch before and after an equip is the equip frame plus one, and that
   the interpreter refuses a step whose kind it does not interpret with a
   reason naming the kind while the next frame's hash and the clock's tick
   count equal those of a run without that step.
3. `libs/features/scene/src/lib/wrappers/scene-canvas/` owns the only
   `<canvas>` in the feature (`grep -rl "<canvas" libs/features/scene/src`
   prints exactly that component's file, and
   `grep -rlE "createElement\(['\"]canvas|OffscreenCanvas|getContext\(" libs/features/scene/src --include='*.ts' | grep -v spec | grep -v wrappers/scene-canvas/`
   prints nothing), `SceneRenderer` has `Canvas`, `Text` and `Null`
   implementations, and the feature's specs run with the null renderer
   under jsdom (`npx nx test scene` exits 0).
4. The facade's frame loop writes signals at most once per animation frame
   (a spec with the manual clock ticks 60 times and asserts at most one
   `vm` change per driver frame).
5. `npx nx e2e dotln-e2e` exits 0 and includes: the root landing on
   `/scene`; twenty rows in the text layer; Step advancing the frame counter
   under `reducedMotion: 'reduce'`; the rail listing every tool of step 8's
   floor and no tool whose kind the engine refuses (a spec asserts every
   rail entry's kind against the interpreter's set); a marquee selecting at
   least two units and Escape clearing the selection; equip Flock changing
   the cohesion figure's text; a clicked objective and Arrive changing time
   to objective; a saved composition present after a reload;
   `/scene?tool=<id>` arriving with that tool chosen and
   `/scene?tool=<unknown or refused id>` arriving with no tool chosen and a
   visible notice naming why; the wildcard page's home link landing on
   `/scene`; axe at the board spec's threshold; no horizontal overflow at
   360, 768 and 1440.
6. The persisted-state spec asserts every key written starts with
   `dotln-angular.scene` and no other storage, cookie or network write
   occurs, and a second spec seeds that key with a value that does not parse
   and with one of an older shape and asserts that the facade yields the
   idle twenty units; `grep -rlE "from 'node:|from \"node:|require\(" libs/shared/scene-engine/src libs/features/scene/src libs/features/scene-data-access/src --include='*.ts' | grep -v spec`
   prints nothing.
7. `grep -rlE "<dl|dotln-key-value-list" libs/features/scene/src` prints
   nothing (no label-value list on the scene); the decisions file records
   every comparison round's pair and the operator's pick, with the
   screenshots under `docs/evidence/WO-015/design/`, each decided round left
   only its selected implementation (no rejected chrome story, input or
   branch remains), and the container's stories file carries exactly one
   chrome story (`grep -c "Chrome" libs/features/scene/src/lib/containers/scene-page/scene-page.stories.ts`
   prints 1); `npm run check:tokens` exits 0
   with the field skin's tokens named `--dotln-field-*`.
8. `package.json`'s `dependencies` keys equal the base's (the step 15
   command prints nothing), and `npx nx build dotln --configuration=production`
   exits 0 within the declared budgets with the scene as a lazy chunk.
9. `docs/dev-reference/architecture/component-taxonomy.md` carries the
   sentence admitting a wrapper that owns a browser drawing API
   (`grep -c "drawing API" docs/dev-reference/architecture/component-taxonomy.md`
   is at least 1); `docs/dev-reference/architecture/scene.md` and
   `docs/ai-reference/scene-rules.md` exist and the rules file states that
   the rail offers only tools the engine runs (`grep -c "engine runs"
   docs/ai-reference/scene-rules.md` is at least 1).
10. `node scripts/target-gate.mjs WO-015 --review` records a passing row for
    every declared command with no tracked-byte mutation, and
    `npm run test:docs` passes in the launchpad order worktree; the Preflight
    line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-015/README.md`, `docs/evidence/WO-015/walkthrough.md` and
its screenshots, and `docs/evidence/WO-015/host-qualification.md`.

**Known issues and carry-ins:** The base line is provisional and publishes
right under starter v0.96.1 (the merge-base publish of core WO-230); a pass
may set it to WO-019's merge commit. If a tool the rail floor names arrives
from WO-019 untyped, this order types it with a recorded decision rather
than failing on the rail. The Babylon.js painter, the second populations
(DotLn's agents as units) and the pathfinding, heat and commander toys of
design B are later members (candidates C2 and C5 of the 2026-10-24 planning
document). Starter v0.96.1's plan gate no longer advises on this order's
own launchpad record paths; they stay as the kit names them and the publish
command's body file must not name them. From receipts 008 and 009, kept in
this text: a step whose kind the engine does not interpret is refused
visibly with its reason (the engine, step 3, criterion 2); the virtual-time
driver is this order's own and WO-016's replay may adopt it; the canvas
search covers `createElement`, `OffscreenCanvas` and `getContext` outside
the wrapper (criterion 3); a refused step leaves the frame hash and the
clock unchanged (criterion 2); a stored value that fails to parse yields
the idle field (criterion 6). From receipt 010: the rail distinguishes
nothing because it offers only tools the engine runs (its item (a)); the
clarify affordance is replaced by a kept note (its item (b)). From receipt
011 (the 2026-10-26 pass's refutation), carried into this text by the
2026-10-28 pass: one list, `sceneTools`, feeds the rail, the inspector and
the `?tool=` reader, and an unknown or refused id arrives with no tool
chosen and a notice (the rail bullet, step 12, criterion 5); the chrome is
chosen through the rounds of rule 25 as revised and criterion 7 counts the
one remaining story; the not-found page's link points home to `/scene` once
the root moves (step 11, criterion 5; receipt 011 on WO-014, item (c)). This order
activates only on a launchpad whose starter carries core WO-221's `--draft`
form; the draft pull request and its workflow runs are a final-review
obligation read from `docs/evidence/WO-015/preview-pr.json`, never a
criterion. `Target release classification: minor` and `Target release
notes: reviewed` were set by the 2026-10-24 pass under WO-012's declared
policy.

**Non-goals:** 3D or any rendering dependency; pathfinding, obstacles, a
commander, channels, an influence map; a live agent; persistence beyond
compositions and notes; any read of the platform or any write outside the
browser; a DotLn analog claim from a flock; the look of the board or the
shell beyond the shared palettes and the field skin's tokens.

**Operator-review assumptions:** the operator accepts the lifecycle roles as
the default unit labels with the UIFA set as a switch, determinism as the
default, the root route on the scene, judges the chrome through rendered
pairs during execution until they say the process is done, and reads the one
draft pull request before final review, which the final publish reuses.
