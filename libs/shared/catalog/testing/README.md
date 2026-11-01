# @dotln-angular/catalog/testing

`provideCatalogTestKit()` provides the catalog over a fake loader of `catalogFixture`, or
the tools and studies a spec passes it, and returns the loader and its calls. `studyFixture` is a
complete study of the first tool, and `summaryOf` is the summary a loader over given tools and
studies would answer.
`provideCatalogTokenTestKit()` is the same kit under the token's name.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
