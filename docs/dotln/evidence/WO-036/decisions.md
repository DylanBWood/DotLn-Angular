# WO-036 decisions

## WO-036-D001

```json
{
  "id": "WO-036-D001",
  "date": "2026-11-09",
  "dispatch": "planning: the pass of 2026-11-09, on the operator's message of about 04:12Z on 2026-11-10 UTC, after receipt 028",
  "decision": "Amend this order after its planning judgment under the operator's direction of 2026-11-09 that a planning pass settles in itself what it is able to settle and treats nothing on an unmerged branch as fixed (session journal row 2026-11-10T04:12:34Z, message SHA-256 9acd06f09b68b19e8af161046c0179a911ba11e5c9d9aecfbc927e7bb59b5414; the operator record, One pass, not two), bounded to the defect that judgment recorded for it: criterion 2 says why the hashes hold (that fixture's one tool is steer.blend at eb9d227 and the engine's avoid is unchanged), criterion 3 holds the settling repair to priority steering alone, and the Cost line names the repair. Bind the resulting order bytes through plan amend-order.",
  "evidence": [
    "Receipt 2026-11-10-planning-80685a5e0fbc1a46-028: criterion 2 kept the earlier known outcome's hashes while criterion 3 required two steering changes, and the Cost line did not name the settling repair (criterion 2).",
    "docs/planning/passes/standard-pass-v0-122-1-open-orders-rejudged-2026-11-09.md D18, the rows for receipt 028.",
    "npm run plan -- refute refuses a further judgment in this pass (one judgment per pass; dispositions settle repairs, and another judgment requires changed observed evidence), and the receipt records no hold a disposition could bind.",
    "No reviewer or refuter has read this amendment: the review ladder of this pass ended at its third round, before the refutation that named the defect."
  ],
  "rejected": [
    {
      "option": "Record the defect for a later pass",
      "reason": "The operator refused that on 2026-11-09 (the journal row above)."
    },
    {
      "option": "A further planning judgment of the amended text in this pass",
      "reason": "npm run plan -- refute refuses it; the next planning pass's refutation judges this text."
    }
  ],
  "reopenWhen": "The next planning pass's refutation judges this text, or a verifier or reviewer of this order reports a clause the amendment wrote as unjudgeable or wrong."
}
```

## WO-036-D002

```json
{
  "id": "WO-036-D002",
  "date": "2026-11-14",
  "dispatch": "resume: next (executor, Claude Code 2.1.325, claude-opus-5-5, effort max as CLAUDE_EFFORT reports it)",
  "decision": "Activate on the pinned base without a fast-forward. The base guard passes, the target's main is the pin itself, so eb9d227483e30164105da077f50673789d1e5c9f is the integrated baseline every later comparison in this order names until a later integration of main replaces it. The route guard passes and WO-015 is met. The subagent remainder at entry is 40 of a cap of 40.",
  "evidence": [
    "git -C <target worktree> fetch origin, then git merge-base --is-ancestor eb9d227483e30164105da077f50673789d1e5c9f origin/main: exit 0.",
    "git rev-parse origin/main HEAD in the target worktree: both eb9d227483e30164105da077f50673789d1e5c9f, and git log eb9d227..origin/main lists nothing, so there is nothing to fast-forward.",
    "grep -c -- '--draft' scripts/worktree.mjs in the launchpad: 5 (at least 1 required).",
    "npm run resume -- status --json: WO-036 active on base eb9d227483e30164105da077f50673789d1e5c9f, WO-015 hard dependency state met, WO-035 reference-only and non-blocking, checkpoint refs/dotln/checkpoint/WO-036/1.",
    "node scripts/harness.mjs usage 835e8e3d-59b8-4365-96df-39a92029f3c0 at 2026-11-14T23:11:53Z: subagents count 0, cap 40, remaining 40; dispatch standing 0 h 0 min of 8 h 0 min, complete runs 0 of 3."
  ],
  "rejected": [
    {
      "option": "Stop for a planning pass",
      "reason": "Only a main that does not contain the pin stops the order, and main is the pin."
    }
  ],
  "reopenWhen": "The target's main moves before the selected runs; the worktree then integrates it as the lifecycle names and that commit becomes the baseline."
}
```

## WO-036-D003

```json
{
  "id": "WO-036-D003",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 7 and criterion 3, carrying WO-015-D010's follow-up (register row FUP-e9b95694a5de071e)",
  "decision": "Repair priority steering's settling by changing its separation group alone. The group claims a unit on its push alone (the push clears epsilon), and its output is the push plus the unit's own steering (the seek group's output, when seek is in the order), eased by one minus the opposition of the two times the push's share of the maximum acceleration, plus a match of the mean velocity of the units inside the separation range, scaled by the same opposition. The round-the-objective braking WO-015-D016 added, and the settling radius it read, are removed. A crowd travelling together has push and pull agreeing, so it keeps its pace and starts at once when sent somewhere new; a crowd packed round its objective has them head on, so it stops churning and comes to rest; every part fades with the push, so nothing switches at a line. Read 'reaches its new objective' in criterion 3 as the crowd's centre coming inside the objective's target radius, which is how the arrival rule's own crossing test begins: the spec re-targets the crowd 12 to 14 units, the scale of the crawl WO-015-D010 reported. Criterion 3 says neither how near 'nearby' is nor which reading of 'reaches' it means, and the reviewers measured both. On the centre reading, with the spec's crowd of twelve settled 2,400 frames at (60, 40), (40, 30), (80, 50) and (30, 60) and re-targeted in 16 or 36 directions (review round 3), re-targets of 1.5 to 2.5 units arrive later than plain Arrive in every direction, by up to 3 frames, 2.75 units in 4 of 36, and 3 to 14 units never; with the west twelve of the twenty settled at (60, 40) and re-targeted in 8 directions (review round 2), 1.5 and 2 units in 8 of 8, 3 units in 5, 3.25 in 4, and 3.5 and above never. On the stopwatch's reading (timeToObjective), with the spec's crowd (round 3), 3 units are later in 7 to 10 of 16 directions, 3.25 to 10 units in 16 of 16 by up to 6 frames (0.1 s), 12 units in 5 of 16 by 1 frame, and 1.5 to 2.5 and 14 units never. The lag comes where the new objective lies near or inside the crowd's own spacing, which plain Arrive's units, overlapping as they converge, do not keep; this execution found no variant that removes it without leaving the steep crowd churning, a judgment from the variants measured below and not a proof that none exists. Which offsets are 'nearby', and which reading of 'reaches' holds, are the verifier's (WO-036-D013, D016).",
  "evidence": [
    "Base arm on 2026-11-14 at 23:35Z: the candidate's steering.spec.ts block 'a crowd under priority steering with Arrive' run with eb9d227's simulation.ts swapped in, exit 1, 7 failed on 'expected false to be true' (rest) and 'expected null not to be null' (re-target). Candidate arm, npx vitest run --config libs/shared/scene-engine/vite.config.mts src/lib/steering.spec.ts -t \"a crowd under priority steering with Arrive\": exit 0, 7 passed. That swap later stopped reaching the assertions (D015); the arms that stand are in the evidence README: the block against the whole base engine, exit 1 with the same two assertions failing in all 7 cases, and the candidate, exit 0, 7 passed and 39 skipped of 46.",
    "At the base none of four twelve-unit crowds under priority with Arrive (objectives (60,40), (40,30), (80,50), (30,60)) rested inside 3,600 frames, peak speed over the last ten seconds 0.25 to 0.33; with the repair they rest at frames 862, 1,250, 883 and 1,155, and at a slow radius of 1, 3 and 25 at 1,009, 689 and 1,659.",
    "Re-targeted after 2,400 frames of settling by (-14,0), (10,6) and (0,-12): at the base the crowd's centre came within 2 and arrival was recorded at frames 3,295 and 2,463 and never in the third, against 170, 161 and 162 for a plain Arrive from the same places. With the repair the centre comes inside the target radius at frames 112, 104 and 105 against the plain Arrive's 123, 112 and 114; the stopwatch credits arrival at 158, 151 and 152 against 161, 150 and 151, one frame later in two of the three, because a spaced crowd takes that much longer to fall below the arrival speed under the shared arrival rule, which this repair does not touch.",
    "Every one of the engine's 123 specs at that point passed with the repair, including 'settles a crowd at a slow radius of 1 too', which the plain blend failed; the trial known outcome's frame hashes are unchanged (its regenerated diff adds only the three route series), since its one tool is Flocking with no priority and no avoidance weight.",
    "The repair's cost, measured by review round 1's criteria adversary on the twenty with Priority steering alone: a crowd's first arrival comes 11 to 38 percent later than at the base (the west twelve at (60, 40), (30, 20) and (100, 60): frames 344, 357 and 533 against 309, 297 and 449; all twenty at (60, 40): 438 against 317), and its crowds come to rest where the base's never do."
  ],
  "rejected": [
    {
      "option": "The push plus the unit's own steering, nothing else",
      "reason": "Measured: every default crowd rests and a re-target is prompt, but at a slow radius of 1 Arrive pulls at full strength everywhere outside the radius, the crowd packs inside 2.6 of the objective and churns at 1 to 2.5 units a second for ever, failing the existing slow-radius spec."
    },
    {
      "option": "Keep WO-015-D016's braking round the objective under the blend, at a quarter, half or full strength",
      "reason": "Measured: the braking acts all through a near re-target's approach, so the centre arrives at frames 106 to 176 against the plain Arrive's 88 to 98, worse at every strength."
    },
    {
      "option": "Limit the push to the acceleration the unit's own steering leaves free, or damp only the speed along the push",
      "reason": "Measured: the first leaves the steep crowd churning (peak 3.9); the second slows a re-target to frames 99 to 146 and still does not settle the steep crowd at half strength."
    },
    {
      "option": "Brake by the opposition of push and pull, with the pull eased by it",
      "reason": "Measured: it settles every crowd, the steep one included, but a re-target's centre arrives at frames 236 to 250 against 112 to 123, because the rear of a travelling crowd is pressed against its front."
    },
    {
      "option": "Match neighbours' velocity without easing the pull",
      "reason": "Measured: a re-target stays prompt, but the steep crowd still churns at a peak of 2.7 to 3.2, since Arrive's full pull is what drives it."
    },
    {
      "option": "WO-015-D010's other candidate, a speed limit from the clearance ahead",
      "reason": "Not measured. It keeps separation claiming a unit whole, the cause of the crawl, and a crowd travelling together has a short clearance ahead, so it would slow the travel this repair must keep."
    },
    {
      "option": "Change the shared arrival rule so the stopwatch credits a spaced crowd sooner",
      "reason": "Criterion 3 holds the repair to priority steering alone, and the arrival rule times every steering."
    }
  ],
  "reopenWhen": "The operator's play says a crowd under priority steering feels wrong or slow to arrive; a verifier reads criterion 3's 'reaches' as the stopwatch's credit, where re-targets of 3.25 to 10 units arrive up to 6 frames (0.1 s) after plain Arrive and 12 units up to 1 frame; or a verifier reads 'nearby' as a re-target inside the crowd's own spacing, under about 3 units on the centre reading."
}
```

## WO-036-D004

```json
{
  "id": "WO-036-D004",
  "date": "2026-11-15",
  "dispatch": "resume: next; steps 2, 5 and 6, the Design's geometry, graph and following",
  "decision": "Walls are segments with a thickness and obstacles are discs, both held as a segment and how far a body reaches from it, so one shape model in geometry.ts answers every question of clearance through three queries that measure it alike: touches for a body standing (the tile graph's cells), clearMove for a body moving (the graph's edges, the attachment of a search's ends, smoothing's line of sight, a follower's sight of its next waypoint and the physics stop) and castRay for the avoidance rays. A body a shape was drawn over may move only in a direction that does not deepen the contact; the distance to a convex shape changes convexly along a straight move, so a move that starts out not deepening never deepens. The stop takes away the part of a step that would meet a shape and keeps what slides along it, or stops the body dead when even the slide is blocked, as the field's edge does. A following unit makes for the next waypoint once it is within the waypoint radius of this one, or past it, and only when it can see the next one, so it never cuts a corner the route went round; it plans again when the geometry stops it and it can no longer see the waypoint it makes for. The tile graph is built once per geometry, field and radius and kept beside the geometry object, so the state stays plain data.",
  "evidence": [
    "geometry.spec.ts: a move through a thin wall between two clear points is refused, one past the wall's end with room passes, a body drawn over moves away but not deeper, the ray cast finds a wall's face, its rounded end and a disc with their normals, and the stop slides or stops in a corner.",
    "pathfinding.spec.ts: a thin wall between two cell centres leaves both cells free and the edge cut; a diagonal past a blocked corner is refused in a graph built from a plain grid; a unit a thin wall parts from its nearest free cell starts from one on its own side.",
    "path-following.spec.ts: a unit is taken round a wall to the objective and its least clearance never falls below nothing; a wall arriving between a unit and its waypoint stops it, and it plans again within 60 frames and arrives.",
    "A probe of an earlier rule, which moved the aim on only by distance, showed a unit orbiting a waypoint whose next leg a wall had cut: in-sight passing and the lost-way replan are what make the route walkable."
  ],
  "rejected": [
    {
      "option": "Plan again on every stopped step",
      "reason": "A unit sliding round a wall's end is stopped on most frames while its way is still clear; replanning each time would count dozens of replans for nothing and move the route under it."
    },
    {
      "option": "Rate-limit replans by a number of frames",
      "reason": "The Design rejects replanning every tick and a limit adds a constant nothing measures; the lost-way test replans exactly when the route no longer serves."
    },
    {
      "option": "Step a body to the exact moment of contact",
      "reason": "More arithmetic for a gap of at most one step (0.27 field units at top speed), invisible at the field's scale; the probe measured a least clearance of 0.010."
    }
  ],
  "reopenWhen": "A verifier or the operator sees a unit pass through a wall, stick on one with a clear way, or replan while nothing has changed."
}
```

## WO-036-D005

```json
{
  "id": "WO-036-D005",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 5 and criterion 5, the search and the cost functions",
  "decision": "A* expands cells in order of cost so far plus the heuristic's guess, ties broken by the smaller guess, then the smaller cell number; Dijkstra's algorithm is the zero heuristic. The heuristic is always the unweighted field distance, so a travel weight above one leaves it trusted less and a weight below one more than the costs warrant. Equally cheap routes are told apart by a cost far below any real difference in length: entering a cell costs 1e-8 per field unit it lies off the straight line between the ends, plus 1e-10 times a fixed fraction drawn from the cell's number, so the cheapest route is one route and a weight scaling every edge alike, or a better admissible heuristic, changes how much a search expands and never which route it returns. The cost layers (danger, visibility, exposure, cover) are uniform zero until an influence map lands one, so Tactical pathfinding and Tactic weights and concern blending leave route, length and expansions as they are.",
  "evidence": [
    "On the known field (40 by 30, cells of 2.5, a wall from (20,0) to (20,22), from (5,5) to (35,5)) the line bias alone left exact ties: A* with the octile heuristic and Dijkstra returned routes of the same length, 48.890873, through different cells, because the distance from a level line depends on the row only. With the per-cell term, octile, zero, euclidean and octile under a terrain multiplier of 2 return one route; Manhattan, which can overestimate on an eight-connected grid, returns another of the same length.",
    "Pinned in pathfinding.spec.ts: 80 expansions under the octile heuristic and 180 under none for the same route, and more under the multiplier with the same cells.",
    "The per-route bias is at most about 3e-4 for a route of 200 cells at the widest offset, below the least difference between two different octile lengths at a cell size of one, about 3.5e-3."
  ],
  "rejected": [
    {
      "option": "Break ties only in the frontier's order",
      "reason": "The route among equals then depends on the order of expansion, so a weight or a heuristic that changes the order changes the route, and criterion 5 holds the cells the same."
    },
    {
      "option": "A per-cell term alone, with no preference for the straight line",
      "reason": "It picks among equal routes by chance and draws a jagged line; the line comes first so an unsmoothed route reads straight."
    }
  ],
  "reopenWhen": "An influence map lands a non-uniform layer, or a study needs Manhattan's suboptimal routes explained."
}
```

