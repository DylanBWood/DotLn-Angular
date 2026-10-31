# @dotln-angular/state/testing

`provideDotlnStateTestKit()` provides the app stores over core's test kit, and takes
environment overrides. `provideFeatureFlagStoreTestKit()`, `provideErrorStoreTestKit()` and
`provideNavigationStoreTestKit()` are the same kit under each store's name, and
`provideDotlnErrorHandlerTestKit()` adds the error handler.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
