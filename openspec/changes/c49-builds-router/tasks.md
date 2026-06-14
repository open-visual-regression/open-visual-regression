# 49 · Builds Router

Gate: CLI can call `router.builds.createBuild` + `router.builds.getBuildStatus` with a valid API key; the build is created under the project the key is scoped to.

Depends on: `c36-orpc-api`, `c31-build-service`, `c50-api-key-project-scope`

- [x] 1 `packages/api/src/contracts/builds.ts`: `createBuild` contract (input: `{ branch, commitSha, targets: string[] }` — no project identifier; the target project is resolved from the API key, see task 4; output: `{ buildId: string, uploadUrl: string }` — `uploadUrl` is a presigned RustFS PUT URL the CLI uses to upload a tar.gz of the build artifact directory, e.g. the storybook-static directory) + `getBuildStatus` contract (input: `{ buildId: string }`; output: `{ status: BuildStatus, reviewUrl?: string }` — `reviewUrl` is included when `status` is `needs_review`)
  - `@ovr/services/builds.createBuild` was refactored to drop `artifactDir`/`uploadDirectory` and instead return a build whose `artifactPath` (`builds/{buildId}/artifact.tar.gz`, via new `getArtifactPath`) is used to generate the presigned upload URL via new `storage.getPresignedUploadUrl`

- [x] 2 `packages/api/src/contracts/index.ts`: add `builds` to root contract
  - Added to `packages/api/src/contracts/contract.ts` (the actual root contract file)

- [x] 3 `apps/web/lib/router/builds.ts`: `"use server"`; implement `createBuild` + `getBuildStatus` via `osApiKey.builds.*`
  - `osApiKey = os.use(async ({ context, next }) => { const bearer = context.headers.get("authorization")?.replace("Bearer ", ""); if (!bearer) throw new ORPCError("UNAUTHORIZED"); const result = await auth.api.verifyApiKey({ body: { key: bearer } }); if (!result.valid) throw new ORPCError("UNAUTHORIZED"); return next({ context: { apiKey: result } }); })`
  - Note: `verifyApiKey` takes `body: { key }` (not headers); Bearer token extracted manually from `Authorization` header
  - `createBuild` handler calls `createBuild` from `@ovr/services/builds` (returns `Result<string, "PROJECT_NOT_FOUND">`); on `{ status: "error" }` → `throw new ORPCError("NOT_FOUND")`
  - Implemented as `apiKeyMiddleware` in `apps/web/lib/router/middleware.ts` (alongside the other middleware), context exposes `apiKey` directly (better-auth's `verifyApiKey` already parses `metadata` to an object)

- [x] 4 Project scoping: parse `apiKey.key.metadata` (JSON string set at key creation, see `c50-api-key-project-scope`) → `{ projectId }`.
  - `createBuild`: use this `projectId` directly as the build's project — no project identifier is accepted from the CLI, so there's nothing to cross-check
  - `getBuildStatus`: resolve the build's `projectId`; if it doesn't match the key's `projectId`, throw `ORPCError("FORBIDDEN")`

- [x] 5 `apps/web/lib/router/index.ts`: add `builds` to router

- [x] 6 Integration tests: `apps/web/lib/router/__tests__/builds.integration.test.ts`
  - Valid API key passes through
  - Missing / invalid key → `UNAUTHORIZED`
  - `createBuild` creates DB records under the key's project + enqueues jobs
  - `getBuildStatus` returns correct status
  - `getBuildStatus` for a build belonging to project A, called with a key scoped to project B → `FORBIDDEN`
  - `apps/web/vitest.integration.globalSetup.ts` now also starts a Valkey container (needed for `enqueueCapture` during `createBuild`), mirroring `packages/services/vitest.integration.globalSetup.ts`
