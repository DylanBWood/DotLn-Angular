# One app, several sub-apps

`apps/dotln` is the sandbox where new ideas become toys that people and software
actors can try before promoting them. Bootstrap, providers, routes and navigation
composition stay in the app; implementations live in libraries.

A **sub-app** is a lazy feature library. A **menu group** organizes links to one
or more features. They are separate concepts: Machinery contains both its own
placeholder page and the actor board. A later feature can join a group without
creating another group or moving the board's URL.

| Menu group | Current routes                                         | Current content                                                            |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Scene      | `/scene`                                               | The soldier scene, see [its architecture](scene.md)                        |
| Machinery  | `/board`, `/machinery`                                 | Actor board and the machinery view's placeholder                           |
| Tools      | `/tools`, `/tools/catalog`, `/tools/catalog/<tool id>` | Works, last reading, the catalog reading surface and one concept's reading |

The root redirects to `/scene`. Unknown paths reach a translated not-found page in
the main region, with a link home to the scene. The menu's Catalog link opens
`/tools/catalog`, and `/tools` is the home page that links to it. The placeholder at
`/machinery` identifies the work that brings its implementation and links back to the
actor board. It has no store or facade because it has no data to orchestrate.

## How a feature library is laid out

`libs/features/board` shows the whole shape without a simulation. Its `src/index.ts` exports only
`boardRoutes`, from `src/lib/board.routes.ts`, and the directories under
`libs/features/board/src/lib/` name what each file is allowed to know
([the taxonomy](component-taxonomy.md)):

| Directory     | Holds                                                   | In the board                           |
| ------------- | ------------------------------------------------------- | -------------------------------------- |
| `containers/` | The routed page, which reads one facade's `vm`          | `containers/board-page/board-page.ts`  |
| `facades/`    | The view model and the page's intents                   | `facades/board.facade.ts`              |
| `composites/` | Presentational units built from house components        | `composites/board-row/board-row.ts`    |
| `layouts/`    | Regions of the page, filled through projection          | `layouts/board-layout/board-layout.ts` |
| `mappers/`    | The choice of presentation for a typed value            | `mappers/link-mapper/link-mapper.ts`   |
| `models/`     | View-model types                                        | `models/board-view-model.ts`           |
| `providers/`  | The one function the route calls to provide the feature | `providers/provide-board-feature.ts`   |

The store and its API live beside the feature in `libs/features/board-data-access`,
where a sub-app's own data access belongs (`libs/features/<sub-app>-data-access`), and
test kits in the `testing` entry point of each. `libs/features/scene` adds the
directories a running simulation needs (`clock/`, `renderers/`, `wrappers/`), and
`libs/features/machinery` is the smallest form: one container and its routes.

Reusable engines, models, readers and clocks belong in `libs/shared/` with their
appropriate `util`, `models` or `data-access` tags. `libs/dotln/` remains the
shell's home. Logic in libraries allows a future split without another app today.

## Presentation and navigation

`DotlnSubAppMenu` in `libs/dotln/shell/src/lib/templates/sub-app-menu/` owns the
single labelled navigation landmark. The app layout projects it through `[nav]`
inside a neutral layout region. `DotlnSubAppMenuGroup` supplies a heading and list:
project the heading through `[menu-heading]` and each `<li>` through `[menu-item]`.
When no item matches, Angular's projection fallback displays `emptyMessage`.
Pass a translated empty message for a group that has no entries. Adding a
projected item replaces the fallback automatically; a Storybook story exercises
that case without changing the shell.

The app owns `routerLink`, `routerLinkActive` and `ariaCurrentWhenActive`, using
`buildRoute(BasePaths.…).commands`. Shell templates import no router and inject
nothing. The shell library also contains notices orchestration and is therefore
tagged `type:feature`; directory-level presentation rules still govern its menu
and layout. Native links retain Tab navigation, Enter activation, URL copying,
deep linking and browser history.

Groups wrap and labels break when necessary. The menu has no disclosure button
or custom keyboard protocol. The skip link still focuses the main landmark.

## Add a sub-app by convention

1. Generate `libs/features/<sub-app>` with the installed Nx Angular library
   generator. Use `scope:dotln,type:feature`, its own selector prefix and
   `@dotln-angular/<sub-app>` import path. Record the exact command and result in
   [the generator log](../workspace/generator-log.md). Generate its `testing`
   secondary entry point; it is part of the parent Nx project, not another project.
2. Export only the named routes from the production `src/index.ts`. Keep internal
   imports relative. Put test providers in `testing/src/public_api.ts`, exposed
   through the testing barrel. Apply the existing strict compiler and Vitest
   configuration and include the new library in `typecheck:foundations`.
3. Add a `BasePaths` member in shared core and a lazy `loadChildren` entry in
   `apps/dotln/src/app/app.routes.ts`. Use `ChildPaths` for internal child routes.
4. Add a projected menu item in `apps/dotln/src/app/app.ts`, under an existing
   group or a new projected group. Keep router directives here. Do not change the
   root redirect or relocate existing routes incidentally. Update the menu table in
   this document and in the root README.
5. Add the i18n block to `apps/dotln/public/i18n/en.json`, using `t` for visible
   text and accessibility labels. Add the architecture document and link it from
   the developer and session reference roots, replace the generated READMEs of the
   library and its `testing` entry point
   ([rule 19](../workspace/conventions.md#19-documentation)), and give a new store its
   row in [the store table](events-and-state.md).
6. Add component stories, the Storybook browser list, route and presentation
   tests, keyboard paths, axe checks and responsive checks. Include the new
   features in the e2e project's implicit dependencies. Run
   [the checks](../README.md#checks) and `npx nx e2e-visual dotln-e2e`; inspect
   intentional screenshot changes.

## The sandbox boundary

No sub-app writes a control record or calls the DotLn platform. The app uses its
own data and API. Graduation is a GitHub issue on the platform's repository,
`DylanBWood/DotLn`, for consideration there. A menu choice has no effect on
platform authority, lifecycle state or execution.

See [the component taxonomy](component-taxonomy.md),
[workspace conventions](../workspace/conventions.md) and
[sub-app rules](../../ai-reference/sub-app-rules.md).
