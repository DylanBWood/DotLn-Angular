# WO-026 decisions

## WO-026-D001

```json
{
  "id": "WO-026-D001",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Run the pass under the quality pass: paragraph of the generated role text at starter v0.103.1, with this order as the authority for the edits. The phrase names the procedure and is not a dispatch, so no separate quality pass: message is sent and no lifecycle event follows from it. The base guard and the route guard hold, so the target worktree stays at 6268de9 and no fast-forward is owed.",
  "evidence": [
    "UPSTREAM.md: kit commit 4090d70dc908dbc69e0cd3601a982d40aecb4b6c, tag v0.103.1. The paragraph opening quality pass: <target> is in .claude/skills/dotln-executor/SKILL.md.",
    "In the target worktree, git fetch origin then git rev-parse origin/main printed 6268de9fc3cae84bf66091c1fbcc30d344411cd2, equal to HEAD and to the base the order's Repository line names.",
    "grep -c -- '--draft' scripts/worktree.mjs printed 5, and npm run resume -- status --json shows the typed edge on WO-015 as met with nothing blocking.",
    "The operator activated the order; status reads phase active at checkpoint 548c42e95ff357eac27837bae96cbd63744047be, so step 1's start command is the check the order names rather than a command this session repeats."
  ],
  "rejected": [
    {
      "option": "Send quality pass: as its own instruction for each document",
      "reason": "The order says its authority covers the edits and the phrase names the procedure."
    }
  ],
  "reopenWhen": "A starter update changes the quality pass: paragraph before this order closes."
}
```

## WO-026-D002

```json
{
  "id": "WO-026-D002",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Superseded by D013 on the operator's direction: the 33 READMEs were passed. As first decided: give the 33 library READMEs under libs/ the census kind standing, read each of them, check their names, commands and links read-only, and leave their bytes alone because criterion 6 fences them. Each row says unchanged and names the fact a pass with edit authority would correct. The pass's edited subject stays the 21 documents the Design lists. The one false statement among the 33 and the wider thinness of the generator stubs go to one follow-up.",
  "evidence": [
    "git ls-files '*.md' '**/*.md' prints 94 files in the target at 6268de9: 38 under docs/dotln/, the generator log, THIRD-PARTY-NOTICES.md, the 21 documents the Design lists and 33 READMEs under libs/ the Design does not name. Its Cost line says eight architecture and four workspace documents; the tree holds nine and four, the fourth being the ledger.",
    "The Design says the census is checked against the tree at activation and corrected there, and criterion 2 requires every listed file to take one of the four kinds the Design names.",
    "A library README is mutable and states what is so, so record, ledger and licence text would each be false. Standing is the only true kind.",
    "Criterion 6 says the diff names no file outside README.md, docs/dev-reference/, docs/ai-reference/, RELEASE-NOTES.md and docs/dotln/. The Design and the Cost line use README.md for the root file alone, and a pathspec of that spelling matches only the root.",
    "Calling the 33 standing brings them under the words of criterion 3's clause, though not its grep, which is what D004 first had to state.",
    "libs/shared/models/README.md says the library has no test runner, while libs/shared/models/project.json declares a @nx/vitest:test target and src/lib/toolbox.spec.ts exists. It also describes board types alone, while the library holds the catalog contract. That is the one false statement found in the 33. Nineteen of the 33 are Nx's generated text, seven library stubs and twelve secondary-entry stubs, true and thin, and the rest are true."
  ],
  "rejected": [
    {
      "option": "Edit the library READMEs under Adjacent Repair",
      "reason": "Adjacent Repair chooses within the existing scope guard, and criterion 6 is that guard. Widening it is the operator's call through scope expand:."
    },
    {
      "option": "Add a fifth census kind",
      "reason": "Criterion 2 requires one of the kinds the Design names, and a criterion changes only through amend-order."
    },
    {
      "option": "Leave the 33 out of the census",
      "reason": "Criterion 2 requires every file git ls-files prints, and the evidence README's script asserts equality."
    },
    {
      "option": "Stop and ask the operator to arbitrate",
      "reason": "The order and role leave this implementation choice to the executor, a safe default exists, and the operator can widen the scope at any time."
    }
  ],
  "reopenWhen": "The operator widens this order to the library READMEs by scope expand:, or a later order names them.",
  "followup": "Pass the 33 library READMEs under libs/ with the quality pass: procedure: correct libs/shared/models/README.md, which says the library has no test runner and describes board types alone, say placeholder in libs/features/machinery/README.md, which says arriving page, and replace the nineteen generated Nx stubs with what each library or entry point holds. WO-026's criterion 6 fenced them. Touches libs/**/README.md; check with npx nx format:check and the WO-026 link check."
}
```

