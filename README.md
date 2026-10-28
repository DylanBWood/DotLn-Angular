# DotLn-Angular

An Nx integrated monorepo for the operator's Angular conventions and the DotLn
application. The first scaffold is a slim, standalone, zoneless shell with a
home heading, Vitest unit tests and a Playwright smoke test.

Use Node 26 and npm:

```sh
npm ci
npm start
```

Open the address printed by Nx. To run all checks:

```sh
npx playwright install --with-deps chromium
npm run lint
npm test
npm run build
npm run e2e
npm run format:check
npm run test:tooling
npm run typecheck:e2e
```

Start with the [developer reference](docs/dev-reference/README.md),
[workspace conventions](docs/dev-reference/workspace/conventions.md) and
[generator log](docs/dev-reference/workspace/generator-log.md).
Coding sessions use the [AI reference](docs/ai-reference/README.md).

Applications live in `apps/`; later feature and shared libraries will live in
`libs/`. The workspace uses Sass, ESLint flat configuration, Prettier, tagged
dependency boundaries and a cache local to each worktree. Pull requests run the
same checks in GitHub Actions, and a separate workflow adds the conventional
type's gitmoji to their titles.
