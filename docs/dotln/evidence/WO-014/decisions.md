# WO-014 decisions

## WO-014-D001

```json
{
  "id": "WO-014-D001",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Fast-forward the clean target worktree from the provisional activation base to the merged predecessor on origin/main before implementation. Preserve the recorded activation base.",
  "evidence": [
    "Canonical status selects WO-014, active, with the hard edge on WO-013 met.",
    "The target initially contains no tracked files at bc9133e932a00d33c15bc5289d683b8078f51ee4. git fetch --no-tags origin succeeds and git merge --ff-only origin/main reaches 8318487 with the predecessor's app.",
    "The amended order explicitly allows its provisional base under the starter's merge-base publication rule; its specific clause supersedes the older WO-005 base-equality step."
  ],
  "rejected": [
    { "option": "Implement on the empty activation tree", "reason": "The order extends the merged app and its menu." },
    { "option": "Stop for a planning base amendment", "reason": "The current order explicitly makes that amendment optional." }
  ],
  "reopenWhen": "The fetched predecessor is not an ancestor or the target worktree contains conflicting local work."
}
```

## WO-014-D002

```json
{
  "id": "WO-014-D002",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Apply the operator's live direction raising the subagent cap to 40 for this work order. Plan twelve catalog workers and two independent implementation reviewers initially; additional bounded workers are authorized when useful. Keep the executor as the sole writer in each selected repository worktree.",
  "evidence": [
    "The operator explicitly increased this work order's cap to 40 and authorized additional agents in this session on 2026-10-25.",
    "Entry usage reported zero observed subagents, cap 20, with an unknown uncounted remainder. docs/control/budgets.json now records 40.",
    "Workers use codex-spawn-agent, gpt-6.1-sol, max, with no inherited conversation; classifiers write only their separate session scratch checkpoints."
  ],
  "rejected": [
    { "option": "Consume all forty slots", "reason": "The cap is available capacity, not a required spend." },
    { "option": "Use concurrent coding writers in the target", "reason": "The one-writer worktree rule remains in force." }
  ],
  "reopenWhen": "The operator changes the allocation. The next work order should restore the prior cap of 20 unless separately authorized."
}
```

## WO-014-D003

```json
{
  "id": "WO-014-D003",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Keep the closed transform set and require observable scene behavior for typed rows. Preserve uncertain candidates with an untyped reason and non-executable concepts without faces; never fill a per-work quota by forcing a transform. Preserve line-based ids and hash each source before classification.",
  "evidence": [
    "The four cited design-file digests match their pinned values.",
    "The eleven selected JSONL maps total 3,463 rows at read time.",
    "The work order names the allow-list, observability check and short-work disposition."
  ],
  "rejected": [
    { "option": "Copy map definitions or hooks", "reason": "Only ids, short titles and generic terms may enter committed catalog data." },
    { "option": "Broaden transform kinds to satisfy the quota", "reason": "The closed enum and scene-engine boundary are explicit." },
    { "option": "No catalog change", "reason": "It leaves the dispatched browser and classification objective undelivered." }
  ],
  "reopenWhen": "Sampling finds an invalid mapping, a source digest changes, or a separately recorded decision extends the transform contract."
}
```

## WO-014-D004

```json
{
  "id": "WO-014-D004",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Give the catalog feature the required Nx name tools, renaming the existing command-only utility project to workspace-tools. Generate catalog and tools with the already demonstrated unitTestRunner=none workaround and apply the established AnalogJS wiring, without changing dependencies. Use the existing event/store/persistence infrastructure behind the catalog loader seam, with paged rendering and translated not-found handling in the shell.",
  "evidence": [
    "The existing tools/project.json owned the tools name; the order requires npx nx test tools for the feature. nx show projects lists catalog, tools and workspace-tools after generation.",
    "The predecessor generator log records the installed Nx 23.3.0 Vitest 5 peer mismatch. Official Nx generator documentation was fetched through Context7; all four current generator commands exited 0.",
    "The board implementation and state rules require explicit providers, event trinity, shared persisted state and presentational composites. The new template, kit, component and event checks pass.",
    "The router fallback is tested at app composition because core cannot depend on the shell or another feature. Core separately tests the canonical Tools/Catalog route builder."
  ],
  "rejected": [
    {
      "option": "Name the feature tools-feature",
      "reason": "It would violate the required public project name and test commands."
    },
    {
      "option": "Downgrade the workspace test dependencies",
      "reason": "The installed Angular/AnalogJS/MSW stack already uses Vitest 5 and has an established generation route."
    },
    {
      "option": "Put catalog JSON imports and storage in the feature",
      "reason": "It would couple the feature to the data transport and bypass the shared state contract."
    }
  ],
  "reopenWhen": "Nx supports the installed test version directly, a measured catalog rendering issue warrants another paging strategy, or the mining API replaces bundled chunks."
}
```

## WO-014-D005

```json
{
  "id": "WO-014-D005",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Render 50 catalog rows per page, retaining full-dataset filters and selected details. Keep unbounded rendering as the measured rejected alternative.",
  "evidence": [
    "render-comparison.json records five synthetic Chromium DOM insertion/layout samples per arm with identical representative row markup: 50 rows, 550 elements, median 1.20 ms; 3463 rows, 38093 elements, median 87.00 ms. This is not an Angular end-to-end latency claim.",
    "The pagination path preserves access to every tool and supports filtering across all data. The browser regression checks paging, selection, persistence, accessibility and narrow layouts."
  ],
  "rejected": [
    {
      "option": "Render every row at once (NoOp for list size)",
      "reason": "It adds 37543 elements in the bounded comparison and thousands of focusable controls."
    },
    {
      "option": "Virtualize the list",
      "reason": "The simple paged list avoids another scrolling/focus behavior dependency while retaining full catalog access."
    }
  ],
  "reopenWhen": "Measured real-app paging or navigation becomes inconvenient, or a substantially larger catalog requires another approach."
}
```


## WO-014-D006

