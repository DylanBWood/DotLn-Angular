# WO-026 — A quality pass over every standing document of DotLn-Angular under the kit's `quality pass:` procedure: the README, the developer reference and the AI reference read as what is so at the scene's merge

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 6268de9fc3cae84bf66091c1fbcc30d344411cd2
**Target release classification:** patch
**Target release notes:** reviewed
**Cost:** edits, where the pass finds a defect of usefulness, currency,
coherence or organization, the target's standing documents (`README.md`,
`docs/dev-reference/README.md`, the eight architecture documents, the four
workspace documents, `docs/ai-reference/README.md` and the six rule
documents; about 22 files, 170 KB; and the 33 READMEs under `libs/`, 7 KB, added
by WO-026-D013); adds `docs/dotln/evidence/WO-026/`
records through the kit's route and `docs/evidence/WO-026/census.md` in the
launchpad. Removes nothing tracked. Wall-clock: about 4 to 8 hours of
executor work plus the fixed cycle; unknown until run. Context bytes: the
census (170 KB), the source each document describes (read as needed), the
generated role's `quality pass:` paragraph, WS-001 rules 19 and 26, this
order, about 260 KB for the executor. Commands added: none. Tokens: unknown
until run. Steps: 10. Re-mints: none. Refutations paid: the 2026-10-30 second
pass's receipt.
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second-messages.md`,
SHA-256 `39b30d94667c52a26d7d6efba61bb6e2f1b55d602831f3f778525953b0765468`,
message 2): one order, or two, whose only job is to run the new `quality
pass:` behaviour over every public mutable document in the instance and in
DotLn-Angular. Starter v0.103.0 (core WO-235) put the procedure in every
generated role. Planner-synthesized by the 2026-10-30 second planning pass
([planning document](../planning/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D8). Opaque identifier, not a priority.
**Depends on:** WO-015 merged (hard, met: `scene.md` and `scene-rules.md`,
the root at `/scene`, the sixteen tools and the two new libraries the
documents must describe). The base is WO-015's merge commit, the target's
`main` at filing.
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-015",
    "relation": "hard",
    "reason": "the scene documents, the root route and the two libraries the target's standing documents must describe as what is so"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** the generated role's `quality pass:`
paragraph (`.claude/skills/dotln-executor/SKILL.md`); `docs/product/07-execution-guide.md`
§Operator-opened planning pass item 7; `docs/workstreams/WS-001-dotln-angular.md`
(house rules 2, 9, 19, 21, 26; §Design: the Tipping Point taxonomy);
`docs/repositories/dotln-angular.md`; the target's `docs/dev-reference/README.md`,
`docs/ai-reference/README.md`, `docs/dev-reference/workspace/scripts.md`
and `tools/scripts/check-script-reference.mjs` (the one document check the
target runs).

**Objective:** (the operator's session, WS-001 rule 24, with the documents as
the surface) a colleague clones DotLn-Angular, opens `README.md` and learns in
one screen what the app is, how to run it and which checks to run; they
follow the link to the developer reference and find, for the convention they
care about (how a feature is laid out, where state lives, how the scene's
engine stays pure, how the catalog's data is joined), one document that says
what is so at this commit, names the file that demonstrates it, and does not
describe a page or a route that no longer exists; a coding session opens the
AI reference and finds short, rule-shaped documents whose commands run, with
no rule that contradicts a developer document. The operator opens `scene.md`
and `catalog.md` and reads them as wholes, finding the accumulated additions
of four orders integrated into their paragraphs rather than appended. What
the colleague learns is how the operator builds Angular; what the operator
decides is whether the reference is one they would hand to a colleague.

**Observed gap (dated 2026-10-30):** at `6268de9` the target's standing
documents are `README.md`, `docs/dev-reference/` (the index, eight
architecture documents, four workspace documents) and `docs/ai-reference/`
(the index and six rule documents), about 170 KB, written and appended by
WO-004 to WO-019 and WO-015 across eleven orders; each order kept its own
sections current and none read the set as a whole; the README names the
scene, the board and the catalog but not the sub-app menu; the generator log
is an append-only record of generator invocations and `scripts.md` is checked
by `check:scripts` on every change; `THIRD-PARTY-NOTICES.md` is licence text;
`docs/dotln/` holds the orders' immutable records. This paragraph first omitted
the 33 READMEs under `libs/`, each a library's public page: nineteen are Nx's
generated text, one says its library has no test runner when it has one, and one
says arriving page (WO-026-D013).

**Design:**

- **The census** (`docs/evidence/WO-026/census.md` in the launchpad, written
  first): every tracked Markdown file in the target (`git ls-files '*.md'
  '**/*.md'`) with its kind and reason: record (`docs/dotln/**`; excluded,
  immutable); ledger (`docs/dev-reference/workspace/generator-log.md`, the
  append-only record of generator invocations WS-001 rule 2 names; excluded
  from rewriting, read for a broken link only); licence text
  (`THIRD-PARTY-NOTICES.md`; excluded, its notices are the licensors' words);
  and standing, the pass's subject: `README.md`, `docs/dev-reference/README.md`,
  `docs/dev-reference/architecture/{catalog,component-taxonomy,concept-mapping,console,events-and-state,foundation,performance,scene,sub-apps}.md`,
  `docs/dev-reference/workspace/{conventions,scripts,storybook}.md`,
  `docs/ai-reference/README.md` and
  `docs/ai-reference/{catalog,component,foundation,scene,state,sub-app}-rules.md`,
  and the 33 READMEs under `libs/` (WO-026-D013).
  The census is checked against the tree at activation and corrected there.
- **The procedure**, per document, in the census's order: the executor runs
  the `quality pass:` procedure the role text defines (read the document's
  contract, the source it describes and the surrounding documents; improve
  usefulness, currency, coherence and organization; integrate accumulated
  additions into their paragraphs; preserve useful information and
  established structure; leave sound passages unchanged; check every factual
  change against the source file or command it names and every link; run the
  checks appropriate to the document; record what changed or needed no
  change and any unresolved fact), and records the result in the census row.
  A developer document and the rule document that pairs with it are passed
  together so neither contradicts the other. The order's authority covers the
  edits; the phrase names the procedure.
- **What the documents must say** (rule 19: `dev-reference` for people,
  `ai-reference` for sessions, short and rule-shaped with the commands to
  run): every route, library, command and file a document names exists at
  the base (`libs/`, `apps/`, `package.json` scripts, `tools/scripts/`);
  every command in a rule document runs as written; `scripts.md` keeps every
  tool script's purpose and status (rule 26; `npm run check:scripts`); the
  README names the sub-app menu, the scene as the root, the board and the
  catalog, and links the three reference indexes; a library README says what
  the library holds, how it is imported and how it is tested; no document describes a
  removed surface (the arriving pages, `provideSceneTestKit`, the `tool-list`
  composite, the filter row); the taxonomy's role names are used
  consistently with WS-001 §Design.
- **Checks**: the target's `npm run check:scripts`, `npm run i18n:check`
  (strings a document quotes), `npx nx format:check` (Prettier formats
  Markdown in the target), and a relative-link check over the census's
  standing documents (every `](…)` target that is a repository path exists),
  run ad hoc and recorded, or committed as a helper with its `scripts.md`
  entry only if the executor judges it earns its place (rule 26); the
  declared target gate plain and review as every target order pays it.
- **Launchpad write-back**: the profile's implementation map and command
  table are checked against the passed documents and corrected where they
  disagree (one surface, WO-025's shape if WO-025 has merged, the current
  shape otherwise).

Rejected: one order for both repositories (axis: one repository, one gate
and one release policy per order; the launchpad's documents are WO-025's);
rewriting the generator log (axis: it is the append-only record rule 2 names,
not prose); a documents-only order without the target gate (axis: a target
order pays its declared gate, and Prettier and `check:scripts` judge
Markdown); a new documentation site or generator (axis: the documents are
Markdown in the repository and the operator asked for a pass, not a tool).

**Deliverables:** the standing documents of the census each passed and
recorded; `docs/evidence/WO-026/census.md` with every tracked Markdown file's
kind and every standing document's outcome; `docs/evidence/WO-026/README.md`
with the checks run and the link-check record; the target's `RELEASE-NOTES.md`
for the patch release.

**Execution plan:**

1. Base guard and activation as WO-005 step 1, for WO-026; fast-forward the
   target worktree to the target's `main` if the base moved (WO-014-D001);
   record in the decisions file the procedure's source (the role text at the
   activation's starter version).
2. The census from `git ls-files` in the target, written to
   `docs/evidence/WO-026/census.md`. Check: `grep -c "| standing |"
   docs/evidence/WO-026/census.md` is at least 20.
3. `README.md` passed: what the app is, the menu and the three sub-apps, how
   to run it, the checks, the three reference indexes linked. Check: `grep -c
   "scene" README.md` is at least 1 and every link resolves.
4. The developer reference passed in pairs with its rule documents:
   `foundation.md` with `foundation-rules.md`, `component-taxonomy.md` with
   `component-rules.md`, `events-and-state.md` with `state-rules.md`,
   `sub-apps.md` with `sub-app-rules.md`, `scene.md` with `scene-rules.md`,
   `catalog.md` and `concept-mapping.md` with `catalog-rules.md`; then
   `console.md`, `performance.md`, `conventions.md`, `scripts.md`,
   `storybook.md` and the two indexes; then the 33 library READMEs, each against
   its library's public API. Check: for each pair, every command
   the rule document names exits 0 when run as written (recorded in the
   census), `npm run check:scripts` exits 0 after `scripts.md`, and every command
   a library README names exits 0.
5. The relative-link check over the census's standing documents, recorded in
   the evidence README. Check: zero unresolved.
6. `npx nx format:check` and `npm run i18n:check`. Check: both exit 0.
7. Dependency check as WO-015 step 15. Check: prints nothing.
8. Gate plain and review. Check: passing rows, no tracked-byte mutation.
9. Launchpad write-back: the profile's implementation map and command table
   corrected where the passed documents disagree; WS-001's delivery states
   by the final review. Check: `npm run test:docs`.
10. The publish, review and records steps as WO-007 steps 15 to 17, with the
    branch `docs/quality-pass-reference-documents`, the title `docs: pass the
    reference documents for usefulness and currency`, `docs/evidence/WO-026/`
    and `docs/final-reviews/WO-026/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npm run check:scripts`, `npm run i18n:check`, `npx nx run-many -t lint`; in
the launchpad order worktree `npm run test:docs`; then the target gate plain
and review once each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24, the documents as the surface; no screenshots).**
   The verifier performs the Objective's session on the committed tree: from
   `README.md` alone, start the app and run the checks it names; follow its
   links to the developer reference and find how a feature library is laid
   out, where state lives, how the scene engine stays pure and how the
   catalog is joined, each with the demonstrating file named and existing;
   open the AI reference and run every command the scene and catalog rule
   documents name. The VER report carries a `## Walkthrough` section with the
   dated steps and states in the verifier's own words what each document
   told them and anything they could not find or that described a surface
   that does not exist. Met only when every step completed and that
   statement is present.
2. `docs/evidence/WO-026/census.md` lists every file `git ls-files '*.md'
   '**/*.md'` prints in the target at the reviewed tree, each with one of the
   kinds the Design names and its reason, and every standing document with
   `changed` (and a one-line account) or `unchanged` and its unresolved facts
   (or `none`); the evidence README's script asserts the file list equals the
   census's rows.
