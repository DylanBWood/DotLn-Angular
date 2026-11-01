# @dotln-angular/tools/testing

`provideToolsFacadeTestKit()` provides the facade over the catalog fixture, or the tools a
spec passes it, with fake storage, and returns the catalog and storage kits to assert on.
`provideToolsTestKit()` is the same kit under the feature's name.
`provideToolsHomeFacadeTestKit()` does the same for the home's facade, and `loadStudy(id)` reads a
bundled study for a model's spec.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
