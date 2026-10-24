# WO-007 decisions

## WO-007-D001

```json
{
  "id": "WO-007-D001",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Implement the declared HTTP and event-store path in the registered target at its unchanged base. Preserve the recorded fixture and visual baselines; serve the fixture only through mock handlers or test kits. Keep publication and independent verification with their later lifecycle roles.",
  "evidence": [
    "Canonical status selected active WO-007 and the met WO-006 edge.",
    "Target fetch and rev-parse confirmed origin/main and HEAD equal the declared 90fa6e8d879cb499107ff79d1051c200d17c1cbc base.",
    "The base facade injects BoardFixtureToken and keeps selectedPanel in a transient signal.",
    "The work order requires its own API and expressly excludes the platform loopback and a real API implementation."
  ],
  "rejected": [
    {"option": "NoOp: leave the fixture provider and transient selection", "reason": "It cannot meet the dispatched HTTP, persistence and error behavior."},
    {"option": "Wire the platform resident or build the mining API", "reason": "Both cross the order's explicit scope boundary."}
  ],
  "reopenWhen": "The operator changes scope or the target base ceases to match the active order."
}
```

## WO-007-D002

```json
{
  "id": "WO-007-D002",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Use NgRx Signals 22.0.1, toolkit 22.0.0 and MSW 3.0.3. Reuse toolkit call state and storage synchronization with an explicit token-backed storage strategy; use RxJS commands rather than resources.",
  "evidence": [
    "Npm registry peer declarations admit Angular 22; installed declarations and implementations were read for the events, resource, call-state and storage APIs.",
    "Toolkit withStorageSync defaults compare the supplied storage to a browser global and select a built-in strategy; the custom strategy overload avoids this branch and supplies the required injected storage.",
    "The passing data-access tests prove selected-slice writes, namespacing, no other storage/cookie/network writes and degradation for throwing storage, invalid JSON and unknown panel ids.",
    "Installed MSW lib/_chunks/shared-options.d.ts and the current migration guide name onUnhandledFrame, correcting the order example; the unmatched-request test passes with the error option."
  ],
  "rejected": [
    {
      "option": "House call-state implementation",
      "reason": "Compatible toolkit behavior already supplies the required contract."
    },
    {
      "option": "Default toolkit storage strategy",
      "reason": "It bypasses the injected fake or blocked storage boundary."
    },
    {
      "option": "Resource-based board loading",
      "reason": "The event trinity already defines cancellation and outcomes without a second state path."
    }
  ],
  "reopenWhen": "Installed peer compatibility or storage semantics change."
}
```

## WO-007-D003

```json
{
  "id": "WO-007-D003",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Classify the shell as a feature library now that it owns a facade and notices container. Tag shared data-access as layer:shared-data-access and admit that tag from data-access; keep peer feature data-access prohibited. Move the existing fixture and schema byte-for-byte to the board-data-access testing owner.",
  "evidence": [
    "The base shell was type:ui and could not import ErrorStore; the work order expressly requires a ShellFacade and notices container.",
    "The base data-access rule excludes data-access itself, but BoardStore must import the newly declared shared persistence and command helpers.",
    "The board feature must depend on its data-access library; importing its fixture back from the feature would reverse that dependency."
  ],
  "rejected": [
    {
      "option": "Permit all data-access peers",
      "reason": "It would erase the intended feature boundary."
    },
    {
      "option": "Keep fixture ownership in board through a reverse import",
      "reason": "It would create a cycle."
    },
    {
      "option": "Copy the fixture",
      "reason": "It would introduce a second independently mutable copy."
    }
  ],
  "reopenWhen": "A future architecture order changes library responsibilities or separates test fixtures into a dedicated project."
}
```

## WO-007-D004

```json
{
  "id": "WO-007-D004",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Align Vitest, UI and coverage at 5.0.5 to support the required MSW 3, preserving peer enforcement and the installed Angular, Nx and AnalogJS versions.",
  "evidence": [
    "npm ls @ngrx/signals msw failed with ELSPROBLEMS under Vitest 4.1.12 because @vitest/mocker peers MSW ^2.4.9.",
    "A bounded scoped-override attempt retained the invalid dependency and was removed; no override remains for Vitest or MSW.",
    "Registry declarations and installed @angular/build 22.2.3, @nx/vitest 23.3.0 and @analogjs/vitest-angular 2.9.1 peer ranges all admit Vitest 5.",
    "npm ls @ngrx/signals msw vitest exits 0 at the aligned versions. Targeted library tests and all foundation TypeScript configurations pass."
  ],
  "rejected": [
    {
      "option": "Keep Vitest 4 with an invalid MSW peer",
      "reason": "It violates the dependency check and is unsupported."
    },
    {
      "option": "Downgrade MSW to 2",
      "reason": "It violates the explicit MSW 3 criterion."
    },
    {
      "option": "Override the peer to silence npm",
      "reason": "It would conceal a genuine incompatible API range."
    }
  ],
  "reopenWhen": "The admitted toolchain adds a compatible earlier-version route or a later migration is needed."
}
```

