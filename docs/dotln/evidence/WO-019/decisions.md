# WO-019 decisions

## WO-019-D033

```json
{
  "id": "WO-019-D033",
  "date": "2026-10-28",
  "dispatch": "resume: verify",
  "decision": "Judge the original nine criteria from the current target tree, the independent production walkthrough and direct comparisons with the pinned maps. Retain the existing scene-link, reading-address and study-maintenance follow-ups. Record the decision records' verbatim operator messages as a nonblocking documentation follow-up, without changing the implementation or earlier evidence under review.",
  "evidence": [
    "VER-001's production journey completed at 360, 768 and 1440 pixels with restored history, no page errors, no horizontal overflow and zero axe violations with the study expanded. All 3,463 joined rows match the source content fields at the eleven recorded digests.",
    "The current review target row covers install, lint, test, format, build, e2e and visual at tree 0c45e8128a3f2e3ee9c2398d4228d35ff05cae54. Independent formatting, catalog/tooling, bundle, motion and reactive-semantics probes passed.",
    "The operator record requires paraphrasing raw messages unless a draft is expressly ready to file. D024, D025 and D027 through D032, and design/rounds.json, contain verbatim messages. The available provenance does not assert that exception. This affects records publication, breaks no acceptance criterion and reproduces no target behavior regression.",
    "Traps considered: a passing gate cannot replace the use criterion; ending comparisons is not final acceptance; a sourced mapping label is not a fresh book check; intentional removal of catalog prose screening is not itself a criterion failure. Independent use, source comparisons and the recorded scope resolve those choices. The no-op would leave the independent-use obligation unfulfilled. Verification probe corrections and truncated-read recovery are recorded in verification-observations.json."
  ],
  "rejected": [
    {
      "option": "Fail a met criterion on a separate records-maintenance defect",
      "reason": "The verification routing rule reserves blocking findings for unmet criteria or reproduced regressions."
    },
    {
      "option": "Rewrite the implementation or historical evidence during verification",
      "reason": "The verifier is read-only over the subject; the records repair belongs to final review before records publication."
    }
  ],
  "followup": "Before publishing the launchpad records, paraphrase the operator's verbatim messages in WO-019 decisions and design/rounds.json and cite their existing capture provenance; retain ready-to-file wording only when its explicit authorization is recorded. Preserve the decisions, preferences and comparison stopping state.",
  "reopenWhen": "Final review prepares the launchpad records for publication, a ready-to-file authorization is found, or verification evidence is contradicted."
}
```

## WO-019-D032

```json
{
  "id": "WO-019-D032",
  "date": "2026-10-28",
  "dispatch": "resume: next; operator messages at 22:43Z–22:46Z on docs/repositories/dotln-angular.md",
  "decision": "Replace the DotLn-Angular profile's run-on header paragraph with what a reader of the repository uses (the checked commit, the toolchain and library versions, what the app is, and where history lives), and remove this order's own narrative additions, keeping only corrections of statements that were false. Usefulness is the test, not length.",
  "evidence": [
    "The operator wrote at 22:43Z–22:46Z that the paragraph was useless accumulation, asked who monitors what goes into the profile and what the paragraph was for, and corrected the executor's answer about size: size is not the measure, and a far larger amount of useful information would be welcome (capture 66335ad0…).",
    "The paragraph began as the line naming the commit and toolchain the profile was checked against. Each planning pass and order closeout then appended its own events to it: merges, pull request numbers, release times, refusals and planning passes. No reader of the repository needs that history from the profile; Git, the pull requests, the releases and each order's records already hold it, and nothing in the process asks whether an addition is needed.",
    "The replacement keeps the class, base branch, checked commit, toolchain, libraries, the app's subject (WS-001 §The app and its sub-apps) and a pointer to where history lives. This session's own narrative sentence and workspace-tools line are removed; the CI paragraph and the concept-study line, which were false, are corrected in fewer words."
  ],
  "rejected": [
    {
      "option": "Cap the profile's size",
      "reason": "Length is not the problem; a cap would keep useless text and could block useful text."
    }
  ],
  "followup": "Review the rest of docs/repositories/dotln-angular.md for statements no reader of the repository needs, keep what is useful whatever its length, and stop planning passes and order write-backs from appending event history to it.",
  "reopenWhen": "A planning pass reviews the rest of the profile, or the operator directs that review into an active order."
}
```

## WO-019-D031

```json
{
  "id": "WO-019-D031",
  "date": "2026-10-28",
  "dispatch": "resume: next; operator questions at 22:30Z on why the launchpad suite ran for this order",
  "decision": "Do not run the launchpad's complete `npm test -- --review` for WO-019. Its launchpad-side check is the document gate its criterion 9 names; its product checks are the target gates, which passed. The run started at 22:28:21Z was stopped at 22:30:54Z and supplied no pass. This supersedes D022 and D023's note that the complete run was owed.",
  "evidence": [
    "The operator asked at 22:30Z what the launchpad suite had to do with this work order, and then whether the executor had run a task unrelated to the order (capture 66335ad0…).",
    "The executor procedure's closeout step starts one complete launchpad run for every execution, and the integrate helper listed it as an affected check after main's merge. The executor applied that step without checking it against this order.",
    "WO-019 changes no launchpad code, only its records and documents. Its criteria name the target gates and npm run test:docs; completion consumes rows only for checks the criteria name, and the procedure says target orders keep their target gate. Main's own gates had already run on the merged starter v0.101.0.",
    "node scripts/harness.mjs evidence --stop reported the run stopped with no pass supplied; nothing changed."
  ],
  "rejected": [
    {
      "option": "Let the complete run finish",
      "reason": "It would spend the time and supply a row nothing in this order consumes."
    }
  ],
  "followup": "Ask core whether the executor's closeout step that runs the complete launchpad suite should apply to a target order whose criteria name only its target gates and the document gate, and whether the integrate helper should list it as an affected check there.",
  "reopenWhen": "A WO-019 criterion or the kit's completion starts to consume a launchpad complete row for target orders."
}
```

## WO-019-D030

```json
{
  "id": "WO-019-D030",
  "date": "2026-10-28",
  "dispatch": "resume: next; closeout design review findings 2, 3 and 7",
  "decision": "Keep the decided Arrive study's structure for this order and record its maintainability work for the concept-study authoring program.",
  "evidence": [
    "The motion and velocity drawings' coordinates, the slowing zone and some prose numbers repeat arriveExample's constants as literals in tools.facade.ts, arrive-study.html and en.json; a changed constant would update the motion but not every drawing or sentence. The late-braking chart is now derived from its scales (D026).",
    "Each study section's open state lives both in its native details element and in the facade; they agree because the study is recreated when the concept changes, which D016 once broke.",
    "The catalog page focuses the time slider by querying a composite's markup, and composites use fixed element ids that a Storybook docs page rendering several stories would duplicate. The app renders one study and one reading at a time."
  ],
  "rejected": [
    {
      "option": "Refactor the study now",
      "reason": "It risks the decided rendering for no reader-visible change; the planning handoff assigns study records and visual families to the next pass."
    }
  ],
  "followup": "In the concept-study authoring work, derive each study's drawing geometry and prose values from its model, make the facade the single source of each section's open state (bind open on the disclosures), let the study own its focus, and give composite element ids a per-instance suffix.",
  "reopenWhen": "A second authored study is planned, or a defect in the Arrive study's state or geometry appears."
}
```

## WO-019-D029

```json
{
  "id": "WO-019-D029",
  "date": "2026-10-28",
  "dispatch": "resume: next; closeout criteria review finding F7 and design review finding 12",
  "decision": "Keep reading state in the persisted store for this order and record two addressing and loading improvements for planning.",
  "evidence": [
    "Readings open through in-page links; the browser's Back leaves /tools/catalog instead of returning to the previous reading. The in-page 'Back to the previous reading' control works and is tested, and the Objective names no control.",
    "The Tools home now shares the catalog page's store (D026) but still loads every chunk, about 5.4 MB of JSON before compression, to show six titles, six counts and the last reading; the shared store makes that load serve the catalog page too."
  ],
  "rejected": [
    {
      "option": "Route readings by URL now",
      "reason": "A routing change across the reading surface, its persistence and tests, outside the reviewed behaviour of this closeout."
    }
  ],
  "followup": "Make catalog readings addressable (for example /tools/catalog/<tool id>) so the browser's Back and shared links return to a reading, and let the Tools home render works, counts and the last reading from the summary and persisted history without loading every chunk.",
  "reopenWhen": "A planning pass schedules the catalog's next order, or the operator brings either change into an active order."
}
```

## WO-019-D028

```json
{
  "id": "WO-019-D028",
  "date": "2026-10-28",
  "dispatch": "resume: next; closeout criteria review finding F6",
  "decision": "Leave the reading's soldier-scene line as the sentence it is today and hand its conditional link to the order that replaces the scene's arriving page (WO-015).",
  "evidence": [
    "The design links the line to /scene?tool=<id> when the kind is one the scene interprets and BasePaths.Scene resolves to a page that is not the arriving page. sceneRoutes renders only SceneArrivingPage, so the correct output today is the sentence without a link, which the browser journey pins.",
    "No availability signal exists to read, and the scene's handling of a tool parameter belongs to WO-015."
  ],
  "rejected": [
    {
      "option": "Add an availability token and an unused link path now",
      "reason": "Plumbing without a consumer or an end-to-end test; WO-015 owns both sides of the link."
    }
  ],
  "followup": "When the soldier scene replaces its arriving page (WO-015), make the reading's 'runs in the soldier scene' line a link to /scene?tool=<id> for kinds the scene interprets, with a test that flips scene availability and expects the href, and have the scene read its tool parameter.",
  "reopenWhen": "WO-015 activates or the scene route changes."
}
```

## WO-019-D027

