# WO-015 decisions

## WO-015-D001

<!-- integration refs/dotln/checkpoint/WO-015/2 -->

```json
{
  "id": "WO-015-D001",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator's direction to bring main in (capture 26bb989a…, entry 1); worktree integrate WO-015",
  "decision": "Integrate the launchpad's main (63119c2: starter v0.102.0 and v0.103.0 through #38 and the 2026-10-30 planning pass through #39) into this WO-015 worktree before any execution work, through the main checkout's integrate helper, as the operator directed during this dispatch and as the 2026-10-30 pass's D3 routes. The helper fast-forwarded from 4bc21b4 and re-applied this order's uncommitted control record. Reinstall with npm ci and re-emit the harness so this worktree's hooks run the v0.103.0 snapshot. Read the operator's 'main' as both repositories' main, because this order builds in the target and its target worktree held no files; D002 records the target side.",
  "evidence": [
    "The operator directed during this resume: next dispatch on 2026-10-30, before any execution work began, that main be brought in (ignored capture docs/intake/notes/wo-015-session-2026-10-30.md, SHA-256 26bb989a471344144fbb94abf9d76e099623439d4036db50432e871d3ac89a6f, entry 1). docs/planning/standard-pass-v0-103-0-2026-10-30.md D3 records this route. The worktree was 10 commits behind main with no commits of its own: git rev-list --left-right --count HEAD...main printed 0 and 10.",
    "refs/dotln/checkpoint/WO-015/2 preserves the pre-integration tree. Base 4bc21b4fccd225525d11b42f9f09167cca515764, upstream 63119c2a1123f9606d9b71ae520a08ac33605bcd; a fast-forward, so there is no merge commit. The shared stash stack was empty before the run; the helper's named stash aac3b19a17e27f55458dfc4ccdc38fc89d194bb4 was dropped after complete application and the stack is empty again. This worktree holds no ignored intake, so the helper required no backup archive.",
    "docs/control/orders/WO-015.jsonl matches the checkpoint by SHA-256 (6beee01d…) and still holds its one activation event. docs/work-orders/WO-015-soldier-scene.md is byte-identical across the integration (git diff --quiet 4bc21b4 HEAD exited 0). The helper resolved docs/work-orders/README.md as a projection and observed no authored conflict.",
    "package.json is unchanged and package-lock.json changed only workspace package versions (compiler 0.32.0 to 0.33.0, skeleton 0.71.0 to 0.73.0). No root or workspace package.json at main declares an install lifecycle script and no lockfile entry carries hasInstallScript. npm ci added 10 packages and reported 0 vulnerabilities; node scripts/harness.mjs emit wrote 35 generated surfaces with no tracked drift.",
    "The affected checks the helper printed, each run under the bounded wrapper: node scripts/harness.mjs check exited 0 (35 generated surfaces); npm run publication:check exited 0 (no editions declared); npm run release -- check-surfaces --local exited 0 with 48 PASS lines and no FAIL line. npm run plan -- check exited 0 with no advisories; this order carries no execution amendment, so no re-binding to the new planning receipt arose. npm test -- --review remains owed as the handoff's complete run.",
    "release preparation: WO-015: target order records no release; no files changed."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or drop a stash before application completes",
      "reason": "Both histories and unfinished recovery material must remain available."
    },
    {
      "option": "Run this worktree's pre-update integrate helper",
      "reason": "The executor text and the pass's D3 both name the main checkout's current helper; this worktree's copy was the pre-update code."
    },
    {
      "option": "Defer the integration to the handoff, just before the complete run",
      "reason": "That is the executor text's default when main moved, but the operator asked for it now, and it runs the whole order under the current kit and its dispatch bound."
    }
  ],
  "reopenWhen": "An authored resolution changes behavior, contracts, authority or acceptance (return that finding through repair and fresh independent verification); main moves again before the complete handoff run (integrate again); or the operator meant only one of the two repositories."
}
```

Integration date: 2026-10-30. Original base: `4bc21b4fccd225525d11b42f9f09167cca515764`.
Fetched main: `63119c2a1123f9606d9b71ae520a08ac33605bcd`. Checkpoint: `refs/dotln/checkpoint/WO-015/2`.
Named stash dropped after completed application: `aac3b19a17e27f55458dfc4ccdc38fc89d194bb4` (WO-015 integrate 2026-10-30).
Resolved projections: docs/work-orders/README.md.
Release preparation: WO-015: target order records no release; no files changed.
Carried-forward claims: assessed by the executor on 2026-10-30; no acceptance judgment recorded. There were none to carry: the order had no evidence, no gate row and no executor work before this integration, only its activation event. The new kit changes this order's remaining procedure (the dispatch bound that counts wall clock from this dispatch, a document row bound to the exact candidate tree, the standing-document rule) and no acceptance criterion.
Authored conflicts observed: none.
Affected checks were executed after the integration; their results are in the evidence above.

## WO-015-D002

```json
{
  "id": "WO-015-D002",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator's direction to bring main in (capture 26bb989a…, entry 1)",
  "decision": "Fast-forward the clean target worktree from the provisional activation base bc9133e to the target's main at 38f8afd, the merged predecessor WO-019, before any implementation. Preserve the recorded activation base: the order's Repository: line and its WorkOrderActivated event keep bc9133e, and the publish describes the change from the merge base under the kit's merge-base rule.",
  "evidence": [
    "Canonical status selects WO-015, active, with the hard edge on WO-019 met and nothing blocking. The route guard holds: grep -c -- '--draft' scripts/worktree.mjs printed 5.",
    "At bc9133e the target worktree tracked no file (git ls-tree -r HEAD printed nothing) and had no uncommitted path; it held only its ignored harness bundle, so the catalog the rail reads did not exist there.",
    "git ls-remote origin refs/heads/main read 38f8afd6e1507483c58a662f2df7c3974dfd62b0, equal to the target clone's main, and bc9133e is its ancestor. git merge --ff-only took in 26 commits; HEAD then equalled main, git status --porcelain printed nothing, and the six ignored bundle files and CLAUDE.local.md stayed in place (the target's main tracks neither path).",
    "This order's step 1 inherits the WO-005 guard that the fetched main equal the Repository: base. Its Depends on line names that base provisional and says activation on it publishes right, so that specific clause supersedes the equality guard, as WO-014-D001 found from the same base.",
    "Design B's two pinned files were read at the run's folder under core's ignored intake and match the order's SHA-256 digests (aab22ca1… and 7cc9b2c0…)."
  ],
  "rejected": [
    {
      "option": "Implement on the empty activation tree",
      "reason": "The order extends the merged app, its menu and the catalog WO-019 typed."
    },
    {
      "option": "Stop for a planning pass to set the base, or amend the Repository: line to 38f8afd",
      "reason": "The order makes that amendment optional and the 2026-10-30 pass's D3 rejected it: the order is active and its activation event binds bc9133e."
    }
  ],
  "reopenWhen": "The target's main moves before publish in a way that conflicts with this work, or the fetched predecessor stops being an ancestor of the target worktree."
}
```

## WO-015-D003

