# Component and console rules

Apply these rules together with [foundation rules](foundation-rules.md) and the
[component taxonomy](../dev-reference/architecture/component-taxonomy.md).

- R1: Keep `fragments/`, `templates/`, `composites/` and `layouts/` free of injection and domain dependencies. Pass inputs down and intent outputs up. Only `wrappers/` may inject platform behavior.
- R2: Forward an output at most twice before a container handles it. Split an overgrown container or pass a lexical template when the presentation hierarchy needs more nesting.
- R3: Import Angular Aria and CDK only under `wrappers/` or `libs/shared/ui/src/lib/provide-dotln-ui.ts`. Keep the public API house-owned.
- R4: Keep containers thin: inject a facade, expose its one `vm` signal, and map outputs to its intents. Put derivation in the facade or pure functions.
- R5: Put every component under its declared role directory. Location selects its lint constraints.
- R6: Concentrate behavioral tests on facades, mappers and wrappers. Use DOM assertions for presentation contracts and browser tests for real keyboard/focus behavior.
- R7: Fix an encountered defect within scope or record a concrete follow-up and reopening condition; never hide it with a suppression or a passing stub.
- H1: Check `viewModelVersion` before rendering panels. Show unavailable and the supplied version when unsupported.
- H2: Preserve `known`, `unknown` and `unavailable` visibly and textually. Keep unavailable sections and sources with their explanation.
- H3: Render `cell.label`; address the cell with `cell.key` within its row. Never replace an absent value with a fabricated zero.
- H4: Resolve links only against ids in the current board. Switch panels or disclose evidence and focus the target. Never execute a target or turn it into an external URL.
- H5: Treat the projection as evidence, never lifecycle authority. Import no command, event or transport surface into the recorded-board feature.
- G1: Preserve landmarks, skip navigation, keyboard paths and WCAG 2.2 AA checks. Test native dialog and menu focus in a real browser.
- G2: Animate transitions only, honor reduced motion and give every state a text equivalent. Do not animate idle activity or skeletons.
- G3: Translate host-authored strings through `t`. Render board titles, labels, questions and values as source data under `translate="no"`; this marker does not permit literals to bypass translation.
- G4: Put appearance in CSS tokens and `[data-skin]` overrides. Ship only the plain skin here; keep domain state free of CSS class strings.
- G5: Use native emoji for glyphs with a text equivalent. Do not add a vendor icon system.
- G6: Use fluid label/value/status lists, wrapping long values without a fixed page-width cap. Keep true values and explicit unknowns visible.

Run the existing unit, lint, fixture, browser and visual targets after changes.
Read and inspect new screenshot baselines before accepting them. Do not update a
baseline solely to make an assertion pass.
