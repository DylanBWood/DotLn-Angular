# WO-005 decisions

The operator dispatched `resume: next` on 2026-10-20. Live steering is
paraphrased below; its single raw capture is ignored intake
`docs/intake/notes/wo005-steering-2026-10-20.md`, SHA-256
`6a2e8c3815f5db8031c496a9638201fabc2745b1950eb20bb50e735d7f886449`.

## WO-005-D001

```json
{
  "id": "WO-005-D001",
  "date": "2026-10-20",
  "dispatch": "resume: next; operator's shared-i18n suggestion",
  "decision": "Keep reusable translation behavior in shared i18n, configured by its own I18nConfig and provideI18n(). Put provideDotlnI18n() in core's i18n subfeature, adapting EnvironmentConfigToken and AppBasePathToken. Admit core -> i18n in the target's module boundary and document it; i18n -> core remains forbidden. The operator offered this as a design suggestion, and the separation avoids a dependency cycle while retaining the order's integration behavior.",
  "evidence": [
    "libs/shared/core/src/lib/i18n/provide-dotln-i18n.ts",
    "libs/shared/i18n/src/lib/provide-i18n.ts and i18n-config.ts",
    "core.spec.ts checks production, languages and base-path adaptation; i18n.spec.ts checks reusable configuration, loading, missing keys and language changes",
    "The original dependency table admitted neither core -> i18n nor i18n -> core, while the order's loader required core tokens"
  ],
  "rejected": [
    {"option": "No change to the dependency design", "reason": "The requested cross-library token imports conflict with the existing boundary."},
    {"option": "Let shared i18n import application core", "reason": "That binds reusable translation behavior to this application's environment and frustrates core's integration role."},
    {"option": "Move all i18n implementation into core", "reason": "That discards the separate reusable library the order and operator want."}
  ],
  "reopenWhen": "Another application needs a translation setting that the independent I18nConfig cannot express, or a new integration creates a reverse dependency."
}
```

## WO-005-D002

```json
{
  "id": "WO-005-D002",
  "date": "2026-10-20",
  "dispatch": "resume: next; same-day operator correction of the Ramda type assertion",
  "decision": "Correct the house declarations while retaining the upstream function objects. The executor initially changed an expected number[] assertion to the upstream literal union, mistaking compatibility with current declarations for the goal. The operator clarified that this layer repairs missing or incorrect types and uses upstream examples to protect runtime behavior. Restore number[]; make filter produce variable-length arrays and optional dictionary keys; preserve narrowing, maps, placeholders, dispatch and transducers. Give isNonEmptyString a branded NonEmptyString predicate for primitive inputs and preserve placeholder currying. Unknown inputs do not narrow because a placeholder returns a truthy function; the brand also prevents the false branch from incorrectly excluding empty strings. Keep map and pipe declarations where the tested compositions already work. The facade does not claim to repair every upstream function.",
  "evidence": [
    "Installed types-ramda filter returns C for boolean predicates, preserving tuple length and required dictionary keys despite removal",
    "Installed ramda-adjunct isNonEmptyString returns boolean in its declaration but its runtime also supports placeholder currying",
    "Before the adapter, tsc --noEmit -p libs/shared/utils/tsconfig.spec.json failed the number[], readonly-tuple and optional-key assertions; after the adapter the same compiler command passed",
    "nx run-many -t lint test --projects=utils,tools --skip-nx-cache --output-style=static passed 24 utility tests, 17 tooling tests and all six foundation compiler configurations after the review corrections",
    "filter.spec.ts asserts the house function is the upstream function object; the upstream runtime examples cover arrays, objects, maps, dispatch and transducer behavior",
    "tools/scripts/check-foundation-types.mjs compiles both library and spec configurations; Vitest alone would not enforce expectTypeOf"
  ],
  "rejected": [
    {"option": "NoOp: retain the raw re-exports and adjusted assertion", "reason": "It optimizes the passing test instead of the intended type contract and leaves structural unsoundness in filtered collections."},
    {"option": "Reimplement Ramda filtering", "reason": "A type-only adapter repairs the defect without duplicating currying, dispatch or runtime behavior."},
    {"option": "Use a plain string type guard for nonempty strings", "reason": "The false branch can still hold an empty string; a plain string predicate would be unsound."},
    {"option": "Rewrite every Ramda declaration now", "reason": "The order covers used functions and demonstrated inference defects; the rest remains explicitly upstream."}
  ],
  "reopenWhen": "An added composition exposes a declaration defect, a function's upstream behavior changes, or upstream declarations make either adapter redundant. Preserve the intended contract and rerun both runtime and compiler regressions."
}
```

## WO-005-D003

```json
{
  "id": "WO-005-D003",
  "date": "2026-10-20",
  "dispatch": "resume: next; work-order cache experiment",
  "decision": "Disable Angular's additional CLI disk cache in nx.json and retain Nx task caching in .nx/cache. The installed normalizer resolves relative CLI cache paths through the common Git directory to the base checkout. Comparing default-relative, absolute-per-worktree and disabled configurations showed that an absolute path retains Angular caching inside the worktree, while disabling it preserves portable tracked configuration. Select portable isolation, accepting loss of Angular's additional incremental disk cache. No registration argv change is needed.",
  "evidence": [
    "node_modules/@angular/build/src/utils/normalize-cache.js, Angular 22.2.3",
    "Normalizer comparison: default relative enabled=true/baseWithinWorktree=false; absolute enabled=true/baseWithinWorktree=true; disabled enabled=false; all localPath values stayed inside the worktree",
    "Uncached local and production builds exited 0; main checkout .angular was absent before and after",
    "find . -path ./node_modules -prune -o -type d -name cache -print returned ./.nx/cache",
    "The target generator log and repository profile Commands section record the tradeoff"
  ],
  "rejected": [
    {"option": "NoOp: retain Angular's relative default", "reason": "It writes another checkout's cache."},
    {"option": "Commit an absolute path", "reason": "It is specific to this machine and worktree."},
    {"option": "Change registration commands", "reason": "The target configuration provides isolation without a new launchpad policy or follow-up order."}
  ],
  "reopenWhen": "Angular supplies a portable worktree-local persistent cache option, or measured build cost justifies a separately designed runtime path resolver."
}
```

## WO-005-D004

