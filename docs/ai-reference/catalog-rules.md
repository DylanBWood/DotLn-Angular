# Catalog rules

- Serve the UIFA engineer's authorship: catalog applications are candidate
  material for constructing, comparing and refining actor behavior. Preserve the
  engineer's mapping judgment, costs, scenarios and limits; generated analogs
  are proposals, not equipped behavior. The current catalog is the foundation
  for the broader workshop, not an implementation of all its later capabilities.
- Use metaphor, analogy, simile, anthropomorphic representation and simulation
  deliberately to make difficult ideas manipulable. Separate the underlying
  relationship, its convenient scene representation, the observed differences
  and the correspondences to other contexts. Preserve portable findings rather
  than binding an idea permanently to the scene that helped reveal it.
- Explore variations of models: timing, order, direction, role exchange, scale
  and layering can expose preserved relationships and useful differences. Save
  the starting model, transformation and observation; add executable transforms
  only through the existing decision rule.
- Capture useful metaphors across the app, code, working processes and agent
  interactions. An analog states a specific application and actual platform roles;
  it may accompany any status. Background is a representation category, not a
  judgment of usefulness. A metaphor does not require a literal source-domain simulation.
- A concept is not used up by its first application. Revisit existing mappings
  across app behavior, code, agent coordination, working processes and human
  interaction. State the expected effect, an observable signal and where the
  analogy breaks. See [the mapping method](../dev-reference/architecture/concept-mapping.md).
- Communicate typed coverage separately from conceptual usefulness. Name the
  batches and target areas reviewed, give concrete examples and limits, and record
  further mining as follow-up. Do not present a single role analog as exhaustive.
- Treat system traps and anti-patterns as diagnostic vocabulary across the app,
  processes and the processes that change them. Name the observed symptom,
  suspected mechanism, proposed intervention and evidence that could refute the
  diagnosis. Check whether the intervention recreates the trap at another level;
  a familiar label alone does not establish a diagnosis.
- A tool has five faces: scene, selection, transform, observable and toy metric.
  The role analog is optional. Background, sceneElement and metric rows have no faces.
- The transform enum is closed and grows only by a recorded decision. A typed
  label describes a contract; only the kinds in `sceneTransformKinds` run in the
  scene, and the engine's `interpretedKinds` must equal them.
- Preserve uncertain candidates as untyped with a nonempty specific reason;
  type a row only when its definition warrants the contract.
- Carry the admitted run's full definitions, related titles, hooks, verification
  notes and place fields. Resolve a related title only to a unique exact match
  of another concept within the same work; keep ambiguous, missing or
  self-referring matches unlinked. Retain the original verification note and
  derive its kind from the note alone: "partial" as a word marks partial, a
  leading `model-knowledge` or `MK` marks model-knowledge, anything else is
  sourced. The catalog check refuses a stored kind that differs from its note.
- The clean room does not govern the works the operator references. Preserve
  the locked employer/secret boundary, but do not apply the board scrubber or
  arbitrary prose-length ceilings to catalog content. No quarantine file may be
  opened. Raw maps remain read-only intake.
- Keep line-based ids stable and record original-byte SHA-256 digests with
  basenames. Pair map provenance with its map object, public-work provenance
  with null. Write readonly tool-v1 content; accept v0 through the loader for one
  compatibility release with an explicit unavailable-definition message.
