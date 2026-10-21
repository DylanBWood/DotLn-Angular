# WO-006 decisions

## WO-006-D001

```json
{
  "id": "WO-006-D001",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Implement the approved recorded actor board and house component taxonomy in the registered target. Preserve fixture provenance, explicit unknown and unavailable states, and local-only links. Translate host-authored framing while rendering board data verbatim as data. Keep publication in its separately dispatched phases.",
  "evidence": [
    "Canonical status selects active WO-006 and target base 5102783f5cf575a6b487e75ed9bb0c064d6dbd9c; target HEAD matches and git status was empty.",
    "Both target-release header counts are 1, with minor classification; scripts/worktree.mjs carries the node-spelled draft route.",
    "The pinned console README says the board is lossy, read-only and local-link-only; the target currently renders only a home placeholder.",
    "The existing template inspector requires every interpolation to use t; the new board requires an explicit distinction between source data and host-authored strings."
  ],
  "rejected": [
    {
      "option": "NoOp: retain the placeholder",
      "reason": "It demonstrates neither the component taxonomy nor the actor-board contract."
    },
    {
      "option": "Infer live state or execute link targets",
      "reason": "The recorded projection supplies neither live authority nor browser command transport."
    },
    {
      "option": "Translate board values as catalog keys",
      "reason": "That changes source data and cannot preserve arbitrary recorded labels and values."
    }
  ],
  "reopenWhen": "A later order supplies the HTTP source, a new view-model contract or explicit command authority."
}
```

## WO-006-D007

```json
{
  "id": "WO-006-D007",
  "date": "2026-10-21",
  "dispatch": "scope expand: add a local Storybook catalog and persistent screenshot review",
  "decision": "Add a local Storybook catalog for the house components and representative board states, plus persistent Playwright screenshot assertions and human-oriented visual inspection of the page and component captures. Amend the active order before implementation; no hosted catalog or new feature is included.",
  "evidence": [
    "The operator explicitly requested Storybook and screenshot review during active execution on 2026-10-21.",
    "Operator direction synthesized in ignored intake; SHA-256 3fdb1edb8bad69f4a72dcaf2d78cefe8aebdbf93d7cfab5ad6c922740872166b",
    "The original order already requires persistent browser accessibility and keyboard checks, but explicitly excludes Storybook."
  ],
  "rejected": [
    {
      "option": "Leave Storybook to an unspecified later order",
      "reason": "The operator explicitly expanded this order and no scheduled Storybook deliverable has been selected."
    },
    {
      "option": "Ad hoc screenshots without persistent assertions",
      "reason": "They would not preserve the requested e2e regression coverage."
    }
  ],
  "reopenWhen": "A later order replaces the local catalog or the operator changes the visual coverage scope."
}
```

## WO-006-D002

```json
{
  "id": "WO-006-D002",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Keep house Tabs and Menu APIs over Angular Aria 22.2.3 and CDK 22.2.3. Use a native dialog plus the CDK focus trap. The tabs root, list and panel wrappers support layout projection without leaking behavior imports into feature components.",
  "evidence": [
    "Official Angular Aria Tabs and Menu guides and the installed declaration files define roving focus, selection-following-focus, lazy panel content and the menu popover integration.",
    "The ui DOM spec passed arrow, Home and End selection, roving focus and tab-to-panel ownership.",
    "npm view and installed manifests admit Angular 22 and use MIT licenses. npm install completed with zero audit findings.",
    "Final production build at 2026-10-21T13:40:49Z: 458.65 kB initial, 120.80 kB estimated transfer; lazy board chunk 208.02 kB, 28.47 kB estimated transfer. These are whole-route figures including the recorded fixture, not an isolated attribution to Aria. The house wrappers add a small API to maintain; upstream Angular owns the tested keyboard state machines, while the house owns layout, tokens and integration tests."
  ],
  "rejected": [
    {
      "option": "CDK-only tabs and menu behavior",
      "reason": "The Aria DOM test passes the required behavior; reimplementing the state machine would increase house maintenance without an observed benefit."
    },
    {
      "option": "Expose Aria directive types through the feature",
      "reason": "This would couple product markup to the behavior implementation and defeat the wrapper boundary."
    }
  ],
  "reopenWhen": "Aria compatibility, accessibility or bundle evidence regresses; keep the house API while replacing behavior."
}
```

## WO-006-D003

```json
{
  "id": "WO-006-D003",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Capture the launchpad board once, scrub before writing, and validate the recorded and unavailable fixtures with Ajv 2020 against the exact pinned schema. Transcribe only the public contract types into shared models.",
  "evidence": [
    "Captured with node packages/console/dist/src/cli.js board --json in the launchpad worktree; the raw output remained in process memory.",
    "Schema source: platform commit a54f8d6520ed54d05e5209455c67541562716404, packages/console/uifa-board-v1.schema.json. SHA-256 7d20e785c718b4b601f45a9c351461955666ea16d49f17ae6d8fde0676629cd3.",
    "The scrubber replaces the exact launchpad root with <launchpad>, refuses remaining home or drive-letter paths, and reports locations without values.",
    "Ajv 8.20.0 is an MIT development dependency. Both fixtures retain the schema version and the unavailable derivative keeps section/source explanations visible."
  ],
  "rejected": [
    {
      "option": "Commit the raw board output",
      "reason": "Its source paths include private home-directory identifiers."
    },
    {
      "option": "Handwritten partial schema validation",
      "reason": "It would duplicate the pinned JSON Schema constraints and create a second contract to maintain."
    },
    {
      "option": "Fetch a live board in the browser",
      "reason": "This order supplies no browser-reachable host; HTTP integration belongs to the next order."
    }
  ],
  "reopenWhen": "A later schema version or authorized fixture refresh supplies new evidence."
}
```

## WO-006-D004

```json
{
  "id": "WO-006-D004",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Anchor typed ESLint overrides to the workspace with basePath; enforce role imports and injection by directory, autofix three import groups, inspect component metadata, and reject shared type names declared in multiple files. Source-data interpolations may use translate=no, but literals still require the t pipe.",
  "evidence": [
    "ESLint documentation confirms file globs otherwise follow the selected configuration directory; the inherited apps/libs patterns previously missed nested project configurations.",
    "Negative fixtures now observe injection, behavior imports, mapper data access, readonly and template-rule failures under a nested project configuration, with passing controls.",
    "The template AST distinguishes dynamic data under translate=no from literal strings, including literals inside expressions; a scoped traversal prevents the marker leaking to siblings.",
    "The complete preflight exposed a formatter conflict: Prettier 3.9.10 collapses short Angular templates under embeddedLanguageFormatting=auto. The documented off setting preserves their bytes; the negative/control fixture run passes after configuring it for TypeScript, with Angular template lint and compilation retained."
  ],
  "rejected": [
    {
      "option": "Disable typed rules for nested projects",
      "reason": "This would preserve the reported enforcement gap."
    },
    {
      "option": "Allow every string inside translate=no",
      "reason": "Host-authored text could silently bypass the message system."
    }
  ],
  "reopenWhen": "A concrete valid source-data expression cannot be represented or a negative fixture demonstrates a bypass."
}
```