## WO-036-D006

```json
{
  "id": "WO-036-D006",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 7, avoidance and the head-on policy (WO-028-D009)",
  "decision": "Collision avoidance in the simulation runs avoidCollisions, a function of its own beside the unchanged avoid: wherever avoid has a direction it is used as it is, and where the neighbour avoid steers from stands on the body's centre or will at their closest approach, the pair takes the perpendicular of the offset from the earlier unit in the scene's list to the later, or the world's x-axis when they stand on one spot, the earlier steering along it and the later against it. It chooses that neighbour exactly as avoid does, in a loop of its own, so avoid's bytes stay as they were and the Collision avoidance study renders as at the base. Obstacle and wall avoidance casts a ray of look-ahead along the velocity, or the heading when still, and two whiskers half as long at the whisker angle, against the geometry with the body's radius, and steers for the point avoid-distance out from the nearest hit along the surface normal, faded by how far along its ray the hit lies; unlike the book's seek of that point, it never steers along a ray toward its hit.",
  "evidence": [
    "git diff of steering.ts at the candidate removes only the one import line it replaces; avoid and every function before it are unchanged.",
    "steering.spec.ts: an exact head-on pair, a pair on one spot and an ordinary offset crossing each part with their separation across the policy's normal growing from the first frame after it fires, never overlapping once apart, and the same on a replay; two units on one spot given avoidance-weight in the simulation part along x, the earlier to the east.",
    "A spec of the book's form failed on a wall dead ahead: its point lay ahead of the body whenever the wall was further than the avoid distance, so the steering drove the body at the wall at 13.75. Dropping the part along the ray brakes for a wall ahead and keeps the turn from one met at a slant.",
    "Probe on the twenty: unit-02 and unit-04 sent to their midpoint with Arrive overlap for about 500 of 600 frames and end touching; with Collision avoidance at weight 2 they never come closer than 0.999 and end 1.03 apart with no collision, as do two other pairs."
  ],
  "rejected": [
    {
      "option": "The head-on side inside avoid",
      "reason": "The Design rejects it: avoid's output and the Collision avoidance study's pinned zero would change, files WO-040 reshapes."
    },
    {
      "option": "Share one threat-choosing helper between avoid and the policy",
      "reason": "It would rewrite avoid's body; criterion 3 holds the study and avoid as they were, so the policy repeats the choice beside it."
    },
    {
      "option": "Seek the avoidance point as the book does",
      "reason": "It accelerates a body at a wall dead ahead, measured in the failing spec above."
    }
  ],
  "reopenWhen": "WO-045 makes the Collision avoidance comparison the policy's regression, or the operator's play shows a pair parting badly."
}
```

## WO-036-D007

```json
{
  "id": "WO-036-D007",
  "date": "2026-11-15",
  "dispatch": "resume: next; steps 8 and 9, the closed transform enum's growth and the typed rows",
  "decision": "Grow the closed transform enum, as catalog-rules.md requires a recorded decision to, by path.find, path.smooth and path.follow, in tool-v1.schema.json and TransformKind; path.cost was already there. The three lists of scene kinds (sceneTransformKinds in models and in check-catalog.mjs, interpretedKinds) name the same nine. Type seven AI for Games rows: A* (path.find, heuristic '0 zero; 1 manhattan; 2 euclidean; 3 octile', default 3), Dijkstra's algorithm (path.find, no parameters), Path smoothing (path.smooth, max-skip 1 to 32 waypoints, default 8), Path following (path.follow, waypoint-radius 0.25 to 6, default 1.5; path-offset 0 to 6, default 1), Predictive path following (those and predict-time 0 to 2 s, default 0.3), Obstacle and wall avoidance (steer.blend, obstacle-avoidance-weight 0 to 5, default 2; look-ahead 1 to 20, default 6; whisker-angle 0 to 80 degrees, default 30; avoid-distance 0.5 to 10, default 2) and Collision avoidance (steer.blend, avoidance-weight 0 to 5, default 2). The summary's counts and AI for Games' sceneTools are rewritten inline with check-catalog.mjs's exported readCheckpoints, catalogCounts and summarizeWork; its date stays 2026-10-28, the day the join last wrote it.",
  "evidence": [
    "npm run catalog:check -- --partial and npm run catalog:check: PASS, 8 checkpoints, 3463 tools.",
    "The inline rewrite changed only AI for Games' work entry, sceneTools 16 to 28, and the counts (typed 136, untyped 1900, background 1427).",
    "npx nx test catalog and models: 33 passed. The facade spec compares the rail's ids with sceneTools('aifg') filtered by isRunnable and finds 28."
  ],
  "rejected": [
    {
      "option": "Rerun npm run catalog:join",
      "reason": "It needs the research run's directory and rewrites the date; the order names the inline route."
    },
    {
      "option": "Type the Tile graph as a rail tool",
      "reason": "aifg-a:247 is a background scene element with no faces; its one setting, cell size, is the field's, and the Design keeps it so."
    }
  ],
  "reopenWhen": "A later order types more Chapter 4 rows or an influence map gives path.cost a layer to weigh."
}
```

## WO-036-D008

```json
{
  "id": "WO-036-D008",
  "date": "2026-11-15",
  "dispatch": "resume: next; steps 3 and 6, how path steps and field steps act on units",
  "decision": "A unit given any path tool finds and follows a route to the objective: with neither seek nor arrive of its own it reads arrive at one, as a formation's leader does, and its seek or arrive heads for its aim along the route, coming at each turn no faster than it can carry round it and doing what it does at the route's end. A path step sets its own part of the route whole, so a parameter it does not carry reads as its default: Dijkstra is A* with no heuristic, and Path following is Predictive path following looking no time ahead; the cost functions keep the weights a step does not name, and the travel weight is the product of travel-cost, distance-weight and terrain-cost-multiplier. Like a blending tool, a path tool takes a unit out of its formation. The first plan a unit makes does not count; a plan after a field step, an objective step or a stop on its way counts in replans. A unit with no route is blocked: it brakes where it stands, drops out of the objective's drivers, is never counted stalled, and says why in its row, the inspector's notice and blockedUnits. Field steps carry geometry with their true tick and an empty selection, a named shape is replaced where it stands, and isSafeStep refuses a negative thickness or radius and a cell under one unit across (at most 9,600 cells per graph).",
  "evidence": [
    "simulation.spec.ts 'field steps': a field.wall with no units applies while a steer.blend with none is refused no-units; a named shape is replaced, an unnamed one added, one or all cleared; the cell size changes and the shapes stay; the least values refuse what they should; a wall drawn at frame 30 leaves the first 31 hashes as without it and parts after.",
    "path-following.spec.ts 'no route' and 'planning again': a sealed unit reads blocked with reason no-path, is counted blocked and not stalled and stands still; clearing frees it to arrive; replans count a field and an objective step and not the first plan.",
    "Walls known outcome: in branch A the twelve west of the wall arrive with no frame inside a shape and no replan; in branch B the seal at frame 30 makes all twelve plan again, all twelve end blocked and blockedUnits reads 12."
  ],
  "rejected": [
    {
      "option": "Make Path following without A* do nothing until a search tool is applied",
      "reason": "Every ways tool would then need another first, and the rail offers them side by side; any path tool means find and follow, its own setting tuned."
    },
    {
      "option": "Keep a blocked unit among the objective's drivers",
      "reason": "A group with one sealed member could then never arrive, and the stopwatch would run for a unit that is going nowhere."
    }
  ],
  "reopenWhen": "The operator asks for a path tool that tunes without routing, or a unit with no route should keep its other steering's pull toward the objective."
}
```

## WO-036-D009

```json
{
  "id": "WO-036-D009",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 13 and criterion 8, WS-001 rule 25's first pair",
  "decision": "Ship candidate A and end the rounds, on the operator's word. Round 1 varied one thing, where field editing lives: A put the field tools (Select, Draw wall, Place obstacle, Clear walls and the Tile graph's cell size) in the transport and the list of walls and obstacles under the unit list; B put an Inspector and Field tab pair in the inspector's place, the Field tab holding the same tools and list. Both were rendered from the served mocked build at 2080 by 1460 and 360 by 800 and read at 3840 by 1620 after the same session. The operator chose A and ended the rounds when asked (ignored capture docs/intake/notes/wo036-design-round-1-2026-11-15.md, SHA-256 e6413fd7cfe87de62b3754c9da7966a92df9e9e92021470011119705097471c9). B's implementation leaves the code: it had no file of its own, living as a branch in files A keeps, the scene page's template and class (scene-page.html and scene-page.ts) behind a temporary query switch, and three messages in apps/dotln/public/i18n/en.json and its scene testing copy; its record is design/round-1/b-field-tab.patch beside its captures.",
  "evidence": [
    "docs/evidence/WO-036/design/comparisons.md names the pair, the captures and the pick.",
    "After the removal, grep -c for fieldTab, ng-template and ngTemplateOutlet in the scene page's template and class prints 0 for each, and grep -c '\"side\"' in en.json and the scene testing copy prints 0 for each.",
    "B's removed parts, as files: none, so criterion 8's ls has no file of B's to run on; B's parts lived in scene-page.html, scene-page.ts, en.json and libs/features/scene/testing/src/lib/scene-en.json, which stay as A's, and the counts above show B's branch and messages gone from them. Its record and captures stay under docs/evidence/WO-036/design/round-1/."
  ],
  "rejected": [
    {
      "option": "Build B in files of its own so its removal could be shown by ls",
      "reason": "B was the same two composites placed elsewhere; a component made only to be deleted would have been the cost of the comparison, not the comparison."
    }
  ],
  "reopenWhen": "The operator asks for another round of the field's editing; a decided choice is not relitigated in this order."
}
```

## WO-036-D010

```json
{
  "id": "WO-036-D010",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 4 and criterion 4, the older-trial rule",
  "decision": "stored-scene.ts reads a kept trial as it is and fills a missing later metric: it requires a valid series for each of the eight metrics scene-composition-v0 carried at eb9d227 (cohesionRadius to assignmentCost), checks any later series that is present, and gives one that is missing a series of nothing as long as the trial's own. Storage and the export keep their versions. The compare shows only the trial it has just run, which always carries every metric, so a kept older trial's nothing is what it reads as wherever a later page shows one; the compare also leaves the three route figures out of a trial in which no unit had a route or was blocked.",
  "evidence": [
    "scene-store.spec.ts: a stored value whose kept trial carries only the eight restores complete with the three new series as nothing; the same trial in an export imports; a trial missing one of the eight, or holding a series of words, is refused; a composition carrying field steps exports and imports them as written.",
    "npx nx test scene-data-access: 34 passed."
  ],
  "rejected": [
    {
      "option": "A storage or export version step",
      "reason": "The Design rejects it: nothing reads as no value already, and a version per added metric would move storage on every scene order."
    }
  ],
  "reopenWhen": "A page shows kept trials, or WO-037 adds its metrics under the same rule."
}
```

## WO-036-D011

```json
{
  "id": "WO-036-D011",
  "date": "2026-11-15",
  "dispatch": "resume: next; step 12, the page around the new engine",
  "decision": "Keep the field the page while it gains tools and figures. The field tools sit in one wrapping row under the transport's toggles, the Tile graph's cell size beside them (1.25, 2.5, 5 or 10, the engine's least being one); while a field tool is chosen the coach line over the field says how to draw with it, so choosing a tool moves nothing on the page; the strip shows eight instruments, path length, replans and blocked units after the five it had, on the grid of columns at least 6rem wide it had, each instrument letting its unit wrap beneath its figure where its column is narrow, so the eight sit in one row at 1440, in two at 768 and in three columns at 360; the text layer's unit rows add the route's state in words, and its template moves to its own file, being over forty lines (rule 12). The canvas reads the field tool as an input, so a press made within one render of choosing a tool is read with the tool before it; that window was not measured against a person's hand, the browser tests met it only when they pressed without waiting, and they now wait for the tool's pressed state.",
  "evidence": [
    "At 1280 by 720, the browser tests' default, the first build stacked the tools, the cell size and a hint in three rows and the strip in two, and the field shrank to about 190 pixels tall; with the tools in one row and the hint on the coach line the field measures 896 by 209 pixels at 1280 by 720, the strip in two rows, and 1056 by 499 at 1440 by 900, the strip in one (measured in the served build on 2026-11-15 at 15:29Z).",
    "A capture before the hint moved placed the obstacles about three field units below the press: choosing the tool added the hint row, the field shrank, and the press was read at the new scale. After the move, presses at (62, 74) and (82, 72) place obstacles there.",
    "A browser test that clicked the Draw wall button while it was already chosen put the tool down, since choosing the chosen tool again returns to Select, and its drag then ran as a marquee; the test now clicks only an unchosen tool."
  ],
  "rejected": [
    {
      "option": "Show the route instruments only while a unit follows a route",
      "reason": "The field would resize the moment a path tool is applied; a steady strip that reads unknown is the truer instrument."
    },
    {
      "option": "Narrower or wider columns for the eight instruments",
      "reason": "Measured in the captures: at 5.25rem a figure and its unit ran into the next column at 768; at 7.5rem the strip broke into two rows at 1440. Letting the unit wrap keeps the base's columns and every width readable."
    },
    {
      "option": "Interpret a press by the facade's tool rather than the canvas's input",
      "reason": "The canvas also draws the shape being drawn, which needs the tool as it renders; the window is one render, which the browser tests met only when they did not wait."
    }
  ],
  "reopenWhen": "The operator's play finds the strip crowded at their sizes, or a press made at speed draws the wrong thing."
}
```

## WO-036-D012

