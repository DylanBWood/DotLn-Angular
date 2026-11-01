# WO-020 decisions

## WO-020-D001

```json
{
  "id": "WO-020-D001",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 1, the base guard",
  "decision": "Fast-forward the clean target worktree from the activation base 6268de9 to the target's main at eb9eeec before any implementation, as step 1 directs when the base has moved. The recorded activation base stays 6268de9 in the order's Repository: line and its WorkOrderActivated event; the publish describes the change from the merge base.",
  "evidence": [
    "git ls-remote origin refs/heads/main in the target printed eb9eeec80eec0cfacbd973351222cab39fdc7919, four commits past the activation base: the reference-document pass that WO-026 merged as #10, documents and records only.",
    "git merge --ff-only origin/main in DotLn-Angular-wo020 moved HEAD to eb9eeec with no conflict and git status --short printing nothing; npm ci then installed from the unchanged lockfile and exited 0.",
    "The route guard holds: grep -c -- '--draft' scripts/worktree.mjs prints 5. Canonical status shows the base, phase active, and the hard edges on WO-019 and WO-015 met."
  ],
  "rejected": [
    {
      "option": "Build on 6268de9",
      "reason": "Step 1 names the fast-forward; building on the older base would leave WO-026's documents out of §Studies and the rules this order extends."
    },
    {
      "option": "Stop for a planning pass to reset the base",
      "reason": "That is WO-005's guard as written, but this order's own step 1 says to fast-forward when the base moved, which is the more specific clause (WO-014-D001)."
    }
  ],
  "reopenWhen": "The target's main moves again before the gates, in which case the worktree fast-forwards again if nothing conflicts."
}
```

## WO-020-D002

```json
{
  "id": "WO-020-D002",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 1, the publishing decision",
  "decision": "A study is written in its author's own words from the row's definition and public sources. It quotes no passage of a work in copyright, names the chapter it reads, and cites public implementations and references by stable URL with the date read. This is the order's own publishing decision under rule 23, not a clean-room rule: the works remain the app's subject matter, and the mined definitions keep their provenance beside each study.",
  "evidence": [
    "The order's §References and the published word requires this decision to be recorded at activation. WS-001 rule 23 says whether a verbatim passage of a work still in copyright is committed is an ordinary publishing question the order that wants one decides in its decisions file.",
    "The authors' brief in fan-out.md carries the rule, and the factual critic opens every reference and implementation link."
  ],
  "rejected": [
    {
      "option": "Quote short passages of the book with attribution",
      "reason": "No study needs one, the record has no quotation field, and an own-words study is what the operator-review assumptions accept."
    }
  ],
  "reopenWhen": "A later batch wants a verbatim passage; that order decides for itself."
}
```

## WO-020-D003

```json
{
  "id": "WO-020-D003",
  "date": "2026-10-31",
  "dispatch": "resume: next; the operator's direction during this dispatch (capture e6f806fd…)",
  "decision": "Every DotLn worker of this phase runs on Codex: the ten authors, the two critics and the three independent reviewers. From this Claude Code session that means one codex exec per worker, gpt-6.1-sol at effort max, launched by a session-scratch script that follows the kit's isolation (a private CODEX_HOME holding only a symlink to the operator's auth.json, --ignore-user-config, no MCP or memories, an empty shell environment, a read-confined filesystem). It differs from the kit's startCodexEpisode in one way: sessions persist inside that private home, so a rewrite continues the same worker. Each author works in its own copy of the target with no .git, so it can run its specs without touching either repository, and the executor stays the only writer of both worktrees. This is the live direction over the order's dotln-worker or dotln-worker-fable and the operator record's default, for this phase only.",
  "evidence": [
    "The operator directed this while the executor was reading the order, on 2026-10-31 (ignored capture docs/intake/notes/wo-020-session-2026-10-31-codex-workers.md, SHA-256 e6f806fd0d49e26381691de0392a1657f713e4855d3bda92417c57f3fe1fe3c6). docs/operator/README.md §When this record changes has a role follow the live direction and say so in its handoff.",
    "docs/product/07-execution-guide.md §Model-specific notes pins spawned Codex workers at gpt-6.1-sol, max. spawn_agent exists only inside a Codex host, so a Claude Code root reaches Codex through the CLI, codex-cli 0.166.0, logged in with ChatGPT.",
    "A probe through the launcher on 2026-10-31 ran node 26.9.0 and git, wrote inside its own directory, was refused ~/.ssh, ~/.zshrc and ~/.codex/config.toml, reached the network and returned one web search, in 59 seconds and 96,253 tokens. A resume of the same thread answered from that context in 4 seconds. The operator's config.toml digest was unchanged across both.",
    "codex exec --json reports token usage on turn.completed, so each worker's total is observed rather than estimated. A resumed thread reports the thread's cumulative usage: the probe's second run read 120,691 against 96,253, so a worker's total is its last receipt, never a sum of its receipts.",
    "Plan under subagentCap 20 (docs/control/budgets.json): ten authors, two critics and three reviewers, fifteen in all, reusing each by resume and spawning no descendants. The probe was not a worker. node scripts/harness.mjs usage read 0 of 20 observed subagents at entry; Codex workers launched through a shell are outside that hook's sight, so the count is this explicit session count and the reported remainder stays unknown."
  ],
  "rejected": [
    {
      "option": "dotln-worker agents, the order's named type",
      "reason": "The operator's live direction replaces them for this phase."
    },
    {
      "option": "The kit's startCodexEpisode and codexExecArgv unchanged",
      "reason": "Their shared --ephemeral flag persists no session, so a rewrite could not continue that author, which the order's fan-out requires."
    },
    {
      "option": "Have authors write into the target worktree",
      "reason": "One writer per worktree; ten parallel writers in one tree would also collide."
    }
  ],
  "reopenWhen": "The operator changes the worker route, or codex exec cannot carry a worker the phase needs."
}
```