## WO-006-D005

```json
{
  "id": "WO-006-D005",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Treat app grouping as an architectural improvement to evaluate before a second application: app composition belongs with the app, reusable primitives remain shared, and a feature is not cross-app simply because its current directory is global. Keep the selected order's explicit library paths while demonstrating those boundaries through tags and imports.",
  "evidence": [
    "The operator suggested app-scoped core composed from independent shared i18n, with an optional independent shared core, and clarified that an app grouping should also house feature routing and app-only UI. This was a suggestion for judgment rather than a migration directive.",
    "Synthesized operator intake SHA-256 a1265f192bd5728d6a6b6b41259d217416d58bfc189e4b6fc1455c9b0ae22fa3.",
    "The existing core already adapts environment/base-path configuration into i18n without a reverse dependency. The active criteria prescribe shared/core, dotln/shell and features/board paths."
  ],
  "rejected": [
    {
      "option": "Move the existing foundation and all route aliases during this component order",
      "reason": "It expands migration and criterion changes without being required to demonstrate the component boundary."
    },
    {
      "option": "Treat all feature libraries as reusable shared code",
      "reason": "The board is tagged scope:dotln; another app should not depend on app-specific behavior by directory convention alone."
    }
  ],
  "followup": "Evaluate app-scoped core, feature and UI grouping before a second app or a foundation migration; preserve independent shared i18n and migrate aliases and rules together.",
  "reopenWhen": "A second app, foundation change or explicit migration direction makes the app/shared distinction operational."
}
```

## WO-006-D006

```json
{
  "id": "WO-006-D006",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Repair the encountered Vite security finding within the dependency paths already changing here: pin direct Vite to 8.3.3 and scope the Angular-build child override to the exact direct dependency range. Preserve the existing Nx Undici repair.",
  "evidence": [
    "The baseline lock selected Vite 8.3.0; the published launch-editor advisory affects that version.",
    "npm requires an override for a direct dependency to match its exact declared spec; using @angular/build@~22.2.3 resolves the observed EOVERRIDE.",
    "npm install after the repair completed with zero vulnerabilities; the adjacent queue records the intended fix, path scope, steering observation and required validation."
  ],
  "rejected": [
    {
      "option": "npm audit fix --force",
      "reason": "Its proposed unrelated framework changes exceed the bounded repair."
    },
    {
      "option": "Leave the known vulnerable development server dependency",
      "reason": "A compatible patch is available on the same dependency path."
    }
  ],
  "reopenWhen": "The Angular build package itself selects a fixed Vite version, allowing the scoped override to be removed after checks."
}
```

## WO-006-D008

```json
{
  "id": "WO-006-D008",
  "date": "2026-10-21",
  "dispatch": "scope expand: implement the local catalog and reviewed screenshot baselines",
  "decision": "Use Storybook 10.6.3 through its Angular Vite builder and persist Playwright visual baselines under the e2e project. Keep cross-platform behavior/axe checks in the regular suite and run pixel comparisons in a separate macOS CI job matching the reviewed baseline family. Bundle the Latin Inter variable font so rendering does not depend on an external font service.",
  "evidence": [
    "Bounded npm metadata comparison: @storybook/angular 10.6.3 peers Angular build-angular and platform-browser-dynamic; @storybook/angular-vite 10.6.3 admits the installed Angular 22, Vite 8 and AnalogJS 2.9 toolchain. Both use MIT.",
    "The Vite catalog build passed and contains the house components plus shell and board examples.",
    "Playwright documentation explicitly distinguishes screenshot baselines by operating system. The available local browser environment is macOS; no Linux container runtime is installed.",
    "@fontsource-variable/inter 5.3.0 is OFL-1.1; only the local Latin weight-variable file is used.",
    "All 36 browser checks pass against the production app and static catalog, including menu and dialog focus. The inherited Transloco pipe factory failed in Storybook JIT; explicit inject calls matching the installed Transloco 8.4.0 constructor fix it. An AOT catalog probe lost Storybook decorator reflection and was rejected."
  ],
  "rejected": [
    {
      "option": "Introduce the Webpack Angular Storybook builder",
      "reason": "It adds a second build chain when the Vite integration already supports the installed stack."
    },
    {
      "option": "Treat a macOS screenshot as a proven Linux pixel baseline",
      "reason": "Font rasterization and browser rendering differ across operating systems."
    },
    {
      "option": "Accept generated images without viewing them",
      "reason": "Pixel assertions preserve a baseline but cannot establish whether the initial design is good."
    }
  ],
  "reopenWhen": "A common reproducible browser image is available locally and in CI, or independently reviewed Linux baselines justify another visual environment."
}
```

## WO-006-D009

```json
{
  "id": "WO-006-D009",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Exclude private target probe diagnostics from Git and review packets before reading packet inputs. Preserve the generated local file for the declared release-close cleanup, naming only its exact path as disposable.",
  "evidence": [
    "Both fresh workers noticed a local-control diagnostic header in the first review packet and explicitly skipped its contents. The packet generator had relied on the target ignore set, which lacked this directory.",
    "The target now ignores /docs/control/local/; packets were rebuilt with explicit private-path exclusions before file reads. git check-ignore confirms the diagnostic is excluded. Nothing was staged or committed.",
    "Only docs/control/local/harness/memory-incidents.jsonl is added to disposable output; the enclosing private directory is not declared disposable."
  ],
  "rejected": [
    {
      "option": "Rely only on the current Git ignore set for future packets",
      "reason": "A generated private path can appear before a new ignore rule exists."
    },
    {
      "option": "Declare all local-control content disposable",
      "reason": "That could erase operator-owned private inputs."
    }
  ],
  "reopenWhen": "A new generated diagnostic path appears; inspect its provenance without reading private content and qualify that exact path."
}
```

## WO-006-D010