## WO-026-D003

```json
{
  "id": "WO-026-D003",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Read the order's three reference indexes as the developer reference index, the AI reference index and the workspace scripts reference, and link all three from the root README, keeping its links to the conventions and the generator log.",
  "evidence": [
    "The tree holds two index files, docs/dev-reference/README.md and docs/ai-reference/README.md, and the order's own step 4 calls them the two indexes. docs/dotln/ has no index file: git ls-files 'docs/dotln/**/README*' prints nothing.",
    "docs/dev-reference/workspace/scripts.md is the one other document that lists a whole class of thing, every npm script and tool file with its purpose and status. Rule 26 asks it to be complete, and check:scripts refuses an npm script or a file directly under tools/scripts that it omits.",
    "The README's Check section is what a colleague runs first, so the scripts reference is the third place that reader needs."
  ],
  "rejected": [
    {
      "option": "Link two indexes and judge the Design's three a slip",
      "reason": "A third link costs nothing, serves the reader and satisfies the Design on any reading."
    },
    {
      "option": "Add a new index file",
      "reason": "Nothing is missing that a file would hold, and a third index would be a document to keep current for no reader."
    }
  ],
  "reopenWhen": "The operator names a different third index."
}
```

## WO-026-D004

```json
{
  "id": "WO-026-D004",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Describe /machinery as a placeholder page, drop the words criterion 3 refuses and do not name the class. The page exists at the base, so the documents keep describing it. D013 ended the two scopes this decision first had to state: the machinery README now says placeholder too, so criterion 3's clause and its amended grep hold over all 54 standing documents, and no reading is left to judge.",
  "evidence": [
    "libs/features/machinery/src/lib/containers/machinery-arriving-page/machinery-arriving-page.ts is the routed component at /machinery at 6268de9: machinery.routes.ts maps the path to it, and it renders the empty-state template with a link back to the board.",
    "The order's Design lists the arriving pages among removed surfaces. Only the scene's went, with WO-015. Criterion 3's grep had three hits at the base, all in docs/dev-reference/architecture/sub-apps.md, and all three describe that existing page.",
    "The criteria adversary read the clause without its grep and found libs/features/machinery/README.md line 4, and also that an earlier draft of this decision kept the class name in sub-apps.md while saying the grep could not see it. That draft talked around the clause; the class name is gone, and the operator's widening removed the README line."
  ],
  "rejected": [
    {
      "option": "Remove the page from the documents to satisfy the grep",
      "reason": "A document would then omit a route the menu links, so the reader could not trust the table."
    },
    {
      "option": "Keep the class name in sub-apps.md because the grep is case-sensitive",
      "reason": "That satisfies the check and not the clause, and the sentence reads as well without it."
    }
  ],
  "reopenWhen": "The machinery view replaces the placeholder, which is WO-016's work."
}
```

## WO-026-D005

```json
{
  "id": "WO-026-D005",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Write every command in a rule document in the form that runs, and name the catalog join by its file rather than as a command. Bare script names such as check:kits and lint:hygiene become npm run forms, workspace-tools:lint becomes npx nx run workspace-tools:lint, and a closing line that said to run the order's preflight names the concrete test targets. The join stays in catalog-rules.md as the rule to follow, through tools/scripts/catalog/join-maps.mjs, with a link to the section that gives its command and its input.",
  "evidence": [
    "Criterion 4 requires every command a rule document names to exit 0 when run as written, and rule 19 asks for the commands to run. At the base foundation-rules.md and state-rules.md carried names no shell runs, component-rules.md named targets without commands, and state-rules.md and catalog-rules.md ended by pointing at an order's preflight and the registered gates, which a coding session cannot run as written.",
    "tools/scripts/catalog/join-maps.mjs line 148 throws Expected the research run directory. when the argument is absent, so npm run catalog:join exits 1 as written. Its input is the research run in the operator's ignored intake, which is not in the repository, and that input is read only on the operator's naming of it.",
    "docs/dev-reference/architecture/catalog.md and docs/dev-reference/workspace/scripts.md both state the command with its argument, so no reader loses it."
  ],
  "rejected": [
    {
      "option": "Keep npm run catalog:join in the rule document and judge criterion 4 by reading it as a command with an argument",
      "reason": "The rule document would name a command that exits 1 as written, which is the failure the criterion exists to prevent."
    },
    {
      "option": "Run the join against the research run to produce an exit 0",
      "reason": "Nothing in this order names that input, and a documents order has no reason to rewrite the catalog's data files."
    },
    {
      "option": "Add a --check mode to the join",
      "reason": "A non-goal: the order changes no script to match a document."
    }
  ],
  "reopenWhen": "The join gains a way to run without the research run, or a later order changes the join's input."
}
```

