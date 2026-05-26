# 11 · Auth proxy

Gate: navigating to any protected route with zero users redirects to `/setup`; with users but no session redirects to `/login`; authenticated session passes through.

Proxy runs on **Node.js runtime** — DB access is available but avoided for performance. Setup detection uses a cookie set by the setup Server Action; `/setup` page itself does the authoritative DB check.

- [ ] 1.1 Create `apps/web/proxy.ts`:
  ```ts
  // Rules (in order):
  // 1. /api/auth/**, /api/rpc/**, /_next/** → pass through (manage their own auth)
  // 2. Cookie `ovr_setup_complete` absent AND path !== /setup → redirect /setup
  // 3. No session AND path not matching /login|/setup|/invite/** → redirect /login
  // 4. Pass through
  export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
  ```
  Use `auth.api.getSession({ headers: request.headers })` for session check.
  Better Auth reads session from cookie — no DB hit for session validation (optimistic check; DB is available if needed but keep it out of the hot path).

  Note: `/api/rpc/**` must pass through so CLI API-key requests reach the oRPC handler, which manages its own auth (task 36). Without this, machine-to-machine calls would be redirected to `/login`.

- [ ] 1.2 Note: the `ovr_setup_complete` cookie is set by the `/setup` Server Action (task 13-setup-page). Proxy just reads it — no write, no DB. If someone clears the cookie on an already-set-up instance they land on `/setup` which does a DB check and redirects to `/login`.

- [ ] 1.3 Unit tests for proxy logic (mock `getSession` return + mock cookie presence):
  - No cookie + any path → /setup (except /setup, /api/auth/*, /api/rpc/*)
  - Cookie present + no session + protected path → /login
  - Cookie present + valid session + protected path → pass through
  - /api/auth/** and /api/rpc/** always pass through regardless of cookie or session

- [ ] 1.4 Verify session check works: Better Auth stores session in `better-auth.session_token` cookie and validates it without a DB call. Note: Better Auth issue [#6360](https://github.com/better-auth/better-auth/issues/6360) documents a known inaccuracy in proxy `getSession` examples — if `getSession` returns null for valid sessions, verify that `request.headers` (not `await headers()`) is passed and that the session cookie name matches what Better Auth sets.
