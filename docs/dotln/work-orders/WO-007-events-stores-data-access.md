# WO-007 — Events, stores and data access for DotLn-Angular: the tiered event groups in `events`, NgRx SignalStore with the Events plugin, call state and the trinity through `data-access`, `BoardStore` behind `BoardFacade` loading the actor board over HTTP from the app's own API in the `uifa-board-v1` shape answered by MSW, the board's UI state persisted in browser storage, the app-tier stores for feature flags, navigation with canonical routes and errors in `state`, HTTP interceptors for base URL, timeouts and errors, MSW in development and in tests, and the action-hygiene check

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 90fa6e8d879cb499107ff79d1051c200d17c1cbc
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/events`, `libs/shared/data-access`,
`libs/shared/state`, `libs/features/board-data-access`, the MSW worker and
handlers, the interceptors, the persisted-state store feature and its storage
token, the `mocked` build configuration, the shell's notices container, the
hygiene check script and the scripts reference, about 75 source files; adds
`@ngrx/signals`, `@angular-architects/ngrx-toolkit` (or house `withCallState`
and `withPersistedState` features), `msw` pinned to 3.x (`~3.0.3` or the
current 3.x at activation, recorded) to the workspace. Removes `BoardFacade`'s
recorded-fixture provider (`BoardFixtureToken`); the fixture itself stays as
the handler's response and the specs' input. Wall-clock: about 7 to 9 hours
of executor work plus the fixed cycle; unknown until run. Context bytes:
WS-001 house rules 8, 11, 12, 16 and §The app and its sub-apps, the NgRx
Events plugin and toolkit declarations, the MSW browser and Node guides,
this order, about 160 KB. Commands added in the target: `npm run
lint:hygiene`, `npm run msw:init`. Tokens: unknown until run. Steps: 17.
Re-mints: none. Refutations paid: three (receipt 006 of 2026-10-21 on the
provisional text; the 2026-10-23 pass's receipt; the 2026-10-24 pass's
receipt on this text).
**Nomination provenance:** the 2026-10-18 angular-workstream planning pass
([planning document](../planning/angular-workstream-2026-10-18.md) §5 and §8),
on the operator's direction of 2026-10-17 (ignored intake capture, SHA-256
`4f14c6c09512576abfd701335f4dd8a347694ff23785724422cb8d943b5d67aa`): NgRx
SignalStore with events for data access, feature orchestration and global
concerns; action hygiene with one-way mapping across tiers and unique UI
events; canonical routes with query parameters; every event visible to every
feature in `shared/events` by source tier; `withCallState` and the
`action`, `actionSuccess`, `actionFailure` trinity; MSW; a feature-flag store
primed from `.env` with query-parameter overrides for quick testing; error
handling, timeouts and the many cases not enumerated. Versions from the
pass's research read (planning document §4): `@ngrx/signals` 22.0.1 with the
Events plugin stable and `withEffects` renamed `withEventHandlers`;
`@angular-architects/ngrx-toolkit` 22.0.0 with `withCallState`; MSW 3.0.3.
Planner-synthesized. Opaque identifier, not a priority. Clean-room screen:
public packages and the operator's own patterns. Amended by the 2026-10-18
main-rules planning pass
([planning document](../planning/main-rules-and-platform-items-2026-10-18.md)
§6 D5, D7 and §8.1): the `--draft` route, the final-review obligation and
the repairs of receipt 001's known issues. Amended by the 2026-10-21 UI
planning pass ([planning document](../planning/ui-planning-2026-10-21.md)
§6 D1 and D4): the release header, the node-spelled draft publish, and the
feature re-targeted from a tile grid to the actor board WO-006 renders.
Amended by the 2026-10-23 standard pass
([planning document](../planning/standard-pass-v0-93-0-2026-10-23.md) §6 D3):
the base set to WO-006's merge commit, the nine amendments receipt 006
named, the persistence and isolation requirements of WO-006-D022, the
shell's notices container, the board's local anchors (WO-006-D024), the
scripts reference (WO-006-D021), the publication rules of starter v0.91.0
and the reviewed release notes. Amended by the 2026-10-24 standard pass
([planning document](../planning/mining-run-orders-2026-10-24.md) §6 D3 and
§9.1): the ten known issues of receipt 007 repaired in the text; the board's
data path moved from the platform resident's loopback to the app's own API
under the operator's decision of 2026-10-24 that the app is not wired to
core (ignored intake capture `docs/intake/notes/planning-2026-10-24.md`,
SHA-256
`63b25fa11cbd648d224067c98d712b23e79734f35979cc8c9922566cc85e044c`, entry 9);
the plan-gate carry-in closed by starter v0.94.0 (update #23); the
records-publish route confirmed by core as the designed route.
**Depends on:** WO-006 merged (hard: `BoardFacade`, the board container, the
`models` library with the `uifa-board-v1` types, the recorded fixture and
the shell this order wires to stores; merged as DotLn-Angular pull request
#4 at `90fa6e8d` on 2026-10-21 and closed as `DotLn Angular v0.1.0`, which
the base line above names).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-006",
    "relation": "hard",
    "reason": "the facade and container this order connects to stores; the base line names its merge commit"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 5, 8, 10, 11, 12, 15, 16, 21; §The app and its sub-apps, host
rules H1 to H5 and the operating rules I1 to I3);
`docs/repositories/dotln-angular.md`; `docs/operator/README.md`; the target's
`docs/ai-reference/*` and `docs/dev-reference/architecture/console.md`; the
launchpad's kit file `packages/console/uifa-board-v1.schema.json` (starter
v0.94.0, core `49d8c4c364dc5986e8c76b4ac27a0110c380206f`, SHA-256
`7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3`, the
bytes the target's committed copy already carries); the
`@ngrx/signals/events` declarations (`event`, `eventGroup`, `on`,
`withReducer`, `withEventHandlers`, `Dispatcher`, `Events`, `injectDispatch`,
`provideDispatcher`) and `@ngrx/signals/resource` at the installed version;
the toolkit's `withCallState` and `withStorageSync`; the MSW browser and
Node integration guides for 3.x (`msw/http`, `msw/browser`, `msw/node`); the
Angular builder's `assets` and configuration options at the installed
version.

**Objective:** state in DotLn-Angular flows one way through typed events:
UI events dispatched by containers through facades, data-access events as
reusable commands with call state, navigation events resolved by one store
through canonical routes, app events for flags and errors; every event is
declared in `@dotln-angular/events` under its tier, the hygiene check counts
the exceptions, `BoardStore` loads the actor board (`uifa-board-v1`) through
HTTP from the app's own API (`GET <apiBaseUrl>/uifa-board-v1`), answered by
MSW in development and in tests, the board's own UI state (the selected
panel) persists in browser storage across reloads on the same origin,
nothing the app does writes outside the browser, and the shell shows the
error store's state.

**Observed gap (dated 2026-10-23, at the base `90fa6e8d`; restated by the
2026-10-24 pass):** no NgRx, no events, no HTTP and no mocks. `BoardFacade`
injects `BoardFixtureToken` (the recorded fixture
`libs/features/board/src/testing/fixtures/launchpad-board-2026-10-21.json`,
provided by `provideBoardFeature()` in `boardRoutes`), holds the selected
panel in a signal that is lost on reload, and owns `follow()`; the shell
(`apps/dotln/src/app/app.ts` over `DotlnAppLayout`) has no error surface;
`libs/shared/models` carries the `uifa-board-v1` types; the fixture's schema
copy was pinned from core's `main` at `a54f8d65` and the same bytes ship as a
kit file of the launchpad (starter v0.93.0 and v0.94.0); `nx.json` sets
`parallel` to 1 (WO-006-D025); the board's local anchors are bare fragments
(WO-006-D024). The operator decided on 2026-10-24 that the app is not wired
to core: its data comes from its own store through its own API, so the
platform resident's loopback is not read and the board's route is the app's
own, with `uifa-board-v1` kept as the response shape because the recorded
fixture and the kit schema already carry it. The Events plugin is stable
since NgRx 21 and `withEffects` is now `withEventHandlers`; the toolkit's
`withCallState` and `withStorageSync` exist for 22; MSW 3.x moved `http` and
`HttpResponse` to `msw/http`; `resource()` and `httpResource()` are stable
in Angular 22 (the 2026-10-18 planning document §4). The Angular builder
copies `public/` into every configuration's output unless a configuration
excludes a file, so the worker's exclusion from the production build is a
build-configuration matter, not a code path.

**Design:**

- `libs/shared/events` (`@dotln-angular/events`, `type:events`): one file
  per group, grouped by tier directory: `app/` (`appShellEvents`,
  `featureFlagEvents`, `errorEvents`), `navigation/` (`navigationEvents`:
  `navigate({ route, query?, fragment? })`, `back()`, `replaceQuery(query)`),
  `data-access/` (`boardHttpEvents`: `load`, `loadSuccess`, `loadFailure`),
  `ui/` (`boardPageEvents`: `opened`, `refreshRequested`, `panelSelected`).
  Each `eventGroup({ source: '[<Tier> <Name>]', events })` with `type<T>()`
  payloads; the standalone `event()` creator is used only inside this
  library. A spec asserts every source string's tier prefix matches its
  directory and sources are unique. Rule 16's flow table lives in
  `docs/ai-reference/state-rules.md`.
- `libs/shared/data-access` (`@dotln-angular/data-access`, `type:data-access`):
  `withCallState` from the toolkit (if its peer range admits the installed
  Angular; otherwise a house `withCallState` with `setLoading`, `setLoaded`,
  `setError`, recorded), `withCommand({ trigger, success, failure, call })`
  wiring one trinity: on `trigger` set loading and call, on `call` success
  dispatch `success`, on failure dispatch `failure` with a typed `AppError`;
  `withPersistedState({ key, select })`, the toolkit's `withStorageSync` if
  its peer range admits the installed Angular, otherwise a house feature
  (recorded), which reads the selected slice from the storage bound to
  `StorageToken` under `dotln-angular.<key>` at store creation and writes it
  on change, and writes nowhere else (I2); `StorageToken`
  (`dotln-angular.shared.data-access.storage`) binds the real `localStorage`
  in `provideDotlnHttp()`'s sibling `provideDotlnStorage()` inside this
  library, never under `apps/dotln/src`; a throwing or blocked storage, a
  non-JSON value or an unknown panel id degrades to the in-memory default,
  each with a spec; `provideDotlnHttp()` with interceptors
  `baseUrlInterceptor` (relative request paths resolved against
  `EnvironmentConfig.apiBaseUrl`; an absolute URL passes untouched),
  `timeoutInterceptor` (per request through `RequestTimeoutToken`, an
  `HttpContextToken`, default from the environment) and `errorInterceptor`
  (maps `HttpErrorResponse` and timeouts to `errorEvents.httpFailed` with
  the request's correlation id and never swallows the error). `AppError` is
  a discriminated union (`network`, `timeout`, `http`, `unknown`) in
  `@dotln-angular/models`.
- `libs/shared/models` (`@dotln-angular/models`, created by WO-006 with the
  `uifa-board-v1` types): gains `AppError` and `FeatureFlags`.
- `EnvironmentConfig` (`core`): development sets `apiBaseUrl` to the app's
  own origin under `/api` (so the browser worker answers it) and
  `mocks: true`; the production file replacement reads `apiBaseUrl` from the
  `.env` primer (`DOTLN_API_BASE_URL`, documented in `.env.example`, values
  never committed) and sets `mocks: false`; a third configuration `mocked`
  (production optimization, `mocks` and `featureFlagOverrides` on, its own
  environment file) serves the e2e and the operator's local play and is
  never the published artifact, recorded in the decisions file.
- `libs/features/board-data-access` (`@dotln-angular/board-data-access`,
  `type:data-access`): `BoardStore = signalStore(withState({ document, selectedPanel }), withCallState, withPersistedState({ key: 'board', select: state => ({ selectedPanel }) }), withReducer(on(boardPageEvents.opened, boardPageEvents.refreshRequested → trigger), on(boardPageEvents.panelSelected → selectedPanel)), withCommand(boardHttpEvents.load…), withEventHandlers(…))`
  provided by `provideBoardDataAccess()` in `boardRoutes`' providers;
  `BoardApi` (an injectable using `HttpClient`, `GET /uifa-board-v1` as a
  relative path the base-URL interceptor resolves against `apiBaseUrl`,
  returning a `BoardDocument`); `testing/` with `provideBoardStoreTestKit()`
  and the MSW handlers for the board route, which serve WO-006's recorded
  fixture and, under a test-only header, its unavailable variant, a `503` in
  the refusal shape the schema's unavailable state admits and a timeout.
  `BoardFacade` now composes `BoardStore` and `FeatureFlagStore` into `vm`,
  keeps `follow()`, dispatches `boardPageEvents` from its intents
  (`selectPanel` dispatches `panelSelected`), and `BoardFixtureToken` is
  removed.
- `libs/shared/state` (`@dotln-angular/state`, `type:state`):
  `FeatureFlagStore` (initial flags from `EnvironmentConfig.featureFlags`,
  overrides from the URL query `ff=<flag>:<on|off>` read once at boot only
  when `EnvironmentConfig.featureFlagOverrides` is true, which the
  development and `mocked` environments set and the production file
  replacement sets false, `featureFlagEvents.overridden` dispatched for each;
  the one flag with a product purpose is `sourcesFooter`, which shows or
  hides the board's sources footer so a presentation can hide provenance
  counts), `NavigationStore` (handles `navigationEvents` through `Router`
  using `buildRoute` from `core`, including `queryParamsHandling` and the
  fragment), `ErrorStore` (collects `errorEvents`, exposes `latest` and
  `count`, dismiss intent). Provided by `provideDotlnState()` from
  `app.config.ts`; these are the app-tier singletons house rule 10 admits.
  The interceptors' and `ErrorHandler`'s dispatches to app-tier events are
  flows rule 16 admits (data-access to app).
- The board's local anchors (WO-006-D024): the link mapper renders router
  fragment links built by `buildRoute` with the current board path and the
  target id as the fragment, so a copied or new-tab anchor opens the board
  with the panel selected and the target focused; `follow()` keeps its
  in-page focus behavior.
- Hygiene check: `tools/scripts/check-event-hygiene.mjs` reads every
  non-spec `*.ts` under `libs` and `apps` that calls `dispatch(`,
  `injectDispatch(` or names `Dispatcher`, resolves each event group's tier
  from the `eventGroup` source prefix the events spec asserts (`[UI …]`,
  `[Data-access …]`, `[Navigation …]`, `[App …]`), inspects
  `on(<group>.<event>` and `dispatch(<group>.<event>` calls and the
  `trigger`, `success` and `failure` arguments of `withCommand`, and
  refuses a dispatch to the caller's own tier or a flow not in rule 16's
  table, except an action's own `success` and `failure` outcomes (rule
  16's trinity clause) and lines carrying `// hygiene-exception: <reason>`,
  which it counts and prints; `npm run lint:hygiene` runs it and CI prints
  the count (0 expected at this order's end). Fixture stores under
  `tools/lint-fixtures/hygiene/` fail it once each: an own-tier dispatch
  other than an action's outcomes, a data-access to data-access mapping, a
  UI to UI mapping.
- MSW: `npm run msw:init` runs `npx msw init apps/dotln/public --save`;
  `apps/dotln/src/mocks/browser.ts` with `setupWorker(...handlers)`; `main.ts`
  starts it only when `environment.mocks` is true, through a dynamic import
  awaited with a timeout before `bootstrapApplication`; a rejected import
  or start falls through to bootstrap with one logged line, so a build
  whose worker file is missing shows the shell and the board's unavailable
  state; handlers live beside each data-access library's `testing/` and are
  aggregated in `apps/dotln/src/mocks/handlers.ts`; Vitest setup files start
  `setupServer` from `msw/node` with the option that fails an unhandled
  request (`onUnhandledRequest: 'error'` in the MSW 3.x declarations; the
  executor reads the installed declaration and records the name), proved
  by behavior: one spec issues a request no handler matches and asserts the
  failure; Playwright runs against the served `mocked` configuration. The
  production configuration excludes the worker file from its output (an
  `assets` ignore for `mockServiceWorker.js` in the production
  configuration, or the worker file kept outside `public/`; the executor
  records which) and `main.ts` reaches `mocks/browser` only inside the
  `environment.mocks` branch through the dynamic import, so the handler
  files and the fixture are reached only through that import.
- Without a host (receipt 006 (f)): only mocked builds render the recorded
  board. A production build with `environment.mocks` false and nothing at
  `apiBaseUrl` meets a failed request, the error interceptor dispatches
  `loadFailure`, the board shows the unavailable state naming the API base
  URL it could not reach (H2) and the shell shows the toast; no recorded
  fallback ships in production.
- Shell: the error store's `latest` renders through a `dotln-toast` wrapper
  added to `ui` (the CDK live announcer behind the wrapper) from a new
  `containers/shell-notices/` container in `libs/dotln/shell`, which injects
  a `ShellFacade` composing `ErrorStore` and maps dismiss up; `app.ts`
  places the container in the layout's notices slot and stays a thin shell
  (receipt 006 (e)); the board container shows `loading` through
  `dotln-skeleton` and `error` through `dotln-empty-state`.
- Isolation (I2, WO-006-D022): the app writes only through browser storage
  and HTTP; nothing under `apps/` or `libs/` imports a Node module or names
  a launchpad path, and `withPersistedState` is the single write path to
  storage.
- Templates this order writes or touches lay out one projected element per
  line (house rule 12); files this order does not touch keep their form
  for the house-library pass.
- Documents: `docs/dev-reference/architecture/events-and-state.md` (tiers,
  flow, trinity, call state, persisted state and its failure behavior,
  stores, MSW and the `mocked` configuration, the board route as the app's
  own API with `uifa-board-v1` as its response shape, with one path each),
  `docs/dev-reference/workspace/scripts.md` (every npm script and
  `tools/scripts/*.mjs` file with its purpose and intended use,
  WO-006-D021 (d)) and `docs/ai-reference/state-rules.md` (rule 16 as a
  table, the trinity clause, `withEventHandlers` not `withEffects`, kits,
  MSW usage, the storage rule and the storage token); `conventions.md`
  gains rules 8, 12 and 16.

Rejected: effects chaining data-access events to other data-access events
(axis: rule 16); `resource()` exposed to components (axis: components read
`vm` only; `resource()` may serve inside a store, recorded if used); a global
`ErrorHandler` replacement alone (axis: the store is the single surface and
the interceptor feeds it; `ErrorHandler` still forwards uncaught errors to
`errorEvents.unhandled`); a house `GET /board` path (axis: `uifa-board-v1`
is the versioned shape the fixture and the kit schema carry, so a later API
or store serves it without a rewrite); reading the platform resident's
loopback with a bearer token (axis: the operator's decision of 2026-10-24
that the app is not wired to core; a store member supplies the API);
persisting UI state in a platform host (axis: I1 names a store the app
owns); the app root as the container for notices (axis: rule 2 keeps the app
slim; the shell library owns its containers); the real `localStorage`
referenced under `apps/dotln/src` (axis: WO-008's storage grep stays clean
and the binding is one token).

Live-run surfaces at the base: WO-006's served production build and
Storybook; this order adds the MSW worker in the served `mocked` build.

**Deliverables:** the four libraries and `models`; the board store, API and
handlers; the interceptors, the persisted-state feature and the storage
token; the `mocked` configuration; MSW wiring; the notices container and
the toast; the hygiene script and fixtures; the three documents;
`docs/evidence/WO-007/`.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-007. Then run
   `npm run plan -- check` on the launchpad's `main` and record its result
   in the evidence README (green at starter v0.94.0 since update #23).
2. Install `@ngrx/signals`, the toolkit and `msw` at the versions `npx nx report`
   admits; log them. Check: `npm ls @ngrx/signals msw` exits 0.
3. Generate `events`, `data-access`, `state`, `board-data-access` with
   logged commands and tags (`models` exists from WO-006). Check:
   `npx nx show projects` lists them.
4. `events` groups and the tier spec. Check: `npx nx test events` exits 0.
5. `models` (`AppError`, `FeatureFlags`), `EnvironmentConfig` with the
   development and `mocked` values and `.env.example` lines, the `mocked`
   configuration in `apps/dotln/project.json` with its environment file,
   then `data-access` (`withCallState`, `withCommand`, `withPersistedState`,
   `StorageToken` and `provideDotlnStorage()`, the three interceptors,
   `provideDotlnHttp()`), each with specs and kits; the `withCallState` and
   `withPersistedState` sources (toolkit or house) decided from the
   installed peer ranges and recorded. Check: `npx nx test data-access core`
   exits 0, including the persisted-state spec over a fake storage that
   asserts the key prefix and no other write, the three degradation specs
   (throwing storage, non-JSON value, unknown panel id) and the base-URL
   spec (a relative path resolved, an absolute URL untouched).
6. `board-data-access` (`BoardStore`, `BoardApi` at `/uifa-board-v1`,
   handlers for the fixture, the unavailable variant, the `503` refusal
   shape and a timeout, the kit); `BoardFacade` rewired and
   `BoardFixtureToken` removed; `boardRoutes` providers; the link mapper's
   router fragment links. Check: `npx nx test board board-data-access`
   exits 0.
7. `state` stores and `provideDotlnState()`; `app.config.ts` wiring; the
   `sourcesFooter` flag wired to the board's footer. Check:
   `npx nx test state` and `npx nx build dotln` exit 0.
8. Hygiene script, fixtures, `npm run lint:hygiene`, CI step. Check:
   `npm run lint:hygiene` exits 0 and prints the exception count (0), and
   fails on each of the three fixtures.
9. MSW init, browser worker, the awaited start with its fallthrough, Node
   setup in each Vitest setup file, handlers aggregation, the production
   exclusion of the worker file. Check: the served `mocked` build logs the
   worker's enabled line (recorded); `npx nx run-many -t test` exits 0 with
   the unhandled-request option as the installed declaration spells it; a
   served build with the worker file removed shows the shell and the
   unavailable state (recorded).
10. `dotln-toast` wrapper, the `shell-notices` container and `ShellFacade`;
    board loading and error states. Check: `npx nx e2e dotln-e2e` exits 0
    including a test that forces `loadFailure` through an MSW handler and
    sees the unavailable state and the toast, and a test that opens a copied
    board anchor directly and sees the panel selected and the target focused.
11. Documents, `scripts.md` and `conventions.md`. Check: files exist;
    `npm run i18n:check` exits 0.
12. Record in the decisions file that the kit ships
    `uifa-board-v1.schema.json` at starter v0.94.0 with the SHA-256 the
    target's committed copy carries, so the pin's provenance is the kit
    file; the target's copy stays, because the target never depends on the
    launchpad. Check: `npm run check:fixtures` exits 0.
13. Gate plain and review. Check: passing rows, no mutation (the MSW worker
    file is tracked and unchanged by the gate; visual baselines unchanged
    because the fixture is unchanged).
14. Launchpad write-back: `docs/repositories/dotln-angular.md` Demonstrated
    architecture gains a store, an event group, an interceptor, the
    persisted-state feature and a handler path. Check: `npm run test:docs`
    passes (starter v0.94.0 carries core's fix for the plan gate's
    moved-record reader).
15. Commit with messages that carry no launchpad identifier (`WO-007`,
    `FUP-…`, `VER-…`), because starter v0.91.0 refuses them in a target's
    branch, commits, title and body; `implementation-ready`; handoff per
    §Discipline. After the session that records `verification-result pass`
    has done so, that session runs, from the launchpad root, as a plain
    command with no pipe, redirect, directory change or variable prefix,
    `node scripts/worktree.mjs publish WO-007 --target-worktree --draft --branch feat/events-and-state --title "feat: add events, signal stores, data access and MSW" --body-file <reviewed path>`
    (the node spelling is the only form the kit admits for a registered
    target since starter v0.87.0; starter v0.90.0 compares the publication
    fields of the registration, so this order's target edits withhold
    nothing; starter v0.94.0 admits the helper only in its node spelling from
    main's committed closure), which commits from the tree without moving
    `HEAD`, pushes the branch and opens the draft pull request. The body file
    names no launchpad record path carrying the order id. A
    `vocabulary.review` refusal prints the composed body's digest: the
    session reads the flagged lines and re-runs the same command with
    `--confirm-terms sha256:<digest>`; a `refuse:` private term or a
    launchpad identifier is repaired, never confirmed. The session records
    the hook's admission row and the host's decision in
    `docs/evidence/WO-007/host-qualification.md`; if the host's classifier
    denies the admitted call, the operator's `!`-prefixed run of the same
    command is the recorded fallback and the next planning pass files the
    literal host-rules self order.
16. At final review: read the draft's threads and workflow runs into
    `docs/evidence/WO-007/preview-pr.json` and route each item, write
    `docs/final-reviews/WO-007/RELEASE-NOTES.md` (the five sections the
    kit renders on the target Release under `Target release notes:
    reviewed`), `target-records`, then the same publish command without
    `--draft`, which force-pushes with lease against the recorded draft head
    and reuses the branch and the pull request. No work-in-progress commit,
    no force-push by hand, no manual close.
17. The records publish of the launchpad branch: a target order's
    `final-review-result` records no launchpad product gate, and the records
    publish reads one, so the review session runs `npm test -- --review` at
    the integrated identity and binds it with
    `npm run resume -- correct <ordinal> --set productGate=<evidenceRef>`
    before publishing, as WO-006's review did; core confirmed on 2026-10-24
    that this is the designed route in `closed` (a final-review result that
    carries the launchpad's row is a core candidate for a later order).

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run i18n:check`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. Every `eventGroup(` call and every standalone `event(` creator call in
   the workspace is under `libs/shared/events/src/lib/`
   (`grep -rlE "eventGroup\(|(^|[^A-Za-z])event\(" libs apps --include='*.ts' | grep -v "libs/shared/events/src/lib/" | grep -v spec`
   prints nothing), the event groups live under the four tier directories
   `app`, `navigation`, `data-access`, `ui`, and `npx nx test events` exits 0
   with the tier-prefix and uniqueness spec.
2. `npm run lint:hygiene` exits 0 on the workspace, prints the exception
   count, reads every non-spec `*.ts` under `libs` and `apps` that calls
   `dispatch(`, `injectDispatch(` or names `Dispatcher` (a spec of the
   script asserts a fixture outside a store or facade is read), and exits
   nonzero on each fixture under `tools/lint-fixtures/hygiene/` (an own-tier
   dispatch other than an action's outcomes, a data-access to data-access
   mapping, a UI to UI mapping).
3. `grep -rc "withEffects" libs apps --include='*.ts' | grep -v ":0"` prints
   nothing; `BoardStore` uses `withCallState`, `withPersistedState`, a
   reducer on `boardPageEvents` and event handlers dispatching
   `boardHttpEvents.loadSuccess` or `loadFailure`, and
   `npx nx test board-data-access data-access` exits 0 with specs for
   success, the `503` refusal shape, HTTP failure and timeout through MSW
   handlers, and a spec that `baseUrlInterceptor` resolves a relative path
   against `apiBaseUrl` and leaves an absolute URL untouched.
4. `grep -c "setupWorker" apps/dotln/src/mocks/browser.ts` is at least 1,
   the worker file exists at the location the decisions file records,
   `npm ls msw` reports a 3.x version, one spec under `libs/shared/data-access`
   issues a request no handler matches and asserts that it fails (the
   unhandled-request option proved by behavior), the browser worker starts
   only when `environment.mocks` is true (`grep -c "environment.mocks" apps/dotln/src/main.ts`
   is at least 1) through an awaited dynamic import with a timeout whose
   rejection falls through to bootstrap (a spec of the start helper asserts
   the fallthrough), and the evidence README records the served build with
   the worker file removed showing the shell and the unavailable state.
5. `npx nx build dotln --configuration=production` exits 0,
   `grep -rlE "setupWorker|mockServiceWorker" dist/apps/dotln/browser` prints
   nothing, `test ! -e dist/apps/dotln/browser/mockServiceWorker.js` exits 0,
   `grep -c "featureFlagOverrides" apps/dotln/src/environments/environment.prod.ts`
   is at least 1 with the value `false`, and `grep -c '"mocked"' apps/dotln/project.json`
   is at least 1 with `npx nx build dotln --configuration=mocked` exiting 0
   and its output carrying the worker file.
6. `npx nx e2e dotln-e2e` exits 0 against the served `mocked` configuration
   and includes: the board's five panels rendered from the mocked route (the
   recorded fixture served by the handler, with `grep -c "BoardFixtureToken" libs/features/board/src -r`
   printing 0); a forced failure showing the unavailable state and the
   toast; `?ff=sourcesFooter:off` hiding the sources footer; a navigation
   triggered by `navigationEvents.navigate` landing on the canonical route
   with its query parameters; a copied board anchor opened directly landing
   on the board with its panel selected and its target focused; and a
   reload on the same origin after selecting a panel other than the first
   showing that panel selected.
7. The persisted-state spec runs the feature over a fake storage and
   asserts that every key written starts with `dotln-angular.` and that no
   other storage, cookie or network write occurs, three further specs
   assert the in-memory default after a throwing storage, a non-JSON value
   and an unknown panel id, `grep -rl "localStorage" apps/dotln/src libs --include='*.ts' | grep -v spec`
   prints only the `StorageToken` provider file under
   `libs/shared/data-access/src`, and
   `grep -rlE "from '(node:)?(fs|path|os|child_process)'|from \"(node:)?(fs|path|os|child_process)\"|import\('node:|require\(" apps/dotln/src libs --include='*.ts' --exclude='*.spec.ts' --exclude='*.config.ts'`
   prints nothing.
8. `docs/dev-reference/architecture/events-and-state.md`,
   `docs/dev-reference/workspace/scripts.md` and
   `docs/ai-reference/state-rules.md` exist, the rules file carries the
   rule 16 flow table with the trinity clause, and `scripts.md` names every
   script in `package.json` and every file under `tools/scripts/` (a spec
   or check compares the two lists).
9. `node scripts/target-gate.mjs WO-007 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-007/README.md` and
`docs/evidence/WO-007/host-qualification.md`.

**Known issues and carry-ins:** starter v0.94.0 (update #23 of 2026-10-24)
carries core's fix for the plan gate's moved-record reader, so the launchpad's
document gate is green on every branch and criterion 9's `npm run test:docs`
clause is judged as written; no waiver is carried. Starter v0.94.0 prints an
advisory that this order's execution plan names launchpad record paths
carrying the order id (`host-qualification.md`, `preview-pr.json`,
`RELEASE-NOTES.md`); they are the launchpad's own evidence paths and are
kept, and the publish command's body file must not name them (the
2026-10-24 planning document, §11 item 1). `withCallState` and
`withPersistedState` sources (toolkit or house) are decided at step 5 from
the installed peer ranges; `resource()` inside stores is admitted only with
a decision naming the store. The app's own API is mocked until the mining
store and its API exist (the 2026-10-24 planning document, candidate C1);
the `uifa-board-v1` shape is kept so that member changes the handler for a
route and nothing else. This order activates only on a launchpad whose
starter carries core WO-221's `--draft` form (WO-005 step 1's route guard);
the draft pull request and its workflow runs are a final-review obligation
read from `docs/evidence/WO-007/preview-pr.json`, never a criterion
(main-rules planning document §6 D5 and D7). The `Target release
classification` header was added by the UI planning pass of 2026-10-21 under
WO-012's declared policy and confirmed by the 2026-10-23 pass (minor, a
feature release); `Target release notes: reviewed` was added by the
2026-10-23 pass under starter v0.91.0 so the target Release carries the
reviewed notes.

**Non-goals:** authentication, tokens for an API and permissions (WO-008); a
real API or the mining store; any read of the platform resident's loopback;
persistence beyond the board's UI state; devtools beyond `withDevtools` in
development; a second feature; refreshing the recorded fixture (its visual
baselines stand).

**Operator-review assumptions:** the operator reads the one draft pull
request before final review, which the final publish reuses, and accepts
browser storage as the home of the console's UI state until the mining
store member decides otherwise.
