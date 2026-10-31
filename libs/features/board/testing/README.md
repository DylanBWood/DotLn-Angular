# @dotln-angular/board/testing

`provideBoardFacadeTestKit()` provides the facade over a stub API that answers with the
recorded board, or with the document a spec passes it, and returns that document.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