## WO-020-D004

```json
{
  "id": "WO-020-D004",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 1, the fan-out's stop rule declared before the spend",
  "decision": "Take 117,733,609 tokens as the fan-out's stop figure: WO-014's recorded order total, the value WO-018 and the 2026-10-26 refutation receipt recorded from npm run meta. The fan-out stops with a recorded decision when the workers' totals summed with this session's own pass it.",
  "evidence": [
    "npm run meta at activation prints tokens: unavailable for WO-014, and docs/evidence/WO-014/meta.json does not exist: the order's session journals were removed with its worktree before the closed-journal window existed, and only WO-025 keeps a meta.json among the recent orders.",
    "docs/work-orders/WO-018-art-of-war-map-and-toys.md records the same rule with this figure, 117,733,609 tokens on 2026-10-26, and the same number stands in docs/planning/acceptance-by-use-2026-10-26.md and in receipt 011 under docs/planning/refutations/.",
    "The usage reading before the first worker: 117,656 tokens, source claude-transcript-message-usage, scope dispatch, at 2026-10-31T19:19:28Z, with 0 of 20 observed subagents."
  ],
  "rejected": [
    {
      "option": "Treat unavailable as no stop rule",
      "reason": "The rule was declared before the spend and the figure it names is recorded; losing the printout does not lift it."
    },
    {
      "option": "Use WO-014's handoff reading of 27,044,047 tokens",
      "reason": "That is one dispatch's reading at handoff, not the order total the rule names."
    }
  ],
  "reopenWhen": "The stop figure is passed, or core restores the printed total."
}
```

## WO-020-D005

```json
{
  "id": "WO-020-D005",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 6, planning the fan-out",
  "decision": "Ten authors write the nineteen concepts Arrive does not cover: nine with two and author-07 with the Steering pipeline alone, because Arrive's record is the migrated worked example every author receives. Arrive still goes through both critics. Dispatch the authors alongside the comparison rounds instead of after them: the rounds decide where a study sits and how it reads, and the record's shape and the model contract do not depend on either.",
  "evidence": [
    "The order's twenty concepts include Arrive, and step 4 migrates it before any author runs, while the fan-out line says ten authors with two concepts each. Its Design makes the decided Arrive record the worked example an author receives.",
    "Ten authors cost no more than the order's plan, and the pipeline row's study is the only one with no engine behaviour behind it, so it takes the whole of one author."
  ],
  "rejected": [
    {
      "option": "Nine authors",
      "reason": "Pairing the pipeline with another row would split an author's attention on the one study that has to build its own mechanism."
    },
    {
      "option": "Have an author rewrite Arrive",
      "reason": "Its numbers are pinned by criterion 3 and its form was decided in WO-019's rounds."
    },
    {
      "option": "Wait for the rounds to end before dispatching",
      "reason": "The operator ends the rounds, so that could hold the largest parallel work for no reason: neither what the rounds vary nor the record's shape reaches an author's output. If a round does change the contract, a rewrite continues the same author."
    }
  ],
  "reopenWhen": "A comparison round changes the record's shape or the model contract."
}
```

## WO-020-D006

```json
{
  "id": "WO-020-D006",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 5, comparison round 1",
  "decision": "The study stays inside the reading, below the definition, with the shelf and contents beside it: the operator picked A in round 1. Candidate B, the study on its own page at /tools/catalog/<id>/study, left the code when the round was decided. The comparison continues until the operator says it is done.",
  "evidence": [
    "Asked through the host's question dialog on 2026-10-31 with both candidates' captions and both builds served locally; the answer was A. Screens are under docs/evidence/WO-020/design/round-01/.",
    "design/rejected-implementations.md records what B was. grep for studyHref, StudyPage, study-candidate and ChildPaths.Study under libs and apps prints nothing."
  ],
  "rejected": [
    {
      "option": "Candidate B, the study on its own page",
      "reason": "The operator preferred A."
    }
  ],
  "reopenWhen": "A later round or the operator reopens where the study lives."
}
```

## WO-020-D007

