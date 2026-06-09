# 36 · oRPC API

Gate: `router.setup.status()` returns `{ status: "pending" | "completed" }`; `router.setup.exec(input)` creates org + admin user; `/setup` redirects to `/login` when completed.

Architecture:
- `packages/api` is **contracts only** (`@orpc/contract`) — no framework imports, no handlers
- Router lives in `apps/web/lib/router/` — implements contracts via `implement(contract)`
- `"use server"` on router files makes `.actionable()` procedures callable as Next.js Server Actions directly — no `actions.ts` wrapper needed
- RSC pages call `router.*` directly; client components call `router.*` as Server Actions

- [x] 1 Add `@orpc/contract@^1.14.3` to `packages/api`; add `@orpc/server@^1.14.3` to `apps/web`
- [x] 2 `packages/api/src/contracts/setup.ts`: define `status` + `exec` contracts via `oc` from `@orpc/contract`; export Zod schemas for reuse
- [x] 3 `packages/api/src/contracts/index.ts`: root contract `{ setup }` export
- [x] 4 `packages/api/package.json`: exports only `"./contract": "./src/contracts/index.ts"`
- [x] 5 `apps/web/lib/router/os.ts`: `implement(contract).use(headers middleware)` — base `os` builder; context carries `headers: Headers`
- [x] 6 `apps/web/lib/router/setup.ts`: `"use server"` at top; `status` + `exec` handlers via `os.setup.*`; both call `.actionable()`
- [x] 7 `apps/web/lib/router/index.ts`: root `router = { setup }` export
- [x] 8 `apps/web/app/api/rpc/[...path]/route.ts`: `RPCHandler` (from `@orpc/server/fetch`); GET + POST → `handler.handle(request)`
- [x] 9 `apps/web/app/(unauthenticated)/setup/page.tsx`: calls `router.setup.status()` directly; redirects to `/login` if `status === "completed"`
- [x] 10 `SetupForm.tsx` uses `useServerAction(router.setup.exec, { interceptors: [onSuccess(() => navigate.push("/")), onError(...)] })` — no `actions.ts` wrapper; `status === "pending"` drives disabled state
- [x] 11 Integration tests: `apps/web/lib/router/__tests__/setup.integration.test.ts` — `setup.status` (4 cases) + `setup.exec` (4 cases)
