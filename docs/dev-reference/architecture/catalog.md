# Toolbox catalog

Tools at `/tools` opens a library of works ([the inventory](#reproducible-source-join));
`/tools/catalog` is its reading surface, and `/tools/catalog/<tool id>` is one concept's reading.
Choosing a concept changes the reading session, never the platform or a running scene. The catalog
is a foundation for studying and trying ideas: [a study](#studies) explains one concept from several
sides.

## Data and provenance

The readonly `Tool` union in `libs/shared/models/src/lib/toolbox.ts` uses the
closed `tool-v1` schema. Every row carries its definition, place in the work,
related concepts, suggested hooks and verification note. The place retains
part, chapter, section and subsection where supplied. Each relation preserves
its source title and has either an exact target id or null. Hook domains are
the declared D1–D11 set. Verification distinguishes sourced, model-knowledge
and partial; the original note remains visible in a disclosure.

Definitions are the mining run's mapping prose. A sourced label preserves the
run's assessment; it is not a new claim that this implementation checked the
book. Model-knowledge and partial rows have an adjacent explanatory note.
Relations resolve only when an exact title has one match within the same work.
Missing, ambiguous or self-referring matches stay readable as unlinked text. No fuzzy match or
cross-work guess supplies a false destination.

Executable candidates retain five faces: scene, selection, transform,
observable and toy metric. The optional role analog can accompany any status.
Typed rows use the closed `TransformKind`; untyped candidates carry a specific
reason. Background concepts, scene elements and metrics have no faces.
A typed label states a contract, not an implemented engine: only the kinds in
`sceneTransformKinds` run, in [the soldier scene](scene.md).

Mapped ids retain the fixed map slug and one-based JSONL line. A mapped row
requires a basename, line and original-byte SHA-256; public-work provenance
requires a null map. Never silently renumber rows. The schema rejects unknown
fields and invalid enum values, while permitting the full source prose without
arbitrary string-length ceilings.

The schema is `libs/shared/catalog/src/schema/tool-v1.schema.json`
(`additionalProperties: false` throughout):

| Shape       | Fields                                                                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool        | `id`, `work`, `title`, `rowType`, `kind` (`behaviour`, `rule`, `mode`, `relationship`, `analysis`, `sceneType`, `sceneElement`, `metric`, `background`), `status` (typed, untyped, background), `classifiedBy`, `provenance`, `map`, `definition`, `place`, `related`, `hooks`, `verified`, optional `faces` and `analog` |
| `map`       | `file` (basename), `line` (one-based), `sha256`; null for public-work provenance                                                                                                                                                                                                                                          |
| `place`     | optional `part`, required `chapter`, optional `section` and `subsection`                                                                                                                                                                                                                                                  |
| `related`   | `{ title, id }`, with `id` a same-work tool id or null                                                                                                                                                                                                                                                                    |
| `hooks`     | `{ domain, clause }`, domain D1–D11                                                                                                                                                                                                                                                                                       |
| `verified`  | `{ kind: sourced, model-knowledge or partial, note }`                                                                                                                                                                                                                                                                     |
| `faces`     | `scene`, `selection { target, min, max }`, `transform`, `observable`, `toyMetric`                                                                                                                                                                                                                                         |
| `transform` | typed `{ kind, params: [{ name, unit, default, min, max }] }` or `{ kind: 'untyped', reason }`                                                                                                                                                                                                                            |
| `analog`    | `{ roles, clause }`                                                                                                                                                                                                                                                                                                       |
| Checkpoint  | `{ schema: 'tool-v1', batch, maps: [{ file, rows, sha256 }], tools }`                                                                                                                                                                                                                                                     |

The data lives in `libs/shared/catalog/src/data/`: one checkpoint per batch and the
summary, `catalog-summary.json`, which has `schema: 'catalog-summary-v1'`, `date`,
`mappedRows`, `totalRows`, `maps`, `counts` (work, kind, transform kind,
status), `workers` and per work `work`, `sceneType`, `typedShortfall`,
`chapters: [{ part, title, count }]` and `sceneTools`, the ids of the work's typed rows
whose kind is in `sceneTransformKinds`. The summary's `date` is the UTC day the join last
wrote it. Team
Topologies' typed shortfall of one stays visible, and `catalog:check` pins it.

The clean room does not govern the books, films or ideas the operator
references for this app. The locked employer and secret boundary still applies.
Catalog validation therefore does not apply the board scrubber to reference
text. Map paths stay local input; committed provenance uses basenames and
digests. Quarantine material is not an input.

## Reproducible source join

`tools/scripts/catalog/join-maps.mjs`, run as
`npm run catalog:join -- <research-run-directory>`, reads exactly the declared
maps beneath that run's `out/maps`, `out/geb` and `out/tt` (each
batch names its folder in `tools/scripts/catalog/check-catalog.mjs`). It never
enumerates or writes the source directory. It verifies every digest, row count and
line identity, restores content by source line, resolves relations and validates the
complete result before replacing any output. A changed digest or row count stops the join
before any write; accepting a changed map is a recorded decision, never a silent
renumbering. A malformed source row stops it with the map file and line. Each
checkpoint and the summary is replaced atomically; this is not a transaction across
the files if the filesystem fails during replacement.
Run `npx prettier --write libs/shared/catalog/src/data` afterwards; the format
check covers the data files.

The verification kind comes from the run's note: a note that says "partial" as a
word is partial (a URL naming `PartialObserver` is not), a note starting
`model-knowledge` or `MK` is model-knowledge, and any other note is sourced. The
check refuses a row whose stored kind differs from its note.

The fixed inventory is 3,463 mapped rows across AI for Games A/B, EIP, PoEAA,
RxJS core and patterns, GEB and Team Topologies: six works, eleven maps and eight
checkpoints, which `tools/scripts/catalog/check-catalog.mjs` pins. Coverage and
usefulness are distinct: an untyped concept can still be valuable.

`catalog:check` validates schema, full line coverage, provenance, relation
destinations and summary counts. `--partial` is only intermediate evidence;
ordinary validation requires the full inventory. Hidden filesystem metadata is
ignored; unexpected data files fail. `catalog:report` prints count dimensions,
each work's resolved relations as a count and a percentage, and its scene tools.

The join preserves classifications and faces. Source-warranted steering and
formation rows expose the parameters the soldier scene reads. No invented
objective or squad operation is attached to an unrelated source term.
A changed transform contract needs its own explicit provenance and review
decision.

A new work needs a source and provenance decision, its own classification and
review, and corresponding tests. It then touches:

- `batches` in `tools/scripts/catalog/check-catalog.mjs` (work, folder and map
  id prefixes) and the pinned digests in its checkpoint and the summary `maps`;
- `workSlugs` in `libs/shared/models/src/lib/toolbox.ts` and the schema's
  `work` enum;
- the shelf's title and scene type in `libs/shared/catalog/src/lib/reading.ts`
  (the data spec runs the shelf over every bundled work) and the loader's chunk
  map in `catalog-loader.ts`;
- a `works` entry (`work`, `sceneType`, `typedShortfall`) seeded in
  `catalog-summary.json`, which the join carries forward, the recorded totals in
  `check-catalog.mjs` and `catalog-data.spec.ts`, and the inventory above;
- a `--dotln-work-<slug>` colour token and the shelf's per-work style.

## Loading and state

`CatalogToken` exposes `CatalogLoader`: `load(work?)` reads the tools, `summary()` reads the works
and their studies without loading a work, and `study(id)` reads one concept's study, loading that
work's studies once, or answers null. `provideCatalog()`, in
`libs/shared/catalog/src/lib/catalog-loader.ts`, provides the bundled loader and
the store. The Tools routes provide it once on
their shared parent route, so the home and the catalog page read one store; the
scene's route provides it too and injects only the
token. Each work imports its named JSON chunks; parallel requests share a pending
promise and failed requests are evicted for retry. A loading failure is visible and
retryable, never presented as an empty success, and a summary that fails where the tools loaded
says so above the catalog, which stays readable without its counts and marks. A page opened again
over loaded data fetches nothing, so moving between `/tools/catalog` and a reading shows no loading
state.
Features do not import the data files. A later API can replace the provider
without changing the reading feature. Presentational components and mappers take
shared shapes (`CatalogWork`, `CatalogChapter`, `isSceneTool`) from
`@dotln-angular/models`; lint refuses their imports of `@dotln-angular/catalog`.

The loader accepts tool-v0 for one compatibility release through a private
reader in `catalog-loader.ts`. A legacy row gets an explicit
unavailable-definition message, empty relations/hooks/place and a partial note.
It never invents a definition. New writes and the complete catalog check use v1.
The next change to the loader removes the reader and its type.

`CatalogStore`, in `libs/shared/catalog/src/lib/catalog-store.ts`, uses the shared
event, command, call-state and persistence features.
UI intents include workChosen, chapterChosen, sectionChosen, conceptOpened,
readingReturned, readingClosed and searched; filtersChanged and pageChanged
remain for the search facets and paging. Choosing the open chapter or section
again closes it. An empty section key denotes the Concepts group of a chapter with
no named sections; null denotes no group chosen, and this distinction survives
restoration. Reading navigation updates the selected work, chapter and
section, a bounded return stack and the ten most recent unique ids.

The address owns the open reading. `ChildPaths.Reading`, `catalog/:toolId`, binds the id to the
catalog page's `toolId` input, and `ToolsFacade.arrive` brings the store in line with it, so a
shared link opens a reading and `/tools/catalog` opens none. Reaching the id on top of the return
stack counts as going back, so the browser's Back and the page's own return control make the same
transition. `buildRoute` fills the route's parameter. Every link to a reading is a real address,
so it can be copied or opened in a new tab: composites take a `hrefFor` function and handle a plain
click themselves, because they may not use the router. An id the catalog does not have says so.

Only versioned reading state is persisted at `dotln-angular.tools`: work,
chapter, section, last ten readings and the newest reading's title, which lets the home name it
without loading its work. Catalog data, query, facets,
page, return stack, the open reading and loading errors are transient. The old filter-shaped
state is ignored. Restored ids are checked against loaded data.

## Reading and studying

The shelf on the catalog page shows each work's title, count, studied count and primary scene.
Tools home lists the titles, counts and studied counts with a last-reading link, all from
`catalog-summary.json`, `studies-summary.json` and the stored history, so it loads no work's chunk;
`ToolsHomeFacade` reads them. Each work has one
colour token, `--dotln-work-<slug>` in `libs/shared/ui/src/styles/_tokens.scss`;
the shelf draws its spine and title in that colour and widens the chosen work's
spine. The soldier scene's rail uses the same tokens for a tool's provenance,
and the field skin lightens them so they read on its dark ground.

Contents groups chapters, sections and concepts in source-line order, and marks a concept with a
study by a glyph with a text equivalent. With a work chosen and no concept open, the reading area
lists that work's studied concepts. The reading
measure is bounded for prose. It renders the full definition, related links, grouped
hook sentences and a typed tool's faces as one sentence (`tools.reading.faces`) with
its parameters and defaults. Unlinked relations and untyped reasons remain visible. A
line under the title jumps to the study, when there is one, and a
tool the scene runs links there to `/scene?tool=<id>`, which arrives with it chosen; the
link is the container's, projected into the reading so the composite stays free of
the router. Opening a concept focuses its reading region; following a relation
provides a return action.

Search covers titles and definitions, prioritizes an exact title, and shows
30 results per page with work, kind, status and studied facets. Each result names its work
by title and carries the studied mark. Long unbroken titles wrap. Enter opens the first result.

`ToolsFacade`, in `libs/features/tools/src/lib/facades/tools.facade.ts`, derives one
view model and handles intents. The container connects shelf, contents, reading mapper,
search and history; presentational components receive inputs and emit intent outputs.
Source text is untranslated data; host-authored framing uses the message system. The
house menu stays in the lazy Tools route, so opening a facet downloads no further
script.

The surface's look is refined through repeated rendered pairs. A preference informs the next
comparison; the operator alone ends that process, and ended it for this surface on
2026-10-28. The preferences put contents beside the reading and explanations behind
disclosures, and several explanations can stay open for cross-reference. Decided
alternatives are removed during execution; screenshots, decisions and an implementation
record preserve the history, and no comparison switches remain in the application.
Content, usability and usefulness are addressed before UI polish.

## Studies

A study explains one concept from several sides, on one example, in its author's own words. It sits
in the reading below the definition, marked as authored, and the definition keeps its provenance
beside it. The operator's direction for what a study is lives in the launchpad's
`docs/product/concept-study.md`.

### The record

`ConceptStudy`, in `libs/shared/models/src/lib/concept-study.ts`, is one JSON file per study at
`libs/shared/catalog/src/studies/<work>/<slug>.json`, validated by the closed
`concept-study-v0.schema.json`. It carries the authored state, the intuition with a situation it
serves, the example with its parameters, the mechanism's steps, ordinary pseudocode, an optional
RxJS reading and executable module, the visual, implementations, references, limits and nearby
concepts. A change to the record's shape after it has shipped is a new schema version, never an
edit of `concept-study-v0`.

A representation an idea does not need is null or an empty list, never filled. The mechanism's
steps and the blocks of the ordinary pseudocode separated by a blank line match one to one, so the
page shows each step beside its own lines. Prose reads the selected moment through `{name}`
placeholders in the example's description, the text equivalent, the mechanism's steps and the
limits, so a number a model computes never lives in prose.

Each work's records load as one lazy chunk, `studies/<work>.ts`, beside the tool data and apart
from it, so a regenerated join never touches a study. A new work's chunk also needs an entry in
`studyChunks` in `catalog-loader.ts`.

### The models

A model module, `libs/features/tools/src/lib/studies/<subject>/<slug>.model.ts` with a spec beside
it, exports `model`: a pure function from the record's parameters to the example's run
(`StudyModel` in `studies/study-model.ts`). It returns the frames the drawing reads, a timeline, the
named moments, the legend and caption, and, where they help, each moment's note, the worked
arithmetic of that moment, a comparison that makes a failure visible and the inputs a reader may
change. `studies/study-models.ts` lists the modules by the path the record names, and each loads
with the study that reads it. Where the scene engine has the behaviour, the model calls the
engine's pure function, so the study explains what actually runs; the drawing stays the study's
own, a few bodies and not the twenty-unit scene. Arrive keeps a study-local step because its
worked numbers are pinned. `studies/drawing.ts` holds what the models share about laying a drawing
out: the width it is drawn at, the box round a run's frames and the rule that drops a name which
would collide with one already placed.

A model that throws, or a record naming a model the list lacks, fails that study alone: the reading
stays open and offers the study again, from the record's own inputs.

### The families

A visual family, under `libs/features/tools/src/lib/composites/study-visuals/<family>/`, is one
composite that takes a declarative model and a step index and draws an SVG with a text equivalent.
Geometry derives from the model in a pure `*-drawing.ts` module with its own spec. `motion` draws the
positions of bodies, with their vectors, zones, links and marks, over frames in one or two
dimensions. `timeline` draws series over time with the moment marked, or a still chart when it has
no step. `scrubber` and `inputs` are the controls they share. The other names in `visualFamilies`,
`marbles`, `flow`, `states` and `relations`, land with the batch that first needs each.

Nothing runs by itself. A reader moves through the example by the slider, Step back, Step forward
and the named moments, or presses Play, which runs from the selected moment at the example's own
pace and stops on any hand step, on leaving the reading and at the end. A reader who asks for
reduced motion is not offered Play, and asking while the example runs stops it. The moment's short sentence stays on screen; its full text is
the drawing's accessible name and sits behind Show the numbers. A slider under Try another value
reruns the whole model with one input changed, and Back to the example restores it. A study opens on
the moment its author chose as the most telling, and the switch's two views are always Movement and
Chart, with the chart's own title above it.

### The composite

`composites/study/study.ts` shows the study in the order the operator chose: the authored mark, the
idea and the situation, the drawing with its controls, then the explanations in native disclosures,
with the mechanism, the RxJS reading, the limits and then the implementations with the references,
then the nearby concepts and a link to the work's next study. Everything a reader may want only
sometimes is one click away: the example in full, the moment's numbers, the inputs and how to read
the drawing. `ToolsFacade` derives one `StudyView` from the record and the model through `mapStudy`,
and `ReadingView` carries it; the facade is the single source of every disclosure's open state,
bound onto the disclosures, so switching between the drawing and the chart keeps them, and every
reader intent reaches it as one `StudyIntent`. The study owns its focus, and element ids carry a
per-instance suffix.

Explanations use native disclosure semantics and Angular `@defer` on first expansion, so a section
never opened creates no view and downloads no code. A loaded explanation is kept when it is
collapsed. Loading and failure text accompany delayed imports. Implementations are introduced on
their own terms, references are links with the claim each supports, and the RxJS reading says from
the record whether it is illustrative or executable.

### The check and the coverage

`npm run studies:check`, `tools/scripts/catalog/check-studies.mjs`, runs inside `check:fixtures`. It
validates every record against the schema, resolves its id, work and nearby ids against the catalog,
checks that a model or executable module exists with a spec beside it, matches the mechanism's steps
to the pseudocode's blocks, refuses a draft and a record with fewer than two different reviewers, and
compares `studies-summary.json` with the records. `--write-summary` rewrites the summary, a stale
one fails, and a work's chunk must import and export each of its records. A record the schema refuses
is reported and stops the check before anything counts it, so nothing is written from it. `npm run studies:report` prints each work's studied,
checked and total rows, and `npm run studies:links` opens every cited address once; it reaches the
network, so a batch runs it by hand and records the result, and no gate does.

### Writing a batch

A batch is authored by a fan-out: authors with two concepts each, a factual critic who opens every
reference and implementation and checks each supports its claim, and a reading critic who reads as
the operator would. Each author receives the record contract, its catalog rows, a decided study as
the worked example and the rules; a rewrite continues the same author. The batch's decisions dispose
of every critic finding, then the records are set to `checked` with the reviewers named. Link rot
after a batch merges is a content defect the next batch's link check reports.

## Evidence

Unit and tooling checks cover all rows and source-join safeguards, summary
counts, exact relation targets, v0 compatibility, retries, persistence, search,
paging, recent readings, the study check's rules and every model's claims, across
each input's range. Browser tests
exercise the objective reading session, shared links and Back, keyboard/touch controls, loading
boundaries, disclosure rendering, reduced motion, the board's serious/critical axe threshold
and overflow at 360, 768 and 1440 pixels. Review actual screenshots before
accepting new visual baselines.

The feature's Nx name is `tools`; shared data lives under `catalog` and
workspace scripts under `workspace-tools`. Run [the checks](../README.md#checks)
after changing any of them.

See [the catalog rules](../../ai-reference/catalog-rules.md), and
[the mapping method](concept-mapping.md) for applying a concept in several contexts
without exhausting it in its first analogy.