```json
{
  "id": "WO-005-D004",
  "date": "2026-10-20",
  "dispatch": "resume: next; generated library and testing-entry spike",
  "decision": "Retain all three Nx-generated libraries and their generated testing secondary entry points. Add the library package names that the secondary-entry generator reads, and public/testing path aliases. Use the generator's AnalogJS route for non-buildable libraries, pinning both AnalogJS packages to 2.9.1 after auditing the generated dependency chain. Replace the generated obsolete Vitest workspace setting with Vitest 4 projects. Run real compiler checks for the foundation specs and syntax-tree checks through the uncached tools:lint target.",
  "evidence": [
    "docs/dev-reference/workspace/generator-log.md records three library commands and three secondary-entry-point commands, each exit 0",
    "The generator-selected AnalogJS 2.6 dependency chain produced six audit findings; npm identified 2.9.1 as the compatible fix",
    "Published peer readbacks admitted Angular 22 and Vitest 4 for the matching AnalogJS packages",
    "The preflight compiled and linted the secondary-entry consumers without requiring sibling testing projects",
    "Negative fixtures check token descriptions, TypeScript private, forbidden dependencies, untranslated text, missing exported kits and missing provider spreads"
  ],
  "rejected": [
    {"option": "Use sibling testing libraries immediately", "reason": "The specified secondary-entry route works in the installed Nx configuration."},
    {"option": "Keep vulnerable generated dependencies", "reason": "The generated output is an input to verify, not a reason to retain a known defect."},
    {"option": "Count passing Vitest execution as type evidence", "reason": "Runtime transpilation does not establish the compile-time assertions."}
  ],
  "reopenWhen": "An Nx or Vitest upgrade changes entry-point discovery, the selected dependency line becomes incompatible, or a genuine convention violation bypasses the syntax checks."
}
```

## WO-005-D005

```json
{
  "id": "WO-005-D005",
  "date": "2026-10-20",
  "dispatch": "resume: next",
  "decision": "Keep explicit provider composition, with the order's sole root-factory exception on AppBasePathToken pending the operator's ruling. Prime validated public browser configuration from the documented DOTLN_ keys. Keep the tracked default proxy usable without a local environment file; generate the local proxy from DOTLN_API_PROXY_TARGET and select it only in the local serve configuration. Adapt Transloco Keys Manager's temporary inputs by parsed pipe-name spans and house signal imports so the real extractor checks the house API without changing source or catalogs.",
  "evidence": [
    "Static proxy JSON cannot interpolate process environment variables",
    "cp .env.example .env and npm run env:prime generated the local environment and proxy; git check-ignore named both local environment files",
    "Both local and production builds passed; the session-created .env and environment.local.ts were removed afterward",
    "The installed keys-manager extractor recognizes transloco and upstream imports, while the application uses t and the house translateSignal export",
    "Tooling tests exercise invalid environment values, production mocks, URLs, keys, and exact AST adaptation, including a literal key containing pipe-like text"
  ],
  "rejected": [
    {"option": "Put a variable placeholder in static proxy JSON", "reason": "The development server would receive an uninterpolated target."},
    {"option": "Replace every textual occurrence of the pipe name", "reason": "That can alter a literal translation key instead of just the pipe."},
    {"option": "Add more root-provided services", "reason": "The order's pending exception is limited to the base-path token."}
  ],
  "reopenWhen": "The operator rules on root factories, keys-manager directly supports the house API, or a new environment setting requires a different validated public contract."
}
```

## WO-005-D006

```json
{
  "id": "WO-005-D006",
  "date": "2026-10-20",
  "dispatch": "resume: next; operator's later UI direction and licensing clarification",
  "decision": "Carry the operator's direction to own the component API, markup, styling and tests into the next UI planning decision, evaluating Angular Aria for reusable accessibility behavior. Extra styling work is an accepted tradeoff to investigate. The initial compatibility readback did not address the real constraint: the operator clarified that PrimeNG licensing, not Angular peers, drove the concern. Current official PrimeUI terms confirm the change from MIT beginning with PrimeNG 22, with conditional and annually renewed free Community access. Earlier MIT releases retain their license. This is a planning handoff for WO-006, not a UI package addition to the foundation order.",
  "evidence": [
    "Ignored operator-steering capture named at the top of this file",
    "https://angular.dev/guide/aria/overview describes headless accessible directives; the application owns markup and styling",
    "npm view @angular/aria@latest version peerDependencies on 2026-10-20 returned 22.2.3, @angular/cdk 22.2.3 and @angular/core ^22.0.0 || ^23.0.0",
    "https://primeui.dev/nextchapter names PrimeNG 22 as the new licensing boundary and preserves prior MIT releases",
    "https://primeui.dev/licenses/community, updated 2026-08-26, states eligibility, annual renewal and restrictions on redistribution for others' development"
  ],
  "rejected": [
    {"option": "Adopt current PrimeNG solely because Angular peers match", "reason": "Compatibility does not resolve the licensing constraint."},
    {"option": "Install a UI package in WO-005", "reason": "The current order explicitly leaves UI components and vendor selection to WO-006."},
    {"option": "Treat Aria as eliminating all dependencies", "reason": "It remains an Angular dependency, while allowing ownership of the component layer."}
  ],
  "reopenWhen": "Before WO-006 activates, or when the operator changes the desired ownership or licensing tradeoff.",
  "followup": "Next UI planning pass before WO-006: reconcile its PrimeNG/MIT assumption with current licensing and the operator's preference for a house-owned component library; evaluate Angular Aria with one representative styled component, keyboard/focus checks, accessibility tests, public API ergonomics, maintenance cost and dependency/license review; amend the judged WO-006 and WS-001 through the planning route before implementation."
}
```

## WO-005-D007

```json
{
  "id": "WO-005-D007",
  "date": "2026-10-20",
  "dispatch": "resume: next; executor's required independent worker review",
  "decision": "Use one import-aware TypeScript token inspector for the standalone cross-check and the dotln/token-names ESLint rule, replacing the bare-name selector. Resolve spec-kit aliases with TypeScript symbols and require const aliases, so separate lexical bindings cannot validate each other. Complete filter's collection-first placeholder declarations and separate omitted arguments from explicit undefined. Restrict the nonempty-string predicate to primitive inputs while preserving the upstream function object. All four worker findings and the executor's additional undefined-argument finding are repaired before the final gates.",
  "evidence": [
    "self-review.md records the criteria worker's two findings and the design worker's two findings",
    "Real ESLint fixtures reject bare, aliased and namespace bad tokens and admit corresponding valid controls",
    "The tooling regression rejects exactly the fabricated kit in two callbacks with the same variable name, in either source order",
    "Utility compiler assertions cover dictionary and Map placeholder calls, unknown placeholders without narrowing, and the existing composed primitive guard",
    "A compiler negative fixture admits ordinary currying and rejects an explicit undefined collection with diagnostic 2769",
    "Focused uncached lint/test run on utils and tools exited 0 on 2026-10-20"
  ],
  "rejected": [
    {"option": "NoOp: keep the selector and waive disagreement", "reason": "The order explicitly treats a lint/cross-check disagreement as a defect."},
    {"option": "Add parallel alias-specific lint selectors", "reason": "They duplicate partial parsing and allow the two judgments to drift again."},
    {"option": "Keep a file-wide kit-variable map", "reason": "A later declaration can incorrectly validate an unrelated earlier binding."},
    {"option": "Change the predicate runtime to reject placeholders", "reason": "A sound declaration can preserve the upstream runtime and currying contract."}
  ],
  "reopenWhen": "A supported source form bypasses the shared inspector or kit resolver, or a new composition exposes a utility declaration that misstates runtime behavior."
}
```