```json
{
  "id": "WO-014-D006",
  "date": "2026-10-25",
  "dispatch": "resume: next",
  "decision": "Apply the operator-approved criterion 3 amendment: up to three typed examples per work, with explicit shortfalls and a primary scene recommendation. Document conceptual applications separately from execution compatibility. A concept is not used up by its first application; system traps and anti-patterns can diagnose app, agent, process and process-improvement behavior.",
  "evidence": [
    "Both sampling checkers admitted Team Topologies' two typed rows; forcing a third would contradict the work order's observability rule.",
    "The operator explicitly approved the filed amendment after reviewing its proposed wording.",
    "The operator clarified the value of metaphors using bounded cleanup, domain blindness, antifragility across networks and agents, and Meadows' system traps, and allowed exhaustive cross-area mining to be a targeted second pass.",
    "A bounded metaphor pass revisits GEB, RxJS core and Team Topologies with their original classifiers. Other batches retain their initial classification coverage; no exhaustive cross-area review is claimed.",
    "The target's concept-mapping.md and catalog-rules.md preserve the method, diagnostic discipline, reporting expectations and targeted follow-up. The RxJS feedback model is a documented design exercise, not an implemented mining engine."
  ],
  "rejected": [
    { "option": "Invent a third executable transform", "reason": "It would make the data less honest to satisfy a quota." },
    { "option": "Treat untyped or background as unimportant", "reason": "Those statuses describe representation and do not measure conceptual usefulness." },
    { "option": "Exhaustively remap every concept in this delivery", "reason": "The operator accepts a targeted follow-up; this order establishes the method and bounded examples." }
  ],
  "reopenWhen": "Further evidence admits a new typed example, the operator extends the transform contract, or a later mapping pass requires several applications per concept."
}
```


## WO-014-D007

```json
{
  "id": "WO-014-D007",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Dispose every catalog sampling and critic finding through the original classifier, retaining the closed transform contract and the original reports.",
  "evidence": [
    "Initial checker samples found rxp:148 forced a finite buffer onto an unbounded-buffer anti-pattern and geb2:201 lacked an established return edge; both are now untyped.",
    "Both final 40-row typed samples pass after the bounded metaphor pass. The critic then reviewed 120 sampled rows plus one explicit concern and found four issues across five rows.",
    "Critic corrections remove mergeWith concurrency-cap queueing from rxc:203, omit the unsupported geb1:1 analogy, distinguish the candidate observations for geb2:25 and geb2:108, and qualify rxp:140 to normal completion. critic-recheck.json resolves all four findings.",
    "The installed RxJS mergeWith source confirms that it accepts sources without a concurrency parameter. Catalog validation and synthesis arithmetic pass after the five-row correction."
  ],
  "rejected": [
    {
      "option": "Treat the sample as proof of every mapping",
      "reason": "The samples provide bounded independent scrutiny; book verification and exhaustive analog review remain outside this order."
    },
    {
      "option": "Replace a failed transform with its nearest enum kind",
      "reason": "The order requires an untyped reason when the proposed behavior is unsupported."
    }
  ],
  "reopenWhen": "Further review or execution evidence identifies another unsupported mapping."
}
```


## WO-014-D008

```json
{
  "id": "WO-014-D008",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Fix both independent design-review findings: move focus to selected tool details and provide a return to the selected row; report safe, actionable catalog validation locations.",
  "evidence": [
    "The design improver, given only the order and diff, found details could update outside the viewport and validation errors discarded row locations.",
    "The browser regression selects a lower row on a later page, checks focused visible details, and returns to the selected row.",
    "The tooling regression verifies batch, safe JSON pointer and failure category while withholding rejected values, unknown property names and private paths."
  ],
  "rejected": [
    {
      "option": "Leave the details panel update silent",
      "reason": "A keyboard user selecting a lower row cannot see the result."
    },
    {
      "option": "Print raw Ajv errors or rejected values",
      "reason": "Diagnostics must not disclose disallowed source content."
    }
  ],
  "reopenWhen": "A new layout or validation shape makes focus navigation or sanitized diagnostics inadequate."
}
```


## WO-014-D009

```json
{
  "id": "WO-014-D009",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Repair the encountered shared-menu placement defect within the authorized catalog work: bound menu height, scroll internally and provide above/below and horizontal placement fallbacks.",
  "evidence": [
    "The first complete browser run passed 70 tests and failed the catalog Tools-home/filter test because channel.policy was outside the viewport. The trace and screenshot showed an unbounded menu with only a below-trigger placement.",
    "Adjacent queue item adjacent-0001 records the cause, paths, intended repair, announcement and actor-attested check-in.",
    "The focused previously failing browser case passes after the repair. The full preflight and target gates provide the final regression disposition."
  ],
  "rejected": [
    {
      "option": "Force the test click or reduce the filter vocabulary",
      "reason": "Either hides a real user interaction failure."
    },
    {
      "option": "Defer the shared wrapper defect",
      "reason": "The authorized catalog browser depends on reachable filter options and the repair is bounded."
    }
  ],
  "reopenWhen": "Viewport, zoom or longer option labels reveal another unreachable menu item."
}
```


## WO-014-D010

```json
{
  "id": "WO-014-D010",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Preserve the operator clarification as reusable concept-mapping guidance and a planning handoff: explore ideas through understandable representations, retain transferable relationships and evidence, and consider graduation into primary skills, supports and compositions that may compile to common IR.",
  "evidence": [
    "The operator explicitly described cross-area metaphors, diagnostic system traps, repeated RxJS modelling of arbitrary phenomena, UIFA engineering, representational isomorphism, musical variations and feedback into platform behavior.",
    "The operator pointed to core product documents 13-uifa-roles.md and 10-ir-compatibility.md, then clarified that primary skills and supports may be the intended authoring layer above IR.",
    "The target concept-mapping.md and planning-handoff.md distinguish current delivery from later exploration, composition, promotion and repository ownership decisions."
  ],
  "rejected": [
    {
      "option": "Treat catalog status as a usefulness score",
      "reason": "Executable compatibility and conceptual value answer different questions."
    },
    {
      "option": "Author every discovery directly as new IR",
      "reason": "The operator identifies a higher-level behavior layer and existing compositions may suffice."
    },
    {
      "option": "Implement an interchange contract or publish core proposals now",
      "reason": "The clarification asks for durable understanding and later planning, not a new integration in WO-014."
    }
  ],
  "followup": "Plan a targeted cross-area mapping pass and trace one discovery through app exploration, a primary skill or support, composition and any common IR target; settle artifact ownership and explain which repository should receive each kind of idea.",
  "reopenWhen": "A later planning pass has representative artifacts and current core contracts to assign the boundary."
}
```


## WO-014-D011

