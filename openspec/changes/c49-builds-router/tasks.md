# 49 · Builds Router

Gate: CLI can call `router.builds.createBuild` + `router.builds.getBuildStatus` with a valid API key scoped to the target project.

Depends on: `c36-orpc-api`, `c31-build-service`, `c50-api-key-project-scope`

- [ ] 1 `packages/api/src/contracts/builds.ts`: `createBuild` contract (input: `{ projectSlug, branch, commitSha, stories: string[] }`; output: `{ buildId: string, uploadUrl: string }` — `uploadUrl` is a presigned RustFS PUT URL the CLI uses to upload a tar.gz of the storybook-static directory) + `getBuildStatus` contract (input: `{ buildId: string }`; output: `{ status: BuildStatus, reviewUrl?: string }` — `reviewUrl` is included when `status` is `needs_review`)

- [ ] 2 `packages/api/src/contracts/index.ts`: add `builds` to root contract

- [ ] 3 `apps/web/lib/router/builds.ts`: `"use server"`; implement `createBuild` + `getBuildStatus` via `osApiKey.builds.*`
  - `osApiKey = os.use(async ({ context, next }) => { const bearer = context.headers.get("authorization")?.replace("Bearer ", ""); if (!bearer) throw new ORPCError("UNAUTHORIZED"); const result = await auth.api.verifyApiKey({ body: { key: bearer } }); if (!result.valid) throw new ORPCError("UNAUTHORIZED"); return next({ context: { apiKey: result } }); })`
  - Note: `verifyApiKey` takes `body: { key }` (not headers); Bearer token extracted manually from `Authorization` header

- [ ] 4 `createBuild` project-scope check: parse `apiKey.key.metadata` (JSON string set at key creation, see `c50-api-key-project-scope`) → `{ projectId }`. Look up the project by `input.projectSlug`; if no project matches, or `project.id !== projectId`, throw `ORPCError("FORBIDDEN")`. Apply the same check in `getBuildStatus` by resolving the build's `projectId` and comparing against the key's `projectId`.

- [ ] 5 `apps/web/lib/router/index.ts`: add `builds` to router

- [ ] 6 Integration tests: `apps/web/lib/router/__tests__/builds.integration.test.ts`
  - Valid API key passes through
  - Missing / invalid key → `UNAUTHORIZED`
  - `createBuild` creates DB records + enqueues jobs
  - `getBuildStatus` returns correct status
  - `createBuild` with a key scoped to project A + `projectSlug` for project B → `FORBIDDEN`
  - `getBuildStatus` for a build belonging to project A, called with a key scoped to project B → `FORBIDDEN`
