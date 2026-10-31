# @dotln-angular/data-access/testing

`provideStorageTokenTestKit()` provides fake storage and returns its values and writes, or
provides the storage a spec passes it. `provideDotlnHttpTestKit()` provides the house HTTP
setup with a test environment.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
