# WO-037 decisions

## WO-037-D001

```json
{
  "id": "WO-037-D001",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Use 6eef542987ab2183817baba329a64373cb61b157 as the integrated target baseline. Run the development server in the order worktree and exercise the scene in one visible Playwright MCP tab.",
  "evidence": [
    "After git fetch origin, the ancestor check exited zero and HEAD, main and origin/main resolved to that same revision. Canonical status selected the active target order with its WO-036 dependency met. The launchpad draft-route check found five matches.",
    "The isolated scene tab loaded the 20-unit field and Step advanced frame 0 to frame 1. The session direction is recorded in ignored intake, SHA-256 d8ffd8a3348e1c616bc546b2a9480df6176583e8857b051792828cb2e90dac9e."
  ],
  "rejected": [
    { "option": "Open a new browser for each manual check", "reason": "The operator is watching the interactions and live reload in the same window." }
  ],
  "reopenWhen": "An integrated target main changes the tested baseline or the live browser disconnects."
}
```

## WO-037-D002

```json
{
  "id": "WO-037-D002",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Use board animation cues for both aim modes. The firing solution and Moving targets read one marked pose. Iterative targeting reads later poses as drag stretches the animation. Keep the catalog names, the comparisons on a crossing piece, the drag control, geometry, knockout and replay. The inspector identifies the cue used.",
  "evidence": [
    "The operator selected this substitution in this dispatch. The choice and the question it answered are captured together in ignored intake, SHA-256 d8ffd8a3348e1c616bc546b2a9480df6176583e8857b051792828cb2e90dac9e.",
    "The scene already advances a fixed board clock and can replay a seed and its recorded steps. The change is confined to the toy's mechanism and its corresponding checks."
  ],
  "rejected": [
    { "option": "Keep the original general-purpose moving-target solver requirement", "reason": "The operator chose the board-animation implementation for this order." }
  ],
  "reopenWhen": "The operator changes how the game's two aim modes should read its animation."
}
```

## WO-037-D003

```json
{
  "id": "WO-037-D003",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Add combat.fire, combat.projectile and combat.aim to the catalog transform contract and its scene-kind readers. Use the five existing AI for Games rows and its existing step format.",
  "evidence": [
    "The schema, model union, engine and catalog checker use the same three names. Recomputing the inventory adds five runnable rows to the rail and leaves the checkpoint date intact.",
    "The new clear and walled fixture records nine shots from three shooters in each branch, with nine and zero hits respectively. The trial and walls fixtures acquire four metric series. All four old hash arrays equal those at the integrated base."
  ],
  "rejected": [
    {"option":"Store separate scene-only catalog entries","reason":"The catalog, rail and link reader already share the runnable rows."}
  ],
  "reopenWhen": "A catalog change introduces a new kind of board action."
}
```

## WO-037-D004

```json
{
  "id": "WO-037-D004",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Record round one without an operator pick and ship A, which combines a short contact spark with the recipient's count. The operator requested an unattended live presentation. Carry their visual choice to the next round.",
  "evidence": [
    "The operator's direction to continue without waiting for their input is recorded in ignored intake notes/wo037-live-presentation.md, SHA-256 b073cfb3d1a2d4b7e3f38ce843aeffb35ef5e035e80e37686e11512539094c2d. The deferral is the executor's application of that direction.",
    "design/comparisons.md links A followed by B at 2080, 360 and 3840 pixels. The screenshots use identical inputs, frame 57 and a target with two hits toward a threshold of three. The only changed pixels surround that glyph.",
    "Removed libs/features/scene/src/lib/wrappers/scene-canvas/hit-ring-candidate.ts and its temporary painter and frame wiring. The candidate file is absent from the target."
  ],
  "rejected": [
    {"option":"Leave both painters selectable in the shipped scene","reason":"The design exercise changes one variable and its delayed-round rule ships A."}
  ],
  "followup": "Resume WO-037's hit-marker design rounds with the operator, starting with the saved A and B pair. The operator picks or requests another change and decides when the rounds end.",
  "reopenWhen": "The operator returns to the hit-marker comparison."
}
```

## WO-037-D005

