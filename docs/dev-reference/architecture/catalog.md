# Toolbox catalog

Tools at `/tools` opens a library of works ([the inventory](#reproducible-source-join));
`/tools/catalog` is its reading surface. Choosing a concept changes the reading session, never the
platform or a running scene. The catalog is a foundation for studying and
trying ideas, including several explanations of one idea.

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

`CatalogToken` exposes `CatalogLoader.load(work?)`; `provideCatalog()`, in
`libs/shared/catalog/src/lib/catalog-loader.ts`, provides the bundled loader and
the store. The Tools routes provide it once on
their shared parent route, so the home and the catalog page read one store and
the catalog loads once; the scene's route provides it too and injects only the
token. Each work imports its named JSON chunks; parallel requests share a pending
promise and failed requests are evicted for retry. A loading failure is visible and
retryable, never presented as an empty success.
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
relationFollowed, readingReturned and searched; filtersChanged and pageChanged
remain for the search facets and paging. Choosing the open chapter or section
again closes it. An empty section key denotes the Concepts group of a chapter with
no named sections; null denotes no group chosen, and this distinction survives
restoration. Reading navigation updates the selected work, chapter and
section, a bounded return stack and the ten most recent unique ids.

Only versioned reading state is persisted at `dotln-angular.tools`: work,
chapter, section, selected id and last ten readings. Catalog data, query, facets,
page, return stack and loading errors are transient. The old filter-shaped
state is ignored. Restored ids are checked against loaded data.

## Reading and studying

The shelf on the catalog page shows each work's title, count and primary scene; Tools
home lists the titles and counts with a last-reading link. Each work has one
colour token, `--dotln-work-<slug>` in `libs/shared/ui/src/styles/_tokens.scss`;
the shelf draws its spine and title in that colour and widens the chosen work's
spine. The soldier scene's rail uses the same tokens for a tool's provenance,
and the field skin lightens them so they read on its dark ground.

Contents groups chapters, sections and concepts in source-line order. The reading
measure is bounded for prose. It renders the full definition, related links, grouped
hook sentences and a typed tool's faces as one sentence (`tools.reading.faces`) with
its parameters and defaults. Unlinked relations and untyped reasons remain visible. A
tool the scene runs links to `/scene?tool=<id>`, which arrives with it chosen; the
link is the container's, projected into the reading so the composite stays free of
the router. Opening a concept focuses its reading region; following a relation
provides a return action.

Search covers titles and definitions, prioritizes an exact title, and shows
30 results per page with work/kind/status facets. Each result names its work
by title. Long unbroken titles wrap. Enter opens the first result.

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

### The Arrive study

Arrive has an additional original teaching study, distinct from the mined definition,
in `libs/features/tools/src/lib/composites/arrive-study/` and
`libs/features/tools/src/lib/arrive-example.ts`: a custom one-dimensional drawing, a
velocity-over-time chart, time scrubbing, ordinary and RxJS pseudocode, limitations
and public references. This is not the soldier scene, and other concepts do not claim
this enrichment.

Movement and Velocity share the same timeline while the reader switches views. The
diagrams explain actual versus desired velocity using tested fixed-step arithmetic,
and the late-braking chart takes its axis labels from the same scales that plot its
runs. The mechanism explanation works through the selected moment’s distance, desired
velocity, acceleration limit and next position using that same calculation; its values
stop deriving while the explanation is closed.

The ordinary pseudocode is shown complete, then explained in four steps; each step's
own lines sit in a disclosure that starts closed. The RxJS version is labeled
illustrative and explains its omitted host responsibilities.

Expandable explanations use native disclosure semantics and Angular `@defer`
with explicit open-state conditions. The explanation component is referenced
only inside deferred blocks, allowing its component code and pseudocode to load
on first expansion. Closed, never-opened explanations are not instantiated.
A loaded explanation is retained when collapsed; no active animation or timer
runs in it. Future animated explanations must suspend their work while hidden.
Loading and failure text accompany delayed imports. The visual above the
sections is immediately available and only changes on user input.

## Evidence

Unit and tooling checks cover all rows and source-join safeguards, summary
counts, exact relation targets, v0 compatibility, retries, persistence, search,
paging, recent readings and the teaching model's motion limits. Browser tests
exercise the objective reading session, keyboard/touch controls, loading
boundaries, disclosure rendering, the board's serious/critical axe threshold
and overflow at 360, 768 and 1440 pixels. Review actual screenshots before
accepting new visual baselines.

The feature's Nx name is `tools`; shared data lives under `catalog` and
workspace scripts under `workspace-tools`. Run [the checks](../README.md#checks)
after changing any of them.

See [the catalog rules](../../ai-reference/catalog-rules.md), and
[the mapping method](concept-mapping.md) for applying a concept in several contexts
without exhausting it in its first analogy.