## WO-007-D005

```json
{
  "id": "WO-007-D005",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Use an optimized mocked configuration for local play and browser evidence, and the Angular builder define DOTLN_MOCKS_ENABLED alongside environment.mocks to eliminate the production mock import. Exclude the tracked worker through the production asset ignore. Use one configured production profile and bypass Nx cache for primed ignored public settings.",
  "evidence": [
    "The first production build passed compilation but retained a 474.50 kB lazy browser mock chunk: an object-property branch alone did not permit dead-code elimination.",
    "A second build proved that a literal imported export also retained the chunk. The installed application builder schema documents define substitutions; production define false then built successfully and the specified setupWorker/mockServiceWorker content scan returned no matches, with no worker asset.",
    "The existing primer supports public local settings. Its added ignored public-config.local.ts feeds the production environment without changing production mocks or featureFlagOverrides. A real configured build exposed that Nx 23 resolves the comma-separated configuration name as absent and falls back to production; installed create-task-graph.js confirms the behavior. The command now selects one configured profile with production settings and skips the Nx cache because ignored local settings are not task file inputs."
  ],
  "rejected": [
    {
      "option": "Rely only on environment.mocks",
      "reason": "Observed production output retains mock code."
    },
    {
      "option": "Ship the worker in production but never start it",
      "reason": "The worker-file criterion explicitly refuses that artifact."
    },
    {
      "option": "Write primed environment values into tracked files",
      "reason": "Public settings belong in ignored generated configuration and gates must not mutate tracked bytes."
    }
  ],
  "reopenWhen": "The builder can prove elimination without the builder define or production configuration contracts change."
}
```

## WO-007-D006

```json
{
  "id": "WO-007-D006",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Repair the diagnosed audit findings by raising the existing scoped undici override from 7.29.1 to 7.30.1 and updating transitive fast-uri to 3.1.9 within its admitted range. Retain Nx 23.3.0.",
  "evidence": [
    "npm audit --json reported twelve moderate and one high affected dependency nodes, rooted in undici and fast-uri; the initial install already reported twelve affected nodes.",
    "Registry readback confirms undici 7.30.1 admits the installed Node 26.",
    "The adjacent-work queue recorded cause, package/lockfile scope, checks and priority; intent was announced before a message-boundary check-in and start.",
    "npm update undici fast-uri changed three installed packages. npm audit then exited 0 with zero vulnerabilities and npm ls @ngrx/signals msw vitest exited 0."
  ],
  "rejected": [
    { "option": "Leave the existing advisory tree", "reason": "Both roots have a bounded compatible repair in the files already being changed." },
    { "option": "Run an unrestricted audit fix or upgrade/downgrade Nx", "reason": "The existing scoped override is the root cause; changing the whole toolchain is unnecessary." }
  ],
  "reopenWhen": "A subsequent advisory or peer check demonstrates a different compatible patch is needed."
}
```

## WO-007-D007

```json
{
  "id": "WO-007-D007",
  "date": "2026-10-24",
  "dispatch": "resume: next",
  "decision": "Make copied anchors react to query navigation, clear an obsolete fragment when explicit panel selection supersedes it, and reveal the provenance footer while an explicit source/evidence fragment is active. Extend hygiene checking to subscription scopes.",
  "evidence": [
    "The independent criteria adversary and design improver each reported three findings; two overlapped, yielding four distinct issues.",
    "A retained build fragment could overwrite a later Work selection after reload; reading Router state without a reactive dependency left copied hrefs stale after query replacement.",
    "The hidden footer still contained advertised anchor IDs, so an explicit evidence destination could not receive focus.",
    "Direct Events.on(...).subscribe dispatches were inspected but not judged by the original pipe-only hygiene traversal."
  ],
  "rejected": [
    { "option": "Let the feature flag make evidence anchors unreachable", "reason": "A user's explicit destination should remain accessible; the footer remains hidden until that intent exists." },
    { "option": "Remove the persisted selection after anchor navigation", "reason": "The selected panel remains UI state; clearing the superseded URL fragment preserves both persistence and copied-link behavior." },
    { "option": "Accept subscription mappings as implicit hygiene exceptions", "reason": "The same one-way event rule applies regardless of subscription syntax." }
  ],
  "reopenWhen": "New routes or a different provenance presentation require a different destination visibility policy."
}
```

## WO-007-D008

