# Coding-session reference

- Use Node 26 and npm. Run `npm ci` before checks.
- Read `docs/dev-reference/workspace/conventions.md` before changing architecture.
- Read `docs/ai-reference/foundation-rules.md` when changing core, utilities,
  translations, providers or test kits.
- Generate every project with the installed Nx generator. Read its `--help`.
- Append the command, Nx version, created projects and result to
  `docs/dev-reference/workspace/generator-log.md`.
- Keep `apps/dotln` slim. Keep the shell standalone, zoneless and OnPush.
- Use signal APIs, `readonly` members and ECMAScript `#private`.
- Keep TypeScript on `~6.0.3` for Angular 22 and Vitest on the scaffold's selected 4.x line.
- Preserve `.nx/cache` as the worktree-local cache. Set `NX_DAEMON=false` for gates.
- Tag each project with one `scope:*` and one `type:*`; obey root ESLint constraints.
- Add library aliases under `@dotln-angular/`. Avoid self-alias imports.
- Run `npm run lint`, `npm test`, `npm run build`, `npm run format:check`,
  `npm run lint:fixtures`, `npm run test:tooling`, `npm run typecheck:e2e` and `npm run e2e`.
- Install Chromium first with `npx playwright install --with-deps chromium`.
- Fix failures. Never disable a lint or type check to make a gate green.
- Record defects that cannot be fixed and make their boards visible.
- Keep generated outputs, caches, `.env` files and browser reports ignored.
- Update both reference roots when conventions or commands change.
- Leave `docs/dotln/` record movement to the launchpad's final-review route.
- Write conventional commit subjects. Leave GitHub title decoration to the workflow.
- Keep branch publication, merges and repository settings within explicit authority.

See [the component taxonomy and rules](component-rules.md) for the UI, shell and board.
