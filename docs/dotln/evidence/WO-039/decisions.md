# WO-039 decisions

## WO-039-D001

```json
{
  "id": "WO-039-D001",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 1, the base guard",
  "decision": "Take f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3, WO-023's merge, as the integrated base of every comparison. After git fetch origin in the target clone, git merge-base --is-ancestor f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3 origin/main exits 0 and origin/main is that commit, so the target worktree, already at it on branch wo-039, takes in nothing. The launchpad worktree stands at main's 7a8dcff2909b7b2384407d1656286b0119badb97. The target's dependencies were installed with npm ci in its worktree, since the registered base checkout installs none.",
  "evidence": [
    "git -C <target worktree> rev-parse origin/main main HEAD prints f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3 three times; git log f99580f..origin/main prints nothing; the is-ancestor check exits 0.",
    "Canonical status records WO-039 active with base commit f99580f10803bfaa5abae7cd8b0af3b6eeaf8ed3 and checkpoint refs/dotln/checkpoint/WO-039/1.",
    "The executor runs under Claude Code with model claude-opus-5-5 and the selected effort max, read from CLAUDE_EFFORT."
  ],
  "rejected": [
    {
      "option": "Integrate a later main before the before-crawl",
      "reason": "origin/main is the pin itself; there is nothing to integrate, and the before-crawl is taken at the integrated base the order names."
    }
  ],
  "reopenWhen": "The target's main moves before the handoff or the final publish, as a sibling merge would: the before-crawl, the before-audit and the base output probe are then recaptured at the new base, and a sibling's regenerated baselines are recorded as the sibling's."
}
```

## WO-039-D002

```json
{
  "id": "WO-039-D002",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 2, the audit and the crawl before",
  "decision": "Copy WO-034's shape-audit.mjs, crawl.mjs, compare-dom.mjs and open-study-details.mjs from the launchpad at 7a8dcff2909b7b2384407d1656286b0119badb97 into this order's evidence and adapt three of them, leaving the WO-034 copies and their pins untouched. The audit adds the poeaa group's functions over four positional parameters and at 70 counted lines or more, and the enterprise catalog's string and placeholder counts. The crawl reads the twenty enterprise studies from studies-summary.json, steps the sixteen states drawings through their own Step N of last slider to every moment, reads the four structural records once, captures at 1440 and at 360, keeps only rendered text so the wide register is read at 1440 and the narrow one at 360, and marks which text nodes are a register's state headings. The comparator takes its two captures and its output as arguments, permits a difference only in the state headings of the frames the narrow-heading decision names with every other node and label of those frames equal, reports sequence differences rather than index by index, and exits non-zero on any other difference, a missing or added frame, a page error or a short inventory. The static server both browser programs share moves into serve-build.mjs. Add a probe of every model's output, run at the base and at the candidate: every model a record names at its own parameters and each enterprise model over the grid of its declared inputs, 174 cases, compared by compare-outputs.mjs; a real-glyph measurement of the register (narrow-register.mjs); the decided frames (narrow-frames.mjs); the Foreign Key Mapping control (fkm-control.mjs); and the comparator's control (comparator-control.mjs).",
  "evidence": [
    "The before audit (shape-audit-before.json) records the Observed gap's counts: the poeaa group has 48 files and 764 functions, none over four positional parameters, one at 70 or more counted lines (pessimistic-offline-lock.presentation.ts shapeOf, 71), and the enterprise catalog holds 1,763 strings with no numbered placeholder.",
    "The before crawl (dom-before.json.gz) holds 238 frames of 20 studies, 16 with a states drawing, at both widths, with no page error; compared with itself the comparator reports 0 differing frames and exits 0.",
    "The crawl covers each study's default run only; the output probe covers every declared input, which is how the reshape was shown to leave every output unchanged after each batch of presentations."
  ],
  "rejected": [
    {
      "option": "Capture every text node whether rendered or not, as WO-034's crawl did",
      "reason": "Both registers sit in the page at every width, the narrow one hidden above 600 pixels, so the 1440 capture would carry the narrow register's headings and the admitted change would show outside the 360 frames the decision names."
    },
    {
      "option": "Rely on the crawl alone for every output unchanged",
      "reason": "The crawl reads each study's default parameters; a reshape that changed a model's output at another declared input would pass it. The probe compares all 174 cases."
    }
  ],
  "reopenWhen": "A later order copies these programs: their adaptations are this order's, and a copy records its own source commit and invocation."
}
```

## WO-039-D003