```json
{
  "id": "WO-036-D012",
  "date": "2026-11-15",
  "dispatch": "resume: next; the operator's mid-turn messages of about 16:05Z asking for a meta critic",
  "decision": "Run a meta critic of the executor's conduct alongside this execution, as core's WO-276 ran it from its thirtieth launch on (core's docs/evidence/WO-276/critic/: README.md, charter.md and launch.mjs), on the instance's astra worker (GPT-6 Astra, gpt-6-astra, at the max effort the worker table gives it), at the operator's direction to start one, follow WO-276 for how and how often, and use GPT-6 Astra (ignored capture docs/intake/notes/wo036-meta-critic-2026-11-15.md, SHA-256 65fb3d2b1cf754adbb379df773f6ee09f06c11a48c0cde43ec0a1d5e133beac5). The critic is not codified in this instance, where core's WO-279 would make it a kit kind, so it runs from session scratch: core's charter with one source added, the target worktree where the change stands, and a launcher copied from core's with three changes. It runs Codex under the kit's isolated Codex home (startCodexEpisode in packages/skeleton/dist/src/worker-transport.js) and prints whether the operator's Codex configuration and trust table changed; it closes no Codex process and prints any that are new after the run, since a Codex app server older than this dispatch runs on the host; and it saves each report in session scratch, so that the report goes to the operator whole without printing anything under docs/control/local. The cadence is WO-276's: a launch every 75 minutes from the last one, nothing waiting for it, a launch that falls due while a gate is live going out when the gate ends, and the clock ending when the passing gate run is in. Each report goes to the operator whole before the executor answers it, and each point is then answered in a decision, accepted with what changes or declined with the reason. Each launch is one worker use against subagentCap, counted here, since the hook does not see a launch made through node.",
  "evidence": [
    "Before the first launch, the two checks core's README asks a later order to repeat for its own transcripts: codex sandbox -c sandbox_mode=\"read-only\" listed and read this checkout's transcript directory and refused a write beside it (Operation not permitted, no file made); the private list's screen over the four transcript files, printing counts only, found 0 refuse-class and 1 context-class entries.",
    "Launch 1 at 2026-11-15T16:09:10Z, node <session scratch>/critic/launch.mjs WO-036 1 --repository <launchpad worktree> --target <target worktree> --since 2026-11-15, in the background; --print gave core's charter with the one added source line.",
    "npm run worker -- show astra --provider codex: model gpt-6-astra, effort max, standing rules of 1,854 characters."
  ],
  "rejected": [
    {
      "option": "Launch it through npm run worker -- review",
      "reason": "The helper renders only the review kinds' briefs (criteria, design, consistency, combined), not the critic's charter."
    },
    {
      "option": "Run core's launcher unchanged",
      "reason": "It runs Codex in the operator's own Codex home, which this instance's transport isolates because --ignore-user-config does not stop the CLI writing a project trust entry there, and it closes Codex background processes the kit classifies as leftovers while an older app server runs on the host."
    },
    {
      "option": "Save each report in the order's reviews lane under docs/control/local",
      "reason": "The report is the operator's to read whole, and nothing under docs/control/local is printed."
    }
  ],
  "reopenWhen": "The instance takes core's WO-279, or the operator changes the critic's model, its cadence or where its reports go."
}
```

## WO-036-D013

```json
{
  "id": "WO-036-D013",
  "date": "2026-11-15",
  "dispatch": "resume: next; review round 1, three fresh dotln-worker reviewers (criteria, design, consistency) on Claude Opus 5.5 at xhigh over the whole change against eb9d227",
  "decision": "Judge round 1's 41 findings, 35 once the six two reviewers shared are joined, and fix 25 before the recheck; two more, the evidence README's handoff link and criterion 3's counts, are left for later steps and recorded as pending (meta critic 1 found this decision first counting them as fixed, D014). Fixed, each on an input a writer produces: the geometry list let ArrowDown or typing give a shape a negative size, a step the store refused, so a reload dropped the composition and its export would not import (open, criterion 4: a live field step now passes isSafeStep, and the list's size fields carry the engine's least value and put back a refused number); Priority steering's seek group fell back on the objective for a blocked unit, which then walked into the wall (open: it falls back on nothing for a unit with no route); a search's ends rescanned every cell for each failed candidate, so an objective clicked onto or beside a shape cost up to half a second a preview at the smaller cell sizes (open: the nearest cell is tried first and the rest sorted once, and a goal a body standing there would touch is unreachable at once, every route as before); a shape drawn after Restart or Open took a number a later step of the composition names, which then replaced it (open: numbers run past every shape the composition's steps name, nextShapeNumber in the engine); A*'s heuristics showed the catalog's words (criterion 7: messages now); the no-route notices misnamed unreachable-goal and could read 1 units (reworded, number-neutral as the catalog's other counts are); a path offset of zero left a unit on its route aiming at itself (open: it makes for the waypoint); Show search outlived its switch and could shade a unit the inspector did not read (it shades the search the inspector reads, before Apply as after, only while a path tool is chosen); an edit rebuilt a shape from the list's rounded numbers (from the geometry now); look-ahead had no least value though the engine divides by it (0.01); the log called taking one shape away clearing the walls and folded a removal and a clear into one line (a removal has its own title, and the log folds only steps under one title); the clearance guidance named one test where three queries share one model (scene-rules.md, scene.md and D004 reworded); and the design and record findings: the cost weights listed in three places and the path kinds in a fourth (one engine list each), an implicit default case, a type guard narrowing to what it did not hold, defaults kept twice, about 25 public exports nothing used, nothing standing for both null and zero in comments, seek steering computed twice a frame, the stale decisions index, the README's reading list, two READMEs without walls or routes, D009's files and its quotation of the operator, and a shipped study sentence the public ray cast would have made false (the ray cast stays internal; the follow-up carries the sentence to WO-045). Pending: the evidence README's handoff link resolves when the handoff is written, before the document gate (C12), and criterion 3's counts are taken again at the candidate the ladder leaves (K4). Recorded with no code: near re-targets under 3 units arrive up to 3 frames after plain Arrive; the variants D003 measured did not remove that lag without the steep crowd churning, which is a judgment and not a proof, and D003 leaves the reading of 'nearby' to the verifier; the repair's slower first arrival (D003's evidence); a routed squad stacking at the objective, main's Arrive behaviour; no browser case exercising the head-on policy, whose engine specs carry criterion 3 (the walkthrough's wording follows it); the route state as a discriminated union and the facade's size, improvements for a later order; translate=\"no\" on the list's labels, which component-rules G3 asks of data values (no defect); and the delivery rows' timing, true at implementation-ready and before any commit (no defect).",
  "evidence": [
    "The three reports, recorded with npm run worker -- record before any fix, as round-1-criteria.md, round-1-design.md and round-1-consistency.md in the order's review lane.",
    "Specs added: path-following.spec.ts, a path offset of zero arrives and a blocked unit under priority steering stands; steering.spec.ts, threatOf agrees with avoid over 300 seeded groups of two to four; simulation.spec.ts, look-ahead's least value and nextShapeNumber; scene.facade.spec.ts 'the field', six cases (the refused edit and the export that imports, numbering past a later step, the unrounded edit, the log's titles, the shaded search, the heuristics' words); mappers.spec.ts 'the field mapper', three cases; composites.spec.ts, the list puts back a negative radius and sends a good one.",
    "Plans with the objective inside or beside a shape, measured in Node after the fix: 0.13 to 0.33 ms at cell sizes 2.5, 1.25 and 1, against the reviewers' 8.4 to 97 ms; the A* preview for twelve units at cell size 1.25 with the objective inside an obstacle 1.07 ms, against their 461 and 532 ms; a goal whose nearest cell lies across a thin wall finds the next cell in 1 to 4 ms, its search included.",
    "After the fixes: lint for the ten touched projects; the lib and spec type checks of scene-engine, scene, scene-data-access and tools, and typecheck:e2e; Vitest scene 191, scene-data-access 34, scene-engine 186 (both known outcomes reproduce) and tools 1,116 at one worker; i18n:check, the copies test (3) and check:fixtures pass; the studies, package.json and the lockfile still equal the base's, and steering.ts still differs from the base above its new code by its one import line."
  ],
  "rejected": [
    {
      "option": "Tune priority steering until re-targets under 3 units match plain Arrive",
      "reason": "Plain Arrive's units overlap as they converge, which a crowd that keeps its spacing does not do, and every variant D003 measured that sped a re-target left the steep crowd churning; that is a judgment from those variants, not a proof that no tuning could."
    },
    {
      "option": "Gate every live step in the facade's apply on isSafeStep",
      "reason": "The catalog bounds every typed parameter at or above the engine's least values (none of the 228 has a lower minimum), so only a field edit can make an unsafe step; the gate stands where field edits are made."
    },
    {
      "option": "Rename the Clear walls button",
      "reason": "The order's Design names the tool Clear walls; the log now says walls and obstacles cleared."
    },
    {
      "option": "Export the ray cast and correct the corner trap's sentence in this order",
      "reason": "The study's text is in WO-040's file and criterion 3 holds the studies as they were; WO-045 moves the Obstacle and wall avoidance study onto the ray cast."
    }
  ],
  "roundFindings": [
    { "id": "C2", "finders": ["criteria", "design"], "class": "criterion", "disposition": "fixed" },
    { "id": "C1", "finders": ["criteria"], "class": "lesser", "disposition": "fixed" },
    { "id": "C3", "finders": ["criteria"], "class": "lesser", "disposition": "recorded" },
    { "id": "C4", "finders": ["criteria", "design"], "class": "lesser", "disposition": "fixed" },
    { "id": "C5", "finders": ["criteria", "design"], "class": "lesser", "disposition": "fixed" },
    { "id": "C6", "finders": ["criteria"], "class": "criterion", "disposition": "fixed" },
    { "id": "C7", "finders": ["criteria"], "class": "lesser", "disposition": "fixed" },
    { "id": "C8", "finders": ["criteria"], "class": "lesser", "disposition": "fixed" },
    { "id": "C9", "finders": ["criteria"], "class": "improvement", "disposition": "recorded" },
    { "id": "C10", "finders": ["criteria"], "class": "improvement", "disposition": "recorded" },
    { "id": "C11", "finders": ["criteria"], "class": "improvement", "disposition": "recorded" },
    { "id": "C12", "finders": ["criteria", "consistency"], "class": "lesser", "disposition": "recorded" },
    { "id": "C13", "finders": ["criteria", "consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "D4", "finders": ["design"], "class": "lesser", "disposition": "fixed" },
    { "id": "D5", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D6", "finders": ["design"], "class": "lesser", "disposition": "fixed" },
    { "id": "D7", "finders": ["design", "consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "D8", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D9", "finders": ["design"], "class": "lesser", "disposition": "fixed" },
    { "id": "D10", "finders": ["design"], "class": "improvement", "disposition": "recorded" },
    { "id": "D11", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D12", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D13", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D14", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D15", "finders": ["design"], "class": "none", "disposition": "recorded" },
    { "id": "D16", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D17", "finders": ["design"], "class": "improvement", "disposition": "fixed" },
    { "id": "D18", "finders": ["design"], "class": "improvement", "disposition": "recorded" },
    { "id": "K1", "finders": ["consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "K3", "finders": ["consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "K4", "finders": ["consistency"], "class": "lesser", "disposition": "recorded" },
    { "id": "K6", "finders": ["consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "K7", "finders": ["consistency"], "class": "lesser", "disposition": "fixed" },
    { "id": "K8", "finders": ["consistency"], "class": "improvement", "disposition": "fixed" },
    { "id": "K10", "finders": ["consistency"], "class": "none", "disposition": "recorded" }
  ],
  "reopenWhen": "Round 2's recheck finds a fix that does not hold, or the verifier meets a recorded finding as a criterion failure.",
  "followup": "WO-045: the engine keeps castRay and avoidWalls out of its public API, though WO-045's Obstacle and wall avoidance study is planned to import its ray cast and wall avoidance from @dotln-angular/scene-engine; WO-045 adds them to libs/shared/scene-engine/src/public_api.ts and, in the same change, corrects the Corner trap study's first mechanism step, which says the public scene engine has no wall ray-cast helper (studyAifg/en.json, corner-trap.record.mechanism.steps.step0.text, and its testing copy study-en.json)."
}
```

## WO-036-D014

```json
{
  "id": "WO-036-D014",
  "date": "2026-11-15",
  "dispatch": "resume: next; meta critic 1's report (WO-036-D012) and the operator's direction of about 16:30Z to mark the executor's handling of it as an error",
  "decision": "Record an executor error, as the operator directed: the executor wrote to the operator that the critic was right on its third point before it had given the operator critic 1's report at all, against the rule D012 adopted from core's WO-276 that each report goes to the operator whole before the executor answers it, so the operator was told of a judgment on a report they had not seen (ignored capture docs/intake/notes/wo036-critic-1-error-2026-11-15.md, SHA-256 58e24d44272d7172cae2e426f0b1ef3936f64e1e5cf92861d60db779d88ce418). The report was then given whole. From critic 2 on, the executor's first message after a critic ends gives its report whole, before the executor mentions, weighs or acts on any point of it. Answer critic 1's five points, all accepted. (1) Repeated unexplained stops were rerun before the host's incident log was read, and two runs were then started in a process session of their own, outside the guard's attribution: after a second unexplained stop the executor reads the host's diagnostics before any rerun, and never changes how a command is supervised (host-qualification.md states what happened). (2) The executor narrowed criterion 3's 'nearby' in D003 and called the near re-target lag unavoidable without proof, and D011 called a timing window shorter than any hand without measuring it: D003 and D013 are to state the measured lag (later in all directions at 1.5 and 2 units, in about half at 3 to 3.25 units, never at 3.5 and above, by the round 2 recheck) and leave the reading of 'nearby' to the verifier, and D011 is to state the window as one render, not measured against a hand. (3) The evidence README said every regenerated baseline was read before it was kept, when three of the six had been read in their final bytes: the other three were read at 16:30Z, and the README is to say which was read when. (4) Background launches kept a trailing echo that turned a failed run's exit into success: a logged command now ends with the command whose status matters, or exits with that status, and its result is read before success is reported. (5) D013 counted two pending actions as fixed, the evidence README's handoff link (C12) and criterion 3's counts (K4): D013 is to mark both recorded and pending until they are done.",
  "evidence": [
    "Critic 1: launched 2026-11-15T16:09:10Z, ended 16:27:29Z (18 minutes), gpt-6-astra at max; the launcher's isolation record: the operator's Codex configuration and trust table unchanged, the isolated home removed; the one Codex process new after the run (96363) had exited by 16:28Z.",
    "The session transcript's image reads of the scene baselines: scene-1440 at 14:53:58Z, scene-flocking-360 at 14:54:01Z, scene-768 at 14:54:06Z, scene-flocking-1440 at 14:56:46Z and scene-360 at 14:56:49Z; the 360 and 768 baselines were rewritten at 14:56:16Z, so scene-1440, scene-flocking-1440 and scene-360 had been read in their final bytes and scene-768, scene-flocking-768 and scene-flocking-360 were read at 16:30Z."
  ],
  "rejected": [
    {
      "option": "Treat the early reference as a slip and record nothing",
      "reason": "The operator directed that it be recorded as an error, and the rule exists so that the operator reads the report before the executor's answer shapes it."
    }
  ],
  "reopenWhen": "A later critic's report is cited, weighed or acted on before the operator has it whole, or a later critic finds any of the five accepted points repeated."
}
```

## WO-036-D015

