# State rules

Use NgRx SignalStore 22 and `withEventHandlers`; the old effects feature name is not used.
Declare every creator in `@dotln-angular/events`, under its source tier. NgRx adds the
brackets around the source name. UI facades originate their page events; reducers
change state and handlers map events along this rule 16 table:

| Source      | Allowed mapped destinations  |
| ----------- | ---------------------------- |
| UI          | Data-access, Navigation, App |
| Data-access | Navigation, App              |
| App         | Navigation                   |
| Navigation  | None                         |

No same-tier mapping. The trinity clause permits an action's own `actionSuccess`
and `actionFailure` outcomes; these are outcomes, not new commands. `withCommand`
sets call state and switches to the newest request. A cancelled request emits no
failure. `lint:hygiene` checks stream mappings and command declarations, reads
non-spec TypeScript across apps and libs, and prints counted `hygiene-exception`
comments. Zero exceptions is the ordinary workspace result.

Provide the global dispatcher and app stores through `provideDotlnState()`.
Provide `BoardStore` at the lazy board route. Do not add route-local dispatchers:
every feature observes the same event stream. Containers read a facade's `vm` and
send intents up. HTTP errors and uncaught errors enter `ErrorStore`; shell notices
render its latest item using the recorded source event, so only HTTP failures
use request-failure text. Uncaught errors also retain Angular's default console
report of the original value, including its stack. Canonical navigation belongs
to `NavigationStore`.

Use `withCallState` from the toolkit and the house `withCommand` wrapper.
Use `withPersistedState({key, select, restore})`, backed by toolkit synchronization
and an injected storage strategy. A store that must report a value it cannot read or
write passes `unreadable` or `unwritable`, and one that writes only on an operator's
act passes `writeOn`. Every key starts with `dotln-angular.`. Validate restored data,
select only UI state or what the operator chose to save, and retain in-memory defaults
on invalid JSON, invalid panel ids or storage failures. Only `provideDotlnStorage()` may name the
browser's persistent storage; no component, facade or store accesses it directly.

Use the library testing entry points and MSW 3 handlers. `onUnhandledFrame: 'error'`
is the installed Node option. Its test sends an unmatched request to a live
loopback server and asserts rejection with no request received; the same test
must fail with `bypass` or the option removed. Browser mocks
are dynamically awaited only when `environment.mocks` is true. Startup failures
continue bootstrap; a missing worker produces a visible HTTP unavailable state.
The optimized `mocked` build is for e2e and local play. Production excludes the
worker and disables mocks and query flag overrides. `sourcesFooter` is the flag
for hiding the provenance footer (an explicit evidence/source anchor reveals it); `?ff=sourcesFooter:off` works only in development
and mocked builds. The primer supplies default flags and the public API base.

Run the targeted unit tests while implementing; then the order's preflight and
registered target gates. Keep the recorded fixture and visual baselines unchanged.