## Verification follow-ups

The operator dispatched `resume: verify` on 2026-10-20. The independent
verification, [VER-001](../../verifications/WO-005/VER-001.md), met every
criterion and boards the seven findings below as follow-ups; none breaks a
criterion or a behavior `main` had. The verifier edited no implementation.

## WO-005-D008

```json
{
  "id": "WO-005-D008",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 implementation review of the lint configuration",
  "decision": "Record as a follow-up, not a blocking finding: the type-aware @typescript-eslint/prefer-readonly rule never applies to app or library files. The root eslint.config.mjs scopes it to apps/**/*.ts and libs/**/*.ts, and each project's eslint.config.mjs spreads that root array, so ESLint resolves those patterns from the project directory, where they match nothing. No criterion names the rule and main had no such rule; the order's Design and house rule 12 expect it.",
  "evidence": [
    "npx eslint --print-config in <target> for libs/shared/i18n/src/lib/transloco-http-loader.ts and apps/dotln/src/app/home.ts: @typescript-eslint/prefer-readonly and parserOptions.projectService are both absent, while dotln/token-names and @angular-eslint/prefer-signals are configured",
    "The same files with --config eslint.config.mjs: prefer-readonly is [2] with projectService true; linting both i18n services and the home component that way reports 0 errors, because their members are already readonly",
    "A probe component linted through stdin as libs/shared/core/src/lib/probe.ts: the never-reassigned #count and TypeScript-private secret draw no prefer-readonly report, while dotln/token-names, prefer-signals, no-restricted-syntax (twice), prefer-inject and no-unused-vars (a warning) fire",
    "tools/check-lint-fixtures.mjs copies the root configuration into a scratch root, so its fixtures resolve the patterns from that root and never exercise a project configuration; no fixture covers prefer-readonly"
  ],
  "rejected": [
    {"option": "Fail the verification", "reason": "No acceptance criterion names the readonly rule, main had no such rule, and the current members already comply."},
    {"option": "Edit eslint.config.mjs from the verifier session", "reason": "The verifier writes evidence and its report, never the implementation it judges."}
  ],
  "reopenWhen": "The next repair or a later order edits eslint.config.mjs or a project ESLint configuration, or a lint run admits a never-reassigned private member.",
  "followup": "Make @typescript-eslint/prefer-readonly effective, with type information, for every app and library TypeScript file as Nx lints it: npx eslint --print-config on a libs/shared or apps/dotln .ts file lists the rule, and a fixture linted under a project configuration fails on a never-reassigned private member while its readonly control passes."
}
```

## WO-005-D009

```json
{
  "id": "WO-005-D009",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 implementation review through the platform and browser-speed lens",
  "decision": "Record as a follow-up for the next repair or planning pass: the R and RA namespace re-exports put nearly all of Ramda and Ramda Adjunct into the production bundle, though the workspace uses four functions. House rule 1 ranks browser rendering speed above house preference. The order's Design prescribes the full namespace form, so a repair amends that Design through the planning route. No criterion covers bundle size, and the production budget passes.",
  "evidence": [
    "npx nx build dotln --configuration=production --stats-json on a scratch copy of <target>: 366 of 367 ramda modules (54,156 bytes) and 235 of 236 ramda-adjunct modules (31,770 bytes) have bytes in the output; initial total 335.43 kB raw and 90.24 kB estimated transfer",
    "Sources call R.filter, R.map, R.pipe, R.__ and RA.isNonEmptyString (grep over apps and libs); public_api.ts names R.pipe, R.map, R.filter and RA.isNonEmptyString as the used functions",
    "Scratch experiment with the same consumer imports: lib/ramda.ts as explicit re-exports of __, into, map and pipe plus the house filter, and lib/ramda-adjunct.ts as the house isNonEmptyString alone: initial total 258.57 kB raw and 71.73 kB estimated transfer; ramda 16,651 bytes and ramda-adjunct 601 bytes",
    "WS-001 house rule 1: Angular best practices and browser rendering speed win over any analogy or house preference; rule 7 fixes import { R, RA } from '@dotln-angular/utils'"
  ],
  "rejected": [
    {"option": "Fail the verification", "reason": "No criterion covers bundle size, the budget passes, and the executor implemented the Design's prescribed namespace form."},
    {"option": "Change the consumer import form", "reason": "House rule 7 fixes import { R, RA } from '@dotln-angular/utils', and the explicit re-export experiment keeps it."}
  ],
  "reopenWhen": "The next repair or planning pass edits libs/shared/utils, the production initial bundle approaches its budget, or the operator rules on what R and RA expose.",
  "followup": "Keep import { R, RA } from '@dotln-angular/utils' while the production bundle carries only the Ramda and Ramda Adjunct modules the used functions need, measured from the build's stats (for example, namespaces of explicit re-exports, each function with its ported spec); amend the order's Design through the planning route, since it prescribes the full namespace."
}
```

## WO-005-D010

