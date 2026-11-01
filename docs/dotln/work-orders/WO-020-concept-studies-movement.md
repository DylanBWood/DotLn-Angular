# WO-020 — Concept studies I: the twenty movement concepts the soldier scene runs, written into the study record, the visual families, the check and the coverage view that every later batch reuses

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 6268de9fc3cae84bf66091c1fbcc30d344411cd2
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `concept-study.ts` to `libs/shared/models`,
`concept-study-v0.schema.json` to the catalog schema directory,
`libs/shared/catalog/src/studies/aifg/` (twenty records) and
`studies-summary.json`, the loader's study reads, `tools/scripts/catalog/check-studies.mjs`
with `npm run studies:check` and `npm run studies:report`, the `study`
composite and the `motion` and `timeline` families under
`libs/features/tools/src/lib/composites/`, the model modules under
`libs/features/tools/src/lib/studies/movement/`, the addressable reading
route, the studied marks, two document sections, about 45 source files plus
twenty data records; adds no runtime dependency. Removes the hand-wired Arrive
study files (`arrive-example.ts`, `arrive-example-code.ts`,
`arrive-limit-example.ts`, `composites/arrive-study/`) once their content
lives in the record and the families. Wall-clock: about 8 to 12 hours of
executor work, of which the authoring fan-out runs in parallel, plus the
fixed cycle; unknown until run. Context bytes: WS-001 §The app and its
sub-apps and rules 23 to 26, `docs/product/concept-study.md`, the target's
`catalog.md` §Reading and studying and `catalog-rules.md`, the Arrive study's
files, the twenty catalog rows, this order, about 230 KB for the executor;
each author reads two rows, the record contract and the references it cites.
Commands added in the target: `npm run studies:check` (inside
`check:fixtures`) and `npm run studies:report` (a helper). Tokens: unknown
until run; recorded per worker. Steps: 16. Re-mints: none. Refutations paid:
the 2026-10-30 second pass's receipt.
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second.md`, SHA-256
`8e8cdbeb9b227932d9119b5a012a72086a1ebe349f368b42b0ff788d9060382e`): the
concepts the mining run produced enter the app in batches the operator takes
beside the road orders, about a hundred concepts in five orders selected by
planning, at the front of the list; the operator's depth direction of
2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`;
WO-019-D005; `docs/product/concept-study.md`); WO-019's planning handoff
(`docs/evidence/WO-019/planning-handoff.md`: a versioned record, a pilot,
reusable visual families, reviewed batches, coverage tracking) and
WO-019-D030 (the Arrive study's maintainability work); register rows
`FUP-5f1cdfde5e860902`, `FUP-5e9566b63fb44fb1` and `FUP-ebc4ad49cf1ea093`
allocated here. Planner-synthesized by the 2026-10-30 second planning pass
([planning document](../planning/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D3 to D7). Opaque identifier, not a priority.
**Depends on:** WO-019 merged (hard, met: the catalog with every row's
definition, the reading surface and the Arrive study this order
generalizes); WO-015 merged (hard, met: the sixteen typed scene tools and the
`/scene?tool=<id>` route the studies link to). The base is WO-015's merge
commit, the target's `main` at filing.
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-019",
    "relation": "hard",
    "reason": "the catalog with every row's definition, the reading surface and the Arrive study this order generalizes into the record and the families"
  },
  {
    "workOrderId": "WO-015",
    "relation": "hard",
    "reason": "the sixteen typed scene tools whose studies this order writes and the /scene?tool=<id> route they link to"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 3, 5, 10, 11, 15, 18, 23, 24, 25, 26; §The app and its sub-apps,
§Design direction); `docs/repositories/dotln-angular.md`;
`docs/operator/README.md` (§What the operator wants: depth in every concept of
the catalog); `docs/product/concept-study.md`; `docs/control/budgets.json`
(`subagentCap`); the target's `docs/dev-reference/architecture/catalog.md`
§Reading and studying, `docs/ai-reference/catalog-rules.md`,
`docs/dev-reference/architecture/scene.md` (the engine's steering functions),
and `libs/features/tools/src/lib/arrive-example.ts` with
`composites/arrive-study/` at the base.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog and sees on the shelf that AI for Games has twenty studied
concepts; they open Chapter 3, Movement, and the contents mark which concepts
carry a study. They open Flocking and read, below the mined definition, the
study: the idea in plain words and a situation it serves (a crowd crossing a
field without piling up), one example every part of the study explains, a
drawing of that example they step through moment by moment with a text
equivalent beside it, a chart of what changes over time, ordinary pseudocode
they read top to bottom, an RxJS reading marked illustrative, where flocking
is implemented in public projects and what each adds, public references with
the claim each supports, the limits and failure cases (the equilibria of
blending, the shimmer under priority steering) and the nearby concepts as
links into their own readings. They follow "runs in the soldier scene", watch
the same idea on twenty units, and come back with the browser's Back to the
reading they left. They open Seek, Separation and Two-level formation
steering and read the same kind of study, each in the form its idea needs.
They copy the link to Slot assignment's reading, open it in a new tab, and it
opens on that reading. What the operator learns is what each movement idea
does and when it fails; what they decide is which concept to deepen or play
with next.

**Observed gap (dated 2026-10-30):** at `6268de9` the catalog carries 3,463
rows with their definitions, relations and hooks (WO-019); one concept,
Arrive, carries an authored study, hand-wired into the Tools feature
(`arrive-example.ts`, `arrive-limit-example.ts`, the `arrive-study` and
`study-explanation` composites, the study signals in `ToolsFacade`); no record
type, schema, check or coverage exists for a study; readings are not
addressable (the chosen concept lives in the persisted store, so Back and
shared links do not return to a reading, WO-019-D029); the Tools home loads
every work's chunk for its counts (D029); the study's drawing geometry and
prose values are computed in the facade rather than derived from a model,
section open state is split between the facade and the disclosures, and
composite element ids are fixed (D030). The scene engine
(`libs/shared/scene-engine`, WO-015) runs sixteen of the catalog's tools as
pure functions with specs. The operator's depth direction names the
representations a concept should eventually have; the enrichment program
WO-019's handoff proposed is unfiled.

**Design:**

- **The record** (`libs/shared/models/src/lib/concept-study.ts`, schema
  `libs/shared/catalog/src/schema/concept-study-v0.schema.json`; one JSON
  file per study under `libs/shared/catalog/src/studies/<work>/<slug>.json`):
  `ConceptStudy { schema: 'concept-study-v0'; id: ToolId; work: WorkSlug;
  slug: string; authored: { by: string; on: string; reviewedBy: string[];
  state: 'draft' | 'checked' }; intuition: { text: string; situation: string };
  example: { name: string; description: string; parameters: Record<string,
  number | string> }; mechanism: { steps: { title: string; text: string }[] };
  pseudocode: { ordinary: string; rxjs: string | null; executable: { kind:
  'rxjs' | 'typescript'; module: string } | null }; visual: { family:
  VisualFamily; model: string | null; textEquivalent: string } | null;
  implementations: { project: string; url: string; relevance: string;
  explanation: string }[]; references: { title: string; url: string;
  accessed: string; supports: string }[]; limits: string[]; nearby: { id:
  ToolId; why: string }[] }`, with `visualFamilies = ['motion', 'timeline',
  'marbles', 'flow', 'states', 'relations']`. Every prose field is the
  author's own words and is marked authored on the page; the mined definition
  keeps its provenance beside it (rule 23; `concept-study.md`). A
  representation an idea does not need is `null` or an empty list, never
  filled: the schema admits `visual: null`, `rxjs: null`, `executable: null`
  and empty `implementations`, and the check requires `intuition`, `example`,
  `mechanism`, `pseudocode.ordinary`, at least one reference, at least one
  limit and at least one nearby concept. The record is data the catalog
  library serves through `CatalogLoader.study(id)` lazily per work, beside
  the tool data, so a regenerated join never touches a study (the handoff's
  first point); `studies-summary.json` (ids and `authored.state` per work) is
  written by the check and read by the shelf, the contents and the Tools home.
- **The check** (`tools/scripts/catalog/check-studies.mjs`,
  `npm run studies:check`, run inside `check:fixtures` after `catalog:check`;
  `--write-summary` rewrites the summary, and a stale summary fails the
  check): Ajv against the schema; `id` exists in the catalog data and its
  `work` matches; slugs unique within a work; the required parts present and
  nonempty; every reference carries `title`, `url`, `accessed` (an ISO date)
  and `supports` (the claim it is cited for); every implementation carries
  an explanation; every `nearby` id exists; a `visual.model` or
  `executable.module` path exists in the repository with a spec file beside
  it; `authored.state` is `checked` for every committed record, so an
  unreviewed study never ships. Negative fixtures under
  `tools/lint-fixtures/catalog/`: a study naming an unknown id; a reference
  without `supports`; a draft. `npm run studies:report` prints, per work, the
  studied, checked and total rows (a helper, rule 26).
- **The visual families** (`libs/features/tools/src/lib/composites/study-visuals/<family>/`,
  Connectors with inputs and outputs only): a family is one composite that
  takes a declarative model and a step index and renders a drawing with a
  text equivalent, never autoplaying, stepping on command and under
  `prefers-reduced-motion`, as an SVG the text layer describes (G1, G2).
  This order lands `motion` (the positions of one or more bodies over frames
  in one or two dimensions, a scrubber, the selected moment's values in
  prose) and `timeline` (one or more series over time with the moment
  marked), both generalized from the Arrive study's drawing and chart; the
  other four families are named in the enum and landed by the batch that
  first needs them (WO-021 `marbles`, WO-022 `flow`, WO-023 `states`, WO-024
  `relations`), each with its own stories, specs and first rendered pair. A
  family's geometry and prose values derive from its model, the facade is the
  single source of each section's open state (bound onto the disclosures),
  the study owns its focus, and element ids carry a per-instance suffix
  (WO-019-D030).
- **The model modules** (`libs/features/tools/src/lib/studies/movement/<slug>.model.ts`,
  each with a spec): a pure function from the record's `example.parameters`
  to the frames the `motion` and `timeline` families draw, using the same
  fixed-step arithmetic the prose explains, so the reader can point at the
  drawing, find the step in the pseudocode and change an input. Where the
  behaviour exists in `@dotln-angular/scene-engine` (seek, arrive, flee,
  separation, velocity matching, wander, blending, priority, the formations
  and slot assignment), the model calls the engine's pure function for the
  executable arm and the study's prose explains it, the drawing staying the
  study's own (one or a few bodies, not the twenty-unit scene); the executor
  records per study whether the engine or a study-local step runs, and why.
  The Arrive study's `arrive-example.ts` becomes `arrive.model.ts` and its
  record, and the hand-wired composite goes; the decided form of the Arrive
  study (contents beside the reading, explanations behind disclosures,
  WO-019-D025) is kept by the `study` composite.
- **The study composite** (`libs/features/tools/src/lib/composites/study/study.ts`,
  replacing `arrive-study`): the sections in the record's order, the visual
  first and always available, the explanations behind native disclosures
  that `@defer` their content on first expansion (the catalog rule), the
  RxJS section labelled executable or illustrative from the record, the
  implementations introduced on their own terms (round 20's rule in WO-019's
  handoff), the references as links with the claim each supports, the limits
  as prose, the nearby concepts as links into their readings; the authored
  mark, the author and the date at the head. `ToolsFacade` derives one
  `StudyView` from the record and the model; `ReadingView` gains
  `study: StudyView | null`.
- **Addressable readings and the home** (WO-019-D029): `ChildPaths.Reading =
  'catalog/:toolId'` in `@dotln-angular/core`; the catalog page reads the id
  from the route and writes it when a concept is opened, so Back returns to
  the previous reading and a shared link opens one; the persisted store keeps
  the history and the chosen work and chapter; `buildRoute` builds every link
  (rule 11). The Tools home renders the works, their counts, the studied
  counts and the last reading from `catalog-summary.json`,
  `studies-summary.json` and the persisted history without loading a work's
  chunk.
- **The studied marks:** the shelf shows each work's studied count beside its
  row count; the contents mark a concept with a study by a glyph with a text
  equivalent (G5); the search results carry the same mark; a `studied` facet
  joins the work, kind and status facets inside the results (the catalog
  rule). The general search controls stay WO-018's (WO-019-D017).
- **The twenty concepts**, by the pass's selection rule (the sixteen tools
  the engine runs, then the most-related rows of sections 3.3 and 3.4 not
  among them by resolved in-degree within the work, ties toward typed rows
  then source order, with one recorded substitution: Face for Variable
  matching, because Variable matching is the form Align's and Velocity
  matching's studies explain, and Face is a behaviour the engine can run
  next): `aifg-a:110` Seek, `aifg-a:112` Arrive, `aifg-a:118` Velocity
  matching, `aifg-a:125` Wander, `aifg-a:131` Separation, `aifg-a:144`
  Weighted blending, `aifg-a:145` Flocking, `aifg-a:149` Priority steering,
  `aifg-a:151` Equilibrium fallback, `aifg-a:174` Fixed formations,
  `aifg-a:175` Scalable formations, `aifg-a:177` Two-level formation
  steering, `aifg-a:181` Formation pattern interface, `aifg-a:186` Slot
  assignment, `aifg-b:354` Group movement, `aifg-b:373` Making the creatures,
  `aifg-a:153` Steering pipeline, `aifg-a:116` Align, `aifg-a:120` Pursue,
  `aifg-a:123` Face. The executor may replace one concept whose row cannot
  carry a study of its own (a case-study row with no mechanism) by the next
  row under the same rule, recorded in the decisions file with the row's
  reason.
- **The authoring fan-out** (at most twelve workers: ten authors with two
  concepts each, one factual critic, one reading critic; each a
  `dotln-worker`, or `dotln-worker-fable` on the operator's dispatch, under
  the launchpad's `subagentCap`): each author receives the record contract,
  its two catalog rows with their definitions, relations, hooks and
  verification notes, the decided Arrive record as the worked example of the
  form, the families available, and the rules (own words; the same example
  throughout; nothing fabricated; every reference opened; `accessed` dated;
  `supports` naming the claim; the limits and nearby concepts from the row's
  relations and the author's reading), and returns two records in `draft`
  state with their model modules and specs. The factual critic opens every
  reference and implementation link, checks that each supports the claim it
  is cited for and that no prose contradicts the row's definition, and
  returns findings per study; the reading critic reads each study as the
  operator would and returns where the representations fail to explain the
  same example or where a section is filler. The executor disposes every
  finding in the decisions file, rewrites through the same author (a rewrite
  continues that author and counts once), sets `authored.state: 'checked'`
  with the reviewers named, and records each worker's label, statement and
  token total in `docs/evidence/WO-020/fan-out.md`. The stop rule is declared
  before the spend: the fan-out stops with a recorded decision when the
  workers' totals summed with the session's own pass WO-014's recorded order
  total as `npm run meta` prints it at activation.
  `node scripts/harness.mjs usage <session>` is read before the first spawn
  and at handoff.
- **References and the published word** (rule 23): the works the catalog
  maps are the app's subject matter; a study is written in its author's words
  from the row's definition and public sources; it quotes no passage of a
  work in copyright (the order's own publishing decision, recorded at
  activation), names the chapter it reads, and cites public implementations
  and references by stable URL (the publisher's or author's page, the RxJS
  documentation, pattern catalogs, public repositories) with the date read.
  The executor's link check at handoff records every URL's status in the
  evidence README; the gate does not reach the network.
- **Design brief** (WS-001 rule 25): the study reads in the catalog's measure
  and type scale; the visual sits at the top of the study at the measure's
  width, never a card; the sections are prose with disclosures, no definition
  list, nothing animated at rest. The first pair is where the study lives: A,
  the study inside the reading below the definition, as Arrive today; B, the
  study as its own addressable page reached from the reading by one link,
  with the definition repeated at its head; both rendered at 1440 and 360
  during execution, A then B with the round named in the question and both
  captions; the preference makes the next pair, content and usability before
  cosmetic polish, until the operator says the process is done; a preferred
  candidate alone is not acceptance; the rejected implementation leaves the
  code when its round is decided, its screenshots and an implementation
  record under `docs/evidence/WO-020/design/` the history; a decided choice
  is not relitigated for this order.
- **Documents:** `docs/dev-reference/architecture/catalog.md` gains §Studies
  (the record, the families, the models, the check and the summary, the
  coverage per work, the fan-out and review procedure, the addressable
  route); `docs/ai-reference/catalog-rules.md` gains the rules (a study is
  authored in its author's own words and marked so; every reference carries
  the claim it supports and was opened; a representation an idea does not
  need stays absent; a visual has a text equivalent and never autoplays; an
  executable example has a spec; a draft never ships; a batch's critic
  findings are disposed in its decisions).

Rejected: a study as a hand-wired component per concept, as Arrive was
(axis: twenty components cannot be checked, counted or regenerated, and
D030's maintainability work would repeat twenty times); Markdown files
rendered as studies (axis: no structure to check, mark or count, and the
example cannot drive a drawing); a renderer dependency (Mermaid, manim) for
the families (axis: `concept-study.md` selects none for the catalog, and the
browser stack drew Arrive); studies authored by one worker in series (axis:
the twenty-agent cap and the checkpoint rule serve twenty studies better in
pairs with two critics); a selection by the planner's taste (axis: the
in-degree rule can be checked against the data and leaves the operator's road
to the operator).

Live-run surfaces at the base: the served production build; the catalog
under `/tools/catalog` with the Arrive study; the scene under `/scene` with
`?tool=<id>`.

**Deliverables:** the record type and schema; the twenty records and their
model modules with specs; the loader's study reads and the summary;
`check-studies.mjs`, the npm scripts and the negative fixtures; the `study`
composite and the `motion` and `timeline` families with stories and specs;
the addressable reading route, the home's summary reads and the studied
marks; the two document sections; `docs/evidence/WO-020/` with the fan-out
record, the review record, the link check, the walkthrough and its
screenshots, and the design record.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-020; fast-forward the
   target worktree to the target's `main` if the base moved (WO-014-D001);
   read `node scripts/harness.mjs usage <session>` and record the subagent
   remainder; record the publishing decision (own words, no passage of a work
   in copyright, public URLs) in the decisions file.
2. `concept-study.ts` in `libs/shared/models` (exported through
   `public_api.ts`), `concept-study-v0.schema.json`, `check-studies.mjs` with
   `studies:check` wired into `check:fixtures` and `studies:report`, the
   negative fixtures, the `scripts.md` entry. Check: `npm run test:tooling`
   and `npm run check:scripts` exit 0, and `npm run studies:check` exits 0
   over an empty studies directory.
3. `CatalogLoader.study(id)` and the summary read in `libs/shared/catalog`
   with the test kit; `ChildPaths.Reading` in `core`; the catalog page reads
   and writes the route; the Tools home reads the summaries. Check:
   `npx nx run-many -t test -p catalog core tools` exits 0; a spec asserts
   Back returns to the previous reading.
4. The `motion` and `timeline` families and the `study` composite, with
   stories `Study`, `StudyMotion` and `StudyTimeline`; the Arrive study
   migrated to `aifg/arrive.json`, `arrive.model.ts` and its spec; the
   hand-wired files removed. Check: `npx nx test tools` exits 0;
   `npm run studies:check` exits 0 over one record; `npm run lint:components`
   and `npm run i18n:check` exit 0.
5. The first rendered pair (A inside the reading, B its own page) at 1440 and
   360; the rounds until the operator says done; the decisions file records
   each round; the rejected implementation removed with its record under
   `design/`. Check: `grep -c "Round" docs/evidence/WO-020/design/comparisons.md`
   is at least 1.
6. Write the authors' brief and the two critics' briefs into `fan-out.md`;
   dispatch the ten authors; merge the twenty drafts. Check: `npm run
   studies:check` reports twenty records, failing on their `draft` state by
   design; record the count.
7. Dispatch the factual critic and the reading critic; dispose every finding
   in the decisions file; rewrite through the same authors; set `checked`
   with the reviewers named. Check: `npm run studies:check` exits 0 over
   twenty records.
8. The link check: open every reference and implementation URL once from the
   executor's session and record each status in
   `docs/evidence/WO-020/README.md`. Check: the README lists every URL with a
   status.
9. The studied marks on the shelf, the contents, the search results and the
   `studied` facet. Check: `npx nx test tools` exits 0 with a spec per mark.
10. e2e `apps/dotln-e2e/src/catalog.spec.ts`: a shared link to Slot
    assignment's reading opens it; opening Flocking from the contents and
    pressing Back returns to the previous reading; Flocking's study shows the
    visual with its text equivalent, steps under reduced motion without
    autoplay, expands the pseudocode on command, labels the RxJS reading,
    lists references and nearby links; the shelf shows AI for Games with
    twenty studied; the `studied` facet narrows the results; axe at the board
    spec's threshold; no horizontal overflow at 360, 768 and 1440; the visual
    baselines for the decided form. Check: `npx nx e2e dotln-e2e` exits 0.
11. The walkthrough: the executor performs the Objective's session in the
    served production build, saves one screenshot per step at 360, 768 and
    1440 under `docs/evidence/WO-020/walkthrough/` and writes
    `docs/evidence/WO-020/walkthrough.md` with the dated steps and, for four
    studies, what each explained in the executor's words; the verifier
    repeats the session independently for criterion 1. Check: the files
    exist.
12. Documents: §Studies and the rules. Check: the files carry the new heading
    and `grep -c "own words" docs/ai-reference/catalog-rules.md` is at least
    1.
13. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
    nothing; the chunk sizes recorded beside WO-019's figures in the evidence
    README.
14. Gate plain and review. Check: passing rows, no tracked-byte mutation.
15. Launchpad write-back: `docs/repositories/dotln-angular.md` names the
    study record, the families and the check in its implementation map;
    WS-001's delivery states updated by the final review. Check:
    `npm run test:docs`.
16. The publish, review and records steps as WO-007 steps 15 to 17, with the
    branch `feat/movement-concept-studies`, the title `feat: add concept
    studies for the movement tools and the study record`,
    `docs/evidence/WO-020/` and `docs/final-reviews/WO-020/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run catalog:check`, `npm run studies:check`, `npm run test:tooling`,
`npm run i18n:check`, `npm run check:scripts`, `npm run check:bundle`,
`npx nx e2e dotln-e2e`; in the launchpad order worktree `npm run test:docs`;
then the target gate plain and review once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session
   in the served production build in this order: open Tools, Catalog; read
   the shelf's studied count for AI for Games; open Chapter 3 and find the
   studied marks; open Flocking and step its visual, expand the pseudocode
   and the RxJS reading, open a reference and a nearby concept; follow the
   scene link and come back with Back; open Seek, Separation and Two-level
   formation steering; open the link to Slot assignment's reading in a new
   tab. The VER report carries a `## Walkthrough` section with the dated
   steps and names the screenshots at 360, 768 and 1440 under
   `docs/evidence/WO-020/walkthrough/` (`ls docs/evidence/WO-020/walkthrough | wc -l`
   prints at least 15), and states in the verifier's own words what Flocking,
   Separation and Two-level formation steering do and when each fails, as
   read from the studies alone. The criterion is met only when every step
   completed and that statement is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/aifg/`
   with exactly the twenty ids this order names (or one recorded substitution
   under its rule), every record `authored.state: 'checked'` with at least
   two reviewers named, every reference carrying `title`, `url`, `accessed`
   and `supports`, every `nearby` id resolving, and `studies-summary.json`
   current; `npm run check:fixtures` runs the check (its output names
   `check-studies`); a tooling test asserts that each of the three negative
   fixtures fails it.
3. Every `visual.model` and `executable.module` a record names exists with a
   spec beside it, and `npx nx test tools` exits 0 with those specs; for the
   Arrive record the model's frames at the example's parameters equal the
   values the base's `arrive-example.spec.ts` asserted, so the migration
   changed no number (a spec states the comparison).
4. `docs/evidence/WO-020/fan-out.md` lists at most twelve workers with their
   labels, one-line statements and token totals beside the session's own and
   WO-014's recorded order total, with the decision that stopped the fan-out
   if their sum passed it; `docs/evidence/WO-020/review.md` lists every critic
   finding with its disposition; `docs/evidence/WO-020/README.md` records
   every reference and implementation URL with the status the executor's
   link check observed, and no committed record cites a URL recorded as
   unreachable or a reference the factual critic marked unsupported.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 10 cases: the shared
   link opens the reading; Back returns to the previous reading; the study's
   visual has a text equivalent and does not autoplay under reduced motion;
   the pseudocode expands on command; the RxJS label reads as the record
   says; the shelf's studied count reads twenty; the `studied` facet narrows
   the results; axe at the board spec's threshold; no horizontal overflow at
   360, 768 and 1440.
6. `grep -rlE "<dl|dotln-key-value-list" libs/features/tools/src` prints
   nothing; `grep -rl "arrive-study" libs/features/tools/src` prints nothing;
   `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the study composite, the families and the records
   in lazy chunks, and `npm run check:bundle` passes with the catalog chunk
   sizes recorded beside WO-019's figures in the evidence README.
7. `docs/dev-reference/architecture/catalog.md` carries the heading `Studies`;
   `docs/ai-reference/catalog-rules.md` states that a study is authored in
   its author's own words and marked so and that every reference carries the
   claim it supports (`grep -c "own words" docs/ai-reference/catalog-rules.md`
   is at least 1); `docs/dev-reference/workspace/scripts.md` names
   `check-studies.mjs` with its purpose and status and `npm run check:scripts`
   exits 0; `package.json`'s `dependencies` keys equal the base's.
8. `docs/evidence/WO-020/design/comparisons.md` records the first pair (A
   inside the reading, B its own page) and every later round with its pick,
   and the decisions file records the operator's word that ended the rounds;
   no rejected candidate's component remains under `libs/features/tools/src`
   (the decisions file names the removed files and `ls` on each prints
   nothing).
9. `node scripts/target-gate.mjs WO-020 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-020/README.md`, `docs/evidence/WO-020/fan-out.md`,
`docs/evidence/WO-020/review.md`, `docs/evidence/WO-020/walkthrough.md` and
its screenshots, `docs/evidence/WO-020/design/`, and
`docs/evidence/WO-020/host-qualification.md`.

**Known issues and carry-ins:** This is the pilot of the concept-study
program: the record, the check, the families and the route it lands are what
WO-021 to WO-024 build on, so a change to the record's shape after this order
merges is a new schema version, never an edit of `concept-study-v0`.
WO-019-D030's maintainability work (geometry and prose values from the model,
the facade as the single source of open state, the study owning its focus,
per-instance ids) is this order's, in the families and the study composite.
WO-019-D029's addressable readings and summary-driven Tools home are this
order's, moved here from WO-018's carry-ins by the 2026-10-30 second pass;
WO-019-D017's search controls stay WO-018's. The priority-steering shimmer
WO-015-D010 recorded (`FUP-e9b95694a5de071e`) is a limit the Priority
steering study states as such, not a defect this order fixes. A "read the
study" link from the scene's inspector to a tool's study is candidate C5 of
the filing pass; the executor may take it as a named boy-scout item inside
the Tools and scene features' authority, or leave it. A reference that stops
resolving after the order merges is a content defect the next batch's link
check reports. Whether the link check becomes a committed helper is the
executor's decision under rule 26 (a helper with its `scripts.md` entry, or
an ad hoc run recorded in evidence). The base is WO-015's merge commit, the
target's `main` at filing. This order activates only on a launchpad whose
starter carries core WO-221's `--draft` form; the draft pull request and its
workflow runs are a final-review obligation read from
`docs/evidence/WO-020/preview-pr.json`, never a criterion. `Target release
classification: minor` and `Target release notes: reviewed` are set under
WO-012's declared policy.

**Non-goals:** studies for any other work (WO-021 to WO-024); the `marbles`,
`flow`, `states` and `relations` families; the general search controls
(WO-018); a renderer dependency or a media pipeline (candidate
`FUP-c586b038c0bde21b`); changing the scene engine or the scene page; mining
a new work; translating study text (it is data, G3).

**Operator-review assumptions:** the operator accepts the in-degree selection
rule and the twenty concepts it names with one recorded substitution, accepts
that a study quotes no passage of a work in copyright and is written in its
author's words, judges the first pair and ends the rounds in their own words,
and reads the one draft pull request before final review, which the final
publish reuses.
