# @dotln-angular/tools/testing

`provideToolsFacadeTestKit()` provides the facade over the catalog fixture, or the tools a
spec passes it, with fake storage, and returns the catalog and storage kits to assert on.
`provideToolsTestKit()` is the same kit under the feature's name.
`provideToolsHomeFacadeTestKit()` does the same for the home's facade. `loadStudy(id)` reads a
bundled study with a drawing and an executable module for a model's spec, and
`loadModelStudy(id, family)` reads one the given family draws from a model module, a `flow` or a
`states` study, refusing a study drawn by another family. `studyTranslate`, `studyMessages` and
`withStudyMessages` resolve the shipped study messages, and test-only ones, without an injector.
`tokensOf(states)` reads the token letter of each object a states drawing tracks, by object id.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