```json
{
  "id": "WO-015-D003",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator's direction on how this first pass ends (capture 26bb989a…, entry 2)",
  "decision": "Build this first pass as an ordinary execution, then hand it to the operator informally to open and play with in place of recording implementation-ready. Their feedback drives further passes for as long as they want them; the order stays active throughout and no verification is dispatched until the operator ends the loop. Their words are the ordinary-language authorization WS-001 rule 25 names, so both dispatch-bound metrics are recorded with a ceiling of unlimited ahead of any stop. The order's preflight runs before each informal hand-off, because those checks are what make the app worth the operator's time. The three independent reviewers run on the first pass and their material changes return to the same reviewers at the end of the loop. The recorded target gate, the document gate, the visual baselines and the completion transition wait for the end of the loop, because each binds exact bytes that feedback will change.",
  "evidence": [
    "The operator's direction of 2026-10-30, paraphrased: this is trial and error with the scene and with how the two work together; do as much as usual, hand off informally for play instead of to verification, take feedback, and repeat as long as necessary. Ignored capture docs/intake/notes/wo-015-session-2026-10-30.md, SHA-256 26bb989a471344144fbb94abf9d76e099623439d4036db50432e871d3ac89a6f, entry 2.",
    "WS-001 rule 25 and the executor text direct that ordinary language authorizing a run for as long as needed is captured and recorded by the executor with --ceiling unlimited for wallClockMs and completeRuns. Both DispatchBoundAccepted events carry this capture; the extension changes no verdict and lasts until this phase completes.",
    "The executor text binds a document row to the exact candidate tree and a gate row to the current code identity, so a row recorded before feedback would be stale when the loop ends. The executor text admits material changes returning to the relevant reviewer, so reviewing early adds no second set of workers.",
    "The operator confirmed during the build that the three reviewers still run at the end of this pass, before the informal hand-off (ignored capture docs/intake/notes/wo-015-session-2026-10-30-reviewers.md, SHA-256 e63cb747abb6afdcc00ddfc4817e2be011aa737c5bd3d5089545a3b0577ce303).",
    "The operator directed during the first pass that it receive a quality and attention-to-detail pass over the UX, the rendering and the code before the hand-off (ignored capture docs/intake/notes/wo-015-session-2026-10-30-quality.md, SHA-256 95f874361100a2bb836b1ee87b0c964850a4e6081a9492a36912906ad0f66e43). The pass runs before the reviewers, so they judge the improved bytes.",
    "The operator set the informal bar for the UX pass: a skeptic told about the app expects nothing, and after five minutes of play concedes it is actually cool (ignored capture docs/intake/notes/wo-015-session-2026-10-30-bar.md, SHA-256 ecf15830f2e916f71d63ac79b106403a501beb575d7755437b4ceb50bcd5ca27). The bar judges the play, not the checklist.",
    "Before this decision this file quoted the operator's message directly in D001 and D002, which the operator record's standing direction on quotes in committed files forbids. Both were corrected the same day, before any commit, to a paraphrase citing the capture digest."
  ],
  "rejected": [
    {
      "option": "Record implementation-ready and let the verifier run",
      "reason": "The operator directed otherwise for this pass."
    },
    {
      "option": "Run the recorded review gate before the first informal hand-off",
      "reason": "It would repeat the preflight's checks to produce rows the operator's feedback then makes stale; the checks themselves still run."
    },
    {
      "option": "Hold the independent reviewers until the loop ends",
      "reason": "The operator's attention is the constraint in this loop, and a defect a worker finds costs less of it than one the operator meets while playing."
    },
    {
      "option": "Drop the chrome comparison in favour of the play loop",
      "reason": "Rule 25 and criterion 7 stand and the operator did not change them; the pair is offered inside the hand-off instead of as a separate step."
    }
  ],
  "reopenWhen": "The operator ends the loop (then the reviewers, recorded gates, baselines, walkthrough evidence and implementation-ready follow in the ordinary order), asks for verification sooner, or changes how the loop runs."
}
```

## WO-015-D004

```json
{
  "id": "WO-015-D004",
  "date": "2026-10-30",
  "dispatch": "resume: next",
  "decision": "Build the engine as a general reader of catalog parameter names, with no code per tool, and add rules of the scene's own where a catalog contract alone would leave the toy dead or dishonest. Velocity matching gives a unit a cruise at 40% of its top speed until an objective drives it. Cruising and wandering units turn back from the field's edge. A group has arrived when its centre is inside the target radius and nobody moves faster than half a unit a second, as D016 refines. An anchor's catalog speed, in distance per step, is read with a step of a quarter of a second of scene time. Draw wander from an arithmetic sine series rather than native trigonometry.",
  "evidence": [
    "All sixteen scene tools run from one interpreter: a probe of each at its catalog defaults over twelve units, with and without an objective, showed no refusal and no unread parameter, and the feature's spec asserts the same against the bundled catalog: exactly sixteen tools, each with and without an objective.",
    "Without the cruise, flock converges and stops, so the Objective's group motion never appears; with it, on the twelve units of the known outcome, heading variance falls from 0.67 to 0.007 by frame 600 and the group travels. The catalog's own Flocking row names only three weights and gives a resting group nothing to match.",
    "Twelve units with a unit radius of 0.5 cannot all stand inside a target radius of 1, so a per-unit arrival test could never complete for a group; the centre-and-speed test gives the Objective's stop and a real time to objective, while Arrive with no separation still piles units onto the point with 66 collisions, which is left visible.",
    "An anchor speed of 2 read per tick would be 120 units a second, and read per second gave a march too slow to watch (no arrival in 30 seconds across the field). A quarter of a second gives 8 units a second beside units that top out at 16.",
    "Native Math.sin and Math.cos are computed by the host's C++ library and may round differently by architecture; plain arithmetic is identical wherever JavaScript runs, and the known-outcome fixture is generated on one machine and checked on others. The series agrees with the native function to nine places in the spec."
  ],
  "rejected": [
    {
      "option": "A case per tool in the interpreter",
      "reason": "Design B's question is whether the typed-transform grammar holds without a special case per tool; a general reader answers it and lets a future row run without code."
    },
    {
      "option": "Hash at lower precision and keep native trigonometry",
      "reason": "Quantizing narrows the risk without removing it, and a single flipped rounding would fail the gate on one architecture only."
    },
    {
      "option": "Treat Arrive's test as every unit inside the radius",
      "reason": "It can never complete for a group that also separates, which would leave time to objective unknown forever."
    }
  ],
  "reopenWhen": "The operator's play shows a rule feels wrong, a later scene needs a different arrival test, or a catalog row needs a parameter the interpreter does not read."
}
```

## WO-015-D005

```json
{
  "id": "WO-015-D005",
  "date": "2026-10-30",
  "dispatch": "resume: next",
  "decision": "Extend the shared withPersistedState feature with two optional settings: writeWhen, which holds writes back until it returns true (D011 replaces it with writeOn), and unreadable, which merges state when a stored value exists but cannot be parsed or restored. SceneStore uses them so nothing is written until the operator saves and a corrupt value is reported and left in place. Existing stores pass neither and behave as before.",
  "evidence": [
    "The toolkit's withStorageSync calls watchState(store, () => store.writeToStorage()) in onInit (fesm2022/angular-architects-ngrx-toolkit.mjs, createSyncStorageSync), and watchState fires at once, so WO-007's feature rewrites the key on every load. The order requires a stored value that fails to parse or validate to be never rewritten until the operator saves.",
    "A failed parse was swallowed inside readFromStorage, so a store had no way to tell the operator a value had been ignored, which the order also requires.",
    "data-access specs cover both settings, a refused value, an absent key and a throwing storage; scene-store specs cover bad JSON, an older shape, a future version and a broken composition, each left byte-identical until a save."
  ],
  "rejected": [
    {
      "option": "Read storage directly in the scene store",
      "reason": "Only provideDotlnStorage may name persistent storage, and WO-007's feature is the single write path."
    },
    {
      "option": "Pass autoSync false and write by hand",
      "reason": "It gives up the feature's shape for one store and leaves unreadable values unreported."
    }
  ],
  "reopenWhen": "A second store needs a different write rule, or the toolkit gains a supported guard."
}
```

## WO-015-D006

