# Sub-app rules

- Keep one app in `apps/dotln`; put sub-app logic in Nx-generated feature libraries
  under `libs/features/<sub-app>`, tagged `scope:dotln,type:feature`.
- Export routes only from each feature's production entry point. Keep internal
  imports relative. Put test kits in its generated `testing` secondary entry point.
- Distinguish a sub-app from a menu group: a group can link several features.
  Keep the board at `/board` under Machinery and keep the root redirect to it.
- Add `BasePaths`, the lazy route, the projected menu link, an i18n block and an
  architecture document together. Use `ChildPaths` for a sub-app's child routes.
- Keep the menu in shell templates and router links in the app. Project groups,
  headings and `<li menu-item>` entries. Translate the empty message for an empty
  group. Tools has no route until a utility supplies one.
- Preserve a single navigation landmark, native link keyboard behavior, current
  page indication, the skip link and responsive wrapping.
- Put feature-specific transport in `<sub-app>-data-access`; put shared engines,
  models, readers and clocks under `libs/shared/`. Keep `libs/dotln/` for the shell.
- Let every new idea live in the app as a toy first. A sub-app writes no control record
  and never reaches DotLn core. Use the app's own data and API.
- Treat graduation as a GitHub issue on the platform's repository,
  `DylanBWood/DotLn`; do not mutate platform state from the app.
- Record generator commands and results. Keep strict compiler checks, stories,
  DOM tests, keyboard checks, axe and 360/768/1440 viewport checks current.
- Run `npx nx format:check`, `npx nx run-many -t lint test build`,
  `npm run lint:fixtures`, `npm run lint:components`, `npm run lint:hygiene`,
  `npm run check:fixtures`, `npm run i18n:check` and `npx nx e2e dotln-e2e`.

Read [the architecture and addition steps](../dev-reference/architecture/sub-apps.md).
