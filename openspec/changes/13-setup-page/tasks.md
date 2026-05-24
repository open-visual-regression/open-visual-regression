# 13 · /setup page

Gate: cold start with zero users loads `/setup`; submitting valid form creates org + admin + session; cookie `ovr_setup_complete` is set; subsequent visit with cookie cleared still redirects to `/login` (DB fallback).

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (SetupScreen)

- [ ] 1.1 Create `apps/web/app/(public)/setup/page.tsx` (RSC):
  - Query user count via `db` — if `count > 0` → `redirect("/login")` (handles cleared-cookie case)
  - Fields: org name · admin email · password · confirm password
  - Layout matches SetupScreen: OvrMark centered top, card with form, version string footer
  - Submit button: primary variant, full width, "create account"

- [ ] 1.2 Create `apps/web/app/(public)/setup/actions.ts`:
  - `createAdminAccount(formData)` Server Action
  - Validate with Zod: all required; password ≥ 8 chars; passwords match
  - `auth.api.signUpEmail({ email, password, name })` → creates first user
  - `auth.api.createOrganization({ name: orgName })` → creates org
  - Set cookie: `cookies().set("ovr_setup_complete", "1", { httpOnly: true, sameSite: "strict", path: "/" })`
  - `redirect("/projects")`
  - On validation error: return `{ error: string }` — render inline, no exception thrown

- [ ] 1.3 Component tests:
  - Renders form when `userCount = 0`
  - Server-side: `userCount > 0` causes redirect to /login (test via mock)
  - Password mismatch: inline error, no form submission
  - Successful submission: action called; cookie set; redirects to /projects
