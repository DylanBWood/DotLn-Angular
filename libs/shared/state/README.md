# App state

The app's own stores: `FeatureFlagStore`, `ErrorStore` and `NavigationStore`, with
`DotlnErrorHandler` sending uncaught errors to the error store. `provideDotlnState()`
provides them and the one event dispatcher.

Import from `@dotln-angular/state`; test kits come from `@dotln-angular/state/testing`.

Read [events, state and HTTP](../../../docs/dev-reference/architecture/events-and-state.md).

Run `npx nx test state` and `npx nx lint state`.
