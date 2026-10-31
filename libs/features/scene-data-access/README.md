# Scene data access

`SceneStore` keeps the live branch, the trial under comparison and the saved compositions,
which persist under `dotln-angular.scene`, written only on a save. `encodeExport` and
`parseExport` own the export format.

Import from `@dotln-angular/scene-data-access`, where `provideSceneDataAccess()` provides
the store; test kits come from `@dotln-angular/scene-data-access/testing`.

Read [the scene's store](../../../docs/dev-reference/architecture/scene.md#the-store).

Run `npx nx test scene-data-access` and `npx nx lint scene-data-access`.
