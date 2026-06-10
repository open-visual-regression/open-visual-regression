# 49 · Builds Router

Gate: CLI can call `router.builds.createBuild` + `router.builds.getBuildStatus` with a valid API key; the build is created under the project the key is scoped to.

Depends on: `c36-orpc-api`, `c31-build-service`, `c50-api-key-project-scope`

- [ ] 1 `packages/api/src/contracts/builds.ts`: `createBuild` contract (input: `{ branch, commitSha, stories: string[] }` — no project identifier; the target project is resolved from the API key, see task 4; output: `{ buildId: string, uploadUrl: string }` — `uploadUrl` is a presigned RustFS PUT URL the CLI uses to upload a tar.gz of the storybook-static directory) + `getBuildStatus` contract (input: `{ buildId: string }`; output: `{ status: BuildStatus, reviewUrl?: string }` — `reviewUrl` is included when `status` is `needs_review`)

- [ ] 2 `packages/api/src/contracts/index.ts`: add `builds` to root contract

- [ ] 3 `apps/web/lib/router/builds.ts`: `"use server"`; implement `createBuild` + `getBuildStatus` via `osApiKey.builds.*`
  - `osApiKey = os.use(async ({ context, next }) => { const bearer = context.headers.get("authorization")?.replace("Bearer ", ""); if (!bearer) throw new ORPCError("UNAUTHORIZED"); const result = await auth.api.verifyApiKey({ body: { key: bearer } }); if (!result.valid) throw new ORPCError("UNAUTHORIZED"); return next({ context: { apiKey: result } }); })`
  - Note: `verifyApiKey` takes `body: { key }` (not headers); Bearer token extracted manually from `Authorization` header

- [ ] 4 Project scoping: parse `apiKey.key.metadata` (JSON string set at key creation, see `c50-api-key-project-scope`) → `{ projectId }`.
  - `createBuild`: use this `projectId` directly as the build's project — no project identifier is accepted from the CLI, so there's nothing to cross-check
  - `getBuildStatus`: resolve the build's `projectId`; if it doesn't match the key's `projectId`, throw `ORPCError("FORBIDDEN")`

- [ ] 5 `apps/web/lib/router/index.ts`: add `builds` to router

- [ ] 6 Integration tests: `apps/web/lib/router/__tests__/builds.integration.test.ts`
  - Valid API key passes through
  - Missing / invalid key → `UNAUTHORIZED`
  - `createBuild` creates DB records under the key's project + enqueues jobs
  - `getBuildStatus` returns correct status
  - `getBuildStatus` for a build belonging to project A, called with a key scoped to project B → `FORBIDDEN`