```json
{
  "id": "WO-037-D005",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Use one route choice for the inspector and search overlay. A recorded route survives a rewind and settled pause. A paused change of a path parameter requests a new preview.",
  "evidence": [
    "Before the repair a resumed moving route showed the preview heading and an empty route reading. With six selected units the corrected replay retained its 111-cell search. An unapplied heuristic edit then showed the 1,220-cell preview and left the log intact.",
    "The facade regression covers the recorded route, the different unapplied one, the unarmed parameter commit and the displayed search."
  ],
  "rejected": [
    {"option":"Arm a replayed path tool automatically","reason":"A parameter edit would start writing new steps into the composition."}
  ],
  "reopenWhen": "A replay's route and the visible search disagree."
}
```

## WO-037-D006

```json
{
  "id": "WO-037-D006",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Draw the trial's earlier streaks as a dotted layer under the current branch. During a volley, put shots, hits and accuracy first so the phone shows all three together. The inspector describes what each tool does on this board.",
  "evidence": [
    "In the production crossing the runner had zero, eleven, zero and eight hits for current pose, single cue, delayed single cue and later cues at frame 145. The instrument totals include hits on other pieces, which the target row makes distinguishable.",
    "The two delayed aims separated at frame 25 and finished their trial at 72% and 90%. A full-size screenshot of the initial phone layout exposed the score split across two rows. The final volley layout puts the three readings side by side."
  ],
  "rejected": [
    {"option":"Require the operator to switch branches to see their streaks","reason":"The existing trial already retains a frame from each branch at the same tick."}
  ],
  "reopenWhen": "A replay shows both branches but their different paths or readings are hard to distinguish."
}
```

## WO-037-D007

```json
{
  "id": "WO-037-D007",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Repair the first review's ordinary-input failures. Retain separate ownership of a fixed leader and its assigned slot, preserve an edited path preview on reselection, and base the shot inspector on the same board animation as its streak.",
  "evidence": [
    "Criteria found two open failures from the normal controls. Fixed formation, Arrive and a follower knockout returned a detached leader to a slot. The smaller row now retains an external leader only as its anchor and disappears with the last assigned member. A repeated click after a paused path edit exposed the recorded 111-cell search in place of the pending 1,220-cell search. The selection keeps both views on the pending route. Each repair has a regression using those controls or steps.",
    "Criteria also reproduced a downed piece still drawing its three avoidance rays. The avoidance tool and a three-hit retirement were the writers. One frame filter removes this stale activity. The simulation test checks rays on both sides of the knockout.",
    "Design reproduced an admitted mark whose later sampled pose exceeded its range, an objective receiving a pose label, and shared speed silently reverting to 36 while changing drag. These were open failures on inspector input. The preview reads the planned clip, range cutoff and actual kind of mark. Shared speed follows the selected pieces, preserves a mixed group when editing drag, and describes assisted timing in beats. Engine and facade tests exercise the cases.",
    "Design traced the launch loop's new counters and streaks into the clip recorder's starting state. Movement had no current dependency on those fields. Collecting launches separately keeps the post-contact board stable for every piece at the cost of one small unit array per active volley. A mixed volley test inspects the recorder's input.",
    "Consistency reproduced a valid fixture writer leaving range unformatted. The guide now lists all three files. The A/B opening now attributes its two contacts to two streaks, and the browser's structural hit-presence checks use the recipient's count element. Tests that check the readable count retain the wording.",
    "The operator's unattended-live direction in the capture cited by D004 applies to this presentation. It supplied no visual preference. D004 explicitly attributes the timing decision to the executor and retains the operator-led comparison in the follow-up. The evidence qualification is recorded with the existing follow-up."
  ],
  "rejected": [
    {
      "option": "Add an independent calculation of a moving glyph’s future track",
      "reason": "The game already has an authored pose clip that the preview and streak can share."
    }
  ],
  "reopenWhen": "A supported replay, a squad vacancy, a shared speed edit or an inspector reading contradicts its visible result."
}
```


## WO-037-D008