```json
{
  "id": "WO-006-D010",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Fix all six distinct findings from the two required independent reviews before the implementation handoff: private packet exclusion, version-first rejection, controlled fixture diagnostics, retained unavailable rows, closed-dialog focus and schema-aligned Cell types.",
  "evidence": [
    "The criteria worker reported three findings and the design worker four, with one duplicate. Both corrected-diff readbacks confirm every finding fixed and no new concern.",
    "Focused UI and board suites pass 15 and 11 tests respectively; tooling passes 22 tests, including CLI diagnostic regressions. All thirteen foundation compiler configurations and the e2e compiler check pass.",
    "A future-version fixture containing only viewModelVersion now reaches the unavailable state without reading v1 collections; retained unavailable rows stay present and addressable.",
    "The dialog regression moves focus after close before component destruction; the old opener does not regain focus."
  ],
  "rejected": [
    {
      "option": "Defer the findings while shipping the recorded happy path",
      "reason": "Each correction is bounded to the changed code and closes an observable correctness or privacy defect."
    },
    {
      "option": "Treat static reviewer approval as executable or visual proof",
      "reason": "The workers reviewed only the order and diffs; the executor must supply passing commands and direct image inspection."
    }
  ],
  "reopenWhen": "A new contract, interaction sequence or negative fixture demonstrates a remaining failure."
}
```

## WO-006-D011

```json
{
  "id": "WO-006-D011",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Re-evaluate the existing structural-inspector hardening follow-up because this order edits those tools. Keep FUP-1ce1fb75025a93f8 deferred for a dedicated hardening change; do not claim the source-data extension settles general TypeScript symbol resolution or every Angular text-rendering form.",
  "evidence": [
    "WO-005-D011 records bypasses involving parenthesized, const-aliased or locally re-exported constructors, class/object tokens, getTestBed receivers, shorthand templates and additional visible-text bindings.",
    "The current follow-up register still carries that item. WO-006 changes source-data interpolation traversal and feature test-kit discovery, but does not add the cross-module symbol resolver or fixtures for that complete set.",
    "The current workspace's required checks and the order's explicit four lint carry-ins pass; this does not prove closure of the separately recorded hardening item."
  ],
  "rejected": [
    {
      "option": "Mark the older follow-up fixed because the current workspace passes",
      "reason": "The older finding concerns valid forms outside the inspectors' proven coverage, and passing current code does not test those forms."
    },
    {
      "option": "Fold a general symbol-resolution redesign into the final component corrections",
      "reason": "It changes the shared token, kit and template inspectors together and needs an independent negative-fixture matrix; that is a distinct maintenance change beyond the bounded source-data traversal fix."
    }
  ],
  "reopens": {
    "decisionId": "WO-005-D011",
    "observation": "WO-006 edits structural checks, satisfying the existing reopening condition. This decision explicitly re-evaluates and retains the unclosed hardening work on its existing FUP identifier."
  },
  "reopenWhen": "The next planning pass allocates structural-inspector hardening, or a listed bypass form appears in production/spec source; the latter requires repair before relying on the affected check."
}
```

## WO-006-D012

```json
{
  "id": "WO-006-D012",
  "date": "2026-10-21",
  "dispatch": "resume: next",
  "decision": "Use the runner's supported --serial option for complete document checks during shared-host contention. Keep the same selected checks and resource guard; reduce this run's lane reservation to one.",
  "evidence": [
    "The default document run queued before format for 1153 seconds while another live validation occupied the host lanes. No check executed and no pass was supplied when this session stopped its own queued run through harness evidence --stop.",
    "scripts/test-runner.mjs reserves all of a run's concurrency lanes for structural preflight; --serial sets that run's concurrency to one without changing its selected suites.",
    "The serial run started immediately and reached document validation. It identified two empty scope-expansion dispatch descriptions; those records now include their bounded paraphrases. The subsequent planning check required re-binding the corrected D007 decision through amend-order; the approved scope and criteria were not altered. Subsequent complete document results are recorded in the handoff."
  ],
  "rejected": [
    {
      "option": "Continue waiting for all eight host lanes to become free",
      "reason": "The complete document selection can run within one lane while the other validation continues."
    },
    {
      "option": "Skip checks or alter host resource limits",
      "reason": "The supported serial selection needs neither change."
    }
  ],
  "reopenWhen": "Contention ends or another gate's supported scheduling needs a different concurrency; never narrow its required checks."
}
```

## WO-006-D013

```json
{
  "id": "WO-006-D013",
  "date": "2026-10-21",
  "dispatch": "resume: verify; VER-001 attack on the shell skip link and local anchors",
  "decision": "Record as a follow-up: the shell skip link and the board local anchors are bare fragment hrefs resolved against <base href=\"/\">, so activating the skip link leaves /board for /#main-content, reloads the application and resets the selected panel. Criterion 6 holds: its keyboard test starts from the initial panel, and the reloaded page still focuses main. The defect breaks no criterion and no behavior main had, because main had no skip link.",
  "evidence": [
    "Verifier probe against the production build in dist/apps/dotln/browser, served with an SPA fallback: Playwright selected the Work panel, focused the skip link and pressed Enter. The server received a second document request, the main frame navigated twice more, the URL became /board#main-content, main was focused and the selected tab was Actors instead of Work.",
    "In the same page the first board-link-mapper anchor has href #evidence-1, which the browser resolves to /#evidence-1. Primary activation calls preventDefault and is handled by the facade, so only new-tab and copied links take the root URL.",
    "apps/dotln-e2e/src/board.spec.ts starts its keyboard test at /board with Actors selected, so it cannot observe a reload. The target conventions section 18 asks for a working skip link."
  ],
  "rejected": [
    {
      "option": "Fail the verdict",
      "reason": "Criterion 6 requires a test that reaches main from the skip link. That test exists and passes, and main had no skip link, so 07 Verification review and attack routes the defect as a follow-up."
    },
    {
      "option": "Repair it during verification",
      "reason": "The verifier never edits the implementation it judges."
    }
  ],
  "followup": "Make the skip link move focus to main without a document navigation, for example by focusing a template reference to main on activation, which keeps the layout free of injection under R1. Resolve local anchors against the current route. Extend the keyboard e2e to start from a panel other than Actors and to assert one document load and the preserved selection.",
  "reopenWhen": "A change touches libs/dotln/shell/src/lib/layouts/app-layout or the board link mapper, or a keyboard user loses the selected panel after using the skip link."
}
```

## WO-006-D014