```json
{
  "id": "WO-019-D027",
  "date": "2026-10-28",
  "dispatch": "resume: next; operator directions of 2026-10-28 on tool scripts and the operator's choice of cuts",
  "decision": "Give every DotLn-Angular tool a stated purpose and status (in a gate, a helper or a module) in docs/dev-reference/workspace/scripts.md, and make the three cuts the operator chose: CI runs the workspace checks once, through nx run workspace-tools:lint with nx affected excluding workspace-tools; lint:fixtures leaves the gate and becomes a helper for lint-policy changes; tools/scripts/catalog/merge-checkpoints.mjs and its test are deleted, keeping that test's two partial-read assertions. The style-only checks stay, as the operator chose.",
  "evidence": [
    "The operator directed at 22:04Z that every tool script have a purpose, that the sessions know which scripts must sit behind gates and which are helpers, and that this repository not become one where the scripts, their tests and the gates around them take up the work for little gain; at 22:10Z they gave the general rule that a tool stays because it is useful (capture 66335ad0…). Asked which cuts to make before WO-019's gates, they chose stopping CI double runs, taking the lint-rule fixture tests out of the gate and deleting merge-checkpoints, and left lint:components and check:shared-types in place.",
    "Inventory before the cuts: 20 scripts under tools/scripts, 16 at its top level and 4 catalog scripts (2,298 lines), 9 tooling test files with 41 tests (1,051 lines), two fixture checkers and two lint rules (432 lines) and 35 lint fixtures. The registered gate reaches the workspace checks only through workspace-tools:lint inside nx run-many -t lint.",
    "CI ran lint:hygiene, lint:fixtures, test:tooling, check:templates, check:tokens, check:kits and i18n:check standalone and again inside nx affected when the tools project was affected. The tools project depends on none of the code it checks, so for app-only changes typecheck:foundations, lint:components, check:shared-types, check:fixtures and check:scripts did not run in CI at all; the new order runs every workspace check once on every change.",
    "check:scripts stays because it makes every new script carry a written purpose; typecheck:foundations stays because during this closeout it caught a type error the unit tests missed.",
    "After the cuts the final Preflight passed all 13 commands at 2026-10-28T22:13:50Z–22:17:27Z, and npm run check:scripts passes over 29 npm scripts and 16 tool files."
  ],
  "rejected": [
    {
      "option": "Remove the seven standalone CI steps alone",
      "reason": "nx affected runs the workspace checks only when tools/ changes, so that would have dropped them from CI for most changes."
    },
    {
      "option": "Delete scripts or tests the operator did not choose",
      "reason": "Further cuts need their own decision; the classification makes the next one straightforward."
    }
  ],
  "followup": "Carry the operator's 2026-10-28 tooling direction into WS-001's house rules and the operator record: each tool has a stated purpose and status (gate, helper or module), a tool stays because it is useful, and a gate check must protect something worth checking on every change.",
  "reopenWhen": "The operator changes the cuts, or a helper proves it must run on every change."
}
```

## WO-019-D026

```json
{
  "id": "WO-019-D026",
  "date": "2026-10-28",
  "dispatch": "resume: next; closeout Preflight and three independent reviews after the operator ended the comparisons (D025)",
  "decision": "Repair what the closeout Preflight and reviews found before the gates. Re-join the catalog against the same eleven digests with a corrected verification rule and a rule that a relation never links a concept to itself, refining D002. Give the Tools routes one catalog store. Keep presentational code off the catalog data-access library and let lint refuse it. Complete the browser cases criterion 5 names. Wrap long titles, fix the parameter line's spacing, derive the late-braking chart's labels and lines from its scales, and complete the catalog documents. The source digests are unchanged, so the content is the same run's; one row's verification kind and eight self-links change, and the summary now records the day it was written.",
  "evidence": [
    "The first closeout Preflight failed workspace lint: round 21's chart template carried eight literal axis numbers (check:templates) and round 22's generalized retained-code assertion used allTextContents (playwright/prefer-web-first-assertions). The earlier tools-only lint runs had not reached either. Both were repaired at the cause; the tick labels and grid, target and axis lines now come from arriveLimitExampleView's scales and a unit test pins the reviewed coordinates.",
    "All three reviewers found that verificationKind matched 'partial' anywhere, so rxc:310, whose note is the PartialObserver API URL, shipped as partially verified. The rule now lives in check-catalog.mjs and matches 'partial' only as a word; the check refuses a stored kind that differs from its note. After the re-join exactly one row is partial (eip:258), as the order's design states.",
    "Eight RxJS rows resolved a relation to themselves (rxp:42, 217, 223, 224, 225, 229, 230 and 245). The join now links a title only to another concept and the check refuses a self-link. RxJS resolved relations moved from 829 to 821 of 1,382 (59.4%); the other works are unchanged.",
    "Route providers on both Tools routes created two CatalogStores that both persisted dotln-angular.tools; one provideCatalog() on a parent route now serves the home and the catalog page.",
    "isSceneTool and the shelf and contents shapes moved to @dotln-angular/models, and eslint's domainImports now names @dotln-angular/catalog, so composites and mappers cannot import the data-access library. A work the shelf does not list now reaches the reader by its slug instead of an invented scene type.",
    "The browser suite now asserts the six shelf works, presses Enter on 'arrive' while another concept is open, checks a 51-character unbroken title at 360 px in the results and the history, and runs axe and the overflow check with every study section and one code step open. Search results name their work by title; choosing the open chapter or section closes it.",
    "The parameter line's ' ,' and indented lines came from '.parameters span + span', which outranked its overrides under Angular's style encapsulation; the override now repeats the sibling selector. The three catalog visual baselines were regenerated and inspected.",
    "The final Preflight passed all 13 commands at 2026-10-28T22:13:50Z–22:17:27Z: workspace lint, test and build, fixtures, components, hygiene, catalog check, 41 tooling tests, translations, the bundle check (393,633 initial bytes), foundations, browser type check and 85 browser tests. The visual suite passed 42 of 42 before the baseline refresh, and the review gate's visual row passed against the three refreshed baselines."
  ],
  "rejected": [
    {
      "option": "Hand-edit rxc:310 and the eight relations in the data",
      "reason": "The data is generated by the join; editing it would leave the rule, and the next join, wrong."
    },
    {
      "option": "Accept two partial rows",
      "reason": "The order's design names one partial row, and the second came from a URL."
    },
    {
      "option": "Fix every remaining reviewer finding now",
      "reason": "The study's structure, readings by URL, a summary-only home and the scene link are recorded as follow-ups (D028–D030); they change decided structure or belong to later orders."
    }
  ],
  "reopenWhen": "A later map changes a digest, the scene interprets a different set of kinds, or verification or final review finds a regression from these repairs."
}
```

## WO-019-D025

```json
{
  "id": "WO-019-D025",
  "date": "2026-10-28",
  "dispatch": "resume: next; the operator's direction at 21:08Z to wrap the comparisons up for now",
  "decision": "End the eye doctor comparisons for WO-019 after round 22, as the operator directed, and close the order out: independent reviews, the Preflight line, refreshed walkthrough and bundle evidence, the target gates, the document gate and the handoff. Ending the comparisons is not recorded as final design acceptance; acceptance by use remains criterion 1, judged by the verifier's walkthrough, and the operator reads the draft pull request before final review.",
  "evidence": [
    "After round 22's selected design was rendered and checked, the executor asked whether anything else should be compared or whether the comparisons were done, naming the closeout steps that would follow. The operator answered at 2026-10-28T21:08Z that the work should be wrapped up for now (capture 66335ad0…).",
    "The order's execution expansion keeps the comparisons running until the operator explicitly ends them (D003, D014); rounds.json now records processEnded after round 22 with that direction paraphrased and its capture cited, with finalAcceptance unchanged."
  ],
  "rejected": [
    {
      "option": "Derive a round-23 pair",
      "reason": "The operator ended the comparisons."
    },
    {
      "option": "Record the end as final design acceptance",
      "reason": "The operator ended the comparisons for the present, not as an acceptance; acceptance by use belongs to criterion 1 and the operator's reading of the draft pull request."
    }
  ],
  "reopenWhen": "The operator resumes the comparisons, or verification or final review finds a design defect on the reading surface."
}
```

## WO-019-D024

```json
{
  "id": "WO-019-D024",
  "date": "2026-10-28",
  "kind": "correction",
  "dispatch": "resume: next; operator direction on round 22, given at 13:08:57Z in the morning session and restated at 20:34Z after the pair was asked again",
  "decision": "Round 22 keeps both candidates as the operator directed: the complete ordinary pseudocode first (A), then the four explanations, each with the lines it explains (B's interleaving) in a native details disclosure that starts closed and sits where B placed the code. Each explanation appears once and both pseudocode members stay in use. As with round 19's directed combination, this arrangement gets no further comparison; the eye doctor process stays open.",
  "misread": "This session resumed from the design record, which still read round 22 as prepared-not-asked, and asked the operator the A/B pair again. The operator had already answered it in the morning session, which recorded the answer nowhere before its first edit into the target worktree was refused.",
  "meant": "The operator's answer stands: a mix of A and B, with the code B interleaves hidden at first behind an expand or accordion control (13:08:57Z), restated at 20:34Z as mixing both with the interleaved code in an accordion or expand control that is hidden by default (capture 66335ad0…).",
  "changed": "rounds.json records round 22 as preference both, with the operator's words and times; the template implements the combination; the pair is not asked again. An operator direction in this order is written to rounds.json or this file before its implementation starts, so a refused or interrupted edit cannot lose it.",
  "evidence": [
    "The morning session's transcript holds the operator's 13:08:57Z message and that session's plan for this layout ('the complete code block, then the four explanations as before, each with its lines in a closed details where B put them'); its edit of study-explanation.html was refused at 13:12:32Z. The design record and main's planning pass of 2026-10-28 (D3) both still read round 22 as unasked.",
    "The template change was this session's first edit into DotLn-Angular-wo019, and the harness journal recorded it granted with kind target-worktree, the v0.101.0 grant D023 brought in.",
    "tmp/wo019-round22-selected.mjs (ignored) rendered the Study story at 1440, 768 and 360 pixels. The complete code is the guide's first code block and equals the canonical arrivePseudocode text. Four explanations and four step disclosures render, all closed at first, and the step fragments join to the complete code. Each summary is described by its step heading, and one step opens and closes from the keyboard, showing lines that the complete code contains. There were no serious or critical axe findings closed or with one step open, and no horizontal overflow or page errors. Results are in design/round-22/selected-checks.json; captures are design/round-22/captures/selected-*.png.",
    "NX_DAEMON=false npx nx run-many -t lint test -p tools (3 files, 10 tests), npm run i18n:check, npm run lint:components and npm run typecheck:e2e exited 0. The catalog browser spec passed 18 of 18 against a fresh production build, including a new regression for the closed step disclosures and the retained-code regression generalized in round 22, which had not run before the 2026-10-26 pause."
  ],
  "rejected": [
    {
      "option": "One closed disclosure holding B's whole interleaved guide below A",
      "reason": "It would repeat the four explanations; round 19 kept one copy of shared explanatory text, and per-step disclosures give the same interleaving without duplication."
    },
    {
      "option": "The complete code followed only by a hidden interleaved guide",
      "reason": "The operator asked for A and B together; A's explanations stay readable without opening anything."
    },
    {
      "option": "Each step's disclosure after its explanation",
      "reason": "Opening it would put the code below its explanation, reversing B's order; B and the morning session's plan both put the code first."
    },
    {
      "option": "A round-23 pair on the same arrangement",
      "reason": "The operator directed the combination; as in round 19, a directed combination ends that arrangement's comparison without ending the eye doctor process."
    }
  ],
  "reopenWhen": "The operator corrects this reading of 'mix' (for example one disclosure for the whole interleaved guide), changes the preference, or executable evidence contradicts the rendered code. This selection does not end the eye doctor process."
}
```