```json
{
  "id": "WO-015-D006",
  "date": "2026-10-30",
  "dispatch": "resume: next",
  "decision": "Read the order's sceneTools as the shape the catalog actually has: per-work ids in catalog-summary.json and the sceneTools(work) selector in @dotln-angular/catalog. The rail, the inspector and the ?tool= reader share one list, that selector over the aifg work filtered by isRunnable, which gives sixteen tools. Cohesion gets no rail entry, because the catalog has no such row and inventing one would be the second source of truth the order forbids; it is a weight of Flocking and Making the creatures. Wedge, line and column are named in the rail as choices of the two-level tool. Inject CatalogToken only.",
  "evidence": [
    "catalog-summary.json has no top-level sceneTools; each entry of works has one. The aifg entry lists sixteen ids; every other work's list is empty. The order's observed gap counted eight typed tools at an earlier commit.",
    "A title search of the aifg rows for cohesion finds nothing. Step 8's floor omits cohesion, while the Objective's prose names it in the group list; the design file maps it to the Arrive and Flocking rows.",
    "Instantiating CatalogStore would write dotln-angular.tools at init through the same watchState path, which criterion 6 forbids.",
    "Scalable formations, Formation pattern interface and Slot assignment share the two-level kind and carry a pattern parameter, so they keep a pattern choice in the inspector; only the two-level row lists the names in the rail, to keep the rail compact."
  ],
  "rejected": [
    {
      "option": "Add a typed Cohesion row to the catalog",
      "reason": "No source row warrants it: the order's carry-in types a floor tool that arrives untyped, and cohesion is not on the floor."
    },
    {
      "option": "Fall back on the summary's ids and a second copy of definitions",
      "reason": "The inspector needs each tool's definition, and two reads of one list is what the order rules out."
    }
  ],
  "reopenWhen": "The operator wants cohesion on its own, or another work gains scene tools, which would widen the single work this list reads."
}
```

## WO-015-D007

```json
{
  "id": "WO-015-D007",
  "date": "2026-10-30",
  "dispatch": "resume: next",
  "decision": "Take the catalog side of the scene link in this order: a tool the scene runs now links to /scene?tool=<id> from its reading, with the anchor supplied by the catalog page container and projected through the reading mapper, and the reading's sentence changes to invite the run. Move the root to the scene and the not-found link with it.",
  "evidence": [
    "Criterion 1's last step opens /scene?tool=<flock id> from the catalog's link, and the Objective names that link, yet docs/dev-reference/architecture/catalog.md said no executable link was offered while the route was the arriving page.",
    "The 2026-10-30 pass disposed FUP-f1c8c645eb537501 (WO-019-D028) as deferred unless WO-015's executor takes it as a named boy-scout item. This decision is that naming.",
    "Composites may not import the router, so the concept reading gains a scene-link slot and the container owns the routerLink, as its other links do."
  ],
  "rejected": [
    {
      "option": "Leave the link to WO-018's carry-ins",
      "reason": "Criterion 1 could then not be performed as written."
    },
    {
      "option": "A click output routed through navigationEvents",
      "reason": "RouteId names only the board today, so that path would need widening for no gain, and a real anchor keeps copying a link and opening it in a tab."
    }
  ],
  "reopens": {
    "decisionId": "WO-019-D028",
    "observation": "WO-015 activated and its criterion 1 needs the reading's link to the scene, so the deferred link is built here."
  },
  "reopenWhen": "The reading changes shape, or a planning pass moves the link."
}
```

## WO-015-D008

```json
{
  "id": "WO-015-D008",
  "date": "2026-10-30",
  "dispatch": "resume: next",
  "decision": "Load the rail's tools through the existing catalog seam, which reads the whole aifg work, rather than add a smaller scene-only data chunk. The field renders before the catalog arrives and the rail says it is reading; the JSON chunks stay lazy and out of the initial graph.",
  "evidence": [
    "Comparison of the two arms, from the production build of 2026-10-30. Reuse: tools-aifg-a-json 375.55 kB raw and 44.07 kB estimated transfer, tools-aifg-b-json 383.98 kB raw and 45.49 kB, so 89.56 kB transferred for sixteen rows, with no new file, join step or check. A scene-only chunk: an estimated 20 to 30 kB of rows, unbuilt, needing catalog:join to emit a ninth output, catalog:check to cover it, and a second place the definitions live.",
    "Initial bundle is 398.22 kB raw and 110.58 kB estimated transfer, under the 500 kB warning. The scene's own lazy code is 102.50 kB raw and 26.97 kB transferred, measured from the production build of the final tree.",
    "The field, selection and instruments do not wait on the catalog, so the cost lands on the rail only."
  ],
  "rejected": [
    {
      "option": "A generated scene-tools chunk now",
      "reason": "It trades about 60 kB of transfer on a page people return to for a new generated artifact and check, ahead of any measurement that the wait is felt."
    }
  ],
  "reopenWhen": "A measured journey shows the rail's wait is felt on the root page, or the mining store replaces the bundled chunks."
}
```

## WO-015-D009

```json
{
  "id": "WO-015-D009",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator's bar for the UX pass (capture of 14:32Z, D003)",
  "decision": "Beyond the order's session, build what makes the page a toy rather than a demonstration. A right-click sets the objective and gives the selected units Arrive. A tool already on the selected units is live: a released slider or a chosen pattern reaches them at once, recorded as a step. Compare takes the live run back to the split and plays it with the other branch as a ghost, its charts standing where the instruments stand so the field keeps its size. Units are arrowheads with fading trails, overlaps spark, and a coach line names the next thing to try. Restart replays the composition and a separate Clear puts it down. The field skin's tokens reach the shell around this page.",
  "evidence": [
    "The operator's bar (D003) judges five minutes of play, and the first working pass was correct but inert: changing a weight needed a second Apply, Compare showed a still ghost below the fold and shrank the field from 630 to 370 pixels, and Restart discarded the composition.",
    "In the browser on 2026-10-30, dropping separation to zero in a running flock took collisions from 0 to 45 and raising it to five returned them to 0 within two seconds; pattern changes re-form a live formation in place; a wedge marching on a right-clicked objective with the earlier branch's column as a ghost renders as intended at 1440.",
    "Each live change is a step, so determinism holds: a replay does what the operator did. The log folds a run of them into one line.",
    "The non-goal reads beyond the shared palettes and the field skin's tokens. The shell's colours here change by those tokens alone, through html:has([data-skin='field']), and no style in the shell library changed. One rule is not a token and is a named exception: #main-content:has(> [data-full-bleed]) in the app's own styles takes the main region's padding away, because the field has to fill the page and the padding is the shell's. It applies only on a page that asks for it, and it restyles nothing else. The workstream's design direction already has the shell adopting the direction in the order that next touches it."
  ],
  "rejected": [
    {
      "option": "Keep the order's session exactly and leave feel to later feedback",
      "reason": "The operator set the bar during this pass and the first play is the moment it is judged."
    },
    {
      "option": "Apply on every slider input event",
      "reason": "It would record dozens of steps per drag; a step on release keeps the record readable and the change immediate."
    },
    {
      "option": "Give the comparison its own panel above the instruments",
      "reason": "Built and read in the browser: it took the field's height at the moment the field was the point."
    }
  ],
  "reopenWhen": "The operator's play says otherwise; each of these is open to the feedback loop in D003."
}
```

## WO-015-D010