```json
{
  "id": "WO-039-D003",
  "date": "2026-11-08",
  "dispatch": "resume: next; steps 4 and 5, the presentations",
  "decision": "Give every enterprise presentation the lookup shape Unit of Work's names and tokens set. A display name, a token letter or a state's or a part's name is read from a table keyed by the study's id union and checked with satisfies Record<Id, string>, so the compiler refuses a missing or an extra entry. A choice by an operation's kind is a table of one function per kind through matchKind in studies/match-kind.ts, each function given the value of its own kind, including a member whose kind is one of several. A choice by a state, a place or a string operation is a Record of one function per value, and no table is partial: Gateway's worked steps name every operation, those that show no check through one function that answers none. No presentation keeps a switch: grep -c 'switch (' prints 0 for all sixteen. The simulations whose switches stood for a lookup or a dispatch with a default for a real case take the same shapes: Optimistic Offline Lock's perform goes through matchKind, and Record Set's statementFor and Service Stub's expectationOf and stubAnswer are Records. matchKind holds two type assertions, commented: the compiler reads a generic value's kind as the constraint's string, and it cannot follow the link from a table's key to its function's argument.",
  "evidence": [
    "WO-023-D016's follow-up named the fifteen presentations' switch-with-default lookups and nested-ternary token letters; the before count was 69 switch statements over sixteen files.",
    "After the reshape, grep -c 'switch (' libs/features/tools/src/lib/studies/poeaa/*.presentation.ts prints 0 for each file; the tools library's lib and spec TypeScript configurations compile; npx nx lint tools passes.",
    "The output probe compares all 174 cases equal to the base after the first four presentations, after eight and after all sixteen (model-outputs.json)."
  ],
  "rejected": [
    {
      "option": "A switch with an exhaustive never check in its default branch",
      "reason": "It gives the compiler's check but keeps the switch the order's criterion 2 counts, and a table reads as the data it is."
    },
    {
      "option": "A pattern-matching library",
      "reason": "The order adds no dependency, and twenty lines of typed helper cover every use."
    },
    {
      "option": "One combined table per object holding its name and its token",
      "reason": "Unit of Work's two tables, names and tokens, are the shape the order names for the fifteen others to take."
    },
    {
      "option": "Call the helper byKind",
      "reason": "@dotln-angular/catalog exports byKind, a filter of tools by their kind; one name for two meanings in one workspace misleads an automatic import and a search, and matchKind says what the helper does."
    }
  ],
  "reopenWhen": "TypeScript can type a table's dispatch without the assertions, or a batch needs a choice a table cannot express."
}
```

## WO-039-D004

```json
{
  "id": "WO-039-D004",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 3, the shared pieces",
  "decision": "Teach statesModel in studies/states.ts to infer a move's transition: a move between two different states that its snapshot does not name takes the one transition that joins them, takes none where none joins them, and is refused when it builds where two or more join them, the error naming the object, the two states and the transitions. A named transition must still join the move's states, and an object that stays where it was moves only when its snapshot names a transition back into its state. Snapshots therefore name a transition only where two transitions join the same states or for such a loop, and every presentation's tookAt shrinks to those cases; Data Transfer Object's, Optimistic Offline Lock's and Service Layer's go. The builder also drops a null placement or note, so a presentation writes Object.fromEntries over every id instead of its own null-dropping idiom, and moveSentence joins names through listOf.",
  "evidence": [
    "With the builder changed and every presentation unchanged, the probe's 174 cases equal the base: no presentation had left unnamed a move that exactly one transition joins, so inference names nothing anew.",
    "states.spec.ts gains specs for the inferred transition, the refused ambiguous move with and without its snapshot naming one, and the dropped null placement and note; the existing specs pass unchanged."
  ],
  "rejected": [
    {
      "option": "Keep every snapshot naming every transition",
      "reason": "WO-023-D016 found moves naming a transition that only one joins; the name repeats what the shape says, and a reader of tookAt cannot tell the necessary names from the redundant ones."
    },
    {
      "option": "Infer a loop back into the same state",
      "reason": "Nothing in two equal snapshots says a transition happened; a loop is shown only when the simulation says it."
    }
  ],
  "reopenWhen": "A study needs a move that no transition joins to be drawn as a named transition, or a family other than states takes snapshots."
}
```

## WO-039-D005

```json
{
  "id": "WO-039-D005",
  "date": "2026-11-08",
  "dispatch": "resume: next; steps 4 and 5, the on/off inputs",
  "decision": "Type every on/off input of the enterprise simulations as a boolean read by booleanParameter in studies/parameters.ts, which reads the 1 or the 0 a record and its slider hold and refuses any other value: Data Mapper's eachRow, Foreign Key Mapping's identityMap, Identity Field's rereads, Lazy Load's chunkPerStudy, both offline locks' tabASaves, Plugin's productionStub, Record Set's continueOnError, Registry's perPage, Remote Facade's buildsDown and reportsFailures, Service Layer's importBypasses and importForeign, Service Stub's dynamicStub and Unit of Work's otherTabSaves. Lazy Load's failFirst, Record Set's rivalSaves, Identity Map's maps and revisits and Registry's returns stay numbers: each is counted by its simulation, though some sliders stop at 1. Each spec pins the record's parameters exactly as stored, its on/off inputs as the 1 or the 0, beside their reading through the module's readParameters, and drives the simulation with booleans.",
  "evidence": [
    "WO-023-D016's follow-up named the loosely typed on/off parameters; each was read as > 0, === 0 or !== 0 in the simulation or the presentation.",
    "parameters.spec.ts covers booleanParameter's 1, 0 and refused values; the probe's 174 cases are unchanged, the record's own parameter values among the prose's.",
    "All sixteen enterprise specs hold expect(parameters).toEqual(…) over the record's stored values, so a stray, missing or renamed record parameter fails them as it failed main's; the thirteen with an on/off input write it as { ...example, <input>: 1 or 0 }."
  ],
  "rejected": [
    {
      "option": "Type the counted inputs as booleans too",
      "reason": "failFirst counts the imports that fail, rivalSaves the saves another tab makes and maps the maps a page reads through; a boolean would change what the simulation means for a slider that may later reach 2."
    }
  ],
  "reopenWhen": "A counted input's slider is narrowed to an on/off switch for good, or an on/off input gains a third value."
}
```

