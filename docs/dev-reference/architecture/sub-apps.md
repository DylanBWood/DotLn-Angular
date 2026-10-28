# One app, several sub-apps

`apps/dotln` is the sandbox where new ideas become toys that people and software
actors can try before promoting them. Bootstrap, providers, routes and navigation
composition stay in the app; implementations live in libraries.

A **sub-app** is a lazy feature library. A **menu group** organizes links to one
or more features. They are separate concepts: Machinery contains both its own
arriving page and the existing actor board. A later feature can join a group
without creating another group or moving the board's URL.

| Menu group | Current routes             | Current content                                     |
| ---------- | -------------------------- | --------------------------------------------------- |
| Scene      | `/scene`                   | Arriving page for the game-AI authoring scene       |
| Machinery  | `/board`, `/machinery`     | Actor board and the machinery arriving page         |
| Tools      | `/tools`, `/tools/catalog` | Works, last reading and the catalog reading surface |

The root continues to redirect to `/board`. Unknown paths reach a translated
not-found page in the main region, with a board link. Each arriving page identifies the
work that brings its implementation and links back to the actor board. It has no
store or facade because it has no data to orchestrate.

## Presentation and navigation

`DotlnSubAppMenu` in `libs/dotln/shell/src/lib/templates/sub-app-menu/` owns the
single labelled navigation landmark. The app layout projects it through `[nav]`
inside a neutral layout region. `DotlnSubAppMenuGroup` supplies a heading and list:
project the heading through `[menu-heading]` and each `<li>` through `[menu-item]`.
When no item matches, Angular's projection fallback displays `emptyMessage`.
Pass a translated empty message for a group that has no entries. Adding a
projected item replaces the fallback automatically; the catalog story exercises
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
   root redirect or relocate existing routes incidentally.
5. Add the i18n block to `apps/dotln/public/i18n/en.json`, using `t` for visible
   text and accessibility labels. Add the architecture document and link it from
   the developer and session reference roots.
6. Add component stories, the Storybook browser list, route and presentation
   tests, keyboard paths, axe checks and responsive checks. Include the new
   features in the e2e project's implicit dependencies. Run the workspace
   preflight and review gate; inspect intentional screenshot changes.

A sub-app's data access belongs in `libs/features/<sub-app>-data-access`.
Reusable engines, models, readers and clocks belong in `libs/shared/` with their
appropriate `util`, `models` or `data-access` tags. `libs/dotln/` remains the
shell's home. Logic in libraries allows a future split without another app today.

## The sandbox boundary

No sub-app writes a control record or calls the DotLn platform. The app uses its
own data and API. Graduation is a GitHub issue on the platform's repository,
`DylanBWood/DotLn`, for consideration there. A menu choice has no effect on
platform authority, lifecycle state or execution.

See [the component taxonomy](component-taxonomy.md),
[workspace conventions](../workspace/conventions.md) and
[sub-app rules](../../ai-reference/sub-app-rules.md).