- Join only the declared maps, through `tools/scripts/catalog/join-maps.mjs`; it needs
  the research run's directory, which the
  [catalog architecture](../dev-reference/architecture/catalog.md#reproducible-source-join)
  describes. Then format the data with
  `npx prettier --write libs/shared/catalog/src/data`. Verify all pinned digests,
  source lines and complete output before writing. Preserve existing
  classifications unless a source-warranted change has been recorded. Earlier
  classification reviews remain provenance, not a reason to rerun the mining.
- Partial checks are intermediate evidence only. Complete validation requires every
  declared checkpoint and map, the recorded row total and the matching summary.
- Keep the catalog check scoped to `libs/shared/catalog/src/data/`. New-source maps
  belong to their own directory and check until explicitly integrated.
- Depend on `CatalogLoader` through `CatalogToken` and `provideCatalog()`,
  provided once for all Tools routes. Use `provideCatalogTestKit()` for tests.
  Do not import catalog JSON in features. Composites and mappers take shared
  shapes from `@dotln-angular/models`, never from `@dotln-angular/catalog`.
- Route Tools lazily. Read a definition in a bounded prose measure. Render a
  resolved relation as a link and an unresolved one as plain text. Render a typed
  tool's faces as one sentence with its parameters and defaults. Never make a
  page a label-value list. Search titles and definitions, name each result's work
  by title, page results and use the house menu for facets.
- Persist validated versioned reading state and ten recent ids at
  `dotln-angular.tools`; ignore the old filter shape. Keep query and facets
  transient. Loading failure is visible and retryable, never an empty success.
- Develop several ways into a concept: prose, a visual mechanism, ordinary and
  RxJS pseudocode where useful, applications, limitations and public references.
  [A study](../dev-reference/architecture/catalog.md#studies) does this on one example.
- A study is authored in its author's own words and marked so. It quotes no passage of a work in
  copyright, and the mined definition keeps its provenance beside it.
- Every reference carries the claim it supports, and its author opened it. Name the date read. A
  source that could not be opened is not cited.
- A representation an idea does not need stays absent: null or an empty list, never filled.
- Keep one example through the whole study. Numbers a model computes never live in prose: use
  `{name}` placeholders. Match each mechanism step to one blank-line block of the ordinary
  pseudocode.
- A visual has a text equivalent and never autoplays. It moves on command, offers no Play under
  reduced motion, and keeps a short sentence on screen for each moment.
- An executable example has a spec, and a model is a pure function of the record's parameters. Call
  the scene engine's function where it has the behaviour; do not reimplement it.
- An RxJS study's code is executable with a marble spec: the module exports the example's marble
  strings and its pipeline, the spec runs them under the TestScheduler through
  `expectMarbleExample` (the record check requires the call), the record's `pseudocode.rxjs` is that
  pipeline outside any comment, and the `marbles` drawing reads the same module. The one exception is a record that marks its reading illustrative, with
  `// Illustrative: <reason>` as the code's first line and the reason in the batch's decisions.
- A messaging study draws a `flow`. A pattern whose mechanism transforms a stream runs its example
  as marbles, and its flow is built from that same example with `flowFromMarbles`, so the flow, the
  marble drawing and the spec cannot disagree. A structure, a data model or a protocol carries
  `executable: null`, with no RxJS reading or one marked `// Illustrative:`, and the batch's
  decisions give its reason; the record check holds the messaging work to the RxJS work's marking.
  A messaging study's RxJS reading, and its module's pipeline alike, names the pattern's parts in
  short comments on the operators that carry them, in the pattern's own words (for an aggregator,
  `groupBy` is the correlation and `take(3)` the completion condition); each comment states only
  what its code does.
- A study's analogy to the platform or to this app is stated as an analogy: the study says so,
  names the public record it reads and cites that record for what it says about the platform. It
  never claims that the platform or the app implements the pattern that way, and where the analogy
  breaks belongs in the limits.
- A draft never ships: every committed record is `checked` with at least two reviewers named. A
  batch's critic findings are disposed in its decisions.
- A change to the record's shape after it ships is a new schema version, never an edit of
  `concept-study-v0`.
- Link to a reading with `buildRoute` and `ChildPaths.Reading`; the address owns the open reading.
  Composites take `hrefFor` and never the router.
- Defer closed explanations until first expansion. Native disclosures hide
  content but do not defer Angular creation. Keep deferred component references
  inside `@defer`, test actual download/render behavior, and suspend any future
  animation when its retained section is hidden.
- Continue paired rendered comparisons until the operator explicitly ends
  them. A preferred candidate does not by itself establish final acceptance.
  Remove rejected implementations after each decision; retain screenshots,
  decisions and implementation evidence instead of dormant branches. Preserve
  decided choices in each new pair, and address content and usefulness before
  cosmetic refinement.
- Run `npm run catalog:check`, `npm run catalog:report`, `npm run studies:check`,
  `npm run studies:report`, `npm run test:tooling`, `npx nx test catalog` and `npx nx test tools`,
  then the workspace checks in [the reference index](README.md).

See [catalog architecture](../dev-reference/architecture/catalog.md).
