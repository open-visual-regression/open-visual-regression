# 49 · Builds Router

Gate: CLI can call `router.builds.createBuild` + `router.builds.getBuildStatus` with a valid API key.

Depends on: `c36-orpc-api`, `c31-build-service`

- [ ] 1 `packages/api/src/contracts/builds.ts`: `createBuild` contract (input: `{ projectSlug, branch, commitSha, stories: string[] }`; output: `{ buildId: string, uploadUrl: string }` — `uploadUrl` is a presigned RustFS PUT URL the CLI uses to upload a tar.gz of the storybook-static directory) + `getBuildStatus` contract (input: `{ buildId: string }`; output: `{ status: BuildStatus, reviewUrl?: string }` — `reviewUrl` is included when `status` is `needs_review`)

- [ ] 2 `packages/api/src/contracts/index.ts`: add `builds` to root contract

- [ ] 3 `apps/web/lib/router/builds.ts`: `"use server"`; implement `createBuild` + `getBuildStatus` via `osApiKey.builds.*`
  - `osApiKey = os.use(async ({ context, next }) => { const bearer = context.headers.get("authorization")?.replace("Bearer ", ""); if (!bearer) throw new ORPCError("UNAUTHORIZED"); const result = await auth.api.verifyApiKey({ body: { key: bearer } }); if (!result.valid) throw new ORPCError("UNAUTHORIZED"); return next({ context: { apiKey: result } }); })`
  - Note: `verifyApiKey` takes `body: { key }` (not headers); Bearer token extracted manually from `Authorization` header

- [ ] 4 `apps/web/lib/router/index.ts`: add `builds` to router

- [ ] 5 Integration tests: `apps/web/lib/router/__tests__/builds.integration.test.ts`
  - Valid API key passes through
  - Missing / invalid key → `UNAUTHORIZED`
  - `createBuild` creates DB records + enqueues jobs
  - `getBuildStatus` returns correct status