## WO-026-D006

```json
{
  "id": "WO-026-D006",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Correct scripts.md's gate description to the registration, which settles the follow-up WO-025 left for this order, and restate its Nx sentence as what nx.json does. typecheck:e2e moves from the helpers to the gate table; the row keeps its reason. Rule 26's helper status for the other commands is unchanged, and check:scripts still passes.",
  "evidence": [
    "dotln.config.json at repositories.dotln-angular.gate lists plain as install, lint, typecheck, test, format and review as those plus build, e2e, visual; typecheck is npm run typecheck:e2e. scripts.md at the base omitted it and listed it as a helper.",
    "FUP-f8216ece83a3e7a6 (WO-025-D015) is deferred with the reopening condition WO-026 activates, naming this file.",
    "nx.json sets parallel to 1 for every run, so the base's claim that registered gates serialize tasks credited the gate with what the workspace does; ci.yml also sets NX_DAEMON to false.",
    "tools/scripts/check-foundation-types.mjs lists all 17 libraries under libs/, so the purpose that named shared, shell and board libraries had gone stale."
  ],
  "rejected": [
    {
      "option": "Leave typecheck:e2e in the helpers and add a note",
      "reason": "A helper is by the document's own definition something no gate runs."
    }
  ],
  "reopenWhen": "The registered gate's commands change, or the target moves typecheck:e2e into its own lint target (WO-025-D015)."
}
```

## WO-026-D007

```json
{
  "id": "WO-026-D007",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Keep the established structure of each document and change what the pass found: facts that had gone stale, additions left where they were appended, names a reader could not follow, and order identifiers a colleague cannot resolve. Add three things the Objective's reader needs and the tree did not state: a table in the developer reference index from a question to a document and a file, a section in sub-apps.md on how a feature library is laid out, and a table in events-and-state.md of where state lives. Leave sub-app-rules.md's rules as they are, because they are true at the base and every name and command in them runs; D014 adds one clause.",
  "evidence": [
    "The Objective's reader looks for how a feature is laid out, where state lives, how the engine stays pure and how the catalog is joined, each with its demonstrating file. At the base the index had a run of See and Read lines, sub-apps.md said how to add a feature and not what one holds, events-and-state.md opened on the board alone, and scene.md stated the engine's purity without saying what holds it.",
    "scene.md's new paragraph comes from libs/shared/scene-engine/project.json (type:util), eslint.config.mjs (the type:util constraint), libs/shared/scene-engine/vite.config.mts (environment node, no Angular plugin) and a grep of src/lib finding no import outside relative paths in non-spec files. tsconfig.base.json includes the dom lib and no lint refuses an npm import, so the document says purity from Angular is a rule to keep rather than a check.",
    "catalog.md's Reading and studying section held colours appended to the shelf's paragraph, and the Arrive study's facts in the order they were added; both are integrated, with the study under its own heading and its files named. catalog.md also said RxJS core/practice, while the batch and file are rxjs-patterns.",
    "concept-mapping.md named WO-014, WO-015 and WO-017 in current-state sentences. WO-017 has no record in the target at all, and the sentences read as true without the identifiers.",
    "conventions.md carried Prettier's embedded-template paragraph under rule 21, Broken windows; it belongs with rule 13. Its rule 20 said final publication supersedes the draft, which WS-001 rule 20 and the kit's route contradict: the final publish reuses the branch and pull request.",
    "component-taxonomy.md listed fragments and templates as Salesmen, omitting wrappers, and said the board has no store or HTTP transport, which WO-007 ended. WS-001 §Design lists all three as Salesmen.",
    "foundation.md said en.json owns the home heading and document title. There is no home page and no such key; the title is the static <title> in apps/dotln/src/index.html.",
    "storybook.md said stories cover every shared UI component; libs/shared/ui/src/lib/wrappers/toast has no story. Its visual list stopped before the scene, the catalog and the Machinery page, which have 12 baselines between them."
  ],
  "rejected": [
    {
      "option": "Rewrite each standing document to the table-first profile shape",
      "reason": "The order's procedure says to preserve established structure and leave sound passages unchanged, and the operator's direction on that shape names the repository profile, which WO-025 applied."
    },
    {
      "option": "Add a lint rule or test that refuses a package import in the engine",
      "reason": "A non-goal: the order changes no code. The document states what is enforced and what is not."
    }
  ],
  "reopenWhen": "The operator judges a document unfit to hand to a colleague in the draft pull request."
}
```