```json
{
  "id": "WO-006-D014",
  "date": "2026-10-21",
  "dispatch": "resume: verify; VER-001 measurement of the Aria and CDK bundle cost",
  "decision": "Record as a follow-up that reopens WO-006-D002. Its bundle reading covers the whole lazy route, which is mostly the recorded fixture, and it misses that Angular Aria and the CDK ship in the initial bundle. The planning receipt's reopening clause for this reading is met: a lazy-chunk size that includes the fixture without separating what @angular/aria and @angular/cdk contribute. No criterion depends on the figure.",
  "evidence": [
    "Verifier build at gate tree 438724e24b22bc33642929f4dbaf3b1b004e36dc: npx nx build dotln --configuration=production --statsJson, with its output in the session scratch directory. The attribution reads the esbuild metafile in minified output bytes.",
    "Lazy board chunk, 208,017 B: recorded fixture 190,361 B, house code 17,075 B, Angular Aria 0 B, CDK 0 B.",
    "Shared chunk, 276,796 B and 85,363 B gzip, imported statically by main and so part of the initial load: Angular Aria 14,431 B and CDK 50,881 B. The CDK overlay module alone is 36,745 B; the remaining 162,033 B is other Angular packages.",
    "The application templates use no dotln-menu. apps/dotln/src/app/app.config.ts calls provideDotlnUi(), which imports A11yModule and OverlayModule through importProvidersFrom. This measurement does not isolate whether that call alone places the overlay in the initial graph."
  ],
  "rejected": [
    {
      "option": "Accept D002 as the console-framework evidence",
      "reason": "WS-001 sends this evidence to core as the answer to its deferred framework decision. A fixture-dominated route size would misstate the behavior libraries' cost."
    },
    {
      "option": "Fail the verdict",
      "reason": "Step 2's check is npm ls and the tabs spec, both of which pass; no acceptance criterion reads the bundle figure."
    }
  ],
  "reopens": {
    "decisionId": "WO-006-D002",
    "observation": "The verifier's metafile attribution separates Aria and CDK bytes from the fixture and finds them in the initial shared chunk, not in the lazy route D002 measured."
  },
  "followup": "Replace D002's bundle evidence with per-package attribution before it answers core's console-framework question. Keep behavior code the first screen does not need, such as the CDK overlay, out of the initial bundle, and measure before and after.",
  "reopenWhen": "The console-framework evidence is sent to core, or a change to provideDotlnUi or the application providers alters the initial bundle."
}
```

## WO-006-D015

```json
{
  "id": "WO-006-D015",
  "date": "2026-10-21",
  "dispatch": "resume: verify; VER-001 attack on the role-by-location lint",
  "decision": "Record as a follow-up: the R1 and R3 lint admits three forms. An aliased import of inject, a namespace call core.inject(...) in a presentational directory, and a dynamic import() of @angular/cdk outside wrappers all pass lint. The workspace contains none of them, so criteria 1 and 2 hold; the rules are weaker than R1 and R3 state.",
  "evidence": [
    "npx eslint --stdin --stdin-filename libs/shared/ui/src/lib/fragments/badge/badge.ts with probe sources: inject(ElementRef) is refused by no-restricted-syntax, while `import { inject as use }` followed by use(ElementRef) and `import * as core` followed by core.inject(core.ElementRef) report no finding.",
    "With --stdin-filename libs/features/board/src/lib/containers/board-page/board-page.ts a static import of @angular/cdk/a11y is refused by no-restricted-imports, while `export const load = () => import('@angular/cdk/a11y')` reports no finding.",
    "Criterion 1's grep sees the dynamic import string and criterion 2's grep sees core.inject(, but the aliased call escapes both. The order's Design names the selector CallExpression[callee.name=\"inject\"]. WO-005-D011 records the same alias class for the structural inspectors."
  ],
  "rejected": [
    {
      "option": "Fail criteria 1 or 2",
      "reason": "Both criteria are stated over the current workspace, which contains none of these forms."
    },
    {
      "option": "Fold the item into FUP-1ce1fb75025a93f8",
      "reason": "That item covers the token, kit and template inspectors; these are ESLint selectors with their own fixture runner."
    }
  ],
  "followup": "Refuse every binding of @angular/core's inject in role directories, including an aliased import specifier and a namespace member call, and refuse a dynamic import() of @angular/aria or @angular/cdk outside wrappers and the provider file. Give each a failing fixture and a passing control in tools/check-taxonomy-fixtures.mjs.",
  "reopenWhen": "An aliased or namespaced inject, or a dynamic behavior import, appears in a role directory, or a planning pass allocates the structural-inspector hardening."
}
```

## WO-006-D016

```json
{
  "id": "WO-006-D016",
  "date": "2026-10-21",
  "dispatch": "resume: verify; VER-001 review of the workspace task settings",
  "decision": "Record as a follow-up: nx.json now sets \"parallel\": 1 for every Nx run in the target, including developer runs and CI. The constraint it answers is the launchpad probe memory budget. No decision records the tradeoff.",
  "evidence": [
    "git diff nx.json against 5102783f adds \"parallel\": 1. The WO-006 README mentions bounded unit parallelism, but no decision does.",
    "Verifier's uncached npx nx run-many -t lint test build --skip-nx-cache: 18 tasks passed in 49.8 s. Nx reported a 16.8 s critical path and 33.1 s (66%) recoverable with more parallelism. Peak footprint under the bounded wrapper was 979 MB against a 3.22 GB budget.",
    "CI's npx nx affected -t lint test build e2e inherits the setting."
  ],
  "rejected": [
    {
      "option": "Fail the verdict",
      "reason": "Parallelism changes wall-clock, not behavior, and no criterion names it."
    },
    {
      "option": "Restore the default without a bound",
      "reason": "The executor observed memory-budget failures under parallel browser and dev-server runs; the bound has to live somewhere."
    }
  ],
  "followup": "Restore the workspace's default Nx parallelism and put the bound where the constraint lives: the launchpad gate argv or the bounded probe environment. Alternatively, record the serial default as a decision with its measured cost.",
  "reopenWhen": "A target order changes nx.json or the gate declaration, or CI wall-clock becomes a concern."
}
```

## WO-006-D017

