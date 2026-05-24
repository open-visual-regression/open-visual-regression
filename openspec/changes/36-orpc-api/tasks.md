# 36 · oRPC API

Gate: `POST /api/rpc/builds/createBuild` with valid API key creates build and returns buildId; missing/invalid key returns 401.

- [ ] 1.1 Install `@orpc/server`, `@orpc/next`, `zod` in `packages/api`
- [ ] 1.2 Create `packages/api/src/context.ts`: define `Context` type `{ user: User; apiKey: ApiKey }`
- [ ] 1.3 Create `packages/api/src/middleware.ts`:
  - Extract `Authorization: Bearer <key>` header
  - Call `auth.api.verifyApiKey({ key })` → attaches `{ user, key }` to context
  - Missing or invalid → throw `ORPCError` with code `UNAUTHORIZED`
- [ ] 1.4 Create `packages/api/src/routers/builds.ts`:
  - `createBuild` (authed):
    - Input: `{ projectSlug: z.string(), branch: z.string(), commitSha: z.string(), stories: z.string().array() }`
    - Resolve project by slug → `NOT_FOUND` if missing
    - Call `buildService.createBuild(...)`
    - Return `{ buildId: string }`
  - `getBuildStatus` (authed):
    - Input: `{ buildId: z.string() }`
    - Fetch build → `NOT_FOUND` if missing
    - Return `{ status: BuildStatus, reviewUrl: string | null }`
    - `reviewUrl = status !== "passed" ? `${BASE_URL}/projects/${project.slug}/builds/${buildId}` : null`
- [ ] 1.5 Create `packages/api/src/index.ts`: compose root router; export router type for client inference
- [ ] 1.6 Create `apps/web/app/api/rpc/[...path]/route.ts`: mount oRPC router with Next.js adapter
- [ ] 1.7 Remove `passWithNoTests: true` from `packages/api/vitest.config.ts`; unit tests:
  - Valid API key → `createBuild` succeeds; returns buildId
  - Missing key → UNAUTHORIZED
  - Invalid projectSlug → NOT_FOUND
  - `getBuildStatus`: returns correct status + reviewUrl (null when passed)
