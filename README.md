# open-visual-regression

Visual regression testing tooling for AI agents and CI pipelines. Monorepo built with Turborepo and pnpm workspaces.

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) — Node version manager
- [pnpm](https://pnpm.io) v9 — package manager (`npm install -g pnpm`)

## Setup

```sh
# 1. Use the pinned Node version
nvm install
nvm use

# 2. Install all workspace dependencies
pnpm install
```

## Development

```sh
# Start all apps in dev mode
pnpm dev

# Start a specific app
pnpm --filter web dev
pnpm --filter docs dev
```

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages and apps |
| `pnpm dev` | Start all in watch/dev mode |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Type-check all packages |
| `pnpm format` | Format with Prettier |

Use `--filter <name>` to scope any command to a single workspace:

```sh
pnpm --filter @repo/ui build
pnpm --filter web lint
```

## Workspace Structure

```
apps/
  web/                # Main Next.js app
  docs/               # Docs Next.js app
packages/
  ui/                 # Shared React component library (@repo/ui)
  eslint-config/      # Shared ESLint config (@repo/eslint-config)
  typescript-config/  # Shared tsconfig (@repo/typescript-config)
```

Each package is 100% [TypeScript](https://www.typescriptlang.org/).

## Node Version

Node version is pinned in `.nvmrc`. Always run `nvm use` before running commands.

In CI, use `node-version-file: .nvmrc` with your Node setup action:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version-file: .nvmrc
```

## Package Manager

This repo uses **pnpm** exclusively. Do not use `npm` or `yarn`. See `.agents/skills/pnpm/skill.md` for the full ruleset.

## Remote Caching

Turborepo supports remote caching via Vercel (free for all plans):

```sh
pnpm exec turbo login
pnpm exec turbo link
```

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
| `app-testing` | Standing up the stack locally and verifying a change end to end |

## Useful Links

- [Turborepo docs](https://turborepo.dev/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [nvm](https://github.com/nvm-sh/nvm)