## WO-039-D006

```json
{
  "id": "WO-039-D006",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 3, TimelineModel's x values",
  "decision": "Name a chart's x values for what they hold. TimelineModel in studies/study-model.ts becomes TimelineModel<Axis>, a chart whose x values sit under seconds, steps or counts, read from a table of the three, TimelineAxes; its default, seconds, is a movement example's clock, so the forty movement presentations and their specs keep TimelineModel and seconds unchanged. StudyComparison<Axis> follows, the motion family's comparison stays a seconds chart, and a states study's comparison names its axis: Identity Map, Remote Facade, Unit of Work and Foreign Key Mapping chart steps, Lazy Load counts readings opened. A model's comparison, and so the study view's, is a comparison over any axis, StudyComparison<TimelineAxis>, and the compiler refuses one over steps or counts where one over seconds is wanted. xValuesOf reads the x values whatever their name, and the timeline drawing and composite read them through it.",
  "evidence": [
    "WO-023-D016's follow-up: the states comparisons wrote run.steps.map((_, index) => index) into a field named seconds.",
    "Fourteen movement specs read a chart's seconds; with the default axis they compile and pass unchanged, and the tools library's lib and spec configurations compile.",
    "The probe compares the comparisons' x values under one name, and all 174 cases are equal.",
    "Round 1 of the review ladder found the study view's comparison still typed over seconds while the mapper handed it a comparison over any axis. The compiler had accepted that, since with the axis written as a conditional over key-mapped x values it measured the comparison's variance wrongly; a probe file showed StudyComparison<TimelineAxis> passing for StudyComparison. With the axes read from TimelineAxes the same probe is refused (TS2322), and so was the mapper until types.ts widened the view's comparison.",
    "timeline-drawing.spec.ts draws the same x values over steps and over counts and requires each drawing to equal the drawing over seconds, with x values that are not the entries' positions."
  ],
  "rejected": [
    {
      "option": "Keep the conditional type and declare the comparison's axis out",
      "reason": "The compiler refuses the annotation on that structure (TS2636), since it cannot relate the conditional at a generic axis."
    },
    {
      "option": "A tag on every chart naming its axis",
      "reason": "It changes every movement chart, WO-040's surface, and the table of axes already makes the compiler refuse a chart or comparison over one axis taken for one over another."
    },
    {
      "option": "Rename seconds to x in every chart",
      "reason": "It changes forty movement presentations and fourteen specs, the second batch among them, WO-040's surface, for a name that is right where it stands."
    },
    {
      "option": "One union of three chart types with the other two keys typed never",
      "reason": "A movement spec reading chart.seconds.length would then read a possibly undefined array."
    }
  ],
  "reopenWhen": "A chart needs an axis other than seconds, steps or counts, or a stepped chart runs on steps."
}
```

## WO-039-D007

```json
{
  "id": "WO-039-D007",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 3, the one loader",
  "decision": "Replace loadFlowStudy and loadStatesStudy in the tools test kit with one loader, loadModelStudy(id, family), over ModelStudy<Family>: a study the given family draws from the model module its record names, refused when another family or no model draws it. Every flow and states spec imports it: the twenty messaging specs, the RxJS localization spec and the sixteen enterprise specs. loadStudy, which the movement and RxJS specs use for a study with a drawing and an executable module, stays as it is. The loader is named for the model its drawing reads rather than for an executable, because a flow study drawn from a model written step by step may carry executable: null.",
  "evidence": [
    "grep -c 'loadStatesStudy\\|loadFlowStudy' libs/features/tools/testing/src/lib/tools-test-kits.ts prints 0, and no source, spec, script or standing document of the workspace names either; only WO-023's decisions record, which keeps its bytes, still does.",
    "The whole tools suite passes with every flow and states spec on the one loader; the testing entry point's README names it."
  ],
  "rejected": [
    {
      "option": "Fold loadStudy into the same loader",
      "reason": "Its contract differs, a study with an executable module whatever its family, and it serves fifty movement and RxJS specs outside this order's surfaces."
    },
    {
      "option": "Name it loadExecutableStudy",
      "reason": "Canonical Data Model and four other messaging studies the loader reads carry executable: null."
    }
  ],
  "reopenWhen": "A third family draws from a model module and its specs need a different contract."
}
```

## WO-039-D008

