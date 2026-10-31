# Events

Every event group in the workspace, under the tier it comes from: `app`, `navigation`,
`data-access` and `ui`.

Import from `@dotln-angular/events`. The library has no `testing` entry point.

Read [events, state and HTTP](../../../docs/dev-reference/architecture/events-and-state.md)
for which file holds which group, and [the state rules](../../../docs/ai-reference/state-rules.md)
for what may map to what.

Run `npx nx test events`, `npx nx lint events` and `npm run lint:hygiene`.