```json
{
  "id": "WO-015-D010",
  "date": "2026-10-30",
  "dispatch": "resume: next; the three reviews of the first pass, before the operator's hand-off",
  "decision": "Fix the settling and arrival defects at their source rather than with thresholds. Forces fade to nothing at their edges: arrive's wanted speed reaches nothing halfway inside the target radius, and separation, flee and the anchor's speed fade at theirs. A unit nothing steers brakes. A wall zeroes the velocity into it. Round the objective a unit is heading for, priority's separation group sheds the unit's speed as well as parting it (D016). Formation membership has one record, the assignment, and behaviour.formation and the formation id are gone. A two-level formation that loses members moves its anchor to the centre of the slots still held. Arrival excludes a fixed formation's followers, and D016 gives the rest of it its final form. The stopwatch restarts only when a unit newly heads for the objective, in one place in applyStep. A fixed leader that nothing is steering for the objective follows any objective, set before or after, derived while it leads rather than stored (D016). Priority's wander gets the edge term. The known outcome was regenerated for this.",
  "evidence": [
    "Probe on the real engine and fixture, baseline against this code, sixty seconds of play. Flock then Arrive on twelve units: never at rest with a peak of 0.38 units a second, now at rest at frame 660. Wedge then Fixed on eight: never arrives, now 7.05 s. Fixed on 1-4 then Fixed on 2-6: never at rest, now at rest at frame 586. A wedge of twelve losing four: top speed 16 and never at rest, now at rest at frame 708. Seek: no time, now 3.57 s. A target radius of 0: no time, now 5.62 s. A line of twenty sent to a corner: units read moving at top speed while pinned, now ten read stalled and the run rests at frame 1128.",
    "A sweep of 24 random selections and objectives over ten sequences (flock with arrive, arrive, separation with arrive, wedge, line, column, scalable, group movement, fixed, flock with arrive then wedge) rested and arrived 24 of 24 within a minute of play, with no non-finite value and no unit off the field.",
    "Priority steering with Arrive on twelve units boiled round the objective at a mean of 3.4 to 5.9 units a second for the whole minute with no arrival. With the rule D016 settled on, 60 random runs of 4 to 20 units ended at zero collisions with a mean speed of 0.053 and a peak of 0.58 over their last ten seconds.",
    "The unit specs for each sequence are in simulation.spec.ts, formation.spec.ts, steering.spec.ts and run.spec.ts; the full Objective with motion on is a facade spec and two e2e cases, a path no test covered before."
  ],
  "rejected": [
    {
      "option": "Define rest as a speed threshold held for N frames",
      "reason": "It would call a shivering group still and leave the shiver on screen. The cause was forces that switch at a line, and removing it stops the units themselves."
    },
    {
      "option": "Damp units once the group has arrived",
      "reason": "It adds a second mode to every unit, and flock with Arrive stops without it."
    },
    {
      "option": "Let arrival spread through touching units, as a strategy game's move order does",
      "reason": "Units coming from one side would stop behind the first to arrive, so the group's centre would sit well short of the objective, against the order's stop inside the target radius."
    },
    {
      "option": "Keep behaviour.formation and clear it on leaving",
      "reason": "That fixes this sequence and keeps the two records that caused it. The reviewers named the id reuse and the stale pointer as one defect."
    },
    {
      "option": "Make priority steering take a unit out of its formation, as blending does",
      "reason": "Wrapping what the unit already does is useful and what the steering says: avoid first, then keep the slot. The document was narrowed instead."
    }
  ],
  "reopenWhen": "The operator's play says a rule feels wrong. One limit is left for that feedback, measured on the final engine: a crowd under priority steering does not fully settle. Over 60 random runs each it keeps a faint shimmer, so it rarely pauses by itself. Priority with Arrive: 55 never pause, peak 0.58 over the last ten seconds, mean 0.053. Priority alone: 55, 0.55, 0.054. Flock, Arrive and Priority together: 58, 0.67, 0.112. Wedge with Priority rests every time. A settled crowd is also slow to start again, so sent somewhere near, it can read as arrived early: 14 of 129 random re-targets were credited with the centre more than 5 off.",
  "followup": "Bring a crowd under priority steering fully to rest and let it start again promptly. It keeps a faint shimmer, peaking at 0.55 to 0.67 units a second, so the run rarely pauses by itself; and separation pre-empts the unit's own steering, so a settled crowd crawls when sent somewhere near, reading as arrived early in 14 of 129 random re-targets. Candidates are a speed limit from the clearance ahead, or letting a unit's own steering blend under separation. Touches libs/shared/scene-engine/src/lib/simulation.ts and steering.ts; check with specs that a crowd under priority steering comes to rest and that a re-targeted one reaches its new objective as fast as a plain Arrive."
}
```

## WO-015-D011

```json
{
  "id": "WO-015-D011",
  "date": "2026-10-30",
  "dispatch": "resume: next; the three reviews of the first pass, before the operator's hand-off",
  "decision": "Move run semantics into the engine as run.ts and build runBranch on it, so the live run and a replay cannot disagree. Due steps go before an operator's step on the same frame, and a refusal stays until the operator's own step or a rewind. A trial covers the ten seconds from the split: the prefix runs once and none of it is kept, and Trial gains from. Only a save writes to storage: writeWhen is replaced by writeOn, a save reads storage first so another tab's compositions survive, unless the last save failed and this tab holds the only copy, a failed write is reported through unwritable and a save-failed notice, and one unreadable composition costs only itself. Storage and import share one validator, and what the engine can run is the engine's own isSafeStep: numbers it can square, positive times, and a last step inside eight hours of play. parseExport checks the schema tag and the scene. The slot table is the formation's own once applied, with a running count in the sticky Apply row. A tool on these units opens as it was set. Restart ends liveness. stored-ignored stays in the notice slot, where every other reason sits, rather than in the tool log the Design named.",
  "evidence": [
    "Compare at five minutes of play: 810 ms and 488 MB of heap growth by the review's measure, now 181 ms and 8 MB, from a probe of what compare() runs on the final engine. At one hour: 1,630 ms and 18 MB. At the eight-hour limit on a step: 12,692 ms and 19 MB, which only a crafted import or a whole working day's play can reach.",
    "The live and replay hashes matched the review's reproduction once due steps drain first; run.spec.ts and scene.facade.spec.ts pin it on the same frame and mid-run.",
    "A weight of 1e999, a time to target of 0 and a slot spacing of 1e999 gave non-finite positions within five frames and killed the page on import, and Infinity serialised to null, so a save poisoned the whole stored value. scene-store.spec.ts refuses each and keeps the readable compositions.",
    "Tab A saves, tab B saves, tab A plays a step: B's composition was gone. scene.facade.spec.ts pins that it now survives and that playing writes nothing.",
    "At 1440 by 900 the slot table sits below the fold of the inspector, seen in the browser on 2026-10-30, so the moment it fills would pass unseen; the count stays in view."
  ],
  "rejected": [
    {
      "option": "Keep the full run on the chart and cap the frames instead",
      "reason": "At five minutes the 600-frame window was about 3% of the chart's width, so the two series were near-identical for most of it. The window is what is worth reading."
    },
    {
      "option": "Assign compositions unique ids and merge two lists on write",
      "reason": "Reading first gives the same result with one line and keeps the ids readable."
    },
    {
      "option": "Bound each parameter by its catalog row at import",
      "reason": "It would make the data-access library read the catalog. The bound only has to keep the engine finite; a slider's range is the tool's concern."
    },
    {
      "option": "Default a missing Trial.from to 0 when restoring",
      "reason": "A second look raised this for first-pass saves. Trial gained from before the first hand-off, so the only build the operator played writes it, and no stored trial without it can exist."
    },
    {
      "option": "Move the read-before-save rule into the store",
      "reason": "The facade is the one dispatcher of a save, and the store's reducer cannot read storage. A second dispatcher would be the moment to move it."
    },
    {
      "option": "Keep the preview's arrows while playing",
      "reason": "They would trail behind units on the move. The preview is still computed while playing, so a formation's table can be read before Apply."
    }
  ],
  "reopenWhen": "The operator's play says the ten seconds are the wrong window, or a later scene needs a run longer than the eight-hour bound."
}
```

## WO-015-D012

```json
{
  "id": "WO-015-D012",
  "date": "2026-10-30",
  "dispatch": "resume: next; the three reviews of the first pass, before the operator's hand-off",
  "decision": "Widen dotln-button with two optional inputs, size (regular, small) and tone (plain, primary), rather than style buttons from the scene. Existing buttons pass neither and are unchanged.",
  "evidence": [
    "The transport needs a compact row and Apply needs to stand out from it; instrument-strip.html, trial-compare.html and unit-inspector.html consume them.",
    "button.spec.ts covers both inputs, button.stories.ts adds Small and Primary, and storybook.spec.ts carries their rows."
  ],
  "rejected": [
    {
      "option": "Override the button from the scene's own styles",
      "reason": "It reaches into another component's template, and the next page needing a primary action would copy it."
    }
  ],
  "reopenWhen": "A third tone or size is needed, which would be the point to look at the button's variants as a whole."
}
```

## WO-015-D013

