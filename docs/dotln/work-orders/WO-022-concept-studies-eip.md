# WO-022 — Concept studies III: the twenty messaging patterns of agents in concert, from Enterprise Integration Patterns, each with a flow drawing that steps messages through channels

**Model:** any capable model; state the model and effort actually run
(07-execution-guide.md §Model-specific notes).
**Effort:** executor xhigh+; verifier xhigh; reviewer xhigh.
**Track:** delivery
**Release classification:** none; a target order records no launchpad release.
**Repository:** dotln-angular @ 4c21c586634ac8a5ab5dba9852cd7da81c6d6ee9
**Target release classification:** minor
**Target release notes:** reviewed
**Cost:** adds `libs/shared/catalog/src/studies/eip/` (twenty records), the
`flow` family under `libs/features/tools/src/lib/composites/study-visuals/flow/`,
the executable modules and specs the records name under
`libs/features/tools/src/lib/studies/eip/`, one coverage row and one rule,
about 40 source files plus twenty data records; adds no runtime dependency.
Removes nothing. Wall-clock: about 6 to 10 hours of executor work, of which
the fan-out runs in parallel, plus the fixed cycle; unknown until run.
Context bytes: the study record, check, families and rules as the target's
`main` leaves them at activation (WO-020's, with WO-021's changes),
`catalog.md` §Studies, the twenty catalog rows with their hooks, this order,
about 180 KB for the executor; each author reads two rows, the contract and
the public pattern pages it cites. Commands added: none. Tokens: unknown
until run; recorded per worker. Steps: 12. Re-mints: none. Refutations paid:
the 2026-10-30 second pass's receipt, the 2026-11-01 pass's and the
2026-11-01 second pass's (receipt 017, on the text after its D1; its D4 is
an authorized amendment, WO-022-D001, which the next planning pass's
refutation judges).
**Nomination provenance:** the operator's direction of 2026-10-30 (ignored
intake capture `docs/intake/notes/planning-2026-10-30-second.md`, SHA-256
`8e8cdbeb9b227932d9119b5a012a72086a1ebe349f368b42b0ff788d9060382e`); the
depth direction of 2026-10-26 (capture SHA-256
`5742f0a794ee937eba3573e29fa99c18df074f293a583b0fbbb2ab55826cade4`); the
catalog rule that a concept is applied in more than one place (the target's
`concept-mapping.md`, WO-014) and the `dotlnHooks` the EIP rows carry toward
the platform's mechanisms; register row `FUP-5f1cdfde5e860902` allocated to
WO-020 to WO-024. Planner-synthesized by the 2026-10-30 second planning pass
([planning document](../planning/concept-batches-and-quality-passes-2026-10-30.md)
§Orders filed and amended, D4 and D5). Opaque identifier, not a priority.
**Depends on:** WO-020 merged (hard: the record, the check, the study
composite, the addressable route and the fan-out procedure; the base above is
WO-020's merge commit, DotLn-Angular #11, set by the 2026-11-01 pass; the
target publish describes the change from the merge base since starter
v0.96.1, so a later `main` at activation publishes right too); WO-021 merged
(hard: the study model's family discriminator, which the `flow` family
needs as the second family without motion frames, and the `marbles` family
the executable arm's examples are drawn by; the 2026-11-01 pass, D4, on all
three of its reviews).
**Workstream:** WS-001

<!-- dotln-dependencies:start -->
[
  {
    "workOrderId": "WO-020",
    "relation": "hard",
    "reason": "the concept-study record, check, study composite, addressable route and fan-out procedure this batch reuses; the base line is WO-020's merge commit and publishes right under starter v0.96.1's merge-base publish"
  },
  {
    "workOrderId": "WO-021",
    "relation": "hard",
    "reason": "the study model's family discriminator the flow family needs as the second family without motion frames, and the marbles family the executable arm's examples are drawn by"
  }
]
<!-- dotln-dependencies:end -->

**Cites (read these sections):** `docs/workstreams/WS-001-dotln-angular.md`
(house rules 8, 16, 23, 24, 25, 26; §The app and its sub-apps, §Design
direction); `docs/repositories/dotln-angular.md`; `docs/product/concept-study.md`;
`docs/control/budgets.json` (`subagentCap`); the target's `catalog.md`
§Studies and `catalog-rules.md` as the target's `main` leaves them at
activation (WO-020's, with WO-021's executable rule), and
`docs/dev-reference/architecture/concept-mapping.md` (the mapping pass and
the DotLn hooks); WO-020's `fan-out.md`.

