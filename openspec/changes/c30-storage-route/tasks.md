# 30 · Storage image serving route

Gate: unauthenticated request → 401; authenticated request with wrong project → 403; authenticated + authorized → 302 to presigned URL.

- [ ] 1.1 Create `apps/web/app/api/storage/[...path]/route.ts`:
  ```
  GET /api/storage/{projectId}/{rest...}
  ```
  - Extract `projectId` from `params.path[0]`
  - Validate session via `auth.api.getSession`; no session → `Response(null, { status: 401 })`
  - Verify `projectId` exists and user has access (any authenticated user can access any project in this MVP); 403 if project not found
  - Reconstruct full storage key from `params.path.join("/")`
  - Call `storage.getPresignedUrl(key, 60)` → `Response.redirect(url, 302)`

- [ ] 1.2 Unit tests (mock `getSession` + mock `storage.getPresignedUrl`):
  - No session → 401
  - Unknown project → 403
  - Valid session + valid project → 302 with presigned URL in Location header

- [ ] 1.3 Note: in a later PR (post-MVP), project membership check can be tightened. For MVP all authenticated users have access to all projects.
