# i18n

Transloco behind the house API: `provideI18n()`, the `t` pipe (`TPipe`), `translateSignal`,
the HTTP loader and the missing-key handler. It knows nothing of the app; core adapts the
environment to its `I18nConfig`.

Import from `@dotln-angular/i18n`; test kits come from `@dotln-angular/i18n/testing`.

Read [the foundation libraries](../../../docs/dev-reference/architecture/foundation.md).

Run `npx nx test i18n`, `npx nx lint i18n` and `npm run i18n:check`.