```json
{
  "id": "WO-005-D010",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 implementation review of the host page title",
  "decision": "Record as a follow-up: check:templates treats the host page apps/dotln/src/index.html as an Angular template, so main's <title>DotLn</title> is refused as literal text and the change ships an empty <title></title>. The HTML standard requires a non-empty title. The document has no title until Home renders and sets it through translateSignal, and a client that runs no script sees none. The after-load title that main's end-to-end test asserts still holds, and moving user-facing text to Transloco follows house rule 9, so no tested behavior regresses.",
  "evidence": [
    "templates() in tools/scripts/templates.mjs returns app.ts, home.ts, apps/dotln/src/index.html and the i18n spec; with main's <title>DotLn</title> restored in memory, inspectTemplate reports apps/dotln/src/index.html:5: literal template text",
    "git show HEAD:apps/dotln/src/index.html has <title>DotLn</title> at line 5; the production build's browser/index.html contains <title></title>",
    "WHATWG HTML Living Standard, read 2026-10-20: section 4.2.2 gives the title element the content model text that is not inter-element whitespace; section 4.2.1 requires exactly one title element in head outside srcdoc documents",
    "Uncached npx nx e2e dotln-e2e passes toHaveTitle('DotLn') after bootstrap"
  ],
  "rejected": [
    {"option": "Fail the verification", "reason": "The after-load title main's test asserts still holds, no criterion covers the host page, and the change follows house rule 9's direction."},
    {"option": "Restore the static title from the verifier session", "reason": "The verifier writes evidence and its report, never the implementation it judges."}
  ],
  "reopenWhen": "The next repair edits apps/dotln/src/index.html or tools/scripts/templates.mjs, or a validator, crawler or link preview reports the empty title.",
  "followup": "The served index.html carries a non-empty <title> (for example the product name), and check:templates inspects component templates (inline template and templateUrl files) without refusing the host page's title; the translated runtime title stays."
}
```

## WO-005-D011

```json
{
  "id": "WO-005-D011",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 attack on the three structural checks",
  "decision": "Record as a follow-up: each structural check admits a source form it does not judge, so its exit 0 would not establish its criterion's property if such a form appeared. The workspace contains none of these forms, so criteria 2, 4 and 5 hold. This meets D007's reopening condition: a supported source form bypasses the shared inspector or kit resolver.",
  "evidence": [
    "check:tokens and dotln/token-names share inspectTokenNames. On a scratch file, new (InjectionToken)(...), a const alias of InjectionToken and a constructor re-exported through a local module draw no finding; multiline, static-member and object-member constructions are reported",
    "check:kits on scratch files: an InjectionToken declared as a class static or an object member requires no kit, and getTestBed().configureTestingModule({ providers: [] }) is not inspected; @Injectable({ providedIn: 'root' }), a namespace @core.Injectable() and a top-level token are reported",
    "check:templates on scratch components: a component whose shorthand template property names a variable holding <p>FromVariable</p> passes with 0 findings, because property() reads property assignments only; text inside @if, @for, @defer, @placeholder, @switch, ng-template, ng-container and a templateUrl file is reported",
    "check:templates also admits bound [textContent] and [innerHTML] literals, an <input type=submit value> and an <option label>, which render text outside text nodes; criterion 4 names text nodes only"
  ],
  "rejected": [
    {"option": "Fail the verification", "reason": "The criteria's properties hold on the workspace, where every listed form is absent."},
    {"option": "Treat these forms as unsupported", "reason": "Each is valid TypeScript or Angular; a shorthand template property is ordinary code."}
  ],
  "reopenWhen": "A listed form appears in apps/dotln/src or libs/shared, or the next repair edits a structural check.",
  "followup": "Each structural check judges or refuses every form in its scope: resolve InjectionToken and Injectable through their @angular/core symbols (parenthesized, const-aliased and locally re-exported constructors), require kits for tokens declared as class statics or object members, inspect getTestBed() receivers, refuse a shorthand or non-literal template or templateUrl, and cover bindings and attributes that render visible text; add a fixture for each form."
}
```

## WO-005-D012

```json
{
  "id": "WO-005-D012",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 review of the target's developer documentation",
  "decision": "Record as a follow-up: two developer documents in the target are stale or disordered after this change. The developer index still describes the app before this change and links no foundation material, and the generator log split an existing section and records the six foundation commands in two formats. Step 2's check (three library lines and three secondary-entry-point lines) holds.",
  "evidence": [
    "docs/dev-reference/README.md in <target>, untouched by the diff: its table lists app.config.ts as zoneless, router and HTTP providers and app.routes.ts as the eager placeholder home route, and it names no libs/shared library and no architecture/foundation.md",
    "git diff of docs/dev-reference/workspace/generator-log.md: new Foundation libraries and Scaffold help record headings sit between Installed generator help and its paragraph, leaving that heading empty; the core command is a table row marked Scheduled, while its result and the five other commands are list items appended under Scaffold help record"
  ],
  "rejected": [
    {"option": "Fail the verification", "reason": "Criterion 1 and step 2's line counts hold; the defect is documentation order and accuracy."},
    {"option": "Edit the target documents from the verifier session", "reason": "The verifier writes evidence and its report, never the implementation it judges."}
  ],
  "reopenWhen": "The next repair or a later order edits docs/dev-reference/README.md or the generator log.",
  "followup": "docs/dev-reference/README.md describes the current app configuration and lazy home route and links the three foundation libraries and architecture/foundation.md; the generator log keeps Installed generator help with its body and records each foundation command and its result in order, in one format."
}
```

## WO-005-D013

```json
{
  "id": "WO-005-D013",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 reproduction of the step 5 cache finding",
  "decision": "Record as a follow-up: the cache finding's recorded tradeoff is incomplete. Disabling the Angular CLI cache in nx.json also disables the dev server's Vite dependency prebundling, while D003, the repository profile and the generator log name only the lost incremental disk cache. The isolation itself is reproduced: after uncached tests, builds and dev-server runs, the base checkout gained no file and the worktree's only cache directory is .nx/cache.",
  "evidence": [
    "Every dev-server start in uncached npx nx e2e dotln-e2e and in both live proxy probes printed: Prebundling has been configured but will not be used because caching has been disabled.",
    "node_modules/@angular/build/src/builders/dev-server/options.js sets prebundle to cacheOptions.enabled && !optimization.scripts && prebundle and warns when the cache is disabled",
    "Base checkout before and after this session's runs: no .angular directory and empty git status --short --ignored; find . -path ./node_modules -prune -o -type d -name cache -print in <target> lists only ./.nx/cache"
  ],
  "rejected": [
    {"option": "Reopen D003's choice", "reason": "Its reopening conditions have not occurred, and the installed normalizer offers no portable worktree-local path."},
    {"option": "Fail the verification", "reason": "No criterion covers step 5, and the isolation the step requires holds."}
  ],
  "reopenWhen": "The next repair or planning pass edits the cache finding, or dev-server rebuild time becomes a concern.",
  "followup": "The cache finding in docs/repositories/dotln-angular.md and the target generator log names the dev server's lost dependency prebundling and its warning beside the lost incremental disk cache, so the absolute-path alternative is weighed at its whole cost."
}
```

## WO-005-D014

