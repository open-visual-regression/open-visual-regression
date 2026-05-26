# 13 · /setup page

Gate: cold start with zero users loads `/setup`; submitting valid form creates org + admin + session; cookie `ovr_setup_complete` is set; subsequent visit with cookie cleared still redirects to `/login` (DB fallback).

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-auth.jsx` (SetupScreen)

- [x] 1.1 Create `apps/web/app/(unauthenticated)/setup/page.tsx` (RSC):
  - Query user count via oRPC — if `count > 0` → `redirect("/login")`
  - Fields: org name · admin name · admin email · password · confirm password
  - Layout matches SetupScreen: LogoFull centered top, card with multi-step form, version string footer
  - Multi-step: step 1 = org name, step 2 = admin account

- [x] 1.2 Create `apps/web/app/(unauthenticated)/setup/_components/setup-card/actions.ts`:
  - `createAdminAccount(values)` Server Action
  - Validate with Zod: all required; password ≥ 12 chars; passwords match
  - Delegates to `createAdminAndOrg` service in `apps/web/lib/services/setup.ts`
  - Set cookie: `ovr_setup_complete=1` (httpOnly, sameSite strict)
  - `redirect("/projects")`
  - On validation/service error: return `{ error: string }`

- [x] 1.3 Component tests