## WO-019-D021

```json
{
  "id": "WO-019-D021",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Keep round-21 A: the normal and late-braking runs share one position-over-time chart. Remove the separate-chart template. Preserve the explanation of the changed slowing radius, the observed overshoot and the cause, using the same motion calculation as the interactive example.",
  "evidence": [
    "The operator selected A, both runs on one chart, on 2026-10-26.",
    "Both candidates used identical trace points, scales and explanatory text. Browser checks at 360, 768 and 1440 pixels found equal content hashes, no errors or overflow and no serious/critical axe findings.",
    "The shared model produces a sampled maximum position of about 103.93 with the 8-unit slowing radius, versus a maximum of 100 with the original 36-unit radius. The default model behavior remains covered by its existing tests.",
    "The limits comparison is derived only on expansion and reused through unrelated interactions. The 17 catalog browser checks passed after adding a regression for the visible result and collapse/reopen behavior."
  ],
  "rejected": [
    {
      "option": "Keep one chart for each run",
      "reason": "The operator selected direct comparison on a shared chart. The rejected sequential template is preserved by screenshots and its implementation record."
    },
    {
      "option": "Use independently drawn or independently calculated trajectories",
      "reason": "They could misrepresent the effect of the radius change; both traces use the same tested calculation."
    }
  ],
  "reopenWhen": "The operator changes the preference or executable evidence contradicts the rendered explanation. The selection does not end the eye doctor process."
}
```

## WO-019-D020

```json
{
  "id": "WO-019-D020",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Select round-20 A and keep each implementation's explanation together. Remove the grouping by shared algorithm step. Future implementation explanations follow the implementation's own structure; use a direct step correspondence only when it is warranted and useful.",
  "evidence": [
    "The operator selected A because organizing every implementation under the same steps assumes a correspondence that need not exist. This is a content-model correction, not merely a visual preference.",
    "The two Arrive examples happen to share the three decisions used in this demonstration. That overlap does not establish a general structure for implementations of other concepts.",
    "The selected template contains one section for the interactive example and one for the game library. No grouping input, alternate runtime branch or separate story remains. The rejected template organization is reconstructable from its screenshots and implementation record."
  ],
  "rejected": [
    {
      "option": "Organize all implementation explanations under one shared sequence",
      "reason": "Different approaches may divide the problem differently or have no direct step correspondence."
    },
    {
      "option": "Infer final acceptance from the choice",
      "reason": "The operator has not ended the eye doctor process."
    }
  ],
  "reopenWhen": "The operator changes the direction or a specific comparison warrants an explicit correspondence between implementations; no general correspondence is assumed."
}
```

## WO-019-D019

```json
{
  "id": "WO-019-D019",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Introduce the page's interactive example and the external game library before comparing their implementation choices. Replace the vague study label with Interactive example on this page, identify gdx-ai as a Java game-AI library and Arrive.java as its source file, and explain why the comparison helps. Apply the same correction to both round-20 groupings; no preference is inferred.",
  "evidence": [
    "The operator could not identify either subject from the first round-20 pair. The page assumed context that the comparison needed to supply.",
    "The local calculateArriveStep implementation drives the Movement and Velocity diagrams and worked calculation. It is a one-dimensional teaching example created for this page.",
    "Context7 resolved /libgdx/gdx-ai and returned the official Steering Behaviors documentation. The public repository README identifies the Java game-AI library; Arrive.java supplies the steering implementation. These public sources were read on 2026-10-26.",
    "The official steering documentation distinguishes an acceleration request from the game code that applies it to move a character. The revised explanation uses that concrete distinction instead of unexplained host/integration terminology.",
    "The first pair and checks are preserved under round-20/captures/context-omitted. The corrected A and B keep identical shared context and six comparison facts, changing only their grouping. The eye doctor process remains open."
  ],
  "rejected": [
    {
      "option": "Explain the labels only in chat",
      "reason": "A reader of the page would still lack the same context."
    },
    {
      "option": "Treat the clarification as a layout preference",
      "reason": "The operator questioned the subjects of the comparison and did not select either grouping."
    }
  ],
  "reopenWhen": "Reading the corrected explanation reveals another missing premise or the operator changes the content direction."
}
```

## WO-019-D018

```json
{
  "id": "WO-019-D018",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Keep both round-19 reactive explanations and apply the already-selected switchable-view pattern. Show Data flow or Event timeline in one figure, with one shared scenario, explanatory rules and pseudocode. Preserve deferred construction and the main study timeline.",
  "evidence": [
    "The operator selected both drawings and explicitly requested the same type of solution used for the initial Movement and Velocity explanation. This directs a view switch without another arrangement comparison.",
    "Both round-19 candidates explain the same three frame ticks, intervening target update and stop emission. Their shared prose and pseudocode matched in the browser checks. Real RxJS subjects verified the event claims.",
    "The selected implementation keeps presentation state in the existing facade and emits view intents through the existing component path. Only the active diagram is constructed inside the expansion-deferred explanation; the choice survives collapse and reopening."
  ],
  "rejected": [
    {
      "option": "Drop one of the drawings",
      "reason": "The operator wants both ways of understanding the stream."
    },
    {
      "option": "Repeat the simultaneous-versus-switchable comparison",
      "reason": "The operator already directed reuse of the initial explanation’s selected solution."
    },
    {
      "option": "Duplicate the pseudocode and shared explanatory rules under both drawings",
      "reason": "The selected switch shares those unchanged facts while changing the visual representation."
    }
  ],
  "reopenWhen": "The operator changes the direction or observed use exposes a problem in the shared view behavior. This choice does not end the eye doctor process."
}
```

## WO-019-D017

```json
{
  "id": "WO-019-D017",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Defer broader catalog search usability to a separately planned follow-up. Keep the operator-selected global ranking in WO-019. Future filtering and sorting must be visible and controllable; any contextual book selection should appear as an explicit preselected filter that the reader can keep or remove.",
  "evidence": [
    "After round 18, the operator identified ordinary filter and sorting gaps as the appropriate way to improve catalog search and asked for a note rather than requiring those changes in this work order.",
    "The current page has work, kind and status facets and fixed match-strength/alphabetical ranking, but no explicit sort choice or visible removable book-context preset. The rejected candidate changed ranking silently from stored book state.",
    "The operator proposed a visible preselected book filter as an understandable alternative to hidden contextual prioritization. That is direction for the follow-up, not authorization to broaden this implementation."
  ],
  "rejected": [
    {
      "option": "Expand WO-019 into a general search redesign",
      "reason": "The operator requested a follow-up note and did not require those changes here."
    },
    {
      "option": "Reintroduce contextual ranking without a visible control",
      "reason": "It hides the search context instead of giving the reader control."
    }
  ],
  "followup": "Plan explicit catalog search controls: visible filtering and sorting, clear active-filter state and removal, and an optional current-source-book preset shown as a removable filter. Preserve all-source search and verify reset, result counts, cross-book discovery and keyboard/narrow-screen use without hidden context-based ranking.",
  "reopenWhen": "A later planning pass scopes search usability or the operator explicitly brings that work into an active order."
}
```

## WO-019-D016

```json
{
  "id": "WO-019-D016",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Preserve study disclosure state when a navigation intent keeps the same selected concept; reset it only after dispatch actually changes the selected id. Apply this to open, follow and back.",
  "evidence": [
    "The focused criteria review found that reselecting Arrive cleared the facade expansion array while the retained native disclosure stayed open. The current calculation then became null and disappeared from that visibly open section.",
    "The fix compares selected ids before and after dispatch, also preserving state for ignored invalid ids. A browser regression covers reselection through history and search, scrubbing afterward, and closing explanations when changing concepts and returning.",
    "Tools lint and unit tests and the focused real-browser regression passed at 19:16Z. The criteria worker re-read the fix and reported zero remaining findings; the design worker reported no additional design findings. Static review remains separate from executable verification."
  ],
  "rejected": [
    {
      "option": "Always clear expansion on every navigation intent",
      "reason": "Same-concept intents retain the native disclosure and must not silently erase its calculation state."
    },
    {
      "option": "Force all disclosures closed on same-concept reselection",
      "reason": "It would disrupt the reader without any change of concept."
    }
  ],
  "reopenWhen": "The operator changes reselection behavior or navigation begins retaining study components across distinct concepts."
}
```

## WO-019-D015