```json
{
  "id": "WO-005-D014",
  "date": "2026-10-20",
  "dispatch": "resume: verify; VER-001 review of house rule 15 against WO-005-D001",
  "decision": "Record as a planning follow-up: WO-005-D001 admitted core -> i18n in the target's module boundary and conventions, but WS-001 house rule 15 still says core and i18n depend only on util and models. The rule changed through an order's recorded decision, as WS-001 allows, and its text now disagrees with the target. The order's Design already implied a core and i18n dependency that rule 15 did not admit.",
  "evidence": [
    "docs/workstreams/WS-001-dotln-angular.md rule 15: core and i18n on util and models",
    "<target> eslint.config.mjs gives sourceTag type:core onlyDependOnLibsWithTags type:util, type:models and type:i18n; docs/dev-reference/workspace/conventions.md lists core: util, models, i18n",
    "The order's Design puts provideDotlnI18n in i18n reading EnvironmentConfig and AppBasePathToken, which needs i18n -> core; WO-005-D001 moved the adapter into core instead"
  ],
  "rejected": [
    {"option": "Edit WS-001 from the verifier session", "reason": "WS-001 changes through a planning pass; the verifier records the drift."}
  ],
  "reopenWhen": "The next planning pass that edits WS-001.",
  "followup": "Next planning pass that edits WS-001: restate house rule 15 so core may depend on i18n, citing WO-005-D001, with i18n -> core still forbidden."
}
```

## Draft publish at verified

After recording the passing verification, the same session ran step 15's
draft publish, the first live observation of the kit's publication admission
(2026-10-19 planning pass, D6). This record holds what the order asks the
session to observe.

## WO-005-D015

```json
{
  "id": "WO-005-D015",
  "date": "2026-10-20",
  "dispatch": "resume: verify; step 15 draft publish by the session that recorded the passing verification",
  "decision": "Record the first live draft publish. The session that recorded VER-001 pass ran npm run worktree -- publish WO-005 --target-worktree --draft --branch feat/foundation-libraries with the order's title and the body file docs/evidence/WO-005/draft-pr.md. It pushed commit 5085137a5a4c5787ee44939a7f66113db63b1e76, whose tree 76cead3ad2a501eebc09b7bef926bce496fa655e is the verified gate tree, and opened draft pull request #3; the target's HEAD and index did not move. The hook admitted the command, and no host prompt was observed. Both of the operator's interim DotLn-Angular trust entries were present, so this episode observes only the hook's own decision, as the order anticipated. It meets the reopening condition of FUP-2479f6d32b2396a8 (the record of the draft publish); it does not meet those of FUP-98c85b750cb36bd4 (no prompt or denial) or FUP-c60b54b317ec79f7 (the entries were present).",
  "evidence": [
    "Command output: Pushed draft feat/foundation-libraries at 5085137a5a4c5787ee44939a7f66113db63b1e76 and opened draft pull request #3 on github.com/DylanBWood/DotLn-Angular; HEAD and the index are unchanged",
    "Session journal, PreToolUse for that Bash call at 2026-10-20T15:44:58.077Z: the permission hook classed the effect lifecycle.run and allowed it; the no-attribution unit allowed it; the concurrent-work-requires-worktrees unit allowed it under writer isolation. The push and gh pr create ran inside the helper, so the hook judged the helper form",
    "Host prompt: none observed. The command printed its first line in the same second as the hook's admission (15:44:58Z) and finished at 15:45:06Z; a manual approval would have left a visible gap. The session cannot see the operator's screen, so this rests on that timing",
    "Interim trust entries: the autoMode.environment list in the operator's user settings holds both 2026-10-18 entries, one naming the DotLn-Angular clone, its order worktrees and the launchpad checkouts as trusted, and one admitting routine git, npm and gh operations there, including pushing a wo-NNN order branch and opening or editing a draft pull request with gh. The draft pushed feat/foundation-libraries, not a wo-NNN branch. No soft-deny entry names DotLn-Angular",
    "gh pr view 3: draft, open, head feat/foundation-libraries at 5085137a5a4c5787ee44939a7f66113db63b1e76, base main, created 2026-10-20T15:45:04Z; the title workflow had already prefixed :sparkles:",
    "Before the publish: the outward lint passed the branch, title, commit message and body, the body profile check and the attribution check passed, and the kit's local-terms check found no match in the published files or package-lock.json"
  ],
  "rejected": [
    {"option": "Ask the operator before publishing", "reason": "The operator record and the 2026-10-18 planning pass's D5 name this session as the draft's actor, and the registration's operator grant covers the push and the pull request."},
    {"option": "Remove the interim trust entries first", "reason": "The 2026-10-19 planning pass's D6 keeps them for WO-005; their removal is the operator's choice and the next pass's question."}
  ],
  "reopenWhen": "The final review reads the draft's threads and workflow runs into docs/evidence/WO-005/preview-pr.json, the operator reports that the host did prompt, or the next planning pass rules on the interim entries."
}
```

## WO-005-D016

<!-- integration refs/dotln/checkpoint/WO-005/6 -->

```json
{
  "id": "WO-005-D016",
  "date": "2026-10-20",
  "dispatch": "resume: final review; npm run worktree -- integrate WO-005 --intake-backup <session-scratch archive>",
  "decision": "Record the integration as a no-op merge and carry every verified claim forward unchanged. The order worktree and main were both at a68138332c04e1e6286e8998714d6ed5fa888b42, so the merge introduced no byte, no authored conflict and no component-version collision; the target order records no release. The helper's regeneration steps ran (runtime, harness bundle and manifest, control projection, release preparation, this decision stub, decisions index, follow-up register, work-order index). Of the four affected checks it printed, publication:check, harness check and release check-surfaces --local ran and passed; npm test -- --review is consumed from the executor's passing complete row at code identity ea976e67e7a0c819bf24e9060e0a94acf2c17105a1cf807ea864a66cdba58f99, which the integration left unchanged (no code file changed; the records under docs/ are documents).",
  "evidence": [
    "refs/dotln/checkpoint/WO-005/6; named stash 77c2405b6ab1d931347da2974863ded66c12d21e (WO-005 integrate 2026-10-20) retained",
    "Bases: a68138332c04e1e6286e8998714d6ed5fa888b42 -> a68138332c04e1e6286e8998714d6ed5fa888b42; authored conflicts: none; git log main..wo-005 and wo-005..main both empty before the integration",
    "release preparation: WO-005: target order records no release; no files changed",
    "npm run publication:check: no editions declared; node scripts/harness.mjs check: 34 generated surfaces, local-terms list present; npm run release -- check-surfaces --local: exit 0",
    "The ignored intake (3 files) was archived to the session scratch with npm run backup:intake before the integration, as the helper requires"
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    },
    {
      "option": "Rerun npm test -- --review after a merge that moved no code byte",
      "reason": "The code identity, not the dispatch time, says what was tested; the executor's complete row stands at that identity."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance; return that finding through repair and fresh independent verification."
}
```