```json
{
  "id": "WO-020-D007",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 5, comparison rounds 2, 3 and 4",
  "decision": "Three more preferences stand. Round 2: the idea, the situation and the example come first, then the drawing (A). Round 3: the drawing gains Play and Pause beside the hand controls (B); it runs only on command, from the selected moment, at the example's own pace, stops on any hand step, on leaving a reading and at the end, and is not offered to a reader who asked for reduced motion. Round 4: the drawing and the chart stay behind a switch (A), not stacked. The comparison stays open until the operator says it is done.",
  "evidence": [
    "Each pair was asked through the host's question dialog on 2026-10-31 with both candidates' captions and both builds served locally; the answers were A, B and A. Screens are under docs/evidence/WO-020/design/round-02/ to round-04/.",
    "A browser probe of the Play build showed no movement before Play was pressed, the slider advancing under Play, no movement after Pause, and no Play button with reducedMotion set to reduce.",
    "The rejected stacked layout and the drawing-first order were never kept in the code; design/rejected-implementations.md records them."
  ],
  "rejected": [
    {
      "option": "Drawing before the prose",
      "reason": "The operator preferred the prose first."
    },
    {
      "option": "By hand only",
      "reason": "The operator preferred Play."
    },
    {
      "option": "Drawing and chart always shown together",
      "reason": "The operator preferred the switch."
    }
  ],
  "reopenWhen": "The operator reopens one of these rounds."
}
```

## WO-020-D008

```json
{
  "id": "WO-020-D008",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 3, the addressable route",
  "decision": "The address owns the open reading. /tools/catalog/:toolId selects it through the routed input, and the persisted store keeps the history, the chosen work, chapter and section and the newest reading's title, no longer the selected id. Back is recognized by reaching the id on top of the return stack, so the browser's Back and the page's own return control make the same store transition. Reading links in composites are real addresses passed in as a hrefFor function with a plain click handled in place, because composites may not use the router (R1). A reading at /tools/catalog shows no reading rather than redirecting to the last one.",
  "evidence": [
    "ChildPaths.Reading is the order's literal route. Two route configurations recreate the page when crossing between /tools/catalog and a reading; the store now skips a reload on reopen, so no loading state flashes.",
    "catalog-page.spec.ts drives the real router: a shared link opens its reading, an unknown id says so, opening writes the address, Location.back() returns to the previous reading and leaves the return stack empty, and choosing another work leaves the reading.",
    "lastTitle was added to the persisted shape because the home must name the last reading without loading a work's chunk; a reading stored before it restores with a null title and the home links to it without naming it, until a catalog load gives the title of the newest surviving reading (D018)."
  ],
  "rejected": [
    {
      "option": "A URL matcher so one route configuration serves both addresses",
      "reason": "The order names ChildPaths.Reading as a literal path, and rebuilding the page on that one crossing has no visible cost."
    },
    {
      "option": "RouterLink in the composites",
      "reason": "Lint refuses @angular/router there and R1 keeps them free of it."
    },
    {
      "option": "Redirect /tools/catalog to the last reading",
      "reason": "It would hide the shelf's invitation and needs a stored id the address now replaces; the history and the home both offer the last reading."
    }
  ],
  "reopenWhen": "A later order wants /tools/catalog to resume the last reading."
}
```

## WO-020-D009

```json
{
  "id": "WO-020-D009",
  "date": "2026-10-31",
  "dispatch": "resume: next; steps 2 and 4, the record and the composite",
  "decision": "Keep the record exactly as the order specifies and carry the decided form through conventions on it. A mechanism step and its lines of code are matched one to one by the blank-line blocks of pseudocode.ordinary, which the check enforces, so WO-019's round 22 form (complete code first, each step's own lines in a closed disclosure) survives without a new field. Per-moment values fill {name} placeholders in the record's prose; the worked arithmetic, the moment's note and the comparison chart come from the model, so numbers never live in prose. The hand-wired stream diagrams of the Arrive study (data flow and event timeline) retire with the composite: the record carries no such representation, and the marbles and flow families land with the batches that need them. Their explanation survives as comments in the RxJS reading.",
  "evidence": [
    "The order fixes the record's type and says a change to it after merge is a new schema version. Its study composite section lists no stream diagram. tools.study.stream.* and the two views left en.json with the hand-wired files.",
    "Criterion 3 holds: arrive.model.spec.ts states the base's assertions against the record's parameters, including the 3.93 overshoot and the chart's tick and path values, and passes.",
    "The Movement and chart switch, the worked step, the code guide, the failure chart and native disclosures with @defer all carried over; the facade is now the single source of open state, the study owns its focus, and ids carry a per-instance suffix (WO-019-D030)."
  ],
  "rejected": [
    {
      "option": "Add lines, worked or comparison fields to the record",
      "reason": "The order gives the shape; these either derive from the code or depend on the run, so they belong to the model."
    },
    {
      "option": "Keep the stream diagrams hand-wired in the composite",
      "reason": "That is the per-concept wiring the order removes, and they would be the only part of a study that no record drives."
    }
  ],
  "reopenWhen": "WO-021 or WO-022 lands marbles or flow; Arrive's RxJS reading can then draw again."
}
```

