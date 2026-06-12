# 30 · Storage image serving route

Gate: unauthenticated request → 401; authenticated request with wrong project → 403; authenticated + authorized → 302 to presigned URL.

- [x] 1.1 Create `apps/web/app/api/storage/[...path]/route.ts`:
  ```
  GET /api/storage/{projectId}/{rest...}
  ```
  - Add a `storage.getObject` oRPC contract (`packages/api/src/contracts/storage.ts`) with
    `.route({ method: "GET", path: "/{+path}", outputStructure: "detailed" })`, input
    `{ path: string }`, output `{ status: 302, headers: { location: string } }`
  - Implement `apps/web/lib/router/storage.ts`: `os.storage.getObject.use(authenticatedMiddleware)`
    reuses the same auth/tenancy pipeline as the other routers (no session → `UNAUTHORIZED` → 401)
  - Extract `projectId` from the leading segment of `input.path`
  - Verify `projectId` exists and user has access (any authenticated user can access any project in
    this MVP); throw `ORPCError("FORBIDDEN")` if project not found → 403
  - Call `storage.getPresignedUrl(input.path, 60)` and return `{ status: 302, headers: { location: url } }`
  - Mount via `OpenAPIHandler` (from `@orpc/openapi/fetch`) in the route file, prefixed at `/api/storage`

- [x] 1.2 Integration tests (real session via Testcontainers Postgres + real `storage.getPresignedUrl` via Testcontainers RustFS):
  - No session → 401
  - Unknown project → 403
  - Valid session + valid project → 302 with presigned URL in Location header

- [x] 1.3 Note: in a later PR (post-MVP), project membership check can be tightened. For MVP all authenticated users have access to all projects.