```json
{
  "id": "WO-019-D015",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Keep global search ordering after the operator selected round-18 A. Remove the candidate current-book priority argument and facade coupling; preserve the alternative only in screenshots and the implementation record. Explain navigation context as a source-book selection, not as inferred current work.",
  "evidence": [
    "The current search ranks title strength first and title alphabetically second. With ar, Arrive was 14th on the first page and below the initial viewport. B temporarily used the persisted selected source book as a tiebreaker within match tiers, moving Arrive to second in an AI for Games session. Both returned 2189 total matches.",
    "The operator selected A and questioned why an already active topic would be searched and how current work was inferred. The example actually began on Two-level formation steering and searched for another concept, Arrive. The original question did not explain that premise clearly.",
    "The alternative read one persisted book slug, set by selecting a shelf book or opening a concept. It had no time window, history-count threshold or activity inference. This rejected mechanism has been removed.",
    "The objective browser journey now types ar and explicitly scrolls to the first-page Arrive result before the selection click. Initial viewport visibility was a benefit of rejected B, not a claim of selected A. Exact-title keyboard Enter remains covered."
  ],
  "rejected": [
    {
      "option": "Keep current-book prioritization despite the A preference",
      "reason": "The operator selected global ordering and did not authorize inferring a preference for contextual bias."
    },
    {
      "option": "Describe stored navigation state as inferred activity",
      "reason": "That misrepresents both the premise and the mechanism."
    },
    {
      "option": "Keep the rejected ranking behind an option",
      "reason": "D014 requires removing decided alternatives during execution."
    }
  ],
  "reopenWhen": "The operator explicitly asks to change search ranking. This round does not end the ongoing content and usability process."
}
```

## WO-019-D014

```json
{
  "id": "WO-019-D014",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Amend criterion 6 and its dependent design/deliverable language so rejected alternatives are removed after each operator decision during execution. Keep only the selected implementation in application code and stories. Preserve comparison screenshots, decisions and a high-level record of rejected implementation techniques as sufficient evidence.",
  "evidence": [
    "The operator identified that non-selected branches had accumulated across nearly every comparison. The executor had retained input switches, conditional templates, CSS variants and stories after the choices were settled.",
    "The previous criterion required both initial layout stories to remain at the draft pull request. The operator explicitly directed this criterion to change: resolve the code here, preserve evidence and do not relitigate decided choices for this work order.",
    "The operator accepted screenshots and decisions as sufficient history and also authorized a high-level or exact record of the rejected component and SCSS implementations.",
    "The cleanup removes all fourteen CatalogPage comparison inputs and their downstream branches. Movement and Velocity remain as the two user-selected views of one study; data-state stories remain examples of supported product states rather than rejected designs."
  ],
  "rejected": [
    {
      "option": "Retain rejected paths until final review",
      "reason": "The operator explicitly moved that cleanup into execution and changed the criterion."
    },
    {
      "option": "Move the rejected layout into a permanent Storybook wrapper",
      "reason": "The operator accepted evidence records as sufficient and removed the requirement to keep a runnable rejected layout."
    },
    {
      "option": "Delete comparison evidence together with code",
      "reason": "The operator wants the history preserved; only executable alternatives are being removed."
    }
  ],
  "reopenWhen": "The operator explicitly changes the decision for this work order. New comparisons concern new content or usability questions and do not revive retired choices."
}
```

## WO-019-D013

```json
{
  "id": "WO-019-D013",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Add the missing numerical worked example to Arrive and use the operator-selected round-17 B behavior: follow the shared timeline. Keep the explanation in the deferred mechanism section, derive its current values only while that section is open and return keyboard focus to the corresponding diagram moment on request.",
  "evidence": [
    "The existing study described the rule and supplied pseudocode, but did not work through concrete numbers. The already authorized expansion explicitly includes a worked example.",
    "The numerical trace and the visual now use one calculation. Independent expected-value checks cover the first capped step (requested acceleration 40, used acceleration 12, next velocity 1.2, next position 0.12), a braking step and the two-condition arrival branch.",
    "Round 17 compared a stable first step with a calculation following the same timeline. The operator selected B. Both preserved the confirmed earlier preferences, including serif reading typography and multiple open explanations.",
    "Tools lint and unit tests, translation checks, component-order checks and Storybook build passed. Fifteen catalog browser tests passed; after replacing exact-equality signs in rounded arithmetic, both affected browser cases and all four desktop/mobile comparison probes passed again. Screenshot readback covered both candidate layouts and mobile calculation text.",
    "An early comparison-probe run used a button label that did not exist and timed out. Correcting the probe to the actual Cruise label produced a passing full rerun; no product failure was inferred from that probe mistake."
  ],
  "rejected": [
    {
      "option": "Leave prose and pseudocode as the only mechanism explanation",
      "reason": "The reader still has to supply the numerical connection to the visual."
    },
    {
      "option": "Maintain separate arithmetic for the visual and explanation",
      "reason": "They could drift and teach contradictory steps."
    },
    {
      "option": "Keep the worked example fixed at the first step",
      "reason": "The operator selected a calculation that follows the timeline; the fixed candidate remains only as comparison evidence."
    },
    {
      "option": "Use exact equality for rounded displayed values",
      "reason": "Two-decimal inputs can differ from the full-precision result, so the display uses approximate equality."
    }
  ],
  "reopenWhen": "The operator changes the learning interaction or a new concept requires another explanatory form. Content and usability work continues before UI polish."
}
```

## WO-019-D012

```json
{
  "id": "WO-019-D012",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Restore the exact round-12 serif reading treatment, preserve all independently selected preferences and pause cosmetic comparisons until content, usability and usefulness are addressed. Present every future pair as A.png then B.png with matching captions and question order; keep extra captures beneath the round folder.",
  "evidence": [
    "The operator explained that the round-12 folder sorted sans-serif first and serif second while the question reversed that order. Their second-candidate choice meant serif. No whole-body or title-only reinterpretation was authorized or applied.",
    "The ordering audit moved 154 historical images without deleting them, added a round manifest and placed ancillary captures in child folders. It found one other ambiguous answer: round 04. The operator explicitly reconfirmed B, several explanations open together.",
    "The operator directed content, usability and usefulness to precede UI polish. The next comparison addresses how a numerical worked example relates to the existing timeline, within the already authorized Arrive study."
  ],
  "rejected": [
    {
      "option": "Treat the machine-generated answer label as stronger evidence than the operator’s explanation",
      "reason": "The labels were reversed; the clarification identifies the actual candidate they judged."
    },
    {
      "option": "Expand serif to all body and parameter text",
      "reason": "The selected candidate changed the established reading-font treatment only."
    },
    {
      "option": "Continue cosmetic rounds immediately",
      "reason": "That contradicts the operator’s explicit order of work."
    }
  ],
  "reopenWhen": "The operator changes a preference or ends the eye doctor process; a selected candidate alone is not final acceptance."
}
```

## WO-019-D011

```json
{
  "id": "WO-019-D011",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Place related-concept links at the bottom of the complete concept article, after application details and the scene note. Apply the same position to concepts with and without an authored study. Preserve the operator's selected initially collapsed source note.",
  "evidence": [
    "The operator corrected the round-10 interpretation after round 14: the already selected bottom placement meant the full concept reading, not only the point after its authored study.",
    "The prior template placed relations before hooks and application details. The corrected template makes relations the final article element.",
    "The correction probe rendered Two-level formation steering and Arrive at 1440 and 360 pixels, asserted the final-element and below-scene-note positions, and completed relation navigation and return without page errors or overflow. Corrected images are retained in round-10."
  ],
  "rejected": [
    { "option": "Keep relations immediately after the study", "reason": "That leaves other concept sections below them and does not honor the operator's selected location." },
    { "option": "Ask the operator to choose the placement again", "reason": "The correction gives the intended placement explicitly." }
  ],
  "reopenWhen": "The operator explicitly changes the location of related concepts."
}
```

## WO-019-D009

```json
{
  "id": "WO-019-D009",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Discard round 11 as an unscored comparison. Isolate font family in round 12, preserving font size, line height, weight, spacing and layout. Subsequent pairs vary one independent feature at a time; a preference never supplies an answer for a second variable.",
  "evidence": [
    "The operator rejected the spacious-serif versus compact-sans comparison because it coupled two choices.",
    "The rejected CSS changed the reading font family, title size, body size and leading. The corrected candidate changes only the reading-font custom property.",
    "The round-12 browser probe compares computed title and definition sizes, leading, weight, letter spacing, margins and padding at both viewport widths."
  ],
  "rejected": [
    { "option": "Infer a font or density preference from round 11", "reason": "The operator did not choose either, and the comparison could not isolate the preference." },
    { "option": "Continue coupled typography comparisons", "reason": "Changing two independent features makes an A/B answer ambiguous." }
  ],
  "reopenWhen": "The operator explicitly asks to compare complete treatments or a proposed pair changes more than one independent feature."
}
```

## WO-019-D010

```json
{
  "id": "WO-019-D010",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Complete the required bookkeeping for the authorized concept-study synthesis: record its initial 4060 non-exempt bytes with a 4142-byte ceiling, and give D005's ideation dispatch a short paraphrase after its control prefix. Preserve the existing scope and acceptance criteria.",
  "evidence": [
    "The first document gate reported exactly two document-check failures: the new product document lacked ceiling metadata, and D005's bare ideation prefix lacked the required nonempty dispatch description.",
    "The checker requires measured non-exempt bytes plus two per cent for a new product document. Rounding 4060 multiplied by 1.02 upward gives 4142.",
    "The dispatch validation explicitly accepts ideation and requires a one-line description of at most 240 characters. The revised field paraphrases the already captured request."
  ],
  "rejected": [
    { "option": "Exempt the new document or change the gate", "reason": "The existing metadata route directly supports the authorized document." },
    { "option": "Treat the missing metadata as a new authorization question", "reason": "The operator already authorized the synthesis; the repair does not expand it." }
  ],
  "reopenWhen": "A later authorized product edit changes the document's scope or the document checker reports a distinct issue."
}
```

## WO-019-D007

