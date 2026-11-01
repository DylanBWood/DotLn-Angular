# Catalog

The toolbox as data: the bundled `tool-v1` checkpoints, the concept studies, the lazy loader behind
`CatalogToken`, the reading and filter functions, and `CatalogStore`, the reading session.
`provideCatalog()` provides the loader and the store.

Import from `@dotln-angular/catalog`; test kits come from `@dotln-angular/catalog/testing`.
Features read the data through the store or the token, never from the JSON files.

Read [catalog architecture](../../../docs/dev-reference/architecture/catalog.md) for the
tool-v1 schema, the source join, the catalog check, the loader contract and the study record.

Run `npx nx test catalog`, `npx nx lint catalog`, `npm run catalog:check` and
`npm run studies:check`.
