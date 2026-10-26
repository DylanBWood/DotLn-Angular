# Applying a concept in more than one place

A concept is not used up by its first application. The catalog should help us
notice useful connections across the app, source code, agent coordination,
working processes and human interaction. An existing implementation is evidence
for one application and a starting point for further inquiry.

This principle comes from the operator's WO-014 clarification. The catalog's
closed transform vocabulary describes toy operations. It is not the boundary of
what the catalog can teach us. Metaphors, rules of practice and ways of examining
a system can be useful without an executable transform.

## The UIFA engineer's workshop

One purpose of the broader UI is to help a UIFA engineer turn their understanding
of behavior into actor compositions they can inspect, try and refine. Core's
[UIFA role definition](https://github.com/DylanBWood/DotLn/blob/main/docs/product/13-uifa-roles.md)
places the mapping judgment with the engineer: identities, roles, supports,
relationships, cadences and temporal structure should express the behavior they
intend. The catalog supplies candidate material for that judgment. A generated
analog is a proposal to examine, not an engineering decision already made.

The intended workshop lets an engineer recognize a pattern from experience,
choose a model, vary its mechanisms and circumstances, compare behavior and cost,
and preserve useful compositions with their scenarios and limits. Reusable pieces
and custom compositions both belong. A tester probes the situations that matter;
the engineer retains authorship of the composition. People can contribute working
shapes from many domains, including situations a mining model would not think to
try. The UI should make those ideas tangible enough to discuss and experiment with.

WO-014 delivers the catalog foundation and this guidance. Scene execution,
composition editing, replay and promotion belong to later capabilities. The app's
sandbox informs DotLn through its declared promotion route; browsing this catalog
does not change core control records or equip a live actor.

## A repeatable mapping pass

Metaphor, analogy, simile, anthropomorphic representation and simulation are
deliberate tools for making abstract ideas understandable and manipulable. Choose
the representation that makes an experiment easiest to work with. A soldier scene
offers familiar actions such as selecting, grouping, directing and interrupting;
the relationships explored may later apply to agents, software, organizations or
human interactions. The scene's surface context need not remain the context of
the eventual application.

Keep four things distinguishable: the idea or relationship being explored, the
representation used to explore it, the experiment and differences observed, and
the correspondences to other contexts. Preserve those correspondences so a result
can travel with its meaningful relationships intact. The operator described this
as isomorphism of ideas. A primary catalog scene is a useful starting representation,
not an exclusive domain assignment.

Start with a concept, including concepts already applied somewhere. Describe its
relevant mechanism or rule in generic terms, then examine several target areas:

- App behavior and presentation: what changes for someone using the app?
- Code and architecture: what changes in structure, dependencies or maintenance?
- Agent interactions: what changes in assignment, coordination, feedback or handoff?
- Working processes: what changes in planning, review, recovery or learning?
- Human interaction: what changes in understanding, control or decisions?

For each promising application, record the target, the concrete correspondence,
the expected effect, an observable signal, and the assumptions or limits. State
what would disprove the mapping. A shared word alone is weak evidence; a mechanism
that predicts a useful difference is stronger. Several different applications
may survive for the same source concept. An area with no useful mapping is an
honest result, not a gap that must be filled.

An executable binding is a separate question. A typed catalog row must describe
an observable toy effect using the closed transform contract. A useful application
may instead remain untyped or accompany a background row. Those statuses classify
the representation; they do not rank the concept's importance.

## Examples proposed by the operator

The Boy Scout rule can guide a bounded code cleanup, a clearer agent handoff, or
the repair of a confusing working procedure. The mechanism is leaving a local
area easier for the next person or agent to use. Check the effect in that area;
avoid turning permission for a small improvement into an unbounded rewrite.

Domain blindness motivates the pass itself: a team may understand and use an idea
in one area while overlooking it elsewhere. Revisit a successful application and
ask which neighboring areas face a similar problem, then test the correspondence.
The existing application should not mark the whole concept as finished.

The operator's antifragility example compares network behavior with subagent
interactions. Recovery after a failed request and improvement because of a failed
request are different claims. Likewise, replacing a failed worker may restore
progress; learning from that failure and measurably improving later assignments
could support a stronger claim. Record a before/after signal and costs before
calling either area antifragile. These are proposed applications, not claims about
the current app's capabilities or verified interpretations of a book.

## How work orders and reports should communicate this

System traps and anti-patterns are also a diagnostic vocabulary. The operator
specifically called out Meadows' system traps and their existing place in DotLn's
working practice. Use them to ask where an application, agent arrangement,
process or process for changing processes may have gone wrong, and where a useful
intervention is possible. An anti-pattern need not become a runnable behavior to
earn a place in the catalog.

A diagnostic mapping records an observed symptom, a suspected sustaining
mechanism or feedback relationship, a possible intervention, and evidence that
would strengthen or weaken the diagnosis. Distinguish observation from hypothesis.
Reapply the questions to the intervention and to the process that chose it: a
repair or review procedure may recreate the same trap at another level. Bound
that inquiry to a concrete decision; naming more levels is not itself progress.
The vocabulary should make disagreement and investigation more precise, rather
than make an attractive label stand in for evidence.

Report executable coverage and conceptual applications separately. A count of
typed rows measures compatibility with the current transform vocabulary; it does
not measure the number of useful concepts. Name which source batches and target
areas were examined, give representative applications and their limits, and state
where further mining remains. Preserve rejected mappings with their reasons when
that prevents repeating an attractive but misleading analogy.

Use the existing catalog's optional role analog for a concise practical
application. It can appear on any status. Its single clause and role list do not
represent an exhaustive inventory of applications. Future work needing several
independent mappings per concept should propose an explicit schema extension,
keeping source identity, mapping hypothesis and executable binding distinct.

## RxJS as a modelling language

The GEB batch supplies another exploration method: transformations of a pattern.
Its catalog entries include canon transformations (`geb1:8`), retrograde dialogue
(`geb1:186`), augmentation (`geb2:295`), inversion (`geb2:296`) and their combination
(`geb2:297`). Their current practical applications concern varying order, pace,
direction and composition while examining preserved properties. They remain
untyped in the toy contract and still supply useful engineering material.

The operator's musical example broadens this into a design exercise: repeat a
pattern, change its pace, reverse a relation, exchange roles, layer patterns, or
vary one feature slightly. Compare what survives and what changes. A model is a
reusable starting point; variants can reveal both its structure and applications
in another context. Record the transformation and observed difference alongside
the starting model. These operations are proposals for exploration, not newly
implemented scene transforms or a claim that every transformation is meaningful
for every model.

The operator proposes repeatedly asking how a phenomenon can be modeled in RxJS.
This applies well beyond the catalog workflow: a psychological concept, a movie scene, an
interaction between people, an organization, or a working process. Repeat the
question at different perspectives and scales. Identify events, observers,
interpretation, evolving state, timing, concurrency, cancellation and feedback.
Several models of the same phenomenon may be useful for different questions.

For a conversation, one model might examine attention and interruption, another
how accumulated context changes interpretation, and another how each response
changes the next exchange. Compare those structures with a network or agent
team. A similarity can suggest a new application, an intervention or a question
to investigate. Record what each model preserves, omits, predicts and fails to
explain. Do not reduce people or psychological phenomena to a claim that the
chosen stream model fully explains them.

An unbounded space of models can coexist with recurring structural families.
Convergence may reveal shared relationships in the phenomena, or limitations
imposed by our modelling vocabulary. Expressibility with the same operator is
not sufficient evidence for a universal truth. Seek counterexamples, alternative
representations and predictions outside the example that suggested the mapping.
Preserve the conditions under which a model or intervention works. This is a
continuing mining question; WO-014 does not claim to have answered it universally.

The catalog workflow is one example of this broader exercise. Treat an inquiry as a
concept, a target context and an evidence revision. Finite asynchronous inquiries
can be observable jobs; bounded `mergeMap` concurrency allows independent areas
to progress, while an event reducer using `scan` maintains the current findings.
Keep request, finding, failed-attempt, experiment-result and reconsideration
events explicit. Handle an individual job's failure inside that job so unrelated
inquiries can continue. Retain revisions so a late result cannot overwrite newer
evidence for the same concept and context.

That inquiry process itself emits useful observations: queue growth, repeated
failures, ignored findings or recurring workarounds. Those observations can
motivate diagnostic mappings about the process and feed an explicitly admitted
new inquiry. Do not create an unbounded automatic loop. Concurrency limits active
jobs, not queued work; admission, retention, cancellation and work budgets need
their own policies. Retrying restores an opportunity to finish; a stronger
learning claim needs retained evidence, a changed decision and observed later
improvement. `scan` can represent that evolving state but cannot establish the
claim by itself.

This is a design exercise, not a new runtime service. The operator behavior was
checked against the installed RxJS source and current official documentation:
[higher-order observables](https://github.com/ReactiveX/rxjs/blob/7.8.2/docs_app/content/guide/higher-order-observables.md),
[scan](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/scan.ts),
and [merge scheduling](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/mergeInternals.ts).

## Graduation back into DotLn

Some discoveries and configurations can become primary skills, supports,
interaction patterns or other reusable platform compositions. The exploration
loop therefore connects an idea, an understandable representation, experiments
and variants, evidence-backed findings, and a candidate change to DotLn behavior.

Preserve enough for that handoff: intended behavior, the model or configuration,
the transformation tried, scenarios and comparisons, observed differences, costs,
conditions of usefulness, limits and source lineage. Preserve the relationship
that made the discovery useful even when its platform implementation uses a
different representation from the toy. A demonstration's persuasive appearance
does not by itself establish readiness for promotion; the findings let the
engineer, tester and platform implementation work assess that readiness.

The app's declared route informs DotLn through proposals on the core repository.
WO-014 records candidate material and guidance; later promotion work can turn a
reviewed discovery into that proposal, then the platform's own planning,
implementation and verification can establish the primary skill, support or
interaction. The catalog browser itself has no live integration or control-record
write. The operator's clarification establishes this graduation endpoint without
adding such an integration to the current order.

The likely authoring destination is the platform's primary skills, supports and
compositions. Those higher-level definitions can be candidates for compilation
to a common intermediate representation (IR). A catalog analogy, a toy scene,
an RxJS model, a skill definition and its compiled form serve different purposes;
their relationships need to be made explicit. The operator's clarification does
not require every discovery to be authored directly in IR or to introduce a new
IR construct. Some discoveries may change a composition of existing pieces.

Core's [IR compatibility document](https://github.com/DylanBWood/DotLn/blob/main/docs/product/10-ir-compatibility.md)
is relevant when an artifact crosses a declared compilation, interchange or
version boundary. It supplies questions about identity, semantic preservation,
transformations, compatibility and evidence. It does not by itself decide the
authoring format or repository for these experiments. The candidate boundary is
app-owned exploration and presentation, platform-owned reusable behavior
definitions and compilation, and an explicit mapping between them. A later
planning pass should check that boundary against actual artifacts and core's
current contracts.

## Targeted follow-up

WO-014 establishes the catalog, documents this method and performs a bounded
metaphor pass over selected batches. A later planning pass can nominate a focused
cross-area review of all eight batches, including already mapped concepts. It
should preserve ids, assess multiple target areas and modelling perspectives, independently challenge the
strongest proposed correspondences, record counterexamples, and decide whether
the current single-analog representation is sufficient. It should add only the
data model or UI needed to preserve those findings. No new work order, transform
or execution capability is authorized merely by this follow-up description.

That pass should also make the ownership route understandable to the operator:
which ideas to present to DotLn-Angular, which to DotLn, and which need a coordinated
proposal. Trace one concrete discovery through an app experiment, a candidate
primary skill or support, its composition and any compilation target. Identify
the authoritative definition, editable projections, evidence and loss at each
step before choosing storage or an interchange format. Preserve WO-017's
separate executable RxJS source requirement when considering that example;
shared semantics alone do not establish that two source artifacts are identical.

See [catalog architecture](catalog.md) and [catalog rules](../../ai-reference/catalog-rules.md).
