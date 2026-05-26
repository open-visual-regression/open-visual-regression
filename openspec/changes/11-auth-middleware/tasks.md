# 11 · Auth proxy

Gate: navigating to any protected route with zero users redirects to `/setup`; with users but no session redirects to `/login`; authenticated session passes through.

Next.js docs recommend against using proxy for auth. The proxy handles only the setup detection (a cookie read); the session guard lives in the authenticated layout — closer to the data, where it belongs.

- [x] 1.1 Create `apps/web/proxy.ts`:
  ```ts
  // Rules (in order):
  // 1. /api/auth/**, /api/rpc/**, /_next/** → pass through (manage their own auth)
  // 2. Cookie `ovr_setup_complete` absent AND path !== /setup → redirect /setup
  // 3. Pass through
  export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
  ```
  No session check in proxy — Next.js docs explicitly recommend against using proxy for auth.

- [x] 1.2 Note: the `ovr_setup_complete` cookie is set by the `/setup` Server Action (task 13-setup-page). Proxy just reads it — no write, no DB. If someone clears the cookie on an already-set-up instance they land on `/setup` which does a DB check and redirects to `/login`.

- [x] 1.3 Add session guard to `apps/web/app/(authenticated)/layout.tsx`:
  - Make the layout async
  - `auth.api.getSession({ headers: await headers() })` — null → `redirect("/login")`
  - This is the correct place for auth per Next.js guidance: close to the data, in a Server Component

- [x] 1.4 Unit tests:
  - proxy: setup cookie redirect rules; API pass-throughs; no session logic
  - layout: redirect to /login when session is null; render children when session is valid