## WO-020-D010

```json
{
  "id": "WO-020-D010",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 4, the model modules",
  "decision": "Add the engine's pure steering, blending, formation and vector functions to @dotln-angular/scene-engine's public API so the model modules can call them, as the order requires. This adds exports and changes no behaviour, so it stands inside the order's non-goal of changing the engine. Arrive's model keeps its study-local step, because its numbers are pinned by criterion 3 and the engine's arrive fades its speed to nothing at half the target radius instead of snapping at a tolerance.",
  "evidence": [
    "git diff on libs/shared/scene-engine shows public_api.ts alone; the engine's 120 specs and the scene's pinned hashes are unchanged and pass.",
    "Each author's statement records whether engine or local steps run: fan-out.md lists them per study."
  ],
  "rejected": [
    {
      "option": "Have models import engine files by relative path",
      "reason": "Lint forbids it, and it would bypass the library's API."
    },
    {
      "option": "Reimplement steering in the studies",
      "reason": "A study would then explain code that does not run."
    }
  ],
  "reopenWhen": "The engine's behaviour changes, which a study's spec would then show."
}
```

## WO-020-D011

```json
{
  "id": "WO-020-D011",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 5, comparison rounds 5 to 9, and the operator's direction on the rounds (capture 2833030e…)",
  "decision": "Five more preferences stand. Round 5: the controls sit right under the drawing, and the legend and caption follow the moment's text (B). Round 6: a short sentence shows under the drawing and the exact values sit behind a closed Show the numbers disclosure, the full text staying the drawing's accessible name (B). Round 7: a one-line Jump to the study link under the title (B). Round 8: the scene link moves to that line at the top (B). Round 9: the example's inputs are live: each model declares up to three inputs, and a slider reruns the whole model (B). The executor stops asking after each round whether to continue, and keeps bringing pairs until the operator says the process is done.",
  "evidence": [
    "Each pair was asked through the host's question dialog on 2026-10-31 with both captions and both builds served locally. Screens are under docs/evidence/WO-020/design/round-05/ to round-09/.",
    "After the executor twice asked whether the comparisons were done, the operator directed that it stop asking that after each round and go on until done (ignored capture docs/intake/notes/wo-020-session-2026-10-31-rounds-continue.md, SHA-256 2833030ef185ef073158d9d1db5d0ce5d259508b08ea6c44ad8704e8847b6da5). Each round's question still asks for its pick.",
    "Round 6 keeps the order's text equivalent in the drawing's accessible name and one click away, and the question said so; a study whose frame has no note shows it directly. The rewrite brief makes a note on every frame a requirement.",
    "A browser probe of round 9 set the slowing radius to 8 and saw the reading change, and Back to the example restored the original sentence. tools.facade.spec.ts covers rerun, refusal of a non-number and reset on leaving a reading, and study-models.spec.ts runs every model at each input's minimum and maximum."
  ],
  "rejected": [
    {
      "option": "Legend between the drawing and the controls",
      "reason": "The operator preferred the controls first."
    },
    {
      "option": "The full sentence always shown",
      "reason": "The operator preferred the short sentence."
    },
    {
      "option": "No jump link",
      "reason": "The operator preferred it."
    },
    {
      "option": "The scene link at the foot",
      "reason": "The operator preferred it at the top."
    },
    {
      "option": "A fixed example",
      "reason": "The operator preferred live inputs."
    }
  ],
  "reopenWhen": "The operator reopens one of these rounds."
}
```

## WO-020-D012

```json
{
  "id": "WO-020-D012",
  "date": "2026-10-31",
  "dispatch": "resume: next; the fan-out's stop rule, on the operator's word (capture 91182583…)",
  "decision": "Lift the fan-out's token stop for this order. The stop figure of D004 no longer stops the fan-out, and the workers' and the session's totals are still recorded and reported at handoff.",
  "evidence": [
    "At 2026-10-31T20:49:46Z the sum stood at 90.3M of 117.7M: workers 42,746,238, session 47,524,262, mostly cached re-reads. The live inputs the operator had just picked needed every author back, so the stop would probably pass before the fan-out ended.",
    "The operator had asked to be told if a budget needed raising (ignored capture docs/intake/notes/wo-020-session-2026-10-31-budgets.md, SHA-256 40bc7ca6cc097a06bfc1e60da9a1d9aa545a71d019253d0c87e58edd62d80617). Offered 250M, no stop for this order, or keeping 117.7M, they chose no stop (ignored capture docs/intake/notes/wo-020-session-2026-10-31-token-stop.md, SHA-256 91182583e7312171f64d68745732db5f979a416cc530b0d2e2ed519a56340a12)."
  ],
  "rejected": [
    {
      "option": "Keep 117.7M and ship what was rewritten by then",
      "reason": "The operator chose otherwise."
    },
    {
      "option": "Raise it to 250M",
      "reason": "The operator chose no stop."
    }
  ],
  "reopenWhen": "The operator sets a figure again."
}
```