```json
{
  "id": "WO-014-D011",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Fail VER-001 on criterion 7. The production initial bundle grows from 495.40 kB to 530.37 kB raw (127.10 kB to 135.06 kB estimated transfer) and exceeds the declared 500 kB initial budget. The overrun is avoidable: the menu wrapper, the Angular Aria menu and further CDK overlay code that only the lazy Tools route uses now ship in a shared chunk that main imports statically, so every first screen pays for them. The failure rests on that avoidable inefficiency, not on the threshold itself.",
  "evidence": [
    "Verifier's uncached npx nx build dotln --configuration=production on the subject tree 42956188: exit 0, Initial total 530.37 kB, warning 'bundle initial exceeded maximum budget. Budget 500.00 kB was not met by 30.37 kB'. apps/dotln/project.json is unchanged: production initial maximumWarning 500kb, maximumError 1mb.",
    "The same build of the base tree 8318487, extracted to session scratch with the target's node_modules: exit 0, Initial total 495.40 kB, no budget warning.",
    "esbuild metafiles of both builds: of the initial bytes, @angular/aria grows by 28,125 (the _menu, menu, _list-typeahead and _list chunks are new), @angular/cdk by 10,454 and libs/shared/ui by 3,696 (wrappers/menu/menu.ts is new). The not-found page adds 919 and the catalog events 316. menu.ts sits in chunk-Db_xeXax.js, which main-K4N4NLK3.js imports statically; the lazy Tools entry (18.44 kB) imports the same chunk.",
    "At the base no app code used DotlnMenu; catalog-page.ts is its first consumer and imports it through the @dotln-angular/ui barrel, which the shell also imports.",
    "WS-001 house rule 1 ranks browser rendering speed above house preference. WO-006-D014's follow-up keeps code the first screen does not need, such as the CDK overlay, out of the initial bundle, and measures before and after.",
    "The operator, during this verification on 2026-10-25 (paraphrased): they support a failure grounded in not being as efficient as the work could be, and want such inefficiency caught early and often. They then clarified that an overrun of a budget is no failure when it is the most efficient arrangement, and that a rule forcing the number regardless would be lose-lose."
  ],
  "rejected": [
    {
      "option": "Judge criterion 7 met because the build exits 0 below the 1 MB error threshold",
      "reason": "The criterion asks for the build within the declared budgets, and the measured overrun is code the first screen does not use."
    },
    {
      "option": "Require the initial total under 500 kB at any cost",
      "reason": "The operator rejects a budget that forces a less efficient arrangement. The rule targets avoidable initial code; the threshold is the signal."
    },
    {
      "option": "Raise the budget",
      "reason": "It hides the regression rather than removing it."
    }
  ],
  "followup": "Repair rule: code that only a lazy route uses stays out of the initial chunk. Record the production initial total and its per-package attribution before and after the repair, against the 495.40 kB base, keep the declared budgets unchanged, and make no change that loads the catalog or its filters less efficiently just to meet the number. If the most efficient arrangement still exceeds a declared threshold, record that measurement and its reason in a decision and route criterion 7's wording to the operator; do not force it.",
  "reopenWhen": "A repaired build's initial attribution still carries Tools-only code, or the operator rules on criterion 7's wording."
}
```


## WO-014-D012

```json
{
  "id": "WO-014-D012",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Board catching initial-bundle growth at preflight, as the operator directed during this verification (paraphrased: catch inefficiency early and often), without turning budget warnings into automatic failures.",
  "evidence": [
    "The executor's preflight and both target gates saw the budget warning, which the evidence README disclosed, and the regression first surfaced as a failure at verification.",
    "The operator rejected a rule that fails an overrun that is the most efficient arrangement."
  ],
  "rejected": [
    {
      "option": "Make the gate fail on any budget warning",
      "reason": "It fails a justified overrun, the lose-lose outcome the operator named."
    }
  ],
  "followup": "Planning: when a production build's initial total grows or reports a budget warning, the executor's preflight records per-package attribution against the base and either removes the avoidable code or records why the arrangement is the most efficient, before implementation-ready.",
  "reopenWhen": "The next planning pass reads this row, or a later order's initial bundle grows without attribution."
}
```


## WO-014-D013

```json
{
  "id": "WO-014-D013",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Board the launchpad subagent cap. docs/control/budgets.json now reads subagentCap 40 for this order (D002), and nothing restores 20 when the order merges.",
  "evidence": [
    "git diff docs/control/budgets.json changes subagentCap from 20 to 40. D002 records the operator's raise for this work order and says the next order should restore 20 unless separately authorized.",
    "The verifier's usage readback reports cap 40 for this session."
  ],
  "rejected": [
    {
      "option": "Restore 20 during verification",
      "reason": "The operator's raise covers this order, including its fix and final review, and the verifier does not edit control files."
    }
  ],
  "followup": "Restore subagentCap to 20 in the records the final review publishes, or at the next order's activation, unless the operator authorizes a higher cap again.",
  "reopenWhen": "WO-014 closes, or another order activates while the cap reads 40."
}
```


## WO-014-D014

```json
{
  "id": "WO-014-D014",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Board two maintainability items in the declared surfaces; neither breaks a criterion. First, catalog-page.ts line 55 repeats the six work slugs, which the loader's chunk map already lists, so the Art of War work needs a feature edit beside its loader entry. Second, the change rewrites three unrelated en.json values from literal characters to \\u escapes, with identical parsed text.",
  "evidence": [
    "libs/features/tools/src/lib/containers/catalog-page/catalog-page.ts:55 filters the work options with a literal six-slug array; libs/shared/catalog/src/lib/catalog-loader.ts declares the same six works as chunk keys.",
    "git diff apps/dotln/public/i18n/en.json changes shell.recordedOn, board.sourceCounts and machinery.arriving.description escapes only.",
    "tools/scripts/catalog/check-catalog.mjs:251 and :260 also fix 3463 rows and six works, which matches the order's rule that a later map lives under its own check."
  ],
  "rejected": [
    {
      "option": "Treat either item as blocking",
      "reason": "Neither breaks a criterion or behavior main had."
    }
  ],
  "followup": "In the next repair of the declared surfaces or in WO-018: derive the work filter's options from the loader or the summary instead of a literal list, and restore the literal characters in the three en.json values.",
  "reopenWhen": "WO-018 adds a work to the catalog, or the next repair edits catalog-page.ts or en.json."
}
```


## WO-014-D015

