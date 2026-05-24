# 11 · Auth middleware

Gate: navigating to any protected route with zero users redirects to `/setup`; with users but no session redirects to `/login`; authenticated session passes through.

Middleware runs on **Edge runtime** — no DB access. Setup detection uses a cookie set by the setup Server Action; `/setup` page itself does the authoritative DB check.

- [ ] 1.1 Create `apps/web/middleware.ts`:
  ```ts
  // Rules (in order):
  // 1. /api/auth/** and /_next/** → pass through
  // 2. Cookie `ovr_setup_complete` absent AND path !== /setup → redirect /setup
  // 3. No session AND path not matching /login|/setup|/invite/** → redirect /login
  // 4. Pass through
  export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
  ```
  Use `auth.api.getSession({ headers: request.headers })` for session check.
  Better Auth reads session from cookie — edge-compatible (no DB hit for session validation).

- [ ] 1.2 Note: the `ovr_setup_complete` cookie is set by the `/setup` Server Action (task 13-setup-page). Middleware just reads it — no write, no DB. If someone clears the cookie on an already-set-up instance they land on `/setup` which does a DB check and redirects to `/login`.

- [ ] 1.3 Unit tests for middleware logic (mock `getSession` return + mock cookie presence):
  - No cookie + any path → /setup (except /setup, /api/auth/*)
  - Cookie present + no session + protected path → /login
  - Cookie present + valid session + protected path → pass through
  - /api/auth/** always passes through regardless of cookie or session

- [ ] 1.4 Verify session check works: Better Auth by default stores session in `better-auth.session_token` cookie and validates via the secret. If edge validation fails, fall back: move session check into `(app)/layout.tsx` as a Server Component guard using Node runtime.
