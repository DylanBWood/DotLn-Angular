# DotLn-Angular

An Nx integrated monorepo that shows how the operator builds Angular, and the sandbox
where their ideas first become toys. One slim, standalone, zoneless application,
`apps/dotln`, holds the shell around lazy feature libraries, with Vitest unit tests and
Playwright end-to-end tests.

The shell's menu has three groups:

| Menu group | Routes                     | What is there                                                                                  |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Scene      | `/scene`, the app's root   | The soldier scene: twenty units, the steering and formation tools the engine runs, instruments |
| Machinery  | `/board`, `/machinery`     | The actor board over the app's own mocked HTTP API, and a placeholder for the machinery view   |
| Tools      | `/tools/catalog`, `/tools` | A catalog of works, read concept by concept, and the home page above it                        |

Use Node 26 and npm:

```sh
npm ci
npm start
```

Open the address printed by Nx; the root opens the scene. No environment file, external
API or account is needed. To run the main checks:

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

Read on:

- The [developer reference](docs/dev-reference/README.md), for people, finds the document
  for a convention and the file that demonstrates it.
- The [AI reference](docs/ai-reference/README.md) holds short rules and commands for
  coding sessions.
- The [workspace scripts](docs/dev-reference/workspace/scripts.md) list every command with
  its purpose and which gate runs it.
- The [workspace conventions](docs/dev-reference/workspace/conventions.md) state the house
  rules.
- The [generator log](docs/dev-reference/workspace/generator-log.md) records how each
  project was created.

Applications live in `apps/`; feature and shared libraries live in `libs/`. The
workspace uses Sass, ESLint flat configuration, Prettier, tagged
dependency boundaries and a cache local to each worktree. Pull requests run the
checks above, the bundle check and the visual suite in GitHub Actions, and a separate
workflow adds the conventional type's gitmoji to their titles.
