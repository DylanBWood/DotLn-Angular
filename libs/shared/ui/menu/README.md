# @dotln-angular/ui/menu

Import `DotlnMenu`, `DotlnFilterMenu` and `MenuOption` from `@dotln-angular/ui/menu`.
`DotlnFilterMenu` is the controlled label, menu and value composite the catalog
filters use; it stays in this entry point for the same reason as the menu.
The root UI barrel deliberately does not export the menu: a lazy consumer must
not pull its Aria menu and CDK overlay stack into the initial application chunk.

The component imports `OverlayModule`, which supplies its overlay providers
when Angular creates the standalone component. `provideDotlnUi()` retains the
application-wide accessibility setup. No additional menu provider is required.
