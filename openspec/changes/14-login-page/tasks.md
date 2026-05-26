# 14 · /login page

Gate: valid credentials create session + redirect to `/projects`; invalid credentials show inline error; already-authenticated user redirects away.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (LoginScreen)

- [ ] 1.1 Create `apps/web/app/(unauthenticated)/login/page.tsx` (RSC):
  - If already authenticated → `redirect("/projects")`
  - Fields: email, password
  - "forgot password" link — renders but links to `#` with tooltip "password reset not available in self-hosted mode"
  - Layout matches LoginScreen: OvrMark + wordmark top; centered card; footer with version
- [ ] 1.2 Create `apps/web/app/(unauthenticated)/login/actions.ts`:
  - `signIn(formData)` Server Action
  - Validate: email + password non-empty
  - Call `auth.api.signInEmail`; on success set session + `redirect("/projects")`
  - On auth failure: return `{ error: "invalid email or password" }`
- [ ] 1.3 Component tests:
  - Renders form
  - Empty fields show validation errors without calling action
  - Invalid credentials: action returns error; error renders inline; no redirect
  - Valid credentials: redirects to /projects
