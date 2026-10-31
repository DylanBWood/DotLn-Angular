# Component taxonomy

Directories tell a developer what a component may know. The Tipping Point analogy
is a teaching aid: fragments, templates and wrappers are Salesmen, composites and
layouts are Connectors, and mappers and containers are Mavens. Angular's accessibility
and rendering behavior takes precedence over the analogy.

| Kind      | Responsibility                                                         | Example                                                                      |
| --------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Fragment  | Small, domain-free content or status; inputs and projection only       | `libs/shared/ui/src/lib/fragments/badge/badge.ts`                            |
| Template  | Reusable markup with slots and local presentation behavior             | `libs/shared/ui/src/lib/templates/button/button.ts`                          |
| Wrapper   | House API around platform accessibility, behavior or a drawing surface | `libs/shared/ui/src/lib/wrappers/tabs/tabs.ts`                               |
| Composite | Assemble presentational components without injected knowledge          | `libs/features/board/src/lib/composites/board-row/board-row.ts`              |
| Layout    | Arrange projected regions and landmarks without knowing their contents | `libs/dotln/shell/src/lib/layouts/app-layout/app-layout.ts`                  |
| Mapper    | Choose presentation from a typed value; no store or transport          | `libs/features/board/src/lib/mappers/cell-value-mapper/cell-value-mapper.ts` |
| Container | Read one facade view model and map outputs to facade intents           | `libs/features/board/src/lib/containers/board-page/board-page.ts`            |

The facade in `libs/features/board/src/lib/facades/board.facade.ts` composes
`BoardStore` and the feature flags into one `vm`, with the version check, source
counts and lookup of local link destinations, and dispatches the page's events. Its
`vm` is the container's only source of data; the store and HTTP sit behind it, as
[events, state and HTTP](events-and-state.md) describes.

Presentational directories cannot import router, data access, state or behavior
libraries, call `inject`, or accept constructor injection. Wrappers may use
Angular Aria and CDK and inject platform services; feature knowledge stays above
them. A wrapper may also own a browser drawing API such as `<canvas>`, so a painter
sits behind one component and can be swapped;
`libs/features/scene/src/lib/wrappers/scene-canvas/scene-canvas.ts` is the example.
Mappers may understand the model but cannot import state or data access.
`eslint.config.mjs` applies these rules under each project configuration.

Outputs travel at most two forwarding hops. The board passes lexical cell and
link templates through its composites: each mapper output is handled directly by
the container, so the presentation hierarchy does not become an event relay.

All components use OnPush, signal inputs/outputs and host metadata. Shared UI and
shell selectors start with `dotln-`; a feature's start with its own prefix, as the
board's do with `board-`, which each project's ESLint configuration enforces.
The prefixes remain provisional pending the operator's design review. Use ECMAScript
private fields for internal state. Angular compiler queries cannot use ECMAScript
private names; the dialog's view query is protected and readonly instead.

The plain skin lives in `libs/shared/ui/src/styles/_tokens.scss`. Components use
CSS custom properties, visible focus rings and reduced-motion handling. They do
not encode behavior in skin values. The page is fluid; long recorded values wrap
inside readable label/value/status lists.

Run `npm run lint:fixtures` to exercise negative cases and controls, and
`npm run lint:components` for decorator order and empty-provider checks. Shared
helper types live once per library in `types.ts`, with explicit public exports;
promote a helper to `utils` if a second library needs it.

See [Storybook and visual review](../workspace/storybook.md) for Storybook, and
[the component rules](../../ai-reference/component-rules.md) for what a session follows.

## Loading behavior

The menu is exposed through `@dotln-angular/ui/menu`, independently of the root
UI barrel. Its Aria and CDK overlay code arrives with the route that uses it.
`provideDotlnUi()` installs global accessibility behavior; the menu's own
`OverlayModule` import supplies overlay providers to its standalone injector.
Do not re-export that entry point from the eagerly imported root barrel.

`npm run check:bundle` builds optimized production code and walks static output
imports. It rejects catalog/menu code, the Angular Aria menu and the CDK overlay
in the initial graph, and a menu deferred past its Tools route. Its package
attribution helps explain size changes; it
does not treat bundle bytes as a user-experience measurement.