```json
{
  "id": "WO-007-D008",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 attack on the application ErrorHandler",
  "decision": "Route as blocking and fail VER-001. DotlnErrorHandler, which provideDotlnState() registers as the application ErrorHandler, discards the error it receives: it reports nothing to the console and stores only a generic AppError, so an uncaught error's message and stack reach no surface. Main reported every such error to the console through Angular's default ErrorHandler. Rule a repair must hold: the application ErrorHandler reports each error it receives to the console with the original error value, as Angular's default handler does, and still dispatches errorEvents.unhandled; a spec under libs/shared/state asserts both the console report of the original error and the dispatch.",
  "evidence": [
    "libs/shared/state/src/lib/dotln-error-handler.ts: handleError(_error) dispatches errorEvents.unhandled with kind unknown, a fixed message and a fresh correlation id, and does nothing else with the error.",
    "At the base 90fa6e8d, provideDotlnCore() registers provideBrowserGlobalErrorListeners() and no workspace file provides ErrorHandler, so Angular's default handler applied.",
    "Browser A/B on loopback, production builds of the base (built from git archive HEAD in session scratch) and of the subject: one window ErrorEvent carrying Error('probe-uncaught-error') logged 'ERROR Error: probe-uncaught-error at ...' on the base; on the subject the console stayed empty and the shell showed 'A request failed (unknown).'",
    "Fixture spec in a scratch copy of the subject: new ErrorHandler().handleError(error) reports the error to console.error; TestBed.inject(ErrorHandler) under provideDotlnStateTestKit() does not, and ErrorStore.latest() holds only 'An unexpected application error occurred.'"
  ],
  "rejected": [
    {
      "option": "Route as a follow-up",
      "reason": "07 Verification review and attack makes a change that breaks behavior main had, shown by a probe or fixture, blocking; the browser A/B and the fixture show it."
    },
    {
      "option": "Repair it during verification",
      "reason": "The verifier never edits the implementation it judges."
    }
  ],
  "followup": "Make DotlnErrorHandler report each error it receives to the console with the original error (for example by delegating to Angular's default ErrorHandler) and keep dispatching errorEvents.unhandled; add a state spec that asserts both.",
  "reopenWhen": "The repair lands, or a change touches libs/shared/state/src/lib/dotln-error-handler.ts or the ErrorHandler provider in provideDotlnState()."
}
```

## WO-007-D009

```json
{
  "id": "WO-007-D009",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 attack on the unhandled-request proof",
  "decision": "Record as a follow-up. The data-access spec 'fails an unhandled request instead of contacting a real service' passes with onUnhandledFrame set to 'bypass' and with no option, because its unmatched request goes to http://localhost/api/no-handler, where nothing listens, and ECONNREFUSED satisfies the same assertion. Criterion 4 holds: the spec issues an unmatched request and asserts the failure, and an independent probe shows that the installed 'error' option refuses an unmatched request a live server would answer. The state rules and the events-and-state document say the test proves the option, which it does not yet do. Rule a repair must hold: the spec fails when the Node setup's strategy is 'bypass' or absent.",
  "evidence": [
    "Scratch copy of the subject with libs/shared/data-access/src/test-setup.ts changed to onUnhandledFrame 'bypass', then to listen({}): vitest run -t 'fails an unhandled request' passed its one test both times.",
    "Same copy with the subject's 'error' setting and an added probe spec that requests a live 127.0.0.1 server through provideDotlnHttpTestKit(): the request is refused with kind network; under 'bypass' the probe spec fails with the live server's body.",
    "Node probe of msw 3.0.3 setupServer: 'error' rejects with MSW's 'Cannot bypass a request when using the \"error\" strategy' TypeError even when a live server answers; 'bypass' and the default reach the live server and get ECONNREFUSED on localhost port 80."
  ],
  "rejected": [
    {
      "option": "Judge criterion 4 unmet",
      "reason": "Its clauses hold at the subject: the spec issues an unmatched request and asserts the failure, and the option it stands for is effective by independent behavior. What fails is the spec's power to discriminate, which 07 routes as a follow-up."
    },
    {
      "option": "Repair it during verification",
      "reason": "The verifier never edits the implementation it judges."
    }
  ],
  "followup": "Make the unhandled-request spec fail when the Node setup's strategy is 'bypass' or absent, for example by sending the unmatched request to an address a live in-test server answers, or by asserting MSW's unhandled-frame error; keep docs/ai-reference/state-rules.md and docs/dev-reference/architecture/events-and-state.md accurate about what the test proves.",
  "reopenWhen": "A change touches a Vitest setup file's server.listen options or libs/shared/data-access/src/lib/data-access.spec.ts, or MSW is upgraded."
}
```

## WO-007-D010

