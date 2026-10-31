# Board data access

`BoardApi` reads the app's own `uifa-board-v1` route over HTTP, and `BoardStore` holds the
document, the selected panel and the last failure. The selected panel persists under
`dotln-angular.board`. `provideBoardDataAccess()` provides both.

Import from `@dotln-angular/board-data-access`; test kits and the mock handlers come from
`@dotln-angular/board-data-access/testing`.

Read [events, state and HTTP](../../../docs/dev-reference/architecture/events-and-state.md).

Run `npx nx test board-data-access` and `npx nx lint board-data-access`.