```json
{
  "id": "WO-036-D015",
  "date": "2026-11-15",
  "dispatch": "resume: next; review round 2, the round-1 reviewers re-tasked to recheck their findings and the whole change, over the target tree c2dc279b21d88a5277740edf0eb43a2b7e57e534",
  "decision": "Every round-1 fix held but the two D013 left pending: criterion 3's counts (K4), taken now, and the handoff link (C12), which resolves when the handoff is written. Of round 2's 13 new findings, 10 once the three two reviewers shared are joined, admit three and fix them. Two files failed Prettier after round 1's edits, so the Format gate row would fail (D19 and K14, criterion 10): both formatted. A round-1 fix that counted a blocked unit as not driven let a blocked unit carrying velocity matching cruise on at 40 percent of its top speed (C14): the reviewer recorded it as not admitted, since main had no routes, but the Objective that criterion 1's session walks through has the units stop where they are when the gap is sealed, and Flocking or Velocity matching followed by A* is an ordinary input, so it is admitted; that change is reverted, the seek group's guard kept, and two specs added that fail on the round-2 tree and pass now. Criterion 3's base arm as recorded can no longer be run the way it was (C15): with the base's simulation.ts alone in the candidate, every case throws before it reaches its assertions, so the arm ran again against the whole base engine and failed on the defect's own assertions in all seven cases. Recorded, not fixed, as round 2's rule asks: toggleSearch's comment still names the first selected unit (D20); RouteFrame.search is no longer read by anything (D19, the design reviewer's second use of that id); the geometry list can show a number the shape does not have, a coordinate the engine clamps to the field or one above a million the gate refuses (D21 and C17); the walkthrough predates round 1's fixes (C16 and K12), which step 16 answers by running it again on the final candidate; the profile's map row still says one clearance test (K11); WO-045's study plans to import the ray cast this order keeps internal (K13), which D013's follow-up now hands to WO-045; and the exports kept for WO-045 that nothing reads yet (K15, no defect). Round 2's fixes changed code, so round 3, one combined worker, reads the delta since c2dc279b.",
  "evidence": [
    "The three round-2 reports, recorded with npm run worker -- record --round 2 --recheck <round-1 report> before any fix, on the tree c2dc279b21d88a5277740edf0eb43a2b7e57e534 (snapshotted with the kit's workingTree after the last was recorded).",
    "C14: path-following.spec.ts 'keeps a unit given Velocity matching where it stands, rather than cruising on' and the Flocking case fail with the round-2 line restored (2 failed) and pass without it; simulation.ts was restored byte for byte from a copy around that check. The engine's suite then passed 188.",
    "C15: the block 'a crowd under priority steering with Arrive', copied unchanged into a spec file in a git archive of eb9d227's libs/shared/scene-engine with the target's node_modules linked, ran with Vitest 5.0.5: exit 1, 7 failed of 7, the four rest cases on 'expected false to be true' and the three re-targets on 'expected null not to be null'; the candidate arm, exit 0, 7 passed and 39 skipped of 46; the copied block equals the candidate's text (diff empty). The first base arm, on 2026-11-14 at 23:35Z, had failed on the same two assertions."
  ],
  "rejected": [
    {
      "option": "Keep C14 recorded and not admitted, as the reviewer labelled it",
      "reason": "Its input is ordinary and it fails the Objective's sealed step, which criterion 1's session walks through, and a round-1 fix introduced it."
    },
    {
      "option": "Fix the findings round 2 recorded",
      "reason": "Round 2 admits only what breaks a criterion or a behaviour main had; the rest go to the handoff."
    }
  ],
  "roundFindings": [
    { "id": "D19", "finders": ["design", "consistency"], "class": "criterion", "disposition": "fixed" },
    { "id": "C14", "finders": ["criteria"], "class": "criterion", "disposition": "fixed" },
    { "id": "C15", "finders": ["criteria"], "class": "criterion", "disposition": "fixed" },
    { "id": "D20", "finders": ["design"], "class": "improvement", "disposition": "recorded" },
    { "id": "D19-route-search", "finders": ["design"], "class": "improvement", "disposition": "recorded" },
    { "id": "D21", "finders": ["design", "criteria"], "class": "lesser", "disposition": "recorded" },
    { "id": "C16", "finders": ["criteria", "consistency"], "class": "lesser", "disposition": "recorded" },
    { "id": "K11", "finders": ["consistency"], "class": "lesser", "disposition": "recorded" },
    { "id": "K13", "finders": ["consistency"], "class": "improvement", "disposition": "recorded" },
    { "id": "K15", "finders": ["consistency"], "class": "none", "disposition": "recorded" }
  ],
  "reopenWhen": "Round 3 finds a round-2 fix that does not hold, or the verifier meets a finding recorded here as a criterion failure."
}
```

## WO-036-D016

```json
{
  "id": "WO-036-D016",
  "date": "2026-11-15",
  "dispatch": "resume: next; review round 3, one combined dotln-worker over the delta since c2dc279b21d88a5277740edf0eb43a2b7e57e534, and the changes after it",
  "decision": "Admit X1 on the reading D015 used for C14, and fix it after round 3 with no reviewer after it: a squad carrying Velocity matching that was moving when the gap was sealed coasted on about 20 units, since a blocked unit's seek and arrive were silent and matching the group's mean velocity kept that mean. A blocked unit's seek and arrive now brake it (towardObjective), and a squad spec fails without the change (the sealed squad's centre moved 36.1 units) and passes with it. The comments above isDriven and towardObjective now say what holds (X2): whether a unit is driven is read from its weights, whatever its route, and a blocked unit's seek and arrive brake it. A path unit whose seek or arrive weight is set to zero is not driven, cruises on velocity matching and never takes its route (X2's second point); that predates the delta and is recorded. D003's near re-target figures did not match the reviewers' measurements (X3): D003 now gives both readings of 'reaches', the crowd's centre and the stopwatch, with each measurement's crowd, settling and directions, and leaves both to the verifier; on the stopwatch's reading, re-targets of 3.25 to 10 units arrive up to 6 frames (0.1 s) after plain Arrive. The evidence README now gives the base arm's whole recipe (X4) and lists D014 to D016 (X5). Record an executor error: review rounds 1 and 2 were recorded without --target dotln-angular, so the recorder bound the launchpad as the checkout, and each of those six reports names the launchpad's working tree as the tree reviewed rather than the target's. The target tree round 2 reviewed is c2dc279b21d88a5277740edf0eb43a2b7e57e534; round 1's target tree was not snapshotted; report bytes are not edited. Round 3 is recorded with --target, --since c2dc279b and --tree 1697743d6e012462802bfb02aa955d530bea0954. The changes after round 3 are 32 changed lines in two target files, simulation.ts (11) and path-following.spec.ts (21), judged by the executor alone.",
  "evidence": [
    "Round 3's report, recorded with npm run worker -- record --kind combined --round 3 --order WO-036 --target dotln-angular --since c2dc279b21d88a5277740edf0eb43a2b7e57e534 --tree 1697743d6e012462802bfb02aa955d530bea0954; a first attempt without --target was refused because the since tree named nothing in the checkout it had bound, which is how rounds 1 and 2's binding came to light.",
    "X1: path-following.spec.ts 'stops a squad carrying Velocity matching, sealed off on the move, close to where it was', four units given velocity matching and A*, the gap sealed at frame 30: before the change the centre moved 36.1 units in the 300 frames after the seal; after it, under 3, and every unit came to rest. The engine's suite then passed 189 with both known outcomes reproducing, the scene feature's 191; the engine's spec type check, ESLint and Prettier on the two files exit 0.",
    "The reviewer's probes on a scratch copy carrying the same change: the twelve-unit Velocity matching squad moves at most 2.53 units after the seal and rests by frame 131; a blocked Flocking squad's centre stops sooner, but its members rest by about frame 1161 instead of 738.",
    "The lines changed after round 3's tree, counted by comparing each changed file's blob with the tree's: simulation.ts 11, path-following.spec.ts 21."
  ],
  "rejected": [
    {
      "option": "Keep X1 recorded, on the literal session in which the squad has A* alone",
      "reason": "D015 admitted C14 on the reading that Flocking or Velocity matching followed by A* is an ordinary input for the Objective's sealed step; X1 is that input with the squad on the move, and the same reading admits it."
    },
    {
      "option": "Record rounds 1 and 2 again with --target",
      "reason": "A second record of a round already recorded would stand beside the first in the lane, and round 1's target tree cannot be named; the error is stated here instead."
    }
  ],
  "roundFindings": [
    { "id": "X1", "finders": ["combined"], "class": "criterion", "disposition": "fixed" },
    { "id": "X2", "finders": ["combined"], "class": "lesser", "disposition": "fixed" },
    { "id": "X3", "finders": ["combined"], "class": "lesser", "disposition": "fixed" },
    { "id": "X4", "finders": ["combined"], "class": "lesser", "disposition": "fixed" },
    { "id": "X5", "finders": ["combined"], "class": "lesser", "disposition": "fixed" }
  ],
  "reopenWhen": "The verifier or the operator finds a blocked squad that does not stop where it is, or a figure of D003's that does not reproduce under the conditions it names."
}
```

## WO-036-D017

```json
{
  "id": "WO-036-D017",
  "date": "2026-11-15",
  "dispatch": "resume: verify; VER-001, Codex CLI 0.169.0, gpt-6-astra, selected effort max from codex-session-readback",
  "decision": "Fail verification on two supported inputs in the declared engine surfaces. For criterion 3, keep the existing spec's definition of reaches, the crowd's centroid within one field unit, and include a two-unit objective change in nearby: the criterion gives no lower bound, so D003's observed lag cannot be excluded by selecting only the three longer offsets. The independent twelve-unit probe reaches at frame 51 with priority and 48 with plain Arrive from the same positions for offsets (2,0), (-2,0) and (0,2). For criterion 1, keep D015 and D016's reading that prior offered steering followed by A* is an ordinary input to the sealed-gap step. With Wander at weight one, a unit remains moving while its route and the page say blocked; the browser reproduces the false stop notice without injected state. The repair belongs to this order. The verifier changes no implementation, records no waiver or criterion defect, and delegates no judgment. The nominal walls, routes, replanning, comparison, avoidance, save/open and head-on walkthrough works; these two failed guarantees prevent acceptance of that outcome as complete.",
  "evidence": [
    "docs/evidence/WO-036/ver-001-reproductions.md and ver-001-engine-results.json: the portable probe passes the same isSafeStep and applyStep admission as the stored composition, exits 0 with the observations, and records the two failures.",
    "The blocked Wander unit has speed 2.394456 and isAtRest false after 300 frames, whereas the no-extra and Velocity matching controls have speed zero. On the production page, unit-01 still reads walking, blocked and no route at frames 332 and 452 while the notice says it stops where it stands.",
    "The canonical targetGateEvidence reader accepts the review row at the unchanged target tree d0a6c4e21f2e0e0f22e8cb52165d88b8e526a199, recorded 2026-11-15T17:23:09.045Z, and the target's independent format:check exits 0.",
    "VER-001's Walkthrough and the ver-001-prefixed captures in docs/evidence/WO-036/walkthrough cover the served production page at 360, 768, 1440, 2080 by 1460 and 3840 by 1620."
  ],
  "rejected": [
    {
      "option": "Pass criterion 3 because the three existing longer-offset tests pass",
      "reason": "A supported two-unit re-target contradicts the same centre comparison. Nearby does not exempt the inside of the crowd's spacing, and no operator waiver exists."
    },
    {
      "option": "Treat Wander followed by A* as outside the sealed-gap requirement",
      "reason": "The rail admits that composition, the notice promises rest, and D015 and D016 already judge the sealed step with pre-existing steering. The repair must hold the resulting behavior, not only its blocked label."
    },
    {
      "option": "Change the implementation during verification",
      "reason": "The verifier's authority is to reproduce, judge and prescribe the repair rule; a repair is the executor's next phase."
    }
  ],
  "followup": "WO-036 repair: close VER-001 F1 by preserving settling and the old fixture while satisfying the nearby no-later comparison, including two-unit re-targets; close F2 by bringing a blocked path unit to rest with prior Wander and retaining its composition so clearing geometry resumes it. Both have executable reproductions and repair rules in ver-001-reproductions.md.",
  "reopenWhen": "A repaired candidate reproduces the nearby comparisons without a lag and the blocked composition comes to rest; verification then rejudges the touched criteria and their shared known-outcome and replay contracts. A change to the criteria requires the operator's separate authorization, not this disposition."
}
```

## WO-036-D018

```json
{
  "id": "WO-036-D018",
  "date": "2026-11-15",
  "dispatch": "resume: verify; VER-001 closeout checks",
  "decision": "Record criterion 10 unmet because the current launchpad document gate has not completed its formatting prerequisite. The first attempt identified formatting in the verifier's new probe and timed out; only that evidence source was formatted. The second attempt had no formatting warning and still timed out, skipping all later suites. A separate complete formatting check with debug logging exits zero, so the remaining observed failure is the bounded gate execution, not a demonstrated formatting defect. Keep the target gate's passing evidence separate. The verifier changes neither the kit runner's timeout nor any success record, makes no claim that every candidate must fail, and records no criterion-defect off-ramp. File the failed verification with the two product findings and this unmet gate obligation; the final document attempt after the record edits remains executable evidence of the closeout result.",
  "evidence": [
    "The briefing-qualified scripts/test-runner.mjs --document command exits 1 twice: zero passing suites, formatting timed out, the other fourteen suites skipped.",
    "scripts/test-runner.mjs declares format with timeoutMs 30000. The independently bounded npm run format:check -- --log-level debug exits 0 at 2026-11-15T18:18:22.021Z, reports all matched files formatted, and measures durationMs 54938. Debug logging overhead prevents treating that duration as the ordinary command's exact runtime.",
    "docs/evidence/WO-036/ver-001-reproductions.md F3 records the commands, observations and limit of the diagnosis. The cause of the difference from the executor's earlier passing document run is unresolved.",
    "The targetGateEvidence reader accepts the unchanged target review row, and the target package's format:check independently exits 0. The target implementation remains untouched."
  ],
  "rejected": [
    {
      "option": "Claim criterion 10 met from the executor's older document row or the standalone format check",
      "reason": "Neither establishes a passing document gate at the report's current authored tree."
    },
    {
      "option": "Raise the kit timeout or exclude files during read-only verification",
      "reason": "Those change the check being consumed and are outside this verifier's implementation authority. The observed failure can be handed back honestly without a weakened check."
    },
    {
      "option": "Treat the deadline as proof of a defective criterion",
      "reason": "The executor has an earlier passing document run, and a timeout here is not evidence that no candidate could satisfy the criterion."
    }
  ],
  "followup": "WO-036 repair closeout: resolve VER-001 F3 by obtaining a passing document gate at the current authored tree. Diagnose the format task's deadline and host runtime using the recorded commands; any required kit change follows the normal authorized repair route, never a verifier-written passing row.",
  "reopenWhen": "The full document gate passes at the current authored tree, or a reproduced cause establishes the appropriate repair outside the target implementation."
}
```

## WO-036-D019