```json
{
  "id": "WO-006-D017",
  "date": "2026-10-21",
  "dispatch": "resume: verify; VER-001 judgment of the planning receipt's fixture-scrub known issue",
  "decision": "The receipt's criterion 5 scrub clause is judged from the verifier's own checks. The committed fixtures carry nothing the instance local-terms list matches, no private hostname or remote URL, and no control-derived section. The only account identifiers are the owners in two public GitHub repository names, which appear inside a projected work-order title. No follow-up is needed.",
  "evidence": [
    "checkLocalTerms from scripts/lib/terms.mjs over the 206 changed target text files, both fixtures included: status present, no finding. No term was printed.",
    "URL and address scan over both fixtures: no http(s) URL and no e-mail address. The recorded fixture paths start with <launchpad>/.",
    "The two repository names come from the WO-010 title the board projects. A read-only gh api call on each repository returned visibility public on 2026-10-21. The names are not repeated here.",
    "Capture source list: 8 of 21 sources were available (loadout exports, the feedback loadout, the work-order README and history, the worktree constellation, the release list, resume usage and the refutation receipts). The other 13 were unavailable, including resume:status--json (control unavailable), so the fixture has no control-derived section. docs/control/resume.jsonl does not exist in this launchpad."
  ],
  "rejected": [
    {
      "option": "Treat the public repository owners as a leak",
      "reason": "Both repositories are public, and the identifiers already appear in tracked launchpad documents and in the target repository name."
    },
    {
      "option": "Leave the judgment to final review",
      "reason": "The receipt asked for the terms check and the source list in these decisions. Recording them now gives the next fixture refresh a baseline."
    }
  ],
  "reopenWhen": "A fixture refresh changes the available source set, the local-terms list matches either fixture, or either repository becomes private."
}
```

## WO-006-D018

```json
{
  "id": "WO-006-D018",
  "date": "2026-10-21",
  "dispatch": "resume: verify; operator notes during the VER-001 draft publish, paraphrased",
  "decision": "Record for final review and planning: DotLn's registered-target admission did not carry the verified-phase draft publish, so Claude Code's auto-mode classifier decided it twice and denied it twice. The operator had removed the host allow entries for GitHub push on purpose, so that DotLn would carry target publication. The burden therefore shifted to the intervenor, which is the operator's own reading. The structural cause: the admission requires the order worktree's dotln.config.json to equal main's committed bytes, and an order that edits its registration (this one adds the visual gate command) can never meet that before its records merge. Final review's non-draft publish will meet the same refusal.",
  "evidence": [
    "Attempt 1, 2026-10-21T14:49:53Z: the session ran the node-spelled helper with a `2>&1 | tail -20` suffix. The hook's plain-word parser declines piped or redirected commands and records nothing, so the admission never evaluated. The journal's PermissionDenied row at 14:50:03.980Z has typed event HostPermissionDenied and rule [Unrequested Commit in a Connected App].",
    "Attempt 2, 2026-10-21T14:53:09Z, made with the operator's authorization and the plain spelling from the order's step 15. The journal records the advisory 'Registered-target admission withheld: registration, target or canonical status fact unreadable (publication authority differs from main's committed dotln.config.json); host permissions decide.' It then records the generic effect row (lifecycle.run, allowed) and a PermissionDenied row at 14:53:25.916Z with typed event HostPermissionDenied and rule [Create Public Surface].",
    "A following read-only journal check bundled with git checks was also denied, with rule [Out-of-Place Publication]. The operator reported manually approving a command in this sequence, and noted that auto-mode rejections often never reach them.",
    "packages/skeleton/dist/src/harness-host.js registeredTargetAdmission: committed() throws 'publication authority differs from main's committed <file>' unless the checkout's dotln.config.json equals main's HEAD bytes. git diff dotln.config.json in this order worktree adds the visual gate command, NX_ISOLATE_PLUGINS and the disposable diagnostic path, so the comparison fails until the records merge.",
    "Effects: none. Target HEAD remains 5102783f, there is no refs/dotln/draft/WO-006 ref, and no push or pull request happened. Readback: the project allow list is empty, no user allow entry matches publish patterns, and hostRules is absent from the registration."
  ],
  "rejected": [
    {
      "option": "Keep retrying, or route around the classifier with another spelling",
      "reason": "The denials are host decisions that leave the next step to the operator; a workaround would defeat their intent."
    },
    {
      "option": "Restore host allow entries for git push",
      "reason": "The operator removed them deliberately so that DotLn carries target publication."
    },
    {
      "option": "Revert this order worktree dotln.config.json to main to obtain admission",
      "reason": "The registration change is part of the operator-approved scope (the visual gate), and restoring bytes to satisfy a check would remove reviewed work."
    }
  ],
  "followup": "Make DotLn carry registered-target publication for an order that edits its own registration. Judge publication authority from main's committed grant and the publication-relevant registration fields, not byte equality of the whole dotln.config.json, or sequence the registration change onto main before the publish. Also: write an advisory when a helper call is disqualified only by shell syntax; say in the role text and the order's publish step that the helper runs as a plain command; and record whether a hook admission prevails over Claude Code's auto-mode classifier. Count each host denial the operator must resolve as burden shifted to the intervenor.",
  "reopenWhen": "Final review's publish of WO-006 runs, whether it is admitted or denied, or core changes the registered-target admission's authority comparison or command parser."
}
```

## WO-006-D019

```json
{
  "id": "WO-006-D019",
  "date": "2026-10-21",
  "dispatch": "resume: verify; operator ran the draft publish helper with the ! prefix after the host denials",
  "decision": "Record for final review and planning: target publication of WO-006 is refused by the kit's outward lint, whoever runs it. The helper appends a Change table listing every changed path, and the order's prescribed fixture name launchpad-board-2026-10-21.json puts the term the outward vocabulary refuses (vocabulary.launchpad) into the pull request body. The reviewed body passes on its own. No body edit can fix this; the fixture's name or the kit's rule must change before the draft or the final publish can succeed.",
  "evidence": [
    "The operator ran the order's step 15 command verbatim with the ! prefix from the launchpad root. It printed 'error: target publish refused: outward lint: pr-body refused: vocabulary.launchpad (line 147)'.",
    "Reproduced read-only with lintArtifacts from scripts/lib/target-publish.mjs. docs/evidence/WO-006/draft-pr-body.md alone passes, a Change-table row for libs/features/board/src/testing/fixtures/uifa-board-v1.schema.json passes, and the row for libs/features/board/src/testing/fixtures/launchpad-board-2026-10-21.json is refused with vocabulary.launchpad. It is the only changed path containing the term.",
    "scripts/lib/target-publish.mjs publishTargetDraft runs git commit-tree before lintArtifacts, and update-ref, the DraftPrepared record and the push after it. After the refusal, target HEAD is 5102783f, no refs/dotln/draft/WO-006 ref exists, and no target-publication record exists. At most one unreferenced commit object remains in the target clone.",
    "The name is referenced by provide-board-feature.ts, board-test-kits.ts, board-page.spec.ts, tools/scripts/check-board-fixtures.mjs, tools/board-fixtures.test.mjs and docs/dev-reference/architecture/console.md in the target, and by the order, its decisions and the repository profile in the launchpad. Criterion 5 globs fixtures/*.json, and criterion 7 asks console.md to name the fixture path, not this exact name.",
    "Outcome, same day: the operator edited main's checkout copy of the outward vocabulary. An empty terms list was refused as invalid ('require nonempty types and terms'), and a single opaque placeholder term then passed. The operator's ! run opened draft pull request #4 at a9e58af4aabc370eb82edcdd2b9b0f619cc809f0. Main's placeholder edit is uncommitted, and the operator then synced this order worktree's copy to match main's byte for byte, and will raise the change in the next fork planning pass."
  ],
  "rejected": [
    {
      "option": "Edit the body to avoid the term",
      "reason": "The term is in the helper-generated Change table, not in the reviewed body."
    },
    {
      "option": "Rename the fixture during verification",
      "reason": "The verifier never edits the implementation it judges, and VER-001 is already filed."
    },
    {
      "option": "Publish outside the helper",
      "reason": "The helper is the only admitted publication route, and raw git or gh would bypass the outward lint the kit requires."
    }
  ],
  "followup": "Before WO-006's publish, rename the recorded fixture to a name without the refused term, for example recorded-board-2026-10-21.json, updating its six target references, the launchpad profile and the generator log, and rerun the gates. Alternatively, remove launchpad from this instance's docs/control/outward-vocabulary.json, the operator-owned list WO-003 registered and the operator now says should allow the word. The helper reads main's copy, so that change must reach main first. Planning should also check order-prescribed file names against the outward vocabulary.",
  "reopenWhen": "The fixture is renamed, or launchpad leaves main's outward vocabulary, and the next publish attempt runs."
}
```

