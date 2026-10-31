# Scene engine

Pure TypeScript simulation of the soldier scene: vectors, steering, blending,
formations, slot assignment, the transform interpreter, metrics, frame hashes
and first divergence. It imports nothing from Angular or the DOM, so every later
scene can reuse it and a painter can be swapped without touching it.

Import from `@dotln-angular/scene-engine`; builders for specs come from
`@dotln-angular/scene-engine/testing`.

Read [the scene architecture](../../../docs/dev-reference/architecture/scene.md)
and [the scene rules](../../../docs/ai-reference/scene-rules.md).

Run `npx nx test scene-engine` and `npx nx lint scene-engine`.
