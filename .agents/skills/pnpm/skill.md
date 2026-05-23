---
name: pnpm
description: Ensures AI agents and developers use pnpm (not npm or yarn) for all package management in this repo. Apply whenever installing, removing, or running packages.
license: MIT
metadata:
  author: tom
  version: "1.0.0"
---

# pnpm — Package Manager

This repo uses **pnpm** exclusively. `package.json` declares `"packageManager": "pnpm@9.0.0"`. Never use `npm` or `yarn`.

## Rules

### `pnpm-only` — CRITICAL

All package management commands must use `pnpm`. Replace `npm`/`yarn` equivalents:

| Instead of | Use |
|------------|-----|
| `npm install` | `pnpm install` |
| `npm install <pkg>` | `pnpm add <pkg>` |
| `npm install -D <pkg>` | `pnpm add -D <pkg>` |
| `npm run <script>` | `pnpm run <script>` (or `pnpm <script>`) |
| `npm uninstall <pkg>` | `pnpm remove <pkg>` |
| `npx <cmd>` | `pnpm dlx <cmd>` (one-off) or `pnpm exec <cmd>` (local bin) |
| `yarn add <pkg>` | `pnpm add <pkg>` |

### `pnpm-workspace-filter` — HIGH

This is a monorepo. Use `--filter` to scope commands to a specific package:

```bash
# Run script in one workspace
pnpm --filter @repo/ui build
pnpm --filter web dev

# Add dep to a specific workspace
pnpm --filter @repo/ui add react

# Add dep to repo root
pnpm add -D <pkg> -w
```

### `pnpm-no-lockfile-bypass` — HIGH

Never run `pnpm install --no-frozen-lockfile` in CI or agent contexts. If the lockfile is out of date, update it locally and commit `pnpm-lock.yaml`.

In local dev, `pnpm install` updates the lockfile automatically. Commit the result.

### `pnpm-check-install` — MEDIUM

After cloning or switching branches, always run `pnpm install` from repo root before running any scripts. pnpm installs all workspace packages in one pass.

### `pnpm-dlx-vs-exec` — MEDIUM

- `pnpm dlx <pkg>` — download and run a package without installing (like `npx`)
- `pnpm exec <cmd>` — run a binary from the local `node_modules/.bin`

Use `pnpm exec` for tools already in dependencies (e.g., `pnpm exec turbo build`). Use `pnpm dlx` for one-off tools not in the project.

## Quick Reference

| Task | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Add dep to package | `pnpm --filter <pkg> add <dep>` |
| Add dev dep to root | `pnpm add -D <dep> -w` |
| Remove dep | `pnpm --filter <pkg> remove <dep>` |
| Run script | `pnpm <script>` |
| Run in one workspace | `pnpm --filter <pkg> <script>` |
| One-off tool | `pnpm dlx <tool>` |
| Local bin | `pnpm exec <bin>` |
| List workspaces | `pnpm ls -r --depth -1` |

## Turbo Integration

Scripts in `package.json` route through Turbo. Prefer:

```bash
pnpm build       # runs turbo build across all packages
pnpm dev         # runs turbo dev across all packages
pnpm lint
pnpm check-types
```

Do not bypass Turbo by calling workspace scripts directly unless debugging a specific package.