```json
{
  "id": "WO-037-D008",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Translate the new combat vocabulary on both of its reading surfaces. Retain the catalog identifiers in data and the separate Scene and Tools message scopes. Give each existing exhaustive study input its own test case.",
  "evidence": [
    "Round two confirmed the detached leader, unchanged-selection preview, retired rays, stable volley, shared speed and fixture instructions on tree bc922a7c6850e95c922660e495480f928f32db76. The criteria and consistency rechecks found no new blocker.",
    "Design found that typed catalog records supplied observable and metric identifiers directly to the new inspector sentence. This admitted untranslated display text under criterion 7. The catalog reader also used these values and the authored parameter names and units. The two readers now look up those display words in their own message catalogs. A browser test substitutes distinct labels in both scopes and checks both screens.",
    "Design flagged the fractional end of the tempo band. At 2080 × 1460 the ordinary keyboard slider selected 59.68. The inspector played a 36-frame clip while its hint placed the three-beat band only from 24 through 59. This visible mismatch affects the wide-screen walkthrough. The hint now includes the full interval from 24 up to 60.",
    "The required tools project timed out the same four existing movement study sweeps in two complete executions, including a stand-alone run. Each case combined every offered input under one wall-clock timeout. The separate inputs now retain every frame, assertion and corner and receive individual case deadlines within the existing project limit. This bounded test change belongs to the adjacent-work item. The scene settlement case also retains both 3,600-frame limits and its complete comparison with a time allowance for that work."
  ],
  "rejected": [
    {
      "option": "Increase the default timeout for the Tools project",
      "reason": "It would alter the limit for unrelated tests and still leave a failing input buried inside a sweep."
    },
    {
      "option": "Treat the identifier inside a translated sentence as an already translated display value",
      "reason": "A translator can change the sentence but cannot change the inserted words."
    }
  ],
  "reopenWhen": "A translated catalog value falls back to raw text, a visible tempo setting lacks an accurate band, or the tools target loses exhaustive coverage."
}
```


## WO-037-D009

```json
{
  "id": "WO-037-D009",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Close the review ladder on target tree 69539994eb9371653a6bd5b3325d26cb31d58159 and use the work order's declared preflight and gates to judge it.",
  "evidence": [
    "The final combined worker traced the 12-file delta from the second review. Its probes covered the new message inventory, fractional tempo bounds, the four unchanged input matrices and assertions, and fixture manifests and hash pins. It reported zero blockers. Its one observation concerns possible future catalog vocabulary. All five current row writers have a message for every displayed token. The stored identifiers continue to support older catalog entries.",
    "The separate browser test changed messages in both scopes and read the substituted words in the scene inspector and catalog. The Tools project passed 1,327 cases in 129 files after distributing the four study sweeps. The adjacent-work item is complete."
  ],
  "rejected": [
    {
      "option": "Open another review round",
      "reason": "The combined review completes the declared three-round ladder."
    }
  ],
  "reopenWhen": "A selected gate or independent verification reproduces a failure."
}
```


## WO-037-D010

```json
{
  "id": "WO-037-D010",
  "date": "2026-11-19",
  "dispatch": "resume: next",
  "decision": "Use complete messages for the target picker, hit count and shot summary. Give the observed slow tests time to reach the behavior they check.",
  "evidence": [
    "The workspace template audit found a target label that combined its role and roster number in the view model, and two separators placed directly in translated text. The target now uses a message with separate role and number arguments. Translators own the punctuation in both the hit count and the shot summary. The complete workspace lint and the three translation-copy tests passed.",
    "An aggregate engine run failed in the crowd steering suite. A single-file run identified three five-second timeouts, including two cases that took more than eleven seconds. The three table-driven checks now have twenty seconds each, with every simulation frame limit, direction and numerical comparison preserved. The full scene-engine target passed after the edit.",
    "Two cold catalog visits reached their five-second drawing checks while the page still displayed its library or study loading state. The label sweep and the Flocking screenshot now wait up to fifteen seconds for the drawing. Their subsequent frame, geometry and pixel checks keep their original limits."
  ],
  "rejected": [
    {
      "option": "Raise the default deadline for all engine and browser tests",
      "reason": "The reported failures identify the individual tests and the readiness assertion that need the extra time."
    }
  ],
  "reopenWhen": "A translated sentence loses one of its quantities, one of the observed runs fails an assertion, or a loaded drawing no longer meets its existing visual comparison."
}
```