```json
{
  "id": "WO-039-D008",
  "date": "2026-11-08",
  "dispatch": "resume: next; steps 4 and 5, the shared helpers",
  "decision": "Carry each comparison's runs in the run description the entry module builds: Foreign Key Mapping's run takes through and without, its runs with and without the identity map, and Lazy Load's perWork and perStudy, so no presentation runs a simulation. Each comparison's runs differ from the example only in the input they compare, so the example's own run is whichever of the two it chose and each simulation runs twice, not three times. Gateway's success rule becomes isSuccessStatus in gateway.simulation.ts, which translate uses and Service Stub's answerWords imports instead of repeating the 2xx test. Record Set's positional operation(id, from, to, label) helper goes; its transitions are written as the other fifteen write theirs. Every list joins through listOf in studies/states.ts: the copies in Record Set and Service Layer, Identity Field's joined and the hand-written joins go, and Unit of Work's statementsOf keeps its own word for an empty commit, nothing, since the register's word for none is another message.",
  "evidence": [
    "WO-023-D016's follow-up named the comparison runs passed outside the run description, Gateway's rule repeated in Service Stub, Record Set's positional helper and the local list idioms.",
    "grep -n 'status >= 200' over the enterprise modules finds the rule only in isSuccessStatus; the probe's 174 cases are unchanged."
  ],
  "rejected": [
    {
      "option": "Let statementsOf use listOf's word for none",
      "reason": "Unit of Work's sentence says the commit sends nothing; changing the word would change the text the order keeps unchanged."
    }
  ],
  "reopenWhen": "A third study needs the gateway's rule, or a comparison needs more than two runs."
}
```

## WO-039-D009

```json
{
  "id": "WO-039-D009",
  "date": "2026-11-08",
  "dispatch": "resume: next; steps 4 and 5, the model specs",
  "decision": "Keep every enterprise model spec off the register drawing: each assertion that read registerDrawing reads the model's frames instead. A ring where an object left becomes the moves whose to is null, a moving token becomes the moves, a token letter becomes the object's key, read through tokensOf in the tools test kit, and an arrow count becomes the move count. Two drawing assertions repeated the moves assertion on the line above them and go: Pessimistic Offline Lock's arrows at step 3 and Record Set's ring at step 7. The register's geometry stays judged by the family's own specs.",
  "evidence": [
    "WO-023-D016's follow-up: model specs read the register drawing.",
    "grep -n 'registerDrawing\\|states-register' over the enterprise specs prints nothing; the sixteen specs pass, 116 tests with Foreign Key Mapping's new one.",
    "Twelve specs read token letters, and all of them read tokensOf(states); the three local idioms this order first wrote for it are gone."
  ],
  "rejected": [
    {
      "option": "Keep the drawing assertions in the model specs",
      "reason": "A model spec that reads the drawing fails when the register is redrawn, as the A/B testing pass will redraw it, though the mechanism has not changed."
    }
  ],
  "reopenWhen": "A model's spec needs a fact only the drawing holds."
}
```

## WO-039-D010

```json
{
  "id": "WO-039-D010",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 6, Foreign Key Mapping's read limit",
  "decision": "Repair Foreign Key Mapping's loop, WO-023-D019's follow-up and FINAL-001's F9: the loader stops on its read limit only when the next key still to resolve needs a read, which is every key without an identity map and, through one, a key whose row has no object yet. A limit of three or less no longer cuts the identity-map run short: with a limit of three the run equals the example's run at its limit of six, finishing on three reads, and limits of one and two stop before a key that needs a read. The study's example keeps its limit of six and its run. The next key's lookup moves into nextKeyOf, which also answers whether the identity map already holds the key's object; follow and the stop rule read that one answer, so the rule for when a key needs a read is written once.",
  "evidence": [
    "foreign-key-mapping.model.spec.ts pins every limit from one to the example's six: at each, the run is the whole run cut just before the step that would read past the limit, a follow that loads a row, so a limit of three or more leaves the run whole and limits one and two stop after that many reads.",
    "fkm-control.mjs ran the spec's test on a fresh copy of the target as it stands, exit 0, and on the copy carrying the base's foreign-key-mapping.simulation.ts, exit 1 with the test failing (fkm-control/results.json).",
    "The study's default run is unchanged frame for frame in dom-diff.json, and its probe cases at both identity-map settings are unchanged."
  ],
  "rejected": [
    {
      "option": "Make the limit an input",
      "reason": "The order repairs the loop; adding an input would change the study's controls and its prose."
    }
  ],
  "reopenWhen": "A later order makes the read limit an input, or the loader learns to follow keys breadth first."
}
```

## WO-039-D011