```json
{
  "id": "WO-014-D015",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Report two reopening conditions of planning receipt 2026-10-25-planning-8cf1b240128e3b80-010 that the shipped data meets, and board one launchpad screening gap. Criteria 2 and 4 stay met as written.",
  "evidence": [
    "Receipt known issue on criterion 4: 1,914 of the 3,463 rows (55.3%) are untyped, above half. The commonest reason covers 38 untyped rows, under a tenth, and kind distinguishes sceneElement (360) and metric (58), so the other two parts of that condition do not hold.",
    "Receipt known issue on criterion 2: the verifier's overlap probe compared every committed string with the run's definition, related, dotlnHooks, chapter and section fields. Faces, reasons, analog clauses and observables share no run of six or more words with any of them. One title, rxc:403, equals its own row's concept name (66 characters, admitted as a short title) and shares an eight-word run with the definition of rxc:80. No title exceeds 80 characters.",
    "Screening gap: the launchpad's private local-terms check over the target's changed and new text files reports one review-mode match, at libs/shared/catalog/src/data/tools-aifg-b.json:5831 (the title of aifg-b:3). The verifier read it in context: a generic game-AI concept title equal to its row's concept name in the public book's map. No repair is needed. The target publish lints commit messages, the title and the body only, so the contents of target files are not screened against the list."
  ],
  "rejected": [
    {
      "option": "Fail criterion 2 or 4 on the receipt conditions",
      "reason": "Both criteria hold as written; the receipt routes these conditions to planning."
    }
  ],
  "followup": "Planning: weigh the receipt's untyped-share and title-overlap conditions for WO-014's successors. Core or kit: screen a registered target's changed file contents against the private local-terms list before a target publish, reporting by file and line.",
  "reopenWhen": "The next planning pass reads receipt 010's WO-014 conditions, or a target publish carries a refuse-mode term in file contents."
}
```


## WO-014-D016

```json
{
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator directions during repair",
  "id": "WO-014-D016",
  "decision": "Extend the repair with evidence-led performance calibration guidance and a repeatable local sampler, modest reusable UI/functional composition, curated typed Ramda/Ramda Adjunct exports, and durable operator guidance across this order. Preserve all criteria and unchanged budgets. Routine budget diagnosis and justified maintenance belong to the implementing session; the earlier proposed return of every efficient overrun to the operator is superseded by this explicit direction.",
  "evidence": [
    "Ignored performance capture SHA-256 5dcfe8cebc348d7767752e7287535cbe1163befc7d7cd66923a51fd665e53d65; composition capture SHA-256 0458b3b36fbf7465febe3385ef28cd3e0bc9a7870b7f239241e6bedb9f82b6c1; durable-guidance capture SHA-256 a75c9bf1e5d774821f514c076e061051294d698e8aa8f5ec470eb6e86e77af1a.",
    "The operator requested an expert on Google's Core Web Vitals, reuse of these directions, and a planning/core-request route if fork-specific interactions are absent. Their latest clarification distinguishes useful Ramda composition from native-operation spelling changes."
  ],
  "rejected": [
    {
      "option": "Apply a numerical refactoring quota or rewrite every native collection operation",
      "reason": "The requested improvement is modest, useful composition."
    },
    {
      "option": "Amend criterion 7 or raise its budgets to pass",
      "reason": "The measured avoidable cost can be removed under the existing criterion."
    }
  ],
  "reopenWhen": "A proposed change alters scope, authority or a judged criterion rather than implementing these bounded directions."
}
```


## WO-014-D017

```json
{
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator directions during repair",
  "id": "WO-014-D017",
  "decision": "Keep menu code and overlay providers in a dedicated UI menu entry point imported statically by the lazy Tools route. Remove the eager root export and global OverlayModule import; retain shared A11yModule behavior. Automatically reject route-only inputs in the initial graph and an extra dynamic menu request after Tools loads.",
  "evidence": [
    "bundle-comparison.json records equivalent production builds of the 495404-byte base, 530371-byte failed candidate, ineffective metadata experiment, secondary-entry-only arm and route-scoped-provider arm.",
    "The route-scoped arm is 452497 bytes before curated utility exports; the curated candidate is 376903 bytes. All eight catalog chunks remain lazy.",
    "tools/bundle.test.mjs includes transitive menu and data leaks, missing metadata and an additional dynamic menu edge. The browser regression checks Board has no menu code and filter opening adds no script request."
  ],
  "rejected": [
    {
      "option": "NoOp or raise the budget",
      "reason": "Both preserve the avoidable dependency leak."
    },
    {
      "option": "Only add sideEffects metadata",
      "reason": "The bounded experiment did not remove the cost and was reverted."
    },
    {
      "option": "Load the menu dynamically on first opening",
      "reason": "That introduces an avoidable interaction waterfall."
    },
    {
      "option": "Remove all shared accessibility providers",
      "reason": "A11yModule has shared high-contrast behavior outside this route-only defect."
    }
  ],
  "reopenWhen": "A first screen genuinely needs this behavior or matched measurements establish a better placement."
}
```


## WO-014-D018

```json
{
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator directions during repair",
  "id": "WO-014-D018",
  "decision": "Curate the R/RA surface and retain runtime/compiler contracts; extract the repeated controlled filter menu into a small composite through the lazy menu entry; compose firstThree from reusable curried selectors. Keep isolated option derivation and the combined one-pass catalog predicate native. Derive work options from the full loaded catalog and restore unrelated literal translation characters.",
  "evidence": [
    "With menu placement held constant, narrowing the upstream namespace exports reduces initial raw output from 452497 to 376903 bytes, a 75594-byte difference.",
    "Production exports are R.filter/map/pipe and RA.isNonEmptyString. Test-only placeholders import upstream directly. Public-api tests assert runtime keys and type contracts.",
    "The bounded utils/catalog/tools/ui run passed 54 tests in 23 files. The readonly selector, later-work option and controlled-composite regressions are included; compiler and full target results are recorded in repair evidence.",
    "The operator recognized firstThree's R.pipe as a useful composition case while rejecting mechanical map/filter replacements."
  ],
  "rejected": [
    {
      "option": "Keep wildcard re-exports and assume complete tree shaking",
      "reason": "The equivalent build comparison observed a material difference."
    },
    {
      "option": "Chain five filters on each UI update",
      "reason": "The existing combined predicate avoids intermediate arrays and is clear."
    }
  ],
  "reopenWhen": "A new application use needs an export, upstream types change, or the shared composite/selector no longer has a useful consumer."
}
```


