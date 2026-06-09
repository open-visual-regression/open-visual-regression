# 37 · CLI

Gate: `ovr snapshot storybook --dir ./storybook-static` with valid config creates a build, uploads the static dir, polls status, exits 0 on pass, exits 1 on needs_review or error.

The CLI is designed to support multiple snapshot sources. Storybook is the first; the architecture must not couple the `snapshot` command to Storybook-specific concepts — each source type is a subcommand with its own options and upload logic (e.g. `ovr snapshot vitest` in future).

## 1 · Package setup

- [ ] 1.1 Install `commander@^15`, `@orpc/client@^1.14.3`, `zod`, `tsup` in `apps/cli`; add `@ovr/api` as workspace dep
- [ ] 1.2 Update `apps/cli/package.json`:
  - `"build": "tsup"` (replaces `tsc`)
  - `"dev": "tsup --watch"`
  - keep `"bin": { "ovr": "dist/index.js" }`
- [ ] 1.3 Add `apps/cli/tsup.config.ts`:
  - entry: `src/index.ts`; format: `esm`; target: `node22`; clean: true
  - banner: `#!/usr/bin/env node` so the output is directly executable

## 2 · Config loader

- [ ] 2.1 Create `apps/cli/src/config.ts`:
  - Zod schema: `{ serverUrl: z.string().url(), apiKey: z.string().optional(), project: z.string().optional() }`
  - `loadConfig(configPath?: string)`: dynamically imports `ovr.config.ts` from CWD (or explicit path); validates with Zod; `apiKey` falls back to `OVR_API_KEY` env var; throws with a user-readable message if `serverUrl` or resolved `apiKey` are missing

## 3 · oRPC client

- [ ] 3.1 Create `apps/cli/src/client.ts`:
  - Import `contract` from `@ovr/api/contract`; build typed oRPC client via `createClient(contract)` with `RPCLink` pointed at `${serverUrl}/api/rpc` + `Authorization: Bearer ${apiKey}` header

## 4 · Snapshot command

- [ ] 4.1 Create `apps/cli/src/commands/snapshot/index.ts`: `snapshot` parent Command; subcommands are registered here
- [ ] 4.2 Create `apps/cli/src/commands/snapshot/storybook.ts`: `ovr snapshot storybook` subcommand
  - Options:
    - `--dir <path>` (required) — path to storybook-static output directory
    - `--project <slug>` — project slug; overrides `ovr.config.ts`
    - `--branch <name>` — overrides auto-detected branch
    - `--commit <sha>` — overrides auto-detected commit SHA
    - `--config <path>` — path to `ovr.config.ts` (default: `./ovr.config.ts`)
    - `--timeout <seconds>` — max seconds to wait for build result (default: `600`)
  - Implementation:
    1. Load config; resolve `project` from option or config; fail fast with clear message if missing
    2. Validate `--dir` exists and contains `index.json` (Storybook v7+); read and extract story IDs
    3. Auto-detect `branch` and `commitSha` from git; check CI env vars first (`GITHUB_REF_NAME` / `GITHUB_SHA`, `CI_COMMIT_BRANCH` / `CI_COMMIT_SHA`) before falling back to `git branch --show-current` / `git rev-parse HEAD`
    4. Call `builds.createBuild({ projectSlug, branch, commitSha, stories })`; server returns `{ buildId, uploadUrl }`
    5. Tar the storybook-static dir and PUT to `uploadUrl` (presigned RustFS URL)
    6. Poll `builds.getBuildStatus({ buildId })` every 5 s; print progress on each poll; enforce `--timeout`
    7. Terminal statuses: `passed` → print success + `process.exit(0)`; `needs_review` → print review URL + `process.exit(1)`; `error` → print error + `process.exit(1)`; timeout exceeded → print timeout message + `process.exit(1)`

## 5 · Entry point

- [ ] 5.1 Create `apps/cli/src/index.ts`: wire commander `Program`; register `snapshot` command; call `program.parseAsync()`

## 6 · Tests

- [ ] 6.1 Remove `passWithNoTests: true` from `apps/cli/vitest.config.ts`
- [ ] 6.2 Unit tests for `loadConfig`:
  - valid config → returns parsed config
  - missing `apiKey` with no env var → throws with message containing "OVR_API_KEY"
  - `OVR_API_KEY` env var fallback works
- [ ] 6.3 Unit tests for polling logic:
  - `passed` → resolves; `needs_review` → rejects with review URL; `error` → rejects; timeout → rejects with timeout message