```json
{
  "id": "WO-007-D010",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 review of the shell notice text",
  "decision": "Record as a follow-up. ShellNotices renders every ErrorStore entry with shell.requestFailed, so an uncaught application error forwarded as errorEvents.unhandled appears as 'A request failed (unknown).' Main had no notice, so no behavior regresses, and no criterion names the text. Rule a repair must hold: the notice names a request failure only for an HTTP failure.",
  "evidence": [
    "libs/dotln/shell/src/lib/containers/shell-notices/shell-notices.ts passes every latest error to 'shell.requestFailed' with its kind; apps/dotln/public/i18n/en.json defines it as 'A request failed ({{kind}}).'",
    "Browser probe of the subject's production build: after one window ErrorEvent with no request involved, the toast read 'A request failed (unknown).'"
  ],
  "rejected": [
    {
      "option": "Fold it into the blocking finding",
      "reason": "The text is new surface, not a regression; it keeps its own follow-up route."
    }
  ],
  "followup": "Give errorEvents.unhandled its own notice text, or carry the event's source on the stored error, so the shell names a request failure only for errorEvents.httpFailed.",
  "reopenWhen": "A change touches shell-notices, ErrorStore, AppError or the shell catalog keys."
}
```

## WO-007-D011

```json
{
  "id": "WO-007-D011",
  "date": "2026-10-24",
  "dispatch": "resume: verify; VER-001 check of execution step 12",
  "decision": "Record as a follow-up. Step 12 directs the decisions file to record that the kit ships uifa-board-v1.schema.json at starter v0.94.0 with the SHA-256 the target's copy carries; the evidence README records it, and this file did not. The fact holds. Rule a repair must hold: the decisions file records the schema pin's provenance as step 12 directs.",
  "evidence": [
    "VER-001 read SHA-256 7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3 for the launchpad kit file packages/console/uifa-board-v1.schema.json, for the target's moved copy libs/features/board-data-access/testing/fixtures/uifa-board-v1.schema.json and for the base's copy at 90fa6e8d; tools/scripts/check-board-fixtures.mjs pins the same constant and npm run check:fixtures exits 0.",
    "D001 to D007 name the moved schema (D003) but not the kit file, the starter version or the digest."
  ],
  "rejected": [
    {
      "option": "Treat the README sentence as the record",
      "reason": "Step 12 names the decisions file, which target-records moves with the order's decisions."
    }
  ],
  "followup": "Record the schema pin's provenance (the kit file at starter v0.94.0 and its SHA-256) as a decision in docs/evidence/WO-007/decisions.md, as execution step 12 directs.",
  "reopenWhen": "The repair runs, or the kit's schema file or the target's copy changes."
}
```

## WO-007-D012

```json
{
  "id": "WO-007-D012",
  "date": "2026-10-24",
  "dispatch": "resume: fix",
  "decision": "Repair the loss of uncaught-error diagnostics by extending Angular ErrorHandler and calling super.handleError(error) before dispatching the existing generic application notice. Preserve the original value in the console without exposing its arbitrary details in translated user text.",
  "evidence": [
    "VER-001 F1 and D008 reproduce the loss against the base production build.",
    "Context7 resolved Angular and returned angular.dev/api/core/ErrorHandler; installed Angular 22.2.3 reports console.error with the original value.",
    "The repaired state spec resolves the registered ErrorHandler and covers an Error with a cause, a thrown string, a plain object and null; each asserts original-value identity in the console and the unhandled event and store entry. These cases passed in the uncached unit run.",
    "A served production probe at 2026-10-24T14:31:06Z dispatches a browser ErrorEvent: the original error reaches the console, the application notice appears, and dismissing it restores the older HTTP notice."
  ],
  "rejected": [
    {
      "option": "NoOp: retain only the generic store notice",
      "reason": "It loses diagnostics and leaves the blocking regression open."
    },
    {
      "option": "Reimplement console reporting separately",
      "reason": "Delegating to the default handler preserves the framework behavior with less duplicate logic."
    }
  ],
  "reopenWhen": "Angular changes its reporting contract or an uncaught value ceases to reach either the default reporter or the event store."
}
```

## WO-007-D013

```json
{
  "id": "WO-007-D013",
  "date": "2026-10-24",
  "dispatch": "resume: fix",
  "decision": "Replace the unmatched-request test with a live loopback HTTP endpoint that would answer successfully. Assert a network rejection and zero requests reaching the endpoint; close it in finally. Keep both state reference documents explicit about the strategy-mutation proof.",
  "evidence": [
    "VER-001 F2 and D009 show that the old closed-port test passes with bypass or no option.",
    "The repaired test passed under onUnhandledFrame error in the full uncached unit run.",
    "The test uses an ephemeral loopback port and owns its server lifecycle; it does not rely on an unavailable remote service or an MSW diagnostic string.",
    "The bounded comparison at 2026-10-24T14:29:53Z reran old and repaired specs under error, bypass and absent strategies. The old spec passed all three; the repaired spec passed only error and failed both other arms because the live server returned reached: true."
  ],
  "rejected": [
    {
      "option": "Keep the closed-port rejection as the proof",
      "reason": "ECONNREFUSED satisfies it when MSW permits the request."
    },
    {
      "option": "Assert the exact MSW diagnostic message",
      "reason": "It couples the proof to diagnostic wording instead of the interception behavior."
    }
  ],
  "reopenWhen": "The Node interception option, network backend or MSW version changes; repeat the strategy mutation comparison."
}
```