```json
{
  "id": "WO-015-D013",
  "date": "2026-10-30",
  "dispatch": "resume: next; the three reviews of the first pass, before the operator's hand-off",
  "decision": "Leave these review items as they are, each with its reason, for the later orders that will change this code. The view model stays flat: its slow slices are computeds with stable identity, which was the cost, and grouping it is a wide template change with no behaviour in it, so the inspector still borrows two transport fields. A painter's styles still arrive through closures until a second painter says what they should be. A unit's label and role stay one string until labels are translated. SceneTool keeps its name and its comment now says what it is. A few other names the review questioned stand: the seek priority group, saves, canSave, #toField and drag. interpretedKinds stays a written list beside the interpreters record, where a record keyed by its type makes drift a compile error. The scene's own rules stay constants, and arrival stays in simulation.ts, until a second scene needs to vary them; moving it to its own module is then a pure move. TrialBranch.label stays on the stored record. createCanvasRenderer's fallback to the null renderer stays silent. Arrive at a weight of 0.05 with a time to target of 2 never clears the snap to rest, so its units stay put, and a wedge of twenty at the widest spacing, too big for the field, takes 105 s to pause with no objective and keeps turning with one, its time unknown; both are slider extremes. The order fixes the default scene's home under testing/fixtures and the text renderer's existence, so those are the operator's to change. The facade's preview() method, which the order names and nothing called, is removed: the view model carries the preview, which is how the page reads everything else.",
  "evidence": [
    "Each is a Low or a design note in the design improver's report, except the flat view model, which is what remains of its Medium 7. None changes what the operator sees, and the report's own order of work sets them after the behaviour defects.",
    "Its second look agreed with each of these but two. It held that log was still rebuilt at ten updates a second, so log is now a computed. It held that SceneClock.running stayed only for its own spec, so the getter is gone and the spec asserts on ticks.",
    "A browser with no 2D context cannot run the page's reason for being, and none is in the supported set."
  ],
  "rejected": [
    {
      "option": "Group the view model before closing",
      "reason": "The operator ended the loop and the iteration moves to later orders, which are likely to move these templates; regrouping now would be spent twice and adds risk to a close-out."
    }
  ],
  "reopenWhen": "A later order changes the page's templates, or a second scene or painter arrives."
}
```

## WO-015-D014

```json
{
  "id": "WO-015-D014",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator's reaction to the first hand-off (capture 725a6fec…)",
  "decision": "Record that the first informal hand-off met the bar D003 set: after five minutes of their own play the operator reached the reaction the bar names. Record their lean toward closing this order and carrying the iteration into later orders as a lean, not as the end of the loop. The order stays active until they end it, and the first comparison round stays open until they pick.",
  "evidence": [
    "The operator's message of 2026-10-30, paraphrased: they played for five minutes and arrived at the bar's reaction; there is plenty to iterate on; they may wrap this order and continue the updates in future orders. Ignored capture docs/intake/notes/wo-015-session-2026-10-30-reaction.md, SHA-256 725a6fec3e731940b7c159936b4851853fc7b83e4155d8f955933ce78486d09b.",
    "D003 judges the bar by the play, not the checklist, and leaves the end of the loop to the operator. Criterion 7 needs their pick for each comparison round and the rejected chrome removed, and the first round has no pick yet."
  ],
  "rejected": [
    {
      "option": "Treat the message as ending the loop and record implementation-ready",
      "reason": "The message says possibly, and the comparison round it would leave undecided fails criterion 7."
    }
  ],
  "reopenWhen": "The operator ends the loop, asks for another pass, or picks the round."
}
```

## WO-015-D015

```json
{
  "id": "WO-015-D015",
  "date": "2026-10-30",
  "dispatch": "resume: next; the operator ending the feedback loop and picking the first round (capture 0f6313a3…)",
  "decision": "End the feedback loop D003 opened and the design comparisons with it, and carry the iteration into later orders. Keep candidate A of the first round, the rail and inspector as one right column, and remove candidate B: its query, input, type, styles and story leave the code, with its screenshots and an implementation record under docs/evidence/WO-015/design/. Add the visual baselines for the chosen chrome and refresh the one baseline an intended change made stale. The close-out returns the fixes to the same three reviewers, then runs the walkthrough, the recorded gates and the handoff, ending at implementation-ready.",
  "evidence": [
    "The operator's selections of 2026-10-30, answering two questions put to them after D014: wrap it up now, and candidate A. Ignored capture docs/intake/notes/wo-015-session-2026-10-30-wrap.md, SHA-256 0f6313a3b0bbe91a69b0a8d5f06c15921999ead1ad6a812c8c0e15ecc8eb545a. D003 leaves the end of the loop to them, and rule 25's process ends when they say so, so one round stands as the whole comparison.",
    "The round's pair, captions and pick are in docs/evidence/WO-015/design/comparisons.md, and the removed implementation in rejected-implementations.md. After removal, grep -c Chrome on the stories file prints 1, and a search of libs and apps for the query, the attribute, the type and the drawer story finds nothing.",
    "New visual baselines: scene and scene-flocking at 360, 768 and 1440 from apps/dotln-e2e/src/scene.visual.spec.ts, replacing the arriving page's three scene baselines, and ui-button--small and ui-button--primary for the two stories D012 added. Each was generated by this machine's Chromium under the visual config and read before being kept. The suite then passed 44 of 44 on a second run.",
    "Refreshed baseline: catalog-768.png. Its only difference from the committed image was the reading's line about the scene, which D007 turned from a sentence into the link; the diff image shows nothing else, and the 360 and 1440 images were unaffected because the line sits below their fold."
  ],
  "rejected": [
    {
      "option": "Keep both candidates behind the query into a later order",
      "reason": "Criterion 7 requires each decided round to leave only its selected implementation, and the record keeps what B was."
    },
    {
      "option": "Keep iterating inside this order",
      "reason": "The operator chose to end it here. The bar was met by their own play (D014), and later orders can name their iterations."
    }
  ],
  "reopenWhen": "A later order wants the drawer back, which it can rebuild from the record. The iteration the operator expects belongs to planning, which will take their notes then."
}
```

## WO-015-D016