## WO-006-D020

<!-- integration refs/dotln/checkpoint/WO-006/6 -->

```json
{
  "id": "WO-006-D020",
  "date": "2026-10-21",
  "dispatch": "resume: final review; worktree integrate WO-006",
  "decision": "Integration record: main at 33ff6a480fa985801cb39243bc6a56bb663156a7 is the order's own base, so the merge changed nothing and no authored conflict exists; both bases and the recovery material (checkpoint 6, the named stash) stay retained. Carried-forward claims: the launchpad side carries no code byte of this review, so no launchpad complete run is owed, and the kit admits none for a target order (requireFinalReviewGate returns no gate when the order has a repositoryId); the target's own review gate passed at the repaired tree (D024). The affected checks ran and passed.",
  "evidence": [
    "refs/dotln/checkpoint/WO-006/6",
    "base 33ff6a480fa985801cb39243bc6a56bb663156a7",
    "upstream 33ff6a480fa985801cb39243bc6a56bb663156a7",
    "release preparation: WO-006: target order records no release; no files changed.",
    "Affected checks after the integration: npm run publication:check (no editions declared, exit 0); node scripts/harness.mjs check (34 generated surfaces; local-terms list present); npm run release -- check-surfaces --local (three license surfaces PASS); npm run plan -- check (6 receipts, 6 passes, exit 0); npm run adjacent -- list (one item, the executor's Vite repair, completed at queue revision 5); no nested repository under either worktree outside ignored roots.",
    "No component-version collision: the integration moved no byte and this instance assigns no version to a target order.",
    "Changed evidence inputs since VER-001: the operator's outward-vocabulary placeholder (D019), the draft publish observations in host-qualification.md, this review's decisions D020 to D026, preview-pr.json, the profile's Checked line and the register dispositions; none is a launchpad code byte."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance; return that finding through repair and fresh independent verification."
}
```

