# WO-028 — Concept research I: the Movement chapter's next twenty, from AI for Games, drawn by the landed `motion` and `timeline` families, authored and checked by the research track's workers with no new page, family or design round

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes). The research track runs on
the operator's spare Codex capacity, so the intended route is
`drive: WO-028 --host codex` (the executor and its workers on `gpt-6.1-sol`
at `max`, the harness default); the attended phrases on either host are
admitted.
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 55b59c9133056c1d6471274a9676a7d5649196ac
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds twenty records under `libs/shared/catalog/src/studies/aifg/`
(the directory WO-020 made), twenty model modules with specs under
`libs/features/tools/src/lib/studies/movement/`, twenty rows in `studies-summary.json`, the work's record chunk under
`libs/shared/catalog/src/studies/` and the shared model registry
`libs/features/tools/src/lib/studies/study-models.ts` extended, the
inventory tests (`tools/studies.test.mjs`), the e2e counts (`catalog.spec.ts`)
and the catalog's visual baselines (`catalog.visual.spec.ts`) updated, one changed coverage row in `catalog.md` §Studies
and one e2e case; about 40 source files plus twenty data records; adds no
runtime dependency, no family, no composite, no route and no page. Removes
nothing. Wall-clock: about 4 h 0 min to 8 h 0 min of executor work, of which
the fan-out runs in parallel and none is a design round, plus the fixed
cycle; unknown until run. Context bytes: the study record, its check, the
`motion` and `timeline` drawings, the engine's exports and the catalog rules
as the target's `main` leaves them at activation; `catalog.md` §Studies;
WO-020's `fan-out.md` and the Arrive worked example; the twenty catalog rows;
this order; about 180 KB for the executor; each author reads two rows, the
contract, the worked example and the public sources it cites. Commands
added: none. Tokens: unknown until run; recorded per worker. Steps: 10.
Re-mints: none. Refutations paid: this pass's receipt.
**Nomination provenance:** the operator's direction of 2026-11-04 (ignored
intake capture `docs/intake/notes/planning-2026-11-04.md`, SHA-256
`56c7d119bd8cfdf8722ff840d9138920772e1fa40f735605b7fff5664d78ff4e`): drain
the research queue on spare Codex capacity, apart from the Angular work,
limited where needed to the kinds of research already done, with orders that
limit the operator's intervention and need no paired comparisons; the depth
direction of 2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`);
register rows `FUP-862baf0e83c307d0` (the next hundred concepts) and
`FUP-85de3e8d18bab62a` (a separate workstream for the batches), both fired
by that direction and allocated here and to WO-029 to WO-032.
Planner-synthesized by the 2026-11-04 planning pass
([planning document](../planning/passes/standard-pass-v0-115-0-research-track-2026-11-04.md)
§Orders filed and amended). Opaque identifier, not a priority.
**Depends on:** WO-020 merged (hard: the record, the check, the study
composite, the addressable route, the `motion` and `timeline` families, the
movement model directory and the fan-out procedure). The base above is
WO-022's merge, released as `DotLn Angular v0.9.0`; step 1 integrates the
target's current `main`.
**Workstream:** WS-002

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-020",
    "relation": "hard",
    "reason": "the concept-study record, check, study composite, addressable route, the motion and timeline families, the movement model directory and the fan-out procedure this batch reuses"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-002-concept-research.md`