## WO-026-D008

```json
{
  "id": "WO-026-D008",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Write back to the repository profile only where it disagrees with the passed documents: the sentence that scripts.md calls typecheck:e2e a helper, the name of the /machinery page, the row that placed the zoneless, router and fetch providers in app.config.ts, and what check:scripts enforces. The profile's implementation map and command table otherwise agree, so they stand. WS-001's delivery states stay for the final review, as the order's step 9 says.",
  "evidence": [
    "The order's step 9 and Design scope the write-back to where the passed documents disagree, in the profile's current shape, since WO-025 has merged.",
    "A first reading of the profile's gate table, helper table and Find the implementation tables against scripts.md and the passed architecture documents missed one row. Two reviews found it: the providers it placed in apps/dotln/src/app/app.config.ts are in libs/shared/core/src/lib/providers/provide-dotln-core.ts, as foundation.md says. The reviews' recheck found a third: the profile said check:scripts enforces every tool script's status, which the passed scripts.md no longer says, so that sentence narrowed too, and the profile's two uses of catalog for Storybook changed with the target's. Its other tables agree. The profile's history row naming WO-013's arriving routes is what that order delivered and stays."
  ],
  "rejected": [
    {
      "option": "Update the profile's Last reviewed target source row",
      "reason": "This order's commit does not exist until publication, and the row names a reviewed merge, so it belongs to the first pass after the merge."
    }
  ],
  "reopenWhen": "A later pass reads the profile at this order's merge commit."
}
```

## WO-026-D009

```json
{
  "id": "WO-026-D009",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Add the formatting step to scene-rules.md's regeneration rule, and restore the fixture's bytes with Prettier rather than with Git. Running the rule as written exited 0 and moved tracked bytes: the spec writes JSON.stringify output, which Prettier's committed form does not match, so the command alone leaves a file that fails nx format:check and a 220-line diff with no change of meaning. The rule now names both commands, and the pair is proved byte-identical.",
  "evidence": [
    "Running every rule-document command under a before-and-after hash of git status and git diff flagged one of 39: WRITE_SCENE_FIXTURES=1 npx nx test scene-engine --skip-nx-cache changed libs/features/scene/src/testing/fixtures/trial-known-outcome.json from 123 to 303 lines.",
    "Parsing the file at the base and after the run and comparing them printed deep equal: true, so the simulation's determinism holds and the change is formatting alone. libs/shared/scene-engine/src/lib/known-outcome.spec.ts line 87 writes JSON.stringify(computeOutcome(), null, 2).",
    "npx prettier --write on that path restored the bytes; git diff --exit-code on it exited 0. Repeating the pair after the edit, the file differed after the first command and was identical after the second.",
    "catalog-rules.md already pairs its regeneration with Prettier for the same reason, so the rule follows an established shape."
  ],
  "rejected": [
    {
      "option": "Change the spec to write Prettier's form",
      "reason": "A non-goal: the order changes no code to match a document, and the rule is what was wrong."
    },
    {
      "option": "Restore the file with git restore",
      "reason": "The role forbids it, and Prettier is the step the rule needed anyway, so restoring through it also tests the fix."
    },
    {
      "option": "Judge criterion 4 met on the exit code and say nothing",
      "reason": "A rule that exits 0 and leaves the tree failing the format gate is the kind of defect this pass exists to find."
    }
  ],
  "reopenWhen": "The spec's writer changes to Prettier's form, when the second command becomes unnecessary."
}
```

## WO-026-D010

```json
{
  "id": "WO-026-D010",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Apply the three reviews' findings, including the design review's durability edits, except where a sound passage or a decision the operator owns stands. One inventory sentence in catalog.md now carries the catalog's counts and the others are count-free, enumerations of features became one example, and a new sub-app's upkeep of the tables this pass added is written into sub-apps.md's steps.",
  "evidence": [
    "self-review.md lists every finding and what became of it.",
    "tools/scripts/catalog/check-catalog.mjs pins 3,463 rows and six works, and catalog-data.spec.ts pins eight checkpoints and eleven maps, so a later order that adds a work is told by a failing check to change the numbers. Those numbers appeared in ten places in prose, and WO-018's document line names none of them.",
    "A count such as the eleven in the join's first sentence told a reader nothing the inventory sentence does not, so removing it loses nothing."
  ],
  "rejected": [
    {
      "option": "Cut the six workspace commands from the developer index's Checks list",
      "reason": "A sound passage: a person may run one alone, and the sentence after the list says npm run lint covers them."
    },
    {
      "option": "Use npm start in the developer index's quick start",
      "reason": "Both are right, and npx nx serve dotln prepares the --configuration=local form the same paragraph uses."
    },
    {
      "option": "Replace the operator in the root README",
      "reason": "It is the repository's own word throughout, and how it names its owner is the operator's call."
    },
    {
      "option": "Shorten the evidence script by eight lines",
      "reason": "The output is the same, and a reader gains nothing for the rerun it would cost."
    },
    {
      "option": "Delete the descriptive last sentence of a bullet in sub-app-rules.md",
      "reason": "It is true and harmless."
    }
  ],
  "reopenWhen": "The operator reads the draft pull request and prefers otherwise on any of these."
}
```

