# Recorded actor board

The lazy `/board` route presents the public `uifa-board-v1` contract. The app uses
`BasePaths.Board`; the feature's only public export is `boardRoutes`. The shell
projects the routed content into its main landmark and provides skip navigation.

Current data path: `BoardFacade` composes `BoardStore` and feature flags. The
store requests the app's own `uifa-board-v1` route through `BoardApi`; MSW serves
the unchanged recorded projection in development and tests. Production uses its
configured API and shows unavailable on failure. See
[events and state](events-and-state.md) for the providers, trinity and persistence.

The schema at `libs/features/board-data-access/testing/fixtures/uifa-board-v1.schema.json`
comes from DotLn platform commit `a54f8d6520ed54d05e5209455c67541562716404`,
`packages/console/uifa-board-v1.schema.json`. Its SHA-256 is
`7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3`.
Keep its exact bytes; it is excluded from formatting. `npm run check:fixtures`
checks that digest, validates both fixtures with Ajv 2020 and checks scrubbing.
The generator log records the capture and source provenance.

Actors is selected by default; a valid saved selection or direct anchor takes precedence. Panels retain document order. An unsupported version
renders an unavailable explanation naming that version. Known, unknown and
unavailable cells remain distinct; false, zero, an empty string, an empty list
and null remain distinct values. Source counts report recorded availability,
not liveness. Source and evidence disclosures retain the underlying explanations.

Links are resolved through an index of panel, section, row, cell, source and
evidence ids. A valid link selects its destination panel, opens any containing
disclosure, focuses the destination and scrolls it into view. An unknown target
is visibly unavailable and has no anchor. No URL, process or command is executed.

The board is a read-only projection, never a lifecycle authority. Its selected
panel persists through the storage token. Copied anchors include `/board` and a
fragment; direct loads select and focus the target after the document arrives.

`npx nx e2e dotln-e2e` serves the optimized mocked build and exercises the five
panels, persistence, failure notices, local links, keyboard paths, narrow viewports
and serious/critical WCAG 2.2 AA checks.
Storybook adds unavailable/version-mismatch examples. See
[visual review](../workspace/storybook.md) for persistent screenshot comparisons.