```json
{
  "id": "WO-015-D016",
  "date": "2026-10-30",
  "dispatch": "resume: next; the reviewers' second and third looks at the fix pass, during the close-out D015 authorized",
  "decision": "Correct what the fix pass broke, and replace the arrival rule rather than patch it. A group has arrived on one of two routes. It has crossed: its centre is within reach of the objective, its braking units are slow, and every part of it is there, a free unit within the crowd's reach of the objective and a formation's anchor on it. Or it has stopped: every driver stayed slow for half a second, with the centre within the crowd's reach and everyone within twice that. The crowd's reach is the target radius plus 0.8 of the separation threshold times the root of the group's size. Seekers and wanderers need not slow; a formation's members always brake. The wall credit is removed, because the stopped route covers what it was for. Under priority steering the separation group sheds a unit's speed only within 10 of the objective that unit is heading for. A fixed leader and its members keep the formation's own spacing, in blended and priority steering alike. A scene is not at rest while an anchor still moves. A fixed leader's lead on the objective is derived while it leads, for a leader with neither a seek nor an arrive weight, and is never stored. A new composition's id is one past the highest in the list. The step bound moves to eight hours of play, and the anchor lag limit joins the numbers refused below nothing.",
  "evidence": [
    "A bounded comparison over 16 random runs each, run on the engine with an arm switch since removed. Shed everywhere, the fix pass's rule: Priority with Arrive arrives 16 of 16 at mean 0.08, and a flock under priority freezes, travelling 6.7 in 50 s with 10 of 16 stopped. Shed only the closing velocity: Priority with Arrive arrives 4 of 16 at mean 0.86, boiling again, and a flock travels 112. Shed only near the objective: Priority with Arrive arrives 16 of 16 at mean 0.08, and a flock travels 99.",
    "The adversary's third look broke the patched rule three ways: two wedges either side of the objective, and Seek then Wedge on their own centre, each read 0.0 s at default sliders, and a parked unit at a wall credited a scattered group. Each hole came from a special case, and the shed radius followed Arrive's slow-radius slider. Replacing the wall credit with the stopped route removes that code.",
    "A fuzz of 4,500 setups over 15 routes and three seeds, with slider extremes and the objective at the group's own centre, at walls and at random: none was credited within a second of starting and then came more than 3 closer or 5 tighter. What remains by design is a seeking or wandering group credited with its centre on the objective and everyone within reach, which then tightens further, reading up to about a second early. Fixed formations time the leader alone.",
    "The adversary's last check found the replacement sound: nothing that had reached and stopped went unread, including 72 of 72 wedges, lines and columns sent to corners and walls, and nothing regressed. Its one route was a settled crowd under priority re-targeted nearby, credited at 0.52 s with the centre 14.4 off, because the stopped route tested each unit and not the centre. With the centre tested, that case reads 34.32 s with the centre 3.8 off; what is left of the route is recorded in D010's follow-up.",
    "The adversary's reproductions on the final engine. All twenty seeking an objective at their own centre: unknown at tick 2 where the fix pass read 0.0 s, then 2.92 s. A standing wedge given an objective at the wall above it: unknown at 5 ticks, then 9.63 s. Wedge then Priority on the eight westernmost units marching to (100, 60): reaches it in 16.65 s with a slot error of 0.16. Fixed then Flock: the former leader carries no Arrive. Separation then Fixed with no objective: the leader stays and the run rests. D010's figures stand on the final engine, except that a target radius of 0 now reads 5.0 s.",
    "Time to objective unknown under priority, 60 random runs each: Priority with Arrive 0, Priority alone 0, Flock, Arrive and Priority 1, Wedge with Priority 0. The patched rule read 4, 5, 30 and 0.",
    "The sweep of 24 random selections over ten sequences rested and arrived 24 of 24, and Priority with Arrive arrived 24 of 24. 300 random sessions across all sixteen tools at slider extremes, with steps landing on scheduled frames, hashed the same live and in replay, with no non-finite value and no unit off the field.",
    "A step past the one-hour bound would have saved and then restored as unreadable, so the bound moved to where no session reaches. The cost of reaching it is in D011."
  ],
  "rejected": [
    {
      "option": "Shed only the velocity closing on a neighbour",
      "reason": "Measured above: it preserves group motion but the crowd boils again and 12 of 16 runs never arrive."
    },
    {
      "option": "Remove the shed and accept the boil",
      "reason": "It is what the fix pass found: a mean of 3.4 to 5.9 units a second round the objective for the whole minute, with no arrival."
    },
    {
      "option": "Keep the wall credit, tightened per axis and gated on a driver at the wall",
      "reason": "Built and measured. It closed the original holes and the third look found new ones through the same code. A rule with no knowledge of walls cannot have them."
    },
    {
      "option": "Keep per-unit memory of having crossed the radius",
      "reason": "It adds a field to every unit, and a crowd's outer units may never cross, so a group would read unknown. The two routes need one group-level field."
    },
    {
      "option": "Clamp the objective away from the walls",
      "reason": "A wedge near a wall left its time unknown in 6 of 24 runs with the objective at least 5 from every wall, because pinned members hold the mean off. A clamp would not reach those."
    }
  ],
  "reopenWhen": "The operator's play shows arrival reading wrongly, or a population much larger than twenty changes how far a crowd spreads."
}
```

## WO-015-D017

```json
{
  "id": "WO-015-D017",
  "date": "2026-10-30",
  "dispatch": "resume: verify; independent production walkthrough and rapid keyboard variation",
  "decision": "Record the rapid Space then Escape checkbox mismatch as a Low follow-up, while judging the original criteria against their named flows. All twenty units are unselected in the engine and the canvas label after Escape, but the native checkbox can remain checked when the two events precede the intermediate render. The ordinary keyboard path and the required marquee then Escape path pass. The placeholder on main had no unit selection, so this is not a regression of existing behavior. The read-only verifier leaves implementation unchanged. The known priority crowd shimmer remains deferred under D010 and FUP-e9b95694a5de071e; this pass reproduced it without reopening the ended design loop.",
  "evidence": [
    "docs/evidence/WO-015/VER-001-probes.json: browserExtras.keyboard records the mismatch in the initial rapid case and all ten repeated cases, with All 20 units and a canvas label saying 0 selected while one checkbox stays checked. Waiting for the 1 selected view before Escape gives zero checked boxes.",
    "The independent production walkthrough completed all eight required steps at 360, 768 and 1440, with 24 new captures, no page error, no horizontal overflow, no axe violation, and compositions surviving reload. The separate browser probe passes the required twelve-unit marquee followed by Escape.",
    "libs/features/scene/src/lib/composites/unit-list/unit-list.ts binds checked to row.selected and dispatches toggle on change; ScenePage handles Escape through clearSelection. The browser evidence establishes the mismatch; render coalescing is the inferred mechanism, not a separately proven framework defect.",
    "The independent engine probe passed 48 varied sessions of 600 frames and the earlier same-frame replay, fixed-after-wedge, holed-formation and false-arrival repairs. Priority with Arrive on the twelve western units at objective (69,38) still has nonzero speed after 3600 frames, zero collisions and a recorded arrival, consistent with D010."
  ],
  "rejected": [
    {
      "option": "Fail the order for every new in-surface defect",
      "reason": "The verification contract requires an unmet original criterion or a reproduced regression. This rapid text-input variation is outside the required marquee/Escape and ordered walkthrough cases, which pass."
    },
    {
      "option": "Repair the checkbox during verification",
      "reason": "The verifier is read-only toward the implementation it judges. The next authorized change can repair and verify the behavior."
    },
    {
      "option": "Leave the mismatch only in the report",
      "reason": "An encountered defect needs a structured follow-up with its reproduction and repair rule."
    }
  ],
  "reopenWhen": "A later order changes the scene text-layer controls or selection publication, the operator meets the mismatch, or a probe reproduces it in an original required flow. That last observation would require a fresh blocking criterion judgment.",
  "followup": "Make a scene text-layer checkbox reflect the current selection after rapid Space followed immediately by Escape, even when no intermediate selection render occurs. Touch libs/features/scene/src/lib/composites/unit-list/unit-list.ts and its selection wiring as needed. Add a real-browser regression that issues the two key presses consecutively and asserts both zero selected in the canvas label and zero checked unit inputs, then retain the ordinary Space, marquee and Escape cases. Reproduction and ten repeated outcomes are in docs/evidence/WO-015/VER-001-probes.json."
}
```

## WO-015-D018