## WO-026-D011

```json
{
  "id": "WO-026-D011",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Keep the relative-link check ad hoc, in this order's evidence, and state in the documents what npm run check:scripts covers rather than what rule 26 says of it. The Design lets the executor commit the check as a helper only if it earns its place; it cannot do so in this order, and whether either tool should grow is a later order's judgment.",
  "evidence": [
    "The Design offers a link check run ad hoc and recorded, or committed as a helper with its scripts.md entry. A helper belongs under tools/scripts/, which criterion 6's fence excludes.",
    "tools/scripts/check-script-reference.mjs reads the top of tools/scripts with a non-recursive readdirSync and checks that a backticked name appears. It does not look at tools/*.mjs or tools/scripts/catalog/, and it does not check status. tools/board-count.mjs was not named at the base and the check passed. WS-001 rule 26 uses the wider wording.",
    "Every tool file is named in scripts.md at this tree, individually or by the tools/*.test.mjs glob, so nothing is unrecorded today."
  ],
  "rejected": [
    {
      "option": "Commit the link check under tools/scripts/",
      "reason": "Outside criterion 6's fence, and rule 26 asks a tool to earn its place first."
    },
    {
      "option": "Widen check-script-reference.mjs",
      "reason": "A non-goal: the order changes no code, and criterion 6 fences the file."
    },
    {
      "option": "Board the coverage gap with a // BOARDED: comment",
      "reason": "Rule 21's board is a comment in code, which criterion 6 excludes here; the register carries it instead."
    }
  ],
  "reopenWhen": "A later pass finds a broken link in a standing document, or a tool script goes unnamed in scripts.md.",
  "followup": "Decide whether npm run check:scripts should also cover tools/*.mjs and tools/scripts/catalog/ or WS-001 rule 26's wording should narrow to what it checks, and whether WO-026's relative-link check earns a place in workspace-tools:lint under rule 26. Touches tools/scripts/check-script-reference.mjs and docs/workstreams/WS-001-dotln-angular.md; check with npm run check:scripts."
}
```

## WO-026-D012

```json
{
  "id": "WO-026-D012",
  "date": "2026-10-31",
  "dispatch": "resume: next",
  "decision": "Leave WO-016's order text alone and record a carry-in for it. The passed documents describe the placeholder at /machinery as what is so, and the order that replaces it does not name them.",
  "evidence": [
    "docs/work-orders/WO-016-machinery-view.md's Documents line names machinery.md and machinery-rules.md and pointers. The placeholder is described in README.md's menu table, docs/dev-reference/README.md's first paragraph, docs/dev-reference/architecture/sub-apps.md and docs/dev-reference/workspace/storybook.md.",
    "sub-apps.md's steps now name the tables a new sub-app updates, but WO-016 replaces a page rather than adding a sub-app, so those steps do not reach it.",
    "A judged order's text changes through a planning pass or amend-order, neither of which this order has."
  ],
  "rejected": [
    {
      "option": "Write the placeholder out of the documents now",
      "reason": "The page exists at this tree, and the documents say what is so."
    }
  ],
  "reopenWhen": "WO-016 activates.",
  "followup": "WO-016 carries into its documents step the places that describe the /machinery placeholder: README.md's menu table, docs/dev-reference/README.md's first paragraph, docs/dev-reference/architecture/sub-apps.md's opening and table, docs/dev-reference/workspace/storybook.md's visual list and libs/features/machinery/README.md. Touches those files; check with a grep for placeholder over them."
}
```

## WO-026-D013