```json
{
  "id": "WO-019-D007",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Keep the operator's preferred combination: multiple open explanations and both motion and velocity representations in a switchable space with one timeline. Continue the eye doctor process; its stopping decision remains the operator's. Normalize absent routed preview inputs locally so the production page has the same defaults as its stories.",
  "evidence": [
    "The operator chose multiple open explanations in round 04, wanted both diagrams in round 05, then chose switching between the diagrams in round 06.",
    "Both diagram arrangements passed bounded browser interaction and overflow checks at 1440 and 360 pixels. The switch preserves the timeline position.",
    "The full browser suite exposed absent controls in the routed page while the direct Storybook component still worked. The shared router enables withComponentInputBinding, whose documented default supplies undefined for unmatched inputs. The failure snapshot contained the figure legend but no diagram or time control.",
    "Local input transforms now validate preview options and supply defaults for missing or invalid values. The shared router configuration is unchanged; the existing browser control test exercises the actual route.",
    "The operator asked how to extend this depth across the full catalog. The planning handoff now records the proposed separate content model, varied pilot, reusable visual families, reviewed batches and explicit enrichment backlog. That program is planning input, not a claim of completed enrichment."
  ],
  "rejected": [
    { "option": "Choose one diagram and discard the other", "reason": "The operator found both useful and preferred switching between them." },
    { "option": "Change global router input behavior for a preview-specific issue", "reason": "Local normalization repairs this page without changing other routed components." },
    { "option": "Treat the single study as catalog-wide completion", "reason": "The study is a pilot; the content-authoring system and full enrichment backlog remain to be planned and delivered." }
  ],
  "reopenWhen": "The operator changes the preferred interaction, ends the comparisons, or the varied enrichment pilot needs a different content or visual model."
}
```

## WO-019-D006

```json
{
  "id": "WO-019-D006",
  "date": "2026-10-26",
  "dispatch": "resume: direction",
  "decision": "Carry forward the preference for expandable explanations. On the operator's request to test deferred Angular rendering, use an explicit expansion condition with @defer and a standalone explanation component referenced only inside deferred blocks. Retain a loaded view when collapsed; render the inexpensive time-scrubbed illustration immediately. Continue comparisons until the operator ends them.",
  "evidence": [
    "The operator chose B in the depth comparison, then asked to test deferred rendering on expansion unless the control already handled it. In round 04 they also chose B, allowing several explanations to remain open for cross-reference; multiple disclosure is now the default.",
    "Current Angular documentation fetched through Context7 states that when is a one-time trigger, and code splitting requires standalone dependencies without eager references in the same file.",
    "A bounded native-disclosure browser probe found both code blocks in the DOM before opening any section, after opening one and after closing it.",
    "The optimized production probe found zero explanation views initially, one after first expansion, and the same retained code block after collapse. First expansion fetched one additional component chunk; reopening and opening the second section fetched no additional chunk. The second section instantiated only when visited.",
    "The production bundle check passed with 393615 initial bytes and no catalog/menu code in the initial graph. This is an intermediate identity, not the final gate. The explanation code and pseudocode are deferred; the translation catalog remains shared.",
    "The browser regression proves zero explanation views before expansion, a first-visit script download and retained views without another download when reopened. Its offline failure case confirms a failed script request and readable error. The initial failure-test attempt used page routing, which MSW bypassed; browser-context offline emulation tests the actual failed download.",
    "The existing performance sampler used the replaced row/filter UI. Its journeys are being aligned with search, current facets, paging and concept opening so the measurement remains executable. This is a necessary validation update for this feature."
  ],
  "rejected": [
    { "option": "Assume native details performs lazy Angular creation", "reason": "The browser observation showed that hidden explanations already existed." },
    { "option": "Use only @if to destroy content on every collapse", "reason": "Deferred first creation also supplies the intended code-loading boundary and preserves the loaded view; this example has no continuing animation work to stop." },
    { "option": "Declare all UI or translations deferred", "reason": "The visual and shared messages remain available up front; only the explanatory component is behind the tested boundary." }
  ],
  "reopenWhen": "Measurements show the boundary costs more than it saves, the operator prefers different disclosure behavior, or retained animated content needs a pause/disposal contract."
}
```

## WO-019-D005

```json
{
  "id": "WO-019-D005",
  "date": "2026-10-26",
  "dispatch": "ideation: consider Mermaid, Manim and custom drawings for deeper concept explanations",
  "decision": "Capture and synthesize the operator's concept-depth direction into the idea ledger and instance product document. Extend WO-019 with one authored Arrive study: custom step-through drawing, concrete example, ordinary and RxJS pseudocode, limits and checked public references. Keep the source definition and its provenance intact, add no runtime dependency, and keep Mermaid and Manim as medium candidates. Preserve the side-contents preference and use the next rendered pair to compare the deeper reading experience. Continue comparisons until the operator explicitly ends them.",
  "evidence": [
    "The operator said the improved UI still lacked conceptual depth, named several explanatory forms and explicitly said not all of the vision must be completed in this order.",
    "The subsequent ideation dispatch proposed Mermaid, Manim and custom high-level drawings as possible explanatory media.",
    "The ignored capture and SHA-256 are recorded in ideation.md. Committed prose uses Shape-First Synthesis; no direct-draft exception or suspect source was found.",
    "The existing catalog contains Arrive and its source definition. A separate authored example can demonstrate several views of one idea without changing the source-join contract or implementing the later soldier scene.",
    "The work order now names this bounded scope and the receipt as required verifier and reviewer inputs. The full vision remains a product direction rather than an assertion of completed enrichment."
  ],
  "rejected": [
    { "option": "Only record the idea and continue cosmetic comparisons", "reason": "The operator's requested trend is conceptual depth; one representative study makes that direction reviewable now." },
    { "option": "Enrich all 3,463 concepts or install every proposed visual tool", "reason": "The operator expressly allows an incremental direction and names possible media, not a mandatory platform." },
    { "option": "Mix newly authored examples into the mined definition", "reason": "That would obscure provenance and make source regeneration overwrite the study." }
  ],
  "reopenWhen": "The operator changes the slice, the comparison exposes a missing explanatory connection, or reference/behavior checks contradict the proposed example."
}
```

## WO-019-D003

```json
{
  "id": "WO-019-D003",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Treat the eye doctor test as an ongoing pairwise design process. Present two concrete rendered alternatives, use the operator's preference to produce the next comparison, and repeat until the operator explicitly says the process is done. A preference advances the comparison and does not complete design acceptance. Ranking may assist the comparisons but cannot replace the operator's stopping decision.",
  "evidence": [
    "The executor initially described the two layouts as a later screenshot choice, incorrectly implying a single comparison.",
    "The operator corrected that interpretation during this execution on 2026-10-26 and specified repeated choices until they say the process is done.",
    "The two initial stories named in the order are the first pair, not a limit on refinement. The correction governs this execution and is retained for the planning handoff."
  ],
  "rejected": [
    { "option": "Treat one preferred candidate as final approval", "reason": "The operator explicitly rejects that stopping rule." },
    { "option": "Converge automatically using an Elo score", "reason": "Ranking is optional assistance; the operator decides when to stop." }
  ],
  "reopenWhen": "The operator changes the comparison method or explicitly ends the design process."
}
```

## WO-019-D001

```json
{
  "id": "WO-019-D001",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Execute the catalog reading surface in the selected target worktree, retaining the existing loader seam, explicit providers and event-backed persistence. The executor remains the only coding writer. Reserve two fresh Codex review workers, one criteria adversary and one design improver, with gpt-6.1-sol at max effort and no inherited conversation.",
  "evidence": [
    "Canonical status selected WO-019 active with the WO-014 dependency met. The target worktree was clean on wo-019 before edits.",
    "The dispatch readback reports Codex CLI 0.164.0, gpt-6-astra, max effort, codex-session-readback.",
    "Entry harness usage reports zero observed subagents, cap 20, remaining 20, with uncounted remainder unknown.",
    "The operator's follow-up identifies the full 2026-10-22 research-run directory as available context; the named maps and design remain the inputs used so far."
  ],
  "rejected": [
    { "option": "Replace the loader or add a runtime dependency", "reason": "The existing seam and persisted-state feature support this deliverable." },
    { "option": "Leave the browser unchanged", "reason": "It supplies titles but none of the reading session the order requires." }
  ],
  "reopenWhen": "Executable evidence exposes a missing capability or the operator changes scope."
}
```

## WO-019-D002

```json
{
  "id": "WO-019-D002",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Join the declared map rows without rewriting their definitions, hooks or verification notes. Resolve relations by unique exact concept title within the same work; preserve an unresolved or ambiguous title with a null id. Preserve line-based identities. Read v0 checkpoints for one release with an explicit unavailable-definition message, never an invented definition.",
  "evidence": [
    "The bounded source inspection found all eleven stored SHA-256 digests matching and all 3,463 source rows carrying a chapter.",
    "The maps README and design-toolbox-toy-scene.md match the work order's pinned digests.",
    "The maps README identifies definitions as the mapping workers' words, and distinguishes sourced, model-knowledge and partial verification.",
    "WO-019 and corrected WS-001 rule 23 explicitly authorize carrying these reference works as catalog data. The join reads only the eleven declared map paths; no quarantine file is an input."
  ],
  "rejected": [
    { "option": "Generate fresh definitions", "reason": "The run already supplies the intended text." },
    { "option": "Guess a relation target from a partial title", "reason": "A plausible link can misstate the relationship; unresolved text remains readable." },
    { "option": "No join", "reason": "It leaves the catalog's central content missing." }
  ],
  "reopenWhen": "A source digest changes or evidence supports an explicitly reviewed relation disambiguation."
}
```

## WO-019-D004