## WO-007-D014

```json
{
  "id": "WO-007-D014",
  "date": "2026-10-24",
  "dispatch": "resume: fix",
  "decision": "Retain the source event on each ErrorStore notice, as http or application, and choose translated notice text from that source. Keep AppError and the transport event payload contract unchanged; ErrorNotice is a state-owned type.",
  "evidence": [
    "VER-001 F3 and D010 show an uncaught error mislabeled as a request failure.",
    "AppError kind unknown can describe an HTTP failure or an uncaught value, so kind alone cannot identify the event source.",
    "The new shell spec dispatches both events with kind unknown, checks distinct wording, dismisses the latest item and checks that the older request notice is restored. It passed in the uncached shell suite."
  ],
  "rejected": [
    {
      "option": "Infer the source from kind unknown",
      "reason": "It mislabels HTTP failures of unknown kind and loses the distinction the event stream already provides."
    },
    {
      "option": "Add a source field to every transport error payload",
      "reason": "Only the notice store needs this metadata; widening the shared API is unnecessary."
    }
  ],
  "reopenWhen": "New error origins or a different notice presentation require additional source variants."
}
```

## WO-007-D015

```json
{
  "id": "WO-007-D015",
  "date": "2026-10-24",
  "dispatch": "resume: fix",
  "decision": "Record execution step 12 on the decisions surface: the schema pin comes from packages/console/uifa-board-v1.schema.json shipped by starter v0.94.0. Retain the target-owned copy at libs/features/board-data-access/testing/fixtures/uifa-board-v1.schema.json; the target has no runtime or build dependency on the launchpad.",
  "evidence": [
    "UPSTREAM.md records starter v0.94.0 at core commit 49d8c4c364dc5986e8c76b4ac27a0110c380206f.",
    "The repair shasum -a 256 readback reports 7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3 for both the kit file and the target copy.",
    "VER-001 F4 and D011 name the missing decision entry; the earlier evidence README already carried the matching digest."
  ],
  "rejected": [
    {
      "option": "Rely only on the evidence README",
      "reason": "The execution step names this decisions file, which travels with the target records."
    },
    {
      "option": "Import the schema from the launchpad at runtime",
      "reason": "It would introduce a dependency the target is expressly meant to avoid."
    }
  ],
  "reopenWhen": "The schema bytes or declared kit provenance change."
}
```

## WO-007-D016

```json
{
  "id": "WO-007-D016",
  "date": "2026-10-24",
  "dispatch": "resume: fix; operator TypeScript spacing direction during this repair",
  "decision": "Apply paragraph-like whitespace to the TypeScript files added or changed by this order: separate imports from declarations, methods from fields, test scenarios from one another, and setup, actions and assertions within longer tests. Keep related aliases and fields together. Correct the conventions reference from the previous undici override to the installed 7.30.1.",
  "evidence": [
    "The operator explicitly added a review of reasonable TypeScript newlines to this repair, with paragraphs as the guide. No work-order criterion or scope fence changed.",
    "The review covered 102 changed or added TypeScript/configuration files excluding the deliberately minimal negative fixtures; 50 needed spacing changes. Reviewed whitespace diffs preserve runtime statements and template text.",
    "A snapshot taken after the behavioral fixes isolates the spacing edits; the only additional non-whitespace differences are the live-server test cleanup placement, import sorting and formatter punctuation, all reviewed.",
    "The conventions still named 7.29.1 while package.json and D006 selected 7.30.1; only that reference sentence changes."
  ],
  "rejected": [
    {
      "option": "NoOp: preserve compressed declarations and tests",
      "reason": "It does not satisfy the operator readability direction."
    },
    {
      "option": "Insert an empty line between every statement or introduce a blanket lint rule",
      "reason": "Related lines should remain together; the operator asked for judgment, not mechanical expansion."
    },
    {
      "option": "Reformat unrelated historical TypeScript",
      "reason": "The current order provides the bounded review surface."
    }
  ],
  "reopenWhen": "The operator changes the formatting preference or a future edit produces a block whose logical grouping is unclear."
}
```

## WO-007-D017

<!-- integration refs/dotln/checkpoint/WO-007/10 -->

