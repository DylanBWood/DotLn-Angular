# Toolbox catalog

The Catalog utility is under Tools at `/tools/catalog`; `/tools` lists the
available utilities. Its rows are the app's data. Browsing or selecting a row
does not execute a transform or change platform state.

## Data contract

`libs/shared/models/src/lib/toolbox.ts` defines the readonly `Tool` union.
`libs/shared/catalog/src/schema/tool-v0.schema.json` validates the same shape.
Each executable candidate describes five faces: scene, selection, transform,
observable changes and toy metrics. An optional analog names platform roles.
Typed rows use the closed `TransformKind` enum. Untyped candidates carry a short,
specific reason; background concepts, scene elements and metrics have no faces.
The catalog does not claim that the scene engine already implements a typed row.

The catalog also captures useful metaphors for the app, code, meta-processes,
human/code interaction and agent coordination. These belong in the optional
analog on any status. For example, the operator's Boy Scout rule can guide an
executor's bounded cleanup or a reviewer's handoff expectations. Its usefulness
does not depend on a game mechanic. An analog names the practical correspondence;
an execution label separately states whether a closed transform expresses the
toy effect. Avoid generic analogs that add no application beyond the title.
Follow [the concept-mapping method](concept-mapping.md) to examine several target
areas, including concepts already applied elsewhere, and communicate coverage
without equating executable counts with usefulness.

Mapped ids retain the source file's fixed slug and one-based JSONL line. A row
with `provenance: 'map'` requires a basename, line and original-byte SHA-256;
`provenance: 'public-work'` requires `map: null`. Ids are never silently renumbered.

The allow-list admits ids, short titles and generic terms. It rejects raw
definitions, relations, hooks, verification text, chapter and section fields,
including unexpected nested properties. Titles are limited to 80 characters;
analog clauses, untyped reasons and observable entries to 120. Every string
passes the shared scrub check. Map filenames are basenames, never intake paths.

## Classification and checkpoints

Eight classifier batches cover eleven maps and 3,463 mapped rows: AI for Games
A and B, EIP, PoEAA, RxJS core and practice, GEB's two parts, and Team Topologies'
three parts. Each classifier reads only its assigned maps, the type contract and
the allow-list brief. No quarantine file is read. Each writes one checkpoint in
session scratch and records its label, map basenames, row counts and read statement.
Only the executor imports checkpoint data into the repository.

Two seeded sampling checks each judge 40 typed tools across the batches: the
transform must be observable in a twenty-unit toy, and an analog must name a
real role. A failed id returns to its original classifier, which changes only
that id. The same checkpoint is validated and merged again. The synthesizer
records counts, primary scenes and up to three typed examples per work; a critic judges the
summary and three seeded samples. A shortfall stays visible under the operator's
WO-014 criterion amendment; a classifier never invents a transform to meet a quota.
The primary scene recommends a starting point; examples retain their own scene types.

`tools/scripts/catalog/merge-checkpoints.mjs` accepts a scratch directory,
validates every incoming checkpoint before writing, sorts by id and replaces
each batch atomically. `npm run catalog:check -- --partial` validates the merged
subset during classification; it cannot certify a complete catalog. The ordinary
`npm run catalog:check` requires all eight files and the summary, checks complete
source-line coverage, provenance digests, unique ids and computed counts.
`npm run check:fixtures` includes this complete check after the board fixtures.
`npm run catalog:report` prints all count dimensions and each work's examples.

The check scans only `libs/shared/catalog/src/data/`. A later order's new source
map lives under its own directory and check; it does not silently enlarge this
recorded eleven-map inventory. Adding a work requires a source/provenance decision,
its own classification and review, an explicit loader entry and corresponding
tests. Extending the transform enum requires a recorded decision and compatible
scene-engine semantics.

## Loading and UI state

`CatalogToken` exposes the `CatalogLoader.load(work?)` promise interface.
`provideCatalog()` supplies the bundled loader and route-scoped `CatalogStore`.
Each work imports only its named JSON chunks; parallel requests share a pending
promise, and a rejected load is evicted so retry can succeed. Features know the
loader contract, not the import paths. A future mining API can supply a different
loader without changing the feature. Catalog data is bundled while the actor
board uses HTTP; both paths are explicit until that API replaces the imports.

The store uses the existing event trinity, call state and persistence support.
Only filters and selected id are persisted at `dotln-angular.catalog`; the
catalog and loading errors are not. Restored filters are checked against the
closed values. Work options are derived from the loader's complete result, so a
new work needs no feature-side slug list and filtering cannot hide other works.
`ToolsFacade` derives the filtered rows, selection and pagination;
containers send UI events and presentational composites receive inputs. The
browser renders 50 rows per page so the full catalog does not create thousands
of controls at once. Pure filters and `firstThree(work)` are exported by the
catalog library; its `/testing` entry point provides a small replaceable loader.

All framing strings use the message system. Source titles, ids, face values and
reasons are untranslated data. Filters use the house `dotln-menu` wrapper from
`@dotln-angular/ui/menu`, loaded statically with the lazy Tools route. Opening a
filter needs no additional script request. The
Tools home composes `dotln-key-value-list`. Unknown routes reach the shell's
translated not-found page through the last app route, with a canonical board link.

## Verification

Unit tests cover the schema, every shipped row, summary examples, pure filters,
lazy loading, retries, provider substitution, persisted filters, paging and tool
details. Tooling tests prove rejection of a forbidden definition, duplicate or
missing lines, wrong ids/digests, private paths and invalid nested shapes.
Playwright checks the utility link, filtering, untyped reasons, selection after
reload, keyboard use, unknown routes, the board's axe threshold and overflow at
360, 768 and 1440 pixels. Catalog stories cover its home, browser, list and the
three kinds of detail state.

The feature's Nx name is `tools`; workspace check scripts retain their targets
under `workspace-tools`. Both appear in `nx show projects`.