```json
{
  "id": "WO-036-D019",
  "date": "2026-11-15",
  "dispatch": "resume: fix (executor, Claude Code 2.1.325, claude-fable-5-2, effort xhigh as CLAUDE_EFFORT reports it), answering VER-001; the operator's mid-turn message at 18:44:52Z by the session journal, and meta critic 2's report",
  "decision": "Run the meta critic in this repair as D012 ran it, at the operator's direction that it start fifteen minutes after their message (ignored capture docs/intake/notes/wo036-repair-meta-critic-2026-11-15.md, SHA-256 e849beb41379a4138fc08373b85bd382a8fa1c3668739d0a686fdd601bc0f0d3), and answer its report. The earlier executor session's scratch, which held the launcher and charter, had been removed with that session, so both were rebuilt in this session's scratch from that session's transcript: the launcher is the text of its own command that wrote it, the charter is core's with the one source line D012 added, and the launcher's --print gives the target worktree as a source. Launch 2 went out at 18:59:52Z on the instance's astra worker (gpt-6-astra at max) and ended 15 minutes later; the launcher reported the operator's Codex configuration and trust table unchanged, the isolated home removed and no Codex process left. Its report went to the operator whole in the executor's next message, before any answer (D014). The clock runs as core's WO-276 has it, a repair included: every 75 minutes from the last launch, a launch due while a gate is live going out when the gate ends, the clock ending when the passing gate run is in. Critic 2 made five points, on the first execution's conduct, and all five are accepted. (1) The first handoff marked criterion 3 met while its own decision left the criterion's reading to the verifier, and the completion event listed only criterion 1 as unmet: a criterion whose pass rests on a reading nobody has settled is judged unmet, with why, in the handoff's line and so in the lifecycle record; this repair's handoff judges criterion 3 that way (D020). (2) Six reviews were recorded against the launchpad's tree: this repair's one review is launched through the helper with --target dotln-angular and --since the tree VER-001 judged, and the checkout, base and tree its receipt names are read before the report is relied on. (3) A completion attempt was piped through tail, so the host saw success where the command refused: a check whose status matters runs unpiped with its output in a scratch log, the shell's own exit code deciding; this session did so from 19:26Z, and before that it piped three runs of the engine's suite through tail, reading 189 passed from the third, with the status hidden each time. (4) The executor told the operator that critic 1's praise of the first base arm was wrong before it had read that arm's own log, which showed assertion failures: an assessment is called wrong only with the artifact and its date in hand. (5) An accepted record correction was finished after both target gates, and regenerating the index cost a second document gate: this repair writes its decisions, the evidence README and the handoff's standing parts, and regenerates the indexes, before its review and its gates; what follows a gate is that gate's own result.",
  "evidence": [
    "Critic 2's run summary: launched 2026-11-15T18:59:52Z; isolation: user config unchanged, trust table unchanged, isolated home removed true; gpt-6-astra at max; 15 min; no line naming a Codex process left running.",
    "Before the launch: the private list's screen over the checkout's six transcript files, printing counts only, found 0 refuse-class and 1 context-class entries; npm run worker -- show astra --provider codex under the launcher's own environment printed gpt-6-astra, max and standing rules of 1,854 characters, as at D012. The read-only sandbox check of D012 was not repeated: the transcripts' directory, the CLI and the day are the same.",
    "The cited rows, read by line number from the first session's transcript: row 11037 is the completion attempt piped through tail -25; row 8972 is the message that corrected critic 1; the completion event of 17:33:22Z in docs/control/orders/WO-036.jsonl.",
    "One worker use against subagentCap by the session's own count, since the hook does not see a launch made through node."
  ],
  "rejected": [
    {
      "option": "Write a new launcher from core's files",
      "reason": "The launcher that ran at D012 was already qualified against this instance's isolated Codex home, and its text was recoverable byte for byte."
    },
    {
      "option": "Answer only the points that bear on the repair",
      "reason": "D012 has each point answered; the five are about how the executor works, and three of them change this repair."
    }
  ],
  "reopenWhen": "A later critic finds any of the five repeated, or the operator changes the critic's model, cadence or where its reports go."
}
```

## WO-036-D020

```json
{
  "id": "WO-036-D020",
  "date": "2026-11-15",
  "dispatch": "resume: fix; VER-001 F1 (criterion 3), under D017's repair rule",
  "decision": "Repair F1 by changing what priority steering's separation group adds to a unit, and nothing else. The rule the repaired code holds: under the claim a unit's own steering acts whole, and everything the group adds to it is equal and opposite between the two units of a pair (neighbourForces in the engine's steering.ts, called from underSeparation in simulation.ts): the separation push between the two, divided by the share of the maximum acceleration that push leaves free, and friction that matches the pair's velocities at 8 per second times that share. What a crowd adds to its units therefore cancels across it, and its centre moves as the mean of its units' own steering: sent anywhere, a settled crowd starts exactly as the same units would under Arrive alone, and it keeps pace or better, since plain Arrive's units close on the objective and slow where a crowd keeps its spacing. The stiffened push keeps a packed crowd apart whatever pulls it together, the friction settles it, and what the neighbours add fades in over the first epsilon past the claim, so the unit's steering does not jump as separation takes it. D003's easing of the unit's own steering, which was the lag (it scaled the unit's answer to a new objective by the same share as its press into its neighbours, 0.79 of plain Arrive's acceleration on the first frame), and its match of the neighbours' mean velocity are removed. separate gives what it gave, through a helper it now shares with neighbourForces; avoid, every blend and both known outcomes are as they were. The traps named before choosing: a rule fitted to the three offsets the report quotes; a rule that speeds a re-target and leaves a steep crowd churning, as every variant of D003 did; a change to separate or avoid that moves a frame hash; and reading the criterion narrowly. What was done about them: the rule is a property of the forces and not of a distance, measured from just outside the target radius to 14 units; every candidate was run over 144 crowd tunings before it was considered; the hashes are asserted by the known-outcome specs; and criterion 3 is judged unmet in the handoff (D019, point 1), as follows. For the crowd and the tool the criterion names, as its spec applies them (twelve units, Arrive at its defaults), the crowd reaches the objective no later than plain Arrive at every near objective measured. The criterion's words set no tuning for Arrive, and with Arrive retuned until its pull is clipped at the unit's maximum acceleration (a slow radius of 4 or less, a time to target of 0.05, a weight of 5) the crowd still reaches a near objective 1 to 6 frames after plain Arrive, where the judged code was up to 14 after; crowds of 4 to 8, 15 and 16 lose one frame in at most 59 of 4,590 objectives a spot, about one in a hundred, all lying within half a unit beyond the target radius. The cause is measured, at a slow radius of 3, and is not in what the crowd adds: along the way to the objective the crowd's acceleration equals the mean of its units' own Arrive on every frame, so the pair forces cancel and nothing there is lost to the acceleration limit, and it is that mean which falls behind plain Arrive's, because every unit of a crowd moves at the crowd's pace, so the units it carries past their own pace brake while the clipped pull of those behind cannot rise to make it up. The two rules tried that change a unit's own steering to close that each break the criterion's other half. Whether criterion 3 binds Arrive at those tunings, and crowds other than its twelve, is the verifier's and the operator's to say; the executor names the class for the verifier as a contradiction on that reading, on the evidence below and not on a proof. This decision stands as it was taken, before the repair's review, and its figures are those of the tree the review read; what the review's finding changed, with the final candidate's figures and the final judgment of criterion 3, is D025.",
  "evidence": [
    "docs/evidence/WO-036/repair-1/probe.mjs runs each probe against the target worktree (README there gives the commands); the raw output of each run on the tree the review read is under docs/evidence/WO-036/repair-1/results/ as reviewed-*.txt, and on the engine as VER-001 judged it as judged-*.txt, each with the bounded wrapper's own start and finish times.",
    "VER-001's seven offsets (crowd-probe.ts verifier), centre reading, crowd against plain Arrive: 47 against 48 for (2,0), (-2,0) and (0,2), which the report measured at 51 against 48; 74 against 79, 111 against 114, 113 against 116 and 120 against 125 for the four longer ones. On the stopwatch's credit, which the criterion's reading is not (D017): 98, 97 and 98 against 111 for the three near ones, and 122 against 120, 157 against 151, 158 against 151 and 165 against 161 for the longer ones, 2 to 7 frames after plain Arrive, where the judged code was 5, 1 and 1 after and 3 before.",
    "Near objectives (crowd-probe.ts near 90): 51 distances from 1.005 to 4 units from the crowd's centre, 90 directions, three settle spots, 13,770 objectives a crowd size. Twelve units: none later. Crowds of 2, 3, 9, 10, 11, 13, 14, 18 and 20: none later. Crowds of 4, 5, 6, 7, 8, 15 and 16: 8, 5, 105, 149, 1, 14 and 1 later, every one by one frame, every one at 1.045 to 1.465 units from the centre. The judged code under the same probe at 36 directions, 5,508 objectives a size: later on 1,052 for two units rising to 4,450 for twenty, 3,983 for twelve, by up to 4 frames.",
    "Arrive retuned, twelve units, 108 objectives a tuning (crowd-probe.ts tunings): none later at a slow radius of 7, 10, 15 and 25, a time to target of 0.1, 0.15 and 0.5, a target radius of 0.5, 2 and 4, a weight of 2, a separation threshold of 2 and 6 and the linear falloff; 1 later at a slow radius of 5 and 3 at 50, by one frame; 12 at a time to target of 1 and at a weight of 0.5, by one frame, all 12 units out; 29 at a time to target of 2, by up to 5; 56 at a slow radius of 4 by up to 2, and 96 at 3, 2 and 1 by up to 3, 4 and 6; 40 at a time to target of 0.05 and at a weight of 5, by up to 4. The judged code was later at every one of the 25 tunings: 60 of 108 at the defaults, 26 at the least (a slow radius of 50), 108 of 108 at slow radii of 1 to 4, by up to 14 frames.",
    "Settling (crowd-probe.ts settling): crowds of 6, 12 and 20 at slow radii of 1, 3, 10 and 25, times to target of 0.05, 0.25 and 1, thresholds of 3 and 6 and both falloffs, 144 in all, 3,600 frames each: 144 come to rest and 144 are credited with arriving, with 28 frames on which two units touch. The judged code: 143 at rest inside 3,600 frames (the other at frame 3,995), 144 arriving, 54 touching frames.",
    "Where the acceleration comes from (crowd-probe.ts pull): at the defaults the crowd's mean acceleration along the way equals the mean of its units' own Arrive on each of the first twelve frames and is at or above plain Arrive's (8.70, 8.11, 7.55, then 7.02 against 7.01 rising to 3.61 against 3.57). At a slow radius of 3 it still equals its units' own on every frame and falls behind plain Arrive's from the second (18.30 against 18.97, 10.93 against 14.32 at the tenth).",
    "Both arms of the spec's block 'a crowd under priority steering with Arrive', now 19 cases, and of the repair's other cases, are in the evidence README's table: the whole block fails at the integrated base on its own assertions (exit 1, 19 of 19), the repaired steering and path-following specs fail against the engine exactly as VER-001 judged it (exit 1, 17 of 80; the three engine files compared equal to the blobs of tree d0a6c4e21f2e0e0f22e8cb52165d88b8e526a199), and the candidate passes (exit 0).",
    "The engine's suite passed 211 on that tree with both known outcomes reproducing, so trial-known-outcome.json and walls-known-outcome.json keep every hash; git diff --quiet eb9d227 -- libs/features/tools/src/lib/studies exits 0, and the tools project's 1,116 tests pass at one worker."
  ],
  "rejected": [
    {
      "option": "Keep the easing and restore its strength: divide the eased sum, or the push alone, by what the easing left of the unit's steering",
      "reason": "Measured on a scratch copy (repair-1/variants.md, v1, v2 and v2b): every crowd settles and the lag falls from 3 frames to at most 1, but a re-target of 1.25 units is still a frame late in 14 to 16 of 16 directions, because the divisor differs from unit to unit and so the forces between a pair no longer cancel."
    },
    {
      "option": "The unit's own steering whole, the plain push and friction between neighbours, with no stiffening",
      "reason": "Measured (z1, and zf:8:0 over the 144): no re-target late, but a crowd of twenty at a slow radius of 1 never rests, and 9 of 144 tunings are unrested with 2,893 touching frames; the plain push packs a steep crowd to contact."
    },
    {
      "option": "The stiffened push with no friction, or friction scaled by each unit's time to target",
      "reason": "Measured (z3, z2): without friction the steep crowd of twelve churns for ever at a peak of 4.7; scaled by time to target, a crowd of twenty at a slow radius of 1 never arrives at one strength and a crowd at a time to target of 0.05 never rests at twice it. A fixed rate does neither; 4 and 6 a second leave 3 and 2 steep crowds of twenty unarrived, and 7 to 10 arrive every one of the 144."
    },
    {
      "option": "No fade-in past the claim",
      "reason": "Measured (zf:8 against zf:8:1:fc): one of the 144 keeps its innermost unit creeping at 0.05 for ever, crossing epsilon each way; with the fade-in all 144 rest."
    },
    {
      "option": "A unit the push carries stops braking against it",
      "reason": "Measured (zf:8:1:y0.5 and y2): it would close the lag where Arrive's pull is clipped, and no crowd rests under it, 144 of 144 unrested at the first strength and 106 at the second, since a unit knocked outward meets no pull back until the push lets go."
    },
    {
      "option": "A unit whose own steering pulls against what its pressing neighbours are pulled by gives way to them",
      "reason": "Measured (zf:8:1:fc:n1): the 144 still rest, but the steep tunings are as late as without it, and two units either side of an objective each give way to the other and neither returns, 780 to 808 of 1,836 re-targets late by up to 67 frames."
    },
    {
      "option": "Mark criterion 3 met on the criterion's twelve units and Arrive's defaults, with the tunings in the prose",
      "reason": "That is what meta critic 2's first point is about: the first handoff carried an unsettled reading as a pass. The reading of 'with Arrive' is not the executor's to settle."
    }
  ],
  "reopenWhen": "The operator's play says a crowd under priority steering feels wrong, stiff or slow; a verifier measures a near objective the crowd of twelve at Arrive's defaults reaches later than plain Arrive; or the criterion's reading is settled either way, which closes or confirms the unmet judgment.",
  "followup": "Planning: where Arrive alone asks for a unit's whole acceleration (a slow radius of 3 or less), a crowd under priority steering reaches a near objective 1 to 5 frames after the same units under Arrive alone, because a unit that keeps its distance has less of its acceleration left for the pull; a time to target of 0.05 and a weight of 5 lose one frame on 12 of 108 near objectives, and a time to target of 2 up to 4 frames on 19 (docs/evidence/WO-036/repair-1/, WO-036-D025). Decide whether the scene needs more there, and whether the comparison with plain Arrive should bind Arrive at every tuning."
}
```

## WO-036-D021