```json
{
  "id": "WO-039-D011",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 7, the narrow register",
  "decision": "Decide the narrow register's headings, WO-023-D017's follow-up, as a floor size with a break below it. A state's name is drawn at the largest size at which its widest line fits its column, up to the stylesheet's size, but never below two thirds of it; a word that would need to be smaller breaks across lines with a hyphen into the fewest parts that fit at two thirds, the longer part first (breakWord in drawn-text.ts), and its lines are drawn at the size at which they then fit. A name with no words draws no heading at the full size. The wide register is unchanged, every name there already fitting whole. At 360 pixels the rule changes six headings in three studies, every step of each: Service Layer's Accepted, Announced and Refused, Data Transfer Object's Encoded and Refused, and Record Set's Unchanged. Their 25 frames at 360, Service Layer's (poeaa:226) steps 0 to 9, Data Transfer Object's (poeaa:363) steps 0 to 5 and Record Set's (poeaa:452) steps 0 to 8, are the narrow-register frames the comparator permits. The smallest heading there rises from 6.16 to 9.24 pixels in Service Layer, from 7.92 to 9.24 in Data Transfer Object and from 7.97 to 8.97 in Record Set. Gateway's narrow note, measured with real glyphs, fits its column: the line that comes nearest the first state's column, /api/uifa-board-v1; at step 3, ends 10.07 units short of it, while the builder's per-character estimate puts it 9.4 units across it, so no change is made to it. No dedicated A/B testing pass had redrawn the states register when this order activated, so this is the order's decision and the A/B pass's pick replaces it when that pass runs.",
  "evidence": [
    "narrow-register-before.json and narrow-register-after.json measure every enterprise study's narrow register at 360 with real glyphs in the base and the candidate production builds; wide-register-before.json and wide-register-after.json measure the wide one at 1440 and are equal in every field but the time of measurement.",
    "The twelve frames in narrow-register/ show the three changed registers at 360, base and candidate, at the first step and a moving step.",
    "dom-diff.json records 25 differing frames, all the three studies' 360 frames, whose only differences are the six broken headings; every other node and label is equal.",
    "The reading critic judged the decided rendering better than the base at 360 and the rule fit to stand as the interim rule (reading-critic.md, D015).",
    "states-register.spec.ts drives a five-state register of Service Layer's names at 40-unit columns and a register with names of no words; states.spec.ts asserts that the template applies each column's scale to its heading in both layouts.",
    "The register computes each heading once per drawing, for the header's height and for its column, with its wrap and fit margins named beside the floor; the measurements at both widths and the twelve frames taken after that change equal those taken before it in every field but the time, and byte for byte.",
    "Data Mapper's bold Mapped and Unmapped cross their column by 0.15 and 0.17 units, 0.14 and 0.16 pixels, in both builds: under a pixel, overlapping no neighbour, unchanged by this order."
  ],
  "rejected": [
    {
      "option": "Abbreviate a long name",
      "reason": "It needs an authored short form for every state that runs long, in every language, and reads cryptically beside the full names the prose uses."
    },
    {
      "option": "A floor size with no break",
      "reason": "Announced at a readable floor is wider than its 40-unit column and would overrun its neighbours."
    },
    {
      "option": "Break at the full size and never shrink",
      "reason": "A 40-unit column holds three or four characters at the full size: Announced would stand in three fragments."
    },
    {
      "option": "Draw a broken word at the floor size",
      "reason": "It makes every broken word the smallest text in its header; drawn at the size its parts fit, it reads larger, and the reading critic preferred it."
    },
    {
      "option": "Break at the dictionary point, as Un- and changed",
      "reason": "It needs authored break points, which a soft hyphen in the state's message would carry into every prose sentence naming the state, changing text outside the frames this decision names, or a hyphenation table, a new dependency."
    }
  ],
  "reopenWhen": "The dedicated A/B testing pass redraws the states register, or a state's name of a new batch breaks into more than two parts at 360.",
  "followup": "The dedicated A/B testing pass that redraws the states family (FUP-02c1ebe8146fe2f1) also judges the narrow register's headings: a dictionary break such as Un- and changed for Record Set's Unchanged, one size for every heading of a header, headings aligned to the foot of the header, line spacing that scales with the drawn size, and a fit by measured glyphs or a margin, which would also keep Data Mapper's bold headings inside their columns."
}
```

## WO-039-D012

```json
{
  "id": "WO-039-D012",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 8, the token rule",
  "decision": "Decide WO-023-D012's question: a drawing's token letters are symbols in all three drawing families and are not translated. The marble letters are the TestScheduler's syntax and the flow and states tokens are machine identifiers, which G3 keeps with display labels supplied by messages; every family shows them through the house symbol template, tools.study.symbol, with the translated name beside them, a lane's label, a message's content or a row's name. catalog-rules.md states the rule, and a family where it fails is recorded in its order's decisions rather than translated alone. No family fails it today.",
  "evidence": [
    "grep finds tools.study.symbol in marbles.html for marbles and couriers, in flow.html for tokens and in states.html for tokens; apps/dotln/public/i18n/en.json defines it as the symbol alone.",
    "The corpus test admits a one-character symbol only in the declared symbol fields and asserts that every states token is one alphanumeric character.",
    "grep -c symbol docs/ai-reference/catalog-rules.md prints at least 1."
  ],
  "rejected": [
    {
      "option": "A message for every token letter",
      "reason": "The three families would split, the marble letters are syntax a spec reads, and a translated symbol would part the drawing from the spec that reads the same strings."
    }
  ],
  "reopenWhen": "A second language ships whose readers cannot read a Latin letter beside a translated name, or a family's token stops having a translated name beside it."
}
```

## WO-039-D013

```json
{
  "id": "WO-039-D013",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 3, the check's home",
  "decision": "Move the states drawing rule out of check-studies.mjs's rxjsProblems into statesProblems, a function named for it, which studyProblems calls beside rxjsProblems. The rule is unchanged: a states drawing of a study whose model runs reads that same module.",
  "evidence": [
    "WO-023-D017's follow-up named the states rule's place in rxjsProblems.",
    "grep -c statesProblems tools/scripts/catalog/check-studies.mjs prints 2; npm run test:tooling passes 94 of 94, the states rule's own test among them, and npm run studies:check reports 100 records and 0 problems."
  ],
  "rejected": [
    {
      "option": "Rename rxjsProblems for every executable reading",
      "reason": "The states rule is not an RxJS reading's; a function named for it reads as what it checks."
    }
  ],
  "reopenWhen": "A third family gains a drawing rule of its own in the check."
}
```