3. Every route (`BasePaths`, `ChildPaths`), library alias
   (`@dotln-angular/*`), npm script and `tools/scripts/*` file a standing
   document names exists at the reviewed tree (the census records the
   extraction and the check with zero missing), and no standing document
   names `provideSceneTestKit`, the arriving pages, `tool-list` or the filter
   row (`grep -rlE "provideSceneTestKit|arriving page|tool-list" README.md
   docs/dev-reference docs/ai-reference` prints nothing, and the same pattern over
   the files `git ls-files 'libs/**/README.md'` prints finds nothing).
4. Every command a rule document under `docs/ai-reference/` names exits 0
   when run as written at the reviewed tree (the census records each with
   its exit code); `npm run check:scripts` exits 0.
5. Every `](…)` link in a standing document that names a repository path
   resolves (the evidence README records the check with zero unresolved);
   `npx nx format:check` exits 0.
6. `git diff --name-only <base> HEAD` in the target names no file outside
   `README.md`, the READMEs under `libs/`, `docs/dev-reference/`, `docs/ai-reference/`,
   `RELEASE-NOTES.md` and `docs/dotln/`; `package.json`'s `dependencies`
   keys equal the base's.
7. `node scripts/target-gate.mjs WO-026 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, `docs/evidence/WO-026/census.md`,
`docs/evidence/WO-026/README.md` and
`docs/evidence/WO-026/host-qualification.md`.

**Known issues and carry-ins:** This order and WO-025 are a lane pair in the
sequence: different repositories, disjoint surfaces, no edge; the operator
may run them one at a time. If a concept-study batch (WO-020 to WO-024)
merges before this order activates, `catalog.md` and `catalog-rules.md` carry
their §Studies and rules and this pass reads them as part of the set; if this
order merges first, those batches integrate `main` and write into the passed
documents. `docs/dev-reference/workspace/generator-log.md` is a ledger and is
not rewritten. The base is WO-015's merge commit, the target's `main` at
filing. This order activates only on a launchpad whose starter carries core
WO-221's `--draft` form; the draft pull request and its workflow runs are a
final-review obligation read from `docs/evidence/WO-026/preview-pr.json`,
never a criterion. `Target release classification: patch` and `Target
release notes: reviewed` are set under WO-012's declared policy.

**Non-goals:** editing `docs/dotln/` records, the generator log or the
licence notices; changing code, routes, scripts or configuration to match a
document (a document that disagrees with the code is corrected, and a code
defect found is boarded under rule 21); a documentation tool or site; the
launchpad's documents (WO-025).

**Operator-review assumptions:** the operator accepts the census's kind
judgments and the pairing of developer and rule documents, and reads the one
draft pull request before final review, which the final publish reuses.