```json
{
  "id": "WO-019-D004",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Type the source-warranted steering terms and formation parameters without extending TransformKind. Seek, Arrive, Velocity matching, Wander and Separation use steer.blend; Scalable formations, Formation pattern interface and Slot assignment use formation.twoLevel. Two-level formation steering selects three or more units. Keep Random binomial as Wander’s step-scale parameter and a readable related concept. The objective remains the scene’s own action, and no new squad membership transform is asserted.",
  "evidence": [
    "The source rows aifg-a:110, 112, 118, 125 and 131 describe acceleration toward a target, velocity matching, binomial wander and neighbour repulsion.",
    "Rows 175 and 181 describe count-dependent formation geometry and the pattern interface. Row 186 describes a most-constrained-first assignment using character-by-slot costs.",
    "The whole part-A title inspection found no Target row or literal group/squad membership operation. Targeter describes a pipeline stage, and Membership function describes fuzzy logic; neither is forced into an objective or squad action.",
    "Existing Flocking, Priority steering, Fixed formations and Two-level formation steering keep their kinds. The latter now exposes anchor-to-mean distance, slot error and assignment cost as the order requires.",
    "Pattern 0/1/2 denotes wedge/line/column; the nine role-cost parameters cover close-combat, ranged and support. Initial cost is zero for a matching role and one otherwise; these are toy defaults, not assertions about the book. The later scene owns interpretation and execution.",
    "The successful join validated all inputs before writing eight v1 checkpoints and their summary. Earlier attempts made no data writes: dependencies were absent, then the draft historical-shortfall assertion incorrectly expected three; the existing summary showed one and the assertion was corrected."
  ],
  "rejected": [
    {
      "option": "Invent a Target concept or turn a fuzzy membership function into squad membership",
      "reason": "The source definitions do not warrant those contracts."
    },
    {
      "option": "Leave the named steering rows untyped",
      "reason": "Their definitions specify the behavior the scene floor needs."
    },
    {
      "option": "Run a new classification fan-out",
      "reason": "This is a bounded set of source-warranted changes; the remaining classifications stay as recorded."
    }
  ],
  "reopenWhen": "WO-015 finds that a declared parameter cannot be interpreted, or a source row actually warrants an objective or membership operation."
}
```

### Joined source digests

| Map | Rows | SHA-256 |
| --- | ---: | --- |
| ai-for-games-3e-part-a.jsonl | 389 | 5252167b924021b26a4ed2d9e9df5beee78b374dbd60089565ff2cde34f7d870 |
| ai-for-games-3e-part-b.jsonl | 379 | ebc3793e94fd84a008775c061851ebf849b9669477dfdfdefdb3a8a9880434b3 |
| enterprise-integration-patterns.jsonl | 288 | 53bcf751d362b920b638f1673d4312ccc0d5d474b116e684cb6b51cae33e9d2b |
| geb-map-part-1.jsonl | 237 | 41f4e58e581b4df80861e11cc5fc2a9c51c02b8061ce80d511703e9b446a71dc |
| geb-map-part-2.jsonl | 336 | d1acbd4f0cd5ee6de7cdeccf1847287d50a4d3778146f74ab8279580373f7f05 |
| map-part-1.jsonl | 364 | 53ffa503be3aaebb03b06b265679d8a3bb2b98aeb375fa7e24a80d41b37c8308 |
| map-part-2.jsonl | 134 | 39138bd49a1e3e1cf18580285892fa8cb9847b94ee8c8cfe3ec7edb292e2de2a |
| map-part-3.jsonl | 139 | 676b9592a6901803ee08cdebd5ad1b7fd2a7c4affc5dd6f87e606b46da4bdd91 |
| poeaa.jsonl | 455 | 216fd5eaad7da111367ee23a136fd60283cf67185b950fade0983ea7d48ae468 |
| rxjs-core.jsonl | 481 | c8e2acd0ad804b15bf86db47d58f7a2d041c391ed7e74ad2df615c9ba69d52fb |
| rxjs-patterns.jsonl | 261 | 7a3cd3b794d277f07dcd94c5625b8e1046d61f1c8ab9bd8685b2a8052dd69d84 |

## WO-019-D008

```json
{
  "id": "WO-019-D008",
  "date": "2026-10-26",
  "dispatch": "resume: next",
  "decision": "Keep the separate movement legend selected in round 08. Identify each subsequent comparison by round and subject in its question and image captions, and always present A before B. Compare headings alone with short previews for the collapsed explanation sections next. Correct the catalog's selected work facet to display its title while retaining the work slug as the filter value.",
  "evidence": [
    "The operator selected A in round 08 and corrected both the missing round label and the reversed answer-option ordering. No final design acceptance was given.",
    "The performance sampler reached the Enterprise Integration Patterns selection but observed Work eip, where the selected option was labeled Enterprise Integration Patterns. The catalog had passed the raw filter value to a display-only input.",
    "The facet display fix is local to the catalog view model and template; selection and persistence continue using the work slug. The original sampler assertion is retained for the next execution."
  ],
  "rejected": [
    { "option": "Present the recommended answer before its A/B counterpart", "reason": "It makes the visual comparison and answer order inconsistent." },
    { "option": "Accept the internal work code as the selected label", "reason": "The reading surface already names the work in full and should preserve that meaning after selection." },
    { "option": "Stop after the round 08 preference", "reason": "Only the operator's explicit stopping decision ends the comparison process." }
  ],
  "reopenWhen": "The operator changes a preference or the rendered comparison exposes a readability problem."
}
```

## WO-019-D022

<!-- integration refs/dotln/checkpoint/WO-019/2 -->

```json
{
  "id": "WO-019-D022",
  "date": "2026-10-28",
  "dispatch": "resume: next; operator scope expand: integrate main; worktree integrate WO-019",
  "decision": "Integrate the launchpad's main (567d22b: starter v0.100.0 and the 2026-10-28 planning pass) into this WO-019 worktree now, at the operator's request, through main's integrate helper instead of waiting for the handoff. The helper fast-forwarded from d3e0775 and re-applied this order's uncommitted record unchanged. Resolve the idea ledger by keeping both new dated sections newest first and regenerate the lineage index from it. Re-bind the unchanged operator-authorized execution amendment to receipt 012, which the integration made the current planning receipt. The target repository takes in nothing because DotLn-Angular main is still at this order's base.",
  "evidence": [
    "The operator wrote 'scope expand: integrate main' during this resume: next dispatch on 2026-10-28. Main's v0.100.0 executor text admits the integrate helper while an order is active and runs it when main moved or when the operator asks. The worktree was 12 commits behind main, with merge base d3e0775.",
    "refs/dotln/checkpoint/WO-019/2 preserves the pre-integration tree. Base d3e077564b80f682d4cfe26bdb57d7a0028f1ff8, upstream 567d22b05d5830bcdb2771f93fcef3a0f6e1790f; a fast-forward, so there is no merge commit. The named stash be6d63a2aa0fa4d1ea742637b9d58a3f59db1338 was the only stash entry (the stack was empty before the run) and the helper dropped it after complete application; its recovery record is under docs/control/local/integration-stash-drops/.",
    "After application, 398 WO-019 paths (evidence, control log, concept study, the order, document ceilings, plan log, control projection and decisions index) matched the checkpoint by blob hash. The ignored intake was archived outside the worktree before the run, as the helper requires, and was not changed.",
    "The helper resolved the follow-up register by union and the work-order index as a projection. The idea ledger's one conflict joined main's 2026-10-28 planning section and this order's 2026-10-26 concept-study section: the result adds 26 lines to main's version and 14 to the pre-integration version and removes none. node scripts/lineage.mjs index --check passed with 13 sections and 3 idea entries.",
    "npm run plan -- check then failed with 'changed criterion has no text-bound disposition or authorized execution amendment: WO-019 criterion:6', because the continuation admits only amendments bound to the latest planning receipt and the WO-019-D014 binding named receipt 011. Receipts 011 and 012 judged identical WO-019 text (source hash sha256:fda8dece…), and the current order still matches the D014 binding (29,779 characters, sha256:a1063689…). npm run plan -- amend-order WO-019 WO-019-D014 re-bound those same bytes to receipt 2026-10-28-planning-7f5e44638facd299-012, and the plan check then exited 0.",
    "The affected checks the helper printed: node scripts/harness.mjs check passed (35 generated surfaces), npm run publication:check passed (no editions declared) and npm run release -- check-surfaces --local exited 0 with no FAIL line. npm test -- --review remains owed as the handoff's complete run.",
    "release preparation: WO-019: target order records no release; no files changed. git ls-remote on 2026-10-28 reads DotLn-Angular main at 1c3a4ff24e38d179d0fd1ad910bc6719c2740045, this order's base and the target worktree's base."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or drop a stash before application completes",
      "reason": "Both histories and unfinished recovery material must remain available."
    },
    {
      "option": "Defer the integration until just before the complete handoff run",
      "reason": "That is the v0.100.0 default when main moved, but the operator asked for it now, and integrating first runs the remaining work under the current kit."
    },
    {
      "option": "Run this worktree's pre-update integrate helper",
      "reason": "The executor text names main's current helper; the copy at d3e0775 admits only repairing and final-review orders and would refuse this active one."
    },
    {
      "option": "Keep only one side of the idea ledger, or hand-merge the lineage index",
      "reason": "Either side alone loses a dated session; the index is generated from the ledger, so it is regenerated instead."
    },
    {
      "option": "Leave the plan check failing for review or a later planning pass",
      "reason": "The integration caused the failure, the operator authorization and approved bytes are unchanged, and amend-order is the established route for binding them to the current receipt."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance (return that finding through repair and fresh independent verification); main moves again before the complete handoff run (integrate again); or a later planning receipt judges this order's text differently from receipt 012."
}
```

Integration date: 2026-10-28. Original base: `d3e077564b80f682d4cfe26bdb57d7a0028f1ff8`.
Fetched main: `567d22b05d5830bcdb2771f93fcef3a0f6e1790f`. Checkpoint: `refs/dotln/checkpoint/WO-019/2`.
Named stash dropped after completed application: `be6d63a2aa0fa4d1ea742637b9d58a3f59db1338` (WO-019 integrate 2026-10-28).
Resolved projections: docs/planning/followups.json, docs/work-orders/README.md.
Release preparation: WO-019: target order records no release; no files changed.
Carried-forward claims: assessed by the executor on 2026-10-28; no acceptance judgment recorded. This order's records came across byte-identical. Launchpad check results recorded before this integration (the document gate pass of 2026-10-26) were already stale and are re-established only by the handoff's complete and document runs on the integrated tree. Target-side evidence (design rounds, walkthrough, usability, performance and preflight) concerns DotLn-Angular, whose base did not move, and keeps its own recorded cutoffs. The host qualification records the 2026-10-26 Codex episode on the pre-update kit; this Claude Code episode on the v0.100.0 kit is added at handoff. The new kit changes this order's remaining executor procedure (three fresh independent reviewers before the complete run and a consistency check of the final write-backs) and no acceptance criterion.
Authored conflicts observed: docs/lineage/README.md, docs/lineage/idea-ledger.md.
Affected checks are printed by the command; results remain untested until executed.

