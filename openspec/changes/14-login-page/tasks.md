# 14 · /login page

Gate: valid credentials create session + redirect to `/projects`; invalid credentials show inline error; already-authenticated user redirects away.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (LoginScreen)

- [x] 1.1 Create `apps/web/app/(unauthenticated)/login/page.tsx` (RSC): redirects to `/setup` if setup not complete; renders `CenteredFormSection` + `LoginCard`

- [ ] 1.2 Add already-authenticated guard to `page.tsx` → `redirect("/projects")`

- [x] 1.3 Create `LoginCard` + `LoginForm` (`"use client"`) in `apps/web/app/(unauthenticated)/login/_components/login-card/`:
  - Client-side auth via `authClient.signIn.email` (not a Server Action)
  - Zod validation with `react-hook-form`
  - Inline field errors + root error on auth failure
  - `window.location.href = "/"` on success (see 1.4)

- [ ] 1.4 Fix post-login redirect: `window.location.href = "/"` → `window.location.href = "/projects"`

- [ ] 1.5 Add "forgot password" link (`href="#"`, tooltip: "password reset not available in self-hosted mode")

- [ ] 1.6 Component tests:
  - Renders form
  - Empty fields show validation errors without calling auth
  - Invalid credentials: auth returns error; error renders inline; no redirect
  - Valid credentials: redirects to /projects