```json
{
  "id": "WO-015-D018",
  "date": "2026-10-30",
  "dispatch": "resume: verify; passing verification and prescribed draft publication",
  "decision": "File VER-001 as pass with all ten original criteria met and the Low rapid-checkbox follow-up in D017. Consume the matching target review row and the final candidate document row rather than repeating a complete target gate. Publish the target draft through the exact registered helper, as this order step 17, inherited WO-007 step 15 and the repository profile prescribe. The draft is pull request 9 on feat/soldier-scene toward main; the helper created a commit object from the verified tree while leaving the worktree HEAD and index unchanged. Preserve the report bytes and leave final review as the next operator dispatch.",
  "evidence": [
    "npm run test:docs passed on candidate 986c1c6fe2ff67b7f58a03caf49f0ade5ff729d7 at 2026-10-30T18:41:24.003Z; verification-result pass then recorded VER-001 at 18:41:39Z and released the writer. Its report digest is sha256:e5aae46171237da2a498836ef1bbf57ff09cdf67b697f55a2b0d9095f2366e86.",
    "The prescribed node scripts/worktree.mjs publish WO-015 --target-worktree --draft command exited 0 and opened https://github.com/DylanBWood/DotLn-Angular/pull/9. The reviewed body is docs/evidence/WO-015/draft-pr-body.md; it discloses both priority shimmer and the rapid checkbox mismatch, with no launchpad identifier in its outward text.",
    "gh pr view confirmed isDraft true, headRefName feat/soldier-scene, baseRefName main and headRefOid 96a62d103f66fff6b61e02cb981624992fab6d9d. Git independently resolves that commit tree to fbad54f93626d1cde1321a59a94b46e2e42c50e1, the current passing target-gate subject, and HEAD remains 38f8afd6e1507483c58a662f2df7c3974dfd62b0.",
    "docs/evidence/WO-015/host-qualification.md records the observed Codex host result and the limit that a pre-tool hook admission row is unobserved. No automatic hook admission was invented.",
    "Canonical status and the refreshed projections say verified, VER-001 pass, with final-review as the legal next action. The projection retains criterion 1 as the executor historical unmet entry at ordinal 4; VER-001 independently discharges it, as its walkthrough and completed pass record establish. No waiver or criterion amendment was used."
  ],
  "rejected": [
    {
      "option": "Leave the passing target without its draft review",
      "reason": "The order and repository profile explicitly assign this draft-at-verified handoff to the passing verification session."
    },
    {
      "option": "Make a worktree branch commit or publish through raw Git/forge commands",
      "reason": "The registered draft helper owns the reviewed tree commit, authority checks and one-PR route, preserving worktree HEAD and index."
    },
    {
      "option": "Start final review in this session",
      "reason": "The operator selects that phase through their next resume dispatch and reads the draft first."
    }
  ],
  "reopenWhen": "The draft head changes, final review reproduces an unmet original criterion or regression, the publication record disagrees with the forge, or a later order repairs D017. Final review must read the draft comments and workflow runs before acceptance."
}
```

## WO-015-D019

<!-- integration refs/dotln/checkpoint/WO-015/9 -->

```json
{
  "id": "WO-015-D019",
  "date": "2026-10-30",
  "dispatch": "resume: final review; worktree integrate WO-015",
  "decision": "The integration is a no-op, and no launchpad complete run is owed. The order worktree was already at fetched main 63119c2a1123f9606d9b71ae520a08ac33605bcd, which D001 brought in before execution began and which has not moved since, so the helper moved no launchpad byte and merged nothing; its named stash was applied in full and dropped. This target order consumes no launchpad complete row: criterion 10 names the target review gate and npm run test:docs, and the result transition for a target order reads the target review row at the target's tree and the document row for the working tree, as WO-019-D031 and WO-019-D034 recorded while core's answer stays pending on FUP-2403ce12b1fca8b2. The three other affected checks the helper printed ran green. Carried-forward claims: VER-001's ten criterion judgments at target tree fbad54f93626d1cde1321a59a94b46e2e42c50e1, the tree of draft commit 96a62d103f66fff6b61e02cb981624992fab6d9d on pull request 9. This review reproduced the cheap claims at that tree before any edit, then changed two target files to repair VER-001's F1 (D020), so the target review gate is rerun at the repaired tree rather than carried, and the acceptance is D021's. No component version collides: release preparation returns the target-order no-op and no component manifest changed.",
  "evidence": [
    "refs/dotln/checkpoint/WO-015/9",
    "base 63119c2a1123f9606d9b71ae520a08ac33605bcd",
    "upstream 63119c2a1123f9606d9b71ae520a08ac33605bcd",
    "release preparation: WO-015: target order records no release; no files changed.",
    "npm run worktree -- integrate WO-015 --intake-backup <DotLn session scratch>/intake-backup/DotLn-Instance-wo015-intake-20261030T191838Z.zip, the six ignored intake notes archived first by scripts/backup-intake.sh because the helper refuses to run over ignored intake without a backup that preserves every current intake byte (a hand-made archive rooted at intake/ rather than docs/intake/ was refused once): Bases 63119c2a… -> 63119c2a…, authored conflicts none, resolved projections none, checkpoint refs/dotln/checkpoint/WO-015/9, named stash 79e3f6f91d8a0107701b6c09edc4cb9e56772351 (WO-015 integrate 2026-10-30) dropped after complete application; the shared stash stack is empty afterwards; git rev-list --left-right --count main...HEAD printed 0 and 0 before and after; the working tree holds the same five modified records and three untracked record directories as before.",
    "Affected checks as printed: npm run publication:check (publication: no editions declared), node scripts/harness.mjs check (35 generated surfaces; local-terms list present) and npm run release -- check-surfaces --local (48 PASS lines, 0 FAIL) each exited 0. npm test -- --review was not started: this target order's criteria name no launchpad suite and the result transition consumes no complete row for it.",
    "git ls-remote reads DotLn-Angular main at 38f8afd6e1507483c58a662f2df7c3974dfd62b0, the target worktree's HEAD and D002's integrated predecessor, and feat/soldier-scene at the draft commit 96a62d103f66fff6b61e02cb981624992fab6d9d, whose tree is fbad54f9…; the target's main has not moved since the draft."
  ],
  "rejected": [
    {
      "option": "Rewrite reviewed commits or drop a stash before application completes",
      "reason": "Both histories and unfinished recovery material must remain available."
    },
    {
      "option": "Start npm test -- --review for the ritual",
      "reason": "Nothing in this target order consumes a launchpad complete row, and the identity, not the dispatch time, says what was tested."
    }
  ],
  "reopenWhen": "A later integration moves a launchpad code byte before the records publish; the target's main advances past 38f8afd6e1507483c58a662f2df7c3974dfd62b0 before the final publish; or the final publish refuses its Change table or commit range."
}
```

Integration date: 2026-10-30. Original base: `63119c2a1123f9606d9b71ae520a08ac33605bcd`.
Fetched main: `63119c2a1123f9606d9b71ae520a08ac33605bcd`. Checkpoint: `refs/dotln/checkpoint/WO-015/9`.
Named stash dropped after completed application: `79e3f6f91d8a0107701b6c09edc4cb9e56772351` (WO-015 integrate 2026-10-30).
Resolved projections: none.
Release preparation: WO-015: target order records no release; no files changed.
Carried-forward claims: VER-001's ten criterion judgments at target tree `fbad54f9…`, reproduced where cheap by FINAL-001 at that tree before the review's repair (D020), which is why the target review gate runs again at the repaired tree instead of being carried; no launchpad complete row is consumed.
Authored conflicts observed: none.
Affected checks: `publication:check`, `harness check` and `release check-surfaces --local` ran green after the integration; `npm test -- --review` not started.

## WO-015-D020