```json
{
  "id": "WO-007-D017",
  "date": "2026-10-24",
  "dispatch": "resume: final review; worktree integrate WO-007",
  "decision": "Integration record: main at cc0c36bae57a3d92775c999d4ac8661238f39e55 is the order worktree's own base, so the merge changed nothing and no authored conflict exists; both bases and the recovery material (checkpoint 10, the named stash) stay retained. Carried-forward claims: the launchpad side of this order carries no code byte (after the integration the tracked changes are the control projection, the decisions index, the follow-up register, the repository profile and the work-order index, plus the untracked control segment, evidence and verification records), so no launchpad complete run is owed and the kit admits none for a target order (requireFinalReviewGate returns no gate when the order has a repositoryId). The records publish judges the launchpad code identity at HEAD against the merge base (reviewedLaunchpadIdentity) and binds a product gate only when that identity changed, so execution step 17's npm test -- --review and correct --set productGate route, which WO-006's registration edit needed, is not owed here. The target's review gate row at tree ca510cfc8945adc92afafa19280c2ee7c16fd7bb (target-gate:75d17027-dee4-42a5-a860-3d6de7cd9a0c, recorded by the repair session and re-verified uncached by VER-002) is the gate at the reviewed commit, whose tree it is; this review changes no target byte and reuses that row, because the identity and not the dispatch time says what was tested. The affected checks ran and passed.",
  "evidence": [
    "refs/dotln/checkpoint/WO-007/10",
    "base cc0c36bae57a3d92775c999d4ac8661238f39e55",
    "upstream cc0c36bae57a3d92775c999d4ac8661238f39e55",
    "release preparation: WO-007: target order records no release; no files changed.",
    "Affected checks after the integration: npm run publication:check (no editions declared, exit 0); node scripts/harness.mjs check (35 generated surfaces; local-terms list present); npm run release -- check-surfaces --local (six license surfaces PASS); npm run plan -- check (8 receipts, 8 passes, exit 0; its advisories name record paths of WO-008 and WO-014 to WO-018, none of this order); npm run adjacent -- list (one item, the repair session's spacing queue, completed at revision 12, next null); npm run release -- prepare --local (the target-order no-release outcome); no nested repository under either worktree outside ignored roots.",
    "git diff --stat after the integration lists docs/control/current.md, docs/lineage/decisions-index.md, docs/planning/followups.json, docs/repositories/dotln-angular.md and docs/work-orders/README.md, and git status lists the untracked docs/control/orders/WO-007.jsonl, docs/evidence/WO-007/ and docs/verifications/WO-007/; nothing under scripts/, packages/, dotln.config.json or the outward vocabulary changed.",
    "Target identity: the target working tree's index tree was ca510cfc8945adc92afafa19280c2ee7c16fd7bb before this review touched it, equal to the draft commit db4d648df5a6f1e46c6c5002ae0ebc0d4ff73954's tree, to refs/dotln/draft/WO-007 and to the tree the repair's plain and review gate rows and VER-002 judged. The draft commit was adopted as the wo-007 branch head without moving the working tree (git add -A, then git update-ref with the base as the expected old value); afterwards the status is clean, HEAD descends from the base 90fa6e8d879cb499107ff79d1051c200d17c1cbc and git diff --check is clean.",
    "No component-version collision: the integration moved no byte and this instance assigns no version to a target order.",
    "Changed evidence inputs since VER-002: the draft's captured state and the operator's two routed notes in preview-pr.json, this review's decisions D017 to D020, the profile's Checked line and upstream reference, the register dispositions, the publication bodies and FINAL-001; none is a launchpad code byte.",
    "Process note: node scripts/harness.mjs evidence with no flag runs the evidence gate rather than listing live gates. This session ran it by mistake at 2026-10-24T15:53Z while reading the harness state; an npm test run of about 260 s ran to completion and recorded its row, the hook refused writes while it ran and none was attempted, no record was written during it, and this review consumes no row from it."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    },
    {
      "option": "Run npm test -- --review and bind it with correct --set productGate as step 17 directs",
      "reason": "The route serves a records branch whose launchpad code identity changed; this branch's identity equals main's, the kit admits no launchpad complete gate for a target order, and a bound row would record a gate the records publish does not read. If the records publish asks for a product gate, it is run and bound then."
    },
    {
      "option": "Rerun the target review gate at the adopted commit",
      "reason": "The adopted commit's tree is the tree the repair session's review row judged and VER-002 re-verified uncached; a rerun would spend about 80 s to record the same tree again."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance; return that finding through repair and fresh independent verification. Also: the records publish refuses for a missing product gate, in which case npm test -- --review runs at the integrated identity and a correction binds it, as step 17 describes."
}
```

