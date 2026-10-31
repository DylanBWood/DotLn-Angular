# DotLn shell

The frame around every page. `DotlnAppLayout` presents header, nav, main and footer slots
with skip navigation, `DotlnSubAppMenu` and `DotlnSubAppMenuGroup` present the menu,
`ShellNotices` shows errors, and `NotFoundPage` answers an unknown path. The app projects
its router links into the menu.

Import from `@dotln-angular/dotln/shell`; test kits come from
`@dotln-angular/dotln/shell/testing`.

Read [the sub-app convention](../../../docs/dev-reference/architecture/sub-apps.md).

Run `npx nx test dotln-shell` and `npx nx lint dotln-shell`.