## WO-039-D014

```json
{
  "id": "WO-039-D014",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 5, the measure",
  "decision": "Judge the one poeaa function at 70 counted lines or more and add no parameter-count lint or lower ceiling. Pessimistic Offline Lock's shapeOf, 71 counted lines, does one job and reads whole: it is the register's shape as one literal, four states, the two tabs and eight transitions, each transition a four-line object as in every other study, and splitting it would scatter the transitions a reader checks against the states above them. The batch stays at zero functions over four positional parameters.",
  "evidence": [
    "shape-audit-after.json: the poeaa group has 48 files and 937 functions, none over four positional parameters and one at 70 or more counted lines, shapeOf at 71; the function count rises from 764 because each table entry is a small function.",
    "WO-028-D060's reason against a count lint: a count invites the next mechanical split, and the standards pass reads."
  ],
  "rejected": [
    {
      "option": "Split shapeOf into states, objects and transitions",
      "reason": "The three parts are read together; the split would add names without making the shape easier to check."
    }
  ],
  "reopenWhen": "The shape gains transitions enough to pass the 80-line guard, or a later pass finds a reader misled by its length."
}
```

## WO-039-D015

```json
{
  "id": "WO-039-D015",
  "date": "2026-11-08",
  "dispatch": "resume: next; step 7, the reading critic",
  "decision": "Dispose the reading critic's findings on the changed narrow register. Its verdict, that the decided rendering reads better than the base at 360 and should stand as the interim rule, holds the decision. Its first finding, Record Set's Uncha- and nged breaking inside the word's root, moves to the dedicated A/B testing pass with D011's follow-up, as the critic allows where the order does not take on per-word break points: a dictionary break needs authored break points or a hyphenation table, and either would change text outside the named frames or add a dependency. The other four breaks and the largest-size-that-fits rule are kept, as it advises, and its notes on header alignment, line spacing and crowding go to the same pass. Its question on the wide layout is answered by the wide-register measurements at 1440, equal on both builds in every field but the time of measurement.",
  "evidence": [
    "reading-critic.md records the critic's report and each disposition; one Claude dotln-worker launch, read-only, ran no gate.",
    "wide-register-before.json and wide-register-after.json, sixteen studies each, no page error."
  ],
  "rejected": [
    {
      "option": "Draw broken words at the floor size, the critic's third question",
      "reason": "The critic judged it worse: every broken word would become the smallest text of its header."
    }
  ],
  "reopenWhen": "The A/B testing pass runs, or a reader at 360 misreads a broken heading."
}
```

## WO-039-D016

```json
{
  "id": "WO-039-D016",
  "date": "2026-11-08",
  "dispatch": "resume: next; the review ladder, round 1",
  "decision": "Dispose round 1 of the review ladder: three fresh reviewers, criteria, design and consistency, over the reviewed tree f0afed010052727b7d0177f1441b142f86c722a4, nineteen findings. Fifteen are fixed. The study view's comparison was still typed over seconds, which all three reviewers found, and the chart's axis was a conditional over key-mapped x values, through which the compiler could not relate one axis to another; the axes are now read from a table (D006). Foreign Key Mapping wrote its read rule twice, and its read-limit spec told the two arms apart at one limit only (D010). Gateway kept one partial table (D003). The register computed each heading twice with its margins unnamed (D011). The dispatch helper shared its name with the catalog's filter (D003). The default run was computed twice beside its comparison (D008). Optimistic Offline Lock's simulation chose by kind without the shared helper (D003). The specs held three token idioms (D009). Thirteen specs no longer pinned the record's stored parameters (D005). No spec drew a chart over steps or counts (D006). The decisions were to name the frames at 360 the comparator permits, and D011 now lists them by step. Four are recorded without a change. The catalog document's link to this order's decisions, which two reviewers found, resolves once the records step files them in the target as docs/dotln/evidence/WO-039/decisions.md, whose heading WO-039-D011 makes the anchor, as WO-028's link in the same document resolved. The letter-count hyphenation is the reading critic's to judge, and D015 disposed it. Typing a states shape by the study's own unions is deferred. Two parts of fixed findings stay as they were: matchKind's first type assertion, which the compiler needs (TS7053 without it), and a namesOf shared by the presentations.",
  "evidence": [
    "The three reports are kept in the launchpad's ignored review lane for this order, round 1; each records the reviewed tree and the checkout unchanged across its episode.",
    "The reviewers could not run the compiler. Run here, the tools library compiled at the reviewed tree, so the view's comparison was a gap in the types rather than a broken build; the probe file of D006 shows why.",
    "After the fixes, the tools library's lib and spec configurations compile, lint passes for tools and workspace-tools, the tools suite passes with 129 files and 1,116 tests, the probe's 174 cases equal the base, the crawl differs only in the 25 permitted frames, the register measurements and frames are unchanged, and the Foreign Key Mapping control still passes on the candidate and fails on the base."
  ],
  "rejected": [
    {
      "option": "One namesOf beside listOf, given each presentation's table of names",
      "reason": "Each presentation's namesOf is one expression over its own id union and reads at its call without a table argument; moving it would add an argument to every call for one line saved in six files."
    },
    {
      "option": "Type the states shape by the study's unions in this order",
      "reason": "It changes the shared builder's types and all sixteen presentations' shapes, beyond the order's Design, for a check the builder already makes when the example builds, as every probe and spec run shows."
    }
  ],
  "reopenWhen": "A study's shape names a state, object or transition its simulation does not have and only the example's build catches it, or the next standards pass over the enterprise batch runs.",
  "followup": "The next standards pass over the enterprise batch or the states family types a states shape by the study's own state, object and transition unions, through a generic StatesShape or a node table checked against the simulation's state union, so that a node, a snapshot's state or a named transition the simulation does not have fails to compile rather than when the example builds."
}
```