## WO-020-D013

```json
{
  "id": "WO-020-D013",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 7, the first critics' reports",
  "decision": "Take the executor's own share of the reading critic's findings: widen the chart's drawing area to the left so its labels no longer clip, keeping the base's tick and path values; fill {name} placeholders in example.description and limits as well; and add short labels on bodies and marks and arrowheads on vectors, which six authors had reported as gaps. Send everything else back through the same authors with the operator's rounds, as one rewrite.",
  "evidence": [
    "The reading critic's 23 findings: seven clipped chart labels, three unfilled placeholders, and the rest in the authors' prose and drawings. The factual critic opened all 31 URLs with no finding.",
    "The viewBox changed from 0 0 600 320 to -40 0 640 320, so the geometry the base's spec pins is unchanged and arrive.model.spec.ts still passes.",
    "review.md lists every finding with its disposition."
  ],
  "rejected": [
    {
      "option": "Change the chart's left inset",
      "reason": "It would change the numbers criterion 3 pins, for nothing the viewBox cannot do."
    },
    {
      "option": "Have authors work around the missing labels in prose",
      "reason": "Six of them already had, which is what the reading critic objected to."
    }
  ],
  "reopenWhen": "A label collides in a study; then that study's model places it."
}
```

## WO-020-D014

```json
{
  "id": "WO-020-D014",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 5, comparison rounds 10 to 15",
  "decision": "Six more preferences stand. Round 10: the legend and caption sit behind How to read this drawing (B). Round 11: the example's full description sits behind The example in full (B). Round 12: Try another value is a closed disclosure (B). Round 13: with a work chosen and nothing open, the reading area lists the work's studied concepts as links (B). Round 14: a study ends with a Next study link through the work's studied concepts in book order (B). Round 15: labels inside a drawing use the interface's sans-serif (B). Every disclosure's open state moved to the facade, so switching between the drawing and the chart keeps them.",
  "evidence": [
    "Each pair was asked through the host's question dialog on 2026-10-31 with both candidates' captions and both builds served locally. Screens are under docs/evidence/WO-020/design/round-10/ to round-15/.",
    "Rounds 10 to 12 left three small disclosures around the drawing; a native details element would have closed on each view switch, because the family is rebuilt. The order makes the facade the single source of each section's open state; study.spec.ts covers the switch.",
    "mapStudy gained the next concept from the facade's list of the open work's studied concepts in contents order, and the list also fills round 13's links."
  ],
  "rejected": [
    {
      "option": "The legend, the example's description and the inputs always shown",
      "reason": "The operator preferred them on request."
    },
    {
      "option": "Marks only for finding studied concepts",
      "reason": "The operator preferred the list."
    },
    {
      "option": "No hand-on from a study",
      "reason": "The operator preferred Next study."
    },
    {
      "option": "Monospace labels",
      "reason": "The operator preferred the interface's type."
    }
  ],
  "reopenWhen": "The operator reopens one of these rounds."
}
```

## WO-020-D015

```json
{
  "id": "WO-020-D015",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 3, avoidable bundle growth",
  "decision": "Load a study through a small signal and effect in ToolsFacade rather than Angular's resource(). The study and summary reads stay lazy, and the initial bundle stays within 1 kB of the base.",
  "evidence": [
    "check-bundle attribution against a clean export of the base read @angular/core +8,263 bytes, with the initial total 405,626 against 398,223: resource() lives in the eager core chunk once any lazy code uses it. After the change the initial total was 399.26 kB. The remainder is the house icon reaching the shared chunk, and the small route and event additions.",
    "WO-014's first verification failed on avoidable initial growth, and the operator's standing guidance asks for growth to be attributed while implementing."
  ],
  "rejected": [
    {
      "option": "Keep resource() for its brevity",
      "reason": "Eight kilobytes on every route's first load for fifteen lines saved in one lazy facade."
    },
    {
      "option": "Put the study in CatalogStore",
      "reason": "The model loads from the feature, and the store may not know it."
    }
  ],
  "reopenWhen": "Something eager needs resource() anyway."
}
```

## WO-020-D016

