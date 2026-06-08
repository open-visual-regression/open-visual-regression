# 36 · oRPC API

Gate: `router.setup.status()` returns `{ status: "pending" | "completed" }`; `router.setup.exec(input)` creates org + admin user; `/setup` redirects to `/login` when completed; CLI can call `router.builds.createBuild` + `router.builds.getBuildStatus` with a valid API key.

## ✅ Phase 1 — oRPC Foundation

Architecture:
- `packages/api` is **contracts only** (`@orpc/contract`) — no framework imports, no handlers
- Router lives in `apps/web/lib/router/` — implements contracts via `implement(contract)`
- `"use server"` on router files makes `.actionable()` procedures callable as Next.js Server Actions directly — no `actions.ts` wrapper needed
- RSC pages call `router.*` directly; client components call `router.*` as Server Actions

- [x] 1.1 Add `@orpc/contract@^1.14.3` to `packages/api`; add `@orpc/server@^1.14.3` to `apps/web`
- [x] 1.2 `packages/api/src/contracts/setup.ts`: define `status` + `exec` contracts via `oc` from `@orpc/contract`; export Zod schemas for reuse
- [x] 1.3 `packages/api/src/contracts/index.ts`: root contract `{ setup }` export
- [x] 1.4 `packages/api/package.json`: exports only `"./contract": "./src/contracts/index.ts"`
- [x] 1.5 `apps/web/lib/router/os.ts`: `implement(contract).use(headers middleware)` — base `os` builder; context carries `headers: Headers`
- [x] 1.6 `apps/web/lib/router/setup.ts`: `"use server"` at top; `status` + `exec` handlers via `os.setup.*`; both call `.actionable()`
- [x] 1.7 `apps/web/lib/router/index.ts`: root `router = { setup }` export
- [x] 1.8 `apps/web/app/api/rpc/[...path]/route.ts`: `RPCHandler` (from `@orpc/server/fetch`); GET + POST → `handler.handle(request)`
- [x] 1.9 `apps/web/app/(unauthenticated)/setup/page.tsx`: calls `router.setup.status()` directly; redirects to `/login` if `status === "completed"`
- [x] 1.10 `SetupForm.tsx` uses `useServerAction(router.setup.exec, { interceptors: [onSuccess(() => navigate.push("/")), onError(...)] })` — no `actions.ts` wrapper; `status === "pending"` drives disabled state
- [x] 1.11 Integration tests: `apps/web/lib/router/__tests__/setup.integration.test.ts` — `setup.status` (4 cases) + `setup.exec` (4 cases)

## Phase 2 — Build Procedures (single PR)

- [ ] 1.12 `packages/api/src/contracts/builds.ts`: `createBuild` contract (input: `{ projectSlug, branch, commitSha, stories: string[] }`; output: `{ buildId: string }`) + `getBuildStatus` contract (input: `{ buildId: string }`; output: `{ status: BuildStatus }`)
- [ ] 1.13 `packages/api/src/contracts/index.ts`: add `builds` to root contract
- [ ] 1.14 `apps/web/lib/router/builds.ts`: `"use server"`; implement `createBuild` + `getBuildStatus` via `osApiKey.builds.*`; `osApiKey = os.use(async ({ context, next }) => { const bearer = context.headers.get("authorization")?.replace("Bearer ", ""); if (!bearer) throw new ORPCError("UNAUTHORIZED"); const result = await auth.api.verifyApiKey({ body: { key: bearer } }); if (!result.valid) throw new ORPCError("UNAUTHORIZED"); return next({ context: { apiKey: result } }); })` — note: `verifyApiKey` takes `body: { key }` (not headers); Bearer token extracted manually from `Authorization` header
- [ ] 1.15 `apps/web/lib/router/index.ts`: add `builds` to router
- [ ] 1.16 Integration tests: `apps/web/lib/router/__tests__/builds.integration.test.ts` — valid API key passes; missing/invalid key → UNAUTHORIZED; `createBuild` creates DB records + enqueues jobs; `getBuildStatus` returns correct status
