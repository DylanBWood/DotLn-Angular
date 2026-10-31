# Performance measurement and budget maintenance

Performance is part of implementation and review. Attribute a production
initial-bundle increase or warning before handoff. Remove avoidable work; for a
required cost, record its named dependency or behavior, measured delta,
alternatives and user-facing consequences. Maintain justified budgets in the
same authorized change. Routine diagnosis and calibration belong to the coding
session. Escalate an actual product or scope tradeoff, not every overrun.

## Three separate forms of evidence

1. **Placement.** `npm run check:bundle` walks static imports in production
   metadata. Tools, its catalog and menu must stay outside the initial graph;
   the menu must arrive with Tools so opening a facet adds no code-fetch
   waterfall. The browser regression independently navigates from Board and
   checks this behavior. Keep these structural assertions blocking.
2. **Cost.** Record initial raw bytes, estimated compressed size, package input
   attribution and route/data chunks against an equivalent base build. Raw
   output bytes and pre-final-optimization input attribution are different
   quantities. The actual journey also loads its lazy first-screen route; the
   build's initial group alone is not that journey's total. Compare raw and
   delivered bytes separately, including aggregate and largest component CSS.
3. **Experience.** `npm run perf:sample` measures the production app using
   the recorded local board fixture. It runs cold Board → Catalog, cold direct
   Catalog and warm Catalog reuse. It searches concepts, selects and clears
   facets, pages and opens a reading. Warm selection exercises keyboard input.
   Tests retain keyboard focus, axe and responsive acceptance separately.

The sampler runs sequentially with five samples per journey/profile. Desktop
is 1440 × 900 without artificial slowdown. The constrained surrogate is 390 ×
844, 4× CPU slowdown, 1.6 Mbit/s down, 750 kbit/s up and 150 ms added latency.
These are reproducible engineering assumptions, not a description of actual
users. Each journey uses a new browser context; the warm journey first loads
Catalog, returns to Board and revisits Catalog within that context. Its server
precompresses assets with gzip, uses a local fixture API, and has no service
worker. Use an otherwise idle runner; never run builds beside sampling.

Retain every sample, browser and Node version, runner platform/architecture,
profiles, fixture/build hashes and all resource timings. The report includes
median/range, each action's completion duration, LCP candidates, CLS session
windows, observed interaction maxima, long tasks and long animation frames
where supported. LCP is sampled before scripted input; it is not a soft-route
LCP. Event Timing's maximum here is **not INP**: it is a small scripted sample,
with a 16 ms reporting floor. No event above that floor is unknown, not zero.
Action completion includes automation/observation overhead and two animation
frames after the visible result. Neither metric proves total task completion
outside the scripted journeys. Missing supported entries remain visible in the
report. Timings are currently diagnostic, while journey assertions block.

## Calibrating and revising budgets

The inherited Angular limits (initial 500 kB warning / 1 MB error, component
styles 4/8 kB) are engineering guardrails with no established user-population
derivation. They are not Google recommendations. The build keeps them: when avoidable
growth took the initial bundle past the warning, the menu stack moved to the lazy
Tools path, the utility exports were curated and the limit stayed. Do not equate exit 0 with
absence of a performance regression, raise limits to silence a warning, or
split styles/delay usable controls just to meet a number.

For timing guards, retain an accepted reference build and accumulate at least
20 valid reference samples over at least three independent sessions under the
same profiles. As a provisional empirical envelope, retain the maximum valid
reference observation for each metric/journey/profile. Investigate an exceeded
envelope; call a regression repeatable when two fresh five-run candidate batch
medians exceed it. These sample counts and this envelope are project policy,
not a statistical confidence guarantee or Google requirement. Preserve excluded
samples and the concrete harness/environment failure that invalidated them.
If noise hides meaningful changes, repair the measurement rather than widen
the envelope. Recalibrate after material browser, toolchain, profile or hosting
changes by rerunning reference and candidate under matching conditions.

Set or revise byte limits using the accepted inventory, named required feature
costs and repeatable startup/interaction evidence. Attribute growth by package,
shared chunk, route, data and styles; inspect style recalculation and aggregate
CSS when a component warns. Record the old/new limit, cost, alternatives,
measurements and reopening condition. No fixed percentage headroom or automatic
baseline ratchet is prescribed. Stable improvements should tighten the reference.

When two credible implementations differ on a relevant axis, run one bounded
comparison without waiting for an operator prompt. Include both arms and the
whole effect: bytes, startup, interaction readiness, complexity and maintenance
where relevant. A smaller initial bundle achieved through an extra menu request
may be worse. A local map/filter spelling change without a composition or
measured benefit is not a performance optimization.

## External goals and limitations

Google's stable good thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1,
evaluated at the 75th percentile of real visits, separately for mobile and
desktop. Local samples cannot establish those population results. INP ends at
the next paint, so asynchronous useful-result time needs separate measurement.
CLS uses the largest session window and normally excludes shifts within 500 ms
of discrete input. [Search Central](https://developers.google.com/search/docs/appearance/core-web-vitals),
[Web Vitals](https://web.dev/articles/vitals), [INP](https://web.dev/articles/inp),
[CLS](https://web.dev/articles/cls).

As reviewed on 2026-10-25, Chrome 151's soft-navigation APIs and experimental
CrUX metrics can account for SPA navigations; stable CWV scoring has not yet
switched to them. Keep traditional and experimental measurements distinguishable
and recheck the current status when adopting field collection. CrUX needs
eligible real traffic and may not cover a private or low-traffic app. Consider
first-party RUM only when real use and its data policy justify it; this tool
ships no telemetry. [Soft navigations](https://developer.chrome.com/docs/web-platform/soft-navigations),
[2026-10-13 experiment](https://web.dev/blog/crux-experimental-soft-navs),
[CrUX methodology](https://developer.chrome.com/docs/crux/methodology).

Use traces to find the actual LCP element, long work, DOM/overlay growth and
layout shifts. Keep the search's 30-result page bound; processing all records can still
be expensive, so add indexing, yielding or workers only when measured work
supports them. Preserve usable narrow layouts and keyboard behavior while
optimizing. [Lab versus field](https://web.dev/articles/lab-and-field-data-differences),
[budget limits](https://web.dev/articles/performance-budgets-101),
[code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting),
[long tasks](https://web.dev/articles/optimize-long-tasks),
[LCP diagnosis](https://web.dev/articles/optimize-lcp),
[CLS diagnosis](https://web.dev/articles/optimize-cls).