Integration date: 2026-10-20. Original base: `a68138332c04e1e6286e8998714d6ed5fa888b42`.
Fetched main: `a68138332c04e1e6286e8998714d6ed5fa888b42`. Checkpoint: `refs/dotln/checkpoint/WO-005/6`.
Named stash retained: `77c2405b6ab1d931347da2974863ded66c12d21e` (WO-005 integrate 2026-10-20).
Resolved projections: none.
Release preparation: WO-005: target order records no release; no files changed.
Carried-forward claims: every VER-001 criterion judgment and finding carries forward unchanged, because the merge introduced no byte; component-version collisions: none (a target order with no release and no launchpad component change); changed evidence inputs from the integration: none. The final-review repairs recorded in D017 to D019 change target bytes and are gated at the repaired tree, as [FINAL-001](../../final-reviews/WO-005/FINAL-001.md) records.
Authored conflicts observed: none.
Affected checks as run: `npm run publication:check` (no editions declared), `node scripts/harness.mjs check` (34 generated surfaces) and `npm run release -- check-surfaces --local` (exit 0) passed; `npm test -- --review` is consumed from the executor's complete row at the unchanged code identity.

## Final-review repairs and the operator's read of the draft

The operator dispatched `resume: final review` on 2026-10-20, paused it to read
draft pull request #3, raised three non-blocking findings and told the session
to continue. Their words are captured in ignored intake
`docs/intake/notes/wo005-final-review-steering-2026-10-20.md`, SHA-256
`e2a8222b359c03d17c0f6536ddef1c009c2d07e6218c90168640d9a4a32e8884`; the records below paraphrase them.
[FINAL-001](../../final-reviews/WO-005/FINAL-001.md) judges the order.

## WO-005-D017

```json
{
  "id": "WO-005-D017",
  "date": "2026-10-20",
  "dispatch": "resume: final review; Adjacent Repair of VER-001 F3 inside the order's declared surfaces",
  "decision": "Repair F3 in this review rather than ship an empty <title> to main. apps/dotln/src/index.html carries <title>DotLn</title> again, and tools/scripts/templates.mjs treats a template as what a component declares: its inline template or the file its templateUrl names; a standalone .html file such as the host page is no longer parsed. The translated runtime title the home component sets through translateSignal stays. A tooling test covers the discovery rule and the real host page, and the Transloco extraction test feeds the check a component file instead of a bare .html file, which is closer to the real corpus. The product name on the host page is not a translatable user string: the page renders before any script and no catalog key names the product; the operator may still rule otherwise.",
  "evidence": [
    "Before: git show 651d76ff:apps/dotln/src/index.html line 5 is <title>DotLn</title>; the draft commit 5085137a ships <title></title> (VER-001 F3, WO-005-D010)",
    "After: uncached npx nx run tools:lint exit 0 with checkTemplateLiterals 0 findings, checkTokenNames 0, checkSpecKits 0, i18n:check clean, six foundation compiler configurations, lint:fixtures and the tooling tests; node --test tools/foundation-checks.test.mjs 11 passed, 0 failed, including the new discovery test",
    "node scripts/target-gate.mjs WO-005 --review at the repaired tree: install, lint, test, format, build and e2e all PASS (25,839 ms); the e2e still asserts toHaveTitle('DotLn') after bootstrap",
    "npx nx format:check exit 0 after the edits",
    "The repair touches two declared surfaces (the app's host page and the check script the order delivers) and adds one test; no criterion changes its judgment"
  ],
  "rejected": [
    {
      "option": "Leave F3 boarded for the next repair",
      "reason": "An empty title is non-conforming HTML visible to validators, crawlers and script-less clients the moment the change merges; the fix is three files inside the declared surfaces and is gated at the new tree."
    },
    {
      "option": "Keep parsing the host page and exempt its <title> element",
      "reason": "That bakes one element name into the check; the discovery rule (a component's own template) is the simpler contract and matches the criterion's text, which names templates."
    },
    {
      "option": "Translate the host page title through the catalog",
      "reason": "The host page runs before Transloco loads; the product name is not a user string in the catalog and the runtime title is already translated."
    }
  ],
  "reopens": {
    "decisionId": "WO-005-D010",
    "observation": "This review edits apps/dotln/src/index.html and tools/scripts/templates.mjs, the condition D010 named for its next repair; the repair is made here."
  },
  "reopenWhen": "The operator rules that the host page's product name must go through i18n, a second app or a host page with more static text appears, or a component template is discovered by a route other than template or templateUrl."
}
```

## WO-005-D018

```json
{
  "id": "WO-005-D018",
  "date": "2026-10-20",
  "dispatch": "resume: final review; Adjacent Repair of VER-001 F5 inside the order's documentation deliverables",
  "decision": "Refresh the target's developer index and generator log in this review. docs/dev-reference/README.md now describes the app as it is (provideDotlnCore and provideDotlnI18n composition, root redirect and lazy home route), lists the three shared libraries, the environments, the catalogs and the check scripts in its table, links the foundation reference, names the optional local-environment route and lists the five added checks. docs/dev-reference/workspace/generator-log.md keeps its Installed generator help heading with both of its paragraphs plus the 2026-10-20 help read, records the six foundation commands and their results in one table in order, and keeps the wiring and cache section. WS-001's acceptance contract requires the target's write-backs to keep docs/dev-reference current, which these two files did not.",
  "evidence": [
    "Before: the index's table named app.config.ts as zoneless, router and HTTP providers and app.routes.ts as the eager placeholder home route, and said libraries join later (VER-001 F5, WO-005-D012)",
    "Before: the log's Foundation libraries and Scaffold help record headings sat between Installed generator help and its body; one command was a table row marked Scheduled and five were list items (D012)",
    "After: grep -c 'Scheduled' on the foundation section is 0; the six commands and their exit codes are rows of one table; npx nx format:check exit 0; the review gate passed at the final tree"
  ],
  "rejected": [
    {
      "option": "Leave the documentation to the next order",
      "reason": "A colleague cloning main after this merge reads an index that describes a workspace that no longer exists; the fix is prose inside the order's deliverables."
    }
  ],
  "reopens": {
    "decisionId": "WO-005-D012",
    "observation": "This review edits docs/dev-reference/README.md and the generator log, the condition D012 named; the repair is made here."
  },
  "reopenWhen": "A later order changes the app's bootstrap, routes or check list without updating the index, or adds a generator command outside the log's table."
}
```