```json
{
  "id": "WO-026-D013",
  "date": "2026-10-31",
  "dispatch": "resume: next; operator direction after the handoff",
  "decision": "Widen the order on the operator's direction and amend its text. The 33 READMEs under libs/ join the pass's subject: criterion 6's fence admits them, criterion 3's grep reaches them, and step 4 passes them. This supersedes D002's fence and D004's reading, because the clause and the census now mean the same 54 documents. Work continues in this writer's session, every gate runs again on the final tree and the handoff is rewritten, because the kit has no route from ready-to-verify back to the executor.",
  "evidence": [
    "Operator direction captured in docs/intake/notes/wo-026-session-2026-10-31.md, SHA-256 7409f54aa1e947d0b9120c051e351b68ee920141944ac15289c16cc4c6760d50, entries 1 and 2: the operator asked why READMEs, among the most public documents there are, were left out, and on being told that no record decided it, directed the widening.",
    "The operator's direction of 2026-10-30, which this order's Nomination provenance cites, was every public mutable document in the instance and in DotLn-Angular. Planning decision D8 narrowed it to the README and the two references. Neither D8's planning document, this order, WS-001 nor the operator record mentions the library READMEs, so the list omitted them rather than excluding them.",
    "npm run resume -- status --json gives ready-to-verify the one legal action verify. The ImplementationReady event at this order's first handoff and its ledger of 6 met and 1 unmet therefore predate this work.",
    "WO-025-D013 took the same route: the decision records the authorization and amend-order binds the approved text. It is not a fresh planning verdict."
  ],
  "rejected": [
    {
      "option": "Leave them to FUP-ba8e848d7a66d1f1",
      "reason": "The operator directed otherwise."
    },
    {
      "option": "Edit the READMEs without amending criterion 6",
      "reason": "The criterion would fail at the reviewed tree. The text changes rather than the verdict."
    },
    {
      "option": "Record the work after the handoff as an operator override",
      "reason": "No operator override session happened, and that event would say one did."
    }
  ],
  "reopenWhen": "Verification or final review finds this work needed another route, or the kit gains a route from ready-to-verify back to the executor."
}
```

## WO-026-D014

```json
{
  "id": "WO-026-D014",
  "date": "2026-10-31",
  "dispatch": "resume: next; operator direction after the handoff",
  "decision": "Write the standard the amended Design sets for a library README into the target's conventions, so the next library does not ship the stubs this pass replaced. Rule 19 and docs/ai-reference/README.md now say that a library's README says what the library is for, how it is imported and how it is tested and names the document to read next, and that a testing entry point's says what it exports and how to use it, and sub-apps.md's fifth step and sub-app-rules.md send a session to replace the generated text. The 17 library READMEs carry all of that; the 16 entry points say what they export and how they are imported, and ui/menu also says how it is tested. WS-001 rule 19 is silent on this and is not edited here.",
  "evidence": [
    "Nineteen of the 33 READMEs were the generator's text at the base, because nothing told a session to replace it. WO-016 and WO-017 each name a new library, and a session adding a sub-app follows sub-apps.md, which did not mention READMEs.",
    "WS-001 says a rule changes through a planning pass or an order's recorded decision, never silently. This records the addition on the target's side; the order's non-goals leave the launchpad's documents alone, so WS-001's own text waits for the next pass.",
    "The design and consistency reviews both found the first wording said a testing entry point follows the same three-part standard, which none of the 15 does or needs to: a kit is imported by the heading's alias and has no test command of its own."
  ],
  "rejected": [
    {
      "option": "Leave the standard in the order alone",
      "reason": "The order closes, and the next library would ship a stub."
    },
    {
      "option": "Edit WS-001 rule 19 in this order",
      "reason": "The order's non-goals leave the launchpad's documents out, and a planning pass owns the workstream's rules."
    },
    {
      "option": "Add a check that refuses generated text in a README",
      "reason": "Code, which criterion 6 excludes here; the follow-up carries it."
    }
  ],
  "reopenWhen": "The next planning pass takes the standard into WS-001 rule 19.",
  "followup": "Take the library README standard into WS-001 rule 19, and decide whether workspace-tools:lint refuses the two generated texts, This library was generated with and Secondary entry point of, in a README under libs/. Touches docs/workstreams/WS-001-dotln-angular.md and tools/; check with npm run check:scripts."
}
```

## WO-026-D015

