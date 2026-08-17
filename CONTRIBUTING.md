# Contributing

This repo is a [Turborepo](https://turborepo.dev/docs) monorepo managed with [pnpm](https://pnpm.io) workspaces. Each package is 100% TypeScript.

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm): Node version manager
- [pnpm](https://pnpm.io): package manager (`npm install -g pnpm`)
- [Docker](https://docs.docker.com/get-docker/): for the bundled Postgres, Redis, and object storage used in development and integration tests

## Setup

```sh
# 1. Use the pinned Node version
nvm install
nvm use

# 2. Install all workspace dependencies
pnpm install
```

## Development

The fastest loop is running app processes on the host against just the bundled data services in Docker:

```sh
# Infra only (Postgres, Valkey, rustfs)
docker compose up -d db valkey rustfs createbuckets

# App processes
pnpm --filter @ovr/db db:migrate
pnpm dev
```

`pnpm dev` starts every app in watch mode. Scope to one with `--filter`:

```sh
pnpm --filter @ovr/web dev
pnpm --filter @ovr/worker dev
```

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages and apps |
| `pnpm dev` | Start all in watch/dev mode |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Type-check all packages |
| `pnpm format` | Format with oxfmt |
| `pnpm test` | Run unit/integration tests |

Use `--filter <name>` to scope any command to a single workspace:

```sh
pnpm --filter @ovr/ui build
pnpm --filter @ovr/web lint
```

## Workspace Structure

```
apps/
  web/          # Next.js dashboard, auth, API (@ovr/web)
  worker/       # BullMQ worker: captures stories with Playwright, diffs them (@ovr/worker)
  cli/          # ovr CLI, published to npm (@open-visual-regression/cli)
  docs/         # Mintlify documentation site (@ovr/docs)
  bull-board/   # Optional queue inspector UI (@ovr/bull-board, compose "tools" profile)
  e2e/          # Playwright end-to-end suite against the full stack (@ovr/e2e)
packages/
  api/                # oRPC contracts shared between web and cli (@ovr/api)
  db/                 # Drizzle schema and migrations (@ovr/db)
  builds/             # Build domain logic (@ovr/builds)
  reviews/            # Diff review domain logic (@ovr/reviews)
  capture/            # Playwright-based Storybook story capture (@ovr/capture)
  storage/            # S3-compatible object storage client (@ovr/storage)
  queue/              # BullMQ queue definitions (@ovr/queue)
  git-status/         # GitHub commit status publishing (@ovr/git-status)
  logger/             # Shared logger (@ovr/logger)
  ui/                 # Shared React component library (@ovr/ui)
  mocks/              # Shared MSW mocks for tests (@ovr/mocks)
  testing/            # Shared test utilities / containers (@ovr/testing)
  typescript-config/  # Shared tsconfig (@ovr/typescript-config)
```

## Testing

`pnpm test` runs unit and integration tests (Vitest, with Testcontainers for Postgres/Valkey/rustfs where needed).

The end-to-end suite runs the full stack (web, worker, db, valkey, storage) and drives it through the CLI and the UI the way a real deployment would. See [`apps/e2e/README.md`](./apps/e2e/README.md) for how to run it locally.

## Node Version

Node version is pinned in `.nvmrc`. Always run `nvm use` before running commands. In CI, use `node-version-file: .nvmrc` with your Node setup action.

## Package Manager

This repo uses **pnpm** exclusively. Do not use `npm` or `yarn`. See `.agents/skills/pnpm/skill.md` for the full ruleset.

## AI Agent Skills

Skills in `.agents/skills/` provide context and rules for AI agents working in this repo:

| Skill | Purpose |
|-------|---------|
| `nvm` | Use correct Node version via nvm/.nvmrc |
| `pnpm` | pnpm-only package management in monorepo |
| `turborepo` | Turborepo task running and caching |
| `testing-best-practices` | Vitest + Testing Library patterns |
| `playwright-best-practices` | E2E testing with Playwright |
| `vercel-react-best-practices` | React/Next.js performance patterns |
| `pulling-images` | Fixing Docker image pulls in a restricted network (compose, testcontainers) |

## Useful Links

- [Turborepo docs](https://turborepo.dev/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [nvm](https://github.com/nvm-sh/nvm)