## WO-039-D017

```json
{
  "id": "WO-039-D017",
  "date": "2026-11-08",
  "dispatch": "resume: next; the review ladder, round 2",
  "decision": "End the review ladder at round 2. Each round-1 reviewer, given its report, rechecked its fixes over the reviewed tree aa01296dfa364e9285fd1967283a9cee4cfa4e17 and then reviewed the whole change against the base again. The rechecks hold every fix D016 names, and find not held only what D016 recorded without a change. The decisions link waits for the records step, the hyphenation for the A/B pass, the shape typing for the next standards pass, and the shared namesOf and a chart axis tag were rejected. The design recheck adds that a stepped timeline would label a chart over steps as seconds, which only the class comment rules out. Round 2 added four notes, none of which breaks an acceptance criterion or a behaviour main had, so none is fixed. Service Layer's objectNote chooses each draft's tab with a ternary that repeats saveCalls' assignment. It stood so at the base, and it is the follow-up below. Foreign Key Mapping's control would prove nothing if it ran the whole spec file, but its command names the read-limit test with -t, and both logs show that test the one run, with eight skipped. No tooling test was said to pin the states drawing rule, but tools/studies.test.mjs's 'a states drawing of a model that runs reads that same module' matches the rule's message for a study drawn from another module, and fails if statesProblems is not called. The consistency recheck could run no probe; the compiles, lint and suites it asked for ran here. Round 2 changed no code, so no third round runs. The target's working tree, computed through a temporary index, is the round-2 reviewed tree itself.",
  "evidence": [
    "The three round-2 reports, in the launchpad's ignored review lane for this order, each record the reviewed tree aa01296dfa364e9285fd1967283a9cee4cfa4e17, the round-1 report it rechecked and the checkout unchanged across its episode.",
    "fkm-control/control.log and candidate.log: 9 tests, 1 run and 8 skipped, in each arm.",
    "GIT_INDEX_FILE=<temporary index> git add -A && git write-tree in the target worktree prints aa01296dfa364e9285fd1967283a9cee4cfa4e17, and the target's own index is unchanged."
  ],
  "rejected": [
    {
      "option": "Fix Service Layer's draft-to-tab ternary in this order",
      "reason": "The ladder admits a new round-2 finding only when it breaks an acceptance criterion or a behaviour main had; this one does neither and stood at the base."
    },
    {
      "option": "Run a third round",
      "reason": "Round 3 runs only when round 2's fixes change code again, and round 2 changed none."
    }
  ],
  "reopenWhen": "Service Layer's saveCalls changes which tab saves a draft, or the next standards pass over the enterprise batch runs.",
  "followup": "The next standards pass over the enterprise batch: Service Layer's objectNote reads each draft's tab from saveCalls, or from one table that saveCalls and the note share, instead of its own name === 'dawn' ternary, so the note cannot drift from the simulation's assignment."
}
```

## WO-039-D018

```json
{
  "id": "WO-039-D018",
  "date": "2026-11-08",
  "dispatch": "resume: next; the handoff's follow-up check",
  "decision": "Record the pending follow-up rows this change touches, as npm run plan -- followups --touching lists them at the handoff. Three are this order's own deferrals: FUP-5af094bffcaf27ef (D011), FUP-11889720fb205fb0 (D016) and FUP-b730246e24e0c264 (D017). Two match only a file name and stay as they stand. FUP-35187266d29e00dc (WO-026-D012) matches README.md and is WO-016's documents step for the /machinery placeholder. FUP-d97544c4254dadd4 (WO-026-D011) matches the WS-001 document and asks whether check:scripts should cover tools/*.mjs and tools/scripts/catalog/; this order adds no script and changes no script's name, so its condition has not occurred.",
  "evidence": [
    "npm run plan -- followups --touching at the handoff lists the five rows, all deferred, with their matched terms: WO-039 for the three, README.md for FUP-35187266d29e00dc and docs/workstreams/WS-001-dotln-angular.md for FUP-d97544c4254dadd4.",
    "The final reviews of WO-021 and WO-022 left FUP-35187266d29e00dc as a textual match, and WO-026's final review left FUP-d97544c4254dadd4 with its condition unmet."
  ],
  "rejected": [
    {
      "option": "Take up either WO-026 row here",
      "reason": "Neither seam is one this change opened, and the Boy Scout bound admits no document step of another order or a widened script check."
    }
  ],
  "reopenWhen": "The final review finds that this change opened either row's seam or met its condition."
}
```

## WO-039-D019