Integration date: 2026-10-21. Original base: `33ff6a480fa985801cb39243bc6a56bb663156a7`.
Fetched main: `33ff6a480fa985801cb39243bc6a56bb663156a7`. Checkpoint: `refs/dotln/checkpoint/WO-006/6`.
Named stash retained: `bffd5c46b6d48067a5c2ce832b3a77937ed4e81b` (WO-006 integrate 2026-10-21).
Resolved projections: none.
Release preparation: WO-006: target order records no release; no files changed.
Carried-forward claims: completed in the decision above; the acceptance judgment is FINAL-001's.
Authored conflicts observed: none.
Affected checks: publication:check, harness check, release check-surfaces and plan check ran after the integration and passed (results in the decision's evidence); a launchpad complete run is not owed for a target order.

## WO-006-D021

```json
{
  "id": "WO-006-D021",
  "date": "2026-10-21",
  "dispatch": "resume: final review; the operator's ten non-blocking notes on draft pull request #4, paraphrased from the ignored capture of 2026-10-21 (SHA-256 7149ef8857a4609e5575991e431a772c085245da12f6b5898ed9183cf223d1c3)",
  "decision": "Route the operator's ten notes without widening the order, as their tenth note directs: get this foundational change in and keep improving. Five are conventions for the planning route (one projected element per line in inline templates instead of the hugging layout Prettier wrote before D004; a per-section threshold at which a template or style section moves to its own file, one file staying the default; a granularity and shared-Sass pass over the house library, components as building blocks; a reference that names each script's purpose and intended use; about a fifth more blank lines where they help a reader). Two restate the app/shared grouping and alias naming D005 boarded (names such as shared-ui beside dotln-ui, models beside shared-models or dotln-models may come; dotln-angular stays the workspace name and dotln the first app; no refactor until a second app lands) and are added to that row as evidence. The console's purpose and the persistence and isolation needs go to the next UI planning pass (D022). The preference on speed and efficiency goes to the operator record through the planning pass (D023). The one instance the operator named, the shell spec's host template, is laid out one element per line inside the repair commit.",
  "evidence": [
    "The ten notes were sent in the final-review session on 2026-10-21 after the operator read draft #4; the capture digest above binds the words, and the routing per item is in docs/evidence/WO-006/preview-pr.json.",
    "Reproduced for the hugging layout: libs/dotln/shell/src/lib/layouts/app-layout/app-layout.spec.ts carried the form Prettier 3.9.10 writes for inline elements under whitespace-sensitive formatting; D004 turned embedded formatting off for TypeScript, so the bytes now stay as written and nothing reformats them either way. The same form stands in the board page, the link mapper and four other specs.",
    "Reproduced for the scripts note: the target's package.json declares 20 scripts and tools/scripts holds 12 files, described only in passing across conventions.md, foundation.md and the generator log; no document lists them with their purpose.",
    "Reproduced for the file-split note: the board page's inline template is 104 lines and its styles 58 lines in one 202-line file; conventions §6 says inline while small and names no threshold.",
    "The order's criteria name none of the ten; none breaks behavior main had; 07 routes each as a follow-up by rule."
  ],
  "rejected": [
    {
      "option": "Reformat every inline template to one element per line in this review",
      "reason": "Seven files outside the repair's surfaces, with whitespace semantics to check in each; the operator said the notes do not block and asked that the change go in."
    },
    {
      "option": "Add the scripts reference now",
      "reason": "A new document outside the order's three named documents and its criteria; cheap, but it widens the order after the operator asked not to."
    },
    {
      "option": "Treat the notes as a request to pause",
      "reason": "A question or note is not a pause; the operator's tenth note is the opposite."
    }
  ],
  "followup": "Settle in the next planning pass that edits WS-001 or the target's conventions: (a) one projected element per line in inline templates, reformatting the hugging layout where it is met; (b) the per-section threshold at which a template or style section moves to its own file, one file staying the default; (c) a granularity and shared-Sass pass over the house library; (d) a scripts reference under docs/dev-reference/workspace naming each npm script and tools/scripts file with its purpose and intended use; (e) about a fifth more blank lines where they help a reader, enforced by an autofixing rule rather than by hand.",
  "reopenWhen": "The next planning pass that edits WS-001 or the target's conventions, or the first order that touches the house library's templates."
}
```

## WO-006-D022

```json
{
  "id": "WO-006-D022",
  "date": "2026-10-21",
  "dispatch": "resume: final review; the operator's sixth note on draft pull request #4 (capture SHA-256 7149ef8857a4609e5575991e431a772c085245da12f6b5898ed9183cf223d1c3)",
  "decision": "Record for the next UI planning pass, which already owes WO-007 its base amendment after this merge: the operator reads the recorded board as the platform's own HTML problem restated, data shown without regard to how the operator interacts with it or benefits from it; the console exists for operator flow and knowledge, never as a skin over JSON, with any datum reachable when needed; the operator asks for help designing that experience and can judge candidates by saying which does not work (two at a time, as at the eye doctor); the guiding question is how someone would use a screen so that their changes flow back into the platform and improve it; interactions must persist whether the app runs from a worktree or from main; and using the app must never touch the worktree or gate machinery, because the operator intends to use the console while changing it through the fork. This review ships the board as the order's demonstration of the taxonomy and the first screen WS-001 names; it does not redesign it.",
  "evidence": [
    "The order's objective is the taxonomy demonstrated once by the actor board, and WS-001 §The console calls the board the first screen with the road after it (live view, command surface, pattern workshop, arrival screen); the operator's note is about that road's next step, not about a criterion.",
    "WO-007 (events, stores, HTTP and MSW) has a provisional base and is amended by the pass that follows this merge (UI planning pass of 2026-10-21, §9.2), so the persistence and isolation requirements reach the order that first holds state.",
    "The operator record asks that a pass research the product in the platform's records through workers rather than ask the operator to restate it (direction of 2026-10-21, D10 of the UI planning pass)."
  ],
  "rejected": [
    {
      "option": "Sketch a redesigned first screen in this review",
      "reason": "Design outside the order's criteria and surfaces, without the research the operator record asks for first."
    },
    {
      "option": "Treat the note as a blocking finding against criterion 6 or 9",
      "reason": "Both criteria hold; the note judges what the screen is for, which the planning route owns."
    }
  ],
  "followup": "The next UI planning pass runs a UX ideation over the console with research workers over the platform's records: two or three candidate first screens built from the operator's tasks rather than from the board's panels, each with what it lets the operator do and what it shows on demand; the persistence question routed into WO-007's amendment (a browser-local store or the platform host, with no write into docs/control, the worktree registry or any gate input); and the isolation rule named in WS-001 §The console so that using the app never writes into the worktree or gate machinery.",
  "reopenWhen": "The next UI planning pass opens, or WO-007's base is set."
}
```

## WO-006-D023

```json
{
  "id": "WO-006-D023",
  "date": "2026-10-21",
  "dispatch": "resume: final review; the operator's seventh note on draft pull request #4 (capture SHA-256 7149ef8857a4609e5575991e431a772c085245da12f6b5898ed9183cf223d1c3)",
  "decision": "Follow the operator's live direction in this review and hand it to the next planning pass for docs/operator/README.md §Standing preferences: no dedicated passes for a lean app or small build output; speed and efficiency weigh in every decision as first-party concerns and are never the goal or the vision; the operator paraphrased the Theory of Constraints (throughput first, inventory and operating expense down; identify the bottleneck, exploit it, subordinate the rest to it, then elevate it). Applied here: VER-001 F2's bundle attribution stays evidence owed to core, not a leanness pass, and F4's serial Nx default is recorded with its cost (D025) rather than optimized now.",
  "evidence": [
    "docs/operator/README.md says a role that notices a mismatch between the record and the operator's live direction follows the live direction and says so in its handoff, so the pass can update the record; the record itself changes only through a planning pass or the operator's word.",
    "The preference reads on two boarded items of this order: FUP-7bbf34bdd0925297 (bundle attribution) and FUP-2fd99c45dad9286d (parallelism)."
  ],
  "rejected": [
    {
      "option": "Edit docs/operator/README.md in this review",
      "reason": "The record is written by planning passes from the operator's captured words; this role records the direction and hands it on."
    }
  ],
  "reopenWhen": "The next planning pass records the preference, or the operator restates it differently."
}
```

## WO-006-D024

```json
{
  "id": "WO-006-D024",
  "date": "2026-10-21",
  "dispatch": "resume: final review; Adjacent Repair of VER-001 F1 inside the order's declared surfaces",
  "decision": "Repair the skip link in the target: the shell layout handles the link's activation by focusing the main landmark in place and preventing the fragment navigation, keeping the href for the link's semantics and the non-script path. The shell spec asserts the handled activation, and the keyboard browser test starts from the Work panel and asserts that the document is not reloaded (a dataset marker survives), the URL stays /board and the selection is preserved. The shell spec's host template is laid out one projected element per line, the one instance the operator named (D021). The board's local anchors still resolve against <base href> for new-tab and copied links; that remainder stays boarded.",
  "evidence": [
    "Negative probe before the repair: with the old layout built (npx nx build dotln --skip-nx-cache) and the new keyboard test run alone, Playwright failed on the URL assertion, receiving /board#main-content; the repaired file was restored byte for byte (SHA-256 9e307d2f…).",
    "After the repair: npx nx test dotln-shell --skip-nx-cache 2 tests passed; npx nx run-many -t lint -p dotln-shell,dotln-e2e --skip-nx-cache passed; npm run typecheck:e2e, npx nx format:check and npm run lint:components passed; npx nx e2e dotln-e2e --skip-nx-cache 36 passed in 22.4 s; all under the bounded wrapper, one at a time, within the 3.22 GB budget.",
    "node scripts/target-gate.mjs WO-006 --review at the repaired tree: install, lint, test, format, build, e2e and visual all PASS, 85,114 ms, no tracked-byte mutation; the visual baselines are unchanged because the repair changes no pixel.",
    "Target commits: the draft commit a9e58af4aabc370eb82edcdd2b9b0f619cc809f0 adopted as the branch head without moving the working tree, then eb7dfdf0f1898e597c865f08c04813000029bb9b (fix: focus the main landmark from the skip link without a reload), three files, 56 insertions and 15 deletions; git diff --check clean.",
    "R1 holds: the layout injects nothing; the template passes the landmark element to the handler. conventions.md §18 asks for a working skip link, and the operator record asks for security and correctness that would hold in a real organization."
  ],
  "rejected": [
    {
      "option": "Leave F1 boarded for a later repair",
      "reason": "Three files inside the declared surfaces, one gate run, and a keyboard user keeps their place; the order's own convention asks for a working skip link."
    },
    {
      "option": "A view query for the landmark",
      "reason": "The template already has the element; a query adds a member for no behavior."
    },
    {
      "option": "Resolve the board's local anchors in the same repair",
      "reason": "The mapper would need the current route or a path input, which is a design choice for the planning route; primary activation already works, and only new-tab and copied links take the root URL."
    }
  ],
  "reopens": {
    "decisionId": "WO-006-D013",
    "observation": "Final review repaired the skip link half of the follow-up inside the declared surfaces; the local-anchor half remains."
  },
  "followup": "Resolve the board's local anchors against the current route for new-tab and copied links, for example by passing the current path into the link mapper or by rendering router fragment links, with a browser test that opens a copied anchor directly.",
  "reopenWhen": "A change touches the board link mapper, or a copied board anchor opens the root instead of the board."
}
```

## WO-006-D025

```json
{
  "id": "WO-006-D025",
  "date": "2026-10-21",
  "dispatch": "resume: final review; disposition of VER-001 F4",
  "decision": "Record the serial Nx default (nx.json parallel: 1) as the workspace's setting with its measured cost, the alternative F4's repair rule allows, and leave it in place for now. The constraint is the launchpad's bounded probe budget of 3.22 GB: the executor's two-worker browser and dev-server runs exceeded it, and one browser worker with serial tasks fits. CI's runner has no measurement, and the operator's direction of 2026-10-21 (D023) ranks getting the feature in over a leanness pass. Measured cost: on the verifier's uncached lint, test and build run, 33.1 s of 49.8 s was recoverable with parallelism; this review's complete review gate ran 85,114 ms under the same setting, and the operator's draft run on GitHub's runners completed CI in about four minutes.",
  "evidence": [
    "git diff nx.json against 5102783f adds parallel: 1; the WO-006 README names bounded unit parallelism and the memory-budget failures.",
    "VER-001 F4: 18 tasks in 49.8 s uncached, 16.8 s critical path, 33.1 s recoverable; peak footprint 979 MB against 3.22 GB.",
    "Draft #4's CI run 39623872958: the checks job completed at 15:18:40Z and the visual job at 15:17:11Z, both started at 15:14:46Z."
  ],
  "rejected": [
    {
      "option": "Move the bound into the gate declaration's argv now",
      "reason": "It changes the gate's command hash and the registration bytes again, after D018 showed what a registration edit costs at publication, and CI's headroom for parallel tasks is unmeasured."
    },
    {
      "option": "Restore the default without a bound",
      "reason": "The executor observed the budget failures the bound answers."
    }
  ],
  "reopenWhen": "CI wall-clock becomes a concern, a target order changes nx.json or the gate declaration, or a measured CI run shows headroom for parallel tasks."
}
```

## WO-006-D026

```json
{
  "id": "WO-006-D026",
  "date": "2026-10-21",
  "dispatch": "resume: final review; disposition of the follow-up rows whose seam this review's records touched",
  "decision": "Dispose the register rows this review touched, at register revision 1840420ac84a455ed09417a072e1f8a78cae2e3dac409495ea81a2f7f0a9e950. Settled: FUP-2fd99c45dad9286d (D016) by D025. Deferred with their remainder: FUP-bad9c9ecbecaca67 (D013; the skip link repaired by D024, the local anchors carried by the new row FUP-e9c71a41e7c1eb8b), FUP-7bbf34bdd0925297 (D014; D014's attribution is the reading for core, a provider change waits for the order that touches provideDotlnUi), FUP-78ae6c5fa43ff2b7 (D015; with the inspector hardening FUP-1ce1fb75025a93f8), FUP-ba9813e8b2705de8 (D005; the operator's restated grouping and naming guidance added as evidence) and FUP-b0b01939c2ecf037 (D021's five conventions). Duplicate: FUP-b4f7404f2616243c (D002's row) of FUP-7bbf34bdd0925297. Open for the next planning pass, their conditions met: FUP-2479f6d32b2396a8 (WO-004-D013) and FUP-98c85b750cb36bd4 (C2), both by the draft publish observations of D018; FUP-e22968a92b1bb18c (D018's request to core on the admission's comparison); FUP-39e7a2f6db6b7f84 (D019's vocabulary ruling); FUP-db45bfeb533eeee6 (C7; the console-framework readings now exist in D002 and D014); and FUP-52178afa5a081d86 (D022's console UX and persistence inputs). Left as they are: FUP-1ce1fb75025a93f8 (D011's retained hardening) and FUP-83a2838dd2a2a199 (its condition, a bundle budget or a planning weighing of the utils footprint, did not occur).",
  "evidence": [
    "npm run plan -- followups --touching listed 13 pending rows matching this change or WO-006 by text before the sync and 16 after it (three new rows from D021, D022 and D024).",
    "The request file was applied with npm run plan -- followups --apply from a contained path; the open rows carry no reopening condition, as the register requires; the duplicate names its target. The request's bytes are kept in ignored intake (docs/intake/notes/wo006-final-review-followups-batch.json).",
    "Each reason names the decision that records the observation, so the next planning pass reads the row and the decision together."
  ],
  "rejected": [
    {
      "option": "Settle the draft-publish rows now",
      "reason": "Their conditions ask a planning pass to rule on the literal fallback and the kit's comparison; a review records the observation and leaves the ruling."
    },
    {
      "option": "Leave the new decision rows untriaged",
      "reason": "An untriaged row at a final review is a row nobody has read; each is dispositioned to the pass that owns it."
    }
  ],
  "reopenWhen": "The next planning pass reads the open rows, or a listed condition occurs before then."
}
```