## WO-037-D011

```json
{
  "id": "WO-037-D011",
  "date": "2026-11-19",
  "dispatch": "resume: verify",
  "decision": "Board, and do not fix in verification, what the Down units instrument reads while the shooters are selected. Every instrument reads the selected units, so a target the selection has knocked out is never counted and the figure stays at zero beside a field and a text layer that show it down.",
  "evidence": [
    "In the production build, with units 03, 08 and 13 selected, Down units read 0 on frame 574 while unit 09's row read down with three hits, and 0 on frame 2450 while five rows read down. With nothing selected the same state reads 1.",
    "The engine gives the same answer: with unit 09 down, measure over the scene returns 1 down unit and measure over the shooter returns 0. The reproduction record holds both readings.",
    "No criterion names the figure's scope. Criterion 3 reads the target's activity and the e2e case reads the figure with nothing selected, so both hold. The verifier judged the page usable for the Objective's session because the row, the dim glyph and the disabled target option all say down."
  ],
  "rejected": [
    {
      "option": "Fail criterion 1 on this figure",
      "reason": "Every step of the session completed and the knockout is legible from the field and the text layer. A misleading figure in one selection is a defect in a declared surface that breaks no criterion."
    }
  ],
  "followup": "Make the soldier scene's Down units instrument agree with the field while shooters are selected. Rule: with pieces in focus, the reading counts the pieces their shots have retired, or it counts the whole scene and says so, and a test selects the shooters before reading it.",
  "reopenWhen": "A repair of this order touches the instruments, or the operator reads the figure as wrong in use."
}
```


## WO-037-D012

```json
{
  "id": "WO-037-D012",
  "date": "2026-11-19",
  "dispatch": "resume: verify",
  "decision": "Board, and do not fix in verification, that Hits to knock out compares against every hit a piece has taken since the run began. In a session that has already been firing, the setting retires the target and any bystander already past the count on the first later shot to reach each of them.",
  "evidence": [
    "In one continuous production session units 04, 09, 10, 14 and 15 held 19, 82, 7, 11 and 8 hits when the shooters' knockout was set to three on frame 2121. All five were down by frame 2450, four of them bystanders in the line of fire, leaving one of the six-piece squad standing.",
    "From a fresh composition the same setting behaved as criterion 3 states: unit 09 had two hits on frame 571 and went down with its third on frame 574, and the four left re-formed as a line of four.",
    "The order's Design says a unit goes down at knockout-hits, which the engine implements. The Objective's own session fires at the target for five steps before it sets the knockout, so performed without a restart it shows the first of these two outcomes."
  ],
  "rejected": [
    {
      "option": "Treat the Objective's sentence as a failed criterion",
      "reason": "Criterion 1 asks that the target go down and its squad close up, and criterion 3 states the third hit for a run that starts with the setting. Both were observed. The difference lies between the Objective's narrative and the Design's rule."
    }
  ],
  "followup": "Decide what a knockout setting counts in the soldier scene. Rule: either a piece's hits toward a knockout start when the setting reaches the shooter, or the inspector states that hits already taken count and names how many pieces are at or past the count before Apply.",
  "reopenWhen": "The operator sets a knockout late in a session and reads the result as wrong, or sides and friendly fire are planned."
}
```


## WO-037-D013