```json
{
  "id": "WO-039-D019",
  "date": "2026-11-08",
  "dispatch": "resume: final review",
  "decision": "Accept WO-039 at the candidate tree aa01296dfa364e9285fd1967283a9cee4cfa4e17, the tree VER-001 verified and both target review gates and the draft's CI judged, with every criterion met and no source change. Commit the reviewed tree on the target's wo-039 as three commits a reader can take one at a time: cb82e00 keeps a narrow register's state headings at two thirds of their size or breaks a longer name (the composites, their specs and the catalog document's families paragraph), c32ebd8 moves the states drawing rule into statesProblems, and eb22279 reshapes the sixteen presentations, the builder, the test kit, the chart axes, the model specs, Foreign Key Mapping's loop and the two documents. The first two commits pass the checks that cover them on their own exports (final-001/commit-1 and final-001/commit-2), and the third ends at the gated tree, whose passing rows the completion binds to it. Publish over the draft pull request 18 with the title ':recycle: Reshape the enterprise pattern studies into the example to copy', a gitmoji and a subject without a conventional type as rule 20 and the operator's preference ask, in place of the conventional title step 11 suggested and the draft carried; the target body is TARGET-PR.md, the records body PR.md and the reviewed notes RELEASE-NOTES.md, as WO-023-D020 names them. Settle the four follow-up rows the 2026-11-08 pass allocated to this order, WO-023-D012 (FUP-ddae97970891fbc1), D016 (FUP-54793e1f600d5c5d), D017 (FUP-762c13bca9cf4a31) and D019 (FUP-66323999ef4b69aa), on D003 to D013's evidence as VER-001 verified it; keep this order's three deferred rows (D011, D016 and D017) as they stand and leave the two rows that matched a file name alone, as D018 found them. Add the profile's implementation-map row for the enterprise presentations' lookup tables and the helpers they share, and read the workstream's two rows for this order as final-reviewed.",
  "evidence": [
    "The candidate tree through a temporary index is aa01296dfa364e9285fd1967283a9cee4cfa4e17; the executor's review gate row target-gate:dc474eef-8a2d-489a-85a8-33be0687f7b5 (18:54Z) and the verifier's target-gate:d766a76f-2e45-494d-9f8a-56a3e0bd2947 (19:19Z) record that tree; the draft's head 8968a30 carries it, and CI's checks, visual and title jobs passed on it.",
    "Inline reproductions at the candidate: grep -c 'switch (' prints 0 for all sixteen presentations and none holds default:; the test kit names neither old loader and 37 specs import loadModelStudy; no enterprise model spec names registerDrawing or states-register; grep -c symbol over catalog-rules.md prints 2 and grep -c statesProblems over check-studies.mjs prints 2; no eslint-disable, @ts-ignore, @ts-expect-error or @ts-nocheck was added; package.json and the lockfile are unchanged; a fresh shape audit equals shape-audit-after.json in every field but the time.",
    "The commit probes (final-001/commit-probe.mjs): on cb82e00's export the tools library's lib and spec configurations compile and the drawn-text, states-register and states component specs pass, in 0 h 0 min 18 s under the bounded wrapper; on c32ebd8's export the fourteen tooling test files pass and the study check reports 100 records and 0 problems.",
    "The whole target diff read: the sixteen presentations, simulations, entries and specs, the builder, the test kit and its thirty-seven consumers, the chart types and composites, the register and its text helper, the study check and the two documents; no defect found beyond the notes D016 and D017 record.",
    "The narrow-register frames of Service Layer and Record Set at 360, base and candidate, read as images: the base's Announced and Accepted cannot be read, the candidate's Annou-/nced, Acce-/pted and Refu-/sed read at a glance.",
    "worktree integrate WO-039 took in nothing: both mains stood where the handoff left them.",
    "The forge: pull request 18 is an open draft at 8968a30 with no review, comment or thread, mergeable and clean, and the title workflow decorated its conventional title with :recycle: at 19:33:04Z."
  ],
  "rejected": [
    {
      "option": "One commit for the whole change, as the draft carries it",
      "reason": "The narrow register and the check's home are coherent changes a reader can review alone; a reader who wants only the reshape reads the third."
    },
    {
      "option": "A commit for the Foreign Key Mapping repair alone",
      "reason": "Its spec and simulation read booleanParameter and the reshaped run description, so a repair-only commit would carry code that never existed; the reshape commit's message names the repair."
    },
    {
      "option": "Rerun the target review gate before the pass",
      "reason": "No source changed: the completion selects the gate row by the candidate tree and binds it to the reviewed commit, and two passing rows at the tree exist."
    },
    {
      "option": "Keep the draft's title",
      "reason": "It carries a conventional type after the gitmoji, which rule 20 and the operator's preference exclude; the final publish sets the title, and the workflow leaves a gitmoji-and-subject title as written."
    }
  ],
  "reopenWhen": "The operator's reading of the pull request finds a defect in the reshape, or the A/B testing pass reverses the heading decision."
}
```


Filed from the launchpad Launchpad (its tree at commit 62c22c96685902ea42e4a65e0d7c53b3fd850af0); this record's launchpad path was docs/evidence/WO-039/decisions.md, and its relative links resolve against that path there, not in this repository.
