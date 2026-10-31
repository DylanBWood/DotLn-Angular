# Coding-session reference

- Use Node 26 and npm. Run `npm ci` before checks.
- Read `docs/dev-reference/workspace/conventions.md` before changing architecture.
- Read `docs/ai-reference/foundation-rules.md` when changing core, utilities,
  translations, providers or test kits.
- Generate every project with the installed Nx generator. Read its `--help`.
- When a new library gets its first code, replace its generated README with what it is
  for, how it is imported and tested and which document to read next, and its `testing`
  entry point's with what that exports and how to use it.
- Append the command, Nx version, created projects and result to
  `docs/dev-reference/workspace/generator-log.md`.
- Keep `apps/dotln` slim. Keep the shell standalone, zoneless and OnPush.
- Use signal APIs, `readonly` members and ECMAScript `#private`.
- Keep TypeScript on `~6.0.3` for Angular 22 and Vitest with UI and coverage aligned at 5.0.5 for MSW 3 peer compatibility.
- Preserve `.nx/cache` as the worktree-local cache. Set `NX_DAEMON=false` for gates.
- Tag each project with one `scope:*` and one `type:*`; obey root ESLint constraints.
- Add library aliases under `@dotln-angular/`. Avoid self-alias imports.
- Run `npm run lint`, `npm test`, `npm run build`, `npm run format:check`,
  `npm run test:tooling`, `npm run typecheck:e2e` and `npm run e2e`. Run
  `npm run lint:fixtures` only when changing lint policy.
- Install Chromium first with `npx playwright install --with-deps chromium`.
- Fix failures. Never disable a lint or type check to make a gate green.
- Record defects that cannot be fixed and make their boards visible.
- Keep generated outputs, caches, `.env` files and browser reports ignored.
- Update both reference roots when conventions or commands change.
- State every npm script and tool script's purpose and status in
  `docs/dev-reference/workspace/scripts.md`; `npm run check:scripts` refuses an npm
  script or a file directly under `tools/scripts` that the document does not name.
- Leave `docs/dotln/` record movement to the launchpad's final-review route.
- Write conventional commit subjects. Leave GitHub title decoration to the workflow.
- Keep branch publication, merges and repository settings within explicit authority.

See [the component taxonomy and rules](component-rules.md) for the UI, shell and board.

Read [state rules](state-rules.md) for typed events, stores, HTTP, persistence and mocks.

Read [sub-app rules](sub-app-rules.md) before adding a route or menu entry.

Read [catalog rules](catalog-rules.md) before changing tool data, transforms,
the source join, loading or the Tools reading surface.

Read [scene rules](scene-rules.md) before changing the scene, its engine or its
painters.

Read [performance policy](../dev-reference/architecture/performance.md) when a
change affects code placement, loading, rendering or interactions. Attribute
growth and compare credible alternatives before handing work to review.