**Objective:** (the operator's session, WS-001 rule 24) the operator opens
Tools, Catalog, chooses Enterprise Integration Patterns and sees twenty
studied concepts; they open Aggregator and read its study: the idea in plain
words (many related messages become one when the set is complete) and a
situation it serves (three reviewers' findings on one order gathered before
the order moves), a flow drawing of that example they step message by
message, with the channels, the correlation and the completion condition
named in the text equivalent, the ordinary pseudocode of the aggregator's
state, an RxJS reading of the same flow labelled executable when its module
and spec exist, how Apache Camel and Spring Integration name and implement
it, the public pattern page and the book as references, the limits (a lost
message holds the set forever without a timeout) and the nearby patterns as
links (Correlation Identifier, Resequencer, Splitter). They open
Publish-Subscribe Channel and Competing Consumers and watch the same message
reach every subscriber in one and one consumer in the other. They open
Request-Reply and follow the Correlation Identifier link into its own study.
What the operator learns is the vocabulary of agents handing records through
channels and where each pattern fails; what they decide is which pattern the
machinery view or a toy should show next.

**Observed gap (dated 2026-10-30):** at `6268de9` the catalog carries 288
EIP rows (97 patterns), 31 typed with `channel.policy` transforms for the
`channels` scene type and most of them carrying DotLn hooks, none studied;
no `flow` family exists; the machinery view (WO-016) is filed and will show
agents in their slots over the platform's public records, for which these
patterns are the vocabulary.

**Design:**

- **The `flow` family** (`composites/study-visuals/flow/`): endpoints and
  channels as boxes and lines laid out by the model (left to right, a column
  per stage), messages stepping along the lines on command with the current
  message's content named in the text equivalent, a stage's state (a buffer,
  a store, a filter's rule) shown beside it as prose; reduced motion steps
  without transition. First rendered pair (rule 25): A, a left-to-right
  pipeline with stages as boxes; B, a swim-lane layout with one lane per
  endpoint and messages crossing lanes; one variable, the layout; both at
  1440 and 360; the rounds continue until the operator says done.
- **Examples in the app's own terms**: each study's example is a small flow
  from the platform's public vocabulary or the app's own (an order's records
  through the planner, executor, verifier and reviewer; the catalog's
  loader answering the Tools home; the scene's events), chosen by the author
  for the pattern and stated as an analogy, never as a claim that the
  platform implements the pattern that way (`concept-mapping.md`); the row's
  DotLn hooks are carried into the study's situation where they fit.
- **Executable arm where it exists**: a pattern whose mechanism is a stream
  transformation (Aggregator, Resequencer, Content-Based Router, Recipient
  List, Message Expiration, Competing Consumers and Publish-Subscribe
  Channel among the twenty, and Message Filter or another such pattern a
  substitution brings in) carries `executable: { kind: 'rxjs', module }`
  with a marble spec, drawn by the `marbles` family inside the study beside
  the flow drawing where it helps; a pattern that is a structure or a
  protocol (Canonical Data Model, Control Bus, Message Store, Transactional
  Client, Channel Adapter) marks `executable: null` with its reason.
- **Implementations and references**: Apache Camel's and Spring Integration's
  public documentation pages for the pattern (each introduced on its own
  terms), one further public implementation where one exists; the public
  pattern catalog page and the book's publisher page as references, each with
  `accessed` and `supports`. Own words throughout; no passage of the book
  (rule 23; the order's publishing decision at activation).
- **The twenty concepts**, by the pass's rule (the twenty most-related rows
  by resolved in-degree, ties toward typed rows then source order):
  `eip:110` Aggregator, `eip:65` Publish-Subscribe Channel, `eip:87`
  Correlation Identifier, `eip:83` Request-Reply, `eip:211` Competing
  Consumers, `eip:184` Control Bus, `eip:60` Message Translator, `eip:170`
  Transactional Client, `eip:131` Process Manager, `eip:105` Recipient List,
  `eip:192` Message Store, `eip:99` Content-Based Router, `eip:71`
  Guaranteed Delivery, `eip:91` Message Expiration, `eip:146` Canonical Data
  Model, `eip:73` Channel Adapter, `eip:78` Command Message, `eip:120`
  Resequencer, `eip:175` Message Dispatcher, `eip:80` Event Message. One
  recorded substitution under the rule is admitted as in WO-020.
- **The fan-out**: WO-020's procedure, at most twelve workers, with the
  factual critic also checking that every analogy to the platform is marked
  as one and that no study claims the platform implements a pattern.
- **Documents:** `catalog.md` §Studies gains the EIP coverage row and the
  `flow` family; `catalog-rules.md` gains the rule that a study's analogy to
  the platform is stated as an analogy with the platform's public record it
  reads.

Rejected: examples from a generic order-processing domain (axis: the
operator's sandbox explains the platform's machinery, and the rows' hooks
already point there); every pattern executable in RxJS (axis: a protocol or a
data-model pattern has no stream to run, and a forced example misleads); the
`flow` family drawn with a graph-layout dependency (axis: twenty small flows
lay out by hand in the model, and `concept-study.md` selects no renderer).

Live-run surfaces at the base: the catalog with WO-020's studies and the
addressable readings.

**Deliverables:** the twenty records with their modules and specs where
executable; the `flow` family with its stories and specs; the coverage row
and rule; `docs/evidence/WO-022/` with the fan-out record, the review record,
the link check, the walkthrough and its screenshots, and the design record.

**Execution plan:**

1. Base guard read with WO-014-D001, for WO-022: the target's `main` must
   contain the Repository pin and WO-021's merge (`git merge-base
   --is-ancestor <commit> origin/main` exits 0 for each; a `main` that has
   left the pin behind, as WO-005 step 1 refuses, stops for a planning
   pass), then the target worktree fast-forwards to the target's `main` and
   that integrated commit is the baseline of every later comparison;
   activation as WO-005 step 1; read the harness usage and record the
   subagent remainder; record the publishing decision as WO-020 did.
2. The `flow` family with stories `StudyFlow` and a spec that renders a
   three-stage model to its text equivalent. Check: `npx nx test tools` exits
   0; `npm run lint:components` exits 0.
3. The first rendered pair (A pipeline, B swim lanes) at 1440 and 360; the
   rounds; the rejected implementation removed with its record. Check:
   `grep -c "Round" docs/evidence/WO-022/design/comparisons.md` is at least 1.
4. The authors' brief with the analogy rule into `fan-out.md`; dispatch the
   ten authors; merge the twenty drafts. Check: `npx nx test tools` exits 0
   over the executable modules' specs.
5. Dispatch the two critics; dispose the findings; rewrite through the same
   authors; set `checked`. Check: `npm run studies:check` exits 0 over
   `studies/eip/`.
6. The link check into `docs/evidence/WO-022/README.md`. Check: every URL has
   a status.
7. e2e `apps/dotln-e2e/src/catalog.spec.ts`: EIP shows twenty studied;
   Aggregator's study steps its flow under reduced motion with the text
   equivalent naming the message; Publish-Subscribe Channel's and Competing
   Consumers' studies open from the contents; the Correlation Identifier link
   opens its reading; axe; no overflow at 360, 768 and 1440. Check:
   `npx nx e2e dotln-e2e` exits 0.
8. The walkthrough as WO-020 step 11, under `docs/evidence/WO-022/`. Check:
   the files exist.
9. Documents: the coverage row, the family and the rule. Check:
   `grep -c "analogy" docs/ai-reference/catalog-rules.md` is at least 1.
10. Dependency check as WO-015 step 15; `npm run check:bundle`. Check: prints
    nothing; the chunk sizes recorded.
11. Gate plain and review. Check: passing rows, no tracked-byte mutation.
12. Launchpad write-back (the profile's implementation map names the `flow`
    family; WS-001's delivery states by the final review); then the publish,
    review and records steps as WO-007 steps 15 to 17, with the branch
    `feat/eip-concept-studies`, the title `feat: add concept studies for the
    messaging patterns`, `docs/evidence/WO-022/` and
    `docs/final-reviews/WO-022/`.

**Preflight:** in the target worktree `npx nx format:check`,
`npx nx run-many -t lint test build`, `npm run lint:fixtures`,
`npm run lint:components`, `npm run lint:hygiene`, `npm run check:fixtures`,
`npm run studies:check`, `npm run test:tooling`, `npm run i18n:check`,
`npm run check:bundle`, `npx nx e2e dotln-e2e`; in the launchpad order
worktree `npm run test:docs`; then the target gate plain and review once
each.

**Acceptance criteria (all required)**

1. **Use (WS-001 rule 24).** The verifier performs the Objective's session in
   the served production build: open Tools, Catalog; choose Enterprise
   Integration Patterns and read the studied count; open Aggregator and step
   its flow, expand the pseudocode and the limits; open Publish-Subscribe
   Channel and Competing Consumers; open Request-Reply and follow the
   Correlation Identifier link. The VER report carries a `## Walkthrough`
   section with the dated steps and the screenshots at 360, 768 and 1440
   under `docs/evidence/WO-022/walkthrough/` (`ls docs/evidence/WO-022/walkthrough | wc -l`
   prints at least 15), and states in the verifier's own words when an
   aggregator completes, how the two channel patterns deliver differently,
   and what a correlation identifier is for, as read from the studies alone.
   Met only when every step completed and that statement is present.
2. `npm run studies:check` exits 0 over `libs/shared/catalog/src/studies/eip/`
   with exactly the twenty ids this order names (or one recorded
   substitution), every record `checked` with at least two reviewers, every
   reference complete, and `studies-summary.json` current.
3. The seven records among the twenty whose mechanism the Design names as
   a stream transformation (Aggregator, Resequencer, Content-Based Router,
   Recipient List, Message Expiration, Competing Consumers and
   Publish-Subscribe Channel) carry `executable` naming a module under
   `libs/features/tools/src/lib/studies/eip/` with a marble spec beside it
   that imports that module and runs the study's example under
   `TestScheduler`, asserting its expected emissions and completion. If
   criterion 2's one recorded substitution replaces one of the seven, the
   decisions file names the replaced record and its replacement, and the
   replacement carries a module and spec the same way when its mechanism is
   a stream transformation. Every other record with `executable` does the
   same; every record with `executable: null` carries its reason in the
   decisions file (the file names each, and names none of the seven); and
   `npx nx test tools` exits 0 with those specs counted in its output.
4. `docs/evidence/WO-022/fan-out.md`, `review.md` and `README.md` as WO-020's
   criterion 4, the review record also listing each study's platform analogy
   as checked.
5. `npx nx e2e dotln-e2e` exits 0 and includes the step 7 cases, axe at the
   board spec's threshold and no horizontal overflow at 360, 768 and 1440.
6. `npx nx build dotln --configuration=production` exits 0 within the
   declared budgets with the `flow` family and the records in lazy chunks,
   `npm run check:bundle` passes with the chunk sizes recorded, and
   `package.json`'s `dependencies` keys equal the base's.
7. `docs/dev-reference/architecture/catalog.md` §Studies lists Enterprise
   Integration Patterns with twenty studied, and
   `docs/ai-reference/catalog-rules.md` states the analogy rule
   (`grep -c "analogy" docs/ai-reference/catalog-rules.md` is at least 1).
8. `docs/evidence/WO-022/design/comparisons.md` records the first pair (A
   pipeline, B swim lanes) and every later round with its pick, and the
   decisions file records the operator's word that ended the rounds; the
   decisions file names the removed candidate's files and `ls` on each prints
   nothing.
9. `node scripts/target-gate.mjs WO-022 --review` records a passing row for
   every declared command with no tracked-byte mutation, and
   `npm run test:docs` passes in the launchpad order worktree; the Preflight
   line ran before the first full gate.

**Evidence gate:** the gate rows, the recorded command outputs,
`docs/evidence/WO-022/README.md`, `fan-out.md`, `review.md`,
`walkthrough.md` and its screenshots, `design/`, and
`docs/evidence/WO-022/host-qualification.md`.

**Known issues and carry-ins:** The base line is WO-020's merge commit
(`4c21c58`, DotLn-Angular #11), set by the 2026-11-01 pass. The target
close's residue declaration this order once repeated from WO-021's step 2
is on both `main`s since WO-021's merge (DotLn-Angular #12, launchpad #48),
which settled the declaration's checks; the rest of what its criterion
checked is the kit's at the phases that own it: the release close refuses
undeclared leftover material and an unclean worktree, and
`final-review-result pass` refuses an unclean target after the reviewed
commit. The 2026-11-01 second pass removed the step and its criterion
([planning document](../planning/criterion-9-phase-2026-11-01.md), D1). The
same pass rewrote criterion 3 (D4): the Design's eight stream
transformations included Message Filter, which is not among the twenty
criterion 2 fixes, so the criterion names the seven that are; each marble
spec now imports its module and runs the study's example; and the
criterion says how criterion 2's one substitution meets it. It also points
the executor's reading at the target's `main` rather than at WO-020's
state, which WO-021 changed.
This order follows
WO-021 and depends on it (the study model's family discriminator and the
`marbles` family; the 2026-11-01 pass, D4, on all three of its reviews):
it fast-forwards to the target's `main` with WO-021's merge at activation
and rewrites `studies-summary.json` before its publish. WO-016's machinery view is the surface where these patterns
would be seen running; a study's "see it in the machinery view" link is the
pass's candidate after WO-016 merges, not this order's. The sixty-odd
remaining EIP patterns are the next batches' candidates (the filing pass's
C3). This order activates only on a launchpad whose starter carries core
WO-221's `--draft` form; the draft pull request and its workflow runs are a
final-review obligation read from `docs/evidence/WO-022/preview-pr.json`,
never a criterion. `Target release classification: minor` and `Target
release notes: reviewed` are set under WO-012's declared policy.

**Non-goals:** the machinery view or any runtime channel in the app; typing
further EIP rows for the `channels` scene; the remaining patterns; the general
search controls (WO-018).

**Operator-review assumptions:** the operator accepts the in-degree selection
and the twenty patterns it names, accepts examples drawn from the platform's
public vocabulary as analogies, judges the first pair and ends the rounds in
their own words, and reads the one draft pull request before final review,
which the final publish reuses.