## WO-005-D019

```json
{
  "id": "WO-005-D019",
  "date": "2026-10-20",
  "dispatch": "resume: final review; Adjacent Repair of VER-001 F6 in the cache finding",
  "decision": "Name the dev server's lost dependency prebundling beside the lost incremental disk cache in both copies of the cache finding: the target generator log and the launchpad's repository profile (docs/repositories/dotln-angular.md, Commands). The choice D003 made stands; its recorded cost is now whole, so the absolute-path alternative is weighed against both losses and the profile's reopening condition adds dev-server rebuild time.",
  "evidence": [
    "VER-001 F6 (WO-005-D013): every dev-server start printed that prebundling will not be used because caching is disabled; node_modules/@angular/build/src/builders/dev-server/options.js enables prebundling only while cacheOptions.enabled",
    "After: both texts carry the prebundling sentence; the target's review gate and the launchpad's npm run test:docs pass with them"
  ],
  "rejected": [
    {
      "option": "Reopen D003's choice",
      "reason": "Its reopening conditions have not occurred; the finding is the completeness of the recorded tradeoff, not the choice."
    }
  ],
  "reopens": {
    "decisionId": "WO-005-D013",
    "observation": "This review edits the cache finding, the condition D013 named; the sentence is added here."
  },
  "reopenWhen": "Angular offers a portable worktree-local cache path, or dev-server rebuild time becomes a concern."
}
```

## WO-005-D020

```json
{
  "id": "WO-005-D020",
  "date": "2026-10-20",
  "dispatch": "resume: final review; the operator's read of draft pull request #3, non-blocking finding 1 (ignored capture docs/intake/notes/wo005-final-review-steering-2026-10-20.md, SHA-256 e2a8222b359c03d17c0f6536ddef1c009c2d07e6218c90168640d9a4a32e8884)",
  "decision": "Record as a new-scope follow-up, not implemented in this order: the operator wants inline component templates laid out with a newline after the opening backtick and the closing backtick on its own line, so the markup reads as a block rather than hanging off the property. Probe in session scratch with the target's Prettier 3.9.10 and its .prettierrc: given that input, Prettier prints the template as a block (markup indented one level inside the backticks); given the current compact form it leaves it compact. Prettier therefore already preserves the wanted layout and only the rule that requires the two newlines is missing. The order's Design names no template layout, and the operator called the finding non-blocking.",
  "evidence": [
    "apps/dotln/src/app/home.ts (draft 5085137a): template: `<main> ... </main>` on the property line",
    "Scratch probe 2026-10-20: npx prettier --config .prettierrc on a copy of home.ts whose template opens with a newline printed template: ` / <main> / <h1>...</h1> / </main> / `; the same command on the committed home.ts printed it unchanged",
    "Prettier formats the embedded Angular template through its HTML printer and keeps a leading and trailing newline when the author wrote them (prettier 3.9.10, src/language-js/embed/html)"
  ],
  "rejected": [
    {
      "option": "Reformat home.ts and the i18n spec's component by hand in this review",
      "reason": "A convention that is not enforced drifts; the operator asked for a process, and the two templates are a one-line change once the rule exists."
    },
    {
      "option": "Set htmlWhitespaceSensitivity to ignore so Prettier always breaks the template",
      "reason": "That setting also changes how Prettier formats inline elements in every template and can alter rendered whitespace; a house rule that requires the two newlines is narrower."
    }
  ],
  "reopenWhen": "The next planning pass or repair that edits the lint rules or the Prettier configuration.",
  "followup": "Inline component templates open with a newline after the backtick and close with the backtick on its own line, enforced by a house check or ESLint rule on the template property of @Component (with a fixture under tools/lint-fixtures and a passing control), applied to apps/dotln/src/app/home.ts and the i18n spec's component; Prettier 3.9.10 then indents the markup itself. Record the rule in WS-001 house rule 12 and docs/ai-reference/foundation-rules.md through the planning route."
}
```

## WO-005-D021

```json
{
  "id": "WO-005-D021",
  "date": "2026-10-20",
  "dispatch": "resume: final review; the operator's read of draft pull request #3, non-blocking finding 2 (ignored capture docs/intake/notes/wo005-final-review-steering-2026-10-20.md, SHA-256 e2a8222b359c03d17c0f6536ddef1c009c2d07e6218c90168640d9a4a32e8884)",
  "decision": "Record as a new-scope follow-up: the operator wants imports in three sections separated by one blank line: Angular and third-party packages first, @dotln-angular aliases second, relative imports last with the furthest parent directory at the top. The target installs no import-ordering rule, so today the order is by hand and sections are not separated. This is an autofixable lint rule plus a fixture, outside the order's Design.",
  "evidence": [
    "package.json of the target (draft 5085137a): no eslint-plugin-import, eslint-plugin-simple-import-sort or eslint-plugin-perfectionist among devDependencies",
    "apps/dotln/src/app/app.config.ts orders @angular/core, @dotln-angular/core, ../environments/environment, ./app.routes with no blank lines; libs/shared/core/src/lib/core.spec.ts mixes alias imports and relative imports without sections"
  ],
  "rejected": [
    {
      "option": "Reorder the imports by hand in this review",
      "reason": "Without a rule the order drifts on the next edit; the operator asked for the sections to be organized, which is the rule's job."
    }
  ],
  "reopenWhen": "The next planning pass or repair that edits the lint rules.",
  "followup": "Add an autofixable import-order rule with exactly three groups separated by one blank line: packages (Angular and third-party), @dotln-angular/* aliases, then relative imports sorted with the furthest parent first (../../x before ../x before ./x) and alphabetized within a group; candidates are eslint-plugin-simple-import-sort with custom regex groups or eslint-plugin-import's import/order with pathGroups; apply the fix across apps and libs, add a fixture under tools/lint-fixtures that lint:fixtures must reject with a passing control, and record the chosen rule in WS-001 house rule 13 through the planning route."
}
```

## WO-005-D022

