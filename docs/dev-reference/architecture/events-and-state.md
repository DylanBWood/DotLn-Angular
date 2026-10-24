# Events, state and HTTP

The board loads `GET <apiBaseUrl>/uifa-board-v1` from the app's own API.
It is not connected to the platform's resident. The response shape stays
`uifa-board-v1`, so replacing the mock with the app's future API changes its
configuration, not its facade or rendering contract.

The data path is `BoardPage` → `BoardFacade` → `boardPageEvents` → `BoardStore`
→ `boardHttpEvents.load` → `BoardApi` → HTTP. `withCommand` publishes the load
success or failure and manages call state. The facade combines the document,
selection, loading/error and feature flags into one `vm`; the container projects
that view through the existing board components. A source-level unavailable
projection stays visible. A transport failure clears the document, exposes the
API base in an unavailable state, and enters the shell's error notice. Retry uses
the same event path. The fixture is never a production fallback.

| Concern                       | Owner                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| App events                    | `libs/shared/events/src/lib/app/`                                    |
| Canonical navigation events   | `libs/shared/events/src/lib/navigation/navigation-events.ts`         |
| HTTP trinity                  | `libs/shared/events/src/lib/data-access/board-http-events.ts`        |
| Page intents                  | `libs/shared/events/src/lib/ui/board-page-events.ts`                 |
| Call state and commands       | `libs/shared/data-access/src/lib/with-command.ts`                    |
| Persisted UI state            | `libs/shared/data-access/src/lib/with-persisted-state.ts`            |
| Browser storage binding       | `libs/shared/data-access/src/lib/storage-token.ts`                   |
| HTTP base, errors and timeout | `libs/shared/data-access/src/lib/interceptors.ts`                    |
| Board store                   | `libs/features/board-data-access/src/lib/board-store.ts`             |
| Board API                     | `libs/features/board-data-access/src/lib/board-api.ts`               |
| Mock responses                | `libs/features/board-data-access/testing/src/lib/board-handlers.ts`  |
| Feature flags                 | `libs/shared/state/src/lib/feature-flag-store.ts`                    |
| Router adapter                | `libs/shared/state/src/lib/navigation-store.ts`                      |
| Error surface                 | `libs/shared/state/src/lib/error-store.ts`                           |
| Shell notices                 | `libs/dotln/shell/src/lib/containers/shell-notices/shell-notices.ts` |

The [state rules](../../ai-reference/state-rules.md) carry the one-way tier table
and trinity exception. Page facades originate events; mappings obey the table.
No feature dispatches a peer data-access command in response to its own outcome.
App stores are explicit app providers and the board store is route-scoped.

NgRx Signals 22.0.1 and toolkit 22.0.0 admit Angular 22.2.3. Toolkit call state
is reused. Its default storage implementation chooses a browser storage global,
so the house persistence feature passes an explicit synchronous strategy bound to
`StorageToken`. Toolkit `watchState` supplies subscription and cleanup. Only the
selected panel is restored and written, under `dotln-angular.board`; extra fields
are ignored. A throwing storage, bad JSON or invalid panel id leaves Actors as
the default, with later changes usable in memory. Other storage and cookie writes
are absent. Devtools are enabled for the board only in development.

Base URL resolution retains the configured API path and leaves absolute URLs
untouched. Translation assets use absolute origin URLs so they cannot be prefixed
with the API path. Timeout uses `RequestTimeoutToken` or the environment default;
`RequestCorrelationToken` associates the propagated `AppError` and error event.
Errors are typed as network, timeout, HTTP or unknown. User text is translated.
The error store retains whether each notice came from HTTP or an uncaught
application error, including when both have kind `unknown`. The shell uses that
source to choose its notice text. `DotlnErrorHandler` first delegates to Angular's
default handler so the console retains the original error and stack, then
dispatches the application notice.

MSW 3.0.3 exposes HTTP primitives from `msw/http`. Its installed option is
`onUnhandledFrame`; Node tests use `error`. The unmatched-request test starts a
live loopback server, then asserts that MSW refuses the request before the server
receives it. It fails if the strategy is `bypass` or absent, when the server answers
successfully, so connection refusal cannot stand in for the MSW policy.
The browser uses bypass for non-API assets. Its worker is tracked at
`apps/dotln/public/mockServiceWorker.js`, initialized by `npm run msw:init`.
Startup awaits a dynamic import with a three-second deadline; failed or late
startup stops the worker and allows application bootstrap. Test handlers support
the `x-dotln-test-scenario` header: unavailable, refusal (503 with the schema-shaped
unavailable projection), failure (500), network and timeout. The API never adds
that header; browser tests supply it.

`mocked` is optimized, enables mocks and flag overrides, and serves e2e and local
play. It is not the published artifact. `production` excludes the worker through
its asset ignore and substitutes the builder define `DOTLN_MOCKS_ENABLED=false`
to remove the dynamic mock path. It sets both mocks and
flag overrides to false. `npm run env:prime` reads only public `.env` settings,
creates ignored local configuration and `public-config.local.ts`, and
`npm run build:configured` uses the uncached `configured` production profile to use the primed API
base and flags without enabling mocks or query overrides. Default production uses
`public-config.ts`. Remove generated local settings before worktree close.

Canonical anchor URLs preserve query parameters and include the board route and
target fragment. Following a link dispatches navigation; direct/new-tab loads
select and focus its target after the asynchronous document arrives. Panel
selection otherwise restores from browser storage on the same origin. Choosing a
different panel clears an older target fragment so reload restores the new choice.
An explicit source/evidence anchor reveals the otherwise hidden footer while that
fragment is active. Copied links react to query-only navigation.

Vitest 4.1.12 requires MSW 2 in its optional mocker peer. Vitest, UI and coverage
are aligned at 5.0.5, which admits MSW 3; the installed Angular build, Nx and
AnalogJS peers all admit Vitest 5. No peer check is disabled. The jsdom network
setup supplies Node web streams for MSW responses. Nx's version-23 executors
remain in use; their version-24 migration is separate maintenance.

The shell is now `type:feature` because it owns orchestration. Shared data-access
also carries `layer:shared-data-access`: feature data-access may use those shared
helpers while peer feature data-access remains prohibited. Component role rules
still prohibit domain injection in layouts and presentational components.
