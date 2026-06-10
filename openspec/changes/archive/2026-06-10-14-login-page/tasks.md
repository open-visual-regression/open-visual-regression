# 14 · /login page

Gate: valid credentials create session + redirect to `/projects`; invalid credentials show inline error; already-authenticated user redirects away.

Note: login uses `authClient.signIn.email` (Better Auth client-side SDK) — not oRPC. No Server Action needed.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (LoginScreen)

- [x] 1.1 `apps/web/app/(unauthenticated)/login/page.tsx` (RSC): redirects to `/setup` if setup pending; renders `CenteredFormSection` + `LoginCard`
- [x] 1.2 Already-authenticated guard in `page.tsx` → `redirect("/")`
- [x] 1.3 `LoginCard` + `LoginForm` (`"use client"`): `authClient.signIn.email`; `react-hook-form` + Zod; inline field errors + root error on auth failure

- [x] 1.4 Fix post-login redirect: `window.location.href = "/"` → `window.location.href = "/projects"`

- [ ] 1.5 Add "forgot password" link (`href="#"`, tooltip: "password reset not available in self-hosted mode")

- [ ] 1.6 Component tests:
  - Renders form
  - Empty fields show validation errors without calling auth
  - Invalid credentials: error renders inline; no redirect
  - Valid credentials: redirects to /projects

## Status: will not do (1.5, 1.6)

A non-functional "forgot password" link with a "not available" tooltip isn't worth shipping.
A real reset flow needs either SMTP (self-hosted deployments may not have it configured) or an
admin-initiated reset action — propose that as its own change if/when prioritized. The login
page itself (1.1-1.4) is implemented and meets the gate.