## WO-019-D023

<!-- integration refs/dotln/checkpoint/WO-019/3 -->

```json
{
  "id": "WO-019-D023",
  "date": "2026-10-28",
  "dispatch": "resume: next; the operator's direction to integrate main so the refused target write is unblocked; worktree integrate WO-019",
  "decision": "Integrate the launchpad's main (1958e2b: starter v0.101.0 through #35 and the second 2026-10-28 planning pass through #36) into this WO-019 worktree a second time, through main's integrate helper, at the operator's direction during this dispatch. The helper fast-forwarded from 567d22b and re-applied this order's uncommitted record. Resolve the generated lineage index by regenerating it from the cleanly merged idea ledger. Reinstall with npm ci and re-emit the harness so this worktree's hooks run the v0.101.0 snapshot, whose executor grant kind target-worktree admits writes into the registered target worktree that the outside-write refusal refused at 13:12:32Z this morning. Re-bind the unchanged D014 amendment to receipt 013, which the integration made the current planning receipt. The target repository takes in nothing because DotLn-Angular main is still at this order's base.",
  "evidence": [
    "The operator directed, during this resume: next dispatch on 2026-10-28, that main be integrated because it would unblock the refused target write (capture 66335ad0…). Main's planning pass of the same day (docs/planning/standard-pass-v0-101-0-2026-10-28.md, D3) records this route: integrate a second time with the main checkout's helper, run npm ci and harness emit in the worktree, ask the round-22 pair, and let the new grant judge the first Edit into the target worktree. The worktree was 18 commits behind main with merge base 567d22b.",
    "refs/dotln/checkpoint/WO-019/3 preserves the pre-integration tree. Base 567d22b05d5830bcdb2771f93fcef3a0f6e1790f, upstream 1958e2bbfef676ad05011cb71ea599004a385420; a fast-forward, so there is no merge commit. The stash stack was empty before the run; the helper's named stash f56b11c883e8296c652545dcc28b16e32c8682e8 was dropped after complete application and its recovery record is under docs/control/local/integration-stash-drops/. The ignored intake was archived to this session's DotLn scratch with npm run backup:intake before the run; the helper verified that the archive holds every ignored intake file's current bytes, and the intake was not changed.",
    "Compared by blob hash after application, 396 of the checkpoint's 401 files in this order's record and the shared files it edits are identical, none is missing and no evidence file was added. The five that differ: this decisions file gained this record; the decisions index and the follow-up register were regenerated (the register is the union: 222 lines from main and 15 from this order, none removed); the idea ledger merged without conflict (26 lines more than main's version and 15 more than the pre-integration version, none removed, newest first); the repository profile carries main's one changed line beside this order's own edits.",
    "The one authored conflict was docs/lineage/README.md, a generated index. It was regenerated with node scripts/lineage.mjs index from the merged ledger, and node scripts/lineage.mjs index --check passed with 14 sections and 3 idea entries.",
    "package.json was unchanged and package-lock.json changed only the workspace package versions (compiler 0.32.0, skeleton 0.71.0, console). No root or workspace package declares an install lifecycle script. npm ci exited 0 and node scripts/harness.mjs emit wrote 35 generated surfaces with no tracked drift. The executor skill's grant line now reads system-temp, session-scratch, host-scratchpad, target-worktree, and the harness manifest declares contributor.target-worktree. The local target registry holds exactly one WO-019 row whose launchpad is this worktree's physical root and whose absolute target resolves to the DotLn-Angular-wo019 worktree; this was checked without printing its values.",
    "The affected checks the helper printed: node scripts/harness.mjs check passed (35 generated surfaces), npm run publication:check passed (no editions declared) and npm run release -- check-surfaces --local exited 0 with 48 PASS lines and no FAIL line. npm test -- --review remains owed as the handoff's complete run.",
    "npm run plan -- check then failed with 'changed criterion has no text-bound disposition or authorized execution amendment: WO-019 criterion:6', the failure D022 met: receipt 2026-10-28-planning-79fa2937a6b5812e-013 became the latest receipt while the D014 binding named receipt 012. Receipt 013's subject hashes main's committed WO-019 text (sha256:f13876f9…, which is sha256:fda8dece… without its final newline), the source receipts 011 and 012 judged, and the current order still matches the D014 binding (29,779 characters, sha256:a1063689…). npm run plan -- amend-order WO-019 WO-019-D014 re-bound those same bytes to receipt 013, and the plan check then exited 0 with no advisories.",
    "release preparation: WO-019: target order records no release; no files changed. git ls-remote on 2026-10-28 reads DotLn-Angular main at 1c3a4ff24e38d179d0fd1ad910bc6719c2740045, this order's base; the target worktree is on wo-019 at that commit, and this integration did not touch its 77 uncommitted paths."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or drop a stash before application completes",
      "reason": "Both histories and unfinished recovery material must remain available."
    },
    {
      "option": "Continue under an interim route instead: a Codex session with --add-dir, or operator override: in this Claude session",
      "reason": "The carrying release is on main and the operator directed the integration; the planning pass's safe default was neither, and an override would suspend every refusal for the session rather than admit the one target root."
    },
    {
      "option": "Write the intake archive to the backup script's default location beside the repository",
      "reason": "That directory is outside every root this role is granted; this session's DotLn scratch is a granted root, and the helper needs the archive only for this integration."
    },
    {
      "option": "Hand-merge the conflicted lineage index",
      "reason": "It is generated from the ledger, which merged cleanly; regeneration is the resolution that keeps it checkable."
    },
    {
      "option": "Leave the plan check failing for review or a later planning pass",
      "reason": "The integration caused the failure, the operator authorization and approved bytes are unchanged, and amend-order is the established route (D022) for binding them to the current receipt."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance (return that finding through repair and fresh independent verification); the first Edit into the target worktree is not judged granted with kind target-worktree (the route is then wrong and is reported, not worked around); main moves again before the complete handoff run (integrate again); or a later planning receipt judges this order's text differently from receipt 013."
}
```

Integration date: 2026-10-28. Original base: `567d22b05d5830bcdb2771f93fcef3a0f6e1790f`.
Fetched main: `1958e2bbfef676ad05011cb71ea599004a385420`. Checkpoint: `refs/dotln/checkpoint/WO-019/3`.
Named stash dropped after completed application: `f56b11c883e8296c652545dcc28b16e32c8682e8` (WO-019 integrate 2026-10-28).
Resolved projections: docs/work-orders/README.md.
Release preparation: WO-019: target order records no release; no files changed.
Carried-forward claims: assessed by the executor on 2026-10-28; no acceptance judgment recorded. This order's records came across byte-identical apart from the five files named in the evidence. Launchpad check results recorded before this integration were already stale and are re-established only by the handoff's complete and document runs on the integrated tree. Target-side evidence (design rounds, walkthrough, usability, performance and preflight) concerns DotLn-Angular, whose base did not move, and keeps its own recorded cutoffs. The host qualification records the 2026-10-26 Codex episode; this Claude Code episode, now on the v0.101.0 kit, is added at handoff. The new kit adds one outside-write grant kind for this role (target-worktree) and changes no acceptance criterion and no other step of the remaining executor procedure.
Authored conflicts observed: docs/lineage/README.md.
Affected checks are printed by the command; results remain untested until executed.

## WO-019-D034

<!-- integration refs/dotln/checkpoint/WO-019/8 -->

```json
{
  "id": "WO-019-D034",
  "date": "2026-10-28",
  "dispatch": "resume: final review; worktree integrate WO-019",
  "decision": "The integration is a no-op, and no launchpad complete run is owed. The order worktree was already at fetched main 1958e2bbfef676ad05011cb71ea599004a385420 (the launchpad's main after the second 2026-10-28 planning pass, #36), so the helper moved no launchpad byte and merged nothing; its named stash was applied in full and dropped. This target order consumes no launchpad complete row: its criteria name the target gates and npm run test:docs (D031), and the result transition for a target order reads the target review row at the target's tree and the document row for the working tree. The three other affected checks the helper printed ran green. Carried-forward claims: VER-001's nine criterion judgments at target tree 0c45e8128a3f2e3ee9c2398d4228d35ff05cae54, which is the tree of the reviewed commit 261982f2cc7e0fca8234faa4b41dceb5e9962bf0 this review made from the verified working tree without changing a byte, so the review gate row target-gate:b8eb4bb0-482c-4019-86ac-f9d5474ec707 covers the reviewed commit; this review reproduced the cheap claims itself (D036). The draft pull request #8 on feat/catalog-reading at 062e8007 carries the same tree and is reused by the final publish. No component version collides: release preparation returns the target-order no-op and no component manifest changed.",
  "evidence": [
    "refs/dotln/checkpoint/WO-019/8",
    "base 1958e2bbfef676ad05011cb71ea599004a385420",
    "upstream 1958e2bbfef676ad05011cb71ea599004a385420",
    "release preparation: WO-019: target order records no release; no files changed.",
    "npm run worktree -- integrate WO-019 --intake-backup <session-scratch>/final-review/intake-backup/DotLn-Instance-wo019-intake-20261028T232518Z.zip (the three ignored intake files archived to the DotLn session scratch first, because the helper refuses to run over ignored intake without a named backup): Bases 1958e2bb… -> 1958e2bb…, authored conflicts none, checkpoint refs/dotln/checkpoint/WO-019/8, named stash 7aaaef636638122f410aeaa4e3b60a6f62b67a16 (WO-019 integrate 2026-10-28) dropped after complete application; the stash stack was empty before and after; 438 untracked record paths present afterwards, git diff --check clean, both intake files at their digests (5742f0a7… and 66335ad0…).",
    "Affected checks as printed: npm run publication:check (publication: no editions declared, exit 0), node scripts/harness.mjs check (35 generated surfaces; local-terms list present, exit 0), npm run release -- check-surfaces --local (48 PASS lines, no FAIL, exit 0). npm test -- --review was not started: D031 records that nothing in this target order consumes a launchpad complete row, and the executor's own run of it was stopped at the operator's question.",
    "git log wo-019..main and main..wo-019 are both empty in the launchpad before and after the run; git ls-remote reads DotLn-Angular main at 1c3a4ff24e38d179d0fd1ad910bc6719c2740045, this order's base, and feat/catalog-reading at the draft commit 062e8007794eb8adce0b98427d7f7b81e9675794, whose tree is 0c45e812…."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or drop a stash before application completes",
      "reason": "Both histories and unfinished recovery material must remain available."
    },
    {
      "option": "Start npm test -- --review for the ritual",
      "reason": "This target order's criteria name no launchpad suite, the result transition consumes no complete row for it, and the identity, not the dispatch time, says what was tested (D031)."
    }
  ],
  "reopenWhen": "A later integration moves a launchpad code byte before the records publish; the target's main advances past 1c3a4ff24e38d179d0fd1ad910bc6719c2740045 before the final publish; or the final publish refuses its Change table or commit range."
}
```