```json
{
  "id": "WO-020-D016",
  "date": "2026-10-31",
  "dispatch": "resume: next; steps 7 and 8, the critics' findings and the link check",
  "decision": "Add an illustrative RxJS reading to Flocking, as the Objective requires, and to the four other studies where streams say something the pseudocode does not: Weighted blending, Priority steering, Steering pipeline and Wander. Keep the other fourteen null, since Arrive already carried one. Keep the book's DOI as its citation, recording that doi.org resolves it and the publisher refuses automated clients. Add the link check as a helper, because every batch needs it (rule 26). Remove the authors' spec lines that pinned the draft state, because they would fail on the record's normal lifecycle.",
  "evidence": [
    "All nineteen authors left rxjs null under a brief that said to, and the order's Objective names an RxJS reading in Flocking. A browser test failed on it first.",
    "npm run studies:links printed 200 for 30 of 31 URLs and 403 for the DOI. curl -sI shows doi.org answering 302 to the publisher's page, and a real headless Chromium got that page's Cloudflare challenge. The DOI's content negotiation answers 200 with the book's metadata.",
    "The factual critic corroborated the cited sections in the publisher's preview and raised no finding, and on recheck found no RxJS operator used against its documented behaviour.",
    "Criterion 2 requires every record checked with two reviewers, so a spec pinning the draft state could not pass."
  ],
  "rejected": [
    {
      "option": "Replace the DOI with a page that answers scripts",
      "reason": "The DOI is the stable, canonical citation the order prefers; a bot refusal is not unreachability, and any substitute would be weaker."
    },
    {
      "option": "Add an RxJS reading to all twenty",
      "reason": "The order keeps a representation absent where the idea does not need it."
    }
  ],
  "reopenWhen": "The DOI stops resolving, or a batch's link check finds a refusal that a browser also cannot pass."
}
```

## WO-020-D017

```json
{
  "id": "WO-020-D017",
  "date": "2026-10-31",
  "dispatch": "resume: next; step 5, comparison rounds 16 to 21 and the operator's word that ended them (capture 75d67f52…)",
  "decision": "The comparisons ended after round 21 on the operator's word. Ending them is not design acceptance: acceptance by use stays criterion 1, and the operator reads the draft pull request. Round 16: the open book stays as the studied glyph (A). Round 17: Where this breaks down comes before See it elsewhere (A), a recorded departure from the order's sentence that the sections follow the record's order, on the operator's word. Round 18: inside Follow the mechanism the pseudocode comes first and the worked step after it (B). Round 19: the nearby concepts stay listed (A). Round 20: a study opens on the moment its author chose (A). Round 21: the switch has fixed labels with the chart's title above the chart (B), the operator rejecting the candidate's wording Over time, so the label is Chart.",
  "evidence": [
    "The operator answered through the host's question dialog on 2026-10-31 that the comparisons were done (ignored capture docs/intake/notes/wo-020-session-2026-10-31-rounds-done.md, SHA-256 75d67f529be964e2184b255748533018bb318c5ddb380686674d86aa45c4b6b2). The executor had said it had no further pair that would change how a study reads.",
    "Round 20's first capture used Flocking, which opens at the start in both candidates; the operator reported the two screenshots were the same, and the round was recaptured on Arrive and asked again.",
    "docs/evidence/WO-020/design/comparisons.md records the twenty-one rounds, and rejected-implementations.md what left the code. Every rejected candidate was built for its round and reverted before the next, so no switch or dormant branch remains: libs/features/tools/src/lib/study-candidate.ts and containers/study-page/ no longer exist, and grep for studyHref, StudyPage and study-candidate under libs and apps prints nothing."
  ],
  "rejected": [
    {
      "option": "Keep inventing cosmetic pairs",
      "reason": "Only the operator ends the rounds, and the executor said plainly it had none worth their time; they chose to end."
    },
    {
      "option": "Hold to the record's order for the sections",
      "reason": "The operator picked the limits first, in a round whose question named the order's sentence."
    }
  ],
  "reopenWhen": "The operator reopens the comparisons, or verification or final review finds a design defect in the study."
}
```

## WO-020-D018