(the track's rules); `docs/workstreams/WS-001-dotln-angular.md` (house rules
7, 8, 15, 17, 23, 24, 26; §The app and its sub-apps);
`docs/repositories/dotln-angular.md` (§Run content workers, §Catalog and
concept studies); `docs/product/concept-study.md`; `docs/control/budgets.json`
(`subagentCap`); the target's `catalog.md` §Studies and `catalog-rules.md`
as the target's `main` leaves them at activation, the engine's exports
(`libs/shared/scene-engine/src/lib/`), WO-020's `fan-out.md` (the authors'
brief and the critics' briefs) and `docs/evidence/WO-020/design/` (the
settled look).

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog, chooses AI for Games and sees forty studied concepts in AI for
Games, thirty-eight of them in the Movement chapter, WO-020's twenty and
these twenty; they open Collision
avoidance and read its study: the idea in plain words (predict where two
moving bodies will be closest and steer away before they get there) and the
situation it serves (two units of the soldier scene crossing paths), a
drawing of two bodies they step through as the predicted closest approach
shrinks and the avoidance takes over, with the text equivalent naming the
time to closest approach at each moment, a chart of the separation over
time, the ordinary pseudocode, the executable model with the note that it
ran in the test suite, how two public steering libraries implement it, the
book's chapter as the reference, the limits (a body that predicts from the
current velocity alone is surprised by a turning neighbour) and the nearby
concepts as links (Separation, Obstacle and wall avoidance, Flee). They open
Flee and watch the mirror of Seek; they open Obstacle and wall avoidance,
step its rays and follow the Corner trap link to read where the rays fail;
they open Projectile trajectory and step an arc to its landing point, then
The firing solution and read how the launch angle is found. What the
operator learns is which steering ideas the scene's rail still lacks and
where each fails; what they decide is which to add to the rail next.

**Observed gap (dated 2026-11-04 at `55b59c9`):** the catalog carries 768 AI
for Games rows and 20 studied, eighteen in the Movement chapter and two in
the design chapters (Group movement, Making the creatures), all drawn by
`motion` (WO-020, `DotLn Angular v0.7.0`); the chapter holds 119 rows, 101
unstudied, 67 of them related to by other rows; the `motion` and `timeline`
families, the movement model directory, the record check and the fan-out
procedure exist and are idle between batches; no page says which movement
ideas the scene's rail lacks.

**Design:**

- **No new page, family or round** (WS-002 rule 1). The twenty records are
  drawn by `motion`, with a `timeline` chart where something changes over
  time, exactly as WO-020's records are; the look was settled by WO-020's
  rounds (`docs/evidence/WO-020/design/`). WS-001 rule 25 governs an order
  that lands a page; this order lands none, so no pair is rendered and no
  question is asked of the operator.
- **The twenty, by the track's rule** (WS-002 rule 2: within a work, among
  the rows the landed family draws, the most-related unstudied rows by
  resolved in-degree, ties toward typed rows then source order, one recorded
  substitution per work). `motion` draws bodies that move, so the candidates
  are the Movement chapter's unstudied rows; the rule run over the catalog's
  data at `55b59c9` by the filing pass gives: `aifg-a:105` Steering
  behaviors, `aifg-a:162` Projectile trajectory, `aifg-a:108` Variable
  matching, `aifg-a:169` Jump points, `aifg-a:192` Motor control,
  `aifg-a:196` Movement in the third dimension, `aifg-a:111` Flee,
  `aifg-a:134` Collision avoidance, `aifg-a:137` Obstacle and wall avoidance,
  `aifg-a:139` Corner trap, `aifg-a:143` Blending versus arbitration,
  `aifg-a:157` Actuator, `aifg-a:163` The firing solution, `aifg-a:166`
  Iterative targeting, `aifg-a:173` Coordinated movement, `aifg-a:90`
  Two-and-a-half dimensions, `aifg-a:94` Steering output, `aifg-a:101`
  Kinematic arrive, `aifg-a:102` Satisfaction radius, `aifg-a:103` Kinematic
  wander. The next rows under the rule, for the one substitution:
  `aifg-a:104` Random binomial, `aifg-a:119` Delegated behaviours,
  `aifg-a:124` Looking where you are going, `aifg-a:127` Path following.
