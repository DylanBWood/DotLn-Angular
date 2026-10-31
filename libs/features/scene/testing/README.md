# @dotln-angular/scene/testing

`provideSceneFacadeTestKit()` gives the facade a manual clock, fake storage, the null
renderer and reduced motion, and returns the clock, store, catalog and renderer kits for a
spec to drive. Each token and the clock has a kit of its own.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