```json
{
  "id": "WO-020-D018",
  "date": "2026-10-31",
  "dispatch": "resume: next; the three independent reviewers' first pass",
  "decision": "Fix fourteen of the fifteen reviewer findings in this order, each with a regression test, and defer one, the study model's dependence on motion frames, to the order that adds the first family without them. Arrive's chart now reaches any negative velocity an input produces. A failed summary shows an alert and its own retry over the catalog, which stays readable. The reduced-motion preference is followed while reading, so turning it on stops a running example and withdraws Play. A model that throws, or a record naming a model the list lacks, fails that study alone, and a retry goes back to the record's inputs. The check requires two different reviewers, validates a chunk's export as well as its imports, and returns record problems before anything counts a malformed record; the tooling test pins the order's twenty ids. A reading's stored title follows the newest history id that survives pruning. Models share the drawing width, the bounds and the label rule through studies/drawing.ts.",
  "evidence": [
    "Reviewer pass-one reports, in the session's ignored scratch: criteria six findings, design seven, consistency two. The summary failure was raised twice, so the fifteen are fourteen distinct defects plus the deferred contract change.",
    "Each fix has a test that failed against the reviewers' probe: arrive.model.spec.ts (negative velocities), tools.facade.spec.ts (throwing model, unlisted model, failed summary and its retry, reduced motion turned on, retry restores inputs), catalog-page.spec.ts (the alert and retry rendered), reading.spec.ts (the title follows pruning), drawing.spec.ts (bounds, label priority) and tools/studies.test.mjs (distinct reviewers, chunk export, malformed record, the twenty ids).",
    "The two label helpers were not identical: the two-level study names its anchor and bodies first, the pattern interface its marks first. Merging them blind failed the pattern interface's spec, so withSpacedLabels takes that priority as an argument, and the comment now says it drops colliding names. Flocking's and Making the creatures' bounds were one helper; Separation's and Weighted blending's were another with room for names. Both are shared; scalable formations and the steering pipeline derive their box from their own geometry and keep it.",
    "WO-021 (docs/work-orders/WO-021-concept-studies-rxjs.md) adds the marbles family, the first whose model has no motion frames. All twenty records here declare the motion family, so no consumer of a family-discriminated model exists yet.",
    "The reviewers' recheck confirmed the fixes and raised two more, both fixed with tests: a commented-out line could satisfy the chunk's export check, so check-studies.mjs now reads the chunk's syntax with the TypeScript parser (chunkContents); and two tooling assertions pinned the workspace to twenty records, which any later batch would have broken, so the inventory reads the aifg work and the count follows the records.",
    "The second recheck raised one more, also fixed with a test: a type-only JSON import satisfied the chunk's export check though TypeScript erases it, so chunkContents ignores type-only imports. A record must now also be imported from its own work's folder."
  ],
  "rejected": [
    {
      "option": "Discriminate StudyModel by family now",
      "reason": "It would be designed against no real non-motion model, and WO-021 brings the first one. The risk is real but is cheaper to take with the marbles model in hand."
    },
    {
      "option": "Leave a failed summary silent because the concepts still read",
      "reason": "The catalog rule makes a loading failure visible and retryable, never an empty success, and zero studied concepts is an empty success."
    },
    {
      "option": "Keep bounds helpers per study",
      "reason": "Identical copies drift. Where a study's box comes from its own geometry it stays, so only true duplicates merged."
    }
  ],
  "reopenWhen": "WO-021 designs the marbles model, or a later family finds a shared helper's rule wrong for it.",
  "followup": "WO-021: make the study model family-discriminated before adding marbles. StudyModel in libs/features/tools/src/lib/studies/study-model.ts requires motion for every family; playback, prose values and clampStep read motion.frames, and mapStudy ignores visual.family, so a record declaring timeline still selects motion. Separate the common moments and values from the drawing payload, discriminate the payload by family, and keep that discriminator through the mapper and the study composite. Check: a spec with a record whose family has no motion frames renders and scrubs. Priority: before the first non-motion family."
}
```

## WO-020-D019

```json
{
  "id": "WO-020-D019",
  "date": "2026-10-31",
  "dispatch": "resume: verify",
  "decision": "Judge the unchanged target against all nine original criteria, consuming its current complete review row while independently repeating production use, model/input cases and failure paths. Record a passing verification when the final candidate document gate passes. Preserve D018's family-discrimination follow-up for WO-021, which first needs the other payload. Prepare the draft pull request under the repository profile's standing route after the passing result, without moving the order branch or its index.",
  "evidence": [
    "VER-001 and verification-evidence.json record the complete production session at 360, 768 and 1440 with 48 verifier screenshots, no page errors or overflow, and the verifier's explanations of the concepts from the studies alone.",
    "The target review row at tree 4e6b3e4b93d6c5226e31f2e819006d0723911dbf covers all eight declared commands. Independent formatting, bundle, fixture and tooling checks pass; uncached Tools, Catalog and Core tests pass; all twenty model modules pass 168 bounded input cases.",
    "Independent browser attacks preserve the mined definition when a model download fails, keep unstudied and unknown readings usable, stop playback on a live reduced-motion change, narrow the Study facet correctly and report no axe violations at the three widths.",
    "The original three implementation reviewers' reports and all rechecks were read from the retained executor scratch, alongside the final critic reports and their filed dispositions. The closed-prose source read was repeated after waiting for each deferred view to render; no subject defect was inferred from the probe's first incomplete text capture.",
    "The session readback names Codex gpt-6.1-sol at selected effort max. That actual selection is recorded rather than replaced by the role's xhigh recommendation. No worker was needed."
  ],
  "rejected": [
    {
      "option": "Accept the executor handoff without independent use",
      "reason": "Criterion 1 is reserved for the verifier's own production walkthrough and explanations."
    },
    {
      "option": "Repeat the complete target gate at the same identity",
      "reason": "The current passing row already covers the entire registered selection. Focused uncached tests and independent probes add evidence without reinstalling and repeating unchanged complete checks."
    },
    {
      "option": "Block on D018 or implement the next family's abstraction during verification",
      "reason": "The limitation is already boarded for the first non-motion family and breaks no current criterion. The verifier preserves the implementation it judges."
    }
  ],
  "reopenWhen": "The target candidate changes, the final document gate fails, a reproduced regression breaks a criterion or inherited behaviour, or WO-021 introduces a non-motion model."
}
```

## WO-020-D020