## WO-014-D019

```json
{
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator directions during repair",
  "id": "WO-014-D019",
  "decision": "Preserve all reusable instruction categories in docs/operator/implementation-guidance.md, linked from the mandatory operator record, and concrete performance/type duties in target references. Apply existing Tinkerer duties now; route any missing fork interaction mechanism through planning and a paste-ready core request.",
  "evidence": [
    "The operator record synthesizes earlier executor/verifier decisions and the three direction captures, distinguishing permanent preferences from the one-order cap and accepted criterion amendment.",
    "One authorized read-only worker, codex-spawn-agent gpt-6.1-sol at max, verified current Google/Chrome primary sources. No descendants or repository edits. The performance guide separates field CWV, local diagnostics and project calibration assumptions.",
    "The installed ContributorBuildOverlay declaration/implementation exposes identity, authority narrowing and grants, not a custom interaction field. Product 08's implementation overlay is about publication. This bounded inspection is not proof that no mechanism exists elsewhere.",
    "CI and preflight run bundle checks; perf:sample retains raw samples, profiles, hashes and resource timings. No field pass is claimed."
  ],
  "rejected": [
    {
      "option": "Keep directions only in chat",
      "reason": "The operator explicitly requested durable future reuse."
    },
    {
      "option": "Edit generated kit code to add local behavior now",
      "reason": "The operator permits a planning/core-update route, and the extension contract is not established."
    }
  ],
  "followup": "Next planning: map reusable operator guidance to existing supports or supported instance-owned interactions. Inspect the extension mechanism beyond the Contributor interface. If missing, provide the operator the paste-ready DotLn platform request in planning-handoff.md, with a local interaction contract that survives regeneration/upgrades and tests ownership, compatibility and authority boundaries.",
  "reopenWhen": "The next planning pass consumes the guidance or a kit release changes local interaction authoring."
}
```


## WO-014-D020

```json
{
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator directions during repair",
  "id": "WO-014-D020",
  "decision": "Retain observed cold-load layout shifts as a concrete follow-up, without claiming a Core Web Vitals pass. Keep local timings diagnostic. Repair of shared translation readiness and board loading geometry requires a focused change with visual and failure-state coverage beyond the catalog/menu repair.",
  "evidence": [
    "Two pilot batches pass all six scripted journey/profile combinations. Layout-shift attribution identifies navigation/main/brand/footer as translated text arrives, plus board loading geometry and footer movement as data replaces the skeleton.",
    "The second pilot reports constrained direct Catalog CLS 0.158079 and Board 0.618220; warm Catalog is zero. These exceed the local 0.1 diagnostic goal on cold paths, not an observed population CWV score.",
    "Shell translation pipes initially produce empty line boxes; header/navigation/footer grow approximately 14/22/18 pixels. Board tabs/content produce a further loading transition. The sampler retains elements and rectangles.",
    "Delaying bootstrap, preloading translations and reserving geometry have different startup, loading/error and shared-layout consequences. A broad unmeasured change would go beyond the modest repair requested."
  ],
  "rejected": [
    {
      "option": "Call all performance green because scripted assertions pass",
      "reason": "Timing observations remain distinct and expose the cold-load shift."
    },
    {
      "option": "Hardcode blank regions or hide the app until data loads",
      "reason": "That could improve a metric while degrading actual startup or error behavior."
    }
  ],
  "followup": "Plan a shared loading-layout repair: reserve translated shell line boxes and stable board loading geometry, compare with justified primary-language preloading, and retain cold Board/direct Catalog CLS traces, useful-ready timing, unavailable/error states and visual baselines under both sampler profiles before selecting the strategy.",
  "reopenWhen": "The next planning pass schedules this measured defect or an order changes shell translation readiness, loading placeholders or footer geometry."
}
```


## WO-014-D021

```json
{
  "id": "WO-014-D021",
  "date": "2026-10-26",
  "dispatch": "resume: fix; operator predicate correction",
  "decision": "Restore RA.isNonEmptyString for persisted-filter validation. The earlier native collection clarification was misread as a reason to remove a shared validation predicate. Keep native option mapping where useful and use established Ramda Adjunct predicates for validation; these are separate decisions.",
  "evidence": [
    "Ignored correction SHA-256 6d5ea0813d03a2e946b31f5cd12640fb33d27372ce4540d52af315b7e0e42e78.",
    "The house isNonEmptyString adapter preserves upstream currying: unknown placeholder input can return a function. Compare its result with true, then test membership without a redundant typeof or length check.",
    "filters.spec.ts covers valid members, empty/whitespace strings, boxed strings, numbers, objects and a placeholder-shaped value; the runtime and compiler passes validate the public boundary.",
    "The mandatory operator record and target foundation rules now state the predicate preference independently of collection composition."
  ],
  "rejected": [
    {
      "option": "Keep manual string validation under the collection-composition clarification",
      "reason": "The operator explicitly corrected that category error."
    },
    {
      "option": "Treat a truthy curried result as string validation",
      "reason": "That would admit a placeholder function as evidence of a string."
    }
  ],
  "reopenWhen": "The validation contract or upstream predicate semantics change."
}
```


## WO-014-D022