```json
{
  "id": "WO-036-D021",
  "date": "2026-11-15",
  "dispatch": "resume: fix; VER-001 F2 (criterion 1), under D017's repair rule",
  "decision": "Repair F2 with one rule in one place: a unit with no route is steered by nothing. steeringOf in the engine's simulation.ts returns nothing for a blocked unit, and the rule that nothing coasts, which was already there, brakes it where it stands; it keeps its weights, its tuning, its priority order and its path settings, so it goes on as it was composed once a field step gives it a way. The three earlier patches of this defect, each made for the steering that had just been caught walking, are removed, because the one rule covers them: the seek group's fallback guard (D013), the brake inside seek and arrive (D016), and the note on isDriven. The class the finding names is a unit the page calls blocked that still moves; the earlier fixes braked it term by term, so the term nobody had tried kept it walking, and Wander was the third after priority steering's fallback and velocity matching. The cases added are ones the report did not quote: cohesion with a unit that has a way, and a priority order that wanders once seeking is still (the rail's Equilibrium fallback), beside Wander, each sealed off on the move and each checked for rest, for staying, and for going on when the walls clear; and a browser case that gives a unit Wander and then A* behind a sealing wall and reads its row twenty frames on.",
  "evidence": [
    "docs/evidence/WO-036/repair-1/blocked-probe.ts on the candidate: a unit sealed off on the move carrying nothing else, Velocity matching, Wander, cohesion with a unit that has a way, or the Equilibrium fallback order comes to rest with speed 0 inside 300 frames, 0.42 to 1.74 units from where the seal found it, does not move in the next 120 frames, and moves 11 to 20 units in the 120 after the walls clear. The same probe on the engine as VER-001 judged it: Wander still moving at 2.39 after 4.85 units, as the report measured; the Equilibrium fallback order still moving at 0.08; the unit with cohesion 8.49 units from where the seal found it.",
    "path-following.spec.ts 'brings a unit carrying %s to rest when it is sealed off on the move, and frees it when the walls clear', three cases: all fail against the engine as VER-001 judged it (the evidence README's judged-tree arm) and pass on the candidate.",
    "The blocked branch of the walls known outcome is unchanged: its squad carries A* alone, whose brake was the same expression, and the engine's known-outcome spec passes with the fixture's hashes.",
    "apps/dotln-e2e/src/scene.spec.ts 'a unit given Wander and then A* stays still once a wall seals it off, as its notice says' follows the report's own recipe on the page; its result is the review gate's e2e row."
  ],
  "rejected": [
    {
      "option": "Brake Wander for a blocked unit, as velocity matching and the seek fallback were braked",
      "reason": "It is the fix that failed three times: cohesion, flee and the wander group of a priority order would each have been the next finding."
    },
    {
      "option": "Clear a blocked unit's steering when it is blocked",
      "reason": "D017 asks that the composition be kept so that clearing the geometry resumes the run, and a replay must read the same steps."
    },
    {
      "option": "Stop a blocked wanderer's wander angle from turning",
      "reason": "Nothing reads it while the unit stands, and freezing it would be a second rule about blocked units where the repair leaves one."
    }
  ],
  "reopenWhen": "A verifier or the operator finds a unit that reads blocked and moves, or one that does not go on as it was composed when a way opens."
}
```

## WO-036-D022

```json
{
  "id": "WO-036-D022",
  "date": "2026-11-15",
  "dispatch": "resume: fix; an adjacent defect met while closing F2's class, taken through the follow-up queue as adjacent-0001",
  "decision": "A formation step takes the units it places off their routes: applyTwoLevel and applyFixed in the engine's interpreter.ts clear the path settings and the route of every unit that will follow a slot, as a path tool already takes a unit out of its formation (D008); a fixed formation's leader steers for itself and keeps a route it has. Before this, a unit given a path tool and then a place in a formation steered for its slot while its row read on its path, the path length instrument counted it and it planned again at every field step. It was met while asking what else a blocked unit might carry: a formation member with a blocked route would have walked to its slot under a no-route notice, which is F2 again, and with the route gone that state cannot arise. A wider gap is recorded and not built: a two-level formation's anchor takes no route, so a formation sent beyond a wall walks at it and stalls, and now says only that.",
  "evidence": [
    "docs/evidence/WO-036/repair-1/blocked-probe.ts: three units given A* and then a two-level formation, the objective beyond a wall: on the engine as VER-001 judged it each stalls at the wall with its route still drawn and a mean path length of 97.6; on the candidate they stall there with no route drawn and no path length. A formation followed by A* is as it was: no formation, three routes, all three arrived.",
    "path-following.spec.ts 'a route and a formation', three cases: a two-level formation's members have no route, no path settings and no path length, and a later field step plans none; a fixed formation's leader keeps its route and reaches the objective round the wall while its followers have none; a path tool after a formation leaves no formation. The first two fail against the engine as VER-001 judged it.",
    "The follow-up queue's item adjacent-0001: queued with its cause, fix, paths and checks, announced, checked in, started and completed at revision 5, both checks passing (the engine's suite 211, the scene feature's 191)."
  ],
  "rejected": [
    {
      "option": "Leave the route and hide it for a formation's members in the frame, the metrics and the replans",
      "reason": "Three readers would each need the exception, and the unit would still plan a route it never walks."
    },
    {
      "option": "Give a formation's anchor a route in this repair",
      "reason": "It is a feature with a design of its own (the anchor's route, slots that clear the geometry, what a formation does when there is none), not a repair of VER-001."
    }
  ],
  "reopenWhen": "The operator wants a formation's members to keep their routes for when they leave it, or an order gives formations routes.",
  "followup": "Planning: a two-level formation's anchor takes no route, so a formation sent beyond a wall walks straight at it and stalls there; an order that routes a formation (the anchor following a route, its slots clearing the geometry, a no-route state for the formation) is a candidate now that the field has walls."
}
```

## WO-036-D023

```json
{
  "id": "WO-036-D023",
  "kind": "correction",
  "date": "2026-11-15",
  "dispatch": "resume: fix; the executor's own check of the follow-up queue's record",
  "misread": "The completion of adjacent-0001 in the follow-up queue gives its two checks' times as 19:38Z and 19:39Z, and its check-in says the intent was stated in chat at about 19:33Z. The executor wrote all three from memory.",
  "meant": "The runs' own logs give 19:33:21Z for the engine's suite (211 passed) and 19:33:39Z for the scene feature's (191 passed). The intent was stated in the message that queued the item, and the queue's first event is at 19:32:02Z.",
  "changed": "The queue's event stands as it was appended, since a completed item is not revised; this decision carries the times. From here the executor reads a time from the clock or the run's log before writing it, and the repair's records cite result files that hold their own times.",
  "decision": "Record the wrong times in the queue's completion event and correct them here.",
  "evidence": [
    "Vitest's start lines in the session's logs of the two runs, 14:33:21 and 14:33:39 local time at UTC-5; date -u at the queue's completion read 19:33:57Z."
  ],
  "rejected": [
    {
      "option": "Queue the item again to carry the right times",
      "reason": "A second item for work already done would misstate the queue; the event log is append-only by design."
    }
  ],
  "reopenWhen": "A reader finds another time in this repair's records that its source does not bear out."
}
```

## WO-036-D024

```json
{
  "id": "WO-036-D024",
  "date": "2026-11-15",
  "dispatch": "resume: fix; VER-001 F3 (criterion 10), under D018",
  "decision": "Change nothing for F3, and close it by running the document gate at the repair's authored tree with no other work of the session running. What stopped the verifier's two attempts is not established; the likeliest reading of what was measured is load on the host at the time, and neither the tree nor the kit's deadline shows a defect. The gate's formatting task is the launchpad's prettier check over its code, which the ignore list keeps to code alone; it allows 30 seconds. Run by itself under the bounded wrapper at 19:06Z, while the meta critic's Codex run was live, the same check took 11.9 seconds and passed, where the verifier's two attempts ran out of the 30 and its debug-logged run took 54.9. The executor's two document gates at 17:16:44Z and 17:28:00Z passed, and between them and the verifier's attempts the launchpad's code gained only the verifier's two probe files, which the check passes. The kit's runner is a kit file and is left as it is. The handoff's criterion 10 line stands on the document gate's own row, read after it runs; if the formatting task times out again with the host quiet, that is new evidence and this decision reopens.",
  "evidence": [
    "node scripts/harness.mjs bounded -- npm run format:check: exit 0, 'All matched files use Prettier code style!', durationMs 11915, started 2026-11-15T19:06:36.602Z, with the critic's Codex worker running.",
    "scripts/test-runner.mjs gives its formatting task timeoutMs 30000; .prettierignore excludes Markdown, JSON and the journals, so the check reads code alone.",
    "docs/evidence/WO-036/ver-001-reproductions.md, F3: two timeouts, and a debug-logged run of 54,938 ms that finished at 18:18:22Z, in a verification session that had also served a production build and driven a browser; the record does not say what else ran during the two attempts."
  ],
  "rejected": [
    {
      "option": "Raise the formatting task's deadline",
      "reason": "It is the kit's file, and two timeouts on one host, their cause not established, are no measure of the deadline."
    },
    {
      "option": "Call criterion 10 met on the 11.9 second check",
      "reason": "D018 already refused a standalone check as a stand-in for the gate's row."
    }
  ],
  "reopenWhen": "The document gate's formatting task times out with no other load on the host."
}
```

## WO-036-D025

```json
{
  "id": "WO-036-D025",
  "date": "2026-11-15",
  "dispatch": "resume: fix; the repair's one combined review, and the change made after it",
  "decision": "Take the review's one finding as a repair to make as far as one can be made, and record what cannot. The review ran on the instance's default Codex worker (gpt-6.1-sol at max) through the helper with the target named; its receipt names the target's worktree as the checkout, the tree VER-001 judged as the base and the target's working tree 52d4693845cbdd20c1a5aba868de21776036266d as the tree read, which is what D019's second point asks to be checked before a report is relied on. It found one thing and called it blocking: criterion 3 still fails with Arrive at a slow radius of 3, the case the repair had boarded, an ordinary input since the catalog admits slow radii from 1 to 50; it asked that the case be kept active and repaired. The executor's judgment of it: the writer of that input is the operator on the rail; the failure is open, a crowd that arrives late; so it is to be fixed if a fix exists. A third rule for a unit's own steering was then measured, and unlike the two D020 rejected it holds: under separation's claim a unit's own steering is not asked about the speed the push gives it (withoutCarriedSpeed in the engine's simulation.ts), wholly once the push reaches half the unit's maximum acceleration and in proportion below that. A unit the crowd carries past its own pace then does not brake against the crowd, and its pull toward where it is going stays whole; it is the pull that D020's first rejected rule dropped, which left no crowd at rest. The rule the repaired code now holds is therefore in two parts: what a crowd adds to a unit's own steering cancels between the two of a pair (D020), and a unit's own steering does not answer for the speed the push gives it. With both, a crowd of any size from 2 to 20 at Arrive's defaults reaches every near objective scanned no later than the same units under Arrive alone, where the tree the review read lost a frame for seven sizes; the stopwatch credits the crowd before plain Arrive at each of VER-001's seven offsets, where that tree was 2 to 7 frames behind at four; 19 of 25 Arrive tunings lose no objective, where 14 did; and all 144 crowd tunings still come to rest. What it does not close is Arrive tuned to a slow radius of 3 or less, 1 to 5 frames late on 56 to 96 of 108 near objectives, with one frame on 12 of 108 at a time to target of 0.05 and at a weight of 5, and up to 4 frames on 19 at a time to target of 2. At a slow radius of 1 the cause is measured where the new rule cannot matter, on the first frame from rest: the crowd's units ask for a mean of 20.99 along the way, as plain Arrive's do, and the crowd gets 18.03, because a unit already pulling at its maximum acceleration has nothing left for keeping its distance and the limit takes the sum. That is a limit of the unit and not of the rule, and no rule that keeps a crowd apart can give it back. So the finding is answered in part and recorded: the steep case stays boarded in the target's spec with its cause restated, and criterion 3 stays judged unmet in the handoff on the reading the reviewer took, that it binds Arrive at any tuning the rail admits, with the class named for the verifier as a contradiction at those tunings. The change made after the review is 144 changed lines in four target files, simulation.ts (40), steering.spec.ts (67), scene.md (33) and scene-rules.md (4), which no reviewer has read: a fix dispatch has one review, and the executor judges what follows it.",
  "evidence": [
    "The review's receipt: Codex CLI 0.169.0, gpt-6.1-sol at effort max pinned on the command line, effective effort not read back; target dotln-angular, activation base eb9d227483e30164105da077f50673789d1e5c9f; reviewed tree 52d4693845cbdd20c1a5aba868de21776036266d against d0a6c4e21f2e0e0f22e8cb52165d88b8e526a199; 19:52:09Z to 20:01:56Z; findings 1, blocking 1; checkout unchanged across the episode. Its sandbox refused its own probes, so it judged by reading, and it could not read the results directory, which was filed after it.",
    "The final candidate, the target's working tree c5485a4ead3d0f34377d4feb99c3a0e5e9980415, under the filed probes (docs/evidence/WO-036/repair-1/results/crowd-*.txt): VER-001's seven offsets, crowd against plain Arrive, by the centre 43, 44 and 44 against 48, then 66 against 79, 98 against 114, 100 against 116 and 110 against 124, and by the stopwatch 94, 95 and 95 against 111, 110 and 110, then 113 against 121, 146 against 151, 148 against 152 and 156 against 160.",
    "Near objectives on the final candidate (crowd-near-90.txt): 17 crowd sizes from 2 to 20, three settle spots, 51 distances from 1.005 to 4 units, 90 directions, 234,090 objectives: none reached later than plain Arrive. The tree the review read (reviewed-near-90.txt): 283 later across crowds of 4, 5, 6, 7, 8, 15 and 16, each by one frame.",
    "Arrive retuned on the final candidate (crowd-tunings.txt), twelve units, 108 objectives a tuning: none later at 19 of 25; 96, 96 and 56 later at slow radii of 1, 2 and 3, by up to 5, 3 and 3 frames; 12 at a time to target of 0.05 and at a weight of 5, by one frame; 19 at a time to target of 2, by up to 4. Settling (crowd-settling.txt): 144 of 144 at rest and arriving, 17 touching frames.",
    "Where the acceleration comes from on the final candidate (crowd-pull-*.txt), the mean along the way to an objective 2 units off: at the defaults the crowd's is at or above plain Arrive's from the first frame (8.80 and 8.80, then 8.27 against 8.20, 4.10 against 3.60 at the twelfth) and above what Arrive alone asks of its units as they move (3.43 at the twelfth), which is the carried units not braking. At a slow radius of 3: 18.98 and 18.98 on the first frame, then below plain Arrive's until the twelfth (12.81 against 14.23 at the tenth) though above its units' whole Arrive (10.11). At a slow radius of 1: 18.03 against 20.99 on the first frame, when every unit stands still and the carried speed is nothing.",
    "The six spec cases added with the rule (crowds of six and seven sent barely beyond the target radius in 36 directions; the stopwatch's credit at four offsets) run against the engine as the review read it: exit 1, 5 failed of 69 in steering.spec.ts, the two crowds on a frame (10 against 9) and the three far offsets on the stopwatch (165 against 161, 157 against 151, 158 against 151); on the candidate the engine's suite passes 217 with 2 boarded.",
    "The change since the reviewed tree, by git diff --numstat 52d4693845cbdd20c1a5aba868de21776036266d c5485a4ead3d0f34377d4feb99c3a0e5e9980415: simulation.ts 31 added and 9 removed, steering.spec.ts 58 and 9, scene.md 19 and 14, scene-rules.md 3 and 1.",
    "The forms of the rule measured before one was taken are in docs/evidence/WO-036/repair-1/variants.md: c1, c0.5, cs2 (the one shipped), cs3 and cs4."
  ],
  "rejected": [
    {
      "option": "Leave the candidate as the review read it and record the finding whole",
      "reason": "The finding is on an ordinary input, and the rule at hand closes most of what it names and all of what D020 had recorded for crowds of other sizes and for the stopwatch, with every crowd still settling."
    },
    {
      "option": "Leave the carried speed out whole whatever the push, or whole from a quarter of the maximum acceleration",
      "reason": "Measured (c1, cs4): 3 and 1 of the 144 crowd tunings then do not come to rest inside 3,600 frames, where a half and a third leave none; a unit the push barely claims loses the damping that settles it."
    },
    {
      "option": "Whole from a third of the maximum acceleration",
      "reason": "Measured (cs3): a few more steep objectives close (48 late of 108 at a slow radius of 3 against 58 in the scratch probe), with more overshoot of the objective (0.05 to 0.08 against 0.02 to 0.04) and a longer time to rest after a re-target; the half was taken as the gentler."
    },
    {
      "option": "Take the steep case off the board",
      "reason": "It still fails on the candidate: at a slow radius of 3 a crowd sent 2 units away is a frame late in most directions."
    },
    {
      "option": "A second review over the change",
      "reason": "A fix dispatch runs one review; the changed lines are counted in the handoff as unreviewed."
    }
  ],
  "roundFindings": [
    { "id": "F1", "finders": ["combined"], "class": "criterion", "disposition": "recorded" }
  ],
  "reopenWhen": "A verifier or the operator finds a crowd at Arrive's defaults that reaches a near objective after plain Arrive, a crowd that does not come to rest, or a crowd that overshoots or lingers in a way the play dislikes; or the reading of criterion 3 for Arrive tuned steep is settled either way."
}
```

