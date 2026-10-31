# Data access

What a store uses to reach HTTP and the browser: `withCommand` over the toolkit's
`withCallState`, `withPersistedState` over `StorageToken`, the interceptors behind
`provideDotlnHttp()`, `provideDotlnStorage()`, and `startMocks()` for the development worker.

Import from `@dotln-angular/data-access`; test kits come from
`@dotln-angular/data-access/testing`.

Read [events, state and HTTP](../../../docs/dev-reference/architecture/events-and-state.md).

Run `npx nx test data-access` and `npx nx lint data-access`.