```json
{
  "id": "WO-014-D022",
  "date": "2026-10-26",
  "dispatch": "resume: fix; Adjacent Repair",
  "decision": "Repair stationary-pointer hover stealing keyboard focus when a long menu scrolls. Keep Aria's navigation/selection implementation and gate only owned-menu mouseover during keyboard input, using actual pointer coordinates and pointerdown to preserve deliberate pointer interactions. Remove listeners when the wrapper is destroyed.",
  "evidence": [
    "The constrained warm sampler failed repeatedly: expected a later arrow-key item while actual focus and :hover both named an earlier item. A retained diagnostic expected squad.form and reported formation.fixed as both active and hovered.",
    "The existing read-only performance researcher independently confirmed MenuPattern.onMouseOver immediately calls listBehavior.goto with focusElement true for a trigger-root menu. No public Menu input disables this behavior; expansionDelay only concerns submenu expansion.",
    "Pointer Events specifies boundary events caused by layout changes. Compatibility mouseover can precede pointermove; the guard therefore allows a first hover with displaced coordinates while suppressing the stationary one. Same-coordinate pointermove does not switch modes.",
    "Adjacent queue item adjacent-0004 was announced and started after the catalog follow-up's passing unit/i18n/uncached browser checks and an actor-attested steering check-in.",
    "The browser regression exercises stationary-pointer End/Home/arrows at 4x CPU, exact selection, pointer hover/click, Escape and touch tap. The production sampler exercises repeated warm navigation and all filters without parking the pointer away; final results are recorded in repair.md."
  ],
  "rejected": [
    {
      "option": "Move the sampler pointer away or skip keyboard coverage",
      "reason": "That hides an observed production interaction defect."
    },
    {
      "option": "Change expansionDelay or remove menu scrolling",
      "reason": "The former does not control hover focus; the latter breaks narrow-viewport reachability."
    },
    {
      "option": "Restore DOM focus repeatedly after hover",
      "reason": "That races Aria's active-item state, which programmatic focus alone does not update."
    },
    {
      "option": "Suppress all hover permanently or intercept clicks",
      "reason": "That unnecessarily changes valid pointer/touch behavior."
    }
  ],
  "reopenWhen": "Upstream provides a supported fix or input-mode option, or browser evidence shows a legitimate input transition rejected by the wrapper."
}
```


## WO-014-D023

```json
{
  "id": "WO-014-D023",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Board a scope gap in the new bundle check; it breaks no criterion. check-bundle.mjs proves the repair's placement by refusing three source sets in the initial graph: menu.ts, libs/shared/catalog and libs/features/tools. It does not refuse the menu's route-only dependencies, the Angular Aria menu and the CDK overlay, when another eager consumer imports them. Because the initial total is now 376.91 kB against the 500 kB warning budget, such a regression would pass both the check and the build budget unseen.",
  "evidence": [
    "VER-002's uncached production build at target tree da7780d7: Initial total 376.91 kB raw / 102.65 kB estimated transfer, no budget warning; node tools/scripts/check-bundle.mjs exit 0 with lazyCodeInInitial [] and menuAvailableWithTools true.",
    "VER-002's own walk of the esbuild metafile: no @angular/aria menu or list chunk, no overlay module and no menu, filter-menu, catalog or tools source in the initial graph; the Tools entry chunk carries menu.ts, the Aria menu and the overlay; all eight data chunks stay dynamic.",
    "Mutation probes on scratch copies of browser-stats.json: a static edge from main to the Tools entry, and one from main to a data chunk, are both refused with 'Route-only code entered the initial bundle.'",
    "tools/scripts/check-bundle.mjs lines 5 to 7 and 68 to 74 name the three refused source sets; no rule names @angular/aria/menu or @angular/cdk overlay inputs, and the check compares no recorded initial baseline."
  ],
  "rejected": [
    {
      "option": "Fail criterion 7 on the gap",
      "reason": "The criterion asks for the build within the declared budgets and the recorded chunk sizes; both hold, and the current placement is correct."
    },
    {
      "option": "Make the gate fail on any initial growth",
      "reason": "D012 and the operator's direction reject failing a justified, most-efficient change on a number alone."
    }
  ],
  "followup": "Next order that edits tools/scripts/check-bundle.mjs or adds a route-only overlay consumer: refuse the menu's route-only dependency set (the Aria menu and list chunks, the CDK overlay inputs) in the initial graph, or report the initial total's per-package delta against a recorded baseline so that growth is attributed before implementation-ready, with a fixture for each.",
  "reopenWhen": "An initial-bundle input from @angular/aria/menu or @angular/cdk overlay appears in a production build while check:bundle passes, or an order edits check-bundle.mjs."
}
```


## WO-014-D024

```json
{
  "id": "WO-014-D024",
  "date": "2026-10-26",
  "dispatch": "resume: verify",
  "decision": "Board four small hygiene items in this order's own new or changed text; none breaks a criterion or a behavior main had. First, the new apps/dotln-e2e/src/catalog.spec.ts carries a new lint warning at line 166. Second, the new key tools.catalog.loading in en.json uses a \\u2026 escape, contrary to D014's rule to keep literal characters. Third, the tools project's rename to workspace-tools leaves WS-001 house rule text naming tools:lint. Fourth, the @dotln-angular/ui/menu README names DotlnMenu and MenuOption but not DotlnFilterMenu, which the entry point also exports.",
  "evidence": [
    "VER-002's uncached npx nx run-many -t lint test build: exit 0 across 18 projects; dotln-e2e lint reports '166:3 warning Expected blank line before this statement playwright/consistent-spacing-between-blocks', 1 problem (0 errors, 1 warning).",
    "git diff apps/dotln/public/i18n/en.json adds \"loading\": \"Loading the catalog\\u2026\"; the three values D014 named are no longer changed.",
    "docs/workstreams/WS-001-dotln-angular.md line 220 names tools:lint; tools/project.json now names the project workspace-tools, and the target's foundation documents and docs/repositories/dotln-angular.md were updated.",
    "libs/shared/ui/menu/src/public_api.ts exports DotlnMenu, DotlnFilterMenu and MenuOption; libs/shared/ui/menu/README.md names only the first and last."
  ],
  "rejected": [
    {
      "option": "Treat any item as blocking",
      "reason": "Lint and every gate command exit 0, the parsed translation text is the same, and the stale name sits in planning text, not in a gate command."
    }
  ],
  "followup": "Final review of WO-014, or the next repair of these surfaces: add the blank line at catalog.spec.ts:166 so dotln-e2e lint reports no warning, write the ellipsis in tools.catalog.loading as a literal character, name DotlnFilterMenu in the menu README, and route WS-001's tools:lint to workspace-tools:lint through the planning pass that next edits WS-001.",
  "reopenWhen": "The final review or the next repair edits catalog.spec.ts, en.json or the menu README, or a planning pass edits WS-001."
}
```

## WO-014-D025

<!-- integration refs/dotln/checkpoint/WO-014/10 -->

