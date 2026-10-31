# @dotln-angular/i18n/testing

`provideDotlnI18nTestKit()` provides Transloco's testing module with the translations a
spec passes it. `provideTPipeTestKit()` is the same kit under the pipe's name, and
`provideI18nConfigTokenTestKit()`, `provideTranslocoHttpLoaderTestKit()` and
`provideMissingTranslationHandlerTestKit()` provide those pieces alone.

Spread a kit's `providers` in `TestBed`; read
[test kits](../../../../docs/dev-reference/architecture/foundation.md#test-kits-and-enforcement).
