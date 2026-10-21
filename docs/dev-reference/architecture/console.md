# Recorded actor board

The lazy `/board` route presents the public `uifa-board-v1` contract. The app uses
`BasePaths.Board`; the feature's only public export is `boardRoutes`. The shell
projects the routed content into its main landmark and provides skip navigation.

Current data path:

1. The launchpad's `node packages/console/dist/src/cli.js board --json` command emits the projection.
2. `tools/scripts/scrub-board-fixture.mjs` replaces the exact repository-root prefix with `<launchpad>` before any fixture is written, then refuses remaining home-directory or drive-letter paths. CLI failures identify a stage while withholding raw input and filesystem paths; in-process scrub checks may name a safe structural location.
3. `libs/features/board/src/testing/fixtures/launchpad-board-2026-10-21.json` supplies the route's `BoardFixtureToken`. `unavailable-board.json` derives all sections and sources as unavailable while preserving explanations.
4. `BoardFacade` exposes one view model. `BoardPage` passes data to the layout, panel, section and row composites. Cell and link mappers render the value union and local-only links.

The schema at `libs/features/board/src/testing/fixtures/uifa-board-v1.schema.json`
comes from DotLn platform commit `a54f8d6520ed54d05e5209455c67541562716404`,
`packages/console/uifa-board-v1.schema.json`. Its SHA-256 is
`7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3`.
Keep its exact bytes; it is excluded from formatting. `npm run check:fixtures`
checks that digest, validates both fixtures with Ajv 2020 and checks scrubbing.
The generator log records the capture and source provenance.

Actors is selected first. Panels retain document order. An unsupported version
renders an unavailable explanation naming that version. Known, unknown and
unavailable cells remain distinct; false, zero, an empty string, an empty list
and null remain distinct values. Source counts report recorded availability,
not liveness. Source and evidence disclosures retain the underlying explanations.

Links are resolved through an index of panel, section, row, cell, source and
evidence ids. A valid link selects its destination panel, opens any containing
disclosure, focuses the destination and scrolls it into view. An unknown target
is visibly unavailable and has no anchor. No URL, process or command is executed.

The feature currently reads a snapshot. WO-007 replaces the fixture provider
with HTTP answered by MSW. A later platform bridge must supply a browser-reachable
host before the console can claim live state. This UI does not derive lifecycle
legality or a second state machine from the projection.

`npx nx e2e dotln-e2e` serves production builds, exercises the five panels, local
links, keyboard paths, narrow viewports and serious/critical WCAG 2.2 AA checks.
The component catalog adds unavailable/version-mismatch examples. See
[visual review](../workspace/storybook.md) for persistent screenshot comparisons.