```json
{
  "id": "WO-014-D025",
  "date": "2026-10-26",
  "dispatch": "resume: final review; worktree integrate WO-014",
  "decision": "The integration is a no-op, and no launchpad complete run is owed. The order worktree was already at fetched main 1e9448ab3debe3e42fbfde54401db57f5b3f8ff6 (the launchpad's main after WO-013's records merge #30), so the helper moved no launchpad byte; the launchpad code identity stays dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897, where the repair recorded a passing complete review row (host-gate:dbd80775…:npm test, 2026-10-26T02:11:34.659Z, seven fresh suites, gate selection review), and that row is reused. The affected checks the helper printed ran green. Carried-forward claims: VER-002's nine criterion judgments at target tree da7780d7ecf5e4afd2aa4235009a34717848c38a, which this review reproduced where cheap (criteria 1, 2, 3 and 8, the translation check, the e2e lint and the production bundle check) and otherwise re-gated at the reviewed commits, because the review's own in-surface fixes (D026, D028) moved the target tree. No draft pull request exists to carry (D027). No component version collides: release preparation returns the target-order no-op and no component manifest changed.",
  "evidence": [
    "npm run worktree -- integrate WO-014 --intake-backup <session-scratch>/intake-backup/DotLn-Instance-wo014-intake-20261026T030042Z.zip (five intake files archived to the DotLn session scratch first, because the helper refuses to run over ignored intake without a named backup): Bases 1e9448ab… -> 1e9448ab…, authored conflicts none, checkpoint refs/dotln/checkpoint/WO-014/10, retained stash 012f9c85b959c7b09d02ddda60b0bbed01dab0d7 (WO-014 integrate 2026-10-26), release preparation: target order records no release; no files changed.",
    "gateCodeIdentity after the integration and this review's records edits: dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897, equal to the identity of the repair's complete review row (docs/control/local/harness/checks.json, checkId npm test, recordedAt 2026-10-26T02:11:34.659Z, exitCode 0, executed, freshSuites 7).",
    "Affected checks as printed: npm run publication:check (publication: no editions declared, exit 0), node scripts/harness.mjs check (35 generated surfaces; local-terms list present, exit 0), npm run release -- check-surfaces --local (every license surface PASS, exit 0). npm test -- --review was not rerun: the identity is unchanged.",
    "git log wo-014..main and main..wo-014 are both empty in the launchpad; the target's wo-014 branch sits on its main (83184879…) with no commits on main since."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or discard the integration stash",
      "reason": "Both histories and recovery material must remain available."
    },
    {
      "option": "Start npm test -- --review for the ritual",
      "reason": "The integrated code identity already carries a passing complete review row; the identity, not the dispatch time, says what was tested."
    }
  ],
  "reopenWhen": "A later integration moves a launchpad code byte before the records publish, so the identity changes and a fresh complete row is owed; the target's main advances past 83184879358a30a60596aea983d587ed5681ea9d before the final publish; or the final publish refuses its Change table or commit range."
}
```

Integration date: 2026-10-26. Original base: `1e9448ab3debe3e42fbfde54401db57f5b3f8ff6`.
Fetched main: `1e9448ab3debe3e42fbfde54401db57f5b3f8ff6`. Checkpoint: `refs/dotln/checkpoint/WO-014/10`.
Named stash retained: `012f9c85b959c7b09d02ddda60b0bbed01dab0d7` (WO-014 integrate 2026-10-26).
Resolved projections: none.
Release preparation: WO-014: target order records no release; no files changed.
Carried-forward claims: VER-002's criterion judgments at tree `da7780d7…`, reproduced or re-gated by FINAL-001 as the decision above records; the launchpad complete review row at identity `dbd80775…` reused.
Authored conflicts observed: none.
Affected checks: `publication:check`, `harness check` and `release check-surfaces --local` ran green after the integration; `npm test -- --review` reused at the unchanged identity.

## WO-014-D026

```json
{
  "id": "WO-014-D026",
  "date": "2026-10-26",
  "dispatch": "resume: final review; FINAL-001 acceptance and the publication that follows it",
  "decision": "Accept WO-014 in FINAL-001 with every criterion met and record pass. Fix in review the three in-surface hygiene items D024 assigned to this review (the blank line at catalog.spec.ts:166, the literal ellipsis in tools.catalog.loading in en.json and in the feature's test-kit copy, and DotlnFilterMenu in the menu entry point's README) and route D024's WS-001 item to the planning pass that next edits the workstream, as D024 says. Restore subagentCap to 20 in docs/control/budgets.json, as D002 and D013 require at this review. Commit the reviewed target change as one commit, 23b39aef39ce8f17407d9f21f30fb33eaba5e20e, subject 'feat: add the toolbox catalog and its browser', with a plain body and no launchpad identifier, followed by the hidden-file fix as its own commit (D028): the repair's menu placement, curated exports, bundle check and sampler are not independent of the feature they serve (the catalog page imports the menu entry point; package.json, the rules and the scripts reference carry both), the intermediate states were never gated, and the publication rule says neither a work-order boundary nor a file count decides the count, so one coherent reviewed commit plus one independent correction plus the records commit is the series. Rerun the target review gate at each reviewed commit rather than carry VER-002's row across the review's own edits. After the result: target-records adds the records commit; the instance records are committed; the target publish opens the pull request ready on feat/toolbox-catalog with the reviewed title and PR.md, because no draft exists to reuse (D027); then the instance records branch is published with RECORDS-PR.md. Register rows this review disposes from observed outcomes: the D013 cap row settled (the cap reads 20 in this branch); the D024 hygiene row narrowed and deferred (three items fixed here, the workstream item left with planning); the new D023 and D027 rows deferred to their owners. Rows left deferred with their owners: D010's mapping pass, D012's preflight attribution, D015's receipt conditions and screening, D019's fork-interaction mechanism, D020's cold-load shift, D023's bundle-check scope, D025's integration conditions, D027's draft observability, and the candidates C2 of the two passes; the registration trust-entry row is observed by the publish and recorded in host-qualification.",
  "evidence": [
    "Reproductions at the verified tree da7780d7 before any edit: npm run catalog:check exit 0 (8 checkpoints, 3463 tools); npm run catalog:report exit 0 and byte-identical to catalog-report.txt; the forbidden-definition fixture exit 1 with the value withheld; the criterion's grep and a grep for section or chapter print nothing; a grep for home paths and URLs prints nothing; both documents exist and grep -c decision prints 2.",
    "After the hygiene fixes: npx prettier --check on the four files passes; npm run i18n:check finds no missing key; npx nx lint dotln-e2e --skip-nx-cache succeeds with no warning; npm run check:bundle prints initialBytes 376913, lazyCodeInInitial [] and menuAvailableWithTools true.",
    "Target review gate rows: target-gate:1193389d-edcf-4e74-ab0d-d4b7d4daa1ab at commit 23b39aef (tree f097525a, 144,719 ms, install, lint, test, format, build, e2e and visual all PASS) and target-gate:3c0a1fd8-56aa-4282-a3a9-a8414219ee30 at commit d487a807 (tree d051ba03, 90,863 ms, all PASS; test, build and e2e replayed from the Nx cache because the fix touches none of their inputs); the target's status was clean before and after each.",
    "git diff --check clean for both commits; both subjects are plain conventional subjects with no launchpad identifier and no attribution; author and committer are the operator's public identity.",
    "The launchpad code identity stays dbd80775eda0b78bb08729662389d78c2905051201848699f91eb04b1adbc897 after the records edits, so the repair's complete review row is reused (D025).",
    "Usage: entry 96,102 tokens at 2026-10-26T02:49:05Z; handoff 7,595,126 tokens at 03:07:40Z (7,097,571 cached input, 425,129 cache writes, 71,652 output, 87 steps); no worker spawned, 0 of the cap."
  ],
  "rejected": [
    {
      "option": "Consume VER-002's rows and record pass at the verified tree",
      "reason": "It would merge four known hygiene items and an unboarded local gate failure and leave the cap at 40; the fixes are small and inside the declared surfaces."
    },
    {
      "option": "Split the feature commit by file into implementation and repair",
      "reason": "The repair is entangled with the feature in several files, no intermediate state was gated, and a commit that cannot be checked on its own is worse than one coherent reviewed commit."
    },
    {
      "option": "Fix D024's WS-001 wording here",
      "reason": "D024 routes it to the planning pass that next edits the workstream; this review edits WS-001 only for its delivery state."
    }
  ],
  "reopenWhen": "The final target publish or the records publish refuses, the pull request's head moves before a merge, or a later order finds a defect in the catalog, its checks or the Tools browser that this review's reading missed."
}
```

