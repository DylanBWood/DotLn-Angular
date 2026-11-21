# WO-024 — Concept studies V: levels, loops and teams, ten concepts from Gödel, Escher, Bach and ten from Team Topologies, each with a relations drawing, the two works whose vocabulary describes the platform itself

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 6eef542987ab2183817baba329a64373cb61b157
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/catalog/src/studies/geb/` (ten records) and
`libs/shared/catalog/src/studies/tt/` (ten records); the `relations`
builder `relationsModel` in `libs/features/tools/src/lib/studies/relations.ts`
with its spec, and, under `libs/features/tools/src/lib/`, the family's
model type in `studies/study-model.ts` (`StudyModel` and `ticksOf`), its
view in `types.ts` (`StudyDrawingView`), its branch in
`mappers/study-mapper.ts` and its case in the study composite
(`composites/study/study.ts`, `study.html`); the family's composite under
`libs/features/tools/src/lib/composites/study-visuals/relations/`; under
`libs/features/tools/src/lib/studies/geb/` and `studies/tt/`, one data
module with its spec for each drawn study without a mechanism and, for the
four executable studies, a simulation and an entry with its spec; the
wiring a new work needs: the scopes `geb: 'studyGeb'` and `tt: 'studyTt'`
in `scopes` of `studies/study-record.ts`, the message catalogs
`apps/dotln/public/i18n/studyGeb/en.json` and `studyTt/en.json` with the
family's shared narration in `studyCommon/en.json` and its words under
`tools` in `apps/dotln/public/i18n/en.json`, the testing copies
`libs/features/tools/testing/src/lib/study-en.json` and `tools-en.json`
that `tools/i18n-copies.test.mjs` holds equal to the app's catalogs, the
work chunks `libs/shared/catalog/src/studies/geb.ts` and `tt.ts` with their
`studyChunks` entries in `libs/shared/catalog/src/lib/catalog-loader.ts`,
each drawn study's model entry in `studies/study-models.ts`, the batch's
membership test in `tools/studies.test.mjs`, twenty rows in
`studies-summary.json`, the e2e counts in `apps/dotln-e2e/src/catalog.spec.ts`
and the catalog's visual baselines (`catalog.visual.spec.ts`,
`visual-baselines/darwin/catalog-{360,768,1440}.png`) regenerated; two
coverage rows and the `relations` rule; about 80 source files plus twenty
data records; adds no runtime dependency. Removes nothing. Wall-clock: about 6 h 0 min to 10 h 0 min of
executor work, of which the fan-out runs in parallel, plus the fixed cycle;
unknown until run. Context bytes: the study record, check, families and
rules as the target's `main` leaves them at activation (WO-020's, with
WO-021's, WO-022's and WO-028's changes: the `concept-study-v1` record whose
authored text fields are message keys in the work's lazy catalog, the model
split into simulation, presentation and entry, and the study text and size
guards), the builders `relationsModel` follows (`studies/flow.ts`,
`studies/states.ts`, `studies/rxjs/marbles.ts`) with one messaging study
and one enterprise model and their specs, `catalog.md` §Studies, the
twenty catalog rows with their hooks, this order, about 250 KB for the
executor; each author reads two rows,
the contract and the public references it cites. Commands added: none.
Tokens: unknown until run. Worker totals, the session total, stop
comparison and use count are recorded in `fan-out.md` and decisions under the
profile as process controls, outside acceptance. Steps: 12. Re-mints: none.
Refutations paid before this pass: the 2026-10-30 second pass's receipt, on the text before
the 2026-11-01 second pass's authorized amendment (WO-024-D001), which this pass's fresh refutation judges.
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second.md`, SHA-256
`8e8cdbeb9b227932d9119b5a012a72086a1ebe349f368b42b0ff788d9060382e`); the
depth direction of 2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`); the
`dotlnHooks` the GEB and Team Topologies rows carry toward the platform's
levels and roles (the catalog rule on traps and levels; `concept-mapping.md`);
register row `FUP-5f1cdfde5e860902` allocated to WO-020 to WO-024.
Planner-synthesized by the 2026-10-30 second planning pass
([planning document](../planning/passes/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D4 and D5). Opaque identifier, not a priority.
Amended by the 2026-11-09 pass ([planning document](../planning/passes/standard-pass-v0-122-1-open-orders-rejudged-2026-11-09.md)
D5): the `relations` family built builder-first, each study data passed
to `relationsModel` with no presentation module of its own, and the module
that models each drawing without a mechanism named; the wiring a new work
needs in the Cost line and the plan; criterion 7's grep given a control
against the integrated base; the round criterion admitting rule 25's
deferral route; the Observed gap re-dated at `eb9d227`; the pair WO-008 in
place of WO-040, with criterion 6 reading the integrated `main`; and the
executor's effort written `xhigh`. Amended by the 2026-11-09 pass ([planning document](../planning/passes/standard-pass-v0-122-1-open-orders-rejudged-2026-11-09.md) D18): the verifier's read of the research for quality (rule 27), the operator's two display sizes in the walkthrough and the end-to-end checks (rule 29), and the search controls' pointer, which named an order that no longer carries them. Amended by the 2026-11-14 pass ([planning document](../planning/passes/standard-pass-v1-0-0-2026-11-14.md) D6): the fan-out names its workers from the instance's worker table, since the second worker definition that WO-020's procedure names left with starter v1.0.0.
**Depends on:** WO-020 merged (hard: the record, the check, the study
composite, the addressable route and the fan-out procedure); WO-028 merged
(hard: the `concept-study-v1` record, the work catalogs, the model split and
the study guards every batch now writes to; its merge brought the four study batches and the shared migration, which the base above includes); WO-039 merged (hard: the reshaped enterprise batch its four executable models copy, so the shapes WO-023-D016 deferred are not copied into the `relations` batch; the 2026-11-08 pass, D3; merged as DotLn-Angular #18 on 2026-11-08, released as `DotLn Angular v0.11.1`). WO-039 is a required ancestor. The Repository pin is WO-036’s later merge.
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-020",
    "relation": "hard",
    "reason": "the concept-study record, check, study composite, addressable route and fan-out procedure this batch reuses"
  },
  {
    "workOrderId": "WO-028",
    "relation": "hard",
    "reason": "the concept-study-v1 record, the work message catalogs, the simulation, presentation and entry split and the study guards every batch now writes to"
  },
  {
    "workOrderId": "WO-039",
    "relation": "hard",
    "reason": "the reshaped enterprise batch whose executable-model shape this batch's four models copy, so the shapes WO-023-D016 deferred are not copied into the relations batch"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 23, 24, 25, 26, 27, 29; §Design: the Tipping Point taxonomy, §The app
and its sub-apps, §Design direction); `docs/repositories/dotln-angular.md`;
`docs/product/concept-study.md`; `docs/control/budgets.json` (`subagentCap`);
the target's `catalog.md` §Studies and `catalog-rules.md` as the target's
`main` leaves them at activation (WO-020's, with WO-021's, WO-022's and
WO-028's changes), and `docs/dev-reference/architecture/concept-mapping.md` (traps,
levels and the five UIFA roles); WO-020's `fan-out.md`.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog, chooses Gödel, Escher, Bach and sees ten studied concepts;
they open Levels of description and read its study: the idea in plain words
(the same system is truly described at several levels, each with its own
vocabulary, and no level is the real one) and a situation it serves (a
planning pass, an order, a gate row and a hook refusal are four descriptions
of one afternoon's work), a relations drawing they step through level by
level with the text equivalent naming each level and what it sees of the
next, the ordinary pseudocode of a chunking procedure, an illustrative RxJS
reading where a stream of low-level events becomes a stream of higher-level
ones, public treatments of the idea introduced on their own terms, the
references, the limits (a sealed-off level hides what leaks through) and the
nearby concepts as links (Chunking, Sealed-off levels, Strange loop). They
open Strange loop and step the drawing until it returns to where it began;
they open Isomorphism and Gödel numbering and see one idea become the other's
mechanism, with a small executable encoder they can read the spec of. They
choose Team Topologies, open Collaboration mode, X-as-a-Service mode and
Facilitating mode and read, in one drawing per mode, how two teams exchange
work and where each mode should end; they open Conway's law and read the
homomorphism the drawing shows between a team graph and a system graph, with
the Reverse Conway manoeuvre as its nearby inverse. What the operator learns
is the vocabulary for the levels the platform's mechanisms live on and the
modes its five roles work in; what they decide is which loop or mode to make
visible in the machinery view or a toy next.

**Observed gap (dated 2026-11-09 at `eb9d227`):** the catalog carries 573
GEB rows (9 typed) and 637 Team Topologies rows (2 typed), 295 and 263 of
them carrying DotLn hooks, none studied (the catalog data is unchanged since
`6268de9`); the Tipping Point taxonomy (WS-001 §Design) and
the five UIFA roles are the app's own levels and teams and no page connects
them to the books' vocabulary; `relations` is named in `visualFamilies`
(`libs/shared/models/src/lib/concept-study.ts`) and has no builder, model
type or composite, and neither work has a study directory, a work chunk, a
`studyChunks` entry, a scope in `study-record.ts` or a message catalog. The
landed families divide by where a study's presentation lives. The forty
`marbles` and `flow` studies are each one module of 52 to 385 lines under
`studies/rxjs/` or `studies/eip/` whose example `marbleModel` or `flowModel`
builds, and no standards pass has reshaped one: WO-034 and WO-039 changed
only their specs, their messages and the shared marble-testing helper, and
WO-040's stream work is four functions of the two builders (`flow.ts` and
`rxjs/marbles.ts`) and nineteen state messages. The forty `motion` studies and the sixteen drawn
`states` studies each carry a hand-written `*.presentation.ts`, and every
batch of them has needed a standards pass (WO-034, WO-039 and WO-040).

**Design:**

- **The `relations` family** (`composites/study-visuals/relations/`): a small
  concept map laid out by the builder (a stack of levels, a cycle through
  levels, a graph of teams and systems, two graphs with a mapping between
  them), with the stepped node or edge raised and named in the text
  equivalent; reduced motion steps without transition. First rendered pair
  (rule 25): A, a stack of levels with the loop drawn as an arrow returning
  to the bottom; B, a ring with the levels as stations and the loop as the
  ring itself; one variable, the geometry of a loop through levels; both at
  about 2080 by 1460 and 360 (rules 25 and 29); the rounds continue until
  the operator says done, or the operator delays them (rule 25), in which case the first pair is recorded without a
  pick, A ships and the rounds are carried as a follow-up.
- **Builder-first** (`relationsModel` in
  `libs/features/tools/src/lib/studies/relations.ts`, beside `flow.ts` and
  `states.ts`): each of the twenty studies is data, its nodes, relations,
  steps and notes as message keys, passed to one `relationsModel` builder
  that owns the whole presentation (the layout, the raised node or edge, the
  text equivalent, the moments, the legend and the caption, its shared
  narration in `studyCommon/`), as `marbleModel` and `flowModel` do; the
  builder refuses a node, relation, step or moment the example lacks, as
  `flowModel` does, so a spec fails at once. No presentation module is
  written per study. Each of the sixteen studies without a mechanism to run
  that carries a drawing names as `visual.model` its one module,
  `studies/geb/<slug>.ts` or `studies/tt/<slug>.ts`, which exports the
  example as data and `model` built by `relationsModel`, with a spec beside
  it that loads its record through `loadModelStudy(id, 'relations')`, as
  `studies/eip/control-bus.ts` exports a `FlowExample` that `flowModel`
  builds.
- **Executable arm where it exists**: a study with a mechanism to run carries
  `executable: { kind: 'typescript', module }` naming its model entry
  (`<slug>.model.ts`, which composes a language-free `<slug>.simulation.ts`
  with the study's data through `relationsModel`), the enterprise batch's
  shape as WO-039 leaves it with the builder in place of a hand-written
  presentation: the simulation's run is what the builder reads, as an
  enterprise simulation's snapshots are what `statesModel` reads and infers
  each move from, and the spec beside the entry loads its record through
  `loadModelStudy(id, 'relations')`, the tools test kit's one loader, and
  drives the mechanism through the study's example. The four: a Gödel
  numbering of a toy alphabet (encode and decode), a decision procedure over
  a toy rule system authored for the study (not the book's puzzle, in the
  author's words), a chunking of an event list into levels, a Conway mapping
  from a team graph to the system graph it tends to produce (illustrative in
  claim, executable in mechanism); the others mark `executable: null` with
  their reason. The `rxjs` field is illustrative where a stream clarifies
  (levels as a chain of `scan`s; organizational sensing as a feedback
  stream) and `null` otherwise. Missing material stays missing: a concept
  that has only prose keeps `visual: null` when no drawing explains it better
  than the words, recorded with its reason.
- **Situations from the platform and the app**: each study's situation is
  drawn from the platform's public records and the app's own structure (the
  levels of kernel, skeleton, compiler and harness; the planner, executor,
  verifier, reviewer and release-close roles; the taxonomy's Salesmen,
  Connectors and Mavens), stated as an analogy the row's hooks support,
  never as a claim about the book's intent or the platform's design (the
  analogy rule WO-022 adds).
- **Implementations and references**: public treatments and implementations
  (a public interpreter of a formal system, public essays on Gödel's theorems
  from a reference encyclopedia, the Team Topologies public pattern pages and
  the Team API template repository, Conway's original paper where public),
  each introduced on its own terms; the publishers' pages as references, each
  with `accessed` and `supports`. Own words; no passage of either book (rule
  23; the publishing decision at activation).
- **The twenty concepts**, by the pass's rule (the ten most-related rows of
  each work by resolved in-degree, ties toward typed rows then source order,
  with one recorded substitution for GEB: Strange loop for Completeness,
  because Consistency's study carries completeness as its nearby concept from
  the same chapter and the book's own subject would otherwise be absent):
  GEB `geb2:8` Levels of description, `geb2:9` Chunking, `geb1:107`
  Consistency, `geb1:228` Gödel numbering, `geb1:53` Decision procedure,
  `geb1:65` Isomorphism, `geb2:138` Sentence G, `geb1:51` Jumping out of the
  system, `geb2:61` Active symbols, `geb2:302` Strange loop; Team Topologies
  `tt3:8` X-as-a-Service mode, `tt3:7` Collaboration mode, `tt3:9`
  Facilitating mode, `tt1:92` Conway's law (1968), `tt1:138` Reverse Conway
  manoeuvre, `tt1:94` Homomorphic force, `tt1:151` Team-scoped flow,
  `tt2:90` Platform as a product, `tt3:47` Organizational sensing, `tt1:215`
  Seven-to-nine maximum effective team size. One further recorded
  substitution per work under the rule is admitted as in WO-020.
- **The fan-out**: WO-020's authoring and critic procedure, each worker the
  instance's `default` worker unless the operator names another, launched as
  `npm run worker -- show <name>` prints it (the second worker definition that
  procedure names left with starter v1.0.0), with the
  [profile's worker-admission and accounting rules](../repositories/dotln-angular.md#run-content-workers)
  declared before any worker starts, at most twelve initial author/critic launches (ten authors
  with two concepts each, one factual critic who also checks the analogy rule
  and that no study characterizes the operator or quotes the books, one
  reading critic).
- **The record and the code's shape** (WO-028's migration; WS-001 rules 9,
  30 and 31): each record is `concept-study-v1`, every authored on-screen
  field a message key in the new scopes
  `apps/dotln/public/i18n/studyGeb/en.json` and `studyTt/en.json` with
  shared narration in `studyCommon/`; the builder's labels, notes, worked
  arithmetic and comparisons are parameterized messages with nested keys and
  named placeholders; a function of the builder or of a simulation takes a
  frame, a description object or a translator and at most four parameters,
  and no function is split to fit the 80-line ceiling: the shape is WO-034's reshaped first batch and, for an executable model's simulation and entry, the enterprise batch as WO-039 leaves it, never the first batch's as it stood before WO-034 and never WO-028's twenty, which WO-040 reshapes (rule 30).
  The authors' and critics' briefs name rules 9, 23 and 30 and G3 and the
  builder-first shape, and the
  critics inspect message coverage, the mechanism/presentation split and
  that each study is data passed to `relationsModel`
  independently of any earlier worked example (WO-028-D042; rule 30).
- **Documents:** `catalog.md` §Studies gains the two coverage rows, §The
  models and §The families the `relations` builder and family, and the
  record's list of work catalogs gains `studyGeb/` and `studyTt/`;
  `catalog-rules.md` gains the `relations` rule beside the flow and states
  rules: a study drawn by `relations` is data passed to `relationsModel`,
  with no presentation module of its own; a study with a mechanism to run
  composes its language-free simulation with the builder; and an idea
  without a mechanism keeps `executable` absent, and `visual` where no
  drawing explains it better than the words, with the reason in the
  batch's decisions, so the document's absent-material rule (a
  representation an idea does not need stays absent) holds in the family
  as it does in the flow and states rules; its list of work catalogs gains
  the two scopes; WS-001's §Design gains, by the
  launchpad write-back, one sentence linking the taxonomy to the Levels of
  description and Team Topologies studies.

Rejected: twenty GEB concepts and Team Topologies later (axis: the two works
together describe the platform's levels and its roles, and the operator's
hundred is served by both appearing now); a formal-system interpreter as a
sub-app (axis: a toy of that size is a later member the operator picks from
the shelf, WO-018's route); drawings for every concept (axis:
`concept-study.md` keeps missing material missing); a hand-written
presentation module per study, as the `motion` and `states` batches have
(axis: where the presentation lives; the Observed gap's measure: no
standards pass has reshaped a `marbles` or `flow` study, each data that its
family's builder draws, while every `motion` and `states` batch, each with a
presentation per study, has needed one; with one builder, this batch and
WO-032's land as data).

Live-run surfaces at the base: the catalog with a hundred studies in the
`motion` and `timeline`, `marbles`, `flow` and `states` families and the
addressable readings.

**Deliverables:** the twenty records with their data modules and, where
executable, their simulations and entries, each module with its spec; the
`relations` builder with its spec and the family with its stories and
specs; the work wiring the Cost line names; the coverage
rows, the rule and the sentence; `docs/evidence/WO-024/` with the fan-out
record, the review record, the link check, the walkthrough and its
screenshots, and the design record.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-024: in the target clone, after
   `git fetch origin`, `git merge-base --is-ancestor <the Repository pin> origin/main` exits 0 (the pin includes WO-039 and WO-036. A `main` without it stops for a planning pass); the target worktree then fast-forwards to the target's `main`, and that integrated commit, recorded in the decisions file, is the baseline of every later comparison; then the route guard and activation as WO-005 step 1; read the harness usage and record the subagent remainder; record the publishing decision as WO-020 did.
2. The builder `relationsModel` in
   `libs/features/tools/src/lib/studies/relations.ts` with
   `relations.spec.ts` (a three-level stack with a loop built from data,
   and the refusal of a node, relation, step or moment the example lacks);
   the family's model type beside `flow` and `states` in
   `studies/study-model.ts` with its case in `ticksOf`, its view in
   `types.ts`, its branch in `mappers/study-mapper.ts` and its case in
   `composites/study/study.ts` and `study.html`; the `relations` family
   under `composites/study-visuals/relations/` with stories
   `StudyRelations` and a spec that renders that stack to its text
   equivalent; the family's words under `tools` in
   `apps/dotln/public/i18n/en.json` with the testing copy
   `libs/features/tools/testing/src/lib/tools-en.json`, and its shared
   narration under `relations` in `apps/dotln/public/i18n/studyCommon/en.json`.
   Check: `npx nx test tools` exits 0; `npm run lint:components` exits 0;
   `npm run test:tooling` exits 0 over `tools/i18n-copies.test.mjs`.
3. The first rendered pair (A stack with a returning arrow, B ring) at
   about 2080 by 1460 and 360; the rounds until the operator ends them, the
   rejected implementation removed with its record, or, where the operator
   delays them (rule 25), the first pair
   recorded without a pick and A shipped.
   Check: `grep -c "Round" docs/evidence/WO-024/design/comparisons.md` is at
   least 1.
4. Record the stop figure and the launch/re-task budget in `fan-out.md` as the
   profile directs. The authors' brief with the absent-material rule and the
   builder-first shape (each study's data passed to `relationsModel`, no
   presentation module per study) goes there;
   dispatch the ten authors; merge the twenty drafts into the work chunks
   `libs/shared/catalog/src/studies/geb.ts` and `tt.ts`, each with its
   entry in `studyChunks` in `libs/shared/catalog/src/lib/catalog-loader.ts`;
   add `geb: 'studyGeb'` and `tt: 'studyTt'` to `scopes` in
   `libs/features/tools/src/lib/studies/study-record.ts`; put the twenty
   records' messages in `apps/dotln/public/i18n/studyGeb/en.json` and
   `studyTt/en.json` with the testing copy
   `libs/features/tools/testing/src/lib/study-en.json`; register each model
   in `studies/study-models.ts`; and add the batch's membership test to
   `tools/studies.test.mjs`. Check: `npx nx test tools` exits 0 over the
   models' specs and `study-models.spec.ts`; `npm run test:tooling` exits 0.
5. Dispatch the two critics; dispose the findings; rewrite through the same
   authors or apply the bounded corrections in the parent under the profile; set `checked`. Check: `npm run studies:check` exits 0 over
   `studies/geb/` and `studies/tt/`.
6. The link check into `docs/evidence/WO-024/README.md`. Check: every URL has
   a status.
7. e2e `apps/dotln-e2e/src/catalog.spec.ts`: GEB shows ten studied and Team
   Topologies ten; Levels of description's study steps its drawing under
   reduced motion with the text equivalent naming the level; Strange loop's
   drawing returns to its start; the three interaction-mode studies open from
   the contents; Conway's law links to the Reverse Conway manoeuvre; axe; no
   overflow at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620; the two works' studied counts read from
   `studies-summary.json` as the other works' are; the catalog's visual
   baselines (`apps/dotln-e2e/src/catalog.visual.spec.ts`,
   `visual-baselines/darwin/catalog-{360,768,1440}.png`) regenerated for
   the two shelves' counts and the change recorded in
   `docs/evidence/WO-024/README.md`. Check: `npx nx e2e dotln-e2e` exits 0.
8. The walkthrough as WO-020 step 11, under `docs/evidence/WO-024/`. Check:
   the files exist.
9. Documents: the coverage rows, the builder and the family in
   `docs/dev-reference/architecture/catalog.md`, the `relations` rule in
   `docs/ai-reference/catalog-rules.md`, and the two scopes in both
   documents' lists of work catalogs. Check: `git show <the integrated
   base>:docs/ai-reference/catalog-rules.md | grep -c "relationsModel"`
   prints 0, recorded in the decisions file, and `grep -c "relationsModel"
   docs/ai-reference/catalog-rules.md` prints at least 1.
10. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
    nothing; the chunk sizes recorded.
11. Gate plain and review. Check: passing rows, no tracked-byte mutation.
12. Launchpad write-back (WS-001 §Design's sentence; the profile's
    implementation map names the `relations` family; the delivery states by
    the final review); then the publish, review and records steps as WO-007
    steps 15 to 17, with the branch `feat/levels-loops-and-teams-studies`,
    the title `feat: add concept studies for levels, loops and teams`,
    `docs/evidence/WO-024/` and `docs/final-reviews/WO-024/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run studies:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session in
   the served production build: open Tools, Catalog; choose Gödel, Escher,
   Bach and read the studied count; open Levels of description and step its
   drawing, expand the pseudocode and the limits; open Strange loop and step
   it round; open Isomorphism and Gödel numbering and read the encoder's spec
   note; choose Team Topologies; open the three interaction modes; open
   Conway's law and follow the Reverse Conway link. The VER report carries a
   `## Walkthrough` section with the dated steps and the screenshots at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620 (rule 29) under
   `docs/evidence/WO-024/walkthrough/`
   (`ls docs/evidence/WO-024/walkthrough | wc -l` prints at least 15), and
   states in the verifier's own words what a level of description is, what
   makes a loop strange, and when collaboration mode should end, as read from
   the studies alone. The verifier also reads the research for quality (rule 27): a random sample of at least five of the twenty new records with their messages, drawn by a command the VER report records, each read whole and judged for quality and content; the report names the sample and the judgment, and a pattern of low quality fails the order. A UI issue at about 2080 by 1460 or 3840 by 1620 fails here (rule 29). Met only when every step completed and that statement
   is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/geb/`
   and `studies/tt/` with exactly the twenty ids this order names (or one
   recorded substitution per work), every record `checked` with at least two
   reviewers, every reference complete, and `studies-summary.json` current;
   every record is `concept-study-v1` with its text in `studyGeb/en.json` or
   `studyTt/en.json`, `npm run i18n:check` exits 0 and the corpus test passes
   over the models.
3. The four records whose mechanism the Design names (Gödel numbering,
   Decision procedure, Chunking and Conway's law (1968)) carry `executable`
   naming a model entry under `libs/features/tools/src/lib/studies/geb/` or
   `studies/tt/` that composes its simulation module with `relationsModel`,
   with a spec beside it that loads its record through
   `loadModelStudy(id, 'relations')`, imports that module and runs the
   study's example, asserting its expected result; a recorded substitution
   that replaces one of the four brings in a record with a mechanism to run,
   which carries its module and spec the same way, and the decisions file
   names it; every other record with `executable` does the same; every
   other record with a drawing names as `visual.model` one module under
   either directory that builds its drawing through `relationsModel`, with a
   spec beside it; no presentation module is written per study
   (`ls libs/features/tools/src/lib/studies/geb libs/features/tools/src/lib/studies/tt | grep -c "presentation"`
   prints 0); every
   record with `executable: null` carries its reason in the decisions file
   (the file names each, and names none of the four or a replacement of
   one); every record with `visual: null` carries its reason there too (the
   file names each); and `npx nx test tools` exits 0 with those specs
   counted in its output.
4. The candidate studies cite supported, reachable references and obey the
   analogy rule. Run `cat docs/evidence/WO-024/review.md docs/evidence/WO-024/README.md`:
   every critic finding has a disposition, every reference and
   implementation URL has its observed link-check status, and no candidate
   record cites a URL recorded unreachable or a reference the factual critic
   marked unsupported. The review record confirms per study that no passage
   of either book is quoted and no sentence characterizes the operator.
   Worker accounting remains the profile's process duty.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 7 cases, axe at the
   board spec's threshold and no horizontal overflow at 360, 768, 1440, about 2080 by 1460 and 3840 by 1620.
6. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the `relations` family and the records in lazy
   chunks, `npm run check:bundle` passes with the chunk sizes recorded, and
   `package.json`'s `dependencies` keys equal the latest integrated
   `main`'s.
7. `docs/dev-reference/architecture/catalog.md` §Studies lists Gödel, Escher,
   Bach and Team Topologies with ten studied each, and
   `docs/ai-reference/catalog-rules.md` states the `relations` rule:
   `grep -c "relationsModel" docs/ai-reference/catalog-rules.md` prints at
   least 1, where the same count over the integrated base's file
   (`git show <the integrated base>:docs/ai-reference/catalog-rules.md`, the
   commit step 1 records) prints 0.
8. `docs/evidence/WO-024/design/comparisons.md` records the first pair (A
   stack, B ring), each rendered at about 2080 by 1460 and 360, and either
   every later round with its pick, the decisions file recording the
   operator's word that ended the rounds and naming the removed candidate's
   files, `ls` on each printing nothing; or, where the operator delayed the
   rounds (WS-001 rule 25), the first pair
   without a pick, the decisions file recording the operator's word that
   delayed them and the follow-up that carries them, with A the drawing the
   family ships.
9. `node scripts/target-gate.mjs WO-024 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-024/README.md`, `fan-out.md`, `review.md`,
`walkthrough.md` and its screenshots, `design/`, and
`docs/evidence/WO-024/host-qualification.md`.

**Known issues and carry-ins:** The second 2026-11-08 pass required WO-039's merge (#18), released as `DotLn Angular v0.11.1`, which brought the reshaped enterprise batch (lookup tables keyed by the study's id union, `matchKind`, `listOf`, `booleanParameter`, the comparison runs in the run description), the `states` builder's inferred transition, `TimelineModel<Axis>` and the one model-study loader `loadModelStudy(id, family)` in the tools test kit; the first 2026-11-08 pass had set it to WO-023's merge (#17, `DotLn Angular v0.11.0`), which brought the `states` family, the enterprise batch and WO-034's reshaped first batch (the 2026-11-06 pass set it to WO-027's merge; the 2026-11-05 pass carried the migrated record and code shape into the Design). WO-039's merge is the hard edge step 1 reads through the pin, so this order's executable models copy the reshaped batch. Step 1 still integrates the target's current main and uses that commit for comparisons. From the 2026-11-01 pass's criteria adversary (its
R1 and R6), carried into this text by the 2026-11-01 second pass: step 1's
base guard is an ancestor check and the fast-forward, and criterion 3 names
the four records that must carry a module and binds each spec to it,
because a conditional criterion let every record take the null escape and
a spec beside a module need not exercise it; the executor reads the study
record, check, families and rules as the target's `main` leaves them, which
WO-021, WO-022 and WO-028 change. WO-024 pairs with WO-037. The two orders can both touch the app's English
catalog and the Tools testing copy. Either order can open its verified draft first. Once one sibling merges, the
remaining branch integrates target `main`, preserves both sets of keys and reruns
`node --test tools/i18n-copies.test.mjs` before landing. A ready PR whose
sibling merged later needs the same check on the integrated tree. The
pair can also run one at a time. The remaining GEB and Team Topologies rows, the AI for Games
pathfinding and decision-making chapters, the RxJS patterns and the remaining
EIP and PoEAA patterns are the next batches' candidates (the filing pass's
C3), cut when the operator drains this queue. This order activates only on a
launchpad whose starter carries core WO-221's `--draft` form; the draft pull
request and its workflow runs are a final-review obligation read from `docs/evidence/WO-024/preview-pr.json`, never a criterion. Before `target-records`, the final reviewer commits the order's records on the order branch so the launchpad commit the filed records' footer names holds them (the profile's publish route, step 3). `Target release
classification: minor` and `Target release notes: reviewed` are set under
WO-012's declared policy.

**Non-goals:** a formal-system or team-topology sub-app or toy; studies of
the remaining rows; the general search controls (carried by no order; register row `FUP-0fb531a975308a81`); the machinery view.

**Operator-review assumptions:** the operator accepts the in-degree selection
with the recorded substitution and the twenty concepts it names, accepts
situations drawn from the platform's public records and the app's structure
as analogies, judges the first pair and ends the rounds in their own words
or delays them, accepts one builder that
draws every study from its data, and reads the one draft pull request before final review, which the final
publish reuses.


Filed from the launchpad Launchpad at commit 90315a742dee2e915249fb9d1d055a1281a44da9, where this record's path was docs/work-orders/WO-024-concept-studies-geb-and-team-topologies.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