Integration date: 2026-10-28. Original base: `1958e2bbfef676ad05011cb71ea599004a385420`.
Fetched main: `1958e2bbfef676ad05011cb71ea599004a385420`. Checkpoint: `refs/dotln/checkpoint/WO-019/8`.
Named stash dropped after completed application: `7aaaef636638122f410aeaa4e3b60a6f62b67a16` (WO-019 integrate 2026-10-28).
Resolved projections: none.
Release preparation: WO-019: target order records no release; no files changed.
Carried-forward claims: VER-001's criterion judgments at tree `0c45e812…`, the tree of the reviewed commit `261982f2…`; reproduced where cheap by FINAL-001 as D036 records; no launchpad complete row is consumed (D031).
Authored conflicts observed: none.
Affected checks: `publication:check`, `harness check` and `release check-surfaces --local` ran green after the integration; `npm test -- --review` not started (D031).

## WO-019-D035

```json
{
  "id": "WO-019-D035",
  "date": "2026-10-28",
  "dispatch": "resume: final review; the records repair D033 routed to final review",
  "decision": "Paraphrase the operator's verbatim messages of 2026-10-28 in this file (D023, D024, D025, D027, D031 and D032), design/rounds.json, design/comparisons.md and design/round-22/README.md before the records are committed or published, and cite the ignored capture that holds the words as the executor recorded them. Prune from this branch's uncommitted follow-up register the two earlier revision summaries (the D031 and D032 rows) that carried the same quotations; the committed register on main holds neither row, so no committed history is rewritten. Settle FUP-2b0df90366e5fed0. The decisions, the operator's preferences and the comparison stopping state are unchanged.",
  "evidence": [
    "The operator record refuses direct quotes of their messages in a committed file of this fork or of DotLn-Angular unless a draft was marked ready to file; VER-001's F1 and D033 found the quotations and routed the repair to final review before records publication. No ready-to-file authorization exists for any of these messages.",
    "No live capture of the 2026-10-28 session exists in this worktree's ignored intake, only the 2026-10-26 ideation capture (5742f0a7…). The final review wrote docs/intake/notes/WO-019-operator-directions-2026-10-28.md from the executor's records before editing them, labelled as a transcription carrying the executor's times, SHA-256 66335ad095bbe814cd112c289b21b176429313d99f9a2dd31f1f3d1ce7d87dd2; the pre-repair bytes of this file are also in the local checkpoint refs/dotln/checkpoint/WO-019/7.",
    "Twelve replacements in four files, each matched exactly once; a grep for the quoted phrases over the evidence directory prints nothing afterwards; rounds.json still parses. The register rows for D031 and D032 keep one revision each after the prune, npm run plan -- followups --sync accepts the register, and the touching listing reads it back.",
    "Not changed: D022's scope expand: integrate main, a control phrase rather than prose; the executor session's own plan quoted in D024's evidence, which is that session's text, not the operator's; and the ideation capture's citation in D005."
  ],
  "rejected": [
    {
      "option": "Leave the quotations and board them for planning",
      "reason": "D033 routed the repair here, the records publish is this review's step, and the rule is the operator's standing direction."
    },
    {
      "option": "Delete the words rather than preserve them",
      "reason": "The operator's directions are theirs; the ignored intake keeps them, and the capture digest makes each paraphrase checkable."
    },
    {
      "option": "Rewrite the committed register history",
      "reason": "The committed register holds neither row; only this branch's uncommitted revisions carried the quotations."
    }
  ],
  "reopenWhen": "A committed WO-019 record is found to quote the operator verbatim without a recorded ready-to-file authorization, or the operator marks one of these messages ready to file."
}
```

## WO-019-D036

```json
{
  "id": "WO-019-D036",
  "date": "2026-10-28",
  "dispatch": "resume: final review; FINAL-001 acceptance and the publication that follows it",
  "decision": "Accept WO-019 in FINAL-001 with every criterion met and record pass. Criterion 1, which the executor recorded unmet because it is the verifier's to perform, is judged met on VER-001's walkthrough: every step completed at 360, 768 and 1440 pixels in the served production build, thirty screenshots under docs/evidence/WO-019/walkthrough, and the verifier's own account of Two-level formation steering and Slot; no waiver or amendment was needed. Commit the verified working tree as one commit, 261982f2cc7e0fca8234faa4b41dceb5e9962bf0, subject 'feat: make the catalog something to read', with a plain body and no launchpad identifier, 105 files against the base 1c3a4ff24e38d179d0fd1ad910bc6719c2740045 and tree 0c45e8128a3f2e3ee9c2398d4228d35ff05cae54, the tree the review gate row and the draft pull request already carry: the review changed no target byte, so no gate rerun is owed, and the one reviewed change is not separable into commits that could each be checked on their own. After the result: target-records adds the records commit; the instance records are committed; the target publish reuses draft pull request #8 on feat/catalog-reading with the reviewed title and PR.md and marks it ready; then the instance records branch is published with RECORDS-PR.md. Register rows this review disposes: FUP-2b0df90366e5fed0 settled (D035). Rows left as they are, with their owners: the target follow-ups of D028, D029 and D030 (the scene link, addressable readings and the home's loading, the study's maintainability) for WO-015 and the catalog's next order; D017's search controls, D027's house-rule and operator-record carry, D031's question to core and D032's profile review for the next planning pass; and the deferred planning candidates that only name this order and reopen when its records merge.",
  "evidence": [
    "Reproductions at the verified tree before the commit, under node scripts/harness.mjs bounded -- where a process ran: npm run catalog:check exit 0 (8 checkpoints, 3463 tools); npm run catalog:report exit 0 listing the 16 AI for Games scene tools, the ten named concepts among them, each in steer.blend, steer.priority, formation.twoLevel, formation.fixed or objective.set, and the relation fractions the evidence README records; npm run test:tooling 41 of 41; npm run check:bundle exit 0 with initialBytes 393633, lazyCodeInInitial [] and menuAvailableWithTools true; grep -rlE '<dl|dotln-key-value-list' libs/features/tools/src prints nothing and the Layout count in the catalog-page stories is 1; grep -rl assertScrubbed tools/scripts/catalog prints nothing; grep -c 'ids, short titles' prints 0 for both documents and grep -c 'clean room' prints 1 for the rules; the dependency keys and versions equal the base's; ls docs/evidence/WO-019/walkthrough | wc -l prints 72, thirty of them the verifier's; git diff --check is clean in both worktrees.",
    "The target working tree's hash, computed through a temporary index, was 0c45e8128a3f2e3ee9c2398d4228d35ff05cae54 before the commit, equal to the review gate row target-gate:b8eb4bb0-482c-4019-86ac-f9d5474ec707 (install, lint, test, format, build, e2e and visual, 62,216 ms, recorded 2026-10-28T22:44:09Z) and to the draft commit 062e8007's tree; targetGateEvidence matches rows by that tree hash. The commit's tree is the same hash, its author and committer are the operator's public identity, and the target's status is clean.",
    "The reviewed commit's message passes node scripts/outward-lint.mjs commit --target, as do the title and branch for pr-title and branch; PR.md and RELEASE-NOTES.md pass pr-body --target and release-body --target, and RECORDS-PR.md passes pr-body, each with zero review matches.",
    "gh pr view 8: an open draft on feat/catalog-reading at 062e8007, mergeable, CI checks 'checks', 'visual' and 'title' all SUCCESS (completed 23:04Z to 23:10Z), no reviews, no comments and no review threads, so there was no operator item to route.",
    "Three of the verifier's screenshots were read as images: ver001-04-formation-1440.png (the definition in a reading measure, the hook sentence, the faces sentence with its four defaults, the scene note and three relation links), ver001-05-slot-360.png (Slot with the model-knowledge mark and the return control) and ver001-10-reload-768.png (Arrive restored with Arrive, Two-level formation steering and Slot in the history).",
    "Usage: entry 98,994 tokens at 2026-10-28T23:09:13Z; handoff 4,649,058 tokens at 23:28:57Z (4,032,758 cached input, 537,100 cache writes, 78,810 output, 129 steps); no worker spawned, 0 of the cap of 20."
  ],
  "rejected": [
    {
      "option": "Rerun the target review gate at the committed tree",
      "reason": "The row is keyed by the tree hash, which the commit did not change; a rerun would supply the same evidence for the same bytes."
    },
    {
      "option": "Fail or waive criterion 1 on the executor's unmet line",
      "reason": "The criterion is the verifier's to perform and VER-001 performed it; the executor's line records whose share was left, not a failure."
    },
    {
      "option": "Repair the D028 to D030 follow-ups in review",
      "reason": "They change decided structure or belong to WO-015 and the catalog's next order; none breaks a criterion or a behaviour main had."
    }
  ],
  "reopenWhen": "The final target publish or the records publish refuses, the pull request's head moves before a merge, or a later order finds a defect in the catalog, its checks or the reading surface that this review's reading missed."
}
```
