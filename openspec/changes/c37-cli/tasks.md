# 37 · CLI

Gate: `ovr snapshot storybook --dir ./storybook-static` with valid config creates a build, uploads the static dir, polls status, exits 0 on pass, exits 1 on needs_review or error.

The CLI is designed to support multiple snapshot sources. Storybook is the first; the architecture must not couple the `snapshot` command to Storybook-specific concepts — each source type is a subcommand with its own options and upload logic (e.g. `ovr snapshot vitest` in future).

## 1 · Package setup

- [x] 1.1 Install `commander@^15`, `@orpc/client@^1.14.3`, `tsup` in `apps/cli`; add `@ovr/api` as workspace dep
  - `commander@^15` and `tsup` are installed; `@orpc/client` and `@ovr/api` workspace dep still needed
- [x] 1.2 Update `apps/cli/package.json`:
  - `"build": "tsup"` (replaces `tsc`)
  - `"dev": "tsup --watch"`
  - keep `"bin": { "ovr": "dist/index.js" }`
- [x] 1.3 Add `apps/cli/tsup.config.ts`:
  - entry: `src/index.ts`; format: `esm`; target: `node22`; clean: true
  - banner: `#!/usr/bin/env node` so the output is directly executable

## 2 · Config

Required values are passed as CLI flags. The API key is the only exception — it must come from the `OVR_API_KEY` environment variable since it cannot safely be passed as a flag.

`apps/cli/src/config.ts` reads `OVR_API_KEY` at startup and exits with a clear message if it is missing.

## 3 · oRPC client

- [x] 3.1 Create `apps/cli/src/client.ts`:
  - Import `contract` from `@ovr/api/contract`; build typed oRPC client via `createClient(contract)` with `RPCLink` pointed at `${serverUrl}/api/rpc` + `Authorization: Bearer ${apiKey}` header

## 4 · Snapshot command

- [x] 4.1 Create `apps/cli/src/commands/snapshot/index.ts`: `snapshot` parent Command; subcommands are registered here
- [ ] 4.2 Create `apps/cli/src/commands/snapshot/storybook.ts`: `ovr snapshot storybook` subcommand
  - Options (done — action is currently a stub):
    - `--dir <path>` (required) — path to storybook-static output directory
    - `--server-url <url>` (required) — OVR server URL
    - `--branch <name>` — overrides auto-detected branch
    - `--commit <sha>` — overrides auto-detected commit SHA
    - `--timeout <seconds>` — max seconds to wait for build result (default: `600`)
  - No `--project` option: the API key (`OVR_API_KEY`) is project-scoped (see `c50-api-key-project-scope`), so the server resolves the target project from the key itself
  - Implementation (not yet done):
    1. Read `OVR_API_KEY` from env; fail fast with a clear message if missing
    2. Validate `--dir` exists and contains `index.json` (Storybook v7+); read and extract story IDs
    3. Auto-detect `branch` and `commitSha` from git; check CI env vars first (`GITHUB_REF_NAME` / `GITHUB_SHA`, `CI_COMMIT_BRANCH` / `CI_COMMIT_SHA`) before falling back to `git branch --show-current` / `git rev-parse HEAD`
    4. Call `builds.createBuild({ branch, commitSha, stories })`; server returns `{ buildId, uploadUrl }`
    5. Tar the storybook-static dir and PUT to `uploadUrl` (presigned RustFS URL)
    6. Poll `builds.getBuildStatus({ buildId })` every 5 s; print progress on each poll; enforce `--timeout`
    7. Terminal statuses: `passed` → print success + `process.exit(0)`; `needs_review` → print review URL + `process.exit(1)`; `error` → print error + `process.exit(1)`; timeout exceeded → print timeout message + `process.exit(1)`

## 5 · Entry point

- [x] 5.1 Create `apps/cli/src/index.ts`: wire commander `Program`; register `snapshot` command; call `program.parseAsync()`

## 6 · Tests

- [x] 6.1 Remove `passWithNoTests: true` from `apps/cli/vitest.config.ts`
- [x] 6.2 Unit tests for config:
  - missing `OVR_API_KEY` → exits with clear message
- [ ] 6.3 Unit tests for polling logic:
  - `passed` → resolves; `needs_review` → rejects with review URL; `error` → rejects; timeout → rejects with timeout message