## WO-014-D027

```json
{
  "id": "WO-014-D027",
  "date": "2026-10-26",
  "dispatch": "resume: final review",
  "decision": "Record that no draft pull request exists for this order and proceed to the final publish, which opens the pull request ready; do not run the draft form during final review. The verified-phase draft publish is the step the session that records verification-result pass runs (the operator's standing preference of 2026-10-18, D5; the order's step 15 through WO-007's steps 15 to 17). VER-002 recorded pass and wrote that its session publishes nothing, so the operator had no draft to read before dispatching this review and no CI run exists for the branch before it. The safe default: the final publish's pull request is the one the operator reads before merging, its CI runs on the pushed head, and preview-pr.json records the absence with its evidence and routes nothing. This is a finding against the publication sequence, not against the subject (FINAL-001 F1, follow-up, class integration).",
  "evidence": [
    "gh pr list --repo DylanBWood/DotLn-Angular --state all --head wo-014 and --head feat/toolbox-catalog both return [] at 2026-10-26T02:5xZ; the target has no refs/dotln/draft/* ref; git ls-remote --heads origin lists only main at 83184879…; gh run list for feat/toolbox-catalog returns []; docs/evidence/WO-014/preview-pr.json did not exist at dispatch.",
    "VER-002.md, Known issues and carry-ins: the draft pull request remains the final review's obligation and the session publishes nothing. host-qualification.md: draft publication belongs to the verifier after its passing result.",
    "The order's known issues make the draft and its workflow runs a final-review obligation read from preview-pr.json, never a criterion."
  ],
  "rejected": [
    {
      "option": "Run the --draft form now and then the final publish",
      "reason": "The helper's draft form belongs to the verified phase, before the order's records; opening a draft minutes before the final publish supersedes it gives the operator no reading time and adds a lease the final publish must then satisfy, for an identical end state."
    },
    {
      "option": "Fail the review on the missing draft",
      "reason": "The draft is a final-review obligation read from the record, never a criterion; every criterion holds."
    }
  ],
  "followup": "Planning: make the verified-phase draft publish observable at verification-result pass for a target order, through the verifier role's completion duties or a kit prompt that names the exact helper command and records its omission in the verification report, so a missed draft is caught before the operator dispatches final review; until then the final review records the absence in preview-pr.json.",
  "reopenWhen": "The next planning pass reads this row, or another target order reaches final review without a draft pull request."
}
```

## WO-014-D028

```json
{
  "id": "WO-014-D028",
  "date": "2026-10-26",
  "dispatch": "resume: final review; Adjacent Repair",
  "decision": "Make the catalog check ignore hidden files in its data directory and cover the case in the merge test, as a bounded repair within the declared surfaces (FINAL-001 F2, follow-up, class escape). A stray Finder .DS_Store in libs/shared/catalog/src/data made readCheckpoints refuse the directory as carrying an unexpected data file, so npm run catalog:check, npm run check:fixtures and therefore the workspace-tools lint target in the registered gate would fail on a macOS machine that had opened the folder, with a diagnostic that names no file. The target already ignores .DS_Store in Git, so the file never commits; the defect was local-only and present in the verified subject. Committed as the second reviewed commit, d487a8075f28bb9d456b549c77e1cb211238839a, 'fix: ignore hidden files in the catalog data directory', and the target review gate was rerun at it.",
  "evidence": [
    "Reproduction on a scratch copy of the eight data files and the summary: checkCatalog(dir) passes (8 checkpoints); after writing an empty .DS_Store into the copy it throws, and catalogDiagnostic reads 'at /: Unexpected catalog data file.'",
    "The repair filters readdirSync's names by !name.startsWith('.') with a comment; tools/catalog.test.mjs writes .DS_Store into the merge test's output directory and asserts readCheckpoints still reads one checkpoint, then keeps the unexpected.jsonl refusal; catalog.md says the check ignores hidden files.",
    "After the repair under the bounded wrapper: npx prettier --check on the three files passes; npm run test:tooling passes 32 of 32; npm run catalog:check prints PASS catalog: 8 checkpoints, 3463 tools."
  ],
  "rejected": [
    {
      "option": "Board the defect without fixing it",
      "reason": "A one-line fix with a regression case is inside the Boy Scout bound, and the failure would surface as a confusing gate lint failure on the operator's platform."
    },
    {
      "option": "Admit any non-JSON file",
      "reason": "The refusal of an unexpected data file guards the inventory; only hidden entries are outside it."
    }
  ],
  "reopenWhen": "A later order changes the data directory's inventory rule or the catalog check's file discovery."
}
```