```json
{
  "id": "WO-026-D015",
  "date": "2026-10-31",
  "dispatch": "resume: verify",
  "decision": "Verify the amended 54-document candidate by its exact target-gate tree identity, complete the reader walkthrough independently and retain the existing current review gate. Judge all seven original criteria met; file VER-001 only after the final launchpad document check passes. Keep implementation bytes unchanged. The candidate remains uncommitted at this phase under the lifecycle contract; the review covers its working bytes, not only base HEAD.",
  "evidence": [
    "VER-001 records a fresh npm start / Chromium walkthrough: HTTP 200, /scene, title DotLn, The soldier scene, twenty units, no page errors. All four developer-reference questions led to existing demonstrating files.",
    "Independent extraction found 39 distinct shell commands in the AI reference; the census sequence reproduced all of them plus Preflight lint, 40 exits of 0. Regeneration changed only the known fixture formatting; the documented following command restored identical bytes. The before/after tracked-file snapshot SHA-256 was 088acc701a773ed02234821a826a891aca7a46224c755b21235716f22bccdcf0.",
    "Two audits found 94 tracked Markdown files, 94 census rows, 54 standing documents, 33 library READMEs, 492 named references and 122 repository links, with no missing name, stale surface, broken link or out-of-scope candidate path. Dependency keys are unchanged.",
    "The targetGateEvidence API accepted current tree 7156c5bc0a9ebd79728c0b4a903012bac8ca7e6c and review evidence target-gate:b990e0e6-db44-412a-9f5c-4604ce0524b0, covering all eight registered commands.",
    "The full document diff and all three executor review lenses/dispositions were read. Existing follow-ups remain owned by D011, D012 and D014; no new defect was found.",
    "An initial metadata batch used the target cwd and returned missing-script/module errors without changing files. The launchpad index, usage and scratch commands then succeeded from the verified launchpad root. This corrects the process error; no lifecycle transition was repeated."
  ],
  "rejected": [
    {
      "option": "Consume passing inventory/gate evidence without doing the reader walkthrough",
      "reason": "A green extraction cannot establish usefulness or discharge criterion 1; the independent session was required."
    },
    {
      "option": "Run another complete target review gate at the unchanged identity",
      "reason": "The existing passing row covers the exact tree. Independent command probes and the live reader session establish the remaining claims with less repeated work."
    },
    {
      "option": "Change implementation or soften the criteria during verification",
      "reason": "This is a read-only judgment. The original seven criteria hold on the reproduced evidence."
    }
  ],
  "reopenWhen": "A reviewed document or demonstrating implementation changes before final review, a documented command ceases to run, or the reader session cannot be reproduced at the bound tree."
}
```

## WO-026-D016

```json
{
  "id": "WO-026-D016",
  "date": "2026-10-31",
  "dispatch": "resume: final review",
  "decision": "Pass the final review on the reproduced criteria with no edit to the verified documents, commit that tree as two reviewed commits and write the workstream's delivery states. Integration took in nothing in either repository. The reviewed commit 01e7b6e03fb13946b5164733d91827e737d1d766 has tree 7156c5bc0a9ebd79728c0b4a903012bac8ca7e6c, the tree VER-001 judged, the draft carries and the review gate row covers, so the target gate does not rerun. No launchpad complete run is owed: no launchpad code changed, and criterion 7 names the target gate and the document gate. WO-025's two rows in WS-001 still read active after it closed, so this write-back corrects them with this order's rows, as step 9 gives the delivery states to the final review. WS-001 rules 5 and 11, which the handoff reported only in prose, go to the register here.",
  "evidence": [
    "git fetch origin, then the launchpad's HEAD and origin/main both print a728506f92bf89c4f4c0a04ca116542805abf2b9, and the target's origin/main prints its base, 6268de9fc3cae84bf66091c1fbcc30d344411cd2. npm run worktree -- integrate WO-026 --intake-backup <scratch archive> printed Integration took in nothing: the worktree is not behind main.",
    "git rev-parse of HEAD^{tree} and of 4ee26ca5ced01232f211ccc32907e43686f8475c^{tree} in the target both print 7156c5bc0a9ebd79728c0b4a903012bac8ca7e6c. targetGateEvidence at the commit returns target-gate:b990e0e6-db44-412a-9f5c-4604ce0524b0 with all eight commands.",
    "CI on the draft's identical tree: run 41229165392 passed checks and visual, every step, among them format, workspace-tools lint, typecheck:e2e, check:bundle and nx affected lint test build e2e, and run 41229165347 passed title, with zero reviews, comments and threads. preview-pr.json records them.",
    "reviewedLaunchpadIdentity in scripts/lib/release-records.mjs writes a no-code-changed block when the head's code identity equals its base's, and requireFinalReviewGate in scripts/lib/handoff-ledger.mjs returns early for a target order.",
    "The evidence README's script at the reviewed commit printed 94 tracked, 94 rows; 54 documents, 492 names; 122 repository links; 0 problems. An independent extraction found exactly the census's 39 rule-document commands and 41 library README commands. All 83 identifiers the 33 READMEs name resolve: 80 to their entry point's exports, BoardFacade to the internal class the README does not call public, and R and RA to namespace exports.",
    "WS-001 read active for WO-025 in two tables after its FinalReviewCompleted of 2026-10-31T15:31:33.670Z, its merge as #43 and the tag v0.3.4.",
    "handoff.md names the two rule differences and sends them to the next pass, and FUP-83dc180d25c50ccc carries only rule 19, so the register held neither."
  ],
  "rejected": [
    {
      "option": "Fast-forward wo-026 to the draft's single commit",
      "reason": "The references and the 33 library pages can be read and reverted apart, and the operator added the second after the first handoff. Two commits say that at the same tree."
    },
    {
      "option": "Rerun the target review gate after committing",
      "reason": "The gate binds bytes and the bytes did not move, and CI ran that tree fresh during this review."
    },
    {
      "option": "Repeat the browser walkthrough",
      "reason": "Criterion 1 is the verifier's, this is the tree it walked, no code changed, and CI's e2e and visual suites passed on it."
    },
    {
      "option": "Correct WS-001 rules 5 and 11 here",
      "reason": "The order's non-goals leave the launchpad's documents out beyond the delivery states, and a planning pass owns the rules."
    }
  ],
  "reopenWhen": "CI fails on the final head, or the operator reads the pull request and judges a document unfit to hand to a colleague.",
  "followup": "Take WS-001 rule 5, which says nearly every injectable exposes a kit, and rule 11, which says <Feature>Paths enums, to what the target's conventions and code hold: each @Injectable class and token, which check:kits enforces, and BasePaths and ChildPaths. Touches docs/workstreams/WS-001-dotln-angular.md; check with npm run test:docs."
}
```