Integration date: 2026-10-24. Original base: `cc0c36bae57a3d92775c999d4ac8661238f39e55`.
Fetched main: `cc0c36bae57a3d92775c999d4ac8661238f39e55`. Checkpoint: `refs/dotln/checkpoint/WO-007/10`.
Named stash retained: `193c86323a5751a4019d7517af233c14c92ae002` (WO-007 integrate 2026-10-24).
Resolved projections: none.
Release preparation: WO-007: target order records no release; no files changed.
Carried-forward claims: completed in the decision above; the acceptance judgment is FINAL-001's.
Authored conflicts observed: none.
Affected checks: publication:check, harness check, release check-surfaces, plan check, adjacent list and release prepare ran after the integration and passed (results in the decision's evidence); a launchpad complete run is not owed for a target order.

## WO-007-D018

```json
{
  "id": "WO-007-D018",
  "date": "2026-10-24",
  "dispatch": "resume: final review; the operator's two non-blocking notes in the dispatch of 2026-10-24, paraphrased from the ignored capture (SHA-256 823ec0b3b56427006c94e47f237b1b952f3e3bbf9060b4d39da477daf6347c66)",
  "decision": "Route the operator's two notes without widening the order. First: the house withCommand feature switches to the newest trigger, so a repeated trigger cancels the call in flight and a cancelled call emits no failure; the operator notes that a later command may need another strategy as an option, and says no change is needed until one does. Boarded as a follow-up for the first order whose command needs a strategy other than switch; this review changes nothing. Second: the operator's read of draft pull request #5 is approving, with that one note. It is the operator read of the code that the operator record asks for before an order is called final-reviewed, and this review proceeds under it.",
  "evidence": [
    "The two notes arrived in the dispatch message that opened this review, marked non-blocking, before any record was written; the capture digest above binds the words, and preview-pr.json routes them item by item.",
    "libs/shared/data-access/src/lib/with-command.ts: withEventHandlers maps events.on(config.trigger) through switchMap over the deferred call; docs/ai-reference/state-rules.md says withCommand switches to the newest request and a cancelled request emits no failure. BoardStore is the only consumer (boardHttpEvents.load), whose newest-wins semantics fit a load.",
    "The order's Design names withCommand({ trigger, success, failure, call }) with no strategy option, no criterion names one, and 07 routes the note as a follow-up by rule."
  ],
  "rejected": [
    {
      "option": "Add the strategy option now",
      "reason": "It widens the order after the operator said no change is needed, and without a second consumer the added strategies would be untested in the application."
    },
    {
      "option": "Treat the approving note as a direction to change anything",
      "reason": "It is an approval of the draft as read; the record keeps it as the operator's read."
    }
  ],
  "followup": "Add a flattening-strategy option to withCommand (switch by default; concat, merge or exhaust on request), with a spec per strategy, in the first order whose command must not cancel the call in flight; keep state-rules.md's sentence about switching accurate when it lands.",
  "reopenWhen": "An order declares a command whose trigger must not cancel the call in flight, or the operator asks for the option."
}
```

## WO-007-D019

```json
{
  "id": "WO-007-D019",
  "date": "2026-10-24",
  "dispatch": "resume: final review; the defects met in the verified subject that verification observed and did not board",
  "decision": "Board as follow-ups, without fixing them in this review, the five observations VER-001 proposed and VER-002 carried, each disclosed to the reader under the draft body's known follow-ups, and the one note VER-002 added: (a) NavigationStore builds the board route for every navigate payload and ignores payload.route, correct while RouteId has the one member; (b) withPersistedState writes the default selection when the store is created, before any change, because the toolkit's sync strategy watches state from the start; (c) notice dismissal has two paths, ShellFacade calling ErrorStore.dismiss() and the appShellEvents.noticeDismissed reducer that nothing dispatches; (d) withConditional decides the board store's devtools at runtime, so the devtools feature's code ships in the production bundle although it never runs there; (e) DotlnToast has no Storybook story and the board's failure state has no axe check; (f) provideDotlnErrorHandlerTestKit is exported from the state testing entry and no spec uses it. None breaks a criterion or behavior main had; each is a maintainability or coverage follow-up inside the declared surfaces, and each is left for the first order that touches its surface rather than fixed here: every fix would change target bytes the operator has read, cost a gate run and a commit for no criterion, and the operator's read asks for no change.",
  "evidence": [
    "VER-001 §Independent attack and review lists the five observations as proposed but not boarded; VER-002 §Independent attack and review carries them and adds the unused kit; the draft body's Known follow-ups names the five to the reader.",
    "(a) libs/shared/state/src/lib/navigation-store.ts builds buildRoute(BasePaths.Board, { query: payload.query }) in the navigate handler; libs/shared/models/src/lib/app-state.ts declares RouteId = 'board'.",
    "(b) libs/shared/data-access/src/lib/with-persisted-state.ts delegates to the toolkit's withStorageSync with a sync strategy; the installed toolkit 22.0.0 (fesm2022, the sync feature's onInit) reads from storage and then calls watchState(store, () => store.writeToStorage()), whose watcher runs once at subscription, so the default selection is written at creation; VER-001 observed dotln-angular.board present in a fresh browser context before any selection.",
    "(c) libs/shared/state/src/lib/error-store.ts carries both the dismiss method and the on(appShellEvents.noticeDismissed) reducer; a grep of libs and apps finds no dispatch of noticeDismissed outside its declaration; libs/dotln/shell/src/lib/facades/shell.facade.ts calls the method.",
    "(d) libs/features/board-data-access/src/lib/board-store.ts composes withConditional(() => !inject(EnvironmentConfigToken).production, withDevtools('Board'), emptyFeature), a runtime condition; VER-001 read the devtools code in the production bundle.",
    "(e) libs/shared/ui/src/lib/wrappers/toast/ holds toast.ts alone; the 15 story files under libs include none for the toast; the browser suite's axe test covers the board's five panels and not its failure state.",
    "(f) a grep of libs and apps finds provideDotlnErrorHandlerTestKit only in libs/shared/state/testing/src/lib/state-test-kits.ts and its public_api.ts."
  ],
  "rejected": [
    {
      "option": "Fix the six in this review",
      "reason": "Each is small, but (a) needs a RouteId-to-path map that matters only with a second route, (b) needs a house write-on-change feature with specs, (c) is a design choice between the method and the event, (d) needs a build-time condition and the operator's direction of 2026-10-21 ranks throughput over a leanness pass, (e) adds a story and a browser case, and only (f) is a one-line removal; together they would change target bytes after the operator read the draft, cost a gate run and a commit, and satisfy no criterion."
    },
    {
      "option": "Leave them as sentences in the reports and the draft body",
      "reason": "A defect met and not fixed is boarded in the decisions file with a named follow-up, so the register carries it to the order that owns the surface."
    }
  ],
  "followup": "In the first order that touches each surface: (a) map RouteId to a path in NavigationStore when a second route lands; (b) write persisted state on change only, or record the initial write as accepted; (c) make notice dismissal one path, dispatching appShellEvents.noticeDismissed from ShellFacade and dropping the method, or dropping the reducer; (d) decide the board store's devtools at build time so the devtools feature ships in no production bundle; (e) add a dotln-toast story and an axe check of the board's failure state to the browser suite; (f) remove or use provideDotlnErrorHandlerTestKit.",
  "reopenWhen": "An order touches libs/shared/state, libs/shared/data-access/src/lib/with-persisted-state.ts, the shell notices container, the board store's devtools condition or the ui catalog, or adds a second RouteId; WO-013, the sub-app shell and its routes, is the first expected."
}
```

## WO-007-D020

```json
{
  "id": "WO-007-D020",
  "date": "2026-10-24",
  "dispatch": "resume: final review; disposition of the follow-up rows whose seam this review's records touched",
  "decision": "Dispose the register rows this review touched, at register revision 6fb07acd510ade884258e61dba6f1373c9078d08a448982fd2e733b393b77fd7. Deferred with the draft-publish observation: FUP-1508c6254455ccf3 (C2 of the 2026-10-23 pass), FUP-2479f6d32b2396a8 (WO-004-D013) and FUP-98c85b750cb36bd4 (C2 of the 2026-10-19 pass), whose condition, a hook-admitted WO-007 draft publish denied by the host classifier, did not occur: the publish was admitted by the hook and allowed by the host without a prompt, and only a following read-only GitHub readback was denied; they now wait for a later denial or the next planning pass's ruling on the literal fallback. Deferred as boarded: the two rows this review's decisions opened, FUP-d74b21ad02cb68f8 (D018, the withCommand strategy option) and FUP-d1253c8eb7d324d7 (D019, the six observations). Left as they are: FUP-e8877398fdfcbc7a (C1, the house library pass; its condition names the first order after WO-007 that touches the house library templates, which this order is not) and FUP-ffa034330edc5ff0 (C7, the v0.94.0 record-path advisory, matched by the host-qualification path; its condition, core's answer, did not occur).",
  "evidence": [
    "npm run plan -- followups --touching listed five pending rows matching this change's paths or WO-007 before the sync; after npm run plan -- followups --sync, --touching WO-007 listed six, two of them the untriaged rows the register made from D018 and D019.",
    "The batch request was applied with npm run plan -- followups --apply from a contained path (docs/intake/notes/wo007-final-review-followups-batch.json, ignored intake, where the request's bytes are kept); the apply returned five deferred statuses and revision 6fb07acd510ade884258e61dba6f1373c9078d08a448982fd2e733b393b77fd7.",
    "The draft-publish observation is docs/evidence/WO-007/host-qualification.md §Verified-phase draft publish: the registeredTargetAdmission row of kind helper, no PermissionDenied row for the publish, and the one PermissionDenied row for the later gh readback.",
    "Each reason names the decision that records the observation, so the next planning pass reads the row and the decision together."
  ],
  "rejected": [
    {
      "option": "Settle the three draft-publish rows now",
      "reason": "Their conditions ask a planning pass to rule on the literal fallback and the registration trust entry; one admitted publish is an observation, not the ruling, and the final publish's outcome is still owed."
    },
    {
      "option": "Leave the two new decision rows untriaged",
      "reason": "An untriaged row at a final review is a row nobody has read; each is deferred with its reopening condition."
    }
  ],
  "reopenWhen": "The next planning pass reads the deferred rows, or a listed condition occurs before then."
}
```
