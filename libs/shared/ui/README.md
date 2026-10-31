# House UI

The components the pages are built from, in place of a vendor library: fragments, templates,
wrappers and composites, with the plain and field skins in `src/styles/`.

Import from `@dotln-angular/ui`; test setup uses `@dotln-angular/ui/testing`. The menu has
[its own entry point](menu/README.md), `@dotln-angular/ui/menu`, so its overlay code stays
out of the initial chunk.

Read [the component taxonomy](../../../docs/dev-reference/architecture/component-taxonomy.md)
and [Storybook and visual review](../../../docs/dev-reference/workspace/storybook.md), which
says how to serve the local Storybook.

Run `npx nx test ui`, `npx nx lint ui` and `npx nx build-storybook ui`.