## WO-026-D017

```json
{
  "id": "WO-026-D017",
  "date": "2026-10-31",
  "dispatch": "resume: final review",
  "decision": "Keep the profile's Last reviewed target source and Latest target release rows as D008 left them, and register their refresh. Neither new value exists until the operator merges and release close runs. Release close does not edit the profile, and the planning receipt's known issue on those rows names this order's close as its condition, so without a row they go stale at the first target release after WO-025 with nobody holding the edit.",
  "evidence": [
    "docs/repositories/dotln-angular.md reads 6268de9fc3cae84bf66091c1fbcc30d344411cd2 and DotLn Angular v0.6.0. Receipt 2026-10-30-planning-18e7afc23edf14c3-015 records the known issue on WO-025's criterion 3, reopening when, after WO-026's release close, the profile still names a latest target release or last reviewed source older than the one that close produced.",
    "docs/planning/followups.json has no row for those two facts. .claude/skills/dotln-release-close/SKILL.md never names docs/repositories, and the row's label appears only in tests under scripts/."
  ],
  "rejected": [
    {
      "option": "Write the expected values now",
      "reason": "The merge commit and the version do not exist yet, and the profile says what is so."
    }
  ],
  "reopenWhen": "WO-026's target release is published.",
  "followup": "After WO-026's release close, set the Last reviewed target source and Latest target release rows of docs/repositories/dotln-angular.md to that merge and release, and decide who holds those two rows at each later target release close. Touches docs/repositories/dotln-angular.md; check with npm run test:docs."
}
```

## WO-026-D018

```json
{
  "id": "WO-026-D018",
  "date": "2026-10-31",
  "dispatch": "resume: final review",
  "decision": "Uphold D013's route and register the lifecycle gap behind it. Verification judged the whole final tree, so no work after the first handoff went unjudged and no other route was needed. What the gap leaves is a record older than the work: ImplementationReady's target gate names a tree before the widening, and status still lists criterion 1 unmet from that handoff's ledger, which the dispatch briefing repeats. Two document orders running have met this, so it belongs in the register rather than in two reopening conditions.",
  "evidence": [
    "ImplementationReady's targetGate binds tree 0c153e73e6e6f64a2d3073642f469203351d2f55, and VerificationCompleted's binds 7156c5bc0a9ebd79728c0b4a903012bac8ca7e6c. npm run resume -- status --json lists criterion 1 at ordinal 2 under unmetCriteria while VER-001 judges it met.",
    "D013 and WO-025-D013 carry the same reopening condition, that the kit gains a route from ready-to-verify back to the executor, and docs/planning/followups.json holds no row naming it."
  ],
  "rejected": [
    {
      "option": "Fail the review until a fresh handoff exists",
      "reason": "No route to one exists, every criterion holds on the verified tree, and amend-order bound the widening."
    }
  ],
  "reopenWhen": "The kit gains a route from ready-to-verify back to the executor.",
  "followup": "Ask core for a route from ready-to-verify back to the executor when the operator widens an order after its handoff, so that the handoff's ledger, its gate rows and status's unmet criteria are those of the verified work. Touches the kit's lifecycle in scripts/resume.mjs, which an upstream update delivers; check with npm run resume -- status --json."
}
```
