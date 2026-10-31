# @dotln-angular/core/testing

`provideEnvironmentConfigTokenTestKit()` provides a development environment a spec can
override and returns it, `provideAppBasePathTokenTestKit()` provides the base path from a
document, and `provideDotlnCoreTestKit()` provides that environment with a fixed base path,
an HTTP client and a router.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
