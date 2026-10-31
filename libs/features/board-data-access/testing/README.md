# @dotln-angular/board-data-access/testing

`provideBoardApiTestKit()` and `provideBoardStoreTestKit()` provide the API and the store
for a spec, the store over fake storage. `boardHandlers` is the MSW handler list, and
`recordedBoard` and `unavailableBoard` are its fixtures.

`@dotln-angular/board-data-access/testing/handlers` exports those three alone, for the app's
mock worker and its test setup.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
