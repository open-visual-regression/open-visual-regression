---
name: nvm
description: Ensures AI agents and developers use the correct Node.js version managed by nvm and .nvmrc. Apply whenever running Node.js commands, installing dependencies, or executing scripts in this repo.
license: MIT
metadata:
  author: tom
  version: "1.0.0"
---

# NVM — Node Version Management

This repo pins Node.js via `.nvmrc`. All agents and developers must use this version.

## Current Version

```
v24.16.0
```

Always verify by running: `node --version`

## Rules

### `nvm-load-before-run` — CRITICAL

Before running any Node.js command (`node`, `npm`, `pnpm`, `npx`, build scripts, test runners), ensure nvm has loaded the correct version:

```bash
# Load nvm and switch to the pinned version
nvm use
```

Or source nvm explicitly if not in shell profile:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use
```

### `nvm-verify-version` — HIGH

After `nvm use`, confirm the active version matches `.nvmrc`:

```bash
node --version   # must match .nvmrc
```

If it doesn't match, run `nvm install` to install the pinned version, then `nvm use` again.

### `nvm-no-system-node` — HIGH

Never use system Node (`/usr/bin/node`, `/usr/local/bin/node`) or a version from a different manager (fnm, volta, asdf) unless it resolves to the pinned version. Mismatched Node versions cause subtle build failures and incompatible lock file entries.

### `nvm-nvmrc-is-source-of-truth` — MEDIUM

`.nvmrc` at repo root is the single source of truth. Do not hard-code Node versions in scripts, CI configs, or Dockerfiles without referencing `.nvmrc`. Use `cat .nvmrc` to read the version programmatically.

```bash
NODE_VERSION=$(cat .nvmrc)
```

### `nvm-install-if-missing` — MEDIUM

If `nvm use` fails because the version is not installed:

```bash
nvm install   # reads .nvmrc automatically
nvm use
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `nvm use` | Switch to version in `.nvmrc` |
| `nvm install` | Install version from `.nvmrc` |
| `node --version` | Verify active version |
| `cat .nvmrc` | Read pinned version |
| `nvm ls` | List installed versions |
| `nvm current` | Show active version |

## CI / Cloud Agents

For non-interactive shells (CI pipelines, cloud agents) nvm may not auto-load. Source it explicitly at the top of any script:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --no-use 2>/dev/null || nvm install
nvm use
```

Or use the Node version from `.nvmrc` to configure the CI runtime directly (e.g., `actions/setup-node` with `node-version-file: .nvmrc`).