```json
{
  "id": "WO-037-D013",
  "date": "2026-11-19",
  "dispatch": "resume: verify",
  "decision": "Board, and do not fix in verification, that Aiming and shooting opens on its defaults when another tool was the last one applied to the same pieces. Its view then names the objective point and the default rate while the pieces fire at a unit, and Apply records a fire step without that unit.",
  "evidence": [
    "In the production build three pieces fired at unit 09 at three shots a second and were then given The firing solution. Opening Aiming and shooting on them again showed Objective point, two shots a second and the preview line asking for a target.",
    "Moving only Hits to knock out to three and pressing Apply recorded a fire step with no target and a rate of two. The shot count stayed at 21 for the next 240 frames and unit 09 never went down. The exported composition shows both fire steps.",
    "The Objective's knockout step follows three other tools on the same shooters, so its inspector opens in this state. Clicking the target's glyph or choosing it in Fire at before Apply gives the intended result, which is how the verifier completed the step, and the view's own hint names both routes.",
    "D007 records the same reset reproduced for shot speed and repaired for speed. Target, rate, range, hit radius and knockout still reset."
  ],
  "rejected": [
    {
      "option": "Fail criterion 1 on this inspector",
      "reason": "The step completes by a route the page offers and explains, and the view shows the objective point before Apply. The defect is a trap in a declared surface and breaks no criterion as written."
    }
  ],
  "followup": "Open the soldier scene's Aiming and shooting view on what the selected pieces are doing. Rule: for pieces that already have a mark, Fire at and the launcher settings show their current values, a selection that disagrees says mixed as the speed control does, and changing one setting applies without changing the target.",
  "reopenWhen": "A repair of this order touches the fire view, or the operator's volley stops or retargets after an Apply they meant for one setting."
}
```


## WO-037-D014

```json
{
  "id": "WO-037-D014",
  "date": "2026-11-19",
  "dispatch": "resume: final review",
  "decision": "Accept WO-037 on the verified target tree 27e2390c6eb19f8e988e54d6545a4a0bb563ce9e, which the review leaves unchanged. The three findings VER-001 boarded stay in D011 to D013: none breaks a criterion as written, and a reviewer does not write a behavioral fix that it then certifies.",
  "evidence": [
    "The final reviewer performed the Objective's session in the served production build on 2026-11-19. Plain shots left the runner at nine hits through frame 280. The single cue raised them from 9 to 31 by frame 520, drag 0.3 held them at 31 through frame 760, and the later cue raised them to 46 by frame 1000. The wall held them at 50 while the shots rose from 108 to 114. From a fresh composition the target stood with two hits at frame 563 and went down with its third at frame 564, and its four squad-mates re-formed with slot error 0.0. The trial of the two aims first differed at frame 31, with accuracy at 70% against 87%.",
    "The same session reproduced all three findings. After the other tools, Aiming and shooting opened on Objective point at two shots a second while the shooters were firing at unit 09 (D013). Set to three late in the session, the knockout retired unit 09 with 53 hits and a bystander with four (D012). With the shooters selected, Down units read 0 while both rows read down (D011).",
    "The review wrote a facade-only repair of D013 and withdrew it before relying on any gate row. Aiming and shooting, Projectile trajectory and Iterative targeting opened on the values every selected standing piece shares, its mark included. A facade case failed without the repair, reading the mark as 0 where 9 was expected, and passed with it, beside the scene project's lint and tests. Product 07 §Independent workflows and integration says a reviewer never writes a behavioral fix and certifies it, and the reviewer's bounded cleanup admits only low-risk cleanup, so the target tree returned to 27e2390c.",
    "The target's review row target-gate:ff380c6d-cded-4d45-8185-aaec7cac370a passed every declared command at that tree. Draft pull request #20's head 58e4e9b carries the same tree, and its checks, visual and title runs passed with no review, comment or thread."
  ],
  "rejected": [
    {
      "option": "Keep the withdrawn repair and pass",
      "reason": "The reviewer would certify a behavioral fix it wrote, with no independent verification of that fix."
    },
    {
      "option": "Fail criterion 1 under rule 28 on the knockout step",
      "reason": "Every step completes through routes the page offers and explains. The three defects are traps in declared surfaces that break no criterion as written, and each carries a rule and a follow-up."
    }
  ],
  "reopens": {
    "decisionId": "WO-037-D013",
    "observation": "The final review reproduced the reset in the Objective's knockout step, wrote a repair that touched the fire view, and withdrew it. The repair opened a shot tool on the values its selected standing pieces share: the mark, rate, range, hit radius, knockout and drag, plus later cues when every piece reads them, keeping the tool's defaults where the pieces disagree."
  },
  "reopenWhen": "A repair dispatch for this order, or a later order that owns the fire view or the instruments, takes up D011, D012 or D013."
}
```


Filed from the launchpad Launchpad at commit a9a9d25d3ea9d42ac746e1593e294c147a4b52be, where this record's path was docs/evidence/WO-037/decisions.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
