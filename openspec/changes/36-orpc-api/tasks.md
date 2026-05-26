# 36 · oRPC API

Gate: `GET /api/rpc/setup/getUserCount` returns `{ count: number }`; visiting `/setup` with existing users redirects to `/login`.

- [x] 1.1 Install `@orpc/server@0.27.0`, `@orpc/next@0.27.0` in `packages/api`
- [x] 1.2 Create `packages/api/src/context.ts`: define `Context` type
- [x] 1.3 Create `packages/api/src/routers/setup.ts`: `getUserCount` (public); returns `{ count: number }`
- [x] 1.4 Create `packages/api/src/index.ts`: root router + `Router` type export
- [x] 1.5 Create `apps/web/app/api/rpc/[...path]/route.ts`: `ORPCHandler` + `serve`
- [x] 1.6 Create `apps/web/lib/rpc.ts`: `createRouterClient` for RSCs
- [x] 1.7 `apps/web/app/(unauthenticated)/setup/page.tsx`: calls `rpc.setup.getUserCount()`; redirects to `/login` if `count > 0`

- [ ] 1.8 `createBuild` + `getBuildStatus` procedures (authed) — deferred until 37-cli
- [ ] 1.9 Unit tests