```json
{
  "id": "WO-020-D020",
  "date": "2026-10-31",
  "dispatch": "resume: final review",
  "decision": "Pass the final review on the verified tree 4e6b3e4b93d6c5226e31f2e819006d0723911dbf without changing a byte of the target. The nine criteria hold on VER-001 and on this review's own reproductions, the draft pull request's three checks passed on that same tree, and the three defects this review found break no criterion and no behaviour main had, so they are boarded for the first batch that edits their files rather than repaired here at the cost of a new identity, a gate rerun and a new draft head. Record the verification's draft publish in the host-qualification record, which the repository profile requires and the verifying session left unrecorded, and write the preview record. Commit the reviewed tree as one commit, reuse the draft's branch and pull request for the final publish, and move WS-001's delivery state for this order to final-reviewed.",
  "evidence": [
    "The target review gate row target-gate:613ffe24-4881-4255-9466-65ca82543fd8, recorded 2026-10-31T23:24:30.646Z, binds tree 4e6b3e4b93d6c5226e31f2e819006d0723911dbf for install, lint, typecheck, test, format, build, e2e and visual. The draft commit a2f0a612a9bcb2473630ba43266ec39cee378173 carries the same tree, and git write-tree over a temporary index of the working tree printed the same hash during this review.",
    "Pull request 11 on DylanBWood/DotLn-Angular was opened as a draft at 2026-10-31T23:39:50Z on feat/movement-concept-studies by the verifying session, after VerificationCompleted at 23:38:31Z. Its checks on that head: title passed in 11 s, visual in 3 min 42 s and checks in 11 min 57 s. It holds no review, comment or review thread.",
    "Reproduced in this review: the criterion 6 greps print nothing; grep -c prints 1 for the Studies heading, 1 for own words and 3 for check-studies.mjs in scripts.md; package.json's dependencies keys equal the base's and the lockfile is unchanged; ls on every removed candidate path prints nothing; npm run studies:check prints check-studies: 20 records; 0 problems; npm run check:scripts prints PASS script reference: 32 npm scripts; 17 files; git diff --check is clean in both worktrees; the walkthrough directory holds 96 files.",
    "First boarded defect: node tools/scripts/catalog/check-studies.mjs <a file holding the text { not json> exits 1 with an uncaught SyntaxError from JSON.parse at the named-file branch of main, with no FAIL check-studies line; the directory mode reports the same file through readRecord as a schema problem, so only the named-file route lacks the message.",
    "Second boarded defect: grep -n 'step()' over study-explanation.html and study-explanation.ts prints nothing, so the computed step in the explanation component has no reader.",
    "Third boarded defect: the target README's menu table names /tools/catalog and /tools for Tools and describes a catalog read concept by concept, while docs/dev-reference/architecture/sub-apps.md's table now also names /tools/catalog/<tool id> and one concept's reading; README.md is outside this order's declared surfaces.",
    "Both branches sit at their remotes' main tips, the launchpad at faa608c4a237d126ec9a26c2e5efff71bac68dcb and the target at eb9eeec80eec0cfacbd973351222cab39fdc7919, so integration has nothing to take in. npm run release -- prepare --local prints WO-020: target order records no release; no files changed. The outward lint passes the title, the commit subject and the branch with --target."
  ],
  "rejected": [
    {
      "option": "Repair the three defects in this review",
      "reason": "Each is a source edit in the target. It would move the identity off the gated, drafted and CI-passed tree for a gate rerun and a new draft head, for defects that break no criterion or inherited behaviour, and the README sits outside the declared surfaces. WO-021 edits the check, the explanation component and the documents next."
    },
    {
      "option": "Rerun the target review gate or the production walkthrough",
      "reason": "The row binds the exact tree and no byte of it changed; VER-001's independent session ran on the same bytes."
    },
    {
      "option": "Put the missing draft-publish record to the operator",
      "reason": "The profile names the host-qualification record as the place and the final review as the writer of the preview record; the forge and the object store supply what the verifying session did not file."
    },
    {
      "option": "Split the reviewed target change into several commits",
      "reason": "The record, the loader, the families, the facade, the twenty models and the browser tests reference one another, so no intermediate state passes the gate or reads on its own."
    }
  ],
  "reopenWhen": "WO-021 lands without the three boarded repairs, the published pull request receives a review thread, or the reviewed commit changes after publication.",
  "followup": "WO-021: three small repairs in this pilot's own files, found by the final review and boarded because each would have moved the gated tree. (1) tools/scripts/catalog/check-studies.mjs: when a file is named on the command line, read it through readRecord so a file that does not parse is reported as a schema problem under the FAIL check-studies prefix instead of an uncaught JSON SyntaxError, and add the case to tools/studies.test.mjs. (2) libs/features/tools/src/lib/composites/study-explanation/study-explanation.ts: remove the unused computed step, which no template or spec reads. (3) README.md's menu table: name /tools/catalog/<tool id> and the studied concepts beside /tools/catalog and /tools, as docs/dev-reference/architecture/sub-apps.md already does. Check: the command and the two greps in this decision's evidence. Priority: with the first batch that edits these files."
}
```