```json
{
  "id": "WO-015-D020",
  "date": "2026-10-30",
  "dispatch": "resume: final review; VER-001's F1, the checkbox left checked after a rapid toggle and clear (D017)",
  "decision": "Repair VER-001's F1 in this review, inside the declared surfaces and the Boy Scout bound, rather than leave it boarded for a later order. Each text-layer checkbox is controlled: its click is cancelled and the selection alone drives its checked binding, so a toggle and a clear that land before one render cannot leave the native box out of step with the units. Add the real-browser regression D017 asked for, issuing the activation and the clear in one task, and keep the ordinary Space, marquee and Escape cases. Rerun the target review gate at the repaired tree and carry the repair as its own commit, so what changed since the draft the operator read is legible on its own. Settle D017's follow-up.",
  "evidence": [
    "The cause, read in unit-list.ts: the input bound [checked] to row.selected and emitted toggled on change, so Space toggled the native box itself while Angular wrote checked only when the bound value changed; a selection that went false, true, false before one render left the binding unchanged at false and the native box checked. The repair is (click)=\"$event.preventDefault(); toggled.emit(row.id)\": cancelling the click restores the box's checkedness, so only the binding sets it, and the component's comment says so.",
    "Consecutive Playwright presses did not reproduce the defect in this session: a case pressing Space then Escape passed once on the verified bytes, because the render landed between the two round trips, so it proved nothing. The committed case runs input.click() and a bubbling Escape keydown inside one evaluate, which is the mechanism: on the verified bytes it failed (toHaveCount expected 0 checked, received 1) and on the repaired bytes it passed beside the keyboard and marquee cases, each run under node scripts/harness.mjs bounded with NX_DAEMON=false NX_ISOLATE_PLUGINS=false, the registration's own environment.",
    "Fresh suites at the repaired tree before the gate: npx nx test scene --skip-nx-cache, 170 of 170 in 8 files; npx nx lint scene --skip-nx-cache and npx nx test scene-engine --skip-nx-cache, exit 0; prettier --check passes on the two changed files; git diff --check is clean.",
    "node scripts/target-gate.mjs WO-015 --review at the repaired tree 240d7f20205fa8813ec0e6e1266e49b916217bae: install 6,577 ms, lint 45,114 ms, test 10,648 ms, format 1,510 ms, build 5,409 ms, e2e 73,273 ms and visual 18,692 ms all passed with no tracked-byte mutation; row target-gate:c1edc407-9723-4ab0-9af4-a773626d5580, recorded 2026-10-30T19:28:24.588Z, 161,223 ms in all. The six scene baselines are unchanged, because a controlled box renders the same at rest.",
    "The other [checked] inputs on the page have no second writer: the feel and label-set toggles are changed only by themselves, and the inspector's pattern radios share a name, so the browser unchecks the stale one when the binding checks another. No further case of the hazard was found."
  ],
  "rejected": [
    {
      "option": "Leave the follow-up boarded for the next order",
      "reason": "It is a visible wart on the page the operator plays, the repair is two files in the declared surfaces, and this review is the authorized change the record named."
    },
    {
      "option": "Keep the change handler and resynchronise the box from an effect",
      "reason": "More code for the same outcome; a controlled input is the ordinary form."
    },
    {
      "option": "Commit the regression as two Playwright key presses, as D017's words have it",
      "reason": "It passed on the defective bytes, so it would have proved nothing."
    }
  ],
  "reopens": {
    "decisionId": "WO-015-D017",
    "observation": "Repaired at final review: the text-layer checkbox is controlled, a one-task browser case fails on the verified bytes and passes on the repaired ones, and the target review gate passed again at the repaired tree."
  },
  "reopenWhen": "A later order changes the text layer's selection controls or the selection's publication, or a browser case shows a checkbox out of step with the units again."
}
```

## WO-015-D021

```json
{
  "id": "WO-015-D021",
  "date": "2026-10-30",
  "dispatch": "resume: final review; FINAL-001 acceptance and the publication that follows it",
  "decision": "Accept WO-015 in FINAL-001 with every criterion met and record pass. Criterion 1, which the executor recorded unmet because it is the verifier's to perform, is judged met on VER-001's walkthrough: every step completed at 360, 768 and 1440 pixels in the served production build, 24 captures under docs/evidence/WO-015/walkthrough plus three slider-access captures, and the verifier's own account of cohesion radius, collisions and time to objective at each equip; no waiver or amendment was needed. Commit the target as two commits over the base 38f8afd6e1507483c58a662f2df7c3974dfd62b0: 1eb63058ba05ff961db52bdc1302ff1f58bd168b, 'feat: add the soldier scene with flock, arrive and formation', made from the verified tree fbad54f93626d1cde1321a59a94b46e2e42c50e1 that the draft commit 96a62d10 already carries, and 0df9db56bf0f18e7cf9d8e06bd91bdedc0774d60, 'fix: keep a text-layer checkbox in step with a cleared selection', the review's repair (D020), tree 240d7f20205fa8813ec0e6e1266e49b916217bae, which the review gate row target-gate:c1edc407-9723-4ab0-9af4-a773626d5580 covers. Two commits rather than one: the operator read the draft, the repair is an independent correction readable on its own, and each tree has its own passing review row. After the result: target-records adds the records commit; the instance records are committed; the target publish reuses draft pull request 9 on feat/soldier-scene with the order's title and PR.md and marks it ready; then the instance records branch is published with RECORDS-PR.md. Register rows this review disposes: D017's follow-up settled (D020). Rows left as they are, with their owners: FUP-e9b95694a5de071e (D010, the priority-steering crowd) for the planning pass that takes the operator's notes, and the eleven touching rows whose conditions name this order's merge, for the pass that follows it.",
  "evidence": [
    "Reproductions at the verified tree before any edit: grep -rlE \"@angular|document\\.|window\\.\" over the engine's non-spec sources prints nothing; grep -rl \"<canvas\" over the feature prints only wrappers/scene-canvas/scene-canvas.ts and the createElement, OffscreenCanvas and getContext grep outside the wrapper prints nothing; the node: import grep over the three libraries prints nothing; grep -rlE \"<dl|dotln-key-value-list\" prints nothing and grep -c Chrome on the page's stories prints 1; grep -c \"drawing API\" on component-taxonomy.md prints 1, scene.md and scene-rules.md exist and grep -c \"engine runs\" on the rules prints 1; package.json's dependencies keys equal 38f8afd's and package-lock.json is unchanged; ls docs/evidence/WO-015/walkthrough | wc -l prints 51, 27 of them the verifier's ver-001 captures; git diff --check is clean in both worktrees.",
    "The target working tree hashed through a temporary index to fbad54f93626d1cde1321a59a94b46e2e42c50e1 before the repair, equal to the draft commit's tree and to the review gate row target-gate:0ccbac6a-7761-43eb-8572-666d71cf6287 the verification consumed; after the repair it hashes to 240d7f20205fa8813ec0e6e1266e49b916217bae, the tree of HEAD and of the rerun row (D020). Author and committer of both commits are the operator's public identity, the first commit was made from the verified tree object with git commit-tree so no byte of it was staged twice, and the status is clean.",
    "Both commit messages, the title and the branch pass node scripts/outward-lint.mjs commit, pr-title and branch with the target flag; PR.md and RELEASE-NOTES.md pass pr-body --target and release-body --target, and RECORDS-PR.md passes pr-body, each with zero review matches and the local-terms list present.",
    "gh pr view 9 at 19:07Z and 19:31Z: an open draft on feat/soldier-scene at 96a62d10, mergeable and clean, CI checks 'checks', 'visual' and 'title' all SUCCESS (completed 18:42Z to 18:51Z), no reviews, no comments and no review threads, so there was no operator item to route; recorded in docs/evidence/WO-015/preview-pr.json.",
    "Three of the verifier's captures read as images: ver-001-03-flock-1440.png (the twelve ringed and gathering, the rail grouped and coloured, Flocking's definition in the inspector, the instruments at 14.9, 0, 0.69, unknown and 0 with sparklines), ver-001-05-wedge-768.png (the eight in their slots at 8.1 with time to objective 19.8 s and the slot table showing 8 of 8 placed) and ver-001-06-compare-360.png (the comparison in the instruments' place, divergence at frame 905, 32.2 to 8.1, 0 to 0, 0.80 to 0.00, 5.0 to unknown).",
    "Usage: entry 209,885 tokens at 2026-10-30T19:06:57Z; the handoff reading is in FINAL-001; no worker spawned, 0 of the cap of 20."
  ],
  "rejected": [
    {
      "option": "Carry VER-001's gate row to the reviewed head",
      "reason": "The row is keyed by the tree hash and the repair changed the tree; the gate ran again and passed at the new tree."
    },
    {
      "option": "One commit for the verified tree and the repair together",
      "reason": "The operator read the draft; a separate commit keeps the review's change readable on its own, and the publication rule lets an independent correction stand apart."
    },
    {
      "option": "Fail or waive criterion 1 on the executor's unmet line",
      "reason": "The criterion is the verifier's to perform and VER-001 performed it; the executor's line records whose share was left, not a failure."
    },
    {
      "option": "Repair the D013 items or the priority-steering shimmer in review",
      "reason": "They change decided structure or the engine's behaviour; none breaks a criterion or a behaviour main had, and the iteration belongs to the planning pass the operator sent it to."
    }
  ],
  "reopenWhen": "The final target publish or the records publish refuses, the pull request's head moves before a merge, or a later order finds a defect in the scene, its engine or its checks that this review's reading missed."
}
```