- **Executable models, as WO-020's.** Each record's model is a pure function
  of its parameters that calls the engine where it has the behaviour (`flee`
  and `seek` for Flee; `separate` and the steering pipeline's functions for
  the avoidance rows; `blend` and `firstActive` for Blending versus
  arbitration; `nextBinomial` for Kinematic wander; `advanceFormation` for
  Coordinated movement) and a study-local step where it has none (the
  projectile rows, Jump points, the kinematic rows), saying which in its
  statement. The seven rows that name a concept rather than a mechanism
  (Steering behaviors, Motor control, Movement in the third dimension,
  Actuator, Coordinated movement, Two-and-a-half dimensions, Steering output)
  are drawn by a model of a representative behaviour that shows the concept
  (one body under one behaviour; an actuator limiting a steering output; a
  body's turn on the plane beside its height) and mark `executable` by what
  runs: `typescript` naming the module when the model runs the mechanism,
  `null` with the reason in the decisions when it only illustrates, judged by
  WO-023's test of whether the row has a mechanism to run. The `rxjs` field
  is `null` throughout unless a stream clarifies a row.
- **Implementations and references, as WO-020's brief.** Public projects that
  implement the idea, each opened before it is cited and introduced on its
  own terms; the book once by its DOI naming the chapter and section the row
  comes from, with `supports` saying only that the book covers the topic
  there; own words throughout, no passage of the book (WS-001 rule 23).
- **The fan-out as the track's workers** (WS-002 rule 3). Ten authors with
  two rows each, one factual critic who opens every reference and runs each
  model's spec, one reading critic who reads as the operator would: twelve
  launches against `subagentCap` 20, under the
  [profile's worker-admission and accounting rules](../repositories/dotln-angular.md#run-content-workers)
  declared before any worker starts; under Codex each is a `spawn_agent`
  with `fork_turns: none`, `gpt-6.1-sol` at `max`; under Claude each is a
  `dotln-worker`. Each worker writes only in its private copy of the target,
  spawns nothing and starts no gate; the executor stays the one writer.
- **The inventory's consumers.** The work's record chunk
  (`libs/shared/catalog/src/studies/<work>.ts`, which imports and exports
  every record and which `check-studies.mjs` holds to the directory) and the
  shared model registry (`libs/features/tools/src/lib/studies/study-models.ts`,
  which `study-models.spec.ts` compares with the records' model paths and
  `ToolsFacade` reads) gain this batch's entries before any check runs;
  `tools/studies.test.mjs` keeps the first batch's membership check and gains
  this batch's; `apps/dotln-e2e/src/catalog.spec.ts` derives its studied
  counts from the integrated `studies-summary.json` rather than a new global
  pin; the catalog's visual baselines (`catalog.visual.spec.ts`,
  `catalog-{360,768,1440}.png`) are regenerated for the changed shelf counts
  and the change recorded in the evidence README, as WO-022's was. A
  concurrent batch reconciles the chunk, the registry and the summary when it
  integrates `main`.
- **Documents.** `catalog.md` §Studies: the AI for Games coverage row reads
  forty studied and names this batch beside WO-020's. No new rule unless a
  critic finding needs one, recorded in the decisions.

Rejected: a `grid` or `tree` family for the pathfinding and decision-making
chapters (axis: a new family is a page the operator judges by rounds, which
is a road order's work and not this track's); the concepts chosen by the
planner's taste (axis: the rule is checkable against the data); forty
concepts in one order (axis: the critics' coverage and the verifier's
walkthrough are calibrated at twenty).

Live-run surfaces at the base: the catalog with sixty studies, the three
landed families, the movement models directory and the addressable readings.

**Deliverables:** the twenty records with their models and specs; the
summary rows; the coverage row; `docs/evidence/WO-028/` with `fan-out.md`,
`review.md`, `README.md` (the link check), `walkthrough.md` and its
screenshots.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-028: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor <the Repository pin>
   origin/main` exits 0 (a `main` that does not contain the pin stops for a
   planning pass); the target worktree then fast-forwards to the target's
   `main`, and that integrated commit is the baseline of every later
   comparison; then the route guard and activation as WO-005 step 1; read
   the harness usage; record the subagent remainder, the token stop and the
   publishing decision in `fan-out.md` and the decisions as WO-020 did.
   Check: the decisions carry them.
2. The authors' brief into `fan-out.md` from WO-020's brief, with the
   chapter's index, the twenty rows, the engine functions the Design names,
   the authoring date and the launch form of this host; dispatch the ten authors; merge the twenty drafts into the work's record
   chunk and register each model in `study-models.ts`. Check: `npx nx test tools` exits 0 over
   the models' specs.
3. Dispatch the two critics; dispose the findings; rewrite through the same
   authors or apply the bounded corrections in the parent under the profile;
   set `checked`. Check: `npm run studies:check` exits 0 over
   `studies/aifg/`.
4. The link check into `docs/evidence/WO-028/README.md`. Check: every URL has
   a status.
5. e2e `apps/dotln-e2e/src/catalog.spec.ts`: AI for Games shows forty
   studied on the shelf and in the contents; Collision avoidance's study
   steps under reduced motion with the text equivalent naming the time to
   closest approach; Flee opens from the contents; the Corner trap link opens
   its reading; axe; no overflow at 360, 768 and 1440. Check: `npx nx e2e dotln-e2e` exits 0; `npm run test:tooling` exits 0 over
   the updated `tools/studies.test.mjs`; the regenerated baselines are
   recorded in `docs/evidence/WO-028/README.md`.
6. The walkthrough as WO-020 step 11, under `docs/evidence/WO-028/`. Check:
   the files exist.
7. Documents: the coverage row. Check: `grep -n "AI for Games"
   docs/dev-reference/architecture/catalog.md` prints the row reading forty.
8. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
   nothing; the chunk sizes recorded.
9. Gate plain and review. Check: passing rows, no tracked-byte mutation.
10. Launchpad write-back (WS-002's delivery state by the final review; the
    profile's implementation map unchanged unless a path is new); then the
    publish, review and records steps as WO-007 steps 15 to 17, with the
    branch `feat/movement-concept-studies-2`, the title `feat: add the second
    batch of movement concept studies`, `docs/evidence/WO-028/` and
    `docs/final-reviews/WO-028/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run studies:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session in
   the served production build: open Tools, Catalog; choose AI for Games and
   read the studied count; open Collision avoidance and step its drawing,
   expand the pseudocode, the executable model and the limits; open Flee;
   open Obstacle and wall avoidance, step its rays and follow the Corner
   trap link; open Projectile trajectory and The firing solution. The VER
   report carries a `## Walkthrough` section with the dated steps and the
   screenshots at 360, 768 and 1440 under `docs/evidence/WO-028/walkthrough/`
   (`ls docs/evidence/WO-028/walkthrough | wc -l` prints at least 15), and
   states in the verifier's own words what collision avoidance predicts, how
   flee mirrors seek, and when a firing solution has no answer, as read from
   the studies alone. Met only when every step completed and that statement
   is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/aifg/`
   with exactly the forty ids of WO-020's twenty and this order's twenty (or
   one recorded substitution from the Design's next rows), every record
   `checked` with at least two reviewers, every reference complete, and
   `studies-summary.json` current.
3. Every record except the seven the Design names as concepts without a
   mechanism to run carries `executable` naming a module under
   `libs/features/tools/src/lib/studies/movement/` with a spec beside it that
   imports that module and drives its model through the study's example; a
   recorded substitution brings in a record held to the same rule, and the
   decisions file names which; every record with `executable: null` carries
   its reason in the decisions file (the file names each, and names no record
   outside the seven and a substitution it names as a concept); and
   `npx nx test tools` exits 0 with those specs.
4. The candidate studies cite supported, reachable references and say truly
   which steps the engine runs. Run `cat docs/evidence/WO-028/review.md
   docs/evidence/WO-028/README.md`: every critic finding has a disposition,
   every reference and implementation URL has its observed link-check
   status, no candidate record cites a URL recorded unreachable or a
   reference the factual critic marked unsupported, and the review record
   lists, per study, whether its steps are the engine's, local or mixed with
   the critic's confirmation. Worker accounting remains the profile's process
   duty.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 5 cases, axe at the
   board spec's threshold and no horizontal overflow at 360, 768 and 1440;
   `npm run test:tooling` exits 0 with `tools/studies.test.mjs` holding the
   first batch's membership check and this batch's; and the regenerated
   visual baselines match the integrated shelf.
6. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the records in the work's lazy chunk,
   `npm run check:bundle` passes with the chunk sizes recorded, and
   `package.json`'s `dependencies` keys equal the base's.
7. `docs/dev-reference/architecture/catalog.md` §Studies lists AI for Games
   with forty studied, naming this batch beside WO-020's.
8. `node scripts/target-gate.mjs WO-028 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-028/README.md`, `fan-out.md`, `review.md`,
`walkthrough.md` and its screenshots, and
`docs/evidence/WO-028/host-qualification.md`.

**Known issues and carry-ins:**

- **The operator's touchpoints** (WS-002 rule 4): `drive: WO-028 --host
  codex` from the launchpad's main checkout; the merge of the target's pull
  request and of the launchpad's records pull request when the drive stops
  at awaiting-merge; the drive phrase again for the release close. Nothing
  else is asked of the operator: there is no design round, a routine
  question is resolved under the executor's authority, and a criterion no
  candidate can meet as written is recorded unmet with its defect class for
  the verifier (product 07 §Operator-opened planning pass's five classes),
  never carried to the operator as a question. The attended phrases
  (`npm run worktree -- start`, `resume: next`, `resume: verify`, `resume:
  final review`, `resume: release close`) stay admitted on either host.
- **Beside the road** (WS-002 rule 5): this order edits `studies/aifg/`, the
  movement models directory, the summary, one coverage row and one e2e
  case, surfaces disjoint from every sequenced order's except the shared
  registry `study-models.ts`, the summary and the e2e counts, which the
  integration reconciles; it may run in its
  own worktree beside any of them, and a batch whose target `main` has moved since its base integrates `main` before its handoff and again before its final publish (core WO-233's rule), regenerating `studies-summary.json`, reconciling the work's record chunk and the shared `study-models.ts` registry, and rerunning `studies:check`, `test:tooling`, the affected suites and the e2e count case, and a pull request that stops merging cleanly after a sibling's merge returns to `resume: fix` to integrate it.
- The draft pull request is opened at the verification pass as every target
  order's is (core WO-221's `--draft` form; its workflow runs are a
  final-review obligation read from `docs/evidence/WO-028/preview-pr.json`,
  never a criterion); whether the operator reads twenty records before the
  final review is their choice (the assumption below).
- The record's shape is closed (`concept-study-v0`); a change is a new
  schema version, never an edit. `Target release classification: minor` and
  `Target release notes: reviewed` are set under WO-012's declared policy.
- The remaining Movement rows, and the pathfinding and decision-making
  chapters once a road order lands a family that draws them, are the next
  cuts (WS-002 rule 6).

**Authorized repair expansion (2026-11-05, WO-028-D042):** the operator
includes the shared translation and model migration in this order, across the
existing study corpus and these twenty records. Move study prose and model
narration through the message system, preserve work-level lazy loading, and
separate mechanisms from presentation with shared helpers where they improve
clarity and efficiency. Keep the shipped v0 schema immutable; introduce a new
version for a changed record contract. Add regression checks for untranslated
study text and oversized procedural functions, migrate the existing consumers,
and update the relevant standing documentation and author/reviewer guidance.
The goal is beautiful, efficient code; size thresholds are guardrails, not the
design. This supersedes FINAL-001's separate-road-order prerequisite without
changing the eight acceptance criteria, adding a page or family, or authorizing
publication. Source: [WO-028-D042](../evidence/WO-028/decisions.md#wo-028-d042).

**Non-goals:** a new visual family, composite, route or page; design rounds;
the pathfinding, decision-making and later chapters; typing rows for the
scene; the catalog's search controls (WO-018); the remaining Movement rows.

**Operator-review assumptions:** the operator accepts the track's selection
rule and the twenty rows it names, with the Design's next rows as the one
substitution's source; accepts Codex with the harness defaults as the host
and models of the track; accepts that no paired comparison runs because no
page lands; and accepts the critics' review and the verifier's walkthrough
as the reading of the twenty records, reading the draft pull request at
their choice. Reopen on the operator's word.