```json
{
  "id": "WO-005-D022",
  "date": "2026-10-20",
  "dispatch": "resume: final review; the operator's read of draft pull request #3, non-blocking finding 3 (ignored capture docs/intake/notes/wo005-final-review-steering-2026-10-20.md, SHA-256 e2a8222b359c03d17c0f6536ddef1c009c2d07e6218c90168640d9a4a32e8884)",
  "decision": "Record as a new-scope follow-up with the options the operator asked for: helper type aliases such as Predicate<T> must not be declared repeatedly; at minimum each library declares such an alias once, and a global type library is not required. Today no alias is duplicated: Predicate, Guard, FilteredRecord and Primitive are each declared once, in the two house adapters under libs/shared/utils. Options with their benefits: (a) one types.ts per library, exported through public_api.ts where the alias is public, plus a house check that lists an alias name declared in more than one file of libs/shared, so the minimum the operator named is enforced and each library stays self-contained; (b) utils as the single home for structural helpers, re-exported for every library, which gives one definition workspace-wide at the cost of every library depending on utils for a one-line type (house rule 15 already admits util everywhere, so no boundary changes); (c) accept duplicates, since TypeScript's structural typing makes identical aliases interchangeable, which costs reader confusion and is what the operator refused. Recommendation for the planning pass: (a) now, promoting an alias to utils when a second library needs it, with the check catching both duplicates within a library and across libs/shared.",
  "evidence": [
    "grep -rnE '^(export )?(type|interface) ' over libs and apps/dotln/src in the draft: Predicate, Guard and FilteredRecord in libs/shared/utils/src/lib/ramda/filter.ts; Primitive and NonEmptyString in libs/shared/utils/src/lib/ramda-adjunct/is-non-empty-string.ts; no name declared twice",
    "WS-001 house rule 3 reserves the models type for shared domain types, not structural helpers; rule 15 admits util for every type"
  ],
  "rejected": [
    {
      "option": "Create a types.ts in each library now",
      "reason": "No duplicate exists yet and the home of structural helpers is the planning pass's choice; adding files without a rule invents a convention the operator has not settled."
    },
    {
      "option": "A global type library that everything imports",
      "reason": "The operator does not require one, and it adds a dependency to every library for one-line aliases."
    }
  ],
  "reopenWhen": "The next planning pass that edits WS-001, or the first order that declares a helper alias a second time.",
  "followup": "Settle where helper type aliases live (per-library types.ts exported through public_api.ts, with promotion to utils when shared) and add a house check with a fixture that lists a type alias or interface name declared in more than one file under libs/shared, run by tools:lint; record the convention in WS-001 house rule 13 and docs/ai-reference/foundation-rules.md through the planning route."
}
```

## WO-005-D023

```json
{
  "id": "WO-005-D023",
  "date": "2026-10-20",
  "dispatch": "resume: final review; step 15's read of draft pull request #3 into docs/evidence/WO-005/preview-pr.json",
  "decision": "Record the draft's state and route each item. Pull request #3 (draft, head 5085137a, the verified tree) carries no review thread, no review and no comment; its two workflow runs, CI and Pull request title, completed with success at 15:47:03Z and 15:45:24Z. No automated reviewer ran on it: the repository's run list shows a Running Copilot Code Review run only on draft #1 of WO-004, none on #2 or #3, and whether such a reviewer runs is a repository setting the operator owns, so this is an observation for the handoff, not a finding of the order. The operator paused this review, read the draft, and raised three non-blocking findings, routed as new-scope follow-ups in D020 to D022. This meets D015's reopening condition.",
  "evidence": [
    "gh pr view 3 and a GraphQL read on 2026-10-20: reviewThreads 0, reviews 0, comments 0, state OPEN, isDraft true, mergeable MERGEABLE",
    "gh run list --branch feat/foundation-libraries: CI 39451306390 success; Pull request title 39451306581 success; both at head 5085137a",
    "gh run list for the repository: Running Copilot Code Review ran once, on wo-004 at 2026-10-18T14:19:30Z",
    "docs/evidence/WO-005/preview-pr.json holds the captured state and the routing table"
  ],
  "rejected": [
    {
      "option": "Request an automated review on #3 from this session",
      "reason": "The registration's operator grant covers the push, opening the pull request and resolving threads; adding a reviewer is a pull-request edit the order does not name, and the setting is the operator's."
    }
  ],
  "reopens": {
    "decisionId": "WO-005-D015",
    "observation": "The final review read the draft's threads and workflow runs into docs/evidence/WO-005/preview-pr.json, the condition D015 named."
  },
  "reopenWhen": "The operator reports a host prompt during the draft publish, or an automated review appears on #3 before it merges."
}
```

## WO-005-D024

```json
{
  "id": "WO-005-D024",
  "date": "2026-10-20",
  "dispatch": "resume: final review; disposition of the follow-up rows whose condition this order's records met",
  "decision": "Dispose the register rows this review's seam touched. FUP-2479f6d32b2396a8 (WO-004-D013) reopened when WO-005's draft publish was recorded (D015: the hook admitted the helper form, no host prompt was observed, both interim trust entries were present); the kit side of that row landed with starter v0.85.0, and what remains is whether the host honors the hook's admission without the entries, so the row is deferred again to that observation. FUP-98c85b750cb36bd4 and FUP-c60b54b317ec79f7 keep their conditions, which D015 did not meet. The rows for F3, F5 and F6 (FUP-b1a9d24ace157463, FUP-f1894f519161c905, FUP-06298bb21fc18859) are settled by D017 to D019. The rows for F1, F2, F4 and F7, the executor's D006 row and the planning rows that only match WO-005 by name stay as they are.",
  "evidence": [
    "npm run plan -- followups --touching on 2026-10-20: 14 of 18 pending rows matched this change or WO-005 by text",
    "WO-005-D015 evidence: hook decision allowed, no prompt observed, both entries present, branch feat/foundation-libraries",
    "The dispositions are applied with npm run plan -- followups --apply and recorded in docs/planning/followups.json",
    "WO-004's decisions file now lives in the target (docs/dotln/evidence/WO-004/decisions.md, moved by its records commit), so WO-004-D013 cannot be reopened by a structured reference from this launchpad; its row is disposed through the register with this decision as the reason"
  ],
  "rejected": [
    {
      "option": "Settle FUP-2479f6d32b2396a8 as done",
      "reason": "Its qualification (the host honoring the admission with the entries absent) has not been observed; D6 of the 2026-10-19 pass schedules that for WO-006's draft."
    },
    {
      "option": "Dispose rows that only match WO-005 by name",
      "reason": "A textual match is a pointer, never a verdict; their seams were not opened by this change."
    }
  ],
  "reopenWhen": "WO-006's draft publish runs with the interim entries absent, or the next planning pass rules on the entries."
}
```
