# Recorded actor board

The page at `/board`: a recorded `uifa-board-v1` document shown panel by panel, with its
links, sources and evidence, read-only. `BoardFacade` composes the store from
`@dotln-angular/board-data-access` and the feature flags into one `vm`.

The only public export is `boardRoutes` from `@dotln-angular/board`, and internals import
relatively. Facade test kits come from `@dotln-angular/board/testing`.

Read [the actor board](../../../docs/dev-reference/architecture/console.md).

Run `npx nx test board`, `npx nx lint board` and `npx nx e2e dotln-e2e`.
