# Shared models

Types and small constants the app shares, with no runtime service: the board types
transcribed from the pinned `uifa-board-v1` schema, app-state types such as `FeatureFlags`
and `AppError`, the catalog's `tool-v1` contract in `src/lib/toolbox.ts`, and the concept-study
record in `src/lib/concept-study.ts`.

Import from `@dotln-angular/models`. The library has no `testing` entry point.

Read [catalog architecture](../../../docs/dev-reference/architecture/catalog.md#data-and-provenance)
for `tool-v1` and [the actor board](../../../docs/dev-reference/architecture/console.md) for
the board contract.

Run `npx nx test models`, `npx nx lint models` and `npm run check:fixtures`, which validates
the recorded data against its schemas.
