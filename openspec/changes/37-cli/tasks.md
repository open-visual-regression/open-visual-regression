# 37 · CLI

Gate: `ovr snapshot --storybook-dir ./storybook-static` with valid config creates build, polls status, exits 0 on pass / exits 1 on needs_review or error.

- [ ] 1.1 Install `commander`, `@orpc/client`, `zod`, `tsup` in `apps/cli`
- [ ] 1.2 Create `apps/cli/src/config.ts`:
  - Zod schema: `{ serverUrl: z.string().url(), apiKey: z.string().optional() }`
  - `loadConfig()`: reads `ovr.config.ts` from CWD using dynamic `import()`; validates with Zod; `apiKey` falls back to `process.env.OVR_API_KEY` if not in config; throws with helpful message if missing
- [ ] 1.3 Create `apps/cli/src/client.ts`:
  - Build oRPC client from `@ovr/api` router type + `serverUrl` + `Authorization: Bearer` header
- [ ] 1.4 Create `apps/cli/src/commands/snapshot.ts`:
  - `ovr snapshot --storybook-dir <path>` (required option)
  - Validate dir exists; read `stories.json` → extract story IDs array
  - Call `createBuild({ projectSlug, branch: git branch, commitSha: git HEAD, stories })`
  - Upload storybook static dir to RustFS via `@ovr/storage` client (uses `STORAGE_*` env or config)
  - Poll `getBuildStatus` every 5s; print progress line each poll
  - Terminal statuses: `passed` → print "✓ pass" → `process.exit(0)`; `needs_review` → print review URL → `process.exit(1)`; `error` → print "build failed" → `process.exit(1)`
- [ ] 1.5 Create `apps/cli/src/index.ts`: wire commander program; add `snapshot` command
- [ ] 1.6 Update `apps/cli/package.json`:
  - `"build": "tsup src/index.ts --format cjs --dts --out-dir dist"`
  - `"bin": { "ovr": "dist/index.js" }`
- [ ] 1.7 Unit tests:
  - `loadConfig`: valid config → returns; missing apiKey with no env → throws; env fallback works
  - Polling: passed → exit 0; needs_review → prints URL + exit 1; error → exit 1