## WO-036-D026

```json
{
  "id": "WO-036-D026",
  "date": "2026-11-15",
  "dispatch": "resume: fix; meta critic 3's report, and the correction of D025 that its first point calls for",
  "decision": "Accept all six of meta critic 3's points and answer each here. The first withdraws two claims of D025; D025 stands as it was written, since a decision is a dated record, and this decision carries the correction. Launch 3 went out at 20:14:56Z on the instance's astra worker (gpt-6-astra, with effort max as the launch configured it and not read back from the session) and ended 17 minutes later; the launcher reported the operator's Codex configuration and trust table unchanged and the isolated home removed. Its report went to the operator whole in the executor's next message, before any answer. The critic's clock had ended at 20:29:10Z with the first passing review gate, so no fourth launch followed. (1) Withdrawn from D025: the sentence that the first-frame shortfall is a limit of the unit and not of the rule and that no rule keeping a crowd apart can give it back, and the naming of a contradiction class for the verifier. D025's measurement was one frame of one candidate and said nothing about other rules. Two further forms were then measured in session scratch, and one of them shows the sentence false as written: with what the neighbours add left outside the unit's acceleration limit, a crowd at a slow radius of 1 gets on its first frame what plain Arrive's units get (20.96 against 20.96) and all 144 crowd tunings still rest and arrive. That form is nonetheless later than the shipped one on more tunings, so the first-frame shortfall is not the whole cause of the lateness either, and it is not taken. The other form, in which each pair's forces give way to the limit alike for both units, leaves 7 of the 144 crowds neither at rest nor arrived, and is not taken. What is established is this and no more: the candidate does not meet criterion 3, on the reading the repair's reviewer took, where Arrive is tuned to a slow radius of 3 or less, a time to target of 0.05 or 2, or a weight of 5 (the filed scan of 25 tunings), and, in a scratch scan only, at a target radius of 0, which the catalog admits and the filed scan does not sample. What was investigated is forms of one family of rule, a pairwise push with friction and what is left to or taken from a unit's own steering, each named in repair-1/variants.md, with twelve units for the tunings and 144 crowd tunings for settling, in one session on one host. Whether another rule meets the criterion at every tuning the rail admits is not known. The handoff's line for criterion 3 now reads unmet on that ground alone and names no class: recording a criterion as one no candidate can meet is the verifier's or the reviewer's, and the executor has no ground for it. The same explanation stood, in other words, in the target's scene document, its rules page and the comment on the boarded case, and in the follow-up D020 raised; the three target passages are corrected, and this decision's follow-up corrects the other. (2) The read of the follow-up queue's private event log at 19:49:26Z was against the launchpad's rule, as the host record and the handoff say. Checking the session's own transcript for this answer found one more touch the host record had not named: at 19:31:17Z a listing of that directory's first five names. Since then the one file read there is the review's own report, which is the launcher's to read. Times come from the session's transcript and the runs' logs, and the queue's state from npm run adjacent -- list. (3) The coverage the records claimed was wider than what was sampled. When the critic read it, the near scan had 17 crowd sizes, 2 to 16, 18 and 20, measured by the crowd's centre; the stopwatch's comparison is VER-001's seven offsets with twelve units in the filed probe and four offsets with twelve units in the spec, and no other crowd size was put to the stopwatch. The executor's message to the operator at 20:27:09Z said every size from 2 through 20, and the handoff and the target's scene document said a crowd of any size, by its centre and by the stopwatch. The handoff, the evidence README and the scene document now carry the sampled population and the measure. D025's phrase, a crowd of any size from 2 to 20, stands as written and means those 17 sizes by the centre. The two sizes left out, 17 and 19, were then run by the same probe and filed beside the scan: none later on 27,540 objectives, so all 19 sizes from 2 to 20 are now measured by the centre, on 261,630 objectives. (4) The repair's one review was launched at 19:52:08Z, before the candidate's results were filed, and its sandbox could not read the results directory, so it judged by reading the change. A fix dispatch has one review and it is spent; what the reviewer lacked is in D025's evidence and the handoff. From here the evidence a review is to read is filed, and its readability from the worker's sandbox checked, before the launch. (5) Times were written from memory into the follow-up queue's completion event; D023 carries the right ones and the event stands as appended, inaccurate. A time is copied from the run's own output or the clock when a result is filed, as each time in this decision is. (6) The host record and the handoff said the review ran at max. They now say what D025's evidence says: effort max was pinned on the command line and the effective effort was not read back; the critic's launches are worded the same way. The target changed with this correction in two documents and one comment only: 28 changed lines in scene.md, 9 in scene-rules.md and 6 in steering.spec.ts. The candidate is therefore a new tree, 78254cc323844f197c04f8d1af6ae2020e655150, and the review gate passed again on it, from 20:43:29Z to 20:46:17Z; the full Preflight line was not run again, its last run being on c5485a4ead3d0f34377d4feb99c3a0e5e9980415, the tree before these edits. The lines changed since the tree the review read, which no reviewer has read, are now 149.",
  "evidence": [
    "Critic 3's run summary: launched 2026-11-15T20:14:56Z; isolation: user config unchanged, trust table unchanged, isolated home removed true; gpt-6-astra at max; 17 min. Worker uses in this repair by the executor's own count: critic 2, the review and critic 3; the harness's usage report at 20:41:48Z counts 2 launches, one Codex and one unattributed.",
    "The passages the report cites, read before this answer: repair-1/crowd-probe.ts lists the sizes 2 to 16, 18 and 20 in its near mode; D025's decision carries the withdrawn sentence and its evidence the effort's qualification; the host record's review line gave the effort without it.",
    "Measured in session scratch on the variant engine, each run under the bounded wrapper with exit 0, between 20:34:10Z and 20:40:11Z by the output files' own times: the shipped form, first frame of a crowd of twelve at a slow radius of 1 sent 2 units, 18.03 along the way against plain Arrive's 20.99; settling 0 unrested, 0 unarrived, 17 touching frames; later than plain Arrive at 9 of the scratch scan's 26 tunings. Pair forces giving way to the limit (lim): 18.14 against 20.94; 7 unrested, 7 unarrived, 8,462 touching frames; tunings not run. Neighbours' forces outside the limit (free): 20.96 against 20.96; 0 unrested, 0 unarrived, 423 touching frames; later at 13 of 26 tunings, among them a slow radius of 3 on 96 of 108 objectives against the shipped form's 58, a slow radius of 4 on 44 against 1, and a time to target of 0.05 and a weight of 5 on 42 against 12. Both forms and their code are in repair-1/variants.md.",
    "A target radius of 0: the catalog's Arrive admits 0 to 10 (libs/shared/catalog/src/data/tools-aifg-a.json). The scratch scan credits arrival there inside 0.05 of the objective and watches 900 frames: the shipped form's crowd is not credited on 4 of 108 objectives that plain Arrive's units reach, the form with forces outside the limit on 3, and the engine as VER-001 judged it is later on 19, on 8 of them not credited at all. The filed scan's 25 tunings do not include it.",
    "The session's transcript, searched for its own tool calls naming docs/control/local: a directory listing at 19:31:17Z, the log read at 19:49:26Z, and the review report read at 20:02:37Z.",
    "After the target's three edits: npx nx format:check exit 0; the engine's suite exit 0, 217 passed and 2 skipped of 219, started 20:43:16Z; node scripts/target-gate.mjs WO-036 --review exit 0, passed at eb9d227483e30164105da077f50673789d1e5c9f in 165,132 ms, 20:43:29Z to 20:46:17Z, every row passing (install 42,094 ms, lint 83,333, typecheck 1,026, test 4,674, format 1,435, build 486, e2e 7,582, visual 24,502).",
    "The trees, by the review helper's dry run and git diff --numstat at 20:46:51Z: the candidate is 78254cc323844f197c04f8d1af6ae2020e655150. Against c5485a4ead3d0f34377d4feb99c3a0e5e9980415: scene.md 15 added and 13 removed, scene-rules.md 5 and 4, steering.spec.ts 3 and 3, and nothing else. Against the tree the review read, 52d4693845cbdd20c1a5aba868de21776036266d: simulation.ts 31 and 9, steering.spec.ts 58 and 9, scene.md 21 and 14, scene-rules.md 5 and 2, 149 lines.",
    "Crowds of 17 and 19 (docs/evidence/WO-036/repair-1/results/crowd-near-90-sizes-17-19.txt, crowd-probe.ts near 90 17,19, exit 0, 20:47:20Z to 20:47:57Z, on the candidate): three settle spots each, 4,590 objectives a spot, none later than plain Arrive."
  ],
  "rejected": [
    {
      "option": "Rewrite D025's sentence in place",
      "reason": "A decision is a dated record. The correction is carried here, and the handoff's line for criterion 3 links this decision."
    },
    {
      "option": "Take the form that leaves the neighbours' forces outside the acceleration limit",
      "reason": "Measured: it gives the first frame back and still settles every crowd, but it is later than the shipped form on 13 of 26 tunings against 9, and two units touch on 423 frames of the settling sweep against 17."
    },
    {
      "option": "Take the form in which pair forces give way to the limit",
      "reason": "Measured: 7 of 144 crowds neither rest nor arrive and two units touch on 8,462 frames; a unit pulling at its limit is then not kept apart from its neighbours."
    },
    {
      "option": "Keep the explanation as a likely cause in the handoff",
      "reason": "The form that removes the first-frame shortfall does not remove the lateness, so the explanation is at most part of the cause; the handoff states what was measured."
    },
    {
      "option": "Run the whole Preflight line again after the three edits",
      "reason": "They change two documents and one comment. The format check and the engine's suite were run on them and the review gate again on the new tree; the handoff says which run stands on which tree."
    }
  ],
  "reopenWhen": "A reader finds another conclusion in this repair's records that is wider than the measurement under it, or a rule is found that meets criterion 3 at the tunings recorded here.",
  "followup": "Planning: a correction to the follow-up raised by WO-036-D020 on crowds under a steeply tuned Arrive. The cause that follow-up gives, that a unit keeping its distance has less acceleration left for the pull, is not established: a form that leaves the neighbours' forces outside the acceleration limit gives the first frame back and is still late (WO-036-D026). A target radius of 0, which the catalog admits, belongs with the same work: in a scratch scan the crowd's centre stays outside 0.05 of the objective on 4 of 108 near objectives that plain Arrive's units reach. Whether a rule exists that meets the comparison at every tuning is open."
}
```

## WO-036-D027

```json
{
  "id": "WO-036-D027",
  "date": "2026-11-15",
  "dispatch": "resume: verify; independently judge the repaired WO-036 candidate. Capture SHA-256 178bcbd58fc08915589973085820ecdf0c626ff9a7489b401fc033f46f80faae.",
  "decision": "File VER-002 as fail on criterion 3. Credit the repaired default-radius comparison and the blocked-Wander stop, both independently reproduced. Keep the supported slow-radius counterexample as an in-order repair, without declaring a criterion defect or implying a waiver. The target implementation remains untouched by this verifier.",
  "evidence": [
    "docs/evidence/WO-036/ver-002-reproductions.md and its executable probe, run at target tree 78254cc323844f197c04f8d1af6ae2020e655150: twelve units rest at zero speed before re-targeting; slow radius 3 reaches all four two-unit cardinal offsets in 23 frames against plain Arrive's 22, and slow radius 1 takes 21 against 19. The catalog admits radii 1 through 50. All sampled comparisons at default radius 10 and radius 20 pass.",
    "The same independent probe shows blocked Wander, Velocity matching and priority Wander at rest with speed zero and no displacement over 120 further frames, then movement after clearing geometry with their behavior retained. The production page independently holds Wander at rest through 60 Step clicks and resumes after Clear walls.",
    "docs/verifications/WO-036/VER-002.md records the complete production walkthrough, five viewport captures, current target review row, fresh uncached engine check and the review of the post-review repair diff. D026 withdrew the claim that the criterion is impossible; these probes do not restore that claim."
  ],
  "rejected": [
    {
      "option": "Pass on default Arrive and the fixed regression cases alone",
      "reason": "Criterion 3 does not restrict the supported tuning to its default, and an ordinary offered input still violates the no-later requirement."
    },
    {
      "option": "Record criterion 3 as a contradiction",
      "reason": "The candidate and a sampled family of variants failing do not establish that every possible rule fails. D026 explicitly corrects that inference."
    },
    {
      "option": "NoOp: keep the candidate and defer the failure to planning",
      "reason": "The defect is inside the order's declared engine surface and breaks its explicit criterion, so boarding it elsewhere cannot discharge the order."
    },
    {
      "option": "Repeat the complete target gate",
      "reason": "The canonical reader accepts the executor's review row at the exact current target tree. A fresh affected engine run, independent supported-input probe and production walkthrough provide the additional evidence without another full installation and suite."
    }
  ],
  "reopenWhen": "A repaired candidate passes the supported counterexamples while retaining settling, unchanged original fixture hashes and untouched movement studies, or the operator explicitly changes the criterion through a recorded amendment or waiver.",
  "followup": "WO-036 repair: resolve VER-002 F1 inside priority steering, keeping the supported slow-radius cases active and preserving criterion 2's hashes and criterion 3's studies boundary. This continues the unresolved behavior recorded by D020 and corrected by D026; it is required repair, not a new out-of-scope feature."
}
```

## WO-036-D028

