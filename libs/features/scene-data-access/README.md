# Scene data access

`SceneStore` keeps the live branch, the trial under comparison and the saved
compositions. Saved compositions persist under `dotln-angular.scene` through the
shared persisted-state feature, written on each save and at no other time. A stored
value that cannot be read is ignored and left in place until a save replaces it.

Run `npx nx test scene-data-access` and `npx nx lint scene-data-access`.
