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
- A tool has five faces: scene, selection, transform, observable and toy metric.
  The role analog is optional. Background, sceneElement and metric rows have no faces.
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
- The transform enum is closed and grows only by a recorded decision. A typed
  label describes a contract; it does not claim the scene engine exists.
- Preserve uncertain candidates as untyped with a nonempty specific reason.
  Never force a transform to satisfy the three-examples quota.
- Commit only ids, short titles and generic terms. Never copy map definitions,
  relations, hooks, verification notes, chapter or section fields. No quarantine
  file may be opened. Raw maps remain read-only intake.
- Keep line-based ids stable and record original-byte SHA-256 digests with
  basenames. Pair map provenance with its map object, public-work provenance
  with null. Use readonly models and the versioned `tool-v0` schema.
- Classify in eight independent checkpoints, sample with two seeded checkers,
  synthesize, and run a critic. Rerun only rejected ids in the original worker.
  Record worker labels, counts, statements and every finding's disposition.
- Merge through `tools/scripts/catalog/merge-checkpoints.mjs`; partial checks
  are intermediate evidence only. Complete validation requires all eight
  checkpoints, eleven maps, 3,463 mapped rows and the matching summary.
- Keep this check scoped to `libs/shared/catalog/src/data/`. New-source maps
  belong to their own directory and check until explicitly integrated.
- Depend on `CatalogLoader` through `CatalogToken` and `provideCatalog()`.
  Use `provideCatalogTestKit()` for tests. Do not import catalog JSON in features.
- Route the Tools browser lazily, render paged rows, use the house menu and list
  components, and keep data values separate from translated UI framing.
- Persist only validated UI filters and selection through the shared storage
  feature. Loading failure is visible and retryable; it is never an empty success.
- Run `npm run catalog:check`, `npm run catalog:report`, `npm run test:tooling`,
  the library tests, workspace preflight and registered gates.

See [catalog architecture](../dev-reference/architecture/catalog.md).