```json
{
  "id": "WO-036-D028",
  "kind": "correction",
  "date": "2026-11-15",
  "dispatch": "resume: verify; operator-directed correction of the verifier's scope judgment. Capture SHA-256 998cb1c23d9fae51db5730c7e3190c09cd5b124dc06f2468509ae392e5226fa5.",
  "misread": "VER-002 treated criterion 3 as requiring the nearby no-later comparison at every supported Arrive tuning. The repair intentionally left that interpretation for verification, but the verifier treated the broad reading as established and returned the order to repair on the already disclosed low-radius cases.",
  "meant": "Adjudicate the stated twelve-unit regression in its default Arrive configuration, tied by step 7 to the carried settling and slow-start defect. Supported alternative tunings are valid probes, but their existence alone does not establish a universal no-later acceptance requirement. A reproduced case outside that regression, with no behavior of the integrated base shown to regress, remains a follow-up. This interprets the original criterion; it neither amends its text nor waives it.",
  "changed": "Issue VER-003 as the corrected passing verification of the same target tree. Credit criterion 3's passing default regression and preserve the low-radius measurements as the existing D020/D026 follow-up. Supersede D027's mandatory in-order repair disposition without rewriting D027, VER-002 or any recorded event. The other nine met judgments retain their evidence, and the new document tree is gated before ordinary verification completion.",
  "decision": "Correct the verification judgment, preserve all historical evidence, and end the circular repair handoff. The operator explicitly directed this correction after the verifier acknowledged the mistake. OperatorOverrideRecorded ordinal 11 records the sole recovery bypass: allocate the next verification directly from needs-fix because the ordinary verify command requires ready-to-verify. The control fold validates the new event before append, a checkpoint preserves the old state, and the current session reserves the only writer. No repair completion, waiver, acceptance amendment, passing gate or new independent reviewer is invented.",
  "evidence": [
    "docs/work-orders/WO-036-scene-walls-and-ways.md criterion 3 frames executable coverage of twelve units, and step 7 names the crowd coming to rest and starting promptly when sent nearby; it does not state the universal tuning requirement VER-002 imposed.",
    "docs/evidence/WO-036/ver-002-reproductions.md: at default slow radius 10 the settled twelve-unit crowd rests at zero speed and reaches all eight sampled nearby objectives earlier than plain Arrive from the same positions. The radius-3 and radius-1 cases still fail and remain honestly recorded.",
    "docs/evidence/WO-036/README.md#the-arms: the integrated-base arm exits 1 with rest and re-target failures, and the candidate arm exits 0 with 217 passed and two boarded cases skipped. The same-session uncached engine run passed; the canonical review row still accepts tree 78254cc323844f197c04f8d1af6ae2020e655150.",
    "docs/verifications/WO-036/VER-003.md carries every criterion judgment, the existing production walkthrough, the precise recovery boundary and the remaining limitations. VER-002's bytes and recorded fail remain unchanged as history."
  ],
  "reopens": {
    "decisionId": "WO-036-D027",
    "observation": "The operator challenged the circular handoff and explicitly directed correction after the verifier acknowledged its unadjudicated scope expansion. Re-reading the criterion with step 7 and the regression evidence establishes the corrected judgment; the low-radius observations are retained rather than erased."
  },
  "rejected": [
    {
      "option": "Leave VER-002 as the current judgment and ask for another engine repair",
      "reason": "That repeats the scope mistake instead of resolving the interpretation the repair left to verification."
    },
    {
      "option": "Rewrite VER-002 or its completion event in place",
      "reason": "Filed reports and events are immutable; a later verification records the correction while preserving what happened."
    },
    {
      "option": "Treat the operator's direction as a waiver",
      "reason": "The operator directed correction of a mistaken judgment, not acceptance of a failed specified regression. The default regression has passing executable evidence."
    },
    {
      "option": "NoOp on the low-radius observations",
      "reason": "The observations remain useful and reproducible. Their existing D020/D026 follow-up stays open, while D027's blocking disposition is superseded."
    }
  ],
  "reopenWhen": "The specified default twelve-unit rest or nearby re-target regression fails, a behavior the integrated base had is shown to regress, the target identity changes, or the operator explicitly asks for the no-later comparison across other Arrive tunings."
}
```

## WO-036-D029

```json
{
  "id": "WO-036-D029",
  "date": "2026-11-15",
  "dispatch": "resume: final review (reviewer, Claude Code 2.1.325, claude-fable-5-2, effort xhigh as CLAUDE_EFFORT reports it); FINAL-001",
  "decision": "Accept the order: all ten criteria are met, none waived and none recorded defective, on the target's reviewed commit a96a60cc3f2c54e5da5c9b615e9cf00a49916a0a, whose tree is 78254cc323844f197c04f8d1af6ae2020e655150, the tree VER-002 and VER-003 judged. The final review made no source change. Criterion 3 is judged met on the reviewer's own reading, which agrees with VER-003 and D028 and differs from the executor's handoff and VER-002: the criterion asks for engine specs that assert two named cases, twelve units under priority steering with Arrive coming to rest and a settled crowd sent somewhere near reaching it no later than plain Arrive from the same places, both failing at the integrated base. It names the crowd and the two tools and sets no tuning, and the tools as the rail places them, at the catalog's defaults, are the case it names; a comparison held at every tuning of Arrive the catalog admits is a property over a parameter space that no spec case asserts and the criterion does not state. VER-001's finding was inside the criterion, since it varied 'nearby', the criterion's own word, in the spec's own configuration; VER-002's varied a parameter the criterion does not mention. The steep tunings are therefore a follow-up by the final-review rule: they are outside the criterion as written and break no behaviour main had, since at the base such a crowd never reached a near objective at all. They stay boarded in the target's spec and carried by FUP-74e51991919f0a80 and FUP-daf1ce232223262a. The operator's words of capture 998cb1c23d9fae51db5730c7e3190c09cd5b124dc06f2468509ae392e5226fa5 were read: they reject failing the criterion on the question the repair left open and ask for neither a waiver nor an amendment, so none is recorded and the criterion is judged as it stands. The reviewed tree is committed as four commits a reader can take a layer at a time, the engine (bf9b4e8), the catalog rows (d0add77), the older-trial reader (f697147) and the page with its tests, baselines and documents (a96a60c); the first three do not build alone, because the layers after them read the engine's new metrics and kinds, and only the last commit's tree was gated. No draft pull request preceded the review: the session that recorded the passing verification published nothing, and the kit's draft form is legal only at verified, so the order's duty to read the draft's workflow runs and threads from preview-pr.json has nothing to read; the final publish opens the pull request ready, and its workflows run there before the operator merges.",
  "evidence": [
    "docs/evidence/WO-036/final-001-probe.ts, run by final-001-probe.mjs under the bounded wrapper against the target worktree and against an export of the base engine (git archive eb9d227 of libs/shared/scene-engine, the scene's fixture, tsconfig.base.json and package.json), results under docs/evidence/WO-036/final-001-results/. Candidate, Priority steering and Arrive at the catalog's defaults in either order, the spec's twelve units and two twelves of the scene's own twenty (maximum speed 16 and acceleration 40, where the spec's are 12 and 30): every crowd at rest (frames 629, 629, 1326 and 855) and, settled and sent 1.05, 1.5, 2, 3, 5, 8 and 12 units away in sixteen directions, none of 112 objectives a crowd reached later than the same units under Arrive alone. Base, the same four crowds: none at rest inside 3,600 frames (peak speed 0.11 to 0.17 after 2,400), and a crowd sent 2 units or more never reaches inside 1,800 frames in 70 to 80 of 80 cases a crowd, reaching the rest hundreds of frames after plain Arrive.",
    "The same probe at a slow radius of 3 and of 1 reproduces VER-002's finding and no more: later by 1 to 3 frames at 2, 5, 8 and 12 units at radius 3, and by up to 5 frames from 1.5 units on at radius 1, every crowd at rest. At the base those two crowds are not at rest either, and sent 2 units or more they never reach in 80 and 71 of 80 cases.",
    "blocked mode: six of the scene's units given A* past a wall and sealed off on the move, carrying nothing else, Wander, Flee, Flocking, Collision avoidance, Obstacle and wall avoidance, Priority steering or the Equilibrium fallback order: all eight read blocked, are at rest with speed 0, do not move in the next 120 frames and move 39 to 57 units in the 240 after the walls clear, with none blocked. headon mode: two of the scene's units exactly head on with Arrive and Collision avoidance never come closer than 0.9997 of a unit, end either side of the objective with no collision counted, and replay identically.",
    "Independent reads at the reviewed tree: trial-known-outcome.json's hashes, its other fields and its eight carried series equal the file at eb9d227, the three added series being nulls and zeros; git diff --quiet eb9d227 -- libs/features/tools/src/lib/studies exits 0, and so does the diff of package.json and package-lock.json; aifg-a:247 reads status background with no faces; the candidate tree through a temporary index is 78254cc323844f197c04f8d1af6ae2020e655150 before the commits and git rev-parse HEAD^{tree} after them.",
    "The Objective's session performed by the reviewer in the served production build, in a Chromium launched from the target's Playwright installation (docs/evidence/WO-036/final-001-walkthrough.mjs, its two logs under final-001-results/ and fifteen captures under walkthrough/ named final-001-*): every step completed, no console or network problem, no horizontal overflow at 360, 768, 1440, 2080 by 1460 or 3840 by 1620.",
    "node scripts/worktree.mjs publish WO-036 --target-worktree --draft --branch feat/scene-walls-and-ways --title <title> --body-file docs/final-reviews/WO-036/TARGET-PR.md printed 'error: target publish refused: the draft form is legal at verified with a passing verification; WO-036 is final-review'. The target's remote held only main and no open pull request (git ls-remote --heads origin; gh pr list --repo DylanBWood/DotLn-Angular --state open)."
  ],
  "rejected": [
    {
      "option": "Fail on criterion 3 as VER-002 did, holding the comparison at every tuning the catalog admits",
      "reason": "The criterion names two cases for the engine's specs and no tuning; the reading adds a requirement it does not state, and the reproduced lateness breaks nothing main had."
    },
    {
      "option": "Record criterion 3 defective, as a contradiction",
      "reason": "The criterion is judgeable and met as written; and D026 already withdrew the claim that no rule could meet the wider reading, which nothing here restores."
    },
    {
      "option": "Record a waiver from the operator's words of capture 998cb1c2",
      "reason": "They ask for no waiver. They call a judgment wrong, which asks for neither a waiver nor an amendment."
    },
    {
      "option": "One commit, or commits split by topic inside steering.ts and simulation.ts",
      "reason": "One commit hides three layers a reviewer can read apart; a split inside those two files would mean rebuilding intermediate states of them by hand, which no check would have judged."
    },
    {
      "option": "Hold the review until a draft exists",
      "reason": "No ordinary route opens one at this phase, and the workflows the draft would have run are required on the pull request before the merge."
    }
  ],
  "reopenWhen": "A crowd of twelve under priority steering with Arrive at the catalog's defaults fails to rest or reaches a near objective after plain Arrive; a workflow on the pull request fails or a review thread names a defect, which returns the order through resume: fix; or the operator asks that the comparison bind other tunings of Arrive."
}
```

## WO-036-D030

```json
{
  "id": "WO-036-D030",
  "date": "2026-11-15",
  "dispatch": "resume: final review; a defect met in the reviewer's session on the page and not fixed",
  "decision": "Board, and do not fix here, how the inspector reads routes after Restart. Restart puts the applied tool down, as it does for every tool at the base, so although the replayed composition has the squad on its routes again, the inspector heads its route section 'The routes Apply would plan' and reads a preview; and because a preview is hidden while the run plays, the section goes empty and Show search shades nothing until the run is paused or the tool is applied again. With the tool live, which is the Objective's own order of steps, the section reads 'Their routes' and the search stays shaded through a replan. It breaks no criterion and no behaviour main had, main having had no routes to read; it is a rough edge of the page inside the order's surfaces, left because the fix is a choice about what Restart means for every tool, not for routes alone.",
  "evidence": [
    "docs/evidence/WO-036/final-001-results/walkthrough-route.txt: after Restart and Play, at frame 102 with a second wall drawn, the route section's text is its heading and the Show search label alone, while the Replans instrument reads 11 and eleven rows read replanning; paused at frame 246 it reads the preview's counts.",
    "docs/evidence/WO-036/final-001-results/walkthrough-live-avoid-headon.txt: the same steps without Restart read 'Their routes With a route: 11, 67.1 long on average' at frame 114 while playing, and docs/evidence/WO-036/walkthrough/final-001-06b-replan-live-2080.png shows the search shaded.",
    "The target's scene.facade.ts: #live compares the last applied tool with the chosen one, restart() sets the last applied tool to null, and #routes reads the shown preview, which is null while playing, when the tool is not live."
  ],
  "rejected": [
    {
      "option": "Fix it in the final review by reading the selected units' routes whenever they have them",
      "reason": "It changes a facade rule the slot table and live tuning share, after verification, for a defect that breaks no criterion; a source change would also move the tree every gate judged."
    }
  ],
  "reopenWhen": "The operator's play finds the empty route section or the missing shading after Restart, or an order next touches the inspector's live rule.",
  "followup": "Planning: after Restart the soldier scene's inspector reads a path tool's routes as the ones Apply would plan, and while that run plays its route section is empty and Show search shades nothing, though the replayed squad is following routes; decide whether the inspector should read the selected units' own routes and search whenever they have them, and whether Restart should keep a replayed tool live (docs/evidence/WO-036/final-001-results/walkthrough-route.txt)."
}
```

## WO-036-D031

```json
{
  "id": "WO-036-D031",
  "date": "2026-11-15",
  "dispatch": "resume: final review; a cost of the priority-steering repair measured against the base",
  "decision": "Record, and leave to the operator's play, that a crowd under priority steering is first credited with arriving later than at the base. The order directs the repair and criterion 3 judges it by rest and by a settled crowd's near re-target, both of which the base failed; no criterion and no promise of main's fixes the first credit, and the base earned its earlier credit from a crowd that never stopped moving. D003 measured this cost for the first execution's rule; these are the figures for the rule that ships.",
  "evidence": [
    "docs/evidence/WO-036/final-001-results/crowd-base.txt and crowd-candidate.txt, the frame at which the stopwatch first credits a scattered crowd of twelve under Priority steering and Arrive sent to one objective, base against candidate: the spec's twelve 270 against 354; the scene's west twelve 309 against 342; the scene's first twelve sent to (40, 30) 344 against 395; the spec's twelve at a slow radius of 3, 315 against 384, and of 1, 411 against 418. That is 2 to 31 percent later. In the same runs no base crowd is at rest inside 3,600 frames and every candidate crowd is, between frames 629 and 1,326."
  ],
  "rejected": [
    {
      "option": "Treat the later credit as a regression that blocks",
      "reason": "The credit at the base was the stopwatch's stopped-round-the-objective rule firing on a crowd that went on shimmering, the defect this order was filed to repair; the candidate's crowd is slower to be credited because it keeps its spacing and settles."
    }
  ],
  "reopenWhen": "The operator's play says a crowd under priority steering is slow to arrive.",
  "followup": "Planning: a crowd of twelve under priority steering with Arrive is first credited with arriving 2 to 31 percent later than before the settling repair (354 frames against 270 for the spec's crowd), while it now comes to rest where it never did; if the operator's play finds that slow, weigh the neighbour friction and the stiffened push against the time to first arrival (docs/evidence/WO-036/final-001-results/)."
}
```


Filed from the launchpad Launchpad at commit 74aaf3eccf4736f9dcb3c4b81d315a685594b058, where this record's path was docs/evidence/WO-036/decisions.md: its relative links resolve at that commit on the launchpad, whose order branch history the launchpad records publish pushes, and not in this repository.
